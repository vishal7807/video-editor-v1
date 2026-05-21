import { useState } from 'react'
import { useOverlayStore } from '@/store/overlayStore'
import { useEditorStore } from '@/store/editorStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TextEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  textOverlayId?: string
}

export default function TextEditorDialog({ open, onOpenChange, textOverlayId }: TextEditorDialogProps) {
  const { addTextOverlay, updateTextOverlay, getTextOverlay } = useOverlayStore()
  const { currentTime, videoMetadata } = useEditorStore()
  
  const existingOverlay = textOverlayId ? getTextOverlay(textOverlayId) : null
  
  const [text, setText] = useState(existingOverlay?.text || '')
  const [fontSize, setFontSize] = useState(existingOverlay?.fontSize || 24)
  const [fontFamily, setFontFamily] = useState(existingOverlay?.fontFamily || 'Arial')
  const [color, setColor] = useState(existingOverlay?.color || '#ffffff')
  const [duration, setDuration] = useState(existingOverlay?.duration || 5)

  const handleSave = () => {
    if (!text.trim() || !videoMetadata) return

    const overlay = {
      id: existingOverlay?.id || `text-${Date.now()}`,
      text,
      fontSize,
      fontFamily,
      color,
      x: existingOverlay?.x || 50,
      y: existingOverlay?.y || 50,
      rotation: existingOverlay?.rotation || 0,
      opacity: existingOverlay?.opacity || 1,
      startTime: existingOverlay?.startTime || currentTime,
      duration: Math.min(duration, videoMetadata.duration - currentTime),
    }

    if (existingOverlay) {
      updateTextOverlay(existingOverlay.id, overlay)
    } else {
      addTextOverlay(overlay)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{existingOverlay ? 'Edit Text' : 'Add Text Overlay'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Text Content */}
          <div>
            <Label>Text Content</Label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            />
          </div>

          {/* Font Size */}
          <div>
            <Label>Font Size: {fontSize}px</Label>
            <input
              type="range"
              min="12"
              max="128"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Font Family */}
          <div>
            <Label>Font Family</Label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
            >
              <option>Arial</option>
              <option>Georgia</option>
              <option>Courier New</option>
              <option>Times New Roman</option>
              <option>Verdana</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <Label>Color</Label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>

          {/* Duration */}
          <div>
            <Label>Duration: {duration.toFixed(1)}s</Label>
            <input
              type="range"
              min="0.5"
              max="30"
              step="0.5"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!text.trim()}>
              {existingOverlay ? 'Update' : 'Add'} Text
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
