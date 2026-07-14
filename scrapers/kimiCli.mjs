import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KIMI_BIN = process.env.KIMI_BIN || '/Users/lantan/.local/bin/kimi';

export async function callKimi(prompt, timeoutMs = 300000) {
    return new Promise((resolve, reject) => {
        const args = ['--print', '--yolo', '--prompt', prompt];
        console.log(`🚀 Calling Kimi CLI: ${KIMI_BIN} ${args.join(' ').substring(0, 120)}...`);

        const child = spawn(KIMI_BIN, args, {
            env: { ...process.env },
        });

        let stdout = '';
        let stderr = '';
        let killed = false;

        const timer = setTimeout(() => {
            killed = true;
            child.kill('SIGTERM');
            reject(new Error(`Kimi CLI timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        child.stdout.on('data', (data) => {
            stdout += data.toString('utf8');
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString('utf8');
        });

        child.on('close', (code) => {
            clearTimeout(timer);
            if (killed) return;
            if (code !== 0) {
                console.warn(`Kimi CLI exited with code ${code}. stderr: ${stderr.slice(0, 500)}`);
            }
            resolve(stdout);
        });

        child.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

export function extractJsonFromOutput(output, expectList = true) {
    if (!output) return null;

    function tryLoad(text) {
        if (!text || !text.trim()) return null;
        const cleaned = cleanJsonText(text);
        const candidates = [text, cleaned, fixJsonMultilineStrings(text), fixJsonMultilineStrings(cleaned)];
        for (const cand of candidates) {
            try {
                const data = JSON.parse(cand);
                if (Array.isArray(data)) return data;
                if (!expectList) return data;
            } catch (e) {
                // continue
            }
        }
        return null;
    }

    // Strategy 1: Extract from TextPart(type='text', text='...')
    for (const pattern of [
        /TextPart\(\s*type='text',\s*text='(.*?)'\s*\)/,
        /TextPart\(\s*type="text",\s*text="(.*?)"\s*\)/,
    ]) {
        for (const m of output.matchAll(new RegExp(pattern, 'gs'))) {
            const raw = m[1];
            let decoded;
            try {
                decoded = raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\\\/g, '\\');
            } catch (e) {
                decoded = raw;
            }
            const data = tryLoad(decoded);
            if (data) return data;

            for (const innerPattern of [/\[[\s\S]*\]/, /\{[\s\S]*\}/]) {
                const matches = [...decoded.matchAll(new RegExp(innerPattern, 'g'))];
                for (const subM of matches.sort((a, b) => b[0].length - a[0].length)) {
                    const subData = tryLoad(subM[0]);
                    if (subData) return subData;
                }
            }
        }
    }

    // Strategy 2: Try whole output
    const data = tryLoad(output);
    if (data) return data;

    // Strategy 3: Find largest JSON block
    for (const pattern of [/\[[\s\S]*\]/, /\{[\s\S]*\}/]) {
        const matches = [...output.matchAll(new RegExp(pattern, 'g'))];
        for (const m of matches.sort((a, b) => b[0].length - a[0].length)) {
            const subData = tryLoad(m[0]);
            if (subData) return subData;
        }
    }

    return null;
}

function cleanJsonText(text) {
    text = text.replace(/```(?:json)?\s*/g, '');
    text = text.replace(/```\s*$/g, '');
    text = text.trim();
    text = text.replace(/,(\s*[\]\}])/g, '$1');
    text = text.replace(/(?<=[{\[,\s])'([^']+)'(?=\s*:)/g, '"$1"');
    text = text.replace(/(?<=:\s)'([^']+)'(?=\s*[}\],])/g, '"$1"');
    return text;
}

function fixJsonMultilineStrings(text) {
    const result = [];
    let inString = false;
    let escapeNext = false;
    for (const ch of text) {
        if (escapeNext) {
            result.push(ch);
            escapeNext = false;
            continue;
        }
        if (ch === '\\') {
            result.push(ch);
            escapeNext = true;
            continue;
        }
        if (ch === '"') {
            inString = !inString;
            result.push(ch);
            continue;
        }
        if (inString && '\n\r\x0b\x0c'.includes(ch)) {
            result.push(' ');
            continue;
        }
        result.push(ch);
    }
    return result.join('');
}
