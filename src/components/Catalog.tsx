import { useState } from "react";
import {
  ArrowUpRight,
  Heart,
  SlidersHorizontal,
  Search,
  X,
} from "lucide-react";
import { categories, colors, sizes, money } from "../data";
import type { Category, ColorId, Product } from "../data";
import { ColorSwatches, Photo, Segmented } from "./UI";
import { Suggestions } from "./Suggestions";

export type Filters = {
  category: Category;
  gender: string;
  query: string;
  color: string;
  size: string;
  maxPrice: number;
  inStock: boolean;
  onlyFavorites: boolean;
  onlyNew: boolean;
};
export const initialFilters: Filters = {
  category: "Todo",
  gender: "Todo",
  query: "",
  color: "Todo",
  size: "Todas",
  maxPrice: 150,
  inStock: false,
  onlyFavorites: false,
  onlyNew: false,
};
export const validFilters = (value: unknown): value is Filters => {
  if (!value || typeof value !== "object") return false;
  const f = value as Filters;
  return (
    categories.includes(f.category) &&
    ["Todo", "Mujer", "Hombre", "Unisex"].includes(f.gender) &&
    typeof f.query === "string" &&
    f.query.length <= 200 &&
    (f.color === "Todo" || colors.some((color) => color.id === f.color)) &&
    (f.size === "Todas" || sizes.some((size) => size === f.size)) &&
    Number.isFinite(f.maxPrice) &&
    f.maxPrice >= 20 &&
    f.maxPrice <= 150 &&
    [f.inStock, f.onlyFavorites, f.onlyNew].every(
      (flag) => typeof flag === "boolean",
    )
  );
};
export const filterProducts = (
  products: Product[],
  filters: Filters,
  favorites: string[],
) =>
  products.filter(
    (p) =>
      (filters.category === "Todo" || p.category === filters.category) &&
      (filters.gender === "Todo" ||
        p.gender === filters.gender ||
        p.gender === "Unisex") &&
      (filters.color === "Todo" ||
        p.colorIds.includes(filters.color as ColorId)) &&
      (filters.size === "Todas" ||
        p.availableSizes.includes(filters.size as never)) &&
      p.price <= filters.maxPrice &&
      (!filters.onlyFavorites || favorites.includes(p.id)) &&
      (!filters.onlyNew || p.isNew) &&
      (!filters.inStock || p.availableSizes.length > 0) &&
      `${p.name} ${p.category} ${p.materials}`
        .toLocaleLowerCase("es")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes(
          filters.query
            .toLocaleLowerCase("es")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""),
        ),
  );

function ProductCard({
  product: p,
  index,
  favorite,
  onFavorite,
  onChoose,
}: {
  product: Product;
  index: number;
  favorite: boolean;
  onFavorite: () => void;
  onChoose: (p: Product, color: ColorId) => void;
}) {
  const [view, setView] = useState<"Prenda" | "En persona">(
    p.category === "Camisetas" ? "Prenda" : "En persona",
  );
  const [color, setColor] = useState<ColorId>(p.colorIds[0]);
  return (
    <article className={`product-card card-${index}`}>
      <div className="card-media">
        <div className="card-image-button">
          <Photo
            key={view}
            name={view === "Prenda" ? p.product : p.model}
            alt={`${p.name}: ${view === "En persona" ? "en modelo" : "detalle de la prenda"}`}
            sizes={
              index === 0 || index === 3
                ? "(max-width:767px) 90vw, (max-width:1023px) 45vw, 30vw"
                : "(max-width:1023px) 45vw, 30vw"
            }
          />
          <button
            className="card-open-overlay"
            onClick={() => onChoose(p, color)}
            aria-label={`Ver ${p.name}`}
          />
        </div>
        <button
          className={`icon-button favorite-button ${favorite ? "is-favorite" : ""}`}
          aria-label={`${favorite ? "Quitar" : "Guardar"} ${p.name} ${favorite ? "de" : "en"} favoritos`}
          aria-pressed={favorite}
          onClick={onFavorite}
        >
          <Heart size={19} fill={favorite ? "currentColor" : "none"} />
        </button>
        <Segmented
          options={["Prenda", "En persona"] as const}
          label={`Vista de ${p.name}`}
          value={view}
          onChange={setView}
          className="glass card-view-toggle"
        />
        <button
          className="quick-view icon-button"
          aria-label={`Personalizar ${p.name}`}
          onClick={() => onChoose(p, color)}
        >
          <ArrowUpRight size={19} />
        </button>
      </div>
      <div className="card-information">
        <div>
          <button onClick={() => onChoose(p, color)} className="product-name">
            {p.name}
          </button>
          <p>{p.materials}</p>
        </div>
        <span>{money(p.price)}</span>
      </div>
      <ColorSwatches value={color} onChange={setColor} ids={p.colorIds} small />
    </article>
  );
}

