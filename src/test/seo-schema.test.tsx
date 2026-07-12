import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, waitFor, cleanup } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import SEO from "@/components/SEO";

vi.mock("@/hooks/use-seo-override", () => ({
  useSeoOverride: () => null,
}));

function getJsonLdScripts(): HTMLScriptElement[] {
  return Array.from(document.head.querySelectorAll('script[type="application/ld+json"]'));
}

function parseJsonLd(): unknown[] {
  const blocks: unknown[] = [];
  for (const el of getJsonLdScripts()) {
    const text = el.textContent || "";
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      blocks.push(...parsed);
    } else {
      blocks.push(parsed);
    }
  }
  return blocks;
}

describe("JSON-LD schema blocks via SEO component", () => {
  beforeEach(() => {
    cleanup();
    document.head
      .querySelectorAll('script[type="application/ld+json"], meta, title, link[rel="canonical"]')
      .forEach((el) => el.remove());
  });

  it("injects a single schema object as one script tag", async () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Memories Properties",
      url: "https://memoriesproperties.com",
    };

    render(
      <HelmetProvider>
        <MemoryRouter>
          <SEO title="About" description="About us." jsonLd={schema} />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(getJsonLdScripts().length).toBe(1);
    });

    const parsed = parseJsonLd();
    expect(parsed[0]).toMatchObject(schema);
  });

  it("injects an array of schemas as one script tag containing a JSON array", async () => {
    const schemas = [
      { "@context": "https://schema.org", "@type": "Product", name: "Villa" },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [] },
    ];

    render(
      <HelmetProvider>
        <MemoryRouter>
          <SEO title="Property" description="A villa." jsonLd={schemas} />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(getJsonLdScripts().length).toBe(1);
    });

    const parsed = parseJsonLd();
    expect(parsed.length).toBe(2);
    expect(parsed[0]).toMatchObject(schemas[0]);
    expect(parsed[1]).toMatchObject(schemas[1]);
  });

  it("omits JSON-LD script when no jsonLd prop is passed", async () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <SEO title="Home" description="Welcome." />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(document.title).toBe("Home | Memories");
    });

    expect(getJsonLdScripts().length).toBe(0);
  });

  it("produces valid JSON for a complex RealEstateAgent + WebSite graph", async () => {
    const graph = [
      {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "@id": "https://memoriesproperties.com/#realestateagent",
        name: "Memories Properties",
        url: "https://memoriesproperties.com",
        areaServed: "Worldwide",
        priceRange: "€€€€",
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://memoriesproperties.com/#website",
        url: "https://memoriesproperties.com",
        name: "Memories Properties",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://memoriesproperties.com/properties?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ];

    render(
      <HelmetProvider>
        <MemoryRouter>
          <SEO title="Memories" description="Private real estate." jsonLd={graph} />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(getJsonLdScripts().length).toBe(1);
    });

    const parsed = parseJsonLd();
    expect(parsed.length).toBe(2);
    expect(parsed[0]).toMatchObject(graph[0]);
    expect(parsed[1]).toMatchObject(graph[1]);

    // Validate each block has required schema fields
    for (const block of parsed) {
      const obj = block as Record<string, unknown>;
      expect(obj["@context"]).toBe("https://schema.org");
      expect(obj["@type"]).toBeTruthy();
    }
  });

  it("preserves Offer price and currency in Product schema", async () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Coastal Villa",
      offers: {
        "@type": "Offer",
        price: 560000,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      },
    };

    render(
      <HelmetProvider>
        <MemoryRouter>
          <SEO title="Villa" description="Coastal villa." jsonLd={schema} />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(getJsonLdScripts().length).toBe(1);
    });

    const parsed = parseJsonLd()[0] as Record<string, unknown>;
    expect(parsed["@type"]).toBe("Product");
    const offers = parsed.offers as Record<string, unknown>;
    expect(offers.price).toBe(560000);
    expect(offers.priceCurrency).toBe("EUR");
  });

  it("includes @id references that do not collide with static index.html #organization", async () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      "@id": "https://memoriesproperties.com/#realestateagent",
      name: "Memories",
    };

    render(
      <HelmetProvider>
        <MemoryRouter>
          <SEO title="Home" description="Welcome." jsonLd={schema} />
        </MemoryRouter>
      </HelmetProvider>
    );

    await waitFor(() => {
      expect(getJsonLdScripts().length).toBe(1);
    });

    const parsed = parseJsonLd()[0] as Record<string, unknown>;
    // Must not reuse the static Organization @id reserved by index.html
    expect(parsed["@id"]).not.toBe("https://memoriesproperties.com/#organization");
    expect(parsed["@id"]).toBe("https://memoriesproperties.com/#realestateagent");
  });
});
