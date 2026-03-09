import { useState, useEffect, useRef, useCallback } from "react";
import { useDataFetcher, formatLastUpdate } from "./hooks/useDataFetcher.js";
import { fetchMarkets, fetchCommodities, fetchCrypto } from "./api/markets.js";
import { fetchMacro } from "./api/macro.js";
import {
  fetchNewsGlobal, fetchNewsMiddleEast, fetchNewsAfrica, fetchNewsLatam,
  fetchNewsEnergy, fetchNewsThinkTanks, fetchNewsFinance, fetchNewsTech,
  fetchLiveNews,
} from "./api/news.js";
import { fetchEarthquakes, fetchFires, fetchPredictions, fetchDisplacement } from "./api/geo.js";
import { fetchInsights, fetchDeduction } from "./api/ai.js";
import { TTL } from "./api/config.js";

/* ── FONTS & CSS ─────────────────────────────────────────── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');`;

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

.app.dark{
  --void:#01050F;--base:#050B1A;--surface:#080F22;--elevated:#0C1530;--hover:#10193A;
  --border:rgba(255,255,255,0.055);--border-hi:rgba(59,130,246,0.4);
  --blue:#3B82F6;--blue-dim:rgba(59,130,246,0.1);--blue-glow:rgba(59,130,246,0.18);
  --gold:#C9A84C;--gold-dim:rgba(201,168,76,0.1);
  --green:#10B981;--green-dim:rgba(16,185,129,0.1);
  --red:#EF4444;--red-dim:rgba(239,68,68,0.1);
  --amber:#F59E0B;--purple:#8B5CF6;
  --t1:#EDF2FF;--t2:#8BA4CC;--t3:#3D5478;--t4:#1A2A44;
  --shadow:rgba(0,0,0,0.5);--scroll:rgba(255,255,255,0.07);
}
.app.light{
  --void:#EEF2FC;--base:#FFFFFF;--surface:#F7F9FF;--elevated:#EBF0FC;--hover:#E2E9F8;
  --border:rgba(37,99,235,0.11);--border-hi:rgba(37,99,235,0.35);
  --blue:#2563EB;--blue-dim:rgba(37,99,235,0.07);--blue-glow:rgba(37,99,235,0.14);
  --gold:#9A6F0A;--gold-dim:rgba(154,111,10,0.08);
  --green:#047857;--green-dim:rgba(4,120,87,0.08);
  --red:#C91919;--red-dim:rgba(201,25,25,0.08);
  --amber:#B45309;--purple:#6D28D9;
  --t1:#0F172A;--t2:#2D4A7A;--t3:#7A91B8;--t4:#C5D3EC;
  --shadow:rgba(37,99,235,0.07);--scroll:rgba(37,99,235,0.1);
}

body{margin:0;font-family:'Montserrat',sans-serif;font-size:13px;overflow:hidden;height:100vh;width:100vw}
.app{display:flex;flex-direction:column;height:100vh;width:100vw;overflow:hidden;background:var(--void);color:var(--t1);transition:background .25s,color .25s}

.brk{height:26px;min-height:26px;background:linear-gradient(90deg,rgba(239,68,68,.1),transparent);border-bottom:1px solid rgba(239,68,68,.15);display:flex;align-items:center;overflow:hidden}
.blbl{font-family:'JetBrains Mono',monospace;font-size:8.5px;font-weight:500;letter-spacing:.18em;color:var(--red);padding:0 10px;height:100%;display:flex;align-items:center;border-right:1px solid rgba(239,68,68,.15);white-space:nowrap;flex-shrink:0;background:rgba(239,68,68,.05)}
.twrap{flex:1;overflow:hidden}
.ticker{display:inline-flex;gap:40px;white-space:nowrap;padding-left:20px;animation:scroll 75s linear infinite;font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--t2);letter-spacing:.03em}
@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

.hdr{display:flex;align-items:center;height:48px;min-height:48px;padding:0 14px;background:var(--base);border-bottom:1px solid var(--border);gap:12px;position:relative;z-index:300}
.hdr::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:1px;background:linear-gradient(90deg,var(--blue) 0%,transparent 40%);opacity:.35}
.brand{display:flex;align-items:center;gap:7px;flex-shrink:0}
.bname{font-weight:700;font-size:17px;letter-spacing:.28em;color:var(--t1)}
.bpulse{width:5px;height:5px;border-radius:50%;background:var(--blue);box-shadow:0 0 7px var(--blue);animation:pulse 2s ease-in-out infinite;flex-shrink:0}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.6)}}
.bsub{font-family:'JetBrains Mono',monospace;font-size:7.5px;color:var(--t3);letter-spacing:.2em;text-transform:uppercase}
.vdiv{width:1px;height:20px;background:var(--border);flex-shrink:0}
.vsw{display:flex;gap:1px;background:var(--elevated);border:1px solid var(--border);border-radius:4px;padding:2px}
.vbtn{font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.12em;padding:3px 12px;border:none;background:transparent;color:var(--t3);cursor:pointer;border-radius:3px;transition:all .15s;text-transform:uppercase}
.vbtn:hover{color:var(--t2);background:var(--hover)}
.vbtn.active{background:var(--blue);color:#fff;box-shadow:0 0 12px var(--blue-glow)}
.vbtn.active.finance{background:var(--gold);color:#fff}
.vbtn.active.tech{background:var(--green);color:#fff}
.ibadge{display:flex;align-items:center;gap:5px;border:1px solid rgba(201,168,76,.2);border-radius:3px;padding:2px 8px;font-family:'JetBrains Mono',monospace;font-size:7.5px;color:var(--gold);letter-spacing:.12em;background:var(--gold-dim);flex-shrink:0}
.hr{margin-left:auto;display:flex;align-items:center;gap:10px;flex-shrink:0}
.srow{display:flex;align-items:center;gap:8px}
.schip{display:flex;align-items:center;gap:4px;font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--t2)}
.sdot{width:4px;height:4px;border-radius:50%;background:var(--green);box-shadow:0 0 4px var(--green)}
.sdot.w{background:var(--amber);box-shadow:0 0 4px var(--amber)}
.sdot.o{background:var(--t4);box-shadow:none}
.clock{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--t2);letter-spacing:.05em}
.hbtn{display:flex;align-items:center;justify-content:center;width:29px;height:29px;border:1px solid var(--border);border-radius:5px;background:transparent;color:var(--t3);cursor:pointer;font-size:13px;transition:all .15s}
.hbtn:hover{border-color:var(--blue);color:var(--blue);background:var(--blue-dim)}
.hbtn.on{border-color:var(--blue);color:var(--blue);background:var(--blue-dim)}

.body{display:flex;flex:1;overflow:hidden}
.sidebar{width:40px;min-width:40px;background:var(--base);border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;padding:8px 0;gap:2px}
.nbtn{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:none;background:transparent;color:var(--t3);cursor:pointer;border-radius:4px;font-size:13px;transition:all .15s;position:relative}
.nbtn:hover{background:var(--hover);color:var(--t2)}
.nbtn.active{color:var(--blue);background:var(--blue-dim)}
.nbtn.active::before{content:'';position:absolute;left:0;top:4px;bottom:4px;width:2px;background:var(--blue);border-radius:0 2px 2px 0}
.nsp{flex:1}

.workspace{flex:1;overflow-x:auto;overflow-y:hidden;display:flex;padding:10px;gap:9px;min-height:0}
.workspace::-webkit-scrollbar{height:4px}
.workspace::-webkit-scrollbar-track{background:transparent}
.workspace::-webkit-scrollbar-thumb{background:var(--scroll);border-radius:2px}

.col{display:flex;flex-direction:column;gap:9px;overflow-y:auto;overflow-x:hidden;flex-shrink:0;padding-bottom:40px;position:relative}
.col::-webkit-scrollbar{width:3px}
.col::-webkit-scrollbar-track{background:transparent}
.col::-webkit-scrollbar-thumb{background:var(--scroll);border-radius:2px}
.col.w1{width:320px}.col.w2{width:420px}.col.w3{width:520px}
.col-header{display:flex;align-items:center;gap:6px;padding:0 2px 4px;position:sticky;top:0;background:var(--void);z-index:10}
.col-label{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--t4);letter-spacing:.15em;flex:1}
.col-resizer{position:absolute;right:-5px;top:0;bottom:0;width:9px;cursor:col-resize;z-index:20;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}
.col:hover .col-resizer{opacity:1}
.col-resizer::after{content:'';width:2px;height:30px;border-radius:1px;background:var(--blue);opacity:.5}
.cbtn{font-size:11px;border:1px solid var(--border);border-radius:3px;background:transparent;color:var(--t3);cursor:pointer;padding:1px 5px;line-height:1}
.cbtn:hover{color:var(--blue);border-color:var(--blue)}
.delbtn{font-size:9px;border:none;background:transparent;color:var(--t4);cursor:pointer;padding:1px 4px}
.delbtn:hover{color:var(--red)}
.add-panel-btn{width:100%;margin-top:4px;padding:8px;border:1px dashed var(--border);background:transparent;color:var(--t4);cursor:pointer;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.1em;transition:all .15s}
.add-panel-btn:hover{border-color:var(--blue);color:var(--blue);background:var(--blue-dim)}

.panel{background:var(--base);border:1px solid var(--border);border-radius:8px;display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;position:relative;transition:border-color .15s}
.panel:hover{border-color:rgba(59,130,246,0.15)}
.ph{display:flex;align-items:center;justify-content:space-between;padding:0 10px;height:36px;min-height:36px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0}
.ptitle{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:600;letter-spacing:.08em;color:var(--t2);text-transform:uppercase}
.pbar{width:2px;height:12px;border-radius:1px;flex-shrink:0}
.pctrls{display:flex;align-items:center;gap:4px}
.pmeta{font-family:'JetBrains Mono',monospace;font-size:7.5px;color:var(--t4);letter-spacing:.1em}
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
.panel-error{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--red);opacity:.7;padding:4px 0}
.panel-empty{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--t4);padding:4px 0}

/* news */
.nitem{padding:7px 0;border-bottom:1px solid var(--border)}
.nitem:last-child{border-bottom:none}
.nsrc{display:flex;align-items:center;gap:5px;font-family:'JetBrains Mono',monospace;font-size:8.5px;color:var(--t3);margin-bottom:3px;flex-wrap:wrap}
.ntag{padding:1px 5px;border-radius:2px;font-size:7.5px;letter-spacing:.08em;font-weight:600}
.ntag.tc{background:var(--red-dim);color:var(--red)}
.ntag.th{background:rgba(245,158,11,.1);color:var(--amber)}
.ntag.tm{background:var(--blue-dim);color:var(--blue)}
.nhead{font-size:11.5px;line-height:1.45;color:var(--t1);cursor:pointer}
.nhead:hover{color:var(--blue)}
.ntime{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--t4);margin-top:2px}

