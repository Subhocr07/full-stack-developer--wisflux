# Engineering Assessment

Welcome! This repository contains a small starter project for your engineering assessment. 

## Scenario

You are building a small TypeScript service that imports generic data records from an unreliable third-party provider and stores them for use by an internal dashboard. 

The current starter implementation is missing some key features and lacks robustness. Your task is to update the existing code, implement the missing functionality, and add appropriate tests.

## Setup Instructions

This is a Node.js project using TypeScript and Jest. Ensure you have Node.js installed, then run the following package scripts:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the tests:
   ```bash
   npm test
   ```

## Task Requirements

Please update the repository to fulfill the following requirements:

1. **Idempotency**: Make repeated imports idempotent. Repeated imports of the same provider data should not create duplicate stored records.
2. **Validation**: Validate and normalize the unreliable provider data. Safely reject any invalid records.
3. **Identity Strategy**: Define and document a fallback uniqueness strategy, as provider IDs may be missing from the incoming data.
4. **Sorting**: Return records sorted newest-first by date.
5. **Filtering**: Add filtering capabilities for category and an optional date range.
6. **Import Summary**: Add an import summary returning counts for: imported, skipped-invalid, and skipped-duplicate records.
7. **Testing**: Add meaningful tests covering repeated imports, malformed data, duplicates, sorting, filtering, and the import summary.

## Documentation

Create a `DECISIONS.md` file at the root of the project. Please briefly document:
- Your assumptions.
- Your validation approach and chosen uniqueness strategy.
- Any trade-offs or known limitations in your solution.
- Any development tools, AI assistants, or documentation you used, and your verification approach.
- The approximate time spent on the task.

## Guidelines & Expectations

- **Time & Effort**: This task is designed to take roughly 90 minutes. You may spend additional time if you wish, but a clear, well-reasoned solution is much more valuable than extra features, extensive refactoring, or infrastructure.
- **Scope**: Keep the implementation clean and focused. Please do not add a database, web server, Docker, or unrelated external dependencies unless you firmly believe it is necessary (and if so, explain why in `DECISIONS.md`).
- **Submission**: Please create a new repository under your own personal account, push your completed work there, and share access with us before the upcoming discussion round.
