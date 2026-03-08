# 🔮 ดาวทำนาย — Thai Astrology AI

> **โหราศาสตร์อินเดีย-ไทยที่คำนวณจากดาราศาสตร์จริง** — ไม่ใช่การเดา  
> _Real astronomical computation meets Thai-Vedic astrology tradition_

**Live Demo → [astro-xi-three.vercel.app](https://astro-xi-three.vercel.app)**

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🔭 ดวงชาตา (Birth Chart)** | True astronomical natal chart with Lahiri ayanamsa, real sidereal ascendant, all 9 Vedic planets + Rahu/Ketu |
| **💬 อาจารย์ดาว AI** | Powered by Gemini 2.5 Pro — reads your chart and answers in Thai astrology style |
| **🌙 ปัญจางค์ (Panchang)** | Daily Tithi, Nakshatra, Yoga, Karana, Vara — updated every day |
| **📅 มหาดาชา (Vimshottari Dasha)** | Full Dasha/Antardasha timeline from birth to future |
| **🗓️ ฤกษ์มงคล (Muhurta)** | Find auspicious time slots for events up to 30 days ahead |
| **💕 คู่ดวง (Synastry)** | Compatibility analysis with inter-chart aspect grid |
| **🃏 ทาโรต์ (Tarot)** | Daily Major Arcana pull with animated card flip |
| **⭐ ประเภทดาว (Star Personality)** | 7-type personality quiz with shareable results |
| **🔥 Streak Counter** | Daily return tracking with milestone toasts (3/7/14/30/100 days) |
| **📲 PWA Ready** | Installable as home-screen app, works offline for cached content |
| **🖼️ Dynamic OG Images** | Per-chart `/api/og` images for social sharing |
| **🔗 Share Cards** | `/share` page with personalized chart metadata per person |

---

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) (App Router, TypeScript)
- **Astronomy**: [`astronomy-engine`](https://github.com/cosinekitty/astronomy) — real ephemeris
- **Ayanamsa**: Lahiri (Vedic/Thai standard) — sidereal zodiac
- **AI**: [Google Gemini 2.5 Pro](https://ai.google.dev) via `@google/generative-ai`
- **Styling**: [Tailwind CSS v3](https://tailwindcss.com) + custom Thai-serif fonts
- **Deployment**: [Vercel](https://vercel.com) (Edge runtime for OG image)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com) API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/dawtamnai.git
cd dawtamnai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Create a `.env.local` file at the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google AI Studio API key for อาจารย์ดาว AI chat |

Get your key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — free tier available.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main app (all tabs, state, UI)
│   ├── layout.tsx            # Root layout, SEO metadata, PWA manifest
│   ├── globals.css           # Global styles, animations
│   ├── api/
│   │   ├── chat/route.ts     # Gemini AI chat endpoint
│   │   ├── chart/route.ts    # Birth chart calculation endpoint
│   │   ├── panchang/route.ts # Daily Panchang endpoint
│   │   ├── muhurta/route.ts  # Auspicious time finder
│   │   └── og/route.tsx      # Dynamic OG image (Edge runtime)
│   └── share/page.tsx        # Personalized share landing page
├── components/
│   ├── BirthChartView.tsx    # Vedic chart wheel + planet table
│   └── MarkdownRenderer.tsx  # AI response markdown renderer
└── lib/
    ├── thaiAstroEngine.ts    # Astronomical calculations (ascendant, planets)
    └── panchangEngine.ts     # Panchang + Muhurta + Dasha engine
public/
├── manifest.json             # PWA manifest
└── icons/                    # App icons (192x192, 512x512)
```

---

## 📖 How to Use

### 1. ✨ ดูดวงชาตา (Birth Chart)
Go to the **ชาตา** tab → enter your:
- Date of birth (วันเกิด)
- Time of birth (เวลาเกิด) — for accurate ascendant
- City of birth (เมืองเกิด) — for timezone-aware calculation

The system uses real astronomical positions with Lahiri ayanamsa (Vedic/Thai standard).

### 2. 💬 แชทกับอาจารย์ดาว (AI Chat)
Open the **แชท** tab and ask anything:
- "ดวงการเงินเดือนนี้เป็นยังไง?"
- "คนดาวลัคนากรกฎคบกับดาวสิงห์ได้ไหม?"
- "ช่วงนี้เหมาะเริ่มธุรกิจใหม่ไหม?"

Or use the Quick Prompts buttons for common questions.

### 3. 🌙 เช็คดาววันนี้ (Daily Astrology)
The **วันนี้** tab shows:
- Today's Panchang (Tithi, Nakshatra, Yoga, Vara)
- Lucky numbers, colors, and time slots
- Moon phase and energy reading

### 4. 🗓️ หาฤกษ์มงคล (Find Auspicious Times)
In the **ฤกษ์** tab:
- Select event type (business, travel, wedding, etc.)
- Set date range (up to 30 days)
- Get scored auspicious windows with explanations

### 5. 💕 เช็คคู่ดวง (Compatibility)
The **คู่ดวง** tab offers:
- **ซินาสตรี (Synastry)** — full inter-chart aspect analysis with two birth dates
- **ดวงคู่ใจ** — quick compatibility quiz

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/dawtamnai&env=GEMINI_API_KEY&envDescription=Google%20AI%20Studio%20API%20key%20for%20Gemini)

1. Click the button above
2. Add `GEMINI_API_KEY` in Vercel environment variables
3. Deploy!

### Manual Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

---

## 🧪 Development Scripts

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production build locally
npm run lint     # ESLint check
```

---

## 🔭 Astronomical Accuracy

ดาวทำนาย uses **real ephemeris data** via `astronomy-engine`:

- **Sidereal positions** — all planets computed in sidereal (Vedic) coordinates
- **Lahiri Ayanamsa** — applied at 23°08' (standard for Jyotish/Thai astrology)
- **True Ascendant** — via sidereal time + Meeus oblique ascension formula
- **Retrograde detection** — real daily velocity comparison
- **DST-aware** — timezone offset table for all Thai cities

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📬 Contact

- **Email**: hello@dawtamnai.ai
- **LINE**: [@dawtamnai](https://line.me/ti/p/@dawtamnai)
- **Instagram**: [@dawtamnai](https://instagram.com/dawtamnai)
- **X (Twitter)**: [@dawtamnai](https://x.com/dawtamnai)

---

<p align="center">Made with 🔮 and real astronomy · <a href="https://astro-xi-three.vercel.app">astro-xi-three.vercel.app</a></p>
