const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config');

const genAI = new GoogleGenerativeAI(config.AI_API_KEY);
const model = genAI.getGenerativeModel({
    model: config.AI_MODEL,
    generationConfig: {
        temperature: 0.1
    }
});

async function extractSearchConcepts(query) {
    try {
        const prompt = `Extract core search keywords (English) from this query: "${query}". Return valid JSON only: {"keywords_en": ["kw1", "kw2"]}`;
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (err) {
        console.error("AI Concept Error:", err);
        return { keywords_en: query.split(" ") };
    }
}

async function generateAiSummary(query, versesText) {
    try {
        const prompt = `User query: "${query}"\n\nVerified Verses:\n${versesText}\n\nProvide a brief, objective summary (max 2 sentences) answering the query using ONLY these verses. Return plain text.`;
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (err) {
        return "";
    }
}

module.exports = { extractSearchConcepts, generateAiSummary };