"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import BirthChartView, { type ChartData } from "../components/BirthChartView";
import MarkdownRenderer from "../components/MarkdownRenderer";

const THAI_CITIES = [
  { label: "กรุงเทพฯ",    lat: 13.7563,  lon: 100.5018 },
  { label: "เชียงใหม่",   lat: 18.7883,  lon:  98.9853 },
  { label: "ขอนแก่น",    lat: 16.4419,  lon: 102.8360 },
  { label: "นครราชสีมา", lat: 14.9799,  lon: 102.0978 },
  { label: "ภูเก็ต",     lat:  7.8804,  lon:  98.3923 },
  { label: "หาดใหญ่",    lat:  7.0086,  lon: 100.4747 },
  { label: "อุดรธานี",   lat: 17.4156,  lon: 102.7872 },
  { label: "สงขลา",      lat:  7.1894,  lon: 100.5950 },
];

// ─── Types ───────────────────────────────────────────────────
type Message = { role: "user" | "assistant"; content: string };
type Tab = "chat" | "birth" | "daily" | "compat" | "tarot";

// ─── Data ────────────────────────────────────────────────────
const ZODIAC_SIGNS = [
  { thai: "เมษ",   en: "Aries",       symbol: "♈", emoji: "🔥", color: "#ef4444", dates: "21 มี.ค. – 19 เม.ย." },
  { thai: "พฤษภ", en: "Taurus",      symbol: "♉", emoji: "🌿", color: "#22c55e", dates: "20 เม.ย. – 20 พ.ค." },
  { thai: "เมถุน", en: "Gemini",      symbol: "♊", emoji: "💨", color: "#eab308", dates: "21 พ.ค. – 20 มิ.ย." },
  { thai: "กรกฎ", en: "Cancer",      symbol: "♋", emoji: "🌊", color: "#06b6d4", dates: "21 มิ.ย. – 22 ก.ค." },
  { thai: "สิงห์", en: "Leo",         symbol: "♌", emoji: "✨", color: "#f59e0b", dates: "23 ก.ค. – 22 ส.ค." },
  { thai: "กันย์", en: "Virgo",       symbol: "♍", emoji: "🌾", color: "#84cc16", dates: "23 ส.ค. – 22 ก.ย." },
  { thai: "ตุล",   en: "Libra",       symbol: "♎", emoji: "⚖️",color: "#ec4899", dates: "23 ก.ย. – 22 ต.ค." },
  { thai: "พิจิก", en: "Scorpio",     symbol: "♏", emoji: "🦂", color: "#8b5cf6", dates: "23 ต.ค. – 21 พ.ย." },
  { thai: "ธนู",   en: "Sagittarius", symbol: "♐", emoji: "🏹", color: "#f97316", dates: "22 พ.ย. – 21 ธ.ค." },
  { thai: "มกร",  en: "Capricorn",   symbol: "♑", emoji: "🏔️",color: "#64748b", dates: "22 ธ.ค. – 19 ม.ค." },
  { thai: "กุมภ์", en: "Aquarius",    symbol: "♒", emoji: "⚡", color: "#3b82f6", dates: "20 ม.ค. – 18 ก.พ." },
  { thai: "มีน",   en: "Pisces",      symbol: "♓", emoji: "🐟", color: "#a855f7", dates: "19 ก.พ. – 20 มี.ค." },
];

const TAROT_CARDS = [
  { name: "The Fool", thai: "จุดเริ่มต้น", emoji: "🌟", meaning: "การเริ่มต้นใหม่ โอกาส ความกล้าหาญ" },
  { name: "The Magician", thai: "นักมายากล", emoji: "🪄", meaning: "พลังงาน ความสามารถ การกระทำ" },
  { name: "The High Priestess", thai: "นักบวชหญิง", emoji: "🌙", meaning: "ปัญญา สัญชาตญาณ ความลึกลับ" },
  { name: "The Empress", thai: "จักรพรรดินี", emoji: "🌸", meaning: "ความอุดมสมบูรณ์ ธรรมชาติ ความรัก" },
  { name: "The Emperor", thai: "จักรพรรดิ", emoji: "👑", meaning: "อำนาจ โครงสร้าง ความมั่นคง" },
  { name: "The Lovers", thai: "คู่รัก", emoji: "💕", meaning: "ความรัก ความสัมพันธ์ ทางเลือก" },
  { name: "The Chariot", thai: "รถศึก", emoji: "⚡", meaning: "ชัยชนะ ความมุ่งมั่น การเคลื่อนไหว" },
  { name: "Strength", thai: "พลัง", emoji: "🦁", meaning: "ความกล้า ความอดทน พลังงานภายใน" },
  { name: "The Hermit", thai: "ฤๅษี", emoji: "🔦", meaning: "การค้นหาตัวเอง ความสันโดษ ปัญญา" },
  { name: "Wheel of Fortune", thai: "วงล้อโชคชะตา", emoji: "🎡", meaning: "โชค การเปลี่ยนแปลง วงจรชีวิต" },
  { name: "Justice", thai: "ยุติธรรม", emoji: "⚖️", meaning: "ความยุติธรรม ความสมดุล ความจริง" },
  { name: "The Star", thai: "ดวงดาว", emoji: "⭐", meaning: "ความหวัง การสร้างแรงบันดาลใจ ความงาม" },
  { name: "The Moon", thai: "ดวงจันทร์", emoji: "🌕", meaning: "ภาพลวงตา ความกลัว ความลึกลับ" },
  { name: "The Sun", thai: "ดวงอาทิตย์", emoji: "☀️", meaning: "ความสุข ความสำเร็จ ชีวิตชีวา" },
  { name: "Judgement", thai: "การตัดสิน", emoji: "🎺", meaning: "การฟื้นฟู การตื่นรู้ การเรียกร้อง" },
  { name: "The World", thai: "โลก", emoji: "🌍", meaning: "ความสมบูรณ์ การบูรณาการ ความสำเร็จ" },
];

