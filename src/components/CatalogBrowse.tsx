"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CatalogView = "comfortable" | "compact" | "list";

const STORAGE_KEY = "arkan-catalog-view";

const VIEWS: { id: CatalogView; label: string }[] = [
  { id: "comfortable", label: "عرض واسع" },
  { id: "compact", label: "عرض مضغوط" },
  { id: "list", label: "قائمة" },
];

type CatalogBrowseProps = {
  summary: ReactNode;
  sorts: ReactNode;
  chips?: ReactNode;
  empty?: ReactNode;
  pager?: ReactNode;
  children?: ReactNode;
};

export function CatalogBrowse({
  summary,
  sorts,
  chips,
  empty,
  pager,
  children,
}: CatalogBrowseProps) {
  const [view, setView] = useState<CatalogView>("comfortable");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "comfortable" || saved === "compact" || saved === "list") {
      setView(saved);
    }
  }, []);

  function choose(next: CatalogView) {
    setView(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <section className="catalog-results">
      <div className="catalog-toolbar">
        <div className="catalog-toolbar__meta">{summary}</div>

        <div className="catalog-toolbar__controls">
          <div className="catalog-view" role="group" aria-label="طريقة العرض">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={view === item.id ? "is-active" : ""}
                aria-pressed={view === item.id}
                aria-label={item.label}
                title={item.label}
                onClick={() => choose(item.id)}
              >
                {item.id === "comfortable" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                )}
                {item.id === "compact" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="3.5" y="4" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="9.75" y="4" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="16" y="4" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="3.5" y="10" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="9.75" y="10" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="16" y="10" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="3.5" y="16" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="9.75" y="16" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                    <rect x="16" y="16" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )}
                {item.id === "list" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M8 7h12M8 12h12M8 17h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="4.5" cy="7" r="1.2" fill="currentColor" />
                    <circle cx="4.5" cy="12" r="1.2" fill="currentColor" />
                    <circle cx="4.5" cy="17" r="1.2" fill="currentColor" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="catalog-sort" role="tablist" aria-label="ترتيب المنتجات">
            {sorts}
          </div>
        </div>
      </div>

      {chips}

      {empty ? (
        empty
      ) : (
        <div className="catalog-grid" data-view={view}>
          {children}
        </div>
      )}

      {pager}
    </section>
  );
}

type CatalogFiltersShellProps = {
  children: ReactNode;
  activeCount?: number;
};

export function CatalogFiltersShell({
  children,
  activeCount = 0,
}: CatalogFiltersShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="catalog-filters-bar">
        <button
          type="button"
          className="catalog-filters-toggle"
          onClick={() => setOpen(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 6h16M7 12h10M10 18h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          تصفية النتائج
          {activeCount > 0 ? <em>{activeCount}</em> : null}
        </button>
      </div>

      {open ? (
        <button
          type="button"
          className="catalog-filters-backdrop"
          aria-label="إغلاق التصفية"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside className={`catalog-filters ${open ? "is-open" : ""}`}>
        <div className="catalog-filters__mobile-head">
          <h2>تصفية النتائج</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق">
            ✕
          </button>
        </div>
        {children}
        <button
          type="button"
          className="catalog-filters-done"
          onClick={() => setOpen(false)}
        >
          تم
        </button>
      </aside>
    </>
  );
}
