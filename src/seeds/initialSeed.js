import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';
import {
  initModels,
  User,
  Campus,
  Cohort,
  Clan,
  AttendanceConfig
} from '../models/index.js';

async function runSeed() {
  try {
    initModels();
    await sequelize.sync({ alter: true });

    // === Usuario admin ===
    const passwordHash = await bcrypt.hash('admin123', 10);
    await User.findOrCreate({
      where: { email: 'admin@riwi.io' },
      defaults: {
        name: 'Admin RIWI',
        email: 'admin@riwi.io',
        passwordHash,
        role: 'ADMIN'
      }
    });

    // === Sedes ===
    const [medellin] = await Campus.findOrCreate({
      where: { code: 'MED' },
      defaults: { name: 'Medellín', code: 'MED' }
    });

    const [barranquilla] = await Campus.findOrCreate({
      where: { code: 'BAQ' },
      defaults: { name: 'Barranquilla', code: 'BAQ' }
    });

    // === Cohortes ===
    const [cohort3] = await Cohort.findOrCreate({
      where: { name: 'Cohorte-3' },
      defaults: { name: 'Cohorte-3', campusId: barranquilla.id }
    });

    const [cohort4] = await Cohort.findOrCreate({
      where: { name: 'Cohorte-4' },
      defaults: { name: 'Cohorte-4', campusId: medellin.id }
    });

    const [cohort6] = await Cohort.findOrCreate({
      where: { name: 'Cohorte-6' },
      defaults: { name: 'Cohorte-6', campusId: medellin.id }
    });

    // === Clanes (Moodle groups -> nuestra lógica = clanes)
    // Cohorte-3 (BAQ)
    const [clanMacondo]   = await Clan.findOrCreate({ where: { name: 'Macondo',      cohortId: cohort3.id }, defaults: { name: 'Macondo',      cohortId: cohort3.id } });
    const [clanNext]      = await Clan.findOrCreate({ where: { name: 'Next',         cohortId: cohort3.id }, defaults: { name: 'Next',         cohortId: cohort3.id } });
    const [clanAnalitica] = await Clan.findOrCreate({ where: { name: 'Analítica',    cohortId: cohort3.id }, defaults: { name: 'Analítica',    cohortId: cohort3.id } });
    const [clanCSharp]    = await Clan.findOrCreate({ where: { name: 'C#',           cohortId: cohort3.id }, defaults: { name: 'C#',           cohortId: cohort3.id } });
    const [clanJavaC3]    = await Clan.findOrCreate({ where: { name: 'Java',         cohortId: cohort3.id }, defaults: { name: 'Java',         cohortId: cohort3.id } });

    // Cohorte-4 (MED)
    const [clanLovelace]   = await Clan.findOrCreate({ where: { name: 'Lovelace',    cohortId: cohort4.id }, defaults: { name: 'Lovelace',    cohortId: cohort4.id } });
    const [clanNode]       = await Clan.findOrCreate({ where: { name: 'Node.js',    cohortId: cohort4.id }, defaults: { name: 'Node.js',    cohortId: cohort4.id } });
    const [clanHopper]     = await Clan.findOrCreate({ where: { name: 'Hopper',      cohortId: cohort4.id }, defaults: { name: 'Hopper',      cohortId: cohort4.id } });
    const [clanGosling]    = await Clan.findOrCreate({ where: { name: 'Gosling',     cohortId: cohort4.id }, defaults: { name: 'Gosling',     cohortId: cohort4.id } });
    const [clanBernersLee] = await Clan.findOrCreate({ where: { name: 'Berners Lee', cohortId: cohort4.id }, defaults: { name: 'Berners Lee', cohortId: cohort4.id } });
    const [clanVanRossum]  = await Clan.findOrCreate({ where: { name: 'Van Rossum', cohortId: cohort4.id }, defaults: { name: 'Van Rossum', cohortId: cohort4.id } });

    // Cohorte-6 (MED)
    const [clanHamilton] = await Clan.findOrCreate({ where: { name: 'Hamilton', cohortId: cohort6.id }, defaults: { name: 'Hamilton', cohortId: cohort6.id } });
    const [clanThompson] = await Clan.findOrCreate({ where: { name: 'Thompson', cohortId: cohort6.id }, defaults: { name: 'Thompson', cohortId: cohort6.id } });
    const [clanTuring]   = await Clan.findOrCreate({ where: { name: 'Turing', cohortId: cohort6.id }, defaults: { name: 'Turing', cohortId: cohort6.id } });
    const [clanMcCarthy] = await Clan.findOrCreate({ where: { name: 'McCarthy', cohortId: cohort6.id }, defaults: { name: 'McCarthy', cohortId: cohort6.id } });
    const [clanTesla]    = await Clan.findOrCreate({ where: { name: 'Tesla', cohortId: cohort6.id }, defaults: { name: 'Tesla', cohortId: cohort6.id } });
    const [clanRitchie]  = await Clan.findOrCreate({ where: { name: 'Ritchie', cohortId: cohort6.id }, defaults: { name: 'Ritchie', cohortId: cohort6.id } });

    // === Configuración de asistencias ===
    const configs = [
      // ===== Cohorte-3 (BAQ) =====
      // C3 -> AM
      { label: 'C3 AM - Macondo',   shift: 'AM', cohortId: cohort3.id, clanId: clanMacondo.id,   moodleAttendanceId: 71, moodleGroupId: 601, moodleCourseId: null },
      { label: 'C3 AM - Next',      shift: 'AM', cohortId: cohort3.id, clanId: clanNext.id,      moodleAttendanceId: 70, moodleGroupId: 0,   moodleCourseId: null },
      { label: 'C3 AM - Analítica', shift: 'AM', cohortId: cohort3.id, clanId: clanAnalitica.id, moodleAttendanceId: 74, moodleGroupId: 0,   moodleCourseId: null },

      // C3 -> PM
      { label: 'C3 PM - C#',        shift: 'PM', cohortId: cohort3.id, clanId: clanCSharp.id,    moodleAttendanceId: 72, moodleGroupId: 0,   moodleCourseId: null },
      { label: 'C3 PM - Java',      shift: 'PM', cohortId: cohort3.id, clanId: clanJavaC3.id,    moodleAttendanceId: 73, moodleGroupId: 0,   moodleCourseId: null },

      // ===== Cohorte-4 (MED) =====
      // C4 -> AM
      { label: 'C4 AM - Lovelace',  shift: 'AM', cohortId: cohort4.id, clanId: clanLovelace.id,  moodleAttendanceId: 64, moodleGroupId: 573, moodleCourseId: null },
      { label: 'C4 AM - Node.js',   shift: 'AM', cohortId: cohort4.id, clanId: clanNode.id,      moodleAttendanceId: 66, moodleGroupId: 0,   moodleCourseId: null },
      { label: 'C4 AM - Hopper',    shift: 'AM', cohortId: cohort4.id, clanId: clanHopper.id,    moodleAttendanceId: 67, moodleGroupId: 589, moodleCourseId: null },
      { label: 'C4 AM - Gosling',   shift: 'AM', cohortId: cohort4.id, clanId: clanGosling.id,   moodleAttendanceId: 65, moodleGroupId: 578, moodleCourseId: null },

      // C4 -> PM
      { label: 'C4 PM - Berners Lee', shift: 'PM', cohortId: cohort4.id, clanId: clanBernersLee.id, moodleAttendanceId: 69, moodleGroupId: 595, moodleCourseId: null },
      // De tu JSON sabemos que attendanceid 68 tiene courseid 75 (ejemplo)
      { label: 'C4 PM - Van Rossum',  shift: 'PM', cohortId: cohort4.id, clanId: clanVanRossum.id,  moodleAttendanceId: 68, moodleGroupId: 593, moodleCourseId: 75 },

      // ===== Cohorte-6 (MED) =====
      // C6 -> AM
      { label: 'C6 AM - Hamilton', shift: 'AM', cohortId: cohort6.id, clanId: clanHamilton.id, moodleAttendanceId: 79, moodleGroupId: 735, moodleCourseId: null },
      { label: 'C6 AM - Thompson', shift: 'AM', cohortId: cohort6.id, clanId: clanThompson.id, moodleAttendanceId: 79, moodleGroupId: 736, moodleCourseId: null },

      // C6 -> PM
      { label: 'C6 PM - Turing',   shift: 'PM', cohortId: cohort6.id, clanId: clanTuring.id,   moodleAttendanceId: 81, moodleGroupId: 742, moodleCourseId: null },
      { label: 'C6 PM - McCarthy', shift: 'PM', cohortId: cohort6.id, clanId: clanMcCarthy.id, moodleAttendanceId: 81, moodleGroupId: 741, moodleCourseId: null },
      { label: 'C6 PM - Tesla',    shift: 'PM', cohortId: cohort6.id, clanId: clanTesla.id,    moodleAttendanceId: 81, moodleGroupId: 740, moodleCourseId: null },
      { label: 'C6 PM - Ritchie',  shift: 'PM', cohortId: cohort6.id, clanId: clanRitchie.id,  moodleAttendanceId: 81, moodleGroupId: 743, moodleCourseId: null }
    ];

    for (const cfg of configs) {
      await AttendanceConfig.findOrCreate({
        where: {
          moodleAttendanceId: cfg.moodleAttendanceId,
          moodleGroupId: cfg.moodleGroupId
        },
        defaults: {
          ...cfg,
          enabled: true
        }
      });
    }

    console.log('Seed completado: usuario, sedes, cohortes, clanes y asistencias.');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  }
}

runSeed();
