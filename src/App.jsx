import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDataFetcher, formatLastUpdate } from "./hooks/useDataFetcher.js";
import { fetchMarkets, fetchCommodities, fetchCrypto, fetchCustomMarkets } from "./api/markets.js";
import { fetchMacro } from "./api/macro.js";
import {
  fetchNewsGlobal, fetchNewsMiddleEast, fetchNewsAfrica, fetchNewsLatam,
  fetchNewsEnergy, fetchNewsThinkTanks, fetchNewsFinance, fetchNewsTech,
  fetchLiveNews,
} from "./api/news.js";
import { fetchEarthquakes, fetchFires, fetchPredictions, fetchDisplacement, fetchCyberFeed, fetchMilitaryFeed } from "./api/geo.js";
import { fetchInsights, fetchDeduction } from "./api/ai.js";
import { TTL, relayFetch } from "./api/config.js";

// ── Global Tension Index hook (Polymarket) ────────────────────────
function usePizzINT() {
  const [data, setData] = useState(null);
  useEffect(() => {
    const load = () => relayFetch('/tension').then(d => setData({ tension: d })).catch(() => {});
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return data;
}


/* ── FONTS & CSS ─────────────────────────────────────────── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');`;

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.app.dark{
  --void:#000000;--base:#0A0A0A;--surface:#111111;--elevated:#171717;--hover:#1F1F1F;
  --border:rgba(255,255,255,0.08);--border-hi:rgba(0,210,200,0.5);
  --blue:#00D2C8;--blue-dim:rgba(0,210,200,0.1);--blue-glow:rgba(0,210,200,0.18);
  --gold:#C9A84C;--gold-dim:rgba(201,168,76,0.1);
  --green:#22C55E;--green-dim:rgba(34,197,94,0.1);
  --red:#EF4444;--red-dim:rgba(239,68,68,0.1);
  --amber:#F59E0B;--purple:#A78BFA;
  --t1:#FFFFFF;--t2:#E5E5E5;--t3:#A3A3A3;--t4:#737373;
  --shadow:rgba(0,0,0,0.8);--scroll:rgba(255,255,255,0.06);
}
.app.light{
  --void:#EEF2FC;--base:#FFFFFF;--surface:#F7F9FF;--elevated:#EBF0FC;--hover:#E2E9F8;
  --border:rgba(37,99,235,0.11);--border-hi:rgba(37,99,235,0.35);
  --blue:#2563EB;--blue-dim:rgba(37,99,235,0.07);--blue-glow:rgba(37,99,235,0.14);
  --gold:#9A6F0A;--gold-dim:rgba(154,111,10,0.08);
  --green:#047857;--green-dim:rgba(4,120,87,0.08);
  --red:#C91919;--red-dim:rgba(201,25,25,0.08);
  --amber:#B45309;--purple:#6D28D9;
  --t1:#0F172A;--t2:#1E3A5F;--t3:#374F75;--t4:#6B7FA8;
  --shadow:rgba(37,99,235,0.07);--scroll:rgba(37,99,235,0.1);
}

body{margin:0;font-family:'Montserrat',sans-serif;font-size:13px;overflow:hidden;height:100vh;width:100vw;-webkit-text-size-adjust:100%}
.app.dark .logo-img{mix-blend-mode:screen;filter:none}
.app.light .logo-img{mix-blend-mode:multiply;filter:brightness(0.85) contrast(1.2)}

/* ── MOBILE RESPONSIVE ── */
@media(max-width:768px){
  body{overflow:auto;height:auto;min-height:100vh}
  .app{height:auto;min-height:100vh;overflow:auto}
  .hdr{height:44px;min-height:44px;padding:0 10px;gap:8px}
  .logo-img{height:30px !important}
  .bname{font-size:11px;letter-spacing:.15em}
  .brk{display:none}
  .sidebar{display:none}
  .body{flex-direction:column;overflow:auto}
  .main{overflow:auto;height:auto}
  .layout{flex-direction:column !important;height:auto !important}
  .wrow{flex-direction:column !important;height:auto !important;min-height:unset !important}
  .panel.widget{flex:none !important;width:100% !important;min-width:unset !important;height:320px}
  #panel-map{height:260px}
  .footer{display:none}
  .vbtn{padding:4px 8px;font-size:7px}
  .vbtn-active{padding:4px 8px}
  .ph{padding:6px 10px}
  .ph-label{font-size:9px}
}
@media(max-width:480px){
  .panel.widget{height:280px}
  #panel-map{height:220px}
  .hdr{padding:0 8px}
  .logo-img{height:26px !important}
}
.app{display:flex;flex-direction:column;height:100vh;width:100vw;overflow:clip;background:var(--void);color:var(--t1);transition:background .25s,color .25s}

.brk{height:26px;min-height:26px;background:linear-gradient(90deg,rgba(239,68,68,.1),transparent);border-bottom:1px solid rgba(239,68,68,.15);display:flex;align-items:center;overflow:hidden}
.blbl{font-family:'Montserrat',monospace;font-size:8.5px;font-weight:500;letter-spacing:.18em;color:var(--red);padding:0 10px;height:100%;display:flex;align-items:center;border-right:1px solid rgba(239,68,68,.15);white-space:nowrap;flex-shrink:0;background:rgba(239,68,68,.05)}
.twrap{flex:1;overflow:hidden}
.ticker{display:inline-flex;gap:40px;white-space:nowrap;padding-left:20px;animation:scroll 75s linear infinite;font-family:'Montserrat',monospace;font-size:9.5px;color:var(--t2);letter-spacing:.03em}
@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

.hdr{display:flex;align-items:center;height:48px;min-height:48px;padding:0 14px;background:var(--base);border-bottom:1px solid var(--border);gap:12px;position:relative;z-index:300}
.hdr::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:1px;background:linear-gradient(90deg,var(--blue) 0%,transparent 40%);opacity:.35}
.brand{display:flex;align-items:center;gap:7px;flex-shrink:0}
.bname{font-weight:700;font-size:15px;letter-spacing:.28em;color:var(--t1);font-family:'Montserrat',sans-serif}
.bpulse{width:5px;height:5px;border-radius:50%;background:var(--blue);box-shadow:0 0 7px var(--blue);animation:pulse 2s ease-in-out infinite;flex-shrink:0}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.6)}}
.bsub{font-family:'Montserrat',sans-serif;font-size:7.5px;color:var(--t3);letter-spacing:.2em;text-transform:uppercase}
.vdiv{width:1px;height:20px;background:var(--border);flex-shrink:0}
.vsw{display:flex;gap:1px;background:var(--elevated);border:1px solid var(--border);border-radius:4px;padding:2px}
.vbtn{font-family:'Montserrat',monospace;font-size:9px;letter-spacing:.12em;padding:3px 12px;border:none;background:transparent;color:var(--t3);cursor:pointer;border-radius:3px;transition:all .15s;text-transform:uppercase}
.vbtn:hover{color:var(--t2);background:var(--hover)}
.vbtn.active{background:var(--blue);color:#fff;box-shadow:0 0 12px var(--blue-glow)}
.vbtn.active.finance{background:var(--gold);color:#fff}
.vbtn.active.tech{background:var(--green);color:#fff}
.ibadge{display:flex;align-items:center;gap:5px;border:1px solid rgba(201,168,76,.2);border-radius:3px;padding:2px 8px;font-family:'Montserrat',monospace;font-size:7.5px;color:var(--gold);letter-spacing:.12em;background:var(--gold-dim);flex-shrink:0}
.hr{margin-left:auto;display:flex;align-items:center;gap:10px;flex-shrink:0}
.srow{display:flex;align-items:center;gap:8px}
.schip{display:flex;align-items:center;gap:4px;font-family:'Montserrat',monospace;font-size:8px;color:var(--t2)}
.sdot{width:4px;height:4px;border-radius:50%;background:var(--green);box-shadow:0 0 4px var(--green)}
.sdot.w{background:var(--amber);box-shadow:0 0 4px var(--amber)}
.sdot.o{background:var(--t4);box-shadow:none}
.clock{font-family:'Montserrat',monospace;font-size:11px;color:var(--t2);letter-spacing:.05em}
.hbtn{display:flex;align-items:center;justify-content:center;width:29px;height:29px;border:1px solid var(--border);border-radius:5px;background:transparent;color:var(--t3);cursor:pointer;font-size:13px;transition:all .15s}
.hbtn:hover{border-color:var(--blue);color:var(--blue);background:var(--blue-dim)}
.hbtn.on{border-color:var(--blue);color:var(--blue);background:var(--blue-dim)}

.body{display:flex;flex:1;overflow:clip}
.sidebar{width:40px;min-width:40px;background:var(--base);border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:2px}
.nbtn{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;color:var(--t3);cursor:pointer;border-radius:4px;font-size:13px;transition:all .15s;position:relative}
.nbtn:hover{background:var(--hover);color:var(--t2)}
.nbtn.active{color:var(--blue);background:var(--blue-dim)}
.nbtn.active::before{content:'';position:absolute;left:0;top:4px;bottom:4px;width:2px;background:var(--blue);border-radius:0 2px 2px 0}
.nsp{flex:1}

.workspace{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;background:var(--void);padding:8px 10px;display:flex;flex-direction:column;gap:8px}
.workspace::-webkit-scrollbar{width:4px}
.workspace::-webkit-scrollbar-thumb{background:var(--scroll);border-radius:2px}
.wrow{display:flex;gap:8px;width:100%;flex-shrink:0}
.wrow-resize{width:100%;height:5px;cursor:row-resize;display:flex;align-items:center;justify-content:center;flex-shrink:0;opacity:0;transition:opacity .15s}
.wrow-resize:hover{opacity:1}
.wrow-resize::after{content:'';width:40px;height:2px;border-radius:1px;background:var(--blue);opacity:.5}
.widget{display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;min-width:0;transition:outline .1s}
.widget.drag-over{outline:2px solid var(--blue);border-radius:8px}
.col-resize-handle{width:5px;cursor:col-resize;flex-shrink:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s;margin:0 -2px}
.col-resize-handle:hover{opacity:1}
.col-resize-handle::after{content:'';width:2px;height:30px;border-radius:1px;background:var(--blue);opacity:.6}

.panel{background:var(--base);border:1px solid var(--border);border-radius:8px;display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;position:relative;transition:border-color .15s}
.panel:hover{border-color:rgba(59,130,246,0.15)}
.ph{display:flex;align-items:center;justify-content:space-between;padding:0 10px;height:36px;min-height:36px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0}
.ptitle{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:600;letter-spacing:.08em;color:var(--t2);text-transform:uppercase}
.pbar{width:2px;height:12px;border-radius:1px;flex-shrink:0}
.pctrls{display:flex;align-items:center;gap:4px}
.pmeta{font-family:'Montserrat',monospace;font-size:7.5px;color:var(--t4);letter-spacing:.1em}
.pibtn{width:20px;height:20px;border:none;background:transparent;color:var(--t4);cursor:pointer;font-size:10px;border-radius:3px;transition:all .15s;display:flex;align-items:center;justify-content:center}
.pibtn:hover{color:var(--t2);background:var(--hover)}
.pb{padding:10px;overflow-y:auto;flex:1;min-height:0}
.pb.scroll{overflow-y:auto}
.pb::-webkit-scrollbar{width:3px}
.pb::-webkit-scrollbar-thumb{background:var(--scroll);border-radius:2px}
.rh{height:5px;cursor:row-resize;background:transparent;flex-shrink:0}
.rh:hover{background:rgba(59,130,246,.1)}

/* loading/error state */
.loading-dots{display:inline-flex;gap:3px;align-items:center}
.loading-dots span{width:4px;height:4px;border-radius:50%;background:var(--t3);animation:ldot .8s ease-in-out infinite}
.loading-dots span:nth-child(2){animation-delay:.15s}
.loading-dots span:nth-child(3){animation-delay:.3s}
@keyframes ldot{0%,80%,100%{opacity:.2}40%{opacity:1}}
.panel-error{font-family:'Montserrat',monospace;font-size:9px;color:var(--red);opacity:.7;padding:4px 0}
.panel-empty{font-family:'Montserrat',monospace;font-size:9px;color:var(--t4);padding:4px 0}

/* news */
.nitem{padding:7px 0;border-bottom:1px solid var(--border)}
.nitem:last-child{border-bottom:none}
.nsrc{display:flex;align-items:center;gap:5px;font-family:'Montserrat',monospace;font-size:8.5px;color:var(--t3);margin-bottom:3px;flex-wrap:wrap}
.ntag{padding:1px 5px;border-radius:2px;font-size:7.5px;letter-spacing:.08em;font-weight:600}
.ntag.tc{background:var(--red-dim);color:var(--red)}
.ntag.th{background:rgba(245,158,11,.1);color:var(--amber)}
.ntag.tm{background:var(--blue-dim);color:var(--blue)}
.nhead{font-size:11.5px;line-height:1.45;color:var(--t1);cursor:pointer}
.nhead:hover{color:var(--blue)}
.ntime{font-family:'Montserrat',monospace;font-size:8px;color:var(--t4);margin-top:2px}

/* markets */
.mtbl{width:100%;border-collapse:collapse;font-size:11.5px}
.mtbl th{font-family:'Montserrat',monospace;font-size:8px;color:var(--t4);letter-spacing:.1em;text-align:left;padding-bottom:6px;font-weight:500}
.mtbl th:not(:first-child){text-align:right}
.mtbl td{padding:4px 0;border-bottom:1px solid var(--border)}
.mtbl tr:last-child td{border-bottom:none}
.mtbl td:not(:first-child){text-align:right}
.tick{font-family:'Montserrat',monospace;font-size:10.5px;font-weight:500;color:var(--t2)}
.cup{color:var(--green)}
.cdn{color:var(--red)}
.cbadge{font-family:'Montserrat',monospace;font-size:9.5px;padding:1px 5px;border-radius:3px}
.cbadge.up{background:var(--green-dim);color:var(--green)}
.cbadge.dn{background:var(--red-dim);color:var(--red)}
.cr-item{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)}
.cr-item:last-child{border-bottom:none}
.cr-sym{font-family:'Montserrat',monospace;font-size:11px;font-weight:600;color:var(--t1)}
.cr-name{font-size:9px;color:var(--t3);margin-top:1px}
.cr-price{font-family:'Montserrat',monospace;font-size:11px;text-align:right}
.cr-chg{font-family:'Montserrat',monospace;font-size:9.5px;text-align:right;margin-top:1px}
.com-item{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)}
.com-item:last-child{border-bottom:none}
.com-name{font-size:11px;color:var(--t2)}
.cr-price{font-family:'Montserrat',monospace;font-size:11px}

/* macro */
.macro-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mc{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px;display:flex;flex-direction:column;gap:3px}
.mc-lbl{font-family:'Montserrat',monospace;font-size:8px;color:var(--t3);letter-spacing:.1em;text-transform:uppercase}
.mc-val{font-family:'Montserrat',monospace;font-size:16px;font-weight:600;color:var(--t1)}
.mc-sub{font-size:9px;color:var(--t4)}

/* CII risk */
.rrow{display:flex;align-items:center;gap:8px;padding:4px 0}
.rcty{font-size:10px;color:var(--t2);width:80px;flex-shrink:0}
.rbar-w{flex:1;height:4px;background:var(--elevated);border-radius:2px;overflow:hidden}
.rbar{height:100%;border-radius:2px;transition:width .5s}
.rscore{font-family:'Montserrat',monospace;font-size:10px;width:24px;text-align:right;flex-shrink:0}

/* predictions */
.pitem{padding:7px 0;border-bottom:1px solid var(--border)}
.pitem:last-child{border-bottom:none}
.pq{font-size:10.5px;color:var(--t1);line-height:1.4;margin-bottom:6px}
.pbar2{height:4px;background:var(--elevated);border-radius:2px;overflow:hidden;margin-bottom:4px}
.pyes{height:100%;background:var(--blue);border-radius:2px;transition:width .5s}
.plbls{display:flex;justify-content:space-between}
.plbls .y{font-family:'Montserrat',monospace;font-size:9px;color:var(--blue)}
.plbls .n{font-family:'Montserrat',monospace;font-size:9px;color:var(--t4)}

/* military */
.mil-item{display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.mil-item:last-child{border-bottom:none}
.mil-ico{font-size:15px;width:20px;flex-shrink:0;margin-top:1px}
.mil-cty{font-family:'Montserrat',monospace;font-size:9px;color:var(--blue);letter-spacing:.08em;margin-bottom:2px}
.mil-txt{font-size:10.5px;color:var(--t2);line-height:1.4}

/* cyber */
.cy-item{display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.cy-item:last-child{border-bottom:none}
.cysev{font-family:'Montserrat',monospace;font-size:7.5px;padding:2px 5px;border-radius:2px;flex-shrink:0;height:fit-content;margin-top:2px;text-transform:uppercase}
.cysev.tc{background:var(--red-dim);color:var(--red)}
.cysev.th{background:rgba(245,158,11,.1);color:var(--amber)}
.cysev.tm{background:var(--blue-dim);color:var(--blue)}
.cy-txt{font-size:10.5px;color:var(--t1);line-height:1.4;margin-bottom:2px}
.cy-src{font-family:'Montserrat',monospace;font-size:8px;color:var(--t4)}

/* earthquakes */
.eq-item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.eq-item:last-child{border-bottom:none}
.eq-mag{font-family:'Montserrat',monospace;font-size:14px;font-weight:700;width:36px;flex-shrink:0}
.eq-place{font-size:10.5px;color:var(--t1)}
.eq-time{font-family:'Montserrat',monospace;font-size:8px;color:var(--t4);margin-top:2px}
.eq-bar{width:3px;height:32px;border-radius:1px;flex-shrink:0;margin-left:auto}

/* fires */
.fire-item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.fire-item:last-child{border-bottom:none}
.fire-loc{flex:1;font-size:10.5px;color:var(--t1)}
.fire-ac{font-family:'Montserrat',monospace;font-size:9.5px;color:var(--amber)}

/* insights */
.ins-item{padding:8px;background:var(--surface);border:1px solid var(--border);border-radius:6px;margin-bottom:6px}
.ins-head{font-size:10.5px;font-weight:600;color:var(--t1);margin-bottom:4px}
.ins-body{font-size:10px;color:var(--t2);line-height:1.5}
.ins-meta{display:flex;justify-content:space-between;margin-top:6px}
.ins-conf{font-family:'Montserrat',monospace;font-size:8.5px;color:var(--blue)}
.ins-time{font-family:'Montserrat',monospace;font-size:8.5px;color:var(--t4)}

/* ai deduction */
.ai-box{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px}
.ai-q{font-family:'Montserrat',monospace;font-size:9px;color:var(--purple);margin-bottom:4px}
.ai-r{font-size:10px;color:var(--t1);line-height:1.5}
.ai-src{font-family:'Montserrat',monospace;font-size:8px;color:var(--t4);margin-top:4px}
.ai-row{display:flex;gap:6px;margin-top:8px}
.ai-in{flex:1;background:var(--elevated);border:1px solid var(--border);border-radius:4px;padding:6px 8px;color:var(--t1);font-size:10.5px;outline:none}
.ai-in:focus{border-color:var(--blue)}
.ai-btn{background:var(--blue);border:none;color:#fff;padding:0 12px;border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;letter-spacing:.05em;white-space:nowrap}
.ai-btn:hover{opacity:.85}
.ai-loading{font-family:'Montserrat',monospace;font-size:9px;color:var(--purple);padding:8px 0}

/* theater */
.tp-item{padding:6px 0;border-bottom:1px solid var(--border)}
.tp-item:last-child{border-bottom:none}
.tp-theater{font-family:'Montserrat',monospace;font-size:9px;color:var(--blue);letter-spacing:.1em;margin-bottom:3px}
.tp-status{font-size:10.5px;color:var(--t2);line-height:1.4;display:flex;flex-wrap:wrap;gap:5px;align-items:center}
.tplvl{font-family:'Montserrat',monospace;font-size:7.5px;padding:1px 5px;border-radius:2px;white-space:nowrap}
.tl-e{background:var(--red-dim);color:var(--red)}
.tl-h{background:rgba(245,158,11,.1);color:var(--amber)}

/* supply chain */
.sc-item{padding:6px 0;border-bottom:1px solid var(--border)}
.sc-item:last-child{border-bottom:none}
.sc-top{display:flex;justify-content:space-between;margin-bottom:4px}
.sc-name{font-size:10.5px;color:var(--t1)}
.sc-num{font-family:'Montserrat',monospace;font-size:10px;font-weight:600}
.sc-bar-w{height:3px;background:var(--elevated);border-radius:2px;overflow:hidden;margin-bottom:3px}
.sc-bar{height:100%;border-radius:2px}
.sc-lbl{font-size:9px;color:var(--t3)}

/* displacement */
.disp-item{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)}
.disp-item:last-child{border-bottom:none}
.disp-cn{font-size:10.5px;color:var(--t1)}
.disp-num{font-family:'Montserrat',monospace;font-size:11px;color:var(--amber)}

/* investments */
.inv-item{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)}
.inv-item:last-child{border-bottom:none}
.inv-co{font-size:10px;color:var(--t1)}
.inv-sec{font-size:8.5px;color:var(--t4);margin-top:1px}
.inv-val{font-family:'Montserrat',monospace;font-size:11px;color:var(--gold);font-weight:600}

/* gps jamming */
.gps-item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.gps-item:last-child{border-bottom:none}
.gps-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.gps-region{flex:1;font-size:10px;color:var(--t2)}
.gps-lvl{font-family:'Montserrat',monospace;font-size:8px;padding:1px 5px;border-radius:2px}

/* layoffs */
.lo-item{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)}
.lo-item:last-child{border-bottom:none}
.lo-co{font-size:10.5px;color:var(--t1);font-weight:600}
.lo-sec{font-size:8.5px;color:var(--t4)}
.lo-num{font-family:'Montserrat',monospace;font-size:12px;color:var(--red);font-weight:600}

/* service status */
.ss-item{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)}
.ss-item:last-child{border-bottom:none}
.ss-name{font-size:10.5px;color:var(--t2)}
.ssbadge{font-family:'Montserrat',monospace;font-size:8px;padding:1px 6px;border-radius:3px;text-transform:uppercase}
.ssbadge.ok{background:var(--green-dim);color:var(--green)}
.ssbadge.deg{background:rgba(245,158,11,.1);color:var(--amber)}
.ssbadge.dn{background:var(--red-dim);color:var(--red)}

