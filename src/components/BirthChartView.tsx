"use client";
import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────
export interface Planet {
  name: string; short: string; en: string; color: string;
  sign: string; sign_idx: number; raw_lon: number; deg_in_sign: number; pos: string;
  house: string; house_idx: number;
  treyang: string; nawang: string; nakshatra: string;
  taksa: string; std: string; std_strength: number; std_color: string; std_en: string;
  aspects: { Kum: string[]; Leng: string[]; Yoke: string[]; Chak: string[]; Trikon: string[] };
}
export interface Lagna {
  sign: string; sign_idx: number; sign_en: string; sign_sym: string;
  raw_lon: number; deg_in_sign: number; pos: string;
  nakshatra: string; treyang: string; nawang: string;
}
export interface HouseSummary {
  idx: number; name: string; name_en: string;
  sign: string; sign_idx: number; sign_sym: string;
  occupants: string[];
}
export interface AspectPair {
  p1: string; p2: string; p1_lon: number; p2_lon: number;
  type: string; color: string; label: string;
}
export interface ChartData {
  lagna: Lagna;
  planets: Planet[];
  aspect_pairs: AspectPair[];
  houses: HouseSummary[];
  avg_strength: number;
  meta: { year: number; month: number; day: number; hour: number; minute: number; lat: number; lon: number; day_of_week: string };
  reference: { zodiac_full: string[]; zodiac_sym: string[]; houses_thai: string[]; aspect_colors: Record<string,string>; aspect_thai: Record<string,string> };
}

// ─── SVG helpers ─────────────────────────────────────────────
const CX = 180, CY = 180;
const R_OUTER = 172, R_SIGN_IN = 140, R_PLANET = 106, R_INNER = 80;

function toXY(rel_lon: number, r: number) {
  const θ = (180 - rel_lon) * Math.PI / 180;
  return { x: CX + r * Math.cos(θ), y: CY + r * Math.sin(θ) };
}
function sectorPath(i: number, r_out: number, r_in: number) {
  const t1 = (180 - i * 30) * Math.PI / 180;
  const t2 = (180 - (i + 1) * 30) * Math.PI / 180;
  const ox1 = CX + r_out * Math.cos(t1), oy1 = CY + r_out * Math.sin(t1);
  const ox2 = CX + r_out * Math.cos(t2), oy2 = CY + r_out * Math.sin(t2);
  const ix1 = CX + r_in  * Math.cos(t1), iy1 = CY + r_in  * Math.sin(t1);
  const ix2 = CX + r_in  * Math.cos(t2), iy2 = CY + r_in  * Math.sin(t2);
  return `M ${ix1} ${iy1} L ${ox1} ${oy1} A ${r_out} ${r_out} 0 0 0 ${ox2} ${oy2} L ${ix2} ${iy2} A ${r_in} ${r_in} 0 0 1 ${ix1} ${iy1} Z`;
}

const SIGN_COLORS = [
  "#ef4444","#22c55e","#eab308","#06b6d4","#f59e0b","#84cc16",
  "#ec4899","#8b5cf6","#f97316","#64748b","#3b82f6","#a855f7",
];
const STD_BG: Record<string,string> = {
  'อุจจ์':'rgba(251,191,36,0.9)', 'เกษตร':'rgba(34,197,94,0.9)',
  'ราชาโชค':'rgba(168,85,247,0.9)', 'อุจจ์/เกษตร':'rgba(251,191,36,0.9)',
  '-':'rgba(148,163,184,0.7)', 'ประ':'rgba(100,116,139,0.7)',
  'นิจ':'rgba(239,68,68,0.9)', 'นิจ/ประ':'rgba(239,68,68,0.9)',
};

