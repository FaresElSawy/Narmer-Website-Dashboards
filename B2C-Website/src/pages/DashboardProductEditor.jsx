import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useRef, useState } from 'react'
import { Button, Field, Tabs } from '../../../shared/ui/Primitives.jsx'
import { Icon } from '../../../shared/ui/Brand.jsx'
import { formatMoney } from '../../../shared/lib/money.js'
import { useDashboard } from '../features/dashboard/DashboardContext.jsx'
import { useStaffRead } from '../features/dashboard/hooks.js'
import { RecordEditor } from '../features/dashboard/RecordEditor.jsx'
import { ProductImages } from '../features/dashboard/ProductImages.jsx'
import { variantLabel, variantImages } from '../features/dashboard/product-images.js'
import { DeleteRecord } from '../features/dashboard/DeleteRecord.jsx'
import {
  StaffHeading,
  ReadState,
  BilingualFields,
  SelectField,
  MoneyField,
} from '../features/dashboard/components.jsx'
import {
  emptyProduct,
  productPayload,
  updateCatalogName,
  newProductOption,
  newProductOptionValue,
  updateOptionName,
  updateOptionValueName,
} from '../features/dashboard/catalog.js'
import { productFieldErrors } from '../features/dashboard/product-validation.js'

const productField = (errors, path) => ({
  name: path,
  id: `product-field-${path}`,
  error: errors[path],
})

function ProductFieldError({ errors, path }) {
  return errors[path] ? (
    <p className="field-error" role="alert" data-field={path} tabIndex={-1}>
      {errors[path]}
    </p>
  ) : null
}

