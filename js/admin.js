import { loadProducts, downloadJson, escapeHtml } from "./utils.js";

const ADMIN_PASSWORD = "change-me";

const pass = document.getElementById("pass");
const btnUnlock = document.getElementById("unlock");
const btnExport = document.getElementById("export");
const file = document.getElementById("file");
const val = document.getElementById("val");

const btnAddInst = document.getElementById("addInst");
const btnAddProd = document.getElementById("addProd");
const boxInst = document.getElementById("institutions");
const boxProd = document.getElementById("products");

let db = { institutions: [], products: [] };
let unlocked = false;

function uid(prefix){
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function setUnlocked(v){
  unlocked = v;
  btnExport.disabled = !v;
  btnAddInst.disabled = !v;
  btnAddProd.disabled = !v;
  btnUnlock.textContent = v ? "Unlocked" : "Unlock";
  btnUnlock.className = "btn" + (v ? " primary" : "");
  render();
}

function validate(){
  const errors = [];
  const instIds = new Set((db.institutions||[]).map(i => i.institution_id));
  for (const p of (db.products||[])){
    if (!instIds.has(p.institution_id)) errors.push(`Product ${p.product_id} references missing institution_id.`);
    for (const k of ["shariah_clarity_score","transparency_score","accessibility_score","fairness_score"]){
      const v = Number(p[k]);
      if (!Number.isFinite(v) || v < 1 || v > 5) errors.push(`Product ${p.product_id} has invalid ${k} (must be 1–5).`);
    }
  }
  return errors;
}

function writeValidation(){
  const errs = validate();
  if (!errs.length){
    val.textContent = "Looks good. You can export.";
    val.className = "small";
  }else{
    val.textContent = "Fix these before exporting:\n" + errs.join("\n");
    val.className = "small";
  }
}

function updateInst(id, patch){
  db = { ...db, institutions: db.institutions.map(x => x.institution_id === id ? ({...x, ...patch}) : x) };
  render();
}
function updateProd(id, patch){
  db = { ...db, products: db.products.map(x => x.product_id === id ? ({...x, ...patch}) : x) };
  render();
}
function removeInst(id){
  const used = db.products.some(p => p.institution_id === id);
  if (used) { alert("Cannot delete: used by products. Reassign products first."); return; }
  db = { ...db, institutions: db.institutions.filter(x => x.institution_id !== id) };
  render();
}
function removeProd(id){
  db = { ...db, products: db.products.filter(x => x.product_id !== id) };
  render();
}

function addInstitution(){
  const newInst = {
    institution_id: uid("inst"),
    name: "New institution",
    institution_type: "islamic_bank",
    islamic_model: "full_fledged",
    country: "bd",
    website_url: ""
  };
  db = { ...db, institutions: [newInst, ...db.institutions] };
  render();
}
function addProduct(){
  const firstInst = db.institutions[0]?.institution_id || "";
  const newProd = {
    product_id: uid("prd"),
    institution_id: firstInst,
    product_name: "New product",
    product_category: "sme_finance",
    target_segment: "sme",
    contract_type: "murabaha",
    agent_banking_supported: false,
    collateral_required: true,
    financing_min_bdt: 0,
    financing_max_bdt: 0,
    profit_rate_type: "not_disclosed",
    profit_rate_note: "",
    shariah_clarity_score: 3,
    transparency_score: 3,
    accessibility_score: 3,
    fairness_score: 3,
    summary: "",
    sources: []
  };
  db = { ...db, products: [newProd, ...db.products] };
  render();
}

function addSource(productId){
  const p = db.products.find(x => x.product_id === productId);
  const next = { label: "Source", url: "" };
  updateProd(productId, { sources: [...(p?.sources || []), next] });
}
function updateSource(productId, idx, patch){
  const p = db.products.find(x => x.product_id === productId);
  const sources = [...(p?.sources || [])];
  sources[idx] = { ...sources[idx], ...patch };
  updateProd(productId, { sources });
}
function removeSource(productId, idx){
  const p = db.products.find(x => x.product_id === productId);
  const sources = (p?.sources || []).filter((_,i)=>i!==idx);
  updateProd(productId, { sources });
}

function instCard(i){
  const disabled = unlocked ? "" : "disabled";
  const website = i.website_url || "";
  return `
  <div class="card">
    <div class="row" style="justify-content:space-between">
      <div style="font-weight:900">${escapeHtml(i.name)}</div>
      <button class="btn danger" data-act="del-inst" data-id="${escapeHtml(i.institution_id)}" ${disabled}>Delete</button>
    </div>
    <div class="grid cols-3" style="margin-top:10px">
      <div>
        <div class="small">Name</div>
        <input class="input" ${disabled} value="${escapeHtml(i.name)}" data-act="inst-name" data-id="${escapeHtml(i.institution_id)}"/>
      </div>
      <div>
        <div class="small">Type</div>
        <select class="input" ${disabled} data-act="inst-type" data-id="${escapeHtml(i.institution_id)}">
          ${["islamic_bank","conventional_bank","mfi","takaful"].map(v => `<option value="${v}" ${i.institution_type===v?"selected":""}>${v}</option>`).join("")}
        </select>
      </div>
      <div>
        <div class="small">Model</div>
        <select class="input" ${disabled} data-act="inst-model" data-id="${escapeHtml(i.institution_id)}">
          ${["full_fledged","islamic_window"].map(v => `<option value="${v}" ${i.islamic_model===v?"selected":""}>${v}</option>`).join("")}
        </select>
      </div>
      <div>
        <div class="small">Country</div>
        <select class="input" ${disabled} data-act="inst-country" data-id="${escapeHtml(i.institution_id)}">
          ${["bd","tr"].map(v => `<option value="${v}" ${String(i.country||"bd")===v?"selected":""}>${v.toUpperCase()}</option>`).join("")}
        </select>
      </div>
      <div style="grid-column:1/-1">
        <div class="small">Website URL</div>
        <input class="input" ${disabled} value="${escapeHtml(website)}" data-act="inst-web" data-id="${escapeHtml(i.institution_id)}"/>
      </div>
      <div class="small" style="grid-column:1/-1"><b>ID:</b> ${escapeHtml(i.institution_id)}</div>
    </div>
  </div>`;
}

function prodCard(p){
  const disabled = unlocked ? "" : "disabled";
  const instOptions = db.institutions.map(i => `<option value="${escapeHtml(i.institution_id)}" ${p.institution_id===i.institution_id?"selected":""}>${escapeHtml(i.name)}</option>`).join("");
  const sources = (p.sources || []).map((s, idx) => `
    <div class="grid cols-3" style="margin-top:10px">
      <div>
        <div class="small">Label</div>
        <input class="input" ${disabled} value="${escapeHtml(s.label||"")}" data-act="src-label" data-id="${escapeHtml(p.product_id)}" data-idx="${idx}">
      </div>
      <div style="grid-column:2/-1">
        <div class="small">URL</div>
        <input class="input" ${disabled} value="${escapeHtml(s.url||"")}" data-act="src-url" data-id="${escapeHtml(p.product_id)}" data-idx="${idx}">
      </div>
      <div>
        <button class="btn danger" ${disabled} data-act="src-del" data-id="${escapeHtml(p.product_id)}" data-idx="${idx}">Remove</button>
      </div>
    </div>
  `).join("");

  return `
  <div class="card">
    <div class="row" style="justify-content:space-between">
      <div>
        <div style="font-weight:900">${escapeHtml(p.product_name)}</div>
        <div class="small">${escapeHtml(p.product_category)} • ${escapeHtml(p.contract_type)} • ${escapeHtml(p.target_segment)}</div>
      </div>
      <button class="btn danger" data-act="del-prod" data-id="${escapeHtml(p.product_id)}" ${disabled}>Delete</button>
    </div>

    <div class="grid cols-3" style="margin-top:10px">
      <div style="grid-column:1/-1">
        <div class="small">Product name</div>
        <input class="input" ${disabled} value="${escapeHtml(p.product_name)}" data-act="prd-name" data-id="${escapeHtml(p.product_id)}"/>
      </div>

      <div>
        <div class="small">Institution</div>
        <select class="input" ${disabled} data-act="prd-inst" data-id="${escapeHtml(p.product_id)}">${instOptions}</select>
      </div>

      <div>
        <div class="small">Category</div>
        <select class="input" ${disabled} data-act="prd-cat" data-id="${escapeHtml(p.product_id)}">
          ${["savings","sme_finance","home_finance","agent_banking"].map(v => `<option value="${v}" ${p.product_category===v?"selected":""}>${v}</option>`).join("")}
        </select>
      </div>

      <div>
        <div class="small">Contract</div>
        <select class="input" ${disabled} data-act="prd-contract" data-id="${escapeHtml(p.product_id)}">
          ${["murabaha","musharakah","ijara","salam","qard_hasan","mudarabah"].map(v => `<option value="${v}" ${p.contract_type===v?"selected":""}>${v}</option>`).join("")}
        </select>
      </div>

      <div>
        <div class="small">Target</div>
        <select class="input" ${disabled} data-act="prd-target" data-id="${escapeHtml(p.product_id)}">
          ${["individual","micro","sme","corporate"].map(v => `<option value="${v}" ${p.target_segment===v?"selected":""}>${v}</option>`).join("")}
        </select>
      </div>

      <div>
        <div class="small">Agent banking</div>
        <select class="input" ${disabled} data-act="prd-agent" data-id="${escapeHtml(p.product_id)}">
          <option value="false" ${String(!!p.agent_banking_supported)==="false"?"selected":""}>No</option>
          <option value="true" ${String(!!p.agent_banking_supported)==="true"?"selected":""}>Yes</option>
        </select>
      </div>

      <div>
        <div class="small">Collateral</div>
        <select class="input" ${disabled} data-act="prd-coll" data-id="${escapeHtml(p.product_id)}">
          <option value="false" ${String(!!p.collateral_required)==="false"?"selected":""}>No</option>
          <option value="true" ${String(!!p.collateral_required)==="true"?"selected":""}>Yes</option>
        </select>
      </div>

      <div>
        <div class="small">Min (BDT)</div>
        <input class="input" type="number" ${disabled} value="${escapeHtml(p.financing_min_bdt ?? "")}" data-act="prd-min" data-id="${escapeHtml(p.product_id)}"/>
      </div>

      <div>
        <div class="small">Max (BDT)</div>
        <input class="input" type="number" ${disabled} value="${escapeHtml(p.financing_max_bdt ?? "")}" data-act="prd-max" data-id="${escapeHtml(p.product_id)}"/>
      </div>

      <div style="grid-column:1/-1">
        <div class="small">Summary</div>
        <input class="input" ${disabled} value="${escapeHtml(p.summary || "")}" data-act="prd-summary" data-id="${escapeHtml(p.product_id)}"/>
      </div>

      <div>
        <div class="small">Profit rate type</div>
        <select class="input" ${disabled} data-act="prd-rate-type" data-id="${escapeHtml(p.product_id)}">
          ${["fixed","variable","indicative","not_disclosed"].map(v => `<option value="${v}" ${p.profit_rate_type===v?"selected":""}>${v}</option>`).join("")}
        </select>
      </div>

      <div style="grid-column:1/-1">
        <div class="small">Profit note</div>
        <input class="input" ${disabled} value="${escapeHtml(p.profit_rate_note || "")}" data-act="prd-rate-note" data-id="${escapeHtml(p.product_id)}"/>
      </div>

      ${["shariah_clarity_score","transparency_score","accessibility_score","fairness_score"].map(k => `
        <div>
          <div class="small">${k} (1–5)</div>
          <input class="input" type="number" min="1" max="5" ${disabled} value="${escapeHtml(p[k])}" data-act="prd-score" data-k="${k}" data-id="${escapeHtml(p.product_id)}"/>
        </div>
      `).join("")}

      <div style="grid-column:1/-1">
        <div class="row" style="justify-content:space-between; margin-top:10px">
          <div style="font-weight:900">Sources</div>
          <button class="btn" ${disabled} data-act="src-add" data-id="${escapeHtml(p.product_id)}">+ Add source</button>
        </div>
        ${(p.sources||[]).length ? sources : `<div class="small" style="margin-top:8px">No sources yet.</div>`}
      </div>

      <div class="small" style="grid-column:1/-1"><b>ID:</b> ${escapeHtml(p.product_id)}</div>
    </div>
  </div>`;
}

function render(){
  writeValidation();
  boxInst.innerHTML = (db.institutions||[]).map(instCard).join("");
  boxProd.innerHTML = (db.products||[]).map(prodCard).join("");

  document.querySelectorAll("[data-act]").forEach(el => {
    el.onchange = null;
    el.onclick = null;
  });

  document.body.onclick = (e) => {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const act = t.dataset.act;
    const id = t.dataset.id;

    if (act === "del-inst") return removeInst(id);
    if (act === "del-prod") return removeProd(id);
    if (act === "src-add") return addSource(id);
    if (act === "src-del") return removeSource(id, Number(t.dataset.idx));
  };

  document.body.oninput = (e) => {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const act = t.dataset.act;
    const id = t.dataset.id;

    if (act === "inst-name") return updateInst(id, { name: t.value });
    if (act === "inst-type") return updateInst(id, { institution_type: t.value });
    if (act === "inst-model") return updateInst(id, { islamic_model: t.value });
    if (act === "inst-country") return updateInst(id, { country: t.value });
    if (act === "inst-web") return updateInst(id, { website_url: t.value });

    if (act === "prd-name") return updateProd(id, { product_name: t.value });
    if (act === "prd-inst") return updateProd(id, { institution_id: t.value });
    if (act === "prd-cat") return updateProd(id, { product_category: t.value });
    if (act === "prd-contract") return updateProd(id, { contract_type: t.value });
    if (act === "prd-target") return updateProd(id, { target_segment: t.value });
    if (act === "prd-agent") return updateProd(id, { agent_banking_supported: t.value === "true" });
    if (act === "prd-coll") return updateProd(id, { collateral_required: t.value === "true" });
    if (act === "prd-min") return updateProd(id, { financing_min_bdt: t.value === "" ? null : Number(t.value) });
    if (act === "prd-max") return updateProd(id, { financing_max_bdt: t.value === "" ? null : Number(t.value) });
    if (act === "prd-summary") return updateProd(id, { summary: t.value });
    if (act === "prd-rate-type") return updateProd(id, { profit_rate_type: t.value });
    if (act === "prd-rate-note") return updateProd(id, { profit_rate_note: t.value });
    if (act === "prd-score") return updateProd(id, { [t.dataset.k]: Number(t.value) });

    if (act === "src-label") return updateSource(id, Number(t.dataset.idx), { label: t.value });
    if (act === "src-url") return updateSource(id, Number(t.dataset.idx), { url: t.value });
  };
}

btnUnlock.addEventListener("click", () => {
  if (unlocked) return;
  if ((pass.value || "") === ADMIN_PASSWORD) setUnlocked(true);
  else alert("Wrong password.");
});

btnExport.addEventListener("click", () => {
  const errs = validate();
  if (errs.length){
    alert("Fix these before exporting:\n\n" + errs.join("\n"));
    return;
  }
  downloadJson("products.json", db);
});

file.addEventListener("change", () => {
  const f = file.files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const json = JSON.parse(String(reader.result || ""));
      if (!json.institutions || !json.products) throw new Error("Missing institutions/products keys");
      db = json;
      alert("Imported successfully.");
      render();
    }catch(e){
      alert("Import failed: " + (e?.message || e));
    }
  };
  reader.readAsText(f);
});

btnAddInst.addEventListener("click", addInstitution);
btnAddProd.addEventListener("click", addProduct);

(async function init(){
  db = await loadProducts();
  render();
  setUnlocked(false);
})();
