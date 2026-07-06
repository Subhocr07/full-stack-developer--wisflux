export type ProviderRecord = {
  id?: string;
  category?: string;
  occurredAt?: string;
  value?: string | number;
};

export type Record = {
  id: string;
  category: string;
  occurredAt: string;
  value: number;
};

export type ImportSummary = {
  imported: number;
  skippedInvalid: number;
  skippedDuplicate: number;
};

export type RecordFilter = {
  category?: string;
  startDate?: string;
  endDate?: string;
};

