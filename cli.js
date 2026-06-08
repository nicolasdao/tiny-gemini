#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { writeFile, readFile, mkdir, access } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform, homedir } from 'node:os';
import { exec } from 'node:child_process';

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────

const VERSION = '2.0.1';
const NAME = 'tiny-gemini';

const MODELS = {
	text: 'gemini-3-flash-preview',
	image: 'gemini-3.1-flash-image',
	tts: 'gemini-3.1-flash-tts-preview',
	research: 'deep-research-preview-04-2026',
};

// Opt into the new Interactions API schema (steps/step.delta/etc.).
// New schema becomes default 2026-05-26; legacy removed 2026-06-08.
const API_REVISION = '2026-05-20';

// Background-task statuses that mean "stop polling, it won't complete".
// `requires_action` is handled separately (it needs a tool result we can't give).
const TERMINAL_FAILURE_STATES = new Set(['failed', 'cancelled', 'incomplete', 'budget_exceeded', 'expired']);

// Models with announced shutdown dates. Each maps to its GA replacement and the
// date the API stops serving it. After that date, the CLI refuses the model.
// Dates differ per model (the 2.5 text family sunsets 2026-10-16, the preview
// image models 2026-06-25), so each entry carries its own date.
const SUNSET_MODELS = {
	'gemini-2.5-pro': { replacement: 'gemini-3.1-pro-preview', shutdown: '2026-10-16' },
	'gemini-2.5-flash': { replacement: 'gemini-3.5-flash', shutdown: '2026-10-16' },
	'gemini-2.5-flash-lite': { replacement: 'gemini-3.1-flash-lite', shutdown: '2026-10-16' },
	'gemini-3.1-flash-image-preview': { replacement: 'gemini-3.1-flash-image', shutdown: '2026-06-25' },
	'gemini-3-pro-image-preview': { replacement: 'gemini-3-pro-image', shutdown: '2026-06-25' },
	'gemini-2.5-flash-image': { replacement: 'gemini-3.1-flash-image', shutdown: '2026-10-02' },
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODELS_JSON_PATH = join(__dirname, 'models.json');

const COMMANDS = ['prompt', 'image', 'tts', 'search', 'research', 'raw', 'models'];
const IMAGE_SUBS = ['generate', 'edit', 'describe', 'story', 'icon', 'pattern', 'diagram'];
const MODELS_SUBS = ['list', 'pricing'];

const VARIATIONS = {
	lighting: ['dramatic lighting', 'soft lighting'],
	angle: ['from above', 'close-up view'],
	'color-palette': ['warm color palette', 'cool color palette'],
	composition: ['centered composition', 'rule of thirds composition'],
	mood: ['cheerful mood', 'dramatic mood'],
	season: ['in spring', 'in winter'],
	'time-of-day': ['at sunrise', 'at sunset'],
};

// ────────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────────

const log = (...a) => process.stderr.write(a.join(' ') + '\n');
const die = (msg) => { log(`Error: ${msg}`); process.exit(1); };

function readSecret(prompt) {
	return new Promise((resolve) => {
		process.stderr.write(prompt);
		process.stdin.setRawMode(true);
		process.stdin.resume();
		process.stdin.setEncoding('utf8');
		let input = '';
		const onData = (chunk) => {
			for (const char of chunk) {
				if (char === '\r' || char === '\n') {
					process.stdin.setRawMode(false);
					process.stdin.pause();
					process.stdin.removeListener('data', onData);
					process.stderr.write('\n');
					resolve(input);
					return;
				} else if (char === '\u0003') { // Ctrl+C
					process.stderr.write('\n');
					process.exit(0);
				} else if (char === '\u007F' || char === '\b') { // Backspace
					if (input.length > 0) {
						input = input.slice(0, -1);
						process.stderr.write('\b \b');
					}
				} else if (char >= ' ') { // Printable characters only
					input += char;
					process.stderr.write('*');
				}
			}
		};
		process.stdin.on('data', onData);
	});
}

async function exists(p) {
	try { await access(p); return true; } catch { return false; }
}

function tryJSON(s) {
	try { return JSON.parse(s); } catch { return null; }
}

class APIError extends Error {
	constructor(status, body) {
		const parsed = tryJSON(body);
		const msg = parsed?.error?.message || (typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body));
		super(`API error ${status}: ${msg}`);
		this.status = status;
	}
}

function checkSunset(model) {
	const entry = SUNSET_MODELS[model];
	if (!entry) return;
	const { replacement, shutdown } = entry;
	if (new Date() >= new Date(shutdown + 'T00:00:00Z')) {
		die(`${model} was shut down on ${shutdown}. Use ${replacement} instead. See https://ai.google.dev/gemini-api/docs/deprecations`);
	}
	log(`Warning: ${model} is deprecated and will be removed on ${shutdown}. Use ${replacement} instead.`);
}

// ────────────────────────────────────────────────────────────────────
// .env Loader (matches Gemini CLI convention: .gemini/.env)
// ────────────────────────────────────────────────────────────────────

function parseEnvFile(content) {
	const vars = {};
	for (const line of content.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		let val = trimmed.slice(eq + 1).trim();
		// Strip surrounding quotes
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}
		vars[key] = val;
	}
	return vars;
}

let _dotenvCache = null;

async function loadDotenv() {
	if (_dotenvCache !== null) return _dotenvCache;
	_dotenvCache = {};

	// Search up from cwd for .gemini/.env, then fall back to ~/.gemini/.env
	const paths = [];
	let dir = process.cwd();
	const root = join(dir, '..') === dir ? dir : undefined;
	while (true) {
		paths.push(join(dir, '.gemini', '.env'));
		const parent = join(dir, '..');
		if (parent === dir) break;
		dir = parent;
	}
	paths.push(join(homedir(), '.gemini', '.env'));

	for (const p of paths) {
		if (await exists(p)) {
			try {
				_dotenvCache = parseEnvFile(await readFile(p, 'utf-8'));
				return _dotenvCache;
			} catch { /* skip unreadable files */ }
		}
	}
	return _dotenvCache;
}

function env(key) {
	return process.env[key] || _dotenvCache[key] || '';
}

