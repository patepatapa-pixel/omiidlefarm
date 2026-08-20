
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const SLOT_NAMES={weapon:"Fegyver",helmet:"Sisak",armor:"Páncél",gloves:"Kesztyű",boots:"Csizma",ring:"Gyűrű"};
const SLOT_ICONS={weapon:"⚔️",helmet:"🪖",armor:"🛡️",gloves:"🧤",boots:"🥾",ring:"💍"};
const RARITIES=[
 {key:"normal",name:"Normal",mult:1,chance:60},
 {key:"rare",name:"Rare",mult:1.35,chance:25},
 {key:"epic",name:"Epic",mult:1.8,chance:10},
 {key:"mythic",name:"Mythic",mult:2.5,chance:4},
 {key:"legendary",name:"Legendary",mult:3.5,chance:1}
];
const ZONES=[
 {name:"Zöld mező",icon:"🐗",enemy:"Vadkan",hp:45,gold:10,xp:6,need:1,drop:.10},
 {name:"Sötét erdő",icon:"🐺",enemy:"Árnyfarkas",hp:150,gold:35,xp:15,need:120,drop:.13},
 {name:"Elhagyott bánya",icon:"🦂",enemy:"Skorpió",hp:520,gold:95,xp:35,need:380,drop:.16},
 {name:"Démon torony",icon:"👹",enemy:"Démon őr",hp:1700,gold:280,xp:85,need:1100,drop:.19},
 {name:"Sárkány-völgy",icon:"🐉",enemy:"Ősi sárkány",hp:6000,gold:900,xp:220,need:3200,drop:.23},
 {name:"Mennydörgés fennsík",icon:"⚡",enemy:"Viharóriás",hp:18000,gold:2700,xp:600,need:9000,drop:.27},
 {name:"Üresség",icon:"🌌",enemy:"Void Lord",hp:60000,gold:8500,xp:1650,need:25000,drop:.31},
 {name:"Isteni kapu",icon:"👁️",enemy:"Égi őrző",hp:190000,gold:25000,xp:4500,need:70000,drop:.36}
];
const BASE_UPS=[
 {key:"weaponTraining",name:"Fegyveredzés",icon:"⚔️",base:60,desc:"+ sebzés"},
 {key:"armorTraining",name:"Páncéledzés",icon:"🛡️",base:80,desc:"+ arany"},
 {key:"mining",name:"Bányászat",icon:"⛏️",base:110,desc:"+ érc drop"},
 {key:"luck",name:"Szerencse",icon:"🍀",base:160,desc:"+ ritka drop"}
];
const SKILLS=[
 {key:"power",name:"Erő aura",icon:"🔥",desc:"+5% sebzés / szint",max:20},
 {key:"gold",name:"Aranyáldás",icon:"💰",desc:"+6% arany / szint",max:20},
 {key:"crit",name:"Kritikus ösztön",icon:"🎯",desc:"+1.5% krit / szint",max:15},
 {key:"drop",name:"Kincsvadász",icon:"🎁",desc:"+2% drop esély / szint",max:15},
 {key:"offline",name:"Mély alvás farm",icon:"🌙",desc:"+5% offline hatékonyság / szint",max:10},
 {key:"pet",name:"Pet szinkron",icon:"🐾",desc:"+4% pet bónusz / szint",max:10}
];
const PET_POOL=[
 {name:"Kis Farkas",icon:"🐺",bonus:"damage",value:.08,rarity:"normal"},
 {name:"Arany Róka",icon:"🦊",bonus:"gold",value:.12,rarity:"rare"},
 {name:"Kristály Bagoly",icon:"🦉",bonus:"drop",value:.08,rarity:"epic"},
 {name:"Démon Kölyök",icon:"😈",bonus:"crit",value:.10,rarity:"mythic"},
 {name:"Mini Sárkány",icon:"🐲",bonus:"all",value:.12,rarity:"legendary"}
];
const DUNGEONS=[
 {id:"cave",name:"Kristálybarlang",icon:"💎",need:800,hp:6000,rewardGold:12000,rewardGems:1,tickets:1},
 {id:"demon",name:"Démon erőd",icon:"🔥",need:4500,hp:35000,rewardGold:90000,rewardGems:2,tickets:2},
 {id:"dragon",name:"Sárkányfészek",icon:"🐉",need:18000,hp:180000,rewardGold:500000,rewardGems:4,tickets:3},
 {id:"void",name:"Void Citadella",icon:"🌌",need:65000,hp:850000,rewardGold:2500000,rewardGems:8,tickets:5}
];
const DAILY=[
 {id:"kill",name:"Ölj meg 500 ellenfelet",target:500,type:"kills",reward:{gold:25000}},
 {id:"gold",name:"Szerezz 250 000 aranyat",target:250000,type:"goldEarned",reward:{gems:2}},
 {id:"equip",name:"Szerezz 5 felszerelést",target:5,type:"itemsFound",reward:{ore:20}}
];
const ACH=[
 {id:"k1",name:"Első vér",type:"kills",target:1,reward:1},
 {id:"k1000",name:"Ezres vadász",type:"kills",target:1000,reward:3},
 {id:"p10k",name:"10 000 erő",type:"power",target:10000,reward:5},
 {id:"legend",name:"Legendás drop",type:"legendary",target:1,reward:5}
];

let save=JSON.parse(localStorage.getItem("omiIdleComplete")||"null")||{
 gold:0,gems:10,ore:0,soul:0,tickets:3,level:1,xp:0,skillPoints:0,kills:0,zone:0,
 base:{weaponTraining:1,armorTraining:1,mining:1,luck:1},skills:{power:0,gold:0,crit:0,drop:0,offline:0,pet:0},
 inventory:[],equipped:{weapon:null,helmet:null,armor:null,gloves:null,boots:null,ring:null},
 pets:[],activePet:null,stats:{goldEarned:0,itemsFound:0,legendary:0,bosses:0,dungeons:0,critHits:0,playSeconds:0},
 dailyClaimed:{},achClaimed:{},last:Date.now(),lastDaily:new Date().toDateString(),uid:1
};
if(save.lastDaily!==new Date().toDateString()){save.dailyClaimed={};save.lastDaily=new Date().toDateString()}


function normalizeV6Save(s){
 s=s&&typeof s==="object"?s:{};
 s.gold=Number(s.gold||0);s.gems=Number(s.gems||10);s.ore=Number(s.ore||0);s.soul=Number(s.soul||0);s.tickets=Number(s.tickets||3);
 s.level=Math.max(1,Number(s.level||1));s.xp=Number(s.xp||0);s.skillPoints=Number(s.skillPoints||0);s.kills=Number(s.kills||0);s.zone=Math.max(0,Math.min(ZONES.length-1,Number(s.zone||0)));
 s.base={weaponTraining:1,armorTraining:1,mining:1,luck:1,...(s.base||{})};
 s.skills={power:0,gold:0,crit:0,drop:0,offline:0,pet:0,...(s.skills||{})};
 s.inventory=Array.isArray(s.inventory)?s.inventory:[];
 s.equipped={weapon:null,helmet:null,armor:null,gloves:null,boots:null,ring:null,...(s.equipped||{})};
 s.pets=Array.isArray(s.pets)?s.pets:[];s.activePet=Number.isInteger(s.activePet)?s.activePet:null;
 s.stats={goldEarned:0,itemsFound:0,legendary:0,bosses:0,dungeons:0,critHits:0,playSeconds:0,...(s.stats||{})};
 s.dailyClaimed=s.dailyClaimed||{};s.achClaimed=s.achClaimed||{};s.last=Number(s.last||Date.now());s.lastDaily=s.lastDaily||new Date().toDateString();s.uid=Math.max(1,Number(s.uid||1));
 s.wave=Math.max(1,Number(s.wave||1));s.waveKills=Math.max(0,Number(s.waveKills||0));s.waveGoal=Math.max(1,Number(s.waveGoal||10));s.waveBoss=Boolean(s.waveBoss);s.bossHp=Math.max(0,Number(s.bossHp||0));
 s.paragonLevel=Math.max(0,Number(s.paragonLevel||0));s.prestigeLevel=Math.max(0,Number(s.prestigeLevel||0));s.paragonPoints=Math.max(0,Number(s.paragonPoints||0));s.auraTokens=Math.max(0,Number(s.auraTokens||0));
 s.paragonStats={damage:0,gold:0,drop:0,crit:0,...(s.paragonStats||{})};
 s.ownedAuras=Array.isArray(s.ownedAuras)?s.ownedAuras:["none"];if(!s.ownedAuras.includes("none"))s.ownedAuras.unshift("none");
 s.activeAura=s.activeAura||"none";
 s.playerHp=Number.isFinite(Number(s.playerHp))?Number(s.playerHp):0;
 s.deaths=Math.max(0,Number(s.deaths||0));
 s.respawnUntil=Math.max(0,Number(s.respawnUntil||0));
 return s;
}
save=normalizeV6Save(save);

save.wave=Number(save.wave||1);
save.waveKills=Number(save.waveKills||0);
save.waveGoal=Number(save.waveGoal||10);
save.waveBoss=Boolean(save.waveBoss||false);
save.bossHp=Number(save.bossHp||0);
save.paragonLevel=Number(save.paragonLevel||0);
save.prestigeLevel=Number(save.prestigeLevel||0);
save.paragonPoints=Number(save.paragonPoints||0);
save.auraTokens=Number(save.auraTokens||0);
save.paragonStats=save.paragonStats||{damage:0,gold:0,drop:0,crit:0};
save.ownedAuras=Array.isArray(save.ownedAuras)?save.ownedAuras:["none"];
save.activeAura=save.activeAura||"none";

