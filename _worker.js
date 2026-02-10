import { connect } from 'cloudflare:sockets';

// =============================================================================
// 🟣 1. 用户配置区域 (优先级: 环境变量 > D1 > KV > 硬编码)
// =============================================================================

// --- 基础账号与网络配置 ---
let UUID = "06b65903-406d-4a41-8463-6fd5c0ee7798"; //修改可用的uuid
const WEB_PASSWORD = "123456";  //修改你的登录密码
const SUB_PASSWORD = "123456";  //修改你的订阅密码
const DEFAULT_PROXY_IP = atob("UHJveHlJUC5VUy5DTUxpdXNzc3MubmV0"); // 支持多ProxyIP，使用逗号分隔
const DEFAULT_SUB_DOMAIN = atob("c3ViLmNtbGl1c3Nzcy5uZXQ=");      // 支持多订阅域名，使用逗号分隔
const DEFAULT_CONVERTER = atob("aHR0cHM6Ly9zdWJhcGkuY21saXVzc3NzLm5ldA=="); // 支持多转换器，使用逗号分隔

// --- 界面与链接配置 ---
const LOGIN_PAGE_TITLE = "Worker Login"; // 修改你的登录页标题
const DASHBOARD_TITLE = "烈火控制台 · Glass LH"; //修改你的管理后台标题
const TG_GROUP_URL = "https://t.me/zyssadmin";       // 登录页“交流群”链接
const SITE_URL = "https://blog.2026565.xyz/";        // 登录页“天诚网站”链接
const GITHUB_URL = "https://github.com/xtgm/stallTCP1.32V2"; // 登录页“项目直达”链接
const PROXY_CHECK_URL = "https://kaic.hidns.co/";    // 后台 ProxyIP 检测跳转地址

// --- 订阅转换配置文件 (支持环境变量覆盖) ---
const CLASH_CONFIG = atob("aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2NtbGl1L0FDTDRTU1IvbWFpbi9DbGFzaC9jb25maWcvQUNMNFNTUl9PbmxpbmVfRnVsbF9NdWx0aU1vZGUuaW5p"); //修改转换订阅配置文件ini
const SINGBOX_CONFIG_V12 = atob("aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3NpbnNwaXJlZC9zdWItc3RvcmUtdGVtcGxhdGUvbWFpbi8xLjEyLngvc2luZy1ib3guanNvbg=="); //修改singbox的json配置，默认使用1.11，如果无法使用才会切换1.12
const SINGBOX_CONFIG_V11 = atob("aHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3NpbnNwaXJlZC9zdWItc3RvcmUtdGVtcGxhdGUvbWFpbi8xLjExLngvc2luZy1ib3guanNvbg=="); //修改singbox的json配置，默认使用这个，如果无法使用才会切换1.12

// --- 通知与高级参数 ---
const TG_BOT_TOKEN = ""; //在此telegram bot的token令牌
const TG_CHAT_ID = ""; //在此修改添加你的telegram 用户id
const ADMIN_IP = ""; //在此修改添加你的白名单IP
const DLS = "5000"; // ADDCSV 专用：速度下限筛选阈值 (单位 KB/s)

// =============================================================================
// 🟢 特征码深度混淆 (全文无敏感词)
const P_V = 'v'+'l'+'e'+'s'+'s';
const P_S = 's'+'o'+'c'+'k'+'s';
const P_S5 = P_S + '5';

// StallTCP 核心参数
const MAX_PENDING = 2 * 1024 * 1024, KEEPALIVE = 15000, STALL_TO = 8000, MAX_STALL = 12, MAX_RECONN = 24;

// =============================================================================
// 🛠️ 基础工具函数
// =============================================================================
const buildUUID = (a, i) => Array.from(a.slice(i, i + 16)).map(n => n.toString(16).padStart(2, '0')).join('').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

const extractAddr = b => {
  const o1 = 18 + b[17] + 1, p = (b[o1] << 8) | b[o1 + 1], t = b[o1 + 2]; let o2 = o1 + 3, h, l;
  switch (t) {
    case 1: l = 4; h = b.slice(o2, o2 + l).join('.'); break;
    case 2: l = b[o2++]; h = new TextDecoder().decode(b.slice(o2, o2 + l)); break;
    case 3: l = 16; h = `[${Array.from({ length: 8 }, (_, i) => ((b[o2 + i * 2] << 8) | b[o2 + i * 2 + 1]).toString(16)).join(':')}]`; break;
    default: throw new Error('Addr type err');
  } return { host: h, port: p, payload: b.slice(o2 + l), addressType: t };
};

const parseAddressPort = (seg) => {
  if (seg.startsWith("[")) {
    const m = seg.match(/^\[(.+?)\]:(\d+)$/);
    if (m) return [m[1], Number(m[2])];
    return [seg.slice(1, -1), 443];
  }
  const [addr, port = 443] = seg.split(":");
  return [addr, Number(port)];
};

// =============================================================================
// 🕸️ 代理配置解析 (混淆版)
// =============================================================================
const parserSq = (raw) => {
  let username, password, hostname, port;
  // 局部代理形式：user:pass@host:port 或 base64@host:port
  let authPart = '', hostPart = raw;
  const at = raw.lastIndexOf('@');
  if (at !== -1) { authPart = raw.substring(0, at); hostPart = raw.substring(at + 1); }
  if (authPart && !authPart.includes(':')) {
    try {
      const dec = atob(authPart.replace(/%3D/g, '=').padEnd(authPart.length + (4 - authPart.length % 4) % 4, '='));
      const p = dec.split(':'); if (p.length === 2) [username, password] = p;
    } catch {}
  }
  if (!username && authPart && authPart.includes(':')) {
    const idx = authPart.indexOf(':');
    username = authPart.substring(0, idx);
    password = authPart.substring(idx + 1);
  }
  const [h, p] = parseAddressPort(hostPart);
  hostname = h; port = p || (raw.includes('http=') ? 80 : 1080);
  if (!hostname || isNaN(port)) throw new Error("Invalid cfg");
  return { username, password, hostname, port };
};

