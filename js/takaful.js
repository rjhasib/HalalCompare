import { loadProducts, escapeHtml } from "./utils.js";

const cards = document.getElementById("cards");
function badge(t){ return `<span class="badge">${escapeHtml(t)}</span>`; }

(async function init(){
  const db = await loadProducts();
  const inst = (db.institutions||[]).filter(i => i.institution_type === "takaful");
  cards.innerHTML = inst.map(i => `
    <div class="card">
      <div class="row" style="justify-content:space-between">
        <div style="font-weight:900">${escapeHtml(i.name)}</div>
        ${i.website_url ? `<a class="badge" href="${escapeHtml(i.website_url)}" target="_blank" rel="noopener">Website</a>` : badge("No website")}
      </div>
      <div class="row" style="margin-top:10px">
        ${badge(i.institution_type)} ${badge(i.islamic_model)} ${badge((i.country||"").toUpperCase())}
      </div>
      <div class="small" style="margin-top:10px"><b>ID:</b> ${escapeHtml(i.institution_id)}</div>
    </div>
  `).join("") || `<div class="card">No takaful institutions yet. Add them in Admin.</div>`;
})();
