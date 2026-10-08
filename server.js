const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const BASE_URL = 'https://1dollar-challenge.com';
const DATA_FILE = path.join(__dirname, 'data', 'challenge.json');
const PORT = process.env.PORT || 3456;

function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return { participants: [], codes: {}, totalDollar: 0, totalParticipants: 0, totalShares: 0, codeShares: {}, startedAt: new Date().toISOString() }; }
}

function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2), 'utf-8'); }

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '1D-';
  for (let i = 0; i < 8; i++) { if (i === 4) s += '-'; s += chars[crypto.randomInt(0, chars.length)]; }
  return s;
}

function stripeRequest(method, endpoint, params) {
  const headers = { 'Authorization': 'Bearer ' + STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' };
  let bodyStr = '';
  if (params) {
    bodyStr = Object.entries(params).filter(([k, v]) => v !== null && v !== undefined).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
  }
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: 'api.stripe.com', port: 443, path: endpoint, method: method, headers: headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed; try { parsed = JSON.parse(data); } catch { parsed = { raw: data }; }
        if (res.statusCode >= 400) console.error('Stripe ' + method + ' ' + endpoint + ' ' + res.statusCode + ':', (parsed.error && parsed.error.message) || data);
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function createCheckoutSession(email, code) {
  const params = {
    mode: 'payment',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': '100',
    'line_items[0][price_data][product_data][name]': 'Le DÃ©fi du 1 $',
    'line_items[0][quantity]': '1',
    success_url: BASE_URL + '/?paid=1&code=' + code,
    cancel_url: BASE_URL + '/?cancelled=1',
    'metadata[code]': code,
    'metadata[type]': '1dollar-challenge'
  };
  if (email) params['customer_email'] = email;
  return stripeRequest('POST', '/v1/checkout/sessions', params);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost:' + PORT);
  const pathname = url.pathname;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, stripe_key: STRIPE_SECRET_KEY.substring(0, 12) + '...' }));
    return;
  }

  if (pathname === '/api/stats') {
    const d = loadData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ totalDollar: d.totalDollar, totalParticipants: d.totalParticipants, activeCodes: Object.keys(d.codes).length, shares: d.totalShares }));
    return;
  }

  if (pathname === '/api/checkout' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { email } = JSON.parse(body);
        const d = loadData();
        const existing = d.participants.find(p => p.email === email.toLowerCase());
        let code;
        if (existing) { code = existing.code; }
        else { code = genCode(); while (d.codes[code]) code = genCode(); }
        const result = await createCheckoutSession(email, code);
        if (result.status >= 200 && result.status < 300) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, url: result.data.url, session_id: result.data.id, code: code }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: (result.data.error && result.data.error.message) || 'Stripe error', code: code }));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (pathname === '/api/webhook/stripe' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        const obj = event.data && event.data.object;
        console.log('Stripe webhook: ' + event.type);
        if (event.type === 'checkout.session.completed' && obj) {
          const email = (obj.customer_details && obj.customer_details.email) || obj.customer_email || '';
          const code = obj.metadata && obj.metadata.code;
          if (code && obj.payment_status === 'paid') {
            const d = loadData();
            const already = d.participants.find(p => p.code === code);
            if (!already) {
              const participant = { email: email.toLowerCase(), code: code, joinedAt: new Date().toISOString(), referrer: null, status: 'paid', stripe_session: obj.id };
              d.participants.push(participant);
              d.codes[code] = { email: participant.email, createdAt: participant.joinedAt, shares: 0, maxShares: 3 };
              d.totalDollar += 1;
              d.totalParticipants += 1;
              saveData(d);
              console.log('New participant: ' + email + ' code ' + code + ' total $' + d.totalDollar);
            }
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
      } catch (e) {
        console.error('Webhook error: ' + e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/code/')) {
    const code = decodeURIComponent(pathname.split('/').pop());
    const d = loadData();
    const entry = d.codes[code];
    if (!entry) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Code introuvable' })); return; }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(Object.assign({ code: code }, entry)));
    return;
  }

  if (pathname === '/api/admin/participants') {
    const d = loadData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ total: d.totalParticipants, totalDollar: d.totalDollar, participants: d.participants.slice(-100).reverse() }));
    return;
  }

  if (pathname === '/api/admin/codes') {
    const d = loadData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ codes: Object.keys(d.codes).map(code => Object.assign({ code: code }, d.codes[code], { sharesUsed: (d.codeShares || {})[code] || 0 })) }));
    return;
  }

  const publicDir = path.join(__dirname, 'public');
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(publicDir, filePath);
  const ext = path.extname(fullPath);
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
  fs.readFile(fullPath, (err, content) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(content);
  });
});

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

server.listen(PORT, () => {
  console.log('Server: http://localhost:' + PORT);
  console.log('Stripe key: ' + STRIPE_SECRET_KEY.substring(0, 15) + '...');
});

