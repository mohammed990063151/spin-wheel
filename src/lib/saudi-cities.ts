export type RegionId = "central" | "eastern" | "western" | "southern" | "northern";

export type SaudiCity = { id: string; ar: string; en: string; region: RegionId };

export const ALL_SAUDI_CITIES: SaudiCity[] = [
  // الوسطى — الرياض والقصيم
  { id: "riyadh", ar: "الرياض", en: "Riyadh", region: "central" },
  { id: "diriyah", ar: "الدرعية", en: "Diriyah", region: "central" },
  { id: "kharj", ar: "الخرج", en: "Al Kharj", region: "central" },
  { id: "dawadmi", ar: "الدوادمي", en: "Al Dawadmi", region: "central" },
  { id: "majmaah", ar: "المجمعة", en: "Al Majmaah", region: "central" },
  { id: "zulfi", ar: "الزلفي", en: "Al Zulfi", region: "central" },
  { id: "shaqra", ar: "شقراء", en: "Shaqra", region: "central" },
  { id: "afif", ar: "عفيف", en: "Afif", region: "central" },
  { id: "quwayiyah", ar: "القويعية", en: "Al Quwayiyah", region: "central" },
  { id: "wadi-aldawasir", ar: "وادي الدواسر", en: "Wadi Al Dawasir", region: "central" },
  { id: "aflaj", ar: "الأفلاج", en: "Al Aflaj", region: "central" },
  { id: "hotat-bani-tamim", ar: "حوطة بني تميم", en: "Howtat Bani Tamim", region: "central" },
  { id: "hariq", ar: "الحريق", en: "Al Hariq", region: "central" },
  { id: "muzahmiyah", ar: "المزاحمية", en: "Al Muzahmiyah", region: "central" },
  { id: "rumah", ar: "رماح", en: "Rumah", region: "central" },
  { id: "thadiq", ar: "ثادق", en: "Thadiq", region: "central" },
  { id: "huraymila", ar: "حريملاء", en: "Huraymila", region: "central" },
  { id: "dhruma", ar: "ضرما", en: "Dhurma", region: "central" },
  { id: "ghat", ar: "الغاط", en: "Al Ghat", region: "central" },
  { id: "artawiyah", ar: "الأرطاوية", en: "Al Artawiyah", region: "central" },
  { id: "sajir", ar: "ساجر", en: "Sajir", region: "central" },
  { id: "marat", ar: "مرات", en: "Marat", region: "central" },
  { id: "rayn", ar: "الرين", en: "Al Rayn", region: "central" },
  { id: "sulayyil", ar: "السليل", en: "As Sulayyil", region: "central" },
  { id: "tumair", ar: "تمير", en: "Tumair", region: "central" },
  { id: "buraydah", ar: "بريدة", en: "Buraydah", region: "central" },
  { id: "unayzah", ar: "عنيزة", en: "Unayzah", region: "central" },
  { id: "rass", ar: "الرس", en: "Ar Rass", region: "central" },
  { id: "bukayriyah", ar: "البكيرية", en: "Al Bukayriyah", region: "central" },
  { id: "midhnab", ar: "المذنب", en: "Al Midhnab", region: "central" },
  { id: "badai", ar: "البدائع", en: "Al Badai", region: "central" },
  { id: "riyadh-alkhabra", ar: "رياض الخبراء", en: "Riyadh Al Khabra", region: "central" },
  { id: "asyah", ar: "الأسياح", en: "Al Asyah", region: "central" },
  { id: "nabhaniyah", ar: "النبهانية", en: "An Nabhaniyah", region: "central" },
  { id: "uyun-aljawa", ar: "عيون الجواء", en: "Uyun Al Jawa", region: "central" },
  { id: "khabra", ar: "الخبراء", en: "Al Khabra", region: "central" },

  // الشرقية
  { id: "dammam", ar: "الدمام", en: "Dammam", region: "eastern" },
  { id: "khobar", ar: "الخبر", en: "Khobar", region: "eastern" },
  { id: "dhahran", ar: "الظهران", en: "Dhahran", region: "eastern" },
  { id: "ahsa", ar: "الأحساء", en: "Al Ahsa", region: "eastern" },
  { id: "hofuf", ar: "الهفوف", en: "Hofuf", region: "eastern" },
  { id: "mubarraz", ar: "المبرز", en: "Al Mubarraz", region: "eastern" },
  { id: "jubail", ar: "الجبيل", en: "Jubail", region: "eastern" },
  { id: "qatif", ar: "القطيف", en: "Qatif", region: "eastern" },
  { id: "saihat", ar: "سيهات", en: "Saihat", region: "eastern" },
  { id: "safwa", ar: "صفوى", en: "Safwa", region: "eastern" },
  { id: "anak", ar: "عنك", en: "Anak", region: "eastern" },
  { id: "tarout", ar: "تاروت", en: "Tarout", region: "eastern" },
  { id: "hafr-albatin", ar: "حفر الباطن", en: "Hafr Al Batin", region: "eastern" },
  { id: "ras-tanura", ar: "رأس تنورة", en: "Ras Tanura", region: "eastern" },
  { id: "abqaiq", ar: "بقيق", en: "Abqaiq", region: "eastern" },
  { id: "nairiyah", ar: "النعيرية", en: "Nairiyah", region: "eastern" },
  { id: "khafji", ar: "الخفجي", en: "Khafji", region: "eastern" },
  { id: "qarya-al-ulya", ar: "قرية العليا", en: "Qaryat Al Ulya", region: "eastern" },
  { id: "oyoon", ar: "العيون", en: "Al Oyoun", region: "eastern" },

  // الغربية — مكة والمدينة
  { id: "makkah", ar: "مكة المكرمة", en: "Makkah", region: "western" },
  { id: "jeddah", ar: "جدة", en: "Jeddah", region: "western" },
  { id: "taif", ar: "الطائف", en: "Taif", region: "western" },
  { id: "madinah", ar: "المدينة المنورة", en: "Madinah", region: "western" },
  { id: "yanbu", ar: "ينبع", en: "Yanbu", region: "western" },
  { id: "rabigh", ar: "رابغ", en: "Rabigh", region: "western" },
  { id: "lith", ar: "الليث", en: "Al Lith", region: "western" },
  { id: "qunfudhah", ar: "القنفذة", en: "Al Qunfudhah", region: "western" },
  { id: "khulais", ar: "خليص", en: "Khulais", region: "western" },
  { id: "kamil", ar: "الكامل", en: "Al Kamil", region: "western" },
  { id: "ula", ar: "العلا", en: "Al Ula", region: "western" },
  { id: "mahd-aldhahab", ar: "مهد الذهب", en: "Mahd Al Dhahab", region: "western" },
  { id: "badr", ar: "بدر", en: "Badr", region: "western" },
  { id: "khaybar", ar: "خيبر", en: "Khaybar", region: "western" },
  { id: "hinakiyah", ar: "الحناكية", en: "Al Hinakiyah", region: "western" },
  { id: "jumum", ar: "الجموم", en: "Al Jumum", region: "western" },
  { id: "turabah", ar: "تربة", en: "Turabah", region: "western" },
  { id: "ranyah", ar: "رنية", en: "Ranyah", region: "western" },
  { id: "khurma", ar: "الخرمة", en: "Al Khurma", region: "western" },
  { id: "adam", ar: "أضم", en: "Adam", region: "western" },
  { id: "bahrah", ar: "بحرة", en: "Bahrah", region: "western" },

  // الجنوبية — عسير جازان نجران الباحة
  { id: "abha", ar: "أبها", en: "Abha", region: "southern" },
  { id: "khamis-mushait", ar: "خميس مشيط", en: "Khamis Mushait", region: "southern" },
  { id: "jazan", ar: "جازان", en: "Jazan", region: "southern" },
  { id: "najran", ar: "نجران", en: "Najran", region: "southern" },
  { id: "baha", ar: "الباحة", en: "Al Baha", region: "southern" },
  { id: "muhayil", ar: "محايل عسير", en: "Muhayil Asir", region: "southern" },
  { id: "sabya", ar: "صبيا", en: "Sabya", region: "southern" },
  { id: "samtah", ar: "صامطة", en: "Samtah", region: "southern" },
  { id: "baysh", ar: "بيش", en: "Baysh", region: "southern" },
  { id: "dhahran-aljanub", ar: "ظهران الجنوب", en: "Dhahran Al Janub", region: "southern" },
  { id: "sarat-abidah", ar: "سراة عبيدة", en: "Sarat Abidah", region: "southern" },
  { id: "namas", ar: "النماص", en: "Al Namas", region: "southern" },
  { id: "balqarn", ar: "بلقرن", en: "Balqarn", region: "southern" },
  { id: "bisha", ar: "بيشة", en: "Bisha", region: "southern" },
  { id: "rijal-almaa", ar: "رجال ألمع", en: "Rijal Almaa", region: "southern" },
  { id: "abu-areesh", ar: "أبو عريش", en: "Abu Arish", region: "southern" },
  { id: "sharurah", ar: "شرورة", en: "Sharurah", region: "southern" },
  { id: "baljurashi", ar: "بلجرشي", en: "Baljurashi", region: "southern" },
  { id: "ahad-rufaidah", ar: "أحد رفيدة", en: "Ahad Rufaidah", region: "southern" },
  { id: "ahad-masarihah", ar: "أحد المسارحة", en: "Ahad Al Masarihah", region: "southern" },
  { id: "damad", ar: "ضمد", en: "Damad", region: "southern" },
  { id: "farasan", ar: "فرسان", en: "Farasan", region: "southern" },
  { id: "mandaq", ar: "المندق", en: "Al Mandaq", region: "southern" },
  { id: "mikhwah", ar: "المخواة", en: "Al Mikhwah", region: "southern" },
  { id: "qilwah", ar: "قلوة", en: "Qilwah", region: "southern" },

  // الشمالية — تبوك حائل الحدود الشمالية الجوف
  { id: "tabuk", ar: "تبوك", en: "Tabuk", region: "northern" },
  { id: "hail", ar: "حائل", en: "Hail", region: "northern" },
  { id: "arar", ar: "عرعر", en: "Arar", region: "northern" },
  { id: "sakaka", ar: "سكاكا", en: "Sakaka", region: "northern" },
  { id: "qurayyat", ar: "القريات", en: "Al Qurayyat", region: "northern" },
  { id: "turaif", ar: "طريف", en: "Turaif", region: "northern" },
  { id: "dumat-aljandal", ar: "دومة الجندل", en: "Dumat Al Jandal", region: "northern" },
  { id: "alwajh", ar: "الوجه", en: "Al Wajh", region: "northern" },
  { id: "duba", ar: "ضباء", en: "Duba", region: "northern" },
  { id: "tayma", ar: "تيماء", en: "Tayma", region: "northern" },
  { id: "haql", ar: "حقل", en: "Haql", region: "northern" },
  { id: "umluj", ar: "أملج", en: "Umluj", region: "northern" },
  { id: "rafha", ar: "رفحاء", en: "Rafha", region: "northern" },
  { id: "baqaa", ar: "بقعاء", en: "Baqaa", region: "northern" },
  { id: "shinan", ar: "الشنان", en: "Ash Shinan", region: "northern" },
  { id: "mawqaq", ar: "موقق", en: "Mawqaq", region: "northern" },
  { id: "hail-ghazalah", ar: "الغزالة", en: "Al Ghazalah", region: "northern" },
];

