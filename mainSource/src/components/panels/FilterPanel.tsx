import { useFilterStore } from '@/store/filterStore'
import { RotateCcw } from 'lucide-react'

const FILTER_DEFS = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, unit: '%', default: 100 },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%', default: 100 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, unit: '%', default: 100 },
  { key: 'blur', label: 'Blur', min: 0, max: 20, unit: 'px', default: 0 },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100, unit: '%', default: 0 },
  { key: 'grayscale', label: 'Grayscale', min: 0, max: 100, unit: '%', default: 0 },
  { key: 'hueRotate', label: 'Hue Rotate', min: 0, max: 360, unit: '°', default: 0 },
  { key: 'invert', label: 'Invert', min: 0, max: 100, unit: '%', default: 0 },
]

export default function FilterPanel() {
  const { filterValues, setFilterValue, reset } = useFilterStore()

  const isModified = FILTER_DEFS.some(
    (f) => (filterValues[f.key] ?? f.default) !== f.default
  )

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold block">Filters & Effects</span>
          <span className="text-[9px] text-muted-foreground">
            Adjust filters to see real-time changes on the video preview.
          </span>
        </div>
        {isModified && (
          <button
            onClick={reset}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-accent hover:bg-accent/10 transition-colors"
          >
            <RotateCcw size={10} /> Reset All
          </button>
        )}
      </div>

      <div className="space-y-3">
        {FILTER_DEFS.map((filter) => {
          const value = filterValues[filter.key] ?? filter.default
          const changed = value !== filter.default

          return (
            <div key={filter.key}>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-[11px] font-medium ${changed ? 'text-accent' : ''}`}>
                  {filter.label}
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {filter.key === 'blur' ? value.toFixed(0) : Math.round(value)}{filter.unit}
                  </span>
                  {changed && (
                    <button
                      onClick={() => setFilterValue(filter.key, filter.default)}
                      className="icon-btn w-4 h-4"
                      title="Reset"
                    >
                      <RotateCcw size={8} />
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={filter.min}
                max={filter.max}
                step={filter.key === 'blur' ? 0.5 : 1}
                value={value}
                onChange={(e) => setFilterValue(filter.key, parseFloat(e.target.value))}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
