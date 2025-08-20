import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { addCors, ok, bad, getSupabaseAdmin, getProvider } from '../_lib/utils.js';

const MINT_ABI = ['function mint(address to, uint256 id, uint256 amount, bytes data)'];

export async function handler(req, res) {
  addCors(res);
  if (req.method !== 'POST') { res.statusCode = 405; res.end('Method Not Allowed'); return; }

  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return bad(res, 401, 'Missing token');

  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me'); }
  catch { return bad(res, 401, 'Invalid token'); }

  let body=''; for await (const c of req) body += c;
  let bodyObj = {}; try { bodyObj = JSON.parse(body || '{}'); } catch {}
  const amount = bodyObj.amount ?? 1;

  const supa = getSupabaseAdmin();
  const provider = getProvider();
  const minterKey = process.env.MINTER_PRIVATE_KEY;
  const contractAddr = process.env.BADGE_CONTRACT;
  if (!minterKey || !contractAddr) return bad(res, 500, 'Server not configured for minting');

  const { data: s } = await supa.from('settings').select('value').eq('key','current_season').maybeSingle();
  const season = (s && parseInt(s.value,10)) || 1;
  const tokenId = bodyObj.tokenId ?? season; // badge id == season number by default

  const limit = Math.min(parseInt(process.env.CLAIM_TOP_LIMIT || '100',10), 1000);
  const { data: top } = await supa
    .from('season_profiles')
    .select('player_id, best_score')
    .eq('season', season)
    .order('best_score', { ascending: false })
    .limit(limit);

  const me = decoded.sub.toLowerCase();
  const eligible = Array.isArray(top) && top.some(r => (r.player_id || '').toLowerCase() === me);
  if (!eligible) return bad(res, 403, 'Not eligible');

  const { data: claimed } = await supa
    .from('claims')
    .select('id')
    .eq('player_id', decoded.sub)
    .eq('season', season)
    .maybeSingle();
  if (claimed) return bad(res, 409, 'Already claimed');

  const wallet = new ethers.Wallet(minterKey, provider);
  const contract = new ethers.Contract(contractAddr, MINT_ABI, wallet);
  let tx;
  try { tx = await contract.mint(decoded.sub, tokenId, amount, '0x'); }
  catch (e) { return bad(res, 500, 'Mint failed: ' + (e?.reason || e?.message || 'unknown')); }

  await supa.from('claims').insert({ player_id: decoded.sub, season, tx_hash: tx.hash, token_id: tokenId });
  ok(res, { season, tokenId, txHash: tx.hash });
}
export default handler;
