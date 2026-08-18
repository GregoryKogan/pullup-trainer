#!/usr/bin/env python3
"""Builds design assets of the Poster / Swiss system (chosen design, TZ §7-З2).

Outputs (relative to design/):
  mockups/poster-p01-volt.html — default palette x 10 screens x 2 themes
  mockups/index.html           — link to the mockup
  theme-tokens.css     — all palettes as CSS custom properties for the app
  README.md            — structure overview

Regenerate with: python3 build-assets.py
"""
from pathlib import Path

HERE = Path(__file__).parent
APP_VERSION = "1.0.0"

# ---------------------------------------------------------------- symbols

SYMBOLS = """
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.8 12 3l9 7.8"/><path d="M5.2 9.6V20a1 1 0 0 0 1 1h3.2v-6.2h5.2V21h3.2a1 1 0 0 0 1-1V9.6"/></symbol>
    <symbol id="i-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.2" y="5.2" width="17.6" height="15.6" rx="2.4"/><path d="M3.2 10h17.6M8 3v4.4M16 3v4.4"/></symbol>
    <symbol id="i-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 19.5h17"/><path d="M5.5 15.5 10 10.5l3.6 2.8L19 6.5"/></symbol>
    <symbol id="i-sliders" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.4" fill="var(--bg)"/><circle cx="15" cy="17" r="2.4" fill="var(--bg)"/></symbol>
    <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.6 9.7 17 19 7.4"/></symbol>
    <symbol id="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></symbol>
    <symbol id="i-flame" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3.2c1.9 3.2 4.9 5.1 4.9 8.6a4.9 4.9 0 1 1-9.8 0c0-1.7.9-3.1 1.9-4.4.2 1.2 1.2 1.9 2.5 1.9-.9-1.9-1.2-4.4.5-6.1Z"/></symbol>
    <symbol id="i-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.2 9.2a5.8 5.8 0 0 1 11.6 0c0 4.4 1.6 5.6 1.6 5.6H4.6s1.6-1.2 1.6-5.6"/><path d="M10.2 18.6a1.9 1.9 0 0 0 3.6 0"/></symbol>
    <symbol id="i-pause" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6.6" y="5.4" width="3.6" height="13.2" rx="1"/><rect x="13.8" y="5.4" width="3.6" height="13.2" rx="1"/></symbol>
    <symbol id="i-reset" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4.4v4h-4"/></symbol>
    <symbol id="i-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5.4v13.2M5.4 12h13.2"/></symbol>
    <symbol id="i-minus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5.4 12h13.2"/></symbol>
    <symbol id="i-chevL" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.6 6 8.6 12l6 6"/></symbol>
    <symbol id="i-chevR" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.4 6l6 6-6 6"/></symbol>
    <symbol id="i-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13.6 6.4 19 12l-5.4 5.6"/></symbol>
    <symbol id="i-dl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10.5M7.6 11 12 15.4 16.4 11"/><path d="M4.5 19.5h15"/></symbol>
    <symbol id="i-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.4V4.9M7.6 8.4 12 4l4.4 4.4"/><path d="M4.5 19.5h15"/></symbol>
    <symbol id="i-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.8h15M9.7 6.8V5.3a1.4 1.4 0 0 1 1.4-1.4h1.8a1.4 1.4 0 0 1 1.4 1.4v1.5"/><path d="m6.9 6.8.7 11.6a1.5 1.5 0 0 0 1.5 1.4h5.8a1.5 1.5 0 0 0 1.5-1.4l.7-11.6"/></symbol>
    <symbol id="i-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.4"/><circle cx="12" cy="7.9" r="1" fill="currentColor" stroke="none"/></symbol>
    <symbol id="i-vibr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3.6" width="8" height="16.8" rx="2.2"/><path d="M12 17.4v.4"/><path d="M3.6 9.4c.7 1.6.7 3.6 0 5.2M20.4 9.4c-.7 1.6-.7 3.6 0 5.2"/></symbol>
  </defs>
</svg>
"""

# ---------------------------------------------------------------- shared CSS

