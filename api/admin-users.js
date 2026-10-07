import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const toEmail = (u) => `${String(u).trim().toLowerCase()}@aria.local`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Verifikasi pemanggil
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized: token tidak dikirim' });
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Unauthorized: ' + (authErr?.message || 'user kosong') });

    const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!me || me.role !== 'Administrator') return res.status(403).json({ error: 'Hanya Administrator.' });

    const { action, username, password, nama, role } = req.body || {};

    // 2. Aksi
    if (action === 'list') {
      const { data, error } = await admin.from('profiles').select('username,nama,role').order('nama');
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (action === 'add') {
      if (!username || !password || !nama || !role) return res.status(400).json({ error: 'Data tidak lengkap.' });
      const { data, error } = await admin.auth.admin.createUser({
        email: toEmail(username), password, email_confirm: true
      });
      if (error) throw error;
      const { error: pErr } = await admin.from('profiles').insert({
        id: data.user.id, username: username.trim().toLowerCase(), nama, role
      });
      if (pErr) { await admin.auth.admin.deleteUser(data.user.id); throw pErr; }
      return res.status(200).json({ ok: true });
    }

    if (action === 'update') {
      const { data: p } = await admin.from('profiles').select('id').eq('username', username).single();
      if (!p) return res.status(404).json({ error: 'User tidak ditemukan.' });
      if (password) {
        const { error } = await admin.auth.admin.updateUserById(p.id, { password });
        if (error) throw error;
      }
      const { error } = await admin.from('profiles').update({ nama, role }).eq('id', p.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    if (action === 'delete') {
      const { data: p } = await admin.from('profiles').select('id').eq('username', username).single();
      if (!p) return res.status(404).json({ error: 'User tidak ditemukan.' });
      if (p.id === user.id) return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri.' });
      const { error } = await admin.auth.admin.deleteUser(p.id); // profiles ikut terhapus (on delete cascade)
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Aksi tidak dikenal.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