let enemyHp=ZONES[save.zone].hp;

function persist(){save.last=Date.now();localStorage.setItem("omiIdleComplete",JSON.stringify(save));$("#saveState").textContent="💾 Mentve"}
function toast(t){let e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1700)}
function fmt(n){return Math.floor(Number(n||0)).toLocaleString("hu-HU")}
function needXp(){return 100+save.level*45}
function equipObj(slot){let id=save.equipped[slot];return save.inventory.find(x=>x.id===id)||null}
function upgradeMult(item){return 1+item.plus*.10}
function itemStats(item){
 let m=upgradeMult(item);
 return {atk:Math.floor((item.atk||0)*m),def:Math.floor((item.def||0)*m),gold:(item.gold||0)*m,crit:(item.crit||0)*m,drop:(item.drop||0)*m}
}
function petObj(){return save.pets.find((p,i)=>i===save.activePet)||null}
function petScale(){return 1+save.skills.pet*.04}
function bonuses(){
 let atk=0,def=0,gold=0,crit=0,drop=0;
 Object.keys(save.equipped).forEach(s=>{let it=equipObj(s);if(!it)return;let st=itemStats(it);atk+=st.atk;def+=st.def;gold+=st.gold;crit+=st.crit;drop+=st.drop});
 let pet=petObj(), ps=petScale();
 if(pet){if(pet.bonus==="damage")atk*=1+pet.value*ps;if(pet.bonus==="gold")gold+=pet.value*ps;if(pet.bonus==="crit")crit+=pet.value*ps;if(pet.bonus==="drop")drop+=pet.value*ps;if(pet.bonus==="all"){atk*=1+pet.value*ps;gold+=pet.value*ps;crit+=pet.value*.5*ps;drop+=pet.value*.5*ps}}
 return {atk,def,gold,crit,drop}
}
function damage(){
 let b=bonuses(),base=6+save.level*1.2+save.base.weaponTraining*4+b.atk;
 return Math.floor(base*(1+save.skills.power*.05+save.paragonStats.damage*.02))
}
function critChance(){return Math.min(.75,.05+save.skills.crit*.015+bonuses().crit+save.paragonStats.crit*.005)}
function goldBonus(){return 1+(save.base.armorTraining-1)*.05+save.skills.gold*.06+bonuses().gold+save.paragonStats.gold*.03}
function dropBonus(){return save.skills.drop*.02+bonuses().drop+(save.base.luck-1)*.01+save.paragonStats.drop*.01}
function power(){let b=bonuses();return Math.floor(damage()*11+b.def*7+save.level*20+save.base.mining*8+save.base.luck*8)}
function rankName(){let p=power();return p<500?"Kezdő":p<2500?"Harcos":p<10000?"Elit":p<40000?"Mester":p<120000?"Hős":"Isteni"}
function baseCost(d){return Math.floor(d.base*Math.pow(1.58,save.base[d.key]-1))}
function rarityRoll(){
 let bonus=(save.base.luck-1)*.25+save.skills.drop*.15;
 let r=Math.random()*100;
 if(r<1+bonus*.08)return RARITIES[4];
 if(r<5+bonus*.15)return RARITIES[3];
 if(r<15+bonus*.28)return RARITIES[2];
 if(r<40+bonus*.45)return RARITIES[1];
 return RARITIES[0]
}
function createItem(){
 let zone=ZONES[save.zone],rar=rarityRoll(),slots=Object.keys(SLOT_NAMES),slot=slots[Math.floor(Math.random()*slots.length)];
 let scale=(1+save.zone*.75)*(1+save.level*.04)*rar.mult;
 let it={id:save.uid++,slot,rarity:rar.key,name:`${rar.name} ${SLOT_NAMES[slot]}`,plus:0,atk:0,def:0,gold:0,crit:0,drop:0};
 if(slot==="weapon")it.atk=Math.max(2,Math.floor(7*scale));
 else if(slot==="armor"||slot==="helmet")it.def=Math.max(2,Math.floor(6*scale));
 else if(slot==="gloves")it.crit=.005*scale;
 else if(slot==="boots")it.gold=.025*scale;
 else if(slot==="ring")it.drop=.012*scale;
 if(Math.random()<.25)it.atk+=Math.floor(2*scale);
 if(Math.random()<.20)it.gold+=.01*scale;
 return it
}
function rarityName(k){return RARITIES.find(x=>x.key===k)?.name||k}
function sellValue(it){let r=RARITIES.find(x=>x.key===it.rarity)||RARITIES[0];return Math.floor((30+save.level*8)*(1+save.zone*.7)*r.mult*(1+it.plus*.4))}
function addItem(it){
 if(save.inventory.length>=120){save.gold+=sellValue(it);return toast("🎒 Inventory tele — tárgy automatikusan eladva.")}
 save.inventory.push(it);save.stats.itemsFound++;if(it.rarity==="legendary")save.stats.legendary++;
 $("#lastDrop").innerHTML=`<b class="rarity-${it.rarity}">${SLOT_ICONS[it.slot]} ${it.name} +${it.plus}</b><small>${rarityName(it.rarity)} felszerelés</small>`;
 toast(`🎁 ${rarityName(it.rarity)} drop: ${it.name}`)
}
function kill(){
 let z=ZONES[save.zone],g=Math.floor(z.gold*goldBonus());
 save.gold+=g;save.stats.goldEarned+=g;save.xp+=z.xp;save.kills++;
 if(Math.random()<.07+save.base.mining*.005)save.ore++;
 if(Math.random()<.007+dropBonus()*.05)save.soul++;
 if(Math.random()<.006)save.tickets++;
 if(Math.random()<z.drop+dropBonus())addItem(createItem());
 while(save.xp>=needXp()){save.xp-=needXp();save.level++;save.skillPoints++;toast(`⭐ Szintlépés! Lv.${save.level}`)}
 save.waveKills++;
 if(save.waveKills>=save.waveGoal){
   save.waveBoss=true;
   save.bossHp=Math.floor(z.hp*(6+save.wave*.18));
   enemyHp=save.bossHp;
   $("#combatLog").textContent=`👹 Wave ${save.wave} BOSS megjelent! Nem léphetsz tovább, amíg le nem győzöd.`;
 }else{
   $("#combatLog").textContent=`${z.enemy} legyőzve · +${fmt(g)} arany · +${z.xp} XP`;
   enemyHp=z.hp;
 }
 persist()
}
function combatTick(){ /* V10 uses dedicated player/enemy timers */ }


function highestEquippedRarity(){
 const order={normal:1,rare:2,epic:3,mythic:4,legendary:5};
 let best="normal",score=0;
 Object.keys(save.equipped).forEach(slot=>{
   const it=equipObj(slot);
   if(it && (order[it.rarity]||0)>score){best=it.rarity;score=order[it.rarity]||0}
 });
 return score?best:null;
}
function weaponEmoji(it){
 if(!it)return "⚔️";
 const n=(it.name||"").toLowerCase();
 if(n.includes("íj"))return "🏹";
 if(n.includes("tőr"))return "🗡️";
 if(n.includes("lándzsa"))return "🔱";
 return it.plus>=10?"🗡️":"⚔️";
}
function armorEmoji(it){
 if(!it)return "🛡️";
 return it.rarity==="legendary"?"🛡️":it.rarity==="mythic"?"🛡️":"🛡️";
}
function renderCharacterVisual(){
 const mapping=[
   ["helmet","slotHelmetVisual",".slot-helmet"],
   ["weapon","slotWeaponVisual",".slot-weapon"],
   ["armor","slotArmorVisual",".slot-armor"],
   ["gloves","slotGlovesVisual",".slot-gloves"],
   ["boots","slotBootsVisual",".slot-boots"],
   ["ring","slotRingVisual",".slot-ring"]
 ];
 mapping.forEach(([slot,id,sel])=>{
   const it=equipObj(slot),el=$("#"+id),box=$(sel);
   if(el)el.textContent=it?`${rarityName(it.rarity)} +${it.plus}`:"Üres";
   if(box){
     box.classList.remove("rarity-normal","rarity-rare","rarity-epic","rarity-mythic","rarity-legendary");
     if(it)box.classList.add("rarity-"+it.rarity);
   }
 });

 const weapon=equipObj("weapon"),armor=equipObj("armor"),helmet=equipObj("helmet"),pet=petObj();
 if($("#equippedWeaponVisual"))$("#equippedWeaponVisual").textContent=weaponEmoji(weapon);
 if($("#equippedShieldVisual"))$("#equippedShieldVisual").textContent=armor?armorEmoji(armor):"";
 if($("#charHead"))$("#charHead").textContent=helmet?(helmet.rarity==="legendary"?"👑":"🧙"):"🙂";
 if($("#charTorso")){
   const rar=armor?.rarity||"normal";
   const colors={normal:["#2a3037","#171b20"],rare:["#233b50","#102233"],epic:["#402754","#21132d"],mythic:["#5a2337","#2a111d"],legendary:["#5b471e","#241d0e"]};
   const c=colors[rar]||colors.normal;
   $("#charTorso").style.background=`linear-gradient(180deg,${c[0]},${c[1]})`;
 }
 if($("#petVisual"))$("#petVisual").textContent=pet?pet.icon:"🐾";
 if($("#activePetName"))$("#activePetName").textContent=pet?pet.name:"Nincs";
 if($("#activeWeaponName"))$("#activeWeaponName").textContent=weapon?`${weapon.name} +${weapon.plus}`:"Nincs";

 const aura=$("#characterAura"),best=highestEquippedRarity();
 if(aura){
   aura.className="character-aura";
   if(best && ["epic","mythic","legendary"].includes(best))aura.classList.add("active",best);
 }
 if($("#activeAuraName"))$("#activeAuraName").textContent=
   best==="legendary"?"Legendás arany aura":
   best==="mythic"?"Mythic bíbor aura":
   best==="epic"?"Epic lila aura":"Nincs";

 const backdrop=$("#characterBackdrop");
 if(backdrop)backdrop.className=`zone-backdrop zone-theme-${save.zone}`;
 if($("#charRankText"))$("#charRankText").textContent=rankName();
 if($("#charPowerText"))$("#charPowerText").textContent=fmt(power())+" ERŐ";
}

