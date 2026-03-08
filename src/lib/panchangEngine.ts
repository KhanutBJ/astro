/**
 * panchangEngine.ts
 * Panchang (Thai/Vedic daily almanac), Muhurta (auspicious timing),
 * and Vimshottari Dasha calculations.
 * Pure TypeScript — Vercel edge-compatible.
 */

import { Body, GeoVector, Ecliptic, EclipticGeoMoon } from "astronomy-engine";

// ─── Internal helpers (duplicated to keep this file independent) ──────────────

function _jd(d: Date): number {
  const Y = d.getUTCFullYear(), M = d.getUTCMonth() + 1;
  const D = d.getUTCDate() + (d.getUTCHours() + d.getUTCMinutes() / 60) / 24;
  const A = Math.floor((14 - M) / 12), y = Y + 4800 - A, m = M + 12 * A - 3;
  return D + Math.floor((153 * m + 2) / 5) + 365 * y
       + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function _ayanamsa(d: Date): number {
  return 23.8532 + (_jd(d) - 2451545.0) / 365.25 * 0.013969;
}

function _sidLon(body: Body | "moon", d: Date): number {
  const trop = body === "moon"
    ? EclipticGeoMoon(d).lon
    : Ecliptic(GeoVector(body as Body, d, true)).elon;
  return ((trop - _ayanamsa(d)) % 360 + 360) % 360;
}

// ─── Tithi ────────────────────────────────────────────────────────────────────

const TITHI_NAMES = [
  "ปฐมา","ทุติยา","ตฤติยา","จตุรถี","ปัญจมี",
  "ษษฐี","สัปตมี","อัษฎมี","นวมี","ทศมี",
  "เอกาทศี","ทวาทศี","ตรโยทศี","จตุรทศี","ปูรณิมา/อมาวาสยา",
];
const TITHI_GOOD = new Set([2, 3, 5, 7, 10, 11, 12, 13, 15]);

export interface TithiResult {
  number: number;   // 1-30
  name: string;
  paksha: string;   // ขึ้น / แรม
  good: boolean;
}

function calcTithi(moonLon: number, sunLon: number): TithiResult {
  const diff = ((moonLon - sunLon) + 360) % 360;
  const num = Math.floor(diff / 12) + 1; // 1-30
  const local = ((num - 1) % 15) + 1;   // 1-15
  return {
    number: num,
    name: TITHI_NAMES[local - 1],
    paksha: num <= 15 ? "ขึ้น" : "แรม",
    good: TITHI_GOOD.has(local),
  };
}

// ─── Yoga ─────────────────────────────────────────────────────────────────────

export const YOGA_NAMES = [
  "วิษกุมภะ","ปรีติ","อายุษมาน","เสาภาคยะ","โศภนะ",
  "อติกัณฑะ","สุกรมะ","ธฤติ","ศูละ","คัณฑะ",
  "วฤทธิ","ธรุวะ","วยาฆาตะ","หรษณะ","วัชระ",
  "สิทธิ","วยาติปาตะ","วรียาน","ปริฆะ","ศิวะ",
  "สิทธะ","สาธยะ","ศุภะ","ศุกละ","พรหมะ","มาเหนทระ","วัยธฤติ",
];
const YOGA_BAD = new Set([0, 5, 8, 9, 12, 14, 16, 18, 26]);

export interface YogaResult { idx: number; name: string; good: boolean }

function calcYoga(moonLon: number, sunLon: number): YogaResult {
  const sum = ((moonLon + sunLon) % 360 + 360) % 360;
  const idx = Math.floor(sum / (360 / 27)) % 27;
  return { idx, name: YOGA_NAMES[idx], good: !YOGA_BAD.has(idx) };
}

// ─── Nakshatra ────────────────────────────────────────────────────────────────

const NAKSHATRA_TH = [
  "อัศวินี","ภรณี","กฤติกา","โรหิณี","มฤคศิร","อารทรา",
  "ปุนัพสุ","บุษยะ","อาศเลษา","มาฆะ","บุรพผลคุนี","อุตรผลคุนี",
  "หัสตะ","จิตรา","สวาตี","วิสาขะ","อนุราธะ","เชษฐา",
  "มูละ","บุรพษาฒ","อุตราษาฒ","ศรวณะ","ธนิษฐา","ศตภิษัช",
  "บุรพภัทรบท","อุตรภัทรบท","เรวดี",
];
// 0=fixed/ธรุวะ(long-term), 1=movable/จร(travel), 2=dual/อุภย, 3=fierce/อุคระ(avoid)
const NAKSHATRA_TYPE = [
  2,3,0,0,2,3,2,0,3,3,3,0,2,2,2,0,0,3,3,2,0,2,0,2,0,0,2,
];
const TYPE_LABEL = ["ธรุวะ (มั่นคง)","จร (เคลื่อนไหว)","อุภย (ผสม)","อุคระ (หลีกเลี่ยง)"];

export interface NakshatraResult {
  idx: number; name: string; type: number; typeLabel: string; pada: number;
}

function calcNakshatra(moonLon: number): NakshatraResult {
  const span = 360 / 27;
  const idx = Math.min(Math.floor(moonLon / span), 26);
  const pada = Math.floor((moonLon % span) / (span / 4)) + 1;
  const type = NAKSHATRA_TYPE[idx];
  return { idx, name: NAKSHATRA_TH[idx], type, typeLabel: TYPE_LABEL[type], pada };
}

// ─── Karana ───────────────────────────────────────────────────────────────────

const KARANA_NAMES = [
  "บว","พาลว","เกาลว","ไตติล","คร","วณิ","วิษฏิ(ภัทร)", // 7 movable
  "ศกุนิ","จตุษบาท","นาค","กิมสตุฆน",                  // 4 fixed
];

export interface KaranaResult { name: string; isBhadra: boolean }

function calcKarana(moonLon: number, sunLon: number): KaranaResult {
  const diff = ((moonLon - sunLon) + 360) % 360;
  const k = Math.floor(diff / 6); // 0-59
  let idx: number;
  if (k < 1) idx = 10;
  else if (k >= 57) idx = 7 + (k - 57);
  else idx = (k - 1) % 7;
  return { name: KARANA_NAMES[Math.min(idx, 10)], isBhadra: idx === 6 };
}

// ─── Vara (weekday) ───────────────────────────────────────────────────────────

const VARA_TH = ["อาทิตย์","จันทร์","อังคาร","พุธ","พฤหัส","ศุกร์","เสาร์"];
// 3=auspicious, 2=medium, 1=avoid (traditional Jyotish classification)
const VARA_QUALITY = [2, 3, 1, 3, 3, 3, 2];

export interface VaraResult { name: string; quality: number }

// ─── Full Panchang ────────────────────────────────────────────────────────────

export interface PanchangResult {
  tithi: TithiResult;
  nakshatra: NakshatraResult;
  yoga: YogaResult;
  karana: KaranaResult;
  vara: VaraResult;
  moonLon: number;
  sunLon: number;
  score: number; // 0-100 auspiciousness
}

export function calculatePanchang(date: Date): PanchangResult {
  const moonLon = _sidLon("moon", date);
  const sunLon  = _sidLon(Body.Sun, date);

  const tithi    = calcTithi(moonLon, sunLon);
  const nakshatra = calcNakshatra(moonLon);
  const yoga     = calcYoga(moonLon, sunLon);
  const karana   = calcKarana(moonLon, sunLon);
  const vara     = { name: VARA_TH[date.getDay()], quality: VARA_QUALITY[date.getDay()] };

  let score = 50;
  if (tithi.good) score += 15;
  if (yoga.good)  score += 15;
  score += [10, 8, 5, -10][nakshatra.type] ?? 5;
  if (!karana.isBhadra) score += 5;
  score += vara.quality === 3 ? 5 : vara.quality === 2 ? 2 : -5;
  score = Math.max(0, Math.min(100, score));

  return { tithi, nakshatra, yoga, karana, vara, moonLon, sunLon, score };
}

// ─── Muhurta — Auspicious Slot Finder ────────────────────────────────────────

export interface MuhurtaSlot {
  date: string;       // YYYY-MM-DD
  startHour: number;
  endHour: number;
  score: number;
  tithi: string;
  nakshatra: string;
  yoga: string;
  vara: string;
  reasons: string[];
  quality: "ดีมาก" | "ดี" | "พอใช้";
}

export function findAuspiciousSlots(startDate: Date, days = 7): MuhurtaSlot[] {
  const slots: MuhurtaSlot[] = [];

  for (let d = 0; d < days; d++) {
    // Check every 2 hours during daytime
    for (let h = 6; h <= 20; h += 2) {
      const dt = new Date(Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate() + d,
        h, 0, 0, 0,
      ));

      const p = calculatePanchang(dt);
      if (p.score < 65) continue;

      const reasons: string[] = [];
      if (p.tithi.good) reasons.push(`ติถิ ${p.tithi.paksha} ${p.tithi.name}`);
      if (p.yoga.good)  reasons.push(`โยคะ ${p.yoga.name}`);
      if (p.nakshatra.type === 0) reasons.push(`นักษัตร ${p.nakshatra.name} (มั่นคง)`);
      if (p.nakshatra.type === 1) reasons.push(`นักษัตร ${p.nakshatra.name} (เดินทางดี)`);
      if (!p.karana.isBhadra) reasons.push("กรณะไม่มีภัทร");

      // Look-ahead: does the next 2h block also pass?
      const dt2 = new Date(dt.getTime() + 2 * 3600 * 1000);
      const p2 = calculatePanchang(dt2);
      const endH = p2.score >= 60 ? h + 4 : h + 2;

      const dateStr = dt.toISOString().slice(0, 10);
      const quality: MuhurtaSlot["quality"] = p.score >= 85 ? "ดีมาก" : p.score >= 75 ? "ดี" : "พอใช้";

      slots.push({
        date: dateStr,
        startHour: h,
        endHour: Math.min(endH, 22),
        score: p.score,
        tithi: `${p.tithi.paksha} ${p.tithi.name}`,
        nakshatra: `${p.nakshatra.name} บาทที่ ${p.nakshatra.pada}`,
        yoga: p.yoga.name,
        vara: p.vara.name,
        reasons,
        quality,
      });
    }
  }

  return slots.sort((a, b) => b.score - a.score).slice(0, 21);
}

