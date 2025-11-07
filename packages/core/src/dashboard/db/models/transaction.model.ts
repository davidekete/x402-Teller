import { DataTypes } from "sequelize";
import { sq } from "../index";

/**
 * Transaction Model
 * Tracks all payment transactions through the facilitator
 */
const Transaction = sq.define(
  "Transaction",
  {
    txID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    client: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Client wallet address (Solana or EVM)",
    },
    txHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "Blockchain transaction hash",
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "Amount in smallest unit (e.g., lamports for SOL, wei for ETH)",
    },
    endpoint: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "API endpoint that was accessed",
    },
    network: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Blockchain network (e.g., solana-devnet, base-sepolia)",
    },
    asset: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Token/asset address (e.g., USDC contract address)",
    },
    status: {
      type: DataTypes.ENUM("pending", "verified", "settled", "failed"),
      defaultValue: "pending",
      allowNull: false,
    },
    time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["client"] },
      { fields: ["txHash"], unique: true },
      { fields: ["status"] },
      { fields: ["endpoint"] },
      { fields: ["network"] },
      { fields: ["time"] },
    ],
  }
);

/**
 * OffRamp Transaction Model
 * Tracks off-ramp transactions (crypto to fiat)
 */
const OffRampTx = sq.define(
  "OffRamp",
  {
    offRampId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: "Amount in smallest unit",
    },
    txHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "Blockchain transaction hash",
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Currency code (e.g., USD, EUR)",
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["txHash"], unique: true }, { fields: ["currency"] }],
  }
);

/**
 * Syncs models with the database
 * Set force=true only in development to drop existing tables
 */
export async function syncModels(force: boolean = false): Promise<void> {
  try {
    await sq.sync({ force });
    console.log(`✅ Models synced ${force ? "(with force)" : ""}`);
  } catch (error) {
    console.error("❌ Error syncing models:", error);
    throw error;
  }
}

export { Transaction, OffRampTx };