SHARED_CSS = r"""
:root{
  --pg-bg:#0d0d0b; --pg-ink:#e8e8e0; --pg-muted:#8f8f85; --pg-line:#262621;
  --f-num:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  --f-ui:system-ui,-apple-system,"Segoe UI",sans-serif;
  --f-display:"Arial Black","Arial Bold",system-ui,-apple-system,sans-serif;
}
body.light{--pg-bg:#e9e6db; --pg-ink:#191810; --pg-muted:#6c6a5e; --pg-line:#c9c5b6}
*{box-sizing:border-box}
body{margin:0;background:var(--pg-bg);color:var(--pg-ink);font:15px/1.5 var(--f-ui)}
main{max-width:1160px;margin:0 auto;padding:2.4rem 1.25rem 4rem}
.intro{max-width:800px}
.tag{display:inline-block;font:700 .72rem/1 var(--f-num);letter-spacing:.14em;text-transform:uppercase;background:var(--pg-ink);color:var(--pg-bg);padding:.4rem .85rem;border-radius:2px}
h1{font-family:var(--f-display);font-size:2rem;line-height:1.05;margin:.8rem 0 .35rem;text-transform:uppercase;letter-spacing:-.02em}
.intro>p{color:var(--pg-muted);max-width:700px;margin:.35rem 0 0}
.swboxes{display:flex;flex-direction:column;gap:.7rem;margin-top:1.1rem}
.swbox{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}
.swbox .t{font:800 .66rem/1 var(--f-num);letter-spacing:.12em;text-transform:uppercase;background:var(--pg-ink);color:var(--pg-bg);padding:.4rem .7rem;border-radius:2px}
.swbox ul{list-style:none;display:flex;gap:.45rem;padding:0;margin:0;flex-wrap:wrap}
.swbox li{display:flex;align-items:center;gap:.45rem;font:700 .7rem/1 var(--f-num);color:var(--pg-muted)}
.swbox i{width:16px;height:16px;border-radius:2px;display:inline-block;border:1px solid rgba(127,127,127,.4)}
.toggles{display:flex;gap:.5rem;margin:1.8rem 0 0}
.toggle{appearance:none;cursor:pointer;min-height:46px;padding:0 1.2rem;background:transparent;color:var(--pg-muted);border:2px solid var(--pg-line);border-radius:2px;font:800 .8rem/1 var(--f-display);text-transform:uppercase;letter-spacing:.06em}
.toggle.on{background:var(--pg-ink);color:var(--pg-bg);border-color:var(--pg-ink)}
.toggle:focus-visible{outline:2px solid #58a6ff;outline-offset:2px}
.theme-block{margin-top:2rem}
.theme-block.hidden{display:none}
.theme-block>h2{font-family:var(--f-display);font-size:1rem;text-transform:uppercase;letter-spacing:.04em;border-bottom:3px solid var(--pg-line);padding-bottom:.4rem;margin:0 0 1.4rem}
.theme-block>h2 span{color:var(--pg-muted);font-family:var(--f-num);font-size:.72rem;margin-left:.6rem;letter-spacing:.12em;font-weight:700}
.themebody{display:flex;flex-wrap:wrap;gap:2rem;align-items:flex-start}
figure{margin:0;display:flex;flex-direction:column;gap:.7rem}
figcaption{color:var(--pg-muted);font-size:.8rem;max-width:390px}
.phone{width:390px;height:844px;background:#1b1a17;border-radius:54px;padding:11px;box-shadow:0 30px 70px rgba(0,0,0,.45),0 0 0 1px #34332e;flex:0 0 auto}
.th-light .phone{background:#c8c5b8;box-shadow:0 30px 70px rgba(0,0,0,.25),0 0 0 1px #aaa798}
.screen{width:100%;height:100%;background:var(--bg);color:var(--ink);border-radius:44px;overflow:hidden;display:flex;flex-direction:column;font:15px/1.45 var(--f-ui)}
.statusbar{height:46px;flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 26px;font:800 13.5px/1 var(--f-num);background:var(--bg);flex-shrink:0}
.statusbar .right{display:flex;align-items:center;gap:6px}
.sig{display:flex;align-items:flex-end;gap:1.5px;height:10px}
.sig i{width:2.5px;background:var(--ink);border-radius:1px}
.sig i:nth-child(1){height:4px}.sig i:nth-child(2){height:6px}.sig i:nth-child(3){height:8px}.sig i:nth-child(4){height:10px}
.wifi{width:14px;height:10px;border:2px solid var(--ink);border-top:none;border-radius:0 0 9px 9px;position:relative}
.wifi::after{content:"";position:absolute;width:4px;height:4px;background:var(--ink);border-radius:50%;left:50%;bottom:-1px;transform:translateX(-50%)}
.batt{width:22px;height:11px;border:1.5px solid var(--ink);border-radius:3.5px;padding:1.5px}
.batt i{display:block;height:100%;width:72%;background:var(--ink);border-radius:1.5px}
.app{flex:1;overflow:hidden;display:flex;flex-direction:column;padding:0 18px 10px;position:relative;background:var(--bg)}
.app::before{content:"";position:absolute;inset:0;z-index:0;background:url('../assets/patterns/swiss-grid.svg') repeat;pointer-events:none}
.th-dark .app::before{filter:invert(1)}
.app>*{position:relative;z-index:1}
.kicker{display:inline-block;font:700 .68rem/1.5 var(--f-num);letter-spacing:.16em;text-transform:uppercase;background:var(--accent);color:var(--accent-ink);padding:4px 9px;margin:0 0 10px;border:2px solid var(--line);box-shadow:3px 3px 0 var(--shadow)}
.sub{font-size:.8rem;color:var(--muted);margin:0}
.head{display:flex;justify-content:space-between;align-items:flex-start;padding:6px 0 16px}
.head>div{background:var(--bg)}
.head h1,.head h2{font-family:var(--f-display);font-size:1.8rem;font-weight:900;text-transform:uppercase;line-height:.95;letter-spacing:.02em;margin:.15rem 0 0}
.subpage-head{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}
.subpage-head .btn{margin-top:0}
.subpage-head .btn.ghost{background:var(--card);color:var(--ink)}
.chip{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:8px 12px;border-radius:2px;font:800 .72rem/1 var(--f-num)}
.chip.streak{background:var(--accent2);color:var(--accent-ink);border:2px solid var(--line);box-shadow:3px 3px 0 var(--shadow)}
.chip svg{width:16px;height:16px}
.panel{background:var(--card);border:2px solid var(--line);border-radius:2px;box-shadow:5px 5px 0 var(--shadow);padding:16px}
.next .row{display:flex;justify-content:space-between;align-items:baseline;margin:8px 0 12px}
.next h3{font-family:var(--f-display);font-size:1.3rem;margin:0;text-transform:uppercase}
.next .sets{font:800 .85rem/1 var(--f-num);color:var(--accent)}
.meter{height:10px;background:var(--bg2);border:2px solid var(--line);border-radius:0;margin:8px 0 10px}
.meter i{display:block;height:100%;background:var(--accent)}
.btn{appearance:none;border:0;cursor:pointer;min-height:50px;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:var(--card);color:var(--ink);border:2px solid var(--line);border-radius:2px;font:800 .88rem/1 var(--f-display);letter-spacing:.08em;text-transform:uppercase;box-shadow:4px 4px 0 var(--shadow);margin-top:14px}
.btn:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--shadow)}
.btn svg{width:17px;height:17px}
.btn.accent{background:var(--accent);color:var(--accent-ink)}
.btn.ghost{background:var(--card);color:var(--muted)}
.btn.outline{background:var(--card);color:var(--ink)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.tile .big{display:block;font-family:var(--f-display);font-size:2.4rem;font-weight:900;line-height:1.05;margin:8px 0 2px}
.tabbar{margin:auto -18px -10px;background:var(--accent);border-top:3px solid var(--line);padding:8px 18px 4px;display:flex}
.tabbar button{appearance:none;cursor:pointer;background:color-mix(in srgb,var(--accent-ink) 14%,var(--accent));border:2px solid color-mix(in srgb,var(--accent-ink) 40%,var(--accent));flex:1;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;color:var(--accent-ink);font:800 .68rem/1 var(--f-num);letter-spacing:.08em;text-transform:uppercase;margin:0 2px;border-radius:2px}
.tabbar button svg{width:20px;height:20px}
.tabbar button.on{background:var(--bg);color:var(--accent);border-color:var(--line);opacity:1;margin:2px 2px 4px;border-radius:2px}
.top{display:flex;align-items:center;justify-content:space-between;padding:2px 0 14px}
.iconbtn{appearance:none;cursor:pointer;width:44px;height:44px;border-radius:2px;background:var(--card);color:var(--ink);border:2px solid var(--line);box-shadow:3px 3px 0 var(--shadow);display:flex;align-items:center;justify-content:center}
.iconbtn svg{width:18px;height:18px}
.top .step{font:700 .72rem/1 var(--f-num);letter-spacing:.1em;color:var(--muted)}
.top .clock{font:800 .8rem/1 var(--f-num);color:var(--ink)}
.setsrow{display:flex;gap:8px;margin-bottom:16px}
.setsrow .s{flex:1;min-height:62px;border-radius:2px;background:var(--card);border:2px solid var(--line);box-shadow:3px 3px 0 var(--shadow);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;position:relative}
.setsrow b{font:800 1.2rem/1 var(--f-num)}
.setsrow span{font:700 .56rem/1 var(--f-num);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.setsrow .s.done{border-color:var(--ok)}
.setsrow .s.done b{color:var(--ok)}
.setsrow .s.done svg{width:12px;height:12px;color:var(--ok);position:absolute;top:5px;right:5px}
.setsrow .s.now{background:var(--accent);border-color:var(--line);box-shadow:4px 4px 0 var(--shadow)}
.setsrow .s.now b,.setsrow .s.now span{color:var(--accent-ink)}
.focus{background:var(--card);border:2px solid var(--line);border-radius:2px;box-shadow:5px 5px 0 var(--shadow);text-align:center;padding:18px 12px 14px;margin-bottom:14px}
.focus .rep{font-family:var(--f-display);font-size:7.2rem;font-weight:900;line-height:1;color:transparent;-webkit-text-stroke:2.5px var(--accent);margin:2px 0 6px}
@supports not (-webkit-text-stroke:1px #000){.focus .rep{color:var(--accent)}}
.focus .sub{font:800 .72rem/1 var(--f-num);letter-spacing:.22em;text-transform:uppercase}
.restcard{display:flex;align-items:center;gap:16px;background:var(--card);border:2px solid var(--line);border-radius:2px;box-shadow:5px 5px 0 var(--shadow);padding:12px 14px;margin-bottom:14px}
.ring text.ring-num{font:800 24px/1 var(--f-num);fill:var(--ink)}
.ring text.ring-lab{font:700 8px/1 var(--f-num);letter-spacing:.28em;fill:var(--muted)}
.ring .bg{stroke:var(--line);fill:none;stroke-width:7}
.ring .fg{stroke:var(--accent);fill:none;stroke-width:7;stroke-linecap:butt}
.rest-layout{flex:1;display:flex;flex-direction:column;min-height:0}
.rest-hero{flex:1;display:flex;align-items:center;justify-content:center;padding:8px 0}
.rest-dock{padding:14px 16px;margin-top:auto}
.presets{display:flex;gap:8px;margin-bottom:10px}
.restbody{flex:1}
.restrow{display:flex;gap:8px;margin-bottom:10px}
.mini{appearance:none;cursor:pointer;min-height:44px;min-width:44px;flex:1;background:var(--bg);border:2px solid var(--line);border-radius:2px;box-shadow:3px 3px 0 var(--shadow);color:var(--ink);font:800 .72rem/1 var(--f-num);display:flex;align-items:center;justify-content:center;gap:6px}
.mini svg{width:15px;height:15px}
.resthint{display:flex;align-items:center;gap:6px;font:700 .68rem/1.3 var(--f-num);color:var(--muted)}
.resthint svg{width:13px;height:13px}
.btnrow{display:flex;gap:10px}
.btnrow .btn{margin-top:0}
.calhead{display:flex;align-items:center;justify-content:space-between;padding:6px 0 14px}
.calhead h3{font-family:var(--f-display);font-size:1.25rem;margin:0;text-transform:uppercase}
.calhead .nav{display:flex;gap:7px}
.calhead .today{appearance:none;cursor:pointer;min-height:44px;padding:0 13px;border-radius:2px;background:var(--card);border:2px solid var(--line);box-shadow:3px 3px 0 var(--shadow);color:var(--ink);font:800 .72rem/1 var(--f-num);letter-spacing:.08em}
.calgrid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.calgrid .dow{text-align:center;font:700 .58rem/1 var(--f-num);letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding-bottom:2px}
.calgrid .day{min-height:44px;border-radius:2px;background:var(--card);border:2px solid var(--line);box-shadow:2px 2px 0 var(--shadow);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font:800 .95rem/1 var(--f-display);color:var(--ink);position:relative}
.calgrid .day.out{color:var(--muted);background:var(--bg);border-color:transparent;box-shadow:none}
.calgrid .day svg{width:11px;height:11px}
.calgrid .day.done{border-color:var(--ok)}
.calgrid .day.done svg{color:var(--ok)}
.calgrid .day.missed{border-color:var(--bad);background:var(--card)}
.calgrid .day.missed svg{color:var(--bad)}
.calgrid .day.planned::after{content:"";width:5px;height:5px;background:var(--accent2);position:absolute;bottom:5px}
.calgrid .day.today{background:var(--accent);color:var(--accent-ink);border-color:var(--line)}
.calgrid .day.sel{box-shadow:inset 0 0 0 3px var(--accent2)}
.legend{display:flex;gap:14px;justify-content:center;padding:12px 0 4px;font:700 .64rem/1 var(--f-num);color:var(--muted);flex-wrap:wrap}
.legend span{display:inline-flex;align-items:center;gap:6px}
.dot{width:8px;height:8px;border-radius:2px;display:inline-block;border:1px solid var(--line)}
.sheet{position:relative}
.backdrop{position:absolute;inset:0;background:rgba(0,0,0,.55);z-index:2}
.sheetcard{position:absolute;left:0;right:0;bottom:0;z-index:3;background:var(--card);border:2px solid var(--line);border-bottom:0;border-radius:2px;padding:14px 16px 16px;box-shadow:0 -6px 0 var(--shadow)}
.grab{width:40px;height:5px;background:var(--muted);border:1px solid var(--line);border-radius:0;margin:0 auto 12px}
.sheetcard h4{font:800 1rem/1.2 var(--f-display);margin:0 0 2px;text-transform:uppercase}
.sheetcard .sub{font-family:var(--f-num);margin-bottom:12px}
.optrow{display:flex;gap:8px;margin-bottom:10px}
.opt{appearance:none;cursor:pointer;flex:1;min-height:46px;border-radius:2px;background:var(--card);border:2px solid var(--line);box-shadow:3px 3px 0 var(--shadow);color:var(--muted);font:800 .74rem/1 var(--f-num);letter-spacing:.06em}
.opt.on{background:var(--accent);color:var(--accent-ink)}
.note{display:flex;gap:7px;align-items:flex-start;font:700 .68rem/1.4 var(--f-num);color:var(--muted);margin-bottom:6px}
.note svg{width:13px;height:13px;flex:0 0 auto;margin-top:1px}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0 14px}
.kpi{background:var(--card);border:2px solid var(--line);border-radius:2px;box-shadow:4px 4px 0 var(--shadow);padding:12px 8px;text-align:center}
.kpi b{display:block;font-family:var(--f-display);font-size:1.7rem;font-weight:900;line-height:1.1}
.kpi span{font:700 .56rem/1 var(--f-num);letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.sec{background:var(--card);border:2px solid var(--line);border-radius:2px;box-shadow:5px 5px 0 var(--shadow);padding:14px;margin-bottom:12px}
.sec h4{font:800 .95rem/1.2 var(--f-display);text-transform:uppercase;margin:0 0 2px;border-bottom:3px solid var(--line);padding-bottom:6px;letter-spacing:.02em}
.sec .sub{font-family:var(--f-num);margin-bottom:10px}
.chart{width:100%;display:block}
.gridline{stroke:var(--line);stroke-width:1}
.axis{font:700 8px/1 var(--f-num);fill:var(--muted)}
.line{stroke:var(--accent);stroke-width:2.5;fill:none;stroke-linejoin:round}
.pt{fill:var(--bg);stroke:var(--accent);stroke-width:2.5}
.ptlab{font:800 9px/1 var(--f-num);fill:var(--ink)}
.bar{fill:var(--accent)}
.bar.dim{fill:var(--line)}
.barlab{font:700 8px/1 var(--f-num);fill:var(--muted)}
.hist{list-style:none;margin:0;padding:0}
.hist li{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:2px solid var(--line);min-height:54px}
.hist li:last-child{border-bottom:0}
.hist .date{width:64px;flex:0 0 auto}
.hist .date b{display:block;font:800 .86rem/1.2 var(--f-num)}
.hist .date span{font:700 .64rem/1 var(--f-num);color:var(--muted)}
.hist .info{flex:1;min-width:0}
.hist .info b{display:block;font:800 .85rem/1.3 var(--f-num)}
.hist .info span{font:700 .7rem/1.3 var(--f-num);color:var(--muted)}
.hist .vol{font:800 1rem/1 var(--f-display)}
.pill{font:800 .62rem/1 var(--f-num);letter-spacing:.12em;padding:4px 8px;border:2px solid var(--line);border-radius:2px;text-transform:uppercase}
.pill.ok{color:var(--ok)}
.pill.fail{color:var(--bad)}
.setrow{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:50px;border-bottom:2px solid var(--line)}
.setrow.last{border-bottom:0}
.setrow .k{font:800 .78rem/1.3 var(--f-num)}
.setrow .v{font:800 .78rem/1 var(--f-num);color:var(--muted);display:flex;align-items:center;gap:8px}
.setrow .v b{color:var(--ink)}
.seg{display:inline-flex;border:2px solid var(--line);border-radius:2px;background:var(--bg2);box-shadow:2px 2px 0 var(--shadow)}
.seg button{appearance:none;cursor:pointer;min-height:44px;padding:0 12px;border:0;background:transparent;color:var(--muted);font:800 .7rem/1 var(--f-num)}
.seg button.on{background:var(--ink);color:var(--bg)}
.sw{appearance:none;cursor:pointer;width:46px;height:44px;border-radius:0;border:2px solid var(--line);background:var(--bg2);position:relative;flex:0 0 auto;box-shadow:2px 2px 0 var(--shadow)}
.sw i{position:absolute;top:50%;left:3px;width:18px;height:18px;margin-top:-9px;background:var(--muted)}
.sw.on{background:var(--accent)}
.sw.on i{left:23px;background:var(--accent-ink)}
.wd{appearance:none;cursor:pointer;min-width:44px;min-height:44px;padding:0 8px;border:2px solid var(--line);background:var(--card);font:800 .62rem/1 var(--f-num);text-transform:uppercase;color:var(--muted);box-shadow:2px 2px 0 var(--shadow)}
.wd.on{background:var(--accent);color:var(--accent-ink)}
.weekdays{display:flex;flex-wrap:wrap;gap:6px}
.pal-select{appearance:none;min-height:44px;padding:0 10px;border:2px solid var(--line);background:var(--card);font:800 .72rem/1 var(--f-num);color:var(--ink);box-shadow:2px 2px 0 var(--shadow)}
.step-dots{display:inline-flex;gap:6px;margin-right:8px;vertical-align:middle}
.step-dots i{display:inline-block;width:8px;height:8px;background:var(--muted);border:1px solid var(--line)}
.step-dots i.on{background:var(--accent);border-color:var(--line)}
.rep-stepper{display:flex;align-items:center;justify-content:center;gap:12px;margin:12px 0;padding:12px;background:var(--bg);border:2px solid var(--line);box-shadow:5px 5px 0 var(--shadow)}
.contour{font-family:var(--f-display);font-size:5.5rem;font-weight:900;line-height:1;color:transparent;-webkit-text-stroke:2.5px var(--accent);text-align:center;margin:8px 0;background:var(--bg)}
@supports not (-webkit-text-stroke:1px #000){.contour{color:var(--accent)}}
.result-page{display:flex;flex-direction:column;justify-content:center;min-height:100%}
.result{text-align:center;border-width:3px}
.result.ok{border-color:var(--ok)}
.result.fail{border-color:var(--bad)}
.result .icon svg{width:64px;height:64px}
.result.ok .icon svg{color:var(--ok)}
.result.fail .icon svg{color:var(--bad)}
.pwa-full{background:var(--bg);min-height:100%;display:flex;flex-direction:column}
.pwa-scroll{flex:1;overflow:auto;padding-bottom:12px}
.pwa-footer{padding-top:12px;border-top:2px solid var(--line)}
.pwa-full h2{font-family:var(--f-display);font-size:1.4rem;text-transform:uppercase;margin:0 0 8px}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
.tab{appearance:none;cursor:pointer;min-height:44px;padding:0 12px;border:2px solid var(--line);background:var(--card);font:800 .68rem/1 var(--f-num);text-transform:uppercase;color:var(--muted);box-shadow:2px 2px 0 var(--shadow)}
.tab.on{background:var(--accent);color:var(--accent-ink)}
.steps{list-style:none;margin:0 0 12px;padding:0}
.steps li{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:2px solid var(--line);font-size:.82rem}
.step-num{font:800 .72rem/1 var(--f-num);background:var(--accent);color:var(--accent-ink);padding:4px 8px;border:2px solid var(--line);min-width:28px;text-align:center}
.langrow{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;padding-bottom:12px;border-bottom:2px solid var(--line)}
.lang-label{font:800 .72rem/1 var(--f-num);text-transform:uppercase;color:var(--muted)}
.about-mark{width:88px;height:88px;background:var(--accent);border:2px solid var(--line);box-shadow:4px 4px 0 var(--shadow);margin:0 auto 12px;display:flex;align-items:center;justify-content:center}
.formula code{display:block;font:700 .75rem/1.4 var(--f-num);margin:6px 0;padding:8px;background:var(--bg2);border:2px solid var(--line)}
.badge{display:inline-block;font:700 .6rem/1 var(--f-num);background:var(--bg2);padding:3px 6px;margin-right:8px;border:1px solid var(--line)}
.danger{color:var(--bad)!important}
@media (prefers-reduced-motion: reduce){.btn:active{transform:none;box-shadow:4px 4px 0 var(--shadow)}}
@media (max-width:430px){.phone{width:100%;max-width:390px}}
@media print{
  .toggles{display:none}
  .theme-block.hidden{display:block}
  figure{break-inside:avoid;margin-bottom:30px}
}
"""