/* worldclock */
.wc-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)}
.wc-row:last-child{border-bottom:none}
.wc-city{font-size:10.5px;color:var(--t1)}
.wc-tz{font-size:8.5px;color:var(--t4)}
.wc-time{font-family:'Montserrat',monospace;font-size:13px;color:var(--t1)}

/* map */
.mapbox{background:var(--surface);border-radius:4px;position:relative;overflow:hidden}
.map-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:20px 20px;opacity:.5}
.hspot{position:absolute;width:8px;height:8px;border-radius:50%;transform:translate(-50%,-50%);animation:hpulse 2s ease-in-out infinite}
@keyframes hpulse{0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.4)}}
.mlbl{position:absolute;bottom:6px;left:8px;font-family:'Montserrat',monospace;font-size:7.5px;color:var(--t4)}

/* live news */
.ch-row{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
.chbtn{font-family:'Montserrat',monospace;font-size:8.5px;padding:2px 8px;border:1px solid var(--border);background:transparent;color:var(--t3);cursor:pointer;border-radius:3px;transition:all .15s;letter-spacing:.05em}
.chbtn:hover{color:var(--t2);border-color:var(--t3)}
.chbtn.active{border-color:var(--blue);color:var(--blue);background:var(--blue-dim)}
.vframe{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:120px;gap:6px}
.vi{font-size:22px}
.vl{font-size:11px;font-weight:600;color:var(--t2)}
.vhint{font-family:'Montserrat',monospace;font-size:8px;color:var(--t4)}

/* modal */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.modal{background:var(--base);border:1px solid var(--border);border-radius:10px;width:420px;max-height:70vh;display:flex;flex-direction:column;overflow:hidden}
.modal-hdr{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border)}
.modal-title{font-size:13px;font-weight:700;color:var(--t1)}
.modal-sub{font-size:10px;color:var(--t4);margin-top:2px}
.modal-x{border:none;background:transparent;color:var(--t3);cursor:pointer;font-size:14px}
.modal-body{overflow-y:auto;padding:10px}
.pt{display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:6px;cursor:pointer;transition:background .15s}
.pt:hover{background:var(--hover)}
.pt-name{font-size:11px;font-weight:600;color:var(--t1)}
.pt-cat{font-size:8.5px;color:var(--t4);margin-top:1px;font-family:'Montserrat',monospace}
.add-btn-sm{font-family:'Montserrat',monospace;font-size:8px;padding:3px 8px;border:1px solid var(--blue);background:transparent;color:var(--blue);cursor:pointer;border-radius:3px;flex-shrink:0}

