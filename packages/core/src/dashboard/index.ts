import { Sequelize } from "sequelize";

export const sq = new Sequelize("sqlite::memory:");

async function connectToDB() {
  try {
    await sq.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

connectToDB()
  .then((res) => console.log(res))
  .catch((err) => console.error(err));


