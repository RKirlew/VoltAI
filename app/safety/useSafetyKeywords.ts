"use client";

import { useEffect, useState } from "react";
import { loadSafetyKeywords } from "./safetyLoader";

export function useSafetyKeywords() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadSafetyKeywords().then(words => {
      if (!mounted) return;
      setKeywords(words);
      setReady(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { keywords, ready };
}
