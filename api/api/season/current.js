import { addCors, ok, bad, getSupabaseAdmin } from '../_lib/utils.js';

export async function handler(req, res) {
  addCors(res);
  const supa = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data } = await supa.from('settings').select('value').eq('key','current_season').maybeSingle();
    const season = (data && parseInt(data.value,10)) || 1;
    return ok(res, { season });
  }
  if (req.method === 'POST') {
    const admin = req.headers['x-admin-token'];
    if (!admin || admin !== process.env.ADMIN_TOKEN) return bad(res, 401, 'Unauthorized');
    let body=''; for await (const c of req) body += c;
    const { season } = JSON.parse(body || '{}');
    if (!Number.isInteger(season) || season < 1) return bad(res, 400, 'Invalid season');
    const { error } = await supa.from('settings').upsert({ key:'current_season', value:String(season) }, { onConflict: 'key' });
    if (error) return bad(res, 500, 'Failed to set season');
    return ok(res, { season });
  }
  return bad(res, 405, 'Method Not Allowed');
}
export default handler;
