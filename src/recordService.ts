import { ProviderClient } from "./providerClient";
import { RecordNormalizer } from "./recordNormalizer";
import { RecordRepository } from "./recordRepository";
import { Record, ImportSummary, RecordFilter } from "./types";

export class RecordService {
  constructor(
    private providerClient: ProviderClient,
    private normalizer: RecordNormalizer,
    private repository: RecordRepository
  ) {}

  async importRecords(): Promise<ImportSummary> {
    let providerRecords: any[] = [];
    try {
      providerRecords = await this.providerClient.fetchRecords();
      if (!Array.isArray(providerRecords)) {
        console.error("Provider client did not return an array of records.");
        return {
          imported: 0,
          skippedInvalid: 0,
          skippedDuplicate: 0,
        };
      }
    } catch (error) {
      console.error("Failed to fetch records from provider client:", error);
      return {
        imported: 0,
        skippedInvalid: 0,
        skippedDuplicate: 0,
      };
    }
    
    let imported = 0;
    let skippedInvalid = 0;
    let skippedDuplicate = 0;

    for (const providerRecord of providerRecords) {
      if (!this.normalizer.isValid(providerRecord)) {
        skippedInvalid++;
        continue;
      }

      const normalizedRecord = this.normalizer.normalize(providerRecord);
      const wasSaved = await this.repository.save(normalizedRecord);

      if (wasSaved) {
        imported++;
      } else {
        skippedDuplicate++;
      }
    }


    return {
      imported,
      skippedInvalid,
      skippedDuplicate,
    };
  }

  async getRecords(filter?: RecordFilter): Promise<Record[]> {
    let records = await this.repository.getAll();

    if (filter) {
      if (filter.category) {
        const categoryFilter = filter.category.trim();
        records = records.filter((r) => r.category === categoryFilter);
      }
      if (filter.startDate) {
        const startTime = new Date(filter.startDate).getTime();
        if (!isNaN(startTime)) {
          records = records.filter((r) => new Date(r.occurredAt).getTime() >= startTime);
        }
      }
      if (filter.endDate) {
        const endTime = new Date(filter.endDate).getTime();
        if (!isNaN(endTime)) {
          records = records.filter((r) => new Date(r.occurredAt).getTime() <= endTime);
        }
      }
    }

    // Return records sorted newest-first by date
    return records.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }
}

