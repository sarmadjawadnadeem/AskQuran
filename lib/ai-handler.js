const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

const genAI = new GoogleGenerativeAI(config.AI_API_KEY);
const model = genAI.getGenerativeModel({
    model: config.AI_MODEL,
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1 // Highly deterministic output
    }
});

async function extractSearchConcepts(query) {
    const prompt = `You are a strict, objective NLU component for a Quranic data-retrieval engine.
User Query: """${query}"""

Understand the core intent, regardless of the input language.
Provide highly probable exact keywords or short phrases in English and Arabic that would appear in a literal Quranic translation / original Arabic text relating to this query. Include important synonyms to cast a wide net.
DO NOT invent knowledge.

Return ONLY JSON format:
{
  "keywords_en": ["keyword1", "phrase2", "synonym3"],
  "keywords_ar": ["كلمة1", "عبارة2"]
}`;

    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (err) {
        console.error("AI Concept Extraction Error:", err);
        return { keywords_en: [], keywords_ar: [] };
    }
}

async function evaluateCandidates(query, candidatesText) {
    const prompt = `You are a strict, objective relevancy evaluator for a Quranic data-retrieval engine.
User Query: """${query}"""

Candidate Verses provided from local CSV dataset (JSON array):
${candidatesText}

Task:
1. Identify which candidate verses directly address the user query or represent supported partial answers.
2. Write a brief, objective summary (max 3 sentences) answering the query using ONLY the verified verses. Explain textual relationships only if directly supported.
3. ABSOLUTE RULE: DO NOT use external knowledge, Hadith, Tafsir, or scholarly rulings. Refuse to answer questions outside the CSV context.
4. If NO verses are relevant to the intent, you MUST return an empty array for verse_ids and an empty summary.

Return ONLY JSON format:
{
  "summary": "Objective summary derived strictly from the verses...",
  "verse_ids": ["ayah_no_quran_1", "ayah_no_quran_2"]
}`;

    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (err) {
        console.error("AI Evaluation Error:", err);
        return { summary: "", verse_ids: [] };
    }
}

module.exports = { extractSearchConcepts, evaluateCandidates };