function renderCore(){
 let z=ZONES[save.zone];
 $("#gold").textContent=fmt(save.gold);$("#gems").textContent=fmt(save.gems);$("#ore").textContent=fmt(save.ore);$("#soul").textContent=fmt(save.soul);$("#tickets").textContent=fmt(save.tickets);$("#level").textContent=save.level;$("#xpText").textContent=`${fmt(save.xp)} / ${fmt(needXp())} XP`;$("#power").textContent=fmt(power());$("#rankName").textContent=rankName();$("#gps").textContent=`~${fmt(z.gold*goldBonus()*damage()/z.hp)} / mp`;
 $("#zoneName").textContent=z.name;$("#enemyIcon").textContent=z.icon;$("#enemyName").textContent=z.enemy;$("#enemyHp").textContent=fmt(Math.max(0,enemyHp));$("#enemyMaxHp").textContent=fmt(z.hp);$("#hpbar").style.width=Math.max(0,enemyHp/z.hp*100)+"%";$("#damageText").textContent=fmt(damage());$("#critText").textContent=(critChance()*100).toFixed(1)+"%";$("#dropText").textContent=(dropBonus()*100).toFixed(1)+"%";
 renderEquipped();renderBonuses();renderCharacterVisual()
}
function renderZones(){
 $("#zones").innerHTML=ZONES.map((z,i)=>`<div class="zone ${i===save.zone?"active":""} ${power()<z.need?"locked":""}" data-zone="${i}"><b>${z.icon} ${z.name}</b><small>${z.enemy} · Ajánlott erő: ${fmt(z.need)}</small><small>Drop: ${(z.drop*100).toFixed(0)}%</small></div>`).join("");
 $$("[data-zone]").forEach(e=>e.onclick=()=>{let i=+e.dataset.zone;if(power()<ZONES[i].need)return toast("🔒 Még nem vagy elég erős.");save.zone=i;enemyHp=ZONES[i].hp;renderAll();toast("🗺️ "+ZONES[i].name)})
}
function renderBaseUpgrades(){
 $("#baseUpgrades").innerHTML=BASE_UPS.map(d=>`<div class="upgrade-row"><div class="upgrade-icon">${d.icon}</div><div><b>${d.name} · Lv.${save.base[d.key]}</b><small>${d.desc}</small></div><button data-base="${d.key}" ${save.gold<baseCost(d)?"disabled":""}>${fmt(baseCost(d))} 💰</button></div>`).join("");
 $$("[data-base]").forEach(b=>b.onclick=()=>{let d=BASE_UPS.find(x=>x.key===b.dataset.base),c=baseCost(d);if(save.gold<c)return;save.gold-=c;save.base[d.key]++;persist();renderAll();toast("⬆️ "+d.name)})
}
function renderEquipped(){
 $("#equipped").innerHTML=Object.keys(SLOT_NAMES).map(s=>{let it=equipObj(s);return `<div class="equip-slot ${it?"rarity-"+it.rarity:""}"><small>${SLOT_ICONS[s]} ${SLOT_NAMES[s]}</small>${it?`<b>${it.name} +${it.plus}</b><small>${itemSummary(it)}</small>`:`<b>Üres</b>`}</div>`}).join("")
}
function itemSummary(it){let st=itemStats(it),a=[];if(st.atk)a.push("ATK "+fmt(st.atk));if(st.def)a.push("DEF "+fmt(st.def));if(st.gold)a.push("Arany +"+(st.gold*100).toFixed(1)+"%");if(st.crit)a.push("Krit +"+(st.crit*100).toFixed(1)+"%");if(st.drop)a.push("Drop +"+(st.drop*100).toFixed(1)+"%");return a.join(" · ")}
function renderBonuses(){let b=bonuses(),p=petObj();$("#activeBonuses").innerHTML=`<div><span>⚔️ Felszerelés ATK</span><b>${fmt(b.atk)}</b></div><div><span>💰 Arany bónusz</span><b>+${((goldBonus()-1)*100).toFixed(1)}%</b></div><div><span>🎯 Krit</span><b>${(critChance()*100).toFixed(1)}%</b></div><div><span>🎁 Drop</span><b>+${(dropBonus()*100).toFixed(1)}%</b></div><div><span>🐾 Aktív pet</span><b>${p?p.icon+" "+p.name:"Nincs"}</b></div>`}
function renderInventory(){
 let order={legendary:5,mythic:4,epic:3,rare:2,normal:1};
 $("#inventory").innerHTML=save.inventory.length?save.inventory.map(it=>`<div class="inventory-item rarity-${it.rarity}"><div class="icon">${SLOT_ICONS[it.slot]}</div><b>${it.name} +${it.plus}</b><small>${rarityName(it.rarity)} · ${SLOT_NAMES[it.slot]}</small><small>${itemSummary(it)}</small><small>Eladási ár: ${fmt(sellValue(it))} 💰</small><div class="actions"><button data-equip="${it.id}">Felszerel</button><button data-sell="${it.id}">Elad</button></div></div>`).join(""):'<p class="muted">Az inventory üres.</p>';
 $$("[data-equip]").forEach(b=>b.onclick=()=>{let it=save.inventory.find(x=>x.id==b.dataset.equip);save.equipped[it.slot]=it.id;persist();renderAll();toast("🛡️ Felszerelve: "+it.name)});
 $$("[data-sell]").forEach(b=>b.onclick=()=>{let id=+b.dataset.sell,it=save.inventory.find(x=>x.id===id);if(Object.values(save.equipped).includes(id))return toast("Előbb vedd le / cseréld le.");save.gold+=sellValue(it);save.inventory=save.inventory.filter(x=>x.id!==id);persist();renderAll()})
}
function upgradeChance(plus){return [100,100,95,90,82,74,64,54,44,35,28,22,17,12,8,5][plus]||0}
function upgradeCost(it){return Math.floor(sellValue(it)*(2+it.plus*.8))}
function oreCost(it){return Math.max(1,Math.floor(1+it.plus*.7))}
function renderUpgrade(){
 let equipped=Object.keys(save.equipped).map(s=>equipObj(s)).filter(Boolean);
 $("#upgradeSlots").innerHTML=equipped.length?equipped.map(it=>`<div class="upgrade-target rarity-${it.rarity}"><div><b>${SLOT_ICONS[it.slot]} ${it.name} +${it.plus}</b><small>${itemSummary(it)}</small></div><button data-upgrade-item="${it.id}" ${it.plus>=15?"disabled":""}>${it.plus>=15?"MAX":`+${it.plus+1} · ${fmt(upgradeCost(it))} 💰 + ${oreCost(it)} ⛏️`}</button></div>`).join(""):'<p class="muted">Nincs felszerelt tárgy.</p>';
 $("#upgradeInfo").innerHTML=[0,3,6,9,12,14].map(x=>`<div class="bonus-list"><div><span>+${x} → +${x+1}</span><b>${upgradeChance(x)}%</b></div></div>`).join("");
 $$("[data-upgrade-item]").forEach(b=>b.onclick=()=>{let it=save.inventory.find(x=>x.id==b.dataset.upgradeItem),gc=upgradeCost(it),oc=oreCost(it);if(save.gold<gc||save.ore<oc)return toast("Nincs elég arany vagy érc.");save.gold-=gc;save.ore-=oc;let ok=Math.random()*100<upgradeChance(it.plus);if(ok){it.plus++;toast("✅ Fejlesztés sikeres! +"+it.plus)}else{toast("❌ Fejlesztés sikertelen.")}persist();renderAll()})
}
function renderSkills(){
 $("#skillPoints").textContent=save.skillPoints;
 $("#skills").innerHTML=SKILLS.map(s=>`<div class="skill-card"><div style="font-size:28px">${s.icon}</div><h3>${s.name}</h3><small>${s.desc}</small><p>Lv.${save.skills[s.key]} / ${s.max}</p><button data-skill="${s.key}" ${save.skillPoints<=0||save.skills[s.key]>=s.max?"disabled":""}>+1 pont</button></div>`).join("");
 $$("[data-skill]").forEach(b=>b.onclick=()=>{let sk=SKILLS.find(x=>x.key===b.dataset.skill);if(save.skillPoints<=0||save.skills[sk.key]>=sk.max)return;save.skillPoints--;save.skills[sk.key]++;persist();renderAll()})
}
function renderPets(){
 $("#pets").innerHTML=save.pets.length?save.pets.map((p,i)=>`<div class="pet-card rarity-${p.rarity} ${save.activePet===i?"active":""}"><div style="font-size:30px">${p.icon}</div><h3>${p.name}</h3><small>${p.bonus==="damage"?"Sebzés":p.bonus==="gold"?"Arany":p.bonus==="drop"?"Drop":p.bonus==="crit"?"Krit":"Minden"} +${(p.value*100).toFixed(0)}%</small><button data-pet="${i}">${save.activePet===i?"Aktív":"Aktiválás"}</button></div>`).join(""):'<p class="muted">Még nincs peted.</p>';
 $$("[data-pet]").forEach(b=>b.onclick=()=>{save.activePet=+b.dataset.pet;persist();renderAll();toast("🐾 Pet aktiválva")})
}
function summonPet(){if(save.gems<5)return toast("Nincs elég kristály.");save.gems-=5;let r=Math.random()*100,p=r<2?PET_POOL[4]:r<8?PET_POOL[3]:r<25?PET_POOL[2]:r<55?PET_POOL[1]:PET_POOL[0];save.pets.push({...p});persist();renderAll();toast(`🐾 ${p.name} érkezett!`)}
function renderDungeons(){
 $("#dungeons").innerHTML=DUNGEONS.map(d=>`<div class="dungeon-card ${power()<d.need?"locked":""}"><div style="font-size:30px">${d.icon}</div><h3>${d.name}</h3><small>Erő: ${fmt(d.need)} · Jegy: ${d.tickets}</small><p>${fmt(d.rewardGold)} 💰 + ${d.rewardGems} 💎</p><button data-dungeon="${d.id}" ${power()<d.need||save.tickets<d.tickets?"disabled":""}>Belépés</button></div>`).join("");
 $$("[data-dungeon]").forEach(b=>b.onclick=()=>runDungeon(b.dataset.dungeon))
}
function runDungeon(id){
 let d=DUNGEONS.find(x=>x.id===id);if(power()<d.need||save.tickets<d.tickets)return;save.tickets-=d.tickets;
 let playerDps=damage()*(1+critChance()),seconds=Math.ceil(d.hp/playerDps);
 $("#dungeonBattle").innerHTML=`<div style="font-size:55px">${d.icon}</div><h3>${d.name}</h3><p>Harc folyamatban... ~${seconds} mp</p>`;
 setTimeout(()=>{save.gold+=d.rewardGold;save.gems+=d.rewardGems;save.stats.goldEarned+=d.rewardGold;save.stats.dungeons++;if(Math.random()<.65)addItem(createItem());persist();renderAll();$("#dungeonBattle").innerHTML=`✅ Győzelem!<br>+${fmt(d.rewardGold)} 💰 · +${d.rewardGems} 💎`;toast("🏰 Dungeon teljesítve!")},Math.min(seconds*1000,12000))
}
function questProgress(q){return q.type==="kills"?save.kills:q.type==="goldEarned"?save.stats.goldEarned:save.stats.itemsFound}
function renderQuests(){
 $("#dailyQuests").innerHTML=DAILY.map(q=>{let p=Math.min(q.target,questProgress(q)),done=p>=q.target,claimed=save.dailyClaimed[q.id];return `<div class="quest"><div class="quest-head"><b>${q.name}</b><span>${fmt(p)} / ${fmt(q.target)}</span></div><div class="progress"><i style="width:${p/q.target*100}%"></i></div><button data-quest="${q.id}" ${!done||claimed?"disabled":""}>${claimed?"Átvéve":"Jutalom átvétele"}</button></div>`}).join("");
 $$("[data-quest]").forEach(b=>b.onclick=()=>claimQuest(b.dataset.quest));
 $("#achievements").innerHTML=ACH.map(a=>{let p=a.type==="power"?power():save.stats[a.type]??save[a.type]??0,done=p>=a.target,claimed=save.achClaimed[a.id];return `<div class="achievement"><b>${done?"🏆":"🔒"} ${a.name}</b><small>${fmt(Math.min(p,a.target))} / ${fmt(a.target)} · Jutalom: ${a.reward} 💎</small><button data-ach="${a.id}" ${!done||claimed?"disabled":""}>${claimed?"Átvéve":"Átvétel"}</button></div>`}).join("");
 $$("[data-ach]").forEach(b=>b.onclick=()=>{let a=ACH.find(x=>x.id===b.dataset.ach);save.achClaimed[a.id]=1;save.gems+=a.reward;persist();renderAll();toast("🏆 Achievement jutalom!")})
}
function claimQuest(id){let q=DAILY.find(x=>x.id===id);if(save.dailyClaimed[id]||questProgress(q)<q.target)return;save.dailyClaimed[id]=1;if(q.reward.gold)save.gold+=q.reward.gold;if(q.reward.gems)save.gems+=q.reward.gems;if(q.reward.ore)save.ore+=q.reward.ore;persist();renderAll();toast("📜 Küldetés jutalom átvéve")}
function renderStats(){
 $("#statsPanel").innerHTML=[
  ["Összerő",fmt(power())],["Összes kill",fmt(save.kills)],["Összes arany",fmt(save.stats.goldEarned)],["Talált tárgy",fmt(save.stats.itemsFound)],["Legendás drop",fmt(save.stats.legendary)],["Boss kill",fmt(save.stats.bosses)],["Dungeon",fmt(save.stats.dungeons)],["Kritikus találat",fmt(save.stats.critHits)],["Játékidő",Math.floor(save.stats.playSeconds/60)+" perc"]
 ].map(x=>`<div class="statbox"><small>${x[0]}</small><b>${x[1]}</b></div>`).join("")
}