// ────────────────────────────────────────────────────────────────────
// Config
// ────────────────────────────────────────────────────────────────────

function resolveConfig(values) {
	return {
		apiKey: values['api-key']
			|| env('TINY_GEMINI_API_KEY')
			|| env('GEMINI_API_KEY')
			|| env('GOOGLE_API_KEY'),
		apiBase: (values['api-base']
			|| env('TINY_GEMINI_API_BASE')
			|| 'https://generativelanguage.googleapis.com/v1beta'
		).replace(/\/+$/, ''),
		model: values.model || env('TINY_GEMINI_MODEL'),
		outputDir: values['output-dir'] || './tiny-gemini-output',
		outputFile: values['output-file'] || null,
		outputFormat: values['output-format'] || null,
		stream: !!values.stream,
		preview: !!values.preview,
		jsonOutput: !!values['json-output'],
	};
}

// ────────────────────────────────────────────────────────────────────
// Help
// ────────────────────────────────────────────────────────────────────

const HELP_MAIN = `
${NAME} v${VERSION} — Zero-dependency CLI for the Google Gemini API

USAGE
  ${NAME} [command] [args] [options]

COMMANDS
  prompt [text]       Text generation (default — command name optional)
  image [sub] [args]  Image generation, editing, and understanding
  tts [text]          Text-to-speech (saves .wav file)
  search [query]      Google Search-grounded generation
  research [topic]    Deep Research agent (background task)
  raw [json]          Raw JSON passthrough to Interactions API
  models [sub]        List available Gemini models and pricing

IMAGE SUB-COMMANDS
  generate [prompt]        Generate image(s) from text (default)
  edit <file> [prompt]     Edit an existing image
  describe <file> [prompt] Describe/analyze an image (uses text model)
  story [prompt]           Generate a story sequence
  icon [prompt]            Generate an icon (prompt-engineered)
  pattern [prompt]         Generate a pattern (prompt-engineered)
  diagram [prompt]         Generate a diagram (prompt-engineered)

GLOBAL OPTIONS
  --api-key <key>      API key (or GEMINI_API_KEY / GOOGLE_API_KEY env var,
                       or .gemini/.env file in project or ~/.gemini/.env)
  --api-base <url>     API base URL
  --model <model>      Override model
  --output-dir <dir>   Output directory (default: ./tiny-gemini-output)
  --prompt-file <path> Read file contents into prompt (repeatable)
  --output-file <path> Write response to file instead of stdout
  --output-format <f>  Output format: plain or manifest (default: auto)
  --stream             Enable streaming output
  --preview            Open generated files after saving
  --json-output        Print raw JSON response
  -h, --help           Show help
  -v, --version        Show version

EXAMPLES
  ${NAME} "What is quantum computing?"
  ${NAME} "Describe this" --file photo.png
  ${NAME} image "a cat on the moon"
  ${NAME} image edit photo.png "add sunglasses"
  ${NAME} tts "Hello world" --voice=kore
  ${NAME} search "latest news on AI"
  ${NAME} research "history of quantum computing"
`.trim();

const HELP_PROMPT = `
${NAME} prompt — Text generation

USAGE
  ${NAME} [prompt] "text" [options]

OPTIONS
  --file <path>           Attach a file (image, audio, video, PDF)
  --prompt-file <path>    Read file contents into prompt (repeatable)
  --output-file <path>    Write response to file instead of stdout
  --output-format <fmt>   Output format: plain or manifest (default: auto)
  --system <text>         System instruction
  --schema <json>         JSON schema for structured output (string or file path)
  --stream                Stream the response
  --model <model>         Model (default: ${MODELS.text})

EXAMPLES
  ${NAME} "What is quantum computing?"
  ${NAME} "Describe this" --file photo.png
  ${NAME} "Summarize" --file doc.pdf
  ${NAME} "Tell me a joke" --stream
  ${NAME} "Fix bugs" --prompt-file src/app.js --output-file result.json
  ${NAME} --prompt-file code.js --system "Explain this code"
  ${NAME} "Review" --prompt-file a.js --prompt-file b.js --output-file out.txt
`.trim();

const HELP_IMAGE = `
${NAME} image — Image generation, editing, and understanding

USAGE
  ${NAME} image [sub-command] [args] [options]

SUB-COMMANDS
  generate [prompt]        Generate image(s) (default)
  edit <file> [prompt]     Edit an existing image
  describe <file> [prompt] Describe/analyze an image
  story [prompt]           Multi-step story sequence
  icon [prompt]            App icon generation
  pattern [prompt]         Pattern/texture generation
  diagram [prompt]         Technical diagram generation

OPTIONS
  --count <n>          Number of images to generate
  --styles <list>      Comma-separated styles (e.g., watercolor,sketch)
  --variations <list>  Comma-separated variations (lighting,angle,mood,...)
  --steps <n>          Number of story steps (default: 4)
  --style <style>      Style for icon/pattern/diagram presets
  --type <type>        Type for pattern/diagram presets
  --aspect-ratio <r>   Aspect ratio (e.g., 16:9, 1:1)
  --image-size <s>     Image size: 512, 1K, 2K, 4K (uppercase K required)
  --model <model>      Model (default: ${MODELS.image})

EXAMPLES
  ${NAME} image "a banana wearing sunglasses"
  ${NAME} image generate "a cat" --count=3 --styles=watercolor,sketch
  ${NAME} image edit photo.png "add a hat"
  ${NAME} image describe photo.png
  ${NAME} image story "a seed growing" --steps=4
  ${NAME} image icon "coffee cup" --style=modern
  ${NAME} image pattern "geometric" --type=seamless
  ${NAME} image diagram "login flow" --type=flowchart
`.trim();

const HELP_TTS = `
${NAME} tts — Text-to-speech

USAGE
  ${NAME} tts "text" [options]

OPTIONS
  --voice <voice>      Voice name, title-case e.g. Kore, Zephyr (default: Kore)
  --language <lang>    Language code (default: en-us)
  --model <model>      Model (default: ${MODELS.tts})

EXAMPLES
  ${NAME} tts "Hello, how are you today?"
  ${NAME} tts "Bonjour" --voice=kore --language=fr-fr
`.trim();

