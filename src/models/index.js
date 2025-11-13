import { sequelize } from '../config/db.js';

import { initAdminUser, AdminUser } from './AdminUser.js';
import { initCampus, Campus } from './Campus.js';
import { initCohort, Cohort } from './Cohort.js';
import { initClan, Clan } from './Clan.js';
import { initStudent, Student } from './Student.js';
import { initSession, Session } from './Session.js';
import { initAttendanceRecord, AttendanceRecord } from './AttendanceRecord.js';
import { initAttendanceConfig, AttendanceConfig } from './AttendanceConfig.js';
import { initStudentCohort, StudentCohort } from './StudentCohort.js';

export function initModels() {
  // Inicializar tablas
  initAdminUser(sequelize);
  initCampus(sequelize);
  initCohort(sequelize);
  initClan(sequelize);
  initStudent(sequelize);
  initSession(sequelize);
  initAttendanceRecord(sequelize);
  initAttendanceConfig(sequelize);
  initStudentCohort(sequelize);

  // Relaciones simples

  // Campus 1 - N Cohorts
  Campus.hasMany(Cohort, { foreignKey: 'campusId' });
  Cohort.belongsTo(Campus, { foreignKey: 'campusId' });

  // Cohort 1 - N Clans
  Cohort.hasMany(Clan, { foreignKey: 'cohortId' });
  Clan.belongsTo(Cohort, { foreignKey: 'cohortId' });

  // Cohort 1 - N Sessions
  Cohort.hasMany(Session, { foreignKey: 'cohortId' });
  Session.belongsTo(Cohort, { foreignKey: 'cohortId' });

  // Clan 1 - N Sessions
  Clan.hasMany(Session, { foreignKey: 'clanId' });
  Session.belongsTo(Clan, { foreignKey: 'clanId' });

  // Session 1 - N AttendanceRecord
  Session.hasMany(AttendanceRecord, { foreignKey: 'sessionId' });
  AttendanceRecord.belongsTo(Session, { foreignKey: 'sessionId' });

  // Student 1 - N AttendanceRecord
  Student.hasMany(AttendanceRecord, { foreignKey: 'studentId' });
  AttendanceRecord.belongsTo(Student, { foreignKey: 'studentId' });

  // Student N - M Cohort (tabla intermedia StudentCohort)
  Student.belongsToMany(Cohort, {
    through: StudentCohort,
    foreignKey: 'studentId',
    otherKey: 'cohortId'
  });
  Cohort.belongsToMany(Student, {
    through: StudentCohort,
    foreignKey: 'cohortId',
    otherKey: 'studentId'
  });

  // AttendanceConfig pertenece a Cohort y Clan
  Cohort.hasMany(AttendanceConfig, { foreignKey: 'cohortId' });
  AttendanceConfig.belongsTo(Cohort, { foreignKey: 'cohortId' });

  Clan.hasMany(AttendanceConfig, { foreignKey: 'clanId' });
  AttendanceConfig.belongsTo(Clan, { foreignKey: 'clanId' });
}

export {
  sequelize,
  AdminUser,
  Campus,
  Cohort,
  Clan,
  Student,
  Session,
  AttendanceRecord,
  AttendanceConfig,
  StudentCohort
};
