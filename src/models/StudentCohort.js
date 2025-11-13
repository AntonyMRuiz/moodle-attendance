import { DataTypes, Model } from 'sequelize';

export class StudentCohort extends Model {}

export function initStudentCohort(sequelize) {
  StudentCohort.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      studentId: { type: DataTypes.BIGINT, allowNull: false },
      cohortId: { type: DataTypes.BIGINT, allowNull: false }
    },
    {
      sequelize,
      modelName: 'StudentCohort',
      tableName: 'student_cohorts',
      timestamps: false
    }
  );
}
