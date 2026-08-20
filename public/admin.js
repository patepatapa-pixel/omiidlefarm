
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let selected=null;
async function api(url,opt={}){const r=await fetch(url,{headers:{"Content-Type":"application/json",...(opt.headers||{})},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Hiba");return d}
function toast(t){let e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1700)}
function fmt(n){return Math.floor(Number(n||0)).toLocaleString("hu-HU")}
async function ensureAdmin(){try{let d=await api("/api/me");if(d.user.role!=="admin")throw new Error("Nincs admin jogosultság.");loadPlayers()}catch(e){alert(e.message);location.href="/"}}
async function loadPlayers(){
 try{
  let d=await api("/api/admin/players");$("#playerCount").textContent=d.rows.filter(x=>x.role==="player").length;
  $("#players").innerHTML=`<div class="leader-row head"><span>ID</span><span>JÁTÉKOS</span><span>ERŐ</span><span>SZINT</span><span>KILL</span></div>`+
  d.rows.map(r=>`<div class="leader-row" data-player="${r.id}" style="cursor:pointer"><span>#${r.id}</span><span class="leader-name">${r.username}${r.role==="admin"?" ⚙️":r.banned?" 🚫":""}</span><span>${fmt(r.power)}</span><span>Lv.${r.level}</span><span>${fmt(r.kills)}</span></div>`).join("");
  $$("[data-player]").forEach(x=>x.onclick=()=>openPlayer(x.dataset.player));
 }catch(e){toast(e.message)}
}
async function openPlayer(id){
 try{
   let d=await api("/api/admin/player/"+id);selected=d;$("#pmName").textContent=`👤 ${d.user.username}`;
   let g=d.game||{},s=g.save_data||{};
   $("#pmStats").innerHTML=[["Erő",g.power||0],["Szint",g.level||1],["Killek",g.kills||0],["Arany",s.gold||0],["Kristály",s.gems||0],["Érc",s.ore||0],["Lélekkő",s.soul||0],["Dungeon jegy",s.tickets||0],["Tiltva",d.user.banned?"IGEN":"NEM"]].map(x=>`<div class="statbox"><small>${x[0]}</small><b>${typeof x[1]==="number"?fmt(x[1]):x[1]}</b></div>`).join("");
   $("#banBtn").textContent=d.user.banned?"Tiltás feloldása":"Játékos tiltása";$("#playerModal").classList.add("open");
 }catch(e){toast(e.message)}
}
$("#playerClose").onclick=()=>$("#playerModal").classList.remove("open");
$("#banBtn").onclick=async()=>{if(!selected)return;try{await api(`/api/admin/player/${selected.user.id}/ban`,{method:"POST",body:JSON.stringify({banned:!selected.user.banned})});toast("Mentve.");$("#playerModal").classList.remove("open");loadPlayers()}catch(e){toast(e.message)}};
$("#resetBtn").onclick=async()=>{if(!selected||!confirm("Biztosan teljesen reseteljük ennek a játékosnak a mentését?"))return;try{await api(`/api/admin/player/${selected.user.id}/reset`,{method:"POST",body:"{}"});toast("Mentés resetelve.");$("#playerModal").classList.remove("open");loadPlayers()}catch(e){toast(e.message)}};
$("#grantBtn").onclick=async()=>{if(!selected)return;try{await api(`/api/admin/player/${selected.user.id}/grant`,{method:"POST",body:JSON.stringify({type:$("#grantType").value,amount:Number($("#grantAmount").value)})});toast("Jutalom hozzáadva.");openPlayer(selected.user.id)}catch(e){toast(e.message)}};
async function loadLogs(){try{let d=await api("/api/admin/logs");$("#logs").innerHTML=d.rows.map(x=>`<div class="quest"><b>${x.action}</b><small>${x.admin_name||"?"} → ${x.target_name||"?"} · ${new Date(x.created_at).toLocaleString("hu-HU")}</small></div>`).join("")||"<p>Nincs napló.</p>"}catch(e){toast(e.message)}}
$$("[data-a]").forEach(b=>b.onclick=()=>{$$("[data-a]").forEach(x=>x.classList.remove("active"));$$("[id^='a-']").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#a-"+b.dataset.a).classList.add("active");if(b.dataset.a==="logs")loadLogs()});
$("#refreshPlayers").onclick=loadPlayers;
$("#adminLogout").onclick=async()=>{try{await api("/api/logout",{method:"POST",body:"{}"})}catch{}location.href="/"};
ensureAdmin();
