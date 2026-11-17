// Cloudflare Pages Function: POST /api/lead
// Saves a website or book form into Go High Level (Quinby Partners sub-account).
// Needs two Cloudflare environment variables:
//   GHL_LOCATION_ID  the Quinby Partners location id
//   GHL_TOKEN        a GHL Private Integration token with contacts read/write (add it as an encrypted secret)
// Tags are ADDED to the contact, never replaced, so existing tags such as "rel: sphere" are kept.

const API = 'https://services.leadconnectorhq.com';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const clean = (v, n = 200) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

export async function onRequestPost({ request, env }) {
  let data;
  try {
    const type = request.headers.get('content-type') || '';
    data = type.includes('application/json') ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return json({ ok: false, error: 'bad request' }, 400);
  }
  if (data.website) return json({ ok: true }); // spam trap: real people never fill this hidden field

  const email = clean(data.email, 120).toLowerCase();
  const phone = clean(data.phone, 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && phone.replace(/\D/g, '').length < 7) {
    return json({ ok: false, error: 'Please add an email or phone number.' }, 400);
  }
  const [firstName, ...rest] = clean(data.name, 120).split(/\s+/);
  const tags = ['src: website', ...String(data.tags || '').split(',')].map((t) => clean(t, 60)).filter(Boolean).slice(0, 10);

  if (!env.GHL_TOKEN || !env.GHL_LOCATION_ID) return json({ ok: true, saved: false });

  const headers = { Authorization: `Bearer ${env.GHL_TOKEN}`, Version: '2021-07-28', 'Content-Type': 'application/json', Accept: 'application/json' };
  const contact = {
    locationId: env.GHL_LOCATION_ID,
    ...(email && { email }),
    ...(phone && { phone }),
    ...(firstName && { firstName }),
    ...(rest.length && { lastName: rest.join(' ') }),
    ...(data.address && { address1: clean(data.address, 200) }),
    ...(data.city && { city: clean(data.city, 80) }),
    ...(data.postalCode && { postalCode: clean(data.postalCode, 20) }),
    source: clean('Website: ' + (data.source || 'form'), 100),
  };
  try {
    const up = await fetch(`${API}/contacts/upsert`, { method: 'POST', headers, body: JSON.stringify(contact) });
    const out = await up.json().catch(() => ({}));
    const id = out && out.contact && out.contact.id;
    if (!up.ok || !id) return json({ ok: false, error: 'Could not save right now.' }, 502);
    await fetch(`${API}/contacts/${id}/tags`, { method: 'POST', headers, body: JSON.stringify({ tags }) });
    const note = [clean(data.source, 100) && `From: ${clean(data.source, 100)}`, clean(data.message, 2000) && `Message: ${clean(data.message, 2000)}`, data.address && `Mailing address: ${[data.address, data.city, data.postalCode].map((x) => clean(x, 200)).filter(Boolean).join(', ')}`].filter(Boolean).join('\n');
    if (note) await fetch(`${API}/contacts/${id}/notes`, { method: 'POST', headers, body: JSON.stringify({ body: note }) });
    return json({ ok: true, saved: true });
  } catch {
    return json({ ok: false, error: 'Could not save right now.' }, 502);
  }
}

export const onRequest = () => json({ ok: false, error: 'POST only' }, 405);