// ─── ChartWheel (SVG) ─────────────────────────────────────────
function ChartWheel({ data }: { data: ChartData }) {
  const { lagna, planets, aspect_pairs, reference } = data;
  const lagnaLon = lagna.raw_lon;

  // Stagger planets in same sign to avoid full overlap
  const planetLayout = useMemo(() => {
    const bySign: Record<number, Planet[]> = {};
    planets.forEach(p => { (bySign[p.sign_idx] = bySign[p.sign_idx] || []).push(p); });
    const result: Record<string, { rel: number; r: number }> = {};
    Object.entries(bySign).forEach(([, group]) => {
      const n = group.length;
      group.forEach((p, k) => {
        const rel = (p.raw_lon - lagnaLon + 360) % 360;
        const offset = n > 1 ? (k - (n - 1) / 2) * 12 : 0;
        const r = R_PLANET + (n > 2 && k % 2 === 1 ? -18 : 0);
        result[p.name] = { rel: rel + offset, r };
      });
    });
    return result;
  }, [planets, lagnaLon]);

  return (
    <svg viewBox="0 0 360 360" className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto drop-shadow-2xl" aria-label="Thai Birth Chart Wheel">
      <defs>
        <filter id="glow-planet">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="center-grad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#1a0435"/>
          <stop offset="100%" stopColor="#0a0118"/>
        </radialGradient>
      </defs>

      {/* Background */}
      <circle cx={CX} cy={CY} r={R_OUTER} fill="#0a0118" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>

      {/* Sign ring sectors */}
      {Array.from({ length: 12 }, (_, i) => {
        const sign_idx = (lagna.sign_idx + i) % 12;
        return (
          <g key={i}>
            <path d={sectorPath(i, R_OUTER, R_SIGN_IN)} fill={SIGN_COLORS[sign_idx] + "22"} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5"/>
            {/* Symbol */}
            {(() => {
              const mid = toXY(i * 30 + 15, 158);
              const sym = toXY(i * 30 + 15, 163);
              const abbr = toXY(i * 30 + 15, 148);
              return (
                <>
                  <text x={sym.x} y={sym.y} textAnchor="middle" dominantBaseline="middle"
                    fontSize="12" fill={SIGN_COLORS[sign_idx]} style={{ filter: `drop-shadow(0 0 3px ${SIGN_COLORS[sign_idx]})` }}>
                    {reference.zodiac_sym[sign_idx]}
                  </text>
                  <text x={abbr.x} y={abbr.y + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize="7.5" fill="rgba(255,255,255,0.5)" fontFamily="Sarabun,sans-serif">
                    {reference.zodiac_full[sign_idx].slice(0, 3)}
                  </text>
                </>
              );
            })()}
          </g>
        );
      })}

      {/* House zone background */}
      <circle cx={CX} cy={CY} r={R_SIGN_IN} fill="#0d0220" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>

      {/* House divider lines */}
      {Array.from({ length: 12 }, (_, i) => {
        const p1 = toXY(i * 30, R_SIGN_IN);
        const p2 = toXY(i * 30, R_INNER);
        return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.07)" strokeWidth="0.8"/>;
      })}

      {/* House numbers */}
      {Array.from({ length: 12 }, (_, i) => {
        const pt = toXY(i * 30 + 15, 123);
        return (
          <text key={i} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="7" fill="rgba(255,255,255,0.2)" fontFamily="monospace">
            {i + 1}
          </text>
        );
      })}

      {/* Inner circle for aspects */}
      <circle cx={CX} cy={CY} r={R_INNER} fill="url(#center-grad)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8"/>

      {/* Aspect lines */}
      {aspect_pairs.map((a, idx) => {
        const rel1 = (a.p1_lon - lagnaLon + 360) % 360;
        const rel2 = (a.p2_lon - lagnaLon + 360) % 360;
        const p1 = toXY(rel1, R_INNER - 8);
        const p2 = toXY(rel2, R_INNER - 8);
        const isDash = a.type === 'Yoke' || a.type === 'Chak';
        return (
          <line key={idx} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={a.color} strokeWidth="0.8" strokeOpacity="0.5"
            strokeDasharray={isDash ? "3 3" : undefined}/>
        );
      })}

      {/* Planets */}
      {planets.map(p => {
        const layout = planetLayout[p.name];
        if (!layout) return null;
        const pt = toXY(layout.rel, layout.r);
        const bgColor = STD_BG[p.std] || 'rgba(148,163,184,0.7)';
        return (
          <g key={p.name} filter="url(#glow-planet)">
            <circle cx={pt.x} cy={pt.y} r="11" fill={bgColor} stroke={p.color} strokeWidth="1.5"/>
            <text x={pt.x} y={pt.y + 0.5} textAnchor="middle" dominantBaseline="middle"
              fontSize="7.5" fontWeight="bold" fill="#fff" fontFamily="Sarabun,sans-serif">
              {p.short}
            </text>
          </g>
        );
      })}

      {/* Lagna marker — golden triangle at 9 o'clock (θ=180°) */}
      {(() => {
        const tp = toXY(0, R_SIGN_IN - 4);
        const angle = (180 - 0) * Math.PI / 180;
        const ax = CX + (R_SIGN_IN - 2) * Math.cos(angle), ay = CY + (R_SIGN_IN - 2) * Math.sin(angle);
        const bx = CX + (R_SIGN_IN - 16) * Math.cos(angle - 0.18), by = CY + (R_SIGN_IN - 16) * Math.sin(angle - 0.18);
        const cx2= CX + (R_SIGN_IN - 16) * Math.cos(angle + 0.18), cy2= CY + (R_SIGN_IN - 16) * Math.sin(angle + 0.18);
        return (
          <>
            <polygon points={`${ax},${ay} ${bx},${by} ${cx2},${cy2}`} fill="#fbbf24" stroke="#fff" strokeWidth="0.5" opacity="0.9"/>
            <text x={tp.x} y={tp.y} textAnchor="middle" dominantBaseline="middle"
              fontSize="7" fontWeight="bold" fill="#fbbf24" fontFamily="Sarabun,sans-serif">ล</text>
          </>
        );
      })()}

      {/* Center info */}
      <text x={CX} y={CY - 10} textAnchor="middle" dominantBaseline="middle"
        fontSize="22" fill="rgba(251,191,36,0.9)" style={{ filter: 'drop-shadow(0 0 6px #fbbf24)' }}>
        {lagna.sign_sym}
      </text>
      <text x={CX} y={CY + 9} textAnchor="middle" dominantBaseline="middle"
        fontSize="9" fill="rgba(255,255,255,0.5)" fontFamily="Sarabun,sans-serif">
        {lagna.sign} ลัคนา
      </text>
      <text x={CX} y={CY + 21} textAnchor="middle" dominantBaseline="middle"
        fontSize="7.5" fill="rgba(255,255,255,0.3)" fontFamily="monospace">
        {lagna.pos}
      </text>
    </svg>
  );
}