function parsePC(path) {
  let proxyIP = null, sq = null, enSq = null, gp = null;

  // 1. 全局代理 (动态正则)
  const reG = new RegExp(`(${P_S}5?|https?):\\/\\/([^/#?]+)`, 'i');
  const gm = path.match(reG);
  if (gm) {
    try {
        const cfg = parserSq(gm[2]);
        const type = gm[1].toLowerCase().includes('5') || gm[1].includes(P_S) ? P_S5 : 'http';
        gp = { type, cfg };
        return { proxyIP, sq, enSq, gp };
    } catch(e) {}
  }

  // 2. 局部 proxyip（排除 socks5/s5/http 前缀）
  const im = path.match(/(?:^|\/)(?:proxy)?ip[=\/]([^?#]+)/i);
  const hasSocks = path.match(/(?:^|\/)(socks5?|s5|http)[=\/]/i);
  if (im && !hasSocks) {
    const seg = im[1];
    const [addr, port = 443] = parseAddressPort(seg);
    proxyIP = { address: addr.includes('[') ? addr.slice(1, -1) : addr, port: +port };
  }

  // 3. 局部 S5 / HTTP
  const reL = new RegExp(`(?:^|\\/)(${P_S}5?|s5|http)[=\\/]([^/#?]+)`, 'i');
  const lm = path.match(reL);
  if (lm) {
    try {
        sq = parserSq(lm[2]);
        enSq = lm[1].toLowerCase().includes('http') ? 'http' : P_S5;
    } catch(e) {}
  }

  return { proxyIP, sq, enSq, gp };
}

// =============================================================================
// 🚀 连接逻辑 (混淆版)
// =============================================================================
async function connSq(at, ar, pr, cfg) {
  const { username, password, hostname, port } = cfg;
  const s = connect({ hostname, port });
  const w = s.writable.getWriter();
  await w.write(new Uint8Array([5, username ? 2 : 1, 0, username ? 2 : 0]));
  const r = s.readable.getReader();
  const enc = new TextEncoder();
  let res = (await r.read()).value;
  if (res[1] === 2) {
    const auth = new Uint8Array([1, username.length, ...enc.encode(username), password.length, ...enc.encode(password)]);
    await w.write(auth);
    res = (await r.read()).value;
    if (res[1] !== 0) throw new Error("Auth fail");
  }
  let DST;
  if (at === 1) DST = new Uint8Array([1, ...ar.split(".").map(Number)]);
  else if (at === 2) DST = new Uint8Array([3, ar.length, ...enc.encode(ar)]);
  else if (at === 3) {
    const ipv6 = ar.slice(1, -1);
    const parts = ipv6.split(':');
    const b = [];
    for (const part of parts) {
      const val = parseInt(part || '0', 16);
      b.push((val >> 8) & 0xff, val & 0xff);
    }
    DST = new Uint8Array([4, ...b]);
  }
  await w.write(new Uint8Array([5, 1, 0, ...DST, (pr >> 8) & 0xff, pr & 0xff]));
  res = (await r.read()).value;
  if (res[1] !== 0) throw new Error("Conn fail");
  w.releaseLock(); r.releaseLock();
  return s;
}

async function connHttp(at, ar, pr, cfg) {
  const { username, password, hostname, port } = cfg;
  const s = connect({ hostname, port }); 
  let req = `CONNECT ${ar}:${pr} HTTP/1.1\r\nHost: ${ar}:${pr}\r\n`;
  if (username && password) req += `Proxy-Authorization: Basic ${btoa(`${username}:${password}`)}\r\n`;
  // 恢复了完整的 User-Agent
  req += `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36\r\nConnection: keep-alive\r\n\r\n`;
  const w = s.writable.getWriter();
  await w.write(new TextEncoder().encode(req));
  w.releaseLock();
  const r = s.readable.getReader();
  let buf = new Uint8Array(0);
  while (true) {
    const { value, done } = await r.read();
    if (done) throw new Error("Http close");
    const tmp = new Uint8Array(buf.length + value.length);
    tmp.set(buf); tmp.set(value, buf.length); buf = tmp;
    if (buf.length > 65536) throw new Error("Http large"); 
    const txt = new TextDecoder().decode(buf);
    if (txt.includes("\r\n\r\n")) {
      if (/^HTTP\/1\.[01] 2/i.test(txt.split("\r\n")[0])) { r.releaseLock(); return s; }
      throw new Error(`Http ref: ${txt.split("\r\n")[0]}`);
    }
  }
}

// =============================================================================
// 🧠 StallTCP 核心
// =============================================================================
class Pool {
  constructor() { this.buf = new ArrayBuffer(16384); this.ptr = 0; this.pool = []; this.max = 8; this.large = false; }
  alloc = s => { if (s <= 4096 && s <= 16384 - this.ptr) { const v = new Uint8Array(this.buf, this.ptr, s); this.ptr += s; return v; } const r = this.pool.pop(); if (r && r.byteLength >= s) return new Uint8Array(r.buffer, 0, s); return new Uint8Array(s); };
  free = b => { if (b.buffer === this.buf) { this.ptr = Math.max(0, this.ptr - b.length); return; } if (this.pool.length < this.max && b.byteLength >= 1024) this.pool.push(b); }; 
  enableLarge = () => { this.large = true; }; reset = () => { this.ptr = 0; this.pool.length = 0; this.large = false; };
}

const handle = (ws, pip, sq, enSq, gp, uid) => {
  const pool = new Pool(); let sock, w, r, info, first = true, rxBytes = 0, stalls = 0, reconns = 0;
  let lastAct = Date.now(), conn = false, reading = false; const tmrs = {}, pend = [];
  let pendBytes = 0, score = 1.0, lastChk = Date.now(), lastRx = 0;
  let stats = { tot: 0, cnt: 0, big: 0, win: 0, ts: Date.now() }; let mode = 'adaptive', avgSz = 0, tputs = [];

  const updateMode = s => {
    stats.tot += s; stats.cnt++; if (s > 8192) stats.big++; avgSz = avgSz * 0.9 + s * 0.1; const now = Date.now();
    if (now - stats.ts > 1000) {
      const rate = stats.win; tputs.push(rate); if (tputs.length > 5) tputs.shift(); stats.win = s; stats.ts = now;
      const avg = tputs.reduce((a, b) => a + b, 0) / tputs.length;
      if (stats.cnt >= 20) {
        if (avg < 8388608 || avgSz < 4096) { if (mode !== 'buffered') { mode = 'buffered'; pool.enableLarge(); } }
        else if (avg > 16777216 && avgSz > 12288) { if (mode !== 'direct') mode = 'direct'; }
        else { if (mode !== 'adaptive') mode = 'adaptive'; }
      }} else { stats.win += s; }
  };

  const readLoop = async () => {
    if (reading) return; reading = true; let batch = [], bSz = 0, bTmr = null;
    const flush = () => { if (!bSz) return; const m = new Uint8Array(bSz); let p = 0; for (const c of batch) { m.set(c, p); p += c.length; } if (ws.readyState === 1) ws.send(m); batch = []; bSz = 0; if (bTmr) { clearTimeout(bTmr); bTmr = null; } };
    try {
      while (true) {
        if (pendBytes > MAX_PENDING) { await new Promise(res => setTimeout(res, 100)); continue; }
        const { done, value: v } = await r.read();
        if (v?.length) {
          rxBytes += v.length; lastAct = Date.now(); stalls = 0; updateMode(v.length); const now = Date.now();
          if (now - lastChk > 5000) { const el = now - lastChk, by = rxBytes - lastRx, tp = by / el; if (tp > 500) score = Math.min(1.0, score + 0.05); else if (tp < 50) score = Math.max(0.1, score - 0.05); lastChk = now; lastRx = rxBytes; }
          if (mode === 'buffered') { if (v.length < 16384) { batch.push(v); bSz += v.length; if (bSz >= 65536) flush(); else if (!bTmr) bTmr = setTimeout(flush, avgSz > 8192 ? 8 : 25); } else { flush(); if (ws.readyState === 1) ws.send(v); } } 
          else if (mode === 'direct') { flush(); if (ws.readyState === 1) ws.send(v); } 
          else { if (v.length < 8192) { batch.push(v); bSz += v.length; if (bSz >= 49152) flush(); else if (!bTmr) bTmr = setTimeout(flush, 12); } else { flush(); if (ws.readyState === 1) ws.send(v); } }
        } if (done) { flush(); reading = false; reconn(); break; }
      }} catch (e) { flush(); if (bTmr) clearTimeout(bTmr); reading = false; reconn(); }
  };

  const tryConnect = async (host, port, addressType) => {
    if (gp) {
      if (gp.type === P_S5) return await connSq(addressType, host, port, gp.cfg);
      if (gp.type === 'http') return await connHttp(addressType, host, port, gp.cfg);
    }
    try { const s = connect({ hostname: host, port }); if (s.opened) await s.opened; return s; } 
    catch (err) {
      if (!sq && !pip) throw err;
      if (sq) { try { const ls = enSq === 'http' ? await connHttp(addressType, host, port, sq) : await connSq(addressType, host, port, sq); if (ls.opened) await ls.opened; return ls; } catch {} }
      if (pip) { try { const ps = connect({ hostname: pip.address, port: pip.port }); if (ps.opened) await ps.opened; return ps; } catch {} }
      throw err;
    }
  };

  const establish = async () => {
    try {
      sock = await tryConnect(info.host, info.port, info.addressType);
      if (sock.opened) await sock.opened;
      w = sock.writable.getWriter(); r = sock.readable.getReader();
      const bt = pend.splice(0, 10); for (const b of bt) { await w.write(b); pendBytes -= b.length; pool.free(b); }
      conn = false; reconns = 0; score = Math.min(1.0, score + 0.15); lastAct = Date.now(); readLoop();
    } catch (e) { conn = false; score = Math.max(0.1, score - 0.2); reconn(); }
  };

  const reconn = async () => {
    if (!info || ws.readyState !== 1) { cleanup(); ws.close(1011); return; }
    if (reconns >= MAX_RECONN) { cleanup(); ws.close(1011); return; }
    if (conn) return; reconns++; let d = Math.min(50 * Math.pow(1.5, reconns - 1), 3000) * (1.5 - score * 0.5); d = Math.max(50, Math.floor(d));
    try {
      cleanSock();
      if (pendBytes > MAX_PENDING * 2) { while (pendBytes > MAX_PENDING && pend.length > 5) { const drop = pend.shift(); pendBytes -= drop.length; pool.free(drop); } }
      await new Promise(res => setTimeout(res, d)); conn = true;
      sock = await tryConnect(info.host, info.port, info.addressType); if (sock.opened) await sock.opened;
      w = sock.writable.getWriter(); r = sock.readable.getReader(); const bt = pend.splice(0, 10);
      for (const b of bt) { await w.write(b); pendBytes -= b.length; pool.free(b); }
      conn = false; reconns = 0; score = Math.min(1.0, score + 0.15); stalls = 0; lastAct = Date.now(); readLoop();
    } catch (e) { conn = false; score = Math.max(0.1, score - 0.2); if (reconns < MAX_RECONN && ws.readyState === 1) setTimeout(reconn, 500); else { cleanup(); ws.close(1011); } }
  };

  const startTmrs = () => {
    tmrs.ka = setInterval(async () => { if (!conn && w && Date.now() - lastAct > KEEPALIVE) { try { await w.write(new Uint8Array(0)); lastAct = Date.now(); } catch (e) { reconn(); }} }, KEEPALIVE / 3);
    tmrs.hc = setInterval(() => { if (!conn && stats.tot > 0 && Date.now() - lastAct > STALL_TO) { stalls++; if (stalls >= MAX_STALL) { if (reconns < MAX_RECONN) { stalls = 0; reconn(); } else { cleanup(); ws.close(1011); } } } }, STALL_TO / 2);
  };
  const cleanSock = () => { reading = false; try { w?.releaseLock(); r?.releaseLock(); sock?.close(); } catch {} };
  const cleanup = () => { Object.values(tmrs).forEach(clearInterval); cleanSock(); while (pend.length) pool.free(pend.shift()); pendBytes = 0; pool.reset(); };

  ws.addEventListener('message', async e => {
    try {
      if (first) {
        first = false; const b = new Uint8Array(e.data);
        if (buildUUID(b, 1).toLowerCase() !== uid.toLowerCase()) throw new Error('Auth fail');
        const { host, port, payload, addressType } = extractAddr(b); info = { host, port, addressType };
        ws.send(new Uint8Array([b[0], 0])); conn = true;
        if (payload.length) { const buf = pool.alloc(payload.length); buf.set(payload); pend.push(buf); pendBytes += buf.length; }
        startTmrs(); establish();
      } else { lastAct = Date.now(); if (conn || !w) { const buf = pool.alloc(e.data.byteLength); buf.set(new Uint8Array(e.data)); pend.push(buf); pendBytes += buf.length; } else { await w.write(e.data); } }
    } catch (err) { cleanup(); ws.close(1006); }
  });
  ws.addEventListener('close', cleanup); ws.addEventListener('error', cleanup);
};

// =============================================================================
// 🗄️ 存储与配置
// =============================================================================
async function getSafeEnv(env, key, fallback) {
    if (env[key] && env[key].trim() !== "") return env[key];
    if (env.DB) { try { const { results } = await env.DB.prepare("SELECT value FROM config WHERE key = ?").bind(key).all(); if (results && results.length > 0 && results[0].value) return results[0].value; } catch(e) {} }
    if (env.LH) { try { const kvVal = await env.LH.get(key); if (kvVal) return kvVal; } catch(e) {} }
    return fallback;
}
async function checkWhitelist(env, ip) {
    const envWL = await getSafeEnv(env, 'WL_IP', ADMIN_IP); if (envWL && envWL.includes(ip)) return true;
    if (env.DB) { try { const { results } = await env.DB.prepare("SELECT 1 FROM whitelist WHERE ip = ?").bind(ip).all(); if (results && results.length > 0) return true; } catch(e) {} }
    if (env.LH) { try { if (await env.LH.get(`WL_${ip}`)) return true; } catch(e) {} }
    return false;
}
async function addWhitelist(env, ip) {
    const time = Date.now();
    if (env.DB) { try { await env.DB.prepare("INSERT OR IGNORE INTO whitelist (ip, created_at) VALUES (?, ?)").bind(ip, time).run(); } catch(e) {} }
    if (env.LH) { try { await env.LH.put(`WL_${ip}`, "1"); } catch(e) {} }
}
async function delWhitelist(env, ip) {
    if (env.DB) { try { await env.DB.prepare("DELETE FROM whitelist WHERE ip = ?").bind(ip).run(); } catch(e) {} }
    if (env.LH) { try { await env.LH.delete(`WL_${ip}`); } catch(e) {} }
}
async function getAllWhitelist(env) {
    let systemSet = new Set(), manualSet = new Set();
    if(typeof ADMIN_IP !== 'undefined' && ADMIN_IP) ADMIN_IP.split(',').map(s=>s.trim()).filter(s=>s).forEach(i => systemSet.add(i));
    const envWL = await getSafeEnv(env, 'WL_IP', ""); if(envWL) envWL.split(',').map(s=>s.trim()).filter(s=>s).forEach(i => systemSet.add(i));
    if (env.DB) { try { const { results } = await env.DB.prepare("SELECT ip FROM whitelist ORDER BY created_at DESC").all(); results.forEach(row => manualSet.add(row.ip)); } catch(e) {} }
    if (env.LH) { try { const list = await env.LH.list({ prefix: "WL_" }); list.keys.forEach(k => manualSet.add(k.name.replace("WL_", ""))); } catch(e) {} }
    let result = []; systemSet.forEach(ip => result.push({ ip: ip, type: 'system' }));
    manualSet.forEach(ip => { if (!systemSet.has(ip)) result.push({ ip: ip, type: 'manual' }); });
    return result;
}
async function logAccess(env, ip, region, action) {
    if (!env.DB) return; const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    try { await env.DB.prepare("INSERT INTO logs (time, ip, region, action) VALUES (?, ?, ?, ?)").bind(time, ip, region, action).run();
        await env.DB.prepare("DELETE FROM logs WHERE id NOT IN (SELECT id FROM logs ORDER BY id DESC LIMIT 1000)").run(); } catch (e) {}
}
async function incrementDailyStats(env) {
    if (!env.DB) return "0"; const dateStr = new Date().toISOString().split('T')[0];
    try { await env.DB.prepare(`INSERT INTO stats (date, count) VALUES (?, 1) ON CONFLICT(date) DO UPDATE SET count = count + 1`).bind(dateStr).run();
        const { results } = await env.DB.prepare("SELECT count FROM stats WHERE date = ?").bind(dateStr).all(); return results[0]?.count?.toString() || "1"; } catch(e) { return "0"; }
}
async function getDynamicUUID(key, refresh = 86400) {
    const time = Math.floor(Date.now() / 1000 / refresh);
    const msg = new TextEncoder().encode(`${key}-${time}`);
    const hash = await crypto.subtle.digest('SHA-256', msg); const b = new Uint8Array(hash);
    return [...b.slice(0, 16)].map(n => n.toString(16).padStart(2, '0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}
async function getCloudflareUsage(env) {
    const Email = await getSafeEnv(env, 'CF_EMAIL', ""); const GlobalAPIKey = await getSafeEnv(env, 'CF_KEY', "");
    const AccountID = await getSafeEnv(env, 'CF_ID', ""); const APIToken = await getSafeEnv(env, 'CF_TOKEN', "");
    if (!AccountID && (!Email || !GlobalAPIKey)) return { success: false, msg: "未配置 CF 凭证" };
    const API = "https://api.cloudflare.com/client/v4"; const cfg = { "Content-Type": "application/json" };
    try {
        let finalAccountID = AccountID;
        if (!finalAccountID) { const r = await fetch(`${API}/accounts`, { method: "GET", headers: { ...cfg, "X-AUTH-EMAIL": Email, "X-AUTH-KEY": GlobalAPIKey } });
            if (!r.ok) throw new Error(`账户获取失败: ${r.status}`); const d = await r.json();
            const idx = d.result?.findIndex(a => a.name?.toLowerCase().startsWith(Email.toLowerCase())); finalAccountID = d.result?.[idx >= 0 ? idx : 0]?.id; }
        if(!finalAccountID) throw new Error("无法获取 Account ID");
        const now = new Date(); now.setUTCHours(0, 0, 0, 0);
        const hdr = APIToken ? { ...cfg, "Authorization": `Bearer ${APIToken}` } : { ...cfg, "X-AUTH-EMAIL": Email, "X-AUTH-KEY": GlobalAPIKey };
        const res = await fetch(`${API}/graphql`, { method: "POST", headers: hdr, body: JSON.stringify({ query: `query getBillingMetrics($AccountID: String!, $filter: AccountWorkersInvocationsAdaptiveFilter_InputObject) { viewer { accounts(filter: {accountTag: $AccountID}) { pagesFunctionsInvocationsAdaptiveGroups(limit: 1000, filter: $filter) { sum { requests } } workersInvocationsAdaptive(limit: 10000, filter: $filter) { sum { requests } } } } }`, variables: { AccountID: finalAccountID, filter: { datetime_geq: now.toISOString(), datetime_leq: new Date().toISOString() } } }) });
        if (!res.ok) throw new Error(`查询失败: ${res.status}`); const result = await res.json();
        const acc = result?.data?.viewer?.accounts?.[0]; const pages = acc?.pagesFunctionsInvocationsAdaptiveGroups?.reduce((t, i) => t + (i?.sum?.requests || 0), 0) || 0;
        const workers = acc?.workersInvocationsAdaptive?.reduce((t, i) => t + (i?.sum?.requests || 0), 0) || 0;
        return { success: true, total: pages + workers, pages, workers };
    } catch (e) { return { success: false, msg: e.message }; }
}
async function sendTgMsg(ctx, env, title, r, detail = "", isAdmin = false) {
  const token = await getSafeEnv(env, 'TG_BOT_TOKEN', TG_BOT_TOKEN); const chat_id = await getSafeEnv(env, 'TG_CHAT_ID', TG_CHAT_ID);
  if (!token || !chat_id) return;
  let icon = "📡"; if (title.includes("登录")) icon = "🔐"; else if (title.includes("订阅")) icon = "🔄"; else if (title.includes("检测")) icon = "🔍"; else if (title.includes("点击")) icon = "🌟";
  const roleTag = isAdmin ? "🛡️ <b>管理员操作</b>" : "👤 <b>用户访问</b>";
  try {
    const url = new URL(r.url); const ip = r.headers.get('cf-connecting-ip') || 'Unknown'; const ua = r.headers.get('User-Agent') || 'Unknown'; const city = r.cf?.city || 'Unknown'; const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const safe = (str) => (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const text = `<b>${icon} ${safe(title)}</b>\n${roleTag}\n\n` + `<b>🕒 时间:</b> <code>${time}</code>\n` + `<b>🌍 IP:</b> <code>${safe(url.hostname)}</code>\n` + `<b>🔗 域名:</b> <code>${safe(url.hostname)}</code>\n` + `<b>🛣️ 路径:</b> <code>${safe(url.pathname)}</code>\n` + `<b>📱 客户端:</b> <code>${safe(ua)}</code>\n` + (detail ? `<b>ℹ️ 详情:</b> ${safe(detail)}` : "");
    const params = { chat_id: chat_id, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
    const p = fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }).catch(() => {});
    if(ctx && ctx.waitUntil) ctx.waitUntil(p);
  } catch(e) {}
}

// =============================================================================
// 🟢 主入口 (防1101保护)
// =============================================================================
export default {
  async fetch(r, env, ctx) { 
    try {
      const url = new URL(r.url);
      const host = url.hostname; 
      const UA = (r.headers.get('User-Agent') || "").toLowerCase();
      const UA_L = UA.toLowerCase();
      const clientIP = r.headers.get('cf-connecting-ip');
      const country = r.cf?.country || 'UNK';
      const city = r.cf?.city || 'Unknown';

      const _UUID = env.KEY ? await getDynamicUUID(env.KEY, env.UUID_REFRESH || 86400) : (await getSafeEnv(env, 'UUID', UUID));
      const _WEB_PW = await getSafeEnv(env, 'WEB_PASSWORD', WEB_PASSWORD);
      const _SUB_PW = await getSafeEnv(env, 'SUB_PASSWORD', SUB_PASSWORD);
      
      // ⭐ 功能1: 多ProxyIP轮询支持
      let _PROXY_IP = await getSafeEnv(env, 'PROXYIP', DEFAULT_PROXY_IP);
      const proxyIPs = _PROXY_IP.split(',').map(i => i.trim()).filter(i => i);
      _PROXY_IP = proxyIPs[Math.floor(Date.now() / 1000) % proxyIPs.length] || _PROXY_IP;

      const _PS = await getSafeEnv(env, 'PS', "");
      const _LOGIN_TITLE = await getSafeEnv(env, 'LOGIN_PAGE_TITLE', LOGIN_PAGE_TITLE);
      const _DASH_TITLE = await getSafeEnv(env, 'DASHBOARD_TITLE', DASHBOARD_TITLE); 
      
      // ⭐ 功能2 & 3: 准备多订阅域名和转换器的列表
      let _SUB_DOMAIN_STR = await getSafeEnv(env, 'SUB_DOMAIN', DEFAULT_SUB_DOMAIN);
      let _CONVERTER_STR = await getSafeEnv(env, 'SUBAPI', DEFAULT_CONVERTER);
      const _SUB_DOMAIN_LIST = _SUB_DOMAIN_STR.split(',').map(s => { let v=s.trim(); if(v.includes("://")) v=v.split("://")[1]; if(v.includes("/")) v=v.split("/")[0]; return v; }).filter(s=>s);
      const _CONVERTER_LIST = _CONVERTER_STR.split(',').map(s => { let v=s.trim(); if(v.endsWith("/")) v=v.slice(0, -1); if(!v.includes("://")) v="https://"+v; return v; }).filter(s=>s);
      
      // 取第一个作为默认值，用于界面显示
      let _SUB_DOMAIN = _SUB_DOMAIN_LIST[0] || host;
      let _CONVERTER = _CONVERTER_LIST[0] || DEFAULT_CONVERTER;

      // ⭐ 功能4: DLS速度下限筛选
      const _DLS = await getSafeEnv(env, 'DLS', DLS);

      // 👇 变量去重与统一调用逻辑：优先 getSafeEnv(环境变量, 默认常量)
      const _TG_GROUP_URL = await getSafeEnv(env, 'TG_GROUP_URL', TG_GROUP_URL);
      const _PROXY_CHECK_URL = await getSafeEnv(env, 'PROXY_CHECK_URL', PROXY_CHECK_URL);
      const _SITE_URL = await getSafeEnv(env, 'SITE_URL', SITE_URL);
      const _GITHUB_URL = await getSafeEnv(env, 'GITHUB_URL', GITHUB_URL);
      const _CLASH_CONFIG = await getSafeEnv(env, 'CLASH_CONFIG', CLASH_CONFIG);
      const _SINGBOX_CONFIG_V12 = await getSafeEnv(env, 'SINGBOX_CONFIG_V12', SINGBOX_CONFIG_V12);
      
      if (UA_L.includes('spider') || UA_L.includes('bot') || UA_L.includes('python') || UA_L.includes('scrapy') || UA_L.includes('curl') || UA_L.includes('wget')) {
          return new Response('Not Found', { status: 404 });
      }

      let isGlobalAdmin = await checkWhitelist(env, clientIP);
      let isValidUser = false; 
      let hasAuthCookie = false; 

      const paramUUID = url.searchParams.get('uuid');
      if (paramUUID && paramUUID.toLowerCase() === _UUID.toLowerCase()) isValidUser = true;
      if (_SUB_PW && url.pathname === `/${_SUB_PW}`) isValidUser = true;

      if (_WEB_PW) {
        const cookie = r.headers.get('Cookie') || "";
        const regex = new RegExp(`auth=${_WEB_PW.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(;|$)`);
        if (regex.test(cookie)) {
            isValidUser = true; hasAuthCookie = true;
            if (!isGlobalAdmin) { ctx.waitUntil(addWhitelist(env, clientIP)); isGlobalAdmin = true; }
        }
      }
      if (isGlobalAdmin) isValidUser = true;

      if (env.DB || env.LH) ctx.waitUntil(incrementDailyStats(env));
      if (url.pathname === '/favicon.ico') return new Response(null, { status: 404 });
      
      const flag = url.searchParams.get('flag');
      if (flag) {
          if (flag === 'github') { await sendTgMsg(ctx, env, "🌟 用户点击了烈火项目", r, "来源: 登录页面直达链接", isGlobalAdmin); return new Response(null, { status: 204 }); }
          if (flag === 'log_proxy_check') { await sendTgMsg(ctx, env, "🔍 用户点击了 ProxyIP 检测", r, "来源: 后台管理面板", isGlobalAdmin); return new Response(null, { status: 204 }); }
          if (flag === 'log_sub_test') { await sendTgMsg(ctx, env, "🌟 用户点击了订阅测试", r, "来源: 后台管理面板", isGlobalAdmin); return new Response(null, { status: 204 }); }
          if (flag === 'stats') { let reqCount = await incrementDailyStats(env); const cfStats = await getCloudflareUsage(env); const finalReq = cfStats.success ? `${cfStats.total} (API)` : `${reqCount} (Internal)`; const hasKV = !!(env.DB || env.LH); const cfConfigured = cfStats.success || (!!await getSafeEnv(env, 'CF_EMAIL', "") && !!await getSafeEnv(env, 'CF_KEY', "")); return new Response(JSON.stringify({ req: finalReq, ip: clientIP, loc: `${city}, ${country}`, hasKV: hasKV, cfConfigured: cfConfigured }), { headers: { 'Content-Type': 'application/json' } }); }
          if (flag === 'get_logs') { if (!hasAuthCookie && !isGlobalAdmin) return new Response('403 Forbidden', { status: 403 }); if (env.DB) { try { const { results } = await env.DB.prepare("SELECT * FROM logs ORDER BY id DESC LIMIT 50").all(); return new Response(JSON.stringify({ type: 'd1', logs: results }), { headers: { 'Content-Type': 'application/json' } }); } catch(e) {} } else if (env.LH) { try { const logs = await env.LH.get('ACCESS_LOGS') || ""; return new Response(JSON.stringify({ type: 'kv', logs: logs }), { headers: { 'Content-Type': 'application/json' } }); } catch(e) {} } return new Response(JSON.stringify({ logs: "No Storage" }), { headers: { 'Content-Type': 'application/json' } }); }
          if (flag === 'get_whitelist') { if (!hasAuthCookie && !isGlobalAdmin) return new Response('403 Forbidden', { status: 403 }); const list = await getAllWhitelist(env); return new Response(JSON.stringify({ list }), { headers: { 'Content-Type': 'application/json' } }); }
          if (flag === 'add_whitelist' && r.method === 'POST') { if (!hasAuthCookie && !isGlobalAdmin) return new Response('403 Forbidden', { status: 403 }); const body = await r.json(); if(body.ip) await addWhitelist(env, body.ip); return new Response(JSON.stringify({status:'ok'}), {headers:{'Content-Type':'application/json'}}); }
          if (flag === 'del_whitelist' && r.method === 'POST') { if (!hasAuthCookie && !isGlobalAdmin) return new Response('403 Forbidden', { status: 403 }); const body = await r.json(); if(body.ip) await delWhitelist(env, body.ip); return new Response(JSON.stringify({status:'ok'}), {headers:{'Content-Type':'application/json'}}); }
          if (flag === 'validate_tg' && r.method === 'POST') { const body = await r.json(); await sendTgMsg(ctx, { TG_BOT_TOKEN: body.TG_BOT_TOKEN, TG_CHAT_ID: body.TG_CHAT_ID }, "🤖 TG 推送可用性验证", r, "配置有效", true); return new Response(JSON.stringify({success:true, msg:"验证消息已发送"}), {headers:{'Content-Type':'application/json'}}); }
          if (flag === 'validate_cf' && r.method === 'POST') { const body = await r.json(); const res = await getCloudflareUsage(body); return new Response(JSON.stringify({success:res.success, msg: res.success ? `验证通过: 总请求 ${res.total}` : `验证失败: ${res.msg}`}), {headers:{'Content-Type':'application/json'}}); }
          if (flag === 'save_config' && r.method === 'POST') { if (!hasAuthCookie && !isGlobalAdmin) return new Response('403 Forbidden', { status: 403 }); try { const body = await r.json(); for (const [k, v] of Object.entries(body)) { if (env.DB) await env.DB.prepare("INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?").bind(k, v, v).run(); if (env.LH) await env.LH.put(k, v); } return new Response(JSON.stringify({status: 'ok'}), { headers: { 'Content-Type': 'application/json' } }); } catch(e) { return new Response(JSON.stringify({status: 'error', msg: e.toString()}), { headers: { 'Content-Type': 'application/json' } }); } }
      }

      if (_SUB_PW && url.pathname === `/${_SUB_PW}`) {
          ctx.waitUntil(logAccess(env, clientIP, `${city},${country}`, "订阅更新"));
          const isFlagged = url.searchParams.has('flag');
          if (!isFlagged) {
              try {
                  const _d = (s) => atob(s);
                  const rules = [['TWlob21v', 'bWlob21v'], ['RmxDbGFzaA==', 'ZmxjbGFzaA=='], ['Q2xhc2g=', 'Y2xhc2g='], ['Q2xhc2g=', 'bWV0YQ=='], ['Q2xhc2g=', 'c3Rhc2g='], ['SGlkZGlmeQ==', 'aGlkZGlmeQ=='], ['U2luZy1ib3g=', 'c2luZy1ib3g='], ['U2luZy1ib3g=', 'c2luZ2JveA=='], ['U2luZy1ib3g=', 'c2Zp'], ['U2luZy1ib3g=', 'Ym94'], ['djJyYXlOL0NvcmU=', 'djJyYXk='], ['U3VyZ2U=', 'c3VyZ2U='], ['UXVhbnR1bXVsdCBY', 'cXVhbnR1bXVsdA=='], ['U2hhZG93cm9ja2V0', 'c2hhZG93cm9ja2V0'], ['TG9vbg==', 'bG9vbg=='], ['SGFB', 'aGFwcA==']];
                  let cName = "VW5rbm93bg=="; let isProxy = false;
                  for (const [n, k] of rules) { if (UA_L.includes(_d(k))) { cName = n; isProxy = true; break; } }
                  if (!isProxy && (UA_L.includes(_d('bW96aWxsYQ==')) || UA_L.includes(_d('Y2hyb21l')))) cName = "QnJvd3Nlcg==";
                  const title = isProxy ? "🔄 快速订阅更新" : "🌐 访问快速订阅页";
                  const p = sendTgMsg(ctx, env, title, r, `类型: ${_d(cName)}`, isGlobalAdmin);
                  if(ctx && ctx.waitUntil) ctx.waitUntil(p);
              } catch (e) {}
          }
          const requestProxyIp = url.searchParams.get('proxyip') || _PROXY_IP;
          const pathParam = requestProxyIp ? "/proxyip=" + requestProxyIp : "/";
          
          if (UA_L.includes('sing-box') || UA_L.includes('singbox') || UA_L.includes('clash') || UA_L.includes('meta') || UA_L.includes('loon') || UA_L.includes('surge')) {
              const type = (UA_L.includes('clash') || UA_L.includes('meta')) ? 'clash' : 'singbox';
              const config = type === 'clash' ? _CLASH_CONFIG : _SINGBOX_CONFIG_V12;
              
              // ⭐ 功能3: 多订阅转换器故障切换
              let lastRes = null;
              for (const converterUrl of _CONVERTER_LIST) {
                  // ⭐ 功能2: 多订阅源域名故障切换 (构建 subUrl 时循环尝试)
                  // 注意：转换器一般只接受一个 url 参数，这里我们需要确定用哪个 subUrl 传给转换器
                  // 策略：我们生成第一个可用的 subUrl (非当前 host) 传给转换器，或者直接传 host (如果是worker自身)
                  // 简单起见，我们构造一个基于 _SUB_DOMAIN_LIST[0] 的 URL 传给转换器，因为转换器是服务器端抓取
                  let targetSubDomain = _SUB_DOMAIN_LIST[0] || host;
                  const subUrl = `https://${targetSubDomain}/sub?uuid=${_UUID}&encryption=none&security=tls&sni=${host}&alpn=h3&fp=random&allowInsecure=0&type=ws&host=${host}&path=${encodeURIComponent(pathParam)}`;
                  
                  const subApi = `${converterUrl}/sub?target=${type}&url=${encodeURIComponent(subUrl)}&config=${encodeURIComponent(config)}&emoji=true&list=false&sort=false&fdn=false&scv=false`;
                  try {
                      const res = await fetch(subApi, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } });
                      if (res.ok) { lastRes = res; break; } // 成功则跳出循环
                  } catch(e) {}
              }
              if (lastRes) return new Response(lastRes.body, { status: 200, headers: lastRes.headers });
          }
          
          // 原生订阅处理 (支持多域名故障切换)
          try {
            let success = false;
            let body = "";
            let finalHeaders = {};
            
            // ⭐ 功能2: 多订阅源域名故障切换
            for (const subDomain of _SUB_DOMAIN_LIST) {
                if (host.toLowerCase() === subDomain.toLowerCase()) continue; // 跳过自身，防止死循环 (如果是自请求)
                const subUrl = `https://${subDomain}/sub?uuid=${_UUID}&encryption=none&security=tls&sni=${host}&alpn=h3&fp=random&allowInsecure=0&type=ws&host=${host}&path=${encodeURIComponent(pathParam)}`;
                try {
                    const res = await fetch(subUrl, { headers: { 'User-Agent': UA } });
                    if (res.ok) {
                        body = await res.text();
                        finalHeaders = res.headers;
                        success = true;
                        break; 
                    }
                } catch(e) {}
            }

            if (success) {
                if (_PS) { try { const decoded = atob(body); const modified = decoded.split('\n').map(line => { line = line.trim(); if (!line || !line.includes('://')) return line; if (line.includes('#')) return line + encodeURIComponent(` ${_PS}`); return line + '#' + encodeURIComponent(_PS); }).join('\n'); body = btoa(modified); } catch(e) {} }
                return new Response(body, { status: 200, headers: finalHeaders });
            }
          } catch(e) {}
          
          const allIPs = await getCustomIPs(env, _DLS); // 传入 DLS
          const listText = genNodes(host, _UUID, requestProxyIp, allIPs, _PS);
          return new Response(btoa(unescape(encodeURIComponent(listText))), { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      if (url.pathname === '/sub') {
          ctx.waitUntil(logAccess(env, clientIP, `${city},${country}`, "常规订阅"));
          const requestUUID = url.searchParams.get('uuid');
          if (requestUUID.toLowerCase() !== _UUID.toLowerCase()) return new Response('Invalid UUID', { status: 403 });
          let proxyIp = url.searchParams.get('proxyip') || _PROXY_IP;
          const pathParam = url.searchParams.get('path');
          if (pathParam && pathParam.includes('/proxyip=')) proxyIp = pathParam.split('/proxyip=')[1];
          const allIPs = await getCustomIPs(env, _DLS); // 传入 DLS
          const listText = genNodes(host, _UUID, proxyIp, allIPs, _PS);
          return new Response(btoa(unescape(encodeURIComponent(listText))), { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      if (r.headers.get('Upgrade') !== 'websocket') {
        const noCacheHeaders = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' };
        if (!hasAuthCookie) return new Response(loginPage(_TG_GROUP_URL, _SITE_URL, _GITHUB_URL, _LOGIN_TITLE), { status: 200, headers: noCacheHeaders });
        await sendTgMsg(ctx, env, "✅ 后台登录成功", r, "进入管理面板", true);
        ctx.waitUntil(logAccess(env, clientIP, `${city},${country}`, "登录后台"));

        const sysParams = { tgToken: env.TG_BOT_TOKEN || TG_BOT_TOKEN, tgId: env.TG_CHAT_ID || TG_CHAT_ID, cfId: env.CF_ID || "", cfToken: env.CF_TOKEN || "", cfMail: env.CF_EMAIL || "", cfKey: env.CF_KEY || "" };
        const tgToken = await getSafeEnv(env, 'TG_BOT_TOKEN', TG_BOT_TOKEN);
        const tgId = await getSafeEnv(env, 'TG_CHAT_ID', TG_CHAT_ID);
        const cfId = await getSafeEnv(env, 'CF_ID', ''); const cfToken = await getSafeEnv(env, 'CF_TOKEN', '');
        const cfMail = await getSafeEnv(env, 'CF_EMAIL', ''); const cfKey = await getSafeEnv(env, 'CF_KEY', '');
        const tgState = !!(tgToken && tgId); const cfState = (!!(cfId && cfToken)) || (!!(cfMail && cfKey));
        const _ADD = await getSafeEnv(env, 'ADD', ""); const _ADDAPI = await getSafeEnv(env, 'ADDAPI', ""); const _ADDCSV = await getSafeEnv(env, 'ADDCSV', "");

        // 传入 _DLS 参数到 dashPage
        return new Response(dashPage(url.hostname, _UUID, _PROXY_IP, _SUB_PW, _SUB_DOMAIN, _CONVERTER, env, clientIP, hasAuthCookie, tgState, cfState, _ADD, _ADDAPI, _ADDCSV, tgToken, tgId, cfId, cfToken, cfMail, cfKey, sysParams, _DASH_TITLE, _PROXY_CHECK_URL, _DLS), { status: 200, headers: noCacheHeaders });
      }
      
      // 🟢 代理入口 - 混淆版
      const { proxyIP, sq, enSq, gp } = parsePC(url.pathname);
      const { 0: c, 1: s } = new WebSocketPair();
      s.accept(); 
      handle(s, proxyIP, sq, enSq, gp, _UUID); 
      return new Response(null, { status: 101, webSocket: c });

  } catch (err) {
      return new Response(err.toString(), { status: 500 });
    }
  }
};

// =============================================================================
// 📋 UI & 节点生成
// =============================================================================

function genNodes(host, uuid, proxyIP, customIPs, psName) {
  const commonUrlPart = `?encryption=none&security=tls&sni=${host}&fp=random&type=ws&host=${host}`;
  const separator = psName ? ` ${psName}` : '';
  const result = [];
  if (!customIPs || customIPs.length === 0) {
      const path = proxyIP ? `/proxyip=${proxyIP}` : "/";
      const nodeName = `${psName || 'Worker'} - Default`;
      const vLink = `${P_V}://${uuid}@${proxyIP || host}:443${commonUrlPart}&path=${encodeURIComponent(path)}#${encodeURIComponent(nodeName)}`;
      return vLink;
  }
  for (const ipInfo of customIPs) {
      let [addressPart, ...nameParts] = ipInfo.split('#');
      let uniqueName = nameParts.join('#').trim();
      addressPart = addressPart.trim();
      let ip = addressPart; let port = '443';
      if (addressPart.includes(':') && !addressPart.includes(']:')) { const parts = addressPart.split(':'); ip = parts[0]; port = parts[1]; }
      const path = proxyIP ? `/proxyip=${proxyIP}` : "/";
      let nodeName = uniqueName || ip; if (psName) nodeName = `${nodeName}${separator}`;
      const vLink = `${P_V}://${uuid}@${ip}:${port}${commonUrlPart}&path=${encodeURIComponent(path)}#${encodeURIComponent(nodeName)}`;
      result.push(vLink);
  }
  return result.join('\n');
}

// ⭐ 功能4: 修改 getCustomIPs 支持 DLS 筛选
async function getCustomIPs(env, dlsThreshold) {
    let allIPs = [];
    const threshold = Number(dlsThreshold) || 5000; // 默认5000
    const addText = await getSafeEnv(env, 'ADD', "");
    if (addText) { addText.split('\n').forEach(line => { const trimmed = line.trim(); if (trimmed && !trimmed.startsWith('#')) allIPs.push(trimmed); }); }
    const addApi = await getSafeEnv(env, 'ADDAPI', "");
    if (addApi) { const urls = addApi.split('\n').filter(u => u.trim().startsWith('http')); for (const url of urls) { try { const res = await fetch(url.trim(), { headers: { 'User-Agent': 'Mozilla/5.0' } }); if (res.ok) { const text = await res.text(); text.split('\n').forEach(line => { const trimmed = line.trim(); if (trimmed && !trimmed.startsWith('#')) allIPs.push(trimmed); }); } } catch (e) {} } }
    const addCsv = await getSafeEnv(env, 'ADDCSV', "");
    if (addCsv) { 
        const urls = addCsv.split('\n').filter(u => u.trim().startsWith('http')); 
        for (const url of urls) { 
            try { 
                const res = await fetch(url.trim(), { headers: { 'User-Agent': 'Mozilla/5.0' } }); 
                if (res.ok) { 
                    const text = await res.text(); 
                    text.split('\n').forEach(line => { 
                        const trimmed = line.trim(); 
                        if (!trimmed || trimmed.startsWith('#')) return;
                        // CSV格式: IP,端口,TLS,数据中心,地区,城市,网络延迟,下载速度
                        // 索引: 0, 1, 2, 3, 4, 5, 6, 7
                        const cols = trimmed.split(',');
                        if (cols.length >= 8) {
                            const speed = Number(cols[7]);
                            if (!isNaN(speed) && speed < threshold) return; // 速度低于阈值则跳过
                        }
                        const firstCol = cols[0]; 
                        // 将CSV行也尝试作为IP加入 (通常CSV第一列就是IP)
                        if (firstCol) allIPs.push(firstCol); 
                    }); 
                } 
            } catch (e) {} 
        } 
    }
    return allIPs;
}

function loginPage(tgGroup, siteUrl, githubUrl, pageTitle) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=0.5, user-scalable=yes">
    <meta name="format-detection" content="telephone=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>${pageTitle}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%); color: white; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; position: relative; }

        /* 星空背景 */
        .stars { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; overflow: hidden; }
        .star { position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%; animation: twinkle 3s infinite; box-shadow: 0 0 4px rgba(255, 255, 255, 0.8); }
        @keyframes twinkle { 0%, 100% { opacity: 0.2; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.5); } }

        /* 流星雨特效 */
        .meteor { position: absolute; width: 3px; height: 150px; background: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.5), transparent); border-radius: 50%; animation: meteor-fall linear infinite; opacity: 0; box-shadow: 0 0 10px rgba(255, 255, 255, 0.8); }
        @keyframes meteor-fall { 0% { opacity: 1; transform: translateX(0) translateY(0) rotate(-45deg); } 70% { opacity: 0.8; } 100% { opacity: 0; transform: translateX(-500px) translateY(500px) rotate(-45deg); } }
        .meteor:nth-child(1) { top: 5%; left: 10%; animation-duration: 1.8s; animation-delay: 0s; }
        .meteor:nth-child(2) { top: 15%; left: 30%; animation-duration: 2.2s; animation-delay: 0.8s; }
        .meteor:nth-child(3) { top: 8%; left: 50%; animation-duration: 2.5s; animation-delay: 1.5s; }
        .meteor:nth-child(4) { top: 20%; left: 70%; animation-duration: 2s; animation-delay: 2.2s; }
        .meteor:nth-child(5) { top: 12%; left: 85%; animation-duration: 2.3s; animation-delay: 3s; }
        .meteor:nth-child(6) { top: 25%; left: 20%; animation-duration: 2.1s; animation-delay: 3.8s; }
        .meteor:nth-child(7) { top: 18%; left: 45%; animation-duration: 2.4s; animation-delay: 4.5s; }
        .meteor:nth-child(8) { top: 10%; left: 65%; animation-duration: 1.9s; animation-delay: 5.2s; }

        /* 毛玻璃碎片 */
        .glass-shards { position: absolute; width: 100%; height: 100%; z-index: 2; pointer-events: none; }
        .shard { position: absolute; background: linear-gradient(135deg, rgba(79, 172, 254, 0.08), rgba(157, 127, 245, 0.05)); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); animation: shardFloat 25s infinite ease-in-out; }
        .shard:nth-child(1) { width: 180px; height: 180px; top: 5%; left: 10%; clip-path: polygon(30% 0%, 70% 10%, 100% 40%, 90% 80%, 50% 100%, 10% 90%, 0% 50%); animation-delay: 0s; }
        .shard:nth-child(2) { width: 140px; height: 200px; top: 50%; left: 5%; clip-path: polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%); animation-delay: -8s; }
        .shard:nth-child(3) { width: 220px; height: 160px; top: 10%; right: 8%; clip-path: polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%); animation-delay: -15s; }
        .shard:nth-child(4) { width: 150px; height: 150px; bottom: 10%; right: 15%; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); animation-delay: -20s; }
        .shard:nth-child(5) { width: 190px; height: 130px; top: 40%; left: 3%; clip-path: polygon(40% 0%, 100% 20%, 90% 70%, 30% 100%, 0% 60%); animation-delay: -10s; }
        .shard:nth-child(6) { width: 130px; height: 180px; bottom: 15%; left: 45%; clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); animation-delay: -18s; }
        @keyframes shardFloat { 0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; } 25% { transform: translateY(-25px) rotate(3deg); opacity: 0.6; } 50% { transform: translateY(-40px) rotate(-2deg); opacity: 0.5; } 75% { transform: translateY(-20px) rotate(4deg); opacity: 0.7; } }

        /* 登录框 */
        .glass-box { position: relative; z-index: 10; background: rgba(15, 25, 50, 0.4); backdrop-filter: blur(20px) saturate(180%); border: 2px solid rgba(255, 255, 255, 0.1); padding: 45px 40px; border-radius: 20px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(255,255,255,0.05); text-align: center; width: 380px; animation: boxAppear 0.8s ease-out; }
        @keyframes boxAppear { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        
        .glass-box::before { content: ''; position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(45deg, #00f5ff, #0080ff, #00f5ff, #0080ff); border-radius: 20px; z-index: -1; opacity: 0.3; filter: blur(10px); animation: borderGlow 3s linear infinite; }
        @keyframes borderGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }

        h2 { margin-bottom: 30px; font-weight: 700; font-size: 1.6rem; display: flex; align-items: center; justify-content: center; gap: 10px; text-shadow: 0 0 20px rgba(0, 245, 255, 0.5); letter-spacing: 2px; }
        h2::before { content: '🔒'; font-size: 1.4rem; filter: drop-shadow(0 0 10px rgba(0, 245, 255, 0.8)); }

        input { width: 100%; padding: 14px 18px; margin-bottom: 20px; border-radius: 12px; border: 1px solid rgba(0, 245, 255, 0.3); background: rgba(10, 20, 40, 0.6); color: white; text-align: center; font-size: 1rem; outline: none; transition: all 0.3s; backdrop-filter: blur(5px); }
        input:focus { border-color: #00f5ff; background: rgba(10, 20, 40, 0.8); box-shadow: 0 0 20px rgba(0, 245, 255, 0.4), inset 0 0 10px rgba(0, 245, 255, 0.1); }
        input::placeholder { color: rgba(255, 255, 255, 0.5); }

        .btn-group { display: flex; flex-direction: column; gap: 12px; }
        button { width: 100%; padding: 14px; border-radius: 12px; border: none; cursor: pointer; font-size: 1rem; transition: all 0.3s; font-weight: 600; position: relative; overflow: hidden; }
        button::before { content: ''; position: absolute; top: 50%; left: 50%; width: 0; height: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.3); transition: width 0.6s, height 0.6s, top 0.6s, left 0.6s; }
        button:hover::before { width: 300px; height: 300px; top: -150px; left: -150px; }

        .btn-primary { background: linear-gradient(135deg, rgba(0, 128, 255, 0.8), rgba(0, 245, 255, 0.6)); color: white; box-shadow: 0 4px 15px rgba(0, 128, 255, 0.4); border: 1px solid rgba(0, 245, 255, 0.3); }
        .btn-primary:hover { box-shadow: 0 6px 25px rgba(0, 245, 255, 0.6); transform: translateY(-2px); }

        .btn-unlock { background: linear-gradient(135deg, rgba(138, 43, 226, 0.8), rgba(75, 0, 130, 0.8)); color: white; box-shadow: 0 4px 15px rgba(138, 43, 226, 0.4); border: 1px solid rgba(138, 43, 226, 0.5); }
        .btn-unlock:hover { box-shadow: 0 6px 25px rgba(138, 43, 226, 0.6); transform: translateY(-2px); }

        /* 修改部分开始：一行两个，平分宽度 */
        .social-links { 
            margin-top: 12px; 
            display: flex; 
            gap: 12px; /* 两个按钮之间的间距 */
            /* 默认 flex-direction 就是 row，所以这里就是一行显示 */
        }
        
        .pill { 
            flex: 1; /* 让两个按钮自动平分宽度 */
            background: linear-gradient(135deg, rgba(138, 43, 226, 0.8), rgba(75, 0, 130, 0.8)); 
            backdrop-filter: blur(10px); 
            padding: 14px; 
            border-radius: 12px; /* 保持与上面按钮一致的方圆角 */
            color: white; 
            text-decoration: none; 
            font-size: 0.9rem; 
            display: flex; 
            align-items: center; 
            justify-content: center; /* 文字居中 */
            gap: 4px; 
            transition: all 0.3s; 
            border: 1px solid rgba(138, 43, 226, 0.5); 
            box-shadow: 0 4px 15px rgba(138, 43, 226, 0.4); 
            font-weight: 600;
            white-space: nowrap; /* 防止文字换行 */
        }
        
        .pill:hover { 
            background: linear-gradient(135deg, rgba(138, 43, 226, 1), rgba(75, 0, 130, 1)); 
            border-color: rgba(138, 43, 226, 0.8); 
            color: white; 
            box-shadow: 0 6px 25px rgba(138, 43, 226, 0.6); 
            transform: translateY(-2px); 
        }
        /* 修改部分结束 */

        /* 响应式 */
        @media (max-width: 768px) {
            .glass-box { width: 90%; max-width: 380px; padding: 35px 25px; }
            h2 { font-size: 1.4rem; }
            input { padding: 12px 15px; font-size: 0.95rem; }
            button { padding: 12px; font-size: 0.95rem; }
            .pill { font-size: 0.85rem; padding: 12px 8px; } /* 手机端稍微减小内边距 */
        }
        @media (max-width: 480px) {
            .glass-box { width: 95%; padding: 30px 20px; }
            h2 { font-size: 1.2rem; margin-bottom: 20px; }
            h2::before { font-size: 1.2rem; }
            input { padding: 10px 12px; font-size: 0.9rem; margin-bottom: 15px; }
            button { padding: 10px; font-size: 0.9rem; }
            .btn-group { gap: 10px; }
            .social-links { gap: 10px; margin-top: 10px; }
            .pill { font-size: 0.8rem; padding: 10px 5px; }
        }
    </style>
</head>
<body>
    <div class="stars" id="starsContainer"></div>
    <div class="stars">
        <div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div>
        <div class="meteor"></div><div class="meteor"></div><div class="meteor"></div><div class="meteor"></div>
    </div>
    <div class="glass-shards">
        <div class="shard"></div><div class="shard"></div><div class="shard"></div>
        <div class="shard"></div><div class="shard"></div><div class="shard"></div>
    </div>

    <div class="glass-box">
        <h2>管理员登陆</h2>
        <input type="password" id="pwd" placeholder="请输入密码" autofocus autocomplete="new-password" onkeypress="if(event.keyCode===13)verify()">
        <div class="btn-group">
            <button class="btn-unlock" onclick="verify()">立即登陆</button>
            <button class="btn-primary" onclick="window.open('${siteUrl}', '_blank')">天诚网站</button>
        </div>
        <div class="social-links">
            <a href="javascript:void(0)" onclick="gh()" class="pill">🔥 烈火项目直达</a>
            <a href="${tgGroup}" target="_blank" class="pill">✈️ 天诚交流群</a>
        </div>
    </div>

    <script>
        function generateStars() {
            const starsContainer = document.getElementById('starsContainer');
            for (let i = 0; i < 200; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 3 + 's';
                star.style.animationDuration = (Math.random() * 2 + 2) + 's';
                const size = Math.random() * 2 + 1;
                star.style.width = size + 'px';
                star.style.height = size + 'px';
                starsContainer.appendChild(star);
            }
        }
        generateStars();
        function gh(){fetch("?flag=github&t="+Date.now(),{keepalive:!0});window.open("${githubUrl}","_blank")}
        function verify(){
            const p = document.getElementById("pwd").value;
            if(!p) return;
            document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "auth=" + p + "; path=/; SameSite=Lax";
            sessionStorage.setItem("is_active", "1");
            location.reload();
        }
        window.onload = function() {
            if(!sessionStorage.getItem("is_active")) {
                document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
        }
    </script>
</body>
</html>`;
}

// 👇 修改：增加 proxyCheckUrl 参数
function dashPage(host, uuid, proxyip, subpass, subdomain, converter, env, clientIP, hasAuth, tgState, cfState, add, addApi, addCsv, tgToken, tgId, cfId, cfToken, cfMail, cfKey, sysParams, dashTitle, proxyCheckUrl, dls) {
    const defaultSubLink = `https://${host}/${subpass}`;
    const pathParam = proxyip ? "/proxyip=" + proxyip : "/";
    const longLink = `https://${subdomain}/sub?uuid=${uuid}&encryption=none&security=tls&sni=${host}&alpn=h3&fp=random&allowInsecure=0&type=ws&host=${host}&path=${encodeURIComponent(pathParam)}`;
    const safeVal = (str) => (str || '').replace(/"/g, '&quot;');
    const getStatusLabel = (val, sysVal) => { if (!val) return ""; if (val === sysVal) return `<span class="source-tag sys">🔒 系统预设 (不可删除)</span>`; return `<span class="source-tag man">💾 后台配置 (可清除)</span>`; };
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=0.5, user-scalable=yes">
    <meta name="format-detection" content="telephone=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <title>${dashTitle}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { display: none; opacity: 0; transition: opacity 0.3s; overflow-x: hidden; position: relative; }
        body.loaded { display: block; opacity: 1; }

        /* 玻璃态配色 - 柔和不刺眼 */
        :root {
            --glass-blue: #4facfe;
            --glass-purple: #9d7ff5;
            --glass-cyan: #43e9e5;
            --glass-pink: #f093fb;
            --glass-green: #4ade80;
            --bg-dark: #0f0f23;
            --bg-darker: #050510;
            --card-bg: rgba(15, 20, 40, 0.4);
            --text: #e8eaf6;
            --text-dim: #9ca3af;
            --border: rgba(79, 172, 254, 0.2);
            --glow: rgba(79, 172, 254, 0.5);
            --success: #4ade80;
            --warning: #fbbf24;
            --danger: #f87171;
        }
        body.light {
            /* 浅色主题 - 加深颜色变量以增强对比度 */
            --glass-blue: #2563eb;
            --glass-purple: #7c3aed;
            --glass-cyan: #0891b2;
            --glass-pink: #db2777;
            --glass-green: #059669;
            --bg-dark: #f8fafc;
            --bg-darker: #f1f5f9;
            --card-bg: rgba(255, 255, 255, 0.8);
            --text: #0f172a;
            --text-dim: #475569;
            --border: rgba(37, 99, 235, 0.2);
            --glow: rgba(37, 99, 235, 0.3);
            --success: #059669;
            --warning: #d97706;
            --danger: #dc2626;
        }
        /* 👇 修改：白色主题背景改为天空蓝色渐变 */
        body.light {
            background: linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 30%, #E0F7FA 60%, #F0F9FF 100%);
        }
        /* 白色模式 - 玻璃碎片变为白云效果 */
        body.light .shard {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4));
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 8px 32px rgba(255, 255, 255, 0.5);
            border-radius: 50%;
        }

        /* 白色模式输入框优化 */
        body.light input,
        body.light textarea,
        body.light select {
            background: rgba(255, 255, 255, 0.95);
            color: #0f172a;
            border-color: rgba(37, 99, 235, 0.25);
        }
        body.light input:focus,
        body.light textarea:focus,
        body.light select:focus {
            background: rgba(255, 255, 255, 1);
            border-color: var(--glass-blue);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        /* 白色模式系统状态优化 */
        body.light .stat-box {
            background: rgba(255, 255, 255, 0.7);
            border: 1px solid rgba(37, 99, 235, 0.2);
        }
        body.light .stat-box:hover {
            background: rgba(255, 255, 255, 0.9);
            border-color: var(--glass-blue);
        }
        body.light .stat-value {
            color: #1e40af;
            font-weight: 700;
        }
        body.light .stat-label {
            color: #1e293b;
            font-weight: 600;
        }

        /* 黑色模式系统状态优化 */
        body:not(.light) .stat-value {
            color: var(--glass-cyan);
            font-weight: 700;
            text-shadow: 0 0 10px rgba(67, 233, 229, 0.3);
        }
        body:not(.light) .stat-label {
            color: #cbd5e1;
            font-weight: 600;
        }

        /* 白色模式日志优化 */
        body.light .log-entry {
            background: rgba(255, 255, 255, 0.9);
            border-color: rgba(37, 99, 235, 0.2);
        }
        body.light .log-entry:hover {
            background: rgba(255, 255, 255, 1);
            border-color: var(--glass-blue);
        }
        body.light .log-time {
            color: #1e40af;
            font-weight: 600;
        }
        body.light .log-ip {
            color: #0891b2;
            font-weight: 600;
        }
        body.light .log-loc {
            color: #059669;
            font-weight: 500;
        }
        body.light .log-box {
            background: rgba(255, 255, 255, 0.95);
            border-color: rgba(37, 99, 235, 0.2);
            color: #0f172a;
        }

        /* 黑色模式日志优化 */
        body:not(.light) .log-time {
            color: var(--glass-cyan);
            font-weight: 600;
        }
        body:not(.light) .log-ip {
            color: var(--glass-blue);
            font-weight: 600;
        }
        body:not(.light) .log-loc {
            color: var(--glass-green);
            font-weight: 500;
        }

        /* 深色星空背景 */
        body {
            background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
            color: var(--text);
            font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }

        /* 白色模式天空背景 */
        body.light {
            background: linear-gradient(to bottom, #87CEEB 0%, #B0E0E6 30%, #E0F7FA 60%, #F0F9FF 100%);
        }

        /* 星星背景 */
        .stars {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
            overflow: hidden;
        }
        .star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            animation: twinkle 3s infinite;
            box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
        }
        @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.5); }
        }

        /* 流星雨特效 - 全屏真实效果 */
        .meteor {
            position: absolute;
            width: 3px;
            height: 150px;
            background: linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.5), transparent);
            border-radius: 50%;
            animation: meteor-fall linear infinite;
            opacity: 0;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
        }
        @keyframes meteor-fall {
            0% {
                opacity: 1;
                transform: translateX(0) translateY(0) rotate(-45deg);
            }
            70% {
                opacity: 0.8;
            }
            100% {
                opacity: 0;
                transform: translateX(-500px) translateY(500px) rotate(-45deg);
            }
        }
        /* 更多流星，覆盖全屏 */
        .meteor:nth-child(1) { top: 5%; left: 10%; animation-duration: 1.8s; animation-delay: 0s; }
        .meteor:nth-child(2) { top: 15%; left: 30%; animation-duration: 2.2s; animation-delay: 0.8s; }
        .meteor:nth-child(3) { top: 8%; left: 50%; animation-duration: 2.5s; animation-delay: 1.5s; }
        .meteor:nth-child(4) { top: 20%; left: 70%; animation-duration: 2s; animation-delay: 2.2s; }
        .meteor:nth-child(5) { top: 12%; left: 85%; animation-duration: 2.3s; animation-delay: 3s; }
        .meteor:nth-child(6) { top: 25%; left: 20%; animation-duration: 2.1s; animation-delay: 3.8s; }
        .meteor:nth-child(7) { top: 18%; left: 45%; animation-duration: 2.4s; animation-delay: 4.5s; }
        .meteor:nth-child(8) { top: 10%; left: 65%; animation-duration: 1.9s; animation-delay: 5.2s; }
        .meteor:nth-child(9) { top: 22%; left: 80%; animation-duration: 2.6s; animation-delay: 6s; }
        .meteor:nth-child(10) { top: 7%; left: 35%; animation-duration: 2.2s; animation-delay: 6.8s; }

        /* 白色模式 - 流星变为白云效果 */
        body.light .meteor {
            background: linear-gradient(to bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6), transparent);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            width: 80px;
            height: 30px;
            animation-duration: 8s !important;
        }
        /* 白色模式 - 星星变为阳光闪烁 */
        body.light .star {
            background: rgba(255, 215, 0, 0.7);
            box-shadow: 0 0 8px rgba(255, 215, 0, 0.9);
        }

        /* 玻璃碎裂动态背景 */
        .glass-shards-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            z-index: 1;
            pointer-events: none;
        }
        .shard {
            position: absolute;
            background: linear-gradient(135deg, rgba(79, 172, 254, 0.08), rgba(157, 127, 245, 0.05));
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            animation: shardFloat 25s infinite ease-in-out;
        }
        .shard:nth-child(1) { width: 180px; height: 180px; top: 5%; left: 10%; clip-path: polygon(30% 0%, 70% 10%, 100% 40%, 90% 80%, 50% 100%, 10% 90%, 0% 50%); animation-delay: 0s; }
        .shard:nth-child(2) { width: 140px; height: 200px; top: 50%; left: 5%; clip-path: polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%); animation-delay: -8s; }
        .shard:nth-child(3) { width: 220px; height: 160px; top: 10%; right: 8%; clip-path: polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%); animation-delay: -15s; }
        .shard:nth-child(4) { width: 150px; height: 150px; bottom: 10%; right: 15%; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); animation-delay: -20s; }
        .shard:nth-child(5) { width: 190px; height: 130px; top: 40%; left: 3%; clip-path: polygon(40% 0%, 100% 20%, 90% 70%, 30% 100%, 0% 60%); animation-delay: -10s; }
        .shard:nth-child(6) { width: 130px; height: 180px; bottom: 15%; left: 45%; clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%); animation-delay: -18s; }
        .shard:nth-child(7) { width: 170px; height: 140px; top: 70%; right: 25%; clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); animation-delay: -5s; }
        @keyframes shardFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
            25% { transform: translateY(-25px) rotate(3deg); opacity: 0.6; }
            50% { transform: translateY(-40px) rotate(-2deg); opacity: 0.5; }
            75% { transform: translateY(-20px) rotate(4deg); opacity: 0.7; }
        }

        /* 主容器 - 侧边栏布局 */
        .container {
            position: relative;
            z-index: 2;
            min-height: 100vh;
            display: flex;
            gap: 20px;
            /* 👇 增加顶部Padding，并设置最大宽度用于超大屏适配 */
            padding: 100px 20px 20px 20px;
            max-width: 1920px;
            margin: 0 auto;
        }

        /* 左侧边栏 - 玻璃态 */
        .sidebar {
            width: 280px;
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 25px 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            height: fit-content;
            position: sticky;
            /* 👇 修改Sticky偏移量，使其与主内容对齐 */
            top: 100px;
            flex-shrink: 0;
        }

        /* 顶部工具栏（右上角固定，带边框容器） */
        .top-nav {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 100;
            display: flex;
            gap: 8px;
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        /* 工具按钮组（右上角固定） */
        .top-tools {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .tool-btn {
            width: 42px;
            height: 42px;
            background: rgba(79, 172, 254, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: var(--text);
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            position: relative;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            flex-shrink: 0;
        }
        .tool-btn:hover {
            background: rgba(79, 172, 254, 0.25);
            border-color: var(--glass-blue);
            box-shadow: 0 4px 15px var(--glow);
            transform: translateY(-2px);
        }
        .tool-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        /* 👇 修改：退出按钮默认样式一致，悬浮变红 */
        .tool-btn.logout {
            border-color: rgba(248, 113, 113, 0.5); 
            color: #f87171; 
        }
        .tool-btn.logout:hover {
            background: rgba(248, 113, 113, 0.2);
            border-color: var(--danger);
            box-shadow: 0 4px 15px var(--danger);
            color: white;
        }

        /* 侧边栏Logo */
        .logo {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--border);
        }
        .logo-icon {
            font-size: 3rem;
            filter: drop-shadow(0 0 15px var(--glass-blue));
            animation: logoFloat 3s ease-in-out infinite;
        }
        @keyframes logoFloat {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(5deg); }
        }
        .logo-text {
            /* 👇 增大字号 */
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--glass-blue), var(--glass-purple), var(--glass-cyan), var(--glass-pink));
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: 2px;
            text-align: center;
            animation: logoGradient 4s ease infinite;
            /* 👇 优化滤镜，去除模糊，改为清晰阴影 */
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }
        @keyframes logoGradient {
            0% {
                background-position: 0% 50%;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            }
            25% {
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            }
            50% {
                background-position: 100% 50%;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            }
            75% {
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            }
            100% {
                background-position: 0% 50%;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
            }
        }
        
        /* 👇 针对白色模式的Logo优化：恢复动态渐变，使用深色变量，增加微阴影 */
        body.light .logo-text {
            background: linear-gradient(135deg, var(--glass-blue), var(--glass-purple), var(--glass-cyan), var(--glass-pink));
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: logoGradient 4s ease infinite;
            filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.2)); /* 轻微阴影增加对比度，去除模糊光晕 */
            text-shadow: none;
        }
        body.light .logo-icon {
            filter: drop-shadow(0 0 10px rgba(37, 99, 235, 0.6));
        }

        .logo-sub {
            /* 👇 稍微增大副标题 */
            font-size: 0.85rem;
            color: var(--text-dim);
            letter-spacing: 1px;
            text-align: center;
            font-weight: 500;
        }
        /* 白色模式Logo优化 */
        body.light .logo-sub {
            color: #64748b;
        }

        /* 导航菜单 - 垂直列表 */
        .nav-menu {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .nav-item {
            /* 👇 增大Padding和字号 */
            padding: 14px 20px;
            background: rgba(79, 172, 254, 0.05);
            border: 1px solid transparent;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 15px; /* 增加图标和文字间距 */
            color: var(--text);
            position: relative;
            overflow: hidden;
        }
        /* 菜单文字幻彩渐变 */
        .nav-item {
            background: linear-gradient(135deg, var(--glass-blue), var(--glass-purple), var(--glass-cyan), var(--glass-pink));
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: menuTextGradient 5s ease infinite;
        }
        @keyframes menuTextGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        /* 白色模式菜单文字优化 - 纯色深色文字 */
        body.light .nav-item {
            background: none;
            -webkit-background-clip: unset;
            -webkit-text-fill-color: unset;
            background-clip: unset;
            color: #1e293b;
            font-weight: 700;
            animation: none;
        }
        body.light .nav-item:hover {
            color: #0f172a;
        }
        body.light .nav-item.active {
            color: #ffffff;
            background: linear-gradient(135deg, #2563eb, #7c3aed);
        }
        body.light .nav-item.active .icon,
        body.light .nav-item.active {
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            -webkit-background-clip: unset;
            -webkit-text-fill-color: unset;
            background-clip: unset;
            color: #ffffff;
            animation: none;
        }
        /* 恢复背景 */
        .nav-item::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(79, 172, 254, 0.05);
            border-radius: 12px;
            z-index: -1;
        }
        body.light .nav-item::after {
            background: rgba(37, 99, 235, 0.08);
        }
        /* 波纹点击效果 */
        .nav-item::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }
        .nav-item:active::before {
            width: 300px;
            height: 300px;
        }
        .nav-item:hover {
            background: rgba(79, 172, 254, 0.15);
            border-color: var(--glass-blue);
            transform: translateX(5px);
            box-shadow: 0 4px 15px var(--glow);
        }
        .nav-item.active {
            background: linear-gradient(135deg, var(--glass-blue), var(--glass-purple));
            border-color: var(--glass-blue);
            color: white;
            box-shadow: 0 4px 20px var(--glow);
            transform: translateX(5px);
            animation: gradientShift 3s ease infinite;
            background-size: 200% 200%;
        }
        /* 激活菜单文字幻彩渐变 */
        .nav-item.active .icon,
        .nav-item.active {
            background: linear-gradient(135deg, #fff, #e0f2fe, #ddd6fe, #fce7f3, #fff);
            background-size: 300% 300%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: textGradientShift 4s ease infinite;
        }
        /* 文字渐变动画 */
        @keyframes textGradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        /* 幻彩渐变动画 */
        @keyframes gradientShift {
            0% {
                background-position: 0% 50%;
                background: linear-gradient(135deg, var(--glass-blue), var(--glass-purple), var(--glass-cyan));
            }
            33% {
                background-position: 50% 50%;
                background: linear-gradient(135deg, var(--glass-purple), var(--glass-cyan), var(--glass-pink));
            }
            66% {
                background-position: 100% 50%;
                background: linear-gradient(135deg, var(--glass-cyan), var(--glass-pink), var(--glass-blue));
            }
            100% {
                background-position: 0% 50%;
                background: linear-gradient(135deg, var(--glass-blue), var(--glass-purple), var(--glass-cyan));
            }
        }
        .nav-item.active::after {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, var(--glass-cyan), var(--glass-blue), var(--glass-purple), var(--glass-pink), var(--glass-cyan));
            border-radius: 12px;
            z-index: -1;
            opacity: 0.5;
            filter: blur(8px);
            animation: borderGlow 3s linear infinite;
            background-size: 300% 300%;
        }
        @keyframes borderGlow {
            0% { opacity: 0.3; background-position: 0% 50%; }
            50% { opacity: 0.6; background-position: 100% 50%; }
            100% { opacity: 0.3; background-position: 0% 50%; }
        }
        
        /* 👇 修复暗色模式图标显示为方块的问题 */
        .nav-item .icon {
            /* 👇 增大图标 */
            font-size: 1.4rem;
            width: 24px;
            text-align: center;
            /* 关键修复：重置背景裁剪和填充颜色 */
            background: none;
            -webkit-background-clip: initial;
            -webkit-text-fill-color: initial;
            color: #e8eaf6; /* 设置为淡白色 */
            text-shadow: 0 0 10px var(--glass-blue); /* 添加发光使其协调 */
        }
        
        /* 激活状态下的图标颜色 */
        .nav-item.active .icon {
            background: none;
            -webkit-text-fill-color: initial;
            color: #ffffff;
        }

        /* 白色模式下的图标保持原样(代码里已经有针对body.light的处理，只需微调确保优先级) */
        body.light .nav-item .icon {
            color: #2563eb;
            text-shadow: none;
        }

        /* 主内容区 */
        .main-content {
            flex: 1;
            display: block;
            width: 100%;
            min-width: 0;
            /* 👇 移除了 padding-top，由容器统一控制 */
        }

        /* 工具按钮提示 */
        .tool-btn::before {
            content: attr(data-tooltip);
            position: absolute;
            bottom: -40px;
            left: 50%;
            transform: translateX(-50%);
            padding: 6px 12px;
            background: rgba(0, 0, 0, 0.9);
            color: var(--glass-cyan);
            font-size: 11px;
            white-space: nowrap;
            pointer-events: none;
            opacity: 0;
            visibility: hidden;
            transition: 0.2s;
            z-index: 10;
            border: 1px solid var(--glass-cyan);
            border-radius: 6px;
        }
        .tool-btn:hover::before { opacity: 1; visibility: visible; }
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            position: absolute;
            top: 8px;
            right: 8px;
            animation: statusPulse 1.5s ease-in-out infinite;
        }
        @keyframes statusPulse {
            0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 5px currentColor; }
            50% { opacity: 0.5; transform: scale(1.3); box-shadow: 0 0 15px currentColor; }
        }
        .status-dot.on {
            background-color: var(--success);
            box-shadow: 0 0 10px var(--success);
        }
        .status-dot.off {
            background-color: var(--danger);
            box-shadow: 0 0 10px var(--danger);
        }

        /* 主内容区 - 网格布局 */
        .main-content {
            display: block;
            width: 100%;
        }

        /* 3D 球体统计卡片 */
        .sphere-card {
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px;
            position: relative;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: all 0.3s;
            overflow: hidden;
        }
        .sphere-card:hover {
            border-color: var(--glass-blue);
            box-shadow: 0 12px 40px var(--glow);
            transform: translateY(-5px);
        }
        .sphere-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, var(--glass-blue), var(--glass-purple), var(--glass-cyan));
            opacity: 0.6;
        }

        /* 3D 圆环统计球体 - 优化版 */
        .stats-sphere {
            width: 240px;
            height: 240px;
            margin: 25px auto 15px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .sphere-ring {
            position: absolute;
            border-radius: 50%;
            border: 3px solid transparent;
            animation: sphereRotate 8s linear infinite;
            will-change: transform;
        }
        .sphere-ring:nth-child(1) {
            width: 220px;
            height: 220px;
            border-top-color: var(--glass-blue);
            border-right-color: var(--glass-blue);
            animation-duration: 6s;
        }
        .sphere-ring:nth-child(2) {
            width: 185px;
            height: 185px;
            border-bottom-color: var(--glass-purple);
            border-left-color: var(--glass-purple);
            animation-duration: 8s;
            animation-direction: reverse;
        }
        .sphere-ring:nth-child(3) {
            width: 150px;
            height: 150px;
            border-top-color: var(--glass-cyan);
            border-bottom-color: var(--glass-cyan);
            animation-duration: 10s;
        }
        @keyframes sphereRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* 球体中心 - 修正版：绝对居中，增加Padding防止触碰圆环 */
        .sphere-center {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 18%; /* 动态Padding，确保文字永远在圆环内 */
            pointer-events: none;
            box-sizing: border-box;
        }

        /* 球体数字 - 修正版：智能换行，动态字号 */
        .sphere-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--glass-cyan);
            text-shadow: 0 0 20px rgba(67, 233, 229, 0.5);
            font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
            line-height: 1.1; /* 紧凑行高，适应多行显示 */
            word-wrap: break-word; /* 允许单词内换行 */
            word-break: break-word; /* 强制长单词/数字断行，防止溢出 */
            overflow-wrap: break-word; /* 现代浏览器断行支持 */
            white-space: normal; /* 允许自然换行 */
            display: block;
            width: 100%;
            max-width: 100%;
            text-align: center;
            margin: 0 auto;
        }

        /* 根据内容长度自动缩小字体 - 针对桌面端微调 */
        .sphere-value[data-length="short"] { font-size: 3rem; }
        .sphere-value[data-length="medium"] { font-size: 2.2rem; }
        .sphere-value[data-length="long"] { font-size: 1.6rem; }
        .sphere-value[data-length="verylong"] { font-size: 1.2rem; }

        /* 球体下方标签 */
        .sphere-labels {
            text-align: center;
            margin-top: 10px;
        }
        .sphere-label {
            font-size: 1rem;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 2px;
            line-height: 1.5;
            font-weight: 600;
            display: block;
            margin-bottom: 5px;
        }
        .sphere-subtitle {
            font-size: 0.85rem;
            color: var(--glass-cyan);
            line-height: 1.4;
            opacity: 0.95;
            display: block;
        }

        /* 玻璃态卡片样式 */
        .card {
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 25px;
            position: relative;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            transition: all 0.3s;
            overflow: hidden;
        }
        .card:hover {
            border-color: var(--glass-blue);
            box-shadow: 0 12px 40px var(--glow);
            transform: translateY(-3px);
        }
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, var(--glass-blue), var(--glass-purple), var(--glass-cyan));
            opacity: 0.6;
        }

        /* 卡片标题 */
        .card-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            text-shadow: 0 2px 8px rgba(79, 172, 254, 0.5);
        }
        .card-title .icon {
            font-size: 1.3rem;
            filter: drop-shadow(0 0 10px var(--glass-cyan));
        }

        /* 白色模式标题 */
        body.light .card-title {
            color: #000000;
            text-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        /* 统计面板 */
        .stats-panel {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-box {
            background: rgba(79, 172, 254, 0.05);
            border: 1px solid var(--border);
            border-radius: 15px;
            padding: 20px;
            transition: all 0.3s;
            text-align: center;
        }
        .stat-box:hover {
            background: rgba(79, 172, 254, 0.1);
            border-color: var(--glass-blue);
            transform: translateY(-3px);
            box-shadow: 0 5px 20px var(--glow);
        }
        .stat-label {
            font-size: 0.8rem;
            color: var(--text-dim);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .stat-value {
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--glass-cyan), var(--glass-blue));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: 'Courier New', monospace;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
            display: block;
        }
        .stat-value.ip-value {
            font-size: clamp(0.75rem, 2vw, 1rem);
            word-break: break-all;
            white-space: normal;
            line-height: 1.3;
            max-height: 2.6em;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
        }

        /* 输入框样式 */
        .input-block { margin-bottom: 15px; }
        label {
            display: block;
            font-size: 0.75rem;
            color: var(--glass-cyan);
            margin-bottom: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        input[type="text"], textarea {
            width: 100%;
            background: rgba(15, 20, 40, 0.6);
            border: 1px solid var(--border);
            border-radius: 12px;
            color: var(--text);
            padding: 12px 15px;
            font-family: 'Courier New', monospace;
            outline: none;
            transition: all 0.3s;
            font-size: 0.9rem;
        }
        input[type="text"]:focus, textarea:focus {
            border-color: var(--glass-blue);
            background: rgba(15, 20, 40, 0.9);
            box-shadow: 0 0 20px var(--glow);
        }
        textarea {
            min-height: 100px;
            resize: vertical;
            font-size: 0.85rem;
            line-height: 1.5;
        }
        .input-group-row {
            display: flex;
            gap: 10px;
            align-items: flex-end;
        }
        .input-group-row input { flex: 1; }

        /* 按钮样式 */
        .btn {
            padding: 12px 20px;
            border: 1px solid;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
            position: relative;
            overflow: hidden;
        }
        .btn::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255, 255, 255, 0.2);
            transform: translate(-50%, -50%);
            transition: width 0.4s, height 0.4s;
            border-radius: 50%;
        }
        .btn:hover::before {
            width: 300px;
            height: 300px;
        }
        .btn-primary {
            background: linear-gradient(135deg, var(--glass-blue), var(--glass-purple));
            border-color: var(--glass-blue);
            color: white;
        }
        .btn-primary:hover {
            box-shadow: 0 0 25px var(--glow);
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: linear-gradient(135deg, var(--glass-cyan), var(--glass-blue));
            border-color: var(--glass-cyan);
            color: white;
        }
        .btn-secondary:hover {
            box-shadow: 0 0 25px rgba(67, 233, 229, 0.5);
            transform: translateY(-2px);
        }
        .btn-success {
            background: linear-gradient(135deg, var(--glass-green), #22c55e);
            border-color: var(--success);
            color: white;
        }
        .btn-success:hover {
            box-shadow: 0 0 25px var(--success);
            transform: translateY(-2px);
        }
        .btn-danger {
            background: linear-gradient(135deg, var(--danger), #dc2626);
            border-color: var(--danger);
            color: white;
        }
        .btn-danger:hover {
            box-shadow: 0 0 25px var(--danger);
            transform: translateY(-2px);
        }
        .btn-group {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        .btn-group .btn {
            flex: 1;
            min-width: 120px;
        }

        /* 日志和表格 */
        .log-box {
            font-family: 'Courier New', monospace;
            font-size: 0.8rem;
            max-height: 300px;
            overflow-y: auto;
            background: rgba(15, 20, 40, 0.6);
            padding: 15px;
            border: 1px solid var(--border);
            border-radius: 12px;
        }
        .log-entry {
            border-bottom: 1px solid rgba(79, 172, 254, 0.2);
            padding: 10px 0;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: 0.3s;
        }
        .log-entry:hover {
            background: rgba(79, 172, 254, 0.1);
            padding-left: 10px;
            border-left: 2px solid var(--glass-cyan);
        }
        .log-time { color: var(--glass-cyan); width: 150px; font-size: 0.85rem; }
        .log-ip { color: var(--text); width: 200px; font-family: monospace; }
        .log-loc { color: var(--text-dim); flex: 1; font-size: 0.85rem; }
        .log-tag {
            padding: 4px 10px;
            background: linear-gradient(135deg, var(--warning), #d97706);
            color: #000;
            font-size: 0.75rem;
            font-weight: 700;
            border-radius: 6px;
            box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
        }
        .log-tag.green {
            background: linear-gradient(135deg, var(--success), #22c55e);
            box-shadow: 0 0 10px var(--success);
        }

        .wl-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 10px; }
        .wl-table th, .wl-table td {
            text-align: left;
            padding: 12px;
            border-bottom: 1px solid var(--border);
        }
        .wl-table th {
            color: var(--glass-cyan);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.75rem;
        }
        .wl-table tr:hover { background: rgba(79, 172, 254, 0.05); }
        .btn-del {
            background: linear-gradient(135deg, var(--danger), #dc2626);
            color: white;
            border: 1px solid var(--danger);
            border-radius: 8px;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 0.75rem;
            transition: 0.3s;
            box-shadow: 0 0 10px rgba(248, 113, 113, 0.3);
            text-transform: uppercase;
            font-weight: 600;
        }
        .btn-del:hover {
            box-shadow: 0 0 20px var(--danger);
            transform: scale(1.05);
        }
        .sys-tag {
            background: linear-gradient(135deg, #64748b, #475569);
            color: white;
            padding: 4px 8px;
            font-size: 0.75rem;
            border-radius: 6px;
            box-shadow: 0 0 8px rgba(100, 116, 139, 0.3);
        }
        .source-tag { font-size: 0.75rem; margin-top: 4px; display: block; }
        .source-tag.sys { color: var(--warning); text-shadow: 0 0 8px var(--warning); }
        .source-tag.man { color: var(--success); text-shadow: 0 0 8px var(--success); }

        /* 模态框 */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        .modal.show { display: flex; }
        .modal-content {
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            padding: 30px;
            width: 90%;
            max-width: 500px;
            border: 2px solid var(--border);
            border-radius: 20px;
            box-shadow: 0 10px 50px var(--glow);
            position: relative;
            overflow: hidden; /* Added overflow: hidden to clip the top line */
        }
        .modal-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, var(--glass-blue), var(--glass-cyan));
            box-shadow: 0 0 15px var(--glass-blue);
        }
        .modal-head {
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            font-weight: 700;
            font-size: 1.2rem;
            align-items: center;
            background: linear-gradient(135deg, var(--glass-cyan), var(--glass-blue));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .modal-head span { display: flex; align-items: center; gap: 10px; }
        .close-btn {
            cursor: pointer;
            color: var(--text);
            font-size: 1.5rem;
            transition: 0.3s;
            width: 35px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border);
            border-radius: 8px;
        }
        .close-btn:hover {
            color: var(--danger);
            border-color: var(--danger);
            box-shadow: 0 0 15px var(--danger);
            transform: rotate(90deg);
        }
        .modal-btns { display: flex; gap: 10px; margin-top: 25px; flex-wrap: wrap; }
        .modal-btns button { flex: 1; min-width: 100px; }

        /* Toast提示 */
        #toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, var(--success), #22c55e);
            color: white;
            padding: 12px 30px;
            border-radius: 12px;
            opacity: 0;
            transition: 0.3s;
            pointer-events: none;
            font-weight: 700;
            box-shadow: 0 0 25px var(--success);
            border: 2px solid var(--success);
            z-index: 2000;
        }

        /* 响应式 - 全平台优化 */

        /* 平板及以下 - 侧边栏变为顶部栏 */
        @media (max-width: 1024px) {
            .container {
                flex-direction: column;
                padding: 10px;
                /* 👇 移动端无需超大顶部间距，已由布局自动处理 */
                padding-top: 80px;
            }
            .sidebar {
                width: 100%;
                position: relative;
                top: 0;
                padding: 20px;
            }
            .logo {
                flex-direction: row;
                justify-content: center;
                padding-bottom: 15px;
                margin-bottom: 15px;
            }
            .logo-icon { font-size: 2rem; }
            .logo-text { font-size: 1rem; }
            .nav-menu {
                flex-direction: row;
                flex-wrap: wrap;
                justify-content: center;
            }
            .nav-item {
                flex: 1;
                min-width: 120px;
                justify-content: center;
                padding: 10px;
                font-size: 0.85rem;
            }
            .top-nav {
                top: 10px;
                right: 10px;
                gap: 6px;
                padding: 6px;
            }
            .tool-btn {
                width: 38px;
                height: 38px;
                font-size: 1rem;
            }
            .content-section.active {
                grid-template-columns: 1fr;
            }
            .stats-panel { grid-template-columns: repeat(2, 1fr); }
            .stats-sphere { width: 220px; height: 220px; }
            .sphere-ring:nth-child(1) { width: 200px; height: 200px; }
            .sphere-ring:nth-child(2) { width: 165px; height: 165px; }
            .sphere-ring:nth-child(3) { width: 130px; height: 130px; }
        }

        /* 手机端 */
        @media (max-width: 768px) {
            .container { padding: 8px; padding-top: 65px; }
            .sidebar { padding: 15px; }
            .nav-menu { flex-direction: column; }
            .nav-item {
                width: 100%;
                min-width: auto;
            }
            .top-nav {
                top: 8px;
                right: 8px;
                gap: 5px;
                padding: 5px;
                border-radius: 12px;
            }
            .tool-btn {
                width: 36px;
                height: 36px;
                font-size: 0.95rem;
                border-radius: 10px;
            }
            .tool-btn::before {
                display: none;
            }
            .stats-panel { grid-template-columns: 1fr; }
            .stats-sphere { width: 180px; height: 180px; margin: 20px auto 10px; }
            .sphere-ring:nth-child(1) { width: 165px; height: 165px; border-width: 2.5px; }
            .sphere-ring:nth-child(2) { width: 135px; height: 135px; border-width: 2.5px; }
            .sphere-ring:nth-child(3) { width: 105px; height: 105px; border-width: 2.5px; }
            
            /* 手机端字号进一步缩小，防止溢出 */
            .sphere-value[data-length="short"] { font-size: 2.5rem; }
            .sphere-value[data-length="medium"] { font-size: 1.8rem; }
            .sphere-value[data-length="long"] { font-size: 1.4rem; }
            .sphere-value[data-length="verylong"] { font-size: 0.9rem; } /* 缩小到0.9rem，确保超长文本能容纳 */

            .sphere-label { font-size: 0.85rem; }
            .sphere-subtitle { font-size: 0.75rem; }
            .input-group-row { flex-direction: column; }
            .btn-group { flex-direction: column; }
            .log-entry { flex-direction: column; align-items: flex-start; gap: 5px; }
            .log-time, .log-ip, .log-loc { width: 100%; }
            /* Mobile adjustments */
            .main-content {
                padding-top: 0; /* Reset for mobile since container handles it */
            }
        }

        /* 小屏手机 */
        @media (max-width: 480px) {
            .container { padding-top: 60px; }
            .top-nav {
                top: 6px;
                right: 6px;
                gap: 4px;
                padding: 4px;
            }
            .tool-btn {
                width: 34px;
                height: 34px;
                font-size: 0.9rem;
            }
            .stats-sphere { width: 160px; height: 160px; }
            .sphere-ring:nth-child(1) { width: 148px; height: 148px; border-width: 2px; }
            .sphere-ring:nth-child(2) { width: 122px; height: 122px; border-width: 2px; }
            .sphere-ring:nth-child(3) { width: 96px; height: 96px; border-width: 2px; }
            
            /* 超小屏字体调整 */
            .sphere-value[data-length="short"] { font-size: 2rem; }
            .sphere-value[data-length="medium"] { font-size: 1.5rem; }
            .sphere-value[data-length="long"] { font-size: 1.2rem; }
            .sphere-value[data-length="verylong"] { font-size: 0.8rem; } /* 极限压缩 */

            .sphere-label { font-size: 0.75rem; letter-spacing: 1px; }
            .sphere-subtitle { font-size: 0.68rem; }
        }

        /* 超小屏 */
        @media (max-width: 360px) {
            .top-nav {
                top: 5px;
                right: 5px;
                gap: 3px;
                padding: 3px;
            }
            .tool-btn {
                width: 32px;
                height: 32px;
                font-size: 0.85rem;
            }
        }

        /* 内容区显示控制 */
        .content-section {
            display: none;
            opacity: 0;
            animation: fadeOut 0.3s ease-out;
        }
        .content-section.active {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            opacity: 1;
            animation: fadeIn 0.5s ease-out;
        }

        /* 淡入淡出动画 */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-10px);
            }
        }

        /* 单列布局的面板 */
        #section-subscription.active,
        #section-whitelist.active,
        #section-nodes.active,
        #section-logs.active {
            display: block;
            opacity: 1;
            animation: fadeIn 0.5s ease-out;
        }

        #section-subscription .card,
        #section-whitelist .card,
        #section-nodes .card,
        #section-logs .card {
            margin-bottom: 20px;
            animation: slideInUp 0.6s ease-out;
        }

        /* 卡片滑入动画 */
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* ==================== 网络信息模块样式 ==================== */
        .network-cards-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 15px;
        }
        @media (max-width: 768px) {
            .network-cards-grid { grid-template-columns: 1fr; }
        }
        .network-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 15px;
            transition: all 0.3s ease;
        }
        .network-card:hover {
            transform: translateY(-3px);
            border-color: var(--glass-blue);
            box-shadow: 0 8px 25px rgba(79, 172, 254, 0.2);
        }
        .network-card-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--text);
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .network-info-content { display: flex; flex-direction: column; }
        .ip-text {
            color: var(--glass-cyan);
            font-weight: 700;
            font-family: 'Courier New', monospace;
            font-size: 0.95rem;
            word-break: break-all;
        }
        .ip-text.error { color: var(--danger); }
        .location-text {
            font-size: 0.8rem;
            color: var(--text-dim);
            margin-top: 4px;
        }
        .network-tip {
            margin-top: 8px;
            font-size: 0.7rem;
            color: var(--text-dim);
            opacity: 0.7;
        }
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            flex-shrink: 0;
        }
        .status-loading {
            background: #fbbf24;
            animation: pulse-loading 1.5s ease-in-out infinite;
        }
        .status-success { background: #10b981; }
        .status-error { background: #ef4444; }
        @keyframes pulse-loading {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        .network-info-tip {
            font-size: 0.75rem;
            color: var(--text-dim);
            margin-top: 10px;
        }
        .network-info-tip a {
            color: var(--glass-blue);
            text-decoration: none;
        }
        .network-info-tip a:hover { text-decoration: underline; }

        /* 延迟测试卡片 */
        .latency-cards-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
        }
        @media (max-width: 1200px) {
            .latency-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
            .latency-cards-grid { grid-template-columns: 1fr; }
        }
        .latency-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 12px 15px;
            min-height: 70px;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
        }
        .latency-card:hover {
            transform: translateY(-3px);
            border-color: var(--glass-blue);
            box-shadow: 0 8px 25px rgba(79, 172, 254, 0.2);
        }
        .latency-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            z-index: 2;
        }
        .latency-card-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .latency-card-icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--border);
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        .latency-card:hover .latency-card-icon {
            background: rgba(79, 172, 254, 0.2);
        }
        .latency-card-icon svg {
            width: 18px;
            height: 18px;
        }
        .latency-card-name {
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--text);
        }
        .latency-card-region {
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .latency-card-region.domestic { color: var(--glass-green); }
        .latency-card-region.international { color: var(--glass-blue); }
        .latency-status {
            font-family: 'Orbitron', 'Courier New', monospace;
            font-size: 1.3rem;
            font-weight: 800;
            font-style: italic;
            color: var(--glass-cyan);
        }
        .latency-status .unit {
            font-family: 'Segoe UI', sans-serif;
            font-size: 0.7rem;
            font-weight: 600;
            font-style: normal;
            opacity: 0.7;
            margin-left: 2px;
        }
        /* 延迟颜色 */
        .latency-green { color: #4CAF50 !important; }
        .latency-yellow { color: #83DA00 !important; }
        .latency-orange { color: #f58722 !important; }
        .latency-red { color: #ff404a !important; }

        /* 深色图标适配 - GitHub/抖音/X.com */
        .latency-card-icon[data-site="github"] svg path,
        .latency-card-icon[data-site="字节抖音"] svg path,
        .latency-card-icon[data-site="x.com"] svg path {
            fill: #e8eaf6 !important;
        }
        body.light .latency-card-icon[data-site="github"] svg path,
        body.light .latency-card-icon[data-site="字节抖音"] svg path,
        body.light .latency-card-icon[data-site="x.com"] svg path {
            fill: #0f172a !important;
        }

        /* 白色模式网络信息优化 */
        body.light .network-card {
            background: rgba(255, 255, 255, 0.85);
            border-color: rgba(37, 99, 235, 0.2);
        }
        body.light .network-card:hover {
            background: rgba(255, 255, 255, 0.95);
            border-color: var(--glass-blue);
        }
        body.light .ip-text {
            color: #0891b2;
        }
        body.light .latency-card {
            background: rgba(255, 255, 255, 0.85);
            border-color: rgba(37, 99, 235, 0.2);
        }
        body.light .latency-card:hover {
            background: rgba(255, 255, 255, 0.95);
            border-color: var(--glass-blue);
        }
        body.light .latency-card-icon {
            background: rgba(37, 99, 235, 0.1);
        }
        body.light .latency-card:hover .latency-card-icon {
            background: rgba(37, 99, 235, 0.2);
        }
    </style>
</head>
<body id="mainBody">
    <!-- 玻璃碎裂背景 -->
    <div class="glass-shards-bg">
        <div class="shard"></div>
        <div class="shard"></div>
        <div class="shard"></div>
        <div class="shard"></div>
        <div class="shard"></div>
        <div class="shard"></div>
        <div class="shard"></div>
    </div>

    <!-- 星空背景 -->
    <div class="stars" id="starsContainer"></div>

    <!-- 流星雨 -->
    <div class="stars">
        <div class="meteor"></div>
        <div class="meteor"></div>
        <div class="meteor"></div>
        <div class="meteor"></div>
        <div class="meteor"></div>
        <div class="meteor"></div>
        <div class="meteor"></div>
        <div class="meteor"></div>
        <div class="meteor"></div>
        <div class="meteor"></div>
    </div>

    <div class="container">
        <!-- 左侧边栏 -->
        <div class="sidebar">
            <div class="logo">
                <div class="logo-icon">💎</div>
                <div>
                    <div class="logo-text">玻璃态控制台</div>
                    <div class="logo-sub">GLASS DASHBOARD</div>
                </div>
            </div>
            <div class="nav-menu">
                <div class="nav-item active" onclick="showSection('dashboard')">
                    <span class="icon">📊</span> 控制台
                </div>
                <div class="nav-item" onclick="showSection('network')">
                    <span class="icon">🌐</span> 网络信息
                </div>
                <div class="nav-item" onclick="showSection('subscription')">
                    <span class="icon">🚀</span> 订阅
                </div>
                <div class="nav-item" onclick="showSection('whitelist')">
                    <span class="icon">🛡️</span> 白名单
                </div>
                <div class="nav-item" onclick="showSection('nodes')">
                    <span class="icon">🛠️</span> 自定义节点
                </div>
                <div class="nav-item" onclick="showSection('logs')">
                    <span class="icon">📋</span> 日志
                </div>
            </div>
        </div>

        <!-- 右上角工具栏 -->
        <div class="top-nav">
            <button class="tool-btn" onclick="toggleTheme()" data-tooltip="切换主题">🌗</button>
            <button class="tool-btn" onclick="showModal('tgModal')" data-tooltip="TG通知">🤖 <span class="status-dot ${tgState ? 'on' : 'off'}"></span></button>
            <button class="tool-btn" onclick="showModal('cfModal')" data-tooltip="CF统计">☁️ <span class="status-dot ${cfState ? 'on' : 'off'}"></span></button>
            <button class="tool-btn logout" onclick="logout()" data-tooltip="退出">⏻</button>
        </div>

        <!-- 主内容区 -->
        <div class="main-content">
            <!-- 控制台面板 -->
            <div id="section-dashboard" class="content-section active">
                <!-- 3D 球体统计卡片 -->
                <div class="sphere-card">
                    <div class="stats-sphere">
                        <div class="sphere-ring"></div>
                        <div class="sphere-ring"></div>
                        <div class="sphere-ring"></div>
                        <div class="sphere-center">
                            <div class="sphere-value" id="reqCount" data-length="short">0</div>
                        </div>
                    </div>
                    <div class="sphere-labels">
                        <div class="sphere-label">今日请求</div>
                        <div class="sphere-subtitle">Cloudflare 统计</div>
                    </div>
                    <button class="btn btn-primary" style="width:100%;margin-top:20px" onclick="updateStats()">🔄 刷新统计</button>

                    <!-- 系统状态 - 移到按钮下方 -->
                    <div style="margin-top:25px;padding-top:20px;border-top:1px solid var(--border)">
                        <div class="card-title" style="margin-bottom:15px"><span class="icon">📊</span> 系统状态</div>
                        <div class="stats-panel">
                            <div class="stat-box">
                                <div class="stat-label">当前IP</div>
                                <div class="stat-value ip-value" id="currentIp">...</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-label">Google延迟</div>
                                <div class="stat-value" id="googleStatus">...</div>
                            </div>
                            <div class="stat-box">
                                <div class="stat-label">存储状态</div>
                                <div class="stat-value" id="kvStatus">...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 网络信息面板 -->
            <div id="section-network" class="content-section">
                <div class="card">
                    <div class="card-title"><span class="icon">🌐</span> IP 信息检测</div>
                    <div class="network-cards-grid">
                        <div class="network-card">
                            <div class="network-card-title">
                                <span class="status-indicator status-loading" id="status-ipip"></span>
                                <span id="ipip-title">国内测试</span>
                            </div>
                            <div class="network-info-content">
                                <span id="ipip-ip" class="ip-text">加载中...</span>
                                <div class="location-text"><span id="ipip-country"></span></div>
                                <div class="network-tip">· 您访问国内站点所使用的IP</div>
                            </div>
                        </div>
                        <div class="network-card">
                            <div class="network-card-title">
                                <span class="status-indicator status-loading" id="status-edgeone"></span>
                                国外测试
                            </div>
                            <div class="network-info-content">
                                <span id="edgeone-ip" class="ip-text">加载中...</span>
                                <div class="location-text"><span id="edgeone-country"></span></div>
                                <div class="network-tip">· 您访问国外站点所使用的IP</div>
                            </div>
                        </div>
                        <div class="network-card">
                            <div class="network-card-title">
                                <span class="status-indicator status-loading" id="status-cf"></span>
                                CloudFlare
                            </div>
                            <div class="network-info-content">
                                <span id="cf-ip" class="ip-text">加载中...</span>
                                <div class="location-text"><span id="cf-country"></span></div>
                                <div class="network-tip">· 您访问CFCDN站点的落地IP</div>
                            </div>
                        </div>
                        <div class="network-card">
                            <div class="network-card-title">
                                <span class="status-indicator status-loading" id="status-twitter"></span>
                                X.com
                            </div>
                            <div class="network-info-content">
                                <span id="twitter-ip" class="ip-text">加载中...</span>
                                <div class="location-text"><span id="twitter-country"></span></div>
                                <div class="network-tip">· 您访问Twitter所使用的IP</div>
                            </div>
                        </div>
                    </div>
                    <div class="network-info-tip">💡 <b>国内测试</b> 由分流规则决定，<b>国外测试</b> 由优选IP决定，<b>CF/X.com</b> 由ProxyIP决定</div>

                    <div class="card-title" style="margin-top:25px;padding-top:20px;border-top:1px solid var(--border)"><span class="icon">⚡</span> 延迟测试</div>
                    <div class="latency-cards-grid" id="latency-cards"></div>
                    <div class="network-info-tip">💡 更多测试项目，可前往 <a href="https://ip.skk.moe/" target="_blank" rel="noopener">ip.skk.moe</a> 自行测试</div>
                </div>
            </div>

            <!-- 订阅管理面板 -->
            <div id="section-subscription" class="content-section">
                <div class="card">
                    <div class="card-title"><span class="icon">🚀</span> 快速订阅</div>
                    <div class="input-group-row" style="margin-bottom:15px">
                        <input type="text" id="autoSub" value="${defaultSubLink}" readonly style="flex:1">
                        <button class="btn btn-secondary" onclick="copyId('autoSub')">复制</button>
                    </div>
                    <div class="input-block">
                        <label>订阅源地址 (Sub Domain)</label>
                        <input type="text" id="subDom" value="${subdomain}" oninput="updateLink()">
                    </div>
                    <div class="input-block">
                        <label>Worker 域名 (SNI/Host)</label>
                        <input type="text" id="hostDom" value="${host}" oninput="updateLink()">
                    </div>
                    <div class="input-block">
                        <label>ProxyIP (优选)</label>
                        <div class="input-group-row">
                            <input type="text" id="pIp" value="${proxyip}" oninput="updateLink()">
                            <!-- 👇 修改：传入 proxyCheckUrl -->
                            <button class="btn btn-primary" onclick="checkProxy()">检测</button>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-bottom:10px;font-size:0.85rem">
                        <input type="checkbox" id="clashMode" onchange="toggleClash()">
                        <label for="clashMode" style="margin:0;text-transform:none">启用 Clash 模式</label>
                    </div>
                    <div class="input-block">
                        <label>手动订阅链接</label>
                        <textarea id="finalLink">${longLink}</textarea>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-success" onclick="copyId('finalLink')">复制链接</button>
                        <button class="btn btn-primary" onclick="testSub()">测试访问</button>
                    </div>
                </div>
            </div>

            <!-- 白名单面板 -->
            <div id="section-whitelist" class="content-section">
                <div class="card">
                    <div class="card-title"><span class="icon">🛡️</span> 白名单管理</div>
                    <div class="input-group-row" style="margin-bottom:15px">
                        <input type="text" id="newWhitelistIp" placeholder="输入 IP 地址 (IPv4/IPv6)">
                        <button class="btn btn-success" onclick="addWhitelist()">添加</button>
                        <button class="btn btn-secondary" onclick="loadWhitelist()">刷新</button>
                    </div>
                    <div style="max-height:300px;overflow-y:auto;border:1px solid var(--border)">
                        <table class="wl-table">
                            <thead><tr><th>IP 地址</th><th style="width:100px">操作</th></tr></thead>
                            <tbody id="whitelistBody"><tr><td colspan="2" style="text-align:center">加载中...</td></tr></tbody>
                        </table>
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-dim);margin-top:10px">💡 提示：系统内置 IP 需要修改代码或环境变量才能删除</div>
                </div>
            </div>

            <!-- 节点配置面板 -->
            <div id="section-nodes" class="content-section">
                <div class="card">
                    <div class="card-title"><span class="icon">🛠️</span> 优选IP与远程配置</div>
                    <div style="font-size:0.8rem;color:var(--danger);margin-bottom:15px;padding:10px;background:rgba(255,0,64,0.1);border-left:3px solid var(--danger)">
                        ⚠️ 注意：若要在此生效，请确保 Cloudflare 后台未设置对应环境变量 (ADD/ADDAPI/ADDCSV)
                    </div>
                    <div class="input-block">
                        <label>ADD - 本地优选 IP (格式: IP:Port#Name，一行一个)</label>
                        <textarea id="inpAdd" placeholder="1.1.1.1:443#US">${safeVal(add)}</textarea>
                    </div>
                    <div class="input-block">
                        <label>ADDAPI - 远程优选 TXT 链接 (支持多行)</label>
                        <textarea id="inpAddApi" placeholder="https://example.com/ips.txt">${safeVal(addApi)}</textarea>
                    </div>
                    <div class="input-block">
                        <label>ADDCSV - 远程优选 CSV 链接 (支持多行)</label>
                        <textarea id="inpAddCsv" placeholder="https://example.com/ips.csv">${safeVal(addCsv)}</textarea>
                    </div>
                    <!-- ⭐ 功能4: DLS 设置输入框 -->
                    <div class="input-block">
                        <label>DLS (ADDCSV专用) - 速度下限筛选 (单位: KB/s)</label>
                        <input type="text" id="inpDls" placeholder="5000" value="${safeVal(dls)}">
                    </div>
                    <button class="btn btn-success" style="width:100%" onclick="saveNodeConfig()">💾 保存配置</button>
                </div>
            </div>

            <!-- 日志面板 -->
            <div id="section-logs" class="content-section">
                <div class="card">
                    <div class="card-title">
                        <span><span class="icon">📋</span> 操作日志</span>
                    </div>
                    <div class="log-box" id="logBox">加载中...</div>
                    <button class="btn btn-secondary" style="width:100%;margin-top:15px" onclick="loadLogs()">🔄 刷新日志</button>
                </div>
            </div>
        </div>
    </div>

    <!-- TG配置模态框 -->
    <div id="tgModal" class="modal">
        <div class="modal-content">
            <div class="modal-head"><span>🤖 Telegram 通知配置</span><span class="close-btn" onclick="closeModal('tgModal')">×</span></div>
            <div class="input-block">
                <label>Bot Token</label>
                <input type="text" id="tgToken" placeholder="123456:ABC-DEF..." value="${safeVal(tgToken)}">
                ${getStatusLabel(tgToken, sysParams.tgToken)}
            </div>
            <div class="input-block">
                <label>Chat ID</label>
                <input type="text" id="tgId" placeholder="123456789" value="${safeVal(tgId)}">
                ${getStatusLabel(tgId, sysParams.tgId)}
            </div>
            <div class="modal-btns">
                <button class="btn btn-secondary" onclick="validateApi('tg')">验证</button>
                <button class="btn btn-success" onclick="saveConfig({TG_BOT_TOKEN: val('tgToken'), TG_CHAT_ID: val('tgId')}, 'tgModal')">保存</button>
                <button class="btn btn-danger" onclick="clearConfig('tg')">清除</button>
            </div>
        </div>
    </div>

    <!-- CF配置模态框 -->
    <div id="cfModal" class="modal">
        <div class="modal-content">
            <div class="modal-head"><span>☁️ Cloudflare 统计配置</span><span class="close-btn" onclick="closeModal('cfModal')">×</span></div>
            <div style="margin-bottom:20px;padding-bottom:15px;border-bottom:1px solid var(--border)">
                <label>方案1: Account ID + API Token</label>
                <input type="text" id="cfAcc" placeholder="Account ID" style="margin-bottom:10px" value="${safeVal(cfId)}">
                ${getStatusLabel(cfId, sysParams.cfId)}
                <input type="text" id="cfTok" placeholder="API Token" value="${safeVal(cfToken)}">
                ${getStatusLabel(cfToken, sysParams.cfToken)}
            </div>
            <div class="input-block">
                <label>方案2: Email + Global Key</label>
                <input type="text" id="cfMail" placeholder="Email" style="margin-bottom:10px" value="${safeVal(cfMail)}">
                ${getStatusLabel(cfMail, sysParams.cfMail)}
                <input type="text" id="cfKey" placeholder="Global API Key" value="${safeVal(cfKey)}">
                ${getStatusLabel(cfKey, sysParams.cfKey)}
            </div>
            <div class="modal-btns">
                <button class="btn btn-secondary" onclick="validateApi('cf')">验证</button>
                <button class="btn btn-success" onclick="saveConfig({CF_ID:val('cfAcc'), CF_TOKEN:val('cfTok'), CF_EMAIL:val('cfMail'), CF_KEY:val('cfKey')}, 'cfModal')">保存</button>
                <button class="btn btn-danger" onclick="clearConfig('cf')">清除</button>
            </div>
        </div>
    </div>

    <div id="toast">已复制</div>

    <script>
        const UUID = "${uuid}"; const CONVERTER = "${converter}"; const CLIENT_IP = "${clientIP}"; const HAS_AUTH = ${hasAuth};

        // 页面加载
        window.addEventListener('DOMContentLoaded', () => {
            if (HAS_AUTH && !sessionStorage.getItem("is_active")) {
                document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
                window.location.reload();
            } else {
                document.body.classList.add('loaded');
                if(!document.getElementById('subDom').value) updateLink();
                generateStars();
            }
        });

        // 生成星星背景
        function generateStars() {
            const starsContainer = document.getElementById('starsContainer');
            const starCount = 300; // 增加到300颗星星，满屏效果
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.animationDelay = Math.random() * 3 + 's';
                star.style.animationDuration = (Math.random() * 2 + 2) + 's';
                // 随机大小
                const size = Math.random() * 2 + 1;
                star.style.width = size + 'px';
                star.style.height = size + 'px';
                starsContainer.appendChild(star);
            }
        }

        // 工具函数
        function val(id) { return document.getElementById(id).value; }
        function showModal(id) { document.getElementById(id).classList.add('show'); }
        function closeModal(id) { document.getElementById(id).classList.remove('show'); }

        // 动态调整球体数字大小，防止溢出
        function adjustSphereValue(element, text) {
            element.innerText = text;
            const len = text.length;
            if (len <= 5) {
                element.setAttribute('data-length', 'short');
            } else if (len <= 10) {
                element.setAttribute('data-length', 'medium');
            } else if (len <= 20) {
                element.setAttribute('data-length', 'long');
            } else {
                element.setAttribute('data-length', 'verylong');
            }
        }

        // 切换面板 - 修复为网格布局
        function showSection(section) {
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.getElementById('section-' + section).classList.add('active');
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            event.target.closest('.nav-item').classList.add('active');
        }

        // 更新统计
        async function updateStats() {
            try {
                const start = Date.now();
                await fetch('https://www.google.com/generate_204', {mode: 'no-cors'});
                document.getElementById('googleStatus').innerText = (Date.now() - start) + 'ms';
            } catch (e) { document.getElementById('googleStatus').innerText = 'Timeout'; }
            try {
                const res = await fetch('?flag=stats');
                const data = await res.json();
                const reqCountEl = document.getElementById('reqCount');
                adjustSphereValue(reqCountEl, data.req);
                document.getElementById('currentIp').innerText = data.ip;
                document.getElementById('kvStatus').innerText = data.hasKV ? 'D1/KV OK' : 'Missing';
            } catch (e) {
                const reqCountEl = document.getElementById('reqCount');
                adjustSphereValue(reqCountEl, 'N/A');
            }
        }

        // 加载日志
        async function loadLogs() {
            try {
                const res = await fetch('?flag=get_logs');
                const data = await res.json();
                let html = '';
                if (data.type === 'd1' && Array.isArray(data.logs)) {
                    html = data.logs.map(log => "<div class='log-entry'><span class='log-time'>" + log.time + "</span><span class='log-ip'>" + log.ip + "</span><span class='log-loc'>" + log.region + "</span><span class='log-tag " + (log.action.includes('订阅')||log.action.includes('检测')?'green':'') + "'>" + log.action + "</span></div>").join('');
                } else if (data.logs && typeof data.logs === 'string') {
                    html = data.logs.split('\\n').filter(x=>x).slice(0, 50).map(line => {
                        const p = line.split('|');
                        return "<div class='log-entry'><span class='log-time'>" + p[0] + "</span><span class='log-ip'>" + p[1] + "</span><span class='log-loc'>" + p[2] + "</span><span class='log-tag " + (p[3].includes('订阅')||p[3].includes('检测')?'green':'') + "'>" + p[3] + "</span></div>";
                    }).join('');
                }
                document.getElementById('logBox').innerHTML = html || '暂无日志';
            } catch(e) { document.getElementById('logBox').innerText = '加载失败或未绑定 DB/KV'; }
        }

        // 加载白名单
        async function loadWhitelist() {
            try {
                const res = await fetch('?flag=get_whitelist');
                const data = await res.json();
                const list = data.list || [];
                const html = list.length ? list.map(item => {
                    const actionHtml = item.type === 'system' ? '<span class="sys-tag">🔒 系统</span>' : "<button class='btn-del' onclick='delWhitelist(\\"" + item.ip + "\\")'>删除</button>";
                    return "<tr><td>" + item.ip + "</td><td>" + actionHtml + "</td></tr>";
                }).join('') : '<tr><td colspan="2" style="text-align:center">暂无白名单 IP</td></tr>';
                document.getElementById('whitelistBody').innerHTML = html;
            } catch(e) { document.getElementById('whitelistBody').innerHTML = '<tr><td colspan="2">加载失败</td></tr>'; }
        }

        async function addWhitelist() {
            const ip = document.getElementById('newWhitelistIp').value.trim();
            if(!ip) return;
            try {
                await fetch('?flag=add_whitelist', { method:'POST', body:JSON.stringify({ip}) });
                document.getElementById('newWhitelistIp').value = '';
                loadWhitelist();
            } catch(e) { alert('添加失败'); }
        }

        async function delWhitelist(ip) {
            if(!confirm('确定移除 '+ip+'?')) return;
            try {
                await fetch('?flag=del_whitelist', { method:'POST', body:JSON.stringify({ip}) });
                loadWhitelist();
            } catch(e) { alert('删除失败'); }
        }

        // ProxyIP检测
        async function checkProxy() {
            const val = document.getElementById('pIp').value;
            if(val) {
                try { await navigator.clipboard.writeText(val); alert("✅ ProxyIP 已复制\\n\\n点击确定跳转检测网站..."); }
                catch(e) { alert("跳转检测网站..."); }
                fetch('?flag=log_proxy_check');
                window.open("${proxyCheckUrl}", "_blank");
            }
        }

        function testSub() {
            const url = document.getElementById('finalLink').value;
            if(url) { fetch('?flag=log_sub_test'); window.open(url); }
        }

        // 保存配置
        async function saveConfig(data, modalId) {
            try {
                await fetch('?flag=save_config', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
                alert('保存成功');
                if(modalId) closeModal(modalId);
                setTimeout(() => location.reload(), 500);
            } catch(e) { alert('保存失败: ' + e); }
        }

        // ⭐ 功能4: 保存 DLS 配置
        function saveNodeConfig() {
            const data = { ADD: val('inpAdd'), ADDAPI: val('inpAddApi'), ADDCSV: val('inpAddCsv'), DLS: val('inpDls') };
            saveConfig(data, null);
        }

        async function clearConfig(type) {
            if(!confirm('确定清除后台配置？')) return;
            let data = {};
            if(type === 'tg') data = { TG_BOT_TOKEN: "", TG_CHAT_ID: "" };
            if(type === 'cf') data = { CF_ID: "", CF_TOKEN: "", CF_EMAIL: "", CF_KEY: "" };
            saveConfig(data, type + 'Modal');
        }

        async function validateApi(type) {
            const endpoint = type === 'tg' ? 'validate_tg' : 'validate_cf';
            let payload = {};
            if(type === 'tg') payload = { TG_BOT_TOKEN: val('tgToken'), TG_CHAT_ID: val('tgId') };
            else payload = { CF_ID:val('cfAcc'), CF_TOKEN:val('cfTok'), CF_EMAIL:val('cfMail'), CF_KEY:val('cfKey') };
            try {
                const res = await fetch('?flag=' + endpoint, { method:'POST', body:JSON.stringify(payload) });
                const d = await res.json();
                alert(d.msg || (d.success ? '验证通过' : '验证失败'));
            } catch(e) { alert('请求错误'); }
        }

        function toggleTheme() { document.body.classList.toggle('light'); }

        // 更新订阅链接
        function updateLink() {
            let base = document.getElementById('subDom').value.trim() || document.getElementById('hostDom').value.trim();
            let host = document.getElementById('hostDom').value.trim();
            let p = document.getElementById('pIp').value.trim();
            let isClash = document.getElementById('clashMode').checked;
            let path = p ? "/proxyip=" + p : "/";
            const search = new URLSearchParams();
            search.set('uuid', UUID);
            search.set('encryption', 'none');
            search.set('security', 'tls');
            search.set('sni', host);
            search.set('alpn', 'h3');
            search.set('fp', 'random');
            search.set('allowInsecure', '0');
            search.set('type', 'ws');
            search.set('host', host);
            search.set('path', path);
            let finalUrl = \`https://\${base}/sub?\${search.toString()}\`;
            if (isClash) {
                let subUrl = CONVERTER + "/sub?target=clash&url=" + encodeURIComponent(finalUrl) + "&emoji=true&list=false&sort=false";
                document.getElementById('finalLink').value = subUrl;
            } else {
                document.getElementById('finalLink').value = finalUrl;
            }
        }

        function toggleClash() { updateLink(); }

        function copyId(id) {
            const el = document.getElementById(id);
            el.select();
            navigator.clipboard.writeText(el.value).then(() => {
                const t = document.getElementById('toast');
                t.style.opacity=1;
                setTimeout(() => t.style.opacity=0, 2000);
            });
        }

        function logout() {
            document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
            sessionStorage.removeItem("is_active");
            location.reload();
        }

        // ==================== 网络信息检测功能 ====================
        const latencySites = [
            { name: '字节抖音', region: 'domestic', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000000" d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>', url: 'https://lf3-zlink-tos.ugurl.cn/obj/zebra-public/resource_lmmizj_1632398893.png' },
            { name: 'Bilibili', region: 'domestic', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FB7299" d="M17.813 4.653h.854q2.266.08 3.773 1.574Q23.946 7.72 24 9.987v7.36q-.054 2.266-1.56 3.773c-1.506 1.507-2.262 1.524-3.773 1.56H5.333q-2.266-.054-3.773-1.56C.053 19.614.036 18.858 0 17.347v-7.36q.054-2.267 1.56-3.76t3.773-1.574h.774l-1.174-1.12a1.23 1.23 0 0 1-.373-.906q0-.534.373-.907l.027-.027q.4-.373.92-.373t.92.373L9.653 4.44q.107.106.187.213h4.267a.8.8 0 0 1 .16-.213l2.853-2.747q.4-.373.92-.373c.347 0 .662.151.929.4s.391.551.391.907q0 .532-.373.906zM5.333 7.24q-1.12.027-1.88.773q-.76.748-.786 1.894v7.52q.026 1.146.786 1.893t1.88.773h13.334q1.12-.026 1.88-.773t.786-1.893v-7.52q-.026-1.147-.786-1.894t-1.88-.773zM8 11.107q.56 0 .933.373q.375.374.4.96v1.173q-.025.586-.4.96q-.373.375-.933.374c-.56-.001-.684-.125-.933-.374q-.375-.373-.4-.96V12.44q0-.56.386-.947q.387-.386.947-.386m8 0q.56 0 .933.373q.375.374.4.96v1.173q-.025.586-.4.96q-.373.375-.933.374c-.56-.001-.684-.125-.933-.374q-.375-.373-.4-.96V12.44q.025-.586.4-.96q.373-.373.933-.373"/></svg>', url: 'https://i0.hdslb.com/bfs/face/member/noface.jpg@24w_24h_1c' },
            { name: '腾讯微信', region: 'domestic', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#09B83E" d="M8.7 2.19C3.9 2.19 0 5.48 0 9.53c0 2.21 1.17 4.2 3 5.55a.6.6 0 0 1 .21.66l-.39 1.48q-.03.11-.04.22c0 .16.13.3.29.3a.3.3 0 0 0 .16-.06l1.9-1.11a.9.9 0 0 1 .72-.1 10 10 0 0 0 2.84.4q.41-.01.81-.05a5.85 5.85 0 0 1 1.93-6.45 8.3 8.3 0 0 1 5.86-1.83c-.58-3.59-4.2-6.35-8.6-6.35m-2.9 3.8c.64 0 1.16.53 1.16 1.18a1.17 1.17 0 0 1-1.16 1.18 1.17 1.17 0 0 1-1.17-1.18c0-.65.52-1.18 1.17-1.18m5.8 0c.65 0 1.17.53 1.17 1.18a1.17 1.17 0 0 1-1.16 1.18 1.17 1.17 0 0 1-1.16-1.18c0-.65.52-1.18 1.16-1.18m5.34 2.87a8 8 0 0 0-5.28 1.78 5.5 5.5 0 0 0-1.78 6.22c.94 2.46 3.66 4.23 6.88 4.23q1.25 0 2.36-.33a.7.7 0 0 1 .6.08l1.59.93.14.04c.13 0 .24-.1.24-.24q-.01-.09-.04-.18l-.33-1.23-.02-.16a.5.5 0 0 1 .2-.4 5.8 5.8 0 0 0 2.5-4.62c0-3.21-2.93-5.84-6.66-6.09zm-2.53 3.27c.53 0 .97.44.97.98a1 1 0 0 1-.97.99 1 1 0 0 1-.97-.99c0-.54.43-.98.97-.98zm4.84 0c.54 0 .97.44.97.98a1 1 0 0 1-.97.99 1 1 0 0 1-.97-.99c0-.54.44-.98.97-.98"/></svg>', url: 'https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico' },
            { name: '阿里淘宝', region: 'domestic', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FF6A00" d="M5.2 2.74c.7-.46 1.63-.26 2.1.44l2.14 3.2h5.12l2.14-3.2c.47-.7 1.4-.9 2.1-.44.7.47.9 1.4.44 2.1L17.6 7.38h2.9c.83 0 1.5.67 1.5 1.5v11.62c0 .83-.67 1.5-1.5 1.5H3.5c-.83 0-1.5-.67-1.5-1.5V8.88c0-.83.67-1.5 1.5-1.5h2.9L4.76 4.84c-.46-.7-.26-1.63.44-2.1zM4 9.88v9.62h16V9.88H4zm4.75 2.37c.41 0 .75.34.75.75v3.5c0 .41-.34.75-.75.75s-.75-.34-.75-.75V13c0-.41.34-.75.75-.75zm6.5 0c.41 0 .75.34.75.75v3.5c0 .41-.34.75-.75.75s-.75-.34-.75-.75V13c0-.41.34-.75.75-.75z"/></svg>', url: 'https://img.alicdn.com/imgextra/i2/O1CN01qnQCrN1VkzAWiU4Hs_!!6000000002692-2-tps-33-33.png' },
            { name: 'GitHub', region: 'international', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#181717" d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.7 4.7 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3"/></svg>', url: 'https://github.github.io/janky/images/bg_hr.png' },
            { name: 'Telegram', region: 'international', icon: '<svg width="24" height="24" viewBox="0 0 16 16"><defs><linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="tg"><stop stop-color="#38AEEB" offset="0%"/><stop stop-color="#279AD1" offset="100%"/></linearGradient></defs><circle fill="url(#tg)" cx="8" cy="8" r="8"/><path d="M3.17 7.84c2.62-1.1 4.36-1.82 5.24-2.17 2.49-.99 2.84-1.14 3.18-1.14.07 0 .25.03.39.15.12.12.16.2.17.27.01.07.01.28 0 .4-.14 1.36-.65 4.5-.95 6.03-.12.64-.37.86-.61.88-.52.05-.92-.32-1.42-.64-.79-.5-1.05-.68-1.83-1.17-.89-.56-.52-.76-.02-1.26.13-.13 2.32-2.13 2.35-2.31.03-.16.02-.18-.08-.25-.08-.07-.17-.06-.22-.05-.1.02-1.3.77-3.64 2.28-.34.23-.66.34-.94.34-.32-.01-.93-.17-1.39-.31-.56-.18-1-.27-.96-.57.02-.16.26-.32.72-.49z" fill="#FFF"/></svg>', url: 'https://web.telegram.org/k/' },
            { name: 'X.com', region: 'international', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>', url: 'https://abs.twimg.com/favicons/twitter.3.ico' },
            { name: 'YouTube', region: 'international', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FF0000" d="M23.5 6.19a3 3 0 0 0-2.12-2.14c-1.87-.5-9.38-.5-9.38-.5s-7.5 0-9.38.5A3 3 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3 3 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.5 0 9.38-.5a3 3 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81M9.55 15.57V8.43L15.82 12z"/></svg>', url: 'https://www.youtube.com/favicon.ico' }
        ];

        function setNetworkStatus(id, status) {
            const el = document.getElementById(id);
            if (el) el.className = 'status-indicator status-' + status;
        }

        function getLatencyColor(latency) {
            if (latency === -1) return 'latency-red';
            if (latency <= 49) return 'latency-green';
            if (latency <= 149) return 'latency-yellow';
            if (latency <= 299) return 'latency-orange';
            return 'latency-red';
        }

        async function testLatency(url) {
            const start = Date.now();
            try {
                await fetch(url + '?t=' + Date.now(), { method: 'HEAD', cache: 'no-cache', mode: 'no-cors' });
                return Date.now() - start;
            } catch { return -1; }
        }

        function generateLatencyCards() {
            const container = document.getElementById('latency-cards');
            if (!container) return;
            container.innerHTML = '';
            latencySites.forEach(site => {
                const siteName = site.name.toLowerCase().replace(/\\s+/g, '-');
                const regionClass = site.region === 'domestic' ? 'domestic' : 'international';
                const regionText = site.region === 'domestic' ? '国内' : '国际';
                const card = document.createElement('div');
                card.className = 'latency-card';
                card.innerHTML = '<div class="latency-card-header"><div class="latency-card-info"><div class="latency-card-icon" data-site="' + site.name + '">' + site.icon + '</div><div><div class="latency-card-name">' + site.name + '</div><div class="latency-card-region ' + regionClass + '">' + regionText + '</div></div></div><div class="latency-status" id="latency-' + siteName + '">...<span class="unit">ms</span></div></div>';
                container.appendChild(card);
            });
        }

        async function runLatencyTests() {
            for (const site of latencySites) {
                const siteName = site.name.toLowerCase().replace(/\\s+/g, '-');
                const el = document.getElementById('latency-' + siteName);
                if (!el) continue;
                const latency = await testLatency(site.url);
                const colorClass = getLatencyColor(latency);
                if (latency === -1) {
                    el.innerHTML = 'TIMEOUT';
                } else {
                    el.innerHTML = latency + '<span class="unit">ms</span>';
                }
                el.className = 'latency-status ' + colorClass;
            }
        }

        async function fetchIpipData() {
            setNetworkStatus('status-ipip', 'loading');
            const apis = [
                { name: 'speedtest.cn', url: 'https://api-v3.speedtest.cn/ip', parse: d => d.code === 0 && d.data ? { ip: d.data.ip, loc: (d.data.country || '') + ' ' + (d.data.city || '') } : null },
                { name: 'ipipv.com', url: 'https://myip.ipipv.com/', parse: d => ({ ip: d.Ip, loc: (d.Country || '') + ' ' + (d.City || '') }) },
                { name: 'ipip.net', url: 'https://myip.ipip.net/json', parse: d => d.ret === 'ok' && d.data ? { ip: d.data.ip, loc: (d.data.location[0] || '') + ' ' + (d.data.location[2] || '') } : null }
            ];
            for (const api of apis) {
                try {
                    const res = await fetch(api.url + '?_t=' + Date.now());
                    const data = await res.json();
                    const result = api.parse(data);
                    if (result && result.ip) {
                        document.getElementById('ipip-ip').textContent = result.ip;
                        document.getElementById('ipip-country').textContent = result.loc.trim();
                        document.getElementById('ipip-title').textContent = '国内测试(' + api.name + ')';
                        setNetworkStatus('status-ipip', 'success');
                        return;
                    }
                } catch {}
            }
            document.getElementById('ipip-ip').innerHTML = '<span class="error">加载失败</span>';
            setNetworkStatus('status-ipip', 'error');
        }

        async function fetchEdgeOneData() {
            setNetworkStatus('status-edgeone', 'loading');
            try {
                const res = await fetch('https://api.ipapi.cmliussss.net');
                const d = await res.json();
                document.getElementById('edgeone-ip').textContent = d.ip || '未知';
                document.getElementById('edgeone-country').textContent = ((d.location?.country_code || '') + ' AS' + (d.asn?.asn || '') + ' ' + (d.asn?.org || '')).trim();
                setNetworkStatus('status-edgeone', 'success');
            } catch {
                document.getElementById('edgeone-ip').innerHTML = '<span class="error">加载失败</span>';
                setNetworkStatus('status-edgeone', 'error');
            }
        }

        async function fetchCloudFlareData() {
            setNetworkStatus('status-cf', 'loading');
            try {
                const res = await fetch('https://cf.090227.xyz/ip.json?_t=' + Date.now());
                const d = await res.json();
                document.getElementById('cf-ip').textContent = d.ip || '未知';
                document.getElementById('cf-country').textContent = ((d.country || '') + ' ' + (d.org || '')).trim() || '未知';
                setNetworkStatus('status-cf', 'success');
            } catch {
                document.getElementById('cf-ip').innerHTML = '<span class="error">加载失败</span>';
                setNetworkStatus('status-cf', 'error');
            }
        }

        async function fetchTwitterData() {
            setNetworkStatus('status-twitter', 'loading');
            try {
                const res = await fetch('https://help.x.com/cdn-cgi/trace?_t=' + Date.now());
                const text = await res.text();
                const data = {};
                text.split('\\n').forEach(line => { const [k, v] = line.split('='); if (k && v) data[k.trim()] = v.trim(); });
                document.getElementById('twitter-ip').textContent = data.ip || '未知';
                document.getElementById('twitter-country').textContent = ((data.loc || '') + ' ' + (data.colo || '')).trim() || '未知';
                setNetworkStatus('status-twitter', 'success');
            } catch {
                document.getElementById('twitter-ip').innerHTML = '<span class="error">加载失败</span>';
                setNetworkStatus('status-twitter', 'error');
            }
        }

        function loadNetworkInfo() {
            generateLatencyCards();
            fetchIpipData();
            fetchEdgeOneData();
            fetchCloudFlareData();
            fetchTwitterData();
            runLatencyTests();
            setInterval(runLatencyTests, 5000);
        }

        // 初始化
        updateStats();
        loadLogs();
        loadWhitelist();
        updateLink();
        loadNetworkInfo();
        setInterval(loadLogs, 5000);
    </script>
</body>
</html>`;
}
