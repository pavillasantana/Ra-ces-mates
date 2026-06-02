import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function runMigration() {
  if (!MONGO_URI || MONGO_URI.includes('<usuario>')) {
    console.error('⚠️ MONGO_URI não está devidamente configurada no arquivo .env.');
    console.error('Configure uma URI válida do MongoDB Atlas antes de executar a migração.');
    process.exit(1);
  }

  try {
    console.log('🔄 Conectando ao MongoDB Atlas para migração...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conexão estabelecida com sucesso!');

    const resAddresses = await User.updateMany(
      { $or: [ { addresses: { $exists: false } }, { addresses: null } ] },
      { $set: { addresses: [] } }
    );

    const resOrders = await User.updateMany(
      { $or: [ { orders: { $exists: false } }, { orders: null } ] },
      { $set: { orders: [] } }
    );

    console.log(`🎉 Migração concluída!`);
    console.log(`   - Endereços atualizados: ${resAddresses.modifiedCount}`);
    console.log(`   - Pedidos atualizados: ${resOrders.modifiedCount}`);
    
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB. Processo encerrado com sucesso.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro durante a execução da migração:', error);
    process.exit(1);
  }
}

runMigration();