/* markets */
.mtbl{width:100%;border-collapse:collapse;font-size:11.5px}
.mtbl th{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--t4);letter-spacing:.1em;text-align:left;padding-bottom:6px;font-weight:500}
.mtbl th:not(:first-child){text-align:right}
.mtbl td{padding:4px 0;border-bottom:1px solid var(--border)}
.mtbl tr:last-child td{border-bottom:none}
.mtbl td:not(:first-child){text-align:right}
.tick{font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:500;color:var(--t2)}
.cup{color:var(--green)}
.cdn{color:var(--red)}
.cbadge{font-family:'JetBrains Mono',monospace;font-size:9.5px;padding:1px 5px;border-radius:3px}
.cbadge.up{background:var(--green-dim);color:var(--green)}
.cbadge.dn{background:var(--red-dim);color:var(--red)}
.cr-item{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)}
.cr-item:last-child{border-bottom:none}
.cr-sym{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--t1)}
.cr-name{font-size:9px;color:var(--t3);margin-top:1px}
.cr-price{font-family:'JetBrains Mono',monospace;font-size:11px;text-align:right}
.cr-chg{font-family:'JetBrains Mono',monospace;font-size:9.5px;text-align:right;margin-top:1px}
.com-item{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)}
.com-item:last-child{border-bottom:none}
.com-name{font-size:11px;color:var(--t2)}
.cr-price{font-family:'JetBrains Mono',monospace;font-size:11px}

