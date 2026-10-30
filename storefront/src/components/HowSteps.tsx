import { BoxIcon, GiftIcon, TagIcon, TruckIcon } from './Icons'

export type HowStep = { title: string; text: string }

const ICONS = [TagIcon, BoxIcon, TruckIcon, GiftIcon]

/** The four "how it works" steps as a row of glass cards: an icon badge, the step number, and the admin's title and text. */
export function HowSteps({ steps }: { steps: HowStep[] }) {
  return (
    <ol className="how-steps">
      {steps.map((s, i) => {
        const Icon = ICONS[i % ICONS.length]
        return (
          <li className="how-step" key={i}>
            <span className="how-step-icon" aria-hidden="true"><Icon size={26} /></span>
            <span className="how-step-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        )
      })}
    </ol>
  )
}
