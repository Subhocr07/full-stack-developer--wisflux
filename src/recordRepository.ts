import { Record } from "./types";

export class RecordRepository {
  private records: Record[] = [];

  async save(record: Record): Promise<boolean> {
    if (this.records.some((r) => r.id === record.id)) {
      return false;
    }
    this.records.push(record);
    return true;
  }

  async getAll(): Promise<Record[]> {
    return [...this.records];
  }

}
