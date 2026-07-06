import { ProviderRecord } from "./types";

export class ProviderClient {
  async fetchRecords(): Promise<ProviderRecord[]> {
    return [
      {
        id: "record-001",
        category: "alpha",
        occurredAt: "2026-07-01T10:00:00Z",
        value: 42,
      },
      {
        id: "record-001",
        category: "alpha",
        occurredAt: "2026-07-01T10:00:00Z",
        value: 42,
      },
      {
        id: "record-002",
        category: "beta",
        occurredAt: "invalid-date",
        value: "17",
      },
      {
        category: "alpha",
        occurredAt: "2026-07-03T10:00:00Z",
        value: 99,
      },
      {
        id: "record-003",
        category: "beta",
        occurredAt: "2026-07-02T10:00:00Z",
        value: 15,
      },
    ];
  }
}
