import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ImagePlus,
  LockKeyhole,
  MapPin,
  PackageCheck,
  Ruler,
  ScanFace,
  Share2,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { emailError } from "../validation";
import { money, priceFor, productFor, sizes } from "../data";
import type { CartLine, Product, Size } from "../data";
import { estimateDelivery, measurementError, recommendSize } from "../commerce";
import type {
  DeliveryEstimate,
  DemoOrder,
  FitPreference,
  FitVote,
  ProductReview,
  SizeProfile,
} from "../commerce";
import { Photo, Segmented } from "./UI";

export function SizeProfilePanel({
  profile,
  setProfile,
  product,
  onApply,
}: {
  profile: SizeProfile;
  setProfile: (value: SizeProfile) => void;
  product: Product;
  onApply: (size: Size) => void;
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [confirmed, setConfirmed] = useState(false);
  const chestIssue = touched.chest
    ? measurementError("tu contorno de pecho", profile.chest, 72, 124, true)
    : "";
  const heightIssue = touched.height
    ? measurementError("tu altura", profile.height, 130, 210)
    : "";
  const waistIssue = touched.waist
    ? measurementError("tu cintura", profile.waist, 50, 150)
    : "";
  const hipsIssue = touched.hips
    ? measurementError("tu cadera", profile.hips, 60, 160)
    : "";
  const recommendation = recommendSize(profile, product);
  const update = (patch: Partial<SizeProfile>) => {
    setConfirmed(false);
    setProfile({ ...profile, ...patch });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched({ chest: true, height: true, waist: true, hips: true });
    const hasErrors =
      measurementError("tu contorno de pecho", profile.chest, 72, 124, true) ||
      measurementError("tu altura", profile.height, 130, 210) ||
      measurementError("tu cintura", profile.waist, 50, 150) ||
      measurementError("tu cadera", profile.hips, 60, 160);
    if (hasErrors || !recommendation) {
      document.getElementById("profile-chest")?.focus();
      return;
    }
    setConfirmed(true);
  };

  return (
    <form className="size-profile-form" onSubmit={submit} noValidate>
      <p className="drawer-intro">
        Crea una referencia reutilizable. Tus medidas se quedan en este
        navegador.
      </p>
      <div className="profile-measure-grid">
        <label>
          Contorno de pecho (cm) <span>Obligatorio</span>
          <div className="measure-input">
            <input
              id="profile-chest"
              aria-label="Contorno de pecho (cm)"
              value={profile.chest}
              onChange={(event) => {
                update({ chest: event.target.value });
                setTouched({ ...touched, chest: true });
              }}
              onBlur={() => setTouched({ ...touched, chest: true })}
              inputMode="decimal"
              enterKeyHint="next"
              autoComplete="off"
              placeholder="96"
              aria-invalid={!!chestIssue}
              aria-describedby="size-validation"
            />
            <span>cm</span>
          </div>
          <small
            id="size-validation"
            className={chestIssue ? "form-error" : ""}
            role="status"
          >
            {chestIssue || "Mide alrededor de la parte más amplia."}
          </small>
        </label>
        <label>
          Altura <span>Opcional</span>
          <div className="measure-input">
            <input
              value={profile.height}
              onChange={(event) => {
                update({ height: event.target.value });
                setTouched({ ...touched, height: true });
              }}
              onBlur={() => setTouched({ ...touched, height: true })}
              inputMode="decimal"
              enterKeyHint="next"
              autoComplete="off"
              placeholder="168"
              aria-invalid={!!heightIssue}
              aria-describedby="profile-height-error"
            />
            <span>cm</span>
          </div>
          <small
            id="profile-height-error"
            className={heightIssue ? "form-error" : ""}
          >
            {heightIssue || "Ayuda a interpretar el largo."}
          </small>
        </label>
        <label>
          Cintura <span>Opcional</span>
          <div className="measure-input">
            <input
              value={profile.waist}
              onChange={(event) => {
                update({ waist: event.target.value });
                setTouched({ ...touched, waist: true });
              }}
              onBlur={() => setTouched({ ...touched, waist: true })}
              inputMode="decimal"
              enterKeyHint="next"
              autoComplete="off"
              placeholder="78"
              aria-invalid={!!waistIssue}
            />
            <span>cm</span>
          </div>
          {waistIssue && <small className="form-error">{waistIssue}</small>}
        </label>
        <label>
          Cadera <span>Opcional</span>
          <div className="measure-input">
            <input
              value={profile.hips}
              onChange={(event) => {
                update({ hips: event.target.value });
                setTouched({ ...touched, hips: true });
              }}
              onBlur={() => setTouched({ ...touched, hips: true })}
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              placeholder="102"
              aria-invalid={!!hipsIssue}
            />
            <span>cm</span>
          </div>
          {hipsIssue && <small className="form-error">{hipsIssue}</small>}
        </label>
      </div>
      <label className="profile-select">
        Tu talla habitual
        <select
          value={profile.usualSize}
          onChange={(event) =>
            update({ usualSize: event.target.value as Size | "" })
          }
        >
          <option value="">Prefiero no indicarla</option>
          {sizes.map((size) => (
            <option key={size}>{size}</option>
          ))}
        </select>
      </label>
      <fieldset className="fit-preference">
        <legend>¿Cómo te gusta llevar la ropa?</legend>
        <Segmented
          label="Preferencia de ajuste"
          options={["Ajustado", "Regular", "Holgado"] as const}
          value={profile.preference}
          onChange={(preference: FitPreference) => update({ preference })}
        />
      </fieldset>
      {recommendation && confirmed && !chestIssue && !heightIssue && (
        <div className="size-recommendation" role="status" aria-live="polite">
          <Ruler size={24} />
          <div>
            <span>
              {recommendation.confidence} para {product.name}
            </span>
            <h3>Tu talla de referencia: {recommendation.size}</h3>
            <p>{recommendation.note}</p>
            <button
              className="text-link"
              type="button"
              onClick={() => onApply(recommendation.size)}
            >
              Usar esta talla <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
      <button className="primary-button" type="submit">
        Consultar mi talla <Ruler size={17} />
      </button>
      <p className="privacy-inline">
        <LockKeyhole size={14} /> No se envía ninguna medida fuera de este
        dispositivo.
      </p>
    </form>
  );
}

export function DeliveryPanel({ total }: { total: number }) {
  const [postal, setPostal] = useState("");
  const [touched, setTouched] = useState(false);
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const issue =
    touched && !/^\d{4,6}$/.test(postal.trim())
      ? "Introduce un código postal de 4 a 6 números."
      : "";
  const calculate = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    const next = estimateDelivery(postal, total);
    setEstimate(next);
    if (!next) document.getElementById("delivery-postal")?.focus();
  };
  return (
    <div className="delivery-panel">
      <p className="drawer-intro">
        Calcula una entrega demostrativa y revisa cómo se comunicaría el retiro
        en tienda.
      </p>
      <form onSubmit={calculate} noValidate>
        <label htmlFor="delivery-postal">Código postal</label>
        <div className="delivery-postal-input">
          <MapPin size={18} />
          <input
            id="delivery-postal"
            value={postal}
            onChange={(event) => {
              setPostal(event.target.value.replace(/\D/g, "").slice(0, 6));
              setTouched(true);
              setEstimate(null);
            }}
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="postal-code"
            placeholder="1101"
            aria-invalid={!!issue}
            aria-describedby="postal-feedback"
          />
          <button className="secondary-button" type="submit">
            Calcular
          </button>
        </div>
        <p
          id="postal-feedback"
          className={issue ? "form-error" : "field-feedback"}
        >
          {issue || "Usaremos el código únicamente para esta simulación."}
        </p>
      </form>
      {estimate && (
        <div className="delivery-results" role="status">
          <article>
            <Truck size={22} />
            <div>
              <strong>Entrega a domicilio</strong>
              <p>{estimate.home}</p>
              <span>{estimate.cost ? money(estimate.cost) : "Sin costo"}</span>
            </div>
          </article>
          {estimate.pickup.map((location) => (
            <article key={location.name}>
              <Store size={22} />
              <div>
                <strong>{location.name}</strong>
                <p>Retiro de demostración</p>
                <span>{location.readiness}</span>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="returns-note">
        <PackageCheck size={22} />
        <div>
          <strong>Cambios sencillos durante 30 días</strong>
          <p>
            La política, los costos y las fechas son contenido de muestra que
            podrá adaptar cada tienda.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ReviewForm({
  product,
  onSubmit,
}: {
  product: Product;
  onSubmit: (review: ProductReview) => void;
}) {
  const [name, setName] = useState("");
  const [size, setSize] = useState<Size | "">("");
  const [height, setHeight] = useState("");
  const [rating, setRating] = useState(5);
  const [fit, setFit] = useState<FitVote>("Fiel a talla");
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [photoIssue, setPhotoIssue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const nameIssue =
    submitted && name.trim().length < 2 ? "Añade tu nombre." : "";
  const sizeIssue = submitted && !size ? "Elige la talla que probaste." : "";
  const heightIssue = submitted
    ? measurementError("tu altura", height, 130, 210, true)
    : "";
  const textIssue =
    submitted && text.trim().length < 20
      ? "Cuéntanos un poco más. Usa al menos 20 caracteres."
      : "";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (
      name.trim().length < 2 ||
      !size ||
      measurementError("tu altura", height, 130, 210, true) ||
      text.trim().length < 20
    )
      return;
    onSubmit({
      id: globalThis.crypto?.randomUUID?.() || `review-${Date.now()}`,
      productId: product.id,
      name: name.trim(),
      size,
      height,
      rating,
      fit,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      photo,
    });
  };
  return (
    <form className="review-form" onSubmit={submit} noValidate>
      <p className="drawer-intro">
        Tu opinión se añadirá a {product.name} en este navegador.
      </p>
      <label>
        Nombre
        <input
          value={name}
          onChange={(event) => setName(event.target.value.slice(0, 60))}
          autoComplete="name"
          enterKeyHint="next"
          aria-invalid={!!nameIssue}
        />
        {nameIssue && <small className="form-error">{nameIssue}</small>}
      </label>
      <div className="review-form-grid">
        <label>
          Talla usada
          <select
            value={size}
            onChange={(event) => setSize(event.target.value as Size | "")}
            aria-invalid={!!sizeIssue}
          >
            <option value="">Selecciona</option>
            {product.availableSizes.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          {sizeIssue && <small className="form-error">{sizeIssue}</small>}
        </label>
        <label>
          Altura
          <div className="measure-input">
            <input
              value={height}
              onChange={(event) => setHeight(event.target.value)}
              inputMode="decimal"
              enterKeyHint="next"
              placeholder="168"
              aria-invalid={!!heightIssue}
            />
            <span>cm</span>
          </div>
          {heightIssue && <small className="form-error">{heightIssue}</small>}
        </label>
      </div>
      <fieldset>
        <legend>Valoración</legend>
        <div className="rating-picker">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              key={value}
              aria-label={`${value} estrellas`}
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
            >
              <Star
                size={22}
                fill={value <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>¿Cómo queda?</legend>
        <Segmented
          label="Ajuste observado"
          options={["Queda pequeño", "Fiel a talla", "Queda amplio"] as const}
          value={fit}
          onChange={setFit}
        />
      </fieldset>
      <label>
        Tu experiencia
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, 500))}
          rows={5}
          placeholder="Cuéntanos sobre el ajuste, la tela o el largo."
          aria-invalid={!!textIssue}
        />
        <small className={textIssue ? "form-error" : "field-feedback"}>
          {textIssue || `${text.length}/500 caracteres`}
        </small>
      </label>
      <label className="photo-upload">
        <ImagePlus size={20} />
        <span>
          <strong>Añadir una foto</strong>
          <small>Opcional, JPG o PNG de hasta 1.5 MB</small>
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (file.size > 1_500_000) {
              setPhotoIssue("La imagen supera 1.5 MB. Elige una más ligera.");
              setPhoto(undefined);
              return;
            }
            setPhotoIssue("");
            const reader = new FileReader();
            reader.onload = () => setPhoto(String(reader.result));
            reader.readAsDataURL(file);
          }}
        />
      </label>
      {photoIssue && <p className="form-error">{photoIssue}</p>}
      {photo && (
        <img
          className="review-photo-preview"
          src={photo}
          alt="Vista previa de tu foto"
        />
      )}
      <button className="primary-button" type="submit">
        Publicar en esta demo <ArrowRight size={17} />
      </button>
    </form>
  );
}

export function DemoCheckout({
  cart,
  total,
  onComplete,
}: {
  cart: CartLine[];
  total: number;
  onComplete: (order: DemoOrder) => void;
}) {
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [postal, setPostal] = useState("");
  const [address, setAddress] = useState("");
  const [delivery, setDelivery] = useState<"Domicilio" | "Retiro">("Domicilio");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const estimate = estimateDelivery(postal, total);
  const shipping = delivery === "Domicilio" ? estimate?.cost || 0 : 0;
  const customerIssue =
    submitted && customer.trim().length < 3
      ? "Escribe tu nombre completo."
      : "";
  const emailIssue = submitted ? emailError(email) : "";
  const postalIssue =
    submitted && !estimate
      ? "Introduce un código postal de 4 a 6 números."
      : "";
  const addressIssue =
    submitted && delivery === "Domicilio" && address.trim().length < 8
      ? "Añade una dirección más completa."
      : "";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const currentCustomerIssue =
      customer.trim().length < 3 ? "Escribe tu nombre completo." : "";
    const currentEmailIssue = emailError(email);
    const currentPostalIssue = estimate
      ? ""
      : "Introduce un código postal de 4 a 6 números.";
    const currentAddressIssue =
      delivery === "Domicilio" && address.trim().length < 8
        ? "Añade una dirección más completa."
        : "";
    if (
      currentCustomerIssue ||
      currentEmailIssue ||
      currentPostalIssue ||
      currentAddressIssue ||
      !cart.length
    )
      return;
    setBusy(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
    onComplete({
      id: `DEMO-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      customer: customer.trim(),
      email: email.trim(),
      postal,
      delivery,
      total: total + shipping,
      lines: cart,
      status: "Confirmado",
    });
  };

  return (
    <form className="checkout-form" onSubmit={submit} noValidate>
      <div className="checkout-demo-note">
        <LockKeyhole size={20} />
        <div>
          <strong>Checkout de demostración</strong>
          <p>No se solicita tarjeta, no se cobra y no se envía información.</p>
        </div>
      </div>
      <section aria-labelledby="checkout-contact">
        <h3 id="checkout-contact">Tus datos</h3>
        <label>
          Nombre completo
          <input
            value={customer}
            onChange={(event) => setCustomer(event.target.value)}
            autoComplete="name"
            enterKeyHint="next"
            aria-invalid={!!customerIssue}
          />
          {customerIssue && (
            <small className="form-error">{customerIssue}</small>
          )}
        </label>
        <label>
          Correo electrónico
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            enterKeyHint="next"
            aria-invalid={!!emailIssue}
          />
          {emailIssue && <small className="form-error">{emailIssue}</small>}
        </label>
      </section>
      <section aria-labelledby="checkout-delivery">
        <h3 id="checkout-delivery">Cómo quieres recibirlo</h3>
        <Segmented
          label="Método de entrega"
          options={["Domicilio", "Retiro"] as const}
          value={delivery}
          onChange={setDelivery}
        />
        <label>
          Código postal
          <input
            value={postal}
            onChange={(event) =>
              setPostal(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="postal-code"
            enterKeyHint="next"
            placeholder="1101"
            aria-invalid={!!postalIssue}
          />
          {postalIssue && <small className="form-error">{postalIssue}</small>}
        </label>
        {delivery === "Domicilio" && (
          <label>
            Dirección
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              autoComplete="street-address"
              enterKeyHint="done"
              placeholder="Calle, número y referencia"
              aria-invalid={!!addressIssue}
            />
            {addressIssue && (
              <small className="form-error">{addressIssue}</small>
            )}
          </label>
        )}
        {estimate && (
          <div className="checkout-delivery-preview" role="status">
            {delivery === "Domicilio" ? (
              <Truck size={19} />
            ) : (
              <Store size={19} />
            )}
            <span>
              <strong>
                {delivery === "Domicilio"
                  ? estimate.home
                  : estimate.pickup[0].readiness}
              </strong>
              <small>
                {delivery === "Domicilio"
                  ? estimate.cost
                    ? money(estimate.cost)
                    : "Envío incluido"
                  : estimate.pickup[0].name}
              </small>
            </span>
          </div>
        )}
      </section>
      <section
        className="checkout-summary"
        aria-labelledby="checkout-summary-title"
      >
        <h3 id="checkout-summary-title">Resumen</h3>
        {cart.map((line) => (
          <div key={line.key}>
            <span>
              {line.quantity} × {productFor(line.productId).name}
              <small>
                {line.size} / {line.fabric}
              </small>
            </span>
            <strong>{money(line.quantity * priceFor(line))}</strong>
          </div>
        ))}
        <div>
          <span>Entrega</span>
          <strong>{shipping ? money(shipping) : "Incluida"}</strong>
        </div>
        <div className="checkout-total">
          <span>Total demostrativo</span>
          <strong>{money(total + shipping)}</strong>
        </div>
      </section>
      <button
        className="primary-button"
        type="submit"
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? "Preparando confirmación…" : "Confirmar pedido demo"}
        <ArrowRight size={17} />
      </button>
      <p className="privacy-inline">
        <Check size={14} /> Continúas como invitado. No necesitas crear una
        cuenta.
      </p>
    </form>
  );
}

export function OrdersPanel({ orders }: { orders: DemoOrder[] }) {
  if (!orders.length) {
    return (
      <div className="empty-state">
        <ShoppingBag size={32} />
        <h3>Todavía no hay pedidos demo.</h3>
        <p>
          Completa el checkout para probar la confirmación y el seguimiento.
        </p>
      </div>
    );
  }
  return (
    <div className="orders-list">
      <p className="drawer-intro">
        Seguimiento local para enseñar el flujo posterior a la compra.
      </p>
      {orders.map((order) => (
        <article key={order.id}>
          <header>
            <div>
              <span>Pedido de demostración</span>
              <h3>{order.id}</h3>
            </div>
            <strong>{money(order.total)}</strong>
          </header>
          <div
            className="order-timeline"
            aria-label={`Estado: ${order.status}`}
          >
            <div className="complete">
              <CheckCircle2 size={18} />
              <span>
                <strong>Confirmado</strong>
                <small>Datos validados</small>
              </span>
            </div>
            <div
              className={order.status === "Preparando" ? "complete" : "current"}
            >
              <PackageCheck size={18} />
              <span>
                <strong>Preparando</strong>
                <small>Estado demostrativo</small>
              </span>
            </div>
            <div>
              <Truck size={18} />
              <span>
                <strong>{order.delivery}</strong>
                <small>Pendiente de despacho</small>
              </span>
            </div>
          </div>
          <p>
            {order.lines.length} líneas · {order.email}
          </p>
        </article>
      ))}
    </div>
  );
}

export function TryOnPanel({ product }: { product: Product }) {
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "ready">("idle");
  const [issue, setIssue] = useState("");
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const choosePhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5_000_000) {
      setIssue("Elige una imagen JPG, PNG o WEBP de hasta 5 MB.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setIssue("");
    setPreview(URL.createObjectURL(file));
    setStatus("processing");
    window.setTimeout(() => setStatus("ready"), 800);
  };

  return (
    <div className="try-on-panel">
      <div className="try-on-privacy">
        <LockKeyhole size={20} />
        <div>
          <strong>Tu foto no sale del navegador</strong>
          <p>La vista se elimina al cerrar o recargar esta página.</p>
        </div>
      </div>
      {!preview && (
        <label className="try-on-drop">
          <ScanFace size={34} />
          <strong>Añade una foto de cuerpo completo</strong>
          <span>
            Buena luz, postura frontal y ropa ajustada ayudan a comparar.
          </span>
          <span className="secondary-button">Elegir foto</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => choosePhoto(event.target.files?.[0])}
          />
        </label>
      )}
      {issue && (
        <p className="form-error" role="alert">
          {issue}
        </p>
      )}
      {preview && (
        <>
          <div
            className={`try-on-stage ${status}`}
            aria-busy={status === "processing"}
          >
            <figure>
              <img src={preview} alt="Tu foto para la prueba visual" />
              <figcaption>Tu foto</figcaption>
            </figure>
            <figure>
              <Photo
                name={product.model}
                alt={`${product.name} sobre modelo de referencia`}
              />
              <figcaption>Referencia en persona</figcaption>
            </figure>
            {status === "processing" && (
              <div className="try-on-processing" role="status">
                <div className="media-skeleton" />
                <span>Preparando la comparación…</span>
              </div>
            )}
          </div>
          {status === "ready" && (
            <div className="inline-status success" role="status">
              <CheckCircle2 size={20} />
              <div>
                <strong>Comparación lista.</strong>
                <p>
                  Esta demo presenta tu foto junto a la vista real. Una
                  integración futura puede sustituir este módulo por generación
                  sobre la persona.
                </p>
              </div>
            </div>
          )}
          <label className="text-link try-another-photo">
            Cambiar foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => choosePhoto(event.target.files?.[0])}
            />
          </label>
        </>
      )}
    </div>
  );
}

export function SharePanel({
  url,
  onCopied,
}: {
  url: string;
  onCopied: () => void;
}) {
  const [copyIssue, setCopyIssue] = useState("");
  const nativeShare = typeof navigator.share === "function";
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyIssue("");
      onCopied();
    } catch {
      setCopyIssue(
        "No pudimos copiar automáticamente. Selecciona el enlace y cópialo.",
      );
    }
  };
  return (
    <div className="share-panel">
      <p className="drawer-intro">
        El enlace conserva prenda, color, tela, corte y talla para abrir esta
        misma combinación.
      </p>
      <label>
        Enlace a tu combinación
        <div className="share-input">
          <input
            value={url}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            className="icon-button"
            aria-label="Copiar enlace"
            onClick={copy}
          >
            <Copy size={18} />
          </button>
        </div>
      </label>
      {copyIssue && (
        <p className="form-error" role="alert">
          {copyIssue}
        </p>
      )}
      <div className="share-actions">
        <button className="primary-button" onClick={copy}>
          <Copy size={17} /> Copiar enlace
        </button>
        {nativeShare && (
          <button
            className="secondary-button"
            onClick={async () => {
              try {
                await navigator.share({
                  title: productFor(
                    new URL(url).searchParams.get("product") || "",
                  ).name,
                  url,
                });
              } catch {
                // Closing the native share sheet is not an error for the user.
              }
            }}
          >
            <Share2 size={17} /> Compartir
          </button>
        )}
      </div>
    </div>
  );
}
