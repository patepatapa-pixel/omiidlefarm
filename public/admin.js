
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


// V8 ADMIN STUDIO
let studioPlayers=[],studioConfig={bosses:[],items:[],pets:[],auras:[],zones:[]};
const qs=s=>document.querySelector(s),qsa=s=>[...document.querySelectorAll(s)];
async function sa(url,opt={}){let r=await fetch(url,{headers:{"Content-Type":"application/json"},...opt}),d=await r.json();if(!r.ok)throw Error(d.error||"Hiba");return d}
const num=id=>Number(qs(id)?.value||0);
async function loadStudioV8(){try{let p=await sa("/api/admin/players-full");studioPlayers=p.players||[];qs("#studioPlayer").innerHTML=studioPlayers.map(x=>`<option value="${x.id}">${x.username}</option>`).join("");fillSP();let c=await sa("/api/content-config");studioConfig={bosses:[],items:[],pets:[],auras:[],zones:[],...(c.config||{})};renderBuildersV8()}catch(e){console.error(e)}}
function curSP(){return studioPlayers.find(x=>String(x.id)===qs("#studioPlayer").value)}
function fillSP(){let p=curSP();if(!p)return;let s=p.save_data||{},v={admLevel:s.level||1,admParagon:s.paragonLevel||0,admPrestige:s.prestigeLevel||0,admGold:s.gold||0,admGems:s.gems||0,admOre:s.ore||0,admSoul:s.soul||0,admTickets:s.tickets||0,admSkillPoints:s.skillPoints||0,admParagonPoints:s.paragonPoints||0,admAuraTokens:s.auraTokens||0,admWave:s.wave||1,admKills:s.kills||0,admLuck:s.base?.luck||1};Object.entries(v).forEach(([k,x])=>qs("#"+k).value=x);qs("#playerSaveJson").value=JSON.stringify(s,null,2)}
qs("#studioPlayer")?.addEventListener("change",fillSP);
qs("#savePlayerStats")?.addEventListener("click",async()=>{let p=curSP(),s=structuredClone(p.save_data||{});Object.assign(s,{level:num("#admLevel"),paragonLevel:num("#admParagon"),prestigeLevel:num("#admPrestige"),gold:num("#admGold"),gems:num("#admGems"),ore:num("#admOre"),soul:num("#admSoul"),tickets:num("#admTickets"),skillPoints:num("#admSkillPoints"),paragonPoints:num("#admParagonPoints"),auraTokens:num("#admAuraTokens"),wave:num("#admWave"),kills:num("#admKills")});s.base={...(s.base||{}),luck:num("#admLuck")};await sa("/api/admin/player-save",{method:"POST",body:JSON.stringify({id:p.id,save:s})});p.save_data=s;fillSP();alert("✅ Mentve")});
qs("#savePlayerJson")?.addEventListener("click",async()=>{try{let p=curSP(),s=JSON.parse(qs("#playerSaveJson").value);await sa("/api/admin/player-save",{method:"POST",body:JSON.stringify({id:p.id,save:s})});p.save_data=s;fillSP();alert("✅ Teljes mentés frissítve")}catch(e){alert("❌ "+e.message)}});
qsa("[data-studio]").forEach(b=>b.onclick=()=>{qsa(".studio-page").forEach(x=>x.classList.remove("active"));qs("#studio-"+b.dataset.studio).classList.add("active")});
const schemas={
 bosses:[["id","ID"],["name","Név"],["icon","Ikon"],["hp","HP","number"],["damage","Sebzés","number"],["xp","XP jutalom","number"],["gold","Arany jutalom","number"],["regenPct","HP regen %/mp","number"],["dropChance","Tárgy drop %","number"],["minLevel","Minimum szint","number"],["minZone","Minimum terület index","number"]],
 items:[["id","ID"],["name","Név"],["icon","Ikon"],["slot","Slot: weapon/armor/helmet/gloves/boots/ring"],["rarity","normal/rare/epic/mythic/legendary"],["atk","Támadás","number"],["def","Védelem","number"],["goldBonus","Arany bónusz %","number"],["critBonus","Krit bónusz %","number"],["dropBonus","Drop bónusz %","number"],["minZone","Minimum terület index","number"]],
 pets:[["id","ID"],["name","Név"],["icon","Ikon"],["rarity","Ritkaság"],["bonus","damage/gold/drop/crit/all"],["value","Bónusz %","number"]],
 auras:[["id","ID"],["name","Név"],["className","CSS class"],["prestigeNeed","Prestige kell","number"],["cost","Aura token ár","number"]],
 zones:[["id","ID"],["name","Név"],["icon","Ikon"],["enemy","Szörny neve"],["hp","Szörny HP","number"],["gold","Arany / kill","number"],["xp","XP / kill","number"],["need","Ajánlott erő","number"],["dropChance","Tárgy drop %","number"]]
};
const builderBase={bosses:"boss",items:"item",pets:"pet",auras:"aura",zones:"zone"};
function renderBuildersV8(){
 Object.entries(schemas).forEach(([type,fields])=>{
  const base=builderBase[type],b=qs("#"+base+"Builder"),l=qs("#"+base+"List");
  if(!b||!l)return;
  b.innerHTML=`<div class="builder-form">${fields.map(([k,n,t="text"])=>`<label>${n}<input data-field="${k}" type="${t}" placeholder="${n}"></label>`).join("")}</div>`;
  l.innerHTML=(studioConfig[type]||[]).map((x,i)=>`<div class="builder-entry"><b>${x.icon||"•"} ${x.name||"(névtelen)"}</b><small>${Object.entries(x).map(([k,v])=>`${k}: ${v}`).join(" · ")}</small><button data-del="${type}" data-i="${i}">Törlés</button></div>`).join("");
 });
 if(qs("#contentJson"))qs("#contentJson").value=JSON.stringify(studioConfig,null,2);
 qsa("[data-del]").forEach(b=>b.onclick=async()=>{studioConfig[b.dataset.del].splice(+b.dataset.i,1);await saveConfigV8()});
}
async function saveConfigV8(){await sa("/api/admin/content-config",{method:"POST",body:JSON.stringify({config:studioConfig})});renderBuildersV8()}
qsa("[data-add]").forEach(btn=>btn.onclick=async()=>{
 let type=btn.dataset.add,base=builderBase[type],o={},wrap=qs("#"+base+"Builder");
 if(!wrap)return alert("A szerkesztő mezői nem töltődtek be. Frissítsd az oldalt.");
 wrap.querySelectorAll("[data-field]").forEach(i=>o[i.dataset.field]=i.type==="number"?Number(i.value||0):i.value.trim());
 if(!o.name)return alert("Adj nevet!");
 if(!o.id)o.id=base+"_"+Date.now();
 studioConfig[type]=studioConfig[type]||[];
 studioConfig[type].push(o);
 await saveConfigV8();
 wrap.querySelectorAll("[data-field]").forEach(i=>i.value="");
 alert("✅ Létrehozva: "+o.name);
});
qs("#saveContentJson")?.addEventListener("click",async()=>{try{studioConfig=JSON.parse(qs("#contentJson").value);await saveConfigV8();alert("✅ Mentve")}catch(e){alert("❌ Hibás JSON")}});
loadStudioV8();


