import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Removendo conexão mongoose pra MVP não crashar caso não tenha configurado DB ainda.
// Em produção, remover o comentário:
/*
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Conectado'))
  .catch(err => console.error(err));
*/

app.listen(process.env.PORT || 3001, () => console.log(`Server on :${process.env.PORT || 3001}`));
