# Quranic Knowledge Assistant

A highly precise, strict-bounded Quranic data-retrieval engine built to ensure zero hallucination, serving completely deterministic responses directly from a local Quranic CSV dataset.

## Architecture
- **Frontend**: Vanilla HTML/CSS/JS (Lightweight, No dependencies)
- **Backend**: Vercel Serverless Node.js Functions
- **AI Integration**: Google Gemini (`gemini-1.5-flash` standard, configurable) used *strictly* for Search Intent and Multilingual Semantic Relevance Mapping. Final text generation operates strictly from local verified dataset identifiers.

## Getting Started

1. **Clone the repository.**
2. **Install dependencies:** `npm install`
3. **Dataset Placement:** Ensure your `quran.csv` file is placed inside the root `data/` folder as `data/quran.csv`.
4. **Environment Variables:** Create a `.env` file in the root matching `.env.example` and add your Google Gemini API key.
5. **Local Testing:** Install Vercel CLI (`npm i -g vercel`) and run `vercel dev`.

## Deployment to Vercel
1. Push your repository to GitHub.
2. Link the repository to a new Vercel Project.
3. Under the Vercel Project Settings > Environment Variables, add:
   - `AI_API_KEY` (Your API Key)
   - `AI_MODEL` (e.g. `gemini-1.5-flash`)
4. Deploy. Vercel automatically maps `/api/chat.js` to serverless routes via the included `vercel.json` configurations.