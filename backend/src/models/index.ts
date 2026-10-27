import Tenant from "./Tenant";
import User from "./User";
import Note from "./Note";

// One tenant can have many users.
Tenant.hasMany(User, {
  foreignKey: {
    name: "tenantId",
    allowNull: false,
  },onDelete: "CASCADE",
});

User.belongsTo(Tenant, {
  foreignKey: "tenantId",
});

// One user can have many notes.
User.hasMany(Note, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  }, onDelete: "CASCADE",
});

Note.belongsTo(User, {
  foreignKey: "userId",
});

// One tenant can have many notes.
Tenant.hasMany(Note, {
  foreignKey: {
    name: "tenantId",
    allowNull: false,
  }, onDelete: "CASCADE",
});

Note.belongsTo(Tenant, {
  foreignKey: "tenantId",
});

export { Tenant, User, Note };
