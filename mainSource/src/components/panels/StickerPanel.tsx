import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useOverlayStore } from '@/store/overlayStore'
import { useEditorStore } from '@/store/editorStore'
import { Upload, Trash2, Edit2, X, Search } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { useDebounce } from '@/hooks/useDebounce'

const EMOJI_STICKERS = [
  '😀', '😂', '🥰', '😎', '🤩', '🥳', '😇', '🤯',
  '🔥', '⭐', '💖', '💎', '✨', '🎯', '🚀', '🎬',
  '🎵', '🎭', '🏆', '👑', '💪', '🙌', '👍', '❤️',
  '💯', '⚡', '🌈', '🦋', '🎉', '🍕',
]

const FONT_FAMILIES = ['Inter', 'Georgia', 'Courier New', 'Arial']

export default function StickerPanel() {
  const {
    stickerOverlays, addStickerOverlay, removeStickerOverlay, updateStickerOverlay,
    selectedOverlayId, setSelectedOverlayId,
  } = useOverlayStore()
  const { currentTime, videoMetadata, setSidePanelOpen, setActiveTool, setSelectedElementType, searchQuery } = useEditorStore()
  const imgInputRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const stickerOverlaysWithNames = stickerOverlays.map(o => ({
    ...o,
    displayName: o.name || (o.src.startsWith('data:') ? 'Image Sticker' : `${o.src} Emoji Sticker`)
  }))

  const filteredStickers = stickerOverlaysWithNames.filter((o) =>
    o.displayName.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const handleAddEmoji = (emoji: string) => {
    const id = `sticker-${Date.now()}`
    addStickerOverlay({
      id,
      name: `${emoji} Emoji Sticker`,
      src: emoji,
      x: 50 + Math.random() * 20 - 10,
      y: 50 + Math.random() * 20 - 10,
      scale: 1,
      rotation: 0,
      opacity: 1,
      startTime: currentTime,
      duration: Math.min(5, (videoMetadata?.duration || 10) - currentTime),
    })
    setSelectedOverlayId(id)
    setSelectedElementType('sticker')
    setSidePanelOpen(false)
    setActiveTool(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const id = `sticker-${Date.now()}`
      addStickerOverlay({
        id,
        name: file.name,
        src: reader.result as string,
        x: 50,
        y: 50,
        scale: 1,
        rotation: 0,
        opacity: 1,
        startTime: currentTime,
        duration: Math.min(5, (videoMetadata?.duration || 10) - currentTime),
      })
      setSelectedOverlayId(id)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const editOverlay = editingId ? stickerOverlays.find((o) => o.id === editingId) : null

  return (
    <div className="p-3 space-y-4">
      {/* Emoji Grid */}
      <div>
        <span className="text-[11px] font-semibold block mb-2">Emoji Stickers</span>
        <div className="grid grid-cols-6 gap-1">
          {EMOJI_STICKERS.map((emoji) => (
            <motion.button
              key={emoji}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAddEmoji(emoji)}
              className="w-full aspect-square rounded-lg flex items-center justify-center text-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <span className="text-[11px] font-semibold block mb-2">Custom Image</span>
        <button
          onClick={() => imgInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-border hover:border-accent/50 hover:bg-accent/5 text-[11px] text-muted-foreground transition-colors cursor-pointer"
        >
          <Upload size={14} />
          Upload Image
        </button>
        <input
          ref={imgInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Edit Form */}
      {editOverlay && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-muted/20 rounded-lg p-3 space-y-2.5 border border-border/30"
        >
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-semibold">Edit Sticker</Label>
            <button onClick={() => setEditingId(null)} className="icon-btn w-5 h-5"><X size={12} /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[9px] text-muted-foreground">Scale: {editOverlay.scale.toFixed(1)}×</Label>
              <input type="range" min="0.2" max="3" step="0.1" value={editOverlay.scale}
                onChange={(e) => updateStickerOverlay(editOverlay.id, { scale: parseFloat(e.target.value) })}
                className="w-full" />
            </div>
            <div>
              <Label className="text-[9px] text-muted-foreground">Rotation: {editOverlay.rotation}°</Label>
              <input type="range" min="0" max="360" value={editOverlay.rotation}
                onChange={(e) => updateStickerOverlay(editOverlay.id, { rotation: parseInt(e.target.value) })}
                className="w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[9px] text-muted-foreground">X: {editOverlay.x.toFixed(0)}%</Label>
              <input type="range" min="0" max="100" value={editOverlay.x}
                onChange={(e) => updateStickerOverlay(editOverlay.id, { x: parseInt(e.target.value) })}
                className="w-full" />
            </div>
            <div>
              <Label className="text-[9px] text-muted-foreground">Y: {editOverlay.y.toFixed(0)}%</Label>
              <input type="range" min="0" max="100" value={editOverlay.y}
                onChange={(e) => updateStickerOverlay(editOverlay.id, { y: parseInt(e.target.value) })}
                className="w-full" />
            </div>
          </div>
          <div>
            <Label className="text-[9px] text-muted-foreground">Opacity: {Math.round(editOverlay.opacity * 100)}%</Label>
            <input type="range" min="0" max="1" step="0.05" value={editOverlay.opacity}
              onChange={(e) => updateStickerOverlay(editOverlay.id, { opacity: parseFloat(e.target.value) })}
              className="w-full" />
          </div>
        </motion.div>
      )}

      {/* Overlay List */}
      {stickerOverlays.length === 0 ? null : filteredStickers.length === 0 ? (
        <div className="text-center py-4 space-y-2">
          <div className="mx-auto w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
            <Search size={18} className="text-muted-foreground/40" />
          </div>
          <p className="text-[11px] text-muted-foreground">No stickers found</p>
          <p className="text-[10px] text-muted-foreground/50">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-1">
          <span className="text-[11px] font-semibold">Added ({filteredStickers.length})</span>
          {filteredStickers.map((overlay) => (
            <div
              key={overlay.id}
              className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                selectedOverlayId === overlay.id
                  ? 'bg-accent/10 border border-accent/20'
                  : 'bg-muted/20 border border-transparent hover:bg-muted/40'
              }`}
              onClick={() => setSelectedOverlayId(overlay.id)}
            >
              <div className="w-7 h-7 flex items-center justify-center text-lg">
                {overlay.src.startsWith('data:') ? '🖼️' : overlay.src}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground">
                  {overlay.startTime.toFixed(1)}s – {(overlay.startTime + overlay.duration).toFixed(1)}s
                </p>
              </div>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); setEditingId(editingId === overlay.id ? null : overlay.id) }}
                  className="icon-btn w-6 h-6"><Edit2 size={11} /></button>
                <button onClick={(e) => { e.stopPropagation(); removeStickerOverlay(overlay.id) }}
                  className="icon-btn w-6 h-6 hover:!text-destructive"><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
