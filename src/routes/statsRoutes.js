import express from 'express';
import { Op } from 'sequelize';
import {
  Cohort,
  Clan,
  Session,
  AttendanceRecord,
  Student,
  StudentCohort
} from '../models/index.js';
import { authRequired } from '../middlewares/auth.js';

export const statsRouter = express.Router();

function parseDateOnly(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// % asistencia por coder en cohorte
statsRouter.get('/cohort/:cohortId', authRequired, async (req, res) => {
  try {
    const { cohortId } = req.params;

    const studentCohort = await StudentCohort.findAll({
      where: { cohortId },
      include: [{ model: Student }]
    });

    const students = studentCohort.map((sc) => sc.Student);
    const totalStudents = students.length;

    const sessions = await Session.findAll({ where: { cohortId } });
    const totalSessions = sessions.length;

    const stats = [];

    for (const student of students) {
      const attended = await AttendanceRecord.count({
        where: {
          studentId: student.id,
          statusAcronym: ['P', 'R']
        }
      });

      const denom = totalSessions || 0;
      const percentage = denom > 0 ? Math.round((attended / denom) * 100) : 0;

      let status = 'BAD';
      if (percentage >= 90) status = 'GOOD';
      else if (percentage >= 80) status = 'WARNING';

      stats.push({
        studentId: student.id,
        fullname: student.fullname,
        percentage,
        status
      });
    }

    const statusCount = {
      good: stats.filter((s) => s.status === 'GOOD').length,
      warning: stats.filter((s) => s.status === 'WARNING').length,
      bad: stats.filter((s) => s.status === 'BAD').length
    };

    const avg =
      stats.length > 0
        ? stats.reduce((acc, s) => acc + s.percentage, 0) / stats.length
        : 0;

    res.json({
      cohortId,
      totalStudents,
      attendancePercentage: avg,
      statusCount,
      students: stats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo generar estadísticas por cohorte' });
  }
});

// resumen diario + por clan + sesiones (con link Moodle)
statsRouter.get('/cohort/:cohortId/summary', authRequired, async (req, res) => {
  try {
    const { cohortId } = req.params;
    const { start, end, clanId } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'start y end son requeridos (YYYY-MM-DD)' });
    }

    const startDate = parseDateOnly(start);
    const endDate = parseDateOnly(end);

    const whereSessions = {
      cohortId,
      sessdate: { [Op.between]: [startDate, endDate] }
    };
    if (clanId) whereSessions.clanId = clanId;

    const sessions = await Session.findAll({
      where: whereSessions,
      include: [{ model: Clan }]
    });

    const dailyMap = {};
    const byClanMap = {};
    const sessionsList = [];

    for (const s of sessions) {
      const dateStr = s.sessdate.toISOString().slice(0, 10);

      const countObj = {
        present: s.presentCount || 0,
        late: s.lateCount || 0,
        justified: s.justifiedCount || 0,
        unjustified: s.unjustifiedCount || 0,
        totalStudents: s.totalStudents || 0
      };

      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = {
          date: dateStr,
          totalSessions: 0,
          totalStudents: 0,
          present: 0,
          late: 0,
          justified: 0,
          unjustified: 0
        };
      }
      dailyMap[dateStr].totalSessions += 1;
      dailyMap[dateStr].totalStudents += countObj.totalStudents;
      dailyMap[dateStr].present += countObj.present;
      dailyMap[dateStr].late += countObj.late;
      dailyMap[dateStr].justified += countObj.justified;
      dailyMap[dateStr].unjustified += countObj.unjustified;

      const clanIdKey = s.clanId || 0;
      const clanName = s.Clan ? s.Clan.name : 'Sin clan';

      if (!byClanMap[clanIdKey]) {
        byClanMap[clanIdKey] = {
          clanId: clanIdKey,
          clanName,
          totalSessions: 0,
          totalStudents: 0,
          present: 0,
          late: 0,
          justified: 0,
          unjustified: 0
        };
      }
      byClanMap[clanIdKey].totalSessions += 1;
      byClanMap[clanIdKey].totalStudents += countObj.totalStudents;
      byClanMap[clanIdKey].present += countObj.present;
      byClanMap[clanIdKey].late += countObj.late;
      byClanMap[clanIdKey].justified += countObj.justified;
      byClanMap[clanIdKey].unjustified += countObj.unjustified;

      sessionsList.push({
        id: s.id,
        date: dateStr,
        clanId: s.clanId,
        clanName,
        description: s.description,
        present: countObj.present,
        late: countObj.late,
        justified: countObj.justified,
        unjustified: countObj.unjustified,
        totalStudents: countObj.totalStudents,
        moodleUrl: s.moodleUrl
      });
    }

    const daily = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
    const byClan = Object.values(byClanMap).sort((a, b) =>
      a.clanName.localeCompare(b.clanName)
    );

    res.json({
      cohortId,
      start,
      end,
      clanId: clanId || null,
      daily,
      byClan,
      sessions: sessionsList
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo generar el resumen del rango' });
  }
});
