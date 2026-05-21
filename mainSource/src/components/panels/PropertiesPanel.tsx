import { useEditorStore } from '@/store/editorStore'
import FilterPanel from './FilterPanel'
import TextOverlayPanel from './TextOverlayPanel'
import StickerPanel from './StickerPanel'
import TransitionPanel from './TransitionPanel'
import AudioPanel from './AudioPanel'
import ClipPropertiesPanel from './ClipPropertiesPanel'

export default function PropertiesPanel() {
  const { activeTool } = useEditorStore()

  switch (activeTool) {
    case 'effects':
      return <FilterPanel />
    case 'text':
      return <TextOverlayPanel />
    case 'sticker':
      return <StickerPanel />
    case 'transition':
      return <TransitionPanel />
    case 'audio':
      return <AudioPanel />
    default:
      return <ClipPropertiesPanel />
  }
}