const AURAS=[
 {id:"none",name:"Nincs aura",className:"",cost:0,need:0},
 {id:"blue",name:"Kék energia aura",className:"aura-blue",cost:1,need:1},
 {id:"purple",name:"Lila misztikus aura",className:"aura-purple",cost:2,need:2},
 {id:"crimson",name:"Bíbor démon aura",className:"aura-crimson",cost:3,need:3},
 {id:"gold",name:"Legendás arany aura",className:"aura-gold",cost:5,need:5},
 {id:"void",name:"Void isteni aura",className:"aura-void",cost:8,need:8}
];
function itemScore(it){
 if(!it)return -1;
 const st=itemStats(it),rar={normal:1,rare:1.4,epic:2,mythic:3,legendary:4}[it.rarity]||1;
 return (st.atk*8+st.def*5+st.gold*900+st.crit*1300+st.drop*1600)*(1+it.plus*.08)*rar;
}
function equipBest(){
 let changed=0;
 Object.keys(SLOT_NAMES).forEach(slot=>{
   const choices=save.inventory.filter(x=>x && x.slot===slot && Number.isFinite(Number(x.id)));
   if(!choices.length)return;
   choices.sort((a,b)=>itemScore(b)-itemScore(a));
   if(save.equipped[slot]!==choices[0].id){save.equipped[slot]=choices[0].id;changed++}
 });
 persist();renderAll();
 toast(changed?`✨ EQUIP BEST: ${changed} felszerelés cserélve.`:"✨ Már a legerősebb felszerelések vannak rajtad.");
}

function renderCharacterAttributes(){
 if($("#charStatPower"))$("#charStatPower").textContent=fmt(power());
 if($("#charStatDamage"))$("#charStatDamage").textContent=fmt(damage());
 if($("#charStatLuck"))$("#charStatLuck").textContent=fmt(save.base.luck + save.paragonStats.drop);
 if($("#charStatCrit"))$("#charStatCrit").textContent=(critChance()*100).toFixed(1)+"%";
 if($("#charStatDrop"))$("#charStatDrop").textContent=(dropBonus()*100).toFixed(1)+"%";
 if($("#charStatLevel"))$("#charStatLevel").textContent=save.level;
 if($("#charStatParagon"))$("#charStatParagon").textContent=save.paragonLevel;
 if($("#charStatPrestige"))$("#charStatPrestige").textContent=save.prestigeLevel;
 if($("#charStatPoints"))$("#charStatPoints").textContent=save.paragonPoints;
 if($("#charStatAuraTokens"))$("#charStatAuraTokens").textContent=save.auraTokens;
 if($("#charStatWave"))$("#charStatWave").textContent=save.wave;
 if($("#charStatKills"))$("#charStatKills").textContent=fmt(save.kills);
}

