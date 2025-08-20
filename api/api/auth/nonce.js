import crypto from 'crypto';
import { addCors, ok } from '../_lib/utils.js';
import { putNonce } from '../_lib/nonceStore.js';

export async function handler(req, res) {
  addCors(res);
  const nonce = 'OGF-' + crypto.randomBytes(8).toString('hex');
  const key = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'ip')
            + ':' + crypto.randomBytes(4).toString('hex');
  putNonce(key, nonce);
  ok(res, { nonce, key });
}
export default handler;
