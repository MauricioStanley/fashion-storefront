import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  GitCompareArrows,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
} from "lucide-react";
import {
  defaultConfiguration,
  colors,
  money,
  priceFor,
  productFor,
  products,
} from "../data";
import type { Configuration, Product, Size } from "../data";
import { sampleReviews } from "../commerce";
import type { FitVote, ProductReview } from "../commerce";
import { Photo } from "./UI";

export function ReviewsSection({
  product,
  customReviews,
  onReview,
}: {
  product: Product;
  customReviews: ProductReview[];
  onReview: () => void;
}) {
  const [sizeFilter, setSizeFilter] = useState<Size | "Todas">("Todas");
  const [fitFilter, setFitFilter] = useState<FitVote | "Todos">("Todos");
  useEffect(() => {
    setSizeFilter("Todas");
    setFitFilter("Todos");
  }, [product.id]);
  const reviews = useMemo(
    () =>
      [...customReviews, ...sampleReviews].filter(
        (review) => review.productId === product.id,
      ),
    [customReviews, product.id],
  );
  const filtered = reviews.filter(
    (review) =>
      (sizeFilter === "Todas" || review.size === sizeFilter) &&
      (fitFilter === "Todos" || review.fit === fitFilter),
  );
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const fitCounts = (
    ["Queda pequeño", "Fiel a talla", "Queda amplio"] as const
  ).map((fit) => ({
    fit,
    count: reviews.filter((review) => review.fit === fit).length,
  }));
  const dominantFit = [...fitCounts].sort((a, b) => b.count - a.count)[0]?.fit;

  return (
    <section
      className="reviews-section section-shell"
      id="opiniones"
      aria-labelledby="reviews-title"
    >
      <div className="reviews-intro" data-reveal>
        <span className="eyebrow">OPINIONES DE MUESTRA</span>
        <h2 id="reviews-title">Cómo se siente al vestirla.</h2>
        <p>
          Filtra por talla y ajuste. Las opiniones añadidas en esta demo se
          guardan solamente en tu navegador.
        </p>
        <button className="secondary-button" onClick={onReview}>
          Escribir una opinión <Plus size={17} />
        </button>
      </div>
      <div className="review-summary" data-reveal>
        <div className="rating-number">
          <strong>{average ? average.toFixed(1) : "-"}</strong>
          <span>
            <Star size={16} fill="currentColor" /> {reviews.length} opiniones
          </span>
        </div>
        <div className="fit-summary" aria-label="Resumen del ajuste">
          {fitCounts.map(({ fit, count }) => (
            <div className={fit === dominantFit ? "is-dominant" : ""} key={fit}>
              <strong>{count}</strong>
              <span>{fit}</span>
              {fit === dominantFit && (
                <Check size={15} aria-label="Más mencionado" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="review-toolbar">
        <label>
          Talla
          <select
            value={sizeFilter}
            onChange={(event) =>
              setSizeFilter(event.target.value as Size | "Todas")
            }
          >
            <option>Todas</option>
            {product.availableSizes.map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <label>
          Ajuste
          <select
            value={fitFilter}
            onChange={(event) =>
              setFitFilter(event.target.value as FitVote | "Todos")
            }
          >
            <option>Todos</option>
            <option>Queda pequeño</option>
            <option>Fiel a talla</option>
            <option>Queda amplio</option>
          </select>
        </label>
        <span role="status">{filtered.length} visibles</span>
      </div>
      {filtered.length ? (
        <div className="review-list">
          {filtered.map((review, index) => (
            <article
              className="review-item"
              key={review.id}
              data-reveal
              data-reveal-index={index}
            >
              <header>
                <div>
                  <strong>{review.name}</strong>
                  <span>
                    Talla {review.size} · {review.height} cm
                  </span>
                </div>
                <span
                  className="review-stars"
                  role="img"
                  aria-label={`${review.rating} de 5 estrellas`}
                >
                  {Array.from({ length: 5 }, (_, star) => (
                    <Star
                      key={star}
                      size={14}
                      fill={star < review.rating ? "currentColor" : "none"}
                    />
                  ))}
                </span>
              </header>
              <strong className="fit-verdict">{review.fit}</strong>
              <p>{review.text}</p>
              {review.photo && (
                <img
                  className="review-photo"
                  src={review.photo}
                  alt={`Foto añadida por ${review.name}`}
                  width="360"
                  height="420"
                />
              )}
              <small>
                {review.sample
                  ? "Contenido demostrativo"
                  : "Guardada en este navegador"}
              </small>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state compact-empty">
          <h3>No hay opiniones con esos filtros.</h3>
          <button
            className="text-link"
            onClick={() => {
              setSizeFilter("Todas");
              setFitFilter("Todos");
            }}
          >
            Ver todas las opiniones <ArrowRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
}

const lookMap: Record<string, string[]> = {
  "vestido-satin": ["sobrecamisa-esencial", "camiseta-esencial"],
  "camiseta-esencial": ["pantalon-fluido", "sobrecamisa-esencial"],
  "pantalon-fluido": ["camiseta-esencial", "camisa-relajada"],
  "conjunto-natural": ["camiseta-esencial", "sobrecamisa-esencial"],
  "sobrecamisa-esencial": ["camiseta-esencial", "pantalon-fluido"],
  "camisa-relajada": ["pantalon-fluido", "camiseta-esencial"],
};

function lookConfiguration(product: Product, preferredSize: Size | "") {
  const configuration = defaultConfiguration(product.id);
  configuration.size = product.availableSizes.includes(preferredSize as Size)
    ? preferredSize
    : product.availableSizes[0];
  return configuration;
}

export function CompleteLook({
  configuration,
  preferredSize,
  onAdd,
  onChoose,
}: {
  configuration: Configuration;
  preferredSize: Size | "";
  onAdd: (items: Configuration[]) => void;
  onChoose: (product: Product) => void;
}) {
  const product = productFor(configuration.productId);
  const companions = (
    lookMap[product.id] || products.slice(0, 2).map((item) => item.id)
  ).map(productFor);
  const [selected, setSelected] = useState<string[]>(
    companions.map((item) => item.id),
  );
  useEffect(() => {
    setSelected(companions.map((item) => item.id));
  }, [product.id]);
  const selectedProducts = companions.filter((item) =>
    selected.includes(item.id),
  );
  const configurations = [
    configuration.size
      ? configuration
      : { ...configuration, size: product.availableSizes[0] },
    ...selectedProducts.map((item) => lookConfiguration(item, preferredSize)),
  ];
  const total = configurations.reduce((sum, item) => sum + priceFor(item), 0);

  return (
    <section
      className="look-section section-shell"
      aria-labelledby="look-title"
    >
      <div className="look-heading" data-reveal>
        <div>
          <h2 id="look-title">Completa el look.</h2>
          <p>
            Combina piezas reales del catálogo y añade solamente las que
            quieras.
          </p>
        </div>
        <div className="look-total">
          <span>{configurations.length} prendas</span>
          <strong>{money(total)}</strong>
        </div>
      </div>
      <div className="look-grid">
        <article className="look-anchor" data-reveal>
          <Photo name={product.model} alt={product.name} />
          <div>
            <Check size={16} />
            <span>
              <strong>{product.name}</strong>
              <small>Tu selección actual</small>
            </span>
            <strong>{money(priceFor(configuration))}</strong>
          </div>
        </article>
        {companions.map((item, index) => {
          const checked = selected.includes(item.id);
          return (
            <article
              className={`look-option ${checked ? "is-selected" : ""}`}
              key={item.id}
              data-reveal
              data-reveal-index={index + 1}
            >
              <button className="look-photo" onClick={() => onChoose(item)}>
                <Photo name={item.model} alt={item.name} />
              </button>
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelected(
                        checked
                          ? selected.filter((id) => id !== item.id)
                          : [...selected, item.id],
                      )
                    }
                  />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.materials}</small>
                  </span>
                </label>
                <strong>{money(item.price)}</strong>
              </div>
            </article>
          );
        })}
      </div>
      <button
        className="primary-button look-add"
        onClick={() => onAdd(configurations)}
      >
        <ShoppingBag size={18} /> Añadir look seleccionado
        <span>{money(total)}</span>
      </button>
    </section>
  );
}

export function RecentlyViewed({
  ids,
  currentId,
  onChoose,
  onClear,
}: {
  ids: string[];
  currentId: string;
  onChoose: (product: Product) => void;
  onClear: () => void;
}) {
  const recent = ids
    .filter((id) => id !== currentId)
    .slice(0, 4)
    .map(productFor);
  if (!recent.length) return null;
  return (
    <section
      className="recent-section section-shell"
      aria-labelledby="recent-title"
    >
      <div className="recent-heading">
        <div>
          <h2 id="recent-title">Vuelve a lo que te gustó.</h2>
          <p>Tu recorrido permanece en este navegador.</p>
        </div>
        <button className="text-link" onClick={onClear}>
          <Trash2 size={15} /> Limpiar historial
        </button>
      </div>
      <div className="recent-grid">
        {recent.map((product) => (
          <button key={product.id} onClick={() => onChoose(product)}>
            <Photo name={product.model} alt={product.name} />
            <span>
              <strong>{product.name}</strong>
              <small>{money(product.price)}</small>
            </span>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
    </section>
  );
}

export function ComparePanel({
  ids,
  onChoose,
  onRemove,
}: {
  ids: string[];
  onChoose: (product: Product) => void;
  onRemove: (id: string) => void;
}) {
  const compared = ids.map(productFor);
  return (
    <div className="compare-panel">
      <p className="drawer-intro">
        Revisa materiales, tallas y colores sin perder tu selección.
      </p>
      <div className="compare-grid">
        {compared.map((product) => (
          <article key={product.id}>
            <Photo name={product.model} alt={product.name} />
            <div className="compare-title">
              <div>
                <h3>{product.name}</h3>
                <strong>{money(product.price)}</strong>
              </div>
              <button
                className="icon-button"
                aria-label={`Quitar ${product.name} de la comparación`}
                onClick={() => onRemove(product.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <dl>
              <div>
                <dt>Material</dt>
                <dd>{product.materials}</dd>
              </div>
              <div>
                <dt>Tallas</dt>
                <dd>{product.availableSizes.join(", ")}</dd>
              </div>
              <div>
                <dt>Uso</dt>
                <dd>{product.subtitle}</dd>
              </div>
            </dl>
            <p className="compare-colors">
              Colores:{" "}
              {product.colorIds
                .map((id) => colors.find((color) => color.id === id)?.name)
                .join(", ")}
            </p>
            <button
              className="secondary-button"
              onClick={() => onChoose(product)}
            >
              Elegir prenda <ArrowRight size={15} />
            </button>
          </article>
        ))}
      </div>
      {!compared.length && (
        <div className="empty-state">
          <GitCompareArrows size={32} />
          <h3>Añade hasta tres prendas.</h3>
          <p>Usa “Comparar” desde el catálogo para verlas aquí.</p>
        </div>
      )}
    </div>
  );
}