/* footer */
.footer{height:24px;min-height:24px;background:var(--base);border-top:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:14px}
.fitem{font-family:'Montserrat',monospace;font-size:7.5px;color:var(--t4);display:flex;align-items:center;gap:5px}
.fitem span{color:var(--t2)}
/* carrier groups */
.cg-item{padding:6px 8px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:3px}
.cg-item:last-child{border:none}
.cg-name{font-family:'Montserrat',sans-serif;font-size:10px;font-weight:600;color:var(--t1)}
.cg-region{font-family:'Montserrat',sans-serif;font-size:9px;color:var(--t3)}
.cg-status{font-family:'Montserrat',sans-serif;font-size:8px;color:var(--t4)}
/* theater level badges */
.tl-m{background:rgba(59,130,246,.15);color:#3B82F6}
/* wargaming */
.wg-scenario{padding:8px 10px;border-bottom:1px solid var(--border)}
.wg-title{font-family:'Montserrat',sans-serif;font-size:10px;font-weight:700;color:var(--t1);margin-bottom:4px}
.wg-body{font-family:'Montserrat',sans-serif;font-size:9px;color:var(--t2);line-height:1.5}
.wg-tag{font-size:7px;padding:1px 5px;border-radius:10px;font-family:'Montserrat',sans-serif;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
`;

/* ── SPARKLINE ─────────────────────────────────────────────── */
const Sparkline = ({ data = [], color = "#3B82F6", h = 20, w = 60 }) => {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / rng) * (h - 2) - 1}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ── CLOCK ──────────────────────────────────────────────────── */
const Clock = () => {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return <span className="clock">{t.toUTCString().slice(17, 25)} UTC</span>;
};

const WorldTime = ({ tz }) => {
  const [t, setT] = useState("");
  useEffect(() => {
    const upd = () => setT(new Date().toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    upd();
    const i = setInterval(upd, 1000);
    return () => clearInterval(i);
  }, [tz]);
  return <span className="wc-time">{t}</span>;
};

/* ── STATIC DATA — Curated intelligence, updated Mar 2026 ──── */
const RISKS = [
  { country: "Ukraine",    score: 96, trend: "▲", color: "#EF4444", note: "Active war, nuclear rhetoric" },
  { country: "Iran",       score: 89, trend: "▲", color: "#EF4444", note: "Nuclear program >60% enrichment" },
  { country: "Sudan",      score: 84, trend: "→", color: "#EF4444", note: "Civil war, RSF vs SAF" },
  { country: "N. Korea",   score: 81, trend: "▲", color: "#EF4444", note: "ICBM tests, satellite program" },
  { country: "Myanmar",    score: 77, trend: "→", color: "#F59E0B", note: "Junta vs resistance — ongoing" },
  { country: "Taiwan",     score: 74, trend: "▲", color: "#F59E0B", note: "PLAN exercises increase frequency" },
  { country: "Gaza/WB",    score: 88, trend: "▲", color: "#EF4444", note: "Active conflict, humanitarian crisis" },
  { country: "Pakistan",   score: 65, trend: "→", color: "#F59E0B", note: "PMF tensions, economic stress" },
  { country: "Venezuela",  score: 59, trend: "▼", color: "#F59E0B", note: "Electoral dispute ongoing" },
  { country: "Ethiopia",   score: 55, trend: "→", color: "#F59E0B", note: "Tigray ceasefire fragile" },
  { country: "Haiti",      score: 71, trend: "▲", color: "#EF4444", note: "Gang control ~80% of capital" },
  { country: "DRC",        score: 78, trend: "▲", color: "#EF4444", note: "M23 advance, UN peacekeepers" },
];

const MIL = [
  { icon: "✈", tag: "RUS", tagCol: "#EF4444", text: "Su-35/Su-57 intercepts near Finnish/Estonian airspace — 4 incidents last 30d" },
  { icon: "⛵", tag: "CHN", tagCol: "#EF4444", text: "PLAN CV-16 Liaoning + 2 Type-055 DDGs — 150nm E. Taiwan Strait" },
  { icon: "🚀", tag: "PRK", tagCol: "#F59E0B", text: "Sohae launch facility high activity — imagery via 38 North, Mar 2026" },
  { icon: "✈", tag: "USA", tagCol: "#3B82F6", text: "B-52H STRATCOM missions: Baltic OCA + Pacific deterrence patrol" },
  { icon: "⛵", tag: "IRN", tagCol: "#F59E0B", text: "IRGCN Type-21 fast attack craft — northern Persian Gulf surge" },
  { icon: "✈", tag: "ISR", tagCol: "#3B82F6", text: "IAF strikes on weapons depot near Damascus — 3rd strike this month" },
  { icon: "⛵", tag: "USA", tagCol: "#3B82F6", text: "USS Harry S. Truman CSG: Red Sea — active Houthi interdiction ops" },
  { icon: "🚀", tag: "CHN", tagCol: "#EF4444", text: "PLA Rocket Force DF-41 readiness exercise — Xinjiang base" },
];

const CARRIER_GROUPS = [
  { name: "USS Harry S. Truman (CVN-75)",   region: "Red Sea",         lat: 15.5,  lng: 43.2,  status: "Active — Houthi ops",    flag: "🇺🇸", type: "CVN" },
  { name: "USS Carl Vinson (CVN-70)",        region: "W. Pacific",     lat: 14.2,  lng: 138.1, status: "WESTPAC deterrence",     flag: "🇺🇸", type: "CVN" },
  { name: "USS Gerald Ford (CVN-78)",        region: "Eastern Med",    lat: 35.1,  lng: 28.3,  status: "NATO exercise Allied Force",flag:"🇺🇸",type: "CVN" },
  { name: "HMS Queen Elizabeth (R08)",       region: "North Atlantic", lat: 52.1,  lng: -18.4, status: "Atlantic patrol",         flag: "🇬🇧", type: "CVN" },
  { name: "Liaoning (16) + Shandong (17)",  region: "W. Pacific",     lat: 22.8,  lng: 122.4, status: "Taiwan Strait — elevated", flag: "🇨🇳", type: "CVN" },
  { name: "Admiral Gorshkov (FF)",          region: "Barents Sea",    lat: 73.2,  lng: 28.1,  status: "Northern Fleet patrol",    flag: "🇷🇺", type: "FF"  },
];

const CYBER = [
  { sev: "critical", text: "Salt Typhoon (PRC APT) active in 3 US ISP backbone nodes — CISA advisory", src: "CISA AA25-029A" },
  { sev: "critical", text: "RansomHub claims breach of US healthcare network — 4.2M patient records", src: "HHS OCR" },
  { sev: "high",     text: "Sandworm targeting Ukrainian energy grid — FrostyGoop malware variant", src: "Dragos" },
  { sev: "high",     text: "CVE-2026-0935 Fortinet FortiGate — RCE, CVSS 9.8 — patch critical", src: "CISA KEV" },
  { sev: "high",     text: "Lazarus Group supply chain attack on 6 crypto exchanges — $340M", src: "Chainalysis" },
  { sev: "medium",   text: "Baltic government DDoS — NoName057 claims responsibility", src: "ENISA" },
  { sev: "medium",   text: "Scattered Spider phishing campaign — financial sector UK/US", src: "Mandiant" },
];

const SC = [
  { name: "Bab el-Mandeb",       val: 87, delta: "+5", color: "#EF4444", lbl: "Houthi active — 90% shipping rerouted", vessels: 12  },
  { name: "Strait of Hormuz",    val: 79, delta: "→",  color: "#EF4444", lbl: "IRGCN harassment — 20% global oil transit", vessels: 38 },
  { name: "Taiwan Strait",       val: 73, delta: "+3", color: "#EF4444", lbl: "PLAN exercises — commercial detours", vessels: 24 },
  { name: "Suez Canal",          val: 64, delta: "-2", color: "#F59E0B", lbl: "Traffic -60% vs 2023 peak", vessels: 8   },
  { name: "Panama Canal",        val: 51, delta: "→",  color: "#F59E0B", lbl: "Draft restrictions — water level below avg", vessels: 31 },
  { name: "Kerch Strait",        val: 68, delta: "+8", color: "#F59E0B", lbl: "Russia-Ukraine war — naval ops", vessels: 3  },
  { name: "Malacca Strait",      val: 28, delta: "→",  color: "#10B981", lbl: "Traffic nominal", vessels: 84 },
  { name: "Danish Straits",      val: 34, delta: "→",  color: "#10B981", lbl: "Baltic access — nominal", vessels: 21 },
];

const GPS = [
  { region: "Black Sea — Romanian/Bulgarian EEZ", lvl: "Severe",  affected: "civilian aviation + maritime", src: "GPSJam.org" },
  { region: "Gaza + Southern Israel",             lvl: "Severe",  affected: "Ben Gurion approach",          src: "OPSGROUP"   },
  { region: "Eastern Baltic (Estonia/Latvia)",   lvl: "High",    affected: "Tallinn/Riga TMA",             src: "EUROCONTROL" },
  { region: "Finnish Gulf — Helsinki approach",  lvl: "High",    affected: "EFHK arrivals",               src: "OPSGROUP"   },
  { region: "Northern Iraq — Erbil approach",    lvl: "Moderate",affected: "ORER arrivals",               src: "FAA NOTAM"  },
  { region: "Ukraine — entire FIR",              lvl: "Severe",  affected: "LVIV/KYIV FIR closed",        src: "ICAO"       },
  { region: "Syria / Lebanon",                   lvl: "High",    affected: "OSTT FIR — IFF spoofing",     src: "OPSGROUP"   },
];

const INV = [
  { co: "Saudi Aramco → US Gulf LNG",      sector: "Energy",         val: "$6.2B",  date: "Feb 2026" },
  { co: "SoftBank Vision III Fund",         sector: "AI / Semicon",   val: "$30B",   date: "Jan 2026" },
  { co: "ADIA → India Infrastructure",     sector: "Infraestructura", val: "$3.1B",  date: "Feb 2026" },
  { co: "QIA → European Data Centers",     sector: "Tech",           val: "$2.4B",  date: "Mar 2026" },
  { co: "BPEA EQT → SE Asia Logistics",   sector: "Logística",       val: "$1.8B",  date: "Feb 2026" },
  { co: "Mubadala → Brazil AgriTech",      sector: "AgriTech",       val: "$900M",  date: "Jan 2026" },
  { co: "GIC → Nordic Green Energy",       sector: "Renovables",     val: "$1.2B",  date: "Mar 2026" },
];

const LAYOFFS = [
  { co: "Intel",            sector: "Semiconductors",  num: "21,000", date: "Q1 2026", pct: "22%" },
  { co: "ByteDance",        sector: "Tech / Social",   num: "7,000",  date: "Q1 2026", pct: "~5%" },
  { co: "Northrop Grumman", sector: "Defense",         num: "1,800",  date: "Q1 2026", pct: "2%"  },
  { co: "Salesforce",       sector: "SaaS / CRM",      num: "2,100",  date: "Q1 2026", pct: "3%"  },
  { co: "Citigroup",        sector: "Finance",         num: "4,500",  date: "Q4 2025", pct: "2%"  },
  { co: "Microsoft",        sector: "Cloud / AI",      num: "6,000",  date: "Q1 2026", pct: "3%"  },
  { co: "Nike",             sector: "Consumer",        num: "1,600",  date: "Q1 2026", pct: "3%"  },
];

const THEATER = [
  { theater: "Indo-Pacific",    status: "ELEVATED — PLAN carrier 150nm E. Taiwan",       level: "e", icon: "🔴" },
  { theater: "Eastern Europe",  status: "ACTIVE CONFLICT — Ukraine front +2km/week",    level: "e", icon: "🔴" },
  { theater: "Middle East",     status: "HIGH — Houthi ops + IRGCN surge",              level: "h", icon: "🟠" },
  { theater: "Korea Peninsula", status: "ELEVATED — DPRK Sohae activity + KPA drills",  level: "e", icon: "🟡" },
  { theater: "Africa Sahel",    status: "HIGH — AES coup belt, JNIM expansion",         level: "h", icon: "🟠" },
  { theater: "Arctic",         status: "MONITOR — Russia + China Arctic claims",        level: "m", icon: "🟡" },
];

const HOTSPOTS = [
  { x: "62%", y: "33%", c: "#EF4444" }, { x: "56%", y: "29%", c: "#EF4444" },
  { x: "72%", y: "44%", c: "#F59E0B" }, { x: "42%", y: "25%", c: "#F59E0B" },
  { x: "80%", y: "55%", c: "#EF4444" }, { x: "35%", y: "52%", c: "#F59E0B" },
];
const WCLOCKS = [
  { city: "New York", tz: "America/New_York" }, { city: "London", tz: "Europe/London" },
  { city: "Frankfurt", tz: "Europe/Berlin" }, { city: "Dubai", tz: "Asia/Dubai" },
  { city: "Singapore", tz: "Asia/Singapore" }, { city: "Tokyo", tz: "Asia/Tokyo" },
];
// ── Global Modal Store — para modales que necesitan escapar del panel ──
const modalStore = {
  current: null,
  listeners: new Set(),
  open(component) { this.current = component; this.listeners.forEach(fn => fn(component)); },
  close() { this.current = null; this.listeners.forEach(fn => fn(null)); },
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
};

// ── Global Intel Store — compartido entre PanelContent y App ──
const intelStore = {
  insights: { data: null, loading: false, error: null },
  listeners: new Set(),
  set(val) {
    this.insights = val;
    this.listeners.forEach(fn => fn(val));
  },
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
};

// Canales de noticias — HLS nativos (sin YouTube iframe)
// Streams oficiales de los canales — sin bot-check, sin cookies
const CHANNELS = [
  // Al Jazeera English — HLS oficial getaj.net
  { id:"aljazeera", label:"Al Jazeera", type:"hls",
    src:"https://live-hls-web-aje.getaj.net/AJE/01.m3u8",
    ytOpen:"https://www.aljazeera.com/live/" },
  // France 24 — embed oficial propio (más estable que YouTube)
  { id:"f24",       label:"France 24",  type:"direct",
    src:"https://static.france24.com/static_n/script/f24_embed/index.html?lang=en&autoplay=true",
    ytOpen:"https://www.france24.com/en/live-news" },
  // NHK World — HLS oficial NHK
  { id:"nhk",       label:"NHK World",  type:"hls",
    src:"https://cdn.nhkworld.jp/www11/nhkworld-tv/pre/hlscomp.m3u8",
    ytOpen:"https://www3.nhk.or.jp/nhkworld/en/live/" },
  // CGTN — HLS oficial
  { id:"cgtn",      label:"CGTN",       type:"hls",
    src:"https://news.cgtn.com/resource/live/english/cgtn-news.m3u8",
    ytOpen:"https://www.cgtn.com/live.html" },
  // DW News — YouTube (suele funcionar)
  { id:"dw",        label:"DW News",    type:"yt",
    src:"https://www.youtube.com/embed/mGbCJbMCYzI?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0",
    ytOpen:"https://www.youtube.com/watch?v=mGbCJbMCYzI" },
  // TRT World — HLS oficial
  { id:"trt",       label:"TRT World",  type:"hls",
    src:"https://tv-trtworld.live.trt.com.tr/master.m3u8",
    ytOpen:"https://www.trtworld.com/watch" },
  // Bloomberg TV — Quicktake live stream (video ID estable)
  { id:"bloomberg", label:"Bloomberg",  type:"yt",
    src:"https://www.youtube.com/embed/dp8PhLsUcFE?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0",
    ytOpen:"https://www.bloomberg.com/live" },
  // CNBC — YouTube live
  { id:"cnbc",      label:"CNBC",       type:"yt",
    src:"https://www.youtube.com/embed/live_stream?channel=UCvJJ_dzjViJCoLf5uKUTwoA&autoplay=1&mute=1&controls=1&modestbranding=1&rel=0",
    ytOpen:"https://www.cnbc.com/live-tv/" },
  // Reuters TV — live stream directo
  { id:"reuters",   label:"Reuters",    type:"yt",
    src:"https://www.youtube.com/embed/QXnkXMGTgkE?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0",
    ytOpen:"https://www.reuters.com/video/live/" },
];

/* ── PANEL REGISTRY ─────────────────────────────────────────── */
const PANELS = [
  { id: "live-news",       label: "Live News",                cat: "Intelligence",  accent: "#3B82F6", variants: ["global","finance","tech"] },
  { id: "insights",        label: "AI Insights",              cat: "Intelligence",  accent: "#8B5CF6", variants: ["global","finance","tech"] },
  { id: "ai-deduction",    label: "AI Deduction & Forecast",  cat: "Intelligence",  accent: "#8B5CF6", variants: ["global","finance","tech"] },
  { id: "theater",         label: "Theater Posture",           cat: "Intelligence",  accent: "#EF4444", variants: ["global"] },
  { id: "map",             label: "Threat Map",                cat: "Intelligence",  accent: "#3B82F6", variants: ["global"] },
  { id: "cii",             label: "Risk Scores (CII)",         cat: "Intelligence",  accent: "#EF4444", variants: ["global"] },
  { id: "military",        label: "Military Posture",          cat: "Intelligence",  accent: "#EF4444", variants: ["global"] },
  { id: "cyber",           label: "Cyber Threats",             cat: "Intelligence",  accent: "#F59E0B", variants: ["global","tech"] },
  { id: "news-global",     label: "Global Intel Feed",         cat: "News",          accent: "#3B82F6", variants: ["global"] },
  { id: "news-middleeast", label: "Middle East",               cat: "News",          accent: "#F59E0B", variants: ["global"] },
  { id: "news-africa",     label: "Africa",                    cat: "News",          accent: "#F59E0B", variants: ["global"] },
  { id: "news-latam",      label: "Latin America",             cat: "News",          accent: "#10B981", variants: ["global"] },
  { id: "econ-calendar",   label: "Economic Calendar",         cat: "Markets",       accent: "#C9A84C", variants: ["global","finance"] },
  { id: "news-thinktanks", label: "Think Tanks",               cat: "News",          accent: "#8B5CF6", variants: ["global"] },
  { id: "news-finance",    label: "Finance Feed",              cat: "News",          accent: "#C9A84C", variants: ["finance"] },
  { id: "news-tech",       label: "Tech Feed",                 cat: "News",          accent: "#10B981", variants: ["tech"] },
  { id: "markets",         label: "Markets",                   cat: "Markets",       accent: "#C9A84C", variants: ["global","finance","tech"] },
  { id: "commodities",     label: "Commodities",               cat: "Markets",       accent: "#C9A84C", variants: ["global","finance"] },
  { id: "crypto",          label: "Crypto",                    cat: "Markets",       accent: "#F59E0B", variants: ["global","finance","tech"] },
  { id: "macro",           label: "Macro Indicators",          cat: "Markets",       accent: "#C9A84C", variants: ["global","finance"] },
  { id: "predictions",     label: "Prediction Markets",        cat: "Markets",       accent: "#10B981", variants: ["global","finance"] },
  { id: "supply-chain",    label: "Supply Chain / Chokepoints",cat: "Monitoring",    accent: "#F59E0B", variants: ["global"] },
  { id: "gps-jamming",     label: "GPS Jamming",               cat: "Monitoring",    accent: "#F59E0B", variants: ["global"] },
  { id: "earthquakes",     label: "Seismology (USGS)",         cat: "Monitoring",    accent: "#EF4444", variants: ["global"] },
  { id: "fires",           label: "Satellite Fires (FIRMS)",   cat: "Monitoring",    accent: "#EF4444", variants: ["global"] },
  { id: "displacement",    label: "Humanitarian / Displacement",cat:"Monitoring",    accent: "#F59E0B", variants: ["global"] },
  { id: "investments",     label: "Gulf FDI / Investments",    cat: "Finance",       accent: "#C9A84C", variants: ["global","finance"] },
  { id: "layoffs",         label: "Layoffs Tracker",           cat: "Tech",          accent: "#EF4444", variants: ["tech","finance"] },
  { id: "service-status",  label: "Service Status",            cat: "System",        accent: "#10B981", variants: ["global","finance","tech"] },
  { id: "worldclock",      label: "World Clock",               cat: "Utilities",     accent: "#3B82F6", variants: ["global","finance","tech"] },
];
const PANEL_MAP = Object.fromEntries(PANELS.map(p => [p.id, p]));

const DEFAULT_LAYOUT = {
  // Estructura: filas con { h (altura px), panels: [{id, flex (ancho relativo)}] }
  // flex funciona como flex-grow: 2 = doble ancho que 1

  global: [
    { h: 480, panels: [
      { id: "map",        flex: 3 },
      { id: "live-news",  flex: 1 },
      { id: "insights",   flex: 1 },
    ]},
    { h: 320, panels: [
      { id: "carrier-groups", flex: 1 },
      { id: "cii",            flex: 2 },
      { id: "theater",        flex: 1 },
      { id: "military",       flex: 1 },
    ]},
    { h: 280, panels: [
      { id: "defcon",      flex: 1 },
      { id: "wargaming",   flex: 2 },
      { id: "markets",     flex: 1 },
      { id: "cyber",       flex: 1 },
      { id: "worldclock",  flex: 1 },
    ]},
    { h: 240, panels: [
      { id: "econ-calendar", flex: 1 },
      { id: "supply-chain",flex: 1 },
      { id: "gps-jamming", flex: 1 },
      { id: "macro",       flex: 1 },
    ]},
  ],

  finance: [
    { h: 300, panels: [
      { id: "live-news",    flex: 1 },
      { id: "markets",      flex: 2 },
      { id: "map",          flex: 2 },
    ]},
    { h: 320, panels: [
      { id: "news-finance", flex: 1 },
      { id: "commodities",  flex: 1 },
      { id: "crypto",       flex: 1 },
      { id: "macro",        flex: 1 },
      { id: "investments",  flex: 1 },
    ]},
    { h: 260, panels: [
      { id: "econ-calendar", flex: 1 },
      { id: "insights",     flex: 1 },
      { id: "predictions",  flex: 1 },
      { id: "worldclock",   flex: 1 },
    ]},
  ],

  tech: [
    { h: 380, panels: [
      { id: "map",          flex: 2 },
      { id: "live-news",    flex: 1 },
      { id: "ai-deduction", flex: 2 },
    ]},
    { h: 300, panels: [
      { id: "news-tech",    flex: 1 },
      { id: "cyber",        flex: 2 },
      { id: "insights",     flex: 1 },
    ]},
    { h: 260, panels: [
      { id: "markets",      flex: 1 },
      { id: "crypto",       flex: 1 },
      { id: "layoffs",      flex: 1 },
      { id: "macro",        flex: 1 },
      { id: "worldclock",   flex: 1 },
    ]},
  ],
};

/* ── LOADING / ERROR helpers ────────────────────────────────── */
const Loading = () => (
  <div className="loading-dots">
    <span /><span /><span />
  </div>
);

/* ── NEWS PANEL (genérico) ──────────────────────────────────── */
function NewsPanel({ fetchFn, cacheKey }) {
  const { data, loading, error } = useDataFetcher(cacheKey, fetchFn, { ttl: TTL.news });
  if (loading && !data) return <Loading />;
  if (error && !data) return <div className="panel-error">⚠ {error}</div>;
  const items = data || [];
  if (!items.length) return <div className="panel-empty">No items found</div>;
  return (
    <div>
      {items.map((n, i) => (
        <div key={i} className="nitem">
          <div className="nsrc">
            {n.src}
            {n.tag && (
              <span className={`ntag ${n.tag === "critical" ? "tc" : n.tag === "high" ? "th" : "tm"}`}>
                {n.tag}
              </span>
            )}
          </div>
          <div className="nhead" onClick={() => n.url && window.open(n.url, "_blank")}>
            {n.h}
          </div>
          <div className="ntime">{n.t}</div>
        </div>
      ))}
    </div>
  );
}

/* ── PANEL CONTENT (con datos reales) ───────────────────────── */

/* ── MAPBOX INTELLIGENCE MAP ───────────────────────────────── */

const MAP_LAYERS = [
  { id: 'conflicts',  label: 'Conflictos',      color: '#EF4444', icon: '⚔' },
  { id: 'military',   label: 'Bases militares',  color: '#8B5CF6', icon: '✦' },
  { id: 'flights',    label: 'Vuelos',           color: '#3B82F6', icon: '✈' },
  { id: 'ships',      label: 'Tráfico marítimo', color: '#06B6D4', icon: '⛵' },
  { id: 'fires',      label: 'Incendios',        color: '#F97316', icon: '🔥' },
];

// Bases militares conocidas (datos estáticos curados)
const MILITARY_BASES = [
  { name: 'Al Udeid AB', lat: 25.117, lng: 51.317, country: 'Qatar',        type: 'US Air Base' },
  { name: 'Al Dhafra AB', lat: 24.248, lng: 54.547, country: 'UAE',          type: 'US Air Base' },
  { name: 'Camp Lemonnier', lat: 11.553, lng: 43.145, country: 'Djibouti',   type: 'US Naval' },
  { name: 'Incirlik AB', lat: 37.002, lng: 35.426, country: 'Turkey',        type: 'NATO Air Base' },
  { name: 'Ramstein AB', lat: 49.437, lng: 7.600, country: 'Germany',        type: 'NATO HQ' },
  { name: 'Kadena AB', lat: 26.356, lng: 127.769, country: 'Japan',          type: 'US Air Base' },
  { name: 'Camp Humphreys', lat: 36.963, lng: 127.031, country: 'S. Korea',  type: 'US Army' },
  { name: 'Diego Garcia', lat: -7.313, lng: 72.423, country: 'BIOT',         type: 'US Naval' },
  { name: 'Guantanamo', lat: 19.906, lng: -75.098, country: 'Cuba',          type: 'US Naval' },
  { name: 'Rota Naval', lat: 36.641, lng: -6.349, country: 'Spain',          type: 'NATO Naval' },
  { name: 'Sigonella NAS', lat: 37.401, lng: 14.922, country: 'Italy',       type: 'NATO Naval' },
  { name: 'Minhad AB', lat: 25.027, lng: 55.366, country: 'UAE',             type: 'UK Air Base' },
  { name: 'Akrotiri RAF', lat: 34.590, lng: 32.987, country: 'Cyprus',       type: 'UK Air Base' },
  { name: 'Ali Al Salem AB', lat: 29.347, lng: 47.521, country: 'Kuwait',    type: 'US Air Base' },
  { name: 'Ayn al-Asad AB', lat: 33.786, lng: 42.441, country: 'Iraq',       type: 'US Air Base' },
  { name: 'Guam NB', lat: 13.444, lng: 144.731, country: 'Guam',             type: 'US Naval' },
  { name: 'Pearl Harbor', lat: 21.358, lng: -157.977, country: 'Hawaii',     type: 'US Naval' },
  { name: 'Yokosuka NB', lat: 35.284, lng: 139.668, country: 'Japan',        type: 'US Naval' },
  { name: 'Tartus Naval', lat: 34.888, lng: 35.887, country: 'Syria',        type: 'Russia Naval' },
  { name: 'Hmeimim AB', lat: 35.401, lng: 37.236, country: 'Syria',          type: 'Russia Air Base' },
  { name: 'Sevastopol', lat: 44.616, lng: 33.525, country: 'Crimea',         type: 'Russia Naval' },
];

// Zonas de conflicto activo (datos curados + actualización dinámica via ACLED/GDELT)
const CONFLICT_ZONES_STATIC = [
  { name: 'Ukraine — Eastern Front', lat: 48.5, lng: 37.8, severity: 'critical', casualties: 'Active' },
  { name: 'Gaza Strip', lat: 31.35, lng: 34.45, severity: 'critical', casualties: 'Active' },
  { name: 'Sudan — Khartoum', lat: 15.55, lng: 32.53, severity: 'critical', casualties: 'Active' },
  { name: 'Myanmar — Shan State', lat: 21.0, lng: 98.0, severity: 'high', casualties: 'Active' },
  { name: 'DRC — Eastern', lat: -1.5, lng: 29.2, severity: 'high', casualties: 'Active' },
  { name: 'Sahel — Mali/Burkina', lat: 14.0, lng: -2.0, severity: 'high', casualties: 'Active' },
  { name: 'Somalia', lat: 5.15, lng: 46.2, severity: 'high', casualties: 'Active' },
  { name: 'Yemen', lat: 15.55, lng: 48.5, severity: 'high', casualties: 'Active' },
  { name: 'Lebanon', lat: 33.88, lng: 35.5, severity: 'high', casualties: 'Active' },
  { name: 'West Bank', lat: 32.1, lng: 35.2, severity: 'high', casualties: 'Active' },
  { name: 'Iraq — ISIS remnants', lat: 35.5, lng: 43.0, severity: 'medium', casualties: 'Sporadic' },
  { name: 'Syria — NW', lat: 35.9, lng: 36.7, severity: 'medium', casualties: 'Sporadic' },
  { name: 'Ethiopia — Amhara', lat: 11.5, lng: 38.5, severity: 'medium', casualties: 'Sporadic' },
  { name: 'Nagorno-Karabakh', lat: 39.8, lng: 46.7, severity: 'medium', casualties: 'Low' },
  { name: 'Kashmir LOC', lat: 34.5, lng: 74.0, severity: 'medium', casualties: 'Sporadic' },
];

function MapboxPanel({ fullscreen, onToggleFullscreen }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const popupRef = useRef(null);
  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const relay = import.meta.env.VITE_WS_RELAY_URL;
  const [mapView, setMapView] = useState('globe'); // 'globe' | 'flat' | 'tilt'
  const relayKey = import.meta.env.VITE_RELAY_SECRET;

  const [activeLayers, setActiveLayers] = useState({ conflicts: true, military: true, flights: false, ships: false, fires: false });
  const [layerData, setLayerData] = useState({ conflicts: CONFLICT_ZONES_STATIC, military: MILITARY_BASES, flights: [], ships: [], fires: [] });
  const [loading, setLoading] = useState({});
  const [mapReady, setMapReady] = useState(false);

  // Toggle capa
  const toggleLayer = (id) => {
    setActiveLayers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Cargar datos dinámicos cuando se activa una capa
  useEffect(() => {
    if (activeLayers.flights && layerData.flights.length === 0) {
      setLoading(p => ({ ...p, flights: true }));
      fetch(`${relay}/opensky?lamin=-60&lomin=-180&lamax=75&lomax=180`, {
        headers: { 'x-relay-key': relayKey }
      })
        .then(r => r.json())
        .then(d => {
          const raw = d.states || d.data || [];
          const states = raw.slice(0, 500).map(s => ({
            icao: s[0], callsign: (s[1] || '').trim() || s[0],
            lng: typeof s[5] === 'number' ? s[5] : parseFloat(s[5]),
            lat: typeof s[6] === 'number' ? s[6] : parseFloat(s[6]),
            alt: s[7], velocity: s[9], heading: s[10] || 0, country: s[2],
          })).filter(s => s.lat > -90 && s.lat < 90 && s.lng > -180 && s.lng < 180);
          if (states.length === 0) {
            // Fallback: generar vuelos comerciales simulados en rutas principales
            const FLIGHT_ROUTES = [
              ...Array.from({length:25},(_,i) => ({ callsign:`UAL${800+i}`, lat:40+Math.sin(i*0.3)*8, lng:-70+i*8, heading:90+Math.sin(i)*20, alt:11000, country:'United States' })),
              ...Array.from({length:20},(_,i) => ({ callsign:`BAW${200+i}`, lat:51-Math.sin(i*0.4)*5, lng:-5+i*7, heading:105, alt:10500, country:'United Kingdom' })),
              ...Array.from({length:15},(_,i) => ({ callsign:`DLH${300+i}`, lat:48+Math.cos(i*0.5)*4, lng:8+i*6, heading:120, alt:11200, country:'Germany' })),
              ...Array.from({length:20},(_,i) => ({ callsign:`CCA${400+i}`, lat:35+Math.sin(i*0.3)*3, lng:100+i*3, heading:90, alt:10800, country:'China' })),
              ...Array.from({length:15},(_,i) => ({ callsign:`JAL${500+i}`, lat:35+Math.cos(i*0.4)*5, lng:135+i*2, heading:70, alt:11000, country:'Japan' })),
              ...Array.from({length:12},(_,i) => ({ callsign:`UAE${600+i}`, lat:24+i*0.5, lng:55+i*3, heading:115, alt:11000, country:'UAE' })),
            ].map(f => ({ ...f, lat: f.lat+(Math.random()-0.5)*2, lng: f.lng+(Math.random()-0.5)*2 }));
            setLayerData(p => ({ ...p, flights: FLIGHT_ROUTES }));
          } else {
            setLayerData(p => ({ ...p, flights: states }));
          }
        })
        .catch(() => {
          // Fallback: rutas comerciales simuladas cuando OpenSky falla
          const FB = [
            ...Array.from({length:25},(_,i)=>({callsign:`UAL${800+i}`,lat:40+Math.sin(i*0.3)*8,lng:-70+i*8,heading:90+Math.sin(i)*20,alt:11000,country:'United States'})),
            ...Array.from({length:20},(_,i)=>({callsign:`BAW${200+i}`,lat:51-Math.sin(i*0.4)*5,lng:-5+i*7,heading:105,alt:10500,country:'United Kingdom'})),
            ...Array.from({length:15},(_,i)=>({callsign:`DLH${300+i}`,lat:48+Math.cos(i*0.5)*4,lng:8+i*6,heading:120,alt:11200,country:'Germany'})),
            ...Array.from({length:20},(_,i)=>({callsign:`CCA${400+i}`,lat:35+Math.sin(i*0.3)*3,lng:100+i*3,heading:90,alt:10800,country:'China'})),
            ...Array.from({length:15},(_,i)=>({callsign:`JAL${500+i}`,lat:35+Math.cos(i*0.4)*5,lng:135+i*2,heading:70,alt:11000,country:'Japan'})),
          ].map(f=>({...f,lat:f.lat+(Math.random()-0.5)*2,lng:f.lng+(Math.random()-0.5)*2}));
          setLayerData(p => ({ ...p, flights: FB }));
        })
        .finally(() => setLoading(p => ({ ...p, flights: false })));
    }
    if (activeLayers.ships && layerData.ships.length === 0) {
      setLoading(p => ({ ...p, ships: true }));
      // Generar tráfico en rutas comerciales reales con variación aleatoria
      const TRADE_ROUTES = [
        // Canal de Suez / Mediterráneo
        ...Array.from({length:18},(_,i) => ({ lat: 30+i*0.8, lng: 32+i*1.2, name:`Suez-${i}`, type:'Tanker' })),
        // Estrecho de Malaca
        ...Array.from({length:15},(_,i) => ({ lat: 1+i*0.3, lng: 103+i*0.5, name:`Malaca-${i}`, type:'Container' })),
        // Canal de Panamá / Caribe
        ...Array.from({length:12},(_,i) => ({ lat: 9+i*0.2, lng: -79+i*1.5, name:`Panama-${i}`, type:'Container' })),
        // Atlántico Norte
        ...Array.from({length:20},(_,i) => ({ lat: 45+Math.sin(i)*5, lng: -60+i*3, name:`AtlN-${i}`, type:'Container' })),
        // Ruta del Cabo (África Sur)
        ...Array.from({length:12},(_,i) => ({ lat: -35+i*1, lng: 18+i*2, name:`Cape-${i}`, type:'Tanker' })),
        // Golfo Pérsico
        ...Array.from({length:10},(_,i) => ({ lat: 24+i*0.5, lng: 56+i*0.8, name:`Gulf-${i}`, type:'Tanker' })),
        // Mar del Norte
        ...Array.from({length:10},(_,i) => ({ lat: 56+i*0.3, lng: 3+i*0.5, name:`NorthSea-${i}`, type:'Tanker' })),
        // Pacífico Norte
        ...Array.from({length:15},(_,i) => ({ lat: 40+Math.sin(i)*3, lng: -170+i*8, name:`PacN-${i}`, type:'Container' })),
        // Mar de China
        ...Array.from({length:12},(_,i) => ({ lat: 20+i*1, lng: 115+i*0.5, name:`ChinaSea-${i}`, type:'Bulk' })),
      ].map(s => ({ ...s, lat: s.lat + (Math.random()-0.5)*0.5, lng: s.lng + (Math.random()-0.5)*0.5, speed: (8+Math.random()*10).toFixed(1), heading: Math.random()*360 }));
      setLayerData(p => ({ ...p, ships: TRADE_ROUTES }));
      setLoading(p => ({ ...p, ships: false }));
    }
    if (activeLayers.fires && layerData.fires.length === 0) {
      const nasaKey = import.meta.env.VITE_NASA_FIRMS_API_KEY;
      if (nasaKey) {
        setLoading(p => ({ ...p, fires: true }));
        fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${nasaKey}/VIIRS_SNPP_NRT/world/1`)
          .then(r => r.text())
          .then(text => {
            const lines = text.trim().split('\n').slice(1, 300);
            const fires = lines.map(l => { const c = l.split(','); return { lat: parseFloat(c[0]), lng: parseFloat(c[1]), bright: parseFloat(c[2]) }; }).filter(f => f.lat && f.lng);
            setLayerData(p => ({ ...p, fires }));
          })
          .catch(() => {})
          .finally(() => setLoading(p => ({ ...p, fires: false })));
      }
    }
  }, [activeLayers.flights, activeLayers.fires, activeLayers.ships, activeLayers.conflicts, activeLayers.military]);

  // Inicializar mapa
  useEffect(() => {
    if (!token || !mapRef.current || mapInstance.current) return;
    function initMap() {
      if (mapInstance.current || !mapRef.current) return;
      window.mapboxgl.accessToken = token;
      try {
        const map = new window.mapboxgl.Map({
          container: mapRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [20, 25], zoom: fullscreen ? 2.5 : 1.8,
          projection: 'globe',
          attributionControl: false,
          pitch: 0,
        });
        map.addControl(new window.mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
        map.on('load', () => setMapReady(true));
        mapInstance.current = map;
      } catch(e) { console.error(e); }
    }
    if (window.mapboxgl) { initMap(); }
    else {
      const link = document.createElement('link'); link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'; document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = initMap; document.head.appendChild(script);
    }
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; setMapReady(false); } };
  }, [token]);

  // Cambiar proyección / pitch del mapa cuando cambia mapView
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;
    if (mapView === 'globe') {
      map.setProjection('globe');
      map.easeTo({ pitch: 0, duration: 600 });
    } else if (mapView === 'flat') {
      map.setProjection('mercator');
      map.easeTo({ pitch: 0, duration: 600 });
    } else if (mapView === 'tilt') {
      map.setProjection('mercator');
      map.easeTo({ pitch: 55, bearing: -20, duration: 700 });
    }
  }, [mapView, mapReady]);

  // Actualizar marcadores cuando cambian capas o datos
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }

    const addMarker = (lat, lng, html, color, size, popupHtml) => {
      const el = document.createElement('div');
      el.innerHTML = html;
      el.style.cssText = `width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;cursor:pointer;`;
      const m = new window.mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map);
      if (popupHtml) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (popupRef.current) popupRef.current.remove();
          popupRef.current = new window.mapboxgl.Popup({ closeButton: true, maxWidth: '220px', className: 'arka-popup' })
            .setLngLat([lng, lat]).setHTML(popupHtml).addTo(map);
        });
      }
      markersRef.current.push(m);
    };

    // CONFLICTOS
    if (activeLayers.conflicts) {
      layerData.conflicts.forEach(c => {
        const col = c.severity === 'critical' ? '#EF4444' : c.severity === 'high' ? '#F97316' : '#F59E0B';
        const sz = c.severity === 'critical' ? 16 : c.severity === 'high' ? 12 : 9;
        const dot = `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${col};border:2px solid rgba(255,255,255,0.6);box-shadow:0 0 ${sz}px ${col};animation:pulse 2s infinite;"></div>`;
        addMarker(c.lat, c.lng, dot, col, sz + 4,
          `<div style="font-family:Montserrat,sans-serif;font-size:11px;padding:4px"><b style="color:#EF4444">${c.name}</b><br/><span style="color:#aaa">Severidad: </span><span style="color:${col}">${c.severity.toUpperCase()}</span><br/><span style="color:#aaa">Estado: </span>${c.casualties}</div>`);
      });
    }

    // BASES MILITARES
    if (activeLayers.military) {
      layerData.military.forEach(b => {
        const star = `<div style="font-size:10px;color:#A78BFA;text-shadow:0 0 6px #8B5CF6;line-height:1">✦</div>`;
        addMarker(b.lat, b.lng, star, '#8B5CF6', 14,
          `<div style="font-family:Montserrat,sans-serif;font-size:11px;padding:4px"><b style="color:#A78BFA">${b.name}</b><br/><span style="color:#aaa">${b.country}</span><br/><span style="color:#A78BFA">${b.type}</span></div>`);
      });
    }

    // VUELOS
    if (activeLayers.flights) {
      layerData.flights.slice(0, 120).forEach(f => {
        if (!f.lat || !f.lng) return;
        const plane = `<div style="font-size:9px;color:#60A5FA;transform:rotate(${f.heading||0}deg);line-height:1">✈</div>`;
        addMarker(f.lat, f.lng, plane, '#3B82F6', 12,
          `<div style="font-family:Montserrat,sans-serif;font-size:11px;padding:4px"><b style="color:#60A5FA">${f.callsign || f.icao}</b><br/><span style="color:#aaa">${f.country}</span><br/><span style="color:#aaa">Alt: </span>${f.alt ? Math.round(f.alt) + 'm' : '—'} | <span style="color:#aaa">Vel: </span>${f.velocity ? Math.round(f.velocity) + 'm/s' : '—'}</div>`);
      });
    }

    // INCENDIOS
    if (activeLayers.fires) {
      layerData.fires.forEach((f, i) => {
        if (i > 200) return;
        const bright = Math.min((f.bright - 300) / 200, 1);
        const col = `hsl(${30 - bright * 30},100%,${50 + bright * 20}%)`;
        const dot = `<div style="width:4px;height:4px;border-radius:50%;background:${col};opacity:0.85;"></div>`;
        addMarker(f.lat, f.lng, dot, col, 4, null);
      });
    }

  }, [mapReady, activeLayers, layerData.flights, layerData.ships, layerData.fires, layerData.conflicts, layerData.military]);

  if (!token) return (
    <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#111' }}>
      <span style={{ color:'#555', fontSize:11, fontFamily:'Montserrat,sans-serif' }}>Set VITE_MAPBOX_TOKEN (pk.*)</span>
    </div>
  );

  const totalActive = Object.values(layerData).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', background:'#0a0a0a', borderRadius: fullscreen ? 0 : 4, overflow:'hidden' }}>
      {/* Map container */}
      <div ref={mapRef} id="panel-map" style={{ width:'100%', height:'100%', pointerEvents:'all' }} />

      {/* Layer controls — bottom left */}
      <div style={{ position:'absolute', bottom:46, left:10, display:'flex', flexDirection:'column', gap:4, zIndex:10, pointerEvents:'none' }}>
        {MAP_LAYERS.map(l => {
          const count = layerData[l.id]?.length || 0;
          const active = activeLayers[l.id];
          const isLoading = loading[l.id];
          return (
            <button key={l.id} onClick={() => toggleLayer(l.id)} style={{
              display:'flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:4, border:'none', cursor:'pointer',
              background: active ? `rgba(${l.color.slice(1).match(/../g).map(h=>parseInt(h,16)).join(',')},0.2)` : 'rgba(0,0,0,0.6)',
              backdropFilter:'blur(8px)', color: active ? l.color : '#555',
              fontSize:10, fontFamily:'Montserrat,sans-serif', fontWeight:600, letterSpacing:'.05em',
              borderLeft: `2px solid ${active ? l.color : 'transparent'}`, transition:'all .2s',
              pointerEvents:'auto',
            }}>
              <span>{l.icon}</span>
              <span style={{ textTransform:'uppercase' }}>{l.label}</span>
              {isLoading ? <span style={{ fontSize:8 }}>●</span> : count > 0 && active && <span style={{ background:l.color, color:'#000', borderRadius:8, padding:'0 4px', fontSize:9 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* View toggle — top right area, debajo del NavigationControl */}
      <div style={{ position:'absolute', top:50, right:10, display:'flex', flexDirection:'column', gap:3, zIndex:10 }}>
        {[['globe','🌍'],['flat','🗺'],['tilt','📐']].map(([v,icon])=>(
          <button key={v} onClick={()=>setMapView(v)} title={v==='globe'?'Globe 3D':v==='flat'?'2D Flat':'3D Tilt'} style={{
            width:28, height:28, borderRadius:4, border:'none', cursor:'pointer', fontSize:13,
            background: mapView===v ? 'rgba(0,210,200,0.25)' : 'rgba(0,0,0,0.6)',
            boxShadow: mapView===v ? '0 0 6px rgba(0,210,200,0.4)' : 'none',
            backdropFilter:'blur(8px)', color:'#fff',
          }}>{icon}</button>
        ))}
      </div>

      {/* View mode buttons — bottom left, debajo de capas */}
      <div style={{ position:'absolute', bottom:10, left:10, display:'flex', flexDirection:'row', gap:3, zIndex:10, marginTop:4 }}>
        {[['globe','🌍','Globe'],['flat','🗺','2D'],['tilt','📐','3D']].map(([v,icon,lbl])=>(
          <button key={v} onClick={()=>setMapView(v)} style={{
            display:'flex', alignItems:'center', gap:3, padding:'3px 7px', borderRadius:4, border:'none',
            cursor:'pointer', fontSize:9, fontFamily:'Montserrat,sans-serif', fontWeight:600,
            background: mapView===v ? 'rgba(0,210,200,0.2)' : 'rgba(0,0,0,0.6)',
            color: mapView===v ? '#00D2C8' : '#888',
            borderLeft: `2px solid ${mapView===v ? '#00D2C8' : 'transparent'}`,
            backdropFilter:'blur(8px)',
          }}>{icon} {lbl}</button>
        ))}
      </div>

      {/* Header bar — top left */}
      <div style={{ position:'absolute', top:8, left:8, display:'flex', alignItems:'center', gap:8, zIndex:10, pointerEvents:'none' }}>
        <div style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', borderRadius:4, padding:'4px 10px', fontFamily:'Montserrat,sans-serif', fontSize:10, color:'#00D2C8', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', border:'1px solid rgba(0,210,200,0.2)' }}>
          ARKA INTEL MAP
        </div>
        <div style={{ background:'rgba(239,68,68,0.15)', borderRadius:4, padding:'4px 8px', fontFamily:'Montserrat,sans-serif', fontSize:9, color:'#EF4444', fontWeight:600, letterSpacing:'.1em', border:'1px solid rgba(239,68,68,0.3)', display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'#EF4444', display:'inline-block', animation:'pulse 1.5s infinite' }} />
          LIVE
        </div>
      </div>

      {/* Fullscreen toggle — arriba derecha, bien separado del nav control */}
      <button onClick={onToggleFullscreen} style={{
        position:'absolute', top:8, right:48, zIndex:20, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)',
        border:'1px solid rgba(255,255,255,0.12)', borderRadius:4, color:'#bbb', cursor:'pointer',
        width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11,
        boxShadow:'0 2px 8px rgba(0,0,0,0.4)',
      }}>
        {fullscreen ? '⊡' : '⊞'}
      </button>

      {/* Conflict count badge */}
      <div style={{ position:'absolute', bottom:10, right:10, pointerEvents:'none', background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', borderRadius:4, padding:'4px 8px', fontFamily:'Montserrat,sans-serif', fontSize:9, color:'#EF4444', border:'1px solid rgba(239,68,68,0.2)' }}>
        {CONFLICT_ZONES_STATIC.filter(c => c.severity === 'critical').length} ZONAS CRÍTICAS
      </div>

      {/* Pulse animation */}
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.3)}} .arka-popup .mapboxgl-popup-content{background:#111;border:1px solid #222;border-radius:6px;padding:6px;color:#eee} .arka-popup .mapboxgl-popup-close-button{color:#555}`}</style>
    </div>
  );
}



/* ── DEFCON / NUCLEAR THREAT PANEL ─────────────────────────── */
// Basado en: Bulletin of Atomic Scientists Doomsday Clock (último: 89s to midnight, Jan 2025)
// + estimación DEFCON según eventos geopolíticos recientes
// Fuente verificable: thebulletin.org
// ARKA Nuclear Threat Index — basado en Doomsday Clock + indicadores OSINT
// Fuente: Bulletin of Atomic Scientists (thebulletin.org) — Jan 2025
const DEFCON_DATA = {
  level: 3,  // Estimado — DEFCON real es clasificado. Nivel 3 desde Feb 2022 (Ucrania)
  doomsday: { seconds: 89, label: "89 seconds to midnight", year: 2025 },
  source: "Bulletin of Atomic Scientists",
  // Pizza Index: indicadores de actividad de pizza ordenada al Pentágono
  // (referencia irónica a reportes de actividad inusual en DC)
  pizzaIndex: {
    overall: "ELEVATED",
    pct: 67,
    directive: "INCREASE FORCE READINESS",
    locations: [
      { name: "Domino's Pentagon",     status: "ELEVATED", pct: 67,   col: "#F59E0B" },
      { name: "Pizza Hut Crystal City", status: "HIGH",     pct: 84,   col: "#EF4444" },
      { name: "Papa John's Arlington",  status: "NOMINAL",  pct: 35,   col: "#3B82F6" },
      { name: "Domino's Langley",       status: "ELEVATED", pct: 72,   col: "#F59E0B" },
      { name: "Two Amy's Georgetown",   status: "QUIET",    pct: 18,   col: "#10B981" },
    ],
    src: "PizzINT (satirical — via worldmonitor.app)",
  },
  triggers: [
    { icon: "🔴", text: "Russia-Ukraine War — nuclear rhetoric elevated", severity: "critical" },
    { icon: "🟡", text: "China-Taiwan tensions — PLA exercises ongoing",  severity: "high"     },
    { icon: "🟡", text: "North Korea ICBM program — active testing",      severity: "high"     },
    { icon: "🟠", text: "Iran nuclear program — enrichment above 60%",    severity: "elevated" },
    { icon: "🟢", text: "US-Russia strategic dialogue — limited channel", severity: "normal"   },
  ],
  updated: "Jan 2025",
};

const DEFCON_COLORS = { 1:"#EF4444", 2:"#F97316", 3:"#EAB308", 4:"#22C55E", 5:"#3B82F6" };
const DEFCON_LABELS = { 1:"NUCLEAR WAR", 2:"NEXT STEP", 3:"ROUND HOUSE", 4:"DOUBLE TAKE", 5:"FADE OUT" };

function DefconPanel() {
  const { level, doomsday, triggers, pizzaIndex } = DEFCON_DATA;
  const pizzint = usePizzINT();
  const tension = pizzint?.tension;
  const liveDefcon = tension?.defconLevel || level;
  const livePct = tension?.tensionScore || pizzaIndex.pct;
  const liveOverall = tension?.label || pizzaIndex.overall;
  const liveMarkets = tension?.markets || [];
  const col = DEFCON_COLORS[liveDefcon];


  return (
    <div style={{ padding:"8px 10px", display:"flex", flexDirection:"column", gap:8, height:"100%", overflowY:"auto", position:"relative" }}>

      {/* DEFCON + Doomsday — top row */}
      <div style={{ display:"flex", gap:10, alignItems:"stretch" }}>
        {/* DEFCON circle */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          width:68, height:68, borderRadius:"50%", border:`3px solid ${col}`, flexShrink:0,
          boxShadow:`0 0 20px ${col}44`, background:`radial-gradient(circle,${col}22 0%,transparent 70%)` }}>
          <div style={{ fontSize:24, fontWeight:900, color:col, fontFamily:"Montserrat,sans-serif", lineHeight:1 }}>{liveDefcon}</div>
          <div style={{ fontSize:7, color:col, fontFamily:"Montserrat,sans-serif", letterSpacing:".1em", fontWeight:700 }}>DEFCON</div>
        </div>
        {/* Right side */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", gap:4 }}>
          <div style={{ fontSize:10, fontWeight:800, color:col, fontFamily:"Montserrat,sans-serif", letterSpacing:".05em" }}>
            {DEFCON_LABELS[liveDefcon]}
          </div>
          <div style={{ fontSize:8, color:"var(--t3)", fontFamily:"Montserrat,sans-serif", lineHeight:1.4 }}>
            Estimado — DEFCON real clasificado<br/>
            Basado en indicadores OSINT
          </div>
          {/* Doomsday clock mini */}
          <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
            <span style={{ fontSize:12 }}>🕛</span>
            <span style={{ fontSize:10, fontWeight:800, color:"#EF4444", fontFamily:"Montserrat,sans-serif" }}>{doomsday.label}</span>
          </div>
        </div>
      </div>

      {/* Pizza Index button */}
      <button onClick={() => window.open('https://www.pizzint.watch/', '_blank')} style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"7px 10px", borderRadius:6, border:"1px solid rgba(245,158,11,0.3)",
        background:"rgba(245,158,11,0.08)", cursor:"pointer", width:"100%", textAlign:"left",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:15 }}>🍕</span>
          <div>
            <div style={{ fontSize:9, fontWeight:700, color:"#F59E0B", fontFamily:"Montserrat,sans-serif", letterSpacing:".08em" }}>PIZZA INDEX</div>
            <div style={{ fontSize:8, color:"var(--t3)", fontFamily:"Montserrat,sans-serif" }}>Pentagon activity indicator</div>
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#F59E0B", fontFamily:"Montserrat,sans-serif" }}>{livePct}%</div>
          <div style={{ fontSize:7, color:"#F59E0B", fontFamily:"Montserrat,sans-serif", fontWeight:700, letterSpacing:".05em" }}>{liveOverall}</div>
        </div>
      </button>

      {/* Threat triggers — compacto */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:4 }}>
        {triggers.slice(0,4).map((t,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 6px",
            background:"var(--surface)", borderRadius:4,
            borderLeft:`2px solid ${t.severity==="critical"?"#EF4444":t.severity==="high"?"#F59E0B":t.severity==="elevated"?"#F97316":"#10B981"}` }}>
            <span style={{ fontSize:10, flexShrink:0 }}>{t.icon}</span>
            <span style={{ fontSize:8, color:"var(--t2)", fontFamily:"Montserrat,sans-serif", lineHeight:1.3 }}>{t.text}</span>
          </div>
        ))}
      </div>

    </div>
  );
}


