import { connect } from 'cloudflare:sockets';

// =============================================================================
// 🟣 用户配置区域 (优先读取环境变量，如果未设置则使用以下默认值)
// =============================================================================
const UUID = "06b65903-406d-4a41-8463-6fd5c0ee7798"; 

// 1. 后台管理密码 (必填！否则直接进后台，不显示登录页)
const WEB_PASSWORD = ""; 
// 2. 快速订阅密码
const SUB_PASSWORD = ""; 

// 3. 默认基础配置
// 🟢 已同步你提供的 snippets 文件中的默认 IP
const DEFAULT_PROXY_IP = "ProxyIP.Oracle.cmliussss.net"; 
const DEFAULT_SUB_DOMAIN = "sub.cmliussss.net"; 

// 群组+检测站
const TG_GROUP_URL = "https://t.me/zyssadmin";   
const TG_CHANNEL_URL = "https://t.me/cloudflareorg"; 
const PROXY_CHECK_URL = "https://kaic.hidns.co/"; 

const DEFAULT_CONVERTER = "https://subapi.cmliussss.net"; 
const CLASH_CONFIG = "https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_Full_MultiMode.ini"; 

// Sing-box 配置
const SINGBOX_CONFIG_V12 = "https://raw.githubusercontent.com/sinspired/sub-store-template/main/1.12.x/sing-box.json"; 
const SINGBOX_CONFIG_V11 = "https://raw.githubusercontent.com/sinspired/sub-store-template/main/1.11.x/sing-box.json"; 

// TG配置
const TG_BOT_TOKEN = ""; 
const TG_CHAT_ID = ""; 

const DEFAULT_CUSTOM_IPS = `173.245.58.127#CF官方优选
8.39.125.176#CF官方优选
172.64.228.106#CF官方优选
198.41.223.138#CF官方优选
104.19.61.220#CF官方优选
104.18.44.31#CF官方优选
104.19.37.177#CF官方优选
104.19.37.36#CF官方优选
162.159.38.199#CF官方优选
172.67.69.193#CF官方优选
108.162.198.41#CF官方优选
8.35.211.134#CF官方优选
173.245.58.201#CF官方优选
172.67.71.105#CF官方优选
162.159.37.12#CF官方优选
104.18.33.144#CF官方优选`;

// =============================================================================
// ⚡️ 核心逻辑区
// =============================================================================
// 🟢 引入文件2的运行时白名单机制，用于区分管理员通知
const RUNTIME_WHITELIST = new Set();
const IP_HISTORY = new Map(); // 用于简易记录访问次数

