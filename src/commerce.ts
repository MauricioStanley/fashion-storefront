import { colors, productFor, products, sizes, stockFor } from "./data";
import type { CartLine, Configuration, Product, Size } from "./data";

export type FitPreference = "Ajustado" | "Regular" | "Holgado";

export type SizeProfile = {
  chest: string;
  waist: string;
  hips: string;
  height: string;
  usualSize: Size | "";
  preference: FitPreference;
};

export const emptySizeProfile: SizeProfile = {
  chest: "",
  waist: "",
  hips: "",
  height: "",
  usualSize: "",
  preference: "Regular",
};

const isMeasurement = (value: unknown) =>
  typeof value === "string" && /^\d{0,3}([.,]\d{0,2})?$/.test(value);

export const validSizeProfile = (value: unknown): value is SizeProfile => {
  if (!value || typeof value !== "object") return false;
  const profile = value as SizeProfile;
  return (
    [profile.chest, profile.waist, profile.hips, profile.height].every(
      isMeasurement,
    ) &&
    (profile.usualSize === "" || sizes.includes(profile.usualSize)) &&
    ["Ajustado", "Regular", "Holgado"].includes(profile.preference)
  );
};

const toNumber = (value: string) => Number(value.replace(",", "."));

export function measurementError(
  label: string,
  value: string,
  min: number,
  max: number,
  required = false,
) {
  if (!value.trim()) return required ? `Añade ${label} para continuar.` : "";
  const number = toNumber(value);
  if (
    !/^\d{2,3}([.,]\d{1,2})?$/.test(value.trim()) ||
    number < min ||
    number > max
  )
    return `${label} debe estar entre ${min} y ${max} cm.`;
  return "";
}

const sizeIndex = (measurement: number) => {
  if (measurement < 84) return 0;
  if (measurement < 92) return 1;
  if (measurement < 100) return 2;
  if (measurement < 110) return 3;
  return 4;
};

export function recommendSize(profile: SizeProfile, product: Product) {
  const primary =
    product.category === "Pantalones" && profile.waist
      ? toNumber(profile.waist) + 18
      : toNumber(profile.chest);
  let index = Number.isFinite(primary) && primary > 0 ? sizeIndex(primary) : -1;
  if (index < 0 && profile.usualSize) index = sizes.indexOf(profile.usualSize);
  if (index < 0) return null;
  if (profile.preference === "Holgado") index += 1;
  if (profile.preference === "Ajustado") index -= 1;
  index = Math.max(0, Math.min(sizes.length - 1, index));
  let recommendation = sizes[index];
  if (!product.availableSizes.includes(recommendation)) {
    recommendation =
      product.availableSizes.find((size) => sizes.indexOf(size) > index) ||
      [...product.availableSizes]
        .reverse()
        .find((size) => sizes.indexOf(size) < index) ||
      product.availableSizes[0];
  }
  return {
    size: recommendation,
    confidence:
      profile.chest && profile.height
        ? "Referencia completa"
        : "Referencia orientativa",
    note:
      profile.preference === "Regular"
        ? "Equilibra tus medidas con el corte de esta prenda."
        : `Tiene en cuenta que prefieres un ajuste ${profile.preference.toLocaleLowerCase("es")}.`,
  };
}

export type FitVote = "Queda pequeño" | "Fiel a talla" | "Queda amplio";

export type ProductReview = {
  id: string;
  productId: string;
  name: string;
  size: Size;
  height: string;
  rating: number;
  fit: FitVote;
  text: string;
  createdAt: string;
  photo?: string;
  sample?: boolean;
};

