import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X } from 'lucide-react';
import { C, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { fetchCategories, fetchMerchTags, type ApiCategory, type ApiMerchTag } from '../../lib/api';
import { hasSwatch, swatchBackground } from '../../lib/colorSwatch';
import { Seo, SITE_TITLE } from '../../lib/seo';
import { getSingleCategoryIntro } from '../../lib/categoryIntro';
import { BreadcrumbJsonLd } from '../components/BreadcrumbJsonLd';

// Categories became admin-managed CMS data on 2026-07-25 (previously a
// hardcoded enum), so the pills/sidebar are built from the API. This
// fallback covers only the brief moment before the fetch resolves (and an
// unreachable CMS, where the catalogue is empty anyway).
const FALLBACK_CATS: ApiCategory[] = [
  {
    id: 'vestidos', namePT: 'Vestidos', nameEN: 'Dresses', slug: 'vestidos',
    introPT: 'Descubra vestidos desportivos femininos que combinam conforto, movimento e estilo, ideais para treinar ou acompanhar o seu dia em Angola e Portugal.',
    introEN: 'Discover women’s sports dresses that combine comfort, movement and style, ideal for training or everyday wear in Angola and Portugal.',
  },
  {
    id: 'tops', namePT: 'Tops', nameEN: 'Tops', slug: 'tops',
    introPT: 'Explore tops desportivos femininos com suporte confortável e cortes versáteis, pensados para treinos, caminhadas e looks ativos do dia a dia.',
    introEN: 'Explore women’s sports tops with comfortable support and versatile cuts, designed for workouts, walks and everyday active looks.',
  },
  {
    id: 'leggings', namePT: 'Leggings', nameEN: 'Leggings', slug: 'leggings',
    introPT: 'Encontre leggings femininas confortáveis e flexíveis, com modelos pensados para acompanhar cada movimento no treino e na rotina diária.',
    introEN: 'Find comfortable, flexible women’s leggings designed to move with you through every workout and daily routine.',
  },
  {
    id: 'conjuntos', namePT: 'Conjuntos', nameEN: 'Sets', slug: 'conjuntos',
    introPT: 'Descubra conjuntos fitness femininos coordenados que unem conforto e estilo, para um look completo no treino e fora dele.',
    introEN: 'Discover coordinated women’s fitness sets that bring comfort and style together for a complete look in and out of the gym.',
  },
  {
    id: 'acessorios', namePT: 'Acessórios', nameEN: 'Accessories', slug: 'acessorios',
    introPT: 'Complete o seu look ativo com acessórios práticos e elegantes, escolhidos para acompanhar o treino e facilitar a sua rotina.',
    introEN: 'Complete your active look with practical, elegant accessories selected to support your workouts and simplify your routine.',
  },
];

export function Browse() {
  const { market, lang } = useApp();
  const { products, loading } = useProducts(market, lang);
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState<ApiCategory[]>(FALLBACK_CATS);
  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((docs) => {
        if (!cancelled && docs.length > 0) setCategories(docs);
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Merch tags as "collections" (2026-07-25 follow-up to the home hero
  // button -- see AskUserQuestion decision): only fetched to resolve a
  // ?tag=<slug> URL param into a display label for the "Filtered by" banner
  // below. The actual product filtering uses Product.tags directly
  // (productAdapters.ts), so this fetch failing just loses the label, not
  // the filter itself.
  const [tags, setTags] = useState<ApiMerchTag[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchMerchTags()
      .then((docs) => {
        if (!cancelled) setTags(docs);
      })
      .catch(() => {
        /* label falls back to the raw slug */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cats = useMemo(
    () => [
      { key: 'all', label: t('all', lang) },
      // Pseudo-category (2026-07-25 navbar fix): the "Novidades"/"New
      // arrivals" nav link points at ?cat=new, but 'new' was never a real
      // category slug once categories became real CMS data -- it always
      // matched zero products. Filtered on the product's merch tag instead
      // (see productAdapters.ts's isNewArrival), but kept in this same list
      // so it still renders and highlights like any other pill/filter.
      { key: 'new', label: t('newArrivalsNav', lang) },
      ...categories
        .filter((c) => c.slug)
        .map((c) => ({ key: c.slug as string, label: (lang === 'en' ? c.nameEN : c.namePT)?.trim() || c.namePT })),
    ],
    [categories, lang],
  );

  // Re-syncs the active category whenever the URL's ?cat= param changes
  // (2026-07-25 navbar fix). This used to be a plain useState initialized
  // once from the URL and never revisited -- but clicking a top-nav
  // category link while ALREADY on /catalogo (e.g. Vestidos -> Conjuntos)
  // is a client-side route change within the same component instance, not
  // a remount, so activeCat silently stayed frozen at whatever it was the
  // first time and every subsequent nav-link click did nothing visible
  // (confirmed via screen recording: no pill ever highlighted after the
  // first click, filters stuck showing 0 results). Adjusting state during
  // render (comparing against the last-seen URL value) rather than in a
  // useEffect, per https://react.dev/learn/you-might-not-need-an-effect --
  // avoids an extra render pass and the associated lint rule.
  //
  // Multi-select since 2026-07-30, encoded as a comma-separated list
  // (?cat=vestidos,tops). A single value still parses, so every existing
  // nav link, home category tile and bookmarked URL keeps working
  // unchanged. An empty list means "all" -- 'all' is never stored, it's
  // just the absence of a selection.
  //
  // The mirrored local state + render-time resync described above is gone:
  // now that selecting a category writes through to ?cat=, the URL can just
  // BE the state. Keeping both would reintroduce the same class of bug from
  // the other side -- setSearchParams triggers a router navigation, and if
  // that landed in a later render than the local setState, the resync would
  // briefly revert the selection the shopper just made.
  const activeCats = useMemo(
    () =>
      (searchParams.get('cat') || '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s !== 'all'),
    [searchParams],
  );

  // ?tag=<slug> "collection" filter (2026-07-25 follow-up): the home hero
  // button can now point at a merchandising tag instead of just a category
  // (e.g. /catalogo?tag=ss26). Same render-time URL-sync pattern as
  // activeCat/syncedUrlCat above, for the same reason -- a same-route nav
  // (clicking the hero button while already on /catalogo) doesn't remount
  // this component. null means "no tag filter", distinct from activeCat's
  // 'all' since the two filters are independent and both can apply at once.
  const urlTag = searchParams.get('tag');
  const [activeTag, setActiveTag] = useState(urlTag);
  const [syncedUrlTag, setSyncedUrlTag] = useState(urlTag);
  if (urlTag !== syncedUrlTag) {
    setSyncedUrlTag(urlTag);
    setActiveTag(urlTag);
  }
  const activeTagLabel = activeTag
    ? (() => {
        const doc = tags.find((tg) => tg.slug === activeTag);
        return doc ? (lang === 'en' ? doc.labelEN : doc.labelPT)?.trim() || doc.labelPT : activeTag;
      })()
    : null;

  const [showFilters, setShowFilters] = useState(false);
  // ?q=<term> (2026-08-08): the header's search overlay (SearchOverlay.tsx)
  // hands off to this page via /catalogo?q=..., so its "see all N results"
  // link actually lands pre-filtered instead of on an empty search box. Same
  // render-time URL-sync pattern as activeTag/syncedUrlTag above (one-way,
  // URL -> state, on mount or on a same-route nav). Deliberately NOT synced
  // the other way (typing here doesn't write back to ?q= on every
  // keystroke) -- this box already filters live from local state, and
  // pushing a URL/history entry per character would spam the back button
  // for no benefit; the deep-link case that actually needs the URL (arriving
  // from the overlay, or a shared link) only needs the read-in direction.
  const urlQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(urlQuery);
  if (urlQuery !== syncedUrlQuery) {
    setSyncedUrlQuery(urlQuery);
    setSearchTerm(urlQuery);
  }
  // Category, size and colour are all multi-select (2026-07-30): a shopper
  // who wears S or M, or who is happy with black or navy, or who wants to
  // browse dresses and sets together, should be able to say so in one pass.
  // Standard faceted behaviour applies -- OR within a dimension, AND across
  // dimensions, so "dresses or sets" AND "S or M" AND "black or navy".
  const [filterSizes, setFilterSizes] = useState<string[]>([]);
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  const toggleInList = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string | null) => {
    if (value === null) {
      setter([]);
      return;
    }
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };
  const toggleSize = toggleInList(setFilterSizes);
  const toggleColor = toggleInList(setFilterColors);

  // Category writes straight to ?cat=, keeping the filtered view shareable
  // and bookmarkable. `replace` so that toggling chips doesn't stack up
  // history entries the shopper has to click Back through one at a time.
  const setCats = (next: string[]) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next.length) p.set('cat', next.join(','));
        else p.delete('cat');
        return p;
      },
      { replace: true },
    );
  };
  const toggleCat = (value: string | null) => {
    // 'all' is a reset affordance rather than a value that can be combined.
    if (value === null || value === 'all') {
      setCats([]);
      return;
    }
    setCats(activeCats.includes(value) ? activeCats.filter((v) => v !== value) : [...activeCats, value]);
  };

  const filtered = useMemo(() => {
    let list = products;
    // 'new' is a pseudo-category backed by a merch tag rather than a real
    // category slug, so it needs its own predicate inside the OR.
    if (activeCats.length) {
      list = list.filter((p) => activeCats.some((c) => (c === 'new' ? p.isNewArrival : p.cat === c)));
    }
    // Multi-select tags since 2026-07-31: a product qualifies for the
    // collection if ANY of its tags match, not just a single one.
    if (activeTag) list = list.filter((p) => p.tags.some((tg) => tg.slug === activeTag));
    if (searchTerm) list = list.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterSizes.length) list = list.filter((p) => filterSizes.some((s) => p.sizes.includes(s)));
    if (filterColors.length) list = list.filter((p) => p.colors.some((c) => filterColors.includes(c.id)));
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => (market === 'AO' ? a.priceKz - b.priceKz : a.priceEur - b.priceEur));
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => (market === 'AO' ? b.priceKz - a.priceKz : b.priceEur - a.priceEur));
    return list;
  }, [products, activeCats, activeTag, searchTerm, filterSizes, filterColors, sortBy, market]);

  // Clear-all-filters (2026-07-30, user request). Six independent filter
  // dimensions had accumulated -- category, collection tag, search, size,
  // colour and sort -- and only the tag banner and the search box had their
  // own clear affordance, so a shopper who had narrowed on three or four at
  // once had to undo each by hand to get back to the full catalogue.
  //
  // `activeTag` lives in the URL rather than in component state, so resetting
  // it means removing the query param; everything else is local state.
  const hasActiveFilters =
    activeCats.length > 0 || Boolean(activeTag) || Boolean(searchTerm) ||
    filterSizes.length > 0 || filterColors.length > 0 || sortBy !== 'default';

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterSizes([]);
    setFilterColors([]);
    setSortBy('default');
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('tag');
      p.delete('cat');
      return p;
    });
  };

  const allSizes = ['XS', 'S', 'M', 'L', 'XL'];
  // Dedupe by colour id (2026-07-25 bilingual follow-up: was name, but two
  // colours could now share a display name across languages by
  // coincidence, and id is the real, language-independent identity anyway).
  const allColors = useMemo(() => {
    const byId = new Map<string, { value: string; label: string; hex?: string; hex2?: string; swatchUrl?: string }>();
    for (const c of products.flatMap((p) => p.colors)) {
      if (!byId.has(c.id)) byId.set(c.id, { value: c.id, label: c.name, hex: c.hex, hex2: c.hex2, swatchUrl: c.swatchUrl });
    }
    return Array.from(byId.values());
  }, [products]);

  // One badge per active filter, each individually removable (2026-07-30).
  // Derived from exactly the same state that clearAllFilters resets, so the
  // badges are always an honest picture of what "Limpar filtros" will clear
  // -- including sort, which is reset too and would otherwise vanish with no
  // badge to explain it.
  const clearTagParam = () =>
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('tag');
      return p;
    });

  const activeFilterBadges: { key: string; label: string; onRemove: () => void }[] = [];
  for (const c of activeCats) {
    activeFilterBadges.push({
      key: `cat:${c}`,
      label: `${t('category', lang)}: ${cats.find((x) => x.key === c)?.label ?? c}`,
      onRemove: () => toggleCat(c),
    });
  }
  if (activeTag) {
    activeFilterBadges.push({
      key: 'tag',
      label: `${t('collection', lang)}: ${activeTagLabel ?? activeTag}`,
      onRemove: clearTagParam,
    });
  }
  if (searchTerm) {
    activeFilterBadges.push({
      key: 'search',
      label: `${t('searchFilterLabel', lang)}: "${searchTerm}"`,
      onRemove: () => setSearchTerm(''),
    });
  }
  // One badge per selected value rather than one per dimension, so a shopper
  // who picked S, M and L can drop just the L.
  for (const s of filterSizes) {
    activeFilterBadges.push({
      key: `size:${s}`,
      label: `${t('size', lang)}: ${s}`,
      onRemove: () => toggleSize(s),
    });
  }
  for (const id of filterColors) {
    activeFilterBadges.push({
      key: `color:${id}`,
      label: `${t('colour', lang)}: ${allColors.find((c) => c.value === id)?.label ?? id}`,
      onRemove: () => toggleColor(id),
    });
  }
  if (sortBy !== 'default') {
    activeFilterBadges.push({
      key: 'sort',
      label: `${t('sort', lang)}: ${t(sortBy === 'price-asc' ? 'sortPriceAsc' : 'sortPriceDesc', lang)}`,
      onRemove: () => setSortBy('default'),
    });
  }

  // SEO (2026-08-07, audit item 1): "{Category} | Use Me With Style" per the
  // audit's own example -- only when exactly one category (or the ?tag=
  // collection) is active, same "single selection only" gate item 8's
  // category intro copy uses, since a multi-select or all-categories view
  // has no single label that would read naturally in a <title>. Falls back
  // to a generic catalogue title/description otherwise.
  const activeCategoryLabel = activeCats.length === 1 ? cats.find((c) => c.key === activeCats[0])?.label : undefined;
  const categoryIntro = useMemo(
    () => getSingleCategoryIntro(categories, activeCats, lang),
    [categories, activeCats, lang],
  );
  const seoFilterLabel = activeCategoryLabel ?? activeTagLabel ?? undefined;
  const seoTitle = seoFilterLabel ? `${seoFilterLabel} | ${SITE_TITLE}` : `${t('shopAll', lang)} | ${SITE_TITLE}`;
  const seoDescription = seoFilterLabel
    ? t('seoBrowseDescriptionFiltered', lang, { category: seoFilterLabel.toLowerCase() })
    : t('seoBrowseDescriptionAll', lang);
  const catalogueLabel = lang === 'pt' ? 'Catálogo' : 'Catalogue';
  const breadcrumbLeafPath = activeCategoryLabel && activeCats.length === 1
    ? `/catalogo?cat=${encodeURIComponent(activeCats[0])}`
    : activeTagLabel && activeTag
      ? `/catalogo?tag=${encodeURIComponent(activeTag)}`
      : null;

  return (
    <div className="ump-browse-layout" style={{ background: C.paper }}>
      <Seo title={seoTitle} description={seoDescription} />
      <BreadcrumbJsonLd items={[
        { name: lang === 'pt' ? 'Início' : 'Home', path: '/' },
        { name: catalogueLabel, path: '/catalogo' },
        ...(seoFilterLabel && breadcrumbLeafPath ? [{ name: seoFilterLabel, path: breadcrumbLeafPath }] : []),
      ]} />
      <div className="ump-browse-sidebar">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.goldDeep, fontWeight: 800, textTransform: 'uppercase' }}>
            {t('filters', lang)}
          </div>
          {hasActiveFilters && <ClearFiltersButton onClick={clearAllFilters} lang={lang} />}
        </div>
        <FilterGroup
          label={t('category', lang)}
          options={cats.map((c) => ({ value: c.key, label: c.label }))}
          active={activeCats}
          onSelect={toggleCat}
          allKey="all"
        />
        <FilterGroup label={t('size', lang)} options={allSizes.map((s) => ({ value: s, label: s }))} active={filterSizes} onSelect={toggleSize} />
        <FilterGroup label={t('colour', lang)} options={allColors} active={filterColors} onSelect={toggleColor} collapsible />
        <SortControl sortBy={sortBy} setSortBy={setSortBy} lang={lang} />
      </div>

      <div className="ump-browse-main">
        {!categoryIntro && <h1 className="ump-sr-only">{t('shopAll', lang)}</h1>}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.ruleLight}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.paper, borderRadius: 8, border: `1px solid ${C.fieldBorder}` }}>
            <Search size={16} color={C.inkSoft} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchProducts', lang)}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: C.ink, background: 'transparent' }}
            />
            {searchTerm && (
              <button aria-label={lang === 'pt' ? 'Limpar pesquisa' : 'Clear search'} onClick={() => setSearchTerm('')}>
                <X size={14} color={C.inkSoft} />
              </button>
            )}
          </div>
        </div>

        <div className="ump-browse-catpills" style={{ display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto' }}>
          {cats.map((c) => (
            <button
              key={c.key}
              onClick={() => toggleCat(c.key)}
              aria-pressed={c.key === 'all' ? activeCats.length === 0 : activeCats.includes(c.key)}
              style={{
                flexShrink: 0,
                padding: '7px 16px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 20,
                background: (c.key === 'all' ? activeCats.length === 0 : activeCats.includes(c.key)) ? C.ctaBg : C.paper,
                color: (c.key === 'all' ? activeCats.length === 0 : activeCats.includes(c.key)) ? C.onDarkGold : C.ink,
                border: `1px solid ${(c.key === 'all' ? activeCats.length === 0 : activeCats.includes(c.key)) ? C.ctaBorder : C.fieldBorder}`,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {categoryIntro && (
          <section
            aria-labelledby="category-intro-title"
            style={{ padding: '20px 20px 22px', borderTop: `1px solid ${C.ruleLight}`, borderBottom: `1px solid ${C.ruleLight}` }}
          >
            <h1 id="category-intro-title" style={{ margin: 0, color: C.ink, fontFamily: 'Georgia, serif', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 400 }}>
              {categoryIntro.title}
            </h1>
            <p style={{ margin: '8px 0 0', maxWidth: 760, color: C.inkSoft, fontSize: 14, lineHeight: 1.7 }}>
              {categoryIntro.body}
            </p>
          </section>
        )}

        {/* The standalone "Coleção: X" banner that used to sit here was
            folded into the badge row below on 2026-07-30 -- with every other
            active filter rendered as a removable badge, keeping a separate
            tinted strip for this one meant the collection appeared twice in
            adjacent rows, which reads as a bug rather than emphasis. */}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 20px', borderBottom: `1px solid ${C.ruleLight}`, flexWrap: 'wrap' }}>
          {/* Wraps rather than scrolls: six filters can be active at once and
              a horizontally-scrolled row would hide some of them off-screen,
              which defeats the point of showing what's applied. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, rowGap: 6, flexWrap: 'wrap', minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.inkSoft, flexShrink: 0 }}>
              {loading ? '…' : `${filtered.length} ${t(filtered.length === 1 ? 'productSingular' : 'productPlural', lang)}`}
            </div>
            {activeFilterBadges.map((b) => (
              <FilterBadge key={b.key} label={b.label} onRemove={b.onRemove} lang={lang} />
            ))}
            {/* Also surfaced next to the result count, not just inside the
                filter surfaces: on mobile the panel is collapsed by default,
                so a shopper looking at "0 produtos" would otherwise have to
                open it before discovering how to undo the filter. Only shown
                alongside two or more badges -- with a single filter active
                its badge already clears everything, so both controls would
                do exactly the same thing. */}
            {activeFilterBadges.length > 1 && <ClearFiltersButton onClick={clearAllFilters} lang={lang} />}
          </div>
          <button
            className="ump-browse-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: C.goldDeep, padding: '4px 8px', borderRadius: 6, background: showFilters ? C.tagBg : 'transparent' }}
          >
            <Filter size={12} />
            {t('filters', lang)}
          </button>
        </div>

        {showFilters && (
          <div className="ump-slide-up ump-browse-filter-toggle" style={{ padding: '16px 20px', background: C.subtleBg, borderBottom: `1px solid ${C.ruleLight}` }}>
            <FilterGroup label={t('size', lang)} options={allSizes.map((s) => ({ value: s, label: s }))} active={filterSizes} onSelect={toggleSize} />
            <FilterGroup label={t('colour', lang)} options={allColors} active={filterColors} onSelect={toggleColor} collapsible />
            {/* Bug fix, 2026-08-07: sort previously only existed in the
                desktop sidebar (`.ump-browse-sidebar`, hidden below 720px),
                so mobile shoppers had no way to sort by price at all -- this
                mobile filter panel had size/colour but no sort control. */}
            <SortControl sortBy={sortBy} setSortBy={setSortBy} lang={lang} />
            {hasActiveFilters && (
              <div style={{ paddingTop: 4 }}>
                <ClearFiltersButton onClick={clearAllFilters} lang={lang} />
              </div>
            )}
          </div>
        )}

        <div className="ump-grid-auto" style={{ padding: '16px 20px', minHeight: 200 }}>
          {!loading && filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '40px 20px', textAlign: 'center', color: C.inkSoft, fontSize: 13 }}>
              {hasActiveFilters ? t('noProductsFoundFiltered', lang) : t('noProductsFound', lang)}
              {hasActiveFilters && (
                <div style={{ marginTop: 14 }}>
                  <ClearFiltersButton onClick={clearAllFilters} lang={lang} />
                </div>
              )}
            </div>
          )}
          {filtered.map((p, index) => (
            <ProductCard key={p.id} product={p} priority={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** One active filter, with its own remove control. The whole badge is the
 * button: at 11px the × alone would be a ~12px hit target, well under the
 * 24px minimum, and there's nothing else useful to click a badge for. */
function FilterBadge({ label, onRemove, lang }: { label: string; onRemove: () => void; lang: 'pt' | 'en' }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`${t('removeFilter', lang)}: ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 9px',
        borderRadius: 20,
        border: `1px solid ${C.goldDeep}`,
        background: C.tagBg,
        color: C.goldDeep,
        fontSize: 11,
        fontWeight: 700,
        maxWidth: 220,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
      >
        {label}
      </span>
      <X size={11} style={{ flexShrink: 0 }} aria-hidden />
    </button>
  );
}

/** Reset control for every active filter. Rendered in four places -- the
 * desktop sidebar header, the mobile filter panel, beside the result count,
 * and in the zero-results empty state -- so it's reachable wherever the
 * shopper notices the problem. Callers gate it on `hasActiveFilters`; it
 * deliberately doesn't render itself as disabled, since a permanently
 * greyed-out button is just noise. */
function ClearFiltersButton({ onClick, lang }: { onClick: () => void; lang: 'pt' | 'en' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('clearFiltersAria', lang)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 10px',
        borderRadius: 6,
        border: `1px solid ${C.fieldBorder}`,
        background: C.paper,
        color: C.ink,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <X size={11} />
      {t('clearFilters', lang)}
    </button>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: C.goldDeep, marginBottom: 6, textTransform: 'uppercase' }}>{children}</div>
  );
}

/** Shared between the desktop sidebar and the mobile filter panel (2026-08-07
 * bug fix: sort used to live only in the desktop sidebar markup, so it was
 * simply absent on mobile rather than just hard-to-find). Not built on
 * FilterGroup -- sort is single-select with no "off" state to toggle back to
 * (there's an explicit 'default' option instead), whereas FilterGroup's
 * single-select mode re-selecting the active chip clears it to null, which
 * doesn't fit sortBy's non-nullable type. */
function SortControl({
  sortBy,
  setSortBy,
  lang,
}: {
  sortBy: 'default' | 'price-asc' | 'price-desc';
  setSortBy: (value: 'default' | 'price-asc' | 'price-desc') => void;
  lang: 'pt' | 'en';
}) {
  return (
    <div>
      <FilterLabel>{t('sort', lang)}</FilterLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {([
          { key: 'default' as const, labelKey: 'sortDefault' },
          { key: 'price-asc' as const, labelKey: 'sortPriceAsc' },
          { key: 'price-desc' as const, labelKey: 'sortPriceDesc' },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            aria-current={sortBy === s.key ? 'true' : undefined}
            style={{
              textAlign: 'left',
              padding: '8px 10px',
              fontSize: 12,
              borderRadius: 6,
              border: `1px solid ${sortBy === s.key ? C.goldDeep : C.fieldBorder}`,
              background: sortBy === s.key ? C.tagBg : C.paper,
              color: sortBy === s.key ? C.goldDeep : C.ink,
            }}
          >
            {t(s.labelKey, lang)}
          </button>
        ))}
      </div>
    </div>
  );
}

type FilterOption = {
  value: string;
  label: string;
  /** Colour options (2026-07-25): render a swatch dot from the taxonomy's
   * hex, or a tiny fabric-swatch image for patterns. Text-only otherwise.
   * hex2 (2026-07-25 follow-up) renders a split circle for combination
   * colours -- see lib/colorSwatch.ts. */
  hex?: string;
  hex2?: string;
  swatchUrl?: string;
};

/** A group of filter chips.
 *
 * `active` accepts either a single value (category, which stays
 * single-select) or an array (size and colour, which are multi-select since
 * 2026-07-30). Multi-select groups report `aria-pressed` per chip so screen
 * readers convey that several can be on at once -- with a single-select
 * group that would be misleading, so those get `aria-current` instead. */
function FilterGroup({
  label,
  options,
  active,
  onSelect,
  allKey,
  collapsible = false,
}: {
  label: string;
  options: FilterOption[];
  active: string | null | string[];
  onSelect: (v: string | null) => void;
  /** Option that means "no filter" rather than a value of its own (the
   * category group's "Tudo"/"All"). It reads as selected precisely when
   * nothing else is, and selecting it clears the group. */
  allKey?: string;
  collapsible?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const canCollapse = collapsible && options.length > 5;
  const multi = Array.isArray(active);
  const isActive = (value: string) => {
    if (allKey && value === allKey) return multi ? (active as string[]).length === 0 : active === null;
    return multi ? (active as string[]).includes(value) : active === value;
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <FilterLabel>{label}</FilterLabel>
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          maxHeight: canCollapse && !expanded ? 174 : undefined,
          overflow: canCollapse && !expanded ? 'hidden' : undefined,
        }}
        role="group"
        aria-label={label}
      >
        {options.map((opt) => {
          const on = isActive(opt.value);
          return (
            <button
              key={opt.value}
              // Single-select toggles off by re-selecting; multi-select
              // toggling is handled by the caller's setter, which is why the
              // value is passed straight through here.
              onClick={() => onSelect(multi ? opt.value : on ? null : opt.value)}
              aria-pressed={multi ? on : undefined}
              aria-current={!multi && on ? 'true' : undefined}
              style={{
                minWidth: 36,
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 6,
                border: `1px solid ${on ? C.goldDeep : C.fieldBorder}`,
                background: on ? C.tagBg : C.paper,
                color: on ? C.goldDeep : C.ink,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                minHeight: 30,
                lineHeight: '16px',
              }}
            >
              {hasSwatch(opt) && (
                <span
                  aria-hidden
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    flexShrink: 0,
                    border: `1px solid ${C.fieldBorder}`,
                    background: swatchBackground(opt),
                  }}
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
      {canCollapse && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          style={{ marginTop: 8, padding: 0, border: 0, background: 'transparent', color: C.goldDeep, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
        >
          {expanded ? (label === 'Cor' ? 'Mostrar menos' : 'Show less') : (label === 'Cor' ? 'Mostrar mais' : 'Show more')}
        </button>
      )}
    </div>
  );
}
