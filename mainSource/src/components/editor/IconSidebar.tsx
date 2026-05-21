import { Film, Music, Type, Smile, Sparkles, Shuffle } from 'lucide-react'
import { useEditorStore, ActiveTool } from '@/store/editorStore'
import { ThemeToggle } from '@/components/ThemeToggle'

const TOOLS: { id: ActiveTool; icon: typeof Film; label: string }[] = [
  { id: 'upload', icon: Film, label: 'Videos' },
  { id: 'audio', icon: Music, label: 'Audio' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'sticker', icon: Smile, label: 'Stickers' },
  { id: 'transition', icon: Shuffle, label: 'Transitions' },
  { id: 'effects', icon: Sparkles, label: 'Effects' },
]

export default function IconSidebar() {
  const { activeTool, setActiveTool } = useEditorStore()

  return (
    <div className="w-[70px] shrink-0 flex flex-col items-center gap-0.5 py-2 bg-sidebar border-r border-sidebar-border overflow-y-auto overflow-x-hidden">
      {TOOLS.map(({ id, icon: Icon, label }, index) => {
        const isActive = activeTool === id

        return (
          <button
            key={`${id}-${label}-${index}`}
            onClick={() => setActiveTool(id)}
            className={`tool-btn ${isActive ? 'active' : ''}`}
            aria-label={label}
          >
            <Icon size={20} strokeWidth={1.8} />
            <span className="text-[10px] leading-none font-semibold">{label}</span>
          </button>
        )
      })}
      <div className="mt-auto pb-4">
        <ThemeToggle />
      </div>
    </div>
  )
}
