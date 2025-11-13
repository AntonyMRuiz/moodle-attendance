import express from 'express';
import { authRequired } from '../middlewares/auth.js';
import { Campus, Cohort, Clan } from '../models/index.js';

export const metaRouter = express.Router();

metaRouter.get('/campuses', authRequired, async (req, res) => {
  const campuses = await Campus.findAll({ order: [['name', 'ASC']] });
  res.json(campuses);
});

metaRouter.get('/cohorts', authRequired, async (req, res) => {
  const { campusId } = req.query;
  const where = {};
  if (campusId) where.campusId = campusId;
  const cohorts = await Cohort.findAll({ where, order: [['name', 'ASC']] });
  res.json(cohorts);
});

metaRouter.get('/clans', authRequired, async (req, res) => {
  const { cohortId } = req.query;
  const where = {};
  if (cohortId) where.cohortId = cohortId;
  const clans = await Clan.findAll({ where, order: [['name', 'ASC']] });
  res.json(clans);
});
