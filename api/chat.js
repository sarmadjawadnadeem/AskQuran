const { processQuery } = require('../lib/retrieval');
const { buildResponse } = require('../lib/response-builder');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Message is required.' });
        }

        // 1. Process query (Keyword + Semantic AI identification)
        const evaluation = await processQuery(message);

        // 2. Build explicit formatting using locally verified CSV records
        const textResponse = buildResponse(evaluation);

        return res.status(200).json({ response: textResponse });
    } catch (error) {
        console.error("Chat API Error:", error);
        return res.status(500).json({ error: 'An internal error occurred while retrieving Quranic data.' });
    }
}