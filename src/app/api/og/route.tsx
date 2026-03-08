import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SIGN_COLORS: Record<string, string> = {
  เมษ: "#ef4444", พฤษภ: "#22c55e", มิถุน: "#eab308", กรกฎ: "#06b6d4",
  สิงห์: "#f59e0b", กันย์: "#84cc16", ตุลย์: "#ec4899", พิจิก: "#8b5cf6",
  ธนู: "#f97316", มังกร: "#64748b", กุมภ์: "#3b82f6", มีน: "#a855f7",
};
const SIGN_SYM: Record<string, string> = {
  เมษ: "♈", พฤษภ: "♉", มิถุน: "♊", กรกฎ: "♋",
  สิงห์: "♌", กันย์: "♍", ตุลย์: "♎", พิจิก: "♏",
  ธนู: "♐", มังกร: "♑", กุมภ์: "♒", มีน: "♓",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lagna   = searchParams.get("lagna")  ?? "ลัคนา";
  const sun     = searchParams.get("sun")    ?? "—";
  const moon    = searchParams.get("moon")   ?? "—";
  const mars    = searchParams.get("mars")   ?? "";
  const jupiter = searchParams.get("jupiter") ?? "";
  const score   = parseInt(searchParams.get("score") ?? "75", 10);
  const date    = searchParams.get("date")   ?? "";

  // Fetch Noto Sans Thai for Thai character rendering
  let fontData: ArrayBuffer | null = null;
  try {
    const r = await fetch(
      "https://fonts.gstatic.com/s/notosansthai/v25/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofpAtlv9DMczA.woff"
    );
    fontData = await r.arrayBuffer();
  } catch {
    fontData = null;
  }

  const lagnaColor = SIGN_COLORS[lagna] ?? "#d97706";
  const lagnaSym   = SIGN_SYM[lagna]   ?? "★";
  const scoreColor = score >= 80 ? "#22c55e" : score >= 65 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 80 ? "ดวงชาตาแกร่ง" : score >= 65 ? "ดวงชาตาดี" : "ดวงชาตาพิเศษ";

  // Stars decorative
  const STAR_POS = [
    [60,40],[180,120],[300,60],[450,30],[600,90],[750,50],[900,100],[1050,40],[1150,130],
    [100,200],[250,280],[400,200],[560,250],[700,180],[850,260],[1000,220],[1140,300],
    [50,400],[200,480],[380,420],[520,500],[680,440],[820,520],[970,460],[1120,540],
    [140,580],[320,610],[500,590],[660,600],[800,580],[950,620],[1100,600],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200, height: 630,
          background: "linear-gradient(135deg, #06000f 0%, #0d0520 40%, #07001a 70%, #06000f 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: fontData ? "NotoSansThai" : "sans-serif",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Background stars */}
        {STAR_POS.map(([x, y], i) => (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: i % 5 === 0 ? 3 : 1.5, height: i % 5 === 0 ? 3 : 1.5,
            borderRadius: "50%",
            background: i % 7 === 0 ? "#fbbf24" : "rgba(255,255,255,0.5)",
          }} />
        ))}

        {/* Top glow behind lagna circle */}
        <div style={{
          position: "absolute", top: 80, left: "50%",
          transform: "translateX(-50%)",
          width: 320, height: 320, borderRadius: "50%",
          background: `radial-gradient(circle, ${lagnaColor}18 0%, transparent 70%)`,
        }} />

        {/* App label */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          color: "#d97706", fontSize: 20, letterSpacing: "0.3em",
          marginBottom: 20, textTransform: "uppercase",
        }}>
          <span>✨</span><span>ดาวทำนาย</span><span>✨</span>
        </div>

        {/* Lagna circle */}
        <div style={{
          width: 160, height: 160, borderRadius: "50%",
          border: `3px solid ${lagnaColor}`,
          background: `radial-gradient(circle, ${lagnaColor}22 0%, transparent 80%)`,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          marginBottom: 18,
          boxShadow: `0 0 40px ${lagnaColor}40`,
        }}>
          <div style={{ fontSize: 48, lineHeight: 1 }}>{lagnaSym}</div>
          <div style={{ color: lagnaColor, fontSize: 16, marginTop: 4, letterSpacing: "0.05em" }}>ลัคนา</div>
        </div>

        {/* Lagna sign name */}
        <div style={{
          color: "#ffffff", fontSize: 56, fontWeight: 700,
          letterSpacing: "0.02em", marginBottom: 6,
          textShadow: `0 0 30px ${lagnaColor}80`,
        }}>
          ราศี{lagna}
        </div>

        {/* Score */}
        <div style={{
          color: scoreColor, fontSize: 16, letterSpacing: "0.1em",
          marginBottom: 28,
        }}>
          {scoreLabel} · {score}/100
        </div>

        {/* Planet row */}
        <div style={{ display: "flex", gap: 24, marginBottom: 30 }}>
          {[
            { label: "☀️ อาทิตย์", val: sun },
            { label: "🌙 จันทร์",  val: moon  },
            mars    ? { label: "♂️ อังคาร",  val: mars    } : null,
            jupiter ? { label: "♃ พฤหัสฯ",  val: jupiter } : null,
          ].filter(Boolean).map((p, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "10px 20px",
            }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 4 }}>{p!.label}</div>
              <div style={{ color: "#ffffff", fontSize: 18, fontWeight: 500 }}>ราศี{p!.val !== "—" ? p!.val : "—"}</div>
            </div>
          ))}
        </div>

        {/* Score bar */}
        <div style={{
          width: 380, height: 6, background: "rgba(255,255,255,0.06)",
          borderRadius: 99, overflow: "hidden", marginBottom: 10,
        }}>
          <div style={{
            height: 6, width: `${score}%`,
            background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`,
            borderRadius: 99,
          }} />
        </div>

        {date && (
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 14, letterSpacing: "0.05em" }}>
            วันเกิด {date}
          </div>
        )}

        {/* Footer */}
        <div style={{
          position: "absolute", bottom: 28,
          color: "rgba(255,255,255,0.15)", fontSize: 13, letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}>
          คำนวณด้วยดาราศาสตร์จริง · Swiss Ephemeris · Lahiri Sidereal
        </div>

        {/* Side decorative lines */}
        <div style={{
          position: "absolute", left: 48, top: "50%",
          width: 1, height: 200, transform: "translateY(-50%)",
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.06), transparent)",
        }} />
        <div style={{
          position: "absolute", right: 48, top: "50%",
          width: 1, height: 200, transform: "translateY(-50%)",
          background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.06), transparent)",
        }} />
      </div>
    ),
    {
      width: 1200, height: 630,
      ...(fontData ? {
        fonts: [{ name: "NotoSansThai", data: fontData, weight: 400 as const, style: "normal" as const }],
      } : {}),
    }
  );
}
