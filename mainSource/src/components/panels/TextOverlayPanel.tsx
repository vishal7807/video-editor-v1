import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOverlayStore } from '@/store/overlayStore'
import { useEditorStore } from '@/store/editorStore'
import { Label } from '@/components/ui/label'
import { Trash2, Edit2, X } from 'lucide-react'

const TEXT_STYLES = [
  { id: 'title', label: 'Title', fontSize: 48, fontFamily: 'Inter', fontWeight: 700, preview: 'Title' },
  { id: 'heading', label: 'Heading', fontSize: 32, fontFamily: 'Inter', fontWeight: 600, preview: 'Heading' },
  { id: 'paragraph', label: 'Paragraph', fontSize: 18, fontFamily: 'Inter', fontWeight: 400, preview: 'Paragraph' },
  { id: 'caption', label: 'Caption', fontSize: 14, fontFamily: 'Inter', fontWeight: 400, preview: 'Caption' },
  { id: 'bold', label: 'Bold', fontSize: 28, fontFamily: 'Inter', fontWeight: 800, preview: 'Bold' },
  { id: 'script', label: 'Script', fontSize: 28, fontFamily: 'Georgia', fontWeight: 400, preview: 'Script' },
]

const TEXT_DESIGNS = [
  { id: 'd1', label: 'Neon', color: '#00ff88', bg: 'transparent', shadow: true },
  { id: 'd2', label: 'Classic', color: '#ffffff', bg: 'transparent', shadow: true },
  { id: 'd3', label: 'Dark', color: '#1a1a2e', bg: '#ffffff', shadow: false },
  { id: 'd4', label: 'Accent', color: '#99b3ff', bg: 'transparent', shadow: true },
]

const FONT_FAMILIES = ['Inter', 'Georgia', 'Courier New', 'Times New Roman', 'Verdana', 'Impact', 'Arial']

