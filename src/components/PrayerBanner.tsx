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
    <div className="py-1.5 flex items-center justify-center gap-2.5" dir="rtl">
      <Clock className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
      <span className="text-[11px] font-semibold" style={{ color: textColor }}>
        صلاة {nextPrayer.nameAr}
      </span>
      <span className="text-[11px]" style={{ color: mutedText }}>
        {nextPrayer.time}
      </span>
      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold" style={{ backgroundColor: accentColor ? `${accentColor}15` : undefined, color: accentColor }}>
        بعد {nextPrayer.remainingFormatted}
      </span>
    </div>
  );
};

export default PrayerBanner;
