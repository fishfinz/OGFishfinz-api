const nonces = new Map();
export function putNonce(key, nonce, ttlMs = 5 * 60 * 1000) {
  nonces.set(key, { nonce, exp: Date.now() + ttlMs });
}
export function takeNonce(key) {
  const v = nonces.get(key);
  if (!v) return null;
  nonces.delete(key);
  if (Date.now() > v.exp) return null;
  return v.nonce;
}
