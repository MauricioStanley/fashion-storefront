import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Heart,
  ShoppingBag,
  SlidersHorizontal,
  AlertCircle,
  RotateCcw,
  Leaf,
  Truck,
  Save,
  Info,
} from "lucide-react";
import {
  available,
  colors,
  imagePath,
  money,
  priceFor,
  productFor,
  sizes,
  stockFor,
} from "../data";
import type { Configuration, View } from "../data";
import { ColorSwatches, Drawer, Photo, Segmented } from "./UI";

type Props = {
  configuration: Configuration;
  setConfiguration: (c: Configuration) => void;
  onAdd: (c: Configuration) => string | undefined;
  onSave: (c: Configuration) => void;
  onSizeGuide: () => void;
  onFavorite: () => void;
  favorite: boolean;
  onBag: () => void;
  inBag: boolean;
};
export default function ProductBuilder({
  configuration: c,
  setConfiguration,
  onAdd,
  onSave,
  onSizeGuide,
  onFavorite,
  favorite,
  onBag,
  inBag,
}: Props) {
  const product = productFor(c.productId);
  const [view, setView] = useState<View>("En persona");
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const sequence = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const selectedColor = colors.find((color) => color.id === c.color)!;
  const shownImage = view === "En persona" ? product.model : product.product;
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.08 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setMessage("");
    setAdded(false);
  }, [c.productId]);
  useEffect(() => {
    let alive = true;
    setBusy(true);
    const img = new Image();
    img.src = imagePath(shownImage);
    img
      .decode()
      .catch(() => {})
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [shownImage]);
  const change = (patch: Partial<Configuration>) => {
    setMessage("");
    setAdded(false);
    setConfiguration({ ...c, ...patch });
    if (patch.color || patch.fabric || patch.fit) setView("Personalizar");
  };
  const add = async () => {
    if (!c.size) {
      setMessage("Elige una talla para añadir esta prenda.");
      document.getElementById(sheet ? "sheet-sizes" : "product-sizes")?.focus();
      return;
    }
    if (!available(c)) {
      setMessage(
        "Esta combinación está agotada. Prueba con algodón o con otro color.",
      );
      return;
    }
    setAdding(true);
    const operation = ++sequence.current;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const error = onAdd(c);
    if (operation === sequence.current) {
      setAdding(false);
      setMessage(error || "");
      setAdded(!error);
      if (!error) setSheet(false);
    }
  };
  const controls = (mobile = false) => (
    <div className="product-controls">
      <fieldset>
        <legend>
          Color <span>{selectedColor.name}</span>
        </legend>
        <ColorSwatches
          value={c.color}
          ids={product.colorIds}
          onChange={(color) => change({ color })}
        />
      </fieldset>
      <fieldset>
        <legend>
          Tela <span>{c.fabric === "Lino" ? "+ $12.00" : "Incluida"}</span>
        </legend>
        <div className="fabric-options">
          {(["Algodón", "Lino"] as const).map((fabric) => (
            <button
              key={fabric}
              className={`fabric-option ${c.fabric === fabric ? "selected" : ""}`}
              aria-pressed={c.fabric === fabric}
              onClick={() => change({ fabric })}
            >
              <span
                className={`fabric-texture ${fabric === "Lino" ? "linen" : "cotton"}`}
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span>{fabric}</span>
              {c.fabric === fabric && <Check size={15} />}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>
          Corte <span>{c.fit === "Relajado" ? "+ $5.00" : "Incluido"}</span>
        </legend>
        <Segmented
          label="Seleccionar corte"
          options={["Recto", "Relajado"] as const}
          value={c.fit}
          onChange={(fit) => change({ fit })}
        />
      </fieldset>
      <fieldset
        id={mobile ? "sheet-sizes" : "product-sizes"}
        className={message && !c.size ? "invalid-field" : ""}
        aria-invalid={!!message && !c.size}
        tabIndex={-1}
        aria-describedby={
          message ? (mobile ? "sheet-message" : "product-message") : undefined
        }
      >
        <legend>
          Talla{" "}
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setSheet(false);
              onSizeGuide();
            }}
          >
            Guía de tallas <ArrowRight size={13} />
          </button>
        </legend>
        <div className="size-options">
          {sizes.map((size) => (
            <button
              key={size}
              aria-pressed={c.size === size}
              className={`${c.size === size ? "selected" : ""} ${!product.availableSizes.includes(size) ? "unavailable" : ""}`}
              disabled={!product.availableSizes.includes(size)}
              onClick={() => change({ size })}
            >
              {size}
            </button>
          ))}
        </div>
      </fieldset>
      {c.size && !available(c) ? (
        <div className="inline-status error" role="status">
          <AlertCircle size={18} />
          <div>
            Esta combinación está agotada.
            <button
              className="text-link"
              onClick={() =>
                change({ color: product.colorIds[0], fabric: "Algodón" })
              }
            >
              Ver alternativa disponible <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <p className="availability">
          {c.size ? <Check size={14} /> : <Info size={14} />}{" "}
          {c.size
            ? `Disponible en esta combinación. ${stockFor(c)} unidades en el catálogo de prueba.`
            : "Solo falta tu talla. Elige una para comprobar disponibilidad."}
        </p>
      )}
      {message && (
        <p
          className="form-error"
          id={mobile ? "sheet-message" : "product-message"}
          role="alert"
        >
          {message}
        </p>
      )}
      <button
        className="primary-button add-button"
        onClick={add}
        aria-busy={adding}
        disabled={adding || (!!c.size && !available(c))}
      >
        <ShoppingBag size={18} />
        {adding ? "Añadiendo…" : "Añadir a la bolsa"}
        <span>{money(priceFor(c))}</span>
      </button>
      {added && inBag && (
        <div className="added-feedback" role="status">
          <Check size={18} />
          <span>Buena elección. Ya está en tu bolsa.</span>
          <button className="text-link" onClick={onBag}>
            Ver bolsa <ArrowRight size={15} />
          </button>
        </div>
      )}
      <button className="text-link save-design" onClick={() => onSave(c)}>
        <Save size={15} /> Guardar mi combinación
      </button>
    </div>
  );
  return (
    <section
      className="atelier-section section-shell"
      id="atelier"
      ref={sectionRef}
      aria-labelledby="atelier-title"
    >
      <div className="section-heading" data-reveal>
        <span className="eyebrow">A TU MANERA</span>
        <h2 id="atelier-title">Una prenda. Muy tú.</h2>
        <p>
          Encuentra tu color, elige cómo sentirla y haz espacio para algo tuyo.
        </p>
      </div>
      <div className="atelier-grid">
        <div className="product-gallery">
          <div
            className={`gallery-main ${busy ? "is-loading" : ""}`}
            aria-busy={busy}
          >
            <Photo
              key={shownImage}
              name={shownImage}
              alt={`${product.name}, ${view === "En persona" ? "vista sobre modelo" : "vista de la prenda"}, fotografía de referencia`}
            />
            <button
              className={`icon-button gallery-heart ${favorite ? "is-favorite" : ""}`}
              onClick={onFavorite}
              aria-label={
                favorite
                  ? "Quitar prenda de favoritos"
                  : "Guardar prenda en favoritos"
              }
              aria-pressed={favorite}
            >
              <Heart fill={favorite ? "currentColor" : "none"} />
            </button>
            <Segmented
              label="Vista del producto"
              options={["Prenda", "En persona", "Personalizar"] as const}
              value={view}
              onChange={(value) => {
                setView(value);
                if (
                  value === "Personalizar" &&
                  matchMedia("(max-width: 767px)").matches
                )
                  setSheet(true);
              }}
              className="glass gallery-tabs"
            />
            {view === "Personalizar" && (
              <div className="custom-preview">
                <span
                  className={`material-preview fabric-texture ${c.fabric === "Lino" ? "linen" : "cotton"}`}
                  style={{ backgroundColor: selectedColor.hex }}
                />
                <span>
                  {selectedColor.name}
                  <small>
                    {c.fabric} · {c.fit}
                  </small>
                </span>
                <Check size={16} />
              </div>
            )}
            {busy && (
              <div className="media-skeleton" aria-label="Cargando imagen" />
            )}
          </div>
          <div className="gallery-footer">
            <span>La textura. La caída. Los detalles.</span>
            <button
              className="text-link"
              onClick={() =>
                setView(view === "En persona" ? "Prenda" : "En persona")
              }
            >
              Cambiar vista <RotateCcw size={14} />
            </button>
          </div>
          <p className="reference-note">
            Fotos de referencia.{" "}
            {product.detail
              ? "La vista Prenda muestra un detalle ampliado. "
              : ""}
            Color y corte exactos pendientes de fotografía de catálogo.
          </p>
        </div>
        <div className="product-panel">
          <div className="product-title">
            <div>
              <span className="muted-label">ESENCIALES QUE SE ADAPTAN</span>
              <h3>{product.name}</h3>
            </div>
            <span className="product-price">{money(priceFor(c))}</span>
          </div>
          <p>{product.subtitle}</p>
          <div className="atelier-guidance">
            <span>
              {c.size
                ? "Tu combinación, lista para revisar"
                : "Primero los detalles. Después, tu talla."}
            </span>
            <p>
              {selectedColor.name} / {c.fabric} / {c.fit}
              {c.size ? ` / ${c.size}` : ""}
            </p>
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            {selectedColor.name}, {c.fabric}, corte {c.fit}, talla{" "}
            {c.size || "sin seleccionar"}. Precio {money(priceFor(c))}.{" "}
            {c.size
              ? available(c)
                ? "Disponible."
                : "Combinación agotada."
              : "Selecciona una talla."}
          </p>
          {controls()}
          <div className="product-promises">
            <span>
              <Leaf size={17} /> Materiales al detalle
            </span>
            <span>
              <Truck size={18} /> Opciones de entrega
            </span>
          </div>
        </div>
      </div>
      {inView && (
        <div className="mobile-buy-bar glass">
          <div>
            <span>{product.name}</span>
            <strong>{money(priceFor(c))}</strong>
          </div>
          <button className="primary-button" onClick={() => setSheet(true)}>
            <SlidersHorizontal size={16} /> Elegir opciones
          </button>
        </div>
      )}
      {sheet && (
        <Drawer title="Personaliza tu prenda" onClose={() => setSheet(false)}>
          <div className="sheet-product">
            <Photo name={product.product} alt={product.name} />
            <div>
              <h3>{product.name}</h3>
              <p>{money(priceFor(c))}</p>
            </div>
          </div>
          {controls(true)}
        </Drawer>
      )}
    </section>
  );
}
