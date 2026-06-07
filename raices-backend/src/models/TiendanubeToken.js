import mongoose from 'mongoose';

const tiendanubeTokenSchema = new mongoose.Schema({
  access_token: { type: String, required: true },
  store_id: { type: String, required: true },
  scope: { type: String },
  authorized_at: { type: String }
}, { timestamps: true });

export default mongoose.model('TiendanubeToken', tiendanubeTokenSchema);
