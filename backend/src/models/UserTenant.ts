import { DataTypes } from "sequelize";
import { sequelize } from "../config/database";

const UserTenant = sequelize.define(
  "UserTenant",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "user_tenants",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["userId", "tenantId"],
      },
    ],
  }
);

export default UserTenant;