// V10 gameplay editor
const V10_GAMEPLAY_DEFAULTS={
 basePlayerHp:180,
 hpPerLevel:12,
 defenseEffectPct:1.15,
 monsterDamageMult:1,
 bossDamageMult:1.65,
 bossRegenPct:0.40,
 mobRegenPct:0,
 playerRegenPct:1.2,
 playerAttackSec:1,
 enemyAttackSec:1.35,
 respawnSec:6,
 respawnHpPct:100,
 waveKills:10,
 bossHpGrowthPct:18,
 bossRewardMult:1,
 mobDamageHpPct:2.1
};

function v10GameplayCfg(){
 studioConfig.gameplay={...V10_GAMEPLAY_DEFAULTS,...(studioConfig.gameplay||{})};
 return studioConfig.gameplay;
}
function fillV10Gameplay(){
 const g=v10GameplayCfg();
 const map={
  cfgBasePlayerHp:"basePlayerHp",cfgHpPerLevel:"hpPerLevel",cfgDefenseEffectPct:"defenseEffectPct",
  cfgMonsterDamageMult:"monsterDamageMult",cfgBossDamageMult:"bossDamageMult",
  cfgBossRegenPct:"bossRegenPct",cfgMobRegenPct:"mobRegenPct",cfgPlayerRegenPct:"playerRegenPct",
  cfgPlayerAttackSec:"playerAttackSec",cfgEnemyAttackSec:"enemyAttackSec",
  cfgRespawnSec:"respawnSec",cfgRespawnHpPct:"respawnHpPct",cfgWaveKills:"waveKills",
  cfgBossHpGrowthPct:"bossHpGrowthPct",cfgBossRewardMult:"bossRewardMult",cfgMobDamageHpPct:"mobDamageHpPct"
 };
 Object.entries(map).forEach(([id,key])=>{const e=qs("#"+id);if(e)e.value=g[key]});
}
qs("#saveGameplayConfig")?.addEventListener("click",async()=>{
 try{
  const g=v10GameplayCfg();
  const map={
   cfgBasePlayerHp:"basePlayerHp",cfgHpPerLevel:"hpPerLevel",cfgDefenseEffectPct:"defenseEffectPct",
   cfgMonsterDamageMult:"monsterDamageMult",cfgBossDamageMult:"bossDamageMult",
   cfgBossRegenPct:"bossRegenPct",cfgMobRegenPct:"mobRegenPct",cfgPlayerRegenPct:"playerRegenPct",
   cfgPlayerAttackSec:"playerAttackSec",cfgEnemyAttackSec:"enemyAttackSec",
   cfgRespawnSec:"respawnSec",cfgRespawnHpPct:"respawnHpPct",cfgWaveKills:"waveKills",
   cfgBossHpGrowthPct:"bossHpGrowthPct",cfgBossRewardMult:"bossRewardMult",cfgMobDamageHpPct:"mobDamageHpPct"
  };
  Object.entries(map).forEach(([id,key])=>g[key]=Number(qs("#"+id)?.value||0));
  studioConfig.gameplay=g;
  await saveConfigV8();
  fillV10Gameplay();
  alert("✅ Játékmenet elmentve.");
 }catch(e){alert("❌ "+e.message)}
});
setTimeout(fillV10Gameplay,1000);