export default function TextOverlayPanel() {
  const {
    textOverlays, addTextOverlay, removeTextOverlay, updateTextOverlay,
    selectedOverlayId, setSelectedOverlayId,
  } = useOverlayStore()
  const { currentTime, videoMetadata, setSidePanelOpen, setActiveTool, setSelectedElementType } = useEditorStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleAddStyle = (style: typeof TEXT_STYLES[0]) => {
    const id = `text-${Date.now()}`
    addTextOverlay({
      id,
      text: style.preview,
      x: 50,
      y: 50,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      color: '#ffffff',
      rotation: 0,
      opacity: 1,
      startTime: currentTime,
      duration: Math.min(5, (videoMetadata?.duration || 10) - currentTime),
    })
    setSelectedOverlayId(id)
    setSelectedElementType('text')
    // Close panel so user can see text on preview
    setSidePanelOpen(false)
    setActiveTool(null)
  }

  const handleAddDesign = (design: typeof TEXT_DESIGNS[0]) => {
    const id = `text-${Date.now()}`
    addTextOverlay({
      id,
      text: design.label,
      x: 50,
      y: 50,
      fontSize: 32,
      fontFamily: 'Inter',
      color: design.color,
      rotation: 0,
      opacity: 1,
      startTime: currentTime,
      duration: Math.min(5, (videoMetadata?.duration || 10) - currentTime),
    })
    setSelectedOverlayId(id)
    setSelectedElementType('text')
    setSidePanelOpen(false)
    setActiveTool(null)
  }

  const editOverlay = editingId ? textOverlays.find((o) => o.id === editingId) : null

  return (
    <div className="p-3 space-y-4">
      {/* Text Styles */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold">Text</span>
          <span className="text-[10px] text-muted-foreground">More ({TEXT_STYLES.length})</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {TEXT_STYLES.map((style) => (
            <motion.button
              key={style.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAddStyle(style)}
              className="flex items-center justify-center h-14 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/40 hover:border-border/60 transition-colors cursor-pointer"
            >
              <span
                className="text-foreground truncate px-1"
                style={{
                  fontSize: `${Math.min(style.fontSize * 0.35, 16)}px`,
                  fontFamily: style.fontFamily,
                  fontWeight: style.fontWeight,
                }}
              >
                {style.preview}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Text Designs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold">Text Designs</span>
          <span className="text-[10px] text-muted-foreground">More ({TEXT_DESIGNS.length})</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {TEXT_DESIGNS.map((design) => (
            <motion.button
              key={design.id}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleAddDesign(design)}
              className="flex items-center justify-center h-14 rounded-lg border border-border/30 hover:border-border/60 transition-colors cursor-pointer overflow-hidden"
              style={{ background: design.bg === 'transparent' ? 'var(--muted)' : design.bg }}
            >
              <span
                className="text-xs font-semibold truncate px-1"
                style={{
                  color: design.color,
                  textShadow: design.shadow ? '1px 1px 3px rgba(0,0,0,0.5)' : 'none',
                }}
              >
                {design.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Editing Form */}
      <AnimatePresence>
        {editOverlay && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/20 rounded-lg p-3 space-y-2.5 border border-border/30 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-semibold">Edit Text</Label>
              <button onClick={() => setEditingId(null)} className="icon-btn w-5 h-5">
                <X size={12} />
              </button>
            </div>

            <textarea
              value={editOverlay.text}
              onChange={(e) => updateTextOverlay(editOverlay.id, { text: e.target.value })}
              rows={2}
              className="w-full px-2 py-1.5 bg-input border border-border rounded-md text-xs resize-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[9px] text-muted-foreground">Font</Label>
                <select
                  value={editOverlay.fontFamily}
                  onChange={(e) => updateTextOverlay(editOverlay.id, { fontFamily: e.target.value })}
                  className="w-full px-2 py-1 bg-input border border-border rounded-md text-[10px]"
                >
                  {FONT_FAMILIES.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Size: {editOverlay.fontSize}px</Label>
                <input type="range" min="12" max="120" value={editOverlay.fontSize}
                  onChange={(e) => updateTextOverlay(editOverlay.id, { fontSize: parseInt(e.target.value) })}
                  className="w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[9px] text-muted-foreground">Color</Label>
                <input type="color" value={editOverlay.color}
                  onChange={(e) => updateTextOverlay(editOverlay.id, { color: e.target.value })}
                  className="w-full h-7 rounded-md cursor-pointer border-0" />
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Opacity: {Math.round(editOverlay.opacity * 100)}%</Label>
                <input type="range" min="0" max="1" step="0.05" value={editOverlay.opacity}
                  onChange={(e) => updateTextOverlay(editOverlay.id, { opacity: parseFloat(e.target.value) })}
                  className="w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[9px] text-muted-foreground">X: {editOverlay.x}%</Label>
                <input type="range" min="0" max="100" value={editOverlay.x}
                  onChange={(e) => updateTextOverlay(editOverlay.id, { x: parseInt(e.target.value) })}
                  className="w-full" />
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Y: {editOverlay.y}%</Label>
                <input type="range" min="0" max="100" value={editOverlay.y}
                  onChange={(e) => updateTextOverlay(editOverlay.id, { y: parseInt(e.target.value) })}
                  className="w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[9px] text-muted-foreground">Start: {editOverlay.startTime.toFixed(1)}s</Label>
                <input type="range" min="0" max={videoMetadata?.duration || 10} step="0.1" value={editOverlay.startTime}
                  onChange={(e) => updateTextOverlay(editOverlay.id, { startTime: parseFloat(e.target.value) })}
                  className="w-full" />
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Duration: {editOverlay.duration.toFixed(1)}s</Label>
                <input type="range" min="0.5" max="30" step="0.1" value={editOverlay.duration}
                  onChange={(e) => updateTextOverlay(editOverlay.id, { duration: parseFloat(e.target.value) })}
                  className="w-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Added Overlays List */}
      {textOverlays.length > 0 && (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold">Added ({textOverlays.length})</span>
          {textOverlays.map((overlay) => (
            <div
              key={overlay.id}
              className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                selectedOverlayId === overlay.id
                  ? 'bg-accent/10 border border-accent/20'
                  : 'bg-muted/20 border border-transparent hover:bg-muted/40'
              }`}
              onClick={() => setSelectedOverlayId(overlay.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{overlay.text}</p>
                <p className="text-[9px] text-muted-foreground">
                  {overlay.startTime.toFixed(1)}s – {(overlay.startTime + overlay.duration).toFixed(1)}s
                </p>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingId(editingId === overlay.id ? null : overlay.id) }}
                  className="icon-btn w-6 h-6"
                ><Edit2 size={11} /></button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTextOverlay(overlay.id)
                    if (editingId === overlay.id) setEditingId(null)
                  }}
                  className="icon-btn w-6 h-6 hover:!text-destructive"
                ><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