function Editor({ initial, create }) {
  const { language } = useDashboard(),
    ar = language === 'ar',
    navigate = useNavigate(),
    [search] = useSearchParams(),
    [uploading, setUploading] = useState(false),
    [imagePending, setImagePending] = useState(false),
    [tab, setTab] = useState(
      search.get('step') === 'images' ? (initial.type === 'variant' ? 2 : 1) : 0,
    )
  // shortcut: the chart picker reads the first 100 charts; paginate it before the library exceeds that size.
  const categoryRead = useStaffRead('/categories/tree'),
    chartRead = useStaffRead('/size-charts?limit=100')
  const flatten = (nodes = []) => nodes.flatMap((node) => [node, ...flatten(node.children || [])])
  return (
    <RecordEditor
      initial={initial}
      path={`/products${create ? '' : `/${initial.id}`}`}
      payload={(draft, base) => {
        try {
          const body = productPayload(draft, base)
          if (create) delete body.version
          return body
        } catch (error) {
          setTab(draft.type === 'variant' ? 1 : 0)
          throw error
        }
      }}
      validate={productFieldErrors}
      onValidation={(errors) =>
        setTab(/^(options|variants)(\.|$)/.test(Object.keys(errors)[0]) ? 1 : 0)
      }
      create={create}
      saveInChildren
      saveLabel={
        create ? (ar ? 'حفظ ومتابعة لإضافة الصور' : 'Save and continue to images') : undefined
      }
      blocked={uploading}
      saveBlocked={imagePending}
      onSaved={
        create
          ? (item) =>
              navigate(`/${language}/dashboard/products/${item.id}?step=images`, { replace: true })
          : undefined
      }
    >
      {({ draft, setDraft, saveButton, fieldErrors }) => (
        <div className="staff-detail-grid product-editor-grid">
          <div>
            {create && (
              <section className="panel staff-panel product-create-type">
                <ProductTypeField
                  draft={draft}
                  setDraft={(next) => {
                    setDraft(next)
                    setTab(0)
                  }}
                  create
                  ar={ar}
                />
                <small>
                  {ar
                    ? 'يمكنك التبديل بين النوعين حتى تحفظ المنتج للمرة الأولى.'
                    : 'You can switch between both types until the product is saved for the first time.'}
                </small>
              </section>
            )}
            {(create || search.get('step') === 'images') && (
              <ol
                className="staff-image-steps"
                aria-label={ar ? 'خطوات إعداد المنتج' : 'Product setup steps'}
              >
                <li aria-current={create ? 'step' : undefined}>
                  <strong>1</strong>
                  {ar ? 'حفظ تفاصيل المنتج' : 'Save product details'}
                </li>
                <li aria-current={!create ? 'step' : undefined}>
                  <strong>2</strong>
                  {ar ? 'إضافة الصور وحفظها' : 'Add images and save'}
                </li>
              </ol>
            )}
            <Tabs
              label={ar ? 'تعديل المنتج' : 'Product editor'}
              selected={tab}
              onSelect={setTab}
              tabs={[
                {
                  label: ar ? 'تفاصيل المنتج' : 'Product details',
                  content: (
                    <>
                      <section className="panel staff-panel">
                        <h2>{ar ? 'محتوى المنتج' : 'Product content'}</h2>
                        <BilingualFields
                          name="name"
                          errors={fieldErrors}
                          label={ar ? 'الاسم *' : 'Name *'}
                          required
                          value={draft.name}
                          onChange={(name) => setDraft(updateCatalogName(draft, name, create))}
                        />
                        <BilingualFields
                          name="description"
                          errors={fieldErrors}
                          label={ar ? 'الوصف' : 'Description'}
                          multiline
                          maxLength={10000}
                          value={draft.description}
                          onChange={(description) => setDraft({ ...draft, description })}
                        />
                        <Field
                          label="Slug"
                          {...productField(fieldErrors, 'slug')}
                          required
                          aria-label="Slug"
                          aria-describedby={
                            fieldErrors.slug
                              ? 'product-field-slug-help'
                              : create
                                ? 'product-slug-help'
                                : undefined
                          }
                          lang="en"
                          dir="ltr"
                          maxLength={150}
                          pattern="[a-z0-9]+(-[a-z0-9]+)*"
                          value={draft.slug}
                          onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                        />
                        {create && (
                          <small id="product-slug-help">
                            {ar
                              ? 'يُنشأ تلقائيًا من الاسم الإنجليزي، ويمكنك تعديله.'
                              : 'Generated from the English name. You can edit it.'}
                          </small>
                        )}
                        <div>
                          <SelectField
                            {...productField(fieldErrors, 'categoryId')}
                            label={ar ? 'التصنيف' : 'Category'}
                            required
                            value={draft.categoryId}
                            onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}
                          >
                            <option value="">{ar ? 'اختر تصنيفًا' : 'Choose a category'}</option>
                            {flatten(categoryRead.data || []).map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name?.[language] || category.name?.en}
                                {category.isActive ? '' : ar ? ' · غير متاح' : ' · inactive'}
                              </option>
                            ))}
                          </SelectField>
                          {categoryRead.error && (
                            <p>{ar ? 'تعذر تحميل التصنيفات.' : 'Could not load categories.'}</p>
                          )}
                        </div>
                        {!create && <ProductTypeField draft={draft} setDraft={setDraft} ar={ar} />}
                        {draft.type === 'simple' ? (
                          <div className="staff-field-pair">
                            <MoneyField
                              {...productField(fieldErrors, 'price')}
                              label={ar ? 'السعر (جنيه مصري)' : 'Price (EGP)'}
                              required
                              value={draft.price}
                              onChange={(price) => setDraft({ ...draft, price })}
                            />
                            <MoneyField
                              {...productField(fieldErrors, 'discountedPrice')}
                              label={ar ? 'السعر بعد الخصم (جنيه مصري)' : 'Discounted price (EGP)'}
                              value={draft.discountedPrice}
                              onChange={(discountedPrice) =>
                                setDraft({ ...draft, discountedPrice })
                              }
                            />
                            <Field
                              label="SKU"
                              {...productField(fieldErrors, 'sku')}
                              maxLength={100}
                              value={draft.sku ?? ''}
                              onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                            />
                            <Field
                              label={ar ? 'المخزون' : 'Stock'}
                              {...productField(fieldErrors, 'stock')}
                              type="number"
                              min="0"
                              step="1"
                              required
                              value={draft.stock}
                              onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                            />
                          </div>
                        ) : null}
                      </section>
                    </>
                  ),
                },
                ...(draft.type === 'variant'
                  ? [
                      {
                        label: ar ? 'التركيبات والمخزون' : 'Variants & stock',
                        content: (
                          <section className="panel staff-panel product-variants-panel">
                            <h2>{ar ? 'التركيبات والمخزون' : 'Variants & stock'}</h2>
                            <VariantEditor
                              draft={draft}
                              setDraft={setDraft}
                              ar={ar}
                              errors={fieldErrors}
                            />
                          </section>
                        ),
                      },
                    ]
                  : []),
                {
                  label: ar ? 'الصور' : 'Images',
                  content: (
                    <ProductImages
                      draft={draft}
                      setDraft={setDraft}
                      onBusy={setUploading}
                      onPending={setImagePending}
                      create={create}
                    />
                  ),
                },
              ]}
            />
          </div>
          <aside>
            <div className="product-sidebar-settings">
              <section className="panel staff-panel">
                <h2>{ar ? 'النشر' : 'Publication'}</h2>
                <SelectField
                  label={ar ? 'إتاحة المنتج' : 'Product availability'}
                  value={String(draft.isActive)}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.value === 'true' })}
                >
                  <option value="false">{ar ? 'غير متاح' : 'Inactive'}</option>
                  <option value="true">{ar ? 'متاح' : 'Active'}</option>
                </SelectField>
              </section>
              <section className="panel staff-panel">
                <h2>{ar ? 'دليل المقاس' : 'Size guide'}</h2>
                <SelectField
                  label={ar ? 'جدول المقاس' : 'Size chart'}
                  value={draft.sizeChartId || ''}
                  onChange={(e) => setDraft({ ...draft, sizeChartId: e.target.value || null })}
                >
                  <option value="">{ar ? 'بدون دليل' : 'No guide'}</option>
                  {(chartRead.data?.items || []).map((chart) => (
                    <option key={chart.id} value={chart.id}>
                      {chart.name[language]}
                      {chart.isActive ? '' : ar ? ' · غير متاح' : ' · inactive'}
                    </option>
                  ))}
                </SelectField>
                <small>
                  {ar
                    ? 'يمكن إسناد جدول مشترك أو فردي؛ التغيير يستخدم إصدار المنتج.'
                    : 'Charts may be shared; assignment saves with this product version.'}
                </small>
                {chartRead.error && (
                  <p>{ar ? 'تعذر تحميل جداول المقاسات.' : 'Could not load size charts.'}</p>
                )}
              </section>
            </div>
            <div className="product-save-actions">{saveButton}</div>
            {!create && (
              <DeleteRecord
                path={`/products/${draft.id}`}
                back="products"
                label={ar ? 'المنتج' : 'product'}
              />
            )}
          </aside>
        </div>
      )}
    </RecordEditor>
  )
}

