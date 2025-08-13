import { Job, Tool } from './database';

// Scanning Mode Enumeration
export enum ScanningMode {
  ADD_TOOL = 'add_tool',
  ASSIGN_TOOLS = 'assign_tools',
  RETURN_TOOLS = 'return_tools'
}

// Scanning State Management
export interface ScanningState {
  mode: ScanningMode;
  selectedJob: Job | null;
  scannedTools: Tool[];
  isScanning: boolean;
  error: string | null;
}

// Scan Result Types
export interface ScanResult {
  success: boolean;
  tool?: Tool;
  error?: string;
  isDuplicate?: boolean;
}

// Mode-specific configurations
export interface ScanModeConfig {
  id: ScanningMode;
  title: string;
  description: string;
  requiresJob: boolean;
  requiresToolType: boolean;
  buttonText: string;
  color: string;
}

export const SCAN_MODE_CONFIGS: ScanModeConfig[] = [
  {
    id: ScanningMode.ADD_TOOL,
    title: 'Add New Tool',
    description: 'Scan barcode and specify tool type to add new tool to database',
    requiresJob: false,
    requiresToolType: true,
    buttonText: 'Add Tool to Database',
    color: 'blue'
  },
  {
    id: ScanningMode.ASSIGN_TOOLS,
    title: 'Assign Tools to Job',
    description: 'Select job and scan tools to assign them to the job',
    requiresJob: true,
    requiresToolType: false,
    buttonText: 'Assign Tools to Job',
    color: 'green'
  },
  {
    id: ScanningMode.RETURN_TOOLS,
    title: 'Return Tools from Job',
    description: 'Select job and scan returned tools. Missing tools will be reported',
    requiresJob: true,
    requiresToolType: false,
    buttonText: 'Return Tools from Job',
    color: 'orange'
  }
];

// Return operation result
export interface ReturnToolsResult {
  success: boolean;
  returnedTools: Tool[];
  missingTools: Tool[];
  message?: string;
}

// Tool type suggestions (can be extended)
export const DEFAULT_TOOL_TYPES = [
  'Drill',
  'Hammer',
  'Screwdriver',
  'Level',
  'Tape Measure',
  'Saw',
  'Wrench',
  'Pliers',
  'Socket Set',
  'Safety Equipment',
  'Other'
];