import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { Clock, MapPin } from "lucide-react";

const PrayerBanner = () => {
  const { nextPrayer, locationGranted, loading, requestLocation } = usePrayerTimes();

  if (loading) return null;

  if (!locationGranted) {
    return (
      <div className="bg-primary/10 border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">فعّل الموقع لعرض مواقيت الصلاة</span>
          <button
            onClick={requestLocation}
            className="text-xs text-primary font-semibold hover:underline mr-1"
          >
            تفعيل
          </button>
        </div>
      </div>
    );
  }

  if (!nextPrayer) return null;

  return (
    <div className="bg-primary/10 border-b border-border">
      <div className="container max-w-4xl mx-auto px-4 py-2 flex items-center justify-center gap-3" dir="rtl">
        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-xs font-semibold text-foreground">
          صلاة {nextPrayer.nameAr}
        </span>
        <span className="text-xs text-muted-foreground">
          {nextPrayer.time}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
          بعد {nextPrayer.remainingFormatted}
        </span>
      </div>
    </div>
  );
};

export default PrayerBanner;
