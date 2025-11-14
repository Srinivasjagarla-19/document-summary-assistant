# Document Summary Assistant

A modern, responsive web app that extracts text from PDFs and images and generates clean, structured AI summaries. Built with a premium dark gradient theme, glassmorphic cards, and micro‑interactions for a polished AI SaaS experience.

### 🔗 Live Demo  
🚀 **https://docsbreif-ai.netlify.app/**

## ✨ Features
- Beautiful, responsive UI with dark AI gradient and glassmorphism
- Drag & drop upload for PDF, PNG, JPG
- Text extraction + AI summarization with selectable length (Short/Medium/Long)
- Clear tabbed results: AI Summary and Extracted Text
- Copy and Download actions (icon buttons) for summaries
- Robust error handling with retries and model fallback for temporary API overloads
- Secure environment-based API key usage

## 🖼️ Screenshots

<table>
  <tr>
    <td>
      <a href="https://github.com/user-attachments/assets/9caa1dac-f1d3-4ae0-8a86-e01778e14dfa" target="_blank">
        <img src="https://github.com/user-attachments/assets/9caa1dac-f1d3-4ae0-8a86-e01778e14dfa" width="100%" style="border-radius: 10px; padding: 8px;">
      </a>
    </td>
    <td>
      <a href="https://github.com/user-attachments/assets/9e480734-2462-4f86-a4fe-b4347034031e" target="_blank">
        <img src="https://github.com/user-attachments/assets/9e480734-2462-4f86-a4fe-b4347034031e" width="100%" style="border-radius: 10px; padding: 8px;">
      </a>
    </td>
  </tr>
  <tr>
    <td>
      <a href="https://github.com/user-attachments/assets/edbffb13-58c7-487b-a0f4-2fd60260ea04" target="_blank">
        <img src="https://github.com/user-attachments/assets/edbffb13-58c7-487b-a0f4-2fd60260ea04" width="100%" style="border-radius: 10px; padding: 8px;">
      </a>
    </td>
    <td>
      <a href="https://github.com/user-attachments/assets/80dd5e48-ac5f-41f8-a8df-bd40dd4fcc1a" target="_blank">
        <img src="https://github.com/user-attachments/assets/80dd5e48-ac5f-41f8-a8df-bd40dd4fcc1a" width="100%" style="border-radius: 10px; padding: 8px;">
      </a>
    </td>
  </tr>
</table>


## 🧱 Tech Stack
- React 19, TypeScript 5, Vite 6
- Tailwind (via CDN in this template; PostCSS build recommended for production)
- Google AI `@google/genai` SDK
- Marked (Markdown → HTML renderer)

## 📦 Project Structure
```
Document_Summary/
├─ index.html
├─ index.tsx
├─ vite.config.ts
├─ tsconfig.json
├─ package.json
├─ metadata.json
├─ favicon.svg
└─ README.md
```

## 🔑 Prerequisites
- Node.js (18+ recommended)
- A Gemini API key from Google AI Studio
  - Enable the Generative Language API
  - Set allowed referrers during development to http://localhost:3000/* or the port Vite chooses

## ⚙️ Setup
1) Install dependencies
```
npm install
```

2) Create `.env.local` at the project root and add your key
```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

3) Start the dev server
```
npm run dev
```
Vite will start on port 3000; if in use, it will pick the next one (e.g., 3001). The app will be available at the shown URL.

## 🚀 Usage
1) Click or drag & drop a PDF/PNG/JPG
2) After extraction, choose a summary length (Short/Medium/Long)
3) Click Summarize
4) Copy or Download the generated summary as needed

## 🔒 Security Notes
- Never commit `.env.local` or your API key to version control
- Restrict your key in Google AI Studio to approved referrers and rotate if exposed

## 🧰 Environment & Configuration
- `vite.config.ts` injects `GEMINI_API_KEY` as `process.env.API_KEY`
- Default model: `gemini-2.0-flash`
- Fallbacks are used automatically if the primary model is temporarily unavailable

## 🩺 Troubleshooting
- 400 INVALID_ARGUMENT – “API key not valid.”
  - Verify the key is correct, API is enabled, and referrer restrictions allow your localhost origin
- 404 NOT_FOUND – Model not supported for this API version/region
  - Pick another supported model; the app attempts known fallbacks automatically
- 503 UNAVAILABLE – “The model is overloaded.”
  - Temporary; the app retries with exponential backoff and may fall back. Try again shortly
- Network blocked by referrers
  - Ensure the key’s application restrictions include your dev origin (http://localhost:3000/* or the shown port)

## 🧪 Development Tips
- Use browser DevTools → Network to inspect API requests/responses
- For production, replace Tailwind CDN with a PostCSS build for better performance

## 📦 Build
```
npm run build
```
The production build will be in `dist/`.

## ☁️ Deploy
- Any static host (Vercel, Netlify, GitHub Pages with SPA routing tweaks) can host the `dist/` output
- Remember to set the `GEMINI_API_KEY` securely in your hosting environment and map it similarly if you proxy requests server-side

## 🤝 Contributing
PRs and issues are welcome. Please open an issue to discuss major changes first.

## 📝 License
MIT © 2025 – Your Name
