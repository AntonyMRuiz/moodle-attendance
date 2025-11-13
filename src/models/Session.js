import { DataTypes, Model } from 'sequelize';

export class Session extends Model {}

export function initSession(sequelize) {
  Session.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

      cohortId: { type: DataTypes.BIGINT, allowNull: false },
      clanId: { type: DataTypes.BIGINT, allowNull: true },

      moodleSessionId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
      attendanceId: { type: DataTypes.BIGINT, allowNull: false },
      groupId: { type: DataTypes.BIGINT, allowNull: false },

      sessdate: { type: DataTypes.DATE, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: true },

      presentCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      lateCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      justifiedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      unjustifiedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
      totalStudents: { type: DataTypes.INTEGER, defaultValue: 0 },

      moodleUrl: { type: DataTypes.STRING, allowNull: true }
    },
    {
      sequelize,
      modelName: 'Session',
      tableName: 'sessions',
      timestamps: false
    }
  );
}
