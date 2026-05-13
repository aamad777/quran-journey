import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { Clock, MapPin, ChevronDown, Volume2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface PrayerBannerProps {
  textColor?: string;
  mutedText?: string;
  accentColor?: string;
  cardBg?: string;
}

const ADHAN_URL = "https://www.islamcan.com/audio/adhan/azan2.mp3";

const PrayerBanner = ({ textColor, mutedText, accentColor, cardBg }: PrayerBannerProps) => {
  const {
    nextPrayer,
    allPrayers,
    locationGranted,
    loading,
    requestLocation,
    activeAdhan,
    dismissAdhan,
  } = usePrayerTimes();
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play adhan when triggered
  useEffect(() => {
    if (activeAdhan && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } else if (!activeAdhan && audioRef.current) {
      audioRef.current.pause();
    }
  }, [activeAdhan]);

  if (loading) return null;

  if (!locationGranted) {
    return (
      <div className="py-1.5 flex items-center justify-center gap-2">
        <MapPin className="w-3 h-3" style={{ color: accentColor }} />
        <span className="text-[11px]" style={{ color: mutedText }}>فعّل الموقع لعرض مواقيت الصلاة</span>
        <button
          onClick={requestLocation}
          className="text-[11px] font-semibold hover:underline"
          style={{ color: accentColor }}
        >
          تفعيل
        </button>
      </div>
    );
  }

  if (!nextPrayer) return null;

  return (
    <>
      <audio ref={audioRef} src={ADHAN_URL} preload="none" />

      <div className="py-2 flex flex-col items-center gap-1" dir="rtl">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center justify-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Clock className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
          <span className="text-sm font-bold" style={{ color: textColor }}>
            صلاة {nextPrayer.nameAr}
          </span>
          <span className="text-sm font-semibold" style={{ color: mutedText }}>
            {nextPrayer.time}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md font-semibold text-black bg-black/10">
            بعد {nextPrayer.remainingFormatted}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            style={{ color: mutedText }}
          />
        </button>
        <div className="w-24 h-px bg-black/60" />

        {expanded && (
          <div
            className="mt-2 w-full max-w-md rounded-xl backdrop-blur-md p-2 grid grid-cols-1 gap-1"
            style={{ backgroundColor: `${cardBg || "#ffffff"}cc` }}
          >
            <div className="grid grid-cols-4 gap-2 px-2 pb-1 text-[10px] font-semibold" style={{ color: mutedText }}>
              <span>الصلاة</span>
              <span>الأذان</span>
              <span>الإقامة</span>
              <span>متبقي للإقامة</span>
            </div>
            {allPrayers.map((p) => (
              <div
                key={p.name}
                className="grid grid-cols-4 gap-2 items-center px-2 py-1.5 rounded-lg text-xs"
                style={
                  p.isNext
                    ? { backgroundColor: `${accentColor}22`, color: textColor }
                    : { color: textColor }
                }
              >
                <span className="font-bold">{p.nameAr}</span>
                <span className="font-mono" style={{ color: mutedText }}>{p.time}</span>
                <span className="font-mono" style={{ color: mutedText }}>{p.iqamaTime}</span>
                <span
                  className="font-mono font-semibold text-[11px]"
                  style={{ color: p.iqamaRemainingMs > 0 ? accentColor : mutedText }}
                >
                  {p.iqamaRemainingMs > 0 ? p.iqamaRemainingFormatted : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adhan popup */}
      {activeAdhan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="rtl">
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl"
            style={{ backgroundColor: cardBg || "#ffffff", color: textColor }}
          >
            <button
              onClick={() => { dismissAdhan(); audioRef.current?.pause(); }}
              className="absolute top-3 left-3 p-1.5 rounded-full hover:bg-black/10"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 animate-pulse" style={{ backgroundColor: `${accentColor}33` }}>
              <Volume2 className="w-8 h-8" style={{ color: accentColor }} />
            </div>
            <h2 className="font-arabic text-2xl font-bold mb-1">حان الآن موعد أذان</h2>
            <h3 className="font-arabic text-3xl font-bold mb-3" style={{ color: accentColor }}>
              صلاة {activeAdhan.nameAr}
            </h3>
            <p className="text-sm opacity-80 mb-4">حيّ على الصلاة • حيّ على الفلاح</p>
            <button
              onClick={() => { dismissAdhan(); audioRef.current?.pause(); }}
              className="w-full py-2.5 rounded-xl font-semibold text-white"
              style={{ backgroundColor: accentColor }}
            >
              إيقاف الأذان
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PrayerBanner;
