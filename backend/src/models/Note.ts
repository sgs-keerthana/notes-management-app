import { DataTypes } from "sequelize";
import { sequelize } from "../config/database";
const Note=sequelize.define(
    "Note",
    {
        id:{
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title:{
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        content:{
            type: DataTypes.TEXT,
            allowNull: false,
        },
        priority:{
            type: DataTypes.ENUM("Low","Medium","High"),
            allowNull: false,
            defaultValue: "Medium",
        },
    },
    {
        tableName: "notes",
        timestamps: true,
    }
);

export default Note;