function ProductTypeField({ draft, setDraft, create, ar }) {
  const types = useRef({})
  return (
    <SelectField
      label={
        create
          ? ar
            ? 'نوع المنتج'
            : 'Product type'
          : ar
            ? 'نوع المنتج - ثابت بعد الإنشاء'
            : 'Product type - fixed after creation'
      }
      disabled={!create}
      value={draft.type}
      onChange={(event) => {
        types.current[draft.type] = draft
        setDraft({
          ...(types.current[event.target.value] || emptyProduct(event.target.value)),
          name: draft.name,
          description: draft.description,
          slug: draft.slug,
          categoryId: draft.categoryId,
          sizeChartId: draft.sizeChartId,
          isActive: draft.isActive,
        })
      }}
    >
      <option value="simple">{ar ? 'بسيط' : 'Simple'}</option>
      <option value="variant">{ar ? 'متعدد الخيارات' : 'Variant'}</option>
    </SelectField>
  )
}

function VariantEditor({ draft, setDraft, ar, errors }) {
  const { language } = useDashboard()
  const [definitionsOpen, setDefinitionsOpen] = useState(draft.options.length === 0)
  const addOption = () =>
    setDraft({
      ...draft,
      options: [...draft.options, newProductOption()],
    })
  const addVariant = () =>
    setDraft({
      ...draft,
      variants: [
        ...draft.variants,
        {
          editorKey: crypto.randomUUID(),
          values: Object.fromEntries(
            draft.options.map((option) => [option.key, option.values[0]?.key || '']),
          ),
          price: '',
          stock: 0,
          discountedPrice: null,
          sku: null,
          images: [],
        },
      ],
    })
  return (
    <div className="product-variant-list">
      <details
        className="staff-options-editor"
        data-invalid={!!errors.options || undefined}
        open={definitionsOpen}
        onToggle={(event) => setDefinitionsOpen(event.currentTarget.open)}
      >
        <summary>
          <span className="product-options-heading">
            <strong>{ar ? 'الألوان والمقاسات' : 'Colors and sizes'}</strong>
            <span className="product-count">
              {ar ? `الخيارات: ${draft.options.length}` : `Options: ${draft.options.length}`}
            </span>
            <span className="product-options-help">
              {ar
                ? 'ابدأ بتحديد الألوان والمقاسات المتاحة، ثم أضف التركيبات بأسعارها ومخزونها.'
                : 'Start with the available colors and sizes, then add variants with prices and stock.'}
            </span>
          </span>
          <Icon name="chevron" />
        </summary>
        <div className="product-options-content">
          <ProductFieldError errors={errors} path="options" />
          <Button disabled={draft.options.length >= 5} onClick={addOption}>
            {ar ? 'إضافة خيار' : 'Add option'}
          </Button>
          {draft.options.map((option, i) => (
            <div className="panel staff-panel" key={i}>
              <BilingualFields
                name={`options.${i}.name`}
                errors={errors}
                required
                label={ar ? 'اسم الخيار' : 'Option name'}
                value={option.name}
                onChange={(name) => setDraft(updateOptionName(draft, i, name))}
              />
              <ProductFieldError errors={errors} path={`options.${i}.values`} />
              {option.values.map((value, j) => (
                <div className="staff-field-pair" key={j}>
                  <BilingualFields
                    name={`options.${i}.values.${j}.name`}
                    errors={errors}
                    required
                    label={ar ? 'اسم القيمة' : 'Value name'}
                    value={value.name}
                    onChange={(name) => setDraft(updateOptionValueName(draft, i, j, name))}
                  />
                  <Button
                    variant="secondary"
                    disabled={option.values.length === 1}
                    onClick={() => {
                      const options = structuredClone(draft.options)
                      options[i].values.splice(j, 1)
                      setDraft({ ...draft, options })
                    }}
                  >
                    {ar ? 'إزالة القيمة' : 'Remove value'}
                  </Button>
                </div>
              ))}
              <Button
                variant="secondary"
                disabled={option.values.length >= 50}
                onClick={() => {
                  const options = structuredClone(draft.options)
                  options[i].values.push(newProductOptionValue())
                  setDraft({ ...draft, options })
                }}
              >
                {ar ? 'إضافة قيمة' : 'Add value'}
              </Button>
              <Button
                variant="secondary"
                disabled={draft.options.length === 1}
                onClick={() =>
                  setDraft({
                    ...draft,
                    options: draft.options.filter((_, index) => index !== i),
                    variants: draft.variants.map((variant) => {
                      const values = { ...variant.values }
                      delete values[option.key]
                      return { ...variant, values }
                    }),
                  })
                }
              >
                {ar ? 'إزالة الخيار' : 'Remove option'}
              </Button>
            </div>
          ))}
        </div>
      </details>
      <h3>{ar ? 'التركيبات القابلة للبيع' : 'Sellable variants'}</h3>
      <ProductFieldError errors={errors} path="variants" />
      {draft.variants.map((variant, i) => (
        <details
          className="panel staff-panel staff-variant"
          data-invalid={
            Object.keys(errors).some((path) => path.startsWith(`variants.${i}.`)) || undefined
          }
          name="sellable-variants"
          key={variant.id || variant.editorKey || i}
          open={variant.id ? undefined : true}
        >
          <summary>
            <span>
              {variantLabel(draft, variant, language) ||
                (ar ? `تركيبة ${i + 1}` : `Variant ${i + 1}`)}
            </span>
            <span>
              {Number.isSafeInteger(variant.price) ? formatMoney(variant.price, language) : '-'} ·{' '}
              {ar ? 'المخزون' : 'Stock'}: {variant.stock}
            </span>
            <span className="product-variant-image-count">
              {variantImages(draft, variant).length} {ar ? 'صور' : 'images'}
            </span>
            <Icon name="chevron" />
          </summary>
          <ProductFieldError errors={errors} path={`variants.${i}.values`} />
          <div className="staff-field-pair">
            {draft.options.map((option) => (
              <SelectField
                {...productField(errors, `variants.${i}.values.${option.key}`)}
                required
                label={option.name?.[language] || option.key}
                key={option.key}
                value={variant.values[option.key] || ''}
                onChange={(e) => {
                  const variants = [...draft.variants]
                  variants[i] = {
                    ...variant,
                    values: { ...variant.values, [option.key]: e.target.value },
                  }
                  setDraft({ ...draft, variants })
                }}
              >
                <option value="">{ar ? 'اختر' : 'Choose'}</option>
                {option.values.map((value) => (
                  <option key={value.key} value={value.key}>
                    {value.name?.[language] || value.key}
                  </option>
                ))}
              </SelectField>
            ))}
            <MoneyField
              {...productField(errors, `variants.${i}.price`)}
              label={ar ? 'السعر (جنيه مصري)' : 'Price (EGP)'}
              required
              value={variant.price}
              onChange={(price) => {
                const variants = [...draft.variants]
                variants[i] = {
                  ...variant,
                  price,
                }
                setDraft({ ...draft, variants })
              }}
            />
            <MoneyField
              {...productField(errors, `variants.${i}.discountedPrice`)}
              label={ar ? 'السعر بعد الخصم (جنيه مصري)' : 'Discounted price (EGP)'}
              value={variant.discountedPrice}
              onChange={(discountedPrice) => {
                const variants = [...draft.variants]
                variants[i] = { ...variant, discountedPrice }
                setDraft({ ...draft, variants })
              }}
            />
            <Field
              label="SKU"
              {...productField(errors, `variants.${i}.sku`)}
              maxLength={100}
              value={variant.sku || ''}
              onChange={(event) => {
                const variants = [...draft.variants]
                variants[i] = { ...variant, sku: event.target.value }
                setDraft({ ...draft, variants })
              }}
            />
            <Field
              label={ar ? 'المخزون' : 'Stock'}
              {...productField(errors, `variants.${i}.stock`)}
              required
              type="number"
              min="0"
              step="1"
              value={variant.stock}
              onChange={(e) => {
                const variants = [...draft.variants]
                variants[i] = { ...variant, stock: e.target.value }
                setDraft({ ...draft, variants })
              }}
            />
          </div>
          <div className="product-variant-actions">
            <Button
              variant="secondary"
              disabled={draft.variants.length === 1}
              onClick={() =>
                setDraft({ ...draft, variants: draft.variants.filter((_, index) => index !== i) })
              }
            >
              {ar ? 'إزالة التركيبة' : 'Remove variant'}
            </Button>
          </div>
        </details>
      ))}
      <Button variant="secondary" disabled={draft.variants.length >= 100} onClick={addVariant}>
        {ar ? 'إضافة تركيبة' : 'Add variant'}
      </Button>
    </div>
  )
}

export function DashboardProductEditor() {
  const { productId } = useParams(),
    { language } = useDashboard(),
    ar = language === 'ar',
    create = productId === 'new'
  const read = useStaffRead(create ? null : `/products/${productId}`)
  return (
    <>
      <StaffHeading
        title={create ? (ar ? 'منتج جديد' : 'New product') : ar ? 'تعديل المنتج' : 'Edit product'}
      />
      {create ? (
        <Editor initial={emptyProduct()} create />
      ) : (
        <ReadState read={read}>
          {read.data && <Editor key={read.data.id} initial={read.data} />}
        </ReadState>
      )}
    </>
  )
}