/* macro */
.macro-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mc{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px;display:flex;flex-direction:column;gap:3px}
.mc-lbl{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--t3);letter-spacing:.1em;text-transform:uppercase}
.mc-val{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:600;color:var(--t1)}
.mc-sub{font-size:9px;color:var(--t4)}

/* CII risk */
.rrow{display:flex;align-items:center;gap:8px;padding:4px 0}
.rcty{font-size:10px;color:var(--t2);width:80px;flex-shrink:0}
.rbar-w{flex:1;height:4px;background:var(--elevated);border-radius:2px;overflow:hidden}
.rbar{height:100%;border-radius:2px;transition:width .5s}
.rscore{font-family:'JetBrains Mono',monospace;font-size:10px;width:24px;text-align:right;flex-shrink:0}

/* predictions */
.pitem{padding:7px 0;border-bottom:1px solid var(--border)}
.pitem:last-child{border-bottom:none}
.pq{font-size:10.5px;color:var(--t1);line-height:1.4;margin-bottom:6px}
.pbar2{height:4px;background:var(--elevated);border-radius:2px;overflow:hidden;margin-bottom:4px}
.pyes{height:100%;background:var(--blue);border-radius:2px;transition:width .5s}
.plbls{display:flex;justify-content:space-between}
.plbls .y{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--blue)}
.plbls .n{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--t4)}

/* military */
.mil-item{display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.mil-item:last-child{border-bottom:none}
.mil-ico{font-size:15px;width:20px;flex-shrink:0;margin-top:1px}
.mil-cty{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--blue);letter-spacing:.08em;margin-bottom:2px}
.mil-txt{font-size:10.5px;color:var(--t2);line-height:1.4}

/* cyber */
.cy-item{display:flex;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.cy-item:last-child{border-bottom:none}
.cysev{font-family:'JetBrains Mono',monospace;font-size:7.5px;padding:2px 5px;border-radius:2px;flex-shrink:0;height:fit-content;margin-top:2px;text-transform:uppercase}
.cysev.tc{background:var(--red-dim);color:var(--red)}
.cysev.th{background:rgba(245,158,11,.1);color:var(--amber)}
.cysev.tm{background:var(--blue-dim);color:var(--blue)}
.cy-txt{font-size:10.5px;color:var(--t1);line-height:1.4;margin-bottom:2px}
.cy-src{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--t4)}

/* earthquakes */
.eq-item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.eq-item:last-child{border-bottom:none}
.eq-mag{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;width:36px;flex-shrink:0}
.eq-place{font-size:10.5px;color:var(--t1)}
.eq-time{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--t4);margin-top:2px}
.eq-bar{width:3px;height:32px;border-radius:1px;flex-shrink:0;margin-left:auto}

/* fires */
.fire-item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.fire-item:last-child{border-bottom:none}
.fire-loc{flex:1;font-size:10.5px;color:var(--t1)}
.fire-ac{font-family:'JetBrains Mono',monospace;font-size:9.5px;color:var(--amber)}

/* insights */
.ins-item{padding:8px;background:var(--surface);border:1px solid var(--border);border-radius:6px;margin-bottom:6px}
.ins-head{font-size:10.5px;font-weight:600;color:var(--t1);margin-bottom:4px}
.ins-body{font-size:10px;color:var(--t2);line-height:1.5}
.ins-meta{display:flex;justify-content:space-between;margin-top:6px}
.ins-conf{font-family:'JetBrains Mono',monospace;font-size:8.5px;color:var(--blue)}
.ins-time{font-family:'JetBrains Mono',monospace;font-size:8.5px;color:var(--t4)}

