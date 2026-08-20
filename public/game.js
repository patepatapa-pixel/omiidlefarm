
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
 return Math.floor(base*(1+save.skills.power*.05))
}
function critChance(){return Math.min(.65,.05+save.skills.crit*.015+bonuses().crit)}
function goldBonus(){return 1+(save.base.armorTraining-1)*.05+save.skills.gold*.06+bonuses().gold}
function dropBonus(){return save.skills.drop*.02+bonuses().drop+(save.base.luck-1)*.01}
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
 $("#combatLog").textContent=`${z.enemy} legyőzve · +${fmt(g)} arany · +${z.xp} XP`;
 enemyHp=z.hp;persist()
}
function combatTick(){
 let hit=damage(),crit=Math.random()<critChance();
 if(crit){hit*=2;save.stats.critHits++}
 enemyHp-=hit;
 if(enemyHp<=0)kill();
 renderCore()
}
function renderCore(){
 let z=ZONES[save.zone];
 $("#gold").textContent=fmt(save.gold);$("#gems").textContent=fmt(save.gems);$("#ore").textContent=fmt(save.ore);$("#soul").textContent=fmt(save.soul);$("#tickets").textContent=fmt(save.tickets);$("#level").textContent=save.level;$("#xpText").textContent=`${fmt(save.xp)} / ${fmt(needXp())} XP`;$("#power").textContent=fmt(power());$("#rankName").textContent=rankName();$("#gps").textContent=`~${fmt(z.gold*goldBonus()*damage()/z.hp)} / mp`;
 $("#zoneName").textContent=z.name;$("#enemyIcon").textContent=z.icon;$("#enemyName").textContent=z.enemy;$("#enemyHp").textContent=fmt(Math.max(0,enemyHp));$("#enemyMaxHp").textContent=fmt(z.hp);$("#hpbar").style.width=Math.max(0,enemyHp/z.hp*100)+"%";$("#damageText").textContent=fmt(damage());$("#critText").textContent=(critChance()*100).toFixed(1)+"%";$("#dropText").textContent=(dropBonus()*100).toFixed(1)+"%";
 renderEquipped();renderBonuses()
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
function renderAll(){renderCore();renderZones();renderBaseUpgrades();renderInventory();renderUpgrade();renderSkills();renderPets();renderDungeons();renderQuests();renderStats()}
$("#bossBtn").onclick=()=>{let z=ZONES[save.zone],need=z.need*1.4;if(power()<need)return toast("👹 A boss még túl erős.");let reward=Math.floor(z.gold*30*goldBonus());save.gold+=reward;save.gems++;save.soul++;save.stats.bosses++;save.stats.goldEarned+=reward;if(Math.random()<.75)addItem(createItem());persist();renderAll();toast("🏆 Boss legyőzve!")};
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
 $("#authSubmit").textContent=mode==="login"?"Belépés":"Regisztráció";
 $("#authMsg").textContent="";
}
function closeAuth(){$("#authModal").classList.remove("open")}
async function loadMe(){
 try{
   const d=await api("/api/me");
   currentUser=d.user;
   if(d.save && Object.keys(d.save).length){
     save=d.save;
     if(save.lastDaily!==new Date().toDateString()){save.dailyClaimed={};save.lastDaily=new Date().toDateString()}
     enemyHp=ZONES[save.zone]?.hp||ZONES[0].hp;
   }
   cloudReady=true;
   $("#onlineUser").innerHTML=`<span class="online-badge">●</span> ${currentUser.username}`;
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
   d.rows.map(r=>`<div class="leader-row"><span class="leader-rank">${r.rank<=3?["🥇","🥈","🥉"][r.rank-1]:"#"+r.rank}</span><span class="leader-name">${r.username}</span><span>${fmt(r.power)}</span><span>Lv.${r.level}</span><span>${fmt(r.kills)}</span></div>`).join("");
 }catch(e){$("#leaderboard").innerHTML=`<p class="muted">${e.message}</p>`}
}
$("#authBtn").onclick=()=>currentUser?logout():openAuth("login");
$("#authClose").onclick=closeAuth;
$("#authModal").onclick=e=>{if(e.target.id==="authModal")closeAuth()};
$$(".auth-switch").forEach(b=>b.onclick=()=>openAuth(b.dataset.auth));
$("#authSubmit").onclick=async()=>{
 try{
   const username=$("#authUsername").value.trim(),password=$("#authPassword").value;
   const d=await api(authMode==="login"?"/api/login":"/api/register",{method:"POST",body:JSON.stringify({username,password})});
   currentUser=d.user;save=d.save||save;cloudReady=true;closeAuth();enemyHp=ZONES[save.zone]?.hp||ZONES[0].hp;renderAll();
   $("#onlineUser").innerHTML=`<span class="online-badge">●</span> ${currentUser.username}`;$("#authBtn").textContent="Kilépés";toast("✅ Sikeres "+(authMode==="login"?"belépés":"regisztráció"));
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

// Offline progress max 12h
let away=Math.min(43200,Math.max(0,(Date.now()-save.last)/1000));
if(away>15){
 let z=ZONES[save.zone],eff=.55+save.skills.offline*.05,kills=Math.floor(away*damage()/z.hp*eff);
 if(kills>0){let g=Math.floor(kills*z.gold*goldBonus());save.gold+=g;save.stats.goldEarned+=g;save.kills+=kills;save.xp+=kills*z.xp;toast(`🌙 Offline farm: ${fmt(kills)} kill · ${fmt(g)} arany`)}
}
while(save.xp>=needXp()){save.xp-=needXp();save.level++;save.skillPoints++}
renderAll();persist();loadMe();
setInterval(combatTick,1000);
setInterval(()=>{save.stats.playSeconds++;if(save.stats.playSeconds%5===0)persist()},1000);
