const { loadQuranCSV } = require('./csv-loader');

function buildResponse(evaluation) {
    // Missing Information and Refusal Protocol exactly as requested
    const REFUSAL_TEXT = "There is nothing related to this subject in the Quran found by me.";
    
    if (!evaluation.verse_ids || evaluation.verse_ids.length === 0) {
        return REFUSAL_TEXT;
    }

    const dataset = loadQuranCSV();
    
    // Strict verification: Map AI selected IDs exactly to local dataset rows
    const selectedRows = dataset.filter(row =>
        evaluation.verse_ids.includes(row.ayah_no_quran) ||
        evaluation.verse_ids.includes(String(row.ayah_no_quran)) ||
        evaluation.verse_ids.includes(Number(row.ayah_no_quran))
    );

    if (selectedRows.length === 0) {
        return REFUSAL_TEXT;
    }

    let response = "";
    
    // Prefix the AI generated summary (which is constrained strictly to the verses)
    if (evaluation.summary) {
        response += `${evaluation.summary}\n\n`;
    }

    // Strictly construct the verse presentation directly from the CSV
    selectedRows.forEach(row => {
        response += `### ${row.surah_name_en} — Ayah ${row.ayah_no_surah}\n\n`;
        response += `<div class="arabic-verse" dir="rtl">${row.ayah_ar}</div>\n\n`;
        response += `> ${row.ayah_en}\n\n`;
        
        // Exact citation format required by prompt
        response += `*[Surah ${row.surah_name_ar} (${row.surah_name_en}, ${row.surah_no}), Ayah ${row.ayah_no_surah}]*\n\n`;
        response += `---\n\n`;
    });

    return response.trim();
}

module.exports = { buildResponse };