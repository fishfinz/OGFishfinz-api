import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { addCors, bad, ok, normalizeAddress } from '../_lib/utils.js';
import { takeNonce } from '../_lib/nonceStore.js';

export async function handler(req, res) {
  addCors(res);
  if (req.method !== 'POST') { res.statusCode = 405; res.end('Method Not Allowed'); return; }
  let body=''; for await (const c of req) body += c;
  const { address, signature, nonce, key } = JSON.parse(body || '{}');
  if (!address || !signature || !nonce || !key) return bad(res, 400, 'Missing fields');
  const expected = takeNonce(key);
  if (!expected || expected !== nonce) return bad(res, 400, 'Invalid or expired nonce');

  let recovered;
  try { recovered = ethers.verifyMessage(nonce, signature); }
  catch { return bad(res, 400, 'Invalid signature'); }

  const normAddr = normalizeAddress(address);
  if (recovered.toLowerCase() !== normAddr.toLowerCase()) return bad(res, 400, 'Signer mismatch');

  const token = jwt.sign({ sub: normAddr }, process.env.JWT_SECRET || 'dev-secret-change-me', { expiresIn: '30m' });
  ok(res, { token });
}
export default handler;