/* ai deduction */
.ai-box{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px;margin-bottom:6px}
.ai-q{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--purple);margin-bottom:4px}
.ai-r{font-size:10px;color:var(--t1);line-height:1.5}
.ai-src{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--t4);margin-top:4px}
.ai-row{display:flex;gap:6px;margin-top:8px}
.ai-in{flex:1;background:var(--elevated);border:1px solid var(--border);border-radius:4px;padding:6px 8px;color:var(--t1);font-size:10.5px;outline:none}
.ai-in:focus{border-color:var(--blue)}
.ai-btn{background:var(--blue);border:none;color:#fff;padding:0 12px;border-radius:4px;cursor:pointer;font-size:10px;font-weight:600;letter-spacing:.05em;white-space:nowrap}
.ai-btn:hover{opacity:.85}
.ai-loading{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--purple);padding:8px 0}

/* theater */
.tp-item{padding:6px 0;border-bottom:1px solid var(--border)}
.tp-item:last-child{border-bottom:none}
.tp-theater{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--blue);letter-spacing:.1em;margin-bottom:3px}
.tp-status{font-size:10.5px;color:var(--t2);line-height:1.4;display:flex;flex-wrap:wrap;gap:5px;align-items:center}
.tplvl{font-family:'JetBrains Mono',monospace;font-size:7.5px;padding:1px 5px;border-radius:2px;white-space:nowrap}
.tl-e{background:var(--red-dim);color:var(--red)}
.tl-h{background:rgba(245,158,11,.1);color:var(--amber)}

/* supply chain */
.sc-item{padding:6px 0;border-bottom:1px solid var(--border)}
.sc-item:last-child{border-bottom:none}
.sc-top{display:flex;justify-content:space-between;margin-bottom:4px}
.sc-name{font-size:10.5px;color:var(--t1)}
.sc-num{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600}
.sc-bar-w{height:3px;background:var(--elevated);border-radius:2px;overflow:hidden;margin-bottom:3px}
.sc-bar{height:100%;border-radius:2px}
.sc-lbl{font-size:9px;color:var(--t3)}

/* displacement */
.disp-item{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)}
.disp-item:last-child{border-bottom:none}
.disp-cn{font-size:10.5px;color:var(--t1)}
.disp-num{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--amber)}

/* investments */
.inv-item{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)}
.inv-item:last-child{border-bottom:none}
.inv-co{font-size:10px;color:var(--t1)}
.inv-sec{font-size:8.5px;color:var(--t4);margin-top:1px}
.inv-val{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--gold);font-weight:600}

/* gps jamming */
.gps-item{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)}
.gps-item:last-child{border-bottom:none}
.gps-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.gps-region{flex:1;font-size:10px;color:var(--t2)}
.gps-lvl{font-family:'JetBrains Mono',monospace;font-size:8px;padding:1px 5px;border-radius:2px}

/* layoffs */
.lo-item{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)}
.lo-item:last-child{border-bottom:none}
.lo-co{font-size:10.5px;color:var(--t1);font-weight:600}
.lo-sec{font-size:8.5px;color:var(--t4)}
.lo-num{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--red);font-weight:600}

/* service status */
.ss-item{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)}
.ss-item:last-child{border-bottom:none}
.ss-name{font-size:10.5px;color:var(--t2)}
.ssbadge{font-family:'JetBrains Mono',monospace;font-size:8px;padding:1px 6px;border-radius:3px;text-transform:uppercase}
.ssbadge.ok{background:var(--green-dim);color:var(--green)}
.ssbadge.deg{background:rgba(245,158,11,.1);color:var(--amber)}
.ssbadge.dn{background:var(--red-dim);color:var(--red)}

/* worldclock */
.wc-row{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border)}
.wc-row:last-child{border-bottom:none}
.wc-city{font-size:10.5px;color:var(--t1)}
.wc-tz{font-size:8.5px;color:var(--t4)}
.wc-time{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--t1)}

/* map */
.mapbox{background:var(--surface);border-radius:4px;position:relative;overflow:hidden}
.map-grid{position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:20px 20px;opacity:.5}
.hspot{position:absolute;width:8px;height:8px;border-radius:50%;transform:translate(-50%,-50%);animation:hpulse 2s ease-in-out infinite}
@keyframes hpulse{0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.4)}}
.mlbl{position:absolute;bottom:6px;left:8px;font-family:'JetBrains Mono',monospace;font-size:7.5px;color:var(--t4)}

