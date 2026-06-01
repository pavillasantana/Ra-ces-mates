import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  twoFactorSecret: { type: String },
  twoFactorToken: { type: String },
  twoFactorExpires: { type: Date },
  is2FAEnabled: { type: Boolean, default: true },
  addresses: {
    type: [{
      street: String,
      number: String,
      floor: String,
      city: String,
      zip: String,
      province: String
    }],
    default: []
  },
  orders: {
    type: Array,
    default: []
  }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (this.isModified('password'))
    this.password = await bcrypt.hash(this.password, 12);
});

export default mongoose.model('User', userSchema);