# ---------------------------------------------------------------- screens

STATUSBAR = ('<div class="statusbar"><span>9:41</span><span class="right">'
             '<span class="sig"><i></i><i></i><i></i><i></i></span>'
             '<span class="wifi"></span><span class="batt"><i></i></span></span></div>')


def tabbar(on=1):
    labels = [("i-home", "Home"), ("i-cal", "Calendar"), ("i-chart", "Stats"), ("i-sliders", "Settings")]
    out = ['<nav class="tabbar" aria-label="Main">']
    for i, (ic, lab) in enumerate(labels, 1):
        cls = ' class="on"' if i == on else ""
        out.append(f'<button{cls} aria-label="{lab}"><svg><use href="#{ic}"/></svg>{lab}</button>')
    out.append('</nav>')
    return "".join(out)


def phone(inner, caption):
    return (f'<figure><div class="phone"><div class="screen">{STATUSBAR}'
            f'<div class="app">{inner}</div></div></div>'
            f'<figcaption>{caption}</figcaption></figure>')


def s_dash():
    return phone(
        '<header class="head"><div><p class="kicker">Sat · Aug 15</p><h2>Get after it.</h2></div>'
        '<span class="chip streak"><svg><use href="#i-flame"/></svg>12</span></header>'
        '<section class="panel next"><p class="kicker">Next workout</p>'
        '<div class="row"><h3>Tue 18 Aug</h3><span class="sets">5·5·5·4·6</span></div>'
        '<div class="meter"><i style="width:50%"></i></div>'
        '<p class="sub">Workout 3 of 6 · Round 2</p>'
        '<button class="btn accent">Start workout <svg><use href="#i-arr"/></svg></button></section>'
        '<div class="grid2">'
        '<section class="panel tile"><p class="kicker">Max reps</p><b class="big">13</b><span class="sub">+1 this week</span></section>'
        '<section class="panel tile"><p class="kicker">Volume · week</p><b class="big">63</b><span class="sub">92 last week</span></section>'
        '</div>' + tabbar(1),
        '1 · Home — next workout, progress meter (6-step cycle), KPI tiles, streak chip (accent2).')


