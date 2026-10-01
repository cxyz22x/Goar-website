import "../../../services/storage.js";
globalThis.buildCatBar = function buildCatBar(){
  const bar = document.getElementById("catBar");
  if (!bar) return;
  bar.replaceChildren();
  PREDEFINED.forEach(p => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = "cat-chip";
    c.textContent = p.label;
    c.setAttribute("aria-pressed", "false");
    c.onclick = async () => {
      bar.querySelectorAll(".cat-chip").forEach(chip => chip.setAttribute("aria-pressed", String(chip === c)));
      try { await p.fn(); }
      catch { toast(p.label + " could not load. Check your connection and try again."); }
    };
    bar.appendChild(c);
  });
}

/* ================= REGION ================= */

