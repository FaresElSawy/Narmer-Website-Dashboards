import { useState } from 'react'
import { useLocale } from './Locale.jsx'
import { Button, Modal } from './Primitives.jsx'
import '../assets/css/size-guide.css'

export function SizeGuide({ chart }) {
  const language = useLocale(),
    ar = language === 'ar',
    [open, setOpen] = useState(false),
    [failedImage, setFailedImage] = useState(null)
  if (!chart || (!chart.measurements?.rows?.length && !chart.image?.url)) return null
  const labels = ar ? ['المقاس', 'الصدر', 'الطول', 'الكم'] : ['Size', 'Chest', 'Length', 'Sleeve']
  return (
    <>
      <Button
        variant="secondary"
        className="size-guide-trigger"
        onClick={(event) => {
          event.currentTarget.focus()
          setOpen(true)
        }}
      >
        {ar ? 'دليل المقاسات' : 'Size guide'}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={chart.name || (ar ? 'دليل المقاسات' : 'Size guide')}
        className="size-guide"
      >
        {open &&
          (chart.measurements?.rows?.length ? (
            <>
              <p>{ar ? 'القياسات بالسنتيمتر.' : 'Measurements in centimetres.'}</p>
              <table>
                <thead>
                  <tr>
                    {labels.map((label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chart.measurements.rows.map((row, index) => (
                    <tr key={`${row.size}-${index}`}>
                      <th scope="row">{row.size}</th>
                      {['chest', 'length', 'sleeve'].map((key) => (
                        <td key={key}>
                          {row[key].toLocaleString(language, { maximumFractionDigits: 2 })}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : failedImage === chart.image.url ? (
            <p role="status">
              {ar ? 'تعذر تحميل صورة دليل المقاسات.' : 'The size-guide image could not be loaded.'}
            </p>
          ) : (
            <img
              src={chart.image.url}
              width={chart.image.width}
              height={chart.image.height}
              alt={chart.alt || chart.name}
              onError={() => setFailedImage(chart.image.url)}
            />
          ))}
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {ar ? 'إغلاق دليل المقاسات' : 'Close size guide'}
        </Button>
      </Modal>
    </>
  )
}
