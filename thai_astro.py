import swisseph as swe
import datetime
import pytz
import pandas as pd

# ==========================================
# Core Reference Data
# ==========================================
ZODIAC_FULL = ["เมษ", "พฤษภ", "มิถุน", "กรกฎ", "สิงห์", "กันย์", "ตุลย์", "พิจิก", "ธนู", "มังกร", "กุมภ์", "มีน"]
ZODIAC_ABBR = ["มษ", "พภ", "มถ", "กฎ", "สห", "กน", "ตล", "พจ", "ธน", "มก", "กภ", "มน"]
HOUSES = ["ตนุ", "กดุมภะ", "สหัชชะ", "พันธุ", "ปุตตะ", "อริ", "ปัตนิ", "มรณะ", "สุภะ", "กัมมะ", "ลาภะ", "วินาศ"]
NAKSHATRAS = ["อัศวินี", "ภรณี", "กฤติกา", "โรหิณี", "มฤคศิร", "อารทรา", "ปุนัพสุ", "บุษยะ", "อาศเลษา", "มาฆะ", "บุรพผลคุนี", "อุตรผลคุนี", "หัสตะ", "จิตรา", "สวาตี", "วิสาขะ", "อนุราธะ", "เชษฐา", "มูละ", "บุรพษาฒ", "อุตราษาฒ", "ศรวณะ", "ธนิษฐา", "ศตภิษัช", "บุรพภัทรบท", "อุตรภัทรบท", "เรวดี"]

PLANETS = {
    '๑.อาทิตย์': swe.SUN, '๒.จันทร์': swe.MOON, '๓.อังคาร': swe.MARS, 
    '๔.พุธ': swe.MERCURY, '๕.พฤหัสบดี': swe.JUPITER, '๖.ศุกร์': swe.VENUS, 
    '๗.เสาร์': swe.SATURN, '๘.ราหู': swe.MEAN_NODE, '๙.เกตุ': -1, '๐.มฤตยู': swe.URANUS
}

