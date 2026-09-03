"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyDocumentLocale,
  isLocale,
  LOCALE_STORAGE,
  persistLocale,
  t as translate,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";

type TFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    applyDocumentLocale(next);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE);
      if (isLocale(stored) && stored !== initialLocale) {
        setLocale(stored);
        return;
      }
    } catch {
      /* ignore */
    }
    applyDocumentLocale(initialLocale);
  }, [initialLocale, setLocale]);

  const t = useCallback<TFn>(
    (key, vars) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