const HELP_SEARCH = `
${NAME} search — Google Search-grounded generation

USAGE
  ${NAME} search "query" [options]

OPTIONS
  --output-file <path>    Write response to file instead of stdout
  --output-format <fmt>   Output format: plain or manifest (default: auto)
  --stream                Stream the response
  --model <model>         Model (default: ${MODELS.text})

EXAMPLES
  ${NAME} search "Who won the 2026 Super Bowl?"
  ${NAME} search "latest React release" --stream
  ${NAME} search "AI news" --output-file results.txt
`.trim();

const HELP_RESEARCH = `
${NAME} research — Deep Research agent

USAGE
  ${NAME} research "topic" [options]

OPTIONS
  --model <model>      Agent (default: ${MODELS.research})

EXAMPLES
  ${NAME} research "History of Google TPUs focusing on 2025-2026"
`.trim();

const HELP_RAW = `
${NAME} raw — Raw JSON passthrough

USAGE
  ${NAME} raw '{"model":"...","input":"..."}'
  echo '{"json":"..."}' | ${NAME} raw
  ${NAME} raw --file request.json

OPTIONS
  --file <path>        Read JSON body from file

EXAMPLES
  ${NAME} raw '{"model":"gemini-3-flash-preview","input":"hello"}'
  ${NAME} raw --file request.json
`.trim();

const HELP_MODELS = `
${NAME} models — List available Gemini models and pricing

USAGE
  ${NAME} models                  Same as: models list
  ${NAME} models list             Human-readable model table
  ${NAME} models pricing          Pricing-only table
  ${NAME} models list --json      Machine-readable JSON
  ${NAME} models list --type=text Filter by type (text|image|audio|embeddings|agent)
  ${NAME} models list --status=ga Filter by status (ga|preview|deprecated)

DATA SOURCE
  Embedded snapshot of https://ai.google.dev/gemini-api/docs/models
  and /pricing and /deprecations. Refreshed each release.

EXAMPLES
  ${NAME} models
  ${NAME} models list --type=image
  ${NAME} models list --status=deprecated
  ${NAME} models pricing --json
`.trim();

const HELP_MAP = {
	prompt: HELP_PROMPT, image: HELP_IMAGE, tts: HELP_TTS,
	search: HELP_SEARCH, research: HELP_RESEARCH, raw: HELP_RAW,
	models: HELP_MODELS,
};

function showHelp(command) {
	console.log(command && HELP_MAP[command] ? HELP_MAP[command] : HELP_MAIN);
}

// ────────────────────────────────────────────────────────────────────
// API Client
// ────────────────────────────────────────────────────────────────────

function apiHeaders(config) {
	return {
		'Content-Type': 'application/json',
		'x-goog-api-key': config.apiKey,
		'Api-Revision': API_REVISION,
	};
}

