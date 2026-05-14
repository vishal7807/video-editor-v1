# Web-Based Video Editor
A production-ready, browser-based video editor built with React, TypeScript, and Vite. This is a complete frontend-only application with no backend dependencies, featuring real-time video processing, timeline editing, and multi-format export capabilities.

## Features

### Core Functionality
- **Video Upload & Playback** - Load MP4, WebM, and other video formats with full playback controls
- **Professional Timeline** - Virtualized timeline editor with track-based clip management
- **Clip Operations** - Trim, split, reposition, adjust speed, and control volume for individual clips
- **Real-Time Preview** - Live preview with instant filter and effect application
- **Video Filters** - Apply professional filters including brightness, contrast, saturation, blur, sepia, grayscale, and more
- **Text Overlays** - Add customizable text layers with control over font, size, color, position, and timing
- **Audio Management** - Multi-track audio support with volume and mute controls
- **Transitions** - Fade, slide, dissolve, and wipe transitions between clips
- **Multi-Format Export** - Export as MP4 or WebM at 720p or 1080p with quality options

### Advanced Features
- **Keyboard Shortcuts** - Space (play/pause), arrow keys (navigation), Ctrl+/- (speed control)
- **Dark Mode UI** - Professional dark-themed editor optimized for video work
- **Responsive Design** - Fully responsive layout that works on desktop and tablet
- **Undo/Redo** - Full undo/redo history for all edits
- **WebCodecs + FFmpeg** - Primary WebCodecs API with FFmpeg fallback for broader browser support
- **Type-Safe** - 100% TypeScript with strict mode enabled

## Technology Stack

### Frontend Framework
- **React 19** - Latest React with concurrent features
- **TypeScript 5.7** - Strict type checking
- **Vite 6** - Fast build tool and dev server

### State Management & UI
- **Zustand 4** - Lightweight state management with 7 separate stores
- **shadcn/ui** - High-quality accessible UI components
- **Tailwind CSS 4** - Utility-first CSS with modern PostCSS support
- **Lucide Icons** - Clean, consistent icon set

### Video Processing
- **WebCodecs API** - Modern browser video encoding/decoding (primary)
- **FFmpeg.wasm** - Fallback for browsers without WebCodecs support
- **Canvas API** - Real-time filter application and compositing

### Routing & Utilities
- **React Router 6** - Client-side routing
- **Sonner** - Toast notifications
- **React Resizable Panels** - Draggable layout panels

## Project Structure

```
src/
├── components/
│   ├── editor/          # Main editor components (Navbar, VideoPlayer)
│   ├── timeline/        # Timeline and clip components
│   ├── panels/          # Properties, filters, transitions, audio panels
│   ├── dialogs/         # Modal dialogs (text editor, export)
│   └── ui/              # shadcn/ui components
├── features/            # Feature-specific logic (reserved for expansion)
├── hooks/               # Custom React hooks
│   ├── useKeyboardShortcuts
│   ├── useClipOperations
│   └── useVideoRendering
├── store/               # Zustand stores (7 total)
│   ├── editorStore.ts   # Main editor state
│   ├── timelineStore.ts # Timeline and clips
│   ├── playbackStore.ts # Playback controls
│   ├── filterStore.ts   # Video filters
│   ├── overlayStore.ts  # Text/sticker overlays
│   ├── audioStore.ts    # Audio tracks
│   └── exportStore.ts   # Export progress
├── services/            # Video processing services
│   ├── webCodecsService.ts
│   ├── ffmpegService.ts
├── utils/               # Helper functions
│   ├── videoUtils.ts
│   ├── filterUtils.ts
│   └── timeUtils.ts
├── types/               # TypeScript interfaces
├── layouts/             # Layout components
├── styles/              # Global CSS
├── pages/               # Page components (expandable)
└── main.tsx             # Entry point
```

## Zustand Store Architecture

The application uses 7 normalized Zustand stores for optimal performance:

