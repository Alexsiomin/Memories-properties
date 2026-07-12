import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  staticEntries,
  regionEntries,
  locationEntries,
  searchEntries,
  developmentSlug as sitemapDevelopmentSlug,
} from "../../scripts/generate-sitemap";
import { developmentSlug as appDevelopmentSlug } from "../lib/developments";

/**
 * Guards against the sitemap drifting from the app's real routes.
 *
 * Two failure modes we protect against:
 *  1. A new public page ships without a sitemap entry (or a removed page lingers).
 *  2. The development URL slug format diverges between the app and the generator
 *     (the exact bug that shipped broken /developments/* URLs before).
 */

// Routes that exist in the router but must NOT appear in the sitemap.
// Private/auth/account/admin areas and non-indexable utility routes.
const NON_INDEXABLE = new Set<string>([
  "/account",
  "/account/lettings-search",
  "/account/buying-search",
  "/reset-password",
  "/welcome",
  "/auth",
  "/auth/callback",
]);

// Dynamic routes (with :params) are covered by generated entries, not staticEntries.
// Each must map to a generator that emits them, verified separately below.
const DYNAMIC_PREFIXES = [
  "/properties/region/", // regionEntries
  "/locations/", // locationEntries
  "/property-search/", // searchEntries
  "/properties/", // fetchPropertyEntries (DB)
  "/developments/", // fetchDevelopmentEntries (DB)
  "/blog/category/", // fetchBlogEntries (DB)
  "/blog/", // fetchBlogEntries (DB)
];

function parseRoutePaths(): string[] {
  const src = readFileSync(resolve("src/App.tsx"), "utf8");
  const paths = new Set<string>();
  const re = /<Route\s+path="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let p = m[1];
    // Language-prefix wrappers mount the whole tree; they are not real pages.
    if (p === "/ru/*" || p === "/*" || p === "*") continue;
    // Routes now use paths relative to the language prefix (descendant routing);
    // normalize back to absolute for comparison with the sitemap.
    if (!p.startsWith("/")) p = "/" + p;
    paths.add(p);
  }
  // The home page is now an index route (<Route index .../>) with no path attr.
  if (/<Route\s+index/.test(src)) paths.add("/");
  return [...paths];
}



describe("sitemap ↔ routes parity", () => {
  const routePaths = parseRoutePaths();
  const sitemapStaticPaths = new Set(staticEntries.map((e) => e.path));
  // Non-DB generators also emit fixed (non-parameterised) paths like "/locations".
  const allNonDbPaths = new Set(
    [...staticEntries, ...regionEntries, ...locationEntries, ...searchEntries].map((e) => e.path),
  );

  it("finds routes to check", () => {
    expect(routePaths.length).toBeGreaterThan(10);
  });

  it("every public static route has a sitemap entry", () => {
    const missing = routePaths.filter((p) => {
      if (p === "*" || p === "/") return false; // wildcard skipped; "/" checked below
      if (p.includes(":")) return false; // dynamic, checked elsewhere
      if (p.startsWith("/admin")) return false; // admin never indexed
      if (NON_INDEXABLE.has(p)) return false;
      return !allNonDbPaths.has(p);
    });
    expect(missing, `Public routes missing from sitemap: ${missing.join(", ")}`).toEqual([]);
  });

  it("home route is in the sitemap", () => {
    expect(sitemapStaticPaths.has("/")).toBe(true);
  });

  it("no sitemap static entry points to a non-indexable or unknown route", () => {
    const routeSet = new Set(routePaths);
    const bad = [...sitemapStaticPaths].filter((p) => {
      if (NON_INDEXABLE.has(p)) return true; // must not be listed
      return !routeSet.has(p); // must correspond to a real route
    });
    expect(bad, `Sitemap entries with no matching public route: ${bad.join(", ")}`).toEqual([]);
  });

  it("every dynamic route is covered by a generator", () => {
    const dynamicRoutes = routePaths.filter(
      (p) => p.includes(":") && !p.startsWith("/admin") && !NON_INDEXABLE.has(p),
    );
    const uncovered = dynamicRoutes.filter((p) => {
      const base = p.slice(0, p.indexOf(":"));
      return !DYNAMIC_PREFIXES.some((prefix) => prefix === base);
    });
    expect(uncovered, `Dynamic routes with no sitemap generator: ${uncovered.join(", ")}`).toEqual([]);
  });

  it("region and location generators produce well-formed entries", () => {
    expect(regionEntries.every((e) => e.path.startsWith("/properties/region/"))).toBe(true);
    expect(locationEntries.some((e) => e.path === "/locations")).toBe(true);
    expect(locationEntries.every((e) => e.path.startsWith("/locations"))).toBe(true);
    expect(searchEntries.every((e) => e.path.startsWith("/property-search/"))).toBe(true);
  });
});

describe("development slug format parity (regression guard)", () => {
  const cases: Array<[number, number | null, string | null]> = [
    [28, 320000, "Paphos"],
    [1, 1350000, "Paphos"],
    [22, 494000, "Polis"],
    [6, 215000, "Koloni"],
    [3, null, "Kato Paphos"],
    [12, 275000, "Chlorakas · Some Project"],
    [4, 215000, null],
    [1, 0, "Peyia"],
  ];

  it("sitemap generator and app produce identical development slugs", () => {
    for (const [units, price, loc] of cases) {
      expect(sitemapDevelopmentSlug(units, price, loc)).toBe(appDevelopmentSlug(units, price, loc));
    }
  });
});
