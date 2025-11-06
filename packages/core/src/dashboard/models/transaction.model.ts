import { DataTypes } from "sequelize";
import { sq } from "../index";

const Transaction = sq.define("Transaction", {
  txID: {
    type: DataTypes.NUMBER,
    allowNull: false,
    autoIncrement: true,
  },
  client: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  txHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "verified", "settled", "failed"),
  },
  time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

const OffRampTx = sq.define("OffRamp", {
  offRampId: {
    type: DataTypes.NUMBER,
    allowNull: false,
    autoIncrement: true,
  },

  amount: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  txHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  currency: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

(async () => {
  await sq.sync({ force: true });
  console.log("Model Synced");
})();

export { Transaction, OffRampTx };