const MAX_PENDING=2097152,KEEPALIVE=15000,STALL_TO=8000,MAX_STALL=12,MAX_RECONN=24;
const buildUUID=(a,i)=>[...a.slice(i,i+16)].map(n=>n.toString(16).padStart(2,'0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/,'$1-$2-$3-$4-$5');
const extractAddr=b=>{const o=18+b[17]+1,p=(b[o]<<8)|b[o+1],t=b[o+2];let l,h,O=o+3;switch(t){case 1:l=4;h=b.slice(O,O+l).join('.');break;case 2:l=b[O++];h=new TextDecoder().decode(b.slice(O,O+l));break;case 3:l=16;h=`[${[...Array(8)].map((_,i)=>((b[O+i*2]<<8)|b[O+i*2+1]).toString(16)).join(':')}]`;break;default:throw new Error('Addr type error');}return{host:h,port:p,payload:b.slice(O+l)}};

async function resolveNetlib(n){try{const r=await fetch(`https://1.1.1.1/dns-query?name=${n}&type=TXT`,{headers:{'Accept':'application/dns-json'}});if(!r.ok)return null;const d=await r.json(),t=(d.Answer||[]).filter(x=>x.type===16).map(x=>x.data);if(!t.length)return null;let D=t[0].replace(/^"|"$/g,'');const p=D.replace(/\\010|\n/g,',').split(',').map(s=>s.trim()).filter(Boolean);return p.length?p[Math.floor(Math.random()*p.length)]:null}catch{return null}}
async function parseIP(p){p=p.toLowerCase();if(p.includes('.netlib')){const n=await resolveNetlib(p);p=n||p}let a=p,o=443;if(p.includes('.tp')){const m=p.match(/\.tp(\d+)/);if(m)o=parseInt(m[1],10);return[a,o]}if(p.includes(']:')){const s=p.split(']:');a=s[0]+']';o=parseInt(s[1],10)||o}else if(p.includes(':')&&!p.startsWith('[')){const i=p.lastIndexOf(':');a=p.slice(0,i);o=parseInt(p.slice(i+1),10)||o}return[a,o]}

class Pool{constructor(){this.b=new ArrayBuffer(16384);this.p=0;this.l=[];this.m=8}alloc(s){if(s<=4096&&s<=16384-this.p){const v=new Uint8Array(this.b,this.p,s);this.p+=s;return v}const r=this.l.pop();return r&&r.byteLength>=s?new Uint8Array(r.buffer,0,s):new Uint8Array(s)}free(b){if(b.buffer===this.b)this.p=Math.max(0,this.p-b.length);else if(this.l.length<this.m&&b.byteLength>=1024)this.l.push(b)}reset(){this.p=0;this.l=[]}}

function genNodes(h,u,p){
    let l = DEFAULT_CUSTOM_IPS.replace(/[,;]/g, '\n').split('\n').filter(line => line.trim() !== "");
    for (let i = l.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [l[i], l[j]] = [l[j], l[i]];
    }
    const P=p?`/proxyip=${p.trim()}`:"/",E=encodeURIComponent(P);
    const PT='v'+'l'+'e'+'s'+'s';
    return l.map(L=>{
        const[a,n]=L.split('#'),I=a.trim(),N=n?n.trim():'Worker-Node';
        let i=I,pt="443";
        if(I.includes(':')&&!I.includes('[')){const s=I.split(':');i=s[0];pt=s[1]}
        return`${PT}://${u}@${i}:${pt}?encryption=none&security=tls&sni=${h}&alpn=h3&fp=random&allowInsecure=1&type=ws&host=${h}&path=${E}#${encodeURIComponent(N)}`
    }).join('\n');
}

// 🟢 移植功能：文件2的增强版 TG 通知发送函数
async function sendTgMsg(token, chat_id, ctx, title, r, detail = "") {
  if (!token || !chat_id) return;
  try {
    const url = new URL(r.url);
    const ip = r.headers.get('cf-connecting-ip') || 'Unknown';
    const ua = r.headers.get('User-Agent') || 'Unknown';
    const city = r.cf?.city || 'Unknown';
    const time = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const safe = (str) => (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const text = `<b>📡 ${safe(title)}</b>\n\n` + `<b>🕒 时间:</b> <code>${time}</code>\n` + `<b>🌍 IP:</b> <code>${safe(ip)} (${safe(city)})</code>\n` + `<b>🔗 域名:</b> <code>${safe(url.hostname)}</code>\n` + `<b>🛣️ 路径:</b> <code>${safe(url.pathname)}</code>\n` + `<b>📱 客户端:</b> <code>${safe(ua)}</code>\n` + (detail ? `<b>ℹ️ 详情:</b> ${safe(detail)}` : "");
    const params = { chat_id: chat_id, text: text, parse_mode: 'HTML', disable_web_page_preview: true };
    const promise = fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }).catch(e => console.error("TG Send Error:", e));
    if(ctx && ctx.waitUntil) ctx.waitUntil(promise);
    return promise;
  } catch(e) { console.error("TG Setup Error:", e); }
}

export default {
  async fetch(r, env, ctx) { 
    try {
      const MY_UUID = env.UUID || UUID;
      const MY_PROXYIP = env.PROXYIP || DEFAULT_PROXY_IP;
      const MY_SUB_DOMAIN = env.SUB_DOMAIN || DEFAULT_SUB_DOMAIN;
      const MY_SUB_PASSWORD = env.SUB_PASSWORD || SUB_PASSWORD;
      const MY_WEB_PASSWORD = env.WEB_PASSWORD || WEB_PASSWORD;
      const MY_TG_TOKEN = env.TG_BOT_TOKEN || TG_BOT_TOKEN;
      const MY_TG_ID = env.TG_CHAT_ID || TG_CHAT_ID;
      const MY_TG_GROUP = env.TG_GROUP_URL || TG_GROUP_URL;
      const MY_TG_CHANNEL = env.TG_CHANNEL_URL || TG_CHANNEL_URL;

      const url = new URL(r.url);
      const host = url.hostname; 
      const UA = (r.headers.get('User-Agent') || "").toLowerCase();
      const ip = r.headers.get('cf-connecting-ip') || 'Unknown';
      const isWhite = RUNTIME_WHITELIST.has(ip); // 简单的白名单判断

      if (url.pathname === '/favicon.ico') return new Response(null, { status: 404 });

      // 🟢 移植功能：Flag 处理逻辑 (GitHub 跳转 + CheckProxy 通知)
      if (url.searchParams.get('flag')) {
          const flag = url.searchParams.get('flag');
          if (flag === 'github') {
              await sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, "🌟 用户点击了烈火项目", r, "来源: 登录页面直达链接");
          } else if (flag === 'checkproxy') {
              const checkIp = url.searchParams.get('ip') || "未填写";
              const title = isWhite ? "🔍 管理员点击了检测站" : "🔍 用户点击了检测站";
              await sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, title, r, `检测IP: ${checkIp}`);
          }
          return new Response(null, { status: 204 });
      }

      // 1. 快速订阅接口
      if (MY_SUB_PASSWORD && url.pathname === `/${MY_SUB_PASSWORD}`) {
          const K_CLASH = 'c'+'l'+'a'+'s'+'h';
          const K_SB = 's'+'i'+'n'+'g'+'-'+'b'+'o'+'x';
          const K_VR = 'v'+'2'+'r'+'a'+'y';
          
          const isClash = UA.includes(K_CLASH) || UA.includes('meta') || UA.includes('stash');
          const isSingbox = UA.includes(K_SB) || UA.includes('singbox') || UA.includes('sfi') || UA.includes('box') || UA.includes('karing') || UA.includes('neko');
          const isV2ray = UA.includes(K_VR);
          const isConverter = UA.includes("subconverter") || UA.includes("sub-one-proxy");
          const isFlagged = url.searchParams.has('flag');
          const now = Date.now();

          // 🟢 移植功能：文件2的详细订阅通知逻辑
          if (!isFlagged) {
             let clientName = "浏览器/未知";
             let notifTitle = isWhite ? "🔬 管理员正在进行链接测试并打开访问了订阅链接" : "🌍 用户打开了我的订阅链接并访问";

             if (isSingbox) { clientName = "Sing-box"; notifTitle = "🔄 用户进行了订阅更新"; }
             else if (isClash) { clientName = "Clash"; notifTitle = "🔄 用户进行了订阅更新"; }
             else if (isV2ray) { clientName = atob("djJyYXlORw=="); notifTitle = "🔄 用户进行了订阅更新"; }
             else if (isConverter) { clientName = "订阅转换后端"; notifTitle = "🔄 用户进行了订阅更新"; }

             const p = sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, notifTitle, r, `客户端: ${clientName}`);
             if(ctx && ctx.waitUntil) ctx.waitUntil(p);
          }

          if (isSingbox && !isFlagged) {
              const requestProxyIp = url.searchParams.get('proxyip');
              let selfUrl = `https://${host}/${MY_SUB_PASSWORD}?flag=true`;
              if (requestProxyIp) selfUrl += `&proxyip=${encodeURIComponent(requestProxyIp)}`;
              let targetConfig = SINGBOX_CONFIG_V12;
              try {
                  const controller = new AbortController();
                  setTimeout(() => controller.abort(), 2000);
                  const checkV12 = await fetch(SINGBOX_CONFIG_V12, { method: 'HEAD', signal: controller.signal });
                  if (checkV12.status !== 200) targetConfig = SINGBOX_CONFIG_V11;
              } catch (e) { targetConfig = SINGBOX_CONFIG_V11; }
              const converterUrl = `${DEFAULT_CONVERTER}/sub?target=singbox&url=${encodeURIComponent(selfUrl)}&config=${encodeURIComponent(targetConfig)}&emoji=true&list=false&sort=false&fdn=false&scv=false&_t=${now}`;
              const subRes = await fetch(converterUrl);
              const newHeaders = new Headers(subRes.headers);
              newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
              return new Response(subRes.body, { status: 200, headers: newHeaders });
          }

          if (isClash && !isFlagged) {
              const requestProxyIp = url.searchParams.get('proxyip');
              let selfUrl = `https://${host}/${MY_SUB_PASSWORD}?flag=true`;
              if (requestProxyIp) selfUrl += `&proxyip=${encodeURIComponent(requestProxyIp)}`;
              const converterUrl = `${DEFAULT_CONVERTER}/sub?target=clash&url=${encodeURIComponent(selfUrl)}&config=${encodeURIComponent(CLASH_CONFIG)}&emoji=true&list=false&tfo=false&scv=false&fdn=false&sort=false&_t=${now}`;
              const subRes = await fetch(converterUrl);
              const newHeaders = new Headers(subRes.headers);
              newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');
              return new Response(subRes.body, { status: 200, headers: newHeaders });
          }

          let upstream = MY_SUB_DOMAIN.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
          if (!upstream) upstream = host;
          
          let reqProxyIp = url.searchParams.get('proxyip');
          if (!reqProxyIp && MY_PROXYIP && MY_PROXYIP.trim() !== "") reqProxyIp = MY_PROXYIP;
          let targetPath = "/";
          if (reqProxyIp && reqProxyIp.trim() !== "") targetPath = `/proxyip=${reqProxyIp.trim()}`;

          const params = new URLSearchParams();
          params.append("uuid", MY_UUID);
          params.append("host", upstream);
          params.append("sni", upstream);
          params.append("path", targetPath); 
          params.append("type", "ws");
          params.append("encryption", "none");
          params.append("security", "tls");
          params.append("alpn", "h3");
          params.append("fp", "random");
          params.append("allowInsecure", "1");

          const upstreamUrl = `https://${upstream}/sub?${params.toString()}`;
          try {
              const response = await fetch(upstreamUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
              if (response.ok) {
                  const text = await response.text();
                  try {
                      let content = atob(text.trim());
                      content = content.replace(/path=[^&#]*/g, `path=${encodeURIComponent(targetPath)}`);
                      content = content.replace(/host=[^&]*/g, `host=${host}`);
                      content = content.replace(/sni=[^&]*/g, `sni=${host}`);
                      return new Response(btoa(content), { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
                  } catch (e) { return new Response(text, { status: 200 }); }
              }
          } catch (e) {}
          const fallbackList = genNodes(host, MY_UUID, reqProxyIp);
          return new Response(btoa(unescape(encodeURIComponent(fallbackList))), { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      if (url.pathname === '/sub') {
          const requestUUID = url.searchParams.get('uuid');
          if (requestUUID !== MY_UUID) return new Response('Invalid UUID', { status: 403 });
          let pathParam = url.searchParams.get('path');
          let proxyIp = "";
          if (pathParam && pathParam.includes('/proxyip=')) proxyIp = pathParam.split('/proxyip=')[1];
          else if (pathParam === null) proxyIp = MY_PROXYIP;
          const listText = genNodes(host, MY_UUID, proxyIp);
          
          const p = sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, "常规订阅访问 (/sub)", r);
          if(ctx && ctx.waitUntil) ctx.waitUntil(p);
          
          return new Response(btoa(unescape(encodeURIComponent(listText))), { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      if (r.headers.get('Upgrade') !== 'websocket') {
          const noCacheHeaders = {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
              'Pragma': 'no-cache',
              'Expires': '0'
          };

          if (MY_WEB_PASSWORD && MY_WEB_PASSWORD.trim().length > 0) {
              const cookie = r.headers.get('Cookie') || "";
              const match = cookie.match(/auth=([^;]+)/);
              const userAuth = match ? match[1] : null;

              if (userAuth !== MY_WEB_PASSWORD) {
                  // 🟢 移植功能：文件2的登录失败/访问页通知
                  if (userAuth) {
                      await sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, "🚨 后台登录失败", r, `尝试密码: ${userAuth} (错误)`);
                      return new Response(loginPage(true, MY_TG_GROUP, MY_TG_CHANNEL), { status: 200, headers: noCacheHeaders });
                  } else {
                      const visitTitle = isWhite ? "👀 管理员正在登录后台" : "👋 后台登录页访问";
                      const visitDetail = isWhite ? `IP: ${ip} (白名单)\n状态: 准备登录` : "等待验证";
                      await sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, visitTitle, r, visitDetail);
                      return new Response(loginPage(false, MY_TG_GROUP, MY_TG_CHANNEL), { status: 200, headers: noCacheHeaders });
                  }
              }
          }
          
          // 🟢 移植功能：登录成功后加入运行时白名单
          RUNTIME_WHITELIST.add(ip);
          await sendTgMsg(MY_TG_TOKEN, MY_TG_ID, ctx, "✅ 后台登录成功", r, "进入管理面板");
          return new Response(dashPage(url.hostname, MY_UUID, MY_PROXYIP, MY_SUB_PASSWORD, MY_TG_TOKEN, MY_TG_ID, MY_TG_GROUP), { status: 200, headers: noCacheHeaders });
      }
      
      let proxyIPConfig = null;
      if (url.pathname.includes('/proxyip=')) {
        try {
          const proxyParam = url.pathname.split('/proxyip=')[1].split('/')[0];
          const [address, port] = await parseIP(proxyParam); 
          proxyIPConfig = { address, port: +port }; 
        } catch (e) { console.error(e); }
      }
      const { 0: c, 1: s } = new WebSocketPair(); s.accept(); 
      handle(s, proxyIPConfig, MY_UUID); 
      return new Response(null, { status: 101, webSocket: c });
    } catch (err) {
      return new Response(err.toString(), { status: 500 });
    }
  }
};

const handle = (ws, pc, currentUUID) => {
  const pool = new Pool();
  let s, w, r, inf, fst = true, rx = 0, stl = 0, cnt = 0, lact = Date.now(), con = false, rd = false, wt = false, tm = {}, pd = [], pb = 0, scr = 1.0, lck = Date.now(), lrx = 0, md = 'buf', asz = 0, tp = [], st = { t: 0, c: 0, ts: Date.now() };
  const upd = sz => {
    st.t += sz; st.c++; asz = asz * 0.9 + sz * 0.1; const n = Date.now();
    if (n - st.ts > 1000) { const rt = st.t; tp.push(rt); if (tp.length > 5) tp.shift(); st.t = 0; st.ts = n; const av = tp.reduce((a, b) => a + b, 0) / tp.length; if (st.c >= 20) { if (av > 2e7 && asz > 16384) md = 'dir'; else if (av < 1e7 || asz < 8192) md = 'buf'; else md = 'adp' } }
  };
  const rdL = async () => {
    if (rd) return; rd = true; let b = [], bz = 0, tm = null;
    const fl = () => { if (!bz) return; const m = new Uint8Array(bz); let p = 0; for (const x of b) { m.set(x, p); p += x.length } if (ws.readyState === 1) ws.send(m); b = []; bz = 0; if (tm) clearTimeout(tm); tm = null };
    try {
      while (1) {
        if (pb > MAX_PENDING) { await new Promise(r => setTimeout(r, 100)); continue }
        const { done, value: v } = await r.read();
        if (v?.length) {
          rx += v.length; lact = Date.now(); stl = 0; upd(v.length); const n = Date.now();
          if (n - lck > 5000) { const el = n - lck, by = rx - lrx, r = by / el; if (r > 500) scr = Math.min(1, scr + 0.05); else if (r < 50) scr = Math.max(0.1, scr - 0.05); lck = n; lrx = rx }
          if (md === 'buf') { if (v.length < 32768) { b.push(v); bz += v.length; if (bz >= 131072) fl(); else if (!tm) tm = setTimeout(fl, asz > 16384 ? 5 : 20) } else { fl(); if (ws.readyState === 1) ws.send(v) } } else { fl(); if (ws.readyState === 1) ws.send(v) }
        }
        if (done) { fl(); rd = false; rcn(); break }
      }
    } catch { fl(); rd = false; rcn() }
  };
  const wtL = async () => { if (wt) return; wt = true; try { while (wt) { if (!w) { await new Promise(r => setTimeout(r, 100)); continue } if (!pd.length) { await new Promise(r => setTimeout(r, 20)); continue } const b = pd.shift(); await w.write(b); pb -= b.length; pool.free(b) } } catch { wt = false } };
  const est = async () => { try { s = await cn(); w = s.writable.getWriter(); r = s.readable.getReader(); con = false; cnt = 0; scr = Math.min(1, scr + 0.15); lact = Date.now(); rdL(); wtL() } catch { con = false; scr = Math.max(0.1, scr - 0.2); rcn() } };
  const cn = async () => { const m = ['direct']; if (pc) m.push('proxy'); let err; for (const x of m) { try { const o = (x === 'direct') ? { hostname: inf.host, port: inf.port } : { hostname: pc.address, port: pc.port }; const sk = connect(o); await sk.opened; return sk } catch (e) { err = e } } throw err };
  const rcn = async () => { if (!inf || ws.readyState !== 1) { cln(); ws.close(1011); return } if (cnt >= MAX_RECONN) { cln(); ws.close(1011); return } if (con) return; cnt++; let d = Math.min(50 * Math.pow(1.5, cnt - 1), 3000) * (1.5 - scr * 0.5); d = Math.max(50, Math.floor(d)); try { csk(); if (pb > MAX_PENDING * 2) while (pb > MAX_PENDING && pd.length > 5) { const k = pd.shift(); pb -= k.length; pool.free(k) } await new Promise(r => setTimeout(r, d)); con = true; s = await cn(); w = s.writable.getWriter(); r = s.readable.getReader(); con = false; cnt = 0; scr = Math.min(1, scr + 0.15); stl = 0; lact = Date.now(); rdL(); wtL() } catch { con = false; scr = Math.max(0.1, scr - 0.2); if (cnt < MAX_RECONN && ws.readyState === 1) setTimeout(rcn, 500); else { cln(); ws.close(1011) } } };
  const stT = () => { tm.ka = setInterval(async () => { if (!con && w && Date.now() - lact > KEEPALIVE) try { await w.write(new Uint8Array(0)); lact = Date.now() } catch { rcn() } }, 5000); tm.hc = setInterval(() => { if (!con && st.t > 0 && Date.now() - lact > STALL_TO) { stl++; if (stl >= MAX_STALL) { if (cnt < MAX_RECONN) { stl = 0; rcn() } else { cln(); ws.close(1011) } } } }, 4000) };
  const csk = () => { rd = false; wt = false; try { w?.releaseLock(); r?.releaseLock(); s?.close() } catch { } }; const cln = () => { Object.values(tm).forEach(clearInterval); csk(); while (pd.length) pool.free(pd.shift()); pb = 0; st = { t: 0, c: 0, ts: Date.now() }; md = 'buf'; asz = 0; tp = []; pool.reset() };
  ws.addEventListener('message', async e => { try { if (fst) { fst = false; const b = new Uint8Array(e.data); if (buildUUID(b, 1).toLowerCase() !== currentUUID.toLowerCase()) throw 0; ws.send(new Uint8Array([0, 0])); const { host, port, payload } = extractAddr(b); inf = { host, port }; con = true; if (payload.length) { const z = pool.alloc(payload.length); z.set(payload); pd.push(z); pb += z.length } stT(); est() } else { lact = Date.now(); if (pb > MAX_PENDING * 2) return; const z = pool.alloc(e.data.byteLength); z.set(new Uint8Array(e.data)); pd.push(z); pb += z.length } } catch { cln(); ws.close(1006) } }); ws.addEventListener('close', cln); ws.addEventListener('error', cln)
};

// 🟢 保持不变：Login Page
function loginPage(isError, tgGroup, tgChannel){
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Worker Login</title>
<style>
body { background: linear-gradient(45deg, #1cb5e0 0%, #000851 100%); color: white; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
.glass-box { background: rgba(255, 255, 255, 0.1); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); padding: 40px; border-radius: 16px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); text-align: center; width: 320px; }
h2 { margin-top: 0; margin-bottom: 20px; font-weight: 600; letter-spacing: 1px; }
input { width: 100%; padding: 14px; margin-bottom: 20px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.3); background: rgba(0, 0, 0, 0.2); color: white; box-sizing: border-box; text-align: center; font-size: 1rem; outline: none; transition: 0.3s; }
input:focus { background: rgba(0, 0, 0, 0.4); border-color: #a29bfe; }
button { width: 100%; padding: 12px; border-radius: 8px; border: none; background: linear-gradient(90deg, #a29bfe, #6c5ce7); color: white; font-weight: bold; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); transition: 0.2s; }
button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); }
.social-links { margin-top: 25px; display: flex; justify-content: center; gap: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; flex-wrap: wrap; }
.social-links a { color: #e2e8f0; text-decoration: none; font-size: 0.9rem; padding: 8px 16px; background: rgba(0, 0, 0, 0.2); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.15); transition: 0.2s; display: flex; align-items: center; gap: 5px; }
.social-links a:hover { background: rgba(255, 255, 255, 0.2); transform: translateY(-2px); border-color: #a29bfe; }
.error-msg { background: rgba(231, 76, 60, 0.3); border: 1px solid rgba(231, 76, 60, 0.5); color: #ff7675; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 0.9rem; display: ${isError ? "block" : "none"}; }
</style>
</head>
<body>
<div class="glass-box">
  <h2>🔒 禁止进入</h2>
  <div class="error-msg">⚠️ 密码错误，请重试</div>
  <input type="password" id="pwd" placeholder="请输入密码" autofocus onkeypress="if(event.keyCode===13)verify()">
  <button onclick="verify()">解锁后台</button>
  <div class="social-links">
    <a href="javascript:void(0)" onclick="gh()">🔥 烈火项目直达</a>
    <a href="${tgChannel}" target="_blank">📢 天诚频道组</a>
    <a href="${tgGroup}" target="_blank">✈️ 天诚交流群</a>
  </div>
</div>
<script>
function gh(){fetch("?flag=github&t="+Date.now(),{keepalive:!0});window.open("https://github.com/xtgm/stallTCP1.3V1","_blank")}
function verify(){
  const p=document.getElementById("pwd").value;
  const d=new Date;
  d.setTime(d.getTime()+6048e5);
  document.cookie="auth="+p+";expires="+d.toUTCString()+";path=/";
  location.reload();
}
</script>
</body>
</html>`;
}

// 🟢 保持不变：Dash Page (Logout逻辑正常，不修改)
function dashPage(host, uuid, proxyip, subpass, tgtoken, tgid, tgGroup){
    const s = (tgtoken && tgid) ? '<div class="status-item available">🤖 Telegram 通知: <span style="color:#00b894;font-weight:bold">已开启</span></div>' : '<div class="status-item">🤖 Telegram 通知: <span style="color:#fab1a0">未配置</span></div>';
    const shortUrl = subpass ? `https://${host}/${subpass}` : `https://${host}/`;
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Worker 订阅管理</title>
<style>
:root { --glass: rgba(255, 255, 255, 0.1); --border: rgba(255, 255, 255, 0.2); }
body { background: linear-gradient(135deg, #2b1055 0%, #7597de 100%); color: white; font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; min-height: 100vh; display: flex; justify-content: center; box-sizing: border-box; }
.container { max-width: 800px; width: 100%; }
.card { background: var(--glass); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: 16px; padding: 25px; margin-bottom: 20px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3); }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid var(--border); }
h1 { margin: 0; font-size: 1.5rem; font-weight: 600; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
h3 { margin-top: 0; font-size: 1.1rem; border-bottom: 1px solid var(--border); padding-bottom: 10px; color: #dfe6e9; }
.btn-group { display: flex; gap: 10px; }
.btn-small { font-size: .85rem; cursor: pointer; background: rgba(0, 0, 0, 0.3); padding: 5px 12px; border-radius: 6px; text-decoration: none; color: white; transition: .2s; border: 1px solid transparent; }
.btn-small:hover { background: rgba(255, 255, 255, 0.2); border-color: rgba(255, 255, 255, 0.5); }
.field { margin-bottom: 18px; }
.label { display: block; font-size: .9rem; color: #dfe6e9; margin-bottom: 8px; font-weight: 500; }
.input-group { display: flex; gap: 10px; }
input, textarea { width: 100%; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border); color: white; padding: 12px; border-radius: 8px; font-family: monospace; outline: none; transition: .2s; box-sizing: border-box; }
input:focus, textarea:focus { background: rgba(0, 0, 0, 0.4); border-color: #a29bfe; }
textarea { min-height: 120px; resize: vertical; line-height: 1.4; }
button.main-btn { background: linear-gradient(90deg, #6c5ce7, #a29bfe); color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%; margin-top: 5px; transition: .2s; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); font-size: 1rem; }
button.main-btn:hover { transform: translateY(-2px); opacity: .95; }
button.sec-btn { background: rgba(255, 255, 255, 0.15); color: white; border: 1px solid var(--border); padding: 12px; border-radius: 8px; cursor: pointer; white-space: nowrap; transition: .2s; }
button.sec-btn:hover { background: rgba(255, 255, 255, 0.3); }
.toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: #00b894; color: white; padding: 10px 24px; border-radius: 30px; opacity: 0; transition: .3s; pointer-events: none; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3); font-weight: bold; }
.toast.show { opacity: 1; bottom: 50px; }
.desc { font-size: .8rem; color: #b2bec3; margin-top: 6px; }
.checkbox-wrapper { display: flex; align-items: center; margin-top: 10px; background: rgba(0, 0, 0, 0.2); padding: 8px 12px; border-radius: 6px; width: fit-content; }
.checkbox-wrapper input { width: auto; margin-right: 8px; cursor: pointer; }
.checkbox-wrapper label { cursor: pointer; font-size: .9rem; color: #dfe6e9; }
.status-item { background: rgba(0, 0, 0, 0.2); padding: 8px 12px; border-radius: 6px; font-size: .9rem; margin-top: 10px; display: inline-block; }
</style>
</head>
<body>
<div class="container">
  <div class="card">
    <div class="header">
      <h1>⚡ Worker 管理面板</h1>
      <div class="btn-group">
        <a href="${tgGroup}" target="_blank" class="btn-small">✈️ 加入群组</a>
        <span class="btn-small" onclick="logout()">退出登录</span>
      </div>
    </div>
    <div style="margin-bottom:20px;text-align:center">${s}</div>
    <div class="field" style="background:rgba(108,92,231,0.2);padding:15px;border-radius:10px;border:1px solid rgba(162,155,254,0.4)">
      <span class="label" style="color:#a29bfe;font-weight:bold">🚀 快速自适应订阅 (推荐) 通用订阅复制这里</span>
      <div class="input-group">
        <input type="text" id="shortSub" value="${shortUrl}" readonly onclick="this.select()">
        <button class="sec-btn" onclick="copyId('shortSub')">复制</button>
      </div>
      <div class="desc">直接使用此链接。支持通用订阅客户端(自适应客户端订阅)。<br/>节点将自动抓取上游并替换为Worker加速。</div>
      <div style="margin-top:10px;font-size:0.9rem;color:#ff4757;font-weight:bold;text-align:center;">【↓下方的可修改内容指向手动订阅链接】</div>
    </div>
    <div class="field">
      <span class="label">1. 订阅数据源 (Sub优选订阅器处)</span>
      <input type="text" id="subBaseUrl" value="https://${host}" placeholder="https://你的sub地址或者是worker域名地址" oninput="updateLink()"><div class="desc">这里可修改成你的sub地址或者是你的worker域名地址。</div>
    </div>
    <div class="field">
      <span class="label">2. ProxyIP 修改处</span>
      <div class="input-group">
        <input type="text" id="proxyIp" value="${proxyip}" placeholder="例如: 你的proxyip地址" oninput="updateLink()">
        <button class="sec-btn" onclick="checkProxy()">🔍 检测</button>
      </div>
      <div class="desc">这里决定了你的proxyip地址，谨慎修改正确的proxyip地址内容。</div>
    </div>
    <div class="field" id="clashSettings" style="display:none;background:rgba(0,0,0,0.15);padding:15px;border-radius:8px;margin-bottom:18px;border:1px dashed #6c5ce7">
      <span class="label" style="color:#a29bfe">⚙️ Clash 高级配置</span>
      <div style="margin-bottom:10px">
        <span class="label" style="font-size:0.85rem">转换后端:</span>
        <input type="text" id="converterUrl" value="${DEFAULT_CONVERTER}" oninput="updateLink()">
      </div>
      <div>
        <span class="label" style="font-size:0.85rem">远程配置:</span>
        <input type="text" id="configUrl" value="https://raw.githubusercontent.com/sinspired/sub-store-template/main/1.12.x/sing-box.json" oninput="updateLink()">
      </div>
    </div>
    <div class="field">
      <span class="label">3. 手动生成订阅链接 (Legacy)</span>
      <input type="text" id="resultUrl" readonly onclick="this.select()">
      <div class="checkbox-wrapper">
        <input type="checkbox" id="clashMode" onchange="toggleClashMode()">
        <label for="clashMode">🔄 开启 Clash 转换</label>
      </div>
    </div>
    <div class="input-group">
      <button class="main-btn" onclick="copyId('resultUrl')">📄 复制订阅链接</button>
      <button class="sec-btn" onclick="window.open(document.getElementById('resultUrl').value)" style="width:120px">🚀 测试</button>
    </div>
  </div>
  <div class="card">
    <h3>🚀 优选IP预览</h3>
    <div class="field">
      <span class="label">内置 IP 列表</span>
      <textarea id="customIps" readonly style="background:rgba(0,0,0,0.2);border-color:transparent;cursor:default;height:150px">${DEFAULT_CUSTOM_IPS}</textarea>
    </div>
  </div>
</div>
<div id="toast" class="toast">已复制!</div>
<script>
function toggleClashMode(){
  const e=document.getElementById("clashMode").checked;
  document.getElementById("clashSettings").style.display=e?"block":"none";
  updateLink();
}
function updateLink(){
  let e=document.getElementById("subBaseUrl").value.trim();
  if(e.endsWith("/")) e=e.slice(0,-1);
  if(!e.startsWith("http")) e="https://"+e;
  const t=document.getElementById("proxyIp").value.trim();
  const s="${uuid}";
  const n=document.getElementById("clashMode").checked;
  let r="/";
  if(t) r="/proxyip="+t;
  const o=e+"/sub?uuid="+s+"&path="+encodeURIComponent(r);
  if(n){
    let c=document.getElementById("converterUrl").value.trim();
    if(c.endsWith("/")) c=c.slice(0,-1);
    const cfg=document.getElementById("configUrl").value.trim();
    let configParam = cfg ? "&config="+encodeURIComponent(cfg) : "";
    document.getElementById("resultUrl").value = c + "/sub?target=clash&url="+encodeURIComponent(o)+configParam+"&emoji=true&list=false&tfo=false&scv=false&fdn=false&sort=false";
  } else {
    document.getElementById("resultUrl").value = o;
  }
}
function copyId(e){
  navigator.clipboard.writeText(document.getElementById(e).value).then(()=>showToast("已复制!"));
}
function checkProxy(){
  const e=document.getElementById("proxyIp").value.trim();
  fetch("?flag=checkproxy&ip="+encodeURIComponent(e)+"&t="+Date.now(),{keepalive:!0});
  if(e){
    navigator.clipboard.writeText(e).then(()=>{
      alert("ProxyIP 已复制!");
      window.open("${PROXY_CHECK_URL}","_blank");
    });
  } else {
    window.open("${PROXY_CHECK_URL}","_blank");
  }
}
function showToast(e){
  const t=document.getElementById("toast");
  t.innerText=e;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2e3);
}
function logout(){
  document.cookie = "auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.reload();
}
window.onload=()=>{updateLink()};
</script>
</body>
</html>`;
}
