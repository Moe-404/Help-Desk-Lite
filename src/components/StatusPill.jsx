export default function StatusPill({ value }) {
  const className = value.toLowerCase().replaceAll(' ', '-')
  return <span className={`pill pill-${className}`}>{value}</span>
}
