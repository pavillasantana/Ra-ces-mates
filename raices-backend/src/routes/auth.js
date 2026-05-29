import express from 'express';
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não configurado');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const tempToken = jwt.sign({ id: '123', step: '2fa-pending' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    res.json({ tempToken, requires2FA: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/verify-2fa', async (req, res) => {
  try {
    const token = jwt.sign({ id: '123' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: 'Cliente', email: 'cliente@teste.com' } });
  } catch (err) {
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
});

export default router;
