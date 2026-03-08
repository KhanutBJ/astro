#!/usr/bin/env python3
"""
thai_astro_api.py — JSON wrapper around Swiss Ephemeris Thai astrology engine.
Called by the Next.js /api/chart route via child_process.spawn.
Usage: python thai_astro_api.py '{"year":2004,"month":12,"day":7,"hour":13,"minute":21,"lat":13.7563,"lon":100.5018}'
"""
import sys, json, datetime
import swisseph as swe
import pytz

# ─── Reference Data ──────────────────────────────────────────────────────────

ZODIAC_FULL = ["เมษ","พฤษภ","มิถุน","กรกฎ","สิงห์","กันย์","ตุลย์","พิจิก","ธนู","มังกร","กุมภ์","มีน"]
ZODIAC_ABBR = ["มษ","พภ","มถ","กฎ","สห","กน","ตล","พจ","ธน","มก","กภ","มน"]
ZODIAC_EN   = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"]
ZODIAC_SYM  = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"]
HOUSES_THAI = ["ตนุ","กดุมภะ","สหัชชะ","พันธุ","ปุตตะ","อริ","ปัตนิ","มรณะ","สุภะ","กัมมะ","ลาภะ","วินาศ"]
HOUSES_EN   = ["Tanu","Kutumba","Sahajja","Bandhu","Puttra","Ari","Patni","Marana","Subha","Kamma","Labha","Vinasa"]

NAKSHATRAS = [
    "อัศวินี","ภรณี","กฤติกา","โรหิณี","มฤคศิร","อารทรา","ปุนัพสุ","บุษยะ",
    "อาศเลษา","มาฆะ","บุรพผลคุนี","อุตรผลคุนี","หัสตะ","จิตรา","สวาตี","วิสาขะ",
    "อนุราธะ","เชษฐา","มูละ","บุรพษาฒ","อุตราษาฒ","ศรวณะ","ธนิษฐา","ศตภิษัช",
    "บุรพภัทรบท","อุตรภัทรบท","เรวดี"
]

PLANET_KEYS = ['๑.อาทิตย์','๒.จันทร์','๓.อังคาร','๔.พุธ','๕.พฤหัสบดี','๖.ศุกร์',
               '๗.เสาร์','๘.ราหู','๙.เกตุ','๐.มฤตยู']
PLANET_SHORT = {
    '๑.อาทิตย์':'อา','๒.จันทร์':'จ','๓.อังคาร':'อง','๔.พุธ':'พ',
    '๕.พฤหัสบดี':'พฤ','๖.ศุกร์':'ศ','๗.เสาร์':'สา','๘.ราหู':'รา',
    '๙.เกตุ':'เก','๐.มฤตยู':'มฤ'
}
PLANET_EN = {
    '๑.อาทิตย์':'Sun','๒.จันทร์':'Moon','๓.อังคาร':'Mars','๔.พุธ':'Mercury',
    '๕.พฤหัสบดี':'Jupiter','๖.ศุกร์':'Venus','๗.เสาร์':'Saturn','๘.ราหู':'Rahu',
    '๙.เกตุ':'Ketu','๐.มฤตยู':'Uranus'
}
PLANET_SWE = {
    '๑.อาทิตย์': swe.SUN,'๒.จันทร์': swe.MOON,'๓.อังคาร': swe.MARS,
    '๔.พุธ': swe.MERCURY,'๕.พฤหัสบดี': swe.JUPITER,'๖.ศุกร์': swe.VENUS,
    '๗.เสาร์': swe.SATURN,'๘.ราหู': swe.MEAN_NODE,'๙.เกตุ': -1,'๐.มฤตยู': swe.URANUS
}
PLANET_COLORS = {
    '๑.อาทิตย์':'#f59e0b','๒.จันทร์':'#94a3b8','๓.อังคาร':'#ef4444','๔.พุธ':'#22c55e',
    '๕.พฤหัสบดี':'#f97316','๖.ศุกร์':'#ec4899','๗.เสาร์':'#6366f1','๘.ราหู':'#8b5cf6',
    '๙.เกตุ':'#a78bfa','๐.มฤตยู':'#06b6d4'
}

STD_MEANINGS = {
    'อุจจ์': {'en':'Exalted','color':'#f59e0b','strength':5},
    'เกษตร': {'en':'Domicile','color':'#22c55e','strength':4},
    'ราชาโชค': {'en':'Raja Yoga','color':'#a855f7','strength':3},
    '-': {'en':'Neutral','color':'#94a3b8','strength':2},
    'ประ': {'en':'Fall','color':'#64748b','strength':1},
    'นิจ': {'en':'Debilitated','color':'#ef4444','strength':0},
    'อุจจ์/เกษตร': {'en':'Exalted+Domicile','color':'#fbbf24','strength':5},
    'นิจ/ประ': {'en':'Debilitated+Fall','color':'#f87171','strength':0},
}