def s_work():
    return phone(
        '<div class="top"><button class="iconbtn" aria-label="Close workout"><svg><use href="#i-x"/></svg></button>'
        '<span class="step">Round 2 · Set 4 of 5</span><span class="clock">14:32</span></div>'
        '<div class="setsrow" aria-label="Sets">'
        '<div class="s done"><b>5</b><svg><use href="#i-check"/></svg><span>Set 1</span></div>'
        '<div class="s done"><b>5</b><svg><use href="#i-check"/></svg><span>Set 2</span></div>'
        '<div class="s done"><b>5</b><svg><use href="#i-check"/></svg><span>Set 3</span></div>'
        '<div class="s now"><b>4</b><span>Now</span></div>'
        '<div class="s"><b>6</b><span>Set 5</span></div></div>'
        '<div class="rest-layout">'
        '<div class="rest-hero">'
        '<svg class="ring" viewBox="0 0 120 120" width="180" height="180" role="img" aria-label="Rest timer, 2:47">'
        '<circle class="bg" cx="60" cy="60" r="52"/>'
        '<circle class="fg" cx="60" cy="60" r="52" stroke-dasharray="326.7" stroke-dashoffset="24" transform="rotate(-90 60 60)"/>'
        '<text class="ring-num" x="60" y="57" text-anchor="middle">2:47</text>'
        '<text class="ring-lab" x="60" y="73" text-anchor="middle">REST</text></svg>'
        '</div>'
        '<section class="rest-dock panel">'
        '<div class="presets"><button class="mini">1:30</button><button class="mini">3:00</button><button class="mini">5:00</button></div>'
        '<div class="restrow"><button class="mini" aria-label="Minus 15 seconds"><svg><use href="#i-minus"/></svg></button>'
        '<button class="mini" aria-label="Plus 15 seconds"><svg><use href="#i-plus"/></svg></button></div>'
        '<div class="restrow"><button class="mini"><svg><use href="#i-arr"/></svg> Skip</button>'
        '<button class="mini"><svg><use href="#i-pause"/></svg> Pause</button>'
        '<button class="mini"><svg><use href="#i-reset"/></svg> Reset</button></div>'
        '<p class="resthint">Sound + notification when rest ends</p>'
        '</section></div>',
        '2 · Workout (rest phase) — set cards, ring hero, presets 90s/3m/5m, no tab bar.')


CALGRID = ('<div class="calgrid" role="grid" aria-label="August 2026">'
           '<div class="dow">Mon</div><div class="dow">Tue</div><div class="dow">Wed</div><div class="dow">Thu</div>'
           '<div class="dow">Fri</div><div class="dow">Sat</div><div class="dow">Sun</div>'
           '<div class="day out">27</div><div class="day out">28</div><div class="day out">29</div><div class="day out">30</div>'
           '<div class="day out">31</div><div class="day out">1</div><div class="day out">2</div>'
           '<div class="day done">3<svg><use href="#i-check"/></svg></div><div class="day">4</div>'
           '<div class="day done">5<svg><use href="#i-check"/></svg></div><div class="day">6</div>'
           '<div class="day done">7<svg><use href="#i-check"/></svg></div><div class="day">8</div><div class="day">9</div>'
           '<div class="day done">10<svg><use href="#i-check"/></svg></div><div class="day">11</div>'
           '<div class="day done">12<svg><use href="#i-check"/></svg></div><div class="day">13</div>'
           '<div class="day missed">14<svg><use href="#i-x"/></svg></div><div class="day today">15</div><div class="day">16</div>'
           '<div class="day">17</div><div class="day planned sel">18</div><div class="day">19</div><div class="day">20</div>'
           '<div class="day planned">21</div><div class="day">22</div><div class="day">23</div>'
           '<div class="day planned">24</div><div class="day">25</div><div class="day">26</div><div class="day">27</div>'
           '<div class="day planned">28</div><div class="day">29</div><div class="day">30</div><div class="day">31</div></div>')


def s_cal():
    return phone(
        '<div style="position:relative">'
        '<div class="calhead"><h3>August 2026</h3><div class="nav">'
        '<button class="iconbtn" aria-label="Previous month"><svg><use href="#i-chevL"/></svg></button>'
        '<button class="iconbtn" aria-label="Next month"><svg><use href="#i-chevR"/></svg></button>'
        '<button class="today">Today</button></div></div>'
        + CALGRID +
        '<div class="legend"><span><i class="dot" style="background:var(--ok)"></i>Done</span>'
        '<span><i class="dot" style="background:var(--bad)"></i>Missed</span>'
        '<span><i class="dot" style="background:var(--accent2)"></i>Planned</span>'
        '<span><i class="dot" style="background:var(--accent)"></i>Today</span></div>'
        '<div class="sheet"><div class="backdrop"></div><div class="sheetcard">'
        '<div class="grab"></div><h4>Workout · Tue 18</h4><p class="sub">Sets 5·5·5·4·6 · Workout 3 of 6</p>'
        '<div class="optrow"><button class="opt">Mon 17</button><button class="opt on">Tue 18</button>'
        '<button class="opt">Wed 19</button></div>'
        '<p class="note"><svg><use href="#i-info"/></svg>All following workouts shift by the same offset.</p>'
        '<div class="btnrow"><button class="btn accent" style="flex:1.4">Move</button>'
        '<button class="btn ghost" style="flex:1">Start now</button></div></div></div>'
        '</div>' + tabbar(2),
        '3 · Calendar — day states, legend, reschedule bottom sheet.')


