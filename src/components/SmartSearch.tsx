import { useId, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { money, productFor } from "../data";
import type { Product } from "../data";
import { predictiveProducts, predictiveTerms } from "../commerce";
import { Photo } from "./UI";
import { Suggestions } from "./Suggestions";

type Props = {
  query: string;
  setQuery: (value: string) => void;
  history: string[];
  setHistory: (value: string[]) => void;
  recentIds: string[];
  onChoose: (product: Product) => void;
  onViewAll: (query: string) => void;
};

export default function SmartSearch({
  query,
  setQuery,
  history,
  setHistory,
  recentIds,
  onChoose,
  onViewAll,
}: Props) {
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const results = useMemo(() => predictiveProducts(query), [query]);
  const suggestions = useMemo(() => predictiveTerms(query), [query]);
  const recentProducts = recentIds.slice(0, 3).map(productFor);

  const remember = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setHistory(
      [clean, ...history.filter((item) => item !== clean)].slice(0, 6),
    );
  };

  const selectProduct = (product: Product) => {
    remember(query || product.name);
    onChoose(product);
  };

  return (
    <div className="smart-search">
      <label className="field-label" htmlFor="product-search">
        Buscar por prenda o material
      </label>
      <div className="search-input predictive-input">
        <Search size={19} />
        <input
          id="product-search"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          maxLength={200}
          placeholder="Prueba «lino para verano»"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((value) =>
                Math.min(value + 1, results.length - 1),
              );
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((value) => Math.max(value - 1, -1));
            }
            if (event.key === "Enter") {
              event.preventDefault();
              if (activeIndex >= 0 && results[activeIndex]) {
                selectProduct(results[activeIndex]);
              } else {
                remember(query);
                onViewAll(query);
              }
            }
            if (event.key === "Escape" && query) {
              event.stopPropagation();
              setQuery("");
              setActiveIndex(-1);
            }
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={results.length > 0}
          aria-controls={listId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          autoFocus
        />
        {query && (
          <button
            className="icon-button"
            aria-label="Borrar búsqueda"
            onClick={() => {
              setQuery("");
              setActiveIndex(-1);
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <p className="search-count" role="status" aria-live="polite">
        {query
          ? `${results.length} ${results.length === 1 ? "coincidencia" : "coincidencias"}`
          : "Ideas para empezar"}
      </p>

      {suggestions.length > 0 && (
        <div
          className="search-suggestions"
          aria-label="Sugerencias de búsqueda"
        >
          {suggestions.map((term) => {
            const clean = term.replace(/^Buscar por /, "");
            return (
              <button
                key={term}
                onClick={() => {
                  setQuery(clean);
                  remember(clean);
                }}
              >
                <Sparkles size={14} /> {term}
              </button>
            );
          })}
        </div>
      )}

      {history.length > 0 && !query && (
        <div className="search-history">
          <div className="utility-heading">
            <span>
              <Clock3 size={15} /> Búsquedas recientes
            </span>
            <button className="text-link" onClick={() => setHistory([])}>
              Limpiar
            </button>
          </div>
          <div className="history-list">
            {history.map((term) => (
              <button key={term} onClick={() => setQuery(term)}>
                {term} <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="drawer-product-list predictive-results"
        id={listId}
        role="listbox"
        aria-label="Productos sugeridos"
      >
        {results.slice(0, 5).map((product, index) => (
          <button
            className={`search-result ${activeIndex === index ? "is-active" : ""}`}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={activeIndex === index}
            key={product.id}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => selectProduct(product)}
          >
            <Photo name={product.model} alt="" />
            <span>
              <strong>{product.name}</strong>
              <small>
                {product.materials} · {product.category}
              </small>
            </span>
            <span>{money(product.price)}</span>
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>

      {query && results.length === 0 && (
        <>
          <div className="empty-state search-empty">
            <Search size={28} />
            <h3>No termina aquí.</h3>
            <p>Prueba una ocasión, un tejido o una categoría diferente.</p>
            <div className="recovery-actions">
              {["lino", "oficina", "vestido"].map((term) => (
                <button
                  className="secondary-button"
                  key={term}
                  onClick={() => setQuery(term)}
                >
                  Buscar {term}
                </button>
              ))}
            </div>
          </div>
          <Suggestions
            products={predictiveProducts("").slice(0, 3)}
            onChoose={selectProduct}
            title="Mientras encuentras la indicada"
          />
        </>
      )}

      {!query && recentProducts.length > 0 && (
        <div className="recent-search-products">
          <div className="utility-heading">
            <span>Vistos recientemente</span>
          </div>
          {recentProducts.map((product) => (
            <button key={product.id} onClick={() => selectProduct(product)}>
              <Photo name={product.model} alt="" />
              <span>{product.name}</span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      )}

      <button
        className="primary-button drawer-main-button"
        onClick={() => {
          remember(query);
          onViewAll(query);
        }}
      >
        {query && results.length
          ? "Ver todos los resultados"
          : "Explorar colección"}
        <ArrowRight size={17} />
      </button>
    </div>
  );
}
