import { Sequelize } from "sequelize";

/**
 * Database configuration
 * Supports environment variables for configuration:
 * - DB_STORAGE: Path to SQLite file (default: in-memory)
 * - DB_LOGGING: Enable SQL logging (default: false)
 */
const dbStorage = process.env.DB_STORAGE || ":memory:";
const dbLogging = process.env.DB_LOGGING === "true" ? console.log : false;

export const sq = new Sequelize({
  dialect: "sqlite",
  storage: dbStorage,
  logging: dbLogging,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

/**
 * Connects to the database and authenticates
 * Call this explicitly in your application, not on module import
 */
export async function connectToDB(): Promise<void> {
  try {
    await sq.authenticate();
    console.log("✅ Database connection established successfully");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    throw error;
  }
}

/**
 * Closes the database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await sq.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error closing database connection:", error);
    throw error;
  }
}