function renderV5Character(){
 // V15 uses a completely new character DOM.
 // Keep this function for old saves/pages, but never let missing legacy IDs break the app.
 if(!$("#v5HeroHead"))return;
 const slotMap={
  helmet:["v5Helmet",".v5-slot-head"],weapon:["v5Weapon",".v5-slot-weapon"],
  armor:["v5Armor",".v5-slot-armor"],gloves:["v5Gloves",".v5-slot-gloves"],
  boots:["v5Boots",".v5-slot-boots"],ring:["v5Ring",".v5-slot-ring"]
 };
 Object.entries(slotMap).forEach(([slot,[id,selector]])=>{
   const it=equipObj(slot),el=$("#"+id),box=$(selector);
   if(el)el.textContent=it?`${it.name} +${Math.max(0,Math.min(15,Number(it.plus||0)))}`:"Üres";
   if(box){
    box.classList.remove("rarity-normal","rarity-rare","rarity-epic","rarity-mythic","rarity-legendary");
    if(it)box.classList.add("rarity-"+it.rarity);
   }
 });
}
function renderWave(){
 const pairs=[
  ["waveNumber",save.wave],
  ["waveKills",save.waveKills],
  ["waveGoal",save.waveGoal],
  ["waveState",save.waveBoss?"BOSS HARC":"Normál farm"],
  ["bossState",save.waveBoss?`${fmt(Math.max(0,enemyHp))} HP`:"Wave végén"]
 ];
 pairs.forEach(([id,val])=>{const el=$("#"+id);if(el)el.textContent=val});
}
function renderParagon(){
 const eligible=save.level>=200;
 const setText=(id,val)=>{const e=$("#"+id);if(e)e.textContent=val};

 setText("prestigeLevel",save.prestigeLevel);
 setText("paragonLevel",save.paragonLevel);
 setText("paragonPoints",save.paragonPoints);
 setText("auraTokens",save.auraTokens);

 setText("v15Prestige",save.prestigeLevel);
 setText("v15ParagonTop",save.paragonLevel);
 setText("v15StatPoints",save.paragonPoints);
 setText("v15AuraTokens",save.auraTokens);

 const prog=$("#prestigeProgress");
 if(prog)prog.style.width=Math.min(100,save.level/200*100)+"%";
 const text=$("#prestigeText");
 if(text)text.textContent=eligible
   ?`Prestige elérhető! Lv.${save.level} → +1 Prestige, +1 Paragon, +5 statpont, +1 aura token.`
   :`Még ${Math.max(0,200-save.level)} szint kell a következő Prestige-hez.`;
 const btn=$("#prestigeBtn");
 if(btn)btn.disabled=!eligible;

 const stats=[
  ["damage","⚔️ Sebzés","+2% / pont"],
  ["gold","💰 Arany","+3% / pont"],
  ["drop","🎁 Drop","+1% / pont"],
  ["crit","🎯 Krit","+0.5% / pont"]
 ];
 const ps=$("#paragonStats");
 if(ps){
   ps.innerHTML=stats.map(x=>`<div class="paragon-row"><div><b>${x[1]}</b><small>${x[2]} · Pont: ${save.paragonStats[x[0]]}</small></div><button data-paragon="${x[0]}" ${save.paragonPoints<=0?"disabled":""}>+1</button></div>`).join("");
   $$("[data-paragon]").forEach(b=>b.onclick=()=>{if(save.paragonPoints<=0)return;save.paragonPoints--;save.paragonStats[b.dataset.paragon]++;persist();renderAll()});
 }

 const shop=$("#auraShop");
 if(shop){
   shop.innerHTML=AURAS.map(a=>{
     const owned=save.ownedAuras.includes(a.id),active=save.activeAura===a.id,locked=save.prestigeLevel<a.need;
     return `<div class="aura-card ${active?"active":""}"><b>✨ ${a.name}</b><small>${a.id==="none"?"Alap":`Prestige ${a.need} · ${a.cost} Aura token`}</small><button data-aura="${a.id}" ${locked?"disabled":""}>${active?"Aktív":owned?"Aktiválás":"Megvásárlás"}</button></div>`
   }).join("");
   $$("[data-aura]").forEach(b=>b.onclick=()=>buyOrEquipAura(b.dataset.aura));
 }
}
function doPrestige(){
 if(save.level<200)return;
 if(!confirm("Prestige után a normál szinted, XP-d és alap fejlesztéseid újraindulnak. Inventory, felszerelés, petek, paragon és prestige megmarad. Folytatod?"))return;
 save.prestigeLevel++;save.paragonLevel++;save.paragonPoints+=5;save.auraTokens++;
 save.level=1;save.xp=0;save.zone=0;save.wave=1;save.waveKills=0;save.waveGoal=10;save.waveBoss=false;
 save.base={weaponTraining:1,armorTraining:1,mining:1,luck:1};
 enemyHp=ZONES[0].hp;
 persist();renderAll();toast("🌟 PRESTIGE! +1 Paragon · +5 statpont · +1 aura token");
}
function buyOrEquipAura(id){
 const a=AURAS.find(x=>x.id===id);if(!a)return;
 if(!save.ownedAuras.includes(id)){
   if(save.prestigeLevel<a.need)return toast("🔒 Magasabb Prestige szint szükséges.");
   if(save.auraTokens<a.cost)return toast("Nincs elég Aura token.");
   save.auraTokens-=a.cost;save.ownedAuras.push(id);
 }
 save.activeAura=id;persist();renderAll();toast("✨ Aura aktiválva: "+a.name);
}
$("#equipBestBtn")?.addEventListener("click",equipBest);
$("#prestigeBtn")?.addEventListener("click",doPrestige);



function renderVisibleHeroEquipment(){
 const slots={
  helmet:["heroEquipHelmet"],
  armor:["heroEquipArmor"],
  weapon:["heroEquipWeapon"],
  gloves:["heroEquipGloveL","heroEquipGloveR"],
  boots:["heroEquipBootL","heroEquipBootR"],
  ring:["heroEquipRing"]
 };
 let equipped=[];
 Object.entries(slots).forEach(([slot,ids])=>{
   const it=equipObj(slot);
   ids.forEach(id=>{
     const el=$("#"+id);
     if(!el)return;
     el.classList.toggle("equipped",!!it);
     if(it){
       const plus=Math.max(0,Math.min(15,Number(it.plus||0)));
       el.title=`${it.name} +${plus}`;
       el.dataset.rarity=it.rarity||"normal";
     }
   });
   if(it){
     const plus=Math.max(0,Math.min(15,Number(it.plus||0)));
     equipped.push(`${SLOT_NAMES[slot]} +${plus}`);
   }
 });
 const label=$("#heroEquippedLabel");
 if(label)label.innerHTML=equipped.length
   ?`⚔️ Karakteren: <b>${equipped.join(" · ")}</b>`
   :"Nincs felszerelt tárgy";
}

function renderV15ExactCharacter(){
 if(!$("#v15Power"))return;
 renderVisibleHeroEquipment();

 const setText=(id,val)=>{const e=$("#"+id);if(e)e.textContent=val};
 setText("v15Power",fmt(power()));
 setText("v15AdminPower",fmt(power()));

 const map={
   helmet:["v15Helmet",".v15-helmet"],
   armor:["v15Armor",".v15-armor"],
   boots:["v15Boots",".v15-boots"],
   weapon:["v15Weapon",".v15-weapon"],
   gloves:["v15Gloves",".v15-gloves"],
   ring:["v15Ring",".v15-ring"]
 };
 Object.entries(map).forEach(([slot,[id,sel]])=>{
   const it=equipObj(slot),el=$("#"+id),box=$(sel);
   if(el){
     if(it){
       const plus=Math.max(0,Math.min(15,Number(it.plus||0)));
       el.textContent=`${rarityName(it.rarity)} ${SLOT_NAMES[slot]} +${plus}`;
     }else el.textContent="Üres";
   }
   if(box){
     box.classList.remove("rarity-normal","rarity-rare","rarity-epic","rarity-mythic","rarity-legendary");
     if(it)box.classList.add("rarity-"+it.rarity);
   }
 });

 const pet=petObj();
 const aura=(typeof AURAS!=="undefined" ? AURAS.find(x=>x.id===save.activeAura) : null);
 setText("v15Aura",aura?.name||"Nincs aura");
 setText("v15Pet",pet?.name||"Nincs");
 setText("v15Wave",save.wave);
 setText("v15Paragon",save.paragonLevel);
 setText("v15Prestige",save.prestigeLevel);
 setText("v15ParagonTop",save.paragonLevel);
 setText("v15StatPoints",save.paragonPoints);
 setText("v15AuraTokens",save.auraTokens);
}

function renderAll(){
 renderCore();
 renderV15ExactCharacter();
 renderCharacterVisual();
 renderV5Character();
 renderWave();
 renderParagon();
 renderZones();
 renderBaseUpgrades();
 renderInventory();
 renderUpgrade();
 renderSkills();
 renderPets();
 renderDungeons();
 renderQuests();
 renderStats();
 renderCharacterAttributes();
}
$("#bossBtn").onclick=()=>toast("👹 A boss automatikusan jön minden wave végén.");
$("#petSummon").onclick=summonPet;
$("#sellNormal").onclick=()=>{let equipped=new Set(Object.values(save.equipped));let sold=0;save.inventory=save.inventory.filter(it=>{if(it.rarity==="normal"&&!equipped.has(it.id)){save.gold+=sellValue(it);sold++;return false}return true});persist();renderAll();toast(`${sold} normál tárgy eladva`)};
$("#sortInventory").onclick=()=>{let r={legendary:5,mythic:4,epic:3,rare:2,normal:1};save.inventory.sort((a,b)=>r[b.rarity]-r[a.rarity]||b.plus-a.plus);persist();renderInventory()};
$$(".tab").forEach(t=>t.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));$$(".page").forEach(x=>x.classList.remove("active"));t.classList.add("active");$("#page-"+t.dataset.tab).classList.add("active");renderAll()});
$("#hardReset").onclick=()=>{if(confirm("Biztosan TELJESEN törlöd a játékmentést?")){localStorage.removeItem("omiIdleComplete");location.reload()}};
$("#exportBtn").onclick=()=>{let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(save,null,2)],{type:"application/json"}));a.download="omi_idle_save.json";a.click();URL.revokeObjectURL(a.href)};
$("#importBtn").onclick=()=>$("#importFile").click();
$("#importFile").onchange=e=>{let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);localStorage.setItem("omiIdleComplete",JSON.stringify(x));location.reload()}catch{toast("Hibás mentésfájl.")}};r.readAsText(f)};


// ===== ONLINE ACCOUNT / CLOUD SAVE V3 =====
let currentUser=null,authMode="login",cloudReady=false,savingCloud=false;

async function api(url,opt={}){
 const r=await fetch(url,{headers:{"Content-Type":"application/json",...(opt.headers||{})},...opt});
 const d=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(d.error||"Szerverhiba");
 return d;
}
function openAuth(mode="login"){
 authMode=mode;
 $("#authModal").classList.add("open");
 $$(".auth-switch").forEach(x=>x.classList.toggle("active",x.dataset.auth===mode));
 $("#authSubmit").textContent=mode==="login"?"Belépés":"Regisztráció";if($("#authPlayerName"))$("#authPlayerName").style.display=mode==="register"?"block":"none";
 $("#authMsg").textContent="";
}
function closeAuth(){$("#authModal").classList.remove("open")}

document.addEventListener("click",function(e){
  const btn=e.target.closest?.("#authBtn");
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  if(currentUser){
    logout();
  }else{
    openAuth("login");
  }
},true);

