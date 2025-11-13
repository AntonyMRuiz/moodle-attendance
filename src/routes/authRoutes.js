import express from 'express';
import jwt from 'jsonwebtoken';
import { AdminUser } from '../models/index.js';
import { env } from '../config/env.js';

export const authRouter = express.Router();

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son requeridos' });
    }

    const user = await AdminUser.findOne({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn || '8h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno de login' });
  }
});