// ─── Vimshottari Dasha ────────────────────────────────────────────────────────

export const VIMSHOTTARI = [
  { planet: "เกตุ",      en: "Ketu",    emoji: "🟣", color: "#a78bfa", years: 7  },
  { planet: "ศุกร์",     en: "Venus",   emoji: "💗", color: "#ec4899", years: 20 },
  { planet: "อาทิตย์",  en: "Sun",     emoji: "☀️", color: "#f59e0b", years: 6  },
  { planet: "จันทร์",   en: "Moon",    emoji: "🌙", color: "#94a3b8", years: 10 },
  { planet: "อังคาร",   en: "Mars",    emoji: "🔴", color: "#ef4444", years: 7  },
  { planet: "ราหู",     en: "Rahu",    emoji: "🌑", color: "#8b5cf6", years: 18 },
  { planet: "พฤหัสบดี", en: "Jupiter", emoji: "🟠", color: "#f97316", years: 16 },
  { planet: "เสาร์",    en: "Saturn",  emoji: "🔵", color: "#6366f1", years: 19 },
  { planet: "พุธ",      en: "Mercury", emoji: "🟢", color: "#22c55e", years: 17 },
];

// lord index for each nakshatra (repeating cycle of 9, starting from Ketu)
const NAKSHATRA_LORD = Array.from({length: 27}, (_, i) => i % 9);

