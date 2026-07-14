import * as chrono from 'chrono-node';
import { callKimi, extractJsonFromOutput } from './kimiCli.mjs';

const Academic = {
    name: "string (no titles like Dr. or Prof.)",
    affiliation: "string (university/organization only, nullable)"
};

const DateSchema = {
    date: "string (the submission timeline event date)",
    description: "string (description of the event, nullable)",
    is_full_paper_submission_deadline: "boolean (true if this is the full paper submission deadline)"
};

const CallSchema = {
    title: "string (actual title only, no 'Call for Papers' or journal name)",
    topics: "array of strings (bullet point topics or example research questions)",
    description: { paragraphs: "array of strings (main content paragraphs only)" },
    tags: "array of strings (as few tags as possible, lowercase)",
    editors: "array of " + JSON.stringify(Academic),
    associate_editors: "array of " + JSON.stringify(Academic),
    dates: "array of " + JSON.stringify(DateSchema)
};

function buildPrompt(rawContent) {
    return `You are an expert parser of calls for papers for special issues of academic journals. You do NOT make up any information. You only copy information from the call directly.

Parse the following call for papers and return a single valid JSON object matching this schema:

${JSON.stringify(CallSchema, null, 2)}

Rules:
1. Return ONLY the JSON object, no markdown, no explanation before or after.
2. Do NOT include headings as paragraphs.
3. Do NOT include formatting/submission instructions.
4. Topics are usually in bullet point format.
5. If there is no paragraph structure, organize the text into meaningful paragraphs.

Call for papers content:
${rawContent}
`;
}

async function parseFuzzyDate(fuzzyDate) {
    return chrono.parseDate(fuzzyDate);
}

export async function parse(call) {
    if (!call.rawContent || call.rawContent.length == 0) {
        delete call.rawContent;
        call.tags = [];
        return call;
    }

    const prompt = buildPrompt(call.rawContent);
    const output = await callKimi(prompt, 300000);
    const parsed = extractJsonFromOutput(output, false);

    if (!parsed) {
        console.warn(`Could not parse LLM output for ${call.slug || call.metaTitle}. Output length: ${output.length}`);
        call.tags = [];
        delete call.rawContent;
        return call;
    }

    call = { ...call, ...parsed };
    delete call.rawContent;

    if (call.dates && Array.isArray(call.dates)) {
        call.dates = await Promise.all(call.dates.map(async date => {
            date.date = await parseFuzzyDate(date.date);
            return date;
        }));
        call.dates.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    if (call.tags && Array.isArray(call.tags)) {
        call.tags = call.tags.map(tag => tag.toLowerCase());
    }

    return call;
}