export function allSaudiCities(locale: "ar" | "en" = "ar"): SaudiCity[] {
  return [...ALL_SAUDI_CITIES].sort((a, b) =>
    a[locale].localeCompare(b[locale], locale === "ar" ? "ar" : "en"),
  );
}

export function findCityById(cityId: string): SaudiCity | undefined {
  return ALL_SAUDI_CITIES.find((city) => city.id === cityId);
}

export function cityLabel(cityId: string, locale: "ar" | "en") {
  const city = findCityById(cityId);
  if (!city) return cityId;
  return locale === "en" ? city.en : city.ar;
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ");
}

function foldArabic(value: string) {
  return value.replace(/^ال/, "");
}

function matchScore(query: string, foldedQuery: string, city: SaudiCity) {
  const ar = normalizeSearch(city.ar);
  const en = normalizeSearch(city.en);
  const arFold = foldArabic(ar);
  const haystacks = [ar, en, arFold, city.id];

  if (haystacks.some((value) => value === query || value === foldedQuery)) return 100;
  if (haystacks.some((value) => value.startsWith(query) || value.startsWith(foldedQuery))) return 80;
  if (haystacks.some((value) => value.includes(query) || value.includes(foldedQuery))) return 40;
  return 0;
}

export function searchSaudiCities(query: string, locale: "ar" | "en" = "ar", limit = 10): SaudiCity[] {
  const q = normalizeSearch(query);
  if (!q) return allSaudiCities(locale).slice(0, limit);

  return ALL_SAUDI_CITIES.map((city) => ({ city, score: matchScore(q, foldArabic(q), city) }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || a.city[locale].localeCompare(b.city[locale], locale === "ar" ? "ar" : "en"),
    )
    .slice(0, limit)
    .map((item) => item.city);
}

export function resolveSaudiCity(query: string): SaudiCity | undefined {
  const q = normalizeSearch(query);
  if (!q) return undefined;
  const folded = foldArabic(q);
  const exact = ALL_SAUDI_CITIES.find((city) => matchScore(q, folded, city) >= 100);
  if (exact) return exact;
  const ranked = searchSaudiCities(query, "ar", 5);
  if (ranked.length === 1 && q.length >= 2) return ranked[0];
  return undefined;
}
