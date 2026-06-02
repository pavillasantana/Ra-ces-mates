import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stock: { type: Number, default: 99 },
  image: String,
  category: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
