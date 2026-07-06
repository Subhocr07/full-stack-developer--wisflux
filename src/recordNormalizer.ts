import * as crypto from "crypto";
import { z } from "zod";
import { ProviderRecord, Record } from "./types";

// Standardized schema validation framework for incoming provider records
const ProviderRecordSchema = z.object({
  id: z.string().trim().optional(),
  category: z.string().trim().min(1),
  occurredAt: z.string().trim().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  value: z
    .union([
      z.number(),
      z.string().refine((val) => !isNaN(Number(val)), {
        message: "Value must be a numeric string or number",
      }),
    ])
    .transform((val) => Number(val)),
});

export class RecordNormalizer {
  isValid(providerRecord: ProviderRecord): boolean {
    const result = ProviderRecordSchema.safeParse(providerRecord);
    return result.success;
  }

  normalize(providerRecord: ProviderRecord): Record {
    const parsed = ProviderRecordSchema.parse(providerRecord);
    const category = parsed.category;
    const occurredAt = new Date(parsed.occurredAt).toISOString();
    const value = parsed.value;

    let id = parsed.id;
    if (!id || id.trim() === "") {
      const hashInput = `${category}|${occurredAt}|${value}`;
      id = crypto.createHash("sha256").update(hashInput).digest("hex");
    } else {
      id = id.trim();
    }

    return {
      id,
      category,
      occurredAt,
      value,
    };
  }
}


