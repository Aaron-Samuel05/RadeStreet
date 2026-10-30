/** Thin-stroke icons drawn to one 24px grid so they sit together. Decorative: callers label the control. */
type P = { size?: number }
const svg = (size: number, d: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)

export const SearchIcon = ({ size = 20 }: P) => svg(size, <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>)
export const UserIcon = ({ size = 20 }: P) => svg(size, <><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20.5c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></>)
export const BagIcon = ({ size = 20 }: P) => svg(size, <><path d="M5 8h14l-1 12.5H6L5 8Z" /><path d="M9 10V6.5a3 3 0 0 1 6 0V10" /></>)
export const HeartIcon = ({ size = 20 }: P) => svg(size, <path d="M12 20s-7.5-4.4-7.5-10.1A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 2.3C19.5 15.6 12 20 12 20Z" />)
export const MenuIcon = ({ size = 22 }: P) => svg(size, <><path d="M3.5 8h17" /><path d="M3.5 16h11" /></>)
export const CloseIcon = ({ size = 22 }: P) => svg(size, <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>)
export const ArrowIcon = ({ size = 16 }: P) => svg(size, <><path d="M4 12h15" /><path d="m13.5 6.5 5.5 5.5-5.5 5.5" /></>)
export const TruckIcon = ({ size = 24 }: P) => svg(size, <><path d="M2.5 6.5h11v10h-11z" /><path d="M13.5 10h4l3 3.2v3.3h-7" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>)
export const TagIcon = ({ size = 24 }: P) => svg(size, <><path d="M3.5 12.2V4.5h7.7l9.3 9.3-7.7 7.7-9.3-9.3Z" /><circle cx="8" cy="9" r="1.4" /></>)
export const ShieldIcon = ({ size = 24 }: P) => svg(size, <><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6L12 3Z" /><path d="m8.8 12 2.2 2.2 4.2-4.4" /></>)
export const SparkIcon = ({ size = 24 }: P) => svg(size, <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6.3 6.3 2.3 2.3M15.4 15.4l2.3 2.3M6.3 17.7l2.3-2.3M15.4 8.6l2.3-2.3" /></>)
export const BoxIcon = ({ size = 24 }: P) => svg(size, <><path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z" /><path d="M3.5 7.5 12 11.5l8.5-4M12 11.5v9" /></>)
export const CalendarIcon = ({ size = 24 }: P) => svg(size, <><rect x="3.5" y="5" width="17" height="15.5" rx="1" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>)
export const SlidersIcon = ({ size = 18 }: P) => svg(size, <><path d="M4 7h9M17 7h3" /><circle cx="15" cy="7" r="2" /><path d="M4 17h3M11 17h9" /><circle cx="9" cy="17" r="2" /></>)
export const CheckIcon = ({ size = 24 }: P) => svg(size, <path d="m5 12.5 4.5 4.5L19 7.5" />)
export const ClockIcon = ({ size = 24 }: P) => svg(size, <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>)
export const CardIcon = ({ size = 24 }: P) => svg(size, <><rect x="3" y="6" width="18" height="12.5" rx="2" /><path d="M3 10.5h18M7 15h3.5" /></>)
export const GiftIcon = ({ size = 24 }: P) => svg(size, <><rect x="4" y="9.5" width="16" height="10.5" rx="1" /><path d="M3 9.5h18M12 9.5V20M12 9.5C10 9.5 7.5 8.5 7.5 6.6 7.5 5 9 4.3 10.2 5c1.2.7 1.8 2.4 1.8 4.5ZM12 9.5c2 0 4.5-1 4.5-2.9 0-1.6-1.5-2.3-2.7-1.6-1.2.7-1.8 2.4-1.8 4.5Z" /></>)
export const ChevronIcon = ({ size = 24 }: P) => svg(size, <path d="m6 9 6 6 6-6" />)
