import { useState } from 'react'
import { useRuntime } from '../../../../shared/ui/Runtime.jsx'
import { formatMoney } from '../../../../shared/lib/money.js'
import { createRetailApi } from '../shop/api.js'
import { retailImages } from '../shop/images.js'
import { useShopRead } from '../shop/useShopRead.js'
import { useDashboard } from './DashboardContext.jsx'
import { StaffTable } from './components.jsx'
import { currentOrderImage } from './orders.js'

function ItemName({ item, image, ar }) {
  const [failed, setFailed] = useState(false),
    visible = image?.url && !failed
  return (
    <div className="staff-order-product">
      {visible ? (
        <img
          src={image.url}
          alt=""
          width="52"
          height="60"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="staff-order-image-placeholder" aria-hidden="true">
          {ar ? 'لا توجد صورة' : 'No image'}
        </span>
      )}
      <div>
        <span>{item.name}</span>
        <small>
          {visible
            ? ar
              ? 'صورة المنتج الحالية'
              : 'Current product image'
            : ar
              ? 'الصورة غير متاحة'
              : 'Image unavailable'}
        </small>
      </div>
    </div>
  )
}

export function OrderItems({ items }) {
  const { language } = useDashboard(),
    ar = language === 'ar',
    { api: transport, config, session } = useRuntime(),
    [api] = useState(() =>
      createRetailApi({ api: transport, config, session, images: retailImages }),
    ),
    ids = [...new Set(items.map((item) => item.productId))],
    read = useShopRead(
      async (signal) =>
        Object.fromEntries(
          await Promise.all(
            ids.map(async (id) => {
              try {
                return [id, await api.product(id, { signal, language })]
              } catch {
                return [id, null]
              }
            }),
          ),
        ),
      `${language}:${JSON.stringify(ids)}`,
    )
  return (
    <StaffTable
      rows={items.map((item, index) => ({ ...item, id: String(index) }))}
      columns={[
        {
          key: 'name',
          label: ar ? 'المنتج' : 'Product',
          render: (item) => {
            const image = currentOrderImage(read.data?.[item.productId], item)
            return (
              <ItemName
                key={`${item.productId}:${item.variantId}:${image?.url || ''}`}
                item={item}
                image={image}
                ar={ar}
              />
            )
          },
        },
        {
          key: 'values',
          label: ar ? 'الخيارات' : 'Options',
          render: (item) =>
            Object.entries(item.values || {})
              .map(([key, value]) => `${key}: ${value}`)
              .join(' · ') || '-',
        },
        { key: 'quantity', label: ar ? 'الكمية' : 'Quantity' },
        {
          key: 'unitPrice',
          label: ar ? 'سعر الوحدة' : 'Unit price',
          render: (item) => <bdi>{formatMoney(item.unitPrice, language)}</bdi>,
        },
        {
          key: 'lineTotalAfterDiscount',
          label: ar ? 'الإجمالي بعد الخصم' : 'Line total after discount',
          render: (item) => <bdi>{formatMoney(item.lineTotalAfterDiscount, language)}</bdi>,
        },
      ]}
    />
  )
}
