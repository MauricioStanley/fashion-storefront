import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/newsreader";
import App from "./App";
import "./styles.css";
import "./refinements.css";
import "./motion.css";
import "./functionality.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

const loader = document.getElementById("brand-loader");
const loaderStartedAt = performance.now();
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const pageReady =
  document.readyState === "complete"
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        window.addEventListener("load", () => resolve(), { once: true });
      });

const fontsReady = document.fonts?.ready ?? Promise.resolve();

void Promise.all([pageReady, fontsReady]).then(() => {
  let hasSeenLoader = false;

  try {
    hasSeenLoader = sessionStorage.getItem("tu-marca-loader-seen") === "1";
  } catch {
    hasSeenLoader = false;
  }

  const minimumDuration = reducedMotion ? 0 : hasSeenLoader ? 420 : 980;
  const remainingTime = Math.max(
    0,
    minimumDuration - (performance.now() - loaderStartedAt),
  );

  window.setTimeout(() => {
    document.body.classList.remove("is-booting");

    if (!loader) return;

    loader.classList.add("is-leaving");

    try {
      sessionStorage.setItem("tu-marca-loader-seen", "1");
    } catch {
      // The loader still works when browser storage is unavailable.
    }

    const removeLoader = () => loader.remove();
    const handleExit = (event: AnimationEvent) => {
      if (event.target !== loader) return;
      loader.removeEventListener("animationend", handleExit);
      removeLoader();
    };

    loader.addEventListener("animationend", handleExit);
    window.setTimeout(removeLoader, reducedMotion ? 180 : 720);
  }, remainingTime);
});