1. **editorStore** - Main editor state (video metadata, playback, selections)
2. **timelineStore** - Tracks, clips, zoom level, snap settings
3. **playbackStore** - Speed, mute, volume
4. **filterStore** - Active filters and their values
5. **overlayStore** - Text and sticker overlays with positions
6. **audioStore** - Audio tracks with volume and mute
7. **exportStore** - Export progress, format, quality

Each store is completely independent and uses selectors for efficient re-renders.

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Workflow

1. **Upload a video** - Click "Upload Video" in the navbar
2. **Add tracks** - Click "+ Add Track" in the timeline
3. **Add clips** - Drag video clips to tracks (implementation ready)
4. **Edit clips** - Drag to move, drag handles to trim, right-click for options
5. **Apply filters** - Adjust sliders in the Filters panel
6. **Add overlays** - Use the Text overlay dialog to add text
7. **Export** - Click "Export" and choose format/quality

## Keyboard Shortcuts

- **Space** - Play/pause
- **←/→** - Move playhead by 0.1s
- **Home** - Go to start
- **End** - Go to end
- **Ctrl/Cmd +-** - Adjust speed (0.5x to 2x)
- **Ctrl/Cmd 0** - Reset speed to 1x

## Browser Support

- **Chrome/Edge 94+** - Full WebCodecs support
- **Firefox 110+** - WebCodecs support
- **Safari 16.4+** - Partial WebCodecs support
- **Fallback** - FFmpeg.wasm works on all modern browsers

## API Documentation

### Custom Hooks

#### `useKeyboardShortcuts()`
Initialize keyboard shortcut handling for the editor.

```tsx
useKeyboardShortcuts()
```

#### `useClipOperations()`
Get functions for clip manipulation.

```tsx
const { trimClip, splitClip, moveClip, deleteClip } = useClipOperations()
```

#### `useVideoRendering()`
Handle real-time video rendering with filters.

```tsx
const { drawFrame } = useVideoRendering(videoRef, canvasRef)
```

### Services

#### WebCodecsService
```tsx
await webCodecsService.initialize()
const isSupported = webCodecsService.getIsSupported()
```

#### FFmpegService
```tsx
await ffmpegService.initialize()
const blob = await ffmpegService.transcode(file, 'mp4', { resolution: '1080p' })
```

## Performance Optimizations

- **Virtualized Timeline** - Only renders visible clips
- **Canvas Filter Caching** - Efficient filter application
- **Zustand Selectors** - Prevents unnecessary re-renders
- **React.memo** - Component memoization for list items
- **RequestAnimationFrame** - Smooth 60fps playback
- **Lazy Loading** - FFmpeg loads on demand

## Limitations & Known Issues

- Export is client-side only; large videos may require sufficient RAM
- WebCodecs availability varies by browser
- Complex effects (blur, etc.) may impact performance on older devices
- Audio syncing in exported videos depends on browser APIs

## Future Enhancements

- Sticker/image overlay support
- Custom transition library
- Video speed ramping
- Color grading tools
- Multi-track audio mixing
- Subtitle support
- Drawing tools
- Green screen/chroma key
- Project save/load functionality
- Collaboration features

## Accessibility

- Full keyboard navigation support
- ARIA labels on all interactive elements
- Color contrast meets WCAG AA standards
- Screen reader friendly interface
- Focus management in dialogs

## Building for Production

```bash
# Build with optimizations
npm run build

# The dist/ folder contains the optimized production build
# Deploy to Vercel:
vercel deploy
```
## dist folder run command

```bash
npx serve dist
```

```bash
npx http-server dist
```


## Development Notes

### Adding New Filters

Add new filter definitions to `filterStore.ts` and create filter UI in `FilterPanel.tsx`. The `filterUtils.ts` module handles canvas filter application automatically.

### Adding New Panel Components

Create new panel components in `src/components/panels/` and reference them in `PropertiesPanel.tsx` with appropriate tabs.

### Extending Timeline Features

Timeline clip operations use `useClipOperations()` hook. Add new operations by extending the store mutations and hook functions.

## Contributing

This is a reference implementation. Feel free to extend and customize for your needs.

## License

MIT - Feel free to use in your projects.

---

Built with by a team focused on professional-grade web video editing.

