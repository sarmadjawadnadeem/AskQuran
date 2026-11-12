const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

let quranCache = null;

function loadQuranCSV() {
    if (quranCache) return quranCache;
    
    try {
        // Automatically mapped root file storage for Vercel functions
        const filePath = path.join(process.cwd(), 'data', 'quran.csv');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            bom: true
        });
        
        quranCache = records;
        return records;
    } catch (error) {
        console.error("Failed to load Quran CSV. Ensure data/quran.csv is present.", error);
        throw new Error("Quran Dataset unavailable.");
    }
}

module.exports = { loadQuranCSV };