
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let selected=null;
async function api(url,opt={}){const r=await fetch(url,{headers:{"Content-Type":"application/json",...(opt.headers||{})},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Hiba");return d}
function toast(t){let e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1700)}
function fmt(n){return Math.floor(Number(n||0)).toLocaleString("hu-HU")}
async function ensureAdmin(){try{let d=await api("/api/me");if(d.user.role!=="admin")throw new Error("Nincs admin jogosultság.");loadPlayers()}catch(e){alert(e.message);location.href="/"}}
async function loadPlayers(){
 try{
  let d=await api("/api/admin/players");$("#playerCount").textContent=d.rows.filter(x=>x.role==="player").length;
  $("#players").innerHTML=`<div class="leader-row head admin-player-row"><span>ID</span><span>JÁTÉKOS</span><span>ERŐ</span><span>SZINT</span><span>KILL</span><span>MŰVELET</span></div>`+
  d.rows.map(r=>`<div class="leader-row admin-player-row" data-player="${r.id}" style="cursor:pointer"><span>#${r.id}</span><span class="leader-name">${r.player_name||r.username}${r.role==="admin"?" ⚙️":r.banned?" 🚫":""}</span><span>${fmt(r.power)}</span><span>Lv.${r.level}</span><span>${fmt(r.kills)}</span><span>${r.role==="admin"?"<small class=\"admin-protected\">VÉDETT</small>":`<button class="delete-player-direct" data-delete-player="${r.id}" data-delete-name="${String(r.player_name||r.username).replace(/"/g,"&quot;")}">🗑️ Törlés</button>`}</span></div>`).join("");
  $$("[data-player]").forEach(x=>x.onclick=e=>{if(e.target.closest("[data-delete-player]"))return;openPlayer(x.dataset.player)});
  $$("[data-delete-player]").forEach(b=>b.onclick=async e=>{
    e.stopPropagation();
    const id=b.dataset.deletePlayer,name=b.dataset.deleteName||("ID "+id);
    if(!confirm(`⚠️ Biztosan VÉGLEG törlöd ${name} játékost?\n\nA fiókja és teljes játékmentése törlődik.`))return;
    try{await api(`/api/admin/player/${id}`,{method:"DELETE"});toast("Játékos törölve.");await loadPlayers();if(typeof loadStudioV8==="function")await loadStudioV8()}
    catch(err){alert("❌ "+err.message)}
  });
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
async function loadAntiCheatV276(){
 try{
  const d=await api("/api/admin/anticheat-alerts"),rows=d.rows||[],unread=rows.filter(x=>x.status==="new").length;
  $("#antiCheatCountV276").textContent=unread;
  $("#antiCheatAlertsV276").innerHTML=rows.length?rows.map(x=>{const e=x.evidence||{};return `<article class="anticheat-alert-v276 ${x.status==="new"?"new":"read"}"><div class="anticheat-risk-v276"><b>${x.risk_level==="high"?"MAGAS":"GYANÚS"}</b><span>${Number(e.cps||0).toFixed(1)} katt/mp</span></div><div><h3>⚠️ ${x.player_name||x.username}</h3><p>${Number(e.samples||0)} kattintás · szabályosság ${Math.round(Number(e.regularity||0)*100)}% · azonos cél ${Math.round(Number(e.sameTargetRatio||0)*100)}%</p><small>${new Date(x.created_at).toLocaleString("hu-HU")} · Jelzés #${x.id}</small></div><div class="anticheat-actions-v276">${x.status==="new"?`<button data-anticheat-read="${x.id}">✓ Megnéztem</button>`:"<span>✓ Ellenőrizve</span>"}<button data-anticheat-player="${x.user_id}">👤 Játékos</button></div></article>`}).join(""):"<div class='anticheat-empty-v276'>✅ Nincs autoclicker-gyanús esemény.</div>";
  $$('[data-anticheat-read]').forEach(b=>b.onclick=async()=>{await api(`/api/admin/anticheat-alert/${b.dataset.anticheatRead}/read`,{method:"POST",body:"{}"});loadAntiCheatV276()});
  $$('[data-anticheat-player]').forEach(b=>b.onclick=()=>openPlayer(b.dataset.anticheatPlayer));
 }catch(e){toast(e.message)}
}
$$("[data-a]").forEach(b=>b.onclick=()=>{$$("[data-a]").forEach(x=>x.classList.remove("active"));$$("[id^='a-']").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#a-"+b.dataset.a).classList.add("active");if(b.dataset.a==="logs")loadLogs();if(b.dataset.a==="anticheat")loadAntiCheatV276()});
$("#refreshPlayers").onclick=loadPlayers;
$("#refreshAntiCheatV276").onclick=loadAntiCheatV276;
$("#adminLogout").onclick=async()=>{try{await api("/api/logout",{method:"POST",body:"{}"})}catch{}location.href="/"};
ensureAdmin();setTimeout(loadAntiCheatV276,500);setInterval(loadAntiCheatV276,20000);


// V8 ADMIN STUDIO
let studioPlayers=[],studioConfig={bosses:[],items:[],pets:[],auras:[],zones:[]};
const qs=s=>document.querySelector(s),qsa=s=>[...document.querySelectorAll(s)];
async function sa(url,opt={}){let r=await fetch(url,{headers:{"Content-Type":"application/json"},...opt}),d=await r.json();if(!r.ok)throw Error(d.error||"Hiba");return d}
const num=id=>Number(qs(id)?.value||0);
async function loadStudioV8(){try{let p=await sa("/api/admin/players-full");studioPlayers=p.players||[];qs("#studioPlayer").innerHTML=studioPlayers.map(x=>`<option value="${x.id}">${x.username}</option>`).join("");fillSP();let c=await sa("/api/content-config");studioConfig={bosses:[],items:[],pets:[],auras:[],zones:[],updates:[],...(c.config||{})};renderBuildersV8()}catch(e){console.error(e)}}
function curSP(){return studioPlayers.find(x=>String(x.id)===qs("#studioPlayer").value)}
function fillSP(){let p=curSP();if(!p)return;let s=p.save_data||{},v={admLevel:s.level||1,admParagon:s.paragonLevel||0,admPrestige:s.prestigeLevel||0,admGold:s.gold||0,admGems:s.gems||0,admOre:s.ore||0,admSoul:s.soul||0,admTickets:s.tickets||0,admSkillPoints:s.skillPoints||0,admParagonPoints:s.paragonPoints||0,admAuraTokens:s.auraTokens||0,admPrestigeTokens:s.prestigeTokens||0,admWave:s.wave||1,admKills:s.kills||0,admLuck:s.base?.luck||1};Object.entries(v).forEach(([k,x])=>qs("#"+k).value=x);qs("#playerSaveJson").value=JSON.stringify(s,null,2)}
qs("#studioPlayer")?.addEventListener("change",fillSP);
qs("#savePlayerStats")?.addEventListener("click",async()=>{let p=curSP(),s=structuredClone(p.save_data||{});Object.assign(s,{level:num("#admLevel"),paragonLevel:num("#admParagon"),prestigeLevel:Math.min(100,num("#admPrestige")),gold:num("#admGold"),gems:num("#admGems"),ore:num("#admOre"),soul:num("#admSoul"),tickets:num("#admTickets"),skillPoints:num("#admSkillPoints"),paragonPoints:num("#admParagonPoints"),auraTokens:num("#admAuraTokens"),prestigeTokens:num("#admPrestigeTokens"),wave:num("#admWave"),kills:num("#admKills")});s.base={...(s.base||{}),luck:num("#admLuck")};s.speed10Unlocked=Boolean(qs("#admSpeed10Unlocked")?.checked);if(!s.speed10Unlocked&&Number(s.combatSpeed)===10)s.combatSpeed=3;await sa("/api/admin/player-save",{method:"POST",body:JSON.stringify({id:p.id,save:s})});p.save_data=s;fillSP();alert("✅ Mentve")});
qs("#savePlayerJson")?.addEventListener("click",async()=>{try{let p=curSP(),s=JSON.parse(qs("#playerSaveJson").value);await sa("/api/admin/player-save",{method:"POST",body:JSON.stringify({id:p.id,save:s})});p.save_data=s;fillSP();alert("✅ Teljes mentés frissítve")}catch(e){alert("❌ "+e.message)}});
qsa("[data-studio]").forEach(b=>b.onclick=()=>{qsa(".studio-page").forEach(x=>x.classList.remove("active"));qs("#studio-"+b.dataset.studio).classList.add("active")});
const schemas={
 bosses:[["id","ID"],["name","Név"],["icon","Ikon"],["hp","HP","number"],["damage","Sebzés","number"],["xp","XP jutalom","number"],["gold","Arany jutalom","number"],["gems","Gyémánt jutalom (db)","number"],["gemDropChance","Gyémánt drop esély %","number"],["regenPct","HP regen %/mp","number"],["dropChance","Tárgy drop %","number"],["minLevel","Minimum szint","number"],["minZone","Minimum terület index","number"]],
 items:[["id","ID"],["name","Név"],["icon","Ikon"],["slot","Slot: weapon/armor/helmet/gloves/boots/ring"],["rarity","normal/rare/epic/mythic/legendary"],["atk","Támadás","number"],["def","Védelem","number"],["critBonus","Krit bónusz %","number"],["dropBonus","Drop bónusz %","number"],["minZone","Minimum terület index","number"]],
 pets:[["id","ID"],["name","Név"],["icon","Ikon"],["rarity","Ritkaság"],["bonus","damage/gold/drop/crit/all"],["value","Bónusz %","number"]],
 auras:[["id","ID"],["name","Név"],["className","CSS class"],["prestigeNeed","Prestige kell","number"],["cost","Aura token ár","number"]],
 zones:[["id","ID"],["name","Név"],["icon","Ikon"],["enemy","Szörny neve"],["hp","Kezdő szörny HP","number"],["maxHp","Terület maximum mob HP","number"],["gold","Arany / kill","number"],["xp","XP / kill","number"],["need","Ajánlott erő","number"],["dropChance","Tárgy drop %","number"]]
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
 fillEconomyAdmin();
 fillDefaultBossGems();
 fillZoneHpBalance();
 renderUpdatesAdminV242();
 if(typeof fillNpcShopAdminV246==="function")fillNpcShopAdminV246();
 if(typeof fillCasinoAdminV247==="function")fillCasinoAdminV247();
}
async function saveConfigV8(){await sa("/api/admin/content-config",{method:"POST",body:JSON.stringify({config:studioConfig})});renderBuildersV8()}
qsa("[data-add]").forEach(btn=>btn.onclick=async()=>{
 let type=btn.dataset.add,base=builderBase[type],o={},wrap=qs("#"+base+"Builder");
 if(!wrap)return alert("A szerkesztő mezői nem töltődtek be. Frissítsd az oldalt.");
 wrap.querySelectorAll("[data-field]").forEach(i=>o[i.dataset.field]=i.type==="number"?Number(i.value||0):i.value.trim());
 if(!o.name)return alert("Adj nevet!");
 if(!o.id)o.id=base+"_"+Date.now();
 studioConfig[type]=studioConfig[type]||[];
 if(type==="zones"){
  const last=studioConfig.zones.at(-1)||{hp:190000,maxHp:300000,gold:210,xp:4500,need:5000,dropChance:36};
  o.icon=o.icon||"🗺️";o.enemy=o.enemy||o.name;o.hp=o.hp>0?o.hp:Math.floor(Number(last.hp||190000)*1.65);o.maxHp=o.maxHp>0?o.maxHp:Math.floor(Number(last.maxHp||last.hp||300000)*1.65);o.gold=o.gold>0?o.gold:Math.floor(Number(last.gold||210)*1.4);o.xp=o.xp>0?o.xp:Math.floor(Number(last.xp||4500)*1.55);o.need=o.need>0?o.need:Math.floor(Number(last.need||5000)*1.6);o.dropChance=o.dropChance>0?o.dropChance:Math.min(60,Number(last.dropChance||36)+3);
 }
 if(type==="bosses"){
  const last=studioConfig.bosses.at(-1)||{hp:250000,damage:800,xp:6000,gold:300,gems:1,gemDropChance:20,regenPct:.2,dropChance:40,minLevel:50,minZone:7};
  o.icon=o.icon||"👹";o.hp=o.hp>0?o.hp:Math.floor(Number(last.hp||250000)*1.65);o.damage=o.damage>0?o.damage:Math.floor(Number(last.damage||800)*1.35);o.xp=o.xp>0?o.xp:Math.floor(Number(last.xp||6000)*1.5);o.gold=o.gold>0?o.gold:Math.floor(Number(last.gold||300)*1.35);o.gems=o.gems>0?o.gems:Math.max(1,Number(last.gems||1));o.gemDropChance=o.gemDropChance>0?o.gemDropChance:Number(last.gemDropChance||20);o.regenPct=o.regenPct>0?o.regenPct:Number(last.regenPct||.2);o.dropChance=o.dropChance>0?o.dropChance:Math.min(60,Number(last.dropChance||40)+2);o.minLevel=o.minLevel>0?o.minLevel:Math.ceil(Number(last.minLevel||50)*1.25);o.minZone=o.minZone>0?o.minZone:Number(last.minZone||7)+1;
 }
 studioConfig[type].push(o);
 await saveConfigV8();
 wrap.querySelectorAll("[data-field]").forEach(i=>i.value="");
 alert("✅ Létrehozva: "+o.name);
});
qs("#saveContentJson")?.addEventListener("click",async()=>{try{studioConfig=JSON.parse(qs("#contentJson").value);await saveConfigV8();alert("✅ Mentve")}catch(e){alert("❌ Hibás JSON")}});
loadStudioV8();

// V22.42 admin-controlled update center
function escUpdateV242(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function resetUpdateEditorV242(){
 ["#updateVersion","#updateTitle","#updateSummary","#updateChanges","#updateEditIndex"].forEach(s=>{if(qs(s))qs(s).value=""});
 if(qs("#updateDate"))qs("#updateDate").value=new Date().toISOString().slice(0,10);
 if(qs("#updateVisible"))qs("#updateVisible").checked=false;
}
function renderUpdatesAdminV242(){
 const box=qs("#adminUpdatesList");if(!box)return;
 studioConfig.updates=Array.isArray(studioConfig.updates)?studioConfig.updates:[];
 box.innerHTML=studioConfig.updates.length?studioConfig.updates.map((u,i)=>`<div class="builder-entry update-admin-entry-v242 ${u.visible?"is-visible":"is-hidden"}"><div><b>${escUpdateV242(u.version||"Frissítés")} · ${escUpdateV242(u.title||"Névtelen")}</b><small>${escUpdateV242(u.date||"")} · ${u.visible?"🟢 LÁTHATÓ":"⚫ REJTVE"}</small></div><div class="update-admin-actions-v242"><button data-update-edit="${i}">✏️ Szerkesztés</button><button data-update-toggle="${i}">${u.visible?"🙈 Elrejtés":"👁️ Közzététel"}</button><button class="danger" data-update-delete="${i}">🗑️ Törlés</button></div></div>`).join(""):'<p class="muted">Még nincs frissítési bejegyzés.</p>';
 box.querySelectorAll("[data-update-edit]").forEach(b=>b.onclick=()=>{const i=+b.dataset.updateEdit,u=studioConfig.updates[i];qs("#updateVersion").value=u.version||"";qs("#updateTitle").value=u.title||"";qs("#updateDate").value=u.date||"";qs("#updateSummary").value=u.summary||"";qs("#updateChanges").value=(u.changes||[]).join("\n");qs("#updateVisible").checked=!!u.visible;qs("#updateEditIndex").value=i;scrollTo({top:qs("#studio-updates").offsetTop-20,behavior:"smooth"})});
 box.querySelectorAll("[data-update-toggle]").forEach(b=>b.onclick=async()=>{const u=studioConfig.updates[+b.dataset.updateToggle];u.visible=!u.visible;await saveConfigV8()});
 box.querySelectorAll("[data-update-delete]").forEach(b=>b.onclick=async()=>{if(!confirm("Biztosan törlöd ezt a frissítést?"))return;studioConfig.updates.splice(+b.dataset.updateDelete,1);await saveConfigV8()});
}
qs("#saveUpdateEntry")?.addEventListener("click",async()=>{
 const version=qs("#updateVersion").value.trim(),title=qs("#updateTitle").value.trim();if(!version||!title)return alert("A verzió és a cím kötelező.");
 const i=qs("#updateEditIndex").value,old=i!==""?studioConfig.updates[+i]:null;
 const entry={id:old?.id||("update_"+Date.now()),version,title,date:qs("#updateDate").value||new Date().toISOString().slice(0,10),summary:qs("#updateSummary").value.trim(),changes:qs("#updateChanges").value.split("\n").map(x=>x.trim()).filter(Boolean),visible:qs("#updateVisible").checked,createdAt:old?.createdAt||new Date().toISOString()};
 if(i!=="")studioConfig.updates[+i]=entry;else studioConfig.updates.unshift(entry);await saveConfigV8();resetUpdateEditorV242();alert("✅ Frissítés mentve.");
});
qs("#cancelUpdateEdit")?.addEventListener("click",resetUpdateEditorV242);


// V10 gameplay editor
const V10_GAMEPLAY_DEFAULTS={
 basePlayerHp:100,
 hpPerLevel:5,
 defenseEffectPct:.8,
 monsterDamageMult:1,
 bossDamageMult:1.45,
 bossRegenPct:0.20,
 mobRegenPct:0,
 playerRegenPct:1.2,
 playerAttackSec:1,
 enemyAttackSec:1.35,
 respawnSec:5,
 respawnHpPct:100,
 waveKills:8,
 bossHpGrowthPct:8,
 bossRewardMult:1,
 mobDamageHpPct:2.1,
 bossGemAmount:1,
 bossGemDropChance:100,
 defaultBossFixedGold:120,
 goldBonusCapPct:100,
 mobTargetHits:2,
 zoneHpMultipliers:[100,100,100,100,100,100,100,100],
 zoneFixedGold:[5,9,16,28,48,80,130,210]
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
  cfgBossHpGrowthPct:"bossHpGrowthPct",cfgMobDamageHpPct:"mobDamageHpPct",cfgGoldBonusCapPct:"goldBonusCapPct"
 };
 Object.entries(map).forEach(([id,key])=>{const e=qs("#"+id);if(e)e.value=g[key]});
}

function fillDefaultBossGems(){
 const g=v10GameplayCfg();
 if(qs("#cfgDefaultBossGems"))qs("#cfgDefaultBossGems").value=g.bossGemAmount;
 if(qs("#cfgDefaultBossGemChance"))qs("#cfgDefaultBossGemChance").value=g.bossGemDropChance;
 if(qs("#cfgDefaultBossFixedGold"))qs("#cfgDefaultBossFixedGold").value=g.defaultBossFixedGold;
}
const V226_ZONE_NAMES=["Zöld mező","Sötét erdő","Elhagyott bánya","Démon torony","Sárkány-völgy","Mennydörgés fennsík","Üresség","Isteni kapu"];
function v226ZoneNames(){return [...V226_ZONE_NAMES,...(studioConfig.zones||[]).map(z=>z.name||"Egyedi terület")]}
function fillZoneHpBalance(){
 const g=v10GameplayCfg(),multipliers=Array.isArray(g.zoneHpMultipliers)?g.zoneHpMultipliers:[],fixedGold=Array.isArray(g.zoneFixedGold)?g.zoneFixedGold:V10_GAMEPLAY_DEFAULTS.zoneFixedGold;
 if(qs("#cfgMobTargetHits"))qs("#cfgMobTargetHits").value=Number(g.mobTargetHits||2);
 const root=qs("#zoneHpBalanceEditor");if(root)root.innerHTML=v226ZoneNames().map((name,i)=>`<article class="zone-balance-card"><h4>🗺️ ${name}</h4><label>❤️ Mob HP szorzó %<input data-zone-hp-mult="${i}" type="number" min="10" max="1000" step="1" value="${Number(multipliers[i]??100)}"></label><label>💰 Fix arany / mob<input data-zone-fixed-gold="${i}" type="number" min="0" step="1" value="${Number(fixedGold[i]??studioConfig.zones?.[i-8]?.gold??0)}"></label><small>A normál mob mindig pontosan ezt adja; az aranydropp-bónusz csak a bossokra hat.</small></article>`).join("");
}
qs("#saveZoneHpBalance")?.addEventListener("click",async()=>{
 const g=v10GameplayCfg();g.mobTargetHits=Math.max(1,Number(qs("#cfgMobTargetHits")?.value||2));
 g.zoneHpMultipliers=v226ZoneNames().map((_,i)=>Math.max(10,Math.min(1000,Number(qs(`[data-zone-hp-mult="${i}"]`)?.value||100))));
 g.zoneFixedGold=v226ZoneNames().map((_,i)=>Math.max(0,Math.floor(Number(qs(`[data-zone-fixed-gold="${i}"]`)?.value??0))));
 studioConfig.gameplay=g;await saveConfigV8();fillZoneHpBalance();alert("✅ A területi HP- és aranyszorzók elmentve.");
});
qs("#saveDefaultBossGems")?.addEventListener("click",async()=>{
 const g=v10GameplayCfg();
 g.bossGemAmount=Math.max(0,Math.floor(num("#cfgDefaultBossGems")));
 g.bossGemDropChance=Math.max(0,Math.min(100,Number(qs("#cfgDefaultBossGemChance")?.value||0)));
 g.defaultBossFixedGold=Math.max(0,Math.floor(Number(qs("#cfgDefaultBossFixedGold")?.value||0)));
 studioConfig.gameplay=g;
 await saveConfigV8();fillDefaultBossGems();alert("✅ A boss alap aranya és gyémántjutalma elmentve.");
});
qs("#saveGameplayConfig")?.addEventListener("click",async()=>{
 try{
  const g=v10GameplayCfg();
  const map={
   cfgBasePlayerHp:"basePlayerHp",cfgHpPerLevel:"hpPerLevel",cfgDefenseEffectPct:"defenseEffectPct",
   cfgMonsterDamageMult:"monsterDamageMult",cfgBossDamageMult:"bossDamageMult",
   cfgBossRegenPct:"bossRegenPct",cfgMobRegenPct:"mobRegenPct",cfgPlayerRegenPct:"playerRegenPct",
   cfgPlayerAttackSec:"playerAttackSec",cfgEnemyAttackSec:"enemyAttackSec",
   cfgRespawnSec:"respawnSec",cfgRespawnHpPct:"respawnHpPct",cfgWaveKills:"waveKills",
   cfgBossHpGrowthPct:"bossHpGrowthPct",cfgMobDamageHpPct:"mobDamageHpPct",cfgGoldBonusCapPct:"goldBonusCapPct"
  };
  Object.entries(map).forEach(([id,key])=>g[key]=Number(qs("#"+id)?.value||0));
  studioConfig.gameplay=g;
  await saveConfigV8();
  fillV10Gameplay();
  alert("✅ Játékmenet elmentve.");
 }catch(e){alert("❌ "+e.message)}
});
setTimeout(()=>{fillV10Gameplay();fillDefaultBossGems();fillZoneHpBalance()},1000);


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
 const p={minLevel:20,rewardGold:500,cooldownSec:10,ratingWin:18,ratingLoss:20,...(studioConfig.pvp||{})};
 [["#cfgPvpMinLevel","minLevel"],["#cfgPvpRewardGold","rewardGold"],["#cfgPvpCooldown","cooldownSec"],["#cfgPvpRatingWin","ratingWin"],["#cfgPvpRatingLoss","ratingLoss"]].forEach(([id,k])=>{if(qs(id))qs(id).value=p[k]});
}
qs("#savePvpConfig")?.addEventListener("click",async()=>{
 studioConfig.pvp={minLevel:num("#cfgPvpMinLevel"),rewardGold:num("#cfgPvpRewardGold"),cooldownSec:num("#cfgPvpCooldown"),ratingWin:num("#cfgPvpRatingWin"),ratingLoss:num("#cfgPvpRatingLoss")};
 await saveConfigV8();fillPvpAdmin();alert("✅ PvP beállítások mentve.");
});

function renderShopAdmin(){
 studioConfig.store={discord:"nervos11",products:[],...(studioConfig.store||{})};
 const defaults=[
  {id:"premium_speed_10x",name:"10× Harci / Wave Sebesség",icon:"⚡",priceText:"3 €",description:"Prémium 10× farmsebesség",visible:true},
  {id:"auto_paragon_10_eur",name:"Auto Paragon szintelő",icon:"🌟",priceText:"10 €",description:"Automatikus Paragon szintlépés",visible:true},
  {id:"dungeon_batch_10_eur",name:"Dungeon 2× / 3× / 5× futam",icon:"🏰",priceText:"10 €",description:"Egyszerre több dungeon külön jutalom- és droppróbával",visible:true}
 ];
 defaults.forEach(d=>{if(!studioConfig.store.products.some(p=>p.id===d.id))studioConfig.store.products.unshift(d)});
 qs("#shopProductList").innerHTML=(studioConfig.store.products||[]).map((p,i)=>`<div class="builder-entry"><b>${p.icon||"💰"} ${p.name}</b><small>${p.priceText||""} · ${p.visible===false?"REJTVE":"LÁTHATÓ"} · ${p.description||""}</small><button data-shop-edit="${i}">Szerkesztés</button><button data-shop-del="${i}">Törlés</button></div>`).join("");
 qsa("[data-shop-edit]").forEach(b=>b.onclick=()=>{const i=Number(b.dataset.shopEdit),p=studioConfig.store.products[i];qs("#shopProductEditIndex").value=i;qs("#shopProductId").value=p.id||"";qs("#shopProductName").value=p.name||"";qs("#shopProductIcon").value=p.icon||"";qs("#shopProductPrice").value=p.priceText||"";qs("#shopProductDesc").value=p.description||"";qs("#shopProductVisible").checked=p.visible!==false;qs("#addShopProduct").textContent="💾 Módosítás mentése"});
 qsa("[data-shop-del]").forEach(b=>b.onclick=async()=>{studioConfig.store.products.splice(Number(b.dataset.shopDel),1);await saveConfigV8();renderShopAdmin()});
}
qs("#addShopProduct")?.addEventListener("click",async()=>{
 const p={id:qs("#shopProductId").value.trim()||"product_"+Date.now(),name:qs("#shopProductName").value.trim(),icon:qs("#shopProductIcon").value.trim()||"💰",priceText:qs("#shopProductPrice").value.trim(),description:qs("#shopProductDesc").value.trim(),visible:qs("#shopProductVisible").checked};
 if(!p.name)return alert("Adj terméknevet!");
 studioConfig.store={discord:"nervos11",products:[],...(studioConfig.store||{})};const edit=qs("#shopProductEditIndex").value;if(edit!=="")studioConfig.store.products[Number(edit)]=p;else studioConfig.store.products.push(p);await saveConfigV8();resetShopEditor();renderShopAdmin();alert("✅ Csomag elmentve és a Feltöltés oldal frissítve.");
});
function resetShopEditor(){["#shopProductId","#shopProductName","#shopProductIcon","#shopProductPrice","#shopProductDesc","#shopProductEditIndex"].forEach(id=>{if(qs(id))qs(id).value=""});if(qs("#shopProductVisible"))qs("#shopProductVisible").checked=true;if(qs("#addShopProduct"))qs("#addShopProduct").textContent="💾 Csomag mentése"}
qs("#cancelShopProductEdit")?.addEventListener("click",resetShopEditor);
async function loadShopRequests(){
 try{
  const d=await sa("/api/admin/shop-requests");
  qs("#shopRequests").innerHTML=d.rows.map(r=>`<div class="builder-entry"><b>${r.player_name} · ${r.product_name}</b><small>${r.price_text||""} · ${new Date(r.created_at).toLocaleString("hu-HU")} · státusz: ${r.status}</small><select data-request-status="${r.id}"><option>new</option><option>contacted</option><option>paid</option><option>delivered</option><option>cancelled</option></select></div>`).join("")||"<small>Nincs igény.</small>";
  qsa("[data-request-status]").forEach(s=>{s.value=d.rows.find(x=>String(x.id)===s.dataset.requestStatus)?.status||"new";s.onchange=()=>sa(`/api/admin/shop-request/${s.dataset.requestStatus}/status`,{method:"POST",body:JSON.stringify({status:s.value})})});
 }catch(e){console.error(e)}
}
qs("#refreshShopRequests")?.addEventListener("click",loadShopRequests);
setTimeout(()=>{fillPvpAdmin();renderShopAdmin();loadShopRequests();fillV11PlayerMeta()},1300);

function fillNpcShopAdminV246(){
 const n={refreshHours:6,gearOffers:4,rarePetChancePct:8,arrowAmount:1000,arrowDamagePct:15,arrowGoldCost:1200,gearGoldBase:1800,gearOreBase:8,petGemBase:80,...(studioConfig.npcShop||{})},c={gold:5000000,gems:50000,ore:100000,soul:50000,...(studioConfig.economyCaps||{})};
 [["#cfgNpcRefreshHours",n.refreshHours],["#cfgNpcGearOffers",n.gearOffers],["#cfgNpcRarePetChance",n.rarePetChancePct],["#cfgNpcArrowAmount",n.arrowAmount],["#cfgNpcArrowDamage",n.arrowDamagePct],["#cfgNpcArrowGold",n.arrowGoldCost],["#cfgNpcGearGold",n.gearGoldBase],["#cfgNpcGearOre",n.gearOreBase],["#cfgNpcPetGems",n.petGemBase],["#cfgWalletGoldCap",c.gold],["#cfgWalletGemsCap",c.gems],["#cfgWalletOreCap",c.ore],["#cfgWalletSoulCap",c.soul]].forEach(([id,v])=>{if(qs(id))qs(id).value=v});
}
qs("#saveNpcShopConfig")?.addEventListener("click",async()=>{
 studioConfig.npcShop={refreshHours:num("#cfgNpcRefreshHours"),gearOffers:num("#cfgNpcGearOffers"),rarePetChancePct:num("#cfgNpcRarePetChance"),arrowAmount:num("#cfgNpcArrowAmount"),arrowDamagePct:num("#cfgNpcArrowDamage"),arrowGoldCost:num("#cfgNpcArrowGold"),gearGoldBase:num("#cfgNpcGearGold"),gearOreBase:num("#cfgNpcGearOre"),petGemBase:num("#cfgNpcPetGems"),configVersion:Date.now()};
 studioConfig.economyCaps={gold:num("#cfgWalletGoldCap"),gems:num("#cfgWalletGemsCap"),ore:num("#cfgWalletOreCap"),soul:num("#cfgWalletSoulCap")};
 await saveConfigV8();fillNpcShopAdminV246();alert("✅ NPC bolt és pénztárcaplafonok mentve.");
});
setTimeout(fillNpcShopAdminV246,1400);

function fillCasinoAdminV247(){const c={minBet:{gold:100,gems:1,ore:5},maxBet:{gold:25000,gems:100,ore:500},games:{coin:{chance:47,mult:1.9},skull:{chance:28,mult:3.2,freeSpinChance:5,freeSpinAmount:1},dragon:{chance:8,mult:10,freeSpinChance:3,freeSpinAmount:2}},...(studioConfig.casino||{})};c.minBet={gold:100,gems:1,ore:5,...(c.minBet||{})};c.maxBet={gold:25000,gems:100,ore:500,...(c.maxBet||{})};c.games={coin:{chance:47,mult:1.9,...(c.games?.coin||{})},skull:{chance:28,mult:3.2,freeSpinChance:5,freeSpinAmount:1,...(c.games?.skull||{})},dragon:{chance:8,mult:10,freeSpinChance:3,freeSpinAmount:2,...(c.games?.dragon||{})}};[["#cfgCasinoMinGold",c.minBet.gold],["#cfgCasinoMaxGold",c.maxBet.gold],["#cfgCasinoMinGems",c.minBet.gems],["#cfgCasinoMaxGems",c.maxBet.gems],["#cfgCasinoMinOre",c.minBet.ore],["#cfgCasinoMaxOre",c.maxBet.ore],["#cfgCasinoCoinChance",c.games.coin.chance],["#cfgCasinoCoinMult",c.games.coin.mult],["#cfgCasinoSkullChance",c.games.skull.chance],["#cfgCasinoSkullMult",c.games.skull.mult],["#cfgCasinoSkullFreeChance",c.games.skull.freeSpinChance],["#cfgCasinoSkullFreeAmount",c.games.skull.freeSpinAmount],["#cfgCasinoDragonChance",c.games.dragon.chance],["#cfgCasinoDragonMult",c.games.dragon.mult],["#cfgCasinoDragonFreeChance",c.games.dragon.freeSpinChance],["#cfgCasinoDragonFreeAmount",c.games.dragon.freeSpinAmount]].forEach(([id,v])=>{if(qs(id))qs(id).value=v})}
qs("#saveCasinoConfig")?.addEventListener("click",async()=>{studioConfig.casino={minBet:{gold:num("#cfgCasinoMinGold"),gems:num("#cfgCasinoMinGems"),ore:num("#cfgCasinoMinOre")},maxBet:{gold:num("#cfgCasinoMaxGold"),gems:num("#cfgCasinoMaxGems"),ore:num("#cfgCasinoMaxOre")},games:{coin:{chance:num("#cfgCasinoCoinChance"),mult:num("#cfgCasinoCoinMult")},skull:{chance:num("#cfgCasinoSkullChance"),mult:num("#cfgCasinoSkullMult"),freeSpinChance:num("#cfgCasinoSkullFreeChance"),freeSpinAmount:num("#cfgCasinoSkullFreeAmount")},dragon:{chance:num("#cfgCasinoDragonChance"),mult:num("#cfgCasinoDragonMult"),freeSpinChance:num("#cfgCasinoDragonFreeChance"),freeSpinAmount:num("#cfgCasinoDragonFreeAmount")}}};await saveConfigV8();fillCasinoAdminV247();alert("✅ Kaszinó beállítások mentve.")});setTimeout(fillCasinoAdminV247,1450);

// V22.19 exchange market and pet economy
const V219_ECONOMY_DEFAULTS={exchange:{gems:{gold:2500,amount:5},ore:{gold:1200,amount:10},tickets:{gold:3500,amount:1}},petSummonCost:10,petSlotCosts:[50,150,300],petSummonRates:{normal:55,rare:28,epic:12,mythic:4,legendary:1},petFusionCosts:{rare:10,mythic:10,legendary:10,celestial:10,imperial:10,eternal:10},petFusionRequirements:{rare:5,mythic:3,legendary:3,celestial:3,imperial:3,eternal:3},petMultiOption:{imperialChancePct:10,eternalChancePct:20,minPct:2,maxPct:8,maxExtraOptions:2},achievementExchange:{gems:{points:10,amount:5},ore:{points:5,amount:50},tickets:{points:8,amount:2}}};
function economyAdminCfg(){
 const e=studioConfig.economy||{},x=e.exchange||{};
 const ax=e.achievementExchange||{};
 return {exchange:{gems:{...V219_ECONOMY_DEFAULTS.exchange.gems,...(x.gems||{})},ore:{...V219_ECONOMY_DEFAULTS.exchange.ore,...(x.ore||{})},tickets:{...V219_ECONOMY_DEFAULTS.exchange.tickets,...(x.tickets||{})}},petSummonCost:Number(e.petSummonCost??10),petSlotCosts:Array.isArray(e.petSlotCosts)?e.petSlotCosts:[...V219_ECONOMY_DEFAULTS.petSlotCosts],petSummonRates:{...V219_ECONOMY_DEFAULTS.petSummonRates,...(e.petSummonRates||{})},petFusionCosts:{...V219_ECONOMY_DEFAULTS.petFusionCosts,...(e.petFusionCosts||{})},petFusionRequirements:{...V219_ECONOMY_DEFAULTS.petFusionRequirements,...(e.petFusionRequirements||{})},petMultiOption:{...V219_ECONOMY_DEFAULTS.petMultiOption,...(e.petMultiOption||{})},achievementExchange:{gems:{...V219_ECONOMY_DEFAULTS.achievementExchange.gems,...(ax.gems||{})},ore:{...V219_ECONOMY_DEFAULTS.achievementExchange.ore,...(ax.ore||{})},tickets:{...V219_ECONOMY_DEFAULTS.achievementExchange.tickets,...(ax.tickets||{})}}};
}
function fillEconomyAdmin(){
 const petMultiTemplate=qs("#petMultiOptionAdminTemplate"),petPage=qs("#studio-pets");
 if(petMultiTemplate&&petPage&&!qs("#cfgPetMultiImperialChance")){petPage.insertAdjacentHTML("beforeend",petMultiTemplate.textContent);petMultiTemplate.remove()}
 const e=economyAdminCfg(),map={cfgExchangeGemsGold:e.exchange.gems.gold,cfgExchangeGemsAmount:e.exchange.gems.amount,cfgExchangeOreGold:e.exchange.ore.gold,cfgExchangeOreAmount:e.exchange.ore.amount,cfgExchangeTicketsGold:e.exchange.tickets.gold,cfgExchangeTicketsAmount:e.exchange.tickets.amount,cfgPetSummonCost:e.petSummonCost,cfgPetSlot2Cost:e.petSlotCosts[0],cfgPetSlot3Cost:e.petSlotCosts[1],cfgPetSlot4Cost:e.petSlotCosts[2],cfgPetRateCommon:e.petSummonRates.normal,cfgPetRateRare:e.petSummonRates.rare,cfgPetRateEpic:e.petSummonRates.epic,cfgPetRateMythic:e.petSummonRates.mythic,cfgPetRateLegendary:e.petSummonRates.legendary,cfgPetFusionRare:e.petFusionCosts.rare,cfgPetFusionMythic:e.petFusionCosts.mythic,cfgPetFusionLegendary:e.petFusionCosts.legendary,cfgPetFusionCelestial:e.petFusionCosts.celestial,cfgPetFusionImperial:e.petFusionCosts.imperial,cfgPetFusionEternal:e.petFusionCosts.eternal,cfgPetReqRare:e.petFusionRequirements.rare,cfgPetReqMythic:e.petFusionRequirements.mythic,cfgPetReqLegendary:e.petFusionRequirements.legendary,cfgPetReqCelestial:e.petFusionRequirements.celestial,cfgPetReqImperial:e.petFusionRequirements.imperial,cfgPetReqEternal:e.petFusionRequirements.eternal,cfgPetMultiImperialChance:e.petMultiOption.imperialChancePct,cfgPetMultiEternalChance:e.petMultiOption.eternalChancePct,cfgPetMultiMinPct:e.petMultiOption.minPct,cfgPetMultiMaxPct:e.petMultiOption.maxPct,cfgPetMultiMaxOptions:e.petMultiOption.maxExtraOptions,cfgAchGemsPoints:e.achievementExchange.gems.points,cfgAchGemsAmount:e.achievementExchange.gems.amount,cfgAchOrePoints:e.achievementExchange.ore.points,cfgAchOreAmount:e.achievementExchange.ore.amount,cfgAchTicketsPoints:e.achievementExchange.tickets.points,cfgAchTicketsAmount:e.achievementExchange.tickets.amount};
 Object.entries(map).forEach(([id,value])=>{const el=qs("#"+id);if(el)el.value=value});
 const m={shardChancePct:2,shardAmount:1,shardsRequired:10,chestCost:{gold:1500,gems:10,ore:25,soul:1,tickets:1},upgradeCostMultiplier:1,...(studioConfig.mounts||{})};m.chestCost={gold:1500,gems:10,ore:25,soul:1,tickets:1,...(m.chestCost||{})};
 const mm={cfgMountShardChance:m.shardChancePct,cfgMountShardAmount:m.shardAmount,cfgMountShardRequired:m.shardsRequired,cfgMountChestGold:m.chestCost.gold,cfgMountChestGems:m.chestCost.gems,cfgMountChestOre:m.chestCost.ore,cfgMountChestSoul:m.chestCost.soul,cfgMountChestTickets:m.chestCost.tickets,cfgMountUpgradeMult:m.upgradeCostMultiplier};Object.entries(mm).forEach(([id,value])=>{const el=qs("#"+id);if(el)el.value=value});
}
qs("#saveEconomyConfig")?.addEventListener("click",async()=>{
 const positive=id=>Math.max(1,Math.floor(num("#"+id)));
 studioConfig.economy={...studioConfig.economy,exchange:{gems:{gold:positive("cfgExchangeGemsGold"),amount:positive("cfgExchangeGemsAmount")},ore:{gold:positive("cfgExchangeOreGold"),amount:positive("cfgExchangeOreAmount")},tickets:{gold:positive("cfgExchangeTicketsGold"),amount:positive("cfgExchangeTicketsAmount")}},petSummonCost:positive("cfgPetSummonCost"),petSlotCosts:[positive("cfgPetSlot2Cost"),positive("cfgPetSlot3Cost"),positive("cfgPetSlot4Cost")],petFusionCosts:economyAdminCfg().petFusionCosts,achievementExchange:{gems:{points:positive("cfgAchGemsPoints"),amount:positive("cfgAchGemsAmount")},ore:{points:positive("cfgAchOrePoints"),amount:positive("cfgAchOreAmount")},tickets:{points:positive("cfgAchTicketsPoints"),amount:positive("cfgAchTicketsAmount")}}};
 await saveConfigV8();fillEconomyAdmin();alert("✅ Váltópiac és pet árak elmentve.");
});
qs("#saveMountConfig")?.addEventListener("click",async()=>{const n=id=>Math.max(0,Number(qs("#"+id)?.value||0));studioConfig.mounts={shardChancePct:Math.min(100,n("cfgMountShardChance")),shardAmount:Math.max(1,Math.floor(n("cfgMountShardAmount"))),shardsRequired:Math.max(1,Math.floor(n("cfgMountShardRequired"))),chestCost:{gold:Math.floor(n("cfgMountChestGold")),gems:Math.floor(n("cfgMountChestGems")),ore:Math.floor(n("cfgMountChestOre")),soul:Math.floor(n("cfgMountChestSoul")),tickets:Math.floor(n("cfgMountChestTickets"))},upgradeCostMultiplier:Math.max(.1,n("cfgMountUpgradeMult"))};await saveConfigV8();fillEconomyAdmin();alert("✅ Hátasbeállítások elmentve és a játékosoknál frissülnek.")});
qs("#savePetFusionCosts")?.addEventListener("click",async()=>{
 const cost=id=>Math.max(0,Math.floor(num("#"+id)));
 const need=id=>Math.max(2,Math.floor(num("#"+id)));
 studioConfig.economy={...(studioConfig.economy||{}),petFusionCosts:{rare:cost("cfgPetFusionRare"),mythic:cost("cfgPetFusionMythic"),legendary:cost("cfgPetFusionLegendary"),celestial:cost("cfgPetFusionCelestial"),imperial:cost("cfgPetFusionImperial"),eternal:cost("cfgPetFusionEternal")},petFusionRequirements:{rare:need("cfgPetReqRare"),mythic:need("cfgPetReqMythic"),legendary:need("cfgPetReqLegendary"),celestial:need("cfgPetReqCelestial"),imperial:need("cfgPetReqImperial"),eternal:need("cfgPetReqEternal")}};
 await saveConfigV8();fillEconomyAdmin();alert("✅ Pet kraftolási gyémántárak elmentve.");
});
qs("#savePetSummonRates")?.addEventListener("click",async()=>{
 const rate=id=>Math.max(0,Number(qs("#"+id)?.value||0));
 const petSummonRates={normal:rate("cfgPetRateCommon"),rare:rate("cfgPetRateRare"),epic:rate("cfgPetRateEpic"),mythic:rate("cfgPetRateMythic"),legendary:rate("cfgPetRateLegendary")};
 const total=Object.values(petSummonRates).reduce((a,b)=>a+b,0);
 if(Math.abs(total-100)>.01)return alert(`❌ A rarity esélyek összege pontosan 100% legyen. Jelenleg: ${total}%`);
 studioConfig.economy={...(studioConfig.economy||{}),petSummonRates};await saveConfigV8();fillEconomyAdmin();alert("✅ Petlehívási rarity esélyek elmentve.");
});
document.addEventListener("click",async event=>{if(!event.target.closest?.("#savePetMultiOption"))return;
 const chance=id=>Math.max(0,Math.min(100,Number(qs("#"+id)?.value||0)));
 let minPct=Math.max(0,Number(qs("#cfgPetMultiMinPct")?.value||0)),maxPct=Math.max(0,Number(qs("#cfgPetMultiMaxPct")?.value||0));
 if(maxPct<minPct)[minPct,maxPct]=[maxPct,minPct];
 const petMultiOption={imperialChancePct:chance("cfgPetMultiImperialChance"),eternalChancePct:chance("cfgPetMultiEternalChance"),minPct,maxPct,maxExtraOptions:Math.max(1,Math.min(3,Math.floor(Number(qs("#cfgPetMultiMaxOptions")?.value||2))))};
 studioConfig.economy={...(studioConfig.economy||{}),petMultiOption};await saveConfigV8();fillEconomyAdmin();alert("✅ Imperial / Eternal többopciós kraft beállításai elmentve.");
});


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


/* ================= V22.2 FULL PLAYER EDITOR ================= */
function v222Set(id,val){
  const e=document.getElementById(id);
  if(e && val!==undefined && val!==null)e.value=val;
}
function v222Num(id){
  const e=document.getElementById(id);
  if(!e||e.value==="")return null;
  const n=Number(e.value);
  return Number.isFinite(n)?n:null;
}
function v222FillEditor(){
  if(!selected)return;
  const s=selected.game?.save_data||{};
  v222Set("v222Gold",s.gold||0);
  v222Set("v222Gems",s.gems||0);
  v222Set("v222Ore",s.ore||0);
  v222Set("v222Soul",s.soul||0);
  v222Set("v222Tickets",s.tickets||0);
  v222Set("v222Level",s.level||selected.game?.level||1);
  v222Set("v222Xp",s.xp||0);
  v222Set("v222Wave",s.wave||1);
  v222Set("v222Paragon",s.paragonLevel??s.paragon??0);
  v222Set("v222Prestige",s.prestigeLevel??s.prestige??0);
  v222Set("v222ParagonPoints",s.paragonStatPoints??s.statPoints??0);
  v222Set("v222AuraTokens",s.auraTokens||0);
  v222Set("v222PrestigeTokens",s.prestigeTokens||0);
  v222Set("v222SkillPoints",s.skillPoints||0);
  v222Set("v222HpRegen",s.hpRegenLevel||0);
  v222Set("v222Kills",s.kills||selected.game?.kills||0);
  v222Set("v222Deaths",s.deaths||0);

  v222Set("v222WeaponTraining",s.base?.weaponTraining||0);
  v222Set("v222ArmorTraining",s.base?.armorTraining||0);
  v222Set("v222Mining",s.base?.mining||0);
  v222Set("v222Luck",s.base?.luck||0);

  v222Set("v222SkillPower",s.skills?.power||0);
  v222Set("v222SkillGold",s.skills?.gold||0);
  v222Set("v222SkillCrit",s.skills?.crit||0);
  v222Set("v222SkillDrop",s.skills?.drop||0);
  v222Set("v222SkillOffline",s.skills?.offline||0);
  v222Set("v222SkillPet",s.skills?.pet||0);

  const t=document.getElementById("v222Speed10");
  if(t)t.checked=Boolean(s.speed10Unlocked);
  const ap=document.getElementById("v237AutoParagon");
  if(ap)ap.checked=Boolean(s.autoParagonUnlocked);
  const db=document.getElementById("v279DungeonBatch");
  if(db)db.checked=Boolean(s.dungeonBatchUnlocked);
  v222Set("v222CombatSpeed",s.combatSpeed||1);
}
async function v222ReloadSelected(){
  if(!selected?.user?.id)return;
  selected=await api("/api/admin/player/"+selected.user.id);
  v222FillEditor();
}
function v222Payload(){
  return {
    gold:v222Num("v222Gold"),gems:v222Num("v222Gems"),ore:v222Num("v222Ore"),
    soul:v222Num("v222Soul"),tickets:v222Num("v222Tickets"),level:v222Num("v222Level"),
    xp:v222Num("v222Xp"),wave:v222Num("v222Wave"),paragonLevel:v222Num("v222Paragon"),
    prestigeLevel:v222Num("v222Prestige"),paragonStatPoints:v222Num("v222ParagonPoints"),
    auraTokens:v222Num("v222AuraTokens"),prestigeTokens:v222Num("v222PrestigeTokens"),skillPoints:v222Num("v222SkillPoints"),
    hpRegenLevel:v222Num("v222HpRegen"),kills:v222Num("v222Kills"),deaths:v222Num("v222Deaths"),
    base:{
      weaponTraining:v222Num("v222WeaponTraining"),
      armorTraining:v222Num("v222ArmorTraining"),
      mining:v222Num("v222Mining"),
      luck:v222Num("v222Luck")
    },
    skills:{
      power:v222Num("v222SkillPower"),gold:v222Num("v222SkillGold"),
      crit:v222Num("v222SkillCrit"),drop:v222Num("v222SkillDrop"),
      offline:v222Num("v222SkillOffline"),pet:v222Num("v222SkillPet")
    },
    speed10Unlocked:Boolean(document.getElementById("v222Speed10")?.checked),
    autoParagonUnlocked:Boolean(document.getElementById("v237AutoParagon")?.checked),
    dungeonBatchUnlocked:Boolean(document.getElementById("v279DungeonBatch")?.checked),
    combatSpeed:Number(document.getElementById("v222CombatSpeed")?.value||1)
  };
}
async function v222Save(){
  if(!selected?.user?.id)return;
  const st=document.getElementById("v222EditorStatus");
  if(st)st.textContent="Mentés...";
  try{
    const d=await api(`/api/admin/player/${selected.user.id}/state`,{
      method:"POST",
      body:JSON.stringify(v222Payload())
    });
    selected=d;
    v222FillEditor();
    if(st)st.textContent="✅ Minden érték elmentve.";
    toast("Játékos értékei frissítve.");
    await loadPlayers();
  }catch(e){
    if(st)st.textContent="❌ "+e.message;
  }
}
async function v222Quick(action){
  if(!selected?.user?.id)return;
  try{
    selected=await api(`/api/admin/player/${selected.user.id}/quick`,{
      method:"POST",body:JSON.stringify({action})
    });
    v222FillEditor();
    toast("Admin művelet kész.");
  }catch(e){alert(e.message)}
}
document.addEventListener("click",e=>{
  if(e.target.id==="v222SavePlayer"){e.preventDefault();v222Save()}
  if(e.target.id==="v222Give10x"){e.preventDefault();v222Quick("give10x")}
  if(e.target.id==="v222Remove10x"){e.preventDefault();v222Quick("remove10x")}
  if(e.target.id==="v222FullHp"){e.preventDefault();v222Quick("fullhp")}
});

/* Hook the existing openPlayer without replacing its current behavior. */
const _v222OpenPlayer=openPlayer;
openPlayer=async function(id){
  await _v222OpenPlayer(id);
  setTimeout(v222FillEditor,0);
};


/* ================= V22.92 AI FEJLESZTŐ UI ================= */
function aiDevEsc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function loadAiDeveloper(){
 const cfg=document.getElementById("aiDevConfig"),runs=document.getElementById("aiDevRuns");
 if(!cfg||!runs)return;
 try{
  const d=await api("/api/admin/ai-developer/status");
  const s=d.services||{};
  cfg.innerHTML=`<div class="ai-dev-service ${s.openai?'ok':'bad'}">${s.openai?'✅':'❌'} AI API</div><div class="ai-dev-service ${s.github?'ok':'bad'}">${s.github?'✅':'❌'} GitHub ${aiDevEsc(s.repo||'')}</div><div class="ai-dev-service ${s.render?'ok':'bad'}">${s.render?'✅':'❌'} Render Deploy</div><div class="ai-dev-service">🌿 ${aiDevEsc(s.branch||'main')}</div><div class="ai-dev-service">🧠 ${aiDevEsc(s.model||'')}</div>`;
  const list=Array.isArray(d.runs)?d.runs:[];
  runs.innerHTML=list.length?list.map(r=>`<div class="ai-dev-run-row"><div><b>#${r.id} ${aiDevEsc(r.status)}</b> <span class="muted">${new Date(r.created_at).toLocaleString('hu-HU')}</span></div><div>${aiDevEsc(r.request_text)}</div>${r.summary?`<div class="muted">${aiDevEsc(r.summary)}</div>`:''}${r.commit_sha?`<div class="ai-dev-sha">Commit: ${aiDevEsc(r.commit_sha.slice(0,12))}</div>`:''}${r.error_text?`<div class="ai-dev-error">❌ ${aiDevEsc(r.error_text)}</div>`:''}</div>`).join(""):'<div class="muted">Még nincs AI fejlesztési futás.</div>';
 }catch(e){cfg.innerHTML='<span class="ai-dev-error">❌ '+aiDevEsc(e.message)+'</span>'}
}
async function runAiDeveloper(){
 const prompt=document.getElementById("aiDevPrompt"),btn=document.getElementById("aiDevRun"),st=document.getElementById("aiDevStatus");
 const request=String(prompt?.value||"").trim();
 if(request.length<8)return alert("Írd le részletesebben, mit szeretnél fejleszteni.");
 if(!confirm("Az AI most valóban módosíthatja a projekt forráskódját, GitHubra commitolhatja és elindíthatja a Render telepítést. Folytatod?"))return;
 btn.disabled=true;st.innerHTML='<b>🧠 AI dolgozik a fejlesztésen...</b><br><span class="muted">Kód elemzése → módosítás → ellenőrzés → GitHub commit → Render deploy.</span>';
 try{
  const d=await api("/api/admin/ai-developer/run",{method:"POST",body:JSON.stringify({request})});
  st.innerHTML=`<div class="ai-dev-success">✅ ${aiDevEsc(d.message||'Kész.')}</div><div>${aiDevEsc(d.summary||'')}</div><div class="muted">Módosított fájlok: ${aiDevEsc((d.changedFiles||[]).join(', '))}</div><div class="ai-dev-sha">Commit: ${aiDevEsc(d.commitSha||'')}</div>`;
  prompt.value="";
 }catch(e){st.innerHTML='<div class="ai-dev-error">❌ '+aiDevEsc(e.message)+'</div>'}
 finally{btn.disabled=false;await loadAiDeveloper()}
}
document.addEventListener("click",e=>{
 if(e.target.id==="aiDevRun"){e.preventDefault();runAiDeveloper()}
 if(e.target.closest("[data-studio='aidev']"))setTimeout(loadAiDeveloper,50);
});
