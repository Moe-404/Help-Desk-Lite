export default function Avatar({ initials, tone = 'blue', size = 'md', online = false }) {
  return (
    <span className={`avatar avatar-${tone} avatar-${size}`} aria-label={initials}>
      {initials}
      {online && <i className="online-dot" />}
    </span>
  )
}
