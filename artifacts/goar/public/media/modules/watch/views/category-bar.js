import "../../../services/storage.js";
globalThis.buildCatBar = function buildCatBar(){
  const bar = document.getElementById("catBar"); bar.innerHTML = "";
  PREDEFINED.forEach(p => { const c = document.createElement("div"); c.className = "cat-chip"; c.textContent = p.label; c.onclick = () => p.fn(); bar.appendChild(c); });
}

/* ================= REGION ================= */

