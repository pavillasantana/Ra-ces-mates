import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { send2FATokenEmail } from '../utils/mailer.js';

dotenv.config();

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não configurado no .env');

const router = express.Router();

// Helper para gerar código de 6 dígitos seguro
const generate2FACode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 1. Registro de Usuários
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios para cadastro.' });
    }

    // Verifica usuário existente
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este e-mail já está sendo utilizado.' });
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

    // Gera token de 6 dígitos para verificação 2FA
    const code = generate2FACode();
    user.twoFactorToken = code;
    user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos de validade
    await user.save();

    // Dispara e-mail de 2FA
    await send2FATokenEmail(email, name, code);

    // Gera token temporário JWT
    const tempToken = jwt.sign(
      { email, step: '2fa-pending' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '5m' }
    );

    return res.status(201).json({ 
      requires2FA: true, 
      tempToken, 
      email,
      message: 'Usuário registrado! Insira o código 2FA enviado ao seu e-mail para ativar a sessão.' 
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
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    // Busca usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas. Verifique e-mail e senha.' });
    }

    // Valida senha
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas. Verifique e-mail e senha.' });
    }

    // Gera token 2FA de 6 dígitos
    const code = generate2FACode();
    user.twoFactorToken = code;
    user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000); // Validade de 5 minutos
    await user.save();

    // Envia o e-mail de 2FA
    await send2FATokenEmail(email, user.name, code);

    // Token temporário
    const tempToken = jwt.sign(
      { email, step: '2fa-pending' }, 
      process.env.JWT_SECRET, 
      { expiresIn: '5m' }
    );

    return res.json({ 
      requires2FA: true, 
      tempToken, 
      email,
      message: 'Código de verificação enviado! Verifique seu e-mail.' 
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
      return res.status(400).json({ message: 'Token temporário e código de 6 dígitos são necessários.' });
    }

    // Valida o Token Temporário JWT
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ message: 'O tempo de verificação expirou (5 min). Faça o login novamente.' });
    }

    if (decoded.step !== '2fa-pending') {
      return res.status(400).json({ message: 'Estado de autenticação inválido.' });
    }

    // Busca usuário pelo email do payload
    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    // Valida código de segurança e expiração
    if (!user.twoFactorToken || user.twoFactorToken !== code.trim()) {
      return res.status(400).json({ message: 'Código de verificação incorreto.' });
    }

    if (user.twoFactorExpires < new Date()) {
      return res.status(400).json({ message: 'O código de verificação expirou. Solicite um novo login.' });
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
