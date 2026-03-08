import { useState, useEffect, useCallback } from "react";

export const usePermissions = () => {
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("quran_perms_dismissed") === "true"; } catch { return false; }
  });

  useEffect(() => {
    // Check mic permission state if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then(status => {
        setMicGranted(status.state === "granted");
        status.onchange = () => setMicGranted(status.state === "granted");
      }).catch(() => {});
    }
  }, []);

  const requestMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setMicGranted(true);
    } catch {
      setMicGranted(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem("quran_perms_dismissed", "true");
  }, []);

  return { micGranted, dismissed, requestMicrophone, dismiss };
};