async function loadMe(){
 try{
   const d=await api("/api/me");
   currentUser=d.user;
   if(d.save && Object.keys(d.save).length){
     save=normalizeV6Save(d.save);
     if(save.lastDaily!==new Date().toDateString()){save.dailyClaimed={};save.lastDaily=new Date().toDateString()}
     enemyHp=ZONES[save.zone]?.hp||ZONES[0].hp;
   }
   cloudReady=true;
   $("#onlineUser").innerHTML=`<span class="online-badge">●</span> ${currentUser.player_name||currentUser.username}`;
   $("#authBtn").textContent="Kilépés";
   
   renderAll();
 }catch{
   currentUser=null;cloudReady=false;
   $("#onlineUser").textContent="👤 Vendég";
   $("#authBtn").textContent="Belépés";
   
   openAuth("login");
 }
}
async function cloudSave(){
 if(!currentUser||!cloudReady||savingCloud)return;
 savingCloud=true;
 try{
   save.last=Date.now();
   await api("/api/save",{method:"POST",body:JSON.stringify({save,power:power()})});
   $("#saveState").textContent="☁️ Felhőbe mentve";
 }catch(e){
   $("#saveState").textContent="⚠️ Mentési hiba";
 }finally{savingCloud=false}
}
async function logout(){
 try{await api("/api/logout",{method:"POST",body:"{}"})}catch{}
 currentUser=null;cloudReady=false;
 localStorage.removeItem("omiIdleComplete");
 location.reload();
}
async function loadLeaderboard(){
 try{
  const d=await api("/api/leaderboard");
  $("#leaderboard").innerHTML=`<div class="leader-row head"><span>HELY</span><span>JÁTÉKOS</span><span>ERŐ</span><span>SZINT</span><span>KILL</span></div>`+
   d.rows.map(r=>`<div class="leader-row"><span class="leader-rank">${r.rank<=3?["🥇","🥈","🥉"][r.rank-1]:"#"+r.rank}</span><span class="leader-name">${r.player_name||r.username}</span><span>${fmt(r.power)}</span><span>Lv.${r.level}</span><span>${fmt(r.kills)}</span></div>`).join("");
 }catch(e){$("#leaderboard").innerHTML=`<p class="muted">${e.message}</p>`}
}
$("#adminPanelBtn").onclick=()=>location.href="/admin";
$("#authBtn").onclick=()=>currentUser?logout():openAuth("login");
$("#authClose").onclick=closeAuth;
$("#authModal").onclick=e=>{if(e.target.id==="authModal")closeAuth()};
$$(".auth-switch").forEach(b=>b.onclick=()=>openAuth(b.dataset.auth));
$("#authSubmit").onclick=async()=>{
 try{
   const username=$("#authUsername").value.trim(),password=$("#authPassword").value,player_name=$("#authPlayerName")?.value.trim()||"";
   const d=await api(authMode==="login"?"/api/login":"/api/register",{method:"POST",body:JSON.stringify({username,password,player_name})});
   currentUser=d.user;save=normalizeV6Save(d.save||save);cloudReady=true;closeAuth();enemyHp=ZONES[save.zone]?.hp||ZONES[0].hp;renderAll();
   $("#onlineUser").innerHTML=`<span class="online-badge">●</span> ${currentUser.player_name||currentUser.username}`;$("#authBtn").textContent="Kilépés";toast("✅ Sikeres "+(authMode==="login"?"belépés":"regisztráció"));
 }catch(e){$("#authMsg").textContent="❌ "+e.message}
};
$("#leaderboardBtn").onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));$$(".page").forEach(x=>x.classList.remove("active"));$("#page-leaderboard").classList.add("active");loadLeaderboard()};
$("#refreshLeaderboard").onclick=loadLeaderboard;

// Replace local-only persistence with cloud sync in addition to browser backup.
const originalPersist=persist;
persist=function(){
 save.last=Date.now();
 localStorage.setItem("omiIdleComplete",JSON.stringify(save));
 $("#saveState").textContent=currentUser?"☁️ Mentés...":"💾 Helyi mentés";
 if(currentUser)cloudSave();
};

// Require login for meaningful online progression, but local guest can still preview.
setInterval(()=>{if(currentUser)cloudSave()},15000);
window.addEventListener("beforeunload",()=>{if(currentUser)navigator.sendBeacon&&navigator.sendBeacon("/api/save",new Blob([JSON.stringify({save,power:power()})],{type:"application/json"}))});


document.addEventListener("click",e=>{
 const slot=e.target.closest(".v5-slot");
 if(!slot)return;
 const cls=[...slot.classList];
 const map={"v5-slot-head":"helmet","v5-slot-weapon":"weapon","v5-slot-armor":"armor","v5-slot-gloves":"gloves","v5-slot-boots":"boots","v5-slot-ring":"ring"};
 const k=Object.keys(map).find(x=>cls.includes(x));
 if(!k)return;
 // visual slots are informational; equipment is changed from Inventory / Equip Best.
});

// Offline progress max 12h
let away=Math.min(43200,Math.max(0,(Date.now()-save.last)/1000));
if(away>15){
 let z=ZONES[save.zone],eff=.55+save.skills.offline*.05,kills=Math.floor(away*damage()/z.hp*eff);
 if(kills>0){let g=Math.floor(kills*z.gold*goldBonus());save.gold+=g;save.stats.goldEarned+=g;save.kills+=kills;save.xp+=kills*z.xp;toast(`🌙 Offline farm: ${fmt(kills)} kill · ${fmt(g)} arany`)}
}
while(save.xp>=needXp()){save.xp-=needXp();save.level++;save.skillPoints++}
renderAll();persist();loadMe();
// V10 combat timers are started after gameplay config loads;
setInterval(()=>{save.stats.playSeconds++;if(save.stats.playSeconds%5===0)persist()},1000);

window.OMI_CONTENT={bosses:[],items:[],pets:[],auras:[],zones:[]};fetch("/api/content-config").then(r=>r.json()).then(d=>window.OMI_CONTENT={...window.OMI_CONTENT,...(d.config||{})}).catch(()=>{});


// ================= V10 FULL COMBAT =================
const V10_DEFAULTS={
 basePlayerHp:180,hpPerLevel:12,defenseEffectPct:1.15,
 monsterDamageMult:1,bossDamageMult:1.65,bossRegenPct:.40,mobRegenPct:0,
 playerRegenPct:1.2,playerAttackSec:1,enemyAttackSec:1.35,
 respawnSec:6,respawnHpPct:100,waveKills:10,bossHpGrowthPct:18,
 bossRewardMult:1,mobDamageHpPct:2.1
};
let V10CFG={...V10_DEFAULTS};
let v10PlayerTimer=null,v10EnemyTimer=null,v10RegenTimer=null;