def s_stats():
    return phone(
        '<div class="head" style="padding-bottom:6px"><div><p class="kicker">Progress</p><h2>Stats</h2></div></div>'
        '<div class="kpis">'
        '<div class="kpi"><b>13</b><span>Max reps</span></div>'
        '<div class="kpi"><b>12d</b><span>Streak</span></div>'
        '<div class="kpi"><b>609</b><span>Volume</span></div></div>'
        '<section class="sec"><h4>Max reps by date</h4><p class="sub">tests + best sets</p>'
        '<svg class="chart" viewBox="0 0 354 158" role="img" aria-label="Max reps grew from 8 on Jun 20 to 13 on Aug 14">'
        '<line class="gridline" x1="24" y1="30" x2="340" y2="30"/><line class="gridline" x1="24" y1="63" x2="340" y2="63"/>'
        '<line class="gridline" x1="24" y1="96" x2="340" y2="96"/><line class="gridline" x1="24" y1="129" x2="340" y2="129"/>'
        '<polyline class="line" points="30,101 91,87 152,74 213,60 274,46 335,33"/>'
        '<circle class="pt" cx="30" cy="101" r="3.5"/><circle class="pt" cx="91" cy="87" r="3.5"/>'
        '<circle class="pt" cx="152" cy="74" r="3.5"/><circle class="pt" cx="213" cy="60" r="3.5"/>'
        '<circle class="pt" cx="274" cy="46" r="3.5"/><circle class="pt" cx="335" cy="33" r="3.5"/>'
        '<text class="ptlab" x="30" y="93">8</text><text class="ptlab" x="91" y="79">9</text>'
        '<text class="ptlab" x="152" y="66">10</text><text class="ptlab" x="213" y="52">11</text>'
        '<text class="ptlab" x="274" y="38">12</text><text class="ptlab" x="335" y="25">13</text>'
        '<text class="axis" x="30" y="146" text-anchor="middle">Jun 20</text><text class="axis" x="91" y="146" text-anchor="middle">Jul 3</text>'
        '<text class="axis" x="152" y="146" text-anchor="middle">Jul 17</text><text class="axis" x="213" y="146" text-anchor="middle">Jul 31</text>'
        '<text class="axis" x="274" y="146" text-anchor="middle">Aug 7</text><text class="axis" x="335" y="146" text-anchor="middle">Aug 14</text>'
        '</svg></section>'
        '<section class="sec"><h4>Weekly volume</h4>'
        '<svg class="chart" viewBox="0 0 354 140" role="img" aria-label="Weekly volume, last 7 weeks">'
        '<rect class="bar" x="30" y="64" width="26" height="76"/><rect class="bar" x="79" y="54" width="26" height="86"/>'
        '<rect class="bar" x="128" y="40" width="26" height="100"/><rect class="bar" x="177" y="45" width="26" height="95"/>'
        '<rect class="bar" x="226" y="35" width="26" height="105"/><rect class="bar" x="275" y="30" width="26" height="110"/>'
        '<rect class="bar dim" x="324" y="64" width="26" height="76"/>'
        '<text class="barlab" x="43" y="58" text-anchor="middle">62</text><text class="barlab" x="92" y="48" text-anchor="middle">71</text>'
        '<text class="barlab" x="141" y="34" text-anchor="middle">84</text><text class="barlab" x="190" y="39" text-anchor="middle">79</text>'
        '<text class="barlab" x="239" y="29" text-anchor="middle">88</text><text class="barlab" x="288" y="24" text-anchor="middle">92</text>'
        '<text class="barlab" x="337" y="58" text-anchor="middle">63</text>'
        '<text class="axis" x="43" y="134" text-anchor="middle">Jun22</text><text class="axis" x="92" y="134" text-anchor="middle">Jun29</text>'
        '<text class="axis" x="141" y="134" text-anchor="middle">Jul6</text><text class="axis" x="190" y="134" text-anchor="middle">Jul13</text>'
        '<text class="axis" x="239" y="134" text-anchor="middle">Jul20</text><text class="axis" x="288" y="134" text-anchor="middle">Jul27</text>'
        '<text class="axis" x="337" y="134" text-anchor="middle">Aug3*</text></svg></section>'
        '<section class="sec"><h4>History</h4><ul class="hist">'
        '<li><div class="date"><b>Aug 14</b><span>Max test</span></div>'
        '<div class="info"><b>13 reps</b><span>personal best</span></div><span class="pill ok">Done</span></li>'
        '<li><div class="date"><b>Aug 12</b><span>Step 6</span></div>'
        '<div class="info"><b>6·6·5·5·5</b><span>27 reps · 18 min</span></div><span class="pill ok">Done</span></li>'
        '<li><div class="date"><b>Aug 10</b><span>Step 6</span></div>'
        '<div class="info"><b>6·6·5·5·4</b><span>26 reps · 16 min</span></div><span class="pill ok">Done</span></li>'
        '<li><div class="date"><b>Aug 7</b><span>Workout 3</span></div>'
        '<div class="info"><b>5·5·5·4·3</b><span>22 of 25 planned</span></div><span class="pill fail">Not finished</span></li>'
        '</ul></section>' + tabbar(3),
        '4 · Stats — max chart, weekly volume, history with Done / Not finished pills.')


def s_set():
    return phone(
        '<div class="head" style="padding-bottom:6px"><div><p class="kicker">Poster · Swiss</p><h2>Settings</h2></div></div>'
        '<section class="sec"><h4>Rest timer</h4>'
        '<div class="setrow"><span class="k">rest_duration</span><span class="v"><b>3:00</b>'
        '<button class="iconbtn" aria-label="Decrease" style="width:44px;height:44px"><svg><use href="#i-minus"/></svg></button>'
        '<button class="iconbtn" aria-label="Increase" style="width:44px;height:44px"><svg><use href="#i-plus"/></svg></button></span></div>'
        '<div class="setrow"><span class="k">presets</span><span class="seg">'
        '<button>1:30</button><button class="on">3:00</button><button>5:00</button></span></div>'
        '<div class="setrow"><span class="k">auto_start</span>'
        '<button class="sw on" role="switch" aria-checked="true"><i></i></button></div>'
        '<div class="setrow last"><span class="k">notify</span>'
        '<button class="sw on" role="switch" aria-checked="true"><i></i></button></div>'
        '<p class="sub">Sound + notification when rest ends</p></section>'
        '<section class="sec"><h4>Theme</h4>'
        '<div class="setrow"><span class="k">palette</span><span class="v">'
        '<select class="pal-select" aria-label="Palette"><option>P01 Volt</option></select></span></div>'
        '<div class="setrow"><span class="k">mode</span><span class="seg">'
        '<button>light</button><button class="on">system</button><button>dark</button></span></div>'
        '<div class="setrow last"><span class="k">language</span><span class="seg">'
        '<button class="on">EN</button><button>RU</button></span></div></section>'
        '<section class="sec"><h4>Schedule</h4>'
        '<div class="setrow"><span class="k">frequency</span><span class="seg">'
        '<button class="on">3× / week</button><button>2× / week</button></span></div>'
        '<div class="setrow last"><span class="k">weekdays</span><span class="weekdays">'
        '<button class="wd on">Mon</button><button class="wd">Tue</button><button class="wd on">Wed</button>'
        '<button class="wd">Thu</button><button class="wd on">Fri</button><button class="wd">Sat</button>'
        '<button class="wd">Sun</button></span></div></section>'
        '<section class="sec"><h4>Data</h4>'
        '<button class="btn"><svg><use href="#i-dl"/></svg> Export backup</button>'
        '<button class="btn"><svg><use href="#i-up"/></svg> Import backup</button>'
        '<div class="setrow last"><span class="k danger">reset_all_data</span><span class="v">'
        '<svg style="width:16px;height:16px"><use href="#i-trash"/></svg></span></div></section>'
        '<section class="sec" style="margin-bottom:4px"><h4>About</h4>'
        '<div class="setrow"><span class="k">version</span><span class="v"><b>' + APP_VERSION + '</b></span></div>'
        '<div class="setrow"><span class="k">about_app</span><span class="v"><b>→</b></span></div>'
        '<div class="setrow last"><span class="k">why_program</span><span class="v"><b>→</b></span></div>'
        '</section>' + tabbar(4),
        '5 · Settings — rest, theme, schedule, data export/import, about links.')


def s_onboarding():
    return phone(
        '<p class="kicker"><span class="step-dots"><i></i><i class="on"></i><i></i></span> Step 2 of 3</p>'
        '<section class="panel">'
        '<p class="kicker">Max reps test</p>'
        '<p class="sub">How many strict pull-ups can you do in one set?</p>'
        '<div class="rep-stepper">'
        '<button class="iconbtn" aria-label="Decrease"><svg><use href="#i-minus"/></svg></button>'
        '<div class="contour">7</div>'
        '<button class="iconbtn" aria-label="Increase"><svg><use href="#i-plus"/></svg></button></div>'
        '<p class="sub">Use your best honest attempt.</p>'
        '<div class="btnrow"><button class="btn ghost">Back</button><button class="btn accent">Next</button></div>'
        '</section>',
        '6 · Onboarding — max test with rep-stepper, no tab bar.')


def s_result():
    return phone(
        '<div class="result-page">'
        '<section class="panel result ok">'
        '<div class="icon"><svg><use href="#i-check"/></svg></div>'
        '<p class="kicker">Workout complete</p>'
        '<p class="sub">24 of 25 reps</p>'
        '<p class="sub">Next: Workout 4 of 6</p>'
        '<div class="btnrow"><button class="btn accent">Home</button></div>'
        '</section></div>',
        '7 · Result — success panel with ok border, no tab bar.')


