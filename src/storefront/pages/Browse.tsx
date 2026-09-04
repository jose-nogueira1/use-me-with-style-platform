import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X } from 'lucide-react';
import { C, t } from '../../theme';
import { useApp } from '../../state/AppContext';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from '../components/ProductCard';
import { fetchCategories, fetchHomeCollections, fetchMerchTags, refId, type ApiCategory, type ApiMerchTag, type HomeCollections } from '../../lib/api';
import { hasSwatch, swatchBackground } from '../../lib/colorSwatch';
import { Seo, SITE_TITLE } from '../../lib/seo';
import { getSingleCategoryIntro } from '../../lib/categoryIntro';
import { BreadcrumbJsonLd } from '../components/BreadcrumbJsonLd';
import { filterCatalogueProducts } from '../../lib/catalogueFilters';

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

  const [homeCollections, setHomeCollections] = useState<HomeCollections | null>(null);
  const [homeCollectionsLoading, setHomeCollectionsLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetchHomeCollections()
      .then((content) => {
        if (!cancelled) setHomeCollections(content);
      })
      .catch(() => {
        /* featured filter falls back to an empty result if unavailable */
      })
      .finally(() => {
        if (!cancelled) setHomeCollectionsLoading(false);
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

  const activeFeatured = searchParams.get('featured') === '1';
  const featuredProductsForMarket = useMemo(() => {
    const selection = market === 'AO' ? homeCollections?.featuredProductsAO : homeCollections?.featuredProductsPT;
    return new Set((selection ?? []).map((ref) => refId(ref)));
  }, [homeCollections, market]);

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
  const [sheetOffset, setSheetOffset] = useState(0);
  const sheetDrag = useRef({ startY: 0, offset: 0, active: false });
  const startSheetDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    sheetDrag.current = { startY: event.clientY, offset: 0, active: true };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const startSheetTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    sheetDrag.current = { startY: event.touches[0]?.clientY ?? 0, offset: 0, active: true };
  };
  const moveSheetDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!sheetDrag.current.active) return;
    const offset = Math.max(0, event.clientY - sheetDrag.current.startY);
    sheetDrag.current.offset = offset;
    setSheetOffset(offset);
  };
  const moveSheetTouch = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!sheetDrag.current.active) return;
    const offset = Math.max(0, (event.touches[0]?.clientY ?? sheetDrag.current.startY) - sheetDrag.current.startY);
    sheetDrag.current.offset = offset;
    setSheetOffset(offset);
    event.preventDefault();
  };
  const endSheetDrag = () => {
    if (!sheetDrag.current.active) return;
    const shouldClose = sheetDrag.current.offset > 100;
    sheetDrag.current.active = false;
    setSheetOffset(0);
    if (shouldClose) setShowFilters(false);
  };
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
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onSale, setOnSale] = useState(false);
  const [filterProductTypes, setFilterProductTypes] = useState<string[]>([]);
  const [filterCollections, setFilterCollections] = useState<string[]>([]);
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
  const toggleProductType = toggleInList(setFilterProductTypes);

  const toggleCollection = (value: string | null) => {
    if (value === null) {
      setFilterCollections([]);
      clearTagParam();
      return;
    }
    if (value === activeTag) {
      clearTagParam();
      return;
    }
    setFilterCollections((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

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
    if (activeFeatured) {
      if (homeCollectionsLoading) return [];
      list = list.filter((p) => featuredProductsForMarket.has(String(p.id)));
    }
    if (searchTerm) list = list.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    list = filterCatalogueProducts(list, {
      availableOnly,
      minPrice: minPrice === '' ? null : Number(minPrice),
      maxPrice: maxPrice === '' ? null : Number(maxPrice),
      onSale,
      sizes: filterSizes,
      colors: filterColors,
      collectionTags: [...new Set([...(activeTag ? [activeTag] : []), ...filterCollections])],
      productTypes: filterProductTypes,
    }, market);
    if (sortBy === 'price-asc') list = [...list].sort((a, b) => (market === 'AO' ? a.priceKz - b.priceKz : a.priceEur - b.priceEur));
    if (sortBy === 'price-desc') list = [...list].sort((a, b) => (market === 'AO' ? b.priceKz - a.priceKz : b.priceEur - a.priceEur));
    return list;
  }, [products, activeCats, activeFeatured, homeCollectionsLoading, featuredProductsForMarket, activeTag, searchTerm, filterSizes, filterColors, availableOnly, minPrice, maxPrice, onSale, filterProductTypes, filterCollections, sortBy, market]);
  const catalogueLoading = loading || (activeFeatured && homeCollectionsLoading);

  // Clear-all-filters (2026-07-30, user request). Six independent filter
  // dimensions had accumulated -- category, collection tag, search, size,
  // colour and sort -- and only the tag banner and the search box had their
  // own clear affordance, so a shopper who had narrowed on three or four at
  // once had to undo each by hand to get back to the full catalogue.
  //
  // `activeTag` lives in the URL rather than in component state, so resetting
  // it means removing the query param; everything else is local state.
  const hasActiveFilters =
    activeCats.length > 0 || activeFeatured || Boolean(activeTag) || Boolean(searchTerm) || availableOnly || minPrice !== '' || maxPrice !== '' || onSale ||
    filterSizes.length > 0 || filterColors.length > 0 || filterProductTypes.length > 0 || filterCollections.length > 0 || sortBy !== 'default';

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterSizes([]);
    setFilterColors([]);
    setAvailableOnly(false);
    setMinPrice('');
    setMaxPrice('');
    setOnSale(false);
    setFilterProductTypes([]);
    setFilterCollections([]);
    setSortBy('default');
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('tag');
      p.delete('cat');
      p.delete('featured');
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
  const allCollections = useMemo(() => [
    { value: 'new', label: t('newArrivalsNav', lang) },
    ...tags.map((tag) => ({ value: tag.slug, label: (lang === 'en' ? tag.labelEN : tag.labelPT)?.trim() || tag.labelPT })),
  ].filter((option, index, options) => options.findIndex((item) => item.value === option.value) === index), [tags, lang]);
  const allProductTypes = [
    { value: 'standard', label: t('productTypeStandard', lang) },
    { value: 'bundle', label: t('productTypeBundle', lang) },
  ];
  const activeCollections = [...new Set([...(activeTag ? [activeTag] : []), ...filterCollections])];

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
  if (activeFeatured) {
    activeFilterBadges.push({
      key: 'featured',
      label: t('featured', lang),
      onRemove: () => setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.delete('featured');
        return p;
      }),
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
  if (availableOnly) activeFilterBadges.push({ key: 'available', label: t('availableOnly', lang), onRemove: () => setAvailableOnly(false) });
  if (onSale) activeFilterBadges.push({ key: 'sale', label: t('onSale', lang), onRemove: () => setOnSale(false) });
  if (minPrice !== '' || maxPrice !== '') activeFilterBadges.push({ key: 'price', label: `${t('priceRange', lang)}: ${minPrice || '0'}–${maxPrice || '∞'}`, onRemove: () => { setMinPrice(''); setMaxPrice(''); } });
  for (const type of filterProductTypes) activeFilterBadges.push({ key: `type:${type}`, label: `${t('productType', lang)}: ${allProductTypes.find((item) => item.value === type)?.label ?? type}`, onRemove: () => toggleProductType(type) });
  for (const collection of filterCollections) activeFilterBadges.push({ key: `collection:${collection}`, label: `${t('collection', lang)}: ${allCollections.find((item) => item.value === collection)?.label ?? collection}`, onRemove: () => toggleCollection(collection) });
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

  useEffect(() => {
    if (!showFilters) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowFilters(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showFilters]);

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
        <div className="ump-browse-filter-grid">
          <FilterGroup
            className="ump-filter-half"
            label={t('category', lang)}
            options={cats.filter((c) => c.key !== 'all').map((c) => ({ value: c.key, label: c.label }))}
            active={activeCats}
            onSelect={toggleCat}
            allKey="all"
            lang={lang}
            collapsibleDesktop
          />
          <FilterGroup className="ump-filter-half" label={t('size', lang)} options={allSizes.map((s) => ({ value: s, label: s }))} active={filterSizes} onSelect={toggleSize} lang={lang} />
          <FilterGroup className="ump-filter-full" label={t('colour', lang)} options={allColors} active={filterColors} onSelect={toggleColor} collapsibleDesktop lang={lang} />
          <AvailabilityToggle className="ump-filter-half" checked={availableOnly} onChange={setAvailableOnly} lang={lang} />
          <FilterToggle className="ump-filter-half" label={t('onSale', lang)} checked={onSale} onChange={setOnSale} />
          <PriceRangeFilter className="ump-filter-full" min={minPrice} max={maxPrice} setMin={setMinPrice} setMax={setMaxPrice} market={market} lang={lang} />
          <FilterGroup className="ump-filter-half" label={t('productType', lang)} options={allProductTypes} active={filterProductTypes} onSelect={toggleProductType} lang={lang} />
          <FilterGroup className="ump-filter-half" label={t('collection', lang)} options={allCollections} active={activeCollections} onSelect={toggleCollection} collapsibleDesktop lang={lang} />
          <SortControl className="ump-filter-full" sortBy={sortBy} setSortBy={setSortBy} lang={lang} />
        </div>
      </div>

      <div className="ump-browse-main">
        {!categoryIntro && <h1 className="ump-sr-only">{t('shopAll', lang)}</h1>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderBottom: `1px solid ${C.ruleLight}` }}>
          <button
            type="button"
            className="ump-browse-filter-trigger"
            onClick={() => setShowFilters(true)}
            aria-expanded={showFilters}
            aria-controls="catalogue-filter-drawer"
          >
            <Filter size={14} />
            {t('filters', lang)}
            {activeFilterBadges.length > 0 && <span aria-label={`${activeFilterBadges.length} active`}>{activeFilterBadges.length}</span>}
          </button>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 10, minWidth: 0, padding: '10px 14px', background: C.paper, borderRadius: 8, border: `1px solid ${C.fieldBorder}` }}>
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
          <div className="ump-browse-active-filters">
              <div style={{ fontSize: 11, color: C.inkSoft, flexShrink: 0 }}>
                {catalogueLoading ? '…' : `${filtered.length} ${t(filtered.length === 1 ? 'productSingular' : 'productPlural', lang)}`}
              </div>
            {activeFilterBadges.length > 1 && <ClearFiltersButton onClick={clearAllFilters} lang={lang} />}
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
          </div>
        </div>

        {showFilters && (
          <div className="ump-filter-drawer-backdrop" role="presentation" onClick={() => setShowFilters(false)}>
            <aside
              id="catalogue-filter-drawer"
              className="ump-filter-drawer ump-slide-up"
              role="dialog"
              aria-modal="true"
              aria-label={t('filters', lang)}
              style={{ transform: sheetOffset ? `translateY(${sheetOffset}px)` : undefined, transition: sheetOffset ? 'none' : 'transform 180ms ease' }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="ump-filter-drawer-handle"
                aria-hidden="true"
                onPointerDown={startSheetDrag}
                onPointerMove={moveSheetDrag}
                onPointerUp={endSheetDrag}
                onPointerCancel={endSheetDrag}
                onTouchStart={startSheetTouch}
                onTouchMove={moveSheetTouch}
                onTouchEnd={endSheetDrag}
                onTouchCancel={endSheetDrag}
              />
              <div className="ump-filter-drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.goldDeep, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  <Filter size={16} />
                  {t('filters', lang)}
                </div>
                <button type="button" aria-label={lang === 'pt' ? 'Fechar filtros' : 'Close filters'} onClick={() => setShowFilters(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="ump-filter-drawer-content">
                <div className="ump-browse-filter-grid">
                  <FilterGroup className="ump-filter-full" label={t('category', lang)} options={cats.filter((c) => c.key !== 'all').map((c) => ({ value: c.key, label: c.label }))} active={activeCats} onSelect={toggleCat} lang={lang} collapsibleDesktop />
                  <FilterGroup className="ump-filter-half" label={t('size', lang)} options={allSizes.map((s) => ({ value: s, label: s }))} active={filterSizes} onSelect={toggleSize} lang={lang} />
                  <FilterGroup className="ump-filter-full" label={t('colour', lang)} options={allColors} active={filterColors} onSelect={toggleColor} collapsibleDesktop lang={lang} />
                  <AvailabilityToggle className="ump-filter-half" checked={availableOnly} onChange={setAvailableOnly} lang={lang} />
                  <FilterToggle className="ump-filter-half" label={t('onSale', lang)} checked={onSale} onChange={setOnSale} />
                  <PriceRangeFilter className="ump-filter-full" min={minPrice} max={maxPrice} setMin={setMinPrice} setMax={setMaxPrice} market={market} lang={lang} />
                  <FilterGroup className="ump-filter-half" label={t('productType', lang)} options={allProductTypes} active={filterProductTypes} onSelect={toggleProductType} lang={lang} />
                  <FilterGroup className="ump-filter-half" label={t('collection', lang)} options={allCollections} active={activeCollections} onSelect={toggleCollection} collapsibleDesktop lang={lang} />
                  <SortControl className="ump-filter-full" sortBy={sortBy} setSortBy={setSortBy} lang={lang} />
                </div>
              </div>
              <div className="ump-filter-drawer-footer">
                {hasActiveFilters && <ClearFiltersButton onClick={clearAllFilters} lang={lang} />}
                <button type="button" onClick={() => setShowFilters(false)}>{lang === 'pt' ? 'Aplicar filtros' : 'Apply Filters'}</button>
              </div>
            </aside>
          </div>
        )}

        <div className="ump-grid-auto" style={{ padding: '16px 20px', minHeight: 200 }}>
          {!catalogueLoading && filtered.length === 0 && (
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

function FilterToggle({ label, checked, onChange, className }: { label: string; checked: boolean; onChange: (value: boolean) => void; className?: string }) {
  return (
    <label className={className} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, fontWeight: 700, color: C.ink, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} style={{ accentColor: C.goldDeep, width: 16, height: 16 }} />
      {label}
    </label>
  );
}

function AvailabilityToggle({ checked, onChange, lang, className }: { checked: boolean; onChange: (value: boolean) => void; lang: 'pt' | 'en'; className?: string }) {
  return <FilterToggle className={className} label={t('availableOnly', lang)} checked={checked} onChange={onChange} />;
}

function PriceRangeFilter({
  min,
  max,
  setMin,
  setMax,
  market,
  lang,
  className,
}: {
  min: string;
  max: string;
  setMin: (value: string) => void;
  setMax: (value: string) => void;
  market: 'AO' | 'PT';
  lang: 'pt' | 'en';
  className?: string;
}) {
  const currency = market === 'AO' ? 'Kz' : '€';
  return (
    <div className={className} style={{ marginBottom: 16 }}>
      <FilterLabel>{t('priceRange', lang)} ({currency})</FilterLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <input aria-label={t('minPrice', lang)} type="number" min="0" value={min} onChange={(event) => setMin(event.target.value)} placeholder={t('minPrice', lang)} style={priceInputStyle} />
        <input aria-label={t('maxPrice', lang)} type="number" min="0" value={max} onChange={(event) => setMax(event.target.value)} placeholder={t('maxPrice', lang)} style={priceInputStyle} />
      </div>
    </div>
  );
}

const priceInputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '8px 9px',
  border: `1px solid ${C.fieldBorder}`,
  borderRadius: 6,
  background: C.paper,
  color: C.ink,
  fontSize: 11,
};

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
  className,
}: {
  sortBy: 'default' | 'price-asc' | 'price-desc';
  setSortBy: (value: 'default' | 'price-asc' | 'price-desc') => void;
  lang: 'pt' | 'en';
  className?: string;
}) {
  return (
    <div className={className}>
      <FilterLabel>{t('sort', lang)}</FilterLabel>
      <div className="ump-sort-options" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
  collapsibleDesktop = false,
  className,
  lang,
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
  collapsibleDesktop?: boolean;
  className?: string;
  lang?: 'pt' | 'en';
}) {
  const [expanded, setExpanded] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);
  const canCollapse = collapsibleDesktop ? options.length > 3 : collapsible && options.length > 5;
  const shouldCollapse = canCollapse && hasMore && !expanded;

  useEffect(() => {
    if (!canCollapse || !optionsRef.current) {
      setHasMore(false);
      return undefined;
    }
    const element = optionsRef.current;
    const measure = () => setHasMore(element.scrollHeight > 102);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [canCollapse, options.length]);
  const multi = Array.isArray(active);
  const isActive = (value: string) => {
    if (allKey && value === allKey) return multi ? (active as string[]).length === 0 : active === null;
    return multi ? (active as string[]).includes(value) : active === value;
  };

  return (
    <div className={className} style={{ marginBottom: 16 }}>
      <FilterLabel>{label}</FilterLabel>
      <div
        ref={optionsRef}
        className={`ump-filter-options${shouldCollapse ? ' ump-filter-options-collapsed' : ''}`}
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          // Legacy five-row clipping remains available for the older
          // collapsible mode; desktop accordions are clipped by the
          // responsive stylesheet so mobile keeps its full chip track.
          maxHeight: shouldCollapse && !collapsibleDesktop ? 174 : undefined,
          overflow: shouldCollapse ? 'hidden' : undefined,
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
      {canCollapse && hasMore && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className={collapsibleDesktop ? 'ump-filter-expand' : undefined}
          style={{ marginTop: 8, padding: 0, border: 0, background: 'transparent', color: C.goldDeep, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}
        >
          {expanded ? (lang === 'en' ? 'Show less' : 'Mostrar menos') : (lang === 'en' ? 'Show more' : 'Mostrar mais')}
        </button>
      )}
    </div>
  );
}
