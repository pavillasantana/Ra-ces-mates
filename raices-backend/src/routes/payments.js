import express from 'express';

const router = express.Router();

const paymentMethodsByUser = new Map();

const detectBrand = (number) => {
  const clean = String(number || '').replace(/\s+/g, '').replace(/[^0-9]/g, '');
  if (clean.startsWith('4')) return 'Visa';
  if (clean.startsWith('5')) return 'Mastercard';
  if (clean.startsWith('3')) return 'American Express';
  if (clean.startsWith('6')) return 'Discover';
  return 'Outra';
};

const sanitizeMethods = (methods) => methods.map(({ token, ...method }) => method);

router.post('/tokenize-card', (req, res) => {
  const { number, holder, exp, cvv } = req.body;
  const cleanNumber = String(number || '').replace(/\s+/g, '').replace(/[^0-9]/g, '');

  if (!cleanNumber || !holder || !exp || !cvv) {
    return res.status(400).json({ message: 'Dados do cartão incompletos' });
  }

  const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return res.json({
    token,
    provider: 'mercado-pago-mock',
    brand: detectBrand(cleanNumber),
    last4: cleanNumber.slice(-4),
    holder,
    exp
  });
});

router.get('/methods/:userId', (req, res) => {
  const methods = paymentMethodsByUser.get(req.params.userId) || [];
  res.json({ methods: sanitizeMethods(methods) });
});

router.post('/methods/:userId', (req, res) => {
  const { token, brand, last4, holder, exp, nickname } = req.body;

  if (!token || !last4 || !holder || !exp) {
    return res.status(400).json({ message: 'Dados tokenizados inválidos' });
  }

  const methods = paymentMethodsByUser.get(req.params.userId) || [];
  const newMethod = {
    id: Date.now().toString(),
    token,
    brand: brand || 'Outra',
    last4,
    holder,
    exp,
    nickname: nickname || 'Principal'
  };

  methods.push(newMethod);
  paymentMethodsByUser.set(req.params.userId, methods);

  res.status(201).json({ methods: sanitizeMethods(methods) });
});

router.delete('/methods/:userId/:methodId', (req, res) => {
  const methods = paymentMethodsByUser.get(req.params.userId) || [];
  const filtered = methods.filter((method) => method.id !== req.params.methodId);
  paymentMethodsByUser.set(req.params.userId, filtered);
  res.json({ methods: sanitizeMethods(filtered) });
});

export default router;
