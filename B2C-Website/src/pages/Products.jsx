import { useSearchParams } from 'react-router'
import { useLocale } from '../../../shared/ui/Locale.jsx'
import { Metadata } from '../../../shared/ui/Metadata.jsx'
import { Button, Feedback } from '../../../shared/ui/Primitives.jsx'
import { SelectField } from '../../../shared/ui/SelectField.jsx'
import { Icon } from '../../../shared/ui/Brand.jsx'
import { config } from '../app/config.js'
import { useShop } from '../features/shop/ShopProvider.jsx'
import { useShopRead } from '../features/shop/useShopRead.js'
import { catalogQuery, categoryRows } from '../features/shop/catalog.js'
import { ShopHeading, ShopError, ProductGrid } from '../features/shop/components.jsx'

const priceRanges = [
  { key: '0-100', min: '0', max: '10000', label: '0 - 100' },
  { key: '100-500', min: '10000', max: '50000', label: '100 - 500' },
  { key: '500-1000', min: '50000', max: '100000', label: '500 - 1,000' },
  { key: '1000-plus', min: '100000', max: '', label: '1,000+' },
]

export default function Products() {
  const language = useLocale(),
    ar = language === 'ar',
    { api, content, publicData } = useShop()
  const [search, setSearch] = useSearchParams()
  const serialized = search.toString()
  const state = useShopRead(
    async (signal) => {
      const categories = content?.categories || (await api.categories({ language, signal }))
      const query = catalogQuery(serialized, categories)
      const [list, facets] = await Promise.all([
        api.products(query, { language, signal }),
        api.facets(query, { language, signal }),
      ])
      return { list, facets, categories }
    },
    `${language}:${serialized}`,
    !serialized && publicData?.language === language && publicData?.list
      ? { list: publicData.list, facets: publicData.facets, categories: publicData.categories }
      : null,
  )
  const title =
    search.get('saleOnly') === 'true' || search.get('sale') === 'true'
      ? ar
        ? 'التخفيضات'
        : 'Sale'
      : ar
        ? 'ملابس لكل يوم'
        : 'Everyday clothing'
  const change = (key, value) => {
    const next = new URLSearchParams(search)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key === 'categoryId') next.delete('collection')
    next.delete('page')
    setSearch(next)
  }
  const data = state.data,
    facets = data?.facets
  const activeFilters =
    ['size', 'color'].filter((key) => search.has(key)).length +
    Number(search.has('minPrice') || search.has('maxPrice')) +
    Number(Boolean(search.get('categoryId') || search.get('collection'))) +
    Number(search.get('saleOnly') === 'true' || search.get('sale') === 'true') +
    Number(Boolean(search.get('sort') && search.get('sort') !== 'newest'))
  const priceRange = priceRanges.find(
    (range) =>
      range.min === (search.get('minPrice') || '') && range.max === (search.get('maxPrice') || ''),
  )
  const customRange = (search.has('minPrice') || search.has('maxPrice')) && !priceRange
  return (
    <div className="shop-page">
      <Metadata
        config={config}
        title={`${title} | Narmer`}
        description={
          ar
            ? 'اكتشف مجموعة نارمر للرجال والنساء.'
            : 'Explore Narmer’s collection for men and women.'
        }
        path="/products"
        publicPage={!state.error}
      />
      <ShopHeading title={title}>
        {ar
          ? 'اكتشف مجموعة نارمر للرجال والنساء.'
          : 'Explore Narmer’s collection for men and women.'}
      </ShopHeading>
      <div className="collection-tabs">
        <Button
          variant={!(search.get('categoryId') || search.get('collection')) ? 'accent' : 'secondary'}
          onClick={() => {
            const next = new URLSearchParams(search)
            next.delete('categoryId')
            next.delete('collection')
            next.delete('page')
            setSearch(next)
          }}
        >
          {ar ? 'الكل' : 'All'}
        </Button>
        {(content?.categories || data?.categories || []).map((category) => (
          <Button
            key={category.id}
            variant={
              search.get('categoryId') === category.id || search.get('collection') === category.slug
                ? 'accent'
                : 'secondary'
            }
            onClick={() => change('categoryId', category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
      <details className="catalog-filter-panel">
        <summary>
          <span>{ar ? 'الفلاتر والترتيب' : 'Filters and sort'}</span>
          {activeFilters > 0 && (
            <span
              className="catalog-filter-count"
              aria-label={ar ? `${activeFilters} فلاتر نشطة` : `${activeFilters} active filters`}
            >
              {activeFilters}
            </span>
          )}
          <Icon name="chevron" />
        </summary>
        <div className="catalog-filters">
          <SelectField
            label={ar ? 'الفئة' : 'Category'}
            value={search.get('categoryId') || ''}
            onChange={(event) => change('categoryId', event.target.value)}
          >
            <option value="">{ar ? 'كل الفئات' : 'All categories'}</option>
            {categoryRows(content?.categories || data?.categories || []).map((category) => (
              <option
                key={category.id}
                value={category.id}
              >{`${'- '.repeat(category.depth)}${category.name}`}</option>
            ))}
          </SelectField>
          <SelectField
            label={ar ? 'ترتيب حسب' : 'Sort by'}
            value={search.get('sort') || 'newest'}
            onChange={(event) => change('sort', event.target.value)}
          >
            <option value="newest">{ar ? 'الأحدث' : 'Newest'}</option>
            <option value="price-asc">
              {ar ? 'السعر: من الأقل للأعلى' : 'Price: low to high'}
            </option>
            <option value="price-desc">
              {ar ? 'السعر: من الأعلى للأقل' : 'Price: high to low'}
            </option>
          </SelectField>
          {['size', 'color'].map((key) => (
            <SelectField
              key={key}
              label={key === 'size' ? (ar ? 'المقاس' : 'Size') : ar ? 'اللون' : 'Color'}
              value={search.get(key) || ''}
              onChange={(event) => change(key, event.target.value)}
            >
              <option value="">{ar ? 'الكل' : 'Any'}</option>
              {(facets?.[key === 'size' ? 'sizes' : 'colors'] || []).map((choice) => (
                <option key={choice.key} value={choice.key}>
                  {choice.name} ({choice.count})
                </option>
              ))}
            </SelectField>
          ))}
          <div className="catalog-price-range">
            <SelectField
              label={ar ? 'نطاق السعر (جنيه)' : 'Price range (EGP)'}
              value={priceRange?.key || (customRange ? 'custom' : '')}
              onChange={(event) => {
                const range = priceRanges.find((item) => item.key === event.target.value)
                const next = new URLSearchParams(search)
                for (const [key, value] of [
                  ['minPrice', range?.min],
                  ['maxPrice', range?.max],
                ]) {
                  if (value) next.set(key, value)
                  else next.delete(key)
                }
                next.delete('page')
                setSearch(next)
              }}
            >
              <option value="">{ar ? 'كل الأسعار' : 'All prices'}</option>
              {customRange && (
                <option value="custom" disabled>
                  {ar ? 'نطاق السعر الحالي' : 'Current price range'}
                </option>
              )}
              {priceRanges.map((range) => (
                <option key={range.key} value={range.key}>
                  {range.label}
                </option>
              ))}
            </SelectField>
          </div>
          <label className="sale-filter">
            <input
              type="checkbox"
              checked={search.get('saleOnly') === 'true' || search.get('sale') === 'true'}
              onChange={(event) => {
                const next = new URLSearchParams(search)
                next.delete('sale')
                if (event.target.checked) next.set('saleOnly', 'true')
                else next.delete('saleOnly')
                next.delete('page')
                setSearch(next)
              }}
            />
            {ar ? 'التخفيضات فقط' : 'Sale only'}
          </label>
        </div>
      </details>
      {state.error ? (
        <ShopError error={state.error} retry={state.reload} />
      ) : state.loading && !data ? (
        <Feedback
          kind="loading"
          skeleton="cards"
          title={ar ? 'جارٍ تحميل المنتجات' : 'Loading products'}
        />
      ) : (
        data && (
          <>
            <p className="catalog-count" role="status">
              {data.list.pagination.total} {ar ? 'منتج' : 'products'}
              {state.loading ? (ar ? ' · جارٍ التحديث' : ' · Updating') : ''}
            </p>
            <div aria-busy={state.loading}>
              <ProductGrid items={data.list.items} />
            </div>
            {!data.list.items.length && (
              <Feedback
                title={
                  ar ? 'لا توجد منتجات تطابق اختياراتك.' : 'No products match your selections.'
                }
                action={
                  <Button onClick={() => setSearch({})} variant="secondary">
                    {ar ? 'مسح الفلاتر' : 'Clear filters'}
                  </Button>
                }
              />
            )}
            <nav className="shop-pagination" aria-label={ar ? 'صفحات المنتجات' : 'Product pages'}>
              <Button
                variant="secondary"
                className="pagination-arrow pagination-arrow--previous"
                aria-label={ar ? 'السابق' : 'Previous'}
                disabled={
                  state.loading ||
                  data.list.pagination.page <= 1 ||
                  data.list.pagination.pages === 0
                }
                onClick={() => {
                  const next = new URLSearchParams(search)
                  next.set('page', String(data.list.pagination.page - 1))
                  setSearch(next)
                }}
              >
                <Icon name="arrow" />
              </Button>
              <span>
                {data.list.pagination.pages ? data.list.pagination.page : 0} /{' '}
                {data.list.pagination.pages}
              </span>
              <Button
                variant="secondary"
                className="pagination-arrow"
                aria-label={ar ? 'التالي' : 'Next page'}
                disabled={state.loading || data.list.pagination.page >= data.list.pagination.pages}
                onClick={() => {
                  const next = new URLSearchParams(search)
                  next.set('page', String(data.list.pagination.page + 1))
                  setSearch(next)
                }}
              >
                <Icon name="arrow" />
              </Button>
            </nav>
          </>
        )
      )}
    </div>
  )
}