async function callAPI(config, body) {
	const res = await fetch(`${config.apiBase}/interactions`, {
		method: 'POST',
		headers: apiHeaders(config),
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new APIError(res.status, await res.text());
	return res.json();
}

async function callAPIStream(config, body, outputFile, outputFormat) {
	const res = await fetch(`${config.apiBase}/interactions?alt=sse`, {
		method: 'POST',
		headers: apiHeaders(config),
		body: JSON.stringify({ ...body, stream: true }),
	});
	if (!res.ok) throw new APIError(res.status, await res.text());

	const reader = res.body.getReader();
	const decoder = new TextDecoder();
	let buf = '';
	let wrote = false;
	const chunks = outputFile ? [] : null;

	// Accept both legacy (content.delta) and new (step.delta) event names so the
	// CLI works during the May 7–June 8 transition window without rev pinning.
	const DELTA_EVENTS = new Set(['content.delta', 'step.delta']);

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buf += decoder.decode(value, { stream: true });

		const parts = buf.split('\n');
		buf = parts.pop();

		let eventType = null;
		for (const line of parts) {
			if (line.startsWith('event: ')) {
				eventType = line.slice(7).trim();
			} else if (line.startsWith('data: ')) {
				if (DELTA_EVENTS.has(eventType)) {
					const d = tryJSON(line.slice(6));
					if (d?.delta?.type === 'text') {
						if (chunks) {
							chunks.push(d.delta.text);
						} else {
							process.stdout.write(d.delta.text);
						}
						wrote = true;
					}
				}
			} else if (line === '') {
				eventType = null;
			}
		}
	}

	if (outputFile && chunks) {
		const fullText = chunks.join('');
		const out = { text: [fullText], images: [], audio: [], functions: [] };
		const useManifest = shouldUseManifest(out, outputFormat);
		if (useManifest) {
			const summary = await writeManifest(outputFile, config.outputDir, out, config);
			console.log(summary);
		} else {
			await writeOutputFile(outputFile, fullText);
			console.log(`Response written to ${outputFile}`);
		}
	} else if (wrote) {
		process.stdout.write('\n');
	}
}

// Reads from the new `steps` array if present, falling back to the legacy
// `outputs` array. Each item may carry content directly (legacy shape) or
// nested in a `content` array (new shape).
function extractOutputs(response) {
	const r = { text: [], images: [], audio: [], functions: [] };
	const items = response?.steps || response?.outputs || [];
	for (const item of items) {
		if (item.type === 'function_call') {
			r.functions.push(item);
			continue;
		}
		if (item.type === 'text' && typeof item.text === 'string') {
			r.text.push(item.text);
			continue;
		}
		if (item.type === 'image' && item.data) {
			r.images.push({ data: item.data, mime: item.mime_type });
			continue;
		}
		if (item.type === 'audio' && item.data) {
			r.audio.push({ data: item.data, mime: item.mime_type });
			continue;
		}
		if (Array.isArray(item.content)) {
			for (const part of item.content) {
				if (part.type === 'text') r.text.push(part.text);
				else if (part.type === 'image') r.images.push({ data: part.data, mime: part.mime_type });
				else if (part.type === 'audio') r.audio.push({ data: part.data, mime: part.mime_type });
				else if (part.type === 'function_call') r.functions.push(part);
			}
		}
	}
	return r;
}

async function pollCompletion(config, id) {
	while (true) {
		const res = await fetch(`${config.apiBase}/interactions/${id}`, {
			headers: { 'x-goog-api-key': config.apiKey, 'Api-Revision': API_REVISION },
		});
		if (!res.ok) throw new APIError(res.status, await res.text());
		const data = await res.json();
		log(`Status: ${data.status}`);
		if (data.status === 'completed') return data;
		if (data.status === 'requires_action') {
			die('Research stopped: requires_action (waiting for a tool result). tiny-gemini cannot satisfy this in the research flow — use the raw command for interactive tool loops.');
		}
		// Terminal non-success states — stop polling instead of looping forever.
		if (TERMINAL_FAILURE_STATES.has(data.status)) {
			const detail = data.error?.message ? `: ${data.error.message}` : '';
			die(`Research ${data.status}${detail}`);
		}
		await new Promise(r => setTimeout(r, 5000));
	}
}

// ────────────────────────────────────────────────────────────────────
// File Handling
// ────────────────────────────────────────────────────────────────────

async function ensureDir(dir) {
	if (!(await exists(dir))) await mkdir(dir, { recursive: true });
}

function sanitize(name) {
	return name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
}

async function uniquePath(dir, base, ext) {
	let p = join(dir, `${base}${ext}`);
	let i = 1;
	while (await exists(p)) { p = join(dir, `${base}_${i++}${ext}`); }
	return p;
}

const MIME_EXT = {
	'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif',
	'audio/wav': '.wav', 'audio/pcm': '.wav', 'audio/mpeg': '.mp3',
	'application/pdf': '.pdf',
};

const EXT_MIME = {
	'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
	'.gif': 'image/gif', '.pdf': 'application/pdf', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
	'.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
};

function mimeToExt(mime) { return MIME_EXT[mime] || '.bin'; }
function extToMime(path) { return EXT_MIME[extname(path).toLowerCase()] || 'application/octet-stream'; }

function inputType(mime) {
	if (mime.startsWith('image/')) return 'image';
	if (mime.startsWith('audio/')) return 'audio';
	if (mime.startsWith('video/')) return 'video';
	if (mime === 'application/pdf') return 'document';
	return 'file';
}

function createWav(pcm, rate = 24000, ch = 1, bits = 16) {
	const h = Buffer.alloc(44);
	const sz = pcm.length;
	h.write('RIFF', 0);
	h.writeUInt32LE(36 + sz, 4);
	h.write('WAVE', 8);
	h.write('fmt ', 12);
	h.writeUInt32LE(16, 16);
	h.writeUInt16LE(1, 20);
	h.writeUInt16LE(ch, 22);
	h.writeUInt32LE(rate, 24);
	h.writeUInt32LE(rate * ch * bits / 8, 28);
	h.writeUInt16LE(ch * bits / 8, 32);
	h.writeUInt16LE(bits, 34);
	h.write('data', 36);
	h.writeUInt32LE(sz, 40);
	return Buffer.concat([h, pcm]);
}

async function saveOutput(dir, hint, data, mime, config) {
	await ensureDir(dir);
	let buf = Buffer.from(data, 'base64');
	// Gemini TTS returns raw headerless PCM (24kHz/16-bit/mono). The label varies
	// ("audio/pcm", "audio/l16", "audio/L16;rate=24000"), so match any of them and
	// wrap as WAV, then force a .wav extension regardless of the exact label.
	let extMime = mime;
	if (/^audio\/(pcm|l16)/i.test(mime || '')) {
		buf = createWav(buf);
		extMime = 'audio/wav';
	}
	const path = await uniquePath(dir, sanitize(hint), mimeToExt(extMime));
	await writeFile(path, buf);
	log(`Saved: ${path}`);
	if (config.preview) openFile(path);
	return path;
}

function openFile(p) {
	const cmd = platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open';
	exec(`${cmd} "${p}"`);
}

async function readBase64(path) {
	return (await readFile(path)).toString('base64');
}

async function readPromptFiles(paths) {
	const parts = [];
	for (const p of paths) {
		if (!(await exists(p))) die(`Prompt file not found: ${p}`);
		const content = await readFile(p, 'utf-8');
		parts.push(`--- FILE: ${p} ---\n${content}\n--- END FILE: ${p} ---`);
	}
	return parts.join('\n\n');
}

async function writeOutputFile(filePath, text) {
	await ensureDir(dirname(filePath));
	await writeFile(filePath, text, 'utf-8');
}

function shouldUseManifest(outputs, format) {
	if (format === 'manifest') return true;
	if (format === 'plain') return false;
	if (outputs.functions.length) return true;
	if (outputs.text.some(t => t.length > 4000)) return true;
	return false;
}

async function writeManifest(outputFile, outputDir, outputs, config) {
	await ensureDir(outputDir);
	const manifest = { outputs: [], function_calls: [], images: [], audio: [] };
	let totalLines = 0;

	for (let i = 0; i < outputs.text.length; i++) {
		const text = outputs.text[i];
		const filePath = join(outputDir, `text_${i + 1}.txt`);
		await writeFile(filePath, text, 'utf-8');
		const lines = text.split('\n').length;
		totalLines += lines;
		manifest.outputs.push({
			type: 'text',
			preview: text.slice(0, 200),
			file: filePath,
			bytes: Buffer.byteLength(text, 'utf-8'),
			lines,
		});
	}

	for (const f of outputs.functions) {
		manifest.function_calls.push({
			name: f.name,
			id: f.id || null,
			arguments: f.arguments || f.args || {},
		});
	}

	for (let i = 0; i < outputs.images.length; i++) {
		const img = outputs.images[i];
		const saved = await saveOutput(outputDir, `prompt_${i + 1}`, img.data, img.mime, config);
		manifest.images.push({ file: saved });
	}

	for (let i = 0; i < outputs.audio.length; i++) {
		const aud = outputs.audio[i];
		const saved = await saveOutput(outputDir, `prompt_audio_${i + 1}`, aud.data, aud.mime, config);
		manifest.audio.push({ file: saved });
	}

	await writeOutputFile(outputFile, JSON.stringify(manifest, null, 2));
	const parts = [];
	if (outputs.text.length) parts.push(`${outputs.text.length} text block${outputs.text.length > 1 ? 's' : ''}, ${totalLines} lines`);
	if (outputs.functions.length) parts.push(`${outputs.functions.length} function call${outputs.functions.length > 1 ? 's' : ''}`);
	if (outputs.images.length) parts.push(`${outputs.images.length} image${outputs.images.length > 1 ? 's' : ''}`);
	if (outputs.audio.length) parts.push(`${outputs.audio.length} audio file${outputs.audio.length > 1 ? 's' : ''}`);
	return `Manifest written to ${outputFile} (${parts.join(', ')})`;
}

// ────────────────────────────────────────────────────────────────────
// Prompt Builders
// ────────────────────────────────────────────────────────────────────

function buildIconPrompt(prompt, v = {}) {
	const type = v.type || 'app-icon';
	const style = v.style || 'modern';
	const bg = v.background || 'transparent';
	const corners = v.corners || 'rounded';
	let p = `${prompt}, ${style} style ${type}`;
	if (type === 'app-icon') p += `, ${corners} corners`;
	if (bg !== 'transparent') p += `, ${bg} background`;
	return p + ', clean design, high quality, professional';
}

function buildPatternPrompt(prompt, v = {}) {
	const type = v.type || 'seamless';
	const style = v.style || 'abstract';
	const density = v.density || 'medium';
	const colors = v.colors || 'colorful';
	let p = `${prompt}, ${style} style ${type} pattern, ${density} density, ${colors} colors`;
	if (type === 'seamless') p += ', tileable, repeating pattern';
	return p + ', high quality';
}

function buildDiagramPrompt(prompt, v = {}) {
	const type = v.type || 'flowchart';
	const style = v.style || 'professional';
	const layout = v.layout || 'hierarchical';
	const complexity = v.complexity || 'detailed';
	const colors = v.colors || 'accent';
	const annotations = v.annotations || 'detailed';
	let p = `${prompt}, ${type} diagram, ${style} style, ${layout} layout`;
	p += `, ${complexity} level of detail, ${colors} color scheme, ${annotations} annotations and labels`;
	return p + ', clean technical illustration, clear visual hierarchy';
}

function buildStoryPrompts(prompt, steps = 4, v = {}) {
	const type = v.type || 'story';
	const style = v.style || 'consistent';
	const transition = v.transition || 'smooth';
	const out = [];
	for (let i = 0; i < steps; i++) {
		let p = `${prompt}, step ${i + 1} of ${steps}`;
		if (type === 'story') p += `, narrative sequence, ${style} art style`;
		else if (type === 'process') p += ', procedural step, instructional illustration';
		else if (type === 'tutorial') p += ', tutorial step, educational diagram';
		else if (type === 'timeline') p += ', chronological progression, timeline visualization';
		if (i > 0) p += `, ${transition} transition from previous step`;
		out.push(p);
	}
	return out;
}

function buildBatchPrompts(prompt, v = {}) {
	const prompts = [];
	if (v.styles?.length) {
		for (const s of v.styles) prompts.push(`${prompt}, ${s} style`);
	}
	if (v.variations?.length) {
		const bases = prompts.length ? [...prompts] : [prompt];
		prompts.length = 0;
		for (const b of bases) {
			for (const k of v.variations) {
				if (VARIATIONS[k]) for (const suffix of VARIATIONS[k]) prompts.push(`${b}, ${suffix}`);
			}
		}
	}
	if (!prompts.length && v.count > 1) {
		for (let i = 0; i < v.count; i++) prompts.push(prompt);
	}
	if (v.count && prompts.length > v.count) prompts.length = v.count;
	return prompts.length ? prompts : [prompt];
}

// ────────────────────────────────────────────────────────────────────
// Stdin Reader
// ────────────────────────────────────────────────────────────────────

async function readStdin() {
	if (process.stdin.isTTY) return null;
	const chunks = [];
	for await (const chunk of process.stdin) chunks.push(chunk);
	return Buffer.concat(chunks).toString('utf-8').trim();
}

// ────────────────────────────────────────────────────────────────────
// Command Handlers
// ────────────────────────────────────────────────────────────────────

async function handlePrompt(prompt, values, config) {
	const promptFiles = values['prompt-file'];
	if (!prompt && !promptFiles?.length) die('No prompt provided. Usage: tiny-gemini "your prompt"');
	const model = config.model || MODELS.text;
	checkSunset(model);
	const body = { model };

	// Build text prompt from user text + prompt files
	let textPrompt = prompt || '';
	if (promptFiles?.length) {
		const fileContent = await readPromptFiles(promptFiles);
		textPrompt = textPrompt ? `${textPrompt}\n\n${fileContent}` : fileContent;
	}

	if (values.file) {
		if (!(await exists(values.file))) die(`File not found: ${values.file}`);
		const b64 = await readBase64(values.file);
		const mime = extToMime(values.file);
		body.input = [
			{ type: 'text', text: textPrompt },
			{ type: inputType(mime), data: b64, mime_type: mime },
		];
	} else {
		body.input = textPrompt;
	}

	if (values.system) body.system_instruction = values.system;

	if (values.schema) {
		let schema = tryJSON(values.schema);
		if (!schema && await exists(values.schema)) {
			schema = tryJSON(await readFile(values.schema, 'utf-8'));
		}
		if (!schema) die('Invalid --schema: must be a JSON string or path to a JSON file');
		body.response_format = { type: 'text', mime_type: 'application/json', schema };
	}

	if (config.jsonOutput) {
		console.log(JSON.stringify(await callAPI(config, body), null, 2));
		return;
	}

	if (config.stream) {
		await callAPIStream(config, body, config.outputFile, config.outputFormat);
		return;
	}

	const response = await callAPI(config, body);
	const out = extractOutputs(response);

	if (config.outputFile) {
		const useManifest = shouldUseManifest(out, config.outputFormat);
		if (useManifest) {
			const summary = await writeManifest(config.outputFile, config.outputDir, out, config);
			console.log(summary);
		} else {
			const text = out.text.join('\n');
			await writeOutputFile(config.outputFile, text);
			console.log(`Response written to ${config.outputFile}`);
			// Still save images/audio to output dir
			for (let i = 0; i < out.images.length; i++) {
				await saveOutput(config.outputDir, `prompt_${i + 1}`, out.images[i].data, out.images[i].mime, config);
			}
			for (let i = 0; i < out.audio.length; i++) {
				await saveOutput(config.outputDir, `prompt_audio_${i + 1}`, out.audio[i].data, out.audio[i].mime, config);
			}
		}
	} else {
		for (const t of out.text) console.log(t);
		for (let i = 0; i < out.images.length; i++) {
			await saveOutput(config.outputDir, `prompt_${i + 1}`, out.images[i].data, out.images[i].mime, config);
		}
		for (let i = 0; i < out.audio.length; i++) {
			await saveOutput(config.outputDir, `prompt_audio_${i + 1}`, out.audio[i].data, out.audio[i].mime, config);
		}
		for (const f of out.functions) console.log(JSON.stringify(f, null, 2));
	}
}

async function handleImage(args, values, config) {
	let sub = 'generate';
	const rest = [...args];
	if (rest.length && IMAGE_SUBS.includes(rest[0])) sub = rest.shift();

	const model = config.model || (sub === 'describe' ? MODELS.text : MODELS.image);
	checkSunset(model);
	const imgConfig = { ...config, model };

	// New schema (May 2026): aspect_ratio + image_size live inside response_format
	// with type:"image", not under generation_config.image_config.
	const imageResponseFormat = { type: 'image' };
	if (values['aspect-ratio']) imageResponseFormat.aspect_ratio = values['aspect-ratio'];
	// The API requires an uppercase K suffix (e.g. "2K"); normalize a lowercase
	// "2k" so a user following older help text doesn't get a 400.
	if (values['image-size']) imageResponseFormat.image_size = values['image-size'].replace(/k$/i, 'K');
	const hasImageConfig = values['aspect-ratio'] || values['image-size'];

	switch (sub) {
		case 'generate': {
			const prompt = rest.join(' ');
			if (!prompt) die('No prompt. Usage: tiny-gemini image "your prompt"');
			const count = values.count ? parseInt(values.count) : 0;
			const styles = values.styles ? values.styles.split(',').map(s => s.trim()) : null;
			const variations = values.variations ? values.variations.split(',').map(s => s.trim()) : null;
			const prompts = buildBatchPrompts(prompt, { count, styles, variations });

			for (let i = 0; i < prompts.length; i++) {
				log(`Generating image ${i + 1}/${prompts.length}...`);
				const body = { model, input: prompts[i], response_modalities: ['image'] };
				if (hasImageConfig) body.response_format = imageResponseFormat;

				if (config.jsonOutput) {
					console.log(JSON.stringify(await callAPI(imgConfig, body), null, 2));
				} else {
					const resp = await callAPI(imgConfig, body);
					const out = extractOutputs(resp);
					for (const img of out.images) {
						await saveOutput(config.outputDir, `image_${i + 1}`, img.data, img.mime, config);
					}
					for (const t of out.text) console.log(t);
				}
			}
			break;
		}

		case 'edit': {
			const file = rest.shift();
			if (!file) die('No file. Usage: tiny-gemini image edit <file> "prompt"');
			if (!(await exists(file))) die(`File not found: ${file}`);
			const prompt = rest.join(' ') || 'Edit this image';
			const b64 = await readBase64(file);
			const mime = extToMime(file);
			const body = {
				model,
				input: [
					{ type: 'text', text: prompt },
					{ type: 'image', data: b64, mime_type: mime },
				],
				response_modalities: ['image'],
			};
			if (hasImageConfig) body.response_format = imageResponseFormat;

			log('Editing image...');
			if (config.jsonOutput) {
				console.log(JSON.stringify(await callAPI(imgConfig, body), null, 2));
			} else {
				const resp = await callAPI(imgConfig, body);
				const out = extractOutputs(resp);
				for (const img of out.images) {
					await saveOutput(config.outputDir, 'edited', img.data, img.mime, config);
				}
				for (const t of out.text) console.log(t);
			}
			break;
		}

		case 'describe': {
			const file = rest.shift();
			if (!file) die('No file. Usage: tiny-gemini image describe <file> [prompt]');
			if (!(await exists(file))) die(`File not found: ${file}`);
			const prompt = rest.join(' ') || 'Describe this image in detail';
			const b64 = await readBase64(file);
			const mime = extToMime(file);
			const body = {
				model,
				input: [
					{ type: 'text', text: prompt },
					{ type: inputType(mime), data: b64, mime_type: mime },
				],
			};

			if (config.jsonOutput) {
				console.log(JSON.stringify(await callAPI(imgConfig, body), null, 2));
			} else if (config.stream) {
				await callAPIStream(imgConfig, body);
			} else {
				const resp = await callAPI(imgConfig, body);
				const out = extractOutputs(resp);
				for (const t of out.text) console.log(t);
			}
			break;
		}

		case 'story': {
			const prompt = rest.join(' ');
			if (!prompt) die('No prompt. Usage: tiny-gemini image story "your prompt"');
			const steps = values.steps ? parseInt(values.steps) : 4;
			const prompts = buildStoryPrompts(prompt, steps, values);

			for (let i = 0; i < prompts.length; i++) {
				log(`Generating step ${i + 1}/${prompts.length}...`);
				const body = { model, input: prompts[i], response_modalities: ['image'] };
				if (hasImageConfig) body.response_format = imageResponseFormat;
				const resp = await callAPI(imgConfig, body);
				const out = extractOutputs(resp);
				for (const img of out.images) {
					await saveOutput(config.outputDir, `story_step_${i + 1}`, img.data, img.mime, config);
				}
			}
			break;
		}

		case 'icon': {
			const prompt = rest.join(' ') || 'app icon';
			const engineered = buildIconPrompt(prompt, values);
			log('Generating icon...');
			const body = { model, input: engineered, response_modalities: ['image'] };
			if (hasImageConfig) body.response_format = imageResponseFormat;
			const resp = await callAPI(imgConfig, body);
			const out = extractOutputs(resp);
			for (const img of out.images) {
				await saveOutput(config.outputDir, 'icon', img.data, img.mime, config);
			}
			break;
		}

		case 'pattern': {
			const prompt = rest.join(' ') || 'abstract pattern';
			const engineered = buildPatternPrompt(prompt, values);
			log('Generating pattern...');
			const body = { model, input: engineered, response_modalities: ['image'] };
			if (hasImageConfig) body.response_format = imageResponseFormat;
			const resp = await callAPI(imgConfig, body);
			const out = extractOutputs(resp);
			for (const img of out.images) {
				await saveOutput(config.outputDir, 'pattern', img.data, img.mime, config);
			}
			break;
		}

		case 'diagram': {
			const prompt = rest.join(' ') || 'system diagram';
			const engineered = buildDiagramPrompt(prompt, values);
			log('Generating diagram...');
			const body = { model, input: engineered, response_modalities: ['image'] };
			if (hasImageConfig) body.response_format = imageResponseFormat;
			const resp = await callAPI(imgConfig, body);
			const out = extractOutputs(resp);
			for (const img of out.images) {
				await saveOutput(config.outputDir, 'diagram', img.data, img.mime, config);
			}
			break;
		}
	}
}

async function handleTTS(text, values, config) {
	if (!text) die('No text. Usage: tiny-gemini tts "your text"');
	const model = config.model || MODELS.tts;
	checkSunset(model);
	// Documented voice names are title-case (e.g. "Kore", "Zephyr"); capitalize
	// the first letter so a lowercase value like the old default still matches.
	const rawVoice = values.voice || 'Kore';
	const voice = rawVoice.charAt(0).toUpperCase() + rawVoice.slice(1);
	const language = values.language || 'en-us';

	const body = {
		model,
		input: text,
		response_modalities: ['audio'],
		generation_config: {
			// The new Interactions schema requires speech_config to be an array,
			// even for a single speaker (was an object pre-2026-05).
			speech_config: [{ language, voice }],
		},
	};

	log('Generating speech...');
	if (config.jsonOutput) {
		console.log(JSON.stringify(await callAPI(config, body), null, 2));
		return;
	}

	const response = await callAPI(config, body);
	const out = extractOutputs(response);
	for (let i = 0; i < out.audio.length; i++) {
		await saveOutput(config.outputDir, `tts_${sanitize(text.slice(0, 30))}`, out.audio[i].data, out.audio[i].mime, config);
	}
	if (!out.audio.length) {
		for (const t of out.text) console.log(t);
		if (!out.text.length) log('No audio output received.');
	}
}

async function handleSearch(query, values, config) {
	if (!query) die('No query. Usage: tiny-gemini search "your query"');
	const model = config.model || MODELS.text;
	checkSunset(model);
	const body = {
		model,
		input: query,
		tools: [{ type: 'google_search' }],
	};

	if (config.jsonOutput) {
		console.log(JSON.stringify(await callAPI(config, body), null, 2));
		return;
	}
	if (config.stream) {
		await callAPIStream(config, body, config.outputFile, config.outputFormat);
		return;
	}

	const response = await callAPI(config, body);
	const out = extractOutputs(response);

	if (config.outputFile) {
		const useManifest = shouldUseManifest(out, config.outputFormat);
		if (useManifest) {
			const summary = await writeManifest(config.outputFile, config.outputDir, out, config);
			console.log(summary);
		} else {
			const text = out.text.join('\n');
			await writeOutputFile(config.outputFile, text);
			console.log(`Response written to ${config.outputFile}`);
		}
	} else {
		for (const t of out.text) console.log(t);
	}
}

async function handleResearch(topic, values, config) {
	if (!topic) die('No topic. Usage: tiny-gemini research "your topic"');
	const agent = config.model || MODELS.research;
	checkSunset(agent);
	const body = { agent, input: topic, background: true };

	log('Starting deep research...');
	const initial = await callAPI(config, body);
	const id = initial.id;
	log(`Interaction ID: ${id}`);
	log('Polling for completion...');

	const result = await pollCompletion(config, id);

	if (config.jsonOutput) {
		console.log(JSON.stringify(result, null, 2));
		return;
	}

	const out = extractOutputs(result);
	for (const t of out.text) console.log(t);
}

async function handleRaw(jsonStr, values, config) {
	let body;

	if (jsonStr) {
		body = tryJSON(jsonStr);
		if (!body) die('Invalid JSON argument');
	} else if (values.file) {
		if (!(await exists(values.file))) die(`File not found: ${values.file}`);
		const content = await readFile(values.file, 'utf-8');
		body = tryJSON(content);
		if (!body) die(`Invalid JSON in file: ${values.file}`);
	} else {
		const stdin = await readStdin();
		if (stdin) {
			body = tryJSON(stdin);
			if (!body) die('Invalid JSON from stdin');
		}
	}

	if (!body) die('No JSON body. Usage: tiny-gemini raw \'{"model":"...","input":"..."}\'');
	const response = await callAPI(config, body);
	console.log(JSON.stringify(response, null, 2));
}

// ────────────────────────────────────────────────────────────────────
// Models registry — reads embedded models.json snapshot
// ────────────────────────────────────────────────────────────────────

async function loadModelsRegistry() {
	if (!(await exists(MODELS_JSON_PATH))) {
		die(`models.json not found at ${MODELS_JSON_PATH}. Reinstall tiny-gemini.`);
	}
	const data = tryJSON(await readFile(MODELS_JSON_PATH, 'utf-8'));
	if (!data?.models) die('models.json is malformed');
	return data;
}

function formatPriceRange(low, high) {
	if (low == null) return '—';
	if (high == null) return low.toFixed(2);
	return `${low.toFixed(2)}–${high.toFixed(2)}`;
}

function rowsToTable(headers, rows) {
	const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length)));
	const fmt = (cells) => cells.map((c, i) => String(c ?? '').padEnd(widths[i])).join('  ').trimEnd();
	const sep = widths.map(w => '─'.repeat(w)).join('  ');
	return [fmt(headers), sep, ...rows.map(fmt)].join('\n');
}

