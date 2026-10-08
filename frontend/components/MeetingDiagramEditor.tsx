import React, { useState, useRef, useMemo } from 'react';
import { MeetingDiagramData, DiagramElement, DiagramElementType } from '../types';
import { useApp } from '../context/AppContext';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  RotateCw,
  Move,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Sliders,
  X,
  Check,
  Download,
  FileText,
  Sparkles,
  Tv,
  Volume2,
  Camera,
  Users,
  Maximize2,
  Zap,
  Info,
  Copy,
} from 'lucide-react';

interface MeetingDiagramEditorProps {
  diagramData?: MeetingDiagramData;
  onChange: (updated: MeetingDiagramData) => void;
  eventName?: string;
  venueName?: string;
  isModal?: boolean;
  onClose?: () => void;
}

// Preset elements palette definitions
interface ElementPreset {
  type: DiagramElementType;
  label: string;
  category: 'Staging' | 'Video' | 'Audio' | 'Lighting' | 'Seating' | 'Power';
  defaultWidth: number;
  defaultHeight: number;
  color: string;
  icon: React.ReactNode;
}

const ELEMENT_PRESETS: ElementPreset[] = [
  {
    type: 'stage',
    label: 'Main Stage (32x16ft)',
    category: 'Staging',
    defaultWidth: 160,
    defaultHeight: 80,
    color: '#3b82f6', // blue
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  {
    type: 'podium',
    label: 'Speaker Podium / Lectern',
    category: 'Staging',
    defaultWidth: 32,
    defaultHeight: 32,
    color: '#06b6d4', // cyan
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  {
    type: 'led_screen',
    label: 'Main Absen LED Wall',
    category: 'Video',
    defaultWidth: 140,
    defaultHeight: 18,
    color: '#eab308', // amber
    icon: <Tv className="w-3.5 h-3.5" />,
  },
  {
    type: 'projection_screen',
    label: 'IMAG Projection Screen',
    category: 'Video',
    defaultWidth: 70,
    defaultHeight: 16,
    color: '#f59e0b', // amber-600
    icon: <Tv className="w-3.5 h-3.5" />,
  },
  {
    type: 'camera',
    label: '4K Broadcast PTZ Cam',
    category: 'Video',
    defaultWidth: 28,
    defaultHeight: 28,
    color: '#ec4899', // pink
    icon: <Camera className="w-3.5 h-3.5" />,
  },
  {
    type: 'speaker_left',
    label: 'Left Line Array (Kara II)',
    category: 'Audio',
    defaultWidth: 26,
    defaultHeight: 40,
    color: '#10b981', // emerald
    icon: <Volume2 className="w-3.5 h-3.5" />,
  },
  {
    type: 'speaker_right',
    label: 'Right Line Array (Kara II)',
    category: 'Audio',
    defaultWidth: 26,
    defaultHeight: 40,
    color: '#10b981', // emerald
    icon: <Volume2 className="w-3.5 h-3.5" />,
  },
  {
    type: 'subwoofer',
    label: 'Dual Subwoofer Array',
    category: 'Audio',
    defaultWidth: 48,
    defaultHeight: 24,
    color: '#059669', // emerald-600
    icon: <Volume2 className="w-3.5 h-3.5" />,
  },
  {
    type: 'foh_console',
    label: 'FOH Audio & Video Booth',
    category: 'Audio',
    defaultWidth: 90,
    defaultHeight: 46,
    color: '#8b5cf6', // purple
    icon: <Sliders className="w-3.5 h-3.5" />,
  },
  {
    type: 'lighting_truss',
    label: 'Box Lighting Truss 40ft',
    category: 'Lighting',
    defaultWidth: 180,
    defaultHeight: 14,
    color: '#f97316', // orange
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  {
    type: 'theater_seating',
    label: 'Theater Seating Block (60 Chairs)',
    category: 'Seating',
    defaultWidth: 110,
    defaultHeight: 70,
    color: '#64748b', // slate
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    type: 'round_table',
    label: 'Round Table 60" (10-Top)',
    category: 'Seating',
    defaultWidth: 46,
    defaultHeight: 46,
    color: '#64748b', // slate
    icon: <Users className="w-3.5 h-3.5" />,
  },
  {
    type: 'power_drop',
    label: '100A 3-Phase Power Drop',
    category: 'Power',
    defaultWidth: 24,
    defaultHeight: 24,
    color: '#ef4444', // red
    icon: <Zap className="w-3.5 h-3.5" />,
  },
];

export const MeetingDiagramEditor: React.FC<MeetingDiagramEditorProps> = ({
  diagramData,
  onChange,
  eventName = 'Live Event Proposal',
  venueName = 'Ballroom / Conference Hall',
  isModal = false,
  onClose,
}) => {
  const { uploadFile, currentUser } = useApp();

  // State initialization
  const [elements, setElements] = useState<DiagramElement[]>(
    diagramData?.elements || [
      {
        id: 'el-stage-01',
        type: 'stage',
        label: 'Main Stage (32x16ft)',
        x: 220,
        y: 60,
        width: 260,
        height: 100,
        rotation: 0,
        color: '#3b82f6',
        notes: 'Raised 36-inch with black skirting and steps on stage right',
      },
      {
        id: 'el-led-01',
        type: 'led_screen',
        label: 'Absen 2.6mm Curved LED Wall',
        x: 240,
        y: 65,
        width: 220,
        height: 18,
        rotation: 0,
        color: '#eab308',
        notes: 'Ground supported on truss base',
      },
      {
        id: 'el-podium-01',
        type: 'podium',
        label: 'Keynote Lectern',
        x: 330,
        y: 110,
        width: 36,
        height: 36,
        rotation: 0,
        color: '#06b6d4',
        notes: 'Dual Shure MX418 gooseneck microphones',
      },
      {
        id: 'el-spk-l',
        type: 'speaker_left',
        label: 'Kara II Left Array',
        x: 180,
        y: 80,
        width: 30,
        height: 48,
        rotation: 0,
        color: '#10b981',
      },
      {
        id: 'el-spk-r',
        type: 'speaker_right',
        label: 'Kara II Right Array',
        x: 490,
        y: 80,
        width: 30,
        height: 48,
        rotation: 0,
        color: '#10b981',
      },
      {
        id: 'el-foh-01',
        type: 'foh_console',
        label: 'FOH Audio & Lighting Control',
        x: 275,
        y: 350,
        width: 150,
        height: 55,
        rotation: 0,
        color: '#8b5cf6',
        notes: 'Yamaha CL5 and grandMA3 light with pipe and drape border',
      },
    ]
  );

  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>(
    diagramData?.backgroundImageUrl || ''
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(
    diagramData?.backgroundOpacity ?? 0.65
  );
  const [roomDimensions, setRoomDimensions] = useState<{
    lengthFt: number;
    widthFt: number;
    ceilingHeightFt?: number;
    roomName?: string;
  }>(
    diagramData?.roomDimensions || {
      lengthFt: 90,
      widthFt: 60,
      ceilingHeightFt: 22,
      roomName: venueName,
    }
  );

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'editor' | 'specs'>('editor');

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Currently selected element object
  const selectedElement = useMemo(
    () => elements.find((e) => e.id === selectedElementId) || null,
    [elements, selectedElementId]
  );

  // Sync changes up to parent proposal form
  const triggerSave = (
    newElements = elements,
    newBg = backgroundImageUrl,
    newOpacity = backgroundOpacity,
    newRoom = roomDimensions
  ) => {
    const updatedData: MeetingDiagramData = {
      backgroundImageUrl: newBg,
      backgroundOpacity: newOpacity,
      elements: newElements,
      roomDimensions: newRoom,
      updatedAt: new Date().toISOString(),
    };
    onChange(updatedData);
  };

  // Upload custom meeting floorplan / CAD diagram image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Convert to local base64/dataURL for instant canvas display
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setBackgroundImageUrl(dataUrl);

        // 2. Also upload to Firebase Cloud Storage if online
        try {
          const cloudPath = `diagrams/proposals_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const cloudUrl = await uploadFile(cloudPath, file);
          if (cloudUrl) {
            setBackgroundImageUrl(cloudUrl);
            triggerSave(elements, cloudUrl, backgroundOpacity);
          }
        } catch (cloudErr) {
          console.warn('Saved local diagram data URL to proposal (offline/local fallback):', cloudErr);
          triggerSave(elements, dataUrl, backgroundOpacity);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to load diagram file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Add new element from palette
  const handleAddPresetElement = (preset: ElementPreset) => {
    const newId = `el-${preset.type}-${Date.now().toString(36)}`;
    const newElement: DiagramElement = {
      id: newId,
      type: preset.type,
      label: preset.label,
      x: 250 + (elements.length % 5) * 20,
      y: 180 + (elements.length % 5) * 20,
      width: preset.defaultWidth,
      height: preset.defaultHeight,
      rotation: 0,
      color: preset.color,
    };

    const updated = [...elements, newElement];
    setElements(updated);
    setSelectedElementId(newId);
    triggerSave(updated);
  };

  // Duplicate selected element
  const handleDuplicateElement = (elementId: string) => {
    const target = elements.find((e) => e.id === elementId);
    if (!target) return;

    const dupId = `el-${target.type}-${Date.now().toString(36)}`;
    const duplicated: DiagramElement = {
      ...target,
      id: dupId,
      label: `${target.label} (Copy)`,
      x: target.x + 25,
      y: target.y + 25,
    };

    const updated = [...elements, duplicated];
    setElements(updated);
    setSelectedElementId(dupId);
    triggerSave(updated);
  };

  // Delete element
  const handleDeleteElement = (elementId: string) => {
    const updated = elements.filter((e) => e.id !== elementId);
    setElements(updated);
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
    triggerSave(updated);
  };

  // Rotate selected element by 45 degrees
  const handleRotateElement = (elementId: string) => {
    const updated = elements.map((e) => {
      if (e.id === elementId) {
        const nextRot = ((e.rotation || 0) + 45) % 360;
        return { ...e, rotation: nextRot };
      }
      return e;
    });
    setElements(updated);
    triggerSave(updated);
  };

  // Apply Pre-Built Layout Templates
  const handleApplyTemplate = (templateName: string) => {
    let newTemplateElements: DiagramElement[] = [];

    if (templateName === 'keynote') {
      newTemplateElements = [
        {
          id: 't-stage',
          type: 'stage',
          label: 'Keynote Main Stage (40x20ft)',
          x: 200,
          y: 40,
          width: 300,
          height: 90,
          rotation: 0,
          color: '#3b82f6',
        },
        {
          id: 't-led',
          type: 'led_screen',
          label: 'Center 24x10ft LED Wall',
          x: 230,
          y: 45,
          width: 240,
          height: 16,
          rotation: 0,
          color: '#eab308',
        },
        {
          id: 't-podium',
          type: 'podium',
          label: 'Executive Lectern',
          x: 330,
          y: 85,
          width: 36,
          height: 36,
          rotation: 0,
          color: '#06b6d4',
        },
        {
          id: 't-spk-l',
          type: 'speaker_left',
          label: 'Kara Left Array',
          x: 160,
          y: 60,
          width: 26,
          height: 44,
          rotation: 0,
          color: '#10b981',
        },
        {
          id: 't-spk-r',
          type: 'speaker_right',
          label: 'Kara Right Array',
          x: 515,
          y: 60,
          width: 26,
          height: 44,
          rotation: 0,
          color: '#10b981',
        },
        {
          id: 't-seat-1',
          type: 'theater_seating',
          label: 'Audience Rows Block A',
          x: 170,
          y: 170,
          width: 160,
          height: 90,
          rotation: 0,
          color: '#64748b',
        },
        {
          id: 't-seat-2',
          type: 'theater_seating',
          label: 'Audience Rows Block B',
          x: 370,
          y: 170,
          width: 160,
          height: 90,
          rotation: 0,
          color: '#64748b',
        },
        {
          id: 't-cam-1',
          type: 'camera',
          label: 'Center IMAG Cam (PTZ)',
          x: 335,
          y: 285,
          width: 30,
          height: 30,
          rotation: 0,
          color: '#ec4899',
        },
        {
          id: 't-foh',
          type: 'foh_console',
          label: 'FOH Audio & Video Production Bay',
          x: 260,
          y: 330,
          width: 180,
          height: 55,
          rotation: 0,
          color: '#8b5cf6',
        },
      ];
    } else if (templateName === 'gala') {
      newTemplateElements = [
        {
          id: 'g-stage',
          type: 'stage',
          label: 'Gala Center Stage (24x16ft)',
          x: 235,
          y: 40,
          width: 230,
          height: 80,
          rotation: 0,
          color: '#3b82f6',
        },
        {
          id: 'g-tbl-1',
          type: 'round_table',
          label: 'VIP Table 1',
          x: 180,
          y: 160,
          width: 50,
          height: 50,
          rotation: 0,
          color: '#64748b',
        },
        {
          id: 'g-tbl-2',
          type: 'round_table',
          label: 'VIP Table 2',
          x: 325,
          y: 160,
          width: 50,
          height: 50,
          rotation: 0,
          color: '#64748b',
        },
        {
          id: 'g-tbl-3',
          type: 'round_table',
          label: 'VIP Table 3',
          x: 470,
          y: 160,
          width: 50,
          height: 50,
          rotation: 0,
          color: '#64748b',
        },
        {
          id: 'g-tbl-4',
          type: 'round_table',
          label: 'Sponsor Table 4',
          x: 230,
          y: 240,
          width: 50,
          height: 50,
          rotation: 0,
          color: '#64748b',
        },
        {
          id: 'g-tbl-5',
          type: 'round_table',
          label: 'Sponsor Table 5',
          x: 420,
          y: 240,
          width: 50,
          height: 50,
          rotation: 0,
          color: '#64748b',
        },
        {
          id: 'g-foh',
          type: 'foh_console',
          label: 'DJ & Audio Lighting Console',
          x: 260,
          y: 330,
          width: 180,
          height: 50,
          rotation: 0,
          color: '#8b5cf6',
        },
      ];
    } else if (templateName === 'clear') {
      newTemplateElements = [];
    }

    setElements(newTemplateElements);
    setSelectedElementId(null);
    triggerSave(newTemplateElements);
  };

  // Mouse drag handling on canvas elements
  const handleMouseDown = (e: React.MouseEvent, element: DiagramElement) => {
    e.stopPropagation();
    setSelectedElementId(element.id);
    setIsDragging(true);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoomLevel;
      const mouseY = (e.clientY - rect.top) / zoomLevel;
      setDragOffset({
        x: mouseX - element.x,
        y: mouseY - element.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / zoomLevel;
    const mouseY = (e.clientY - rect.top) / zoomLevel;

    let newX = mouseX - dragOffset.x;
    let newY = mouseY - dragOffset.y;

    if (snapToGrid) {
      const gridSize = 10;
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }

    // Keep within bounds
    newX = Math.max(0, Math.min(newX, 680));
    newY = Math.max(0, Math.min(newY, 440));

    setElements((prev) =>
      prev.map((el) => (el.id === selectedElementId ? { ...el, x: newX, y: newY } : el))
    );
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      triggerSave(elements);
    }
  };

  return (
    <div className={`space-y-4 ${isModal ? 'p-2' : ''}`}>
      {/* Top Banner & File Upload Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Meeting & Stage Layout Diagram
              </h3>
              <p className="text-xs text-neutral-400">
                Upload venue floorplans, arrange AV staging equipment, and define room dimensions
              </p>
            </div>
          </div>
        </div>

        {/* Upload Button & Action Controls */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 text-xs font-semibold rounded-lg border border-neutral-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Uploading...' : backgroundImageUrl ? 'Change Diagram' : 'Upload Floor Plan'}</span>
          </button>

          {backgroundImageUrl && (
            <button
              type="button"
              onClick={() => {
                setBackgroundImageUrl('');
                triggerSave(elements, '');
              }}
              title="Remove uploaded floorplan background"
              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preset Quick Templates & Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] text-neutral-400 font-mono uppercase font-semibold mr-1">
            Presets:
          </span>
          <button
            type="button"
            onClick={() => handleApplyTemplate('keynote')}
            className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-amber-400 transition-colors cursor-pointer font-medium"
          >
            Keynote Theatre
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('gala')}
            className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-amber-400 transition-colors cursor-pointer font-medium"
          >
            Banquet Gala
          </button>
          <button
            type="button"
            onClick={() => handleApplyTemplate('clear')}
            className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer font-medium"
          >
            Clear All
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Opacity slider if background image uploaded */}
          {backgroundImageUrl && (
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span className="text-[10px] font-mono">Plan Opacity:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={backgroundOpacity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setBackgroundOpacity(val);
                  triggerSave(elements, backgroundImageUrl, val);
                }}
                className="w-18 accent-amber-400"
              />
            </div>
          )}

          {/* Snap to grid toggle */}
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
              snapToGrid ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="text-[11px]">Snap</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
            <button
              type="button"
              onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.1))}
              className="p-1 text-neutral-400 hover:text-white cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono px-1 text-neutral-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}
              className="p-1 text-neutral-400 hover:text-white cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Viewport: Element Palette (Left) + Interactive Canvas (Center) + Properties (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Column 1: Palette of AV & Meeting Objects */}
        <div className="space-y-3">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add Equipment</span>
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">Click to insert</span>
            </div>

            {/* Category Filter */}
            <div className="grid grid-cols-3 gap-1 text-[10px]">
              {['All', 'Staging', 'Video', 'Audio', 'Lighting', 'Seating'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-1 rounded text-center transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-neutral-800 text-amber-400 font-bold border border-neutral-700'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Presets Grid */}
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {ELEMENT_PRESETS.filter(
                (p) => selectedCategory === 'All' || p.category === selectedCategory
              ).map((preset) => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => handleAddPresetElement(preset)}
                  className="w-full p-2 bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 hover:border-amber-400/50 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="p-1 rounded text-neutral-950"
                      style={{ backgroundColor: preset.color }}
                    >
                      {preset.icon}
                    </span>
                    <span className="text-xs text-white group-hover:text-amber-300 font-medium">
                      {preset.label}
                    </span>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Room Dimensions Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 space-y-2 text-xs">
            <span className="font-bold text-neutral-300 block uppercase tracking-wider text-[11px]">
              Room Dimensions
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-400 block mb-0.5">Length (ft)</label>
                <input
                  type="number"
                  value={roomDimensions.lengthFt}
                  onChange={(e) => {
                    const updated = { ...roomDimensions, lengthFt: Number(e.target.value) };
                    setRoomDimensions(updated);
                    triggerSave(elements, backgroundImageUrl, backgroundOpacity, updated);
                  }}
                  className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-400 block mb-0.5">Width (ft)</label>
                <input
                  type="number"
                  value={roomDimensions.widthFt}
                  onChange={(e) => {
                    const updated = { ...roomDimensions, widthFt: Number(e.target.value) };
                    setRoomDimensions(updated);
                    triggerSave(elements, backgroundImageUrl, backgroundOpacity, updated);
                  }}
                  className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-white text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 block mb-0.5">Trim Height (ft)</label>
              <input
                type="number"
                value={roomDimensions.ceilingHeightFt || 22}
                onChange={(e) => {
                  const updated = { ...roomDimensions, ceilingHeightFt: Number(e.target.value) };
                  setRoomDimensions(updated);
                  triggerSave(elements, backgroundImageUrl, backgroundOpacity, updated);
                }}
                className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Column 2 & 3: Visual Layout Canvas */}
        <div className="lg:col-span-2 space-y-2">
          <div
            className="relative bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-inner select-none cursor-crosshair min-h-[440px] flex items-center justify-center"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
            onClick={() => setSelectedElementId(null)}
          >
            {/* Transform Container with Zoom */}
            <div
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative w-[700px] h-[450px] transition-transform duration-75 origin-center"
              style={{
                transform: `scale(${zoomLevel})`,
              }}
            >
              {/* Optional Uploaded Floorplan Image Layer */}
              {backgroundImageUrl && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden bg-cover bg-center transition-opacity"
                  style={{
                    backgroundImage: `url(${backgroundImageUrl})`,
                    opacity: backgroundOpacity,
                  }}
                />
              )}

              {/* Room Boundary Dimensions Watermark */}
              <div className="absolute top-2 left-3 text-[10px] font-mono text-neutral-600 pointer-events-none">
                {roomDimensions.lengthFt}ft x {roomDimensions.widthFt}ft · Trim: {roomDimensions.ceilingHeightFt}ft
              </div>

              {/* Rendered Placed AV & Meeting Elements */}
              {elements.map((element) => {
                const isSelected = element.id === selectedElementId;

                return (
                  <div
                    key={element.id}
                    onMouseDown={(e) => handleMouseDown(e, element)}
                    className={`absolute flex items-center justify-center text-center p-1 rounded-md transition-shadow cursor-move font-mono select-none ${
                      isSelected
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-950 z-30 shadow-lg'
                        : 'hover:ring-1 hover:ring-neutral-400 z-10'
                    }`}
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      width: `${element.width}px`,
                      height: `${element.height}px`,
                      backgroundColor: `${element.color || '#3b82f6'}cc`,
                      border: `1px solid ${element.color || '#3b82f6'}`,
                      transform: `rotate(${element.rotation || 0}deg)`,
                    }}
                  >
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-bold text-white drop-shadow-xs px-1">
                      {element.label}
                    </div>

                    {/* Quick selection handle badge */}
                    {isSelected && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center text-[9px] font-bold shadow-xs">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}

              {elements.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-neutral-500 pointer-events-none">
                  <Grid className="w-10 h-10 mb-2 text-neutral-700" />
                  <p className="text-xs font-semibold">Diagram canvas is empty</p>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    Click items on the left or select a preset template
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick status bar under canvas */}
          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono px-2">
            <span>{elements.length} placed equipment & staging elements</span>
            <span>Click element to inspect, drag to move, rotate in sidebar</span>
          </div>
        </div>

        {/* Column 4: Element Inspector & Customization */}
        <div className="space-y-3">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3.5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 block border-b border-neutral-800 pb-2">
              Element Inspector
            </span>

            {selectedElement ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Label / Description</label>
                  <input
                    type="text"
                    value={selectedElement.label}
                    onChange={(e) => {
                      const updated = elements.map((item) =>
                        item.id === selectedElement.id ? { ...item, label: e.target.value } : item
                      );
                      setElements(updated);
                      triggerSave(updated);
                    }}
                    className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Width (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={400}
                      value={selectedElement.width}
                      onChange={(e) => {
                        const updated = elements.map((item) =>
                          item.id === selectedElement.id ? { ...item, width: Number(e.target.value) } : item
                        );
                        setElements(updated);
                        triggerSave(updated);
                      }}
                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Height (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={400}
                      value={selectedElement.height}
                      onChange={(e) => {
                        const updated = elements.map((item) =>
                          item.id === selectedElement.id ? { ...item, height: Number(e.target.value) } : item
                        );
                        setElements(updated);
                        triggerSave(updated);
                      }}
                      className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-neutral-400">Rotation Angle</label>
                    <span className="text-[10px] font-mono text-amber-400">
                      {selectedElement.rotation || 0}°
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRotateElement(selectedElement.id)}
                      className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Rotate +45°</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">Tech / Rigging Notes</label>
                  <textarea
                    rows={2}
                    value={selectedElement.notes || ''}
                    placeholder="e.g. Needs dual 20A circuit, 50ft loom run..."
                    onChange={(e) => {
                      const updated = elements.map((item) =>
                        item.id === selectedElement.id ? { ...item, notes: e.target.value } : item
                      );
                      setElements(updated);
                      triggerSave(updated);
                    }}
                    className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-white focus:outline-none focus:border-amber-400 placeholder-neutral-600 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/80">
                  <button
                    type="button"
                    onClick={() => handleDuplicateElement(selectedElement.id)}
                    className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded text-xs flex items-center justify-center gap-1 border border-neutral-800 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-amber-400" />
                    <span>Clone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteElement(selectedElement.id)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded transition-colors cursor-pointer"
                    title="Remove from diagram"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-neutral-500 space-y-1.5">
                <Info className="w-6 h-6 mx-auto text-neutral-600" />
                <p className="text-xs">No element selected</p>
                <p className="text-[10px] text-neutral-600">
                  Click any element on the canvas to configure position, scale, and technical notes
                </p>
              </div>
            )}
          </div>

          {/* Quick Summary Pill */}
          <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl text-[11px] font-mono space-y-1">
            <span className="text-neutral-500 block uppercase font-semibold text-[10px]">
              Proposal Integration
            </span>
            <div className="text-white flex items-center justify-between">
              <span>Attached Diagram:</span>
              <span className="text-emerald-400 font-bold">
                {backgroundImageUrl ? 'Custom CAD/Plan' : 'AV Overlay Grid'}
              </span>
            </div>
            <div className="text-neutral-400 flex items-center justify-between">
              <span>Elements Staged:</span>
              <span className="text-amber-400 font-bold">{elements.length} items</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
