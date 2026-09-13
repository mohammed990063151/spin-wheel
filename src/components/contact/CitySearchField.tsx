"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
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
  const wrapRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

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
    onChange("");
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

  return (
    <div className="city-search" ref={wrapRef}>
      <input
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
          window.setTimeout(() => commitTypedCity(query), 120);
        }}
        onKeyDown={onKeyDown}
      />
      {open ? (
        <ul className="city-search-list" id={listId} role="listbox">
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
        </ul>
      ) : null}
    </div>
  );
}