export const sampleReviews: ProductReview[] = [
  {
    id: "sample-ines-dress",
    productId: "vestido-satin",
    name: "Inés Calderón",
    size: "M",
    height: "168",
    rating: 5,
    fit: "Fiel a talla",
    text: "La tela cae muy bien y la talla M se siente cómoda en cintura y pecho.",
    createdAt: "2026-07-18",
    sample: true,
  },
  {
    id: "sample-renata-dress",
    productId: "vestido-satin",
    name: "Renata Molina",
    size: "S",
    height: "160",
    rating: 4,
    fit: "Queda amplio",
    text: "Elegiría mi talla habitual si busco movimiento, o una menos para un ajuste cercano.",
    createdAt: "2026-06-29",
    sample: true,
  },
  {
    id: "sample-diego-tee",
    productId: "camiseta-esencial",
    name: "Diego Salvatierra",
    size: "L",
    height: "181",
    rating: 5,
    fit: "Fiel a talla",
    text: "El cuello conserva la forma y el largo funciona bien por fuera del pantalón.",
    createdAt: "2026-08-04",
    sample: true,
  },
  {
    id: "sample-mar-pants",
    productId: "pantalon-fluido",
    name: "Mar Villacorta",
    size: "M",
    height: "171",
    rating: 4,
    fit: "Fiel a talla",
    text: "La pierna tiene movimiento sin perder estructura. El largo me quedó justo.",
    createdAt: "2026-07-07",
    sample: true,
  },
  {
    id: "sample-paola-set",
    productId: "conjunto-natural",
    name: "Paola Funes",
    size: "S",
    height: "164",
    rating: 5,
    fit: "Queda amplio",
    text: "El corte relajado se ve intencional. Me gustó poder usar las piezas por separado.",
    createdAt: "2026-08-21",
    sample: true,
  },
  {
    id: "sample-mateo-overshirt",
    productId: "sobrecamisa-esencial",
    name: "Mateo Navas",
    size: "M",
    height: "176",
    rating: 5,
    fit: "Fiel a talla",
    text: "Cabe una camiseta debajo sin sentirse pesada. El lino se siente más ligero.",
    createdAt: "2026-08-12",
    sample: true,
  },
  {
    id: "sample-lucia-shirt",
    productId: "camisa-relajada",
    name: "Lucía Argüello",
    size: "M",
    height: "169",
    rating: 4,
    fit: "Queda amplio",
    text: "La usé abierta como capa. Para llevarla cerrada elegiría una talla menos.",
    createdAt: "2026-07-25",
    sample: true,
  },
];

export const validReviews = (value: unknown): value is ProductReview[] =>
  Array.isArray(value) &&
  value.every((review) => {
    if (!review || typeof review !== "object") return false;
    const item = review as ProductReview;
    return (
      typeof item.id === "string" &&
      products.some((product) => product.id === item.productId) &&
      typeof item.name === "string" &&
      item.name.length <= 60 &&
      sizes.includes(item.size) &&
      typeof item.height === "string" &&
      Number.isInteger(item.rating) &&
      item.rating >= 1 &&
      item.rating <= 5 &&
      ["Queda pequeño", "Fiel a talla", "Queda amplio"].includes(item.fit) &&
      typeof item.text === "string" &&
      item.text.length <= 500 &&
      typeof item.createdAt === "string" &&
      (item.photo === undefined ||
        (typeof item.photo === "string" &&
          item.photo.startsWith("data:image/")))
    );
  });

export type RestockAlert = Configuration & {
  key: string;
  createdAt: string;
};

export const validRestockAlerts = (value: unknown): value is RestockAlert[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as RestockAlert).key === "string" &&
      typeof (item as RestockAlert).createdAt === "string",
  );

export const validIdList = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 30 &&
  value.every(
    (id) =>
      typeof id === "string" && products.some((product) => product.id === id),
  );

export const validSearchHistory = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 8 &&
  value.every((term) => typeof term === "string" && term.length <= 80);

export const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const intentTerms: Record<string, string[]> = {
  boda: ["vestido", "saten", "conjunto"],
  evento: ["vestido", "conjunto", "saten"],
  oficina: ["pantalon", "camisa", "sobrecamisa", "sastreria"],
  verano: ["lino", "camisa", "vestido", "fluido"],
  casual: ["camiseta", "sobrecamisa", "relajada"],
  comodo: ["relajada", "fluido", "algodon"],
  unisex: ["unisex", "camiseta", "sobrecamisa", "pantalon"],
  natural: ["lino", "algodon", "avena", "arena"],
};

const productSearchText = (product: Product) =>
  normalizeSearch(
    [
      product.name,
      product.category,
      product.materials,
      product.subtitle,
      product.gender,
      ...product.colorIds.map(
        (id) => colors.find((color) => color.id === id)?.name || id,
      ),
    ].join(" "),
  );

export function matchesProductSearch(product: Product, query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return true;
  const expanded = normalized
    .split(/\s+/)
    .flatMap((term) => [term, ...(intentTerms[term] || [])]);
  const haystack = productSearchText(product);
  return (
    expanded.every((term) => haystack.includes(term)) ||
    expanded.some((term) => haystack.includes(term))
  );
}

