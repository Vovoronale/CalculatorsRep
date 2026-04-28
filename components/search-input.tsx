"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  groupSearchResults,
  searchCalculators,
  type SearchGroup,
} from "@/lib/search";

type SearchInputProps = {
  onResultClick?: () => void;
};

export function SearchInput({ onResultClick }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const listId = `${reactId}-results`;

  const groups: SearchGroup[] = useMemo(
    () => groupSearchResults(searchCalculators(query, 12)),
    [query],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      if (isModifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
        return;
      }
      if (event.key === "Escape") {
        const active = document.activeElement;
        if (
          active === inputRef.current ||
          (containerRef.current && containerRef.current.contains(active))
        ) {
          setQuery("");
          setOpen(false);
          inputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const showResults = open && query.trim().length > 0;
  const handleResultClick = () => {
    setQuery("");
    setOpen(false);
    onResultClick?.();
  };

  return (
    <div ref={containerRef} className="search-input">
      <label className="visually-hidden" htmlFor={`${reactId}-input`}>
        Пошук калькуляторів
      </label>
      <div className="search-input__field">
        <Search size={16} aria-hidden className="search-input__icon" />
        <input
          ref={inputRef}
          id={`${reactId}-input`}
          type="search"
          placeholder="Пошук калькуляторів…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-controls={showResults ? listId : undefined}
          aria-expanded={showResults}
          autoComplete="off"
          spellCheck={false}
        />
        {query ? (
          <button
            type="button"
            className="search-input__clear"
            aria-label="Очистити пошук"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
          >
            <X size={14} aria-hidden />
          </button>
        ) : (
          <kbd className="search-input__kbd" aria-hidden>
            ⌘K
          </kbd>
        )}
      </div>

      {showResults ? (
        <div
          id={listId}
          className="search-input__results"
          role="listbox"
          aria-label="Результати пошуку"
        >
          {groups.length === 0 ? (
            <p className="search-input__empty">Нічого не знайшлось.</p>
          ) : (
            groups.map((group) => (
              <div key={group.category} className="search-input__group">
                <p className="search-input__group-title">{group.categoryTitle}</p>
                <ul>
                  {group.results.map(({ calculator }) => (
                    <li key={calculator.slug}>
                      <Link
                        href={`/calculator/${calculator.slug}`}
                        role="option"
                        aria-selected={false}
                        onClick={handleResultClick}
                      >
                        <span className="search-input__result-title">{calculator.title}</span>
                        <span className="search-input__result-desc">
                          {calculator.shortDescription}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
