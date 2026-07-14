import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: 'https://api.kimi.com/coding/',
    apiKey: process.env.KIMI_CODE_API_KEY,
});

export async function callKimi(prompt, timeoutMs = 120000) {
    console.log(`🚀 Calling Kimi Code API...`);
    
    const response = await client.chat.completions.create({
        model: 'kimi-for-coding',
        messages: [
            { 
                role: 'system', 
                content: 'You are an expert parser of calls for papers for special issues of academic journals. You do NOT make up any information. You only copy information from the call directly.' 
            },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
    });
    
    return response.choices[0].message.content;
}

export function extractJsonFromOutput(output, expectList = true) {
    if (!output) return null;
    
    try {
        const data = JSON.parse(output);
        if (Array.isArray(data)) return data;
        if (!expectList) return data;
        return [data];
    } catch (e) {
        console.warn('JSON parse failed, trying fallback...');
        const jsonMatch = output.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e2) {
                console.warn('Fallback parse also failed');
            }
        }
        return null;
    }
}
