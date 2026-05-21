import { Undo2, Redo2, ZoomOut, ZoomIn, Download, Film } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEditorStore } from '@/store/editorStore'
import { useTimelineStore } from '@/store/timelineStore'
import { useState } from 'react'

interface HeaderProps {
  onExport: () => void
}

const ZOOM_LEVELS = ['10%', '25%', '50%', '75%', '100%', 'Fit'] as const

export default function Header({ onExport }: HeaderProps) {
  const { undo, redo, undoStack, redoStack } = useEditorStore()
  const { tracks } = useTimelineStore()
  const [zoomLevel, setZoomLevel] = useState<string>('Fit')
  const [zoomOpen, setZoomOpen] = useState(false)

  const hasTimelineItems = tracks.some(t => t.clips.length > 0)

  return (
    <TooltipProvider delayDuration={300}>
      <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border bg-card">
        {/* Left: Brand + Undo / Redo */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <Film size={14} />
            </div>
            Video Editor
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Undo2 size={14} strokeWidth={2} />
                  Undo
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Undo last action</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Redo2 size={14} strokeWidth={2} />
                  Redo
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Redo last action</p></TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Right: Zoom + Export */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-0 rounded-md border border-border overflow-hidden bg-secondary/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="icon-btn w-7 h-7 rounded-none border-r border-border">
                  <ZoomOut size={14} strokeWidth={1.8} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Zoom Out</p></TooltipContent>
            </Tooltip>

            <div className="relative">
              <button
                onClick={() => setZoomOpen(!zoomOpen)}
                className="px-3 h-7 text-xs font-medium hover:bg-muted transition-colors min-w-[50px] text-center"
              >
                {zoomLevel}
              </button>
              {zoomOpen && (
                <div className="absolute top-full right-0 mt-1 py-1 bg-card border border-border rounded-md shadow-lg z-50 min-w-[80px]">
                  {ZOOM_LEVELS.map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        setZoomLevel(level)
                        setZoomOpen(false)
                      }}
                      className={`w-full px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors ${
                        zoomLevel === level ? 'text-accent font-medium' : ''
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button className="icon-btn w-7 h-7 rounded-none border-l border-border">
                  <ZoomIn size={14} strokeWidth={1.8} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Zoom In</p></TooltipContent>
            </Tooltip>
          </div>

          {/* Export */}
          <Button
            size="sm"
            onClick={onExport}
            disabled={!hasTimelineItems}
            className="h-8 px-4 gap-2 text-xs font-semibold rounded-md bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Download size={14} />
            Export
          </Button>
        </div>
      </header>
    </TooltipProvider>
  )
}