def get_taksa(day_of_week):
    taksa_seq = ['๑.อาทิตย์', '๒.จันทร์', '๓.อังคาร', '๔.พุธ', '๗.เสาร์', '๕.พฤหัสบดี', '๘.ราหู', '๖.ศุกร์']
    roles = ['บริวาร', 'อายุ', 'เดช', 'ศรี', 'มูละ', 'อุตสาหะ', 'มนตรี', 'กาลกิณี']
    day_map = {'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'saturday': 4, 'thursday': 5, 'wednesday_night': 6, 'friday': 7}
    start_idx = day_map.get(day_of_week.lower(), 0)
    return {taksa_seq[(start_idx + i) % 8]: roles[i] for i in range(8)}

def get_standard(planet_name, sign_name):
    # ปรับปรุง: เสาร์ (๗) และ ราหู (๘) เป็นเกษตรราศีกุมภ์ ตามการตั้งค่า
    stds = {
        '๑.อาทิตย์': {'เมษ':'อุจจ์', 'สิงห์':'เกษตร', 'ตุลย์':'นิจ', 'กุมภ์':'ประ'},
        '๒.จันทร์': {'พฤษภ':'อุจจ์', 'กรกฎ':'เกษตร', 'พิจิก':'นิจ', 'มังกร':'ประ', 'กันย์':'ราชาโชค'},
        '๓.อังคาร': {'มังกร':'อุจจ์', 'เมษ':'เกษตร', 'พิจิก':'เกษตร', 'กรกฎ':'นิจ', 'ตุลย์':'ประ', 'พฤษภ':'ประ'},
        '๔.พุธ': {'กันย์':'อุจจ์/เกษตร', 'มิถุน':'เกษตร', 'มีน':'นิจ/ประ', 'ธนู':'ประ', 'สิงห์':'ราชาโชค'},
        '๕.พฤหัสบดี': {'กรกฎ':'อุจจ์', 'ธนู':'เกษตร', 'มีน':'เกษตร', 'มังกร':'นิจ', 'มิถุน':'ประ', 'กันย์':'ประ', 'เมษ':'ราชาโชค'},
        '๖.ศุกร์': {'มีน':'อุจจ์', 'พฤษภ':'เกษตร', 'ตุลย์':'เกษตร', 'กันย์':'นิจ', 'พิจิก':'ประ', 'เมษ':'ประ'},
        '๗.เสาร์': {'ตุลย์':'อุจจ์', 'มังกร':'เกษตร', 'กุมภ์':'เกษตร', 'เมษ':'นิจ', 'กรกฎ':'ประ', 'สิงห์':'ประ', 'พิจิก':'ราชาโชค'},
        '๘.ราหู': {'พิจิก':'อุจจ์', 'กุมภ์':'เกษตร', 'พฤษภ':'นิจ', 'สิงห์':'ประ'}
    }
    return stds.get(planet_name, {}).get(sign_name, '-')

def calculate_anto_natee_lagna(y, m, d, h, mn, lat, lon, tz_str='Asia/Bangkok'):
    """ คำนวณอันโตนาทีสามัญ โดยใช้สมผุสอาทิตย์อุทัย (เวลาอาทิตย์ขึ้นจริง) """
    tz = pytz.timezone(tz_str)
    
    # คำนวณเวลาอาทิตย์ขึ้นจริงแบบคร่าวๆ (ประมาณ 06:00-06:30 น.)
    # เพื่อความง่ายและเสถียร ใช้เวลา 06:20 เป็นค่าเฉลี่ยสำหรับหน้าหนาว (เดือน 12) ในไทย
    # (หากต้องการแม่นยำระดับวินาทีต้องใช้ swe.rise_trans)
    sunrise_h, sunrise_m = 6, 20 if m in [11, 12, 1] else 6
    
    calc_date = datetime.datetime(y, m, d, sunrise_h, sunrise_m)
    if h < 6:
        calc_date -= datetime.timedelta(days=1)
        
    sunrise_utc = tz.localize(calc_date).astimezone(pytz.utc)
    jd_sunrise = swe.julday(sunrise_utc.year, sunrise_utc.month, sunrise_utc.day, sunrise_utc.hour + sunrise_utc.minute/60.0)
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    sun_pos, _ = swe.calc_ut(jd_sunrise, swe.SUN, swe.FLG_SIDEREAL)
    sun_degree = sun_pos[0]
    
    sun_sign_idx = int(sun_degree / 30)
    deg_in_sign = sun_degree % 30

    # อันโตนาทีสามัญ (กรุงเทพฯ)
    anto_mins = [116, 122, 132, 132, 122, 116, 116, 122, 132, 132, 122, 116]

    birth_total_mins = h * 60 + mn
    sunrise_total_mins = sunrise_h * 60 + sunrise_m
    elapsed_mins = birth_total_mins - sunrise_total_mins
    if elapsed_mins < 0: elapsed_mins += 1440

    time_remaining_in_sun_sign = ((30.0 - deg_in_sign) / 30.0) * anto_mins[sun_sign_idx]
    current_sign = sun_sign_idx

    if elapsed_mins <= time_remaining_in_sun_sign:
        lagna_degree = deg_in_sign + ((elapsed_mins / anto_mins[current_sign]) * 30.0)
    else:
        elapsed_mins -= time_remaining_in_sun_sign
        current_sign = (current_sign + 1) % 12
        while elapsed_mins > anto_mins[current_sign]:
            elapsed_mins -= anto_mins[current_sign]
            current_sign = (current_sign + 1) % 12
        lagna_degree = (elapsed_mins / anto_mins[current_sign]) * 30.0

    return (current_sign * 30) + lagna_degree, current_sign

def generate_thai_astrology_chart(y, m, d, h, mn, lat, lon, day_of_week, tz_str='Asia/Bangkok'):
    tz = pytz.timezone(tz_str)
    utc_dt = tz.localize(datetime.datetime(y, m, d, h, mn)).astimezone(pytz.utc)
    jd = swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, utc_dt.hour + utc_dt.minute/60.0)
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    taksa = get_taksa(day_of_week)
    lagna_abs_deg, asc_sign = calculate_anto_natee_lagna(y, m, d, h, mn, lat, lon, tz_str)

    data = {}
    sign_indices = {}
    
    for name, pid in PLANETS.items():
        if pid == -1: 
            # *หมายเหตุ*: เกตุในโค้ดนี้คือ Ketu สากล (ตรงข้ามราหู) 
            # หากต้องการให้แสดงเป็น "-" ไว้ก่อนเพื่อเตือนว่าไม่ใช่เกตุสุริยยาตร์ สามารถปิดโค้ดส่วนนี้ได้
            lon_deg = (data['๘.ราหู']['raw_lon'] + 180) % 360
        else:
            pos, _ = swe.calc_ut(jd, pid, swe.FLG_SIDEREAL)
            lon_deg = pos[0]

        s_idx = int(lon_deg / 30)
        deg, minutes = int(lon_deg % 30), int((lon_deg % 30 * 60) % 60)
        sign_indices[name] = s_idx
        
        data[name] = {
            'raw_lon': lon_deg, 'sign': ZODIAC_FULL[s_idx], 'pos': f"{deg:02d}°{minutes:02d}'",
            'house': HOUSES[(s_idx - asc_sign) % 12],
            'treyang': ZODIAC_ABBR[(s_idx + (int((lon_deg % 30) / 10) * 4)) % 12],
            'nawang': ZODIAC_ABBR[(int(lon_deg / (360/108))) % 12],
            'nakshatra': f"{NAKSHATRAS[int(lon_deg / (360/27))]} ({int(((lon_deg % (360/27)) / ((360/27)/4)) + 1)})",
            'taksa': taksa.get(name, '-'), 'std': get_standard(name, ZODIAC_FULL[s_idx])
        }

    aspects = {p: {'Kum':[], 'Leng':[], 'Yoke':[], 'Chak':[], 'Trikon':[]} for p in sign_indices}
    p_keys = list(sign_indices.keys())
    for i in range(len(p_keys)):
        for j in range(i+1, len(p_keys)):
            p1, p2 = p_keys[i], p_keys[j]
            dist = abs(sign_indices[p1] - sign_indices[p2])
            dist = dist if dist <= 6 else 12 - dist
            p1_char, p2_char = p1[0], p2[0] 
            
            if dist == 0: aspects[p1]['Kum'].append(p2_char); aspects[p2]['Kum'].append(p1_char)
            elif dist == 6: aspects[p1]['Leng'].append(p2_char); aspects[p2]['Leng'].append(p1_char)
            elif dist in [2, 10]: aspects[p1]['Yoke'].append(p2_char); aspects[p2]['Yoke'].append(p1_char)
            elif dist in [3, 9]: aspects[p1]['Chak'].append(p2_char); aspects[p2]['Chak'].append(p1_char)
            elif dist in [4, 8]: aspects[p1]['Trikon'].append(p2_char); aspects[p2]['Trikon'].append(p1_char)

    df_rows = []
    l_deg, l_minutes = int(lagna_abs_deg % 30), int((lagna_abs_deg % 30 * 60) % 60)
    df_rows.append({
        'ดาว/ปัจจัย': 'ล.ลัคนา', 'ราศี': ZODIAC_FULL[asc_sign], 'องศา': f"{l_deg:02d}°{l_minutes:02d}'",
        'เรือน': 'ตนุ', 'ตรียางค์': ZODIAC_ABBR[(asc_sign + (int((lagna_abs_deg%30)/10)*4))%12],
        'นวางค์': ZODIAC_ABBR[(int(lagna_abs_deg/(360/108)))%12],
        'นักษัตรฤกษ์ (บาท)': f"{NAKSHATRAS[int(lagna_abs_deg/(360/27))]} ({int(((lagna_abs_deg%(360/27))/((360/27)/4))+1)})",
        'ทักษา': '-', 'มาตรฐาน': '-', 'กุม': '-', 'เล็ง': '-', 'โยค': '-', 'ฉาก': '-', 'ตรีโกณ': '-'
    })

    for p, d in data.items():
        a = aspects[p]
        df_rows.append({
            'ดาว/ปัจจัย': p, 'ราศี': d['sign'], 'องศา': d['pos'], 'เรือน': d['house'],
            'ตรียางค์': d['treyang'], 'นวางค์': d['nawang'], 'นักษัตรฤกษ์ (บาท)': d['nakshatra'],
            'ทักษา': d['taksa'], 'มาตรฐาน': d['std'],
            'กุม': ','.join(a['Kum']) or '-', 'เล็ง': ','.join(a['Leng']) or '-',
            'โยค': ','.join(a['Yoke']) or '-', 'ฉาก': ','.join(a['Chak']) or '-',
            'ตรีโกณ': ','.join(a['Trikon']) or '-'
        })

    return pd.DataFrame(df_rows)

if __name__ == "__main__":
    chart_df = generate_thai_astrology_chart(
        y=2004, m=12, d=7, h=13, mn=21, 
        lat=13.7563, lon=100.5018, day_of_week="Tuesday"
    )
    print(chart_df.to_string(index=False)) 