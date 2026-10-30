import { useState, useEffect, useRef } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { useDashboard } from '../dashboard/DashboardContext.jsx'
import {
  StaffHeading,
  StaffTable,
  Pagination,
  SelectField,
  StaffError,
} from '../dashboard/components.jsx'
import { orderStatusLabel } from '../dashboard/orders.js'
import { Button, Feedback } from '../../../../shared/ui/Primitives.jsx'
import { Icon } from '../../../../shared/ui/Brand.jsx'
import { ReportDateField } from './ReportDateField.jsx'
import { defaultReportDates, reportDate, reportRange } from './dates.js'
import { exactSum, reportMoney } from './model.js'
import { useReport } from './useReport.js'
import { sundayWeeks } from './weeks.js'
import { chartLine, chartMaximum } from './chart.js'
import '../../assets/css/reports.css'

function PeriodForm({ selection, onApply, language }) {
  const ar = language === 'ar',
    [draft, setDraft] = useState(selection),
    [error, setError] = useState('')
  return (
    <form
      className="report-filters"
      onSubmit={(event) => {
        event.preventDefault()
        try {
          reportRange(draft.from, draft.through)
          setError('')
          onApply(draft)
        } catch {
          setError(
            ar
              ? 'اختر فترة صحيحة لا تتجاوز ٣٦٦ يومًا فعليًا، بين ٢٠٠٠ و٢١٠٠.'
              : 'Choose a valid period of at most 366 elapsed days, between 2000 and 2100.',
          )
        }
      }}
    >
      <ReportDateField
        label={ar ? 'من · القاهرة' : 'From · Cairo'}
        value={draft.from}
        onChange={(from) => setDraft({ ...draft, from })}
        language={language}
      />
      <ReportDateField
        label={ar ? 'حتى · شامل' : 'Through · inclusive'}
        value={draft.through}
        onChange={(through) => setDraft({ ...draft, through })}
        language={language}
      />
      <SelectField
        label={ar ? 'الفاصل الزمني' : 'Interval'}
        value={draft.interval}
        onChange={(event) => setDraft({ ...draft, interval: event.target.value })}
      >
        {[
          ['day', 'Day', 'يوم'],
          ['week', 'Week · Sunday start', 'أسبوع · يبدأ الأحد'],
          ['month', 'Month', 'شهر'],
        ].map(([value, en, arabic]) => (
          <option key={value} value={value}>
            {ar ? arabic : en}
          </option>
        ))}
      </SelectField>
      <Button type="submit">{ar ? 'تطبيق الفترة' : 'Apply period'}</Button>
      {error && (
        <p role="alert" className="field-error report-filter-error">
          {error}
        </p>
      )}
    </form>
  )
}
function Metric({ label, value, hint }) {
  return (
    <div className="report-metric">
      <span>{label}</span>
      <strong>
        <bdi>{value}</bdi>
      </strong>
      {hint && <small>{hint}</small>}
    </div>
  )
}
function Panel({ title, description, action, children, className = '' }) {
  return (
    <section className={`report-panel ${className}`}>
      <header className="report-panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
function ProductName({ row, language }) {
  return (
    <Link className="report-product" to={`/${language}/dashboard/products/${row.productId}`}>
      <span className="report-thumbnail" aria-hidden="true">
        <Icon name="box" />
        {row.image?.url && /^(https:\/\/|\/(?!\/))/.test(row.image.url) && (
          <img
            src={row.image.url}
            alt=""
            loading="lazy"
            width="44"
            height="52"
            onError={(event) => {
              event.currentTarget.hidden = true
            }}
          />
        )}
      </span>
      <span>{row.name}</span>
    </Link>
  )
}
function Chart({ rows, series, language, title, variant = 'line', scaleMax }) {
  const ar = language === 'ar',
    [selected, setSelected] = useState(Math.max(0, rows.length - 1)),
    [width, setWidth] = useState(720),
    figure = useRef(null)
  useEffect(() => {
    if (!figure.current) return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(220, entry.contentRect.width)),
    )
    observer.observe(figure.current)
    return () => observer.disconnect()
  }, [])
  if (!rows.length)
    return (
      <p className="report-empty">
        {ar
          ? 'لا توجد فترات زمنية في هذه الاستجابة.'
          : 'No trend buckets were returned for this period.'}
      </p>
    )
  const active = Math.min(selected, rows.length - 1),
    row = rows[active],
    max = scaleMax || chartMaximum(rows.flatMap((item) => series.map((s) => item[s.key])))
  const first = Date.parse(rows[0].bucketStart),
    end = Date.parse(rows.at(-1).bucketEnd),
    last = Date.parse(rows.at(-1).bucketStart),
    x = (item) =>
      variant === 'bar'
        ? 48 +
          (((Date.parse(item.bucketStart) + Date.parse(item.bucketEnd)) / 2 - first) /
            (end - first)) *
            (width - 60)
        : rows.length === 1
          ? (width + 36) / 2
          : 48 + ((Date.parse(item.bucketStart) - first) / (last - first)) * (width - 60),
    y = (value) => 170 - (value / max) * 160,
    barWidth = Math.min(24, Math.max(0.1, ((width - 60) / rows.length) * 0.7))
  const money = (value) => reportMoney(value, language)
  const label = (item) =>
    `${reportDate(item.bucketStart, language)} – ${reportDate(item.bucketEnd, language)} (${ar ? 'النهاية غير شاملة' : 'end exclusive'})`
  const columns = [
    { key: 'period', label: ar ? 'الفترة · القاهرة' : 'Bucket · Cairo', render: label },
    ...series.map((s) => ({
      key: s.key,
      label: s.label,
      render: (item) => <bdi>{money(item[s.key])}</bdi>,
    })),
  ]
  function inspectPoint(event) {
    const rect = event.currentTarget.getBoundingClientRect(),
      pointer = ((event.clientX - rect.left) * width) / rect.width
    setSelected(
      rows.reduce(
        (best, item, index) =>
          Math.abs(x(item) - pointer) < Math.abs(x(rows[best]) - pointer) ? index : best,
        0,
      ),
    )
  }
  return (
    <figure className="report-chart" ref={figure}>
      <figcaption className="report-axis-unit">{ar ? 'جنيه مصري' : 'EGP'}</figcaption>
      <svg
        viewBox={`0 0 ${width} 212`}
        role="img"
        aria-label={title}
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={inspectPoint}
        onPointerDown={inspectPoint}
      >
        <desc>
          {ar
            ? 'القيم الدقيقة متاحة في بيانات الرسم أدناه.'
            : 'Exact values are available in the chart data below.'}
        </desc>
        {[0, 1, 2, 3].map((tick) => (
          <g key={tick}>
            <line
              x1="48"
              x2={width - 12}
              y1={10 + tick * (160 / 3)}
              y2={10 + tick * (160 / 3)}
              stroke="var(--color-line)"
            />
            <text x="40" y={14 + tick * (160 / 3)} textAnchor="end" direction="ltr">
              {new Intl.NumberFormat(language, {
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(((max / 100) * (3 - tick)) / 3)}
            </text>
          </g>
        ))}
        {series.map((s) => (
          <g key={s.key}>
            {variant === 'bar' ? (
              rows.map((item, index) => (
                <rect
                  key={item.bucketStart}
                  className="report-bar"
                  data-selected={index === active || undefined}
                  x={x(item) - barWidth / 2}
                  y={y(item[s.key])}
                  width={barWidth}
                  height={170 - y(item[s.key])}
                  rx={Math.min(2, barWidth / 4)}
                />
              ))
            ) : (
              <>
                <path
                  className="report-trend-line"
                  d={chartLine(rows.map((item) => [x(item), y(item[s.key])]))}
                />
                <circle
                  className="report-latest-point"
                  cx={x(rows.at(-1))}
                  cy={y(rows.at(-1)[s.key])}
                  r="4"
                />
              </>
            )}
          </g>
        ))}
        {[
          ...new Set(
            (width >= 560 ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.5, 1]).map((fraction) =>
              Math.round((rows.length - 1) * fraction),
            ),
          ),
        ].map((index) => (
          <text
            key={index}
            x={x(rows[index])}
            y="199"
            textAnchor={index === 0 ? 'start' : index === rows.length - 1 ? 'end' : 'middle'}
          >
            {new Intl.DateTimeFormat(language, {
              day: 'numeric',
              month: 'short',
              timeZone: 'Africa/Cairo',
            }).format(new Date(rows[index].bucketStart))}
          </text>
        ))}
      </svg>
      {variant === 'bar' && (
        <div className="report-bar-readout">
          <span>{reportDate(row.bucketStart, language)}</span>
          <strong>
            <bdi>{money(row[series[0].key])}</bdi>
          </strong>
        </div>
      )}
      <details className="report-data">
        <summary>{ar ? 'عرض بيانات الرسم' : 'View chart data'}</summary>
        <SelectField
          label={ar ? 'فحص فترة الرسم' : 'Inspect chart bucket'}
          value={active}
          onChange={(event) => setSelected(Number(event.target.value))}
        >
          {rows.map((item, index) => (
            <option key={item.bucketStart} value={index}>
              {label(item)}
            </option>
          ))}
        </SelectField>
        <dl className="report-chart-values" aria-live="polite">
          {series.map((s) => (
            <div key={s.key}>
              <dt>{s.label}</dt>
              <dd>
                <bdi>{money(row[s.key])}</bdi>
              </dd>
            </div>
          ))}
        </dl>
        <StaffTable
          columns={columns}
          rows={rows.map((item) => ({ ...item, id: item.bucketStart }))}
          empty=""
        />
      </details>
    </figure>
  )
}
function Overview({ data, language, query }) {
  const ar = language === 'ar',
    money = (v) => reportMoney(v, language),
    number = (v) => new Intl.NumberFormat(language).format(v),
    m = data.metrics
  return (
    <>
      <div className="report-metrics report-metrics--four">
        <Metric
          label={ar ? 'قيمة الطلبات المقدمة' : 'Placed order value'}
          value={money(m.placedOrderAmount)}
          hint={ar ? 'بعد الكوبون، وتشمل الشحن' : 'After coupon, including shipping'}
        />
        <Metric
          label={ar ? 'الطلبات المقدمة' : 'Orders placed'}
          value={number(m.ordersPlaced)}
          hint={ar ? 'كل الحالات في الفترة' : 'All current statuses in the period'}
        />
        <Metric
          label={ar ? 'الوحدات المطلوبة' : 'Units placed'}
          value={number(m.unitsPlaced)}
          hint={ar ? 'تشمل الإلغاءات والمرتجعات' : 'Includes cancellations and returns'}
        />
        <Metric
          label={ar ? 'طلبات الفترة المعلقة' : 'Pending orders in period'}
          value={number(m.pendingOrders)}
          hint={ar ? 'من الطلبات المقدمة في الفترة' : 'From orders placed in this period'}
        />
      </div>
      <div className="report-overview-grid">
        <Panel
          title={ar ? 'اتجاه قيمة الطلبات المقدمة' : 'Placed order value trend'}
          description={`${ar ? 'متوسط قيمة الطلب' : 'Average placed order value'}: ${money(m.averagePlacedOrderAmount)}`}
          action={
            <Link to={`/${language}/dashboard/finance?${query}`}>
              {ar ? 'عرض المالية' : 'View finance'}
            </Link>
          }
        >
          <Chart
            key={data.meta.from + data.meta.to + data.meta.interval}
            rows={data.trend}
            series={[
              {
                key: 'placedOrderAmount',
                label: ar ? 'قيمة الطلبات المقدمة' : 'Placed order value',
              },
            ]}
            title={
              ar ? 'اتجاه قيمة الطلبات المقدمة بالجنيه المصري' : 'Placed order value trend in EGP'
            }
            language={language}
          />
        </Panel>
        <Panel
          title={ar ? 'أعلى المنتجات' : 'Top products'}
          description={
            ar
              ? 'طلبات الفترة المسلّمة حاليًا · حسب الوحدات'
              : 'Placed in period, currently delivered · by units'
          }
          action={
            <Link to={`/${language}/dashboard/performance?${query}`}>
              {ar ? 'عرض الكل' : 'View all'}
            </Link>
          }
        >
          <ol className="report-top-products">
            {data.topProducts.map((row) => (
              <li key={row.productId}>
                <ProductName row={row} language={language} />
                <span>
                  <bdi>{number(row.quantity)}</bdi>{' '}
                  {ar ? 'وحدة' : row.quantity === 1 ? 'unit' : 'units'}
                </span>
              </li>
            ))}
          </ol>
          {!data.topProducts.length && (
            <p className="report-empty">
              {ar
                ? 'لا توجد منتجات من طلبات مسلّمة في هذه الفترة.'
                : 'No products from currently delivered orders in this period.'}
            </p>
          )}
          <p className="staff-help">
            {ar
              ? 'الصور من الكتالوج الحالي؛ الأسماء من الطلبات المحفوظة.'
              : 'Photos are from the current catalog; names are saved order names.'}
          </p>
        </Panel>
      </div>
      <Panel
        title={ar ? 'أحدث الطلبات' : 'Recent orders'}
        description={
          ar
            ? 'آخر خمسة طلبات مقدمة في الفترة · كل الحالات'
            : 'Latest five orders placed in the period · all statuses'
        }
        action={
          <Link to={`/${language}/dashboard/orders`}>
            {ar ? 'عرض كل الطلبات' : 'View all orders'}
          </Link>
        }
      >
        {m.pendingOrders > 0 && (
          <p className="report-notice">
            {ar
              ? `يوجد ${number(m.pendingOrders)} طلب معلق من طلبات هذه الفترة.`
              : `${number(m.pendingOrders)} pending ${m.pendingOrders === 1 ? 'order from this period needs' : 'orders from this period need'} review.`}
          </p>
        )}
        <StaffTable
          rows={data.recentOrders}
          empty={
            ar ? 'لا توجد طلبات مقدمة في هذه الفترة.' : 'No orders were placed in this period.'
          }
          columns={[
            {
              key: 'customer',
              label: ar ? 'الطلب / العميل' : 'Order / customer',
              render: (row) => (
                <div>
                  <strong>{row.customer.name}</strong>
                  <small className="staff-reference" dir="ltr">
                    {row.id}
                  </small>
                </div>
              ),
            },
            {
              key: 'date',
              label: ar ? 'تاريخ التقديم · القاهرة' : 'Placed · Cairo',
              render: (row) => reportDate(row.createdAt, language, true),
            },
            {
              key: 'total',
              label: ar ? 'قيمة الطلب' : 'Order value',
              render: (row) => <bdi>{money(row.totals.total)}</bdi>,
            },
            {
              key: 'payment',
              label: ar ? 'وسيلة الدفع' : 'Payment',
              render: (row) =>
                row.payment.method === 'cod'
                  ? ar
                    ? 'الدفع عند الاستلام'
                    : 'Cash on delivery'
                  : 'InstaPay',
            },
            {
              key: 'status',
              label: ar ? 'الحالة الحالية' : 'Current status',
              render: (row) => (
                <span className={`staff-status staff-status--${row.status}`}>
                  {orderStatusLabel(row.status, language)}
                </span>
              ),
            },
            {
              key: 'action',
              label: ar ? 'الإجراء' : 'Action',
              render: (row) => (
                <Link to={`/${language}/dashboard/orders/${row.id}`}>
                  {ar ? 'مراجعة الطلب' : 'Review order'}
                </Link>
              ),
            },
          ]}
        />
      </Panel>
    </>
  )
}
function Finance({ data, language }) {
  const ar = language === 'ar',
    money = (v) => reportMoney(v, language),
    number = (v) => new Intl.NumberFormat(language).format(v),
    amounts = data.orderAmounts,
    collections = data.collectionMarkers
  const series = [
    { key: 'placedOrderAmount', label: ar ? 'قيمة الطلبات المقدمة' : 'Placed order value' },
    {
      key: 'instapayVerifiedAmount',
      label: ar ? 'علامات تحقق إنستاباي' : 'InstaPay verification markers',
    },
    { key: 'codCollectedAmount', label: ar ? 'علامات تحصيل نقدي' : 'COD collection markers' },
    { key: 'refundMarkerAmount', label: ar ? 'علامات استرداد' : 'Refund markers' },
  ]
  const scaleMax = chartMaximum(data.trend.flatMap((row) => series.map((s) => row[s.key])))
  return (
    <>
      <div className="report-metrics">
        <Metric
          label={ar ? 'قيمة الطلبات المقدمة' : 'Placed order value'}
          value={money(amounts.total)}
          hint={
            ar
              ? 'حسب تاريخ تقديم الطلب · دون خصم الاستردادات'
              : 'By order placement date · no refund subtraction'
          }
        />
        <Metric
          label={ar ? 'علامات التحصيل المسجلة' : 'Recorded collection markers'}
          value={money(collections.totalRecordedAmount)}
          hint={ar ? 'حسب تاريخ التحقق / التحصيل' : 'By verification / collection date'}
        />
        <Metric
          label={ar ? 'قيمة علامات الاسترداد' : 'Refund marker amount'}
          value={money(data.refundMarkers.amount)}
          hint={`${number(data.refundMarkers.orderCount)} ${ar ? 'طلب · حسب تاريخ العلامة' : 'orders · by marker date'}`}
        />
      </div>
      <Panel
        title={ar ? 'اتجاه القيم والعلامات' : 'Order value and marker trends'}
        description={
          ar
            ? 'كل مقياس في رسم منفصل وبنفس التدريج. العلامات لا تثبت تسوية الأموال.'
            : 'Separate charts with a shared scale. Markers do not confirm settlement.'
        }
      >
        <div className="report-finance-trends">
          {series.map((s) => (
            <section className="report-finance-trend" key={s.key} aria-label={s.label}>
              <header>
                <h3>{s.label}</h3>
                <p>
                  {s.key === 'placedOrderAmount'
                    ? ar
                      ? 'حسب تاريخ تقديم الطلب'
                      : 'By order placement date'
                    : s.key === 'instapayVerifiedAmount'
                      ? ar
                        ? 'حسب تاريخ التحقق'
                        : 'By verification date'
                      : s.key === 'codCollectedAmount'
                        ? ar
                          ? 'حسب تاريخ التحصيل'
                          : 'By collection date'
                        : ar
                          ? 'حسب تاريخ علامة الاسترداد'
                          : 'By refund marker date'}
                </p>
              </header>
              <Chart
                key={data.meta.from + data.meta.to + data.meta.interval}
                rows={data.trend}
                series={[s]}
                title={s.label}
                language={language}
                variant="bar"
                scaleMax={scaleMax}
              />
            </section>
          ))}
        </div>
      </Panel>
      <div className="report-finance-grid">
        <Panel
          title={ar ? 'تفاصيل قيمة الطلبات' : 'Placed order amount breakdown'}
          description={
            ar ? 'من الطلبات المقدمة خلال الفترة' : 'Orders placed in the selected period'
          }
        >
          <dl className="report-breakdown">
            {[
              ['subtotal', ar ? 'قيمة المنتجات قبل الكوبون' : 'Merchandise before coupon'],
              ['couponDiscountAmount', ar ? 'خصم الكوبون' : 'Coupon discount'],
              ['shippingFee', ar ? 'رسوم الشحن' : 'Shipping fees'],
              ['total', ar ? 'قيمة الطلبات المقدمة' : 'Placed order value'],
            ].map(([key, label]) => (
              <div key={key}>
                <dt>{label}</dt>
                <dd>
                  <bdi>{money(amounts[key])}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel
          title={ar ? 'تفاصيل علامات التحصيل' : 'Collection marker breakdown'}
          description={
            ar
              ? 'تشمل طلبات قُدمت خارج الفترة إذا سُجلت العلامة داخلها'
              : 'Includes orders placed outside the period when their marker falls inside it'
          }
        >
          <dl className="report-breakdown">
            <div>
              <dt>{ar ? 'إنستاباي تم التحقق منه' : 'InstaPay verified'}</dt>
              <dd>
                <bdi>{money(collections.instapayVerifiedAmount)}</bdi>
              </dd>
            </div>
            <div>
              <dt>{ar ? 'تحصيل الدفع عند الاستلام' : 'COD collected'}</dt>
              <dd>
                <bdi>{money(collections.codCollectedAmount)}</bdi>
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
      <Panel
        title={ar ? 'حسب وسيلة الدفع' : 'By payment method'}
        description={
          ar
            ? 'أعداد وقيم الطلبات حسب تاريخ التقديم؛ علامات التحصيل حسب تاريخ تسجيلها.'
            : 'Order counts and values use placement date; collection markers use their recording date.'
        }
      >
        <StaffTable
          rows={data.byPaymentMethod.map((row) => ({ ...row, id: row.method }))}
          empty=""
          columns={[
            {
              key: 'method',
              label: ar ? 'وسيلة الدفع' : 'Payment method',
              render: (row) =>
                row.method === 'cod'
                  ? ar
                    ? 'الدفع عند الاستلام'
                    : 'Cash on delivery'
                  : 'InstaPay',
            },
            {
              key: 'orderCount',
              label: ar ? 'طلبات مقدمة' : 'Orders placed',
              render: (row) => number(row.orderCount),
            },
            {
              key: 'orderAmount',
              label: ar ? 'قيمة الطلبات المقدمة' : 'Placed order value',
              render: (row) => <bdi>{money(row.orderAmount)}</bdi>,
            },
            {
              key: 'recordedCollectionAmount',
              label: ar ? 'علامات التحصيل المسجلة' : 'Recorded collection markers',
              render: (row) => <bdi>{money(row.recordedCollectionAmount)}</bdi>,
            },
          ]}
        />
      </Panel>
      <Panel
        title={ar ? 'حسب الحالة الحالية' : 'By current order status'}
        description={
          ar
            ? 'الطلبات المقدمة في الفترة. لا تُخصم الاستردادات من القيمة.'
            : 'Orders placed in the period. Values do not subtract refunds.'
        }
      >
        <StaffTable
          rows={data.byStatus.map((row) => ({ ...row, id: row.status }))}
          empty=""
          columns={[
            {
              key: 'status',
              label: ar ? 'الحالة الحالية' : 'Current status',
              render: (row) => orderStatusLabel(row.status, language),
            },
            {
              key: 'count',
              label: ar ? 'عدد الطلبات' : 'Orders',
              render: (row) => number(row.count),
            },
            {
              key: 'orderAmount',
              label: ar ? 'قيمة الطلبات' : 'Order value',
              render: (row) => <bdi>{money(row.orderAmount)}</bdi>,
            },
          ]}
        />
      </Panel>
    </>
  )
}
function Performance({ data, language, selection, onChange }) {
  const ar = language === 'ar',
    number = (v) => new Intl.NumberFormat(language).format(v),
    money = (v) => reportMoney(v, language)
  return (
    <>
      <div className="report-metrics">
        <Metric
          label={ar ? 'المنتجات المصنفة' : 'Ranked products'}
          value={number(data.pagination.total)}
          hint={ar ? 'منتجات مميزة في كل الصفحات' : 'Distinct products across all pages'}
        />
        <Metric
          label={ar ? 'الوحدات المسلّمة حاليًا' : 'Currently delivered units'}
          value={number(exactSum(data.categories, 'quantity'))}
          hint={ar ? 'من الطلبات المقدمة في الفترة' : 'From orders placed in the period'}
        />
        <Metric
          label={ar ? 'قيمة المنتجات بعد الكوبون' : 'Merchandise value after coupon'}
          value={money(exactSum(data.categories, 'merchandiseAmount'))}
          hint={ar ? 'كل المنتجات · لا تشمل الشحن' : 'All products · excludes shipping'}
        />
      </div>
      <Panel
        title={ar ? 'ترتيب المنتجات' : 'Product ranking'}
        description={
          ar
            ? 'طلبات قُدمت في الفترة وحالتها الحالية مسلّمة. إرجاع الطلب يغيّر ترتيب الفترة السابقة عند التحديث.'
            : 'Orders placed in the period and currently delivered. Returns change historical rankings when refreshed.'
        }
      >
        <div className="report-ranking-controls">
          <SelectField
            label={ar ? 'الترتيب حسب' : 'Rank by'}
            value={selection.rankBy}
            onChange={(event) => onChange({ rankBy: event.target.value, page: 1 })}
          >
            <option value="units">{ar ? 'الوحدات' : 'Units'}</option>
            <option value="merchandiseAmount">{ar ? 'قيمة المنتجات' : 'Merchandise value'}</option>
          </SelectField>
          <SelectField
            label={ar ? 'منتجات في الصفحة' : 'Products per page'}
            value={selection.limit}
            onChange={(event) => onChange({ limit: event.target.value, page: 1 })}
          >
            {[10, 20, 50, 100].map((limit) => (
              <option key={limit} value={limit}>
                {number(limit)}
              </option>
            ))}
          </SelectField>
        </div>
        <p className="staff-help">
          {ar
            ? 'الصور من الكتالوج الحالي؛ الأسماء من الطلبات المحفوظة.'
            : 'Photos are from the current catalog; names are saved order names.'}
        </p>
        <StaffTable
          rows={data.items.map((row) => ({ ...row, id: row.productId }))}
          empty={
            ar
              ? 'لا توجد منتجات في هذه الصفحة. غيّر الفترة أو ارجع إلى الصفحة الأولى.'
              : 'No products on this page. Change the period or return to page one.'
          }
          columns={[
            {
              key: 'rank',
              label: ar ? 'الترتيب' : 'Rank',
              render: (row) =>
                number(
                  (data.pagination.page - 1) * data.pagination.limit +
                    data.items.findIndex((item) => item.productId === row.productId) +
                    1,
                ),
            },
            {
              key: 'name',
              label: ar ? 'المنتج' : 'Product',
              render: (row) => <ProductName row={row} language={language} />,
            },
            {
              key: 'quantity',
              label: ar ? 'الوحدات' : 'Units',
              render: (row) => number(row.quantity),
            },
            {
              key: 'orderCount',
              label: ar ? 'طلبات تحتوي المنتج' : 'Orders containing product',
              render: (row) => number(row.orderCount),
            },
            {
              key: 'merchandiseAmount',
              label: ar ? 'قيمة المنتجات بعد الكوبون' : 'Merchandise after coupon',
              render: (row) => <bdi>{money(row.merchandiseAmount)}</bdi>,
            },
          ]}
        />
        <Pagination pagination={data.pagination} onPage={(page) => onChange({ page })} />
        {data.pagination.page > 1 && !data.items.length && (
          <Button variant="secondary" onClick={() => onChange({ page: 1 })}>
            {ar ? 'الصفحة الأولى' : 'First page'}
          </Button>
        )}
      </Panel>
      <Panel
        title={ar ? 'تفاصيل التصنيفات المحفوظة' : 'Historical category breakdown'}
        description={
          ar
            ? 'كل التصنيفات المباشرة في الطلبات المسلّمة؛ لا تتأثر بصفحة المنتجات.'
            : 'All direct category snapshots from delivered orders, independent of the product page.'
        }
      >
        <StaffTable
          rows={data.categories.map((row) => ({ ...row, id: row.categoryId || 'unknown' }))}
          empty={ar ? 'لا توجد تصنيفات في هذه الفترة.' : 'No category totals in this period.'}
          columns={[
            {
              key: 'name',
              label: ar ? 'التصنيف المحفوظ' : 'Historical category',
              render: (row) =>
                row.categoryId === null
                  ? ar
                    ? 'تصنيف تاريخي غير معروف'
                    : 'Unknown historical category'
                  : row.name,
            },
            {
              key: 'quantity',
              label: ar ? 'الوحدات' : 'Units',
              render: (row) => number(row.quantity),
            },
            {
              key: 'merchandiseAmount',
              label: ar ? 'قيمة المنتجات بعد الكوبون' : 'Merchandise after coupon',
              render: (row) => <bdi>{money(row.merchandiseAmount)}</bdi>,
            },
          ]}
        />
      </Panel>
    </>
  )
}
function ReportFailure({ read, language }) {
  const ar = language === 'ar',
    [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!read.retryAt) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [read.retryAt])
  const messages = {
    REPORT_BUSY: ar
      ? 'التقرير مشغول. اختر فترة أقصر أو أعد المحاولة.'
      : 'The report is busy. Choose a shorter period or try again.',
    REPORT_TOTAL_UNAVAILABLE: ar
      ? 'لا يمكن عرض الإجماليات بدقة. اختر فترة أقصر.'
      : 'Exact totals are unavailable. Choose a shorter period.',
    INVALID_REPORT: ar
      ? 'تعذر التحقق من بيانات التقرير. لم تُعرض إجماليات غير مؤكدة.'
      : 'The report response could not be verified. No uncertain totals are displayed.',
    REPORT_CHANGED: ar
      ? 'تغيّرت حالة طلب أثناء القراءة. حدّث التقرير.'
      : 'An order changed while the report was loading. Refresh the report.',
  }
  const forbidden = read.error.status === 403,
    wait = Math.max(0, Math.ceil(((read.retryAt || 0) - now) / 1000))
  return (
    <div className="report-failure">
      {messages[read.error.code] ? (
        <Feedback kind="error" title={messages[read.error.code]} />
      ) : (
        <StaffError error={read.error} />
      )}
      {forbidden ? (
        <Link to={`/${language}/dashboard/orders`}>
          {ar ? 'العودة إلى الطلبات' : 'Return to orders'}
        </Link>
      ) : (
        <Button variant="secondary" disabled={wait > 0} onClick={read.reload}>
          {wait
            ? ar
              ? `أعد المحاولة بعد ${wait} ثانية`
              : `Retry in ${wait} seconds`
            : ar
              ? 'إعادة المحاولة'
              : 'Try again'}
        </Button>
      )}
    </div>
  )
}
function AuthorizedReport({ kind }) {
  const { language } = useDashboard(),
    ar = language === 'ar',
    [params, setParams] = useSearchParams(),
    [defaults] = useState(defaultReportDates)
  const selection = {
    from: params.get('from') ?? defaults.from,
    through: params.get('through') ?? defaults.through,
    interval: params.get('interval') ?? 'day',
    rankBy: params.get('rankBy') ?? 'units',
    page: Number(params.get('page') ?? 1),
    limit: Number(params.get('limit') ?? 20),
  }
  let query,
    invalid = false
  try {
    if (
      !['day', 'week', 'month'].includes(selection.interval) ||
      !['units', 'merchandiseAmount'].includes(selection.rankBy) ||
      !Number.isSafeInteger(selection.page) ||
      selection.page < 1 ||
      selection.page > 100000 ||
      !Number.isSafeInteger(selection.limit) ||
      selection.limit < 1 ||
      selection.limit > 100
    )
      throw new RangeError()
    query = new URLSearchParams({
      ...reportRange(selection.from, selection.through),
      interval:
        selection.interval === 'week' && kind !== 'sales-performance' ? 'day' : selection.interval,
      ...(kind === 'sales-performance'
        ? { rankBy: selection.rankBy, page: String(selection.page), limit: String(selection.limit) }
        : {}),
    })
  } catch {
    invalid = true
  }
  const read = useReport(invalid ? null : `/reports/${kind}?${query}`),
    titles = {
      overview: ar ? 'نظرة عامة على المتجر' : 'Store overview',
      finance: ar ? 'الإيرادات والمالية' : 'Revenue & finance',
      'sales-performance': ar ? 'أداء المبيعات' : 'Sales performance',
    }
  const change = (next) =>
    setParams({
      ...selection,
      ...next,
      page: String(next.page ?? selection.page),
      limit: String(next.limit ?? selection.limit),
    })
  const commonQuery = new URLSearchParams({
    from: selection.from,
    through: selection.through,
    interval: selection.interval,
  })
  const data =
    read.data && selection.interval === 'week' && read.data.trend
      ? { ...read.data, trend: sundayWeeks(read.data.trend) }
      : read.data
  return (
    <div className="reports">
      <StaffHeading
        title={titles[kind]}
        description={
          ar
            ? 'تقارير المتجر بالجنيه المصري، حسب تقويم القاهرة.'
            : 'Store reports in EGP, using the Cairo calendar.'
        }
        action={
          <Button
            variant="secondary"
            disabled={read.loading || invalid || !!read.error}
            onClick={read.reload}
          >
            {ar ? 'تحديث التقرير' : 'Refresh report'}
          </Button>
        }
      />
      <PeriodForm
        key={`${selection.from}:${selection.through}:${selection.interval}`}
        selection={selection}
        language={language}
        onApply={(next) => change({ ...next, page: 1 })}
      />
      {invalid && (
        <Feedback
          kind="error"
          title={
            ar
              ? 'الفترة أو إعدادات الرابط غير صحيحة. اختر فترة صالحة لا تتجاوز ٣٦٦ يومًا فعليًا.'
              : 'The period or URL settings are invalid. Choose a valid period of at most 366 elapsed days.'
          }
          action={
            <Button variant="secondary" onClick={() => setParams({})}>
              {ar ? 'إعادة ضبط الفترة' : 'Reset period'}
            </Button>
          }
        />
      )}
      {read.loading && (
        <Feedback kind="loading" title={ar ? 'جارٍ تحميل التقرير' : 'Loading report'} />
      )}
      {read.error && <ReportFailure read={read} language={language} />}
      {read.data && (
        <>
          {kind === 'overview' ? (
            <Overview
              key={selection.interval}
              data={data}
              language={language}
              query={commonQuery}
            />
          ) : kind === 'finance' ? (
            <Finance key={selection.interval} data={data} language={language} />
          ) : (
            <Performance
              data={read.data}
              language={language}
              selection={selection}
              onChange={change}
            />
          )}
          <footer className="report-footnotes">
            <p>
              {ar ? 'وقت إنشاء هذه القراءة' : 'This read generated'}:{' '}
              <time dateTime={read.data.meta.generatedAt}>
                {reportDate(read.data.meta.generatedAt, language, true)}
              </time>{' '}
              · {ar ? 'القاهرة' : 'Cairo'}
            </p>
            <details>
              <summary>{ar ? 'كيف تُقرأ هذه التقارير' : 'How to read these reports'}</summary>
              <ul>
                <li>
                  {ar
                    ? 'علامات التحصيل والاسترداد توثّق إجراءات الموظفين. لا تثبت حركة الأموال أو التسوية البنكية.'
                    : 'Collection and refund markers record staff actions. They do not confirm money transfers or bank settlement.'}
                </li>
                <li>
                  {ar
                    ? 'الحالات هي الحالة الحالية. ترتيب المنتجات يشمل الطلبات المسلّمة حاليًا حسب تاريخ تقديمها، وقد يتغيّر بعد الإرجاع.'
                    : 'Statuses are current. Product rankings use currently delivered orders by placement date and can change after returns.'}
                </li>
                <li>
                  {ar
                    ? 'التصنيفات التاريخية المفقودة تظهر كغير معروفة.'
                    : 'Missing historical category snapshots appear as unknown.'}
                </li>
                <li>
                  {ar
                    ? 'التصنيفات مباشرة من الطلبات، دون تجميع التصنيفات الرئيسية أو استبدالها بتصنيفات الكتالوج الحالي.'
                    : 'Categories are direct snapshots from orders, without parent rollups or replacement by current catalog categories.'}
                </li>
              </ul>
              <p>
                {ar
                  ? 'كل شاشة قراءة مستقلة. التحديث اليدوي يجلب أحدث قراءة؛ لا توجد لقطة مشتركة ثابتة بين التقارير.'
                  : 'Each report is a separate read. Manual refresh gets a new read; reports do not share a frozen snapshot.'}
              </p>
            </details>
          </footer>
        </>
      )}
    </div>
  )
}
export function DashboardReport({ kind }) {
  const { user, language } = useDashboard()
  return ['admin', 'superAdmin'].includes(user.role) ? (
    <AuthorizedReport key={kind} kind={kind} />
  ) : (
    <Navigate to={`/${language}/dashboard/orders`} replace />
  )
}