ASPECT_COLORS = {
    'Kum':'#fbbf24','Leng':'#ef4444','Yoke':'#3b82f6','Chak':'#f97316','Trikon':'#22c55e'
}
ASPECT_THAI = {'Kum':'กุม','Leng':'เล็ง','Yoke':'โยค','Chak':'ฉาก','Trikon':'ตรีโกณ'}

# ─── Taksa ───────────────────────────────────────────────────────────────────

def get_taksa(day_of_week: str) -> dict:
    seq   = ['๑.อาทิตย์','๒.จันทร์','๓.อังคาร','๔.พุธ','๗.เสาร์','๕.พฤหัสบดี','๘.ราหู','๖.ศุกร์']
    roles = ['บริวาร','อายุ','เดช','ศรี','มูละ','อุตสาหะ','มนตรี','กาลกิณี']
    day_map = {'sunday':0,'monday':1,'tuesday':2,'wednesday':3,'saturday':4,'thursday':5,'wednesday_night':6,'friday':7}
    start = day_map.get(day_of_week.lower(), 0)
    return {seq[(start + i) % 8]: roles[i] for i in range(8)}

# ─── Standard (Dignity) ──────────────────────────────────────────────────────

def get_standard(planet: str, sign: str) -> str:
    stds = {
        '๑.อาทิตย์': {'เมษ':'อุจจ์','สิงห์':'เกษตร','ตุลย์':'นิจ','กุมภ์':'ประ'},
        '๒.จันทร์':  {'พฤษภ':'อุจจ์','กรกฎ':'เกษตร','พิจิก':'นิจ','มังกร':'ประ','กันย์':'ราชาโชค'},
        '๓.อังคาร':  {'มังกร':'อุจจ์','เมษ':'เกษตร','พิจิก':'เกษตร','กรกฎ':'นิจ','ตุลย์':'ประ','พฤษภ':'ประ'},
        '๔.พุธ':     {'กันย์':'อุจจ์/เกษตร','มิถุน':'เกษตร','มีน':'นิจ/ประ','ธนู':'ประ','สิงห์':'ราชาโชค'},
        '๕.พฤหัสบดี':{'กรกฎ':'อุจจ์','ธนู':'เกษตร','มีน':'เกษตร','มังกร':'นิจ','มิถุน':'ประ','กันย์':'ประ','เมษ':'ราชาโชค'},
        '๖.ศุกร์':   {'มีน':'อุจจ์','พฤษภ':'เกษตร','ตุลย์':'เกษตร','กันย์':'นิจ','พิจิก':'ประ','เมษ':'ประ'},
        '๗.เสาร์':   {'ตุลย์':'อุจจ์','มังกร':'เกษตร','กุมภ์':'เกษตร','เมษ':'นิจ','กรกฎ':'ประ','สิงห์':'ประ','พิจิก':'ราชาโชค'},
        '๘.ราหู':    {'พิจิก':'อุจจ์','กุมภ์':'เกษตร','พฤษภ':'นิจ','สิงห์':'ประ'},
    }
    return stds.get(planet, {}).get(sign, '-')

# ─── Lagna (Ascendant) ───────────────────────────────────────────────────────

def calc_lagna(y, m, d, h, mn, tz_str='Asia/Bangkok'):
    tz = pytz.timezone(tz_str)
    winter = m in [11, 12, 1]
    sunrise_h, sunrise_m = 6, 20 if winter else 6
    calc_date = datetime.datetime(y, m, d, sunrise_h, sunrise_m)
    if h < 6:
        calc_date -= datetime.timedelta(days=1)
    sunrise_utc = tz.localize(calc_date).astimezone(pytz.utc)
    jd_sr = swe.julday(sunrise_utc.year, sunrise_utc.month, sunrise_utc.day,
                       sunrise_utc.hour + sunrise_utc.minute / 60.0)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    sun_pos, _ = swe.calc_ut(jd_sr, swe.SUN, swe.FLG_SIDEREAL)
    sun_lon = sun_pos[0]
    sun_sign = int(sun_lon / 30)
    deg_in_sign = sun_lon % 30
    anto = [116, 122, 132, 132, 122, 116, 116, 122, 132, 132, 122, 116]

    birth_mins = h * 60 + mn
    sr_mins = sunrise_h * 60 + sunrise_m
    elapsed = (birth_mins - sr_mins) % 1440
    time_rem = ((30.0 - deg_in_sign) / 30.0) * anto[sun_sign]
    cur = sun_sign
    if elapsed <= time_rem:
        lagna_deg = deg_in_sign + (elapsed / anto[cur]) * 30.0
    else:
        elapsed -= time_rem
        cur = (cur + 1) % 12
        while elapsed > anto[cur]:
            elapsed -= anto[cur]
            cur = (cur + 1) % 12
        lagna_deg = (elapsed / anto[cur]) * 30.0
    return (cur * 30) + lagna_deg, cur

