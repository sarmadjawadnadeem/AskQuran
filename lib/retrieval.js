const { extractSearchConcepts, generateAiSummary } = require('./ai-handler');
const { loadQuranCSV } = require('./csv-loader');

function getRowValue(row, possibleKeys) {
    for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null) return row[key];
    }
    return '';
}

async function processQuery(query) {
    const dataset = loadQuranCSV();
    
    // 1. Extract keywords from AI or query words
    const concepts = await extractSearchConcepts(query);
    const keywords = [
        ...(concepts.keywords_en || []),
        ...query.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/)
    ].filter(w => w && w.length > 2);

    // 2. Score and find matching verses locally in the dataset
    const matchedRows = [];
    
    for (const row of dataset) {
        const enText = String(getRowValue(row, ['ayah_en', 'translation', 'english', 'text_en'])).toLowerCase();
        const arText = String(getRowValue(row, ['ayah_ar', 'arabic', 'text_ar']));
        
        let matches = 0;
        for (const kw of keywords) {
            if (enText.includes(kw.toLowerCase()) || arText.includes(kw)) {
                matches++;
            }
        }
        
        if (matches > 0) {
            matchedRows.push({ row, matches });
        }
    }

    // Sort by match count descending and take top matching verses
    matchedRows.sort((a, b) => b.matches - a.matches);
    const topRows = matchedRows.slice(0, 8).map(m => m.row);

    // 3. Absolute fallback for common terms if exact keyword missed
    if (topRows.length === 0) {
        const queryLower = query.toLowerCase();
        let fallbackKeyword = "";
        if (queryLower.includes('patience') || queryLower.includes('patient')) fallbackKeyword = 'patient';
        else if (queryLower.includes('prayer') || queryLower.includes('salat')) fallbackKeyword = 'prayer';
        else if (queryLower.includes('forgive') || queryLower.includes('mercy')) fallbackKeyword = 'mercy';
        else if (queryLower.includes('charity') || queryLower.includes('zakat')) fallbackKeyword = 'give';
        else if (queryLower.includes('heaven') || queryLower.includes('earth')) fallbackKeyword = 'heavens';

        if (fallbackKeyword) {
            for (const row of dataset) {
                const enText = String(getRowValue(row, ['ayah_en', 'translation', 'english', 'text_en'])).toLowerCase();
                if (enText.includes(fallbackKeyword)) {
                    topRows.push(row);
                    if (topRows.length >= 6) break;
                }
            }
        }
    }

    if (topRows.length === 0) {
        return { summary: "", selectedRows: [] };
    }

    // 4. Generate AI summary from verified local rows
    const versesSummaryInput = topRows.map(r => getRowValue(r, ['ayah_en', 'translation', 'english', 'text_en'])).join("\n");
    const summary = await generateAiSummary(query, versesSummaryInput);

    return { summary, selectedRows: topRows };
}

module.exports = { processQuery };