export function predictiveProducts(query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return products.filter((product) => product.isNew);
  return products
    .map((product) => {
      const haystack = productSearchText(product);
      const terms = normalized
        .split(/\s+/)
        .flatMap((term) => [term, ...(intentTerms[term] || [])]);
      const score = terms.reduce((total, term) => {
        if (normalizeSearch(product.name).startsWith(term)) return total + 6;
        if (normalizeSearch(product.name).includes(term)) return total + 4;
        if (haystack.includes(term)) return total + 2;
        return total;
      }, 0);
      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.product);
}

const discoveryTerms = [
  "Vestido para evento",
  "Lino para verano",
  "Look de oficina",
  "Prendas unisex",
  "Camiseta de algodón",
  "Corte relajado",
];

export function predictiveTerms(query: string) {
  const normalized = normalizeSearch(query);
  if (!normalized) return discoveryTerms.slice(0, 4);
  const direct = discoveryTerms.filter((term) =>
    normalizeSearch(term).includes(normalized),
  );
  const intents = Object.keys(intentTerms)
    .filter((term) => term.startsWith(normalized))
    .map((term) => `Buscar por ${term}`);
  return [...new Set([...direct, ...intents])].slice(0, 4);
}

export function alternativeConfigurations(configuration: Configuration) {
  const product = productFor(configuration.productId);
  const candidates: Configuration[] = [];
  for (const color of product.colorIds) {
    for (const fabric of ["Algodón", "Lino"] as const) {
      const candidate = { ...configuration, color, fabric };
      if (stockFor(candidate) > 0) candidates.push(candidate);
    }
  }
  return candidates
    .filter(
      (candidate) =>
        candidate.color !== configuration.color ||
        candidate.fabric !== configuration.fabric,
    )
    .slice(0, 3);
}

export type DeliveryEstimate = {
  home: string;
  cost: number;
  pickup: { name: string; readiness: string }[];
};

const formatDeliveryDay = (date: Date) =>
  new Intl.DateTimeFormat("es-SV", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);

export function estimateDelivery(
  postal: string,
  total: number,
): DeliveryEstimate | null {
  if (!/^\d{4,6}$/.test(postal.trim())) return null;
  const offset = Number(postal.at(-1)) % 3;
  const start = new Date();
  start.setDate(start.getDate() + 2 + offset);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return {
    home: `${formatDeliveryDay(start)} a ${formatDeliveryDay(end)}`,
    cost: total >= 100 ? 0 : 4.95,
    pickup: [
      {
        name: "Estudio Centro",
        readiness: offset ? "Lista mañana" : "Lista hoy",
      },
      { name: "Punto Norte", readiness: "Lista en 2 días" },
    ],
  };
}

export type DemoOrder = {
  id: string;
  createdAt: string;
  customer: string;
  email: string;
  postal: string;
  delivery: "Domicilio" | "Retiro";
  total: number;
  lines: CartLine[];
  status: "Confirmado" | "Preparando";
};

export const validDemoOrders = (value: unknown): value is DemoOrder[] =>
  Array.isArray(value) &&
  value.length <= 10 &&
  value.every((order) => {
    if (!order || typeof order !== "object") return false;
    const item = order as DemoOrder;
    return (
      typeof item.id === "string" &&
      typeof item.createdAt === "string" &&
      typeof item.customer === "string" &&
      typeof item.email === "string" &&
      typeof item.postal === "string" &&
      ["Domicilio", "Retiro"].includes(item.delivery) &&
      Number.isFinite(item.total) &&
      Array.isArray(item.lines) &&
      ["Confirmado", "Preparando"].includes(item.status)
    );
  });

export function configurationFromUrl(): Configuration | null {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("product");
  const product = products.find((item) => item.id === productId);
  if (!product) return null;
  const color = params.get("color");
  const fabric = params.get("fabric");
  const fit = params.get("fit");
  const size = params.get("size");
  return {
    productId: product.id,
    color: product.colorIds.includes(color as Configuration["color"])
      ? (color as Configuration["color"])
      : product.colorIds[0],
    fabric: fabric === "Lino" ? "Lino" : "Algodón",
    fit: fit === "Relajado" ? "Relajado" : "Recto",
    size: sizes.includes(size as Size) ? (size as Size) : "",
  };
}

export function configurationUrl(configuration: Configuration) {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("product", configuration.productId);
  url.searchParams.set("color", configuration.color);
  url.searchParams.set("fabric", configuration.fabric);
  url.searchParams.set("fit", configuration.fit);
  if (configuration.size) url.searchParams.set("size", configuration.size);
  return url.toString();
}
