import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { callKimi, extractJsonFromOutput } from './kimiCli.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let researchProfile = null;

async function loadResearchProfile() {
    if (researchProfile) return researchProfile;
    try {
        const data = await fs.readFile(path.join(__dirname, '../www/_data/research_profile.json'), 'utf8');
        researchProfile = JSON.parse(data);
        return researchProfile;
    } catch (err) {
        console.warn('Could not load research_profile.json, rating will be skipped.', err.message);
        return null;
    }
}

function buildPrompt(call, profile) {
    return `You are an expert academic advisor. Evaluate how well this special issue fits the researcher's profile.

RESEARCHER PROFILE:
- Domain: ${profile.domain}
- Focus: ${profile.focus}
- Methodology: ${profile.methodology}
- Description: ${profile.description}

RATING SCALE:
- 🟢🟢🟢 = Highly relevant: directly involves healthcare + digital/AI + paradox/management, and welcomes qualitative research
- 🟢🟢 = Moderately relevant: involves healthcare + digital/AI, OR involves paradox/management + journal is qualitative-friendly
- 🟢 = Low relevance: involves healthcare or AI/digital, but requires strong reframing
- 🟡 = Potentially relevant: requires creative reframing, journal may accept; explain reframing strategy
- 🔴 = Not relevant: too far from healthcare AI paradox, or journal methodology mismatch (e.g., pure mathematical modeling)

RULES:
1. Every entry MUST have a rating.
2. Analysis MUST include BOTH 适配原因 (why it fits) AND 不适配原因 (why it doesn't fit or what challenges exist).
3. Write analysis in Chinese.
4. Return ONLY a valid JSON object with exactly these keys: {"topic_fits": "...", "analysis": "..."}
5. NO markdown, NO extra text.

JOURNAL: ${call.journal || 'N/A'}
TITLE: ${call.title || call.metaTitle || 'N/A'}
TOPICS: ${(call.topics || []).join('\n')}
DESCRIPTION: ${(call.description && call.description.paragraphs ? call.description.paragraphs.join('\n\n') : call.rawContent || 'N/A')}
`;
}

export async function rate(call) {
    const profile = await loadResearchProfile();
    if (!profile) return call;
    if (!call.title && !call.metaTitle && !call.description) return call;

    const prompt = buildPrompt(call, profile);

    try {
        const output = await callKimi(prompt, 300000);
        const rating = extractJsonFromOutput(output, false);

        if (rating && typeof rating === 'object' && rating.topic_fits) {
            call.topic_fits = rating.topic_fits;
            call.analysis = rating.analysis || '';
        } else {
            console.warn(`Could not parse rating for ${call.slug || call.metaTitle}. Setting default.`);
            call.topic_fits = '🟡';
            call.analysis = '【待手动评级】';
        }
    } catch (err) {
        console.warn(`Rating failed for ${call.slug || call.metaTitle}:`, err.message);
        call.topic_fits = '🟡';
        call.analysis = '【待手动评级】';
    }

    return call;
}
