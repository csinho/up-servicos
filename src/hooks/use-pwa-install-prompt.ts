import { useCallback, useEffect, useState } from "react";
import {
  type BeforeInstallPromptEvent,
  canShowPwaInstallUi,
  isIosDevice,
  isPwaInstalled,
} from "@/lib/pwa-install";

export function usePwaInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setMounted(true);
    setInstalled(isPwaInstalled());
    setIos(isIosDevice());
  }, []);

  useEffect(() => {
    if (!canShowPwaInstallUi()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const visible =
    mounted && !installed && canShowPwaInstallUi() && (!!deferredPrompt || ios);

  return {
    visible,
    canInstall: !!deferredPrompt,
    showIosGuide: ios && !deferredPrompt,
    install,
  };
}