function v10Defense(){
 const b=bonuses();
 return Math.max(0,Math.floor((b.def||0)+(save.base?.armorTraining||1)*3+(save.level||1)*.8+save.prestigeLevel*5));
}
function v10MaxHp(){
 return Math.max(1,Math.floor(
   V10CFG.basePlayerHp+(save.level-1)*V10CFG.hpPerLevel+v10Defense()*2+save.paragonLevel*20
 ));
}
function v10BossMaxHp(){
 const z=ZONES[save.zone];
 return Math.max(z.hp,Math.floor(z.hp*(6+save.wave*(V10CFG.bossHpGrowthPct/100))));
}
function v10EnemyMaxHp(){return save.waveBoss?v10BossMaxHp():ZONES[save.zone].hp}
function v10RawEnemyDamage(){
 const z=ZONES[save.zone];
 let raw=v10MaxHp()*(V10CFG.mobDamageHpPct/100);
 raw += save.zone*5 + save.wave*.45 + z.gold*.0015;
 raw*=V10CFG.monsterDamageMult;
 if(save.waveBoss)raw*=V10CFG.bossDamageMult;
 return Math.max(1,Math.floor(raw));
}
function v10EnemyHit(){
 const reduction=Math.min(.82,v10Defense()*(V10CFG.defenseEffectPct/100));
 return Math.max(1,Math.floor(v10RawEnemyDamage()*(1-reduction)));
}
function v10IsAlive(){return !save.respawnUntil || Date.now()>=save.respawnUntil}
function v10EnsurePlayerHp(){
 const mx=v10MaxHp();
 if(!Number.isFinite(save.playerHp)||save.playerHp<=0&&!save.respawnUntil)save.playerHp=mx;
 if(save.playerHp>mx)save.playerHp=mx;
}
function v10AwardNormalKill(){
 const z=ZONES[save.zone],g=Math.floor(z.gold*goldBonus());
 save.gold+=g;save.stats.goldEarned+=g;save.xp+=z.xp;save.kills++;
 if(Math.random()<.07+save.base.mining*.005)save.ore++;
 if(Math.random()<.007+dropBonus()*.05)save.soul++;
 if(Math.random()<.006)save.tickets++;
 if(Math.random()<z.drop+dropBonus())addItem(createItem());
 while(save.xp>=needXp()){save.xp-=needXp();save.level++;save.skillPoints++;toast(`⭐ Szintlépés! Lv.${save.level}`)}
 save.waveKills++;
 if(save.waveKills>=save.waveGoal){
   save.waveBoss=true;
   save.bossHp=v10BossMaxHp();
   enemyHp=save.bossHp;
   $("#combatLog").textContent=`👹 Wave ${save.wave} BOSS érkezett! Addig nem haladsz tovább, amíg le nem győzöd.`;
 }else{
   enemyHp=z.hp;
   $("#combatLog").textContent=`${z.enemy} legyőzve · +${fmt(g)} arany · ${save.waveKills}/${save.waveGoal} kill`;
 }
}
function v10AwardBossKill(){
 const z=ZONES[save.zone];
 const reward=Math.floor(z.gold*(20+save.wave)*goldBonus()*V10CFG.bossRewardMult);
 save.gold+=reward;save.stats.goldEarned+=reward;save.gems++;save.soul++;save.stats.bosses++;
 if(Math.random()<.80)addItem(createItem());
 const oldWave=save.wave;
 save.waveBoss=false;save.wave++;save.waveKills=0;
 save.waveGoal=Math.max(1,Math.floor(V10CFG.waveKills+Math.floor(save.wave/5)*2));
 save.bossHp=0;enemyHp=z.hp;
 $("#combatLog").textContent=`🏆 Wave ${oldWave} Boss legyőzve! +${fmt(reward)} arany. Wave ${save.wave} indul.`;
 toast(`🏆 Wave ${oldWave} teljesítve!`);
}
function v10PlayerAttack(){
 if(!v10IsAlive())return;
 v10EnsurePlayerHp();
 let hit=damage(),crit=Math.random()<critChance();
 if(crit){hit*=2;save.stats.critHits++}
 enemyHp-=hit;
 if(save.waveBoss)save.bossHp=Math.max(0,enemyHp);
 if(enemyHp<=0){
   if(save.waveBoss)v10AwardBossKill();else v10AwardNormalKill();
   persist();
 }
 v10Render();
}
function v10EnemyAttack(){
 if(!v10IsAlive())return;
 v10EnsurePlayerHp();
 save.playerHp=Math.max(0,save.playerHp-v10EnemyHit());
 if(save.playerHp<=0){
   save.deaths++;
   save.respawnUntil=Date.now()+Math.max(1,V10CFG.respawnSec)*1000;
   $("#combatLog").textContent=`💀 Meghaltál! Újraéledés ${V10CFG.respawnSec} másodperc múlva. A wave megáll.`;
   persist();
 }
 v10Render();
}
function v10Regen(){
 const enemyMax=v10EnemyMaxHp();
 const regenPct=save.waveBoss?V10CFG.bossRegenPct:V10CFG.mobRegenPct;
 if(enemyHp>0&&regenPct>0){
   enemyHp=Math.min(enemyMax,enemyHp+enemyMax*(regenPct/100));
   if(save.waveBoss)save.bossHp=enemyHp;
 }
 if(!v10IsAlive()){
   const left=save.respawnUntil-Date.now();
   if(left<=0){
     save.respawnUntil=0;
     save.playerHp=Math.max(1,Math.floor(v10MaxHp()*(V10CFG.respawnHpPct/100)));
     $("#combatLog").textContent="❤️ Újraéledtél. Az automata harc folytatódik.";
     persist();
   }
 }else if(save.playerHp<v10MaxHp()&&V10CFG.playerRegenPct>0){
   save.playerHp=Math.min(v10MaxHp(),save.playerHp+v10MaxHp()*(V10CFG.playerRegenPct/100));
 }
 v10Render();
}
function v10Render(){
 v10EnsurePlayerHp();
 const mx=v10MaxHp(),hp=Math.max(0,save.playerHp),em=v10EnemyMaxHp();
 const pb=$("#playerHpBar");if(pb)pb.style.width=Math.min(100,hp/mx*100)+"%";
 if($("#playerHpText"))$("#playerHpText").textContent=`${fmt(Math.ceil(hp))} / ${fmt(mx)} HP`;
 if($("#combatDefense"))$("#combatDefense").textContent=fmt(v10Defense());
 if($("#enemyDamageText"))$("#enemyDamageText").textContent=fmt(v10EnemyHit());
 if($("#enemyRegenText"))$("#enemyRegenText").textContent=`💚 Regen ${save.waveBoss?V10CFG.bossRegenPct:V10CFG.mobRegenPct}%/mp`;
 if($("#enemyAttackSpeedText"))$("#enemyAttackSpeedText").textContent=`⏱️ ${V10CFG.enemyAttackSec} mp`;
 if($("#playerCombatState")){
   const left=Math.max(0,Math.ceil((save.respawnUntil-Date.now())/1000));
   $("#playerCombatState").textContent=v10IsAlive()?"⚔️ Automatikusan harcol":`💀 Respawn: ${left} mp`;
 }
 if($("#charStatHP"))$("#charStatHP").textContent=`${fmt(Math.ceil(hp))} / ${fmt(mx)}`;
 if($("#charStatDefense"))$("#charStatDefense").textContent=fmt(v10Defense());
 if($("#charStatDeaths"))$("#charStatDeaths").textContent=fmt(save.deaths);
 if($("#enemyHp"))$("#enemyHp").textContent=fmt(Math.max(0,Math.ceil(enemyHp)));
 if($("#enemyMaxHp"))$("#enemyMaxHp").textContent=fmt(em);
 if($("#hpbar"))$("#hpbar").style.width=Math.min(100,Math.max(0,enemyHp/em*100))+"%";
}
function v10RestartTimers(){
 if(v10PlayerTimer)clearInterval(v10PlayerTimer);
 if(v10EnemyTimer)clearInterval(v10EnemyTimer);
 if(v10RegenTimer)clearInterval(v10RegenTimer);
 v10PlayerTimer=setInterval(v10PlayerAttack,Math.max(200,V10CFG.playerAttackSec*1000));
 v10EnemyTimer=setInterval(v10EnemyAttack,Math.max(200,V10CFG.enemyAttackSec*1000));
 v10RegenTimer=setInterval(v10Regen,1000);
}
async function v10LoadGameplay(){
 try{
   const d=await fetch("/api/content-config").then(r=>r.json());
   window.OMI_CONTENT={...(window.OMI_CONTENT||{}),...(d.config||{})};
   V10CFG={...V10_DEFAULTS,...(d.config?.gameplay||{})};
 }catch(e){V10CFG={...V10_DEFAULTS}}
 save.waveGoal=Math.max(1,Number(save.waveGoal||V10CFG.waveKills));
 v10EnsurePlayerHp();
 if(save.waveBoss){
   const max=v10BossMaxHp();
   enemyHp=Math.min(max,Math.max(1,Number(save.bossHp||max)));
 }else{
   enemyHp=Math.min(ZONES[save.zone].hp,Math.max(1,enemyHp||ZONES[save.zone].hp));
 }
 v10RestartTimers();v10Render();
}
setTimeout(v10LoadGameplay,700);


// ================= V11 PVP / SHOP / DYNAMIC CONTENT =================
let V11_CONTENT={bosses:[],items:[],pets:[],auras:[],zones:[],store:{discord:"nervos11",products:[]},pvp:{minLevel:20,rewardGold:500,cooldownSec:10,ratingChange:18}};

function v11ApplyContent(){
 const c=V11_CONTENT;
 // Custom zones
 (c.zones||[]).forEach((z,i)=>{
   if(ZONES.some(x=>x._customId===z.id||x.name===z.name))return;
   ZONES.push({
    _customId:z.id||`custom-zone-${i}`,name:z.name||"Új terület",icon:z.icon||"🗺️",
    enemy:z.enemy||"Szörny",hp:Math.max(1,Number(z.hp||1000)),gold:Math.max(0,Number(z.gold||100)),
    xp:Math.max(0,Number(z.xp||20)),need:Math.max(1,Number(z.need||z.minPower||1)),
    drop:Math.max(0,Number(z.dropChance??z.drop??10))/100
   });
 });
 // Custom pets
 (c.pets||[]).forEach((p,i)=>{
   if(PET_POOL.some(x=>x._customId===p.id||x.name===p.name))return;
   PET_POOL.push({_customId:p.id||`pet-${i}`,name:p.name||"Pet",icon:p.icon||"🐾",bonus:p.bonus||"damage",value:Number(p.value??p.damageBonus??5)/100,rarity:p.rarity||"rare"});
 });
 // Custom auras
 if(typeof AURAS!=="undefined"){
  (c.auras||[]).forEach((a,i)=>{
   if(AURAS.some(x=>x._customId===a.id||x.name===a.name))return;
   AURAS.push({_customId:a.id||`aura-${i}`,id:a.id||`customAura${i}`,name:a.name||"Aura",className:a.className||"aura-gold",cost:Number(a.cost||1),need:Number(a.prestigeNeed||0)});
  });
 }
 renderAll();
}
function v11CustomItem(){
 const arr=(V11_CONTENT.items||[]).filter(x=>Number(x.minZone||0)<=save.zone);
 if(!arr.length)return null;
 const x=arr[Math.floor(Math.random()*arr.length)];
 return {id:save.uid++,slot:x.slot||"weapon",rarity:x.rarity||"rare",name:x.name||"Egyedi tárgy",plus:0,
   atk:Number(x.atk||0),def:Number(x.def||0),gold:Number(x.goldBonus||0)/100,crit:Number(x.critBonus||0)/100,drop:Number(x.dropBonus||0)/100};
}
const v11OriginalCreateItem=createItem;
createItem=function(){
 if((V11_CONTENT.items||[]).length && Math.random()<.35){
   const it=v11CustomItem();if(it)return it;
 }
 return v11OriginalCreateItem();
};

