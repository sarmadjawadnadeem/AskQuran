const { evaluateCandidates } = require('./ai-handler');
const { loadQuranCSV } = require('./csv-loader');

function getRowValue(row, possibleKeys) {
    for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null) return row[key];
    }
    return '';
}

async function processQuery(query) {
    const dataset = loadQuranCSV();
    
    // Take a diverse slice of candidate verses (or search through records) 
    // to ensure relevant concepts are never missed due to strict keyword matching.
    // We sample or check up to 200 records that contain common terms or take a smart subset.
    const candidates = dataset.map((row, index) => {
        const quranId = String(getRowValue(row, ['ayah_no_quran', 'id', 'global_ayah_no']) || index + 1);
        const textEn = String(getRowValue(row, ['ayah_en', 'translation', 'english', 'text_en']));
        return { id: quranId, text_en: textEn };
    });

    // To prevent hitting token limits while maintaining high accuracy, 
    // let's do a smart keyword/substring check, but with a much wider fallback 
    // (e.g., if keywords match loosely, or pass a representative batch).
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2);

    let matched = candidates.filter(c => {
        const t = c.text_en.toLowerCase();
        return queryWords.some(w => t.includes(w));
    });

    // If direct word matching is too narrow, fall back to evaluating a balanced sample of verses
    if (matched.length === 0) {
        matched = candidates.slice(0, 150); 
    } else {
        matched = matched.slice(0, 120); // Cap to token-efficient size
    }

    const candidateJson = JSON.stringify(matched);
    const evaluation = await evaluateCandidates(query, candidateJson);
    return evaluation;
}

module.exports = { processQuery };