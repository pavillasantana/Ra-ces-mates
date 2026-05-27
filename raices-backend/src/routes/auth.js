import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    // Mock for now until DB connected
    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    // Mock login return
    const tempToken = jwt.sign({ id: '123', step: '2fa-pending' }, process.env.JWT_SECRET || 'secret', { expiresIn: '5m' });
    res.json({ tempToken, requires2FA: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/verify-2fa', async (req, res) => {
  try {
    // Mock 2FA verification
    const token = jwt.sign({ id: '123' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { name: 'Cliente', email: 'cliente@teste.com' } });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
});

export default router;
