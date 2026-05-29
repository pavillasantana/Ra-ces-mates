const TIENDANUBE_STORE_DOMAIN = import.meta.env.VITE_TIENDANUBE_STORE_DOMAIN || 'raices68.mitiendanube.com';

export const buildTiendanubeCheckoutUrl = (productId, quantity = 1) => {
  if (!productId) return '';
  const qty = Number.isFinite(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 1;
  return `https://${TIENDANUBE_STORE_DOMAIN}/apps/checkout/v2/cart/add/?id=${encodeURIComponent(productId)}&qty=${qty}`;
};

export const goToTiendanubeCheckout = (productId, quantity = 1) => {
  const url = buildTiendanubeCheckoutUrl(productId, quantity);
  if (!url) return false;
  window.location.href = url;
  return true;
};
