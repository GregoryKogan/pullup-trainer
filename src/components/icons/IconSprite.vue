<template>
  <svg width="0" height="0" style="position: absolute" aria-hidden="true">
    <defs>
      <symbol id="icon-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.8 12 3l9 7.8"/><path d="M5.2 9.6V20a1 1 0 0 0 1 1h3.2v-6.2h5.2V21h3.2a1 1 0 0 0 1-1V9.6"/></symbol>
      <symbol id="icon-cal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.2" y="5.2" width="17.6" height="15.6" rx="2.4"/><path d="M3.2 10h17.6M8 3v4.4M16 3v4.4"/></symbol>
      <symbol id="icon-chart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 19.5h17"/><path d="M5.5 15.5 10 10.5l3.6 2.8L19 6.5"/></symbol>
      <symbol id="icon-sliders" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2.4" fill="var(--bg)"/><circle cx="15" cy="17" r="2.4" fill="var(--bg)"/></symbol>
      <symbol id="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.6 9.7 17 19 7.4"/></symbol>
      <symbol id="icon-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></symbol>
      <symbol id="icon-flame" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3.2c1.9 3.2 4.9 5.1 4.9 8.6a4.9 4.9 0 1 1-9.8 0c0-1.7.9-3.1 1.9-4.4.2 1.2 1.2 1.9 2.5 1.9-.9-1.9-1.2-4.4.5-6.1Z"/></symbol>
      <symbol id="icon-bell" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.2 9.2a5.8 5.8 0 0 1 11.6 0c0 4.4 1.6 5.6 1.6 5.6H4.6s1.6-1.2 1.6-5.6"/><path d="M10.2 18.6a1.9 1.9 0 0 0 3.6 0"/></symbol>
      <symbol id="icon-pause" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6.6" y="5.4" width="3.6" height="13.2" rx="1"/><rect x="13.8" y="5.4" width="3.6" height="13.2" rx="1"/></symbol>
      <symbol id="icon-play" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></symbol>
      <symbol id="icon-reset" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4.4v4h-4"/></symbol>
      <symbol id="icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5.4v13.2M5.4 12h13.2"/></symbol>
      <symbol id="icon-minus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5.4 12h13.2"/></symbol>
      <symbol id="icon-chev-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.6 6 8.6 12l6 6"/></symbol>
      <symbol id="icon-chev-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.4 6l6 6-6 6"/></symbol>
      <symbol id="icon-arrow-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13.6 6.4 19 12l-5.4 5.6"/></symbol>
      <symbol id="icon-download" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10.5M7.6 11 12 15.4 16.4 11"/><path d="M4.5 19.5h15"/></symbol>
      <symbol id="icon-upload" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.4V4.9M7.6 8.4 12 4l4.4 4.4"/><path d="M4.5 19.5h15"/></symbol>
      <symbol id="icon-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 6.8h15M9.7 6.8V5.3a1.4 1.4 0 0 1 1.4-1.4h1.8a1.4 1.4 0 0 1 1.4 1.4v1.5"/><path d="m6.9 6.8.7 11.6a1.5 1.5 0 0 0 1.5 1.4h5.8a1.5 1.5 0 0 0 1.5-1.4l.7-11.6"/></symbol>
      <symbol id="icon-info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.4"/><circle cx="12" cy="7.9" r="1" fill="currentColor" stroke="none"/></symbol>
      <symbol id="icon-vibrate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3.6" width="8" height="16.8" rx="2.2"/><path d="M12 17.4v.4"/><path d="M3.6 9.4c.7 1.6.7 3.6 0 5.2M20.4 9.4c-.7 1.6-.7 3.6 0 5.2"/></symbol>
    </defs>
  </svg>
</template>
