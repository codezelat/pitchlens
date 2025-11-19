# PitchLens — Message Intelligence Engine

PitchLens is a modern, conversion-focused messaging tool that helps teams craft messages that resonate with their audience. This repository contains the front-end UI, built with Next.js and Tailwind CSS. It demonstrates a complete message analysis and improvement workflow with a focus on clarity, design, and conversion.

---

## Key Features

- Analyze messages for clarity, emotional resonance, credibility, and market effectiveness.
- Provide AI-powered rewrite suggestions with tone and persona adjustments.
- Visual scoring dashboard and actionable recommendations.
- Badge generation for publishing verified scores on external websites.

---

## Pages & Workflow

- `/` — Landing page with feature highlights and CTAs.
- `/app` — Core app interface where users can paste text or provide a URL and run an analysis.
- `/dashboard` — Score breakdown and recommendations for improvement.
- `/badges` — Badge customization, downloads, and embed code.

---

## Development & Installation

Prerequisites

- Node.js (v18+)
- npm (or yarn / pnpm)

Commands (from project root)

```powershell
# install dependencies
npm install

# start the development server
npm run dev

# build for production
npm run build

# start production server
npm run start
# lint the project
npm run lint
```

Open `http://localhost:3000` in your browser to preview the application.

---

## How to Use the App (User Workflow)

1. Open the App: Navigate to `/app` in the browser.
2. Paste your text or enter a URL: Provide content for analysis.
3. Click **Analyze Message**: This runs the UI demo analysis.
4. Compare Before / After: View the original message and recommended rewrite.
5. Adjust Tone and Persona: Tweak tone using the slider and pick a persona to see different suggestions.
6. Apply Rewrite: Accept suggestions and view the updated message on the Dashboard.
7. Create Badge: Visit `/badges` to generate, preview, and copy the embed code or download an image.

> Note: The current front-end includes mock data and UI-only behavior. Integrate an AI backend (API) to replace the demo logic with real analysis.

---

## Project Structure

```
front-end/
├─ app/ (Next.js app routes: landing, app, dashboard, badges)
├─ components/ (reusable UI components like Navbar, Card, Button, ScoreCircle)
├─ public/ (assets)
├─ app/globals.css (global styles and brand palette)
├─ package.json
```

---

## Extending & Integrating a Backend

1. Add a server/API endpoint (e.g. `/api/analyze`) that accepts message text and returns analysis JSON.
2. Update UI calls to use fetch/XHR to connect to the API endpoint and replace mocked results.
3. Optionally, add authentication and data storage for saved messages.

Example API output format:

```json
{
  "score": 84,
  "clarity": 92,
  "emotion": 80,
  "credibility": 78,
  "suggestion": "Rewritten message text",
  "insights": ["Add case study", "Include CTA"]
}
```

---

## Design & Conventions

- Minimal, Google-like styling using Tailwind utilities
- Large whitespace, rounded cards, soft gradients
- Smooth micro-animations and transitions
- Accessible contrast and typographic scale

---

## Contributing

Contributions are welcome! When submitting contributions:

1. Fork the repo and create a feature branch.
2. Follow Tailwind styles and design conventions.
3. Add tests where relevant and update the README where needed.

---

## License & Credits

