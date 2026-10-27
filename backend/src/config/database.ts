import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();
const databaseName = process.env.DB_NAME;
const databaseUser = process.env.DB_USER;
const databasePassword = process.env.DB_PASSWORD;
if (!databaseName || !databaseUser || !databasePassword) {
  throw new Error("Database environment variables are missing");
}
export const sequelize = new Sequelize(
  databaseName,
  databaseUser,
  databasePassword,
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    dialect: "postgres",
    logging: false,
  }
);