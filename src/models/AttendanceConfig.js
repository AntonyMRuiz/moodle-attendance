import { DataTypes, Model } from 'sequelize';

export class AttendanceConfig extends Model {}

export function initAttendanceConfig(sequelize) {
  AttendanceConfig.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

      cohortId: { type: DataTypes.BIGINT, allowNull: false },
      clanId: { type: DataTypes.BIGINT, allowNull: true },

      attendanceId: { type: DataTypes.BIGINT, allowNull: false }, // Moodle attendanceid
      groupId: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 }, // Moodle groupid

      // id del módulo de asistencia (para construir el link take.php?id=XX)
      moodleModuleId: { type: DataTypes.BIGINT, allowNull: false },

      enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
    },
    {
      sequelize,
      modelName: 'AttendanceConfig',
      tableName: 'attendance_configs',
      timestamps: false
    }
  );
}
