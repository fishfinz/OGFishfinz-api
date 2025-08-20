import jwt from 'jsonwebtoken';
import { addCors, ok, bad, getSupabaseAdmin } from '../_lib/utils.js';

export async function handler(req, res) {
  addCors(res);
  if (req.method !== 'GET') { res.statusCode = 405; res.end('Method Not Allowed'); return; }

  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return bad(res, 401, 'Missing token');

  let decoded;
  try { decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me'); }
  catch { return bad(res, 401, 'Invalid token'); }

  const supa = getSupabaseAdmin();
  const limit = Math.min(parseInt((new URL(req.url, 'http://localhost')).searchParams.get('limit') || '100',10), 1000);

  const { data: s } = await supa.from('settings').select('value').eq('key','current_season').maybeSingle();
  const season = (s && parseInt(s.value,10)) || 1;

  const { data: top } = await supa
    .from('season_profiles')
    .select('player_id, best_score')
    .eq('season', season)
    .order('best_score', { ascending: false })
    .limit(limit);

  const me = decoded.sub.toLowerCase();
  const eligible = Array.isArray(top) && top.some(r => (r.player_id || '').toLowerCase() === me);

  const { data: claim } = await supa
    .from('claims')
    .select('id')
    .eq('player_id', decoded.sub)
    .eq('season', season)
    .maybeSingle();

  ok(res, { season, eligible, alreadyClaimed: !!claim });
}
export default handler;
