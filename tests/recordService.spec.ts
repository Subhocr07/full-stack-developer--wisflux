import { RecordService } from "../src/recordService";
import { ProviderClient } from "../src/providerClient";
import { RecordNormalizer } from "../src/recordNormalizer";
import { RecordRepository } from "../src/recordRepository";
import { ProviderRecord } from "../src/types";

describe("RecordService", () => {
  let service: RecordService;
  let client: ProviderClient;
  let normalizer: RecordNormalizer;
  let repository: RecordRepository;

  beforeEach(() => {
    client = new ProviderClient();
    normalizer = new RecordNormalizer();
    repository = new RecordRepository();
    service = new RecordService(client, normalizer, repository);
  });

  describe("Importing Records", () => {
    it("should return the correct ImportSummary and store valid records from the default provider", async () => {
      const summary = await service.importRecords();

      expect(summary).toEqual({
        imported: 3,
        skippedInvalid: 1,
        skippedDuplicate: 1,
      });

      const records = await service.getRecords();
      expect(records.length).toBe(3);

      // Verify records are stored and normalized correctly
      const first = records.find(r => r.category === "beta");
      expect(first).toBeDefined();
      expect(first?.id).toBe("record-003");
      expect(first?.value).toBe(15);
    });

    it("should be idempotent and skip all duplicates on a repeated import", async () => {
      // First import
      const firstSummary = await service.importRecords();
      expect(firstSummary.imported).toBe(3);

      // Second import with the same provider data
      const secondSummary = await service.importRecords();
      expect(secondSummary).toEqual({
        imported: 0,
        skippedInvalid: 1, // Invalid records are still scanned and classified as invalid
        skippedDuplicate: 4, // 3 imported previously + 1 duplicate in the raw feed itself
      });

      const records = await service.getRecords();
      expect(records.length).toBe(3);
    });

    it("should generate a deterministic ID if ID is missing or empty in the provider feed", async () => {
      const testRecords: ProviderRecord[] = [
        {
          category: "alpha",
          occurredAt: "2026-07-03T10:00:00Z",
          value: 99,
        },
        {
          category: "alpha",
          occurredAt: "2026-07-03T10:00:00Z",
          value: 99,
        },
      ];

      jest.spyOn(client, "fetchRecords").mockResolvedValue(testRecords);

      const summary = await service.importRecords();
      expect(summary).toEqual({
        imported: 1,
        skippedInvalid: 0,
        skippedDuplicate: 1, // Second one should resolve to the same ID and be skipped
      });

      const records = await service.getRecords();
      expect(records.length).toBe(1);
      expect(records[0]?.id).toBeDefined();
      expect(records[0]?.id?.length).toBe(64); // SHA-256 hex length
    });

    it("should safely reject records with malformed/invalid properties", async () => {
      const malformedRecords: ProviderRecord[] = [
        {
          id: "bad-1",
          category: "", // Empty category
          occurredAt: "2026-07-03T10:00:00Z",
          value: 12,
        },
        {
          id: "bad-2",
          category: "alpha",
          occurredAt: "not-a-date", // Malformed date
          value: 12,
        },
        {
          id: "bad-3",
          category: "alpha",
          occurredAt: "2026-07-03T10:00:00Z",
          value: "non-numeric-value", // Non-numeric string value
        },
        {
          id: "bad-4",
          occurredAt: "2026-07-03T10:00:00Z",
          value: 12,
          // Missing category
        },
        {
          id: "bad-5",
          category: "alpha",
          occurredAt: "2026-07-03T10:00:00Z",
          // Missing value
        },
      ];

      jest.spyOn(client, "fetchRecords").mockResolvedValue(malformedRecords);

      const summary = await service.importRecords();
      expect(summary).toEqual({
        imported: 0,
        skippedInvalid: 5,
        skippedDuplicate: 0,
      });

      const records = await service.getRecords();
      expect(records.length).toBe(0);
    });

    it("should return zero counts and not crash if provider client throws an error", async () => {
      jest.spyOn(client, "fetchRecords").mockRejectedValue(new Error("Network Timeout"));

      // Suppress console.error in tests for cleaner output
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const summary = await service.importRecords();
      expect(summary).toEqual({
        imported: 0,
        skippedInvalid: 0,
        skippedDuplicate: 0,
      });

      errorSpy.mockRestore();
    });

    it("should return zero counts and not crash if provider client returns a non-array", async () => {
      jest.spyOn(client, "fetchRecords").mockResolvedValue("invalid-string" as any);

      // Suppress console.error in tests for cleaner output
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const summary = await service.importRecords();
      expect(summary).toEqual({
        imported: 0,
        skippedInvalid: 0,
        skippedDuplicate: 0,
      });

      errorSpy.mockRestore();
    });
  });


  describe("Retrieval, Sorting, and Filtering", () => {
    beforeEach(async () => {
      const testRecords: ProviderRecord[] = [
        {
          id: "rec-1",
          category: "alpha",
          occurredAt: "2026-07-01T12:00:00Z",
          value: 10,
        },
        {
          id: "rec-2",
          category: "beta",
          occurredAt: "2026-07-03T12:00:00Z",
          value: 20,
        },
        {
          id: "rec-3",
          category: "alpha",
          occurredAt: "2026-07-02T12:00:00Z",
          value: 30,
        },
      ];

      jest.spyOn(client, "fetchRecords").mockResolvedValue(testRecords);
      await service.importRecords();
    });

    it("should retrieve all records sorted newest-first by date", async () => {
      const records = await service.getRecords();

      expect(records.length).toBe(3);
      expect(records[0]?.id).toBe("rec-2"); // 2026-07-03
      expect(records[1]?.id).toBe("rec-3"); // 2026-07-02
      expect(records[2]?.id).toBe("rec-1"); // 2026-07-01
    });

    it("should filter records by category", async () => {
      const alphaRecords = await service.getRecords({ category: "alpha" });
      expect(alphaRecords.length).toBe(2);
      expect(alphaRecords[0]?.id).toBe("rec-3");
      expect(alphaRecords[1]?.id).toBe("rec-1");

      const betaRecords = await service.getRecords({ category: "beta" });
      expect(betaRecords.length).toBe(1);
      expect(betaRecords[0]?.id).toBe("rec-2");

      const emptyRecords = await service.getRecords({ category: "non-existent" });
      expect(emptyRecords.length).toBe(0);
    });

    it("should filter records by startDate", async () => {
      const filtered = await service.getRecords({ startDate: "2026-07-02T00:00:00Z" });
      expect(filtered.length).toBe(2);
      expect(filtered[0]?.id).toBe("rec-2"); // 2026-07-03
      expect(filtered[1]?.id).toBe("rec-3"); // 2026-07-02
    });

    it("should filter records by endDate", async () => {
      const filtered = await service.getRecords({ endDate: "2026-07-02T23:59:59Z" });
      expect(filtered.length).toBe(2);
      expect(filtered[0]?.id).toBe("rec-3"); // 2026-07-02
      expect(filtered[1]?.id).toBe("rec-1"); // 2026-07-01
    });

    it("should filter records by both startDate and endDate", async () => {
      const filtered = await service.getRecords({
        startDate: "2026-07-02T00:00:00Z",
        endDate: "2026-07-02T23:59:59Z",
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0]?.id).toBe("rec-3");
    });
  });
});

