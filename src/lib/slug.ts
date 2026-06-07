export const RESERVED_SLUGS = [
  "panel",
  "acceso",
  "registro",
  "salir",
  "pedido",
  "api",
  "icons",
  "manifest.webmanifest",
  "sw.js",
  "_next",
];

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && slug.length >= 3 && slug.length <= 60 && !RESERVED_SLUGS.includes(slug);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
