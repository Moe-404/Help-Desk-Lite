import { Headphones } from 'lucide-react'

export default function Brand({ compact = false }) {
  return (
    <div className="brand">
      <span className="brand-mark"><Headphones size={19} strokeWidth={2.4} /></span>
      {!compact && <span>HelpDesk <b>Lite</b></span>}
    </div>
  )
}
