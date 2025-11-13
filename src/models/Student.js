import { DataTypes, Model } from 'sequelize';

export class Student extends Model {}

export function initStudent(sequelize) {
  Student.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      moodleUserId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
      firstname: { type: DataTypes.STRING, allowNull: false },
      lastname: { type: DataTypes.STRING, allowNull: false },
      fullname: { type: DataTypes.STRING, allowNull: false }
    },
    {
      sequelize,
      modelName: 'Student',
      tableName: 'students',
      timestamps: false
    }
  );
}
