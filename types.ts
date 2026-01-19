
export interface ProcessedFile {
  file: File;
  previewUrl: string;
  id: string;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  OPTIMIZING = 'OPTIMIZING',
  PREPARING = 'PREPARING',
  STREAMING = 'STREAMING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface AppConfig {
  model: string;
  systemInstruction: string;
}
