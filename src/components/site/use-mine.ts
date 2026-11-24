import { useEffect, useState } from "react";
import { getMine, type Mine } from "@/lib/circle/api";
import { errText } from "@/lib/circle/format";

export function useMine(enabled: boolean) {
  const [mine, setMine] = useState<Mine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setMine(null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    getMine()
      .then((data) => {
        if (!live) return;
        setMine(data);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (live) setError(errText(cause));
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [enabled, tick]);

  return { mine, error, loading, reload: () => setTick((n) => n + 1) };
}
