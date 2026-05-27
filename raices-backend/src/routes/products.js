import express from 'express';
import Product from '../models/Product.js';
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // const products = await Product.find({ active: true });
    res.json([{ id: 1, name: 'Mate Torpedo Mock', price: 45000 }]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
