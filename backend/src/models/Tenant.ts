import { DataTypes } from "sequelize";
import { sequelize } from "../config/database";
const Tenant = sequelize.define(
    "Tenant",
    {
        id:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
    },
    {
        tableName: "tenants",
        timestamps: true,
    }
);
export default Tenant;