// Shared reciters list and audio URL helpers used across reading & mushaf views.

export type ReciterSource =
  | { type: "alquran"; id: string }
  | { type: "everyayah"; folder: string }
  | { type: "mp3quran"; server: string; path: string };

export interface Reciter {
  id: string;
  name: string;
  source: ReciterSource;
}

export const RECITERS: Reciter[] = [
  // --- alquran.cloud reciters (verse-by-verse) ---
  { id: "ar.alafasy", name: "مشاري العفاسي", source: { type: "alquran", id: "ar.alafasy" } },
  { id: "ar.abdurrahmaansudais", name: "عبدالرحمن السديس", source: { type: "alquran", id: "ar.abdurrahmaansudais" } },
  { id: "ar.husary", name: "محمود خليل الحصري", source: { type: "alquran", id: "ar.husary" } },
  { id: "ar.husarymujawwad", name: "الحصري (مجوّد)", source: { type: "alquran", id: "ar.husarymujawwad" } },
  { id: "ar.abdulsamad", name: "عبدالباسط عبدالصمد", source: { type: "alquran", id: "ar.abdulsamad" } },
  { id: "ar.shaatree", name: "أبو بكر الشاطري", source: { type: "alquran", id: "ar.shaatree" } },
  { id: "ar.ahmedajamy", name: "أحمد بن علي العجمي", source: { type: "alquran", id: "ar.ahmedajamy" } },
  { id: "ar.hudhaify", name: "علي بن عبدالرحمن الحذيفي", source: { type: "alquran", id: "ar.hudhaify" } },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي", source: { type: "alquran", id: "ar.mahermuaiqly" } },
  { id: "ar.saoodshuraym", name: "سعود الشريم", source: { type: "alquran", id: "ar.saoodshuraym" } },
  { id: "ar.ibrahimakhbar", name: "إبراهيم الأخضر", source: { type: "alquran", id: "ar.ibrahimakhbar" } },
  { id: "ar.muhammadayyoub", name: "محمد أيوب", source: { type: "alquran", id: "ar.muhammadayyoub" } },
  { id: "ar.muhammadjibreel", name: "محمد جبريل", source: { type: "alquran", id: "ar.muhammadjibreel" } },
  { id: "ar.hanirifai", name: "هاني الرفاعي", source: { type: "alquran", id: "ar.hanirifai" } },
  { id: "ar.abdullahbasfar", name: "عبدالله بصفر", source: { type: "alquran", id: "ar.abdullahbasfar" } },
  { id: "ar.aymanswoaid", name: "أيمن سويد", source: { type: "alquran", id: "ar.aymanswoaid" } },
  { id: "ar.parhizgar", name: "شهريار پرهيزگار", source: { type: "alquran", id: "ar.parhizgar" } },
  // --- EveryAyah reciters (verse-by-verse) ---
  { id: "ea.nasser_alqatami", name: "ناصر القطامي", source: { type: "everyayah", folder: "Nasser_Alqatami_128kbps" } },
  { id: "ea.yasser_dussary", name: "ياسر الدوسري", source: { type: "everyayah", folder: "Yasser_Ad-Dussary_128kbps" } },
  { id: "ea.fares_abbad", name: "فارس عباد", source: { type: "everyayah", folder: "Fares_Abbad_64kbps" } },
  { id: "ea.salah_budair", name: "صلاح البدير", source: { type: "everyayah", folder: "Salah_Al_Budair_128kbps" } },
  { id: "ea.abdullah_matroud", name: "عبدالله المطرود", source: { type: "everyayah", folder: "Abdullah_Matroud_128kbps" } },
  { id: "ea.minshawy_murattal", name: "المنشاوي (مرتل)", source: { type: "everyayah", folder: "Minshawy_Murattal_128kbps" } },
  { id: "ea.minshawy_mujawwad", name: "المنشاوي (مجوّد)", source: { type: "everyayah", folder: "Minshawy_Mujawwad_192kbps" } },
  { id: "ea.ali_jaber", name: "علي جابر", source: { type: "everyayah", folder: "Ali_Jaber_64kbps" } },
  { id: "ea.khalefa_tunaiji", name: "خليفة الطنيجي", source: { type: "everyayah", folder: "khalefa_al_tunaiji_64kbps" } },
  { id: "ea.abdulbasit_mujawwad", name: "عبدالباسط (مجوّد)", source: { type: "everyayah", folder: "Abdul_Basit_Mujawwad_128kbps" } },
  { id: "ea.salaah_bukhatir", name: "صلاح بوخاطر", source: { type: "everyayah", folder: "Salaah_AbdulRahman_Bukhatir_128kbps" } },
  { id: "ea.muhsin_qasim", name: "محسن القاسم", source: { type: "everyayah", folder: "Muhsin_Al_Qasim_192kbps" } },
  { id: "ea.tablaway", name: "محمد الطبلاوي", source: { type: "everyayah", folder: "Mohammad_al_Tablaway_128kbps" } },
  { id: "ea.ghamadi", name: "سعد الغامدي", source: { type: "everyayah", folder: "Ghamadi_40kbps" } },
  // --- mp3quran.net reciters (surah-level audio) ---
  { id: "mp3.raad_kurdi", name: "رعد محمد الكردي", source: { type: "mp3quran", server: "https://server6.mp3quran.net", path: "kurdi" } },
];

export const pad3 = (n: number) => n.toString().padStart(3, "0");

export const getReciterById = (id: string): Reciter =>
  RECITERS.find((r) => r.id === id) || RECITERS[0];

/**
 * Resolve an audio URL for a single ayah.
 * For "alquran" sources, fetches the URL from the API (async).
 * For others, builds the URL directly (sync).
 */
export async function resolveAyahAudioUrl(
  reciter: Reciter,
  surah: number,
  ayah: number
): Promise<string | null> {
  const src = reciter.source;
  switch (src.type) {
    case "alquran": {
      try {
        const res = await fetch(
          `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${src.id}`
        );
        const data = await res.json();
        return data?.data?.audio || null;
      } catch {
        return null;
      }
    }
    case "everyayah":
      return `https://everyayah.com/data/${src.folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
    case "mp3quran":
      // surah-level only
      return `${src.server}/${src.path}/${pad3(surah)}.mp3`;
    default:
      return null;
  }
}
