import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  component: React.ComponentType;
  category: ToolCategory;
}

export enum ToolCategory {
  DEVELOPER = 'Developer',
  TEXT = 'Text',
  CONVERTER = 'Converter',
  GENERATOR = 'Generator',
  UTILITY = 'Utility'
}

export interface ToolRegistry {
  [key: string]: Tool;
}