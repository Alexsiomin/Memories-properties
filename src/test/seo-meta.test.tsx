import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import SEO from "@/components/SEO";

// The override hook hits the backend — stub it so the test runs offline and
// only exercises the meta-tag rendering logic.
vi.mock("@/hooks/use-seo-override", () => ({
  useSeoOverride: () => null,
}));

/**
 * Representative public routes and the SEO props each renders with.
 * Add a route here whenever a new public page ships so its social tags
 * stay covered by this automated check.
 */
const ROUTES: { path: string; title: string; description: string; image?: string }[] = [
  { path: "/", title: "Memories Properties", description: "Luxury real estate." },
  { path: "/properties", title: "Properties", description: "Browse our listings." },
  { path: "/properties/marbella-villa", title: "Marbella Villa", description: "A stunning villa.", image: "/villa.jpg" },
  { path: "/locations", title: "Locations", description: "Explore locations." },
  { path: "/developments", title: "Developments", description: "New developments." },
  { path: "/about", title: "About", description: "About Memories." },
  { path: "/contact", title: "Contact", description: "Get in touch." },
  { path: "/blog", title: "Blog", description: "Latest insights." },
];

const ORIGIN = "http://localhost:3000";

function metaContent(selector: string): string | null {
  return document.head.querySelector(selector)?.getAttribute("content") ?? null;
}

describe("OpenGraph & Twitter meta tags per route", () => {
  beforeEach(() => {
    cleanup();
    // react-helmet-async mutates document.head; clear stale tags between runs.
    document.head.querySelectorAll("meta, title, link[rel='canonical']").forEach((el) => el.remove());
  });

  it.each(ROUTES)("renders correct OG + Twitter tags on $path", async (route) => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={[route.path]}>
          <SEO title={route.title} description={route.description} image={route.image} />
        </MemoryRouter>
      </HelmetProvider>
    );

    const expectedTitle = route.title.includes("Memories")
      ? route.title
      : `${route.title} | Memories`;
    const expectedUrl = `${ORIGIN}${route.path}`;
    const expectedImage = route.image
      ? `${ORIGIN}${route.image}`
      : `${ORIGIN}/og-image.jpg`;

    await waitFor(() => {
      expect(metaContent("meta[property='og:title']")).toBe(expectedTitle);
    });

    // OpenGraph
    expect(metaContent("meta[property='og:title']")).toBe(expectedTitle);
    expect(metaContent("meta[property='og:description']")).toBe(route.description);
    expect(metaContent("meta[property='og:type']")).toBe("website");
    expect(metaContent("meta[property='og:url']")).toBe(expectedUrl);
    expect(metaContent("meta[property='og:image']")).toBe(expectedImage);
    expect(metaContent("meta[property='og:site_name']")).toBe("Memories");

    // Twitter
    expect(metaContent("meta[name='twitter:card']")).toBe("summary_large_image");
    expect(metaContent("meta[name='twitter:title']")).toBe(expectedTitle);
    expect(metaContent("meta[name='twitter:description']")).toBe(route.description);
    expect(metaContent("meta[name='twitter:image']")).toBe(expectedImage);
  });

  it("truncates long descriptions to <=160 chars for social tags", async () => {
    const longDesc = "x".repeat(300);
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={["/"]}>
          <SEO title="Long" description={longDesc} />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(metaContent("meta[property='og:description']")).toBeTruthy();
    });

    const ogDesc = metaContent("meta[property='og:description']")!;
    const twDesc = metaContent("meta[name='twitter:description']")!;
    expect(ogDesc.length).toBeLessThanOrEqual(160);
    expect(twDesc.length).toBeLessThanOrEqual(160);
    expect(ogDesc.endsWith("…")).toBe(true);
  });
});