// ─── South Indian Square Grid ─────────────────────────────────
function HouseGrid({ data }: { data: ChartData }) {
  const { lagna, planets, reference } = data;
  // South Indian layout: sign positions fixed, Aries at [0][1]
  // Row0: [11,0,1,2], Row1: [10,-,-,3], Row2: [9,-,-,4], Row3: [8,7,6,5]
  // where index = (lagna.sign_idx + house_idx) % 12
  const GRID: (number | null)[][] = [
    [11, 0, 1, 2],
    [10, null, null, 3],
    [9, null, null, 4],
    [8, 7, 6, 5],
  ];

  const planetsByHouse: Record<number, Planet[]> = {};
  planets.forEach(p => { (planetsByHouse[p.house_idx] = planetsByHouse[p.house_idx] || []).push(p); });

  return (
    <div className="grid grid-rows-4 gap-0.5 max-w-xs sm:max-w-sm mx-auto">
      {GRID.map((row, ri) => (
        <div key={ri} className="grid grid-cols-4 gap-0.5">
          {row.map((h_idx, ci) => {
            if (h_idx === null) {
              return <div key={ci} className="aspect-square bg-transparent"/>;
            }
            const sign_idx = (lagna.sign_idx + h_idx) % 12;
            const isLagna = h_idx === 0;
            const occupants = planetsByHouse[h_idx] || [];
            return (
              <div key={ci}
                className={`aspect-square rounded-lg border flex flex-col p-1 overflow-hidden ${isLagna ? "border-amber-400/40 bg-amber-400/5" : "border-white/5 bg-white/[0.02]"}`}>
                <div className="flex items-start justify-between">
                  <span className="text-[8px] font-mono text-white/20">{h_idx + 1}</span>
                  <span className="text-[10px]" style={{ color: SIGN_COLORS[sign_idx] }}>
                    {reference.zodiac_sym[sign_idx]}
                  </span>
                </div>
                <div className="flex-1 flex flex-wrap gap-0.5 content-center justify-center mt-0.5">
                  {occupants.map(p => (
                    <span key={p.name} className="text-[9px] font-bold rounded px-0.5 font-thai-serif leading-tight"
                      style={{ color: p.std_color, backgroundColor: p.std_color + '22' }}>
                      {p.short}
                    </span>
                  ))}
                  {isLagna && (
                    <span className="text-[9px] font-bold text-amber-400">ล</span>
                  )}
                </div>
                <p className="text-[7px] text-white/20 font-thai-serif text-center leading-none mt-0.5">
                  {reference.zodiac_full[sign_idx].slice(0,3)}
                </p>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Planet Table ─────────────────────────────────────────────
function PlanetTable({ data }: { data: ChartData }) {
  const { lagna, planets } = data;
  const COLS = ['ดาว','ราศี','องศา','เรือน','ทักษา','มาตรฐาน','กุม','เล็ง','ตรีโกณ','ฉาก'];

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5">
      <table className="w-full text-xs min-w-[600px]">
        <thead>
          <tr className="border-b border-white/5">
            {COLS.map(c => (
              <th key={c} className="px-3 py-2.5 text-left text-white/30 font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Lagna row */}
          <tr className="border-b border-white/5 bg-amber-400/5">
            <td className="px-3 py-2 font-bold text-amber-400 font-thai-serif whitespace-nowrap">ล.ลัคนา</td>
            <td className="px-3 py-2 font-thai-serif text-white/80">{lagna.sign}</td>
            <td className="px-3 py-2 font-mono text-white/50">{lagna.pos}</td>
            <td className="px-3 py-2 font-thai-serif text-white/50">ตนุ</td>
            <td className="px-3 py-2 text-white/30">–</td>
            <td className="px-3 py-2 text-white/30">–</td>
            <td className="px-3 py-2 text-white/30">–</td>
            <td className="px-3 py-2 text-white/30">–</td>
            <td className="px-3 py-2 text-white/30">–</td>
            <td className="px-3 py-2 text-white/30">–</td>
          </tr>
          {planets.map(p => (
            <tr key={p.name} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="font-thai-serif text-sm" style={{ color: p.color }}>{p.short}</span>
                <span className="text-white/30 text-[10px] ml-1.5 font-thai-serif">{p.en}</span>
              </td>
              <td className="px-3 py-2 font-thai-serif text-white/80">{p.sign}</td>
              <td className="px-3 py-2 font-mono text-white/50 text-[11px]">{p.pos}</td>
              <td className="px-3 py-2 font-thai-serif text-white/60 whitespace-nowrap">{p.house}</td>
              <td className="px-3 py-2 font-thai-serif text-white/50 text-[11px] whitespace-nowrap">{p.taksa}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: p.std_color + '25', color: p.std_color }}>
                  {p.std}
                </span>
              </td>
              <td className="px-3 py-2 text-white/40 font-mono text-[10px]">{p.aspects.Kum.join(',') || '–'}</td>
              <td className="px-3 py-2 text-white/40 font-mono text-[10px]">{p.aspects.Leng.join(',') || '–'}</td>
              <td className="px-3 py-2 text-white/40 font-mono text-[10px]">{p.aspects.Trikon.join(',') || '–'}</td>
              <td className="px-3 py-2 text-white/40 font-mono text-[10px]">{p.aspects.Chak.join(',') || '–'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Planet Strength Bars ─────────────────────────────────────
function StrengthChart({ data }: { data: ChartData }) {
  const { planets } = data;
  const sorted = [...planets].sort((a, b) => b.std_strength - a.std_strength);
  return (
    <div className="space-y-2">
      {sorted.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-5 text-[10px] font-bold font-thai-serif flex-shrink-0" style={{ color: p.color }}>{p.short}</span>
          <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(p.std_strength / 5) * 100}%`, background: `linear-gradient(90deg, ${p.std_color}66, ${p.std_color})` }}/>
          </div>
          <span className="text-[10px] font-thai-serif flex-shrink-0 w-20 text-right"
            style={{ color: p.std_color }}>{p.std}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Aspect Legend ────────────────────────────────────────────
function AspectLegend({ data }: { data: ChartData }) {
  const { aspect_pairs, reference } = data;
  if (aspect_pairs.length === 0) return <p className="text-white/30 text-xs text-center">ไม่พบมุมดาวที่เด่นชัด</p>;
  const byType: Record<string, AspectPair[]> = {};
  aspect_pairs.forEach(a => { (byType[a.type] = byType[a.type] || []).push(a); });
  const ASP_DESC: Record<string,string> = {
    Kum:'กุม — ดาวร่วมราศี ส่งเสริมพลังกัน',
    Leng:'เล็ง — ตรงข้าม ขัดแย้งและสมดุล',
    Yoke:'โยค — ห่าง 60° เข้ากันได้ดี',
    Chak:'ฉาก — ห่าง 90° ตึงเครียด ท้าทาย',
    Trikon:'ตรีโกณ — ห่าง 120° กลมเกลียว เป็นมงคล',
  };
  return (
    <div className="space-y-3">
      {Object.entries(byType).map(([type, pairs]) => (
        <div key={type}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: reference.aspect_colors[type] }}/>
            <p className="text-[11px] font-thai-serif" style={{ color: reference.aspect_colors[type] }}>
              {ASP_DESC[type] || type}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 pl-6">
            {pairs.map((a, i) => (
              <span key={i} className="px-2 py-0.5 rounded-lg text-[10px] font-mono border"
                style={{ borderColor: reference.aspect_colors[type] + '40', color: reference.aspect_colors[type], backgroundColor: reference.aspect_colors[type] + '10' }}>
                {a.p1}–{a.p2}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Nakshatra Panel ──────────────────────────────────────────
function NakshatraPanel({ data }: { data: ChartData }) {
  const moon = data.planets.find(p => p.short === 'จ');
  const sun  = data.planets.find(p => p.short === 'อา');
  return (
    <div className="space-y-3">
      {[
        { label: 'นักษัตรลัคนา', val: data.lagna.nakshatra, desc: 'แสดงถึงตัวตนและวิถีชีวิต' },
        { label: 'นักษัตรพระจันทร์', val: moon?.nakshatra || '–', desc: 'จิตใจ อารมณ์ ความรู้สึก' },
        { label: 'นักษัตรพระอาทิตย์', val: sun?.nakshatra || '–', desc: 'วิญญาณ เป้าหมายชีวิต' },
      ].map(item => (
        <div key={item.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-white/30 text-[10px] font-mono uppercase tracking-wider">{item.label}</p>
              <p className="text-white/80 font-thai-serif text-sm mt-0.5">{item.val}</p>
            </div>
          </div>
          <p className="text-white/30 text-[10px] font-thai-serif mt-1">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main BirthChartView ──────────────────────────────────────
type ViewTab = 'wheel' | 'grid' | 'table' | 'aspects' | 'nakshatra';

interface Props {
  data: ChartData;
  onAskAI: (msg: string) => void;
}

export default function BirthChartView({ data, onAskAI }: Props) {
  const [view, setView] = useState<ViewTab>('wheel');
  const { lagna, planets, meta, avg_strength } = data;

  const thaiMonths = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
                      "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  const birthStr = `${meta.day} ${thaiMonths[meta.month - 1]} พ.ศ. ${meta.year + 543} เวลา ${String(meta.hour).padStart(2,'0')}:${String(meta.minute).padStart(2,'0')} น.`;

  const askFull = () => {
    const planetList = planets.map(p => `${p.short}(${p.sign} ${p.pos} ${p.std})`).join(', ');
    const aspects = data.aspect_pairs.map(a => `${a.p1}-${a.p2}:${a.label}`).join(', ');
    onAskAI(
      `วิเคราะห์ดวงชาตาไทยโบราณแบบละเอียดให้หน่อยค่ะ\n` +
      `เกิด ${birthStr}\n` +
      `ลัคนา: ${lagna.sign} ${lagna.sign_sym} ${lagna.pos}\n` +
      `ดาวหลัก: ${planetList}\n` +
      `มุมดาว: ${aspects}\n` +
      `ช่วยอธิบายนิสัย จุดแข็ง จุดอ่อน ดวงรัก การงาน การเงิน และคำแนะนำ`
    );
  };

  const VIEWS: { id: ViewTab; label: string }[] = [
    { id: 'wheel',    label: '🌐 วงล้อ' },
    { id: 'grid',     label: '⊞ กริด' },
    { id: 'table',    label: '📋 ตาราง' },
    { id: 'aspects',  label: '🔗 มุมดาว' },
    { id: 'nakshatra',label: '✦ นักษัตร' },
  ];

  const strengthPct = Math.round((avg_strength / 5) * 100);

  return (
    <div className="space-y-5 pb-6">
      {/* Header banner */}
      <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl">{lagna.sign_sym}</div>
          <div>
            <p className="font-thai-serif font-bold text-amber-300 text-lg leading-tight">{lagna.sign} ลัคนา</p>
            <p className="text-white/40 text-xs font-mono">{lagna.sign_en} · {lagna.pos} · {lagna.nakshatra}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-white/25 text-[10px] font-mono uppercase tracking-wider">พลังชาตา</p>
            <p className="font-bold text-lg" style={{ color: strengthPct >= 60 ? '#22c55e' : strengthPct >= 40 ? '#f59e0b' : '#ef4444' }}>
              {strengthPct}%
            </p>
          </div>
        </div>
        <p className="text-white/30 text-[11px] font-thai-serif">{birthStr}</p>
        {/* Strength bar */}
        <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-1500"
            style={{ width: `${strengthPct}%`, background: `linear-gradient(90deg, #8b5cf6, #fbbf24, #22c55e)` }}/>
        </div>
        <div className="flex justify-between text-[9px] font-mono text-white/20 mt-1">
          <span>อ่อน</span><span>กลาง</span><span>แกร่ง</span>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/5 overflow-x-auto scrollbar-hide">
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-thai-serif transition-all ${view === v.id ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold' : 'text-white/40 hover:text-white/70'}`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* View content */}
      <div className="animate-fade-in">
        {view === 'wheel' && (
          <div className="space-y-4">
            <ChartWheel data={data}/>
            {/* Legend */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[['อุจจ์','#f59e0b'],['เกษตร','#22c55e'],['ราชาโชค','#a855f7'],['ประ','#64748b'],['นิจ','#ef4444']].map(([std, col]) => (
                <div key={std} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col as string}}/>
                  <span className="text-[10px] font-thai-serif text-white/50">{std}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {view === 'grid' && <HouseGrid data={data}/>}
        {view === 'table' && <PlanetTable data={data}/>}
        {view === 'aspects' && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <AspectLegend data={data}/>
          </div>
        )}
        {view === 'nakshatra' && (
          <div>
            <NakshatraPanel data={data}/>
            <div className="mt-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-white/30 text-[10px] font-mono uppercase tracking-wider mb-3">⚡ ความแข็งแกร่งดาว</p>
              <StrengthChart data={data}/>
            </div>
          </div>
        )}
      </div>

      {/* AI analysis button */}
      <button onClick={askFull}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-thai-serif font-semibold shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        <span>🔮</span>
        <span>ให้อาจารย์ดาววิเคราะห์ดวงชาตาฉบับเต็ม</span>
      </button>
    </div>
  );
}
