import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'

interface SlidingPanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  searchable?: boolean
  headerRight?: ReactNode
}

export default function SlidingPanel({
  open,
  onClose,
  title,
  children,
  searchable = false,
  headerRight,
}: SlidingPanelProps) {
  const { searchQuery, setSearchQuery } = useEditorStore()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="h-full overflow-hidden flex flex-col editor-panel shrink-0"
        >
          {/* Sticky Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border sticky top-0 z-10 bg-card">
            <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
            <div className="flex items-center gap-1">
              {headerRight}
              <button
                onClick={onClose}
                className="icon-btn w-7 h-7"
                title="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Sticky Search */}
          {searchable && (
            <div className="px-3 py-2 border-b border-border sticky top-[41px] z-10 bg-card">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-input border border-border">
                <Search size={13} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
