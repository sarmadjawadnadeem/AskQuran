const { loadQuranCSV } = require('./csv-loader');

function getRowValue(row, possibleKeys) {
    for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null) return row[key];
    }
    return '';
}

function buildResponse(evaluation) {
    const REFUSAL_TEXT = "There is nothing related to this subject in the Quran found by me.";
    
    if (!evaluation.verse_ids || evaluation.verse_ids.length === 0) {
        return REFUSAL_TEXT;
    }

    const dataset = loadQuranCSV();
    
    // Map selected IDs back to dataset rows using flexible keys
    const selectedRows = dataset.filter((row, index) => {
        const quranId = String(getRowValue(row, ['ayah_no_quran', 'id', 'global_ayah_no']) || index + 1);
        return evaluation.verse_ids.map(String).includes(quranId);
    });

    if (selectedRows.length === 0) {
        return REFUSAL_TEXT;
    }

    let response = "";
    
    if (evaluation.summary) {
        response += `${evaluation.summary}\n\n`;
    }

    selectedRows.forEach((row, index) => {
        const surahNameEn = getRowValue(row, ['surah_name_en', 'surah_en', 'surah_name']) || 'Surah';
        const surahNameAr = getRowValue(row, ['surah_name_ar', 'surah_ar_name']) || '';
        const surahNo = getRowValue(row, ['surah_no', 'surah_number']) || '';
        const ayahNoSurah = getRowValue(row, ['ayah_no_surah', 'ayah_no', 'ayah_number']) || (index + 1);
        const ayahAr = getRowValue(row, ['ayah_ar', 'arabic', 'text_ar']) || '';
        const ayahEn = getRowValue(row, ['ayah_en', 'translation', 'english', 'text_en']) || '';

        response += `### ${surahNameEn} — Ayah ${ayahNoSurah}\n\n`;
        response += `<div class="arabic-verse" dir="rtl">${ayahAr}</div>\n\n`;
        response += `> ${ayahEn}\n\n`;
        response += `*[Surah ${surahNameAr} (${surahNameEn}, ${surahNo}), Ayah ${ayahNoSurah}]*\n\n`;
        response += `---\n\n`;
    });

    return response.trim();
}

module.exports = { buildResponse };