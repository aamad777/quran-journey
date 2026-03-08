import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { Clock, MapPin } from "lucide-react";

interface PrayerBannerProps {
  textColor?: string;
  mutedText?: string;
  accentColor?: string;
  cardBg?: string;
}

const PrayerBanner = ({ textColor, mutedText, accentColor }: PrayerBannerProps) => {
  const { nextPrayer, locationGranted, loading, requestLocation } = usePrayerTimes();

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
    <div className="py-2 flex flex-col items-center gap-1" dir="rtl">
      <div className="flex items-center justify-center gap-3">
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
      </div>
      <div className="w-24 h-px bg-black/60" />
    </div>
  );
};

export default PrayerBanner;