function applyModelFilters(models, type, status) {
	let out = models;
	if (type) out = out.filter(m => m.type === type);
	if (status) out = out.filter(m => m.status === status);
	return out;
}

async function handleModels(args, values) {
	const sub = args[0] && MODELS_SUBS.includes(args[0]) ? args[0] : 'list';
	const { snapshot_date, source, models } = await loadModelsRegistry();
	const filtered = applyModelFilters(models, values.type, values.status);

	if (values['json-output'] || values.json) {
		console.log(JSON.stringify(filtered, null, 2));
		return;
	}

	if (sub === 'pricing') {
		const rows = filtered.map(m => {
			const p = m.pricing || {};
			const input = formatPriceRange(p.input_per_1m, p.input_per_1m_over_200k);
			const output = formatPriceRange(p.output_per_1m, p.output_per_1m_over_200k);
			return [m.id, input, output, p.notes || ''];
		});
		console.log(rowsToTable(['ID', 'IN $/1M', 'OUT $/1M', 'NOTES'], rows));
		log(`\nSnapshot: ${snapshot_date} — ${source}`);
		return;
	}

	const rows = filtered.map(m => {
		const p = m.pricing || {};
		const input = formatPriceRange(p.input_per_1m, p.input_per_1m_over_200k);
		const output = formatPriceRange(p.output_per_1m, p.output_per_1m_over_200k);
		const fate = m.shutdown_on
			? `shutdown ${m.shutdown_on} → ${m.replacement || '?'}`
			: m.replacement
				? `→ ${m.replacement}`
				: '';
		return [m.id, m.type, m.status, input, output, m.free_tier ? 'yes' : 'no', fate];
	});
	console.log(rowsToTable(['ID', 'TYPE', 'STATUS', 'IN $/1M', 'OUT $/1M', 'FREE', 'NOTES'], rows));
	log(`\nSnapshot: ${snapshot_date} — ${source}`);
}

