import axios from 'axios';
import { sequelize } from '../config/db.js';
import { env } from '../config/env.js';
import {
  AttendanceConfig,
  Session,
  AttendanceRecord,
  Student,
  StudentCohort
} from '../models/index.js';

function buildMoodleUrl() {
  // En .env: MOODLE_BASE_URL debe ser el endpoint:
  // https://moodle.riwi.io/webservice/rest/server.php
  return env.moodleBaseUrl;
}

async function getSessionsFromMoodle(attendanceId) {
  const url = buildMoodleUrl();
  const params = {
    wstoken: env.moodleToken,
    moodlewsrestformat: env.moodleFormat,
    wsfunction: 'mod_attendance_get_sessions',
    attendanceid: attendanceId
  };

  const { data } = await axios.get(url, { params });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.sessions)) return data.sessions;
  return [];
}

export async function syncAttendanceForConfig(config) {
  const sessionsFromMoodle = await getSessionsFromMoodle(config.attendanceId);

  await sequelize.transaction(async (t) => {
    for (const s of sessionsFromMoodle) {
      if (config.groupId && s.groupid !== config.groupId) continue;

      // map statusid -> acronym
      const statusById = {};
      for (const st of s.statuses || []) {
        statusById[st.id] = st.acronym; // P/R/FJ/FI
      }

      let presentCount = 0;
      let lateCount = 0;
      let justifiedCount = 0;
      let unjustifiedCount = 0;

      for (const log of s.attendance_log || []) {
        const ac = statusById[log.statusid];
        if (ac === 'P') presentCount++;
        else if (ac === 'R') lateCount++;
        else if (ac === 'FJ') justifiedCount++;
        else if (ac === 'FI') unjustifiedCount++;
      }

      const totalStudents = (s.users || []).length;
      const sessDate = new Date(s.sessdate * 1000);

      const moodleUrl = `${env.moodleTakeBase}/mod/attendance/take.php?id=${config.moodleModuleId}&sessionid=${s.id}&grouptype=${config.groupId || 0}`;

      const [session] = await Session.upsert(
        {
          cohortId: config.cohortId,
          clanId: config.clanId || null,

          moodleSessionId: s.id,
          attendanceId: s.attendanceid,
          groupId: s.groupid,

          sessdate: sessDate,
          description: s.description || 'Sesión de clase',

          presentCount,
          lateCount,
          justifiedCount,
          unjustifiedCount,
          totalStudents,

          moodleUrl
        },
        {
          transaction: t,
          returning: true,
          conflictFields: ['moodleSessionId']
        }
      );

      // upsert estudiantes
      for (const u of s.users || []) {
        const [student] = await Student.upsert(
          {
            moodleUserId: u.id,
            firstname: u.firstname,
            lastname: u.lastname,
            fullname: `${u.firstname} ${u.lastname}`
          },
          { transaction: t }
        );

        await StudentCohort.findOrCreate({
          where: { studentId: student.id, cohortId: config.cohortId },
          defaults: { studentId: student.id, cohortId: config.cohortId },
          transaction: t
        });
      }

      // logs individuales
      for (const log of s.attendance_log || []) {
        const ac = statusById[log.statusid];
        const student = await Student.findOne({
          where: { moodleUserId: log.studentid },
          transaction: t
        });
        if (!student) continue;

        await AttendanceRecord.upsert(
          {
            sessionId: session.id,
            studentId: student.id,
            statusAcronym: ac,
            moodleLogId: log.id
          },
          { transaction: t }
        );
      }
    }
  });
}

export async function syncAllAttendanceConfigs() {
  const configs = await AttendanceConfig.findAll({ where: { enabled: true } });
  for (const cfg of configs) {
    await syncAttendanceForConfig(cfg);
  }
}
