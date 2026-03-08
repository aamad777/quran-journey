import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { Clock, MapPin } from "lucide-react";

interface PrayerBannerProps {
  textColor?: string;
  mutedText?: string;
  accentColor?: string;
  cardBg?: string;
}

const PrayerBanner = ({ textColor, mutedText, accentColor, cardBg }: PrayerBannerProps) => {
  const { nextPrayer, locationGranted, loading, requestLocation } = usePrayerTimes();

  if (loading) return null;

  if (!locationGranted) {
    return (
      <div className="border-b backdrop-blur-sm" style={{ backgroundColor: accentColor ? `${accentColor}15` : undefined, borderColor: mutedText ? `${mutedText}30` : undefined }}>
        <div className="container max-w-4xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
          <MapPin className="w-3.5 h-3.5" style={{ color: accentColor }} />
          <span className="text-xs" style={{ color: mutedText }}>فعّل الموقع لعرض مواقيت الصلاة</span>
          <button
            onClick={requestLocation}
            className="text-xs font-semibold hover:underline mr-1"
            style={{ color: accentColor }}
          >
            تفعيل
          </button>
        </div>
      </div>
    );
  }

  if (!nextPrayer) return null;

  return (
    <div className="border-b backdrop-blur-sm" style={{ backgroundColor: accentColor ? `${accentColor}15` : undefined, borderColor: mutedText ? `${mutedText}30` : undefined }}>
      <div className="container max-w-4xl mx-auto px-4 py-2 flex items-center justify-center gap-3" dir="rtl">
        <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
        <span className="text-xs font-semibold" style={{ color: textColor }}>
          صلاة {nextPrayer.nameAr}
        </span>
        <span className="text-xs" style={{ color: mutedText }}>
          {nextPrayer.time}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: accentColor ? `${accentColor}25` : undefined, color: accentColor }}>
          بعد {nextPrayer.remainingFormatted}
        </span>
      </div>
    </div>
  );
};

export default PrayerBanner;
