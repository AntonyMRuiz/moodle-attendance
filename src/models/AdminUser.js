import { DataTypes, Model } from 'sequelize';

export class AdminUser extends Model {}

export function initAdminUser(sequelize) {
  AdminUser.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false } // plano por ahora
    },
    {
      sequelize,
      modelName: 'AdminUser',
      tableName: 'admin_users',
      timestamps: false
    }
  );
}
