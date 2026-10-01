// Narrow live check of the unchanged agent versus its iframe wrapper.
// Never reads credential fields or captures chats / terminal contents.
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const domain = process.env.REPLIT_DEV_DOMAIN;
if (!domain) throw new Error("Run in the development workspace with REPLIT_DEV_DOMAIN available.");
const origin = `https://${domain}`;
const profile = await mkdtemp(join(tmpdir(), "goar-boundary-"));
const port = 9229;
const browser = spawn("chromium", [
  "--headless", "--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
  "--disable-features=BackForwardCache", "--no-first-run",
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "about:blank",
], { stdio: "ignore" });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
const pending = new Map();
let serial = 0;

try {
  let targets;
  for (let n = 0; n < 50; n++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      if (targets.some(target => target.type === "page")) break;
    } catch { /* wait for the debugging endpoint */ }
    await sleep(200);
  }
  const target = targets?.find(target => target.type === "page");
  if (!target) throw new Error("The local browser did not start.");
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", () => reject(new Error("Browser debugging connection failed.")), { once: true });
  });
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result);
    }
  });
  function command(method, params = {}) {
    const id = ++serial;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Browser command timed out: ${method}`)); }, 20000);
      pending.set(id, {
        resolve: value => { clearTimeout(timer); resolve(value); },
        reject: error => { clearTimeout(timer); reject(error); },
      });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const response = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
    return response.result.value;
  }
  await command("Page.enable");
  await command("Runtime.enable");
  if (process.argv.includes("--preview")) {
    const pages = [
      { name: "supplied-reference", url: pathToFileURL(join(process.cwd(), "attached_assets/goar_preview_1790871320377.html")).href },
      { name: "modular-main", url: `${origin}/` },
    ];
    const outcomes = [];
    for (const page of pages) {
      await command("Page.navigate", { url: page.url });
      await sleep(2000);
      const desktop = await evaluate(`(() => {
        const h=document.querySelector('h1'), root=document.querySelector('.gp')||document.body;
        const s=getComputedStyle(h), r=getComputedStyle(root);
        return {heading:h.textContent.trim(),font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,color:r.color,background:r.backgroundColor};
      })()`);
      await command("Emulation.setDeviceMetricsOverride", { width: 402, height: 874, deviceScaleFactor: 1, mobile: true });
      await sleep(300);
      const controls = await evaluate(`(async () => {
        const menu=document.querySelector('.nav-toggle');
        menu.click();
        await new Promise(requestAnimationFrame);
        const menuOpened=menu.getAttribute('aria-expanded')==='true' && document.querySelector('.nav').classList.contains('open');
        menu.click();
        await new Promise(requestAnimationFrame);
        const menuClosed=menu.getAttribute('aria-expanded')==='false' && !document.querySelector('.nav').classList.contains('open');
        const root=document.querySelector('.gp')||document.documentElement;
        document.querySelector('.theme-btn').click();
        await new Promise(requestAnimationFrame);
        return {menuOpened,menuClosed,theme:root.getAttribute('data-theme'),overflow:document.documentElement.scrollWidth>window.innerWidth};
      })()`);
      await sleep(100);
      const themeChanged = await evaluate(`!!(document.querySelector('.gp')||document.documentElement).getAttribute('data-theme')`);
      const outcome = { name: page.name, desktop, controls: { ...controls, themeChanged } };
      outcomes.push(outcome);
      console.log(JSON.stringify(outcome));
      await command("Emulation.clearDeviceMetricsOverride");
    }
    if (JSON.stringify(outcomes[0].desktop) !== JSON.stringify(outcomes[1].desktop)) throw new Error("Main-page reference styles differ from the modular page.");
    for (const outcome of outcomes) {
      if (!outcome.controls.menuOpened || !outcome.controls.menuClosed || !outcome.controls.themeChanged || outcome.controls.overflow) {
        throw new Error(`Main-page source controls or mobile layout failed: ${outcome.name}`);
      }
    }
  } else for (const path of process.argv.includes("--wrapper-only") ? ["/agent"] : ["/workspace/index.html", "/agent"]) {
    await command("Page.navigate", { url: `${origin}${path}` });
    const documentExpression = path === "/agent" ? "document.querySelector('iframe')?.contentDocument" : "document";
    let status;
    for (let n = 0; n < 45; n++) {
      await sleep(1000);
      status = await evaluate(`(() => {
        const d=${documentExpression}; if(!d)return {loading:true};
        const visible = el => !!el && el.getClientRects().length > 0;
        return {
          ready: d.getElementById('app')?.classList.contains('show') && !visible(d.getElementById('setup')),
          providerSetup: visible(d.getElementById('credPhase')),
          bootError: !!d.getElementById('err')?.textContent?.trim(),
          ssh: d.getElementById('kali-status-chip')?.textContent?.trim().slice(0,150) || '',
          terminal: d.getElementById('term-status')?.textContent?.trim().slice(0,150) || ''
        };
      })()`);
      if (status.ready || status.providerSetup || status.bootError) break;
    }
    console.log(JSON.stringify({ path, stage: "boot", ...status }));
    if (status?.providerSetup && !status.ready) {
      // The supplied UI's default-provider continuation, no credential access.
      await evaluate(`(() => {const d=${documentExpression};d?.getElementById('credGo')?.click();})()`);
      await sleep(7000);
    }
    if (process.argv.includes("--preset")) {
      // Exercise the supplied UI's preset, without reading its credential values.
      await evaluate(`(() => {const d=${documentExpression};d?.getElementById('btn-top-settings')?.click();})()`);
      await sleep(300);
      await evaluate(`(() => {const d=${documentExpression};d?.getElementById('btnSshDefault')?.click();})()`);
      await sleep(300);
      await evaluate(`(() => {const d=${documentExpression};d?.getElementById('btnSaveSettings')?.click();})()`);
      await sleep(1000);
      await evaluate(`(() => {const d=${documentExpression};d?.getElementById('btnCloseSettings')?.click();})()`);
    }
    await evaluate(`(() => {const d=${documentExpression};d?.getElementById('btn-top-term')?.click();})()`);
    await sleep(2000);
    // Select the supplied SSH connection instead of misreporting the local shell.
    await evaluate(`(() => {const d=${documentExpression};d?.getElementById('btn-term-ssh')?.click();})()`);
    await sleep(12000);
    const result = await evaluate(`(() => {
      const d=${documentExpression};
      return {
        ready: !!d?.getElementById('app')?.classList.contains('show'),
        visibleApp: !!d?.getElementById('app')?.getClientRects().length,
        appClass: d?.getElementById('app')?.className,
        appDisplay: d?.defaultView?.getComputedStyle(d.getElementById('app')).display,
        setupDisplay: d?.defaultView?.getComputedStyle(d.getElementById('setup')).display,
        providers: Array.from(d?.querySelectorAll('#credProvider option') || []).map(o=>o.textContent.trim()).slice(0,12),
        models: Array.from(d?.querySelectorAll('#credModel option') || []).map(o=>o.textContent.trim()).slice(0,5),
        continueDisabled: d?.getElementById('credGo')?.disabled,
        ssh: d?.getElementById('kali-status-chip')?.textContent?.trim().slice(0,150) || '',
        terminal: d?.getElementById('term-status')?.textContent?.trim().slice(0,150) || '',
        wrapper: ${path === "/agent" ? "document.querySelector('.agent-status')?.textContent?.trim().slice(0,400)" : "null"}
      };
    })()`);
    console.log(JSON.stringify({ path, stage: "ssh-status", ...result }));
    if (result.terminal === "Connected · ssh" && process.argv.includes("--pwd")) {
      const before = await evaluate(`(() => {const d=${documentExpression};return (d?.getElementById('term-stage')?.innerText||'').includes('/root');})()`);
      await evaluate(`(() => {
        const d=${documentExpression};d?.defaultView?.focus();
        const stage=d?.getElementById('term-stage');
        const input=stage?.querySelector('textarea,input,[contenteditable=true],[tabindex]')||d?.getElementById('kb');
        input?.focus();
      })()`);
      for (const key of "pwd") {
        await command("Input.dispatchKeyEvent", { type: "keyDown", key, code: `Key${key.toUpperCase()}`, text: key, unmodifiedText: key, windowsVirtualKeyCode: key.toUpperCase().charCodeAt(0) });
        await command("Input.dispatchKeyEvent", { type: "keyUp", key, code: `Key${key.toUpperCase()}` });
      }
      await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
      await command("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      await sleep(4000);
      const pwdReturned = await evaluate(`(() => {
        const d=${documentExpression};
        const stage=d?.getElementById('term-stage');
        return {
          directoryReturned:/^\\s*\\/(?:[^\\r\\n]+)?\\s*$/m.test(stage?.innerText||''),
          hasPwd:(stage?.innerText||'').includes('pwd'),
          textLength:(stage?.innerText||'').length,
          tags:Array.from(stage?.querySelectorAll('textarea,input,canvas,[tabindex]')||[]).map(el=>({tag:el.tagName,id:el.id,class:el.className})),
          focus:d?.activeElement?.id||d?.activeElement?.tagName,
        };
      })()`);
      console.log(JSON.stringify({ path, stage: "remote-pwd", before, ...pwdReturned }));
      await evaluate(`(() => {const d=${documentExpression};d?.getElementById('btn-term-disconnect')?.click();})()`);
    }
    if (process.argv.includes("--chat") && result.ready) {
      await evaluate(`(() => {
        const d=${documentExpression};
        d.getElementById('btn-term-close')?.click();
        const input=d.getElementById('input');
        input.value='Reply with just OK';
        input.dispatchEvent(new d.defaultView.Event('input',{bubbles:true}));
        input.dispatchEvent(new d.defaultView.KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true}));
      })()`);
      let replied = false;
      for (let attempt=0;attempt<30;attempt++) {
        await sleep(1000);
        replied=await evaluate(`(() => {
          const d=${documentExpression};
          return Array.from(d.getElementById('messages')?.querySelectorAll('*')||[]).some(el=>el.children.length===0 && /^OK[.!]?$/.test(el.textContent.trim()));
        })()`);
        if(replied)break;
      }
      console.log(JSON.stringify({path,stage:'default-chat',replied}));
    }
  }
} finally {
  socket?.close();
  browser.kill("SIGTERM");
  await sleep(600);
  if (browser.exitCode === null) browser.kill("SIGKILL");
  await rm(profile, { recursive: true, force: true });
}