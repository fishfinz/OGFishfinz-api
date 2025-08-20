import jwt from 'jsonwebtoken';
import { addCors, bad, ok, getSupabaseAdmin, verifyRunToken } from '../_lib/utils.js';

export async function handler(req, res) {
  addCors(res);
  if (req.method !== 'POST') { res.statusCode = 405; res.end('Method Not Allowed'); return; }

  const supa = getSupabaseAdmin();

  let body=''; for await (const c of req) body += c;
  const { playerId, score, runToken, issuedAt } = JSON.parse(body || '{}');
  if (typeof score !== 'number' || score < 0 || score > 1000000) return bad(res, 400, 'Invalid score');

  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  let resolvedPlayerId = playerId;
  if (token) {
    try { const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me'); resolvedPlayerId = decoded.sub; } catch {}
  }
  if (!resolvedPlayerId) return bad(res, 400, 'Missing playerId');

  // Anti-cheat: require run token unless disabled
  if ((process.env.REQUIRE_RUN_TOKEN || 'true') !== 'false') {
    if (!runToken || !issuedAt) return bad(res, 400, 'Missing run token');
    const age = Date.now() - Number(issuedAt);
    if (isNaN(age) || age < 0 || age > 15*60*1000) return bad(res, 400, 'Run token expired');
    if (!verifyRunToken(resolvedPlayerId, String(issuedAt), runToken)) return bad(res, 400, 'Invalid run token');
  }

  const { data: s } = await supa.from('settings').select('value').eq('key','current_season').maybeSingle();
  const season = (s && parseInt(s.value, 10)) || 1;

  const { error: insErr } = await supa.from('scores').insert({ player_id: resolvedPlayerId, score, season });
  if (insErr) return bad(res, 500, 'Failed to insert score');

  await supa.rpc('update_best_score', { p_player_id: resolvedPlayerId, p_score: score }).catch(()=>{});
  await supa.rpc('update_best_score_season', { p_player_id: resolvedPlayerId, p_score: score, p_season: season });

  ok(res, { ok: true, season });
}
export default handler;
