// Helpers for SEO-friendly blog category (tag) pages.
// Categories are derived from blog post `tags`, each getting its own
// indexable URL at /blog/category/:slug.

export function categorySlug(tag: string): string {
  return tag
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Human-readable label fallback when only a slug is known. */
export function slugToLabel(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface BlogCategory {
  tag: string;
  slug: string;
  count: number;
}

/** Build the unique, sorted category list from a set of post tag arrays. */
export function buildCategories(postTags: (string[] | null | undefined)[]): BlogCategory[] {
  const map = new Map<string, BlogCategory>();
  for (const tags of postTags) {
    for (const raw of tags ?? []) {
      const tag = raw.trim();
      if (!tag) continue;
      const slug = categorySlug(tag);
      if (!slug) continue;
      const existing = map.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(slug, { tag, slug, count: 1 });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.tag.localeCompare(b.tag));
}
