/**
 * thaiAstroEngine.ts
 * Pure-TypeScript Thai astrology calculator (replaces Python/Swiss Ephemeris subprocess).
 * Uses astronomy-engine for planetary positions (no native bindings → Vercel compatible).
 * Implements Lahiri sidereal mode, อันโตนาทีสามัญ lagna, ทักษา, dignities, aspects.
 */

import { Body, GeoVector, Ecliptic, EclipticGeoMoon } from "astronomy-engine";

// ─── Reference data ──────────────────────────────────────────────────────────

export const ZODIAC_FULL = ["เมษ","พฤษภ","มิถุน","กรกฎ","สิงห์","กันย์","ตุลย์","พิจิก","ธนู","มังกร","กุมภ์","มีน"];
export const ZODIAC_ABBR = ["มษ","พภ","มถ","กฎ","สห","กน","ตล","พจ","ธน","มก","กภ","มน"];
export const ZODIAC_EN   = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
export const ZODIAC_SYM  = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
export const HOUSES_THAI = ["ตนุ","กดุมภะ","สหัชชะ","พันธุ","ปุตตะ","อริ","ปัตนิ","มรณะ","สุภะ","กัมมะ","ลาภะ","วินาศ"];
export const HOUSES_EN   = ["Tanu","Kutumba","Sahajja","Bandhu","Puttra","Ari","Patni","Marana","Subha","Kamma","Labha","Vinasa"];

export const NAKSHATRAS = [
  "อัศวินี","ภรณี","กฤติกา","โรหิณี","มฤคศิร","อารทรา","ปุนัพสุ","บุษยะ",
  "อาศเลษา","มาฆะ","บุรพผลคุนี","อุตรผลคุนี","หัสตะ","จิตรา","สวาตี","วิสาขะ",
  "อนุราธะ","เชษฐา","มูละ","บุรพษาฒ","อุตราษาฒ","ศรวณะ","ธนิษฐา","ศตภิษัช",
  "บุรพภัทรบท","อุตรภัทรบท","เรวดี",
];

const PLANET_KEYS  = ["๑.อาทิตย์","๒.จันทร์","๓.อังคาร","๔.พุธ","๕.พฤหัสบดี","๖.ศุกร์","๗.เสาร์","๘.ราหู","๙.เกตุ","๐.มฤตยู"];
const PLANET_SHORT: Record<string,string> = {
  "๑.อาทิตย์":"อา","๒.จันทร์":"จ","๓.อังคาร":"อง","๔.พุธ":"พ",
  "๕.พฤหัสบดี":"พฤ","๖.ศุกร์":"ศ","๗.เสาร์":"สา","๘.ราหู":"รา",
  "๙.เกตุ":"เก","๐.มฤตยู":"มฤ",
};
const PLANET_EN: Record<string,string> = {
  "๑.อาทิตย์":"Sun","๒.จันทร์":"Moon","๓.อังคาร":"Mars","๔.พุธ":"Mercury",
  "๕.พฤหัสบดี":"Jupiter","๖.ศุกร์":"Venus","๗.เสาร์":"Saturn","๘.ราหู":"Rahu",
  "๙.เกตุ":"Ketu","๐.มฤตยู":"Uranus",
};
const PLANET_COLORS: Record<string,string> = {
  "๑.อาทิตย์":"#f59e0b","๒.จันทร์":"#94a3b8","๓.อังคาร":"#ef4444","๔.พุธ":"#22c55e",
  "๕.พฤหัสบดี":"#f97316","๖.ศุกร์":"#ec4899","๗.เสาร์":"#6366f1","๘.ราหู":"#8b5cf6",
  "๙.เกตุ":"#a78bfa","๐.มฤตยู":"#06b6d4",
};

