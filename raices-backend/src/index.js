import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import paymentsRoutes from './routes/payments.js'; // Nota: Como usaremos o Link Direto da Tiendanube, essa rota poderá ser limpa depois!

dotenv.config();
const app = express();

// Configuração do CORS aceitando a URL da Vercel (Produção) ou Localhost (Desenvolvimento)
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:5173', 
  credentials: true 
}));

app.use(express.json());

// Rota de Healthcheck para o Render monitorar o status do servidor
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running smoothly' });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentsRoutes);

// Conexão oficial com o MongoDB Atlas (Ativada para Produção!)
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('ERRO: A variável MONGO_URI não foi definida no ambiente.');
} else {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Atlas Conectado com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));
}

// Porta dinâmica para o Render (ele injeta automaticamente a porta correta em process.env.PORT)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta: ${PORT}`));