// ================= V11 ADMIN SOCIAL / SHOP =================
function fillV11PlayerMeta(){
 const p=curSP();if(!p)return;
 if(qs("#admPlayerName"))qs("#admPlayerName").value=p.player_name||p.username||"";
 const b=qs("#toggleLeaderboard");if(b)b.textContent=p.leaderboard_hidden?"🏆 Vissza a ranglistára":"🏆 Ranglistáról elrejtés";
}
const oldFillSP=fillSP;
fillSP=function(){oldFillSP();fillV11PlayerMeta()};
qs("#savePlayerProfile")?.addEventListener("click",async()=>{
 const p=curSP();if(!p)return;
 try{await sa(`/api/admin/player/${p.id}/profile`,{method:"POST",body:JSON.stringify({player_name:qs("#admPlayerName").value})});p.player_name=qs("#admPlayerName").value;alert("✅ Játékosnév mentve.")}catch(e){alert("❌ "+e.message)}
});
qs("#toggleLeaderboard")?.addEventListener("click",async()=>{
 const p=curSP();if(!p)return;
 const hidden=!Boolean(p.leaderboard_hidden);
 try{await sa(`/api/admin/player/${p.id}/leaderboard`,{method:"POST",body:JSON.stringify({hidden})});p.leaderboard_hidden=hidden;fillV11PlayerMeta();alert(hidden?"✅ Játékos elrejtve a ranglistáról.":"✅ Játékos újra látszik a ranglistán.")}catch(e){alert("❌ "+e.message)}
});

function fillPvpAdmin(){
 const p={minLevel:20,rewardGold:500,cooldownSec:10,ratingChange:18,...(studioConfig.pvp||{})};
 [["#cfgPvpMinLevel","minLevel"],["#cfgPvpRewardGold","rewardGold"],["#cfgPvpCooldown","cooldownSec"],["#cfgPvpRating","ratingChange"]].forEach(([id,k])=>{if(qs(id))qs(id).value=p[k]});
}
qs("#savePvpConfig")?.addEventListener("click",async()=>{
 studioConfig.pvp={minLevel:num("#cfgPvpMinLevel"),rewardGold:num("#cfgPvpRewardGold"),cooldownSec:num("#cfgPvpCooldown"),ratingChange:num("#cfgPvpRating")};
 await saveConfigV8();fillPvpAdmin();alert("✅ PvP beállítások mentve.");
});