// Maps planet key → astronomy-engine Body (null = derived)
const PLANET_BODY: Record<string, Body | "moon" | "rahu" | "ketu"> = {
  "๑.อาทิตย์": Body.Sun,
  "๒.จันทร์":  "moon",
  "๓.อังคาร":  Body.Mars,
  "๔.พุธ":     Body.Mercury,
  "๕.พฤหัสบดี":Body.Jupiter,
  "๖.ศุกร์":  Body.Venus,
  "๗.เสาร์":  Body.Saturn,
  "๘.ราหู":   "rahu",
  "๙.เกตุ":   "ketu",
  "๐.มฤตยู":  Body.Uranus,
};

const STD_MEANINGS: Record<string,{en:string;color:string;strength:number}> = {
  "อุจจ์":        {en:"Exalted",         color:"#f59e0b", strength:5},
  "เกษตร":        {en:"Domicile",        color:"#22c55e", strength:4},
  "ราชาโชค":      {en:"Raja Yoga",       color:"#a855f7", strength:3},
  "-":            {en:"Neutral",         color:"#94a3b8", strength:2},
  "ประ":          {en:"Fall",            color:"#64748b", strength:1},
  "นิจ":          {en:"Debilitated",     color:"#ef4444", strength:0},
  "อุจจ์/เกษตร": {en:"Exalted+Domicile",color:"#fbbf24", strength:5},
  "นิจ/ประ":      {en:"Debilitated+Fall",color:"#f87171", strength:0},
};

const ASPECT_COLORS: Record<string,string> = {
  Kum:"#fbbf24", Leng:"#ef4444", Yoke:"#3b82f6", Chak:"#f97316", Trikon:"#22c55e",
};
const ASPECT_THAI: Record<string,string> = {
  Kum:"กุม", Leng:"เล็ง", Yoke:"โยค", Chak:"ฉาก", Trikon:"ตรีโกณ",
};

// ─── Lahiri Ayanamsa ─────────────────────────────────────────────────────────
// Accurate Lahiri (Chitrapaksha) ayanamsa formula.
// Reference: ~23.8532° at J2000.0  Rate: 50.2897″/year = 0.013969°/year
function lahiriAyanamsa(utcDate: Date): number {
  const jd = dateToJD(utcDate);
  const T_years = (jd - 2451545.0) / 365.25;
  return 23.8532 + T_years * 0.013969;
}

