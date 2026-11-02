import Tenant from "./Tenant";
import User from "./User";
import Note from "./Note";
import UserTenant from "./UserTenant";

// Many-to-many relationship between User and Tenant
User.belongsToMany(Tenant, {
  through: UserTenant,
  foreignKey: "userId",
  otherKey: "tenantId",
});

Tenant.belongsToMany(User, {
  through: UserTenant,
  foreignKey: "tenantId",
  otherKey: "userId",
});

// One user can have many notes
User.hasMany(Note, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

Note.belongsTo(User, {
  foreignKey: "userId",
});

// One tenant can have many notes
Tenant.hasMany(Note, {
  foreignKey: {
    name: "tenantId",
    allowNull: false,
  },
  onDelete: "CASCADE",
});

Note.belongsTo(Tenant, {
  foreignKey: "tenantId",
});

export { Tenant, User, Note, UserTenant };