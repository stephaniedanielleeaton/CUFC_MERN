import { useState, useId } from 'react'
import type { DailyAttendanceSummary } from '../../../services/analyticsService'

interface AttendanceChartProps {
  data: DailyAttendanceSummary[]
  dayColors: string[]
  formatDate: (dateStr: string) => string
  formatFullDate: (dateStr: string) => string
}

const CHART_HEIGHT = 240
const PADDING = { top: 16, right: 8, bottom: 40, left: 40 }
const PX_PER_DATAPOINT = 4

export default function AttendanceChart({ data, dayColors, formatDate, formatFullDate }: Readonly<AttendanceChartProps>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const gradientId = useId()

  if (data.length === 0) return null

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const yTicks = 5
  const yMax = Math.ceil(maxCount / yTicks) * yTicks

  const chartWidth = Math.max(600, data.length * PX_PER_DATAPOINT)
  const chartInnerWidth = chartWidth - PADDING.left - PADDING.right
  const chartInnerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const xDivisor = data.length > 1 ? data.length - 1 : 1
  const xScale = (index: number) => PADDING.left + (index / xDivisor) * chartInnerWidth
  const yScale = (count: number) => PADDING.top + chartInnerHeight - (count / yMax) * chartInnerHeight

  // Build line path
  const linePath = data
    .map((d, i) => {
      const x = xScale(i)
      const y = yScale(d.count)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  // Build area path (line + close at bottom)
  const areaPath = `${linePath} L ${xScale(data.length - 1)} ${PADDING.top + chartInnerHeight} L ${PADDING.left} ${PADDING.top + chartInnerHeight} Z`

  const hoverData = hoveredIndex === null ? null : data[hoveredIndex]
  const hoverX = hoveredIndex === null ? 0 : xScale(hoveredIndex)
  const hoverY = hoveredIndex === null || hoverData === null ? 0 : yScale(hoverData.count)

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${CHART_HEIGHT}`}
          className="w-full min-w-[600px]"
          style={{ height: CHART_HEIGHT }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: yTicks + 1 }).map((_unused, i) => {
            const y = PADDING.top + (i / yTicks) * chartInnerHeight
            const value = Math.round(yMax - (i / yTicks) * yMax)
            return (
              <g key={'grid-' + value}>
                <line
                  x1={PADDING.left}
                  y1={y}
                  x2={chartWidth - PADDING.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  strokeDasharray={i === yTicks ? '' : '4 4'}
                />
                <text
                  x={PADDING.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="#9ca3af"
                >
                  {String(value)}
                </text>
              </g>
            )
          })}

          {/* Area fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Line stroke */}
          <path
            d={linePath}
            fill="none"
            stroke="#a855f7"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((d, i) => {
            const x = xScale(i)
            const y = yScale(d.count)
            const isHovered = hoveredIndex === i
            return (
              <circle
                key={d.date}
                cx={x}
                cy={y}
                r={isHovered ? 5 : 3}
                fill={isHovered ? '#7e22ce' : dayColors[d.dayOfWeek]}
                stroke="#fff"
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
              />
            )
          })}

          {/* X-axis labels (show every Nth label to avoid overlap) */}
          {(() => {
            const step = Math.ceil(data.length / 12)
            return data.map((d, i) => {
              if (i % step !== 0 && i !== data.length - 1) return null
              const x = xScale(i)
              return (
                <text
                  key={d.date}
                  x={x}
                  y={CHART_HEIGHT - 8}
                  textAnchor={(() => {
                    if (i === 0) return 'start'
                    if (i === data.length - 1) return 'end'
                    return 'middle'
                  })()}
                  fontSize={9}
                  fill="#9ca3af"
                  transform={`rotate(-35, ${x}, ${CHART_HEIGHT - 8})`}
                >
                  {formatDate(d.date)}
                </text>
              )
            })
          })()}

          {/* Hover crosshair */}
          {hoverData !== null && (
            <g>
              <line
                x1={hoverX}
                y1={PADDING.top}
                x2={hoverX}
                y2={PADDING.top + chartInnerHeight}
                stroke="#d1d5db"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <line
                x1={PADDING.left}
                y1={hoverY}
                x2={chartWidth - PADDING.right}
                y2={hoverY}
                stroke="#d1d5db"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Tooltip */}
      {hoverData !== null && (
        <div
          className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none z-10"
          style={{
            left: `${Math.min(
              Math.max((hoverX / chartWidth) * 100, 8),
              92
            )}%`,
            top: `${Math.max((hoverY / CHART_HEIGHT) * 100 - 12, 2)}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold">{formatFullDate(hoverData.date)}</div>
          <div className="text-gray-300">
            {hoverData.dayName} — {hoverData.count} check-in{hoverData.count === 1 ? '' : 's'}
          </div>
        </div>
      )}
    </div>
  )
}
