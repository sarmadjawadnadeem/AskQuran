const { extractSearchConcepts, evaluateCandidates } = require('./ai-handler');
const { loadQuranCSV } = require('./csv-loader');

function getRowValue(row, possibleKeys) {
    for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null) return row[key];
    }
    return '';
}

async function processQuery(query) {
    const dataset = loadQuranCSV();
    
    // 1. AI NLU concept expansion
    const concepts = await extractSearchConcepts(query);

    const allKeywords = [
        ...(concepts.keywords_en || []).map(k => k.toLowerCase()),
        ...(concepts.keywords_ar || [])
    ];

    if (allKeywords.length === 0) {
        return { summary: "", verse_ids: [] };
    }

    // 2. Local keyword filtering supporting multiple CSV naming conventions
    const scoredCandidates = dataset.map((row, index) => {
        let score = 0;
        
        // Flexible fallback keys for different CSV dataset formats
        const enText = String(getRowValue(row, ['ayah_en', 'translation', 'english', 'text_en'])).toLowerCase();
        const arText = String(getRowValue(row, ['ayah_ar', 'arabic', 'text_ar', 'arabic_text']));
        const surahEn = String(getRowValue(row, ['surah_name_en', 'surah_en', 'surah_name'])).toLowerCase();
        
        for (const kw of allKeywords) {
            if (enText.includes(kw) || arText.includes(kw) || surahEn.includes(kw)) {
                score++;
            }
        }
        
        // Assign a unique sequential fallback ID if 'ayah_no_quran' doesn't exist in CSV
        const quranId = getRowValue(row, ['ayah_no_quran', 'id', 'global_ayah_no']) || index + 1;
        
        return { row, score, quranId };
    }).filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);

    if (scoredCandidates.length === 0) {
         return { summary: "", verse_ids: [] };
    }

    // 3. Send candidates to AI for semantic selection
    const candidateJson = JSON.stringify(scoredCandidates.map(c => ({
        id: c.quranId,
        text_en: String(getRowValue(c.row, ['ayah_en', 'translation', 'english', 'text_en']))
    })));

    const evaluation = await evaluateCandidates(query, candidateJson);
    return evaluation;
}

async function getSelectedRows(verseIds) {
    const dataset = loadQuranCSV();
    return dataset.filter((row, index) => {
        const quranId = String(getRowValue(row, ['ayah_no_quran', 'id', 'global_ayah_no']) || index + 1);
        return verseIds.map(String).includes(quranId);
    });
}

module.exports = { processQuery, getSelectedRows };