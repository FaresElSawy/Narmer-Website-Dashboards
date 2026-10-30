function FormShapes() {
  return (
    <div className="skeleton-fields">
      {[0, 1, 2, 3].map((field) => (
        <div className="skeleton-field" key={field}>
          <span className="skeleton-block skeleton-label" />
          <span className="skeleton-block skeleton-input" />
        </div>
      ))}
      <span className="skeleton-block skeleton-button" />
    </div>
  )
}

export function Skeleton({ title, variant = 'content' }) {
  return (
    <div
      className={`skeleton skeleton--${variant}`}
      role="status"
      aria-label={title}
      aria-busy="true"
    >
      <div className="skeleton-shapes" aria-hidden="true">
        {variant !== 'image' && (
          <div className="skeleton-heading">
            <span className="skeleton-block skeleton-title" />
            <span className="skeleton-block skeleton-copy" />
          </div>
        )}
        {variant === 'image' ? (
          <div className="skeleton-block skeleton-image" />
        ) : variant === 'product' ? (
          <div className="skeleton-product">
            <div className="skeleton-block skeleton-image" />
            <FormShapes />
          </div>
        ) : variant === 'form' ? (
          <FormShapes />
        ) : variant === 'cards' ? (
          <div className="skeleton-cards">
            {[0, 1, 2].map((card) => (
              <div className="skeleton-card" key={card}>
                <span className="skeleton-block skeleton-image" />
                <span className="skeleton-block skeleton-copy" />
                <span className="skeleton-block skeleton-label" />
              </div>
            ))}
          </div>
        ) : (
          <div className="skeleton-rows">
            {[0, 1, 2, 3].map((row) => (
              <div className="skeleton-row" key={row}>
                <span className="skeleton-block skeleton-copy" />
                <span className="skeleton-block skeleton-copy" />
                <span className="skeleton-block skeleton-copy" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