function renderShopAdmin(){
 studioConfig.store={discord:"nervos11",products:[],...(studioConfig.store||{})};
 qs("#shopProductList").innerHTML=(studioConfig.store.products||[]).map((p,i)=>`<div class="builder-entry"><b>${p.icon||"💰"} ${p.name}</b><small>${p.priceText||""} · ${p.description||""}</small><button data-shop-del="${i}">Törlés</button></div>`).join("");
 qsa("[data-shop-del]").forEach(b=>b.onclick=async()=>{studioConfig.store.products.splice(Number(b.dataset.shopDel),1);await saveConfigV8();renderShopAdmin()});
}
qs("#addShopProduct")?.addEventListener("click",async()=>{
 const p={id:qs("#shopProductId").value.trim()||"product_"+Date.now(),name:qs("#shopProductName").value.trim(),icon:qs("#shopProductIcon").value.trim()||"💰",priceText:qs("#shopProductPrice").value.trim(),description:qs("#shopProductDesc").value.trim()};
 if(!p.name)return alert("Adj terméknevet!");
 studioConfig.store={discord:"nervos11",products:[],...(studioConfig.store||{})};studioConfig.store.products.push(p);await saveConfigV8();renderShopAdmin();alert("✅ Csomag létrehozva.");
});
async function loadShopRequests(){
 try{
  const d=await sa("/api/admin/shop-requests");
  qs("#shopRequests").innerHTML=d.rows.map(r=>`<div class="builder-entry"><b>${r.player_name} · ${r.product_name}</b><small>${r.price_text||""} · ${new Date(r.created_at).toLocaleString("hu-HU")} · státusz: ${r.status}</small><select data-request-status="${r.id}"><option>new</option><option>contacted</option><option>paid</option><option>delivered</option><option>cancelled</option></select></div>`).join("")||"<small>Nincs igény.</small>";
  qsa("[data-request-status]").forEach(s=>{s.value=d.rows.find(x=>String(x.id)===s.dataset.requestStatus)?.status||"new";s.onchange=()=>sa(`/api/admin/shop-request/${s.dataset.requestStatus}/status`,{method:"POST",body:JSON.stringify({status:s.value})})});
 }catch(e){console.error(e)}
}
qs("#refreshShopRequests")?.addEventListener("click",loadShopRequests);
setTimeout(()=>{fillPvpAdmin();renderShopAdmin();loadShopRequests();fillV11PlayerMeta()},1300);


// ================= V11.2 JÁTÉKOS TÖRLÉS =================
async function deletePlayerV112(id,name){
 if(!id)return;
 const p=(typeof playersFull!=="undefined"?playersFull:[]).find(x=>Number(x.id)===Number(id));
 if(p?.role==="admin")return alert("Az adminfiók nem törölhető.");
 const shown=name||p?.player_name||p?.username||("ID "+id);
 if(!confirm(`⚠️ Biztosan VÉGLEG törlöd ezt a játékost?\n\n${shown}\n\nA fiók és a hozzá tartozó játékmentés is törlődik.`))return;
 if(!confirm(`UTOLSÓ MEGERŐSÍTÉS\n\n${shown} törlése nem vonható vissza. Folytatod?`))return;
 try{
   const d=await sa(`/api/admin/player/${id}`,{method:"DELETE"});
   alert("✅ "+(d.message||"Játékos törölve."));
   if(typeof selectedPlayerId!=="undefined" && Number(selectedPlayerId)===Number(id))selectedPlayerId=null;
   if(typeof loadPlayers==="function")await loadPlayers();
   else if(typeof loadPlayersFull==="function")await loadPlayersFull();
   setTimeout(enhancePlayerDeleteButtonsV112,100);
 }catch(e){alert("❌ "+e.message)}
}
function enhancePlayerDeleteButtonsV112(){
 const rows=qsa("#playersTable tbody tr, #playerTable tbody tr, .players-table tbody tr");
 const data=(typeof playersFull!=="undefined"?playersFull:[]);
 rows.forEach((tr,idx)=>{
   if(tr.querySelector(".delete-player-v112"))return;
   const txt=tr.textContent||"";
   const p=data.find(x=>txt.includes(x.player_name||x.username)) || data[idx];
   if(!p || p.role==="admin" || /OmiAdmin/i.test(txt))return;
   const td=document.createElement("td");
   const b=document.createElement("button");
   b.className="danger delete-player-v112";
   b.textContent="🗑️ Törlés";
   b.title="Játékos és teljes mentés törlése";
   b.onclick=(e)=>{e.stopPropagation();deletePlayerV112(p.id,p.player_name||p.username)};
   td.appendChild(b);tr.appendChild(td);
 });
 // Fallback for card/list based player rows
 qsa("[data-player-id]").forEach(el=>{
   if(el.querySelector(".delete-player-v112"))return;
   const id=Number(el.dataset.playerId),p=data.find(x=>Number(x.id)===id);
   if(!p||p.role==="admin")return;
   const b=document.createElement("button");b.className="danger delete-player-v112";b.textContent="🗑️ Törlés";
   b.onclick=(e)=>{e.stopPropagation();deletePlayerV112(id,p.player_name||p.username)};
   el.appendChild(b);
 });
}
document.addEventListener("click",e=>{
 if(e.target.closest("#refreshPlayers, #playersRefresh, [data-studio='players']"))setTimeout(enhancePlayerDeleteButtonsV112,250);
});
setInterval(enhancePlayerDeleteButtonsV112,1200);
