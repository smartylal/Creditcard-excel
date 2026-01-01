export interface Transaction {
  date: string;
  description: string;
  reference: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface ProcessingError {
  title: string;
  message: string;
}

export interface ExtractedData {
  fileName: string;
  transactions: Transaction[];
}