import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  MoreHorizontal,
  Replace,
  FlipHorizontal2,
  FlipVertical2,
} from 'lucide-react'
import { useState } from 'react'

interface FloatingActionsProps {
  visible: boolean
  onReplace?: () => void
  onForward?: () => void
  onBackward?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onFlipH?: () => void
  onFlipV?: () => void
}

export default function FloatingActions({
  visible,
  onReplace,
  onForward,
  onBackward,
  onDuplicate,
  onDelete,
  onFlipH,
  onFlipV,
}: FloatingActionsProps) {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <TooltipProvider delayDuration={200}>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="floating-actions relative"
          >
            {onReplace && (
              <ActionBtn icon={Replace} label="Replace" onClick={onReplace} />
            )}
            {onForward && (
              <ActionBtn icon={ArrowUp} label="Forward" onClick={onForward} />
            )}
            {onBackward && (
              <ActionBtn icon={ArrowDown} label="Backward" onClick={onBackward} />
            )}
            {onDuplicate && (
              <ActionBtn icon={Copy} label="Duplicate" onClick={onDuplicate} />
            )}
            {onDelete && (
              <ActionBtn icon={Trash2} label="Delete" onClick={onDelete} destructive />
            )}

            {(onFlipH || onFlipV) && (
              <div className="relative">
                <ActionBtn
                  icon={MoreHorizontal}
                  label="More"
                  onClick={() => setMoreOpen(!moreOpen)}
                />
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 flex gap-0.5 p-1 rounded-md bg-card border border-border shadow-md"
                    >
                      {onFlipH && (
                        <ActionBtn
                          icon={FlipHorizontal2}
                          label="Flip Horizontal"
                          onClick={() => { onFlipH(); setMoreOpen(false) }}
                        />
                      )}
                      {onFlipV && (
                        <ActionBtn
                          icon={FlipVertical2}
                          label="Flip Vertical"
                          onClick={() => { onFlipV(); setMoreOpen(false) }}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  )
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: typeof Replace
  label: string
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={`icon-btn w-7 h-7 ${destructive ? 'hover:!bg-destructive/20 hover:!text-destructive' : ''}`}
        >
          <Icon size={14} strokeWidth={1.8} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}