// ─── Julian Day ──────────────────────────────────────────────────────────────
function dateToJD(d: Date): number {
  // Standard JD formula for Gregorian calendar
  const Y = d.getUTCFullYear();
  const M = d.getUTCMonth() + 1;
  const D = d.getUTCDate() + (d.getUTCHours() + d.getUTCMinutes() / 60) / 24;
  const A = Math.floor((14 - M) / 12);
  const y = Y + 4800 - A;
  const m = M + 12 * A - 3;
  return D + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
       - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// ─── Mean Lunar Node (Rahu) ──────────────────────────────────────────────────
// Jean Meeus "Astronomical Algorithms" Ch.47 — accurate to ~0.05°
function meanLunarNode(utcDate: Date): number {
  const jd = dateToJD(utcDate);
  const T = (jd - 2451545.0) / 36525.0; // Julian centuries
  let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  omega = ((omega % 360) + 360) % 360;
  return omega;
}

// ─── Timezone offset → UTC date ──────────────────────────────────────────────
function toUTC(year: number, month: number, day: number, hour: number, minute: number, tz: string): Date {
  // For Thailand (Asia/Bangkok = UTC+7), other common offsets supported
  const tzOffsets: Record<string, number> = {
    "Asia/Bangkok":    7,  "Asia/Colombo":     5.5, "Asia/Kolkata":     5.5,
    "Asia/Karachi":    5,  "Asia/Dubai":       4,   "Asia/Tehran":      3.5,
    "Asia/Riyadh":     3,  "Europe/Istanbul":  3,   "Europe/Moscow":    3,
    "Europe/Paris":    1,  "Europe/London":    0,   "America/New_York": -5,
    "America/Chicago": -6, "America/Denver":   -7,  "America/Los_Angeles": -8,
    "Asia/Tokyo":      9,  "Asia/Seoul":       9,   "Australia/Sydney": 10,
  };
  const offsetH = tzOffsets[tz] ?? 7;
  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - offsetH * 3600 * 1000;
  return new Date(utcMs);
}

// ─── Planet sidereal longitude ────────────────────────────────────────────────
function getPlanetSiderealLon(pKey: string, utcDate: Date, rahuTropLon: number): number {
  const body = PLANET_BODY[pKey];
  let tropLon: number;

  if (body === "moon") {
    // EclipticGeoMoon returns Spherical { lat, lon, dist }
    tropLon = EclipticGeoMoon(utcDate).lon;
  } else if (body === "rahu") {
    tropLon = rahuTropLon;
  } else if (body === "ketu") {
    tropLon = (rahuTropLon + 180) % 360;
  } else {
    // GeoVector gives geocentric equatorial J2000 → convert to ecliptic
    const vec = GeoVector(body as Body, utcDate, true);
    tropLon = Ecliptic(vec).elon;
  }

  const ayan = lahiriAyanamsa(utcDate);
  return ((tropLon - ayan) % 360 + 360) % 360;
}

// ─── Nakshatra label ─────────────────────────────────────────────────────────
function nakshatraLabel(lon: number): string {
  const span = 360 / 27;
  const pada_span = span / 4;
  const idx = Math.floor(lon / span);
  const pada = Math.floor((lon % span) / pada_span) + 1;
  return `${NAKSHATRAS[Math.min(idx, 26)]} บาทที่ ${pada}`;
}

// ─── Triyang / Nawang ────────────────────────────────────────────────────────
function treyang(rawLon: number): string {
  const sIdx = Math.floor(rawLon / 30);
  const degInSign = rawLon % 30;
  return ZODIAC_ABBR[(sIdx + (Math.floor(degInSign / 10) * 4)) % 12];
}
function nawang(rawLon: number): string {
  return ZODIAC_ABBR[Math.floor(rawLon / (360 / 108)) % 12];
}

// ─── Dignity (มาตรฐาน) ───────────────────────────────────────────────────────
const STD_TABLE: Record<string, Record<string, string>> = {
  "๑.อาทิตย์": {เมษ:"อุจจ์",สิงห์:"เกษตร",ตุลย์:"นิจ",กุมภ์:"ประ"},
  "๒.จันทร์":  {พฤษภ:"อุจจ์",กรกฎ:"เกษตร",พิจิก:"นิจ",มังกร:"ประ",กันย์:"ราชาโชค"},
  "๓.อังคาร":  {มังกร:"อุจจ์",เมษ:"เกษตร",พิจิก:"เกษตร",กรกฎ:"นิจ",ตุลย์:"ประ",พฤษภ:"ประ"},
  "๔.พุธ":     {กันย์:"อุจจ์/เกษตร",มิถุน:"เกษตร",มีน:"นิจ/ประ",ธนู:"ประ",สิงห์:"ราชาโชค"},
  "๕.พฤหัสบดี":{กรกฎ:"อุจจ์",ธนู:"เกษตร",มีน:"เกษตร",มังกร:"นิจ",มิถุน:"ประ",กันย์:"ประ",เมษ:"ราชาโชค"},
  "๖.ศุกร์":  {มีน:"อุจจ์",พฤษภ:"เกษตร",ตุลย์:"เกษตร",กันย์:"นิจ",พิจิก:"ประ",เมษ:"ประ"},
  "๗.เสาร์":  {ตุลย์:"อุจจ์",มังกร:"เกษตร",กุมภ์:"เกษตร",เมษ:"นิจ",กรกฎ:"ประ",สิงห์:"ประ",พิจิก:"ราชาโชค"},
  "๘.ราหู":   {พิจิก:"อุจจ์",กุมภ์:"เกษตร",พฤษภ:"นิจ",สิงห์:"ประ"},
};
function getStandard(pKey: string, sign: string): string {
  return STD_TABLE[pKey]?.[sign] ?? "-";
}

// ─── Taksa ───────────────────────────────────────────────────────────────────
const TAKSA_SEQ   = ["๑.อาทิตย์","๒.จันทร์","๓.อังคาร","๔.พุธ","๗.เสาร์","๕.พฤหัสบดี","๘.ราหู","๖.ศุกร์"];
const TAKSA_ROLES = ["บริวาร","อายุ","เดช","ศรี","มูละ","อุตสาหะ","มนตรี","กาลกิณี"];
const DAY_MAP: Record<string,number> = {
  sunday:0, monday:1, tuesday:2, wednesday:3, saturday:4, thursday:5, wednesday_night:6, friday:7,
};
function getTaksa(dowKey: string): Record<string,string> {
  const start = DAY_MAP[dowKey] ?? 0;
  const out: Record<string,string> = {};
  for (let i = 0; i < 8; i++) out[TAKSA_SEQ[(start + i) % 8]] = TAKSA_ROLES[i];
  return out;
}

// ─── Lagna (อันโตนาทีสามัญ) ─────────────────────────────────────────────────
function calcLagna(
  year: number, month: number, day: number,
  hour: number, minute: number, tz: string,
  sunLon: number   // sidereal Sun longitude for birth time
): { absLon: number; signIdx: number } {
  // Find sunrise UTC by approximating it as 06:20 (winter) or 06:00 (other months)
  const isWinter = month === 11 || month === 12 || month === 1;
  const srH = 6, srM = isWinter ? 20 : 0;

  // If birth is before 06:00, use previous day's sunrise
  let srDay = day, srMonth = month, srYear = year;
  if (hour < 6) {
    const prev = new Date(Date.UTC(year, month - 1, day) - 86400000);
    srYear = prev.getUTCFullYear();
    srMonth = prev.getUTCMonth() + 1;
    srDay = prev.getUTCDate();
  }
  const sunriseUTC = toUTC(srYear, srMonth, srDay, srH, srM, tz);
  const sunAtSunrise = getPlanetSiderealLon("๑.อาทิตย์", sunriseUTC, 0);
  const sunSign = Math.floor(sunAtSunrise / 30);
  const degInSign = sunAtSunrise % 30;

  // อันโตนาที durations per sign (minutes per sign)
  const anto = [116, 122, 132, 132, 122, 116, 116, 122, 132, 132, 122, 116];

  const birthMins = hour * 60 + minute;
  const srMins = srH * 60 + srM;
  const elapsed = ((birthMins - srMins) % 1440 + 1440) % 1440;

  const timeRem = ((30 - degInSign) / 30) * anto[sunSign];
  let cur = sunSign;
  let lagnaAbsDeg: number;

  if (elapsed <= timeRem) {
    lagnaAbsDeg = sunSign * 30 + degInSign + (elapsed / anto[cur]) * 30;
  } else {
    let rem = elapsed - timeRem;
    cur = (cur + 1) % 12;
    while (rem > anto[cur]) {
      rem -= anto[cur];
      cur = (cur + 1) % 12;
    }
    lagnaAbsDeg = cur * 30 + (rem / anto[cur]) * 30;
  }

  return { absLon: lagnaAbsDeg % 360, signIdx: Math.floor((lagnaAbsDeg % 360) / 30) };
}

// ─── Main Chart Generator ─────────────────────────────────────────────────────

export interface ChartInput {
  year: number; month: number; day: number;
  hour?: number; minute?: number;
  lat?: number; lon?: number; tz?: string;
}

export function generateChart(inp: ChartInput) {
  const { year, month, day, hour = 12, minute = 0, lat = 13.7563, lon = 100.5018, tz = "Asia/Bangkok" } = inp;

  const utcDate = toUTC(year, month, day, hour, minute, tz);

  // Day of week (local)
  const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const dow = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][localDate.getUTCDay()];
  const dowKey = dow === "wednesday" && hour >= 18 ? "wednesday_night" : dow;

  const taksa = getTaksa(dowKey);

  // Rahu tropical lon (needed before sidereal calc)
  const rahuTropLon = meanLunarNode(utcDate);

  // Planet sidereal longitudes
  const siderealLons: Record<string,number> = {};
  for (const pKey of PLANET_KEYS) {
    siderealLons[pKey] = getPlanetSiderealLon(pKey, utcDate, rahuTropLon);
  }

  // Lagna
  const sunSidLon = siderealLons["๑.อาทิตย์"];
  const lagnaCalc = calcLagna(year, month, day, hour, minute, tz, sunSidLon);
  const ascSign = lagnaCalc.signIdx;

  // Build raw planet data
  type PlanetRaw = {
    raw_lon: number; sign: string; sign_idx: number; pos: string;
    house: string; house_idx: number;
    treyang_s: string; nawang_s: string; nakshatra: string;
    taksa_r: string; std: string;
  };
  const rawData: Record<string, PlanetRaw> = {};
  const signIndices: Record<string, number> = {};

  for (const pKey of PLANET_KEYS) {
    const lon_deg = siderealLons[pKey];
    const sIdx = Math.floor(lon_deg / 30);
    const degRaw = lon_deg % 30;
    const deg = Math.floor(degRaw);
    const mins = Math.floor((degRaw * 60) % 60);
    signIndices[pKey] = sIdx;
    rawData[pKey] = {
      raw_lon:   lon_deg,
      sign:      ZODIAC_FULL[sIdx],
      sign_idx:  sIdx,
      pos:       `${String(deg).padStart(2,"0")}°${String(mins).padStart(2,"0")}'`,
      house:     HOUSES_THAI[(sIdx - ascSign + 12) % 12],
      house_idx: (sIdx - ascSign + 12) % 12,
      treyang_s: treyang(lon_deg),
      nawang_s:  nawang(lon_deg),
      nakshatra: nakshatraLabel(lon_deg),
      taksa_r:   taksa[pKey] ?? "-",
      std:       getStandard(pKey, ZODIAC_FULL[sIdx]),
    };
  }

  // Aspects (sign-level)
  type Aspects = { Kum:string[]; Leng:string[]; Yoke:string[]; Chak:string[]; Trikon:string[] };
  const aspects: Record<string, Aspects> = {};
  for (const p of PLANET_KEYS) aspects[p] = {Kum:[],Leng:[],Yoke:[],Chak:[],Trikon:[]};

  for (let i = 0; i < PLANET_KEYS.length; i++) {
    for (let j = i + 1; j < PLANET_KEYS.length; j++) {
      const p1 = PLANET_KEYS[i], p2 = PLANET_KEYS[j];
      let dist = Math.abs(signIndices[p1] - signIndices[p2]);
      if (dist > 6) dist = 12 - dist;
      const s1 = PLANET_SHORT[p1], s2 = PLANET_SHORT[p2];
      if (dist === 0)              { aspects[p1].Kum.push(s2);    aspects[p2].Kum.push(s1); }
      else if (dist === 6)         { aspects[p1].Leng.push(s2);   aspects[p2].Leng.push(s1); }
      else if (dist === 2 || dist === 10) { aspects[p1].Yoke.push(s2); aspects[p2].Yoke.push(s1); }
      else if (dist === 3 || dist === 9)  { aspects[p1].Chak.push(s2); aspects[p2].Chak.push(s1); }
      else if (dist === 4 || dist === 8)  { aspects[p1].Trikon.push(s2); aspects[p2].Trikon.push(s1); }
    }
  }

  // Assemble planet list
  const planets = PLANET_KEYS.map((pKey) => {
    const d = rawData[pKey];
    const a = aspects[pKey];
    const std = d.std;
    const stdInfo = STD_MEANINGS[std] ?? STD_MEANINGS["-"];
    return {
      name: pKey,
      short: PLANET_SHORT[pKey],
      en: PLANET_EN[pKey],
      color: PLANET_COLORS[pKey],
      sign: d.sign,
      sign_idx: d.sign_idx,
      raw_lon: Math.round(d.raw_lon * 10000) / 10000,
      deg_in_sign: Math.round((d.raw_lon % 30) * 10000) / 10000,
      pos: d.pos,
      house: d.house,
      house_idx: d.house_idx,
      treyang: d.treyang_s,
      nawang: d.nawang_s,
      nakshatra: d.nakshatra,
      taksa: d.taksa_r,
      std,
      std_strength: stdInfo.strength,
      std_color: stdInfo.color,
      std_en: stdInfo.en,
      aspects: { Kum: a.Kum, Leng: a.Leng, Yoke: a.Yoke, Chak: a.Chak, Trikon: a.Trikon },
    };
  });

  // Aspect pairs for drawing
  const aspect_pairs: Array<{p1:string;p2:string;p1_lon:number;p2_lon:number;type:string;color:string;label:string}> = [];
  for (const p of planets) {
    for (const [aspType, partners] of Object.entries(p.aspects)) {
      for (const partnerShort of partners) {
        const partner = planets.find(x => x.short === partnerShort);
        if (partner && p.name < partner.name) {
          aspect_pairs.push({
            p1: p.short, p2: partnerShort,
            p1_lon: p.raw_lon, p2_lon: partner.raw_lon,
            type: aspType,
            color: ASPECT_COLORS[aspType],
            label: ASPECT_THAI[aspType],
          });
        }
      }
    }
  }

  // Lagna object
  const lagnaAbs = lagnaCalc.absLon;
  const lagnaSign = Math.floor(lagnaAbs / 30);
  const lagnaDegIn = lagnaAbs % 30;
  const lagna = {
    sign: ZODIAC_FULL[lagnaSign],
    sign_idx: lagnaSign,
    sign_en: ZODIAC_EN[lagnaSign],
    sign_sym: ZODIAC_SYM[lagnaSign],
    raw_lon: Math.round(lagnaAbs * 10000) / 10000,
    deg_in_sign: Math.round(lagnaDegIn * 10000) / 10000,
    pos: `${String(Math.floor(lagnaDegIn)).padStart(2,"0")}°${String(Math.floor((lagnaDegIn * 60) % 60)).padStart(2,"0")}'`,
    nakshatra: nakshatraLabel(lagnaAbs),
    treyang: treyang(lagnaAbs),
    nawang: nawang(lagnaAbs),
  };

  // Houses
  const houses = Array.from({length: 12}, (_, hIdx) => ({
    idx: hIdx,
    name: HOUSES_THAI[hIdx],
    name_en: HOUSES_EN[hIdx],
    sign: ZODIAC_FULL[(ascSign + hIdx) % 12],
    sign_idx: (ascSign + hIdx) % 12,
    sign_sym: ZODIAC_SYM[(ascSign + hIdx) % 12],
    occupants: planets.filter(p => p.house_idx === hIdx).map(p => p.short),
  }));

  // Avg strength
  const avg_strength = Math.round(
    planets.reduce((s, p) => s + p.std_strength, 0) / planets.length * 100
  ) / 100;

  return {
    lagna,
    planets,
    aspect_pairs,
    houses,
    avg_strength,
    meta: { year, month, day, hour, minute, lat, lon, day_of_week: dowKey },
    reference: {
      zodiac_full: ZODIAC_FULL,
      zodiac_sym: ZODIAC_SYM,
      houses_thai: HOUSES_THAI,
      aspect_colors: ASPECT_COLORS,
      aspect_thai: ASPECT_THAI,
    },
  };
}
