import 'dotenv/config';

export const env = {
  port: process.env.PORT,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  moodleBaseUrl: process.env.MOODLE_BASE_URL,
  moodleToken: process.env.MOODLE_TOKEN,
  moodleFormat: process.env.MOODLE_WS_FORMAT,
  moodleTakeBase: process.env.MOODLE_ATTENDANCE_TAKE_BASE
};