/* live news */
.ch-row{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
.chbtn{font-family:'JetBrains Mono',monospace;font-size:8.5px;padding:2px 8px;border:1px solid var(--border);background:transparent;color:var(--t3);cursor:pointer;border-radius:3px;transition:all .15s;letter-spacing:.05em}
.chbtn:hover{color:var(--t2);border-color:var(--t3)}
.chbtn.active{border-color:var(--blue);color:var(--blue);background:var(--blue-dim)}
.vframe{flex:1;background:var(--surface);border:1px solid var(--border);border-radius:4px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:120px;gap:6px}
.vi{font-size:22px}
.vl{font-size:11px;font-weight:600;color:var(--t2)}
.vhint{font-family:'JetBrains Mono',monospace;font-size:8px;color:var(--t4)}

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
.pt-cat{font-size:8.5px;color:var(--t4);margin-top:1px;font-family:'JetBrains Mono',monospace}
.add-btn-sm{font-family:'JetBrains Mono',monospace;font-size:8px;padding:3px 8px;border:1px solid var(--blue);background:transparent;color:var(--blue);cursor:pointer;border-radius:3px;flex-shrink:0}

/* footer */
.footer{height:24px;min-height:24px;background:var(--base);border-top:1px solid var(--border);display:flex;align-items:center;padding:0 14px;gap:14px}
.fitem{font-family:'JetBrains Mono',monospace;font-size:7.5px;color:var(--t4);display:flex;align-items:center;gap:5px}
.fitem span{color:var(--t2)}
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

/* ── STATIC DATA (panels que no tienen API asignada aún) ───── */
const RISKS = [
  { country: "Ukraine", score: 94, color: "#EF4444" }, { country: "Iran", score: 87, color: "#EF4444" },
  { country: "Sudan", score: 82, color: "#EF4444" }, { country: "N. Korea", score: 79, color: "#EF4444" },
  { country: "Myanmar", score: 76, color: "#F59E0B" }, { country: "Taiwan", score: 71, color: "#F59E0B" },
  { country: "Pakistan", score: 63, color: "#F59E0B" }, { country: "Venezuela", score: 58, color: "#F59E0B" },
  { country: "Ethiopia", score: 54, color: "#F59E0B" }, { country: "Libya", score: 48, color: "#F59E0B" },
];
const MIL = [
  { icon: "✈", country: "Russia", text: "Su-35 patrols near Finnish border — 3rd consecutive day" },
  { icon: "⛵", country: "China", text: "PLAN carrier group 200nm east of Taiwan Strait — Type 055 destroyer" },
  { icon: "🚀", country: "N. Korea", text: "Missile activity at Sohae facility via satellite imagery" },
  { icon: "✈", country: "USA", text: "B-52H strategic bombers conduct NATO exercises over Baltic" },
  { icon: "⛵", country: "Iran", text: "IRGCN fast attack craft deployment — northern Persian Gulf" },
];
const CYBER = [
  { sev: "critical", text: "Cl0p ransomware claims breach of 3 US healthcare systems — 2.1M records", src: "BleepingComputer" },
  { sev: "high", text: "APT targeting European defense contractors via supply chain attack", src: "Mandiant" },
  { sev: "high", text: "CVE-2026-1337 in Palo Alto GlobalProtect — critical patch available", src: "CISA" },
  { sev: "medium", text: "Coordinated DDoS campaign against Baltic government infrastructure", src: "ENISA" },
];
const SC = [
  { name: "Strait of Hormuz", val: 78, color: "#EF4444", lbl: "IRGCN harassment ongoing" },
  { name: "Suez Canal / Red Sea", val: 65, color: "#F59E0B", lbl: "Houthi threat zone active" },
  { name: "Taiwan Strait", val: 71, color: "#EF4444", lbl: "PLAN exercises disruptive" },
  { name: "Bab el-Mandeb", val: 82, color: "#EF4444", lbl: "Shipping rerouting active" },
  { name: "Panama Canal", val: 48, color: "#F59E0B", lbl: "Water level restrictions" },
  { name: "Malacca Strait", val: 32, color: "#10B981", lbl: "Traffic nominal" },
];
const GPS = [
  { region: "Eastern Baltic (Estonia/Latvia)", lvl: "High" },
  { region: "Black Sea — Romanian EEZ", lvl: "Severe" },
  { region: "Finnish Gulf — Helsinki approach", lvl: "High" },
  { region: "Gaza + Southern Israel", lvl: "Severe" },
  { region: "Northern Iraq — Erbil approach", lvl: "Moderate" },
];
const INV = [
  { co: "Saudi Aramco → US LNG", sector: "Energy", val: "$6.2B" },
  { co: "SoftBank Vision III", sector: "AI / Tech", val: "$4.8B" },
  { co: "ADIA → Indian Infrastructure", sector: "Infrastructure", val: "$3.1B" },
  { co: "GIC → European Data Centers", sector: "Infrastructure", val: "$1.9B" },
  { co: "QIA → European Real Estate", sector: "Real Estate", val: "$1.2B" },
];
const LAYOFFS = [
  { co: "Intel", sector: "Semiconductors", num: "21,000", date: "Q1 2026" },
  { co: "ByteDance", sector: "Tech / Social", num: "7,000", date: "Q1 2026" },
  { co: "Citigroup", sector: "Finance", num: "4,500", date: "Q4 2025" },
  { co: "Northrop Grumman", sector: "Defense", num: "1,800", date: "Q1 2026" },
  { co: "Salesforce", sector: "SaaS / CRM", num: "2,100", date: "Q1 2026" },
];
const THEATER = [
  { theater: "Indo-Pacific", status: "Elevated — PLAN carrier ops, Taiwan pressure", level: "e" },
  { theater: "Eastern Europe", status: "Active conflict — Ukraine front dynamic", level: "e" },
  { theater: "Middle East", status: "High tension — IRGCN + Houthi threat", level: "h" },
  { theater: "Korea Peninsula", status: "Elevated — DPRK ICBM test + ROK-US exercises", level: "e" },
  { theater: "Africa (Sahel)", status: "Multiple active insurgencies — Wagner presence", level: "h" },
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
const CHANNELS = [
  { id: "cnn", label: "CNN" }, { id: "bbc", label: "BBC" }, { id: "aljazeera", label: "Al Jazeera" },
  { id: "bloomberg", label: "Bloomberg" }, { id: "dw", label: "DW" }, { id: "france24", label: "France 24" },
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
  { id: "news-energy",     label: "Energy & Resources",        cat: "News",          accent: "#C9A84C", variants: ["global","finance"] },
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
  global: [
    { id: "col-1", width: 360, panels: [{ id: "live-news", h: 280 }, { id: "news-global", h: 380 }, { id: "news-energy", h: 280 }] },
    { id: "col-2", width: 340, panels: [{ id: "map", h: 260 }, { id: "cii", h: 300 }, { id: "military", h: 280 }, { id: "earthquakes", h: 200 }] },
    { id: "col-3", width: 320, panels: [{ id: "insights", h: 220 }, { id: "markets", h: 280 }, { id: "predictions", h: 260 }, { id: "service-status", h: 200 }] },
    { id: "col-4", width: 300, panels: [{ id: "theater", h: 220 }, { id: "cyber", h: 240 }, { id: "macro", h: 220 }, { id: "worldclock", h: 220 }] },
  ],
  finance: [
    { id: "col-1", width: 360, panels: [{ id: "live-news", h: 280 }, { id: "news-finance", h: 360 }, { id: "news-energy", h: 280 }] },
    { id: "col-2", width: 340, panels: [{ id: "markets", h: 280 }, { id: "commodities", h: 280 }, { id: "macro", h: 240 }] },
    { id: "col-3", width: 320, panels: [{ id: "insights", h: 220 }, { id: "predictions", h: 260 }, { id: "crypto", h: 240 }, { id: "service-status", h: 180 }] },
    { id: "col-4", width: 300, panels: [{ id: "investments", h: 240 }, { id: "worldclock", h: 220 }] },
  ],
  tech: [
    { id: "col-1", width: 360, panels: [{ id: "live-news", h: 280 }, { id: "news-tech", h: 360 }] },
    { id: "col-2", width: 340, panels: [{ id: "insights", h: 220 }, { id: "markets", h: 260 }, { id: "cyber", h: 260 }] },
    { id: "col-3", width: 320, panels: [{ id: "ai-deduction", h: 280 }, { id: "crypto", h: 240 }, { id: "layoffs", h: 220 }] },
    { id: "col-4", width: 300, panels: [{ id: "service-status", h: 220 }, { id: "worldclock", h: 220 }] },
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
function PanelContent({ id, variant }) {
  const [ch, setCh] = useState("cnn");
  const [aiQ, setAiQ] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // News feed map
  const newsFeedMap = {
    "news-global":     { fn: fetchNewsGlobal,     key: "news-global" },
    "news-middleeast": { fn: fetchNewsMiddleEast, key: "news-middleeast" },
    "news-africa":     { fn: fetchNewsAfrica,     key: "news-africa" },
    "news-latam":      { fn: fetchNewsLatam,      key: "news-latam" },
    "news-energy":     { fn: fetchNewsEnergy,     key: "news-energy" },
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
  // ── Earthquakes ──
  const eqData = useDataFetcher("earthquakes", fetchEarthquakes, { ttl: TTL.geo });
  // ── Fires ──
  const firesData = useDataFetcher("fires", fetchFires, { ttl: TTL.geo });
  // ── Predictions ──
  const predsData = useDataFetcher("predictions", fetchPredictions, { ttl: TTL.news });
  // ── Displacement ──
  const displData = useDataFetcher("displacement", fetchDisplacement, { ttl: TTL.humanitarian });

  // ── Live News + Insights ──
  const liveNewsData = useDataFetcher(
    `live-news-${variant}`,
    () => fetchLiveNews(variant),
    { ttl: TTL.news }
  );
  const insightsData = useDataFetcher(
    `insights-${variant}`,
    async () => {
      const headlines = (liveNewsData.data || []).map(n => n.h).filter(Boolean);
      return fetchInsights(headlines);
    },
    { ttl: TTL.news, deps: [liveNewsData.data] }
  );

  // AI Deduction handler
  const handleAnalyze = async () => {
    if (!aiQ.trim()) return;
    setAiLoading(true);
    try {
      const ctx = (insightsData.data || []).map(i => i.head).join('; ');
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
    { name: "Groq AI",            s: insightsData.error ? "degraded" : insightsData.loading ? "degraded" : "ok" },
  ];

  // ── Panel renders ──────────────────────────────────────────
  if (id === "live-news") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, height: "100%" }}>
      <div className="ch-row">
        {CHANNELS.map(c => (
          <button key={c.id} className={`chbtn ${ch === c.id ? "active" : ""}`} onClick={() => setCh(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {liveNewsData.loading && !liveNewsData.data ? <Loading /> :
          (liveNewsData.data || []).slice(0, 6).map((n, i) => (
            <div key={i} className="nitem">
              <div className="nsrc">{n.src}</div>
              <div className="nhead" onClick={() => n.url && window.open(n.url, "_blank")}>{n.h}</div>
              <div className="ntime">{n.t}</div>
            </div>
          ))
        }
      </div>
    </div>
  );

  if (id === "map") return (
    <div className="mapbox" style={{ height: "100%" }}>
      <div className="map-grid" />
      {HOTSPOTS.map((h, i) => (
        <div key={i} className="hspot" style={{ left: h.x, top: h.y, background: h.c, boxShadow: `0 0 8px ${h.c}`, animationDelay: `${i * 0.3}s` }} />
      ))}
      <span className="mlbl">Threat Map — configure VITE_MAPBOX_TOKEN for live map</span>
    </div>
  );

  if (id === "markets") {
    const items = marketsData.data || [];
    if (marketsData.loading && !items.length) return <Loading />;
    return (
      <table className="mtbl">
        <thead><tr><th>Asset</th><th>Price</th><th>24h</th></tr></thead>
        <tbody>
          {items.map((m, i) => (
            <tr key={i}>
              <td className="tick">{m.t}</td>
              <td className={m.up ? "cup" : "cdn"}>{m.p}</td>
              <td><span className={`cbadge ${m.up ? "up" : "dn"}`}>{m.c}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    );
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
              <span style={{ color: d.trend === "↑" ? "var(--red)" : d.trend === "↓" ? "var(--green)" : "var(--t3)", fontFamily: "JetBrains Mono", fontSize: 12 }}>{d.trend}</span>
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
  if (id === "military") return (
    <div>
      {MIL.map((m, i) => (
        <div key={i} className="mil-item">
          <div className="mil-ico">{m.icon}</div>
          <div>
            <div className="mil-cty">{m.country}</div>
            <div className="mil-txt">{m.text}</div>
          </div>
        </div>
      ))}
    </div>
  );

  if (id === "cyber") return (
    <div>
      {CYBER.map((c, i) => (
        <div key={i} className="cy-item">
          <span className={`cysev ${c.sev === "critical" ? "tc" : c.sev === "high" ? "th" : "tm"}`}>{c.sev}</span>
          <div>
            <div className="cy-txt">{c.text}</div>
            <div className="cy-src">{c.src}</div>
          </div>
        </div>
      ))}
    </div>
  );

  if (id === "cii") return (
    <div>
      {RISKS.map((r, i) => (
        <div key={i} className="rrow">
          <span className="rcty">{r.country}</span>
          <div className="rbar-w"><div className="rbar" style={{ width: `${r.score}%`, background: r.color }} /></div>
          <span className="rscore" style={{ color: r.color }}>{r.score}</span>
        </div>
      ))}
    </div>
  );

  if (id === "theater") return (
    <div>
      {THEATER.map((t, i) => (
        <div key={i} className="tp-item">
          <div className="tp-theater">{t.theater}</div>
          <div className="tp-status">
            {t.status}
            <span className={`tplvl ${t.level === "e" ? "tl-e" : "tl-h"}`}>
              {t.level === "e" ? "elevated" : "high"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  if (id === "supply-chain") return (
    <div>
      {SC.map((s, i) => (
        <div key={i} className="sc-item">
          <div className="sc-top">
            <span className="sc-name">{s.name}</span>
            <span className="sc-num" style={{ color: s.color }}>{s.val}/100</span>
          </div>
          <div className="sc-bar-w"><div className="sc-bar" style={{ width: `${s.val}%`, background: s.color }} /></div>
          <div className="sc-lbl">{s.lbl}</div>
        </div>
      ))}
    </div>
  );

  if (id === "gps-jamming") return (
    <div>
      {GPS.map((g, i) => (
        <div key={i} className="gps-item">
          <div className="gps-dot" style={{
            background: g.lvl === "Severe" ? "#EF4444" : g.lvl === "High" ? "#F59E0B" : "#3B82F6",
            boxShadow: `0 0 5px ${g.lvl === "Severe" ? "#EF4444" : "#F59E0B"}`,
          }} />
          <span className="gps-region">{g.region}</span>
          <span className="gps-lvl" style={{
            color: g.lvl === "Severe" ? "var(--red)" : g.lvl === "High" ? "var(--amber)" : "var(--blue)",
            background: g.lvl === "Severe" ? "var(--red-dim)" : "rgba(245,158,11,.1)",
          }}>{g.lvl}</span>
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

  return <div style={{ color: "var(--t3)", fontFamily: "JetBrains Mono", fontSize: 10, padding: 8 }}>Panel: {id}</div>;
}

/* ── PANEL ITEM ────────────────────────────────────────────── */
function PanelItem({ panelId, colId, height, variant, onRemove, onResize, onDragStart, onDragOver, onDrop }) {
  const def = PANEL_MAP[panelId];
  if (!def) return null;
  const scrollable = ["news-global","news-middleeast","news-africa","news-latam","news-energy","news-thinktanks","news-finance","news-tech","military","cyber","insights","supply-chain","theater","cii","predictions","displacement","earthquakes","fires","crypto","commodities","layoffs","investments","gps-jamming"].includes(panelId);

  const startResize = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY, startH = height;
    const onMove = (ev) => onResize(colId, panelId, Math.max(120, startH + ev.clientY - startY));
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [height, colId, panelId, onResize]);

  return (
    <div
      className="panel"
      style={{ height }}
      draggable
      onDragStart={e => onDragStart(e, colId, panelId)}
      onDragOver={e => { e.preventDefault(); onDragOver(e, colId, panelId); }}
      onDrop={e => onDrop(e, colId, panelId)}
    >
      <div className="ph">
        <div className="ptitle">
          <div className="pbar" style={{ background: def.accent }} />
          {def.label}
        </div>
        <div className="pctrls">
          <span className="pmeta">{def.cat.toUpperCase()}</span>
          <button className="pibtn" title="Remove" onClick={() => onRemove(colId, panelId)}>✕</button>
        </div>
      </div>
      <div className={`pb ${scrollable ? "scroll" : ""}`} style={{ height: height - 36 - 8 }}>
        <PanelContent id={panelId} variant={variant} />
      </div>
      <div className="rh" onMouseDown={startResize} />
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
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 8, color: "var(--t4)", letterSpacing: ".15em", padding: "8px 8px 4px", textTransform: "uppercase" }}>{cat}</div>
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
export default function App() {
  const [variant, setVariant] = useState("global");
  const [theme, setTheme] = useState("dark");
  const [layout, setLayout] = useState(() => JSON.parse(JSON.stringify(DEFAULT_LAYOUT)));
  const [showPicker, setShowPicker] = useState(false);
  const [pickerColId, setPickerColId] = useState(null);
  const drag = useRef(null);

  // Inject fonts + CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = FONTS + CSS;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const cols = layout[variant];

  // Column resize
  const startColResize = useCallback((e, colId) => {
    e.preventDefault();
    const startX = e.clientX;
    const col = layout[variant].find(c => c.id === colId);
    const startW = col?.width || 320;
    const onMove = (ev) => {
      setLayout(prev => {
        const next = JSON.parse(JSON.stringify(prev));
        const c = next[variant].find(c => c.id === colId);
        if (c) c.width = Math.max(240, startW + ev.clientX - startX);
        return next;
      });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [layout, variant]);

  const onResize = useCallback((colId, panelId, h) => {
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const col = next[variant].find(c => c.id === colId);
      const p = col?.panels.find(p => p.id === panelId);
      if (p) p.h = h;
      return next;
    });
  }, [variant]);

  const onDragStart = useCallback((e, colId, panelId) => {
    drag.current = { colId, panelId };
  }, []);

  const onDragOver = useCallback((e, colId, panelId) => { e.preventDefault(); }, []);

  const onDrop = useCallback((e, targetColId, targetPanelId) => {
    e.preventDefault();
    if (!drag.current) return;
    const { colId: srcCol, panelId: srcPanel } = drag.current;
    if (srcCol === targetColId && srcPanel === targetPanelId) return;
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const sc = next[variant].find(c => c.id === srcCol);
      const tc = next[variant].find(c => c.id === targetColId);
      if (!sc || !tc) return prev;
      const si = sc.panels.findIndex(p => p.id === srcPanel);
      const [moved] = sc.panels.splice(si, 1);
      const ti = tc.panels.findIndex(p => p.id === targetPanelId);
      if (ti >= 0) tc.panels.splice(ti, 0, moved);
      else tc.panels.push(moved);
      return next;
    });
    drag.current = null;
  }, [variant]);

  const removePanel = useCallback((colId, panelId) => {
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const col = next[variant].find(c => c.id === colId);
      if (col) col.panels = col.panels.filter(p => p.id !== panelId);
      return next;
    });
  }, [variant]);

  const addPanel = useCallback((panelId) => {
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const targetCol = pickerColId
        ? next[variant].find(c => c.id === pickerColId)
        : next[variant][next[variant].length - 1];
      if (targetCol && !targetCol.panels.find(p => p.id === panelId)) {
        targetCol.panels.push({ id: panelId, h: 240 });
      }
      return next;
    });
  }, [variant, pickerColId]);

  const addColumn = useCallback(() => {
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[variant].push({ id: `col-${Date.now()}`, width: 300, panels: [] });
      return next;
    });
  }, [variant]);

  const removeColumn = useCallback((colId) => {
    setLayout(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next[variant] = next[variant].filter(c => c.id !== colId);
      return next;
    });
  }, [variant]);

  const resetLayout = useCallback(() => {
    setLayout(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)));
  }, []);

  const vd = { global: "GEOPOLITICAL", finance: "FINANCIAL", tech: "TECHNOLOGY" };
  const totalPanels = cols.reduce((s, c) => s + c.panels.length, 0);

  return (
    <div className={`app ${theme}`}>
      {/* Breaking ticker */}
      <BreakingTicker variant={variant} />

      {/* Header */}
      <div className="hdr">
        <div className="brand">
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
        <div className="ibadge">✦ {vd[variant]}</div>
        <div className="hr">
          <div className="srow">
            <div className="schip"><div className="sdot" />LIVE</div>
            <div className="schip"><div className="sdot w" />APIS</div>
          </div>
          <Clock />
          <button className="hbtn" title="Add Column" onClick={addColumn}>⊟</button>
          <button className="hbtn" title="Add Panel" onClick={() => { setPickerColId(null); setShowPicker(true); }}>⊞</button>
          <button className="hbtn" title="Reset Layout" onClick={resetLayout}>↺</button>
          <button className={`hbtn ${theme === "light" ? "on" : ""}`} title="Toggle theme" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀" : "◑"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="body">
        {/* Workspace */}
        <div className="workspace">
          {cols.map(col => (
            <div
              key={col.id}
              className="col"
              style={{ width: col.width }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => onDrop(e, col.id, null)}
            >
              <div className="col-header">
                <span className="col-label">COL · {col.panels.length} panels</span>
                <button className="cbtn" title="Add panel" onClick={() => { setPickerColId(col.id); setShowPicker(true); }}>＋</button>
                <button className="delbtn" title="Remove column" onClick={() => removeColumn(col.id)}>✕</button>
              </div>
              {col.panels.map(({ id: panelId, h }) => (
                <PanelItem
                  key={panelId}
                  panelId={panelId}
                  colId={col.id}
                  height={h}
                  variant={variant}
                  onRemove={removePanel}
                  onResize={onResize}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                />
              ))}
              <button className="add-panel-btn" onClick={() => { setPickerColId(col.id); setShowPicker(true); }}>
                ＋ Add Panel
              </button>
              <div className="col-resizer" onMouseDown={e => startColResize(e, col.id)} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="fitem">Panels <span>{totalPanels}</span></div>
        <div className="fitem">Variant <span>{variant.toUpperCase()}</span></div>
        <div className="fitem">ARKA Intelligence Center <span>v1.0.0</span></div>
        <div className="fitem" style={{ marginLeft: "auto" }}>
          APIs: Finnhub · FRED · Guardian · USGS · NASA FIRMS · Groq · Polymarket · UNHCR
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