export default function Catalog({
  products,
  filters,
  setFilters,
  favorites,
  onFavorite,
  onChoose,
  onFilters,
  onSearch,
}: {
  products: Product[];
  filters: Filters;
  setFilters: (f: Filters) => void;
  favorites: string[];
  onFavorite: (id: string) => void;
  onChoose: (p: Product, color: ColorId) => void;
  onFilters: () => void;
  onSearch: () => void;
}) {
  const visible = filterProducts(products, filters, favorites);
  const [all, setAll] = useState(false);
  const active =
    filters.query ||
    filters.gender !== "Todo" ||
    filters.color !== "Todo" ||
    filters.size !== "Todas" ||
    filters.maxPrice < 150 ||
    filters.inStock ||
    filters.onlyFavorites ||
    filters.onlyNew;
  const tags: { label: string; patch: Partial<Filters> }[] = [
    ...(filters.query
      ? [{ label: `Búsqueda: ${filters.query}`, patch: { query: "" } }]
      : []),
    ...(filters.gender !== "Todo"
      ? [{ label: filters.gender, patch: { gender: "Todo" } }]
      : []),
    ...(filters.color !== "Todo"
      ? [
          {
            label:
              colors.find((c) => c.id === filters.color)?.name || filters.color,
            patch: { color: "Todo" },
          },
        ]
      : []),
    ...(filters.size !== "Todas"
      ? [{ label: `Talla ${filters.size}`, patch: { size: "Todas" } }]
      : []),
    ...(filters.maxPrice < 150
      ? [
          {
            label: `Hasta ${money(filters.maxPrice)}`,
            patch: { maxPrice: 150 },
          },
        ]
      : []),
    ...(filters.onlyFavorites
      ? [{ label: "Favoritos", patch: { onlyFavorites: false } }]
      : []),
    ...(filters.onlyNew
      ? [{ label: "Novedades", patch: { onlyNew: false } }]
      : []),
    ...(filters.inStock
      ? [{ label: "Disponibles", patch: { inStock: false } }]
      : []),
  ];
  return (
    <section
      className="catalog-section section-shell"
      id="coleccion"
      aria-labelledby="catalog-title"
    >
      <div className="catalog-heading" data-reveal>
        <div>
          <h2 id="catalog-title">Encuentra tu forma.</h2>
          <p>Piezas que combinan contigo. Y entre sí.</p>
        </div>
        <a className="text-link" href="#atelier">
          Hazla tuya <ArrowUpRight size={17} />
        </a>
      </div>
      <div className="catalog-toolbar">
        <div className="category-tabs" role="group" aria-label="Categorías">
          {categories.map((category) => (
            <button
              key={category}
              className={filters.category === category ? "active" : ""}
              aria-pressed={filters.category === category}
              onClick={() => setFilters({ ...filters, category })}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="catalog-actions">
          <button className="filter-button" onClick={onFilters}>
            <SlidersHorizontal size={16} /> Filtros
            {active ? <span className="filter-dot" /> : null}
          </button>
          <button
            className="icon-button"
            aria-label="Buscar en la colección"
            onClick={onSearch}
          >
            <Search size={19} />
          </button>
        </div>
      </div>
      {active && (
        <div className="filter-summary">
          <span>
            {filters.onlyFavorites
              ? "Tus favoritos"
              : filters.query
                ? `Resultados para “${filters.query}”`
                : filters.onlyNew
                  ? "Novedades"
                  : "Selección filtrada"}{" "}
            · {visible.length} prendas
          </span>
          <button
            className="text-link"
            onClick={() => setFilters(initialFilters)}
          >
            Limpiar filtros <X size={14} />
          </button>
        </div>
      )}
      <div className="catalog-context">
        <p role="status" aria-live="polite" aria-atomic="true">
          {visible.length
            ? `${all ? visible.length : Math.min(4, visible.length)} de ${visible.length} prendas${filters.category !== "Todo" ? ` en ${filters.category.toLowerCase()}` : " para descubrir"}.`
            : "Ninguna prenda coincide por ahora."}
        </p>
        <span>Elige una prenda para ver sus detalles y hacerla tuya.</span>
      </div>
      {tags.length > 0 && (
        <div className="filter-chips" aria-label="Filtros activos">
          {tags.map((tag) => (
            <button
              key={tag.label}
              onClick={() => setFilters({ ...filters, ...tag.patch })}
              aria-label={`Quitar filtro ${tag.label}`}
            >
              {tag.label}
              <X size={14} />
            </button>
          ))}
        </div>
      )}
      {visible.length ? (
        <div
          className={`product-grid ${visible.length < 4 ? "filtered-grid" : ""}`}
        >
          {(all ? visible : visible.slice(0, 4)).map((p, index) => (
            <ProductCard
              key={p.id}
              product={p}
              index={index}
              favorite={favorites.includes(p.id)}
              onFavorite={() => onFavorite(p.id)}
              onChoose={onChoose}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={30} />
          <h3>No encontramos esa combinación.</h3>
          <p>Prueba otra talla, color o un precio diferente.</p>
          <div className="recovery-actions">
            {tags.slice(0, 2).map((tag) => (
              <button
                className="secondary-button"
                key={tag.label}
                onClick={() => setFilters({ ...filters, ...tag.patch })}
              >
                Quitar {tag.label.toLowerCase()}
              </button>
            ))}
          </div>
          <button
            className="primary-button"
            onClick={() => setFilters(initialFilters)}
          >
            Ver toda la colección <ArrowUpRight size={17} />
          </button>
          <Suggestions
            products={products
              .filter(
                (p) =>
                  filters.category === "Todo" ||
                  p.category === filters.category,
              )
              .slice(0, 3)}
            onChoose={(p) => onChoose(p, p.colorIds[0])}
            title="Otras formas de encontrar tu estilo"
          />
        </div>
      )}
      {visible.length > 4 && (
        <div className="catalog-bottom">
          <span>
            {all ? visible.length : 4} de {visible.length} prendas
          </span>
          <button className="secondary-button" onClick={() => setAll(!all)}>
            {all ? "Mostrar selección" : "Ver toda la colección"}{" "}
            <ArrowUpRight size={17} />
          </button>
        </div>
      )}
    </section>
  );
}
