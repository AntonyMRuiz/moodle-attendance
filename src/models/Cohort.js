import { DataTypes, Model } from 'sequelize';

export class Cohort extends Model {}

export function initCohort(sequelize) {
  Cohort.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false }, // C3, C4, C6, etc.
      campusId: { type: DataTypes.BIGINT, allowNull: false }
    },
    {
      sequelize,
      modelName: 'Cohort',
      tableName: 'cohorts',
      timestamps: false
    }
  );
}
