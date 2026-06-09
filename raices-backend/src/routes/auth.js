import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { send2FATokenEmail } from '../utils/mailer.js';

dotenv.config();

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET no configurado en el .env');

const router = express.Router();

// Helper para generar código de 6 dígitos seguro
const generate2FACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. Registro de Usuários
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios para el registro.' });
    }

    // Verifica usuário existente
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este correo electrónico ya está en uso.' });
    }

    // Cria o usuário (higiene de arrays garantida no pre('save')/schema)
    const user = new User({
      name,
      email,
      phone,
      password, // Será hasheado automaticamente no pré-save
      addresses: [],
      orders: []
    });

    await user.save();

    // Gera JWT permanente diretamente (sem 2FA)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: [],
        orders: []
      },
      message: '¡Usuario registrado con éxito!'
    });

  } catch (err) {
    console.error('Erro no registro de usuário:', err);
    return res.status(500).json({ message: err.message });
  }
});

// 2. Login com envio de código 2FA
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'El correo electrónico y la contraseña son obligatorios.' });
    }

    // Busca usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas. Verifique su correo electrónico y contraseña.' });
    }

    // Valida senha
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas. Verifique su correo electrónico y contraseña.' });
    }

    // Gera JWT permanente diretamente (sem 2FA)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses || [],
        orders: user.orders || []
      },
      message: '¡Sesión iniciada con éxito!'
    });

  } catch (err) {
    console.error('Erro no login do usuário:', err);
    return res.status(500).json({ message: err.message });
  }
});

// 3. Verificação do Token 2FA e liberação da sessão permanente
router.post('/verify-2fa', async (req, res) => {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({ message: 'Se requieren el token temporal y el código de 6 dígitos.' });
    }

    // Valida o Token Temporário JWT
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ message: 'El tiempo de verificación ha expirado (5 min). Por favor, inicie sesión nuevamente.' });
    }

    if (decoded.step !== '2fa-pending') {
      return res.status(400).json({ message: 'Estado de autenticación inválido.' });
    }

    // Busca usuário pelo email do payload
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Valida código de segurança e expiração
    if (!user.twoFactorToken || user.twoFactorToken !== code.trim()) {
      return res.status(400).json({ message: 'Código de verificación incorrecto.' });
    }

    if (user.twoFactorExpires < new Date()) {
      return res.status(400).json({ message: 'El código de verificación ha expirado. Por favor, solicite un nuevo inicio de sesión.' });
    }

    // Autenticação bem-sucedida: Limpa o token do banco
    user.twoFactorToken = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    // Assina JWT Permanente (7 dias de validade)
    const token = jwt.sign(
      { id: user._id, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        addresses: user.addresses || [],
        orders: user.orders || []
      }
    });

  } catch (err) {
    console.error('Erro na verificação de 2FA:', err);
    return res.status(500).json({ message: err.message });
  }
});

export default router;