const QUICK_PROMPTS = [
  { label: "💼 งาน", text: "ดวงการงานเดือนนี้เป็นอย่างไร?" },
  { label: "❤️ ความรัก", text: "ดวงความรักช่วงนี้เป็นอย่างไร?" },
  { label: "💰 เงิน", text: "ดวงการเงินปีนี้เป็นอย่างไร?" },
  { label: "🌙 สีมงคล", text: "สีมงคลและวันดีสำหรับฉัน" },
  { label: "⭐ วันนี้", text: "วันนี้เหมาะกับอะไร?" },
  { label: "🔮 ดวงรวม", text: "ขอดูดวงรวมประจำปีนี้" },
  { label: "🎓 การเรียน", text: "ดวงการเรียนช่วงนี้เป็นยังไง?" },
  { label: "👯 เพื่อน", text: "ดวงมิตรภาพและสังคมของฉัน" },
];

// Stable deterministic stars
const STARS = Array.from({ length: 80 }, (_, i) => {
  let s = (i * 9301 + 49297) % 233280;
  const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  return { id: i, x: r() * 100, y: r() * 100, size: r() * 1.8 + 0.3, delay: r() * 4, dur: r() * 3 + 2 };
});

// ─── Helpers ──────────────────────────────────────────────────
function getMoonPhase(date: Date): { emoji: string; name: string; thai: string; illumination: number } {
  const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
  const c = Math.floor((year - 1900) * 12.3685);
  const e = c * 29.53059;
  const jd = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day - 1524.5;
  const phase = ((jd - (2451550.1 + e)) % 29.53059 + 29.53059) % 29.53059;
  const ill = Math.round((1 - Math.cos((phase / 29.53059) * 2 * Math.PI)) / 2 * 100);
  if (phase < 1.85) return { emoji: "🌑", name: "New Moon", thai: "ดับ", illumination: 0 };
  if (phase < 7.38) return { emoji: "🌒", name: "Waxing Crescent", thai: "ขึ้น ๑-๗ ค่ำ", illumination: ill };
  if (phase < 9.22) return { emoji: "🌓", name: "First Quarter", thai: "ขึ้น ๘ ค่ำ", illumination: 50 };
  if (phase < 14.77) return { emoji: "🌔", name: "Waxing Gibbous", thai: "ขึ้น ๙-๑๔ ค่ำ", illumination: ill };
  if (phase < 16.61) return { emoji: "🌕", name: "Full Moon", thai: "เพ็ญ", illumination: 100 };
  if (phase < 22.15) return { emoji: "🌖", name: "Waning Gibbous", thai: "แรม ๑-๖ ค่ำ", illumination: ill };
  if (phase < 23.99) return { emoji: "🌗", name: "Last Quarter", thai: "แรม ๗ ค่ำ", illumination: 50 };
  return { emoji: "🌘", name: "Waning Crescent", thai: "แรม ๘-๑๔ ค่ำ", illumination: ill };
}

function getLuckyTimes(date: Date) {
  const day = date.getDay();
  const times = [
    [["06:00-08:00","15:00-17:00"],["07:00-09:00","16:00-18:00"],["08:00-10:00","17:00-19:00"],
     ["07:30-09:30","14:00-16:00"],["09:00-11:00","18:00-20:00"],["06:30-08:30","13:00-15:00"],
     ["08:30-10:30","19:00-21:00"]][day],
  ][0];
  return times;
}

function getSeed(date: Date) {
  return date.getDate() * 31 + date.getMonth() * 7 + date.getFullYear();
}

// ─── Sub-components ───────────────────────────────────────────

