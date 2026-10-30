import { CheckIcon } from './Icons'
import { MysteryBox } from './MysteryBox'

/**
 * Product page panel: what a buyer knows for certain, and what stays a surprise.
 * Every line is either read from the product (its count, category and size name) or is wording already on the live Rade Street pages.
 * The count comes from the title, as in "Peplos Round Neck T-Shirt (5 T-Shirts)"; a title without one just leaves that line out.
 */
export function MysteryPanel({ title, productType, optionName }: { title: string; productType: string; optionName: string }) {
  const count = title.match(/\((\d+)\s+([^)]+)\)/)
  const known = [
    count ? { strong: `${count[1]} ${count[2].trim()}`, rest: 'inside this bundle' } : null,
    productType.trim() ? { strong: productType.trim(), rest: 'is the bundle type' } : null,
    { strong: `Your ${optionName.toLowerCase()}`, rest: 'you pick before you buy' },
    { strong: 'Brand new', rest: 'every item is sealed and quality checked' },
  ].filter((k): k is { strong: string; rest: string } => k !== null)

  return (
    <section className="mys" aria-labelledby="mys-h">
      <div className="mys-head">
        <p className="sec-eyebrow">Mystery bundle</p>
        <h2 id="mys-h">What&apos;s in the box?</h2>
      </div>
      <div className="mys-grid">
        <div className="mys-know">
          <p className="mys-tag">What you know</p>
          <ul>
            {known.map((k) => (
              <li key={k.strong}>
                <span className="mys-tick"><CheckIcon size={16} /></span>
                <span><b>{k.strong}</b> {k.rest}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mys-secret">
          <div className="mys-secret-copy">
            <p className="mys-tag">Stays secret</p>
            <h3>The surprise</h3>
            <p>The designs, colours and prints are revealed only when you open the bundle.</p>
            <ul className="mys-chips">
              <li>Designs <i>?</i></li>
              <li>Colours <i>?</i></li>
              <li>Prints <i>?</i></li>
            </ul>
            <p className="mys-reveal">The reveal is the best part.</p>
          </div>
          <MysteryBox />
        </div>
      </div>
    </section>
  )
}
