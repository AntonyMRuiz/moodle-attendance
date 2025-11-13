import { Sequelize } from 'sequelize';
import { env } from './env.js';

export const sequelize = new Sequelize(
  env.dbName,
  env.dbUser,
  env.dbPassword,
  {
    host: env.dbHost,
    port: env.dbPort,
    dialect: 'mysql',
    logging: false
  }
);