function v11Boss(){
 const arr=(V11_CONTENT.bosses||[]).filter(x=>Number(x.minLevel||1)<=save.level && Number(x.minZone||0)<=save.zone);
 if(!arr.length)return null;
 return arr[(save.wave-1)%arr.length];
}
const v11BaseBossMax=v10BossMaxHp;
v10BossMaxHp=function(){
 const b=v11Boss();
 if(!b)return v11BaseBossMax();
 const growth=1+(save.wave-1)*(V10CFG.bossHpGrowthPct/100);
 return Math.max(1,Math.floor(Number(b.hp||1000)*growth));
};
const v11BaseRawDamage=v10RawEnemyDamage;
v10RawEnemyDamage=function(){
 const b=save.waveBoss?v11Boss():null;
 if(!b)return v11BaseRawDamage();
 let raw=Number(b.damage||10)*V10CFG.bossDamageMult;
 return Math.max(1,Math.floor(raw));
};
const v11BaseAwardBoss=v10AwardBossKill;
v10AwardBossKill=function(){
 const b=v11Boss();
 if(!b)return v11BaseAwardBoss();
 const reward=Math.floor(Number(b.gold||0)*goldBonus()*V10CFG.bossRewardMult);
 save.gold+=reward;save.stats.goldEarned+=reward;
 save.xp+=Number(b.xp||0);save.gems+=Number(b.gems||0);save.soul+=Number(b.soul||0);save.stats.bosses++;
 while(save.xp>=needXp()){save.xp-=needXp();save.level++;save.skillPoints++}
 if(Math.random()<(Number(b.dropChance||80)/100))addItem(createItem());
 const old=save.wave;save.waveBoss=false;save.wave++;save.waveKills=0;save.waveGoal=Math.max(1,Math.floor(V10CFG.waveKills+Math.floor(save.wave/5)*2));save.bossHp=0;enemyHp=ZONES[save.zone].hp;
 $("#combatLog").textContent=`🏆 ${b.name||"Boss"} legyőzve! +${fmt(reward)} arany · +${fmt(Number(b.xp||0))} XP · Wave ${save.wave}`;
 toast(`🏆 ${b.name||"Boss"} legyőzve!`);persist();
};
const v11BaseRegen=v10Regen;
v10Regen=function(){
 if(save.waveBoss){
   const b=v11Boss(),old=V10CFG.bossRegenPct;
   if(b && b.regenPct!==undefined)V10CFG.bossRegenPct=Number(b.regenPct);
   v11BaseRegen();
   V10CFG.bossRegenPct=old;
 }else v11BaseRegen();
};
const v11BaseRender=v10Render;
v10Render=function(){
 v11BaseRender();
 if(save.waveBoss){
   const b=v11Boss();
   if(b){
    if($("#enemyName"))$("#enemyName").textContent=b.name||"Boss";
    if($("#enemyIcon"))$("#enemyIcon").textContent=b.icon||"👹";
    if($("#enemyRegenText"))$("#enemyRegenText").textContent=`💚 Regen ${b.regenPct??V10CFG.bossRegenPct}%/mp`;
   }
 }
};

async function v11LoadContent(){
 try{
  const d=await api("/api/content-config");
  V11_CONTENT={...V11_CONTENT,...(d.config||{}),store:{...V11_CONTENT.store,...(d.config?.store||{})},pvp:{...V11_CONTENT.pvp,...(d.config?.pvp||{})}};
  v11ApplyContent();renderStore();
 }catch(e){console.warn("V11 content",e)}
}

// PvP
async function loadPvp(){
 if(!currentUser){$("#pvpOpponents").innerHTML='<p class="muted">Jelentkezz be a PvP használatához.</p>';return}
 try{
  const d=await api("/api/pvp/opponents");
  $("#pvpRequirement").textContent=`PvP minimum szint: ${d.minLevel}`;
  if(d.locked){$("#pvpOpponents").innerHTML=`<div class="shop-warning">🔒 A PvP ${d.minLevel}. szinttől érhető el.</div>`;return}
  $("#pvpOpponents").innerHTML=d.rows.length?d.rows.map(x=>`
   <div class="pvp-player-card">
    <div class="mini-avatar">${pvpAvatarHtml(x)}</div>
    <div><b>${x.player_name}</b><small>Lv.${x.level} · Erő ${fmt(x.power)} · Rating ${x.pvp_rating}</small></div>
    <button data-pvp="${x.id}" data-pvp-name="${x.player_name}">⚔️ Párbaj</button>
   </div>`).join(""):'<p class="muted">Nincs elérhető ellenfél.</p>';
  $$("[data-pvp]").forEach(b=>b.onclick=()=>startPvp(Number(b.dataset.pvp),b.dataset.pvpName));
  loadPvpHistory();
 }catch(e){$("#pvpOpponents").innerHTML=`<p>${e.message}</p>`}
}
function pvpAvatarHtml(x){
 const inv=x.avatar?.inventory||[],eq=x.avatar?.equipped||{};
 const w=inv.find(i=>i.id===eq.weapon),a=inv.find(i=>i.id===eq.armor),h=inv.find(i=>i.id===eq.helmet);
 return `<div class="mini-head">${h?"🧙":"🙂"}</div><div class="mini-body ${a?"equipped":""}"></div><div class="mini-weapon">${w?"⚔️":""}</div>`;
}
async function startPvp(id,name){
 try{
  $("#pvpArena").innerHTML=`<div class="pvp-loading">⚔️ Párbaj indul ${name} ellen...</div>`;
  const d=await api("/api/pvp/fight",{method:"POST",body:JSON.stringify({defender_id:id})});
  animatePvp(d.battle);
 }catch(e){$("#pvpArena").innerHTML=`<div class="shop-warning">❌ ${e.message}</div>`}
}
function animatePvp(b){
 const me=b.a.id===currentUser.id?b.a:b.b,op=b.a.id===currentUser.id?b.b:b.a;
 const winner=b.winnerId===currentUser.id;
 $("#pvpArena").innerHTML=`
 <div class="pvp-stage">
  <div class="duelist"><div class="duel-avatar">🧙<span>⚔️</span></div><b>${me.name}</b><div class="duel-hp"><i id="duelMyHp"></i></div><small id="duelMyText">${fmt(me.hp)} HP</small></div>
  <div class="versus">VS</div>
  <div class="duelist"><div class="duel-avatar enemy-avatar">🧙<span>🛡️</span></div><b>${op.name}</b><div class="duel-hp"><i id="duelOpHp"></i></div><small id="duelOpText">${fmt(op.hp)} HP</small></div>
 </div><div class="pvp-result" id="pvpResult">Harc...</div>`;
 let i=0,myHp=me.hp,opHp=op.hp;
 const log=b.log||[];
 const t=setInterval(()=>{
   if(i>=log.length){clearInterval(t);$("#pvpResult").innerHTML=winner?`🏆 GYŐZELEM! +${fmt(b.rewardGold)} arany`:"💀 Vereség";loadPvp();return}
   const e=log[i++],fromMe=(e.from==="a"&&b.a.id===me.id)||(e.from==="b"&&b.b.id===me.id);
   if(fromMe)opHp=Math.max(0,opHp-e.damage);else myHp=Math.max(0,myHp-e.damage);
   $("#duelMyHp").style.width=(myHp/me.hp*100)+"%";$("#duelOpHp").style.width=(opHp/op.hp*100)+"%";
   $("#duelMyText").textContent=fmt(myHp)+" HP";$("#duelOpText").textContent=fmt(opHp)+" HP";
   $("#pvpResult").textContent=`${fromMe?me.name:op.name}: ${e.crit?"KRIT ":""}-${fmt(e.damage)}`;
 },180);
}
async function loadPvpHistory(){
 try{const d=await api("/api/pvp/history");$("#pvpHistory").innerHTML=d.rows.map(x=>`<div class="pvp-history-row"><span>${x.challenger} ⚔️ ${x.defender}</span><small>${x.winner_id===currentUser.id?"🏆 Győzelem":""}</small></div>`).join("")||'<small>Nincs párbaj.</small>'}catch{}
}
$("#refreshPvp")?.addEventListener("click",loadPvp);

// Shop
function renderStore(){
 const s=V11_CONTENT.store||{},products=s.products||[];
 $("#storeProducts").innerHTML=products.length?products.map((p,i)=>`
  <div class="store-product">
   <div class="store-icon">${p.icon||"💰"}</div><h3>${p.name||"Csomag"}</h3>
   <p>${p.description||""}</p><strong>${p.priceText||"Privát ár"}</strong>
   <button data-buy-product="${p.id||i}">💬 Vásárlási igény</button>
  </div>`).join(""):'<p class="muted">Jelenleg nincs beállított vásárlási csomag. Discord: nervos11</p>';
 $$("[data-buy-product]").forEach(b=>b.onclick=async()=>{
   if(!currentUser)return openAuth("login");
   try{const d=await api("/api/shop/request",{method:"POST",body:JSON.stringify({product_id:String(b.dataset.buyProduct),note:"Weboldalról küldött igény"})});alert(d.message)}catch(e){alert(e.message)}
 });
}
setTimeout(v11LoadContent,1000);

document.addEventListener("click",e=>{
 const t=e.target.closest('[data-tab="pvp"]');if(t)setTimeout(loadPvp,50);
 const s=e.target.closest('[data-tab="shop"]');if(s)setTimeout(renderStore,50);
});


// V15.3 - login/register click safety
function bindAuthButtonsV153(){
 const login=$("#loginBtn"), reg=$("#registerBtn");
 if(login){
   login.style.pointerEvents="auto";
   login.style.cursor="pointer";
 }
 if(reg){
   reg.style.pointerEvents="auto";
   reg.style.cursor="pointer";
 }
 const overlay=$("#authOverlay")||$(".auth-overlay")||$(".login-overlay");
 if(overlay)overlay.style.pointerEvents="auto";
}
if(document.readyState==="loading"){
 document.addEventListener("DOMContentLoaded",bindAuthButtonsV153);
}else bindAuthButtonsV153();
setTimeout(bindAuthButtonsV153,250);
