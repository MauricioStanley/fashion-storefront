import { ArrowUpRight } from "lucide-react";
import type { Product } from "../data";
import { money } from "../data";
import { Photo } from "./UI";

export function Suggestions({
  products,
  onChoose,
  title = "Un buen lugar para empezar",
}: {
  products: Product[];
  onChoose: (product: Product) => void;
  title?: string;
}) {
  return (
    <section className="suggestions" aria-label={title}>
      <h3>{title}</h3>
      <div className="suggestion-list">
        {products.slice(0, 3).map((product) => (
          <article className="suggestion-row" key={product.id}>
            <Photo name={product.model} alt={product.name} sizes="80px" />
            <div>
              <button
                className="suggestion-name"
                onClick={() => onChoose(product)}
              >
                {product.name} <ArrowUpRight size={16} />
              </button>
              <p>{product.materials}</p>
              <span>{money(product.price)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