function StarField() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {STARS.map((s) => (
        <div key={s.id} className="absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.size}px`, height: `${s.size}px`, opacity: 0.4,
            animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite alternate` }} />
      ))}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-indigo-900/15 rounded-full blur-3xl" />
      <div className="absolute top-2/3 left-1/3 w-64 h-64 bg-violet-900/10 rounded-full blur-3xl" />
    </div>
  );
}

function MoonPhaseWidget() {
  const moon = getMoonPhase(new Date());
  const luckyTimes = getLuckyTimes(new Date());
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-mono">ดวงจันทร์วันนี้</p>
          <p className="text-white/80 font-thai-serif text-sm mt-0.5">{moon.thai}</p>
          <p className="text-white/30 text-[10px]">{moon.name}</p>
        </div>
        <span className="text-4xl">{moon.emoji}</span>
      </div>
      <div>
        <div className="flex justify-between text-[10px] text-white/30 mb-1 font-mono">
          <span>แสงสว่าง</span><span>{moon.illumination}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-white"
            style={{ width: `${moon.illumination}%`, transition: "width 1s ease" }} />
        </div>
      </div>
      <div>
        <p className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-1.5">⏰ ฤกษ์มงคลวันนี้</p>
        <div className="flex flex-wrap gap-1.5">
          {luckyTimes.map((t, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] font-mono">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function EnergyBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2.5">
      <div className="flex justify-between mb-1">
        <span className="text-white/50 text-xs font-thai-serif">{label}</span>
        <span className="text-[11px] font-mono" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: `linear-gradient(90deg,${color}66,${color})`, transition: "width 1.2s ease" }} />
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm flex-shrink-0 shadow-lg shadow-amber-500/30">🔮</div>
      <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 backdrop-blur-sm">
        <span className="text-purple-200 text-sm font-thai-serif">กำลังดูดวง</span>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block typing-dot" style={{ animationDelay: `${i*0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-end gap-2.5 mb-5 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
        isUser
          ? "bg-gradient-to-br from-violet-500 to-indigo-700 border border-violet-400/25"
          : "bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/25"
      }`}>
        {isUser ? "✦" : "🔮"}
      </div>

      {/* Bubble */}
      <div className={`max-w-[84%] sm:max-w-[74%] rounded-2xl px-4 py-3.5 ${
        isUser
          ? "bg-gradient-to-br from-violet-600/85 to-indigo-800/90 rounded-br-sm border border-violet-400/20 shadow-lg shadow-violet-900/30"
          : "rounded-bl-sm border shadow-lg shadow-black/40 backdrop-blur-sm"
      }`}
        style={!isUser ? {
          background: "linear-gradient(135deg, rgba(10,3,24,0.94) 0%, rgba(20,8,52,0.96) 100%)",
          borderColor: "rgba(139,92,246,0.18)",
        } : undefined}
      >
        {isUser ? (
          <p className="font-thai-serif text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  );
}

// ── Tarot Tab ──────────────────────────────────────────────────
function TarotTab({ onReadingRequest }: { onReadingRequest: (msg: string) => void }) {
  const [flipped, setFlipped] = useState(false);
  const [card, setCard] = useState<typeof TAROT_CARDS[0] | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const draw = () => {
    setIsShuffling(true);
    setFlipped(false);
    setCard(null);
    setTimeout(() => {
      const c = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
      const rev = Math.random() > 0.7;
      setCard(c); setIsReversed(rev);
      setIsShuffling(false);
    }, 900);
    setTimeout(() => setFlipped(true), 1200);
  };

  const askAI = () => {
    if (!card) return;
    onReadingRequest(`ช่วยอ่านไพ่ทาโรต์ไพ่ "${card.thai} (${card.name})"${isReversed ? " ในตำแหน่งกลับด้าน" : ""} ให้หน่อยได้ไหมคะ? ความหมายและคำแนะนำสำหรับสถานการณ์ปัจจุบันของฉัน`);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
      <div className="max-w-sm mx-auto text-center">
        <p className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-1">ไพ่ทาโรต์</p>
        <h2 className="font-thai-serif text-2xl font-bold gold-text mb-1">จับไพ่ดวง</h2>
        <p className="text-white/30 text-xs font-thai-serif mb-8">ตั้งจิต ตั้งคำถามในใจ แล้วกดจับไพ่</p>

        {/* Card */}
        <div className="relative inline-block mb-8">
          <div
            className="w-36 h-60 sm:w-44 sm:h-72 mx-auto cursor-pointer"
            style={{ perspective: "1000px" }}
            onClick={() => !flipped && card && setFlipped(true)}
          >
            <div
              className="relative w-full h-full transition-transform duration-700 preserve-3d"
              style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
            >
              {/* Back */}
              <div className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-900 to-purple-950 flex items-center justify-center overflow-hidden" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                <div className="text-4xl opacity-30">✦</div>
                <div className="absolute inset-0" style={{
                  backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 8px)",
                }} />
              </div>
              {/* Front */}
              <div
                className="absolute inset-0 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-[#1a0a40] to-[#0d0020] flex flex-col items-center justify-center gap-3 overflow-hidden"
                style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
              >
                {card && (
                  <>
                    <div className="absolute inset-0 opacity-5" style={{
                      backgroundImage: "radial-gradient(circle at center, #fbbf24 0%, transparent 70%)",
                    }} />
                    <span className={`text-6xl transition-transform duration-500 ${isReversed ? "rotate-180" : ""}`}>{card.emoji}</span>
                    <div>
                      <p className="font-thai-serif font-bold text-amber-300 text-lg">{card.thai}</p>
                      <p className="text-white/30 text-[10px] font-mono mt-0.5">{card.name}</p>
                    </div>
                    {isReversed && <span className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-400/30 text-red-300 text-[10px] font-mono">REVERSED</span>}
                    <p className="text-white/50 text-xs font-thai-serif px-4 text-center leading-relaxed">{card.meaning}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {isShuffling && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="space-y-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-8 h-1 bg-amber-400/60 rounded-full animate-pulse" style={{ animationDelay: `${i*0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={draw}
            disabled={isShuffling}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-thai-serif font-semibold shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
          >
            {isShuffling ? "กำลังสับไพ่..." : card ? "🔀 จับไพ่ใหม่" : "🃏 จับไพ่"}
          </button>
          {card && flipped && (
            <button
              onClick={askAI}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-thai-serif font-semibold shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              🔮 ให้อาจารย์ดาวอ่านไพ่
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Compatibility Tab ──────────────────────────────────────────
function CompatibilityTab({ onReadingRequest }: { onReadingRequest: (msg: string) => void }) {
  const [person1, setPerson1] = useState("");
  const [person2, setPerson2] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [isCalc, setIsCalc] = useState(false);

  const COMPAT: Record<string, Record<string, number>> = {
    Aries:    { Aries:75,Taurus:55,Gemini:80,Cancer:60,Leo:95,Virgo:50,Libra:65,Scorpio:55,Sagittarius:90,Capricorn:45,Aquarius:70,Pisces:60 },
    Taurus:   { Aries:55,Taurus:85,Gemini:50,Cancer:90,Leo:65,Virgo:92,Libra:70,Scorpio:85,Sagittarius:45,Capricorn:95,Aquarius:40,Pisces:80 },
    Gemini:   { Aries:80,Taurus:50,Gemini:75,Cancer:55,Leo:85,Virgo:60,Libra:92,Scorpio:45,Sagittarius:80,Capricorn:40,Aquarius:90,Pisces:55 },
    Cancer:   { Aries:60,Taurus:90,Gemini:55,Cancer:80,Leo:55,Virgo:78,Libra:50,Scorpio:92,Sagittarius:40,Capricorn:70,Aquarius:45,Pisces:95 },
    Leo:      { Aries:95,Taurus:65,Gemini:85,Cancer:55,Leo:70,Virgo:55,Libra:80,Scorpio:50,Sagittarius:90,Capricorn:45,Aquarius:65,Pisces:60 },
    Virgo:    { Aries:50,Taurus:92,Gemini:60,Cancer:78,Leo:55,Virgo:80,Libra:65,Scorpio:85,Sagittarius:40,Capricorn:90,Aquarius:55,Pisces:75 },
    Libra:    { Aries:65,Taurus:70,Gemini:92,Cancer:50,Leo:80,Virgo:65,Libra:75,Scorpio:60,Sagittarius:78,Capricorn:55,Aquarius:85,Pisces:65 },
    Scorpio:  { Aries:55,Taurus:85,Gemini:45,Cancer:92,Leo:50,Virgo:85,Libra:60,Scorpio:80,Sagittarius:45,Capricorn:75,Aquarius:50,Pisces:90 },
    Sagittarius:{Aries:90,Taurus:45,Gemini:80,Cancer:40,Leo:90,Virgo:40,Libra:78,Scorpio:45,Sagittarius:75,Capricorn:50,Aquarius:82,Pisces:55},
    Capricorn:{ Aries:45,Taurus:95,Gemini:40,Cancer:70,Leo:45,Virgo:90,Libra:55,Scorpio:75,Sagittarius:50,Capricorn:85,Aquarius:60,Pisces:70 },
    Aquarius: { Aries:70,Taurus:40,Gemini:90,Cancer:45,Leo:65,Virgo:55,Libra:85,Scorpio:50,Sagittarius:82,Capricorn:60,Aquarius:80,Pisces:60 },
    Pisces:   { Aries:60,Taurus:80,Gemini:55,Cancer:95,Leo:60,Virgo:75,Libra:65,Scorpio:90,Sagittarius:55,Capricorn:70,Aquarius:60,Pisces:82 },
  };

  const calculate = () => {
    if (!person1 || !person2) return;
    setIsCalc(true);
    setTimeout(() => {
      const s = COMPAT[person1]?.[person2] ?? 60;
      setScore(s + Math.floor(Math.random() * 5) - 2);
      setIsCalc(false);
    }, 1400);
  };

  const ask = () => {
    if (!person1 || !person2 || score === null) return;
    const z1 = ZODIAC_SIGNS.find(z => z.en === person1);
    const z2 = ZODIAC_SIGNS.find(z => z.en === person2);
    onReadingRequest(`วิเคราะห์ความเข้ากันของราศี${z1?.thai}${z1?.symbol} กับ ราศี${z2?.thai}${z2?.symbol} อย่างละเอียด เรื่องความรัก การงาน และมิตรภาพ คะแนนความเข้ากัน ${score}%`);
  };

  const getScoreLabel = (s: number) => {
    if (s >= 90) return { label: "คู่แท้จากดวงดาว ✨", color: "#f59e0b" };
    if (s >= 75) return { label: "เข้ากันได้ดีมาก 💕", color: "#ec4899" };
    if (s >= 60) return { label: "มีศักยภาพ 🌟", color: "#8b5cf6" };
    if (s >= 45) return { label: "ต้องพยายามกัน 🌙", color: "#06b6d4" };
    return { label: "ท้าทายแต่เรียนรู้ได้ 🔥", color: "#ef4444" };
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
      <div className="max-w-sm mx-auto">
        <p className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-1 text-center">ดูดวงคู่</p>
        <h2 className="font-thai-serif text-2xl font-bold gold-text mb-1 text-center">ความเข้ากัน</h2>
        <p className="text-white/30 text-xs font-thai-serif mb-8 text-center">เลือกราศีเพื่อดูความเข้ากันของดวงดาว</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {[{ label: "คนที่ 1", val: person1, set: setPerson1 }, { label: "คนที่ 2", val: person2, set: setPerson2 }].map(({ label, val, set }) => (
            <div key={label}>
              <p className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-2">{label}</p>
              <div className="grid grid-cols-6 sm:grid-cols-4 gap-1.5">
                {ZODIAC_SIGNS.map((z) => (
                  <button
                    key={z.en}
                    onClick={() => { set(z.en); setScore(null); }}
                    className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border transition-all duration-200 active:scale-90 ${val === z.en ? "border-amber-400/60 bg-amber-400/10" : "border-white/5 bg-white/[0.02] hover:border-white/15"}`}
                  >
                    <span className="text-sm sm:text-base leading-none">{z.symbol}</span>
                    <span className="text-[8px] sm:text-[9px] text-white/50 font-thai-serif">{z.thai}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Score ring */}
        {score !== null && (
          <div className="text-center mb-6">
            <div className="relative inline-flex items-center justify-center w-32 h-32 mx-auto mb-3">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="64" cy="64" r="56" fill="none" stroke={getScoreLabel(score).color}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 351.86} 351.86`}
                  style={{ filter: `drop-shadow(0 0 6px ${getScoreLabel(score).color})`, transition: "stroke-dasharray 1.5s ease" }}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-bold text-white font-mono leading-none">{score}</p>
                <p className="text-white/30 text-[10px]">คะแนน</p>
              </div>
            </div>
            <p className="font-thai-serif font-semibold text-lg" style={{ color: getScoreLabel(score).color }}>
              {getScoreLabel(score).label}
            </p>
            <div className="flex justify-center gap-3 mt-2 text-sm">
              <span>{ZODIAC_SIGNS.find(z=>z.en===person1)?.symbol} {ZODIAC_SIGNS.find(z=>z.en===person1)?.thai}</span>
              <span className="text-white/30">×</span>
              <span>{ZODIAC_SIGNS.find(z=>z.en===person2)?.symbol} {ZODIAC_SIGNS.find(z=>z.en===person2)?.thai}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={calculate}
            disabled={!person1 || !person2 || isCalc}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-thai-serif font-semibold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {isCalc ? "กำลังคำนวณดวงดาว..." : "💕 คำนวณความเข้ากัน"}
          </button>
          {score !== null && (
            <button
              onClick={ask}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-thai-serif font-semibold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              🔮 ขอคำทำนายเพิ่มเติม
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function AstrologyChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "สวัสดีค่ะ ✨ ฉันคืออาจารย์ดาว\n\nพร้อมทำนายดวงชะตาให้คุณแล้ว 🌙\nบอกชื่อและเพศ (ชาย/หญิง) ได้เลยนะคะ หรือจะบอกวันเดือนปีเกิดมาเลยก็ได้ค่ะ จะได้ดูดวงได้แม่นยำยิ่งขึ้น ⭐" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("chat");
  const [selectedZodiac, setSelectedZodiac] = useState<typeof ZODIAC_SIGNS[0] | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState(0);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const today = new Date();
  const seed = getSeed(today);
  const moon = getMoonPhase(today);
  const luckyTimes = getLuckyTimes(today);
  const luckyNumbers = [((seed*7+3)%9)+1, ((seed*13+7)%9)+1, ((seed*17+11)%9)+1];
  const luckyColorIdx = seed % 7;
  const luckyColors = [
    { name: "ทอง",  hex: "#f59e0b" }, { name: "ม่วง", hex: "#a855f7" }, { name: "ฟ้า",  hex: "#3b82f6" },
    { name: "เขียว",hex: "#22c55e" }, { name: "ชมพู", hex: "#ec4899" }, { name: "แดง",  hex: "#ef4444" },
    { name: "ส้ม",  hex: "#f97316" },
  ];
  const lucky = luckyColors[luckyColorIdx];
  const energyValues = {
    love:   50 + ((seed * 3)  % 40),
    work:   45 + ((seed * 7)  % 45),
    money:  40 + ((seed * 11) % 45),
    health: 55 + ((seed * 5)  % 35),
    luck:   35 + ((seed * 9)  % 55),
  };

  const thaiMonths = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const todayThai = `${today.getDate()} ${thaiMonths[today.getMonth()]} ${today.getFullYear() + 543}`;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;
    const userMsg: Message = { role: "user", content: msg };
    setMessages(p => [...p, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      const data = await res.json();
      if (data.content) setMessages(p => [...p, { role: "assistant", content: data.content }]);
      else throw new Error();
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "ขออภัยค่ะ ดวงดาวขัดข้องชั่วคราว 🌙 ลองใหม่นะคะ" }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleZodiacSelect = (z: typeof ZODIAC_SIGNS[0]) => {
    setSelectedZodiac(z);
    setActiveTab("chat");
    sendMessage(`ฉันเป็นราศี${z.thai} (${z.en} ${z.symbol}) ${z.emoji} ช่วยดูดวงโดยรวมให้หน่อยได้ไหมคะ?`);
  };

  const handleBirthChart = async () => {
    if (!birthDate) return;
    const d = new Date(birthDate);
    const [h, mn] = birthTime ? birthTime.split(":").map(Number) : [12, 0];
    const city = THAI_CITIES[birthCity];
    setChartLoading(true);
    setChartError(null);
    setChartData(null);
    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(),
          hour: h, minute: mn, lat: city.lat, lon: city.lon,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setChartData(json as ChartData);
    } catch (e: unknown) {
      setChartError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setChartLoading(false);
    }
  };

  const copyLast = () => {
    const last = [...messages].reverse().find(m => m.role === "assistant");
    if (!last) return;
    navigator.clipboard.writeText(last.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "chat",   label: "💬 แชท" },
    { id: "birth",  label: "✨ ชาตา" },
    { id: "daily",  label: "🌙 วันนี้" },
    { id: "compat", label: "💕 คู่ดวง" },
    { id: "tarot",  label: "🃏 ทาโรต์" },
  ];

  return (
    <div className="flex flex-col bg-[#06000f]" style={{ height: "100dvh" }}>
      <StarField />

      {/* ── HEADER ── */}
      <header className="relative z-20 flex-shrink-0 border-b border-white/[0.06] backdrop-blur-2xl"
        style={{ background: "linear-gradient(180deg, rgba(6,0,15,0.95) 0%, rgba(12,4,30,0.90) 100%)" }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 min-w-0 flex-shrink-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/35 flex-shrink-0">🔮</div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#06000f] animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-semibold text-sm tracking-wide gold-text block leading-none">ดาวทำนาย</span>
              <span className="text-[9px] text-white/20 font-body tracking-widest uppercase">Thai Astrology AI</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl p-1 border border-white/[0.06] overflow-x-auto scrollbar-hide flex-1 max-w-md mx-auto"
            style={{ background: "rgba(139,92,246,0.06)" }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-display font-medium transition-all duration-200 whitespace-nowrap tracking-wide ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-amber-500/90 to-amber-600/90 text-black font-semibold shadow-md shadow-amber-500/20"
                    : "text-white/35 hover:text-white/65 hover:bg-white/[0.04]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Copy */}
          <button onClick={copyLast}
            className="flex-shrink-0 w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/35 hover:text-white/80 hover:border-white/20 transition-all text-xs font-display flex items-center justify-center gap-1.5">
            <span>{copied ? "✓" : "📋"}</span>
            <span className="hidden sm:inline tracking-wide">{copied ? "คัดลอกแล้ว" : "คัดลอก"}</span>
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden relative z-10 max-w-7xl mx-auto w-full">

        {/* LEFT SIDEBAR lg+ */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 border-r border-white/5 overflow-y-auto bg-black/10 p-4 gap-4">
          <div>
            <p className="text-white/20 text-[10px] uppercase tracking-widest font-mono mb-3">ราศีทั้ง 12</p>
            <div className="grid grid-cols-3 gap-1.5">
              {ZODIAC_SIGNS.map(z => (
                <button key={z.en} onClick={() => handleZodiacSelect(z)}
                  className={`group flex flex-col items-center gap-0.5 p-2 rounded-xl border transition-all duration-200 ${selectedZodiac?.en === z.en ? "border-amber-400/60 bg-amber-400/10 scale-105" : "border-white/5 bg-white/[0.02] hover:border-white/15 hover:scale-105"}`}>
                  <span className="text-base leading-none">{z.symbol}</span>
                  <span className="text-white/60 text-[10px] font-thai-serif">{z.thai}</span>
                </button>
              ))}
            </div>
          </div>
          <MoonPhaseWidget />
        </aside>

        {/* MAIN */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Mobile zodiac strip */}
          <div className="lg:hidden flex-shrink-0 px-3 py-2 border-b border-white/5 bg-black/20">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
              {ZODIAC_SIGNS.map(z => (
                <button key={z.en} onClick={() => handleZodiacSelect(z)}
                  className={`flex-shrink-0 snap-start flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl border transition-all ${selectedZodiac?.en === z.en ? "border-amber-400/60 bg-amber-400/10" : "border-white/5 bg-white/[0.03] active:scale-95"}`}>
                  <span className="text-base leading-none">{z.symbol}</span>
                  <span className="text-[9px] text-white/60 font-thai-serif">{z.thai}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── TAB: CHAT ── */}
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-5 pt-5 pb-2">
                {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>
              {messages.length <= 1 && (
                <div className="flex-shrink-0 px-3 sm:px-5 py-2">
                  <p className="text-white/18 text-[9px] uppercase tracking-[0.18em] font-display font-light mb-2.5">คำถามยอดนิยม</p>
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                    {QUICK_PROMPTS.map(p => (
                      <button key={p.label} onClick={() => sendMessage(p.text)}
                        className="flex-shrink-0 text-[11px] px-3.5 py-1.5 rounded-full border transition-all active:scale-95 font-display font-light tracking-wide"
                        style={{ borderColor:"rgba(139,92,246,0.22)", background:"rgba(139,92,246,0.06)", color:"rgba(196,181,253,0.65)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(251,191,36,0.38)"; (e.currentTarget as HTMLButtonElement).style.color="#fde68a"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor="rgba(139,92,246,0.22)"; (e.currentTarget as HTMLButtonElement).style.color="rgba(196,181,253,0.65)"; }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex-shrink-0 border-t border-white/[0.05] backdrop-blur-2xl px-3 sm:px-5 pt-3 pb-3"
                style={{ background:"linear-gradient(180deg, rgba(6,0,15,0) 0%, rgba(10,3,24,0.96) 100%)", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
                <div className="flex items-end gap-2 max-w-3xl mx-auto">
                  <textarea ref={textareaRef} value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    onInput={e => { const el = e.currentTarget; el.style.height="auto"; el.style.height=Math.min(el.scrollHeight,120)+"px"; }}
                    placeholder="ถามดวงดาวได้เลย... ✨" rows={1} disabled={isLoading}
                    className="input-glow flex-1 min-w-0 border rounded-2xl px-4 py-3 text-white placeholder-white/20 text-base sm:text-sm font-display font-light resize-none outline-none transition-all focus:border-amber-400/35 disabled:opacity-50 leading-relaxed"
                    style={{ maxHeight:"120px", background:"rgba(139,92,246,0.07)", borderColor:"rgba(139,92,246,0.22)" }} />
                  <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
                    className="w-11 h-11 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100">
                    {isLoading
                      ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>}
                  </button>
                </div>
                <p className="hidden sm:block text-center text-white/12 text-[10px] mt-2 font-display font-light tracking-widest">Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่</p>
              </div>
            </>
          )}

          {/* ── TAB: BIRTH ── */}
          {activeTab === "birth" && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              <div className="max-w-lg mx-auto">

                {/* Input form */}
                {!chartData && (
                  <>
                    <div className="text-center mb-6">
                      <div className="text-4xl mb-2 animate-[float_6s_ease-in-out_infinite]">🪐</div>
                      <h2 className="font-thai-serif text-2xl font-bold gold-text mb-1">ดวงชาตาแม่นยำ</h2>
                      <p className="text-white/40 text-xs font-thai-serif">คำนวณด้วย Swiss Ephemeris · Lahiri Sidereal · อันโตนาทีสามัญ</p>
                    </div>
                    <div className="space-y-3 mb-5">
                      <div>
                        <label className="block text-white/40 text-[10px] font-mono uppercase tracking-widest mb-2">วันเดือนปีเกิด</label>
                        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm outline-none focus:border-amber-400/50 transition-all [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="block text-white/40 text-[10px] font-mono uppercase tracking-widest mb-2">เวลาเกิด <span className="normal-case text-white/20">(ถ้าทราบ)</span></label>
                        <input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white text-base sm:text-sm outline-none focus:border-amber-400/50 transition-all [color-scheme:dark]" />
                      </div>
                      <div>
                        <label className="block text-white/40 text-[10px] font-mono uppercase tracking-widest mb-2">สถานที่เกิด</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {THAI_CITIES.map((c, i) => (
                            <button key={c.label} onClick={() => setBirthCity(i)}
                              className={`py-2 px-1 rounded-xl border text-[11px] font-thai-serif transition-all ${birthCity === i ? "border-amber-400/60 bg-amber-400/10 text-amber-300" : "border-white/5 bg-white/[0.02] text-white/50 hover:border-white/15"}` }>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {chartError && (
                      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 mb-4">
                        <p className="text-red-400 text-sm font-thai-serif">⚠️ {chartError}</p>
                      </div>
                    )}

                    <button onClick={handleBirthChart} disabled={!birthDate || chartLoading}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-thai-serif font-bold text-base shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                      {chartLoading
                        ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/><span>กำลังคำนวณตำแหน่งดาว...</span></>
                        : <><span>🪐</span><span>คำนวณดวงชาตาสวิสเซอร์ลันด์</span></>}
                    </button>

                    <div className="mt-6">
                      <p className="text-white/20 text-[10px] uppercase tracking-widest font-mono mb-3 text-center">หรือเลือกราศีเพื่อดูดวงด่วน</p>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {ZODIAC_SIGNS.map(z => (
                          <button key={z.en} onClick={() => handleZodiacSelect(z)}
                            className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl border transition-all ${selectedZodiac?.en === z.en ? "border-amber-400/60 bg-amber-400/10 scale-105" : "border-white/5 bg-white/[0.02] hover:border-white/15"}`}>
                            <span className="text-xl leading-none">{z.symbol}</span>
                            <span className="text-white/60 text-[10px] font-thai-serif">{z.thai}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Chart result */}
                {chartData && (
                  <>
                    <button onClick={() => setChartData(null)}
                      className="mb-4 flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm font-thai-serif">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                      กลับไปกรอกข้อมูล
                    </button>
                    <BirthChartView
                      data={chartData}
                      onAskAI={(msg) => { setActiveTab("chat"); sendMessage(msg); }}
                    />
                  </>
                )}

              </div>
            </div>
          )}

          {/* ── TAB: DAILY ── */}
          {activeTab === "daily" && (
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
              <div className="max-w-lg mx-auto space-y-4">
                <div className="text-center">
                  <p className="text-white/30 text-[10px] font-mono uppercase tracking-widest">พลังงานจักรวาลประจำวัน</p>
                  <p className="font-thai-serif text-2xl font-bold text-white mt-1">{todayThai}</p>
                </div>

                {/* Moon */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 flex items-center gap-4">
                  <span className="text-5xl">{moon.emoji}</span>
                  <div>
                    <p className="text-white/80 font-thai-serif font-semibold">{moon.thai}</p>
                    <p className="text-white/30 text-xs">{moon.name} · {moon.illumination}% illuminated</p>
                  </div>
                </div>

                {/* Energy */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                  <p className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-4">⚡ พลังงานจักรวาล</p>
                  <EnergyBar label="❤️ ความรัก" value={energyValues.love}   color="#ec4899" />
                  <EnergyBar label="💼 การงาน"  value={energyValues.work}   color="#f59e0b" />
                  <EnergyBar label="💰 การเงิน"  value={energyValues.money}  color="#22c55e" />
                  <EnergyBar label="💪 สุขภาพ"  value={energyValues.health} color="#06b6d4" />
                  <EnergyBar label="🍀 โชคลาภ"  value={energyValues.luck}   color="#a855f7" />
                </div>

                {/* Lucky */}
                <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-4">
                  <p className="text-amber-400/60 text-[10px] uppercase tracking-widest font-mono mb-4">✨ มงคลวันนี้</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-white/30 text-xs font-thai-serif mb-2">เลขมงคล</p>
                      <div className="flex gap-2">
                        {luckyNumbers.map((n,i) => (
                          <div key={i} className="w-9 h-9 rounded-xl border border-amber-400/30 bg-amber-400/10 flex items-center justify-center font-bold text-amber-300 font-mono">{n}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs font-thai-serif mb-2">สีมงคล</p>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl border border-white/10" style={{ background: lucky.hex }} />
                        <span className="text-white/60 font-thai-serif">{lucky.name}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs font-thai-serif mb-2">⏰ ฤกษ์มงคล</p>
                    <div className="flex flex-wrap gap-2">
                      {luckyTimes.map((t,i) => (
                        <span key={i} className="px-3 py-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-mono">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={() => { setActiveTab("chat"); sendMessage("ดูดวงประจำวันที่ " + todayThai + " ให้หน่อยได้ไหมคะ?"); }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-thai-serif font-semibold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  🌙 ขอคำทำนายวันนี้
                </button>
              </div>
            </div>
          )}

          {/* ── TAB: COMPAT ── */}
          {activeTab === "compat" && (
            <CompatibilityTab onReadingRequest={(msg) => { setActiveTab("chat"); sendMessage(msg); }} />
          )}

          {/* ── TAB: TAROT ── */}
          {activeTab === "tarot" && (
            <TarotTab onReadingRequest={(msg) => { setActiveTab("chat"); sendMessage(msg); }} />
          )}
        </main>

        {/* RIGHT SIDEBAR xl+ */}
        <aside className="hidden xl:flex flex-col w-56 2xl:w-64 flex-shrink-0 border-l border-white/5 p-5 gap-4 overflow-y-auto bg-black/10">
          <div>
            <p className="text-white/20 text-[10px] uppercase tracking-widest font-mono mb-3">พลังงานวันนี้</p>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
              <EnergyBar label="❤️ รัก"  value={energyValues.love}   color="#ec4899" />
              <EnergyBar label="💼 งาน"  value={energyValues.work}   color="#f59e0b" />
              <EnergyBar label="💰 เงิน" value={energyValues.money}  color="#22c55e" />
              <EnergyBar label="🍀 โชค"  value={energyValues.luck}   color="#a855f7" />
            </div>
          </div>
          <div className="rounded-2xl border border-amber-400/10 bg-amber-400/5 p-4">
            <p className="text-amber-400/60 text-[10px] uppercase tracking-widest font-mono mb-3">มงคลวันนี้</p>
            <div className="flex gap-1.5 mb-3">
              {luckyNumbers.map((n,i) => (
                <div key={i} className="w-8 h-8 rounded-xl border border-amber-400/30 bg-amber-400/10 flex items-center justify-center font-bold text-amber-300 text-sm font-mono">{n}</div>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-lg" style={{ background: lucky.hex }} />
              <span className="text-white/40 text-xs font-thai-serif">สี{lucky.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {luckyTimes.map((t,i) => (
                <span key={i} className="px-2 py-1 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[10px] font-mono">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
            <span className="text-3xl">{moon.emoji}</span>
            <div>
              <p className="text-white/60 text-xs font-thai-serif">{moon.thai}</p>
              <p className="text-white/25 text-[10px]">{moon.illumination}%</p>
            </div>
          </div>
          <button onClick={copyLast} className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white/40 hover:text-white hover:border-white/20 transition-all text-xs font-thai-serif">
            {copied ? "✓ คัดลอกแล้ว!" : "📋 คัดลอกคำทำนาย"}
          </button>
          <div className="mt-auto rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <p className="text-white/20 text-[10px] uppercase tracking-widest font-mono mb-2">คติประจำวัน</p>
            <p className="text-white/50 text-xs font-thai-serif leading-relaxed">"ดวงดาวไม่ได้กำหนดชะตา แต่เป็นแสงนำทางให้เราเลือก" ✨</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
