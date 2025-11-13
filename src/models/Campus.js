import { DataTypes, Model } from 'sequelize';

export class Campus extends Model {}

export function initCampus(sequelize) {
  Campus.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false } // Medellín / Barranquilla
    },
    {
      sequelize,
      modelName: 'Campus',
      tableName: 'campuses',
      timestamps: false
    }
  );
}
