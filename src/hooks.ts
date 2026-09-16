import { useEffect, useLayoutEffect, useState } from "react";

export function useStored<T>(
  key: string,
  initial: T,
  validate: (v: unknown) => v is T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) || "null");
      return validate(parsed) ? parsed : initial;
    } catch {
      return initial;
    }
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [key, value]);
  return [value, setValue, storageError] as const;
}

export function useReveal() {
  useLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (
            entry.target instanceof HTMLElement &&
            entry.target.hasAttribute("data-header-sentinel")
          ) {
            header?.classList.toggle("is-compact", !entry.isIntersecting);
            return;
          }
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    elements.forEach((el) => {
      el.style.setProperty("--reveal-index", el.dataset.revealIndex || "0");
      el.classList.add("will-reveal");
      observer.observe(el);
    });
    const sentinel = document.querySelector<HTMLElement>(
      "[data-header-sentinel]",
    );
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
}
