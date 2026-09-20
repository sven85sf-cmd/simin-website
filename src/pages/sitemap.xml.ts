import type { APIRoute } from "astro";
import { company } from "@/config/site";

export const prerender = true;

const paths = [
  "/",
  "/gebaeudereinigung-koeln",
  "/objektservice-koeln",
  "/aussenanlagenpflege-koeln",
  "/winterdienst-koeln",
  "/fuer-hausverwaltungen",
  "/ueber-uns",
  "/referenzen",
  "/angebot",
  "/kontakt",
  "/herbst-winter",
  "/impressum",
  "/datenschutz",
];

export const GET: APIRoute = () => {
  const urls = paths
    .map((path) => {
      const loc = new URL(path, company.url).toString();
      return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml" },
  });
};