# ─── Main chart function ──────────────────────────────────────────────────────

def generate_chart_json(year, month, day, hour, minute, lat, lon, tz_str='Asia/Bangkok'):
    tz = pytz.timezone(tz_str)
    utc_dt = tz.localize(datetime.datetime(year, month, day, hour, minute)).astimezone(pytz.utc)
    jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day,
                    utc_dt.hour + utc_dt.minute / 60.0)
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    dt_local = datetime.datetime(year, month, day, hour, minute)
    day_of_week = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'][dt_local.weekday()]
    if day_of_week == 'wednesday' and hour >= 18:
        day_of_week = 'wednesday_night'

    taksa = get_taksa(day_of_week)
    lagna_abs, asc_sign = calc_lagna(year, month, day, hour, minute, tz_str)

    # ── Planet positions ──
    raw_data: dict = {}
    sign_indices: dict = {}
    for name, pid in PLANET_SWE.items():
        if pid == -1:
            lon_deg = (raw_data['๘.ราหู']['raw_lon'] + 180) % 360
        else:
            pos, _ = swe.calc_ut(jd, pid, swe.FLG_SIDEREAL)
            lon_deg = pos[0]
        s_idx = int(lon_deg / 30)
        deg   = int(lon_deg % 30)
        mins  = int((lon_deg % 30 * 60) % 60)
        sign_indices[name] = s_idx
        raw_data[name] = {
            'raw_lon': lon_deg,
            'sign': ZODIAC_FULL[s_idx],
            'sign_idx': s_idx,
            'pos': f"{deg:02d}°{mins:02d}'",
            'house': HOUSES_THAI[(s_idx - asc_sign) % 12],
            'house_idx': (s_idx - asc_sign) % 12,
            'treyang': ZODIAC_ABBR[(s_idx + (int((lon_deg % 30) / 10) * 4)) % 12],
            'nawang':  ZODIAC_ABBR[(int(lon_deg / (360 / 108))) % 12],
            'nakshatra': f"{NAKSHATRAS[int(lon_deg / (360/27))]} บาทที่ {int(((lon_deg % (360/27)) / ((360/27)/4)) + 1)}",
            'taksa': taksa.get(name, '-'),
            'std':   get_standard(name, ZODIAC_FULL[s_idx]),
        }

    # ── Aspects (sign-level) ──
    aspects: dict = {p: {'Kum':[], 'Leng':[], 'Yoke':[], 'Chak':[], 'Trikon':[]} for p in sign_indices}
    keys = list(sign_indices.keys())
    for i in range(len(keys)):
        for j in range(i + 1, len(keys)):
            p1, p2 = keys[i], keys[j]
            dist = abs(sign_indices[p1] - sign_indices[p2])
            dist = dist if dist <= 6 else 12 - dist
            s1, s2 = PLANET_SHORT[p1], PLANET_SHORT[p2]
            if   dist == 0:          aspects[p1]['Kum'].append(s2);    aspects[p2]['Kum'].append(s1)
            elif dist == 6:          aspects[p1]['Leng'].append(s2);   aspects[p2]['Leng'].append(s1)
            elif dist in [2, 10]:    aspects[p1]['Yoke'].append(s2);   aspects[p2]['Yoke'].append(s1)
            elif dist in [3, 9]:     aspects[p1]['Chak'].append(s2);   aspects[p2]['Chak'].append(s1)
            elif dist in [4, 8]:     aspects[p1]['Trikon'].append(s2); aspects[p2]['Trikon'].append(s1)

    # ── Assemble planet list ──
    lagna_deg_in = lagna_abs % 30
    lagna_mins   = int((lagna_deg_in * 60) % 60)
    lagna_deg_i  = int(lagna_deg_in)

    planets_out = []
    for name in PLANET_KEYS:
        d = raw_data[name]
        a = aspects[name]
        planets_out.append({
            'name': name,
            'short': PLANET_SHORT[name],
            'en': PLANET_EN[name],
            'color': PLANET_COLORS[name],
            'sign': d['sign'],
            'sign_idx': d['sign_idx'],
            'raw_lon': round(d['raw_lon'], 4),
            'deg_in_sign': round(d['raw_lon'] % 30, 4),
            'pos': d['pos'],
            'house': d['house'],
            'house_idx': d['house_idx'],
            'treyang': d['treyang'],
            'nawang':  d['nawang'],
            'nakshatra': d['nakshatra'],
            'taksa': d['taksa'],
            'std': d['std'],
            'std_strength': STD_MEANINGS.get(d['std'], {}).get('strength', 2),
            'std_color': STD_MEANINGS.get(d['std'], {}).get('color', '#94a3b8'),
            'std_en': STD_MEANINGS.get(d['std'], {}).get('en', 'Neutral'),
            'aspects': {k: v for k, v in a.items()},
        })

    # ── Aspect pairs for drawing lines ──
    aspect_pairs = []
    for p in planets_out:
        for asp_type, partners in p['aspects'].items():
            for partner_short in partners:
                # Avoid duplicates
                partner = next((x for x in planets_out if x['short'] == partner_short), None)
                if partner and p['name'] < partner['name']:
                    aspect_pairs.append({
                        'p1': p['short'], 'p2': partner_short,
                        'p1_lon': p['raw_lon'], 'p2_lon': partner['raw_lon'],
                        'type': asp_type,
                        'color': ASPECT_COLORS[asp_type],
                        'label': ASPECT_THAI[asp_type],
                    })

    # ── Lagna ──
    lagna_out = {
        'sign': ZODIAC_FULL[asc_sign],
        'sign_idx': asc_sign,
        'sign_en': ZODIAC_EN[asc_sign],
        'sign_sym': ZODIAC_SYM[asc_sign],
        'raw_lon': round(lagna_abs, 4),
        'deg_in_sign': round(lagna_deg_in, 4),
        'pos': f"{lagna_deg_i:02d}°{lagna_mins:02d}'",
        'nakshatra': f"{NAKSHATRAS[int(lagna_abs / (360/27))]} บาทที่ {int(((lagna_abs % (360/27)) / ((360/27)/4)) + 1)}",
        'treyang': ZODIAC_ABBR[(asc_sign + (int(lagna_deg_in / 10) * 4)) % 12],
        'nawang':  ZODIAC_ABBR[(int(lagna_abs / (360 / 108))) % 12],
    }

    # ── Overall chart strength ──
    strengths = [p['std_strength'] for p in planets_out]
    avg_strength = round(sum(strengths) / len(strengths), 2)

    # ── Houses summary (which planets are in each house) ──
    houses_summary = []
    for h_idx in range(12):
        occupants = [p['short'] for p in planets_out if p['house_idx'] == h_idx]
        houses_summary.append({
            'idx': h_idx,
            'name': HOUSES_THAI[h_idx],
            'name_en': HOUSES_EN[h_idx],
            'sign': ZODIAC_FULL[(asc_sign + h_idx) % 12],
            'sign_idx': (asc_sign + h_idx) % 12,
            'sign_sym': ZODIAC_SYM[(asc_sign + h_idx) % 12],
            'occupants': occupants,
        })

    return {
        'lagna': lagna_out,
        'planets': planets_out,
        'aspect_pairs': aspect_pairs,
        'houses': houses_summary,
        'avg_strength': avg_strength,
        'meta': {
            'year': year, 'month': month, 'day': day,
            'hour': hour, 'minute': minute,
            'lat': lat, 'lon': lon,
            'day_of_week': day_of_week,
            'tz': tz_str,
        },
        'reference': {
            'zodiac_full': ZODIAC_FULL,
            'zodiac_sym': ZODIAC_SYM,
            'houses_thai': HOUSES_THAI,
            'aspect_colors': ASPECT_COLORS,
            'aspect_thai': ASPECT_THAI,
        }
    }

# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No input JSON provided'}))
        sys.exit(1)
    try:
        inp = json.loads(sys.argv[1])
        result = generate_chart_json(
            year=inp['year'], month=inp['month'], day=inp['day'],
            hour=inp.get('hour', 12), minute=inp.get('minute', 0),
            lat=inp.get('lat', 13.7563), lon=inp.get('lon', 100.5018),
            tz_str=inp.get('tz', 'Asia/Bangkok'),
        )
        print(json.dumps(result, ensure_ascii=False, indent=None))
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
