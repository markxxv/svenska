import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('dark mode applies before CDN styles and supports saved preference',async()=>{
  const html=await read('index.html');
  const early=html.indexOf('localStorage.getItem(');
  const css=html.indexOf('id="theme-styles"');
  const cdn=html.indexOf('https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4');
  assert.ok(early>=0&&early<cdn,'Theme must apply before Tailwind loads');
  assert.ok(css>=0&&css<cdn,'Dark backgrounds need critical CSS before CDN');
  assert.ok(html.includes("classList.toggle('dark', theme === 'dark')"));
  assert.match(html,/html\.dark body, html\.dark main \{ background: #000 !important/);
  assert.match(html,/html\.dark #bottomNav/);
  assert.match(html,/html\.dark \.bg-emerald-50/);
  assert.match(html,/html\.dark \.bg-rose-50/);
  assert.ok(html.includes('[class*="!bg-emerald-50"]'));
  assert.ok(html.includes('[class*="!bg-rose-50"]'));
  assert.ok(html.includes('[class*="!text-emerald-900"]'));
  assert.ok(html.includes('[class*="!text-rose-900"]'));
  assert.match(html,/html\.dark \.flip-back/);
});
test('settings dropdown supports both themes and accessibility',async()=>{
  const html=await read('index.html'),app=await read('js/app.js');
  assert.match(html,/id="settingsTrigger"/);
  assert.match(html,/id="settingsMenu"/);
  assert.match(html,/data-theme-option="light"/);
  assert.match(html,/data-theme-option="dark"/);
  assert.match(app,/localStorage\.setItem\('svenska-theme',theme\)/);
  assert.match(app,/settingsTrigger\.setAttribute\('aria-expanded'/);
  assert.match(app,/option\.setAttribute\('aria-pressed'/);
  assert.match(app,/settingsMenu\.hidden=!settingsMenu\.hidden/);
  assert.match(app,/settingsContainer\.contains\(event\.target\)/);
  assert.match(app,/event\.key==='Escape'&&!settingsMenu\.hidden/);
});