def s_pwa():
    return phone(
        '<div class="pwa-full">'
        '<div class="pwa-scroll">'
        '<p class="kicker">Install app</p>'
        '<h2>Add to Home Screen</h2>'
        '<p class="sub">Works offline after first visit.</p>'
        '<div class="langrow"><span class="lang-label">Language</span>'
        '<span class="seg"><button class="on">EN</button><button>RU</button></span></div>'
        '<div class="tabs"><button class="tab on">iOS</button><button class="tab">Android</button>'
        '<button class="tab">Desktop</button><button class="tab">Other</button></div>'
        '<ol class="steps">'
        '<li><span class="step-num">1</span><span>Tap Share in Safari toolbar</span></li>'
        '<li><span class="step-num">2</span><span>Scroll and tap Add to Home Screen</span></li>'
        '<li><span class="step-num">3</span><span>Confirm — app opens full screen</span></li>'
        '</ol></div>'
        '<div class="pwa-footer">'
        '<button class="btn accent">Install</button>'
        '<button class="btn outline">Dismiss</button></div></div>',
        '8 · PWA install — full-screen modal, platform tabs, no tab bar.')


def s_about():
    return phone(
        '<div class="subpage-head">'
        '<header class="head"><div><p class="kicker">About</p><h2>Pull-up Trainer</h2></div></header>'
        '<button class="btn ghost"><svg><use href="#i-chevL"/></svg> Back</button>'
        '<div class="about-mark"><svg width="40" height="40" viewBox="0 0 24 24" fill="var(--accent-ink)"><circle cx="12" cy="8" r="3"/><path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg></div>'
        '</div>'
        '<section class="panel"><p>Local-first PWA for pull-up training.</p>'
        '<p class="sub">Version ' + APP_VERSION + '</p>'
        '<button class="btn accent">Why this program?</button>'
        '<button class="btn">Sources</button></section>',
        '9 · About — subpage with back button, brand mark, no tab bar.')


def s_why():
    return phone(
        '<div class="subpage-head">'
        '<header class="head"><div><p class="kicker">Science</p><h2>Why this program</h2></div></header>'
        '<button class="btn ghost"><svg><use href="#i-chevL"/></svg> Back</button></div>'
        '<section class="sec"><h4>Overview</h4>'
        '<p class="sub">Progressive overload with autoregulated max sets and deload rules.</p></section>'
        '<section class="sec"><h4>Formulas</h4>'
        '<div class="formula"><b>Working set</b><code>ceil(0.7 × M*)</code>'
        '<span class="sub">Example: M*=7 → 5 reps</span></div></section>'
        '<section class="sec"><h4>Sources</h4>'
        '<p><span class="badge">Open access</span><span class="badge">[1]</span> Study title…</p></section>',
        '10 · Why program — long-form sections, formulas, source badges, no tab bar.')


SCREENS = [s_dash, s_work, s_cal, s_stats, s_set, s_onboarding, s_result, s_pwa, s_about, s_why]

# ---------------------------------------------------------------- palettes

