import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Heart,
  Home,
  Leaf,
  Menu,
  Minus,
  Plus,
  Ruler,
  Search,
  ShoppingBag,
  Smartphone,
  Truck,
  X,
  RefreshCw,
  Bookmark,
} from "lucide-react";
import {
  available,
  brand,
  colors,
  defaultConfiguration,
  lineKey,
  money,
  priceFor,
  productFor,
  products,
  sizes,
  stockFor,
  validCart,
  validConfiguration,
} from "./data";
import type { CartLine, ColorId, Configuration, Product } from "./data";
import { useReveal, useStored } from "./hooks";
import { ColorSwatches, Drawer, IconButton, Photo } from "./components/UI";
import Catalog, {
  filterProducts,
  initialFilters,
  validFilters,
} from "./components/Catalog";
import type { Filters } from "./components/Catalog";
import ProductBuilder from "./components/ProductBuilder";
import { Suggestions } from "./components/Suggestions";
import { emailError, chestError } from "./validation";

type Panel =
  | "menu"
  | "search"
  | "filters"
  | "favorites"
  | "bag"
  | "size"
  | "contact"
  | "shipping"
  | "privacy"
  | null;
type Toast = {
  message: string;
  undo?: () => void;
  action?: () => void;
  actionLabel?: string;
};
const favoriteValidator = (v: unknown): v is string[] =>
  Array.isArray(v) &&
  v.every((id) => typeof id === "string" && products.some((p) => p.id === id));
const savedValidator = (v: unknown): v is Configuration[] =>
  Array.isArray(v) && v.every(validConfiguration);
const goTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });

