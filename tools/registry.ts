import { FileText, Type, Image, Video, Music, MonitorPlay, QrCode, GitCompare, Calculator, Globe, Cpu, Palette, Info, FileStack, Calendar, Binary, Gamepad2 } from 'lucide-react';
import { Tool, ToolRegistry, ToolCategory } from '../types';
import { TextAnalyzer } from './TextAnalyzer';
import { FancyFontGenerator } from './FancyFontGenerator';
import { ImageConverter } from './ImageConverter';
import { VideoConverter } from './VideoConverter';
import { AudioConverter } from './AudioConverter';
import { AspectRatioEditor } from './AspectRatioEditor';
import { QrGenerator } from './QrGenerator';
import { DiffViewer } from './DiffViewer';
import { UnitConverter } from './UnitConverter';
import { WorldClock } from './WorldClock';
import { HardwareTester } from './HardwareTester';
import { ColorPalette } from './ColorPalette';
import { ExifViewer } from './ExifViewer';
import { PdfTools } from './PdfTools';
import { DateDifference } from './DateDifference';
import { BaseConverter } from './BaseConverter';
import { SmartCalculator } from './SmartCalculator';

// This registry makes it easy to add new tools.
// Just import the component and add a new entry object.

export const tools: ToolRegistry = {
  // New Tools
  'smart-calculator': {
    id: 'smart-calculator',
    name: 'Smart Calculator',
    description: 'Advanced scientific calculator with history, trigonometry, and function plotting features.',
    icon: Calculator,
    component: SmartCalculator,
    category: ToolCategory.UTILITY
  },
  'date-diff': {
    id: 'date-diff',
    name: 'Date Calculator',
    description: 'Calculate the exact duration between two dates in years, months, and days.',
    icon: Calendar,
    component: DateDifference,
    category: ToolCategory.UTILITY
  },
  'base-converter': {
    id: 'base-converter',
    name: 'Base Converter',
    description: 'Real-time conversion between Binary, Octal, Decimal, and Hexadecimal.',
    icon: Binary,
    component: BaseConverter,
    category: ToolCategory.DEVELOPER
  },
  // Previous Tools
  'pdf-tools': {
    id: 'pdf-tools',
    name: 'PDF Suite',
    description: 'All-in-one PDF tool: Merge, Split, Rotate, Watermark, and Image to PDF.',
    icon: FileStack,
    component: PdfTools,
    category: ToolCategory.UTILITY
  },
  'color-palette': {
    id: 'color-palette',
    name: 'Color Palette Gen',
    description: 'Generate scientific palettes, pick screen colors, or extract from images.',
    icon: Palette,
    component: ColorPalette,
    category: ToolCategory.GENERATOR
  },
  'exif-viewer': {
    id: 'exif-viewer',
    name: 'EXIF Viewer',
    description: 'Inspect hidden metadata in your photos (Camera settings, GPS, etc).',
    icon: Info,
    component: ExifViewer,
    category: ToolCategory.UTILITY
  },
  'diff-viewer': {
    id: 'diff-viewer',
    name: 'Text Diff Viewer',
    description: 'Compare two text blocks to find additions and deletions.',
    icon: GitCompare,
    component: DiffViewer,
    category: ToolCategory.DEVELOPER
  },
  'qr-generator': {
    id: 'qr-generator',
    name: 'QR Generator',
    description: 'Generate QR codes for links, WiFi, or text. Download as PNG.',
    icon: QrCode,
    component: QrGenerator,
    category: ToolCategory.GENERATOR
  },
  'unit-converter': {
    id: 'unit-converter',
    name: 'Unit Converter',
    description: 'Convert length, weight, temperature, volume, and area units.',
    icon: Calculator,
    component: UnitConverter,
    category: ToolCategory.UTILITY
  },
  'world-clock': {
    id: 'world-clock',
    name: 'World Timer',
    description: 'Check current time across timezones and convert specific times.',
    icon: Globe,
    component: WorldClock,
    category: ToolCategory.UTILITY
  },
  'hardware-tester': {
    id: 'hardware-tester',
    name: 'Hardware Check',
    description: 'Test your keyboard inputs, mouse buttons, gamepads, and view device info.',
    icon: Cpu,
    component: HardwareTester,
    category: ToolCategory.UTILITY
  },
  'aspect-ratio': {
    id: 'aspect-ratio',
    name: 'Aspect Ratio Editor',
    description: 'Resize canvas, change aspect ratios (16:9, 1:1, etc.), and adjust image padding or cropping.',
    icon: MonitorPlay,
    component: AspectRatioEditor,
    category: ToolCategory.CONVERTER
  },
  'audio-converter': {
    id: 'audio-converter',
    name: 'Audio Converter',
    description: 'Process audio files: convert formats (MP3, WAV, AAC), adjust speed, volume, and sample rate.',
    icon: Music,
    component: AudioConverter,
    category: ToolCategory.CONVERTER
  },
  'image-converter': {
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert images between formats (PNG, JPG, WEBP) entirely offline using your browser.',
    icon: Image,
    component: ImageConverter,
    category: ToolCategory.CONVERTER
  },
  'video-converter': {
    id: 'video-converter',
    name: 'Video Converter',
    description: 'Convert videos to MP4/WebM, create GIFs, or extract audio as WAV.',
    icon: Video,
    component: VideoConverter,
    category: ToolCategory.CONVERTER
  },
  'fancy-fonts': {
      id: 'fancy-fonts',
      name: 'Fancy Fonts',
      description: 'Convert normal text into cursive, bold, gothic, and other stylish Unicode formats.',
      icon: Type,
      component: FancyFontGenerator,
      category: ToolCategory.GENERATOR
  },
  'text-analyzer': {
    id: 'text-analyzer',
    name: 'Text Analyzer',
    description: 'Get detailed insights into your text, including word count, reading time, and more.',
    icon: FileText,
    component: TextAnalyzer,
    category: ToolCategory.TEXT
  }
};

export const getToolById = (id: string): Tool | undefined => tools[id];
export const getAllTools = (): Tool[] => Object.values(tools);