P = dict
PALETTES = [
    P(slug="p01-volt", num="P01", name="Volt", style="эталонный неон-зелёный",
      desc="Референс из A8: кислотно-зелёный на тёплом чёрном / лайм на бумаге. Классика «спортзал ночью».",
      dark=P(bg="#0E0E0B", bg2="#070706", card="#161612", ink="#F7F7F0", muted="#A3A397",
            line="#000000", accent="#C6FF3B", accent_ink="#0E0E0B", accent2="#FFD22E",
            ok="#4CE08A", warn="#FFC24D", bad="#FF5D4D", shadow="#000000"),
      light=P(bg="#F4F2EA", bg2="#E4E1D5", card="#FFFFFF", ink="#17150E", muted="#6B695D",
             line="#0F0E0A", accent="#A8D920", accent_ink="#101A02", accent2="#C79200",
             ok="#1C7A46", warn="#96600A", bad="#B53A2A", shadow="#0F0E0A")),
    P(slug="p02-signal-orange", num="P02", name="Signal Orange", style="сигнально-оранжевый",
      desc="Оранжевый спецтехники: максимум видимости, энергия. В светлой теме — апельсин на бумаге.",
      dark=P(bg="#0D0A08", bg2="#070503", card="#17120E", ink="#FBF4EC", muted="#A39488",
            line="#1C1206", accent="#FF5A1F", accent_ink="#160700", accent2="#FFB35C",
            ok="#54D98C", warn="#FFC14D", bad="#FF6D5C", shadow="#000000"),
      light=P(bg="#FAF3E9", bg2="#EBDDC9", card="#FFFDF9", ink="#1D140B", muted="#75685A",
             line="#241608", accent="#FF6A2E", accent_ink="#1A0800", accent2="#B35500",
             ok="#1C7A46", warn="#96600A", bad="#B53A2A", shadow="#241608")),
    P(slug="p03-cobalt", num="P03", name="Cobalt", style="электрик-синий",
      desc="Глубокий кобальт и электрик: спортивно, «электронно». Светлая — голубой на ледяной бумаге.",
      dark=P(bg="#07090F", bg2="#04050A", card="#0F1220", ink="#EEF1FF", muted="#8F97B8",
            line="#0C1030", accent="#4D8DFF", accent_ink="#041030", accent2="#7DD3FF",
            ok="#54E09B", warn="#FFC65C", bad="#FF6F7D", shadow="#000000"),
      light=P(bg="#F2F4FB", bg2="#E0E6F5", card="#FFFFFF", ink="#141832", muted="#5F688F",
             line="#10173A", accent="#6F9DFF", accent_ink="#051138", accent2="#0A7ABF",
             ok="#1A7A46", warn="#96600A", bad="#B33141", shadow="#10173A")),
    P(slug="p04-magenta-pop", num="P04", name="Magenta Pop", style="неоновая магента",
      desc="Яркая магента + фиолетовый второй акцент: «клубная» энергия без розовой сладости.",
      dark=P(bg="#0E0710", bg2="#080409", card="#170C1A", ink="#F9EDF8", muted="#A78BA6",
            line="#1F0518", accent="#FF2D95", accent_ink="#1A0010", accent2="#9D6BFF",
            ok="#54E09B", warn="#FFC65C", bad="#FF6D6D", shadow="#000000"),
      light=P(bg="#FBF1F8", bg2="#EFDFEA", card="#FFFDFE", ink="#261020", muted="#7A6478",
             line="#2B0A20", accent="#F25CAE", accent_ink="#2B0016", accent2="#6B3FD1",
             ok="#1A7A46", warn="#96600A", bad="#B62D46", shadow="#2B0A20")),
    P(slug="p05-taxi", num="P05", name="Taxi", style="такси-жёлтый",
      desc="Жёлтое такси NYC: чёрное + жёлтое + оранжевый. Самый «уличный» вариант.",
      dark=P(bg="#0D0C08", bg2="#060604", card="#16150F", ink="#F7F3E2", muted="#A29C83",
            line="#000000", accent="#FFD400", accent_ink="#141000", accent2="#FF7A00",
            ok="#4CE08A", warn="#FFD35E", bad="#FF5D4D", shadow="#000000"),
      light=P(bg="#F7F4E6", bg2="#EAE5CE", card="#FFFEF8", ink="#1C1908", muted="#6E6A52",
             line="#151300", accent="#D4B000", accent_ink="#141000", accent2="#D96A00",
             ok="#1C7A46", warn="#8A6500", bad="#B53A2A", shadow="#151300")),
    P(slug="p06-paper-red", num="P06", name="Paper Red", style="швейцарский ч/б + красный",
      desc="Канонический швейцарский плакат: чёрный, белый, один красный. Максимальная строгость.",
      dark=P(bg="#0A0A0A", bg2="#030303", card="#141414", ink="#F2F2F2", muted="#9A9A9A",
            line="#000000", accent="#EF4A3F", accent_ink="#140000", accent2="#D8D8D8",
            ok="#4CD78A", warn="#FFC14D", bad="#FF5D4D", shadow="#000000"),
      light=P(bg="#FFFFFF", bg2="#E9E9E9", card="#FFFFFF", ink="#111111", muted="#707070",
             line="#111111", accent="#C6281C", accent_ink="#FFFFFF", accent2="#5A5A5A",
             ok="#1E7D47", warn="#96600A", bad="#B53A2A", shadow="#111111")),
    P(slug="p07-mint-terminal", num="P07", name="Mint Terminal", style="мятный терминал",
      desc="Мятно-бирюзовый на глубоком зелёно-чёрном: «терминал 1980-х». Светлая — мята на белом.",
      dark=P(bg="#07120E", bg2="#030A07", card="#0D1C16", ink="#E9F7EF", muted="#8AA897",
            line="#032318", accent="#6FE3C1", accent_ink="#032318", accent2="#9EE8FF",
            ok="#54E09B", warn="#FFC65C", bad="#FF6F7D", shadow="#000000"),
      light=P(bg="#EEF8F1", bg2="#DCEFE2", card="#FFFFFF", ink="#0D2118", muted="#587367",
             line="#0A2C1E", accent="#37B389", accent_ink="#062A1D", accent2="#0A6EA8",
             ok="#157A46", warn="#96630A", bad="#B33136", shadow="#0A2C1E")),
    P(slug="p08-amber", num="P08", name="Amber", style="янтарный / строительный",
      desc="Янтарь и оранж: теплее неона, «рабочая» эстетика сигнальных жилетов.",
      dark=P(bg="#100C05", bg2="#080602", card="#1A140A", ink="#FAF3E3", muted="#A3947C",
            line="#1F1503", accent="#FFB000", accent_ink="#1C1100", accent2="#FF8A3D",
            ok="#54D98C", warn="#FFD35E", bad="#FF5D4D", shadow="#000000"),
      light=P(bg="#FAF3E4", bg2="#ECE1C8", card="#FFFCF5", ink="#211806", muted="#75664D",
             line="#2B1E04", accent="#E08A00", accent_ink="#1A0F00", accent2="#C4501A",
             ok="#1C7A46", warn="#8A6500", bad="#B53A2A", shadow="#2B1E04")),
    P(slug="p09-cyan-future", num="P09", name="Cyan Future", style="циановое будущее",
      desc="Чистый циан + магентовый второй акцент: «киберспорт». Холодный и чистый.",
      dark=P(bg="#041114", bg2="#02080A", card="#081C20", ink="#E4F8F9", muted="#7FA8AD",
            line="#03313A", accent="#00E0E8", accent_ink="#00262C", accent2="#FF5CD0",
            ok="#54E09B", warn="#FFC65C", bad="#FF6F7D", shadow="#000000"),
      light=P(bg="#EEF8F9", bg2="#DCEFF1", card="#FFFFFF", ink="#0B262B", muted="#5B7A7E",
             line="#093540", accent="#0FBCC4", accent_ink="#02262B", accent2="#B01C8F",
             ok="#157A46", warn="#8F6000", bad="#B33136", shadow="#093540")),
    P(slug="p10-crimson", num="P10", name="Crimson", style="тёмно-красный",
      desc="Красный как акцент и как настроение: агрессивнее Paper Red, теплее Cobalt.",
      dark=P(bg="#0F0707", bg2="#080303", card="#180C0C", ink="#F9ECEC", muted="#A58A8A",
            line="#200404", accent="#FF4A3D", accent_ink="#1A0000", accent2="#FF8A75",
            ok="#54E09B", warn="#FFC65C", bad="#FF7A5C", shadow="#000000"),
      light=P(bg="#FBF1F0", bg2="#EFDDDB", card="#FFFDFC", ink="#271010", muted="#7C6260",
             line="#2E0B0A", accent="#C6281C", accent_ink="#FFFFFF", accent2="#A04A3D",
             ok="#1A7A46", warn="#96600A", bad="#C2422F", shadow="#2E0B0A")),
    P(slug="p11-spring-green", num="P11", name="Spring Green", style="весенний зелёный",
      desc="Свежий зелёный + циановый: «парк, весна, рост». Самый спокойный из ярких.",
      dark=P(bg="#071208", bg2="#030903", card="#0D1B0E", ink="#EEF8EA", muted="#93A88D",
            line="#062508", accent="#00E07F", accent_ink="#04260F", accent2="#6AE0FF",
            ok="#4FE3D6", warn="#FFC65C", bad="#FF6F7D", shadow="#000000"),
      light=P(bg="#F0F9EC", bg2="#DFEEDA", card="#FFFFFF", ink="#0E2412", muted="#5D7A5F",
             line="#0C2B0F", accent="#0DAF5E", accent_ink="#052610", accent2="#0A7FA8",
             ok="#0F7F7F", warn="#96630A", bad="#B33136", shadow="#0C2B0F")),
    P(slug="p12-ultraviolet", num="P12", name="Ultraviolet", style="фиолетовый",
      desc="Глубокий фиолет + магента: «ночной неон города». Мистично, спортивно.",
      dark=P(bg="#0C0913", bg2="#06040B", card="#150F22", ink="#F1EBFB", muted="#9C8FBE",
            line="#180739", accent="#8B5CFF", accent_ink="#12002B", accent2="#FF5CD0",
            ok="#54E09B", warn="#FFC65C", bad="#FF6F7D", shadow="#000000"),
      light=P(bg="#F5F1FC", bg2="#E7DFF5", card="#FFFFFF", ink="#1C122E", muted="#6E6287",
             line="#221148", accent="#6F42D9", accent_ink="#FFFFFF", accent2="#A6247F",
             ok="#1A7A46", warn="#96600A", bad="#B33136", shadow="#221148")),
    P(slug="p13-coral-sunrise", num="P13", name="Coral Sunrise", style="коралловый рассвет",
      desc="Тёплый коралл + голубой второй акцент: рассветные тона, дружелюбнее всех.",
      dark=P(bg="#100A07", bg2="#080502", card="#191109", ink="#FBF1E9", muted="#A69487",
            line="#210B03", accent="#FF6B4A", accent_ink="#220500", accent2="#6FD3FF",
            ok="#54E09B", warn="#FFC65C", bad="#FF5D7D", shadow="#000000"),
      light=P(bg="#FBF1EB", bg2="#F0DFD4", card="#FFFDFB", ink="#26140C", muted="#7B685C",
             line="#2E1508", accent="#F2683F", accent_ink="#220500", accent2="#1F8FC4",
             ok="#1A7A46", warn="#96600A", bad="#B33145", shadow="#2E1508")),
    P(slug="p14-mono-ink", num="P14", name="Mono Ink", style="чистая инверсия ч/б",
      desc="Никакого цвета: чёрный, белый, инверсия. Тени белые на чёрном. Предельный минимализм.",
      dark=P(bg="#000000", bg2="#000000", card="#0C0C0C", ink="#F5F5F5", muted="#9A9A9A",
            line="#FFFFFF", accent="#FFFFFF", accent_ink="#000000", accent2="#A8A8A8",
            ok="#7EE8A8", warn="#E8D27E", bad="#FF8A80", shadow="#FFFFFF"),
      light=P(bg="#FFFFFF", bg2="#E9E9E9", card="#FFFFFF", ink="#111111", muted="#6E6E6E",
             line="#0F0F0F", accent="#0F0F0F", accent_ink="#FFFFFF", accent2="#666666",
             ok="#1C7A46", warn="#96600A", bad="#B33136", shadow="#0F0F0F")),
]

MOCKUP_SLUG = "p01-volt"

SWATCH_KEYS = [("bg", "bg"), ("card", "card"), ("ink", "ink"), ("accent", "accent"),
               ("accent2", "accent2"), ("ok", "ok"), ("warn", "warn"), ("bad", "bad")]

TOKEN_TMPL_DARK = ('.th-dark{{--bg:{bg};--bg2:{bg2};--card:{card};--ink:{ink};--muted:{muted};'
                   '--line:{line};--accent:{accent};--accent-ink:{accent_ink};--accent2:{accent2};'
                   '--ok:{ok};--warn:{warn};--bad:{bad};--shadow:{shadow}}}')
TOKEN_TMPL_LIGHT = ('.th-light{{--bg:{bg};--bg2:{bg2};--card:{card};--ink:{ink};--muted:{muted};'
                    '--line:{line};--accent:{accent};--accent-ink:{accent_ink};--accent2:{accent2};'
                    '--ok:{ok};--warn:{warn};--bad:{bad};--shadow:{shadow}}}')

TOGGLE_JS = """
<script>
(function () {
  var btns = document.querySelectorAll(".toggle");
  var blocks = document.querySelectorAll(".theme-block");
  function set(t) {
    btns.forEach(function (b) { b.classList.toggle("on", b.dataset.t === t); });
    blocks.forEach(function (b) { b.classList.toggle("hidden", b.dataset.t !== t); });
    document.body.classList.toggle("light", t === "light");
    document.body.classList.toggle("dark", t === "dark");
  }
  btns.forEach(function (b) { b.addEventListener("click", function () { set(b.dataset.t); }); });
  set("dark");
})();
</script>
"""


def swatch_li(name, hexv):
    return f'<li><i style="background:{hexv}"></i>{name} {hexv}</li>'


def build_palette(pal):
    dark_sw = "".join(swatch_li(n, pal["dark"][k]) for k, n in SWATCH_KEYS)
    light_sw = "".join(swatch_li(n, pal["light"][k]) for k, n in SWATCH_KEYS)
    dark_summ = f"bg {pal['dark']['bg']} · accent {pal['dark']['accent']} · ink {pal['dark']['ink']}"
    light_summ = f"bg {pal['light']['bg']} · accent {pal['light']['accent']} · ink {pal['light']['ink']}"
    body = "".join(f() for f in SCREENS)

    html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Poster {pal['num']} — {pal['name']} (dark + light)</title>
