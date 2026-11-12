const { extractSearchConcepts, evaluateCandidates } = require('./ai-handler');
const { loadQuranCSV } = require('./csv-loader');

async function processQuery(query) {
    const dataset = loadQuranCSV();
    
    // Step 1: NLU expansion using AI to handle any language
    const concepts = await extractSearchConcepts(query);

    const allKeywords = [
        ...(concepts.keywords_en || []).map(k => k.toLowerCase()),
        ...(concepts.keywords_ar || [])
    ];

    if (allKeywords.length === 0) {
        return { summary: "", verse_ids: [] };
    }

    // Step 2: Broad keyword filtering locally to save tokens
    const scoredCandidates = dataset.map(row => {
        let score = 0;
        const enText = (row.ayah_en || "").toLowerCase();
        const arText = row.ayah_ar || "";
        
        for (const kw of allKeywords) {
            if (enText.includes(kw) || arText.includes(kw)) score++;
        }
        return { row, score };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 100); // Filter top 100 candidates to pass to AI (Token efficient)

    if (scoredCandidates.length === 0) {
         return { summary: "", verse_ids: [] };
    }

    // Step 3: Send candidates (IDs + English translation only) to AI for semantic selection
    const candidateJson = JSON.stringify(scoredCandidates.map(c => ({
        id: c.row.ayah_no_quran,
        text_en: c.row.ayah_en
    })));

    // AI identifies the truly relevant records based on semantic context
    const evaluation = await evaluateCandidates(query, candidateJson);
    return evaluation;
}

module.exports = { processQuery };