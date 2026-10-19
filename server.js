const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const BASE_URL = 'https://1dollar-challenge.com';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'challenge.json');
const PORT = process.env.PORT || 8080;

function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')); }
  catch { return { participants: [], codes: {}, totalDollar: 0, totalParticipants: 0, totalShares: 0, totalRefunded: 0, startedAt: new Date().toISOString(), reactions: {}, events: [] }; }
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
    'line_items[0][price_data][product_data][name]': 'Le Défi du 1 $',
 'line_items[0][quantity]': '1',
    success_url: BASE_URL + '/?paid=1&code=' + code + '&session_id=' + params.id,
    cancel_url: BASE_URL + '/?cancelled=1',
    'metadata[code]': code,
    'metadata[type]': '1dollar-challenge'
  };
  if (email) params['customer_email'] = email;
  return stripeRequest('POST', '/v1/checkout/sessions', params);
}

async function refundPayment(code, paymentIntent) {
  const ref = await stripeRequest('POST', '/v1/refunds', { payment_intent: paymentIntent });
  if (ref.status >= 200 && ref.status < 300) {
    return { refunded: true, message: '1$ renvoyé sur votre moyen de paiement (1–2 jours ouvrés).' };
  }
  console.error('Refund failed for code ' + code + ': ' + ((ref.data.error && ref.data.error.message) || 'unknown'));
  return { refunded: false, message: 'Remboursement demandé — crédit en cours de traitement.' };
}


async function doRefund(code) {
  const d = loadData();
  const entry = d.codes[code];
  if (!entry) return { status: 404, body: { ok: false, error: 'Code introuvable' } };
  if (entry.completed) return { status: 200, body: { ok: true, already: true, refunded: !!entry.refunded, shares: entry.shares, maxShares: entry.maxShares, complete: true } };
  entry.completed = true;
  let result;
  if (entry.paymentIntent) {
    result = await refundPayment(code, entry.paymentIntent);
  } else {
    result = { refunded: true, message: 'Code complet.' };
  }
  entry.refunded = result.refunded;
  d.totalRefunded = (d.totalRefunded || 0) + 1;
  saveData(d);
  return { status: 200, body: { ok: true, refunded: result.refunded, refundMessage: result.message, shares: entry.shares, maxShares: entry.maxShares, complete: true } };
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
    res.end(JSON.stringify({ totalIn: d.totalDollar || 0, totalRefunded: d.totalRefunded || 0, netKept: (d.totalDollar || 0) - (d.totalRefunded || 0), activeCodes: Object.keys(d.codes).length, shares: d.totalShares || 0, completed: Object.values(d.codes).filter(function(c){return c.completed;}).length, totalParticipants: d.totalParticipants || 0 }));
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
              d.codes[code] = { email: participant.email, createdAt: participant.joinedAt, shares: 0, maxShares: 3, paymentIntent: obj.payment_intent || null };
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
  if (pathname === '/api/reconcile' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { session_id } = JSON.parse(body);
        const result = await stripeRequest('GET', '/v1/checkout/sessions/' + session_id);
        if (result.status === 200 && result.data && result.data.payment_status === 'paid') {
          const obj = result.data;
          const email = (obj.customer_details && obj.customer_details.email) || obj.customer_email || '';
          const code = obj.metadata && obj.metadata.code;
          if (code) {
            const d = loadData();
            const already = d.participants.find(p => p.code === code);
            if (!already) {
              const participant = { email: email.toLowerCase(), code: code, joinedAt: new Date().toISOString(), referrer: null, status: 'paid', stripe_session: obj.id };
              d.participants.push(participant);
              d.codes[code] = { email: participant.email, createdAt: participant.joinedAt, shares: 0, maxShares: 3, paymentIntent: obj.payment_intent || null };
              d.totalDollar += 1;
              d.totalParticipants += 1;
              saveData(d);
              console.log('Reconciled participant: ' + email + ' code ' + code);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, reconciled: true, totalDollar: d.totalDollar }));
              return;
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, reconciled: false, reason: 'already', totalDollar: d.totalDollar }));
              return;
            }
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, reconciled: false, reason: 'not-paid-or-no-code', totalDollar: loadData().totalDollar }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }


  if (pathname === '/api/share' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { code } = JSON.parse(body);
        const d = loadData();
        const entry = d.codes[code];
        if (!entry) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Code introuvable' })); return; }
        if (entry.refunded) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, shares: entry.maxShares, maxShares: entry.maxShares, complete: true, refunded: true, refundMessage: 'Code complet — 1$ déjà remboursé.' }));
          return;
        }
        if (entry.shares < entry.maxShares) entry.shares += 1;
        d.totalShares = (d.totalShares || 0) + 1;
        let refundMsg = '';
        if (entry.shares >= entry.maxShares && !entry.completed) {
          const r = await doRefund(code);
          refundMsg = r.body.refundMessage || '';
        }
        saveData(d);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, shares: entry.shares, maxShares: entry.maxShares, complete: entry.shares >= entry.maxShares, refunded: entry.shares >= entry.maxShares, refundMessage: refundMsg }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (pathname === '/api/refund' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { code } = JSON.parse(body);
        const r = await doRefund(code);
        res.writeHead(r.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(r.body));
      } catch (e) {
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

  if (pathname === "/api/events" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const { type, meta } = JSON.parse(body);
        const d = loadData();
        if (!d.events) d.events = [];
        d.events.push({ t: type, meta: meta || null, at: new Date().toISOString() });
        if (d.events.length > 20000) d.events = d.events.slice(-15000);
        if (!d.reactions) d.reactions = {};
        if (["view","share_view","open","join_form","unsubscribe","declined"].includes(type)) d.reactions[type] = (d.reactions[type] || 0) + 1;
        if (type === "ref" && meta && meta.code && meta.referrer) {
          const entry = d.codes[meta.code];
          if (entry) entry.referredBy = meta.referrer;
        }
        saveData(d);
        res.writeHead(204);
        res.end();
      } catch (e) { res.writeHead(500); res.end(); }
    });
    return;
  }

  if (pathname === "/api/admin/reactions") {
    const d = loadData();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ reactions: d.reactions || {}, totalEvents: (d.events || []).length }));
    return;
  }
  const publicDir = path.join(__dirname, 'appweb');
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

const dataDir = DATA_DIR;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

server.listen(PORT, () => {
  console.log('Server: http://localhost:' + PORT);
  console.log('Stripe key: ' + STRIPE_SECRET_KEY.substring(0, 15) + '...');
});

