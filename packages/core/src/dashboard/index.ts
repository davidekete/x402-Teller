import { connectToDB } from "./db/index";
import { syncModels } from "./db/models/transaction.model";

/**
 * Initializes the dashboard database
 * Call this once at application startup before using dashboard features
 *
 * @param options Configuration options
 * @param options.force If true, drops existing tables and recreates them (DEVELOPMENT ONLY)
 * @returns Promise that resolves when database is ready
 */
export async function initializeDashboard(options?: {
  force?: boolean;
}): Promise<void> {
  const force = options?.force ?? false;

  if (force) {
    console.warn(
      "⚠️  Dashboard initializing with force=true - existing data will be lost!"
    );
  }

  // Connect to database
  await connectToDB();

  // Sync models (create tables)
  await syncModels(force);

  console.log("✅ Dashboard initialized successfully");
}

// Re-export everything for convenience
export * from "./db/index";
export * from "./db/models/transaction.model";
export * from "./utils/record";
