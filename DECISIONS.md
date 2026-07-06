# Decisions Document

This file documents the assumptions, strategies, trade-offs, and verification approach used in implementing the engineering assessment.

## Assumptions
1. **Invalid Records**: Any incoming record that is missing a category, has an invalid/unparseable date string for `occurredAt`, or has a value that is missing or cannot be converted to a valid number is considered invalid and must be skipped.
2. **Trimming**: String fields like `id` and `category` should be trimmed of leading and trailing whitespace to avoid false uniqueness differences (e.g. `"alpha"` and `"alpha "` should be treated as the same category).
3. **UTC Date Normalization**: We assume all date strings should be normalized to standard ISO 8601 format (`.toISOString()`) to ensure consistent filtering and sorting.

## Validation & Uniqueness Strategy

### Validation Approach
Incoming raw data is validated in `RecordNormalizer.isValid` before normalization. We use the **Zod** schema validation library for this.

**Why Zod was installed:**
1. **Declarative & Self-Documenting**: Instead of writing complex manual procedural checks (e.g. nested type checking for string dates, numeric value formats, etc.), Zod allows us to declare the record structure as a schema.
2. **Robust Input Coercion & Safe Parsing**: Zod handles inputs like string representations of numbers (e.g. `"17"`) and parses/normalizes them safely using schema transformations, raising validation errors for non-numeric strings or invalid dates.
3. **Maintainability**: A schema-based validation scales far better. As the third-party client feed changes or fields are added, the Zod schema can be easily updated in one place without touching core normalization code.
4. **Performance & Scalability for Large Datasets**: For long or complex data feeds, having a consolidated, optimized validation layer (like Zod) performs consistently better and prevents the overhead/bloat of multiple manual validation loops.
   
   **Comparison Example:**
   * *Manual Procedural Check:*
     ```typescript
     // Every additional field requires writing nested branches, type guards, and type casts:
     if (typeof raw.category !== "string" || raw.category.trim() === "") return false;
     if (typeof raw.occurredAt !== "string" || isNaN(Date.parse(raw.occurredAt))) return false;
     let val: number;
     if (typeof raw.value === "number") {
       val = raw.value;
     } else if (typeof raw.value === "string") {
       val = Number(raw.value);
       if (isNaN(val)) return false;
     } else {
       return false;
     }
     ```
   * *Zod Schema Validation:*
     ```typescript
     // All type guards, string-to-number coercions, and checks happen in a single pass:
     const parsed = ProviderRecordSchema.safeParse(raw);
     if (!parsed.success) return false;
     const record = parsed.data; // Fully typed & normalized
     ```
   * *Why it is better for performance & scaling:*
     As datasets grow to tens of thousands of records containing dozens of fields, the manual procedural method requires the JavaScript engine to execute deep, fragmented trees of `if-else` conditionals. Zod parses and normalizes the data structure in a single optimized pass, reducing execution overhead, simplifying JIT compilation for the V8 engine, and keeping the codebase completely clean.




### Chosen Uniqueness Strategy (Fallback ID)
When the provider's `id` is missing or empty, we use a **deterministic SHA-256 hash** as the fallback identity strategy:
- **Formula**: `sha256(category + "|" + normalizedOccurredAt + "|" + normalizedValue)`
- We use Node's built-in `crypto` library to calculate the hash.
- **Why this works**: A deterministic hash of the record's content ensures that if the exact same record is imported again (even without a provider ID), it will generate the same ID. This ensures idempotency.

### Idempotency
- When saving a record, `RecordRepository` checks if a record with the same `id` already exists.
- If it exists, the record is skipped, and it increments the `skippedDuplicate` count in the import summary.

## Trade-offs & Limitations
1. **In-Memory Store**: Since this assessment explicitly requests not adding a database, we use an in-memory array. In a production service, this would be backed by a persistent database (e.g., PostgreSQL or MongoDB) with a unique key index on `id`.
2. **Identical Record Collisions**: If two distinct events happen to have the exact same category, same value, and occur at the exact same millisecond, they will generate the same fallback ID and the second one will be skipped as a duplicate. In a real-world scenario, we might need a sequence counter, thread ID, or a high-resolution timestamp if sub-millisecond precision is required.

## Tools & Verification
- **Development Tools / AI Assistants**: Leveraged ChatGPT for pair programming, TypeScript development, and Jest test implementation.
- **Verification Approach**: Created a robust Jest test suite in `tests/recordService.spec.ts` covering:
  - Import summary counts on initial and repeated imports.
  - Verification of idempotency (no duplicate storing).
  - Validation rules skipping various types of malformed inputs.
  - Correct fallback ID generation.
  - Verification of sorting order (newest-first).
  - Filtering records by category, startDate, endDate, or both.

## Approximate Time Spent
- Setup & Design: 10 minutes
- Coding & Tests: 30 minutes
- Total time: ~50 minutes
