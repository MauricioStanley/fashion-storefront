import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// A small, reviewed set, not a stock-library scraper. Source pages in IMAGE_CREDITS.md.
const assets = [
  ["editorial-hero", 20016585],
  ["editorial-woman", 9142805],
  ["editorial-suit", 5585839],
  ["editorial-man", 27045936],
  ["shirt-product", 11674381],
  ["wardrobe", 4947543],
  ["linen-rack", 8483478],
  ["editorial-senior", 5473324],
  ["tee-model", 5468621],
  ["shirt-model", 4295983],
  ["tee-product", 6046231],
  ["dress-model", 19908472],
  ["editorial-duo", 8484082],
];
await fs.mkdir("public/images", { recursive: true });
await fs.mkdir(".assets-cache", { recursive: true });
for (const [name, id] of assets) {
  const original = path.join(".assets-cache", `${id}.jpg`);
  let buffer;
  try {
    buffer = await fs.readFile(original);
  } catch {
    const response = await fetch(
      `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1800`,
    );
    if (!response.ok) throw new Error(`${name}: ${response.status}`);
    buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(original, buffer);
  }
  for (const width of [480, 800, 1280]) {
    await sharp(buffer)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(`public/images/${name}-${width}.webp`);
  }
  console.log(`Optimized ${name}`);
}

// Distinct, tightly framed detail photographs while flat-lay SKU photos are pending.
// These are crops of the credited originals, not generated garment imagery.
for (const [name, id, x, y, w, h] of [
  ["dress-detail", 19908472, 0.18, 0.39, 0.66, 0.6],
  ["trouser-detail", 5473324, 0.2, 0.39, 0.6, 0.6],
]) {
  const input = await fs.readFile(path.join(".assets-cache", `${id}.jpg`));
  const meta = await sharp(input).metadata();
  const region = {
    left: Math.floor(meta.width * x),
    top: Math.floor(meta.height * y),
    width: Math.floor(meta.width * w),
    height: Math.floor(meta.height * h),
  };
  for (const width of [480, 800, 1280])
    await sharp(input)
      .extract(region)
      .resize({ width })
      .webp({ quality: 80 })
      .toFile(`public/images/${name}-${width}.webp`);
  console.log(`Optimized ${name}`);
}
