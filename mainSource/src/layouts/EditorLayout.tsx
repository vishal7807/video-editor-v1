import { useCallback } from 'react'
import Header from '@/components/editor/Navbar'
import IconSidebar from '@/components/editor/IconSidebar'
import SlidingPanel from '@/components/editor/SlidingPanel'
import CanvasControls from '@/components/editor/CanvasControls'
import ContextToolbar from '@/components/editor/ContextToolbar'
import VideoPlayer from '@/components/editor/VideoPlayer'
import Timeline from '@/components/timeline/Timeline'
import ExportDialog from '@/components/dialogs/ExportDialog'
import FilterPanel from '@/components/panels/FilterPanel'
import TextOverlayPanel from '@/components/panels/TextOverlayPanel'
import StickerPanel from '@/components/panels/StickerPanel'
import TransitionPanel from '@/components/panels/TransitionPanel'
import AudioPanel from '@/components/panels/AudioPanel'
import UploadPanel from '@/components/panels/UploadPanel'
import PropertiesPanel from '@/components/panels/PropertiesPanel'
import { useEditorStore } from '@/store/editorStore'
import { useTimelineStore } from '@/store/timelineStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { toast } from 'sonner'

const PANEL_TITLES: Record<string, string> = {
  upload: 'Videos',
  text: 'Text',
  sticker: 'Stickers',
  audio: 'Audio',
  effects: 'Effects',
  transition: 'Transitions',
  properties: 'Properties',
}

export default function EditorLayout() {
  const {
    activeTool,
    setActiveTool,
    sidePanelOpen,
    setSidePanelOpen,
    videoUrl,
    setVideoFile,
    setVideoMetadata,
    exportDialogOpen,
    setExportDialogOpen,
    saveSnapshot,
    addUploadedVideo,
    selectedClipId,
    selectedElementType,
    isTrimMode,
  } = useEditorStore()

  const { addTrack, addClip, tracks } = useTimelineStore()

  useKeyboardShortcuts()

  // Video upload handler
  const handleVideoUpload = useCallback(
    (file: File) => {
      const validTypes = ['video/mp4', 'video/webm', 'video/quicktime']
      if (!validTypes.some((t) => file.type.startsWith(t.split('/')[0]))) {
        toast.error('Unsupported file type. Use MP4, WebM, or MOV.')
        return
      }

      const url = URL.createObjectURL(file)
      setVideoFile(file, url)

      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        setVideoMetadata({
          duration: video.duration,
          fps: 30,
          width: video.videoWidth,
          height: video.videoHeight,
          url,
        })

        addUploadedVideo({
          id: `video-${Date.now()}`,
          file,
          url,
          metadata: {
            duration: video.duration,
            fps: 30,
            width: video.videoWidth,
            height: video.videoHeight,
            url,
          }
        })

        toast.success(`Loaded "${file.name}"`)
      }
      video.onerror = () => {
        toast.error('Failed to read video file.')
        URL.revokeObjectURL(url)
      }
      video.src = url
    },
    [setVideoFile, setVideoMetadata, addUploadedVideo]
  )

  const handleClosePanel = () => {
    setSidePanelOpen(false)
    setActiveTool(null)
  }

  const handleExport = async () => {
    setExportDialogOpen(false)
  }

  // Panel content based on active tool
  const renderPanelContent = () => {
    switch (activeTool) {
      case 'upload':
        return <UploadPanel onVideoUpload={handleVideoUpload} />
      case 'text':
        return <TextOverlayPanel />
      case 'sticker':
        return <StickerPanel />
      case 'audio':
        return <AudioPanel />
      case 'transition':
        return <TransitionPanel />
      case 'effects':
        return <FilterPanel />
      case 'properties':
        return <PropertiesPanel />
      default:
        return null
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <Header onExport={() => setExportDialogOpen(true)} />

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Icon Sidebar */}
        <IconSidebar />

        {/* Sliding Panel */}
        <SlidingPanel
          open={sidePanelOpen && activeTool !== null}
          onClose={handleClosePanel}
          title={activeTool ? PANEL_TITLES[activeTool] || '' : ''}
          searchable={activeTool === 'audio' || activeTool === 'sticker' || activeTool === 'upload'}
        >
          {renderPanelContent()}
        </SlidingPanel>



        {/* Center: Canvas + Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Context Toolbar */}
          <div className="shrink-0 flex justify-center py-1.5 z-20">
            {!isTrimMode && <ContextToolbar />}
          </div>

          {/* Video Preview & Overlay Area */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
            <VideoPlayer onVideoUpload={handleVideoUpload} />
            
            {/* Floating Trim Controls */}
            {isTrimMode && selectedClipId && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
                <CanvasControls />
              </div>
            )}
          </div>

          {/* Timeline — overlapping bottom */}
          <div className="shrink-0 mx-3 mb-2 -mt-2 relative z-10">
            <Timeline />
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        onExport={handleExport}
      />
    </div>
  )
}
