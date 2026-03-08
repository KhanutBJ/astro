import type { Metadata } from "next";
import Link from "next/link";

const APP_URL = "https://astro-xi-three.vercel.app";

type Props = { searchParams: { [key: string]: string | string[] | undefined } };

const sp = (p: Props["searchParams"], k: string) =>
  Array.isArray(p[k]) ? (p[k] as string[])[0] : (p[k] as string | undefined) ?? "";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const lagna  = sp(searchParams, "lagna")  || "ลัคนา";
  const sun    = sp(searchParams, "sun")    || "—";
  const moon   = sp(searchParams, "moon")   || "—";
  const score  = sp(searchParams, "score")  || "75";
  const date   = sp(searchParams, "date")   || "";
  const mars   = sp(searchParams, "mars")   || "";
  const jupiter = sp(searchParams, "jup")  || "";

  const ogUrl = new URL(`${APP_URL}/api/og`);
  ogUrl.searchParams.set("lagna",  lagna);
  ogUrl.searchParams.set("sun",    sun);
  ogUrl.searchParams.set("moon",   moon);
  ogUrl.searchParams.set("score",  score);
  if (date)    ogUrl.searchParams.set("date",    date);
  if (mars)    ogUrl.searchParams.set("mars",    mars);
  if (jupiter) ogUrl.searchParams.set("jupiter", jupiter);

  const title = `ดวงชาตาลัคนาราศี${lagna} · ดาวทำนาย ✨`;
  const desc  = `☀️ อาทิตย์ราศี${sun} · 🌙 จันทร์ราศี${moon} · ความแกร่งดวงชาตา ${score}/100 — ดูดวงชาตาของคุณที่ ดาวทำนาย`;

  return {
    metadataBase: new URL(APP_URL),
    title,
    description: desc,
    openGraph: {
      type: "website",
      url: ogUrl.toString(),
      title,
      description: desc,
      siteName: "ดาวทำนาย",
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [ogUrl.toString()],
    },
  };
}

export default function SharePage({ searchParams }: Props) {
  const lagna  = sp(searchParams, "lagna")  || "ลัคนา";
  const sun    = sp(searchParams, "sun")    || "—";
  const moon   = sp(searchParams, "moon")   || "—";
  const score  = parseInt(sp(searchParams, "score") || "75", 10);
  const date   = sp(searchParams, "date")   || "";
  const d      = sp(searchParams, "d")      || "";  // for deep-link back
  const t      = sp(searchParams, "t")      || "";
  const c      = sp(searchParams, "c")      || "";

  const chartUrl = d
    ? `${APP_URL}?d=${d}&t=${t}&c=${encodeURIComponent(c)}`
    : APP_URL;

  const scoreColor = score >= 80 ? "#22c55e" : score >= 65 ? "#f59e0b" : "#ef4444";

  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#06000f" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #06000f; min-height: 100vh; font-family: 'Prompt', sans-serif;
                 display: flex; align-items: center; justify-content: center; padding: 24px; }
        `}</style>
      </head>
      <body>
        <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          {/* App logo */}
          <div style={{ color: "#d97706", fontSize: 14, letterSpacing: "0.25em", marginBottom: 32,
                        textTransform: "uppercase", opacity: 0.8 }}>
            ✨ ดาวทำนาย
          </div>

          {/* Card */}
          <div style={{
            background: "linear-gradient(135deg, rgba(13,5,32,0.95), rgba(7,0,26,0.95))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24, padding: "36px 28px", marginBottom: 24,
            boxShadow: "0 0 60px rgba(139,92,246,0.12)",
          }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11,
                          letterSpacing: "0.2em", marginBottom: 16, textTransform: "uppercase" }}>
              เพิ่งค้นพบดวงชาตา
            </div>

            <div style={{ color: "white", fontSize: 42, fontWeight: 700, marginBottom: 6 }}>
              ราศี{lagna}
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12,
                          letterSpacing: "0.1em", marginBottom: 24 }}>
              ลัคนาราศี{lagna}
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
              <span style={{ padding: "8px 16px", background: "rgba(255,255,255,0.04)",
                             border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                             color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                ☀️ อาทิตย์{sun !== "—" ? `ราศี${sun}` : ""}
              </span>
              <span style={{ padding: "8px 16px", background: "rgba(255,255,255,0.04)",
                             border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
                             color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                🌙 จันทร์{moon !== "—" ? `ราศี${moon}` : ""}
              </span>
            </div>

            {/* Score bar */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 99,
                            height: 6, overflow: "hidden" }}>
                <div style={{
                  width: `${score}%`, height: "100%",
                  background: `linear-gradient(90deg, ${scoreColor}80, ${scoreColor})`,
                  borderRadius: 99,
                }} />
              </div>
              <div style={{ color: scoreColor, fontSize: 12, marginTop: 6 }}>
                ความแกร่งดวงชาตา {score}/100
              </div>
            </div>

            {date && (
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 12 }}>
                วันเกิด {date}
              </div>
            )}
          </div>

          {/* CTA */}
          <a href={chartUrl} style={{
            display: "block", width: "100%",
            padding: "18px 24px",
            background: "linear-gradient(135deg, #d97706, #b45309)",
            borderRadius: 18, color: "white",
            fontWeight: 700, fontSize: 18,
            textDecoration: "none", marginBottom: 16,
            boxShadow: "0 8px 32px rgba(217,119,6,0.35)",
          }}>
            🔮 ดูดวงชาตาของคุณ →
          </a>

          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
            คำนวณจากดาราศาสตร์จริง · Swiss Ephemeris · Lahiri Sidereal
          </div>
        </div>
      </body>
    </html>
  );
}
