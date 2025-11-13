import { DataTypes, Model } from 'sequelize';

export class Clan extends Model {}

export function initClan(sequelize) {
  Clan.init(
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      cohortId: { type: DataTypes.BIGINT, allowNull: false }
    },
    {
      sequelize,
      modelName: 'Clan',
      tableName: 'clans',
      timestamps: false
    }
  );
}
