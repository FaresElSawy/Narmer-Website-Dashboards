import { useLocale } from '../../../../shared/ui/Locale.jsx'
import { optionVariant } from './catalog.js'

// shortcut: color names have no API swatch values; use a neutral fallback for unknown names.
const swatches = {
  beige: '#b8ac94',
  brown: '#604536',
  black: '#232323',
  white: '#fff',
  navy: '#173345',
  blue: '#6387aa',
  green: '#28564b',
  olive: '#394d3d',
  ivory: '#eee8dc',
  pink: '#d03f79',
  red: '#a83232',
  grey: '#929292',
  gray: '#929292',
}

export function ProductOptions({ product, values, onChange, disabled = false }) {
  const ar = useLocale() === 'ar'
  return product.options?.map((option) => (
    <fieldset
      className={`product-options${option.key === 'color' ? ' product-colors' : ''}`}
      key={option.key}
      disabled={disabled}
    >
      <legend>
        {option.name}
        {option.key === 'color' &&
          `: ${option.values.find((value) => value.key === values[option.key])?.name || ''}`}
      </legend>
      <div>
        {option.values.map((value) => {
          const possible = product.variants.some(
            (variant) =>
              variant.stock > 0 &&
              variant.values[option.key] === value.key &&
              (option.key === 'color' ||
                Object.entries(values).every(
                  ([key, selected]) => key === option.key || variant.values[key] === selected,
                )),
          )
          return (
            <button
              type="button"
              key={value.key}
              aria-pressed={values[option.key] === value.key}
              data-unavailable={!possible}
              disabled={disabled || (option.key !== 'color' && !possible)}
              onClick={() =>
                onChange(
                  optionVariant(product, values, option.key, value.key)?.values || {
                    ...values,
                    [option.key]: value.key,
                  },
                  option.key,
                )
              }
            >
              {option.key === 'color' && (
                <span
                  className="color-swatch"
                  aria-hidden="true"
                  style={{ '--swatch': swatches[value.key.toLowerCase()] || '#d1d4d3' }}
                />
              )}
              {value.name}
              {!possible && (
                <span className="sr-only">
                  {ar ? ' - تركيبة غير متاحة' : ' - combination unavailable'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  ))
}
