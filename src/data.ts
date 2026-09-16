export const brand = { name: "TU MARCA", currency: "USD", locale: "es-SV" };
export const money = (value: number) =>
  new Intl.NumberFormat(brand.locale, {
    style: "currency",
    currency: brand.currency,
  }).format(value);
export const colors = [
  { id: "avena", name: "Avena", hex: "#ddd1bd" },
  { id: "arena", name: "Arena", hex: "#bba286" },
  { id: "cacao", name: "Cacao", hex: "#655043" },
  { id: "oliva", name: "Oliva", hex: "#73715c" },
] as const;
export const sizes = ["XS", "S", "M", "L", "XL"] as const;
export const categories = [
  "Todo",
  "Vestidos",
  "Camisetas",
  "Pantalones",
  "Conjuntos",
  "Camisas",
] as const;
export type Category = (typeof categories)[number];
export type Size = (typeof sizes)[number];
export type ColorId = (typeof colors)[number]["id"];
export type Fabric = "Algodón" | "Lino";
export type Fit = "Recto" | "Relajado";
export type View = "Prenda" | "En persona" | "Personalizar";
export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  subtitle: string;
  model: string;
  product: string;
  detail?: boolean;
  gender: "Mujer" | "Hombre" | "Unisex";
  colorIds: ColorId[];
  availableSizes: Size[];
  materials: string;
  isNew: boolean;
};
// Demonstration catalogue. Replace via a CatalogProvider when connecting commerce.
export const products: Product[] = [
  {
    id: "vestido-satin",
    name: "Vestido satinado",
    category: "Vestidos",
    price: 69,
    subtitle: "Caída suave. Líneas que acompañan.",
    model: "dress-model",
    product: "dress-detail",
    detail: true,
    gender: "Mujer",
    colorIds: ["avena", "arena", "cacao"],
    availableSizes: ["XS", "S", "M", "L"],
    materials: "Satén de viscosa",
    isNew: true,
  },
  {
    id: "camiseta-esencial",
    name: "Camiseta esencial",
    category: "Camisetas",
    price: 24,
    subtitle: "El básico al que siempre vuelves.",
    model: "tee-model",
    product: "tee-product",
    gender: "Unisex",
    colorIds: ["avena", "cacao"],
    availableSizes: ["XS", "S", "M", "L", "XL"],
    materials: "Algodón suave",
    isNew: true,
  },
  {
    id: "pantalon-fluido",
    name: "Pantalón fluido",
    category: "Pantalones",
    price: 49,
    subtitle: "Espacio para moverte a tu manera.",
    model: "editorial-senior",
    product: "trouser-detail",
    detail: true,
    gender: "Unisex",
    colorIds: ["arena", "cacao", "oliva"],
    availableSizes: ["S", "M", "L", "XL"],
    materials: "Mezcla de lino",
    isNew: false,
  },
  {
    id: "conjunto-natural",
    name: "Conjunto natural",
    category: "Conjuntos",
    price: 119,
    subtitle: "Dos piezas. Infinitas posibilidades.",
    model: "editorial-woman",
    product: "editorial-suit",
    gender: "Mujer",
    colorIds: ["avena", "arena"],
    availableSizes: ["XS", "S", "M", "L"],
    materials: "Tejido de sastrería",
    isNew: true,
  },
  {
    id: "sobrecamisa-esencial",
    name: "Sobrecamisa esencial",
    category: "Camisas",
    price: 59,
    subtitle: "Una capa ligera. Todo el carácter.",
    model: "editorial-man",
    product: "shirt-product",
    gender: "Unisex",
    colorIds: ["avena", "arena", "cacao", "oliva"],
    availableSizes: ["XS", "S", "M", "L", "XL"],
    materials: "Algodón o lino",
    isNew: true,
  },
  {
    id: "camisa-relajada",
    name: "Camisa relajada",
    category: "Camisas",
    price: 45,
    subtitle: "Ligera, cómoda, sin complicaciones.",
    model: "shirt-model",
    product: "shirt-product",
    gender: "Hombre",
    colorIds: ["avena", "arena"],
    availableSizes: ["S", "M", "L", "XL"],
    materials: "Algodón",
    isNew: false,
  },
];
export type Configuration = {
  productId: string;
  color: ColorId;
  fabric: Fabric;
  fit: Fit;
  size: Size | "";
};
export type CartLine = Configuration & { key: string; quantity: number };
export const defaultConfiguration = (
  productId = "sobrecamisa-esencial",
): Configuration => ({
  productId,
  color: products.find((p) => p.id === productId)?.colorIds[0] || "avena",
  fabric: "Algodón",
  fit: "Recto",
  size: "",
});
export const productFor = (id: string) =>
  products.find((p) => p.id === id) || products[4];
export const priceFor = (c: Configuration) =>
  productFor(c.productId).price +
  (c.fabric === "Lino" ? 12 : 0) +
  (c.fit === "Relajado" ? 5 : 0);
export const available = (c: Configuration) =>
  !!c.size &&
  productFor(c.productId).availableSizes.includes(c.size) &&
  !(c.color === "oliva" && (c.size === "XS" || c.size === "XL")) &&
  !(c.color === "cacao" && c.fabric === "Lino");
export const stockFor = (c: Configuration) =>
  available(c) ? (c.size === "L" ? 3 : 8) : 0;
export const lineKey = (c: Configuration) =>
  [c.productId, c.color, c.fabric, c.fit, c.size].join("|");
export const imagePath = (name: string, width = 800) =>
  `${import.meta.env.BASE_URL}images/${name}-${width}.webp`;
export const validConfiguration = (value: unknown): value is Configuration => {
  if (!value || typeof value !== "object") return false;
  const c = value as Configuration;
  return (
    products.some((p) => p.id === c.productId) &&
    productFor(c.productId).colorIds.includes(c.color) &&
    ["Algodón", "Lino"].includes(c.fabric) &&
    ["Recto", "Relajado"].includes(c.fit) &&
    (c.size === "" || sizes.includes(c.size))
  );
};
export const validCart = (v: unknown): v is CartLine[] =>
  Array.isArray(v) &&
  v.every((value) => {
    if (!validConfiguration(value)) return false;
    const c = value as CartLine;
    return (
      Number.isInteger(c.quantity) &&
      c.quantity > 0 &&
      c.quantity <= stockFor(c) &&
      c.key === lineKey(c)
    );
  });