// ────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────

async function main() {
	const { values, positionals } = parseArgs({
		args: process.argv.slice(2),
		options: {
			'api-key': { type: 'string' },
			'api-base': { type: 'string' },
			model: { type: 'string' },
			'output-dir': { type: 'string' },
			stream: { type: 'boolean' },
			preview: { type: 'boolean' },
			'json-output': { type: 'boolean' },
			'prompt-file': { type: 'string', multiple: true },
			'output-file': { type: 'string' },
			'output-format': { type: 'string' },
			file: { type: 'string' },
			system: { type: 'string' },
			schema: { type: 'string' },
			voice: { type: 'string' },
			language: { type: 'string' },
			count: { type: 'string' },
			styles: { type: 'string' },
			variations: { type: 'string' },
			steps: { type: 'string' },
			style: { type: 'string' },
			type: { type: 'string' },
			background: { type: 'string' },
			corners: { type: 'string' },
			density: { type: 'string' },
			colors: { type: 'string' },
			layout: { type: 'string' },
			complexity: { type: 'string' },
			annotations: { type: 'string' },
			transition: { type: 'string' },
			'aspect-ratio': { type: 'string' },
			'image-size': { type: 'string' },
			status: { type: 'string' },
			json: { type: 'boolean' },
			help: { type: 'boolean', short: 'h' },
			version: { type: 'boolean', short: 'v' },
		},
		allowPositionals: true,
		strict: false,
	});

	if (values.version) {
		console.log(`${NAME} v${VERSION}`);
		return;
	}

	let command = null;
	const args = [...positionals];
	if (args.length && COMMANDS.includes(args[0])) {
		command = args.shift();
	}

	if (values.help) {
		showHelp(command);
		return;
	}

	if (!command) command = 'prompt';

	// No args at all → show help
	if (!args.length && command === 'prompt' && !values.file && !values['prompt-file']?.length) {
		showHelp();
		return;
	}

	// `models` is offline — runs before API-key resolution.
	if (command === 'models') {
		await handleModels(args, values);
		return;
	}

	await loadDotenv();
	const config = resolveConfig(values);

	if (!config.apiKey) {
		const isTTY = process.stdin.isTTY && process.stderr.isTTY;

		if (isTTY) {
			log('');
			log('No API key found. You need a free Google Gemini API key.');
			log('');
			log('  1. Go to https://aistudio.google.com/app/apikey');
			log('  2. Click "Create API key" and copy it.');
			log('');
			const key = await readSecret('  Paste it below to save it, or press Enter to skip: ');
			if (key.trim()) {
				const geminiDir = join(homedir(), '.gemini');
				const envPath = join(geminiDir, '.env');
				await mkdir(geminiDir, { recursive: true });
				let existing = '';
				try { existing = await readFile(envPath, 'utf8'); } catch {}
				const line = `GEMINI_API_KEY=${key.trim()}`;
				if (existing) {
					// Replace existing GEMINI_API_KEY line, or append
					if (/^GEMINI_API_KEY=.*/m.test(existing)) {
						existing = existing.replace(/^GEMINI_API_KEY=.*/m, line);
						await writeFile(envPath, existing);
					} else {
						const sep = existing.endsWith('\n') ? '' : '\n';
						await writeFile(envPath, existing + sep + line + '\n');
					}
				} else {
					await writeFile(envPath, line + '\n');
				}
				log('');
				log(`  Saved to ~/.gemini/.env`);
				log('');
				config.apiKey = key.trim();
			} else {
				log('');
				log('  No key entered. Set it up manually:');
				log('');
				log('     export GEMINI_API_KEY="your-key-here"');
				log('     # Or: mkdir -p ~/.gemini && echo \'GEMINI_API_KEY=your-key-here\' > ~/.gemini/.env');
				log('');
				process.exit(1);
			}
		} else {
			log('');
			log('Error: No API key found.');
			log('Get a free key at https://aistudio.google.com/app/apikey then:');
			log('');
			log('  export GEMINI_API_KEY="your-key-here"');
			log('  # Or: npx tiny-gemini --api-key=your-key-here "Hello"');
			log('');
			process.exit(1);
		}
	}

	switch (command) {
		case 'prompt': await handlePrompt(args.join(' '), values, config); break;
		case 'image': await handleImage(args, values, config); break;
		case 'tts': await handleTTS(args.join(' '), values, config); break;
		case 'search': await handleSearch(args.join(' '), values, config); break;
		case 'research': await handleResearch(args.join(' '), values, config); break;
		case 'raw': await handleRaw(args.join(' '), values, config); break;
	}
}

main().catch(e => {
	log(e.message || String(e));
	process.exit(1);
});
