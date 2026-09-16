import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode, CSSProperties } from "react";
import { X, Check, ImageOff, RotateCcw } from "lucide-react";
import { colors, imagePath } from "../data";
import type { ColorId } from "../data";

type PhotoProps = {
  name: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  style?: CSSProperties;
};

export function Photo({
  name,
  alt,
  className = "",
  priority = false,
  sizes = "(max-width: 767px) 100vw, 50vw",
  style,
}: PhotoProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  const [retry, setRetry] = useState(0);
  return (
    <div className={`photo ${className} ${status}`} style={style}>
      {status !== "error" && (
        <img
          key={`${name}-${retry}`}
          src={imagePath(name)}
          srcSet={[480, 800, 1280]
            .map((w) => `${imagePath(name, w)} ${w}w`)
            .join(", ")}
          sizes={sizes}
          width="800"
          height="1100"
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={async (event) => {
            const image = event.currentTarget;
            try {
              await image.decode();
            } catch {
              // The load event is authoritative when decode is unavailable.
            }
            setStatus("loaded");
          }}
          onError={() => setStatus("error")}
        />
      )}
      {status === "error" && (
        <div className="image-error">
          <ImageOff />
          <span>No pudimos cargar esta foto</span>
          <button
            className="text-link"
            onClick={() => {
              setStatus("loading");
              setRetry((r) => r + 1);
            }}
          >
            <RotateCcw size={14} /> Reintentar
          </button>
        </div>
      )}
    </div>
  );
}

type CrossfadeLayer = {
  name: string;
  alt: string;
  transitionKey: string;
};

export function CrossfadePhoto({
  transitionKey,
  ...props
}: PhotoProps & { transitionKey: string }) {
  const initial = useRef<CrossfadeLayer>({
    name: props.name,
    alt: props.alt,
    transitionKey,
  });
  const currentRef = useRef(initial.current);
  const [current, setCurrent] = useState(initial.current);
  const [outgoing, setOutgoing] = useState<CrossfadeLayer | null>(null);
  const [entered, setEntered] = useState(true);

  useEffect(() => {
    if (transitionKey === currentRef.current.transitionKey) return;
    const next = { name: props.name, alt: props.alt, transitionKey };
    let cancelled = false;
    let frame = 0;
    let timer = 0;
    const preload = new Image();
    preload.src = imagePath(props.name);
    preload
      .decode()
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return;
        setOutgoing(currentRef.current);
        currentRef.current = next;
        setCurrent(next);
        setEntered(false);
        frame = requestAnimationFrame(() => setEntered(true));
        timer = window.setTimeout(() => setOutgoing(null), 280);
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [props.alt, props.name, transitionKey]);

  return (
    <div className={`crossfade-photo ${entered ? "is-entered" : ""}`}>
      {outgoing && (
        <Photo
          key={`outgoing-${outgoing.transitionKey}`}
          {...props}
          name={outgoing.name}
          alt=""
          priority={false}
          className="crossfade-layer crossfade-outgoing"
        />
      )}
      <Photo
        key={`current-${current.transitionKey}`}
        {...props}
        name={current.name}
        alt={current.alt}
        className="crossfade-layer crossfade-incoming"
      />
    </div>
  );
}

export function ColorSwatches({
  value,
  onChange,
  ids = colors.map((c) => c.id),
  small = false,
}: {
  value: ColorId;
  onChange: (v: ColorId) => void;
  ids?: ColorId[];
  small?: boolean;
}) {
  return (
    <div
      className={`swatches ${small ? "small" : ""}`}
      role="group"
      aria-label="Colores"
    >
      {colors
        .filter((c) => ids.includes(c.id))
        .map((c) => (
          <button
            key={c.id}
            type="button"
            className={`swatch ${value === c.id ? "selected" : ""}`}
            aria-label={c.name}
            aria-pressed={value === c.id}
            title={c.name}
            onClick={() => onChange(c.id)}
            style={{ "--swatch": c.hex } as CSSProperties}
          >
            <span>{value === c.id && <Check size={small ? 11 : 16} />}</span>
          </button>
        ))}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={label} className={`segmented ${className}`}>
      {options.map((option) => (
        <button
          type="button"
          key={option}
          aria-pressed={value === option}
          className={value === option ? "active" : ""}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function Drawer({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const previous = useRef(document.activeElement as HTMLElement | null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const id = useId();
  useEffect(() => {
    const original = document.body.style.overflow;
    ref.current?.showModal();
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      }
    };
    document.addEventListener("keydown", escape, true);
    return () => {
      document.removeEventListener("keydown", escape, true);
      document.body.style.overflow = original;
      queueMicrotask(() => {
        if (!ref.current?.isConnected)
          previous.current?.focus({ preventScroll: true });
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`drawer ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="drawer-content">
        <header className="drawer-header">
          <h2 id={id}>{title}</h2>
          <button
            className="icon-button"
            aria-label="Cerrar panel"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function IconButton({
  label,
  children,
  onClick,
  count,
  active = false,
  visibleLabel,
  pulseKey,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  count?: number;
  active?: boolean;
  visibleLabel?: string;
  pulseKey?: number;
}) {
  return (
    <button
      className={`icon-button ${visibleLabel ? "labeled-action" : ""} ${active ? "active" : ""}`}
      aria-label={label}
      onClick={onClick}
    >
      {children}
      {visibleLabel && <span className="action-label">{visibleLabel}</span>}
      {!!count && (
        <span
          key={pulseKey || "count"}
          className={`count-badge ${pulseKey ? "badge-bounce" : ""}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
