/**
 * The tilted, endlessly looping slogan band. The track holds two identical halves and slides left by exactly one half,
 * so the loop restarts on the same picture and never jumps. Each half repeats the slogans until it is wider than any screen.
 */
export function MarqueeBand({ items }: { items: string[] }) {
  const half = Array.from({ length: Math.ceil(12 / Math.max(items.length, 1)) }, () => items).flat()
  return (
    <div className="marquee-band">
      <div className="marquee-track">
        {[0, 1].map((h) => (
          <div key={h} className="marquee-half">
            {half.map((text, i) => (
              <span key={i} className="marquee-item">
                {text.split(/\s+/).map((word, j) => <b key={j} className={j % 2 ? 'alt' : undefined}>{word}</b>)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