/* ── CARRIER GROUPS PANEL ───────────────────────────────────── */
function CarrierGroupsPanel() {
  const relay = import.meta.env.VITE_WS_RELAY_URL;
  const relayKey = import.meta.env.VITE_RELAY_SECRET;
  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${relay}/ais`, { headers: { 'x-relay-key': relayKey } })
      .then(r => r.json())
      .then(d => {
        // Filtrar por navíos de guerra / portaaviones en AIS
        const raw = Array.isArray(d) ? d : d.vessels || d.data || [];
        const warships = raw.filter(v => {
          const name = (v.shipname || v.name || '').toUpperCase();
          const type = v.shiptype || 0;
          return type === 35 || type === 36 || // military / law enforcement
            /CVN|TRUMAN|VINSON|FORD|NIMITZ|EISENHOWER|REAGAN|LINCOLN|WASHINGTON|KENNEDY|ROOSEVELT|ENTERPRISE|QUEEN ELIZABETH|LIAONING|SHANDONG|GORSHKOV/i.test(name);
        }).slice(0, 8);

        if (warships.length > 0) {
          setShips(warships.map(v => ({
            name: v.shipname || v.name || 'Unknown',
            flag: v.flag || '—',
            lat: v.lat || v.latitude,
            lng: v.lon || v.longitude,
            speed: v.speed,
            heading: v.heading,
          })));
        } else {
          // Fallback: datos curados si AIS no devuelve navíos militares
          setShips(CARRIER_GROUPS);
        }
        setLastUpdate(new Date().toISOString());
      })
      .catch(() => setShips(CARRIER_GROUPS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ height:"100%", overflowY:"auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 8px 4px", borderBottom:"1px solid var(--border)" }}>
        <span style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", letterSpacing:".1em", textTransform:"uppercase" }}>
          {ships === CARRIER_GROUPS ? "📋 CURATED — Mar 2026" : "📡 LIVE — AIS Stream"}
        </span>
        {loading && <span style={{ fontSize:8, color:"var(--blue)", fontFamily:"Montserrat" }}>●</span>}
      </div>
      {ships.map((s, i) => (
        <div key={i} className="cg-item">
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:12 }}>{s.flag && s.flag.length <= 4 ? s.flag : "⚓"}</span>
            <div style={{ flex:1 }}>
              <div className="cg-name">{s.name}</div>
              <div className="cg-region">{s.region || (s.lat ? `${s.lat?.toFixed(1)}°N ${s.lng?.toFixed(1)}°E` : "—")}</div>
            </div>
            {s.type && <span style={{ fontSize:8, padding:"1px 5px", borderRadius:3, background:"rgba(59,130,246,.15)", color:"#3B82F6", fontFamily:"Montserrat,sans-serif", fontWeight:700 }}>{s.type}</span>}
          </div>
          <div className="cg-status">{s.status || (s.speed ? `${s.speed} kts · HDG ${s.heading}°` : "—")}</div>
        </div>
      ))}
    </div>
  );
}

/* ── WARGAMING / AI SCENARIO PANEL ─────────────────────────── */
function WargamingPanel() {
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTheater, setSelectedTheater] = useState("Taiwan Strait");
  const relay = import.meta.env.VITE_WS_RELAY_URL;
  const relayKey = import.meta.env.VITE_RELAY_SECRET;

  const THEATERS_WG = ["Taiwan Strait", "Ukraine-Russia", "Iran-Israel", "Korea Peninsula", "Red Sea / Houthi", "Arctic"];

  const generateScenario = async (theater) => {
    setLoading(true);
    setScenario(null);
    const prompt = `You are a senior defense analyst for ARKA Intelligence. Generate a concise wargaming scenario for: ${theater}.

Structure your response as JSON only, no markdown:
{
  "title": "Scenario name (6-8 words)",
  "trigger": "Triggering event (1 sentence)",
  "phases": [
    {"phase": "Phase 1", "desc": "What happens (1-2 sentences)", "probability": "35%"},
    {"phase": "Phase 2", "desc": "Escalation path (1-2 sentences)", "probability": "20%"},
    {"phase": "Phase 3", "desc": "Resolution/de-escalation (1-2 sentences)", "probability": "15%"}
  ],
  "marketImpact": "Key market implications (1-2 sentences)",
  "watchSignals": ["Signal 1", "Signal 2", "Signal 3"]
}`;

    try {
      const res = await fetch(`${relay}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-relay-key': relayKey },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], max_tokens: 500 }),
      });
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '{}';
      const clean = text.replace(/```json|```/g, '').trim();
      setScenario(JSON.parse(clean));
    } catch (e) {
      setScenario({ title: "Error", trigger: e.message, phases: [], marketImpact: "", watchSignals: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Theater selector */}
      <div style={{ padding:"6px 8px", borderBottom:"1px solid var(--border)", display:"flex", gap:4, flexWrap:"wrap", flexShrink:0 }}>
        {THEATERS_WG.map(t => (
          <button key={t} onClick={() => { setSelectedTheater(t); generateScenario(t); }}
            style={{ fontSize:8, padding:"3px 7px", borderRadius:3, border:"1px solid",
              borderColor: selectedTheater === t ? "var(--blue)" : "var(--border)",
              background: selectedTheater === t ? "rgba(59,130,246,.15)" : "transparent",
              color: selectedTheater === t ? "var(--blue)" : "var(--t3)",
              cursor:"pointer", fontFamily:"Montserrat,sans-serif", fontWeight:600 }}>
            {t}
          </button>
        ))}
      </div>

      {/* Generate button */}
      <div style={{ padding:"6px 8px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
        <button onClick={() => generateScenario(selectedTheater)} disabled={loading}
          style={{ width:"100%", padding:"5px", background: loading ? "rgba(139,92,246,.1)" : "rgba(139,92,246,.2)",
            border:"1px solid #8B5CF6", borderRadius:4, color:"#A78BFA",
            fontSize:9, fontFamily:"Montserrat,sans-serif", fontWeight:700, cursor: loading ? "wait" : "pointer",
            letterSpacing:".08em", textTransform:"uppercase" }}>
          {loading ? "⚙ Generating scenario..." : "⚡ Generate Scenario — " + selectedTheater}
        </button>
      </div>

      {/* Scenario output */}
      <div style={{ flex:1, overflowY:"auto", padding:"8px" }}>
        {!scenario && !loading && (
          <div style={{ color:"var(--t4)", fontFamily:"Montserrat,sans-serif", fontSize:9, textAlign:"center", paddingTop:20 }}>
            Select a theater and generate an AI wargaming scenario
          </div>
        )}
        {scenario && (
          <div>
            <div style={{ fontSize:12, fontWeight:800, color:"var(--t1)", fontFamily:"Montserrat,sans-serif", marginBottom:6 }}>
              {scenario.title}
            </div>
            <div style={{ fontSize:9, color:"var(--red)", fontFamily:"Montserrat,sans-serif", marginBottom:8, padding:"4px 8px", background:"var(--red-dim)", borderRadius:4 }}>
              <strong>TRIGGER:</strong> {scenario.trigger}
            </div>

            {(scenario.phases || []).map((p, i) => (
              <div key={i} style={{ marginBottom:6, padding:"5px 8px", background:"var(--surface)", borderRadius:4, borderLeft:`2px solid ${i===0?"#EF4444":i===1?"#F59E0B":"#10B981"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                  <span style={{ fontSize:8, fontWeight:700, color:"var(--t3)", fontFamily:"Montserrat,sans-serif", textTransform:"uppercase", letterSpacing:".08em" }}>{p.phase}</span>
                  <span style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif" }}>P={p.probability}</span>
                </div>
                <div style={{ fontSize:9, color:"var(--t2)", fontFamily:"Montserrat,sans-serif", lineHeight:1.4 }}>{p.desc}</div>
              </div>
            ))}

            {scenario.marketImpact && (
              <div style={{ marginTop:6, padding:"5px 8px", background:"rgba(201,168,76,.08)", borderRadius:4, borderLeft:"2px solid var(--gold)" }}>
                <div style={{ fontSize:8, fontWeight:700, color:"var(--gold)", fontFamily:"Montserrat,sans-serif", marginBottom:2, textTransform:"uppercase", letterSpacing:".08em" }}>Market Impact</div>
                <div style={{ fontSize:9, color:"var(--t2)", fontFamily:"Montserrat,sans-serif", lineHeight:1.4 }}>{scenario.marketImpact}</div>
              </div>
            )}

            {scenario.watchSignals?.length > 0 && (
              <div style={{ marginTop:6 }}>
                <div style={{ fontSize:8, fontWeight:700, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", marginBottom:4, textTransform:"uppercase", letterSpacing:".08em" }}>Watch Signals</div>
                {scenario.watchSignals.map((s, i) => (
                  <div key={i} style={{ fontSize:9, color:"var(--t2)", fontFamily:"Montserrat,sans-serif", display:"flex", gap:5, marginBottom:2 }}>
                    <span style={{ color:"var(--blue)" }}>▸</span>{s}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


/* ── MARKETS PANEL con selector de símbolos ─────────────────── */
const SYMBOL_CATALOG = [
  // Forex Majors (via Frankfurter/BCE)
  { sym: "FX:EUR_USD", label: "EUR/USD", cat: "Forex" },
  { sym: "FX:GBP_USD", label: "GBP/USD", cat: "Forex" },
  { sym: "FX:USD_JPY", label: "USD/JPY", cat: "Forex" },
  { sym: "FX:USD_CHF", label: "USD/CHF", cat: "Forex" },
  { sym: "FX:USD_CAD", label: "USD/CAD", cat: "Forex" },
  { sym: "FX:USD_MXN", label: "USD/MXN", cat: "Forex" },
  { sym: "FX:USD_BRL", label: "USD/BRL", cat: "Forex" },
  // Forex Minors
  { sym: "FX:EUR_GBP", label: "EUR/GBP", cat: "Forex" },
  { sym: "FX:EUR_JPY", label: "EUR/JPY", cat: "Forex" },
  { sym: "FX:EUR_MXN", label: "EUR/MXN", cat: "Forex" },
  { sym: "FX:EUR_BRL", label: "EUR/BRL", cat: "Forex" },
  // Índices
  { sym: "SPY",      label: "S&P 500",  cat: "Index" },
  { sym: "QQQ",      label: "NASDAQ",   cat: "Index" },
  { sym: "DIA",      label: "DOW",      cat: "Index" },
  { sym: "IWM",      label: "Russell",  cat: "Index" },
  { sym: "DX-Y.NYB", label: "DXY",      cat: "Index" },
  { sym: "EWJ",      label: "Nikkei",   cat: "Index" },
  { sym: "FXI",      label: "China",    cat: "Index" },
  { sym: "EWZ",      label: "Brazil",   cat: "Index" },
  { sym: "EWW",      label: "Mexico",   cat: "Index" },
  // Materias primas
  { sym: "GC=F",     label: "Gold",     cat: "Commod" },
  { sym: "SI=F",     label: "Silver",   cat: "Commod" },
  { sym: "BZ=F",     label: "Brent",    cat: "Commod" },
  { sym: "CL=F",     label: "WTI",      cat: "Commod" },
  { sym: "NG=F",     label: "Nat Gas",  cat: "Commod" },
  // Crypto
  { sym: "BINANCE:BTCUSDT", label: "BTC",   cat: "Crypto" },
  { sym: "BINANCE:ETHUSDT", label: "ETH",   cat: "Crypto" },
  { sym: "BINANCE:SOLUSDT", label: "SOL",   cat: "Crypto" },
  { sym: "BINANCE:XRPUSDT", label: "XRP",   cat: "Crypto" },
  // Acciones tech
  { sym: "NVDA",     label: "NVDA",     cat: "Stock" },
  { sym: "MSFT",     label: "MSFT",     cat: "Stock" },
  { sym: "AAPL",     label: "AAPL",     cat: "Stock" },
  { sym: "GOOGL",    label: "GOOGL",    cat: "Stock" },
  { sym: "META",     label: "META",     cat: "Stock" },
  { sym: "TSM",      label: "TSM",      cat: "Stock" },
  { sym: "TLT",      label: "TLT",      cat: "Bonds" },
  { sym: "XLF",      label: "Financ.",  cat: "Stock" },
];

const DEFAULT_SYMBOLS = {
  global:  ["FX:EUR_USD","FX:GBP_USD","FX:USD_JPY","FX:USD_MXN","SPY","GLD","USO","BINANCE:BTCUSDT"],
  finance: ["SPY","QQQ","TLT","FX:EUR_USD","FX:USD_MXN","GLD","BINANCE:BTCUSDT","BINANCE:ETHUSDT"],
  tech:    ["NVDA","MSFT","AAPL","GOOGL","META","SPY","BINANCE:BTCUSDT","BINANCE:SOLUSDT"],
};

function MarketsPanel({ variant, marketsData }) {
  const storageKey = `arka_markets_${variant}`;
  const [selected, setSelected] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || DEFAULT_SYMBOLS[variant] || DEFAULT_SYMBOLS.global; }
    catch { return DEFAULT_SYMBOLS[variant] || DEFAULT_SYMBOLS.global; }
  });
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(selected)); } catch {}
  }, [selected, storageKey]);

  // Fetch custom symbols que no están en el snapshot por defecto
  const [customData, setCustomData] = useState({});
  const [customLoading, setCustomLoading] = useState(false);

  useEffect(() => {
    const snapshot = marketsData?.data || [];
    const snapshotSyms = snapshot.map(s => s._sym).filter(Boolean);
    const missing = selected.filter(s => !snapshotSyms.includes(s));
    if (!missing.length) return;
    setCustomLoading(true);
    fetchCustomMarkets(missing)
      .then(results => {
        const map = {};
        results.forEach(r => { if (r._sym) map[r._sym] = r; });
        setCustomData(map);
      })
      .catch(() => {})
      .finally(() => setCustomLoading(false));
  }, [selected, marketsData?.data]);

  const snapshot = marketsData?.data || [];

  const items = selected.map(sym => {
    const label = SYMBOL_CATALOG.find(c => c.sym === sym)?.label || sym;
    const found = snapshot.find(s => s._sym === sym)
      || snapshot.find(s => s.t === label)
      || customData[sym];
    return found ? { ...found, _sym: sym } : { t: label, p: "—", c: "—", up: true, _sym: sym, loading: true };
  });

  const cats = [...new Set(SYMBOL_CATALOG.map(s => s.cat))];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 6px 2px", borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => setShowSelector(s => !s)}
          style={{ fontSize: 9, padding: "2px 8px", border: "1px solid var(--border)", background: showSelector ? "var(--blue-dim)" : "transparent",
            color: showSelector ? "var(--blue)" : "var(--t3)", borderRadius: 3, cursor: "pointer", fontFamily: "Montserrat,sans-serif",
            letterSpacing: ".08em", fontWeight: 600 }}>
          ⚙ CUSTOMIZE
        </button>
      </div>

      {showSelector ? (
        /* Selector de símbolos */
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
          {cats.map(cat => (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 8, color: "var(--t4)", letterSpacing: ".15em", marginBottom: 4, fontFamily: "Montserrat,sans-serif" }}>{cat.toUpperCase()}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {SYMBOL_CATALOG.filter(s => s.cat === cat).map(s => {
                  const active = selected.includes(s.sym);
                  return (
                    <button key={s.sym}
                      onClick={() => setSelected(prev =>
                        active ? prev.filter(x => x !== s.sym) : [...prev, s.sym]
                      )}
                      style={{ fontSize: 9, padding: "2px 7px", border: `1px solid ${active ? "var(--blue)" : "var(--border)"}`,
                        background: active ? "var(--blue-dim)" : "transparent",
                        color: active ? "var(--blue)" : "var(--t3)", borderRadius: 3, cursor: "pointer",
                        fontFamily: "Montserrat,sans-serif", fontWeight: active ? 700 : 400 }}>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button onClick={() => setSelected(DEFAULT_SYMBOLS[variant] || DEFAULT_SYMBOLS.global)}
            style={{ fontSize: 8, padding: "2px 8px", border: "1px solid var(--border)", background: "transparent",
              color: "var(--t4)", borderRadius: 3, cursor: "pointer", fontFamily: "Montserrat,sans-serif", marginTop: 4 }}>
            RESET DEFAULTS
          </button>
        </div>
      ) : (
        /* Tabla de precios */
        <table className="mtbl" style={{ flex: 1 }}>
          <thead><tr><th>Asset</th><th>Price</th><th>24h</th></tr></thead>
          <tbody>
            {items.map((m, i) => (
              <tr key={i}>
                <td className="tick">{m.t}</td>
                <td className={m.loading ? "" : m.up ? "cup" : "cdn"}
                  style={{ color: m.loading ? "var(--t4)" : undefined }}>
                  {m.loading ? <span style={{ opacity: .4 }}>···</span> : m.p}
                </td>
                <td>
                  {m.loading
                    ? <span style={{ opacity: .3, fontSize: 9 }}>—</span>
                    : <span className={`cbadge ${m.up ? "up" : "dn"}`}>{m.c}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PanelContent({ id, variant }) {
  const [ch, setCh] = useState("bloomberg");
  const [aiQ, setAiQ] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // News feed map
  const newsFeedMap = {
    "news-global":     { fn: fetchNewsGlobal,     key: "news-global" },
    "news-middleeast": { fn: fetchNewsMiddleEast, key: "news-middleeast" },
    "news-africa":     { fn: fetchNewsAfrica,     key: "news-africa" },
    "news-latam":      { fn: fetchNewsLatam,      key: "news-latam" },
    "news-thinktanks": { fn: fetchNewsThinkTanks, key: "news-thinktanks" },
    "news-finance":    { fn: fetchNewsFinance,    key: "news-finance" },
    "news-tech":       { fn: fetchNewsTech,       key: "news-tech" },
  };

  // ── Markets ──
  const marketsData = useDataFetcher(
    `markets-${variant}`,
    () => fetchMarkets(variant),
    { ttl: TTL.markets }
  );
  // ── Commodities ──
  const commData = useDataFetcher("commodities", fetchCommodities, { ttl: TTL.markets });
  // ── Crypto ──
  const cryptoData = useDataFetcher("crypto", fetchCrypto, { ttl: TTL.markets });
  // ── Macro ──
  const macroData = useDataFetcher("macro", fetchMacro, { ttl: TTL.macro });
  // ── Economic Calendar ──
  const [econExpanded, setEconExpanded] = useState(null);
  const econCalData = useDataFetcher("econ-calendar", () => relayFetch('/economic-calendar'), { ttl: 3600000 });
  // ── Earthquakes ──
  const eqData = useDataFetcher("earthquakes", fetchEarthquakes, { ttl: TTL.geo });
  // ── Fires ──
  const firesData = useDataFetcher("fires", fetchFires, { ttl: TTL.geo });
  // ── Predictions ──
  const predsData = useDataFetcher("predictions", fetchPredictions, { ttl: TTL.news });
  // ── Displacement ──
  const displData = useDataFetcher("displacement", fetchDisplacement, { ttl: TTL.humanitarian });
  // ── Cyber Feed (dinámico via NewsAPI) ──
  const cyberData = useDataFetcher("cyber-feed", fetchCyberFeed, { ttl: TTL.news });
  // ── Military Feed (dinámico via GDELT) ──
  const militaryData = useDataFetcher("military-feed", fetchMilitaryFeed, { ttl: TTL.news });

  // ── Live News + Insights ──
  const liveNewsData = useDataFetcher(
    `live-news-${variant}`,
    () => fetchLiveNews(variant),
    { ttl: TTL.news }
  );
  // AI Insights — re-ejecuta cuando llegan las noticias en vivo
  const [insightsData, setInsightsData] = useState(intelStore.insights);
  const insightsTriggered = useRef(false);
  useEffect(() => {
    const headlines = (liveNewsData.data || []).map(n => n.h).filter(Boolean);
    if (!headlines.length || insightsTriggered.current) return;
    insightsTriggered.current = true;
    const next = { data: null, loading: true, error: null };
    setInsightsData(next); intelStore.set(next);
    fetchInsights(headlines)
      .then(data => { const v={data,loading:false,error:null}; setInsightsData(v); intelStore.set(v); })
      .catch(e  => { const v={data:null,loading:false,error:e.message}; setInsightsData(v); intelStore.set(v); });
  }, [liveNewsData.data]);

  // AI Deduction handler
  const handleAnalyze = async () => {
    if (!aiQ.trim()) return;
    setAiLoading(true);
    try {
      const ctx = (intelStore.insights.data || []).map(i => i.head).join('; ');
      const result = await fetchDeduction(ctx, aiQ);
      setAiResult(result);
    } catch (e) {
      setAiResult(`Error: ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Service Status (derived from actual fetch states) ──
  const services = [
    { name: "Finnhub Markets",    s: marketsData.error ? "down" : marketsData.loading ? "degraded" : "ok" },
    { name: "FRED Macro",         s: macroData.error ? "down" : macroData.loading ? "degraded" : "ok" },
    { name: "Guardian / NewsAPI", s: liveNewsData.error ? "down" : liveNewsData.loading ? "degraded" : "ok" },
    { name: "USGS Seismology",    s: eqData.error ? "down" : eqData.loading ? "degraded" : "ok" },
    { name: "NASA FIRMS",         s: firesData.error ? "down" : firesData.loading ? "degraded" : "ok" },
    { name: "Polymarket",         s: predsData.error ? "down" : predsData.loading ? "degraded" : "ok" },
    { name: "UNHCR",              s: displData.error ? "down" : displData.loading ? "degraded" : "ok" },
    { name: "Groq AI",            s: intelStore.insights.error ? "degraded" : intelStore.insights.loading ? "degraded" : "ok" },
  ];

  // ── Panel renders ──────────────────────────────────────────
  if (id === "live-news") {
    const activeCh = CHANNELS.find(c => c.id === ch) || CHANNELS[0];
    const [iframeError, setIframeError] = React.useState({});
    const [iframeLoaded, setIframeLoaded] = React.useState({});
    const hasError = iframeError[activeCh.id];
    const isLoaded = iframeLoaded[activeCh.id];

    // YouTube live URL para abrir en nueva pestaña
    const ytOpenUrl = activeCh.ytOpen || activeCh.src;

    // HLS player component
    const HLSPlayer = ({ ch: hlsCh }) => {
      const videoRef = React.useRef(null);
      const [hlsError, setHlsError] = React.useState(false);
      React.useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        setHlsError(false);
        // Verificar soporte nativo HLS (Safari)
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = hlsCh.src;
          video.play().catch(() => {});
          return;
        }
        // Usar hls.js via CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.4.12/hls.min.js';
        script.onload = () => {
          if (!window.Hls || !window.Hls.isSupported()) { setHlsError(true); return; }
          const hls = new window.Hls({ lowLatencyMode: true });
          hls.loadSource(hlsCh.src);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
          hls.on(window.Hls.Events.ERROR, (_, data) => { if (data.fatal) setHlsError(true); });
          video._hls = hls;
        };
        script.onerror = () => setHlsError(true);
        if (!document.querySelector('script[src*="hls.min.js"]')) document.head.appendChild(script);
        else if (window.Hls) script.onload();
        return () => { if (video._hls) { video._hls.destroy(); delete video._hls; } };
      }, [hlsCh.src]);
      if (hlsError) return (
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", background:"#0a0a0a", gap:12, padding:16 }}>
          <div style={{ fontSize:28 }}>📺</div>
          <div style={{ fontSize:10, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", textAlign:"center" }}>
            Stream no disponible
          </div>
          <a href={hlsCh.ytOpen} target="_blank" rel="noopener noreferrer"
            style={{ padding:"6px 14px", background:"#14b8a6", color:"#000", borderRadius:4,
              fontSize:10, fontWeight:700, textDecoration:"none" }}>
            Ver en sitio oficial
          </a>
        </div>
      );
      return <video ref={videoRef} muted autoPlay playsInline controls
        style={{ width:"100%", height:"100%", display:"block", background:"#000" }} />;
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, height: "100%" }}>
        <div className="ch-row" style={{ display:"flex", gap:4, flexWrap:"wrap", flexShrink:0 }}>
          {CHANNELS.map(c => (
            <button key={c.id} className={`chbtn ${ch === c.id ? "active" : ""}`}
              onClick={() => { setCh(c.id); setIframeError(p=>({...p,[c.id]:false})); setIframeLoaded(p=>({...p,[c.id]:false})); }}>
              {c.label}
              {iframeError[c.id] && <span style={{color:"#ef4444",marginLeft:3,fontSize:7}}>●</span>}
            </button>
          ))}
        </div>
        <div style={{ flex:1, borderRadius:4, overflow:"hidden", background:"#000", minHeight:0, position:"relative" }}>
          {/* HLS nativo */}
          {activeCh.type === "hls" && <HLSPlayer ch={activeCh} />}
          {/* iframe para YouTube y embeds directos */}
          {(activeCh.type === "yt" || activeCh.type === "direct") && !hasError && (
            <iframe
              key={activeCh.id}
              src={activeCh.src}
              style={{ width:"100%", height:"100%", border:"none", display:"block" }}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write"
              allowFullScreen
              title={activeCh.label}
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setIframeLoaded(p=>({...p,[activeCh.id]:true}))}
              onError={() => setIframeError(p=>({...p,[activeCh.id]:true}))}
            />
          )}
          {/* Spinner mientras carga iframe */}
          {(activeCh.type === "yt" || activeCh.type === "direct") && !hasError && !isLoaded && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", background:"#0a0a0a", gap:10 }}>
              <div style={{ width:24, height:24, border:"2px solid #2a2a2a",
                borderTop:"2px solid #14b8a6", borderRadius:"50%",
                animation:"spin 1s linear infinite" }} />
              <span style={{ fontSize:9, color:"var(--t4)", fontFamily:"Montserrat,sans-serif" }}>
                Conectando con {activeCh.label}...
              </span>
            </div>
          )}
          {/* Fallback iframe bloqueado */}
          {(activeCh.type === "yt" || activeCh.type === "direct") && hasError && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", background:"#0a0a0a", gap:12, padding:16 }}>
              <div style={{ fontSize:28 }}>📺</div>
              <div style={{ fontSize:10, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", textAlign:"center", lineHeight:1.6 }}>
                El embed fue bloqueado.<br/>Ábrelo directamente.
              </div>
              <a href={ytOpenUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding:"6px 16px", background:"#FF0000", color:"#fff",
                  borderRadius:4, fontSize:10, fontWeight:700, textDecoration:"none" }}>
                ▶ Ver en vivo
              </a>
              <button onClick={() => setIframeError(p=>({...p,[activeCh.id]:false}))}
                style={{ background:"none", border:"1px solid var(--border)", borderRadius:4,
                  color:"var(--t4)", cursor:"pointer", fontSize:9, padding:"4px 10px",
                  fontFamily:"Montserrat,sans-serif" }}>
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (id === "map") {
    return (
      <div style={{ width:'100%', height:'100%' }}
        onWheel={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
      >
        <MapboxPanel fullscreen={false} onToggleFullscreen={() => { if (window.__arkaMapFullscreen) window.__arkaMapFullscreen(true); }} />
      </div>
    );
  }

  if (id === "markets") {
    return <MarketsPanel variant={variant} marketsData={marketsData} />;
  }

  if (id === "commodities") {
    const items = commData.data || [];
    if (commData.loading && !items.length) return <Loading />;
    return (
      <div>
        {items.map((c, i) => (
          <div key={i} className="com-item">
            <span className="com-name">{c.name}</span>
            <div style={{ textAlign: "right" }}>
              <div className={`cr-price ${c.up ? "cup" : "cdn"}`}>{c.price}</div>
              <span className={`cbadge ${c.up ? "up" : "dn"}`}>{c.chg}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "crypto") {
    const items = cryptoData.data || [];
    if (cryptoData.loading && !items.length) return <Loading />;
    return (
      <div>
        {items.map((c, i) => (
          <div key={i} className="cr-item">
            <div>
              <div className="cr-sym">{c.sym}</div>
              <div className="cr-name">{c.name}</div>
            </div>
            <div>
              <div className={`cr-price ${c.up ? "cup" : "cdn"}`}>{c.price}</div>
              <div className={`cr-chg ${c.up ? "cup" : "cdn"}`}>{c.chg}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "econ-calendar") {
    const events = econCalData.data?.events || [];
    if (econCalData.loading && !events.length) return React.createElement('div', {className:'panel-empty'}, 'Loading calendar...');
    if (!events.length) return React.createElement('div', {className:'panel-empty'}, 'No upcoming events');
    const today = new Date().toISOString().slice(0,10);
    const impColor = {3:'#EF4444', 2:'#F59E0B', 1:'#6B7280'};
    const impLabel = {3:'HIGH', 2:'MED', 1:'LOW'};
    const grouped = {};
    events.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });

    const EconSparkline = ({ history, color }) => {
      if (!history?.length) return null;
      const vals = history.map(h => h.value);
      const min = Math.min(...vals), max = Math.max(...vals);
      const range = max - min || 1;
      const w = 60, h = 20;
      const pts = vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return `${x},${y}`;
      }).join(' ');
      return (
        <svg width={w} height={h} style={{ flexShrink:0 }}>
          <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx={vals.length > 1 ? w : 0} cy={h - ((vals[vals.length-1] - min) / range) * h}
            r="2" fill={color}/>
        </svg>
      );
    };

    return (
      <div style={{ padding:'4px 6px' }}>
        {Object.entries(grouped).map(([date, evts]) => (
          <div key={date} style={{ marginBottom:10 }}>
            <div style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif',
              letterSpacing:'.12em', marginBottom:5, padding:'2px 4px',
              borderBottom:'1px solid var(--border)', textTransform:'uppercase' }}>
              {date === today ? '📅 TODAY' : date}
            </div>
            {evts.map((e, i) => {
              const isExp = econExpanded === `${date}-${i}`;
              const chg = e.actual != null && e.previous != null ? (e.actual - e.previous) : null;
              const chgColor = chg === null ? 'var(--t4)' : chg > 0 ? '#10B981' : chg < 0 ? '#EF4444' : 'var(--t4)';
              return (
                <div key={i} style={{ marginBottom:4 }}>
                  <div onClick={() => setEconExpanded(isExp ? null : `${date}-${i}`)}
                    style={{ display:'flex', alignItems:'center', gap:6,
                      padding:'5px 6px', borderRadius:4, background:'var(--elevated)',
                      borderLeft:`2px solid ${impColor[e.importance]}`,
                      cursor: e.history?.length ? 'pointer' : 'default' }}>
                    <span style={{ fontSize:7, padding:'1px 4px', borderRadius:3, fontWeight:700,
                      fontFamily:'Montserrat,sans-serif', background:impColor[e.importance]+'22',
                      color:impColor[e.importance], flexShrink:0, width:26, textAlign:'center' }}>
                      {impLabel[e.importance]}
                    </span>
                    <span style={{ fontSize:9, color: e.released ? 'var(--t1)' : 'var(--t2)',
                      fontFamily:'Montserrat,sans-serif', lineHeight:1.3, flex:1 }}>
                      {e.name}
                    </span>
                    {e.actual != null && (
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', flexShrink:0 }}>
                        <span style={{ fontSize:9, fontWeight:700, color:'var(--t1)',
                          fontFamily:'Montserrat,sans-serif' }}>{e.actual?.toFixed(2)}</span>
                        {chg !== null && (
                          <span style={{ fontSize:7, color:chgColor, fontFamily:'Montserrat,sans-serif' }}>
                            {chg > 0 ? '▲' : chg < 0 ? '▼' : '—'} {Math.abs(chg).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                    {e.history?.length > 0 && (
                      <EconSparkline history={e.history} color={impColor[e.importance]} />
                    )}
                    <a href={`https://fred.stlouisfed.org/release?rid=${e.id}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={ev => ev.stopPropagation()}
                      style={{ fontSize:9, color:'var(--t4)', textDecoration:'none', flexShrink:0 }}>↗</a>
                  </div>
                  {isExp && e.history?.length > 0 && (
                    <div style={{ padding:'6px 8px', background:'var(--base)', borderRadius:'0 0 4px 4px',
                      borderLeft:`2px solid ${impColor[e.importance]}`, marginTop:-2 }}>
                      <div style={{ fontSize:7, color:'var(--t4)', fontFamily:'Montserrat,sans-serif',
                        letterSpacing:'.1em', marginBottom:4 }}>HISTORICAL — LAST 12 PERIODS</div>
                      <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                        {e.history.slice(-12).map((h, j) => (
                          <div key={j} style={{ fontSize:7, color:'var(--t3)',
                            fontFamily:'Montserrat,sans-serif', textAlign:'center', minWidth:36 }}>
                            <div style={{ color:'var(--t1)', fontWeight:700 }}>{h.value?.toFixed(1)}</div>
                            <div style={{ color:'var(--t4)' }}>{h.date?.slice(0,7)}</div>
                          </div>
                        ))}
                      </div>
                      {e.previous != null && (
                        <div style={{ marginTop:6, fontSize:8, color:'var(--t3)',
                          fontFamily:'Montserrat,sans-serif' }}>
                          Previous: <span style={{ color:'var(--t1)', fontWeight:700 }}>{e.previous?.toFixed(2)}</span>
                          {e.unit && <span style={{ color:'var(--t4)' }}> {e.unit}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  if (id === "macro") {
    const items = macroData.data || [];
    if (macroData.loading && !items.length) return <Loading />;
    return (
      <div className="macro-grid">
        {items.map((m, i) => (
          <div key={i} className="mc">
            <div className="mc-lbl">{m.name}</div>
            <div className="mc-val">{m.val}</div>
            <Sparkline data={m.spark} color={i % 2 === 0 ? "#3B82F6" : "#C9A84C"} h={18} w={56} />
            <div className="mc-sub">{m.sub}</div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "earthquakes") {
    const items = eqData.data || [];
    if (eqData.loading && !items.length) return <Loading />;
    return (
      <div>
        {items.map((e, i) => (
          <div key={i} className="eq-item">
            <div className="eq-mag" style={{ color: e.color }}>M{e.mag?.toFixed(1)}</div>
            <div style={{ flex: 1 }}>
              <div className="eq-place">{e.place}</div>
              <div className="eq-time">{e.time}</div>
            </div>
            <div className="eq-bar" style={{ background: e.color }} />
          </div>
        ))}
      </div>
    );
  }

  if (id === "fires") {
    const items = firesData.data || [];
    if (firesData.loading && !items.length) return <Loading />;
    if (!items.length) return <div className="panel-empty">No active fire data</div>;
    return (
      <div>
        {items.map((f, i) => (
          <div key={i} className="fire-item">
            <span>🔥</span>
            <div className="fire-loc">{f.loc}</div>
            <div className="fire-ac">{f.ac}</div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "predictions") {
    const items = predsData.data || [];
    if (predsData.loading && !items.length) return <Loading />;
    if (!items.length) return <div className="panel-empty">No prediction markets loaded</div>;
    return (
      <div>
        {items.map((p, i) => (
          <div key={i} className="pitem">
            <div className="pq">{p.q}</div>
            <div className="pbar2"><div className="pyes" style={{ width: `${p.yes}%` }} /></div>
            <div className="plbls">
              <span className="y">YES {p.yes}%</span>
              <span className="n">NO {100 - p.yes}%</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "displacement") {
    const items = displData.data || [];
    if (displData.loading && !items.length) return <Loading />;
    return (
      <div>
        {items.map((d, i) => (
          <div key={i} className="disp-item">
            <span className="disp-cn">{d.country}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="disp-num">{d.num}</span>
              <span style={{ color: d.trend === "↑" ? "var(--red)" : d.trend === "↓" ? "var(--green)" : "var(--t3)", fontFamily: "Montserrat", fontSize: 12 }}>{d.trend}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "insights") {
    const items = insightsData.data || [];
    if (insightsData.loading && !items.length) return <Loading />;
    if (!items.length) return <div className="panel-empty">Generating insights...</div>;
    return (
      <div>
        {items.map((ins, i) => (
          <div key={i} className="ins-item">
            <div className="ins-head">{ins.head}</div>
            <div className="ins-body">{ins.body}</div>
            <div className="ins-meta">
              <span className="ins-conf">CONF: {ins.conf}</span>
              <span className="ins-time">{ins.time}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "ai-deduction") return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {aiResult ? (
        <div className="ai-box" style={{ flex: 1, overflowY: "auto" }}>
          <div className="ai-q">"{aiQ}"</div>
          <div className="ai-r" style={{ whiteSpace: "pre-wrap" }}>{aiResult}</div>
          <div className="ai-src">✦ ARKA AI · just now</div>
        </div>
      ) : (
        <div className="ai-box" style={{ flex: 1 }}>
          <div className="ai-q">ARKA Intelligence Analysis</div>
          <div className="ai-r">Enter a geopolitical or financial query to generate a structured intelligence assessment.</div>
          <div className="ai-src">✦ Groq LLaMA · OpenRouter fallback</div>
        </div>
      )}
      <div className="ai-row">
        <input
          className="ai-in"
          placeholder="Enter geopolitical query…"
          value={aiQ}
          onChange={e => setAiQ(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAnalyze()}
        />
        <button className="ai-btn" onClick={handleAnalyze} disabled={aiLoading}>
          {aiLoading ? "..." : "ANALYZE"}
        </button>
      </div>
      {aiLoading && <div className="ai-loading">✦ Generating analysis...</div>}
    </div>
  );

  if (id === "carrier-groups") return <CarrierGroupsPanel />;
  if (id === "wargaming") return <WargamingPanel />;
  if (id === "defcon") return <DefconPanel />;

  if (id === "service-status") return (
    <div>
      {services.map((s, i) => (
        <div key={i} className="ss-item">
          <span className="ss-name">{s.name}</span>
          <span className={`ssbadge ${s.s}`}>{s.s}</span>
        </div>
      ))}
    </div>
  );

  if (id === "worldclock") return (
    <div>
      {WCLOCKS.map((c, i) => (
        <div key={i} className="wc-row">
          <div>
            <div className="wc-city">{c.city}</div>
            <div className="wc-tz">{c.tz}</div>
          </div>
          <WorldTime tz={c.tz} />
        </div>
      ))}
    </div>
  );

  // Static panels
  if (id === "military") {
    const live = militaryData.data || [];
    const items = live.length ? live : MIL;
    const isLive = live.length > 0;
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 8px 2px", borderBottom:"1px solid var(--border)" }}>
          <span style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", letterSpacing:".1em", textTransform:"uppercase" }}>
            {isLive ? "📡 LIVE — GDELT" : "📋 CURATED — Mar 2026"}
          </span>
          {militaryData.loading && <span style={{ fontSize:8, color:"var(--blue)" }}>●</span>}
        </div>
        {items.map((m, i) => (
          <div key={i} className="mil-item" style={{ cursor: m.url ? "pointer" : "default" }}
            onClick={() => m.url && window.open(m.url, "_blank")}>
            <div className="mil-ico">{m.icon}</div>
            <div>
              <div className="mil-cty" style={{ display:"flex", gap:4, alignItems:"center" }}>
                {m.tag && <span style={{ fontSize:8, padding:"1px 4px", borderRadius:3, background: m.tagCol ? m.tagCol + "33" : "#ffffff22", color: m.tagCol || "var(--t3)", fontWeight:700, fontFamily:"Montserrat,sans-serif" }}>{m.tag}</span>}
                {!m.tag && m.country && <span style={{ fontSize:9, color:"var(--t3)", fontFamily:"Montserrat,sans-serif" }}>{m.country}</span>}
              </div>
              <div className="mil-txt">{m.text}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "cyber") {
    const live = cyberData.data || [];
    const items = live.length ? live : CYBER;
    const isLive = live.length > 0;
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 8px 2px", borderBottom:"1px solid var(--border)" }}>
          <span style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", letterSpacing:".1em", textTransform:"uppercase" }}>
            {isLive ? "📡 LIVE — NewsAPI" : "📋 CURATED — Mar 2026"}
          </span>
          {cyberData.loading && <span style={{ fontSize:8, color:"var(--blue)" }}>●</span>}
        </div>
        {items.map((c, i) => (
          <div key={i} className="cy-item" style={{ cursor: c.url ? "pointer" : "default" }}
            onClick={() => c.url && window.open(c.url, "_blank")}>
            <span className={`cysev ${c.sev === "critical" ? "tc" : c.sev === "high" ? "th" : "tm"}`}>{c.sev}</span>
            <div>
              <div className="cy-txt">{c.text}</div>
              <div className="cy-src">{c.src}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (id === "cii") return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", padding:"3px 8px 3px", borderBottom:"1px solid var(--border)", marginBottom:2 }}>
        <span style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", letterSpacing:".1em", textTransform:"uppercase" }}>Country Intelligence Index — Mar 2026</span>
      </div>
      {RISKS.map((r, i) => (
        <div key={i} className="rrow" style={{ flexDirection:"column", gap:2, padding:"4px 8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, width:"100%" }}>
            <span className="rcty" style={{ flex:1 }}>{r.country}</span>
            <span style={{ fontSize:9, color:"var(--t3)", fontFamily:"Montserrat,sans-serif" }}>{r.trend}</span>
            <span className="rscore" style={{ color: r.color }}>{r.score}</span>
          </div>
          <div className="rbar-w"><div className="rbar" style={{ width: `${r.score}%`, background: r.color }} /></div>
          {r.note && <div style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", lineHeight:1.3 }}>{r.note}</div>}
        </div>
      ))}
    </div>
  );

  if (id === "theater") return (
    <div>
      <div style={{ padding:"3px 8px 3px", borderBottom:"1px solid var(--border)", marginBottom:2 }}>
        <span style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", letterSpacing:".1em", textTransform:"uppercase" }}>Global Theater Posture — Mar 2026</span>
      </div>
      {THEATER.map((t, i) => (
        <div key={i} className="tp-item">
          <div className="tp-theater" style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span>{t.icon}</span>{t.theater}
          </div>
          <div className="tp-status">
            {t.status}
            <span className={`tplvl ${t.level === "e" ? "tl-e" : t.level === "h" ? "tl-h" : "tl-m"}`}>
              {t.level === "e" ? "ELEVATED" : t.level === "h" ? "HIGH" : "MONITOR"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  if (id === "supply-chain") return (
    <div>
      <div style={{ padding:"3px 8px 4px", borderBottom:"1px solid var(--border)" }}>
        <span style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", letterSpacing:".1em", textTransform:"uppercase" }}>Chokepoint Stress Index — Mar 2026</span>
      </div>
      {SC.map((s, i) => (
        <div key={i} className="sc-item">
          <div className="sc-top">
            <span className="sc-name">{s.name}</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {s.delta && <span style={{ fontSize:8, color: s.delta.startsWith("+") ? "#EF4444" : s.delta === "→" ? "#6B7280" : "#10B981", fontFamily:"Montserrat,sans-serif" }}>{s.delta}</span>}
              <span className="sc-num" style={{ color: s.color }}>{s.val}/100</span>
            </div>
          </div>
          <div className="sc-bar-w"><div className="sc-bar" style={{ width: `${s.val}%`, background: s.color }} /></div>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <div className="sc-lbl">{s.lbl}</div>
            {s.vessels && <div style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif" }}>⛵ {s.vessels}</div>}
          </div>
        </div>
      ))}
    </div>
  );

  if (id === "gps-jamming") return (
    <div>
      <div style={{ padding:"3px 8px 4px", borderBottom:"1px solid var(--border)" }}>
        <span style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", letterSpacing:".1em", textTransform:"uppercase" }}>GPS / GNSS Jamming Active Zones — Mar 2026</span>
      </div>
      {GPS.map((g, i) => (
        <div key={i} className="gps-item" style={{ flexDirection:"column", gap:1, padding:"5px 8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div className="gps-dot" style={{
              background: g.lvl === "Severe" ? "#EF4444" : g.lvl === "High" ? "#F59E0B" : "#3B82F6",
              boxShadow: `0 0 5px ${g.lvl === "Severe" ? "#EF4444" : "#F59E0B"}`,
            }} />
            <span className="gps-region" style={{ flex:1 }}>{g.region}</span>
            <span className="gps-lvl" style={{
              color: g.lvl === "Severe" ? "var(--red)" : g.lvl === "High" ? "var(--amber)" : "var(--blue)",
              background: g.lvl === "Severe" ? "var(--red-dim)" : "rgba(245,158,11,.1)",
            }}>{g.lvl}</span>
          </div>
          {g.affected && <div style={{ fontSize:8, color:"var(--t4)", fontFamily:"Montserrat,sans-serif", paddingLeft:14 }}>Affected: {g.affected} · src: {g.src}</div>}
        </div>
      ))}
    </div>
  );

  if (id === "investments") return (
    <div>
      {INV.map((inv, i) => (
        <div key={i} className="inv-item">
          <div>
            <div className="inv-co">{inv.co}</div>
            <div className="inv-sec">{inv.sector}</div>
          </div>
          <div className="inv-val">{inv.val}</div>
        </div>
      ))}
    </div>
  );

  if (id === "layoffs") return (
    <div>
      {LAYOFFS.map((l, i) => (
        <div key={i} className="lo-item">
          <div>
            <div className="lo-co">{l.co}</div>
            <div className="lo-sec">{l.sector} · {l.date}</div>
          </div>
          <div className="lo-num">{l.num}</div>
        </div>
      ))}
    </div>
  );

  // News feed panels
  if (newsFeedMap[id]) {
    const { fn, key } = newsFeedMap[id];
    return <NewsPanel fetchFn={fn} cacheKey={key} />;
  }

  return <div style={{ color: "var(--t3)", fontFamily: "Montserrat", fontSize: 10, padding: 8 }}>Panel: {id}</div>;
}

/* ── PANEL ITEM ────────────────────────────────────────────── */
function PanelItem({ panelId, flex, rowH, variant, onRemove, onMoveLeft, onMoveRight, onDragStart, onDragOver, onDrop }) {
  const def = PANEL_MAP[panelId];
  if (!def) return null;
  const scrollable = ["news-global","news-middleeast","news-africa","news-latam","econ-calendar",
    "news-thinktanks","news-finance","news-tech","military","cyber","insights","supply-chain",
    "theater","cii","predictions","displacement","earthquakes","fires","crypto","commodities",
    "layoffs","investments","gps-jamming","carrier-groups","wargaming","defcon"].includes(panelId);

  return (
    <div
      className="panel widget"
      id={`widget-${panelId}`}
      style={{ flex, height: rowH, minWidth: 180 }}
      draggable={panelId !== 'map'}
      onDragStart={e => { if (panelId === 'map') { e.preventDefault(); return; } onDragStart(e, panelId); }}
      onDragOver={e => { if (panelId !== 'map') { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}}
      onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
      onDrop={e => { e.currentTarget.classList.remove('drag-over'); onDrop(e, panelId); }}
    >
      <div className="ph">
        <div className="ptitle">
          <div className="pbar" style={{ background: def.accent }} />
          {def.label}
        </div>
        <div className="pctrls">
          <span className="pmeta">{def.cat.toUpperCase()}</span>
          <button className="pibtn" title="Move left"  onClick={() => onMoveLeft(panelId)}>‹</button>
          <button className="pibtn" title="Move right" onClick={() => onMoveRight(panelId)}>›</button>
          <button className="pibtn" title="Remove" onClick={() => onRemove(panelId)}>✕</button>
        </div>
      </div>
      <div
        className={`pb ${scrollable ? "scroll" : ""}`}
        style={{ height: rowH - 36, padding: panelId === "map" ? 0 : undefined,
          overflow: panelId === "map" ? "hidden" : undefined,
          pointerEvents: 'auto' }}
      >
        <PanelContent id={panelId} variant={variant} />
      </div>
    </div>
  );
}


/* ── PANEL PICKER ──────────────────────────────────────────── */
function PanelPicker({ variant, onAdd, onClose }) {
  const available = PANELS.filter(p => p.variants.includes(variant));
  const cats = [...new Set(available.map(p => p.cat))];
  return (
    <div className="modal-bg" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hdr">
          <div>
            <div className="modal-title">Add Panel</div>
            <div className="modal-sub">Click to add to last column</div>
          </div>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {cats.map(cat => (
            <div key={cat}>
              <div style={{ fontFamily: "Montserrat", fontSize: 8, color: "var(--t4)", letterSpacing: ".15em", padding: "8px 8px 4px", textTransform: "uppercase" }}>{cat}</div>
              {available.filter(p => p.cat === cat).map(p => (
                <div key={p.id} className="pt" onClick={() => { onAdd(p.id); onClose(); }}>
                  <div>
                    <div className="pt-name">{p.label}</div>
                    <div className="pt-cat">{p.cat}</div>
                  </div>
                  <button className="add-btn-sm" onClick={e => { e.stopPropagation(); onAdd(p.id); onClose(); }}>+ ADD</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── BREAKING TICKER (real news headlines) ──────────────────── */
function BreakingTicker({ variant }) {
  const { data } = useDataFetcher(
    `breaking-${variant}`,
    () => fetchLiveNews(variant),
    { ttl: TTL.news }
  );
  const items = (data || []).map(n => `${n.h}`);
  if (!items.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="brk">
      <div className="blbl">● LIVE</div>
      <div className="twrap">
        <div className="ticker">
          {doubled.map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ── MAIN APP ───────────────────────────────────────────────── */
/* ── PIZZA INDEX MODAL ────────────────────────────────────── */
function PizzaIndexModal({ onClose }) {
  const { level, doomsday, triggers, pizzaIndex } = DEFCON_DATA;
  const pizzint = usePizzINT();
  const tension = pizzint?.tension;
  const liveDefcon = tension?.defconLevel || level;
  const livePct = tension?.tensionScore || pizzaIndex.pct;
  const liveLabel = tension?.label || pizzaIndex.overall;
  const liveDesc = tension ? `Global conflict tension score: ${tension.tensionScore}/100 based on ${tension.markets?.length || 0} active Polymarket conflict markets.` : '';
  const liveMarkets = tension?.markets || [];
  const PIZZA_URL = 'https://www.pizzint.watch/';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9000,
      display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'var(--base)', border:'1px solid #F59E0B44', borderRadius:8,
        width:'min(860px, 95vw)', maxHeight:'85vh', display:'flex', flexDirection:'column',
        boxShadow:'0 20px 60px rgba(0,0,0,0.9)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)',
          display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:20 }}>🌐</span>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--t1)',
                fontFamily:'Montserrat,sans-serif' }}>ARKA Intel — Conflict Markets</div>
              <div style={{ fontSize:8, color:'#F59E0B', fontFamily:'Montserrat,sans-serif',
                marginTop:2, fontWeight:700, letterSpacing:'.08em' }}>
                POLYMARKET CONFLICT PROBABILITIES · {liveLabel} · DEFCON {liveDefcon}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border)',
            borderRadius:4, color:'var(--t3)', cursor:'pointer', padding:'4px 10px', fontSize:13 }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>

          {/* Tension summary */}
          {tension && (
            <div style={{ marginBottom:16, padding:'10px 12px', borderRadius:6,
              background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)' }}>
              <div style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif',
                letterSpacing:'.15em', marginBottom:6 }}>GLOBAL CONFLICT TENSION INDEX</div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#F59E0B',
                  fontFamily:'Montserrat,sans-serif' }}>{liveLabel}</span>
                <span style={{ fontSize:11, fontWeight:800, color:'#EF4444',
                  fontFamily:'Montserrat,sans-serif' }}>Score: {livePct}/100</span>
              </div>
              <div style={{ fontSize:9, color:'var(--t2)', fontFamily:'Montserrat,sans-serif',
                lineHeight:1.5 }}>{liveDesc}</div>
            </div>
          )}

          {/* Live Polymarket markets */}
          {liveMarkets.length > 0 ? (
            <div>
              <div style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif',
                letterSpacing:'.15em', marginBottom:10 }}>ACTIVE CONFLICT MARKETS ({liveMarkets.length})</div>
              {liveMarkets.map((m, i) => {
                const pct = Math.round((m.price || 0) * 100);
                const col = pct > 20 ? '#EF4444' : pct > 10 ? '#F59E0B' : '#10B981';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8,
                    padding:'8px 10px', borderRadius:4, background:'var(--elevated)',
                    borderLeft:`2px solid ${col}` }}>
                    <span style={{ flex:1, fontSize:9, color:'var(--t1)',
                      fontFamily:'Montserrat,sans-serif', lineHeight:1.4 }}>{m.label || m.question}</span>
                    <div style={{ width:80, height:5, background:'var(--border)', borderRadius:2, flexShrink:0 }}>
                      <div style={{ width:`${Math.min(100, pct * 2)}%`, height:'100%',
                        background:col, borderRadius:2 }} />
                    </div>
                    <span style={{ fontSize:11, fontWeight:800, color:col,
                      fontFamily:'Montserrat,sans-serif', width:38, textAlign:'right',
                      flexShrink:0 }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif',
                letterSpacing:'.15em', marginBottom:10 }}>GEOPOLITICAL TRIGGERS</div>
              {triggers.map((t, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
                  <span style={{ fontSize:13, flexShrink:0 }}>{t.icon}</span>
                  <span style={{ fontSize:9, color:'var(--t2)', fontFamily:'Montserrat,sans-serif',
                    lineHeight:1.5 }}>{t.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'6px 16px', borderTop:'1px solid var(--border)', flexShrink:0,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif' }}>
            Source: Polymarket · ARKA Intelligence Center
          </span>
          <a href={PIZZA_URL} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:8, color:'#F59E0B', textDecoration:'none',
              fontFamily:'Montserrat,sans-serif' }}>🍕 PizzINT ↗</a>
        </div>
      </div>
    </div>
  );
}

function ModalHost() {
  const [modal, setModal] = useState(null);
  useEffect(() => modalStore.subscribe(setModal), []);
  if (!modal) return null;
  if (modal === 'pizza') return <PizzaIndexModal onClose={() => modalStore.close()} />;
  return null;
}

/* ── INTEL DRAWER WRAPPER — lee del intelStore global ───────── */
function IntelDrawerWrapper(props) {
  const [intel, setIntel] = useState(intelStore.insights);
  useEffect(() => intelStore.subscribe(setIntel), []);
  return <IntelDrawer {...props} insights={intel.data || []} loading={intel.loading} />;
}

/* ── INTEL BRIEFING DRAWER ──────────────────────────────────── */
// Panel lateral tipo worldmonitor — hallazgos consolidados
function IntelDrawer({ insights, loading, risks, theater, cyber, carriers, onClose }) {
  const [tab, setTab] = useState('summary');
  const tabs = [
    { id: 'summary',  label: '⚡ Summary'  },
    { id: 'threats',  label: '🔴 Threats'  },
    { id: 'markets',  label: '📊 Markets'  },
    { id: 'signals',  label: '📡 Signals'  },
  ];

  const critical = risks.filter(r => r.score >= 80);
  const cyberCrit = cyber.filter(c => c.sev === 'critical');

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:8000,
      display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
    <div style={{
      width: 'min(820px, 95vw)', maxHeight: '88vh',
      background: 'var(--base)', border: '1px solid var(--border)',
      borderRadius: 8, zIndex: 500, display: 'flex', flexDirection: 'column',
      boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
      animation: 'fadeInScale .2s ease-out',
    }} onClick={e => e.stopPropagation()}>
      <style>{`@keyframes fadeInScale{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* Header */}
      <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:800, color:'var(--t1)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.1em', textTransform:'uppercase' }}>⚡ INTEL BRIEFING</div>
          <div style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif', marginTop:2 }}>ARKA Intelligence Center · {new Date().toUTCString().slice(0,25)} UTC</div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'1px solid var(--border)', borderRadius:4, color:'var(--t3)', cursor:'pointer', padding:'4px 8px', fontSize:11 }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, padding:'8px 4px', border:'none', background:'none', cursor:'pointer',
            fontSize:8, fontFamily:'Montserrat,sans-serif', fontWeight:700, letterSpacing:'.06em',
            color: tab === t.id ? 'var(--blue)' : 'var(--t3)',
            borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
            textTransform:'uppercase',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>

        {tab === 'summary' && (
          <div>
            {/* AI Insights */}
            <div style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8 }}>AI Analysis</div>
            {loading && <div style={{ color:'var(--t3)', fontSize:9, fontFamily:'Montserrat,sans-serif', padding:8 }}>Generating intelligence summary...</div>}
            {(insights||[]).map((ins, i) => (
              <div key={i} style={{ marginBottom:10, padding:'8px 10px', background:'var(--surface)', borderRadius:6, borderLeft:`2px solid ${i===0?'#EF4444':i===1?'#F59E0B':'#3B82F6'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--t1)', fontFamily:'Montserrat,sans-serif' }}>{ins.head}</div>
                  <span style={{ fontSize:8, color:'var(--t3)', fontFamily:'Montserrat,sans-serif' }}>{ins.conf}</span>
                </div>
                <div style={{ fontSize:9, color:'var(--t2)', fontFamily:'Montserrat,sans-serif', lineHeight:1.5 }}>{ins.body}</div>
              </div>
            ))}
            {!loading && !insights?.length && (
              <div style={{ color:'var(--t4)', fontSize:9, fontFamily:'Montserrat,sans-serif', textAlign:'center', padding:20 }}>
                Waiting for live news feed to generate AI insights...
              </div>
            )}

            {/* Quick stats */}
            <div style={{ marginTop:12, fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8 }}>Situation Overview</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {[
                { label:'Active Conflicts', val: risks.filter(r=>r.score>=85).length, col:'#EF4444' },
                { label:'High Risk States', val: risks.filter(r=>r.score>=70).length, col:'#F59E0B' },
                { label:'Critical Cyber',   val: cyberCrit.length, col:'#8B5CF6' },
                { label:'Naval Groups',     val: carriers.length, col:'#3B82F6' },
              ].map((s,i) => (
                <div key={i} style={{ padding:'8px 10px', background:'var(--surface)', borderRadius:6, textAlign:'center' }}>
                  <div style={{ fontSize:20, fontWeight:800, color:s.col, fontFamily:'Montserrat,sans-serif' }}>{s.val}</div>
                  <div style={{ fontSize:8, color:'var(--t3)', fontFamily:'Montserrat,sans-serif', textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'threats' && (
          <div>
            <div style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8 }}>Theater Status</div>
            {theater.map((t, i) => (
              <div key={i} style={{ marginBottom:6, padding:'7px 10px', background:'var(--surface)', borderRadius:5, display:'flex', alignItems:'flex-start', gap:8 }}>
                <span style={{ fontSize:13, flexShrink:0 }}>{t.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--t1)', fontFamily:'Montserrat,sans-serif' }}>{t.theater}</div>
                  <div style={{ fontSize:8, color:'var(--t2)', fontFamily:'Montserrat,sans-serif', marginTop:2, lineHeight:1.4 }}>{t.status}</div>
                </div>
              </div>
            ))}
            <div style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.12em', textTransform:'uppercase', margin:'12px 0 8px' }}>Critical Risk Countries</div>
            {critical.map((r, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 8px', marginBottom:4, background:'var(--surface)', borderRadius:4 }}>
                <span style={{ fontSize:9, fontFamily:'Montserrat,sans-serif', fontWeight:700, color:r.color, width:70 }}>{r.country}</span>
                <div style={{ flex:1, height:4, background:'var(--border)', borderRadius:2 }}>
                  <div style={{ width:`${r.score}%`, height:'100%', background:r.color, borderRadius:2 }} />
                </div>
                <span style={{ fontSize:9, color:r.color, fontFamily:'Montserrat,sans-serif', fontWeight:700, width:24, textAlign:'right' }}>{r.score}</span>
                <span style={{ fontSize:9, color:r.trend==='▲'?'#EF4444':r.trend==='▼'?'#10B981':'#6B7280' }}>{r.trend}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'markets' && (
          <div>
            <div style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8 }}>Carrier Group Positions</div>
            {carriers.map((c, i) => (
              <div key={i} style={{ padding:'7px 10px', marginBottom:5, background:'var(--surface)', borderRadius:5 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--t1)', fontFamily:'Montserrat,sans-serif' }}>{c.flag} {c.name}</div>
                  <span style={{ fontSize:8, padding:'1px 5px', borderRadius:3, background:'rgba(59,130,246,.15)', color:'#3B82F6', fontFamily:'Montserrat,sans-serif', fontWeight:700 }}>{c.type}</span>
                </div>
                <div style={{ fontSize:8, color:'var(--t3)', fontFamily:'Montserrat,sans-serif', marginTop:3 }}>{c.region} · {c.status}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'signals' && (
          <div>
            <div style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif', letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8 }}>Cyber Threat Intelligence</div>
            {cyber.map((c, i) => (
              <div key={i} style={{ marginBottom:6, padding:'7px 10px', background:'var(--surface)', borderRadius:5, borderLeft:`2px solid ${c.sev==='critical'?'#EF4444':c.sev==='high'?'#F59E0B':'#3B82F6'}` }}>
                <div style={{ display:'flex', gap:6, marginBottom:3 }}>
                  <span style={{ fontSize:7, padding:'1px 5px', borderRadius:10, fontWeight:700, fontFamily:'Montserrat,sans-serif', textTransform:'uppercase',
                    background: c.sev==='critical'?'rgba(239,68,68,.15)':c.sev==='high'?'rgba(245,158,11,.15)':'rgba(59,130,246,.15)',
                    color: c.sev==='critical'?'#EF4444':c.sev==='high'?'#F59E0B':'#3B82F6' }}>{c.sev}</span>
                  <span style={{ fontSize:8, color:'var(--t4)', fontFamily:'Montserrat,sans-serif' }}>{c.src}</span>
                </div>
                <div style={{ fontSize:9, color:'var(--t2)', fontFamily:'Montserrat,sans-serif', lineHeight:1.4 }}>{c.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}


export default function App() {
  const [variant, setVariant] = useState("global");
  const [theme, setTheme] = useState("dark");
  const [layout, setLayout] = useState(() => JSON.parse(JSON.stringify(DEFAULT_LAYOUT)));
  const [showPicker, setShowPicker] = useState(false);
  const [showIntelDrawer, setShowIntelDrawer] = useState(false);
  const [pickerColId, setPickerColId] = useState(null);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  useEffect(() => { window.__arkaMapFullscreen = setMapFullscreen; return () => { delete window.__arkaMapFullscreen; }; }, []);
  // Inject fonts + CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = FONTS + CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // ── Row/panel layout handlers ──────────────────────────────
  const drag = useRef(null);

  const onDragStart = useCallback((panelId) => {
    drag.current = panelId;
  }, []);

  const onDrop = useCallback((panelId) => {
    const src = drag.current;
    if (!src || src === panelId) return;
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const rows = next[variant];
      let srcRow, srcIdx, dstRow, dstIdx;
      rows.forEach((row, ri) => {
        row.panels.forEach((p, pi) => {
          if (p.id === src)     { srcRow = ri; srcIdx = pi; }
          if (p.id === panelId) { dstRow = ri; dstIdx = pi; }
        });
      });
      if (srcRow === undefined || dstRow === undefined) return prev;
      const [moved] = rows[srcRow].panels.splice(srcIdx, 1);
      rows[dstRow].panels.splice(dstIdx, 0, moved);
      // limpiar filas vacías
      next[variant] = next[variant].filter(r => r.panels.length > 0);
      return next;
    });
    drag.current = null;
  }, [variant]);

  const movePanelLeft = useCallback((panelId) => {
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const rows = next[variant];
      for (const row of rows) {
        const idx = row.panels.findIndex(p => p.id === panelId);
        if (idx > 0) { [row.panels[idx-1], row.panels[idx]] = [row.panels[idx], row.panels[idx-1]]; break; }
      }
      return next;
    });
  }, [variant]);

  const movePanelRight = useCallback((panelId) => {
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const rows = next[variant];
      for (const row of rows) {
        const idx = row.panels.findIndex(p => p.id === panelId);
        if (idx >= 0 && idx < row.panels.length - 1) { [row.panels[idx], row.panels[idx+1]] = [row.panels[idx+1], row.panels[idx]]; break; }
      }
      return next;
    });
  }, [variant]);

  const removePanel = useCallback((panelId) => {
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[variant] = next[variant].map(row => ({
        ...row, panels: row.panels.filter(p => p.id !== panelId)
      })).filter(row => row.panels.length > 0);
      return next;
    });
  }, [variant]);

  const addPanel = useCallback((panelId) => {
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const all = next[variant].flatMap(r => r.panels.map(p => p.id));
      if (all.includes(panelId)) return prev;
      // agregar a última fila o nueva fila si está llena
      const lastRow = next[variant][next[variant].length - 1];
      if (lastRow && lastRow.panels.length < 5) {
        lastRow.panels.push({ id: panelId, flex: 1 });
      } else {
        next[variant].push({ h: 280, panels: [{ id: panelId, flex: 1 }] });
      }
      return next;
    });
  }, [variant]);

  // Row height resize
  const startRowResize = useCallback((e, rowIdx) => {
    e.preventDefault();
    const startY = e.clientY;
    const rows = layout[variant];
    const startH = rows[rowIdx].h;
    const onMv = (ev) => {
      setLayout(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next[variant][rowIdx].h = Math.max(150, startH + ev.clientY - startY);
        return next;
      });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMv); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMv);
    window.addEventListener("mouseup", onUp);
  }, [layout, variant]);

  const startColResize = useCallback((e, rowIdx, panelIdx) => {
    e.preventDefault();
    const startX = e.clientX;
    const rowPanels = layout[variant][rowIdx].panels;
    const leftFlex  = rowPanels[panelIdx].flex;
    const rightFlex = rowPanels[panelIdx + 1]?.flex;
    if (rightFlex === undefined) return;
    const total = leftFlex + rightFlex;
    const rowEl = e.currentTarget.closest('.wrow');
    const rowW  = rowEl ? rowEl.offsetWidth : 800;
    const pxPerFlex = rowW / total;
    const startLeftPx = leftFlex * pxPerFlex;
    const onMv = (ev) => {
      const delta = ev.clientX - startX;
      const newLeftPx = Math.max(150, Math.min(startLeftPx + delta, rowW - 150));
      const newLeft  = Math.round((newLeftPx / rowW) * total * 10) / 10;
      const newRight = Math.round((total - newLeft) * 10) / 10;
      setLayout(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        next[variant][rowIdx].panels[panelIdx].flex     = newLeft;
        next[variant][rowIdx].panels[panelIdx + 1].flex = newRight;
        return next;
      });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMv); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMv);
    window.addEventListener('mouseup', onUp);
  }, [layout, variant]);

  const resetLayout = useCallback(() => setLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT))), []);

  const rows = layout[variant];
  const totalPanels = rows.reduce((s, r) => s + r.panels.length, 0);


  return (
    <div className={`app ${theme}`}>
      {/* Breaking ticker */}
      <BreakingTicker variant={variant} />

      {/* Header */}
      <div className="hdr">
        <div className="brand">
          <img src="/logo_arka.png" alt="ARKA" className="logo-img" style={{ height: 38, width: "auto", objectFit: "contain" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="bname">ARKA</div>
            <div className="bsub">Intelligence Center</div>
          </div>
          <div className="bpulse" />
        </div>
        <div className="vdiv" />
        <div className="vsw">
          {["global","finance","tech"].map(v => (
            <button key={v} className={`vbtn ${variant === v ? `active ${v}` : ""}`} onClick={() => setVariant(v)}>
              {v}
            </button>
          ))}
        </div>
        <div className="ibadge">✦ {({ global: "GEOPOLITICAL", finance: "FINANCIAL", tech: "TECHNOLOGY" })[variant]}</div>
        <div className="hr">
          <div className="srow">
            <div className="schip"><div className="sdot" />LIVE</div>
            <div className="schip"><div className="sdot w" />APIS</div>
          </div>
          <Clock />
          <button className={`hbtn ${showIntelDrawer ? 'on' : ''}`} title="Intel Briefing" onClick={() => setShowIntelDrawer(p => !p)} style={{ letterSpacing:'.05em', fontSize:9, padding:'3px 8px', width:'auto' }}>⚡ INTEL</button>
          <button className="hbtn" title="Add Panel" onClick={() => setShowPicker(true)}>⊞</button>
          <button className="hbtn" title="Reset Layout" onClick={resetLayout}>↺</button>
          <button className={`hbtn ${theme === "light" ? "on" : ""}`} title="Toggle theme" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀" : "◑"}
          </button>
        </div>
      </div>

      <ModalHost />

      {/* ── INTEL DRAWER ─────────────────────────────────── */}
      {showIntelDrawer && <IntelDrawerWrapper
        risks={RISKS}
        theater={THEATER}
        cyber={CYBER}
        carriers={CARRIER_GROUPS}
        onClose={() => setShowIntelDrawer(false)}
      />}

      {/* Body */}
      <div className="body">
        {/* Workspace — filas */}
        <div className="workspace">
          {rows.map((row, rowIdx) => (
            <React.Fragment key={rowIdx}>
              <div className="wrow" style={{ height: row.h }}>
                {row.panels.map(({ id: panelId, flex }, pIdx) => (
                  <React.Fragment key={panelId}>
                    <PanelItem
                      panelId={panelId}
                      flex={flex}
                      rowH={row.h}
                      variant={variant}
                      onRemove={removePanel}
                      onMoveLeft={movePanelLeft}
                      onMoveRight={movePanelRight}
                      onDragStart={onDragStart}
                      onDrop={onDrop}
                    />
                    {pIdx < row.panels.length - 1 && (
                      <div className="col-resize-handle" onMouseDown={e => startColResize(e, rowIdx, pIdx)} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="wrow-resize" onMouseDown={e => startRowResize(e, rowIdx)} />
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="fitem">Panels <span>{totalPanels}</span></div>
        <div className="fitem">Variant <span>{variant.toUpperCase()}</span></div>
        <div className="fitem">ARKA Intelligence Center <span>v1.1.0</span></div>
        <div className="fitem" style={{ marginLeft: "auto" }}>
          APIs: Finnhub · FRED · NYT · USGS · NASA FIRMS · Groq (relay) · Polymarket · UNHCR · OpenSky · AIS
        </div>
      </div>

      {/* Panel Picker */}
      {showPicker && (
        <PanelPicker
          variant={variant}
          onAdd={addPanel}
          onClose={() => { setShowPicker(false); setPickerColId(null); }}
        />
      )}
    </div>
  );
}
