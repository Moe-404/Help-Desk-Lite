import { trendData } from '../data'

function points(key) {
  const max = 90
  return trendData.map((item, index) => `${index * (600 / 6)},${180 - (item[key] / max) * 150}`).join(' ')
}

export default function TrendChart() {
  return (
    <div className="trend-chart" aria-label="Weekly incoming and resolved ticket trend chart">
      <svg viewBox="0 0 600 200" role="img" preserveAspectRatio="none">
        <defs>
          <linearGradient id="incomingFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#39ff14" stopOpacity=".2" />
            <stop offset="1" stopColor="#39ff14" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="resolvedFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#00f0ff" stopOpacity=".2" />
            <stop offset="1" stopColor="#00f0ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[40, 80, 120, 160].map(y => <line key={y} x1="0" x2="600" y1={y} y2={y} className="chart-grid" />)}
        <polygon points={`0,180 ${points('incoming')} 600,180`} fill="url(#incomingFill)" />
        <polygon points={`0,180 ${points('resolved')} 600,180`} fill="url(#resolvedFill)" />
        <polyline points={points('incoming')} className="line incoming-line" />
        <polyline points={points('resolved')} className="line resolved-line" />
        {trendData.map((item, index) => (
          <g key={item.day}>
            <circle cx={index * 100} cy={180 - (item.incoming / 90) * 150} r="4" className="incoming-dot"><title>{item.incoming} incoming</title></circle>
            <circle cx={index * 100} cy={180 - (item.resolved / 90) * 150} r="4" className="resolved-dot"><title>{item.resolved} resolved</title></circle>
          </g>
        ))}
      </svg>
      <div className="chart-labels">{trendData.map(item => <span key={item.day}>{item.day}</span>)}</div>
    </div>
  )
}
