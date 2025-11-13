import { DataTypes, Model } from 'sequelize';

export class AttendanceRecord extends Model {}

export function initAttendanceRecord(sequelize) {
  AttendanceRecord.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

      sessionId: { type: DataTypes.BIGINT, allowNull: false },
      studentId: { type: DataTypes.BIGINT, allowNull: false },

      statusAcronym: { type: DataTypes.STRING(10), allowNull: false }, // P/R/FJ/FI
      moodleLogId: { type: DataTypes.BIGINT, allowNull: false, unique: true }
    },
    {
      sequelize,
      modelName: 'AttendanceRecord',
      tableName: 'attendance_records',
      timestamps: false
    }
  );
}