<style>
{SHARED_CSS}
{TOKEN_TMPL_DARK.format(**pal['dark'])}
{TOKEN_TMPL_LIGHT.format(**pal['light'])}
</style>
</head>
<body class="dark">
{SYMBOLS}
<main>
  <header class="intro">
    <span class="tag">{pal['num']} · {pal['name']} — {pal['style']}</span>
    <h1>Poster — {pal['name']}</h1>
    <p>{pal['desc']} Poster/Swiss: обе темы, 10 экранов (5 core + 5 extended).</p>
    <div class="swboxes">
      <div class="swbox"><span class="t">Dark</span><ul>{dark_sw}</ul></div>
      <div class="swbox"><span class="t">Light</span><ul>{light_sw}</ul></div>
    </div>
  </header>
  <div class="toggles">
    <button class="toggle on" data-t="dark">Dark theme</button>
    <button class="toggle" data-t="light">Light theme</button>
  </div>
  <section class="theme-block th-dark" data-t="dark">
    <h2>Dark theme <span>{dark_summ}</span></h2>
    <div class="themebody">{body}</div>
  </section>
  <section class="theme-block th-light hidden" data-t="light">
    <h2>Light theme <span>{light_summ}</span></h2>
    <div class="themebody">{body}</div>
  </section>
</main>
{TOGGLE_JS}
</body>
</html>
"""
    out = HERE / "mockups" / f"poster-{pal['slug']}.html"
    out.write_text(html, encoding="utf-8")
    return out.name


def mockup_palette():
    return next(p for p in PALETTES if p["slug"] == MOCKUP_SLUG)


def build_palettes_index():
    cards = []
    for pal in [mockup_palette()]:
        dark_dots = "".join(f'<i style="background:{pal["dark"][k]}"></i>' for k, _ in SWATCH_KEYS)
        light_dots = "".join(f'<i style="background:{pal["light"][k]}"></i>' for k, _ in SWATCH_KEYS)
        cards.append(f"""<div class="card">
  <span class="style">{pal['num']}</span>
  <h2>{pal['name']}</h2>
  <div class="dots" title="dark">{dark_dots}</div>
  <div class="dots" title="light">{light_dots}</div>
  <p>{pal['desc']}</p>
  <a class="open" href="poster-{pal['slug']}.html">Открыть</a>
</div>""")

    html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Poster / Swiss — палитры</title>
<style>
:root{{--bg:#0d0d0b;--ink:#e8e8e0;--muted:#8f8f85;--line:#262621}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,sans-serif}}
main{{max-width:900px;margin:0 auto;padding:2.4rem 1.25rem 4rem}}
.tag{{display:inline-block;font:700 .72rem/1 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;background:var(--ink);color:var(--bg);padding:.4rem .85rem;border-radius:2px}}
h1{{font-family:"Arial Black",system-ui,sans-serif;font-size:2rem;line-height:1.05;margin:.8rem 0 .3rem;text-transform:uppercase}}
.meta{{color:var(--muted);margin:0;max-width:640px}}
a.back{{display:inline-block;margin-top:1rem;color:var(--ink);font:700 .8rem/1 ui-monospace,Menlo,monospace}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-top:2rem}}
.card{{border:2px solid var(--line);border-radius:2px;padding:1rem 1.1rem;background:#141410;display:flex;flex-direction:column;gap:.5rem;box-shadow:5px 5px 0 #000}}
.card .style{{color:#c6ff3b;font:800 .72rem/1 ui-monospace,Menlo,monospace;letter-spacing:.12em}}
.card h2{{font-family:"Arial Black",system-ui,sans-serif;font-size:1rem;margin:0;text-transform:uppercase}}
.card p{{color:var(--muted);font-size:.82rem;margin:0;flex:1}}
.dots{{display:flex;gap:.3rem}}
.dots i{{width:17px;height:17px;border-radius:2px;border:1px solid rgba(127,127,127,.35)}}
a.open{{display:block;text-align:center;text-decoration:none;color:#0e0e0b;background:#c6ff3b;border:2px solid #000;border-radius:2px;padding:.6rem;font:800 .78rem/1 "Arial Black",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;box-shadow:4px 4px 0 #000}}
a.open:hover{{filter:brightness(1.06)}}
footer{{color:var(--muted);font-size:.78rem;margin-top:2.5rem;border-top:2px solid var(--line);padding-top:1rem}}
</style>
</head>
<body>
<main>
<span class="tag">P01 Volt</span>
<h1>Poster / Swiss — мокап</h1>
<p class="meta">10 экранов × 2 темы (dark/light), переключатель сверху файла.
5 core (tab bar) + 5 extended (onboarding, result, PWA, about, why).
P01 Volt — эталонная палитра по умолчанию.</p>
<a class="back" href="../poster-design.md">← спека Poster / Swiss</a>
<div class="grid">
{chr(10).join(cards)}
</div>
<footer>Все файлы самодостаточны. Пересборка: python3 ../build-assets.py</footer>
</main>
</body>
</html>
"""
    (HERE / "mockups" / "index.html").write_text(html, encoding="utf-8")


def build_tokens():
    token_order = ["bg", "bg2", "card", "ink", "muted", "line", "accent",
                   "accent-ink", "accent2", "ok", "warn", "bad", "shadow"]

    def block(selector, pal, comment):
        out = [f"/* {comment} */", f"{selector} {{"]
        for k in token_order:
            out.append(f"  --{k}: {pal[k.replace('-', '_')]};")
        out.append("}")
        return out

    lines = [
        "/* ============================================================",
        "   Pull-up Trainer — Poster / Swiss — theme tokens",
        "   Generated by build-assets.py — edit palettes there.",
        "",
        "   Theme = palette + mode. Set on <html>:",
        "     data-theme=\"<slug>-dark\"  or  data-theme=\"<slug>-light\"",
        "",
        "   Palettes:",
    ]
    for p in PALETTES:
        lines.append(f"     {p['num']} {p['name']}  ({p['slug']})")
    lines += [
        "   Default (no attribute): p01-volt, dark.",
        "   ============================================================ */",
        "",
    ]
    lines += block(":root", PALETTES[0]["dark"], "Default = P01 Volt — dark")
    lines.append("")
    for p in PALETTES:
        lines += block(f'[data-theme="{p["slug"]}-dark"]', p["dark"], f"{p['num']} {p['name']} — dark")
        lines += block(f'[data-theme="{p["slug"]}-light"]', p["light"], f"{p['num']} {p['name']} — light")
        lines.append("")
    (HERE / "theme-tokens.css").write_text("\n".join(lines), encoding="utf-8")


def build_readme():
    rows = []
    for p in PALETTES:
        rows.append(f"| {p['num']} | {p['name']} | `{p['slug']}-dark` / `{p['slug']}-light` | {p['style']} |")
    md = f"""# Design — Poster / Swiss

Дизайн-система приложения: язык **Poster / Swiss**,
14 цветовых тем, в каждой — тёмный и светлый режим.

Полная спека: [`poster-design.md`](poster-design.md) (экраны, компоненты, a11y).

## Структура

```
design/
├── README.md          ← этот файл
├── poster-design.md   ← спека дизайн-языка (источник правды)
├── theme-tokens.css   ← все палитры как CSS custom properties
├── build-assets.py    ← генератор мокапов, токенов и этого README
├── mockups/           ← HTML-мокап P01 Volt (10 экранов + index)
└── assets/            ← графика: логотип, иконки, паттерны
```

Runtime-стили приложения: [`src/assets/styles/main.css`](../../src/assets/styles/main.css)
(импортирует `theme-tokens.css`).

## Темы

| № | Имя | data-theme | Характер |
|---|---|---|---|
{chr(10).join(rows)}

По умолчанию: **P01 Volt**, режим **system** (тёмный/светлый по настройке ОС).

## Как использовать в приложении

1. Подключить `theme-tokens.css` через `main.css`.
2. Установить на `<html>` атрибут `data-theme="<slug>-<mode>"`, mode = dark | light.
3. Настройки: выбор палитры (P01–P14) + режим light / dark / system;
   system резолвится через `prefers-color-scheme`.
4. Все компоненты используют только переменные: `--bg`, `--bg2`, `--card`,
   `--ink`, `--muted`, `--line`, `--accent`, `--accent-ink`, `--accent2`,
   `--ok`, `--warn`, `--bad`, `--shadow`.

## Мокапы

`mockups/poster-p01-volt.html` — 10 экранов в дефолтной палитре P01 Volt:
Home, Workout, Calendar, Stats, Settings, Onboarding, Result, PWA install, About, Why program.

Графические ассеты — в `assets/` (см. `assets/README.md`).

Пересборка: `python3 build-assets.py`.
"""
    (HERE / "README.md").write_text(md, encoding="utf-8")


if __name__ == "__main__":
    (HERE / "mockups").mkdir(exist_ok=True)
    names = [build_palette(mockup_palette())]
    build_palettes_index()
    build_tokens()
    build_readme()
    for n in names:
        print(n)
    print("mockups/index.html", "theme-tokens.css", "README.md")
