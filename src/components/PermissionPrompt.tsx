import { usePermissions } from "@/hooks/usePermissions";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { MapPin, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const PermissionPrompt = () => {
  const { micGranted, dismissed, requestMicrophone, dismiss } = usePermissions();
  const { locationGranted, requestLocation } = usePrayerTimes();

  // Don't show if dismissed or all permissions granted
  if (dismissed) return null;
  if (micGranted && locationGranted) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-4 mx-auto max-w-2xl shadow-sm" dir="rtl">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">السماح بالأذونات</p>
        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {!locationGranted && (
          <button
            onClick={requestLocation}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-right"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">الموقع الجغرافي</p>
              <p className="text-xs text-muted-foreground">لعرض مواقيت الصلاة حسب موقعك</p>
            </div>
          </button>
        )}
        {!micGranted && (
          <button
            onClick={requestMicrophone}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-right"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">الميكروفون</p>
              <p className="text-xs text-muted-foreground">لوضع التدريب الصوتي على القراءة</p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default PermissionPrompt;