export interface AntarDasha {
  planet: string; en: string; color: string; emoji: string;
  start: string; end: string; isCurrent: boolean;
}
export interface MahaDasha {
  planet: string; en: string; color: string; emoji: string;
  start: string; end: string; isCurrent: boolean;
  yearsTotal: number;
  antardasha: AntarDasha[];
}

export function calculateVimshottariDasha(moonSiderealLon: number, birthDate: Date): MahaDasha[] {
  const span = 360 / 27;
  const nIdx = Math.min(Math.floor(moonSiderealLon / span), 26);
  const lordIdx = NAKSHATRA_LORD[nIdx];
  const fracElapsed = (moonSiderealLon % span) / span;

  const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;
  const now = new Date();

  // Cursor set to start-of-birth-dasha (accounting for already-elapsed fraction)
  let cursor = new Date(
    birthDate.getTime() - fracElapsed * VIMSHOTTARI[lordIdx].years * MS_PER_YEAR
  );

  const periods: MahaDasha[] = [];
  const cutoff = new Date(birthDate.getTime() + 120 * MS_PER_YEAR);

  for (let i = 0; i < 9 * 3 && cursor < cutoff; i++) {
    const md = VIMSHOTTARI[(lordIdx + i) % 9];
    const mdEnd = new Date(cursor.getTime() + md.years * MS_PER_YEAR);
    const isCurrent = cursor <= now && now < mdEnd;

    // Only include periods inside the person's 120-year window
    if (mdEnd > birthDate) {
      // Antardasha (compute for current + next 2 dashas)
      const antardasha: AntarDasha[] = [];
      if (i < 12) {
        let adCursor = new Date(cursor);
        for (let j = 0; j < 9; j++) {
          const ad = VIMSHOTTARI[(lordIdx + i + j) % 9];
          const adMs = (md.years * ad.years / 120) * MS_PER_YEAR;
          const adEnd = new Date(adCursor.getTime() + adMs);
          antardasha.push({
            planet: ad.planet, en: ad.en, color: ad.color, emoji: ad.emoji,
            start: adCursor.toISOString().slice(0, 10),
            end: adEnd.toISOString().slice(0, 10),
            isCurrent: adCursor <= now && now < adEnd,
          });
          adCursor = adEnd;
        }
      }

      periods.push({
        planet: md.planet, en: md.en, color: md.color, emoji: md.emoji,
        start: (cursor > birthDate ? cursor : birthDate).toISOString().slice(0, 10),
        end: mdEnd.toISOString().slice(0, 10),
        isCurrent,
        yearsTotal: md.years,
        antardasha,
      });
    }

    cursor = mdEnd;
  }

  return periods;
}
