import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { usePlaybackStore } from '@/store/playbackStore';
import { useTimelineStore } from '@/store/timelineStore';
import { useAudioStore } from '@/store/audioStore';
import { Play, Pause, Check, Scissors } from 'lucide-react';

export default function CanvasControls() {
  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    selectedClipId,
    selectedTrackId,
    selectedElementType,
    setIsTrimMode,
    saveSnapshot,
  } = useEditorStore();

  const { getClip, updateClip } = useTimelineStore();
  const { tracks: audioTracks, updateAudioTrack } = useAudioStore();

  // Get the clip being edited
  const clip = selectedElementType === 'video' && selectedTrackId && selectedClipId
    ? getClip(selectedTrackId, selectedClipId)
    : (selectedElementType === 'audio' && selectedClipId
      ? audioTracks.find(t => t.id === selectedClipId)
      : null);

  // We trim the source duration. For this, we need the source's total duration.
  // If metadata isn't available for the specific clip source, we default to a reasonable value or the clip's current end.
  const sourceTotalDuration = useEditorStore.getState().videoMetadata?.duration || (clip ? clip.trimStart + clip.duration + 10 : 30);

  const [trimValues, setTrimValues] = useState({ start: 0, end: 10 });
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize from clip
  useEffect(() => {
    if (clip) {
      setTrimValues({
        start: clip.trimStart || 0,
        end: (clip.trimStart || 0) + clip.duration
      });
    }
  }, [clip?.id]);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const time = percent * sourceTotalDuration;

    if (isDragging === 'start') {
      setTrimValues(prev => ({ ...prev, start: Math.min(time, prev.end - 0.1) }));
    } else {
      setTrimValues(prev => ({ ...prev, end: Math.max(time, prev.start + 0.1) }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const onDone = () => {
    if (clip && selectedClipId) {
      saveSnapshot();
      const newDuration = trimValues.end - trimValues.start;

      if (selectedElementType === 'video' && selectedTrackId) {
        // When trimming from left, we might want to shift startTime so the clip end stays the same, 
        // or just update trimStart. Usually, trimming in this popup affects the clip content.
        updateClip(selectedTrackId, selectedClipId, {
          trimStart: trimValues.start,
          duration: newDuration
        });
      } else if (selectedElementType === 'audio') {
        updateAudioTrack(selectedClipId, {
          trimStart: trimValues.start,
          duration: newDuration
        });
      }
    }
    setIsTrimMode(false);
  };

  if (!clip) return null;

  return (
    <div className="flex flex-col items-center gap-3 bg-card/95 backdrop-blur-xl p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 w-[480px]">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-accent/20 rounded-lg">
            <Scissors size={14} className="text-accent" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest">Trim Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-semibold  px-2 py-1 rounded  border border-white/5">
            START: {trimValues.start.toFixed(2)}s
          </div>
          <div className="text-[10px] font-semibold px-2 py-1 rounded  border border-white/5">
            END: {trimValues.end.toFixed(2)}s
          </div>
        </div>
      </div>

      {/* Draggable Trim Bar */}
      <div
        ref={containerRef}
        className="relative w-full h-12 bg-black/40 rounded-xl overflow-hidden border border-white/5 shadow-inner"
      >
        {/* Source Background */}
        <div className="absolute inset-0 flex gap-1 p-1 opacity-10">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-1 bg-white/20 rounded-sm" />
          ))}
        </div>

        {/* Selected Highlight */}
        <div
          className="absolute h-full bg-accent/30 border-x-[3px] border-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]"
          style={{
            left: `${(trimValues.start / sourceTotalDuration) * 100}%`,
            width: `${((trimValues.end - trimValues.start) / sourceTotalDuration) * 100}%`
          }}
        />

        {/* Start Handle */}
        <div
          className="absolute top-0 bottom-0 w-4 group cursor-ew-resize flex items-center justify-center z-20"
          style={{ left: `${(trimValues.start / sourceTotalDuration) * 100}%`, transform: 'translateX(-50%)' }}
          onMouseDown={() => setIsDragging('start')}
        >
          <div className="w-1.5 h-6 bg-white rounded-full shadow-lg group-hover:scale-y-110 transition-transform" />
        </div>

        {/* End Handle */}
        <div
          className="absolute top-0 bottom-0 w-4 group cursor-ew-resize flex items-center justify-center z-20"
          style={{ left: `${(trimValues.end / sourceTotalDuration) * 100}%`, transform: 'translateX(-50%)' }}
          onMouseDown={() => setIsDragging('end')}
        >
          <div className="w-1.5 h-6 bg-white rounded-full shadow-lg group-hover:scale-y-110 transition-transform" />
        </div>

        {/* Playhead in Trim View */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent z-30 pointer-events-none"
          style={{ left: `${(currentTime / sourceTotalDuration) * 100}%` }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-accent rotate-45" />
        </div>
      </div>

      <div className="flex items-center justify-between w-full mt-1">
        <div className="flex items-center gap-4">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-xl"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>

          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-tight">Current Position</span>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold">{currentTime.toFixed(2)}s</span>
              <span className="text-sm  mt-0.5">/ {sourceTotalDuration.toFixed(2)}s</span>
            </div>
          </div>
        </div>

        <button
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white font-bold text-xs rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-accent/20"
          onClick={onDone}
        >
          <Check size={16} strokeWidth={3} /> APPLY TRIM
        </button>
      </div>
    </div>
  );
}
