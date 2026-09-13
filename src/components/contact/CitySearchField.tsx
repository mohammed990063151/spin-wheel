"use client";

import { KeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/LocaleProvider";
import { findCityById, resolveSaudiCity, searchSaudiCities } from "@/lib/saudi-cities";

type Props = {
  id: string;
  value: string;
  onChange: (cityId: string) => void;
};

export default function CitySearchField({ id, value, onChange }: Props) {
  const { locale, t } = useLocale();
  const selected = value ? findCityById(value) : undefined;
  const [query, setQuery] = useState(selected ? (locale === "en" ? selected.en : selected.ar) : "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingRef = useRef(false);
  const listId = `${id}-list`;

  useEffect(() => {
    if (typingRef.current) {
      typingRef.current = false;
      return;
    }
    if (!value) {
      setQuery("");
      return;
    }
    if (selected) setQuery(locale === "en" ? selected.en : selected.ar);
  }, [value, selected, locale]);

  const results = useMemo(() => searchSaudiCities(query, locale, 12), [query, locale]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const updateMenuPosition = () => {
    const input = inputRef.current;
    if (!input) return;
    const box = input.getBoundingClientRect();
    const maxHeight = Math.min(240, window.innerHeight - box.bottom - 16);
    setMenuStyle({
      position: "fixed",
      top: box.bottom + 6,
      left: box.left,
      width: box.width,
      maxHeight: Math.max(maxHeight, 120),
      zIndex: 9999,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, query]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        const menu = document.getElementById(listId);
        if (menu?.contains(event.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [listId]);

  const pick = (cityId: string) => {
    const city = findCityById(cityId);
    onChange(cityId);
    setQuery(city ? (locale === "en" ? city.en : city.ar) : "");
    setOpen(false);
  };

  const commitTypedCity = (text: string) => {
    const match = resolveSaudiCity(text);
    if (match) {
      pick(match.id);
      return true;
    }
    if (!value) onChange("");
    return false;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((prev) => Math.min(prev + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (open && results[active]) {
        pick(results[active].id);
        return;
      }
      commitTypedCity(query);
      return;
    }
    if (event.key === "Escape") setOpen(false);
  };

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <ul className="city-search-list is-portal" id={listId} role="listbox" style={menuStyle}>
            {results.length === 0 ? (
              <li className="city-search-empty">{t("contact.cityEmpty")}</li>
            ) : (
              results.map((city, index) => (
                <li key={city.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active === index}
                    className={`city-search-option ${active === index ? "is-active" : ""} ${
                      value === city.id ? "is-picked" : ""
                    }`}
                    onMouseEnter={() => setActive(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pick(city.id)}
                  >
                    {locale === "en" ? city.en : city.ar}
                  </button>
                </li>
              ))
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="city-search" ref={wrapRef}>
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder={t("contact.citySearch")}
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          typingRef.current = true;
          setQuery(next);
          setOpen(true);
          const match = resolveSaudiCity(next);
          onChange(match?.id ?? "");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => commitTypedCity(query), 180);
        }}
        onKeyDown={onKeyDown}
      />
      {menu}
    </div>
  );
}