export default function App() {
  const [favorites, setFavorites, favoriteError] = useStored(
    "fashion:favorites:v1",
    [],
    favoriteValidator,
  );
  const [cart, setCart, cartError] = useStored<CartLine[]>(
    "fashion:cart:v1",
    [],
    validCart,
  );
  const [saved, setSaved, savedError] = useStored<Configuration[]>(
    "fashion:saved:v1",
    [],
    savedValidator,
  );
  const [configuration, setConfiguration, configurationError] =
    useStored<Configuration>(
      "fashion:configuration:v1",
      defaultConfiguration(),
      validConfiguration,
    );
  const [panel, setPanel] = useState<Panel>(null);
  const [filters, setFilters, filtersError] = useStored<Filters>(
    "fashion:filters:v1",
    initialFilters,
    validFilters,
  );
  const [draftFilters, setDraftFilters] = useState<Filters>(initialFilters);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [newsletterState, setNewsletterState] = useState<
    "idle" | "error" | "saved"
  >("idle");
  const [chest, setChest] = useState("");
  const [sizeResult, setSizeResult] = useState("");
  const [sizeError, setSizeError] = useState("");
  const [chestTouched, setChestTouched] = useState(false);
  const [fitLoading, setFitLoading] = useState(false);
  const [checkoutSummary, setCheckoutSummary] = useState(false);
  const [bagError, setBagError] = useState("");
  const quantity = cart.reduce((sum, line) => sum + line.quantity, 0);
  const total = cart.reduce(
    (sum, line) => sum + priceFor(line) * line.quantity,
    0,
  );
  const currentProduct = productFor(configuration.productId);
  const emailIssue = emailTouched ? emailError(email) : "";
  const chestIssue = chestTouched ? chestError(chest) : "";
  const draftCount = filterProducts(products, draftFilters, favorites).length;
  useReveal();
  useEffect(() => {
    if (!toast) return;
    if (toast.undo || toast.action) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    setCheckoutSummary(false);
    setBagError("");
  }, [panel]);
  const notify = (message: string, undo?: () => void) =>
    setToast({ message, undo });
  const toggleFavorite = (id: string) => {
    const before = favorites;
    const exists = favorites.includes(id);
    setFavorites(
      exists ? favorites.filter((item) => item !== id) : [...favorites, id],
    );
    notify(
      exists ? "Prenda eliminada de favoritos" : "Guardado en favoritos",
      () => setFavorites(before),
    );
  };
  const choose = (product: Product, color: ColorId = product.colorIds[0]) => {
    setConfiguration({ ...defaultConfiguration(product.id), color });
    setPanel(null);
    setTimeout(() => goTo("atelier"), 50);
  };
  const addToCart = (c: Configuration) => {
    if (!available(c)) return "Selecciona una combinación disponible.";
    const key = lineKey(c);
    const existing = cart.find((line) => line.key === key);
    if ((existing?.quantity || 0) >= stockFor(c))
      return "Ya tienes todas las unidades disponibles de esta combinación.";
    const before = cart;
    setCart(
      existing
        ? cart.map((line) =>
            line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...cart, { ...c, key, quantity: 1 }],
    );
    setToast({
      message: `${productFor(c.productId).name} ya está en tu bolsa.`,
      undo: () => setCart(before),
      actionLabel: "Ver bolsa",
      action: () => {
        setPanel("bag");
        setToast(null);
      },
    });
    return undefined;
  };
  const save = (c: Configuration) => {
    if (saved.some((item) => lineKey(item) === lineKey(c))) {
      notify("Esta combinación ya está guardada");
      return;
    }
    const before = saved;
    setSaved([...saved, c]);
    notify("Personalización guardada", () => setSaved(before));
  };
  const openFilters = () => {
    setDraftFilters(filters);
    setPanel("filters");
  };
  const browse = (gender = "Todo", onlyNew = false) => {
    setFilters({ ...initialFilters, gender, onlyNew });
    setPanel(null);
    setTimeout(() => goTo("coleccion"), 40);
  };
  const searchResults = filterProducts(
    products,
    { ...initialFilters, query: search },
    favorites,
  );
  const sizeGuide = async (e: FormEvent) => {
    e.preventDefault();
    setChestTouched(true);
    const measure = Number(chest.replace(",", "."));
    if (chestError(chest)) {
      setSizeError("");
      setSizeResult("");
      document.getElementById("chest")?.focus();
      return;
    }
    setSizeError("");
    setFitLoading(true);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    const size =
      measure < 84
        ? "XS"
        : measure < 92
          ? "S"
          : measure < 100
            ? "M"
            : measure < 110
              ? "L"
              : "XL";
    setSizeResult(size);
    setFitLoading(false);
  };
  const newsletter = (e: FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    if (emailError(email)) {
      setNewsletterState("error");
      document.getElementById("newsletter-email")?.focus();
      return;
    }
    setNewsletterState("saved");
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <header className="site-header glass">
        <div className="header-brand">
          <button
            className="icon-button mobile-menu-trigger"
            aria-label="Abrir menú"
            onClick={() => setPanel("menu")}
          >
            <Menu />
          </button>
          <a href="#inicio" className="wordmark" aria-label="Tu Marca, inicio">
            {brand.name}
            <span className="brand-period">.</span>
          </a>
        </div>
        <nav className="desktop-nav" aria-label="Navegación principal">
          <button onClick={() => browse("Mujer")}>Mujer</button>
          <button onClick={() => browse("Hombre")}>Hombre</button>
          <button onClick={() => browse("Todo", true)}>Novedades</button>
          <a href="#atelier">
            El atelier <ArrowUpRight size={12} />
          </a>
        </nav>
        <div className="header-actions">
          <IconButton
            label="Buscar prendas"
            visibleLabel="Buscar"
            onClick={() => setPanel("search")}
          >
            <Search />
          </IconButton>
          <span className="desktop-favorites">
            <IconButton
              label="Abrir favoritos"
              count={favorites.length}
              onClick={() => setPanel("favorites")}
            >
              <Heart />
            </IconButton>
          </span>
          <IconButton
            label={`Abrir bolsa, ${quantity} prendas`}
            count={quantity}
            visibleLabel="Bolsa"
            onClick={() => setPanel("bag")}
          >
            <ShoppingBag />
          </IconButton>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="inicio" aria-labelledby="hero-title">
          <div className="hero-photo">
            <Photo
              name="editorial-hero"
              alt="Modelo con chaqueta y pantalón beige, sentada en un estudio"
              priority
              sizes="(max-width:767px) 100vw, 65vw"
            />
          </div>
          <div className="hero-wash" />
          <div className="hero-content">
            <span className="eyebrow">EL ARTE DE SENTIRTE TÚ</span>
            <h1 id="hero-title">
              Vístelo. Míralo.
              <br />
              <em>Hazlo tuyo.</em>
            </h1>
            <p>
              Prendas para vivir, combinar
              <br className="desktop-break" /> y llevar a tu manera.
            </p>
            <div className="hero-ctas">
              <a href="#coleccion" className="primary-button">
                Explorar colección <ArrowRight size={18} />
              </a>
              <a href="#atelier" className="text-link">
                Ver cómo queda <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <div className="hero-caption">
            <span>La colección esencial</span>
            <span>Texturas naturales, nuevos comienzos.</span>
          </div>
        </section>
        <div className="service-strip">
          <span>
            <Truck size={16} /> Entrega a tu medida
          </span>
          <span>
            <RefreshCw size={16} /> Encuentra tu talla
          </span>
          <span>
            <Leaf size={16} /> Detalles que se sienten
          </span>
        </div>

        <Catalog
          products={products}
          filters={filters}
          setFilters={setFilters}
          favorites={favorites}
          onFavorite={toggleFavorite}
          onChoose={choose}
          onFilters={openFilters}
          onSearch={() => setPanel("search")}
        />
        <ProductBuilder
          configuration={configuration}
          setConfiguration={setConfiguration}
          onAdd={addToCart}
          onSave={save}
          onSizeGuide={() => setPanel("size")}
          onFavorite={() => toggleFavorite(currentProduct.id)}
          favorite={favorites.includes(currentProduct.id)}
          onBag={() => setPanel("bag")}
          inBag={cart.some((line) => line.key === lineKey(configuration))}
        />

        <section
          className="confidence-section section-shell"
          id="confianza"
          aria-labelledby="confidence-title"
        >
          <div className="confidence-photo" data-reveal>
            <Photo
              name="editorial-senior"
              alt="Modelo adulta con blusa blanca y pantalón arena, mostrando su caída natural"
            />
            <div className="photo-caption">
              Prendas que se sienten
              <br />
              <em>tan bien como se ven.</em>
            </div>
          </div>
          <div className="confidence-content" data-reveal>
            <h2 id="confidence-title">
              Elige con
              <br />
              <em>confianza.</em>
            </h2>
            <p>
              Los pequeños detalles hacen que encontrar tu próxima prenda se
              sienta fácil.
            </p>
            <button className="fit-card" onClick={() => setPanel("size")}>
              <span className="round-icon">
                <Ruler />
              </span>
              <span>
                <strong>Tu talla, sin adivinar.</strong>
                <small>Encuentra una referencia para ti</small>
              </span>
              <ArrowUpRight size={21} />
            </button>
            <div className="confidence-accordions">
              <details>
                <summary>
                  <Truck size={19} /> Envíos y cambios <Plus size={17} />
                </summary>
                <p>
                  La tienda podrá configurar entregas a domicilio, retiro y
                  cambios. En esta demostración no se procesan pedidos ni se
                  calcula el envío.
                </p>
              </details>
              <details>
                <summary>
                  <Leaf size={19} /> Materiales y cuidado <Plus size={17} />
                </summary>
                <p>
                  Lava las prendas delicadas en frío y déjalas secar al aire.
                  Consulta siempre la etiqueta. La composición final se
                  confirmará al cargar el catálogo de la tienda.
                </p>
              </details>
              <details>
                <summary>
                  <Heart size={19} /> Un estilo que sigue contigo{" "}
                  <Plus size={17} />
                </summary>
                <p>
                  Guarda tus favoritos y combinaciones en este navegador. Los
                  encontrarás aquí cuando vuelvas, sin necesidad de una cuenta.
                </p>
                <button
                  className="text-link"
                  onClick={() => setPanel("favorites")}
                >
                  Abrir mis favoritos <ArrowRight size={15} />
                </button>
              </details>
            </div>
            <div className="quiet-success">
              <CheckCircle2 size={18} />
              <span>
                {saved.length
                  ? `${saved.length} ${saved.length === 1 ? "combinación guardada" : "combinaciones guardadas"}`
                  : "Tus elecciones, a tu ritmo."}
              </span>
            </div>
          </div>
        </section>

        <section
          className="mobile-story section-shell"
          id="contigo"
          aria-labelledby="mobile-title"
        >
          <div className="mobile-story-copy" data-reveal>
            <span className="eyebrow">DONDE ESTÉS</span>
            <h2 id="mobile-title">
              Tu estilo.
              <br />
              Siempre contigo.
            </h2>
            <p>
              Descubre, guarda y personaliza.
              <br />
              Todo al alcance de tu mano.
            </p>
            <div className="mobile-benefit">
              <Smartphone size={20} />
              <span>Una experiencia pensada para tu móvil</span>
            </div>
            <button className="text-link" onClick={() => setPanel("favorites")}>
              Ver mis favoritos <ArrowRight size={17} />
            </button>
          </div>
          <div className="phone-stage" data-reveal>
            <div className="phone phone-left">
              <div className="phone-speaker" />
              <div className="phone-screen">
                <div className="phone-brand">TU MARCA.</div>
                <Photo
                  name="dress-model"
                  alt="Vestido satinado en vista móvil"
                />
                <div className="phone-overlay">
                  <h3>
                    Tu próxima
                    <br />
                    prenda favorita.
                  </h3>
                  <button onClick={() => choose(products[0])}>
                    Descubrir <ArrowRight size={12} />
                  </button>
                </div>
                <div className="phone-nav">
                  <Home size={15} />
                  <Search size={15} />
                  <Heart size={15} />
                </div>
              </div>
            </div>
            <div className="phone phone-middle">
              <div className="phone-speaker" />
              <div className="phone-screen">
                <div className="phone-brand">TU MARCA.</div>
                <Photo
                  name={currentProduct.product}
                  alt={`${currentProduct.name}, vista móvil`}
                />
                <div className="mini-product">
                  <h3>{currentProduct.name}</h3>
                  <p>{money(priceFor(configuration))}</p>
                  <ColorSwatches
                    value={configuration.color}
                    ids={currentProduct.colorIds}
                    onChange={(color) =>
                      setConfiguration({ ...configuration, color })
                    }
                    small
                  />
                  <button
                    className="primary-button"
                    onClick={() => goTo("atelier")}
                  >
                    Hazla tuya <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
            <div className="phone phone-right">
              <div className="phone-speaker" />
              <div className="phone-screen">
                <div className="phone-brand">TU MARCA.</div>
                <div className="mini-saved">
                  <Bookmark size={25} />
                  <h3>Muy tuyo.</h3>
                  <p>
                    Un lugar para todo
                    <br />
                    lo que te gusta.
                  </p>
                  <Photo
                    name="tee-product"
                    alt="Camiseta de algodón en favoritos"
                  />
                  <button
                    className="primary-button"
                    onClick={() => toggleFavorite(products[1].id)}
                  >
                    <Heart
                      size={14}
                      fill={
                        favorites.includes(products[1].id)
                          ? "currentColor"
                          : "none"
                      }
                    />
                    {favorites.includes(products[1].id)
                      ? "Guardada"
                      : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="closing-section" aria-labelledby="closing-title">
          <Photo
            name="editorial-duo"
            alt="Dos modelos con vestidos neutros de la colección editorial"
          />
          <div className="closing-wash" />
          <div className="closing-content" data-reveal>
            <h2 id="closing-title">
              Encuentra tu
              <br />
              <em>próxima prenda.</em>
            </h2>
            <p>Una nueva forma de hacerla tuya.</p>
            <a href="#coleccion" className="primary-button">
              Explorar colección <ArrowRight size={18} />
            </a>
          </div>
        </section>
      </main>

      <footer className="site-footer section-shell">
        <div className="footer-top">
          <div>
            <a className="wordmark" href="#inicio">
              TU MARCA.
            </a>
            <p>
              Ropa para acompañar
              <br />
              tu forma de vivir.
            </p>
          </div>
          <div className="footer-links">
            <strong>Te acompañamos</strong>
            <button onClick={() => setPanel("size")}>Guía de tallas</button>
            <button onClick={() => setPanel("shipping")}>
              Envíos y cambios
            </button>
            <button onClick={() => setPanel("contact")}>Contacto</button>
          </div>
          <form className="newsletter" onSubmit={newsletter} noValidate>
            <label htmlFor="newsletter-email">Lo nuevo, antes que nadie.</label>
            <p>Deja tu correo para probar la suscripción.</p>
            <div className="newsletter-input">
              <input
                id="newsletter-email"
                type="email"
                inputMode="email"
                enterKeyHint="send"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                autoComplete="email"
                value={email}
                placeholder="Tu correo electrónico"
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailTouched(true);
                  setNewsletterState("idle");
                }}
                onBlur={() => setEmailTouched(true)}
                aria-invalid={!!emailIssue}
                aria-describedby="newsletter-message"
              />
              <button
                className="icon-button"
                aria-label="Suscribirme"
                type="submit"
              >
                <ArrowRight />
              </button>
            </div>
            <p
              id="newsletter-message"
              className={emailIssue ? "form-error" : "newsletter-note"}
              role="status"
            >
              {emailIssue
                ? emailIssue
                : newsletterState === "saved"
                  ? "Formulario validado. En esta demo no se envía ni guarda tu correo."
                  : emailTouched
                    ? "El formato está listo. Puedes probar el formulario."
                    : "Sin ruido. Solo cosas que te van a gustar."}
            </p>
          </form>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Tu Marca. Concepto de tienda.
          </span>
          <button onClick={() => setPanel("privacy")}>Privacidad</button>
          <span>Hecho para sentirte tú.</span>
        </div>
      </footer>

      <nav className="mobile-navigation glass" aria-label="Navegación móvil">
        <button onClick={() => goTo("inicio")}>
          <Home size={20} />
          <span>Inicio</span>
        </button>
        <button onClick={() => setPanel("search")}>
          <Search size={20} />
          <span>Buscar</span>
        </button>
        <button onClick={() => setPanel("favorites")}>
          <Heart size={20} />
          <span>Favoritos</span>
        </button>
        <button onClick={() => setPanel("bag")}>
          <span className="mobile-bag-icon">
            <ShoppingBag size={20} />
            {quantity > 0 && <span className="count-badge">{quantity}</span>}
          </span>
          <span>Bolsa</span>
        </button>
      </nav>
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && !panel && (
          <div className="toast">
            <CheckCircle2 size={20} />
            <span>{toast.message}</span>
            {toast.action && (
              <button className="toast-action" onClick={toast.action}>
                {toast.actionLabel}
              </button>
            )}
            {toast.undo && (
              <button
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
              >
                Deshacer
              </button>
            )}
            <button
              className="icon-button"
              aria-label="Cerrar notificación"
              onClick={() => setToast(null)}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      {(favoriteError ||
        cartError ||
        savedError ||
        configurationError ||
        filtersError) && (
        <div className="storage-warning" role="status">
          El navegador no permite guardar cambios. Tus elecciones estarán
          disponibles durante esta visita.
        </div>
      )}

      {panel && (
        <Drawer
          title={
            {
              menu: "Explora tu estilo",
              search: "Encuentra tu próxima prenda",
              filters: "Afina tu selección",
              favorites: "Tu selección personal",
              bag: `Tu bolsa (${quantity})`,
              size: "Encuentra tu talla",
              contact: "Hablemos",
              shipping: "Envíos y cambios",
              privacy: "Tu privacidad",
            }[panel]
          }
          onClose={() => setPanel(null)}
        >
          {toast && (
            <div className="panel-feedback" role="status">
              <CheckCircle2 size={18} />
              <span>{toast.message}</span>
              {toast.undo && (
                <button
                  className="text-link"
                  onClick={() => {
                    toast.undo?.();
                    setToast(null);
                  }}
                >
                  Deshacer
                </button>
              )}
            </div>
          )}
          {panel === "menu" && (
            <div className="menu-links">
              <button onClick={() => browse("Mujer")}>
                Mujer <ArrowUpRight />
              </button>
              <button onClick={() => browse("Hombre")}>
                Hombre <ArrowUpRight />
              </button>
              <button onClick={() => browse("Todo", true)}>
                Novedades <ArrowUpRight />
              </button>
              <button
                onClick={() => {
                  setPanel(null);
                  setTimeout(() => goTo("atelier"), 40);
                }}
              >
                El atelier <ArrowUpRight />
              </button>
              <p>
                Prendas para ver, combinar
                <br />y llevar a tu manera.
              </p>
            </div>
          )}
          {panel === "search" && (
            <>
              <label className="field-label" htmlFor="product-search">
                Buscar por prenda o material
              </label>
              <div className="search-input">
                <Search size={19} />
                <input
                  id="product-search"
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  maxLength={200}
                  placeholder="Prueba «lino» o «vestido»"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <p
                className="search-count"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {searchResults.length} prendas para descubrir
              </p>
              <div className="drawer-product-list">
                {searchResults.map((p) => (
                  <button
                    className="search-result"
                    key={p.id}
                    onClick={() => choose(p)}
                  >
                    <Photo name={p.model} alt={p.name} />
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.materials}</small>
                    </span>
                    <span>{money(p.price)}</span>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              </div>
              {searchResults.length === 0 && (
                <div className="empty-state">
                  <Search />
                  <h3>Probemos con otra palabra.</h3>
                  <p>No hay prendas que coincidan con tu búsqueda.</p>
                  <div className="recovery-actions">
                    {["lino", "vestido", "camiseta"].map((term) => (
                      <button
                        className="secondary-button"
                        key={term}
                        onClick={() => setSearch(term)}
                      >
                        Buscar {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {searchResults.length === 0 && (
                <Suggestions
                  products={products}
                  onChoose={choose}
                  title="Mientras encuentras la indicada"
                />
              )}
              <button
                className="primary-button drawer-main-button"
                onClick={() => {
                  setFilters({
                    ...initialFilters,
                    query: searchResults.length ? search : "",
                  });
                  setPanel(null);
                  setTimeout(() => goTo("coleccion"), 40);
                }}
              >
                {searchResults.length
                  ? "Ver resultados en la colección"
                  : "Explorar toda la colección"}{" "}
                <ArrowRight size={17} />
              </button>
            </>
          )}
          {panel === "filters" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFilters(draftFilters);
                setPanel(null);
              }}
              className="filter-form"
            >
              <p className="filter-preview" role="status" aria-live="polite">
                {draftCount
                  ? `${draftCount} prendas encajan con tu selección.`
                  : "Esta mezcla no tiene coincidencias. Prueba otro color o amplía el precio."}
              </p>
              <label>
                Para quién
                <select
                  value={draftFilters.gender}
                  onChange={(e) =>
                    setDraftFilters({ ...draftFilters, gender: e.target.value })
                  }
                >
                  <option>Todo</option>
                  <option>Mujer</option>
                  <option>Hombre</option>
                  <option>Unisex</option>
                </select>
              </label>
              <label>
                Color
                <select
                  value={draftFilters.color}
                  onChange={(e) =>
                    setDraftFilters({ ...draftFilters, color: e.target.value })
                  }
                >
                  <option value="Todo">Todos los colores</option>
                  {colors.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Talla
                <select
                  value={draftFilters.size}
                  onChange={(e) =>
                    setDraftFilters({ ...draftFilters, size: e.target.value })
                  }
                >
                  <option>Todas</option>
                  {sizes.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Precio máximo <strong>{money(draftFilters.maxPrice)}</strong>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="1"
                  value={draftFilters.maxPrice}
                  onChange={(e) =>
                    setDraftFilters({
                      ...draftFilters,
                      maxPrice: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draftFilters.inStock}
                  onChange={(e) =>
                    setDraftFilters({
                      ...draftFilters,
                      inStock: e.target.checked,
                    })
                  }
                />{" "}
                Solo prendas disponibles
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draftFilters.onlyFavorites}
                  onChange={(e) =>
                    setDraftFilters({
                      ...draftFilters,
                      onlyFavorites: e.target.checked,
                    })
                  }
                />{" "}
                Solo mis favoritos
              </label>
              <button className="primary-button" type="submit">
                Mostrar{" "}
                {filterProducts(products, draftFilters, favorites).length}{" "}
                prendas <ArrowRight size={17} />
              </button>
              <button
                className="text-link centered"
                type="button"
                onClick={() => setDraftFilters(initialFilters)}
              >
                Restablecer filtros
              </button>
            </form>
          )}
          {panel === "favorites" && (
            <>
              <p className="drawer-intro">
                Todo lo que te gusta, en un solo lugar.
              </p>
              {favorites.length === 0 && saved.length === 0 ? (
                <div className="empty-state">
                  <Heart size={34} />
                  <h3>Tu próxima favorita te espera.</h3>
                  <p>Toca el corazón de una prenda para encontrarla aquí.</p>
                  <button className="primary-button" onClick={() => browse()}>
                    Explorar colección <ArrowRight size={16} />
                  </button>
                  <Suggestions
                    products={products.filter((p) => p.isNew)}
                    onChoose={choose}
                  />
                </div>
              ) : (
                <>
                  <div className="drawer-product-list">
                    {products
                      .filter((p) => favorites.includes(p.id))
                      .map((p) => (
                        <div className="favorite-row" key={p.id}>
                          <button
                            className="search-result"
                            onClick={() => choose(p)}
                          >
                            <Photo name={p.model} alt={p.name} />
                            <span>
                              <strong>{p.name}</strong>
                              <small>{money(p.price)}</small>
                            </span>
                          </button>
                          <button
                            className="icon-button"
                            aria-label={`Quitar ${p.name} de favoritos`}
                            onClick={() => toggleFavorite(p.id)}
                          >
                            <X size={17} />
                          </button>
                        </div>
                      ))}
                  </div>
                  {saved.length > 0 && (
                    <div className="saved-designs">
                      <h3>Tus combinaciones</h3>
                      {saved.map((c) => (
                        <div className="saved-design" key={lineKey(c)}>
                          <button
                            onClick={() => {
                              setConfiguration(c);
                              setPanel(null);
                              setTimeout(() => goTo("atelier"), 40);
                            }}
                          >
                            <strong>{productFor(c.productId).name}</strong>
                            <span>
                              {
                                colors.find((color) => color.id === c.color)
                                  ?.name
                              }{" "}
                              · {c.fabric} / {c.fit} / {c.size || "Sin talla"}
                            </span>
                          </button>
                          <button
                            className="icon-button"
                            aria-label="Eliminar combinación guardada"
                            onClick={() =>
                              setSaved(
                                saved.filter(
                                  (item) => lineKey(item) !== lineKey(c),
                                ),
                              )
                            }
                          >
                            <X size={17} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
          {panel === "bag" && (
            <>
              {cart.length === 0 ? (
                <div className="empty-state">
                  <ShoppingBag size={34} />
                  <h3>Un espacio para algo tuyo.</h3>
                  <p>Explora la colección y añade tu primera prenda.</p>
                  <button className="primary-button" onClick={() => browse()}>
                    Explorar colección <ArrowRight size={16} />
                  </button>
                  <Suggestions
                    products={
                      products.filter((p) => favorites.includes(p.id)).length
                        ? products.filter((p) => favorites.includes(p.id))
                        : products.slice(0, 3)
                    }
                    onChoose={choose}
                    title={
                      favorites.length
                        ? "Tus favoritas, a un paso"
                        : "Empieza con estas prendas"
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="cart-lines">
                    {cart.map((line) => (
                      <article className="cart-line" key={line.key}>
                        <Photo
                          name={productFor(line.productId).product}
                          alt={productFor(line.productId).name}
                        />
                        <div className="cart-line-detail">
                          <h3>{productFor(line.productId).name}</h3>
                          <p>
                            {
                              colors.find((color) => color.id === line.color)
                                ?.name
                            }{" "}
                            / {line.size}
                          </p>
                          <p>
                            {line.fabric} / {line.fit}
                          </p>
                          <div className="quantity-controls">
                            <button
                              aria-label={`Restar ${productFor(line.productId).name}`}
                              onClick={() => {
                                const before = cart;
                                notify(
                                  line.quantity > 1
                                    ? `Una menos. Quedan ${line.quantity - 1} en tu bolsa.`
                                    : "Prenda retirada. Puedes recuperarla con Deshacer.",
                                  () => setCart(before),
                                );
                                setCart(
                                  cart.flatMap((item) =>
                                    item.key === line.key
                                      ? item.quantity > 1
                                        ? [
                                            {
                                              ...item,
                                              quantity: item.quantity - 1,
                                            },
                                          ]
                                        : []
                                      : [item],
                                  ),
                                );
                                setCheckoutSummary(false);
                              }}
                            >
                              <Minus size={14} />
                            </button>
                            <span>{line.quantity}</span>
                            <button
                              aria-label={`Sumar ${productFor(line.productId).name}`}
                              disabled={line.quantity >= stockFor(line)}
                              onClick={() => {
                                const error = addToCart(line);
                                setBagError(error || "");
                                setCheckoutSummary(false);
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          {line.quantity >= stockFor(line) && (
                            <p className="stock-limit" role="status">
                              Ya tienes las {stockFor(line)} unidades
                              disponibles de esta combinación.
                            </p>
                          )}
                        </div>
                        <div className="cart-price">
                          <strong>
                            {money(priceFor(line) * line.quantity)}
                          </strong>
                          <button
                            className="icon-button"
                            aria-label={`Eliminar ${productFor(line.productId).name} de la bolsa`}
                            onClick={() => {
                              const before = cart;
                              setCart(
                                cart.filter((item) => item.key !== line.key),
                              );
                              setCheckoutSummary(false);
                              notify("Prenda eliminada de la bolsa", () =>
                                setCart(before),
                              );
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="cart-summary">
                    <div>
                      <span>Subtotal</span>
                      <strong>{money(total)}</strong>
                    </div>
                    <p>Envío e impuestos pendientes de configurar.</p>
                    {bagError && (
                      <p className="form-error" role="alert">
                        {bagError}
                      </p>
                    )}
                    <button
                      className="primary-button"
                      onClick={() => setCheckoutSummary(true)}
                    >
                      Revisar mi selección <ArrowRight size={18} />
                    </button>
                    {checkoutSummary && (
                      <div className="inline-status success" role="status">
                        <CheckCircle2 size={22} />
                        <div>
                          <strong>Tu selección está lista.</strong>
                          <p>
                            {quantity} prendas · {money(total)}
                          </p>
                          <p>
                            Esta es una tienda de demostración. No se realizará
                            ningún cobro ni pedido.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
          {panel === "size" && (
            <>
              <p className="drawer-intro">
                Mide alrededor de la parte más ancha del pecho, sin apretar la
                cinta.
              </p>
              <form onSubmit={sizeGuide} className="size-form" noValidate>
                <label htmlFor="chest">Contorno de pecho (cm)</label>
                <div className="measure-input">
                  <input
                    id="chest"
                    inputMode="decimal"
                    type="text"
                    enterKeyHint="done"
                    autoComplete="off"
                    maxLength={6}
                    value={chest}
                    onChange={(e) => {
                      setChest(e.target.value);
                      setChestTouched(true);
                      setSizeResult("");
                      setSizeError("");
                    }}
                    placeholder="Por ejemplo, 96"
                    onBlur={() => setChestTouched(true)}
                    aria-invalid={!!chestIssue}
                    aria-describedby="size-help size-validation"
                  />
                  <span>cm</span>
                </div>
                <p id="size-help">
                  Referencia orientativa para prendas superiores.
                </p>
                <p
                  id="size-validation"
                  className={
                    chestIssue ? "field-feedback form-error" : "field-feedback"
                  }
                  role="status"
                >
                  {chestIssue ||
                    (chestTouched
                      ? "Medida lista. Consulta la talla que te orienta."
                      : "Admite decimales: 96,5 o 96.5.")}
                </p>
                {sizeError && (
                  <p className="form-error" role="alert">
                    {sizeError}
                  </p>
                )}
                <button
                  className="primary-button"
                  type="submit"
                  disabled={fitLoading}
                  aria-busy={fitLoading}
                >
                  {fitLoading ? "Consultando…" : "Consultar mi talla"}{" "}
                  <Ruler size={17} />
                </button>
                {fitLoading && <div className="fit-skeleton" />}
                {sizeResult && (
                  <div className="size-result" role="status">
                    <CheckCircle2 />
                    <h3>Tu talla de referencia: {sizeResult}</h3>
                    <p>
                      Comprueba siempre las medidas de la prenda. El ajuste
                      puede variar según tejido y corte.
                    </p>
                    <button
                      className="text-link"
                      onClick={() => {
                        if (
                          !currentProduct.availableSizes.includes(
                            sizeResult as never,
                          )
                        ) {
                          setSizeError(
                            "Esa talla no está disponible para la prenda seleccionada.",
                          );
                          return;
                        }
                        setConfiguration({
                          ...configuration,
                          size: sizeResult as Configuration["size"],
                        });
                        setPanel(null);
                        setTimeout(() => goTo("atelier"), 40);
                      }}
                      type="button"
                    >
                      Usar esta talla <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </form>
              <div className="size-table">
                <table>
                  <caption>Guía orientativa de tallas</caption>
                  <thead>
                    <tr>
                      <th scope="col">Talla</th>
                      <th scope="col">Pecho (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["XS", "72–83"],
                      ["S", "84–91"],
                      ["M", "92–99"],
                      ["L", "100–109"],
                      ["XL", "110–124"],
                    ].map(([s, m]) => (
                      <tr key={s}>
                        <th scope="row">{s}</th>
                        <td>{m}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {panel === "contact" && (
            <div className="info-panel">
              <h3>Un espacio para tu tienda.</h3>
              <p>
                Al adaptar esta web a una empresa, aquí aparecerán sus canales
                reales de atención, dirección y horarios.
              </p>
              <p>
                Por ahora puedes explorar prendas, probar combinaciones y
                guardar tus favoritas.
              </p>
              <button className="primary-button" onClick={() => browse()}>
                Explorar colección <ArrowRight size={16} />
              </button>
            </div>
          )}
          {panel === "shipping" && (
            <div className="info-panel">
              <Truck size={32} />
              <h3>Una compra a tu medida.</h3>
              <p>
                Las zonas de entrega, costes, tiempos y política de cambios se
                configurarán con la empresa que utilice esta tienda.
              </p>
              <p>
                Este prototipo no procesa pedidos. Tus prendas permanecen
                guardadas en este navegador.
              </p>
              <button className="text-link" onClick={() => setPanel("bag")}>
                Ver mi bolsa <ArrowRight size={16} />
              </button>
            </div>
          )}
          {panel === "privacy" && (
            <div className="info-panel">
              <h3>Tus elecciones se quedan contigo.</h3>
              <p>
                Este prototipo almacena favoritos, bolsa y configuraciones en el
                almacenamiento local de tu navegador. No hay cuentas, analítica
                ni envío de información a un servidor.
              </p>
              <p>
                El formulario de correo únicamente valida el formato. La
                política definitiva deberá adaptarse cuando se conecte la tienda
                real.
              </p>
              <button
                className="secondary-button"
                onClick={() => {
                  setFavorites([]);
                  setCart([]);
                  setSaved([]);
                  setConfiguration(defaultConfiguration());
                  setFilters(initialFilters);
                  notify("Tus datos locales se han restablecido");
                }}
              >
                Borrar mis elecciones guardadas
              </button>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}
