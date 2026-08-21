
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
const SKILL_TREE=[
 {key:"root",branch:"root",name:"Kalandor mag",icon:"✨",max:1,desc:"Megnyitja a három fejlődési ágat",effect:"+5% teljes sebzés"},
 {key:"power",branch:"combat",name:"Harci erő",icon:"🔥",max:5,req:["root",1],desc:"Erősebb normál támadások",effect:"+6% sebzés / pont"},
 {key:"crit",branch:"combat",name:"Kritikus ösztön",icon:"🎯",max:5,req:["power",3],desc:"Gyakoribb kritikus találat",effect:"+1,5% krit esély / pont"},
 {key:"boss",branch:"combat",name:"Bossvadász",icon:"🐲",max:5,req:["crit",3],desc:"Extra sebzés bossok ellen",effect:"+8% boss sebzés / pont"},
 {key:"gold",branch:"farm",name:"Aranyáldás",icon:"💰",max:5,req:["root",1],desc:"Több arany minden harcból",effect:"+8% arany / pont"},
 {key:"drop",branch:"farm",name:"Kincsvadász",icon:"🎁",max:5,req:["gold",3],desc:"Jobb tárgy- és ritka drop",effect:"+2% drop / pont"},
 {key:"afk",branch:"afk",name:"AFK kiképzés",icon:"💤",max:5,req:["root",1],desc:"Távollét alatt gyorsabban fejlődsz",effect:"+10% AFK farm / pont"},
 {key:"offline",branch:"afk",name:"Álomfarm",icon:"🌙",max:5,req:["afk",3],desc:"További offline kill és jutalom",effect:"+15% AFK farm / pont"},
 {key:"afkCap",branch:"afk",name:"Hosszú pihenő",icon:"⏳",max:5,req:["offline",3],desc:"Hosszabb távollétet számol el",effect:"+3 óra AFK idő / pont"},
 {key:"pet",branch:"pet",name:"Pet szinkron",icon:"🐾",max:5,req:["root",1],desc:"Felerősíti a petek bónuszait",effect:"+10% pet bónusz / pont"},
 {key:"pack",branch:"pet",name:"Falkavezér",icon:"👑",max:5,req:["pet",3],desc:"Minden felszerelt pet együtt erősödik",effect:"+10% pet bónusz / pont"}
];
function skillRank(key){return Math.max(0,Number(save?.skills?.[key]||0))}
function skillBonus(key){
 if(key==="power")return skillRank("root")*.05+skillRank("power")*.06;
 if(key==="crit")return skillRank("crit")*.015;
 if(key==="boss")return skillRank("boss")*.08;
 if(key==="gold")return skillRank("gold")*.08;
 if(key==="drop")return skillRank("drop")*.02;
 if(key==="offline")return skillRank("afk")*.10+skillRank("offline")*.15;
 if(key==="pet")return skillRank("pet")*.10+skillRank("pack")*.10;
 return 0;
}
const PET_POOL=[
 {name:"Kis Farkas",icon:"🐺",bonus:"damage",value:.08,rarity:"normal"},
 {name:"Barna Medve",icon:"🐻",bonus:"gold",value:.07,rarity:"normal"},
 {name:"Barlangi Denevér",icon:"🦇",bonus:"crit",value:.05,rarity:"normal"},
 {name:"Felderítő Holló",icon:"🐦‍⬛",bonus:"drop",value:.05,rarity:"normal"},
 {name:"Arany Róka",icon:"🦊",bonus:"gold",value:.12,rarity:"rare"},
 {name:"Hópárduc",icon:"🐆",bonus:"damage",value:.13,rarity:"rare"},
 {name:"Szerencsenyúl",icon:"🐇",bonus:"drop",value:.10,rarity:"rare"},
 {name:"Viharsólyom",icon:"🦅",bonus:"crit",value:.09,rarity:"rare"},
 {name:"Kristály Bagoly",icon:"🦉",bonus:"drop",value:.15,rarity:"epic"},
 {name:"Kristály Gólem",icon:"🗿",bonus:"damage",value:.18,rarity:"epic"},
 {name:"Holdszarvas",icon:"🦌",bonus:"gold",value:.18,rarity:"epic"},
 {name:"Fantom Macska",icon:"🐈‍⬛",bonus:"crit",value:.13,rarity:"epic"},
 {name:"Démon Kölyök",icon:"😈",bonus:"crit",value:.18,rarity:"mythic"},
 {name:"Főnix",icon:"🔥",bonus:"all",value:.08,rarity:"mythic"},
 {name:"Cerberus",icon:"🐕‍🦺",bonus:"damage",value:.24,rarity:"mythic"},
 {name:"Kincses Mimic",icon:"🧰",bonus:"gold",value:.28,rarity:"mythic"},
 {name:"Void Holló",icon:"🌌",bonus:"drop",value:.18,rarity:"mythic"},
 {name:"Mini Sárkány",icon:"🐲",bonus:"all",value:.12,rarity:"legendary"},
 {name:"Égi Kirin",icon:"🦄",bonus:"all",value:.15,rarity:"legendary"},
 {name:"Arany Griff",icon:"🦁",bonus:"damage",value:.32,rarity:"legendary"},
 {name:"Szerencseszellem",icon:"🧞",bonus:"gold",value:.36,rarity:"legendary"},
 {name:"Ősi Teknős",icon:"🐢",bonus:"drop",value:.25,rarity:"legendary"},
 {name:"Időbagoly",icon:"🦉",bonus:"crit",value:.22,rarity:"legendary"}
];
const DUNGEONS=[
 {id:"cave",name:"Kristálybarlang",icon:"💎",need:800,hp:6000,rewardGold:12000,rewardGems:1,rewardSoul:3,tickets:1},
 {id:"demon",name:"Démon erőd",icon:"🔥",need:4500,hp:35000,rewardGold:90000,rewardGems:2,rewardSoul:8,tickets:2},
 {id:"dragon",name:"Sárkányfészek",icon:"🐉",need:18000,hp:180000,rewardGold:500000,rewardGems:4,rewardSoul:16,tickets:3},
 {id:"void",name:"Void Citadella",icon:"🌌",need:65000,hp:850000,rewardGold:2500000,rewardGems:8,rewardSoul:30,tickets:5}
];
const DAILY=[
 {id:"dk25",name:"Bemelegítés",desc:"Ölj meg 25 ellenfelet",target:25,type:"kills",reward:{gold:15000}},
 {id:"dk100",name:"Harci lendület",desc:"Ölj meg 100 ellenfelet",target:100,type:"kills",reward:{ore:8}},
 {id:"dk250",name:"Szörnyirtó",desc:"Ölj meg 250 ellenfelet",target:250,type:"kills",reward:{gold:125000}},
 {id:"dk500",name:"Fáradhatatlan vadász",desc:"Ölj meg 500 ellenfelet",target:500,type:"kills",reward:{gems:2}},
 {id:"dk1000",name:"Napi mészárlás",desc:"Ölj meg 1 000 ellenfelet",target:1000,type:"kills",reward:{tickets:1,gems:2}},
 {id:"dg50k",name:"Első erszény",desc:"Szerezz 50 000 aranyat",target:50000,type:"goldEarned",reward:{ore:5}},
 {id:"dg250k",name:"Aranygyűjtő",desc:"Szerezz 250 000 aranyat",target:250000,type:"goldEarned",reward:{gold:50000}},
 {id:"dg1m",name:"Napi milliomos",desc:"Szerezz 1 000 000 aranyat",target:1000000,type:"goldEarned",reward:{gems:2}},
 {id:"dg10m",name:"Aranybánya",desc:"Szerezz 10 000 000 aranyat",target:10000000,type:"goldEarned",reward:{gems:4,tickets:1}},
 {id:"di3",name:"Kezdő kincsvadász",desc:"Találj 3 felszerelést",target:3,type:"itemsFound",reward:{ore:6}},
 {id:"di10",name:"Felszerelésvadász",desc:"Találj 10 felszerelést",target:10,type:"itemsFound",reward:{ore:15}},
 {id:"di25",name:"Teli hátizsák",desc:"Találj 25 felszerelést",target:25,type:"itemsFound",reward:{gems:2,ore:20}},
 {id:"dc25",name:"Pontos csapások",desc:"Érj el 25 kritikus találatot",target:25,type:"critHits",reward:{gold:75000}},
 {id:"dc100",name:"Kritikus vihar",desc:"Érj el 100 kritikus találatot",target:100,type:"critHits",reward:{ore:12}},
 {id:"dc300",name:"Sebezhető pont",desc:"Érj el 300 kritikus találatot",target:300,type:"critHits",reward:{gems:3}},
 {id:"db1",name:"Boss kihívó",desc:"Győzz le 1 bosst",target:1,type:"bosses",reward:{ore:10}},
 {id:"db5",name:"Bossvadász",desc:"Győzz le 5 bosst",target:5,type:"bosses",reward:{gems:3,tickets:1}},
 {id:"dd1",name:"Dungeon látogató",desc:"Teljesíts 1 dungeont",target:1,type:"dungeons",reward:{gold:100000}},
 {id:"dd3",name:"Dungeon fosztogató",desc:"Teljesíts 3 dungeont",target:3,type:"dungeons",reward:{ore:20,gems:2}},
 {id:"dt15",name:"Negyedórás kaland",desc:"Játssz 15 percet",target:900,type:"playSeconds",reward:{gold:50000}},
 {id:"dt60",name:"Kitartó kalandor",desc:"Játssz 60 percet",target:3600,type:"playSeconds",reward:{gems:2,ore:15}}
];
const ACH=[
 {id:"k1",name:"Első vér",type:"kills",target:1,points:1},{id:"k100",name:"Százados",type:"kills",target:100,points:2},{id:"k1k",name:"Ezres vadász",type:"kills",target:1000,points:3},{id:"k10k",name:"Tízezres sereg",type:"kills",target:10000,points:5},{id:"k100k",name:"Legendás szörnyirtó",type:"kills",target:100000,points:12},
 {id:"g100k",name:"Teli erszény",type:"goldEarned",target:100000,points:2},{id:"g1m",name:"Első millió",type:"goldEarned",target:1000000,points:3},{id:"g10m",name:"Aranymágnás",type:"goldEarned",target:10000000,points:5},{id:"g100m",name:"Mesés vagyon",type:"goldEarned",target:100000000,points:10},{id:"g1b",name:"Aranycsászár",type:"goldEarned",target:1000000000,points:20},
 {id:"p1k",name:"Erőre kapva",type:"power",target:1000,points:2},{id:"p10k",name:"10 000 erő",type:"power",target:10000,points:4},{id:"p100k",name:"Megállíthatatlan",type:"power",target:100000,points:8},{id:"p1m",name:"Világrengető erő",type:"power",target:1000000,points:15},
 {id:"i10",name:"Gyűjtögető",type:"itemsFound",target:10,points:2},{id:"i100",name:"Kincstárnok",type:"itemsFound",target:100,points:5},{id:"i1000",name:"Felszerelésmester",type:"itemsFound",target:1000,points:12},
 {id:"l1",name:"Legendás kezdet",type:"legendary",target:1,points:3},{id:"l10",name:"Legendavadász",type:"legendary",target:10,points:7},{id:"l100",name:"Legendák ura",type:"legendary",target:100,points:18},
 {id:"b1",name:"Első boss",type:"bosses",target:1,points:2},{id:"b25",name:"Bossvadász",type:"bosses",target:25,points:6},{id:"b100",name:"Bossok réme",type:"bosses",target:100,points:15},
 {id:"d1",name:"Első dungeon",type:"dungeons",target:1,points:2},{id:"d25",name:"Dungeon kalandor",type:"dungeons",target:25,points:7},{id:"d100",name:"Dungeon hódító",type:"dungeons",target:100,points:16},
 {id:"c100",name:"Kritikus tanonc",type:"critHits",target:100,points:2},{id:"c10k",name:"Kritikus mester",type:"critHits",target:10000,points:10},
 {id:"lv25",name:"Tapasztalt kalandor",type:"level",target:25,points:4},{id:"lv50",name:"Veterán",type:"level",target:50,points:8},{id:"lv100",name:"Századik szint",type:"level",target:100,points:16},
 {id:"w100",name:"Wave 100",type:"wave",target:100,points:5},{id:"w500",name:"Wave 500",type:"wave",target:500,points:15}
];

let save=JSON.parse(localStorage.getItem("omiIdleComplete")||"null")||{
 gold:0,gems:10,ore:0,soul:0,tickets:3,level:1,xp:0,skillPoints:0,kills:0,zone:0,
 base:{weaponTraining:1,armorTraining:1,mining:1,luck:1},skills:{power:0,gold:0,crit:0,drop:0,offline:0,pet:0},
 inventory:[],equipped:{weapon:null,helmet:null,armor:null,gloves:null,boots:null,ring:null},
 pets:[],activePet:null,activePets:[],petSlotsUnlocked:1,skillTreeVersion:3,stats:{goldEarned:0,itemsFound:0,legendary:0,bosses:0,dungeons:0,critHits:0,playSeconds:0},
 dailyClaimed:{},achClaimed:{},achievementPoints:0,dailyBaseline:null,last:Date.now(),lastDaily:new Date().toDateString(),uid:1
};
if(save.lastDaily!==new Date().toDateString()){save.dailyClaimed={};save.dailyBaseline=null;save.lastDaily=new Date().toDateString()}


function normalizeV6Save(s){
 s=s&&typeof s==="object"?s:{};
 s.gold=Number(s.gold||0);s.gems=Number(s.gems||10);s.ore=Number(s.ore||0);s.soul=Number(s.soul||0);s.tickets=Number(s.tickets||3);
 s.level=Math.max(1,Number(s.level||1));s.xp=Number(s.xp||0);s.skillPoints=Number(s.skillPoints||0);s.kills=Number(s.kills||0);s.zone=Math.max(0,Math.min(ZONES.length-1,Number(s.zone||0)));
 s.base={weaponTraining:1,armorTraining:1,mining:1,luck:1,...(s.base||{})};
 s.skills={root:0,power:0,crit:0,boss:0,gold:0,drop:0,afk:0,offline:0,afkCap:0,pet:0,pack:0,...(s.skills||{})};
 if(Number(s.skillTreeVersion||0)<3){
   s.skillPoints=Math.max(0,Math.floor(s.level/5));
   s.skills={root:0,power:0,crit:0,boss:0,gold:0,drop:0,afk:0,offline:0,afkCap:0,pet:0,pack:0};
   s.skillTreeVersion=3;s.skillResetNotice=true;
}else{
   SKILL_TREE.forEach(n=>s.skills[n.key]=Math.max(0,Math.min(n.max,Math.floor(Number(s.skills[n.key]||0)))));
}
 s.inventory=Array.isArray(s.inventory)?s.inventory:[];
 s.equipped={weapon:null,helmet:null,armor:null,gloves:null,boots:null,ring:null,...(s.equipped||{})};
 s.pets=Array.isArray(s.pets)?s.pets:[];
 s.activePets=Array.isArray(s.activePets)?s.activePets.filter(i=>Number.isInteger(i)&&i>=0&&i<s.pets.length).slice(0,4):[];
 if(!s.activePets.length&&Number.isInteger(s.activePet)&&s.activePet>=0&&s.activePet<s.pets.length)s.activePets=[s.activePet];
 s.petSlotsUnlocked=Math.max(1,Math.min(4,Math.floor(Number(s.petSlotsUnlocked||1))));
 s.activePets=s.activePets.slice(0,s.petSlotsUnlocked);s.activePet=s.activePets[0]??null;
 s.stats={goldEarned:0,itemsFound:0,legendary:0,bosses:0,dungeons:0,critHits:0,playSeconds:0,...(s.stats||{})};
 s.dailyClaimed=s.dailyClaimed||{};s.achClaimed=s.achClaimed||{};s.achievementPoints=Math.max(0,Number(s.achievementPoints||0));s.dailyBaseline=s.dailyBaseline&&typeof s.dailyBaseline==="object"?s.dailyBaseline:null;s.last=Number(s.last||Date.now());s.lastDaily=s.lastDaily||new Date().toDateString();s.uid=Math.max(1,Number(s.uid||1));
 s.wave=Math.max(1,Number(s.wave||1));s.waveKills=Math.max(0,Number(s.waveKills||0));s.waveGoal=Math.max(1,Number(s.waveGoal||10));s.waveBoss=Boolean(s.waveBoss);s.bossHp=Math.max(0,Number(s.bossHp||0));
 s.paragonLevel=Math.max(0,Number(s.paragonLevel||0));s.prestigeLevel=Math.max(0,Number(s.prestigeLevel||0));s.paragonPoints=Math.max(0,Number(s.paragonPoints||0));s.auraTokens=Math.max(0,Number(s.auraTokens||0));
 s.paragonStats={damage:0,gold:0,drop:0,crit:0,...(s.paragonStats||{})};
 s.ownedAuras=Array.isArray(s.ownedAuras)?s.ownedAuras:["none"];if(!s.ownedAuras.includes("none"))s.ownedAuras.unshift("none");
 s.activeAura=s.activeAura||"none";
 s.playerHp=Number.isFinite(Number(s.playerHp))?Number(s.playerHp):0;
 s.hpRegenLevel=Math.max(0,Number(s.hpRegenLevel||0));
 s.combatSpeed=[1,2,3,10].includes(Number(s.combatSpeed))?Number(s.combatSpeed):(Number(s.combatSpeed)===4?1:1);
 s.speed10Unlocked=Boolean(s.speed10Unlocked||s.speed4Unlocked);
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
function petObjs(){return (save.activePets||[]).map(i=>save.pets[i]).filter(Boolean).slice(0,save.petSlotsUnlocked||1)}
function petObj(){return petObjs()[0]||null}
function petScale(){return 1+skillBonus("pet")}
function bonuses(){
 let atk=0,def=0,gold=0,crit=0,drop=0;
 Object.keys(save.equipped).forEach(s=>{let it=equipObj(s);if(!it)return;let st=itemStats(it);atk+=st.atk;def+=st.def;gold+=st.gold;crit+=st.crit;drop+=st.drop});
 let pets=petObjs(), ps=petScale();
 pets.forEach(pet=>{if(pet.bonus==="damage")atk*=1+pet.value*ps;if(pet.bonus==="gold")gold+=pet.value*ps;if(pet.bonus==="crit")crit+=pet.value*ps;if(pet.bonus==="drop")drop+=pet.value*ps;if(pet.bonus==="all"){atk*=1+pet.value*ps;gold+=pet.value*ps;crit+=pet.value*.5*ps;drop+=pet.value*.5*ps}});
 return {atk,def,gold,crit,drop}
}
function damage(){
 let b=bonuses(),io=itemOptionBonuses(),base=6+save.level*1.2+save.base.weaponTraining*4+b.atk;
 let total=base*(1+skillBonus("power")+save.paragonStats.damage*.02*save.paragonLevel)*(1+io.atkPct/100);
 if(save.waveBoss)total*=1+io.bossDmg/100;
 if(save.waveBoss)total*=1+skillBonus("boss");
 return Math.floor(total)
}
function critChance(){let io=itemOptionBonuses();return Math.min(.85,.05+skillBonus("crit")+bonuses().crit+save.paragonStats.crit*.005*save.paragonLevel+io.crit/100)}
function normalGoldBonusCap(){const raw=window.OMI_CONTENT?.gameplay?.goldBonusCapPct;return Math.max(0,Number(raw??100))/100}
function normalGoldBonus(){let io=itemOptionBonuses();return Math.max(0,(save.base.armorTraining-1)*.05+skillBonus("gold")+bonuses().gold+io.gold/100)}
function paragonGoldBonus(){return Math.max(0,Number(save.paragonStats.gold||0)*.03*Math.max(0,Number(save.paragonLevel||0)))}
function goldBonus(){return 1+Math.min(normalGoldBonusCap(),normalGoldBonus())+paragonGoldBonus()}
function dropBonus(){let io=itemOptionBonuses();return skillBonus("drop")+bonuses().drop+(save.base.luck-1)*.01+save.paragonStats.drop*.01*save.paragonLevel+io.drop/100}
function power(){let b=bonuses();return Math.floor(damage()*11+b.def*7+save.level*20+save.base.mining*8+save.base.luck*8)}
function rankName(){let p=power();return p<500?"Kezdő":p<2500?"Harcos":p<10000?"Elit":p<40000?"Mester":p<120000?"Hős":"Isteni"}
function baseCost(d){return Math.floor(d.base*Math.pow(1.58,save.base[d.key]-1))}
function rarityRoll(){
 let bonus=(save.base.luck-1)*.25+skillBonus("drop")*15;
 let r=Math.random()*100;
 if(r<1+bonus*.08)return RARITIES[4];
 if(r<5+bonus*.15)return RARITIES[3];
 if(r<15+bonus*.28)return RARITIES[2];
 if(r<40+bonus*.45)return RARITIES[1];
 return RARITIES[0]
}

const ITEM_OPT_DEFS={
 atkPct:{name:"Sebzés %",desc:"A teljes sebzésedet növeli.",unit:"%",min:1,max:12},
 hpPct:{name:"Max HP %",desc:"A maximális életerődet növeli.",unit:"%",min:1,max:15},
 defPct:{name:"Védelem %",desc:"A teljes védelmedet növeli.",unit:"%",min:1,max:12},
 crit:{name:"Krit esély",desc:"Növeli a kritikus találat esélyét.",unit:"%",min:.5,max:6},
 gold:{name:"Arany bónusz",desc:"Több aranyat kapsz a farmolásból.",unit:"%",min:2,max:18},
 drop:{name:"Drop bónusz",desc:"Növeli a felszerelés dobási esélyét.",unit:"%",min:.5,max:8},
 hpRegen:{name:"HP Regen",desc:"Másodpercenként extra HP%-ot regenerálsz.",unit:"%/mp",min:.1,max:1.5},
 bossDmg:{name:"Boss sebzés",desc:"Növeli a Bossok ellen okozott sebzést.",unit:"%",min:2,max:15},
 pvpDmg:{name:"PvP sebzés",desc:"Növeli a játékosok elleni sebzést.",unit:"%",min:1,max:10}
};
function rarityOptCount(rarity){
 return {normal:1,rare:2,epic:3,mythic:4,legendary:5}[rarity]||1;
}
function optionScaleByRarity(rarity){
 return {normal:.55,rare:.72,epic:.88,mythic:1,legendary:1.18}[rarity]||.55;
}
function ensureItemOptions(it){
 if(!it)return it;
 if(!Array.isArray(it.options))it.options=[];
 if(it.options.length>5)it.options=it.options.slice(0,5);
 return it;
}
function rollItemOptions(it){
 ensureItemOptions(it);
 it.options=[];
 const count=Math.min(5,rarityOptCount(it.rarity));
 const used=[];
 for(let i=0;i<count;i++){
  const keys=Object.keys(ITEM_OPT_DEFS).filter(k=>!used.includes(k));
  if(!keys.length)break;
  const key=keys[Math.floor(Math.random()*keys.length)],d=ITEM_OPT_DEFS[key],scale=optionScaleByRarity(it.rarity);
  const value=Math.round((d.min+Math.random()*(d.max-d.min)*scale)*10)/10;
  it.options.push({key,value});used.push(key);
 }
 return it;
}
function itemOptionText(o){
 const d=ITEM_OPT_DEFS[o.key];if(!d)return `${o.key}: +${o.value}`;
 return `${d.name}: +${o.value}${d.unit}`;
}
function itemRerollCost(it){
 const r={normal:1,rare:2,epic:4,mythic:8,legendary:15}[it.rarity]||1;
 return Math.floor((1500+Number(it.plus||0)*650)*r);
}
function rerollItemOptions(id){
 const it=save.inventory.find(x=>Number(x.id)===Number(id));if(!it)return;
 const cost=itemRerollCost(it);
 if(save.gold<cost)return toast("Nincs elég arany az opciók forgatásához.");
 save.gold-=cost;rollItemOptions(it);persist();renderAll();
 toast(`🎲 ${it.name} opciói újraforgatva.`);
}
function itemOptionBonuses(){
 const out={atkPct:0,hpPct:0,defPct:0,crit:0,gold:0,drop:0,hpRegen:0,bossDmg:0,pvpDmg:0};
 Object.keys(save.equipped||{}).forEach(slot=>{
  const it=equipObj(slot);if(!it)return;
  ensureItemOptions(it);
  (it.options||[]).slice(0,5).forEach(o=>{
    if(o && out[o.key]!==undefined)out[o.key]+=Number(o.value||0);
  });
 });
 return out;
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
 return rollItemOptions(it)
}
function rarityName(k){return RARITIES.find(x=>x.key===k)?.name||k}
function sellValue(it){let r=RARITIES.find(x=>x.key===it.rarity)||RARITIES[0];return Math.floor((30+save.level*8)*(1+save.zone*.7)*r.mult*(1+it.plus*.4))}
function addItem(it){
 ensureItemOptions(it);if(!it.options.length)rollItemOptions(it);
 if(save.inventory.length>=120){save.gold+=sellValue(it);return toast("🎒 Inventory tele — tárgy automatikusan eladva.")}
 save.inventory.push(it);save.stats.itemsFound++;if(it.rarity==="legendary")save.stats.legendary++;
 $("#lastDrop").innerHTML=`<b class="rarity-${it.rarity}">${SLOT_ICONS[it.slot]} ${it.name} +${it.plus}</b><small>${rarityName(it.rarity)} · ${it.options.length}/5 opt</small>`;
 toast(`🎁 ${rarityName(it.rarity)} drop: ${it.name}`)
}
function kill(){
 let z=ZONES[save.zone],g=Math.floor(z.gold*zoneGoldMultiplier(save.zone)*goldBonus());
 save.gold+=g;save.stats.goldEarned+=g;save.xp+=z.xp;save.kills++;
 if(Math.random()<.07+save.base.mining*.005)save.ore++;
 if(Math.random()<.007+dropBonus()*.05)save.soul++;
 if(Math.random()<.006)save.tickets++;
 if(Math.random()<z.drop+dropBonus())addItem(createItem());
 while(save.xp>=needXp()){save.xp-=needXp();save.level++;toast(`⭐ Szintlépés! Lv.${save.level}`)}
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
 $("#gold").textContent=fmt(save.gold);$("#gems").textContent=fmt(save.gems);$("#ore").textContent=fmt(save.ore);$("#soul").textContent=fmt(save.soul);$("#tickets").textContent=fmt(save.tickets);$("#level").textContent=save.level;$("#xpText").textContent=`${fmt(save.xp)} / ${fmt(needXp())} XP`;$("#power").textContent=fmt(power());$("#rankName").textContent=rankName();$("#gps").textContent=`~${fmt(z.gold*zoneGoldMultiplier(save.zone)*goldBonus()*damage()/z.hp)} / mp`;
 $("#zoneName").textContent=z.name;$("#enemyIcon").textContent=z.icon;$("#enemyName").textContent=z.enemy;$("#enemyHp").textContent=fmt(Math.max(0,enemyHp));$("#enemyMaxHp").textContent=fmt(z.hp);$("#hpbar").style.width=Math.max(0,enemyHp/z.hp*100)+"%";$("#damageText").textContent=fmt(damage());$("#critText").textContent=(critChance()*100).toFixed(1)+"%";$("#dropText").textContent=(dropBonus()*100).toFixed(1)+"%";
 renderEquipped();renderBonuses();renderCharacterVisual()
}
function renderZones(){
 const best=strongestUnlockedZone();
 $("#zones").innerHTML=ZONES.map((z,i)=>{const weak=i<best,goldPct=Math.round(zoneGoldMultiplier(i)*100);return `<div class="zone ${i===save.zone?"active":""} ${power()<z.need?"locked":""} ${weak?"zone-too-weak":""}" data-zone="${i}"><b>${z.icon} ${z.name}</b><small>${z.enemy} · Ajánlott erő: ${fmt(z.need)}</small><small>Drop: ${(z.drop*100).toFixed(0)}% · 💰 Arany: ${goldPct}% · 🌊 Wave haladás</small>${weak?'<strong class="zone-cap-badge">⬆️ TÚL GYENGE TERÜLET NEKED</strong>':""}</div>`}).join("");
 $$("[data-zone]").forEach(e=>e.onclick=()=>{let i=+e.dataset.zone;if(power()<ZONES[i].need)return toast("🔒 Még nem vagy elég erős.");if(i<strongestUnlockedZone())return toast("⬆️ Túl erős vagy ehhez a területhez. Válaszd a legerősebb megnyitott területet!");save.zone=i;save.waveKills=0;save.waveBoss=false;save.bossHp=0;enemyHp=normalEnemyMaxHp();persist();renderAll();toast("🗺️ "+ZONES[i].name)})
}
function strongestUnlockedZone(){let best=0,p=power();ZONES.forEach((z,i)=>{if(p>=Number(z.need||0))best=i});return best}
function ensurePowerAppropriateZone(){const best=strongestUnlockedZone();if(save.zone<best){save.zone=best;save.waveBoss=false;save.bossHp=0;enemyHp=normalEnemyMaxHp();toast(`🗺️ Automatikus területváltás: ${ZONES[best].name}`);return true}return false}
function renderBaseUpgrades(){
 $("#baseUpgrades").innerHTML=BASE_UPS.map(d=>`<div class="upgrade-row"><div class="upgrade-icon">${d.icon}</div><div><b>${d.name} · Lv.${save.base[d.key]}</b><small>${d.desc}</small></div><button data-base="${d.key}" ${save.gold<baseCost(d)?"disabled":""}>${fmt(baseCost(d))} 💰</button></div>`).join("");
 $$("[data-base]").forEach(b=>b.onclick=()=>{let d=BASE_UPS.find(x=>x.key===b.dataset.base),c=baseCost(d);if(save.gold<c)return;save.gold-=c;save.base[d.key]++;persist();renderAll();toast("⬆️ "+d.name)})
}
function renderEquipped(){
 $("#equipped").innerHTML=Object.keys(SLOT_NAMES).map(s=>{let it=equipObj(s);return `<div class="equip-slot ${it?"rarity-"+it.rarity:""}"><small>${SLOT_ICONS[s]} ${SLOT_NAMES[s]}</small>${it?`<b>${it.name} +${it.plus}</b><small>${itemSummary(it)}</small>`:`<b>Üres</b>`}</div>`}).join("")
}
function itemSummary(it){let st=itemStats(it),a=[];if(st.atk)a.push("ATK "+fmt(st.atk));if(st.def)a.push("DEF "+fmt(st.def));if(st.gold)a.push("Arany +"+(st.gold*100).toFixed(1)+"%");if(st.crit)a.push("Krit +"+(st.crit*100).toFixed(1)+"%");if(st.drop)a.push("Drop +"+(st.drop*100).toFixed(1)+"%");return a.join(" · ")}
function renderBonuses(){let b=bonuses(),p=petObj();$("#activeBonuses").innerHTML=`<div><span>⚔️ Felszerelés ATK</span><b>${fmt(b.atk)}</b></div><div><span>💰 Arany bónusz</span><b>+${((goldBonus()-1)*100).toFixed(1)}%</b></div><div><span>🎯 Krit</span><b>${(critChance()*100).toFixed(1)}%</b></div><div><span>🎁 Drop</span><b>+${(dropBonus()*100).toFixed(1)}%</b></div><div><span>🐾 Aktív pet</span><b>${p?p.icon+" "+p.name:"Nincs"}</b></div>`}

function itemPowerScore(it){
 if(!it)return -1;
 ensureItemOptions(it);
 const st=itemStats(it);
 let score=
   Number(st.atk||0)*5+
   Number(st.def||0)*4+
   Number(st.crit||0)*1000+
   Number(st.gold||0)*450+
   Number(st.drop||0)*700+
   Number(it.plus||0)*30;

 const rarityScore={normal:0,rare:80,epic:180,mythic:320,legendary:520}[it.rarity]||0;
 score+=rarityScore;

 const optWeight={atkPct:35,hpPct:22,defPct:25,crit:42,gold:15,drop:24,hpRegen:35,bossDmg:26,pvpDmg:20};
 (it.options||[]).forEach(o=>score+=Number(o.value||0)*(optWeight[o.key]||10));
 return score;
}
function equipBestItems(){
 const slots=Object.keys(SLOT_NAMES);
 let changed=0;
 slots.forEach(slot=>{
   const candidates=save.inventory.filter(it=>it.slot===slot);
   if(!candidates.length)return;
   candidates.sort((a,b)=>itemPowerScore(b)-itemPowerScore(a));
   const best=candidates[0],current=equipObj(slot);
   if(!current||itemPowerScore(best)>itemPowerScore(current)){
     save.equipped[slot]=best.id;changed++;
   }
 });
 persist();renderAll();
 toast(changed?`⚔️ ${changed} sloton felraktam a legerősebb tárgyat.`:"✅ Már a legjobb felszerelések vannak rajtad.");
}
function deleteInventoryByRarity(rarity){
 const equipped=new Set(Object.values(save.equipped));
 const matches=save.inventory.filter(it=>it.rarity===rarity&&!equipped.has(it.id));
 if(!matches.length)return toast(`Nincs törölhető ${rarityName(rarity)} tárgy.`);
 if(!confirm(`Biztosan törlöd az összes NEM felszerelt ${rarityName(rarity)} tárgyat?\n\n${matches.length} db tárgy törlődik.`))return;
 const ids=new Set(matches.map(x=>x.id));
 save.inventory=save.inventory.filter(it=>!ids.has(it.id));
 persist();renderAll();
 toast(`🗑️ ${matches.length} db ${rarityName(rarity)} tárgy törölve.`);
}
function sellInventoryByRarity(rarity){
 const equipped=new Set(Object.values(save.equipped));
 const matches=save.inventory.filter(it=>it.rarity===rarity&&!equipped.has(it.id));
 if(!matches.length)return toast(`Nincs eladható ${rarityName(rarity)} tárgy.`);
 const total=matches.reduce((s,it)=>s+sellValue(it),0);
 if(!confirm(`Eladod az összes NEM felszerelt ${rarityName(rarity)} tárgyat?\n\n${matches.length} db · ${fmt(total)} arany`))return;
 const ids=new Set(matches.map(x=>x.id));
 save.inventory=save.inventory.filter(it=>!ids.has(it.id));
 save.gold+=total;
 persist();renderAll();
 toast(`💰 ${matches.length} db tárgy eladva · +${fmt(total)} arany`);
}

function renderInventory(){
 const equippedIds=new Set(Object.values(save.equipped).filter(x=>x!==null));
 const card=it=>{
   ensureItemOptions(it);
   const opts=it.options.slice(0,5).map(o=>`<div class="item-opt-line"><b>${itemOptionText(o)}</b><small>${ITEM_OPT_DEFS[o.key]?.desc||""}</small></div>`).join("");
   const equipped=equippedIds.has(it.id);
   return `<div class="inventory-item rarity-${it.rarity}">
    <div class="icon">${SLOT_ICONS[it.slot]}</div>
    <b>${it.name} +${Math.max(0,Math.min(15,Number(it.plus||0)))}</b>
    <small>${rarityName(it.rarity)} · ${SLOT_NAMES[it.slot]} · ${it.options.length}/5 opt</small>
    <small>${itemSummary(it)}</small>
    <div class="item-options">${opts}</div>
    <small>Eladási ár: ${fmt(sellValue(it))} 💰</small>
    <div class="actions">
      <button data-equip="${it.id}">${equipped?"Felszerelve":"Felszerel"}</button>
      <button data-reroll="${it.id}">🎲 Opt forgatás · ${fmt(itemRerollCost(it))} 💰</button>
      ${equipped?"":`<button data-sell="${it.id}">Elad</button>`}
    </div>
   </div>`
 };
 const equippedItems=Object.keys(save.equipped).map(slot=>save.inventory.find(it=>it.id===save.equipped[slot])).filter(Boolean);
 const storedItems=save.inventory.filter(it=>!equippedIds.has(it.id));
 if($("#equippedInventory"))$("#equippedInventory").innerHTML=equippedItems.length?equippedItems.map(card).join(""):'<p class="muted">Nincs felszerelt tárgy. Nyomd meg az EQUIP BEST gombot!</p>';
 $("#inventory").innerHTML=storedItems.length?storedItems.map(card).join(""):'<p class="muted">Nincs további tárgy az inventoryban.</p>';

 $$("[data-equip]").forEach(b=>b.onclick=()=>{let it=save.inventory.find(x=>x.id==b.dataset.equip);save.equipped[it.slot]=it.id;persist();renderAll();toast("🛡️ Felszerelve: "+it.name)});
 $$("[data-reroll]").forEach(b=>b.onclick=()=>rerollItemOptions(+b.dataset.reroll));
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
 if(save.skillResetNotice){
   save.skillResetNotice=false;
   setTimeout(()=>{toast("🌳 A skillfa mostantól dungeon lélekkővel fejleszthető!");persist()},80);
 }
 $("#skillPoints").textContent=fmt(save.soul);
 const unlocked=n=>!n.req||skillRank(n.req[0])>=n.req[1];
 const depth=n=>{let d=0,x=n;while(x?.req){d++;x=SKILL_TREE.find(y=>y.key===x.req[0])}return d};
 const soulCost=n=>{const rank=skillRank(n.key),d=depth(n);return 5+d*5+rank*(3+d)};
 const nodeHtml=n=>{const rank=skillRank(n.key),cost=soulCost(n),open=unlocked(n),maxed=rank>=n.max,can=open&&!maxed&&save.soul>=cost,req=n.req?SKILL_TREE.find(x=>x.key===n.req[0]):null;return `<article class="skill-tree-node branch-${n.branch} ${open?"unlocked":"locked"} ${maxed?"maxed":""}"><div class="skill-tree-icon">${open?n.icon:"🔒"}</div><div class="skill-tree-copy"><h3>${n.name}</h3><p>${n.desc}</p><strong>${n.effect}</strong>${!open?`<small>Kell: ${req?.name||"Előfeltétel"} ${n.req[1]}/${req?.max||n.req[1]}</small>`:""}</div><div class="skill-tree-rank">${rank}/${n.max}</div><button data-tree-skill="${n.key}" ${can?"":"disabled"}>${maxed?"MAX":open?`🔵 ${cost} LÉLEKKŐ`:"ZÁROLVA"}</button></article>`};
 const root=SKILL_TREE.find(n=>n.branch==="root");
 const branch=(key,title)=>`<section class="skill-tree-branch branch-${key}"><h3>${title}</h3>${SKILL_TREE.filter(n=>n.branch===key).map(nodeHtml).join('<div class="skill-tree-line"></div>')}</section>`;
 $("#skills").innerHTML=`<div class="skill-tree-v217"><div class="skill-tree-root">${nodeHtml(root)}</div><div class="skill-tree-trunk"></div><div class="skill-tree-branches">${branch("combat","⚔️ Harci ág")}${branch("farm","💰 Farm ág")}${branch("afk","💤 AFK ág")}${branch("pet","🐾 Pet ág")}</div></div>`;
 $$("[data-tree-skill]").forEach(b=>b.onclick=()=>{const n=SKILL_TREE.find(x=>x.key===b.dataset.treeSkill);if(!n||skillRank(n.key)>=n.max||!unlocked(n))return;const cost=soulCost(n);if(save.soul<cost)return toast(`Nincs elég lélekkő. Kell: ${cost}`);save.soul-=cost;save.skills[n.key]=skillRank(n.key)+1;persist();renderAll();toast(`🌟 ${n.name}: ${save.skills[n.key]}/${n.max} · -${cost} lélekkő`)});
}
const ECONOMY_DEFAULTS={
 exchange:{gems:{gold:10000000,amount:25},ore:{gold:1000000,amount:10},tickets:{gold:5000000,amount:1}},
 petSummonCost:10,petSlotCosts:[50,150,300],petSummonRates:{normal:55,rare:28,epic:12,mythic:4,legendary:1}
};
function economyCfg(){
 const raw=window.OMI_CONTENT?.economy||{};
 const offer=key=>({gold:Math.max(1,Math.floor(Number(raw.exchange?.[key]?.gold??ECONOMY_DEFAULTS.exchange[key].gold))),amount:Math.max(1,Math.floor(Number(raw.exchange?.[key]?.amount??ECONOMY_DEFAULTS.exchange[key].amount)))});
 const slots=Array.isArray(raw.petSlotCosts)?raw.petSlotCosts:ECONOMY_DEFAULTS.petSlotCosts;
 return {exchange:{gems:offer("gems"),ore:offer("ore"),tickets:offer("tickets")},petSummonCost:Math.max(1,Math.floor(Number(raw.petSummonCost??10))),petSlotCosts:[0,1,2].map(i=>Math.max(1,Math.floor(Number(slots[i]??ECONOMY_DEFAULTS.petSlotCosts[i])))),petSummonRates:{...ECONOMY_DEFAULTS.petSummonRates,...(raw.petSummonRates||{})}};
}
function renderExchange(){
 const root=$("#exchangeOffers");if(!root)return;
 const cfg=economyCfg(),defs=[{key:"gems",icon:"💎",name:"Gyémánt",field:"gems",tone:"gem"},{key:"ore",icon:"⛏️",name:"Érc",field:"ore",tone:"ore"},{key:"tickets",icon:"🎫",name:"Dungeon token",field:"tickets",tone:"ticket"}];
 if($("#exchangeGold"))$("#exchangeGold").textContent=`${fmt(save.gold)} 💰`;
 root.innerHTML=defs.map(x=>{const o=cfg.exchange[x.key],can=save.gold>=o.gold;return `<article class="exchange-offer tone-${x.tone}"><div class="exchange-offer-icon">${x.icon}</div><div class="exchange-offer-copy"><small>ARANYBÓL VÁLTHATÓ</small><h3>${x.name}</h3><div class="exchange-rate"><span>${fmt(o.gold)} 💰</span><b>→</b><strong>${fmt(o.amount)} ${x.icon}</strong></div></div><label>Csomagok<select data-exchange-count="${x.key}"><option value="1">1×</option><option value="5">5×</option><option value="10">10×</option><option value="25">25×</option></select></label><button data-exchange-buy="${x.key}" ${can?"":"disabled"}>${can?"ÁTVÁLTÁS":"NINCS ELÉG ARANY"}</button></article>`}).join("");
 $$('[data-exchange-buy]').forEach(b=>b.onclick=()=>{const key=b.dataset.exchangeBuy,def=defs.find(x=>x.key===key),count=Math.max(1,Math.floor(Number($(`[data-exchange-count="${key}"]`)?.value||1))),o=cfg.exchange[key],cost=o.gold*count,reward=o.amount*count;if(!def||save.gold<cost)return toast(`Nincs elég arany. Szükséges: ${fmt(cost)} 💰`);save.gold-=cost;save[def.field]=Number(save[def.field]||0)+reward;persist();renderAll();toast(`✅ Átváltva: ${fmt(cost)} arany → ${fmt(reward)} ${def.name}`)});
}
function petEquipScore(p){
 if(!p)return -1;
 const weights={all:3.4,damage:1.4,gold:1.2,crit:1.3,drop:1.1};
 const rarity={normal:0,rare:.0001,epic:.0002,mythic:.0003,legendary:.0004};
 return Math.max(0,Number(p.value||0))*(weights[p.bonus]||1)+(rarity[p.rarity]||0);
}
function equipBestPets(){
 const slots=Math.max(1,Math.min(4,Number(save.petSlotsUnlocked||1)));
 const ranked=save.pets.map((pet,index)=>({pet,index,score:petEquipScore(pet)})).filter(x=>x.pet).sort((a,b)=>b.score-a.score||b.index-a.index);
 if(!ranked.length)return toast("🐾 Még nincs felszerelhető peted.");
 const selected=ranked.slice(0,slots).map(x=>x.index),same=selected.length===save.activePets.length&&selected.every((x,i)=>x===save.activePets[i]);
 save.activePets=selected;save.activePet=selected[0]??null;persist();renderAll();
 toast(same?"🐾 Már a legerősebb petek vannak felszerelve.":`🐾 EQUIP BEST: ${selected.length} legerősebb pet felszerelve!`);
}
function renderPets(){
 const eco=economyCfg(),costs=[0,...eco.petSlotCosts],active=save.activePets||[];
 const petBonus=p=>`${p.bonus==="damage"?"⚔️ Sebzés":p.bonus==="gold"?"💰 Arany":p.bonus==="drop"?"🎁 Drop":p.bonus==="crit"?"🎯 Krit":"✨ Minden"} +${(Number(p.value||0)*100).toFixed(0)}%`;
 if($("#petSlots"))$("#petSlots").innerHTML=[0,1,2,3].map(i=>{
   const petIndex=active[i],pet=petIndex!==undefined?save.pets[petIndex]:null;
   if(i>=save.petSlotsUnlocked)return `<article class="pet-slot-card pet-slot-locked"><div class="pet-slot-top"><span class="pet-slot-number">${i+1}. PETHELY</span><span class="pet-slot-lock">🔒 ZÁROLVA</span></div><div class="pet-slot-price"><small>FELOLDÁSI ÁR</small><strong>💎 ${costs[i]}</strong><span>GYÉMÁNT</span></div><button class="pet-slot-buy" data-buy-pet-slot="${i}">🔓 HELY FELOLDÁSA</button></article>`;
   if(pet)return `<article class="pet-slot-card pet-slot-filled rarity-${pet.rarity||"normal"} fusion-${window.v231PetTier?.(pet)||"common"}"><div class="pet-slot-top"><span class="pet-slot-number">${i+1}. PETHELY</span><span class="pet-slot-status">✓ FELSZERELVE</span></div><div class="pet-slot-hero"><div class="pet-slot-icon">${pet.icon||"🐾"}</div><div class="pet-slot-info"><strong>${pet.name||"Pet"}</strong><span>${petBonus(pet)}</span><small>${window.v231PetTierName?.(pet)||"Common"} kraft · ${pet.rarity||"normal"}</small></div></div><div class="pet-slot-glow"></div></article>`;
   return `<article class="pet-slot-card pet-slot-empty"><div class="pet-slot-top"><span class="pet-slot-number">${i+1}. PETHELY</span><span class="pet-slot-free">NYITVA</span></div><div class="pet-slot-empty-body"><div>＋</div><strong>ÜRES PETHELY</strong><small>Válassz egy petet az alsó listából</small></div></article>`;
 }).join("");
 $("#pets").innerHTML=save.pets.length?save.pets.map((p,i)=>`<div class="pet-card rarity-${p.rarity} fusion-${window.v231PetTier?.(p)||"common"} ${active.includes(i)?"active":""}"><div style="font-size:30px">${p.icon}</div><h3>${p.name}</h3><small>${p.bonus==="damage"?"Sebzés":p.bonus==="gold"?"Arany":p.bonus==="drop"?"Drop":p.bonus==="crit"?"Krit":"Minden"} +${(p.value*100).toFixed(0)}%</small><span class="pet-craft-tier tier-${window.v231PetTier?.(p)||"common"}">${window.v231PetTierName?.(p)||"Common"}</span><button data-pet="${i}">${active.includes(i)?"Levétel":"Felszerelés"}</button></div>`).join(""):'<p class="muted">Még nincs peted.</p>';
 $$("[data-pet]").forEach(b=>b.onclick=()=>{const i=+b.dataset.pet,pos=save.activePets.indexOf(i);if(pos>=0)save.activePets.splice(pos,1);else if(save.activePets.length>=save.petSlotsUnlocked)return toast("🔒 Nincs több szabad pet hely.");else save.activePets.push(i);save.activePet=save.activePets[0]??null;persist();renderAll();toast(pos>=0?"🐾 Pet levéve":"🐾 Pet felszerelve")});
 $$("[data-buy-pet-slot]").forEach(b=>b.onclick=()=>{const slot=+b.dataset.buyPetSlot,cost=costs[slot];if(slot!==save.petSlotsUnlocked)return;if(save.gems<cost)return toast("Nincs elég gyémánt.");save.gems-=cost;save.petSlotsUnlocked++;persist();renderAll();toast(`🔓 ${slot+1}. pet hely feloldva!`)});
 const summonBtn=$("#petSummon");if(summonBtn)summonBtn.textContent=`🎲 Pet idézés · ${fmt(eco.petSummonCost)} 💎`;
 const rates=$("#petSummonRates"),r=eco.petSummonRates;if(rates)rates.textContent=`Common ${Number(r.normal||0)}% · Rare ${Number(r.rare||0)}% · Epic ${Number(r.epic||0)}% · Mythic ${Number(r.mythic||0)}% · Legendary ${Number(r.legendary||0)}%`;
 const bestBtn=$("#equipBestPets");if(bestBtn)bestBtn.onclick=e=>{e.preventDefault();equipBestPets()};
}
function summonPet(){const eco=economyCfg(),cost=eco.petSummonCost;if(save.gems<cost)return toast(`Nincs elég gyémánt. A pet idézés ára ${fmt(cost)} 💎.`);save.gems-=cost;const rates=eco.petSummonRates,order=["normal","rare","epic","mythic","legendary"],weights=order.map(k=>Math.max(0,Number(rates[k]||0))),total=weights.reduce((a,b)=>a+b,0)||1;let roll=Math.random()*total,rarity="normal";for(let i=0;i<order.length;i++){roll-=weights[i];if(roll<=0){rarity=order[i];break}}const pool=PET_POOL.filter(p=>p.rarity===rarity),p=pool[Math.floor(Math.random()*pool.length)]||PET_POOL[0];save.pets.push({...p,fusionRarity:"common",fusionLevel:0,fusionMultiplier:1});persist();renderAll();toast(`🐾 ${p.name} érkezett! (${rarityName(p.rarity)} · Common kraftszint)`)}
function renderDungeons(){
 $("#dungeons").innerHTML=DUNGEONS.map(d=>`<div class="dungeon-card ${power()<d.need?"locked":""}"><div style="font-size:30px">${d.icon}</div><h3>${d.name}</h3><small>Erő: ${fmt(d.need)} · Jegy: ${d.tickets}</small><p>${fmt(d.rewardGold)} 💰 + ${d.rewardGems} 💎 + ${d.rewardSoul} 🔵</p><button data-dungeon="${d.id}" ${power()<d.need||save.tickets<d.tickets?"disabled":""}>Belépés</button></div>`).join("");
 $$("[data-dungeon]").forEach(b=>b.onclick=()=>runDungeon(b.dataset.dungeon))
}
function runDungeon(id){
 let d=DUNGEONS.find(x=>x.id===id);if(power()<d.need||save.tickets<d.tickets)return;save.tickets-=d.tickets;
 let playerDps=damage()*(1+critChance()),seconds=Math.ceil(d.hp/playerDps);
 $("#dungeonBattle").innerHTML=`<div style="font-size:55px">${d.icon}</div><h3>${d.name}</h3><p>Harc folyamatban... ~${seconds} mp</p>`;
 setTimeout(()=>{save.gold+=d.rewardGold;save.gems+=d.rewardGems;save.soul+=d.rewardSoul;save.stats.goldEarned+=d.rewardGold;save.stats.dungeons++;if(Math.random()<.65)addItem(createItem());persist();renderAll();$("#dungeonBattle").innerHTML=`✅ Győzelem!<br>+${fmt(d.rewardGold)} 💰 · +${d.rewardGems} 💎 · +${d.rewardSoul} 🔵`;toast("🏰 Dungeon teljesítve!")},Math.min(seconds*1000,12000))
}
function dailySnapshot(){return {kills:Number(save.kills||0),goldEarned:Number(save.stats.goldEarned||0),itemsFound:Number(save.stats.itemsFound||0),critHits:Number(save.stats.critHits||0),bosses:Number(save.stats.bosses||0),dungeons:Number(save.stats.dungeons||0),playSeconds:Number(save.stats.playSeconds||0)}}
function ensureDailyBaseline(){if(!save.dailyBaseline)save.dailyBaseline=dailySnapshot()}
function questProgress(q){ensureDailyBaseline();const now=q.type==="kills"?Number(save.kills||0):Number(save.stats[q.type]||0);return Math.max(0,now-Number(save.dailyBaseline[q.type]||0))}
function rewardText(r={}){return [["gold","💰"],["gems","💎"],["ore","⛏️"],["tickets","🎫"]].filter(([k])=>r[k]).map(([k,icon])=>`${fmt(r[k])} ${icon}`).join(" · ")}
function achievementProgress(a){return a.type==="power"?power():Number(save.stats[a.type]??save[a.type]??0)}
function achievementExchangeCfg(){
 const d={gems:{points:10,amount:5},ore:{points:5,amount:50},tickets:{points:8,amount:2}},raw=window.OMI_CONTENT?.economy?.achievementExchange||{};
 return Object.fromEntries(Object.keys(d).map(k=>[k,{points:Math.max(1,Math.floor(Number(raw[k]?.points??d[k].points))),amount:Math.max(1,Math.floor(Number(raw[k]?.amount??d[k].amount)))}]));
}
function renderQuests(){
 ensureDailyBaseline();
 $("#dailyQuests").innerHTML=DAILY.map(q=>{let p=Math.min(q.target,questProgress(q)),done=p>=q.target,claimed=save.dailyClaimed[q.id];return `<div class="quest quest-v220"><div class="quest-head"><div><b>${q.name}</b><small>${q.desc}</small></div><span>${fmt(p)} / ${fmt(q.target)}</span></div><div class="progress"><i style="width:${p/q.target*100}%"></i></div><div class="quest-reward"><span>Jutalom: ${rewardText(q.reward)}</span><button data-quest="${q.id}" ${!done||claimed?"disabled":""}>${claimed?"✓ Átvéve":done?"Átvétel":"Folyamatban"}</button></div></div>`}).join("");
 $$("[data-quest]").forEach(b=>b.onclick=()=>claimQuest(b.dataset.quest));
 $("#achievements").innerHTML=ACH.map(a=>{let p=achievementProgress(a),done=p>=a.target,claimed=save.achClaimed[a.id];return `<div class="achievement achievement-v220"><b>${done?"🏆":"🔒"} ${a.name}</b><small>${fmt(Math.min(p,a.target))} / ${fmt(a.target)} · Jutalom: ${a.points} achievement pont</small><button data-ach="${a.id}" ${!done||claimed?"disabled":""}>${claimed?"✓ Átvéve":done?`+${a.points} PONT`:"Folyamatban"}</button></div>`}).join("");
 $$("[data-ach]").forEach(b=>b.onclick=()=>{let a=ACH.find(x=>x.id===b.dataset.ach);if(!a||save.achClaimed[a.id]||achievementProgress(a)<a.target)return;save.achClaimed[a.id]=1;save.achievementPoints+=a.points;persist();renderAll();toast(`🏆 +${a.points} achievement pont!`)});
 renderAchievementExchange();
}
function renderAchievementExchange(){
 const root=$("#achievementExchange");if(!root)return;const cfg=achievementExchangeCfg(),defs={gems:{name:"Gyémánt",icon:"💎",field:"gems"},ore:{name:"Érc",icon:"⛏️",field:"ore"},tickets:{name:"Dungeon ticket",icon:"🎫",field:"tickets"}};
 if($("#achievementPoints"))$("#achievementPoints").textContent=fmt(save.achievementPoints);
 root.innerHTML=Object.entries(defs).map(([key,d])=>{const o=cfg[key],can=save.achievementPoints>=o.points;return `<article><div>${d.icon}</div><b>${o.amount} ${d.name}</b><small>${o.points} achievement pont</small><button data-ach-exchange="${key}" ${can?"":"disabled"}>${can?"BEVÁLTÁS":"KEVÉS PONT"}</button></article>`}).join("");
 $$('[data-ach-exchange]').forEach(b=>b.onclick=()=>{const key=b.dataset.achExchange,o=cfg[key],d=defs[key];if(!o||!d||save.achievementPoints<o.points)return toast("Nincs elég achievement pont.");save.achievementPoints-=o.points;save[d.field]=Number(save[d.field]||0)+o.amount;persist();renderAll();toast(`🏆 Beváltva: +${o.amount} ${d.name}`)});
}
function claimQuest(id){let q=DAILY.find(x=>x.id===id);if(!q||save.dailyClaimed[id]||questProgress(q)<q.target)return;save.dailyClaimed[id]=1;["gold","gems","ore","tickets"].forEach(k=>{if(q.reward[k])save[k]=Number(save[k]||0)+q.reward[k]});persist();renderAll();toast("📜 Küldetés jutalom átvéve")}
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
 if($("#charStatGoldDrop")){const normal=Math.min(normalGoldBonusCap(),normalGoldBonus())*100,paragon=paragonGoldBonus()*100;$("#charStatGoldDrop").textContent=`${(normal+paragon).toFixed(1)}% · normál ${normal.toFixed(1)}/${(normalGoldBonusCap()*100).toFixed(0)}%${paragon?` · Paragon +${paragon.toFixed(1)}%`:""}`}
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
 const req=paragonWaveRequirement();
 const eligible=save.wave>=req;
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
 if(prog)prog.style.width=Math.min(100,(save.wave/req)*100)+"%";

 const text=$("#prestigeText"),paragonScale=Math.max(1,save.paragonLevel);
 if(text)text.textContent=(eligible
   ?`Paragon szintlépés elérhető! Wave ${save.wave} / ${req}.`
   :`Még ${Math.max(0,req-save.wave)} wave kell a következő Paragon szinthez. Követelmény: Wave ${req}.`)+` · Paragon statok hatásszorzója: ${paragonScale}×`;

 const btn=$("#prestigeBtn");
 if(btn){
   btn.disabled=!eligible;
   btn.textContent=eligible?`🌟 PARAGON SZINTLÉPÉS`:`🌟 PARAGON · WAVE ${req}`;
 }

 const stats=[
  ["damage","⚔️ Sebzés",`+${2*paragonScale}% / pont`],
  ["gold","💰 Arany",`+${3*paragonScale}% / pont`],
  ["drop","🎁 Drop",`+${1*paragonScale}% / pont`],
  ["crit","🎯 Krit",`+${.5*paragonScale}% / pont`]
 ];
 const ps=$("#paragonStats");
 if(ps){
   ps.innerHTML=stats.map(x=>`<div class="paragon-row"><div><b>${x[1]}</b><small>${x[2]} · Pont: ${save.paragonStats[x[0]]}</small></div><div class="multi-point-actions"><button data-paragon="${x[0]}" data-amount="1" ${save.paragonPoints<=0?"disabled":""}>+1</button><button data-paragon="${x[0]}" data-amount="5" ${save.paragonPoints<=0?"disabled":""}>+5</button><button data-paragon="${x[0]}" data-amount="10" ${save.paragonPoints<=0?"disabled":""}>+10</button><button data-paragon="${x[0]}" data-amount="max" ${save.paragonPoints<=0?"disabled":""}>MAX</button></div></div>`).join("");
   $$("[data-paragon]").forEach(b=>b.onclick=()=>{if(save.paragonPoints<=0)return;let raw=b.dataset.amount;let amount=raw==="max"?save.paragonPoints:Math.min(save.paragonPoints,Math.max(1,Number(raw)||1));save.paragonPoints-=amount;save.paragonStats[b.dataset.paragon]+=amount;persist();renderAll()});
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
 const req=paragonWaveRequirement();
 if(save.wave<req)return toast(`🔒 Következő Paragon követelmény: Wave ${req}.`);

 if(!confirm(`Paragon újrakezdés?\n\nJelenlegi Paragon: ${save.paragonLevel}\nÚj Paragon: ${save.paragonLevel+1}\nAz új szinten 1 Sebzés Paragon statpont +${(save.paragonLevel+1)*2}% sebzést ad.\nJutalom: 5 új Paragon statpont és +1 Aura token\n\nRESETELŐDIK: karakterszint, XP, wave, normál statok, alap fejlesztések, teljes skillfa, inventory, felszerelés, arany, gyémánt és érc.\nMEGMARAD: kill szám, kiosztott Paragon statok, lélekkő, dungeon token, petek, aurák, achievementek és gyorsítás.`))return;

 save.paragonLevel++;
 save.paragonPoints=5;
 save.auraTokens++;

 // A normál karakter újraindul; a vagyon, kill és tartós rendszerek megmaradnak.
 save.level=1;save.xp=0;save.wave=1;save.waveKills=0;save.waveGoal=10;save.waveBoss=false;save.bossHp=0;save.zone=0;
 save.base={weaponTraining:1,armorTraining:1,mining:1,luck:1};
 save.gold=0;save.gems=0;save.ore=0;
 save.skillPoints=0;save.skills={root:0,power:0,crit:0,boss:0,gold:0,drop:0,afk:0,offline:0,afkCap:0,pet:0,pack:0};
 save.inventory=[];save.equipped={weapon:null,helmet:null,armor:null,gloves:null,boots:null,ring:null};
 save.playerHp=0;save.deaths=0;save.respawnUntil=0;enemyHp=normalEnemyMaxHp();v10EnsurePlayerHp();

 persist();
 if(currentUser&&cloudReady){cloudSave();setTimeout(()=>cloudSave(),750)}
 renderAll();
 toast(`🌟 Paragon ${save.paragonLevel}! 1 Sebzés statpont most +${save.paragonLevel*2}%-ot ad.`);
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
       el.dataset.rarity=["normal","rare","epic","mythic","legendary"].includes(it.rarity)?it.rarity:"normal";
     }else{
       delete el.dataset.rarity;
       el.removeAttribute("title");
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

function renderHpRegenAndOptions(){
 const lv=$("#hpRegenLevel"),pct=$("#hpRegenPct"),cost=$("#hpRegenCost"),btn=$("#hpRegenUpgradeBtn");
 if(lv)lv.textContent=save.hpRegenLevel||0;
 if(pct)pct.textContent=playerHpRegenPct().toFixed(2)+"% / mp";
 if(cost)cost.textContent="Ár: "+fmt(hpRegenUpgradeCost())+" arany";
 if(btn)btn.onclick=upgradeHpRegen;
 const g=$("#optionGlossary");
 if(g)g.innerHTML=Object.values(ITEM_OPT_DEFS).map(d=>`<div class="opt-help-row"><b>${d.name}</b><span>${d.min}–${d.max}${d.unit}</span><small>${d.desc}</small></div>`).join("");
}
function renderV15ExactCharacter(){
 if(!$("#page-character"))return;
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
     box.classList.remove("rarity-empty","rarity-normal","rarity-rare","rarity-epic","rarity-mythic","rarity-legendary");
     if(it){
       const rawRarity=String(it.rarity||"normal").toLowerCase(); const rarity=rawRarity==="mistic"||rawRarity==="mystic"?"mythic":(["normal","common","rare","epic","mythic","legendary"].includes(rawRarity)?(rawRarity==="common"?"normal":rawRarity):"normal");
       box.classList.add("rarity-"+rarity);
     }else{
       box.classList.add("rarity-empty");
     }
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


function normalizedRarity(r){
 r=String(r||"normal").toLowerCase();
 if(r==="common")return "normal";
 if(r==="mistic"||r==="mystic")return "mythic";
 return ["normal","rare","epic","mythic","legendary"].includes(r)?r:"normal";
}
function dynamicItemIcon(slot,it){
 const icons={helmet:"🪖",armor:"🛡️",boots:"🥾",weapon:"⚔️",gloves:"🧤",ring:"💍"};
 if(it&&it.icon)return `<img src="${it.icon}" alt="">`;
 return `<span class="v168-fallback-icon">${icons[slot]||"◆"}</span>`;
}
function renderDynamicEquipment(){
 const root=$("#dynamicEquipSlots"); if(!root)return;
 const order=["helmet","armor","boots","weapon","gloves","ring"];
 root.innerHTML=order.map(slot=>{
   const it=equipObj(slot);
   const rarity=it?normalizedRarity(it.rarity):"empty";
   const plus=it?Math.max(0,Math.min(15,Number(it.plus||0))):0;
   const rarityLabel={normal:"Common",rare:"Rare",epic:"Epic",mythic:"Mythic",legendary:"Legendary",empty:"Üres"}[rarity];
   return `<div class="v168-slot v168-${slot} rarity-${rarity}">
      <div class="v168-icon">${dynamicItemIcon(slot,it)}</div>
      <div class="v168-slottext">
        <small>${SLOT_NAMES[slot]||slot}</small>
        <b>${it?it.name:"Üres"}</b>
        <strong>${it?rarityLabel+" · +"+plus:"Nincs felszerelve"}</strong>
      </div>
    </div>`;
 }).join("");

 const weapon=equipObj("weapon");
 const hand=$("#dynWeapon");
 if(hand){
   if(weapon){
     const r=normalizedRarity(weapon.rarity);
     hand.className=`v168-hand-item rarity-${r}`;
     hand.textContent="⚔";
     hand.title=`${weapon.name} +${Number(weapon.plus||0)}`;
   }else{
     hand.className="v168-hand-item empty";
     hand.textContent="";
     hand.removeAttribute("title");
   }
 }
 const equipped=order.map(equipObj).filter(Boolean);
 const label=$("#heroEquippedLabel");
 if(label) label.textContent=equipped.length
   ? equipped.map(it=>`${it.name} +${Math.max(0,Math.min(15,Number(it.plus||0)))}`).join(" · ")
   : "Nincs felszerelt tárgy";
}


function renderV17QuickStats(){
 const set=(id,val)=>{const e=$("#"+id);if(e)e.textContent=val};
 set("v17Power",fmt(power()));
 set("v17Damage",fmt(damage()));
 const maxHp=(typeof v10MaxHp==="function")?v10MaxHp():0;
 set("v17HP",`${fmt(save.playerHp||0)} / ${fmt(maxHp)}`);
 set("v17Defense",(typeof v10Defense==="function")?fmt(v10Defense()):"0");
 set("v17Luck",fmt(save.base?.luck||0));
 set("v17Crit",(critChance()*100).toFixed(1)+"%");
 set("v17Drop",(dropBonus()*100).toFixed(1)+"%");
 set("v17Wave",save.wave||1);
}


function renderAuraPageV171(){
 const set=(id,val)=>{const e=$("#"+id);if(e)e.textContent=val};
 set("auraPagePrestige",save.prestigeLevel||0);
 set("auraPageTokens",save.auraTokens||0);
 set("auraPageParagon",save.paragonLevel||0);
}


function renderAuraPageV174(){
 const set=(id,val)=>{const e=$("#"+id);if(e)e.textContent=val};
 set("auraPagePrestige",save.prestigeLevel||0);
 set("auraPageTokens",save.auraTokens||0);
 set("auraPageParagon",save.paragonLevel||0);
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
 renderExchange();
 renderDungeons();
 renderQuests();
 renderStats();
 renderCharacterAttributes();
;renderHpRegenAndOptions();renderCombatSpeed();renderDynamicEquipment();renderV17QuickStats();renderAuraPageV171();renderAuraPageV174();window.v212RenderContextBars?.()}
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


function setAuthenticatedUI(user){
  setTimeout(()=>window.v202ApplyAdminStudioVisibility?.(),0);
 const logged=!!user;
 document.body.classList.toggle("is-authenticated",logged);
 document.body.classList.toggle("is-guest",!logged);

 const landing=$("#guestLanding"),shell=$("#gameShell");
 if(landing)landing.style.display=logged?"none":"block";
 if(shell){
   shell.classList.toggle("auth-locked",!logged);
   shell.style.display=logged?"block":"none";
 }
 const nav=document.querySelector("nav.tabs");
 if(nav)nav.style.display=logged?"flex":"none";

 const online=$("#onlineUser"),auth=$("#authBtn"),adminBtn=$("#adminPanelBtn");
 if(online)online.innerHTML=logged
   ?`<span class="online-badge">●</span> ${user.player_name||user.username}`
   :"👤 Vendég";
 if(auth)auth.textContent=logged?"Kilépés":"Belépés";
 if(adminBtn)adminBtn.style.display=logged&&user.role==="admin"?"inline-flex":"none";

 const saveState=$("#saveState");
 if(saveState)saveState.textContent=logged?"☁️ Felhő mentés":"🔒 Jelentkezz be";
}

function showLandingMessage(msg,isError=false){
 const e=$("#landingMsg");
 if(!e)return;
 e.textContent=msg||"";
 e.className=isError?"landing-error":"landing-ok";
}

async function api(url,opt={}){
 const r=await fetch(url,{credentials:"same-origin",headers:{"Content-Type":"application/json",...(opt.headers||{})},...opt});
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

async function loadMe(){
 try{
   const d=await api("/api/me");
   currentUser=d.user;
   if(d.save && Object.keys(d.save).length){
     save=normalizeV6Save(d.save);
     if(save.lastDaily!==new Date().toDateString()){save.dailyClaimed={};save.dailyBaseline=null;save.lastDaily=new Date().toDateString()}
     enemyHp=ZONES[save.zone]?.hp||ZONES[0].hp;
   }
   cloudReady=true;
   setAuthenticatedUI(currentUser);
   renderAll();
   setTimeout(()=>{if(typeof v10LoadGameplay==="function")v10LoadGameplay()},50);
 }catch(e){
   currentUser=null;
   cloudReady=false;
   setAuthenticatedUI(null);
   showLandingMessage("");
 }
}
async function cloudSave(){
 if(!currentUser||!cloudReady||savingCloud)return;
 savingCloud=true;
 try{
   save.last=Date.now();
   const d=await api("/api/save",{method:"POST",body:JSON.stringify({save,power:power()})});
   if(d.overrideApplied&&d.save){
     save=normalizeV6Save(d.save);
     localStorage.setItem("omiIdleComplete",JSON.stringify(save));
     renderAll();
     toast("🎁 Admin jutalom / módosítás megérkezett!");
   }
   $("#saveState").textContent="☁️ Felhőbe mentve";
 }catch(e){
   $("#saveState").textContent="⚠️ Mentési hiba";
 }finally{savingCloud=false}
}
async function logout(){
 try{await api("/api/logout",{method:"POST",body:"{}"})}catch{}
 currentUser=null;cloudReady=false;
 localStorage.removeItem("omiIdleComplete");
 setAuthenticatedUI(null);
 location.reload();
}
async function loadLeaderboard(){
 try{
  const d=await api("/api/leaderboard");
  $("#leaderboard").innerHTML=`<div class="leader-row head"><span>HELY</span><span>JÁTÉKOS</span><span>ERŐ</span><span>SZINT</span><span>KILL</span></div>`+
   d.rows.map(r=>{const pg=Math.max(0,Number(r.paragon_level||0));return `<div class="leader-row ${pg>0?"leader-paragon":""}"><span class="leader-rank">${r.rank<=3?["🥇","🥈","🥉"][r.rank-1]:"#"+r.rank}</span><span class="leader-name">${r.player_name||r.username}${pg>0?`<b class="paragon-rank-badge">✦ PARAGON ${pg}</b>`:""}</span><span>${fmt(r.power)}</span><span>Lv.${r.level}</span><span>${fmt(r.kills)}</span></div>`}).join("");
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
   currentUser=d.user;
   save=normalizeV6Save(d.save||save);
   cloudReady=true;
   closeAuth();
   enemyHp=ZONES[save.zone]?.hp||ZONES[0].hp;
   setAuthenticatedUI(currentUser);
   renderAll();
   setTimeout(()=>{if(typeof v10LoadGameplay==="function")v10LoadGameplay()},50);
   toast("✅ Sikeres "+(authMode==="login"?"belépés":"regisztráció"));
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
let away=Math.min((12+skillRank("afkCap")*3)*3600,Math.max(0,(Date.now()-save.last)/1000));
if(away>15){
 let z=ZONES[save.zone],eff=Math.min(3.5,.55+skillBonus("offline")),kills=Math.floor(away*damage()/z.hp*eff);
 if(kills>0){let g=Math.floor(kills*z.gold*zoneGoldMultiplier(save.zone)*goldBonus());save.gold+=g;save.stats.goldEarned+=g;save.kills+=kills;save.xp+=kills*z.xp;toast(`🌙 Offline farm: ${fmt(kills)} kill · ${fmt(g)} arany`)}
}
while(save.xp>=needXp()){save.xp-=needXp();save.level++}

async function landingLogin(){
 const username=$("#landingUsername")?.value.trim()||"";
 const password=$("#landingPassword")?.value||"";
 if(!username||!password)return showLandingMessage("Add meg a felhasználónevet és a jelszót.",true);
 const btn=$("#landingLoginBtn");
 if(btn){btn.disabled=true;btn.textContent="Belépés..."}
 try{
   const d=await api("/api/login",{method:"POST",body:JSON.stringify({username,password})});
   currentUser=d.user;
   save=normalizeV6Save(d.save||save);
   cloudReady=true;
   enemyHp=ZONES[save.zone]?.hp||ZONES[0].hp;
   setAuthenticatedUI(currentUser);
   renderAll();
   showLandingMessage("");
   toast("✅ Sikeres belépés");
   setTimeout(()=>{if(typeof v10LoadGameplay==="function")v10LoadGameplay()},50);
 }catch(e){
   showLandingMessage("❌ "+e.message,true);
 }finally{
   if(btn){btn.disabled=false;btn.textContent="⚔️ BELÉPÉS"}
 }
}
$("#landingLoginBtn")?.addEventListener("click",landingLogin);
$("#landingPassword")?.addEventListener("keydown",e=>{if(e.key==="Enter")landingLogin()});
$("#landingUsername")?.addEventListener("keydown",e=>{if(e.key==="Enter")$("#landingPassword")?.focus()});
$("#landingRegisterBtn")?.addEventListener("click",()=>openAuth("register"));


document.addEventListener("click",e=>{
 const eb=e.target.closest?.("#equipBestV163, #equipBestInventory");if(eb){e.preventDefault();equipBestItems();return}
 const d=e.target.closest?.("[data-bulk-delete]");if(d){e.preventDefault();deleteInventoryByRarity(d.dataset.bulkDelete);return}
 const s=e.target.closest?.("[data-bulk-sell]");if(s){e.preventDefault();sellInventoryByRarity(s.dataset.bulkSell);return}
});

setAuthenticatedUI(null);loadMe();
// V10 combat timers are started after gameplay config loads;
setInterval(()=>{save.stats.playSeconds++;if(save.stats.playSeconds%5===0)persist()},1000);

window.OMI_CONTENT={bosses:[],items:[],pets:[],auras:[],zones:[]};fetch("/api/content-config").then(r=>r.json()).then(d=>window.OMI_CONTENT={...window.OMI_CONTENT,...(d.config||{})}).catch(()=>{});

/* V22.29: Character blocks must never leak onto another tab. */
(function(){
 const syncCharacterVisibility=()=>{
  const page=document.getElementById("page-character");
  const tab=document.querySelector('[data-tab="character"]');
  if(!page||!tab)return;
  const stats=document.querySelector(".character-attributes.v15-attributes");
  if(stats&&stats.parentElement!==page)page.appendChild(stats);
  const visible=page.classList.contains("active")&&tab.classList.contains("active");
  page.hidden=!visible;
  document.body.classList.toggle("v229-character-visible",visible);
 };
 document.addEventListener("click",e=>{
  if(e.target.closest?.("[data-tab],#leaderboardBtn"))setTimeout(syncCharacterVisibility,0);
 },true);
 window.addEventListener("load",syncCharacterVisibility);
 setTimeout(syncCharacterVisibility,0);
})();





// ================= V19.8 LONG TERM PROGRESSION =================
function infiniteSkillBonus(level, perLevel, softcap=50){
  level=Math.max(0,Number(level||0));
  // Az első szintek gyorsabbak, később lassul, de SOHA nincs maximum.
  if(level<=softcap)return level*perLevel;
  return softcap*perLevel + Math.sqrt(level-softcap)*perLevel*4;
}
function waveHpMultiplier(wave){
  wave=Math.max(1,Number(wave||1));
  // Hosszú távú skálázás: minden wave erősebb, 100-as blokkoknál extra lépcső.
  return Math.pow(1.012,wave-1)*Math.pow(1.16,Math.floor((wave-1)/100));
}
function waveRewardMultiplier(wave){
  wave=Math.max(1,Number(wave||1));
  return 1 + (wave-1)*0.018 + Math.floor((wave-1)/100)*0.35;
}
function zoneGoldMultiplier(zoneIndex=save.zone){
  const raw=window.OMI_CONTENT?.gameplay?.zoneGoldMultipliers;
  const pct=Array.isArray(raw)?Number(raw[zoneIndex]??100):100;
  return Math.max(0,Number.isFinite(pct)?pct:100)/100;
}
function normalEnemyMaxHp(){
  const z=ZONES[save.zone]||ZONES[0];
  const g=window.OMI_CONTENT?.gameplay||{},hits=Math.max(1,Number(g.mobTargetHits||2));
  const multipliers=Array.isArray(g.zoneHpMultipliers)?g.zoneHpMultipliers:[],zoneMult=Math.max(.1,Number(multipliers[save.zone]??100)/100);
  return Math.max(1,Math.floor(Math.max(1,damage())*hits*zoneMult));
}
function waveKillRequirement(wave){
  wave=Math.max(1,Number(wave||1));
  // Farm szakaszok: később több mob kell, de nem válik unalmassá.
  return Math.min(40,10+Math.floor((wave-1)/25));
}
function applyWaveGoal(){
  save.waveGoal=waveKillRequirement(save.wave);
}

// ================= V15.5 WAVE / BOSS / PARAGON RULES =================
function paragonWaveRequirement(){
  // Paragon 1 = wave 500, Paragon 2 = 510, Paragon 3 = 520...
  return 500 + Math.max(0,Number(save.paragonLevel||0))*10;
}
function isBossCheckpointWave(wave){
  return Number(wave||1)%10===0;
}
function restartCurrentBossWave(){
  save.waveBoss=false;
  save.bossHp=0;
  save.waveKills=0;
  // A játékos ugyanazon a wave-en marad és újra teljesíti.
  enemyHp=normalEnemyMaxHp();
}

// ================= V10 FULL COMBAT =================
const V10_DEFAULTS={
 basePlayerHp:180,hpPerLevel:12,defenseEffectPct:1.15,
 monsterDamageMult:1,bossDamageMult:1.65,bossRegenPct:.40,mobRegenPct:0,
 playerRegenPct:1.2,playerAttackSec:1,enemyAttackSec:1.35,
 respawnSec:6,respawnHpPct:100,waveKills:10,bossHpGrowthPct:18,
 bossRewardMult:1,mobDamageHpPct:2.1,bossGemAmount:1,bossGemDropChance:100
};
let V10CFG={...V10_DEFAULTS};
let v10PlayerTimer=null,v10EnemyTimer=null,v10RegenTimer=null;

function v10Defense(){
 const b=bonuses(),io=itemOptionBonuses();
 return Math.max(0,Math.floor(((b.def||0)+(save.base?.armorTraining||1)*3+(save.level||1)*.8+save.prestigeLevel*5)*(1+io.defPct/100)));
}
function v10MaxHp(){
 const io=itemOptionBonuses();
 const cfg=(typeof V10CFG!=="undefined"&&V10CFG)?V10CFG:V10_DEFAULTS;
 return Math.max(1,Math.floor(
   (cfg.basePlayerHp+(save.level-1)*cfg.hpPerLevel+v10Defense()*2+save.paragonLevel*20)*(1+io.hpPct/100)
 ));
}
function v10BossMaxHp(){
 const base=normalEnemyMaxHp();
 // Boss minden 10. wave-en komoly fal, de nem irreális.
 return Math.max(base,Math.floor(base*(5.5+Math.min(12,save.wave*.012))));
}
function v10EnemyMaxHp(){return save.waveBoss?v10BossMaxHp():normalEnemyMaxHp()}
function v10RawEnemyDamage(){
 const z=ZONES[save.zone],mx=v10MaxHp();
 let raw=mx*(V10CFG.mobDamageHpPct/100);
 raw += save.zone*5 + Math.pow(save.wave,1.08)*.32 + z.gold*.0015;
 raw*=V10CFG.monsterDamageMult;
 if(save.waveBoss)raw*=V10CFG.bossDamageMult;

 // Kezdővédelem: az első területen / alacsony szinten a normál mob
 // veszélyes, de nem tud respawn-loopba zárni.
 if(!save.waveBoss && save.zone===0 && save.level<=15){
   const beginnerCap=mx*(save.level<=5?.055:.075);
   raw=Math.min(raw,beginnerCap);
 }
 return Math.max(1,Math.floor(raw));
}
function v10EnemyHit(){
 const reduction=Math.min(.82,v10Defense()*(V10CFG.defenseEffectPct/100));
 return Math.max(1,Math.floor(v10RawEnemyDamage()*(1-reduction)));
}
function v10IsAlive(){return !save.respawnUntil || Date.now()>=save.respawnUntil}
function v10EnsurePlayerHp(){
 const mx=v10MaxHp();
 if(!Number.isFinite(mx)||mx<=0)return;
 if(!Number.isFinite(save.playerHp)||save.playerHp<=0)save.playerHp=mx;
 if(save.playerHp>mx)save.playerHp=mx;
 if(save.playerHp<0)save.playerHp=mx;
}


function effectiveCombatSpeed(){
 const n=[1,2,3,10].includes(Number(save.combatSpeed))?Number(save.combatSpeed):1;
 return n===10&&!save.speed10Unlocked?3:n;
}
function setCombatSpeed(n){
 n=Number(n);
 if(![1,2,3,10].includes(n))return;

 if(n===10&&!save.speed10Unlocked){
   toast("🔒 A 10× sebesség prémium. A Feltöltés / Discord fülön 3 €.");
   const tab=$('[data-tab="shop"]');
   if(tab)tab.click();
   return;
 }
 save.combatSpeed=n;
 persist();
 if(currentUser&&cloudReady){cloudSave();setTimeout(()=>cloudSave(),750)}
 if(typeof v10RestartTimers==="function")v10RestartTimers();
 renderCombatSpeed();
 toast(`⚡ Harci / Wave sebesség: ${n}×`);
}
function renderCombatSpeed(){
 const n=effectiveCombatSpeed();
 $$(".combat-speed-btn").forEach(b=>{
   const val=Number(b.dataset.speed);
   b.classList.toggle("active",val===n);
   b.classList.toggle("locked",val===10&&!save.speed10Unlocked);
   if(val===10)b.innerHTML=save.speed10Unlocked?"⚡ 10×":"🔒 10×";
 });
 ["combatSpeedState","combatSpeedStateV163"].forEach(id=>{
   const e=$("#"+id);if(e)e.textContent=`Aktív: ${n}×`;
 });
 const premium=$("#speed10PurchaseState");
 if(premium)premium.textContent=save.speed10Unlocked?"✅ Aktiválva":"🔒 Nincs aktiválva";
}
document.addEventListener("click",e=>{
 const b=e.target.closest?.(".combat-speed-btn");
 if(!b)return;
 e.preventDefault();
 setCombatSpeed(b.dataset.speed);
});

function v161LiveHud(){
 const z=ZONES[save.zone]||ZONES[0];
 const set=(sel,val)=>{const e=$(sel);if(e)e.textContent=val};
 set("#gold",fmt(save.gold));
 set("#gems",fmt(save.gems));
 set("#ore",fmt(save.ore));
 set("#soul",fmt(save.soul));
 set("#tickets",fmt(save.tickets));
 set("#level",save.level);
 set("#xpText",`${fmt(save.xp)} / ${fmt(needXp())} XP`);
 set("#power",fmt(power()));
 set("#waveNumber",save.wave);
 set("#waveKills",save.waveKills);
 set("#waveGoal",save.waveGoal);
 set("#waveState",save.waveBoss?"👹 BOSS":"Normál farm");
 set("#gps",`~${fmt(z.gold*zoneGoldMultiplier(save.zone)*goldBonus()*damage()/Math.max(1,z.hp))} / mp`);
 if($("#charWave"))$("#charWave").textContent=save.wave;
}

function v10AwardNormalKill(){
 ensurePowerAppropriateZone();
 const z=ZONES[save.zone],g=Math.floor(z.gold*zoneGoldMultiplier(save.zone)*goldBonus()*waveRewardMultiplier(save.wave));
 save.gold+=g;save.stats.goldEarned+=g;save.xp+=z.xp;save.kills++;
 if(Math.random()<.07+save.base.mining*.005)save.ore++;
 if(Math.random()<.007+dropBonus()*.05)save.soul++;
 if(Math.random()<.006)save.tickets++;
 if(Math.random()<z.drop+dropBonus())addItem(createItem());
 while(save.xp>=needXp()){save.xp-=needXp();save.level++;toast(`⭐ Szintlépés! Lv.${save.level}`)}

 save.waveKills++;
 if(save.waveKills>=save.waveGoal){
   // A normál wave teljesítve.
   if(isBossCheckpointWave(save.wave)){
     // Minden 10. wave után automatikusan boss jön.
     save.waveBoss=true;
     save.bossHp=v10BossMaxHp();
     enemyHp=save.bossHp;
     $("#combatLog").textContent=`👹 Wave ${save.wave} BOSS érkezett! Ha legyőz, ezt a wave-et újra kell kezdened.`;
   }else{
     const old=save.wave;
     save.wave++;
     save.waveKills=0;
     applyWaveGoal();
     applyWaveGoal();
     enemyHp=normalEnemyMaxHp();
     $("#combatLog").textContent=`✅ Wave ${old} teljesítve! Következő: Wave ${save.wave}.`;
   }
 }else{
   enemyHp=normalEnemyMaxHp();
   $("#combatLog").textContent=`${z.enemy} legyőzve · +${fmt(g)} arany · Wave ${save.wave}: ${save.waveKills}/${save.waveGoal}`;
 }
 v161LiveHud();
}
function v10AwardBossKill(){
 const z=ZONES[save.zone];
 const reward=Math.floor(z.gold*zoneGoldMultiplier(save.zone)*(18+save.wave*.55)*goldBonus()*waveRewardMultiplier(save.wave)*V10CFG.bossRewardMult);
 const bossGemAmount=Math.max(0,Math.floor(Number(V10CFG.bossGemAmount??1))),bossGemChance=Math.max(0,Math.min(100,Number(V10CFG.bossGemDropChance??100)));
 const bossGemsWon=bossGemAmount>0&&Math.random()*100<bossGemChance?bossGemAmount:0;
 save.gold+=reward;save.stats.goldEarned+=reward;save.gems+=bossGemsWon;save.soul++;save.stats.bosses++;
 if(Math.random()<.80)addItem(createItem());

 const oldWave=save.wave;
 save.waveBoss=false;
 save.bossHp=0;
 save.wave++;
 save.waveKills=0;
 applyWaveGoal();
 applyWaveGoal();
 enemyHp=normalEnemyMaxHp();

 $("#combatLog").textContent=`🏆 Wave ${oldWave} Boss legyőzve! +${fmt(reward)} arany${bossGemsWon?` · +${bossGemsWon} gyémánt`:""}. Wave ${save.wave} indul.`;
 if(oldWave%100===0){
   save.gems+=3; save.soul+=3; save.ore+=25;
   toast(`💎 Wave ${oldWave} mérföldkő: +3 kristály, +3 lélekkő, +25 érc`);
 }else if(oldWave%50===0){
   save.soul+=2; save.ore+=15;
   toast(`🔮 Wave ${oldWave} mérföldkő: +2 lélekkő, +15 érc`);
 }else if(oldWave%10===0){
   save.ore+=3;
 }
 v161LiveHud();
}
function v10PlayerAttack(){
 if(!v10IsAlive())return;
 if(!save.waveBoss)ensurePowerAppropriateZone();
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
   const diedToBoss=Boolean(save.waveBoss);
   save.deaths++;
   save.playerHp=v10MaxHp(); // azonnal MAX HP
   save.respawnUntil=Date.now()+Math.max(1,V10CFG.respawnSec)*1000;

   if(diedToBoss){
     restartCurrentBossWave();
     $("#combatLog").textContent=`💀 A Boss legyőzött! Már MAX HP-n vagy; ${V10CFG.respawnSec} mp múlva újraindul a wave.`;
   }else{
     $("#combatLog").textContent=`💀 Legyőztek! MAX HP-val éledtél újra; ${V10CFG.respawnSec} mp védelem után folytatódik a farm.`;
   }
   persist();
   v161LiveHud();
 }
 v10Render();
}
function playerHpRegenPct(){
 const io=itemOptionBonuses();
 const cfg=(typeof V10CFG!=="undefined"&&V10CFG)?V10CFG:V10_DEFAULTS;
 return Math.max(0,Number(cfg.playerRegenPct||0)+Number(save.hpRegenLevel||0)*0.35+io.hpRegen);
}
function hpRegenUpgradeCost(){
 return Math.floor(2500*Math.pow(1.42,Number(save.hpRegenLevel||0)));
}
function upgradeHpRegen(){
 const cost=hpRegenUpgradeCost();
 if(save.gold<cost)return toast("Nincs elég arany a HP Regen fejlesztéshez.");
 save.gold-=cost;save.hpRegenLevel++;persist();renderAll();
 toast(`❤️ HP Regen Lv.${save.hpRegenLevel}`);
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
     save.playerHp=v10MaxHp();
     $("#combatLog").textContent="❤️ Újraéledtél. Az automata harc folytatódik.";
     persist();
   }
 }else if(save.playerHp<v10MaxHp()&&playerHpRegenPct()>0){
   save.playerHp=Math.min(v10MaxHp(),save.playerHp+v10MaxHp()*(playerHpRegenPct()/100));
 }
 v10Render();
}
function v10Render(){
 v10EnsurePlayerHp();
 v161LiveHud();
 const mx=Math.max(1,Number(v10MaxHp()||1)),hp=Math.max(0,Number(save.playerHp||0)),em=Math.max(1,Number(v10EnemyMaxHp()||1));
 const pb=$("#playerHpBar");if(pb)pb.style.width=Math.min(100,hp/mx*100)+"%";
 if($("#playerHpText"))$("#playerHpText").textContent=`${fmt(Math.ceil(hp))} / ${fmt(mx)} HP`;
 if($("#combatDefense"))$("#combatDefense").textContent=fmt(v10Defense());
 if($("#enemyDamageText"))$("#enemyDamageText").textContent=fmt(v10EnemyHit());
 if($("#enemyRegenText"))$("#enemyRegenText").textContent=`💚 Regen ${save.waveBoss?V10CFG.bossRegenPct:V10CFG.mobRegenPct}%/mp`;
 if($("#enemyAttackSpeedText"))$("#enemyAttackSpeedText").textContent=`⏱️ ${V10CFG.enemyAttackSec} mp`;
 if($("#playerCombatState")){
   const left=Math.max(0,Math.ceil((save.respawnUntil-Date.now())/1000));
   $("#playerCombatState").textContent=v10IsAlive()?"⚔️ Automatikusan harcol":`🛡️ Újraéledési védelem: ${left} mp · MAX HP`;
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
 v10PlayerTimer=setInterval(v10PlayerAttack,Math.max(90,(V10CFG.playerAttackSec*1000)/effectiveCombatSpeed()));
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
// V16.1: combat config is loaded after authenticated session only.


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
    drop:Math.max(0,Number(z.dropChance??z.drop??10))/100,maxHp:Math.max(0,Number(z.maxHp||0))||undefined
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
 save.xp+=Number(b.xp||0);
 const bossGems=Math.max(0,Math.floor(Number(b.gems||0))),gemChance=Math.max(0,Math.min(100,Number(b.gemDropChance??100)));
 const gemsWon=bossGems>0&&Math.random()*100<gemChance?bossGems:0;
 save.gems+=gemsWon;save.soul+=Number(b.soul||0);save.stats.bosses++;
 while(save.xp>=needXp()){save.xp-=needXp();save.level++}
 if(Math.random()<(Number(b.dropChance||80)/100))addItem(createItem());

 const oldWave=save.wave;
 save.waveBoss=false;
 save.bossHp=0;
 save.wave++;
 save.waveKills=0;
 applyWaveGoal();
 enemyHp=ZONES[save.zone].hp;

 $("#combatLog").textContent=`🏆 ${b.name||"Boss"} legyőzve! +${fmt(reward)} arany · +${fmt(Number(b.xp||0))} XP${gemsWon?` · +${gemsWon} gyémánt`:""} · Wave ${save.wave}`;
 toast(`🏆 ${b.name||"Boss"} legyőzve!`);
 persist();
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
  window.OMI_CONTENT={...(window.OMI_CONTENT||{}),...(d.config||{})};
  v11ApplyContent();renderStore();renderExchange();renderPets();
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

/* V19.6 Paragon separate tab */
document.addEventListener("click",function(e){
  const b=e.target.closest?.('[data-tab="paragon"]');
  if(!b)return;
  document.querySelectorAll("#gameShell .page").forEach(p=>p.classList.remove("active"));
  const p=document.getElementById("page-paragon");
  if(p)p.classList.add("active");
  document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b));
  if(typeof renderParagon==="function")renderParagon();
},true);

/* V19.7 - refresh moved Character Status on Paragon page */
document.addEventListener("click",function(e){
  const b=e.target.closest?.('[data-tab="paragon"]');
  if(!b)return;
  setTimeout(()=>{
    if(typeof renderV17QuickStats==="function")renderV17QuickStats();
    if(typeof renderParagon==="function")renderParagon();
  },0);
},true);

/* V19.8 migration / balance initialization */
try{
  applyWaveGoal();
  if(!save.waveBoss) enemyHp=normalEnemyMaxHp();
}catch(e){console.warn("V19.8 init",e)}

/* V19.9: top summary is Character-tab-only */
(function(){
  function v199CharacterHeaderOnly(){
    const isCharacter=document.getElementById("page-character")?.classList.contains("active");
    const candidates=[
      document.querySelector(".hero"),
      document.querySelector(".resources"),
      document.querySelector(".resource-grid"),
      document.querySelector(".stats-top")
    ].filter(Boolean);
    candidates.forEach(el=>{
      el.style.setProperty("display",isCharacter?"":"none",isCharacter?"":"important");
      if(isCharacter) el.style.removeProperty("display");
    });
  }
  document.addEventListener("click",e=>{
    if(e.target.closest?.("[data-tab]")) setTimeout(v199CharacterHeaderOnly,0);
  },true);
  window.addEventListener("load",v199CharacterHeaderOnly);
  setTimeout(v199CharacterHeaderOnly,0);
})();

/* ================= V20.0 CHARACTER / INVENTORY ORGANIZER ================= */
(function(){
  let inventoryHome=null, inventoryNode=null, characterHome=null;

  function textOf(el){return (el?.textContent||"").replace(/\s+/g," ").trim();}

  function markCharacterOnlyBlocks(){
    // Intro card.
    document.querySelectorAll("section,main>div,#gameShell>div").forEach(el=>{
      const t=textOf(el);
      if(t.includes("AUTOMATA FARM RPG") && t.includes("Farmolj automatikusan")){
        el.classList.add("v200-character-only");
      }
    });

    // Shared resources row.
    document.querySelectorAll("section,div").forEach(el=>{
      const t=textOf(el);
      if(
        t.includes("Arany") && t.includes("Kristály") && t.includes("Érc") &&
        t.includes("Lélekkő") && t.includes("Dungeon jegy") && t.includes("Szint") &&
        el.children.length>=4 && el.children.length<=12
      ){
        const childText=[...el.children].map(textOf).join("|");
        if(childText.includes("Arany") && childText.includes("Kristály")){
          el.classList.add("v200-character-only");
        }
      }
    });

    // Compact stat summary shown in screenshot: Erő/Sebzés/Életerő/.../Halál.
    document.querySelectorAll("section,div").forEach(el=>{
      const t=textOf(el);
      if(
        t.includes("Erő") && t.includes("Sebzés") && t.includes("Életerő") &&
        t.includes("Védelem") && t.includes("Szerencse") && t.includes("Krit") &&
        t.includes("Drop") && t.includes("Paragon") && t.includes("Prestige") &&
        t.includes("Összes kill") && t.includes("Halál")
      ){
        // Prefer the smallest matching container.
        const matchingChildren=[...el.children].filter(c=>{
          const ct=textOf(c);
          return ct.includes("Erő") && ct.includes("Sebzés") && ct.includes("Életerő") &&
                 ct.includes("Összes kill") && ct.includes("Halál");
        });
        if(!matchingChildren.length) el.classList.add("v200-character-only");
      }
    });
  }

  function setTabClass(name){
    document.body.classList.toggle("v200-character-tab",name==="character");
  }

  function findInventoryContent(){
    const page=document.getElementById("page-inventory");
    if(!page)return null;
    // Keep the page itself in place; move only its main visible child/container.
    return page.querySelector(".inventory-layout,.inventory-grid,.inventory-shell,.inventory-wrap,.card") || page.firstElementChild;
  }

  function findCharacterCore(){
    const page=document.getElementById("page-character");
    if(!page)return null;
    return page.querySelector(".v15-character-stage,.character-stage,.character-layout,.character-main,.character-card") || page.firstElementChild;
  }

  function ensureCharacterInventoryLayout(){
    const page=document.getElementById("page-character");
    const invPage=document.getElementById("page-inventory");
    if(!page||!invPage)return;

    const charCore=findCharacterCore();
    if(!charCore)return;

    if(!inventoryNode){
      inventoryNode=findInventoryContent();
      if(inventoryNode){
        inventoryHome={parent:inventoryNode.parentNode,next:inventoryNode.nextSibling};
      }
    }
    if(!inventoryNode)return;

    let layout=page.querySelector(".v200-character-inventory-layout");
    if(!layout){
      layout=document.createElement("div");
      layout.className="v200-character-inventory-layout";
      const left=document.createElement("div");
      left.className="v200-character-left";
      const right=document.createElement("div");
      right.className="v200-inventory-right";
      charCore.parentNode.insertBefore(layout,charCore);
      layout.append(left,right);
      left.appendChild(charCore);
    }

    const right=layout.querySelector(".v200-inventory-right");
    if(inventoryNode.parentNode!==right) right.appendChild(inventoryNode);
  }

  function restoreInventory(){
    if(!inventoryNode||!inventoryHome?.parent)return;
    if(inventoryNode.parentNode===inventoryHome.parent)return;
    inventoryHome.parent.insertBefore(inventoryNode,inventoryHome.next);
  }

  function applyForTab(name){
    setTabClass(name);
    if(name==="character"){
      ensureCharacterInventoryLayout();
    }else if(name==="inventory"){
      restoreInventory();
    }else{
      // On unrelated pages inventory must not leak/follow.
      restoreInventory();
    }
  }

  function fixCloudSaveWidth(){
    const candidates=[...document.querySelectorAll("header *, .topbar *")];
    const el=candidates.find(x=>/Felhőbe mentve|Mentés/.test(textOf(x)) && x.children.length===0);
    if(el)el.classList.add("v200-cloud-save-fixed");
  }

  function currentTab(){
    const active=document.querySelector("[data-tab].active");
    if(active?.dataset.tab)return active.dataset.tab;
    return document.getElementById("page-character")?.classList.contains("active")?"character":"";
  }

  document.addEventListener("click",e=>{
    const b=e.target.closest?.("[data-tab]");
    if(!b)return;
    setTimeout(()=>applyForTab(b.dataset.tab),0);
  },true);

  window.addEventListener("load",()=>{
    markCharacterOnlyBlocks();
    fixCloudSaveWidth();
    applyForTab(currentTab()||"character");
  });
  setTimeout(()=>{
    markCharacterOnlyBlocks();
    fixCloudSaveWidth();
    applyForTab(currentTab()||"character");
  },50);
})();

/* V20.1 polished character/inventory placement */
document.addEventListener("click",e=>{
  const b=e.target.closest?.("[data-tab]");
  if(!b)return;
  if(b.dataset.tab==="character"){
    setTimeout(()=>{
      if(typeof renderDynamicEquipment==="function")renderDynamicEquipment();
      if(typeof renderInventory==="function")renderInventory();
    },20);
  }
},true);

/* V20.2 - Admin Game Studio client visibility */
(function(){
  function v202IsAdmin(){
    try{
      const u=window.currentUser || (typeof currentUser!=="undefined" ? currentUser : null);
      if(!u)return false;
      const role=String(u.role||u.userRole||u.type||"").toLowerCase();
      const name=String(u.username||u.name||u.playerName||"").toLowerCase();
      return Boolean(
        u.isAdmin===true ||
        u.admin===true ||
        role==="admin" ||
        role==="administrator" ||
        name==="omiadmin"
      );
    }catch(e){
      return false;
    }
  }

  function v202ApplyAdminStudioVisibility(){
    const isAdmin=v202IsAdmin();
    document.body.classList.toggle("v202-is-admin",isAdmin);
    document.querySelectorAll("#page-character .admin-studio-panel-v230").forEach(el=>el.hidden=!isAdmin);
  }

  window.v202ApplyAdminStudioVisibility=v202ApplyAdminStudioVisibility;
  window.addEventListener("load",()=>setTimeout(v202ApplyAdminStudioVisibility,50));
  document.addEventListener("click",e=>{
    if(e.target.closest?.("[data-tab],#loginBtn,#landingLoginBtn")) {
      setTimeout(v202ApplyAdminStudioVisibility,100);
    }
  },true);
  setInterval(v202ApplyAdminStudioVisibility,1500);
})();

/* V20.4: force Equipment Management outside the character card */
(function(){
  function v204PlaceEquipmentBesideCharacter(){
    const page=document.getElementById("page-character");
    if(!page)return;
    const layout=page.querySelector(".v200-character-inventory-layout");
    if(!layout)return;
    const left=layout.querySelector(".v200-character-left");
    const right=layout.querySelector(".v200-inventory-right");
    if(!left||!right)return;

    // If equipment manager was accidentally rendered inside the character,
    // physically move its containing inventory block to the right column.
    const tool=page.querySelector(".inventory-tools-v163");
    if(tool && left.contains(tool)){
      let movable=tool;
      // Prefer moving its inventory wrapper when one exists.
      const wrapper=tool.closest(".inventory-layout,.inventory-shell,.inventory-wrap");
      if(wrapper && wrapper!==layout && !wrapper.contains(left)) movable=wrapper;
      right.appendChild(movable);
    } else if(tool && !right.contains(tool)){
      right.appendChild(tool);
    }
  }
  window.addEventListener("load",()=>setTimeout(v204PlaceEquipmentBesideCharacter,80));
  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="character"]')) setTimeout(v204PlaceEquipmentBesideCharacter,40);
  },true);
  setTimeout(v204PlaceEquipmentBesideCharacter,100);
})();

/* ================= V20.5 TRUE SEPARATE EQUIPMENT HOST ================= */
(function(){
  function place(){
    const page=document.getElementById("page-character");
    if(!page)return;

    let shell=page.querySelector(":scope > .v205-character-equipment-shell");
    if(!shell){
      shell=document.createElement("div");
      shell.className="v205-character-equipment-shell";

      const charCol=document.createElement("div");
      charCol.className="v205-character-column";
      const equipCol=document.createElement("div");
      equipCol.className="v205-equipment-column";

      shell.append(charCol,equipCol);

      // Find the existing character layout/card and put it in the left column.
      const oldLayout=page.querySelector(".v200-character-inventory-layout");
      const oldLeft=page.querySelector(".v200-character-left");
      const charNode=oldLeft || page.querySelector(".v15-character,.character-card,.v15-character-stage");
      const anchor=oldLayout || charNode;

      if(anchor) page.insertBefore(shell,anchor);
      else page.appendChild(shell);

      if(charNode){
        charCol.appendChild(charNode);
      }

      // Remove empty old layout if it no longer contains meaningful content.
      if(oldLayout && oldLayout!==charNode){
        const right=oldLayout.querySelector(".v200-inventory-right");
        if(right){
          while(right.firstChild){
            // Do not move equipment here; it is handled below.
            const n=right.firstChild;
            if(n.classList?.contains("inventory-tools-v163")) break;
            equipCol.appendChild(n);
          }
        }
        if(!oldLayout.textContent.trim() && !oldLayout.querySelector("*")) oldLayout.remove();
        else oldLayout.classList.add("v205-old-layout-hidden");
      }
    }

    const equipCol=shell.querySelector(".v205-equipment-column");
    const tool=page.querySelector(".inventory-tools-v163");
    if(tool && tool.parentNode!==equipCol){
      equipCol.prepend(tool); // physically separate sibling, never overlay
    }

    // If inventory content exists, keep it under equipment management on right.
    const oldRight=page.querySelector(".v200-inventory-right");
    if(oldRight && oldRight!==equipCol){
      [...oldRight.children].forEach(n=>{
        if(n!==tool) equipCol.appendChild(n);
      });
      oldRight.classList.add("v205-empty-hidden");
    }
  }

  window.v205PlaceEquipment=place;
  window.addEventListener("load",()=>{ setTimeout(place,50); setTimeout(place,250); });
  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="character"]')) {
      setTimeout(place,0); setTimeout(place,100);
    }
  },true);

  // Render functions can rebuild DOM, so re-check after mutations.
  const obs=new MutationObserver(()=> {
    if(document.getElementById("page-character")?.classList.contains("active")){
      requestAnimationFrame(place);
    }
  });
  window.addEventListener("load",()=>{
    const p=document.getElementById("page-character");
    if(p) obs.observe(p,{childList:true,subtree:true});
  });
})();

/* ================= V20.6 DRAGGABLE WINDOWS ================= */
(function(){
  const STORAGE_KEY="omi_v206_window_positions";

  function loadPositions(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}catch(e){return {}}
  }
  function savePositions(v){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(v))}catch(e){}
  }

  function getTargets(){
    const page=document.getElementById("page-character");
    if(!page)return [];
    return [
      {
        key:"admin",
        el:page.querySelector(".admin-studio-only-v202"),
        handleSelector:".v15-section-title"
      },
      {
        key:"character",
        el:page.querySelector(".v15-character"),
        handleSelector:".v15-character-top"
      },
      {
        key:"equipment",
        el:page.querySelector(".inventory-tools-v163"),
        handleSelector:".inventory-tools-head"
      }
    ].filter(x=>x.el);
  }

  function applySavedPosition(item){
    const pos=loadPositions()[item.key];
    if(!pos)return;
    item.el.style.setProperty("--drag-x",(Number(pos.x)||0)+"px");
    item.el.style.setProperty("--drag-y",(Number(pos.y)||0)+"px");
  }

  function makeDraggable(item){
    const el=item.el;
    if(!el || el.dataset.v206Draggable==="1")return;
    el.dataset.v206Draggable="1";
    el.classList.add("v206-draggable-window");

    let handle=el.querySelector(item.handleSelector);
    if(!handle)handle=el;
    handle.classList.add("v206-drag-handle");
    handle.title="Húzd az ablak mozgatásához";

    applySavedPosition(item);

    let startX=0,startY=0,baseX=0,baseY=0,dragging=false,pointerId=null;

    function currentVar(name){
      const raw=getComputedStyle(el).getPropertyValue(name).trim();
      return parseFloat(raw)||0;
    }

    handle.addEventListener("pointerdown",e=>{
      // Buttons/inputs/links remain clickable and do not initiate drag.
      if(e.target.closest("button,input,select,textarea,a"))return;
      if(e.button!==0)return;

      dragging=true;
      pointerId=e.pointerId;
      startX=e.clientX;
      startY=e.clientY;
      baseX=currentVar("--drag-x");
      baseY=currentVar("--drag-y");

      el.classList.add("v206-dragging");
      try{handle.setPointerCapture(pointerId)}catch(_){}
      e.preventDefault();
    });

    handle.addEventListener("pointermove",e=>{
      if(!dragging || e.pointerId!==pointerId)return;
      const x=baseX+(e.clientX-startX);
      const y=baseY+(e.clientY-startY);
      el.style.setProperty("--drag-x",x+"px");
      el.style.setProperty("--drag-y",y+"px");
    });

    function endDrag(e){
      if(!dragging)return;
      dragging=false;
      el.classList.remove("v206-dragging");
      try{handle.releasePointerCapture(pointerId)}catch(_){}

      const positions=loadPositions();
      positions[item.key]={
        x:currentVar("--drag-x"),
        y:currentVar("--drag-y")
      };
      savePositions(positions);
      pointerId=null;
    }

    handle.addEventListener("pointerup",endDrag);
    handle.addEventListener("pointercancel",endDrag);

    // Double click on the title restores only this window.
    handle.addEventListener("dblclick",e=>{
      if(e.target.closest("button,input,select,textarea,a"))return;
      el.style.setProperty("--drag-x","0px");
      el.style.setProperty("--drag-y","0px");
      const positions=loadPositions();
      delete positions[item.key];
      savePositions(positions);
    });
  }

  function setup(){
    getTargets().forEach(makeDraggable);
  }

  function resetAll(){
    localStorage.removeItem(STORAGE_KEY);
    getTargets().forEach(item=>{
      item.el.style.setProperty("--drag-x","0px");
      item.el.style.setProperty("--drag-y","0px");
    });
  }

  window.v206SetupDraggableWindows=setup;
  window.v206ResetWindows=resetAll;

  window.addEventListener("load",()=>{
    setTimeout(setup,100);
    setTimeout(setup,500);
  });

  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="character"]')){
      setTimeout(setup,80);
    }
  },true);

  // Reapply if the dynamic character/inventory layout is rebuilt.
  const observer=new MutationObserver(()=>{
    if(document.getElementById("page-character")?.classList.contains("active")){
      requestAnimationFrame(setup);
    }
  });
  window.addEventListener("load",()=>{
    const page=document.getElementById("page-character");
    if(page)observer.observe(page,{childList:true,subtree:true});
  });
})();

/* ================= V20.7 INDEPENDENT CHARACTER WINDOWS ================= */
(function(){
  const KEY="omi_v207_independent_window_positions";

  function load(){
    try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}
  }
  function save(v){
    try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}
  }

  function ensureCanvas(){
    const page=document.getElementById("page-character");
    if(!page)return null;

    let canvas=page.querySelector(":scope > .v207-window-canvas");
    if(!canvas){
      canvas=document.createElement("div");
      canvas.className="v207-window-canvas";
      page.prepend(canvas);
    }
    return canvas;
  }

  function findCharacter(){
    const page=document.getElementById("page-character");
    return page?.querySelector(".v15-character");
  }

  function findEquipment(){
    const page=document.getElementById("page-character");
    return page?.querySelector(".inventory-tools-v163");
  }

  function makeWindow(el,key,defaultX,defaultY){
    if(!el)return;
    const canvas=ensureCanvas();
    if(!canvas)return;

    if(el.parentNode!==canvas) canvas.appendChild(el);

    el.classList.add("v207-free-window");
    el.dataset.v207Key=key;

    const p=load()[key]||{x:defaultX,y:defaultY};
    el.style.setProperty("--v207-x",(Number(p.x)||0)+"px");
    el.style.setProperty("--v207-y",(Number(p.y)||0)+"px");

    if(el.dataset.v207Ready==="1")return;
    el.dataset.v207Ready="1";

    let handle = key==="character"
      ? el.querySelector(".v15-character-top")
      : el.querySelector(".inventory-tools-head");

    if(!handle) handle=el;
    handle.classList.add("v207-drag-handle");

    let dragging=false,startX=0,startY=0,baseX=0,baseY=0,pid=null;

    const getNum=name=>parseFloat(getComputedStyle(el).getPropertyValue(name))||0;

    handle.addEventListener("pointerdown",e=>{
      if(e.button!==0)return;
      if(e.target.closest("button,input,select,textarea,a"))return;
      dragging=true;
      pid=e.pointerId;
      startX=e.clientX; startY=e.clientY;
      baseX=getNum("--v207-x"); baseY=getNum("--v207-y");
      el.classList.add("v207-dragging");
      try{handle.setPointerCapture(pid)}catch(_){}
      e.preventDefault();
    });

    handle.addEventListener("pointermove",e=>{
      if(!dragging||e.pointerId!==pid)return;
      let x=baseX+(e.clientX-startX);
      let y=baseY+(e.clientY-startY);

      // keep at least a piece of the window inside the canvas
      const c=canvas.getBoundingClientRect();
      const w=el.offsetWidth, h=el.offsetHeight;
      x=Math.max(-w+120,Math.min(x,c.width-120));
      y=Math.max(-40,Math.min(y,c.height-50));

      el.style.setProperty("--v207-x",x+"px");
      el.style.setProperty("--v207-y",y+"px");
    });

    function done(){
      if(!dragging)return;
      dragging=false;
      el.classList.remove("v207-dragging");
      const all=load();
      all[key]={x:getNum("--v207-x"),y:getNum("--v207-y")};
      save(all);
    }
    handle.addEventListener("pointerup",done);
    handle.addEventListener("pointercancel",done);

    handle.addEventListener("dblclick",e=>{
      if(e.target.closest("button,input,select,textarea,a"))return;
      const all=load();
      delete all[key];
      save(all);
      el.style.setProperty("--v207-x",defaultX+"px");
      el.style.setProperty("--v207-y",defaultY+"px");
    });
  }

  function setup(){
    const canvas=ensureCanvas();
    if(!canvas)return;

    // default positions are independent from each other
    makeWindow(findCharacter(),"character",20,16);
    makeWindow(findEquipment(),"equipment",680,70);

    // Hide obsolete layout wrappers so they cannot affect positioning anymore.
    document.querySelectorAll("#page-character .v200-character-inventory-layout,#page-character .v205-character-equipment-shell").forEach(x=>{
      if(!x.contains(findCharacter()) && !x.contains(findEquipment())) x.classList.add("v207-obsolete-layout");
    });
  }

  window.v207Setup=setup;
  window.addEventListener("load",()=>{setTimeout(setup,80);setTimeout(setup,350)});
  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="character"]')) setTimeout(setup,60);
  },true);

  const obs=new MutationObserver(()=>{
    if(document.getElementById("page-character")?.classList.contains("active")){
      requestAnimationFrame(setup);
    }
  });
  window.addEventListener("load",()=>{
    const p=document.getElementById("page-character");
    if(p)obs.observe(p,{childList:true,subtree:true});
  });
})();

/* ================= V20.8 COMPLETE CHARACTER WINDOW FIX ================= */
(function(){
  const KEY="omi_v208_window_positions";

  function loadPos(){
    try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){return {}}
  }
  function savePos(v){
    try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}
  }

  function ensureCanvas(){
    const page=document.getElementById("page-character");
    if(!page)return null;
    let canvas=page.querySelector(":scope > .v208-window-canvas");
    if(!canvas){
      canvas=document.createElement("div");
      canvas.className="v208-window-canvas";
      const overview=page.querySelector(":scope > .v228-character-resources");
      if(overview)overview.after(canvas);else page.prepend(canvas);
    }
    return canvas;
  }

  function buildCompleteCharacterWindow(){
    const page=document.getElementById("page-character");
    const canvas=ensureCanvas();
    if(!page||!canvas)return null;

    let win=canvas.querySelector(".v208-character-window");
    if(!win){
      win=document.createElement("section");
      win.className="card v208-character-window";

      const header=document.createElement("div");
      header.className="v208-character-header";
      header.innerHTML=`
        <div>
          <h2>⚔️ Saját karakter</h2>
          <small>Felszereld a tárgyakat, aurákat és peteket, hogy egyre erősebb legyél!</small>
        </div>`;
      win.appendChild(header);

      const body=document.createElement("div");
      body.className="v208-character-body";
      win.appendChild(body);

      canvas.appendChild(win);
    }

    const body=win.querySelector(".v208-character-body");

    // Move the COMPLETE character visual stage into this window.
    const stage=
      page.querySelector(".v15-character-stage") ||
      page.querySelector(".v168-character-system")?.parentElement ||
      page.querySelector(".character-stage");

    if(stage && !win.contains(stage)){
      body.appendChild(stage);
    }

    // Move bottom mini stats with the character.
    const bottom=page.querySelector(".v15-bottom-stats");
    if(bottom && !win.contains(bottom)){
      body.appendChild(bottom);
    }

    // Hide old character card shell if it became empty/duplicate.
    page.querySelectorAll(".v15-character").forEach(old=>{
      if(old!==win){
        const hasStage=old.querySelector(".v15-character-stage,.v168-character-system");
        if(!hasStage) old.classList.add("v208-hide-old-character-shell");
      }
    });

    return win;
  }

  function getEquipment(){
    return document.querySelector("#page-character .inventory-tools-v163");
  }

  function makeDraggable(el,key,dx,dy,handleSelector){
    if(!el)return;
    const canvas=ensureCanvas();
    if(!canvas)return;

    if(el.parentNode!==canvas) canvas.appendChild(el);
    el.classList.add("v208-free-window");

    if(!el.dataset.v208Init){
      el.dataset.v208Init="1";
      const saved=loadPos()[key]||{x:dx,y:dy};
      el.style.setProperty("--v208-x",(Number(saved.x)||0)+"px");
      el.style.setProperty("--v208-y",(Number(saved.y)||0)+"px");

      let handle=el.querySelector(handleSelector)||el;
      handle.classList.add("v208-drag-handle");

      let dragging=false,pid=null,sx=0,sy=0,bx=0,by=0;
      const num=n=>parseFloat(getComputedStyle(el).getPropertyValue(n))||0;

      handle.addEventListener("pointerdown",e=>{
        if(e.button!==0)return;
        if(e.target.closest("button,input,select,textarea,a"))return;
        dragging=true; pid=e.pointerId;
        sx=e.clientX; sy=e.clientY;
        bx=num("--v208-x"); by=num("--v208-y");
        el.classList.add("v208-dragging");
        try{handle.setPointerCapture(pid)}catch(_){}
        e.preventDefault();
      });

      handle.addEventListener("pointermove",e=>{
        if(!dragging||e.pointerId!==pid)return;
        const rect=canvas.getBoundingClientRect();
        const w=el.offsetWidth, h=el.offsetHeight;
        let x=bx+(e.clientX-sx), y=by+(e.clientY-sy);
        x=Math.max(-w+140,Math.min(x,rect.width-140));
        y=Math.max(-30,Math.min(y,rect.height-60));
        el.style.setProperty("--v208-x",x+"px");
        el.style.setProperty("--v208-y",y+"px");
      });

      const done=()=>{
        if(!dragging)return;
        dragging=false;
        el.classList.remove("v208-dragging");
        const all=loadPos();
        all[key]={x:num("--v208-x"),y:num("--v208-y")};
        savePos(all);
      };
      handle.addEventListener("pointerup",done);
      handle.addEventListener("pointercancel",done);

      handle.addEventListener("dblclick",e=>{
        if(e.target.closest("button,input,select,textarea,a"))return;
        const all=loadPos(); delete all[key]; savePos(all);
        el.style.setProperty("--v208-x",dx+"px");
        el.style.setProperty("--v208-y",dy+"px");
      });
    }
  }

  function mirrorPower(){
    const src=
      document.querySelector("#v15Power") ||
      document.querySelector(".v15-power-box b") ||
      document.querySelector("[data-role='power']");
    const dst=document.getElementById("v208PowerMirror");
    if(src&&dst)dst.textContent=src.textContent;
  }

  function setup(){
    const page=document.getElementById("page-character");
    if(!page)return;
    const charWin=buildCompleteCharacterWindow();
    const eq=getEquipment();

    makeDraggable(charWin,"character",40,20,".v208-character-header");
    makeDraggable(eq,"equipment",720,55,".inventory-tools-head");

    // Hide old V20.7 floating shells to stop clipping/ghost layout.
    page.querySelectorAll(".v207-window-canvas,.v205-character-equipment-shell,.v200-character-inventory-layout").forEach(old=>{
      if(!old.contains(charWin) && !old.contains(eq)) old.classList.add("v208-obsolete");
    });

    mirrorPower();
    if(typeof renderDynamicEquipment==="function") renderDynamicEquipment();
  }

  window.v208Setup=setup;
  window.addEventListener("load",()=>{setTimeout(setup,80);setTimeout(setup,400)});
  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="character"]')){
      setTimeout(setup,60);
      setTimeout(mirrorPower,120);
    }
  },true);

  setInterval(()=>{
    if(document.getElementById("page-character")?.classList.contains("active")){
      mirrorPower();
    }
  },800);
})();

/* ================= V20.9 EQUIPMENT BESIDE CHARACTER ================= */
(function(){
  function v209ArrangeDefaults(){
    const page=document.getElementById("page-character");
    if(!page)return;

    const canvas=page.querySelector(".v208-window-canvas");
    const charWin=page.querySelector(".v208-character-window");
    const equip=page.querySelector(".inventory-tools-v163.v208-free-window, .inventory-tools-v163");

    if(!canvas || !charWin || !equip)return;

    // If this version has never been positioned before, give clean side-by-side defaults.
    const key="omi_v208_window_positions";
    let pos={};
    try{pos=JSON.parse(localStorage.getItem(key)||"{}")}catch(e){}

    if(!pos.character){
      charWin.style.setProperty("--v208-x","30px");
      charWin.style.setProperty("--v208-y","20px");
    }

    if(!pos.equipment){
      equip.style.setProperty("--v208-x","720px");
      equip.style.setProperty("--v208-y","20px");
    }

    // Make sure equipment remains a direct sibling in the same window canvas.
    if(equip.parentNode!==canvas){
      canvas.appendChild(equip);
    }
  }

  window.v209ArrangeDefaults=v209ArrangeDefaults;

  window.addEventListener("load",()=>{
    setTimeout(v209ArrangeDefaults,120);
    setTimeout(v209ArrangeDefaults,500);
  });

  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="character"]')){
      setTimeout(v209ArrangeDefaults,80);
    }
  },true);
})();

/* ================= V21.0 CHARACTER EQUIPMENT TOGGLE ================= */
(function(){
  const OPEN_KEY="omi_v210_equipment_open";

  function getPage(){
    return document.getElementById("page-character");
  }

  function getCharacterWindow(){
    return getPage()?.querySelector(".v208-character-window");
  }

  function getEquipmentWindow(){
    return getPage()?.querySelector(".inventory-tools-v163");
  }

  function getEquipBest(){
    return document.getElementById("equipBestV163");
  }

  function ensureCharacterControls(){
    const charWin=getCharacterWindow();
    if(!charWin)return;

    const header=charWin.querySelector(".v208-character-header");
    if(!header)return;

    let controls=header.querySelector(".v210-character-actions");
    if(!controls){
      controls=document.createElement("div");
      controls.className="v210-character-actions";

      const openBtn=document.createElement("button");
      openBtn.type="button";
      openBtn.id="v210EquipmentToggleBtn";
      openBtn.className="v210-equipment-toggle";
      openBtn.textContent="🧰 Felszerelés kezelés";

      controls.appendChild(openBtn);
      header.appendChild(controls);

      openBtn.addEventListener("click",e=>{
        e.preventDefault();
        e.stopPropagation();
        toggleEquipment();
      });
    }

    // Move the REAL Equip Best button into the character window.
    // This preserves the existing click handler / equip logic.
    const equipBest=getEquipBest();
    if(equipBest && equipBest.parentNode!==controls){
      equipBest.classList.add("v210-equip-best-character");
      controls.prepend(equipBest);
    }
  }

  function ensureEquipmentCloseButton(){
    const equip=getEquipmentWindow();
    if(!equip)return;
    const head=equip.querySelector(".inventory-tools-head");
    if(!head)return;

    let close=head.querySelector("#v210EquipmentCloseBtn");
    if(!close){
      close=document.createElement("button");
      close.type="button";
      close.id="v210EquipmentCloseBtn";
      close.className="v210-equipment-close";
      close.textContent="✕";
      close.title="Felszerelés kezelés bezárása";
      head.appendChild(close);

      close.addEventListener("click",e=>{
        e.preventDefault();
        e.stopPropagation();
        setEquipmentOpen(false);
      });
    }
  }

  function setEquipmentOpen(open){
    const equip=getEquipmentWindow();
    if(!equip)return;

    equip.classList.toggle("v210-equipment-open",Boolean(open));
    equip.classList.toggle("v210-equipment-closed",!open);

    try{
      localStorage.setItem(OPEN_KEY,open?"1":"0");
    }catch(e){}

    const btn=document.getElementById("v210EquipmentToggleBtn");
    if(btn){
      btn.textContent=open ? "🧰 Felszerelés kezelés ✓" : "🧰 Felszerelés kezelés";
      btn.classList.toggle("active",Boolean(open));
    }
  }

  function toggleEquipment(){
    const equip=getEquipmentWindow();
    if(!equip)return;
    setEquipmentOpen(!equip.classList.contains("v210-equipment-open"));
  }

  function initialOpen(){
    // Start CLOSED by default unless user explicitly left it open.
    let open=false;
    try{open=localStorage.getItem(OPEN_KEY)==="1"}catch(e){}
    setEquipmentOpen(open);
  }

  function setup(){
    ensureCharacterControls();
    ensureEquipmentCloseButton();

    const equip=getEquipmentWindow();
    if(equip && !equip.dataset.v210OpenInitialized){
      equip.dataset.v210OpenInitialized="1";
      initialOpen();
    }
  }

  window.v210SetEquipmentOpen=setEquipmentOpen;
  window.v210ToggleEquipment=toggleEquipment;
  window.v210SetupEquipmentToggle=setup;

  window.addEventListener("load",()=>{
    setTimeout(setup,120);
    setTimeout(setup,500);
  });

  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="character"]')){
      setTimeout(setup,80);
    }
  },true);

  // Existing render/layout code may rebuild these pieces.
  const obs=new MutationObserver(()=>{
    if(getPage()?.classList.contains("active")){
      requestAnimationFrame(setup);
    }
  });

  window.addEventListener("load",()=>{
    const p=getPage();
    if(p)obs.observe(p,{childList:true,subtree:true});
  });
})();

/* ================= V21.1 EQUIPMENT OPEN FIX ================= */
(function(){
  function page(){ return document.getElementById("page-character"); }
  function canvas(){ return page()?.querySelector(".v208-window-canvas"); }

  function equipment(){
    const p=page();
    if(!p)return null;
    return p.querySelector(".inventory-tools-v163");
  }

  function ensureEquipmentWindow(){
    const p=page();
    const c=canvas();
    const eq=equipment();
    if(!p || !c || !eq)return null;

    // Must be a direct child of the floating canvas.
    if(eq.parentNode!==c){
      c.appendChild(eq);
    }

    // Remove all old hiding classes from previous versions.
    [
      "v210-equipment-closed",
      "v205-empty-hidden",
      "v205-old-layout-hidden",
      "v208-obsolete",
      "v207-obsolete-layout"
    ].forEach(cls=>eq.classList.remove(cls));

    // Keep V20.8/V20.9 draggable behavior.
    eq.classList.add("v208-free-window");

    // Guarantee a usable default position.
    const x=getComputedStyle(eq).getPropertyValue("--v208-x").trim();
    const y=getComputedStyle(eq).getPropertyValue("--v208-y").trim();
    if(!x)eq.style.setProperty("--v208-x","720px");
    if(!y)eq.style.setProperty("--v208-y","55px");

    return eq;
  }

  function openEquipment(){
    const eq=ensureEquipmentWindow();
    if(!eq)return;

    eq.classList.remove("v210-equipment-closed");
    eq.classList.add("v210-equipment-open");
    eq.style.setProperty("display","block","important");
    eq.style.setProperty("visibility","visible","important");
    eq.style.setProperty("opacity","1","important");
    eq.style.setProperty("pointer-events","auto","important");
    eq.style.setProperty("z-index","999","important");

    try{localStorage.setItem("omi_v210_equipment_open","1")}catch(e){}

    // Re-run drag setup if available.
    setTimeout(()=>{
      if(window.v208Setup)window.v208Setup();
      if(window.v209ArrangeDefaults)window.v209ArrangeDefaults();
    },0);

    const btn=document.getElementById("v210EquipmentToggleBtn");
    if(btn){
      btn.classList.add("active");
      btn.textContent="🧰 Felszerelés kezelés ✓";
    }
  }

  function closeEquipment(){
    const eq=equipment();
    if(!eq)return;
    eq.classList.remove("v210-equipment-open");
    eq.classList.add("v210-equipment-closed");
    eq.style.setProperty("display","none","important");
    try{localStorage.setItem("omi_v210_equipment_open","0")}catch(e){}

    const btn=document.getElementById("v210EquipmentToggleBtn");
    if(btn){
      btn.classList.remove("active");
      btn.textContent="🧰 Felszerelés kezelés";
    }
  }

  function toggleEquipment(){
    const eq=equipment();
    if(!eq){
      // layout may not be ready yet
      setTimeout(openEquipment,60);
      return;
    }
    const hidden =
      eq.classList.contains("v210-equipment-closed") ||
      getComputedStyle(eq).display==="none";
    hidden ? openEquipment() : closeEquipment();
  }

  function bindButton(){
    const btn=document.getElementById("v210EquipmentToggleBtn");
    if(!btn || btn.dataset.v211Bound==="1")return;
    btn.dataset.v211Bound="1";

    // Replace old behavior with a guaranteed open/close handler.
    btn.addEventListener("click",function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      toggleEquipment();
    },true);
  }

  function bindClose(){
    const close=document.getElementById("v210EquipmentCloseBtn");
    if(!close || close.dataset.v211Bound==="1")return;
    close.dataset.v211Bound="1";
    close.addEventListener("click",function(e){
      e.preventDefault();
      e.stopImmediatePropagation();
      closeEquipment();
    },true);
  }

  function setup(){
    ensureEquipmentWindow();
    bindButton();
    bindClose();

    // Default to closed unless saved open.
    let saved=false;
    try{saved=localStorage.getItem("omi_v210_equipment_open")==="1"}catch(e){}
    saved ? openEquipment() : closeEquipment();
  }

  window.v211OpenEquipment=openEquipment;
  window.v211CloseEquipment=closeEquipment;
  window.v211ToggleEquipment=toggleEquipment;

  window.addEventListener("load",()=>{
    setTimeout(setup,150);
    setTimeout(setup,600);
  });

  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="character"]')){
      setTimeout(setup,100);
    }
  },true);

  const obs=new MutationObserver(()=>{
    if(page()?.classList.contains("active")){
      requestAnimationFrame(()=>{
        bindButton();
        bindClose();
      });
    }
  });

  window.addEventListener("load",()=>{
    const p=page();
    if(p)obs.observe(p,{childList:true,subtree:true});
  });
})();

/* V21.2 contextual balances/status live sync */
(function(){
  function values(){
    const s=(typeof save!=="undefined"&&save)?save:{};
    return {
      gold:Number(s.gold||0),
      gems:Number(s.gems||0),
      ore:Number(s.ore||0),
      soul:Number(s.soul||0),
      tickets:Number(s.tickets||0),
      power:Number((typeof power==="function"?power():0)||0),
      statpoints:Number(s.paragonStatPoints ?? s.statPoints ?? s.skillPoints ?? 0),
      auratokens:Number(s.auraTokens||0)
    };
  }

  function render(){
    const v=values();
    document.querySelectorAll("[data-context-bar] [data-val]").forEach(el=>{
      const key=el.dataset.val;
      const n=v[key]??0;
      el.textContent=(typeof fmt==="function")?fmt(n):String(Math.floor(n));
    });
  }

  window.v212RenderContextBars=render;
  window.addEventListener("load",()=>{
    setTimeout(render,120);
    setInterval(render,700);
  });
  document.addEventListener("click",e=>{
    if(e.target.closest?.("[data-tab],button")){
      setTimeout(render,0);
      setTimeout(render,100);
    }
  },true);
})();

/* ================= V21.3 PVP + PET REROLL + SKILL VALUES ================= */
(function(){
  const REROLL_DUPES = 3;

  function S(){ return (typeof save!=="undefined" && save) ? save : {}; }
  function F(n){ return typeof fmt==="function" ? fmt(Number(n||0)) : Math.floor(Number(n||0)).toLocaleString("hu-HU"); }

  /* ---------- PvP meaningful rewards ---------- */
  function ensurePvpRewardInfo(){
    const p=document.getElementById("page-pvp");
    if(!p)return;
    const arena=p.querySelector(".pvp-arena-v165, .pvp-arena, [class*='pvp-arena']");
    if(!arena)return;
    let box=p.querySelector(".v213-pvp-rewards");
    if(!box){
      box=document.createElement("div");
      box.className="v213-pvp-rewards";
      arena.appendChild(box);
    }
    box.innerHTML=`
      <div class="v213-reward-title">🏆 PvP győzelmi jutalom</div>
      <div class="v213-reward-grid">
        <span>💰 <b>Arany</b><strong>500–2 500</strong></span>
        <span>⛏️ <b>Érc</b><strong>1–4</strong></span>
        <span>🎫 <b>Dungeon token</b><strong>5–15% esély</strong></span>
      </div>
      <small>Magasabb ellenfél / rating esetén jobb jutalom.</small>`;
  }

  function awardExtraPvpRewards(opponent){
    const s=S();
    const rating=Number(opponent?.rating||opponent?.pvpRating||0);
    const bonus=Math.max(0,Math.min(4,Math.floor(rating/250)));
    const ore=1+Math.floor(Math.random()*(2+bonus));
    s.ore=Number(s.ore||0)+ore;

    let token=0;
    const tokenChance=Math.min(.15,.05+bonus*.025);
    if(Math.random()<tokenChance){
      token=1;
      // Project calls these tickets in the current save.
      s.tickets=Number(s.tickets||0)+1;
    }
    return {ore,token};
  }

  // Hook common PvP result functions without replacing the base combat.
  ["pvpFight","fightPvp","doPvpFight","resolvePvpFight"].forEach(name=>{
    const old=window[name];
    if(typeof old!=="function" || old.__v213)return;
    const wrapped=function(...args){
      const beforeWins=Number(S().pvpWins||S().wins||0);
      const result=old.apply(this,args);
      const afterWins=Number(S().pvpWins||S().wins||0);
      const won=(result===true || result?.win===true || result?.won===true || afterWins>beforeWins);
      if(won){
        const r=awardExtraPvpRewards(args[0]);
        if(typeof toast==="function") toast(`🏆 PvP jutalom: +${r.ore} érc${r.token?` +${r.token} dungeon token`:""}`);
        if(typeof renderAll==="function") renderAll();
      }
      return result;
    };
    wrapped.__v213=true;
    window[name]=wrapped;
  });

  /* ---------- Pet: 3 identical copies -> stronger reroll ---------- */
  function petKey(p){ return String(p?.id ?? p?.key ?? p?.name ?? ""); }
  function petName(p){ return String(p?.name ?? p?.title ?? "Pet"); }
  function petLevel(p){ return Number(p?.level ?? p?.lvl ?? 1); }

  function petCollection(){
    const s=S();
    if(Array.isArray(s.pets)) return s.pets;
    if(Array.isArray(s.petInventory)) return s.petInventory;
    if(Array.isArray(s.ownedPets)) return s.ownedPets;
    return null;
  }

  function duplicateGroups(){
    const arr=petCollection()||[];
    const groups={};
    arr.forEach((p,i)=>{
      const k=petKey(p);
      if(!k)return;
      (groups[k] ||= []).push({p,i});
    });
    return Object.values(groups).filter(g=>g.length>=REROLL_DUPES);
  }

  function ensurePetReroll(){
    const p=document.getElementById("page-pets");
    if(!p)return;
    const root=p.querySelector(".pet-grid, .pets-grid, [class*='pet-grid'], [class*='pet-system']") || p;
    let panel=p.querySelector(".v213-pet-reroll");
    if(!panel){
      panel=document.createElement("div");
      panel.className="v213-pet-reroll";
      root.prepend(panel);
    }
    const groups=duplicateGroups();
    panel.innerHTML=`
      <div>
        <b>♻️ Pet összeolvasztás / reroll</b>
        <small>3 teljesen azonos petből 1 erősebb változat készíthető.</small>
      </div>
      <div class="v213-reroll-list">${
        groups.length ? groups.map((g,n)=>`
          <button type="button" data-v213-reroll="${n}">
            ${petName(g[0].p)} ×${g.length} → Erősebb pet
          </button>`).join("") :
          `<span class="v213-muted">Nincs még 3 egyforma peted.</span>`
      }</div>`;
    panel.querySelectorAll("[data-v213-reroll]").forEach(btn=>{
      btn.onclick=()=>{
        const group=duplicateGroups()[Number(btn.dataset.v213Reroll)];
        const arr=petCollection();
        if(!group || !arr || group.length<3)return;
        const selected=group.slice(0,3);
        const base=JSON.parse(JSON.stringify(selected[0].p));
        base.level=Math.max(...selected.map(x=>petLevel(x.p)))+1;
        base.lvl=base.level;
        base.rerollTier=Number(base.rerollTier||0)+1;
        base.powerMultiplier=Number(base.powerMultiplier||1)*1.15;
        base.bonusMultiplier=Number(base.bonusMultiplier||1)*1.15;
        selected.map(x=>x.i).sort((a,b)=>b-a).forEach(i=>arr.splice(i,1));
        arr.push(base);
        if(typeof toast==="function") toast(`♻️ ${petName(base)} erősítve: +15% pet bónusz, Lv.${base.level}`);
        if(typeof renderAll==="function") renderAll();
        ensurePetReroll();
      };
    });
  }

  /* ---------- Skills: show exact gain per point ---------- */
  const skillInfo = {
    "Erő aura":       {per:"+2.0% sebzés / pont", next:"+2.0% DMG"},
    "Aranyládás":     {per:"+3.0% arany / pont",  next:"+3.0% arany"},
    "Kritikus ösztön":{per:"+0.5% krit / pont",   next:"+0.5% krit"},
    "Kincsvadász":    {per:"+1.0% drop / pont",   next:"+1.0% drop"},
    "Mély alvás farm":{per:"+5.0% offline farm / pont", next:"+5.0% offline"},
    "Pet szinkron":   {per:"+2.0% pet bónusz / pont", next:"+2.0% pet bónusz"}
  };

  function ensureSkillValues(){
    const p=document.getElementById("page-skills");
    if(!p)return;
    const cards=[...p.querySelectorAll("button")].filter(b=>b.textContent.includes("+1 pont")).map(b=>b.closest("div"));
    cards.forEach(card=>{
      if(!card)return;
      const txt=card.textContent;
      const found=Object.entries(skillInfo).find(([name])=>txt.includes(name));
      if(!found)return;
      const [name,info]=found;
      let badge=card.querySelector(".v213-skill-value");
      if(!badge){
        badge=document.createElement("div");
        badge.className="v213-skill-value";
        const button=card.querySelector("button");
        if(button) card.insertBefore(badge,button);
        else card.appendChild(badge);
      }
      badge.innerHTML=`<span>${info.per}</span><b>Következő pont: ${info.next}</b>`;
    });
  }

  function refresh(){
    ensurePvpRewardInfo();
    ensurePetReroll();
    ensureSkillValues();
  }
  window.v213Refresh=refresh;
  window.addEventListener("load",()=>{setTimeout(refresh,180);setTimeout(refresh,700)});
  document.addEventListener("click",e=>{
    if(e.target.closest?.("[data-tab],button")) setTimeout(refresh,80);
  },true);
})();

/* ================= V21.4 CHARACTER LAYOUT RECOVERY ================= */
(function(){
  const POSKEY="omi_v214_character_positions";

  function page(){return document.getElementById("page-character")}
  function canvas(){return page()?.querySelector(".v208-window-canvas")}
  function charWin(){return page()?.querySelector(".v208-character-window")}
  function equipWin(){return page()?.querySelector(".inventory-tools-v163")}
  function adminWin(){
    const p=page(); if(!p)return null;
    return p.querySelector(".admin-game-studio, .admin-studio, [class*='admin-game'], [class*='admin-studio']");
  }

  function resetWindow(el,x,y){
    if(!el)return;
    el.style.setProperty("--v208-x",x+"px");
    el.style.setProperty("--v208-y",y+"px");
    el.style.left="0px";
    el.style.top="0px";
  }

  function restoreCharacterContent(){
    const cw=charWin();
    if(!cw)return;
    // Undo accidental clipping/collapse caused by older draggable rules.
    cw.style.removeProperty("height");
    cw.style.removeProperty("max-height");
    cw.style.removeProperty("overflow");
    cw.classList.add("v214-character-restored");
  }

  function arrange(force=false){
    const p=page(), c=canvas(), cw=charWin(), ew=equipWin();
    if(!p||!c||!cw)return;

    restoreCharacterContent();

    // Remove old saved coordinates once on this version: they are the source
    // of the screenshot's scattered/collapsed layout.
    if(force || !localStorage.getItem(POSKEY)){
      ["omi_v208_positions","omi_v209_positions","omi_v208_window_positions",
       "omi_character_window_positions","omi_window_positions"].forEach(k=>{
        try{localStorage.removeItem(k)}catch(e){}
      });

      resetWindow(cw,30,25);
      if(ew) resetWindow(ew,650,25);

      const aw=adminWin();
      if(aw) resetWindow(aw,30,610);

      try{localStorage.setItem(POSKEY,"1")}catch(e){}
    }
  }

  function addResetButton(){
    const p=page(), cw=charWin();
    if(!p||!cw||p.querySelector("#v214ResetLayout"))return;
    const b=document.createElement("button");
    b.id="v214ResetLayout";
    b.type="button";
    b.textContent="↺ Ablakok alaphelyzetbe";
    b.title="Ha elhúztad az ablakokat, visszaállítja őket.";
    const header=cw.querySelector(".v208-character-header")||cw;
    header.appendChild(b);
    b.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      arrange(true);
      if(window.v208Setup) setTimeout(window.v208Setup,0);
    };
  }

  function fix(){
    arrange(false);
    addResetButton();
  }

  window.v214ResetCharacterLayout=()=>arrange(true);
  window.addEventListener("load",()=>{setTimeout(fix,180);setTimeout(fix,700)});
  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="character"]'))setTimeout(fix,80);
  },true);
})();

/* ================= V21.6 PERSONAL AUTO ITEM DELETE ================= */
(function(){
  const DEFAULTS={
    enabled:false,
    rarities:{normal:false,rare:false,epic:false,mythic:false,legendary:false},
    maxPower:0,
    protectPlus:1,
    protectLocked:true
  };
  let cleanupLock=false;
  let lastRemoved=0;

  function cfg(){
    const s=(typeof save!=="undefined"&&save)?save:null;
    if(!s)return JSON.parse(JSON.stringify(DEFAULTS));
    if(!s.autoDeleteSettings){
      s.autoDeleteSettings=JSON.parse(JSON.stringify(DEFAULTS));
    }
    s.autoDeleteSettings.rarities={
      ...DEFAULTS.rarities,
      ...(s.autoDeleteSettings.rarities||{})
    };
    return s.autoDeleteSettings;
  }

  function normRarity(r){
    r=String(r||"normal").toLowerCase();
    if(r==="common")r="normal";
    if(r==="mistic"||r==="mystic")r="mythic";
    return ["normal","rare","epic","mythic","legendary"].includes(r)?r:"normal";
  }

  function inventoryArray(){
    const s=(typeof save!=="undefined"&&save)?save:null;
    if(!s)return null;
    const candidates=["inventory","items","bag","equipmentInventory","itemInventory"];
    for(const k of candidates){
      if(Array.isArray(s[k]))return s[k];
    }
    // fallback: find an array that looks like items
    for(const [k,v] of Object.entries(s)){
      if(Array.isArray(v) && v.length && v.some(x=>x && typeof x==="object" && ("rarity" in x || "slot" in x || "plus" in x))){
        if(!/pets?|quests?|logs?|history/i.test(k))return v;
      }
    }
    return null;
  }

  function equippedRefs(){
    const s=(typeof save!=="undefined"&&save)?save:null;
    const refs=new Set();
    if(!s)return refs;
    const eqCandidates=[s.equipment,s.equipped,s.equip];
    eqCandidates.forEach(eq=>{
      if(!eq||typeof eq!=="object")return;
      Object.values(eq).forEach(v=>{
        if(!v)return;
        if(typeof v==="object"){
          if(v.id!=null)refs.add("id:"+v.id);
          if(v.uid!=null)refs.add("uid:"+v.uid);
          refs.add(v);
        }else{
          refs.add("id:"+v);
        }
      });
    });
    return refs;
  }

  function isEquipped(item,refs){
    if(!item)return false;
    if(item.equipped===true || item.isEquipped===true)return true;
    if(refs.has(item))return true;
    if(item.id!=null && refs.has("id:"+item.id))return true;
    if(item.uid!=null && refs.has("uid:"+item.uid))return true;
    return false;
  }

  function itemPower(item){
    if(!item)return 0;
    const direct=["power","score","strength","itemPower","combatPower"];
    for(const k of direct){
      if(Number.isFinite(Number(item[k])))return Number(item[k]);
    }
    // approximate score from common item fields when no explicit score exists
    let n=0;
    n += Number(item.atk||item.attack||item.damage||0);
    n += Number(item.def||item.defense||0);
    n += Number(item.hp||item.maxHp||0)/10;
    n += Number(item.plus||0)*20;
    if(Array.isArray(item.options)){
      item.options.forEach(o=>{ n += Number(o?.value||o?.amount||0); });
    }
    return Math.floor(n);
  }

  function shouldDelete(item,settings,refs){
    if(!item||typeof item!=="object")return false;
    if(isEquipped(item,refs))return false;
    if(settings.protectLocked && (item.locked===true || item.favorite===true || item.favourite===true || item.isLocked===true))return false;

    const rarity=normRarity(item.rarity);
    if(!settings.rarities[rarity])return false;

    const plus=Number(item.plus||0);
    const protectPlus=Math.max(0,Number(settings.protectPlus||0));
    if(protectPlus>0 && plus>=protectPlus)return false;

    const maxPower=Math.max(0,Number(settings.maxPower||0));
    if(maxPower>0 && itemPower(item)>=maxPower)return false;

    return true;
  }

  function cleanup(showToast=false){
    if(cleanupLock)return 0;
    const s=(typeof save!=="undefined"&&save)?save:null;
    const settings=cfg();
    const inv=inventoryArray();
    if(!s||!inv||!settings.enabled)return 0;

    cleanupLock=true;
    try{
      const refs=equippedRefs();
      let removed=0;
      for(let i=inv.length-1;i>=0;i--){
        if(shouldDelete(inv[i],settings,refs)){
          inv.splice(i,1);
          removed++;
        }
      }
      if(removed>0){
        lastRemoved=removed;
        if(typeof persist==="function")persist();
        if(typeof renderInventory==="function")renderInventory();
        if(typeof v212RenderContextBars==="function")v212RenderContextBars();
        if(showToast && typeof toast==="function")toast(`🗑️ Automata törlés: ${removed} tárgy törölve.`);
      }else if(showToast && typeof toast==="function"){
        toast("🧹 Nincs törölhető tárgy a beállítások alapján.");
      }
      updateStatus();
      return removed;
    }finally{
      cleanupLock=false;
    }
  }

  function loadUI(){
    const settings=cfg();
    const enabled=document.getElementById("v216AutoDeleteEnabled");
    if(!enabled)return;
    enabled.checked=Boolean(settings.enabled);
    document.querySelectorAll("[data-v216-rarity]").forEach(el=>{
      el.checked=Boolean(settings.rarities[normRarity(el.dataset.v216Rarity)]);
    });
    const mp=document.getElementById("v216MaxPowerDelete");
    if(mp)mp.value=Number(settings.maxPower||0);
    const pp=document.getElementById("v216ProtectPlus");
    if(pp)pp.value=Number(settings.protectPlus??1);
    const lock=document.getElementById("v216ProtectLocked");
    if(lock)lock.checked=settings.protectLocked!==false;
    updateStatus();
  }

  function saveUI(){
    const settings=cfg();
    settings.enabled=Boolean(document.getElementById("v216AutoDeleteEnabled")?.checked);
    document.querySelectorAll("[data-v216-rarity]").forEach(el=>{
      settings.rarities[normRarity(el.dataset.v216Rarity)]=Boolean(el.checked);
    });
    settings.maxPower=Math.max(0,Number(document.getElementById("v216MaxPowerDelete")?.value||0));
    settings.protectPlus=Math.max(0,Math.min(15,Number(document.getElementById("v216ProtectPlus")?.value||0)));
    settings.protectLocked=Boolean(document.getElementById("v216ProtectLocked")?.checked);
    if(typeof persist==="function")persist();
    updateStatus();
    if(typeof toast==="function")toast("💾 Automata törlés beállításai mentve.");
    if(settings.enabled)cleanup(false);
  }

  function updateStatus(){
    const el=document.getElementById("v216AutoDeleteStatus");
    if(!el)return;
    const s=cfg();
    const selected=Object.entries(s.rarities).filter(([,v])=>v).map(([k])=>({
      normal:"Common",rare:"Rare",epic:"Epic",mythic:"Mythic",legendary:"Legendary"
    }[k])).join(", ");
    el.textContent=s.enabled
      ? `Automata törlés: AKTÍV · ${selected||"nincs rarity kiválasztva"}${s.maxPower>0?` · Erő < ${s.maxPower}`:""}`
      : "Automata törlés: kikapcsolva";
    el.classList.toggle("active",Boolean(s.enabled));
  }

  function bind(){
    const saveBtn=document.getElementById("v216SaveAutoDelete");
    const runBtn=document.getElementById("v216RunAutoDelete");
    if(saveBtn && !saveBtn.dataset.bound216){
      saveBtn.dataset.bound216="1";
      saveBtn.onclick=saveUI;
    }
    if(runBtn && !runBtn.dataset.bound216){
      runBtn.dataset.bound216="1";
      runBtn.onclick=()=>{
        // manual cleanup should obey the toggle; temporarily enable if needed
        const settings=cfg();
        const was=settings.enabled;
        if(!was)settings.enabled=true;
        cleanup(true);
        settings.enabled=was;
        updateStatus();
      };
    }
    loadUI();
  }

  // Run periodically so freshly dropped items are removed automatically.
  window.setInterval(()=>{
    try{
      if(cfg().enabled)cleanup(false);
    }catch(e){console.warn("V21.6 auto-delete:",e)}
  },1200);

  window.addEventListener("load",()=>setTimeout(bind,200));
  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="inventory"]'))setTimeout(bind,80);
  },true);

  window.v216AutoDeleteCleanup=cleanup;
  window.v216AutoDeleteBind=bind;
})();

/* ================= V21.7 SILENT AUTOSAVE UI ================= */
(function(){
  function hideSaveIndicators(){
    document.querySelectorAll(
      '#saveStatus,#cloudSaveStatus,.save-status,.cloud-save-status,.saving-status,[data-save-status],[data-cloud-save-status]'
    ).forEach(el=>{
      el.style.setProperty('display','none','important');
    });

    document.querySelectorAll('span,small,div').forEach(el=>{
      if(el.children.length) return;
      const t=(el.textContent||'').trim();
      if(/^(☁️\s*)?(Mentés\.{0,3}|Mentés…|Mentve|Felhőbe mentve)$/i.test(t)){
        // Avoid hiding buttons/controls or large containers.
        if(!el.closest('button,a,input,label')){
          el.style.setProperty('display','none','important');
        }
      }
    });
  }

  window.addEventListener('load',()=>{
    hideSaveIndicators();
    const obs=new MutationObserver(hideSaveIndicators);
    obs.observe(document.body,{subtree:true,childList:true,characterData:true});
  });
})();

/* ================= V21.8 DUNGEON SYSTEM ================= */
(function(){
  const DUNGEONS_V218 = [
    {
      id:"training_cave",
      effectType:"rockfall",
      effectIcon:"🪨",
      visualTheme:"cave",
      visualDecor:["🪨","🌿"],
      name:"Kezdők barlangja",
      icon:"🪨",
      bossName:"Barlangi Gólem",
      bossIcon:"🗿",
      reqPower:250,
      ticketCost:1,
      safe:true,
      minWin:1.00,
      rewards:{gold:[800,1400], ore:[1,3], gems:[0,1], soul:[1,2]},
      desc:"Biztonságos kezdő kazamata. Ha van jegyed, mindig teljesíted. Farmolásra való."
    },
    {
      id:"forgotten_mine",
      effectType:"crystal_burst",
      effectIcon:"💎",
      visualTheme:"mine",
      visualDecor:["⛏️","💎"],
      name:"Elfeledett bánya",
      icon:"⛏️",
      bossName:"Bányarém",
      bossIcon:"👹",
      reqPower:900,
      ticketCost:1,
      safe:false,
      rewards:{gold:[1800,3200], ore:[3,7], gems:[0,1], soul:[2,4]},
      desc:"Az első valódi kockázatos kazamata. A kiírt erő csak ajánlott érték, nem garantált siker."
    },
    {
      id:"wolf_den",
      effectType:"moon_slash",
      effectIcon:"🌙",
      visualTheme:"forest",
      visualDecor:["🌲","🌕"],
      name:"Farkasverem",
      icon:"🐺",
      bossName:"Alfa Vérfarkas",
      bossIcon:"🐺",
      reqPower:2200,
      ticketCost:1,
      safe:false,
      rewards:{gold:[3500,6000], ore:[5,10], gems:[0,2], soul:[3,5]},
      desc:"Gyors, agresszív ellenfelek. Kisebb eséllyel buksz, ha csak épp eléred az ajánlott erőt."
    },
    {
      id:"crypt",
      effectType:"soul_flame",
      effectIcon:"👻",
      visualTheme:"crypt",
      visualDecor:["🪦","🕯️"],
      name:"Elátkozott kripta",
      icon:"☠️",
      bossName:"Kripta Ura",
      bossIcon:"💀",
      reqPower:5200,
      ticketCost:2,
      safe:false,
      rewards:{gold:[7000,12000], ore:[8,14], gems:[1,3], soul:[5,8]},
      desc:"Komolyabb kihívás, jobb jutalommal."
    },
    {
      id:"demon_tower",
      effectType:"hellfire",
      effectIcon:"🔥",
      visualTheme:"demon",
      visualDecor:["🔥","🩸"],
      name:"Démon torony",
      icon:"🔥",
      bossName:"Démon Hadúr",
      bossIcon:"😈",
      reqPower:11000,
      ticketCost:2,
      safe:false,
      rewards:{gold:[14000,22000], ore:[12,20], gems:[1,4], soul:[7,12]},
      desc:"Több szintes démon kazamata. Nem minden futás sikeres."
    },
    {
      id:"dragon_valley",
      effectType:"dragon_breath",
      effectIcon:"🐉",
      visualTheme:"dragon",
      visualDecor:["🌋","🔥"],
      name:"Sárkány-völgy",
      icon:"🐉",
      bossName:"Ősi Sárkány",
      bossIcon:"🐉",
      reqPower:24000,
      ticketCost:3,
      safe:false,
      rewards:{gold:[28000,45000], ore:[18,30], gems:[2,5], soul:[10,16]},
      desc:"Sárkányok és elit őrök. A túléléshez már valódi fejlődés kell."
    },
    {
      id:"storm_keep",
      effectType:"lightning",
      effectIcon:"⚡",
      visualTheme:"storm",
      visualDecor:["⛈️","⚡"],
      name:"Vihartorony",
      icon:"🌩️",
      bossName:"Vihar Titán",
      bossIcon:"⚡",
      reqPower:50000,
      ticketCost:3,
      safe:false,
      rewards:{gold:[55000,85000], ore:[28,42], gems:[3,7], soul:[14,22]},
      desc:"Endgame előszoba, komoly bukási eséllyel."
    },
    {
      id:"void_temple",
      effectType:"void_rift",
      effectIcon:"🌀",
      visualTheme:"void",
      visualDecor:["🕳️","🟣"],
      name:"Üresség temploma",
      icon:"🕳️",
      bossName:"Void Őrző",
      bossIcon:"👁️",
      reqPower:100000,
      ticketCost:4,
      safe:false,
      rewards:{gold:[100000,160000], ore:[40,60], gems:[4,9], soul:[20,30]},
      desc:"Nagy erőt igénylő kazamata, ritkább nyersanyagokkal."
    },
    {
      id:"celestial_gate",
      effectType:"holy_blast",
      effectIcon:"✨",
      visualTheme:"celestial",
      visualDecor:["☁️","✨"],
      name:"Isteni kapu",
      icon:"👁️",
      bossName:"Mennyei Bíró",
      bossIcon:"🪽",
      reqPower:200000,
      ticketCost:5,
      safe:false,
      rewards:{gold:[200000,320000], ore:[60,90], gems:[6,12], soul:[28,42]},
      desc:"Magas szintű végjáték kazamata. Az ajánlott erő felett sem garantált a siker."
    },
    {
      id:"abyss",
      effectType:"tentacle_surge",
      effectIcon:"🌊",
      visualTheme:"abyss",
      visualDecor:["🌊","🦑"],
      name:"Mélység ura",
      icon:"🦑",
      bossName:"A Mélység Ura",
      bossIcon:"🦑",
      reqPower:400000,
      ticketCost:6,
      safe:false,
      rewards:{gold:[380000,600000], ore:[85,130], gems:[8,16], soul:[40,60]},
      desc:"Nagyon nehéz endgame kazamata, nagy jutalommal és komoly kockázattal."
    }
  ];

  function s218(){ return (typeof save!=="undefined"&&save)?save:{}; }
  function p218(){ return (typeof power==="function")?Number(power()||0):0; }
  function fmt218(n){ return (typeof fmt==="function")?fmt(n):Math.floor(n).toLocaleString("hu-HU"); }

  function successChance(d){
    if(d.safe) return 1;

    const p=Math.max(1,p218());
    const r=Math.max(1,Number(d.reqPower||1));
    const ratio=p/r;

    // Recommended power = ~70% chance, not guaranteed.
    // Underpowered players still have a small chance; overpowered players approach 95%, never 100%.
    let c;
    if(ratio < .50) c = .08 + ratio*.20;       // ~8–18%
    else if(ratio < .80) c = .20 + (ratio-.50)*.70; // ~20–41%
    else if(ratio < 1.00) c = .45 + (ratio-.80)*1.25; // ~45–70%
    else if(ratio < 1.50) c = .70 + (ratio-1.00)*.40; // 70–90%
    else c = .90 + Math.min(.05,(ratio-1.50)*.03);    // max 95%

    return Math.max(.05,Math.min(.95,c));
  }

  function rollRange([a,b]){
    a=Number(a||0); b=Number(b||a);
    return Math.floor(a+Math.random()*(b-a+1));
  }

  function ensureDungeonState(){
    const s=s218();
    if(!s.dungeonStats) s.dungeonStats={runs:0,wins:0,losses:0,streak:0};
    if(!s.dungeonClears) s.dungeonClears={};
  }

  function applyRewards(d){
    const s=s218();
    const r=d.rewards||{};
    const out={
      gold:rollRange(r.gold||[0,0]),
      ore:rollRange(r.ore||[0,0]),
      gems:rollRange(r.gems||[0,0]),
      soul:rollRange(r.soul||[0,0])
    };
    s.gold=Number(s.gold||0)+out.gold;
    s.ore=Number(s.ore||0)+out.ore;
    s.gems=Number(s.gems||0)+out.gems;
    s.soul=Number(s.soul||0)+out.soul;
    s.stats=s.stats||{};s.stats.goldEarned=Number(s.stats.goldEarned||0)+out.gold;
    return out;
  }

  function runDungeon(d){
    const s=s218();
    ensureDungeonState();

    const tickets=Number(s.tickets||0);
    if(tickets<d.ticketCost){
      if(typeof toast==="function") toast(`🎫 Nincs elég Dungeon jegyed. Kell: ${d.ticketCost}`);
      return;
    }

    s.tickets=tickets-d.ticketCost;
    s.dungeonStats.runs++;

    const chance=successChance(d);
    const win=d.safe || Math.random()<chance;

    if(win){
      const rw=applyRewards(d);
      s.dungeonStats.wins++;
      s.stats=s.stats||{};s.stats.dungeons=Number(s.stats.dungeons||0)+1;
      s.dungeonStats.streak++;
      s.dungeonClears[d.id]=Number(s.dungeonClears[d.id]||0)+1;

      const parts=[`+${fmt218(rw.gold)} arany`];
      if(rw.ore) parts.push(`+${rw.ore} érc`);
      if(rw.gems) parts.push(`+${rw.gems} gyémánt`);
      if(rw.soul) parts.push(`+${rw.soul} lélekkő`);

      if(typeof toast==="function") toast(`🏆 ${d.name} sikerült! ${parts.join(" · ")}`);
    }else{
      s.dungeonStats.losses++;
      s.dungeonStats.streak=0;

      // Dungeon death should not trap players: revive at full HP.
      try{
        if(typeof v10MaxHp==="function") s.playerHp=v10MaxHp();
        else if(Number(s.maxHp)) s.playerHp=Number(s.maxHp);
      }catch(e){}

      if(typeof toast==="function") toast(`💀 ${d.name} sikertelen. A jegy elfogyott, de teljes HP-val folytatod.`);
    }

    if(typeof persist==="function") persist();
    if(typeof renderAll==="function") renderAll();
    renderDungeonV218();
  }

  function renderDungeonV218(){
    const p=document.getElementById("page-dungeon");
    if(!p)return;
    ensureDungeonState();

    let root=p.querySelector("#v218DungeonSystem");
    if(!root){
      root=document.createElement("section");
      root.id="v218DungeonSystem";
      root.className="card v218-dungeon-system";

      // Hide old dungeon cards to avoid duplicate systems.
      [...p.children].forEach(ch=>{
        if(ch!==root && !ch.classList?.contains("v212-context-bar")){
          const t=(ch.textContent||"").toLowerCase();
          if(t.includes("kazamata") || t.includes("dungeon")){
            ch.classList.add("v218-old-dungeon-hidden");
          }
        }
      });

      p.appendChild(root);
    }

    const s=s218();
    const stats=s.dungeonStats||{runs:0,wins:0,losses:0,streak:0};

    root.innerHTML=`
      <div class="v218-dungeon-head">
        <div>
          <small>🏰 KAZAMATA RENDSZER</small>
          <h2>Kazamaták</h2>
          <p>Az első kazamata biztonságos farm. A többi kazamatánál az ajánlott erő csak esélyt jelent, nem garantált sikert.</p>
        </div>
        <div class="v218-dungeon-summary">
          <div><small>🎫 Jegy</small><b>${fmt218(s.tickets||0)}</b></div>
          <div><small>🔵 Lélekkő</small><b>${fmt218(s.soul||0)}</b></div>
          <div><small>⚔️ Erő</small><b>${fmt218(p218())}</b></div>
          <div><small>🏆 Siker</small><b>${stats.wins}</b></div>
          <div><small>💀 Bukás</small><b>${stats.losses}</b></div>
        </div>
      </div>

      <div class="v218-dungeon-grid">
        ${DUNGEONS_V218.map(d=>{
          const chance=Math.round(successChance(d)*100);
          const clears=Number(s.dungeonClears?.[d.id]||0);
          return `
          <article class="v218-dungeon-card ${d.safe?"safe":""} theme-${d.visualTheme||"cave"}">
            <div class="v220-card-scene">
              <div class="v220-card-decor">${d.visualDecor?.[0]||"✦"} ${d.visualDecor?.[1]||"✦"}</div>
              <div class="v220-card-boss">${d.bossIcon||"👹"}</div>
              <div class="v220-card-shadow"></div>
            </div>
            <div class="v218-dungeon-title">
              <span class="v218-dungeon-icon">${d.icon}</span>
              <div><h3>${d.name}</h3><small>${d.safe?"Biztonságos farm":"Kockázatos kazamata"}</small></div>
            </div>
            <p>${d.desc}</p>

            <div class="v218-dungeon-stats">
              <span><small>Ajánlott erő</small><b>${fmt218(d.reqPower)}</b></span>
              <span><small>Jegy</small><b>${d.ticketCost}</b></span>
              <span><small>Siker esélyed</small><b>${d.safe?"100%":chance+"%"}</b></span>
              <span><small>Teljesítve</small><b>${clears}×</b></span>
            </div>

            <div class="v218-chance">
              <div style="width:${d.safe?100:chance}%"></div>
            </div>

            <div class="v218-rewards">
              <small>Lehetséges jutalom</small>
              <div>
                💰 ${fmt218(d.rewards.gold[0])}–${fmt218(d.rewards.gold[1])}
                · ⛏️ ${d.rewards.ore[0]}–${d.rewards.ore[1]}
                ${d.rewards.gems[1]>0?` · 💎 ${d.rewards.gems[0]}–${d.rewards.gems[1]}`:""}
                ${d.rewards.soul[1]>0?` · 🔵 ${d.rewards.soul[0]}–${d.rewards.soul[1]}`:""}
              </div>
            </div>

            <button type="button" data-v218-dungeon="${d.id}">
              ${d.safe?"🌾 Farmolás":"⚔️ Belépés"} · ${d.ticketCost} jegy
            </button>
          </article>`;
        }).join("")}
      </div>
    `;

    root.querySelectorAll("[data-v218-dungeon]").forEach(btn=>{
      btn.onclick=()=>{
        const d=DUNGEONS_V218.find(x=>x.id===btn.dataset.v218Dungeon);
        if(d) runDungeon(d);
      };
    });
  }

  window.DUNGEONS_V218=DUNGEONS_V218;
  window.v218RenderDungeon=renderDungeonV218;
  window.v218RunDungeon=runDungeon;

  window.addEventListener("load",()=>setTimeout(renderDungeonV218,250));
  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="dungeon"]')) setTimeout(renderDungeonV218,80);
  },true);
})();


/* ================= V21.9 DUNGEON BOSS HP / VISUAL FIGHT ================= */
(function(){
  let activeBattle=null;
  let battleTimer=null;

  function S(){ return (typeof save!=="undefined"&&save)?save:{}; }
  function P(){ return (typeof power==="function")?Number(power()||0):0; }
  function F(n){ return (typeof fmt==="function")?fmt(Number(n||0)):Math.floor(Number(n||0)).toLocaleString("hu-HU"); }

  function maxPlayerHp(){
    const s=S();
    try{
      if(typeof v10MaxHp==="function") return Math.max(1,Number(v10MaxHp()||1));
    }catch(e){}
    return Math.max(1,Number(s.maxHp||s.playerHp||100));
  }

  function bossMaxHp(d){
    return Math.max(
      250,
      Math.floor(Number(d.reqPower||100) * (d.safe ? 2.2 : 4.8))
    );
  }

  function ensureBattlePanel(root){
    let panel=root.querySelector("#v219DungeonBattle");
    if(!panel){
      panel=document.createElement("section");
      panel.id="v219DungeonBattle";
      panel.className="v219-dungeon-battle hidden";
    }
    const activeId=activeBattle?.dungeon?.id;
    const activeButton=activeId?root.querySelector(`[data-v218-dungeon="${activeId}"]`):null;
    const activeCard=activeButton?.closest(".v218-dungeon-card");
    const target=activeCard||root;
    if(panel.parentNode!==target)target.prepend(panel);
    return panel;
  }


  function triggerDungeonEffect(type){
    const panel=document.getElementById("v219DungeonBattle");
    if(!panel)return;
    panel.dataset.effect=String(type||"rockfall");
    panel.classList.remove("v221-cast");
    void panel.offsetWidth;
    panel.classList.add("v221-cast");
    setTimeout(()=>panel.classList.remove("v221-cast"),420);
  }

  function drawBattle(){
    const root=document.getElementById("v218DungeonSystem");
    if(!root)return;
    const panel=ensureBattlePanel(root);

    if(!activeBattle){
      panel.classList.add("hidden");
      return;
    }

    const b=activeBattle;
    const php=Math.max(0,Math.min(100,(b.playerHp/b.playerMaxHp)*100));
    const bhp=Math.max(0,Math.min(100,(b.bossHp/b.bossMaxHp)*100));

    panel.classList.remove("hidden");
    panel.innerHTML=`
      <div class="v219-battle-title">
        <div>
          <small>⚔️ KAZAMATA HARC</small>
          <h3>${b.dungeon.name}</h3>
        </div>
        <div class="v219-battle-round">Kör ${b.round}</div>
      </div>
      <div class="v216-dungeon-controls">
        <span>Harc gyorsítása</span>
        <button type="button" data-v216-dungeon-speed="1" class="${(b.speed||1)===1?"active":""}">1×</button>
        <button type="button" data-v216-dungeon-speed="2" class="${b.speed===2?"active":""}">2×</button>
        <button type="button" data-v216-dungeon-speed="5" class="${b.speed===5?"active":""}">5×</button>
        <button type="button" data-v216-dungeon-skip class="skip">⏭ SKIP HARC</button>
      </div>

      <div class="v220-arena theme-${b.dungeon.visualTheme||"cave"}">
        <div class="v220-bg-decor left">${b.dungeon.visualDecor?.[0]||"✦"}</div>
        <div class="v220-bg-decor right">${b.dungeon.visualDecor?.[1]||"✦"}</div>
        <div class="v220-ground"></div>
        <div class="v220-particles">
          <i></i><i></i><i></i><i></i><i></i><i></i>
        </div>
        <div class="v221-effect-layer effect-${b.dungeon.effectType||"rockfall"}">
          <span class="v221-effect-main">${b.dungeon.effectIcon||"✦"}</span>
          <i></i><i></i><i></i><i></i><i></i>
        </div>

        <div class="v219-fighters">
        <div class="v219-fighter player">
          <div class="v219-fighter-icon">🧙</div>
          <div class="v219-fighter-main">
            <div class="v219-name-row"><b>Saját karakter</b><span>${F(Math.max(0,b.playerHp))} / ${F(b.playerMaxHp)} HP</span></div>
            <div class="v219-hp"><div style="width:${php}%"></div></div>
            <small>⚔️ Erő: ${F(P())}</small>
          </div>
        </div>

        <div class="v219-versus">VS</div>

        <div class="v219-fighter boss">
          <div class="v219-boss-icon">${b.dungeon.bossIcon||"👹"}</div>
          <div class="v219-fighter-main">
            <div class="v219-name-row"><b>${b.dungeon.bossName||"Kazamata Boss"}</b><span>${F(Math.max(0,b.bossHp))} / ${F(b.bossMaxHp)} HP</span></div>
            <div class="v219-hp boss"><div style="width:${bhp}%"></div></div>
            <small>☠️ Boss erő: ${F(b.dungeon.reqPower)}</small>
          </div>
        </div>
        </div>
      </div>

      <div class="v219-combat-log">${b.log||"A harc elkezdődött..."}</div>
    `;
    panel.querySelectorAll("[data-v216-dungeon-speed]").forEach(btn=>btn.onclick=()=>{if(!activeBattle)return;activeBattle.speed=Number(btn.dataset.v216DungeonSpeed)||1;drawBattle()});
    panel.querySelector("[data-v216-dungeon-skip]")?.addEventListener("click",()=>{if(activeBattle&&!activeBattle.finished)finishBattle(Boolean(activeBattle.win))});
  }

  function finishBattle(win){
    if(!activeBattle||activeBattle.finished)return;
    const b=activeBattle;
    b.finished=true;
    const d=b.dungeon;
    const s=S();

    clearInterval(battleTimer);
    battleTimer=null;

    if(win){
      const rw=(function(){
        const r=d.rewards||{};
        function rr(x){const a=Number(x?.[0]||0),c=Number(x?.[1]??a);return Math.floor(a+Math.random()*(c-a+1))}
        const out={gold:rr(r.gold),ore:rr(r.ore),gems:rr(r.gems),soul:rr(r.soul)};
        s.gold=Number(s.gold||0)+out.gold;
        s.ore=Number(s.ore||0)+out.ore;
        s.gems=Number(s.gems||0)+out.gems;
        s.soul=Number(s.soul||0)+out.soul;
        s.stats=s.stats||{};s.stats.goldEarned=Number(s.stats.goldEarned||0)+out.gold;
        return out;
      })();

      s.dungeonStats.wins++;
      s.stats=s.stats||{};s.stats.dungeons=Number(s.stats.dungeons||0)+1;
      s.dungeonStats.streak++;
      s.dungeonClears[d.id]=Number(s.dungeonClears[d.id]||0)+1;

      b.bossHp=0;
      b.log=`🏆 ${d.bossName} legyőzve! +${F(rw.gold)} arany${rw.ore?` · +${rw.ore} érc`:""}${rw.gems?` · +${rw.gems} gyémánt`:""}${rw.soul?` · +${rw.soul} lélekkő`:""}`;
      drawBattle();
      const endgameDrop=window.v225TryDungeonGearDrop?.(d);
      if(endgameDrop){
        const rn=window.v225EndgameRarities?.[endgameDrop.rarity];
        if(typeof toast==="function")toast(`${rn?.icon||"✨"} ${rn?.name||endgameDrop.rarity} DROP! ${endgameDrop.name}`);
      }else if(typeof toast==="function")toast(`🏆 ${d.name} teljesítve!`);
    }else{
      s.dungeonStats.losses++;
      s.dungeonStats.streak=0;
      b.playerHp=0;
      b.log=`💀 ${d.bossName} legyőzött. A jegy elfogyott, de teljes HP-val éledsz újra.`;
      drawBattle();

      const mh=maxPlayerHp();
      s.playerHp=mh;
      if(typeof toast==="function")toast(`💀 ${d.name} sikertelen.`);
    }

    if(typeof persist==="function")persist();
    if(typeof renderAll==="function")renderAll();

    setTimeout(()=>{
      activeBattle=null;
      if(typeof window.v218RenderDungeon==="function")window.v218RenderDungeon();
    },1800);
  }

  function startBattle(d){
    const s=S();
    if(!s.dungeonStats)s.dungeonStats={runs:0,wins:0,losses:0,streak:0};
    if(!s.dungeonClears)s.dungeonClears={};

    const tickets=Number(s.tickets||0);
    if(tickets<Number(d.ticketCost||1)){
      if(typeof toast==="function")toast(`🎫 Nincs elég Dungeon jegyed. Kell: ${d.ticketCost}`);
      return;
    }

    if(activeBattle)return;

    s.tickets=tickets-Number(d.ticketCost||1);
    s.dungeonStats.runs++;

    const chance=(function(){
      if(d.safe)return 1;
      const p=Math.max(1,P()), r=Math.max(1,Number(d.reqPower||1)), ratio=p/r;
      let c;
      if(ratio<.50)c=.08+ratio*.20;
      else if(ratio<.80)c=.20+(ratio-.50)*.70;
      else if(ratio<1.00)c=.45+(ratio-.80)*1.25;
      else if(ratio<1.50)c=.70+(ratio-1.00)*.40;
      else c=.90+Math.min(.05,(ratio-1.50)*.03);
      return Math.max(.05,Math.min(.95,c));
    })();

    const predeterminedWin=d.safe || Math.random()<chance;
    const ph=maxPlayerHp();
    const bh=bossMaxHp(d);

    activeBattle={
      dungeon:d,
      playerHp:ph,
      playerMaxHp:ph,
      bossHp:bh,
      bossMaxHp:bh,
      round:1,
      speed:1,
      win:predeterminedWin,
      log:`${d.bossIcon||"👹"} ${d.bossName||"Boss"} megjelent!`
    };

    drawBattle();

    battleTimer=setInterval(()=>{
      const steps=Math.max(1,Math.min(5,Number(activeBattle?.speed||1)));
      for(let fastStep=0;fastStep<steps;fastStep++){
      if(!activeBattle||!battleTimer)return;
      const b=activeBattle;
      b.round++;

      // Visual damage tuned so the pre-rolled result remains consistent with the displayed success chance.
      const roundsTarget=7+Math.floor(Math.random()*4);

      if(b.win){
        const bossDmg=Math.max(1,Math.floor(b.bossMaxHp/roundsTarget*(.82+Math.random()*.35)));
        const incoming=d.safe
          ? Math.max(1,Math.floor(b.playerMaxHp*.035))
          : Math.max(1,Math.floor(b.playerMaxHp*(.045+Math.random()*.045)));
        b.bossHp=Math.max(0,b.bossHp-bossDmg);
        b.playerHp=d.safe
          ? Math.max(Math.floor(b.playerMaxHp*.35),b.playerHp-incoming)
          : Math.max(1,b.playerHp-incoming);
        b.log=`⚔️ ${F(bossDmg)} sebzés a bossnak · ☠️ ${F(incoming)} sebzés érkezett.`; triggerDungeonEffect(b.dungeon.effectType); document.getElementById("v219DungeonBattle")?.classList.add("v220-hit"); setTimeout(()=>document.getElementById("v219DungeonBattle")?.classList.remove("v220-hit"),180);

        if(b.bossHp<=0 || b.round>=12){
          b.bossHp=0;
          finishBattle(true);
          return;
        }
      }else{
        const bossDmg=Math.max(1,Math.floor(b.bossMaxHp*(.045+Math.random()*.045)));
        const incoming=Math.max(1,Math.floor(b.playerMaxHp*(.11+Math.random()*.09)));
        b.bossHp=Math.max(Math.floor(b.bossMaxHp*.18),b.bossHp-bossDmg);
        b.playerHp=Math.max(0,b.playerHp-incoming);
        b.log=`⚔️ ${F(bossDmg)} sebzés a bossnak · 💥 ${F(incoming)} sebzést kaptál.`; triggerDungeonEffect(b.dungeon.effectType); document.getElementById("v219DungeonBattle")?.classList.add("v220-hit"); setTimeout(()=>document.getElementById("v219DungeonBattle")?.classList.remove("v220-hit"),180);

        if(b.playerHp<=0 || b.round>=10){
          b.playerHp=0;
          finishBattle(false);
          return;
        }
      }
      drawBattle();
      }
    },480);
  }

  // Enhance the current V21.8 renderer with boss card presentation + bind battle start.
  const oldRender=window.v218RenderDungeon;
  function enhancedRender(){
    if(typeof oldRender==="function")oldRender();

    const root=document.getElementById("v218DungeonSystem");
    if(!root)return;

    ensureBattlePanel(root);

    root.querySelectorAll("[data-v218-dungeon]").forEach(btn=>{
      const id=btn.dataset.v218Dungeon;
      const d=(window.DUNGEONS_V218||[]).find(x=>x.id===id);
      if(!d)return;

      const card=btn.closest(".v218-dungeon-card");
      if(card && !card.querySelector(".v219-boss-preview")){
        const title=card.querySelector(".v218-dungeon-title");
        const boss=document.createElement("div");
        boss.className="v219-boss-preview";
        boss.innerHTML=`
          <span>${d.bossIcon||"👹"}</span>
          <div><small>Boss</small><b>${d.bossName||"Kazamata Boss"}</b></div>`;
        if(title)title.after(boss);
      }

      btn.onclick=()=>startBattle(d);
    });

    if(activeBattle)drawBattle();
  }

  window.v218RenderDungeon=enhancedRender;
  window.v219StartDungeonBattle=startBattle;

  window.addEventListener("load",()=>setTimeout(enhancedRender,320));
  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="dungeon"]'))setTimeout(enhancedRender,100);
  },true);
})();

/* V22.2 admin 10x compatibility: existing combat speed uses save.speed10Unlocked */
window.v222AdminSpeedSupported=true;

/* ================= V22.32 PET CRAFT: COMMON → ETERNAL · 10 GEM / CRAFT ================= */
(function(){
  const TIERS=["common","rare","mythic","legendary","celestial","imperial","eternal"];
  const TIER_NAMES={common:"Common",rare:"Rare",mythic:"Mythic",legendary:"Legendary",celestial:"Celestial",imperial:"Imperial",eternal:"Eternal"};
  const DEFAULT_COSTS={rare:10,mythic:10,legendary:10,celestial:10,imperial:10,eternal:10};
  const DEFAULT_REQUIREMENTS={rare:5,mythic:3,legendary:3,celestial:3,imperial:3,eternal:3};
  function S(){return typeof save!=="undefined"&&save?save:{}}
  function pets(){return Array.isArray(S().pets)?S().pets:[]}
  function pname(p){return String(p?.name||p?.title||"Pet")}
  function tier(p){const t=String(p?.fusionRarity||"common").toLowerCase();return TIERS.includes(t)?t:"common"}
  function tierName(p){return TIER_NAMES[tier(p)]}
  function requirements(){return {...DEFAULT_REQUIREMENTS,...(window.OMI_CONTENT?.economy?.petFusionRequirements||{})}}
  function required(p){const n=nextTier(p);return n?Math.max(2,Math.floor(Number(requirements()[n]??3))):0}
  function nextTier(p){const i=TIERS.indexOf(tier(p));return i>=0&&i<TIERS.length-1?TIERS[i+1]:null}
  function costs(){return {...DEFAULT_COSTS,...(window.OMI_CONTENT?.economy?.petFusionCosts||{})}}
  function craftCost(p){const n=nextTier(p);return n?Math.max(0,Math.floor(Number(costs()[n]??0))):0}
  function value(p){return Math.max(0,Number(p?.value||0))}
  function effectivePetPct(p){return value(p)*100}
  function pkey(p){return [p?.baseId??p?.species??pname(p),p?.bonus||"",tier(p)].join("|")}
  function migrateOldFusion(){pets().forEach(p=>{if(p.fusionRarity)return;const old=Math.max(0,Math.floor(Number(p.fusionLevel||0))),mult=Math.max(1,Number(p.fusionMultiplier||1));p.value=value(p)*mult;p.fusionRarity=TIERS[Math.min(old,TIERS.length-1)]||"common";p.fusionLevel=TIERS.indexOf(p.fusionRarity);p.fusionMultiplier=1})}
  function fusionGroups(){
    const map={};
    pets().forEach((p,i)=>{if(!nextTier(p))return;(map[pkey(p)]||=[]).push({p,i})});
    return Object.values(map).filter(g=>g.length>=required(g[0].p));
  }
  function fuse(group){
    const arr=pets();if(!group?.length)return null;
    const need=required(group[0].p),to=nextTier(group[0].p),cost=craftCost(group[0].p);
    if(!to||group.length<need||Number(S().gems||0)<cost)return null;
    const picked=group.slice(0,need),activeObjects=(S().activePets||[]).map(i=>arr[i]).filter(Boolean);
    const out=JSON.parse(JSON.stringify(picked[0].p));
    out.fusionRarity=to;out.fusionLevel=TIERS.indexOf(to);out.fusionMultiplier=1;
    out.value=picked.reduce((sum,x)=>sum+value(x.p),0);
    out.basePct=out.value;out.bonusPct=out.value;
    S().gems-=cost;
    picked.map(x=>x.i).sort((a,b)=>b-a).forEach(i=>arr.splice(i,1));arr.push(out);
    S().activePets=activeObjects.map(p=>arr.indexOf(p)).filter(i=>i>=0).slice(0,S().petSlotsUnlocked||1);
    S().activePet=S().activePets[0]??null;
    return {pet:out,cost,need};
  }
  function renderFusionPanel(){
    migrateOldFusion();
    const page=document.getElementById("page-pets");if(!page)return;
    let panel=page.querySelector("#v224PetFusion");
    if(!panel){panel=document.createElement("section");panel.id="v224PetFusion";panel.className="card v224-pet-fusion v231-pet-craft";const anchor=page.querySelector(".pet-grid")||page.firstElementChild;anchor?.parentNode?.insertBefore(panel,anchor)}
    const groups=fusionGroups(),req=requirements(),rule=`Rare ${req.rare}× · Mythic ${req.mythic}× · Legendary ${req.legendary}× · Celestial ${req.celestial}× · Imperial ${req.imperial}× · Eternal ${req.eternal}×`;
    panel.innerHTML=`<div class="v224-head"><div><h3>🧬 Pet kraftolás · Common → Eternal</h3><small>Csak teljesen egyforma nevű, adottságú és kraftszintű petek olvaszthatók össze. Az új pet bónusza az összes felhasznált pet értékének pontos összege.</small></div><div class="v224-rule">${rule}</div></div><div class="v231-tier-road">${TIERS.map((t,i)=>`<span class="tier-${t}">${TIER_NAMES[t]}${i<TIERS.length-1?" →":""}</span>`).join("")}</div><div class="v224-groups">${groups.length?groups.map((g,i)=>{const p=g[0].p,n=nextTier(p),need=required(p),cost=craftCost(p),total=g.slice(0,need).reduce((s,x)=>s+value(x.p),0);return `<div class="v224-fuse-row tier-${tier(p)}"><div><b>${pname(p)} · ${tierName(p)} ×${g.length}</b><small>${need} pet: ${g.slice(0,need).map(x=>(value(x.p)*100).toFixed(0)+"%").join(" + ")} = <strong>${(total*100).toFixed(0)}%</strong> · Következő: ${TIER_NAMES[n]}</small></div><button data-v224-fuse="${i}" ${Number(S().gems||0)<cost?"disabled":""}>🧬 ${need} PET + 💎 ${cost}</button></div>`}).join(""):`<div class="v224-empty">Még nincs elegendő teljesen egyforma peted. A szükséges darabszámokat az admin által beállított kraftszabályok határozzák meg.</div>`}</div>`;
    panel.querySelectorAll("[data-v224-fuse]").forEach(btn=>btn.onclick=()=>{const group=fusionGroups()[Number(btn.dataset.v224Fuse)];if(!group)return;const cost=craftCost(group[0].p);if(Number(S().gems||0)<cost)return toast(`Nincs elég gyémánt. Szükséges: ${cost} 💎`);const result=fuse(group);if(!result)return;persist();renderAll();toast(`🧬 ${pname(result.pet)} → ${tierName(result.pet)} · ${(value(result.pet)*100).toFixed(0)}% · -${result.cost} 💎`);renderFusionPanel()});
  }
  window.v224PetFusionMultiplier=()=>1;
  window.v224EffectivePetPct=effectivePetPct;
  window.v231PetTier=tier;
  window.v231PetTierName=tierName;
  window.v231RenderPetCraft=renderFusionPanel;
  migrateOldFusion();
  window.addEventListener("load",()=>setTimeout(renderFusionPanel,250));
  document.addEventListener("click",e=>{if(e.target.closest?.('[data-tab="pets"]'))setTimeout(renderFusionPanel,80)},true);
})();

/* V22.4 PvE balancing around pet fusion */
(function(){
  function petPressure(){
    const m=window.v224PetFusionMultiplier?.()||1;
    // only part of pet power feeds enemy scaling so fusion still feels rewarding
    return 1 + Math.max(0,m-1)*0.42;
  }

  const oldNormal=window.normalEnemyMaxHp;
  if(typeof oldNormal==="function"){
    window.normalEnemyMaxHp=function(){
      const base=oldNormal();
      const wave=Math.max(1,Number(save?.wave||1));
      const progression=1 + Math.pow(Math.max(0,wave-1),1.08)*0.0045;
      return Math.floor(base*petPressure()*progression);
    };
  }

  const oldBoss=window.v10BossMaxHp;
  if(typeof oldBoss==="function"){
    window.v10BossMaxHp=function(){
      const base=oldBoss();
      const wave=Math.max(1,Number(save?.wave||1));
      const bossScale=1 + Math.pow(wave,1.10)*0.0035;
      return Math.floor(base*petPressure()*bossScale);
    };
  }
})();

/* V22.4 pet labels */
(function(){
  function annotate(){
    const p=document.getElementById("page-pets");
    if(!p)return;
    p.querySelectorAll("[data-pet],.pet-card").forEach(card=>{
      const txt=card.textContent||"";
      if(card.querySelector(".v224-fusion-badge,.pet-craft-tier"))return;
      const name=[...(save?.pets||[])].find(x=>txt.includes(x.name||"___"));
      if(!name)return;
      const tier=window.v231PetTier?.(name)||"common";
      const b=document.createElement("span");
      b.className="v224-fusion-badge";
      b.textContent=`${window.v231PetTierName?.(name)||tier} · ${window.v224EffectivePetPct?.(name)?.toFixed?.(1) ?? "?"}%`;
      card.appendChild(b);
    });
  }
  window.addEventListener("load",()=>setTimeout(annotate,400));
  document.addEventListener("click",()=>setTimeout(annotate,120),true);
})();


/* ================= V22.5 ENDGAME DUNGEON GEAR ================= */
(function(){
  const ENDGAME_RARITIES={
    immortal:{
      name:"Immortal", icon:"♾️", tier:1, tierLabel:"T1",
      minDungeonPower:55000, gearMult:1.38, optionMult:1.25, dropBase:.035
    },
    celestial:{
      name:"Celestial", icon:"🌌", tier:2, tierLabel:"T2",
      minDungeonPower:150000, gearMult:1.78, optionMult:1.50, dropBase:.020
    },
    eternal:{
      name:"Eternal", icon:"🔥", tier:3, tierLabel:"T3",
      minDungeonPower:300000, gearMult:2.30, optionMult:1.85, dropBase:.010
    }
  };
  const SLOTS=["weapon","helmet","armor","gloves","boots","ring"];
  const SLOT_NAMES={weapon:"Fegyver",helmet:"Sisak",armor:"Páncél",gloves:"Kesztyű",boots:"Csizma",ring:"Gyűrű"};

  function S(){return (typeof save!=="undefined"&&save)?save:{};}
  function playerPower(){try{return typeof power==="function"?Number(power()||0):0}catch(e){return 0}}


  function eligibleRarities(dungeonPower){
    return Object.entries(ENDGAME_RARITIES)
      .filter(([,cfg])=>Number(dungeonPower||0)>=cfg.minDungeonPower)
      .map(([key,cfg])=>({key,...cfg}));
  }

  function strongestEligibleRarity(dungeonPower){
    if(dungeonPower>=ENDGAME_RARITIES.eternal.minDungeonPower)return "eternal";
    if(dungeonPower>=ENDGAME_RARITIES.celestial.minDungeonPower)return "celestial";
    if(dungeonPower>=ENDGAME_RARITIES.immortal.minDungeonPower)return "immortal";
    return null;
  }

  function makeGear(rarity,dungeon){
    const cfg=ENDGAME_RARITIES[rarity];
    const slot=SLOTS[Math.floor(Math.random()*SLOTS.length)];
    const dp=Math.max(cfg.minDungeonPower,Number(dungeon.reqPower||cfg.minDungeonPower));
    const base=Math.max(1,Math.floor(Math.sqrt(dp)*10*cfg.gearMult));
    const variance=.90+Math.random()*.21;
    const strength=Math.floor(base*variance);

    return {
      id:"dg_"+Date.now()+"_"+Math.random().toString(36).slice(2,8),
      name:`${cfg.name} ${SLOT_NAMES[slot]}`,
      slot,
      rarity,
      rarityTier:cfg.tier,
      rarityTierLabel:cfg.tierLabel,
      level:0,
      plus:0,
      power:strength,
      attack:slot==="weapon"?Math.floor(strength*1.10):Math.floor(strength*.22),
      defense:slot!=="weapon"?Math.floor(strength*.62):Math.floor(strength*.12),
      hp:Math.floor(strength*(slot==="armor"?5.2:2.0)),
      optionMultiplier:cfg.optionMult,
      dungeonOnly:true,
      sourceDungeon:dungeon.id,
      locked:false,
      createdAt:Date.now()
    };
  }

  function inv(){
    const s=S();
    if(Array.isArray(s.inventory))return s.inventory;
    if(Array.isArray(s.items))return s.items;
    s.inventory=[];
    return s.inventory;
  }

  function tryDungeonGearDrop(dungeon){
    const dp=Number(dungeon?.reqPower||0);

    // HARD RULE: below 55,000 recommended dungeon power these rarities can NEVER drop.
    if(dp<55000)return null;

    const rarity=strongestEligibleRarity(dp);
    if(!rarity)return null;
    const cfg=ENDGAME_RARITIES[rarity];

    // Player must also actually be at least 55k power.
    if(playerPower()<55000)return null;

    // Slightly better chance in harder dungeons while remaining rare.
    const over=Math.max(0,dp/cfg.minDungeonPower-1);
    const chance=Math.min(.12,cfg.dropBase+over*.012);

    if(Math.random()>=chance)return null;

    const item=makeGear(rarity,dungeon);
    inv().push(item);
    return item;
  }

  window.v225TryDungeonGearDrop=tryDungeonGearDrop;
  window.v225EndgameRarities=ENDGAME_RARITIES;
})();


/* ================= V22.6 DUNGEON RARITY LEVEL DISPLAY ================= */
(function(){
  function fmtN(n){return (typeof fmt==="function")?fmt(n):Math.floor(Number(n||0)).toLocaleString("hu-HU");}

  function rarityRowsForDungeon(d){
    const cfgs=window.v225EndgameRarities||{};
    return Object.entries(cfgs)
      .filter(([,cfg])=>Number(d?.reqPower||0)>=Number(cfg.minDungeonPower||0))
      .map(([key,cfg])=>({key,...cfg}));
  }

  function injectDungeonRarityInfo(){
    const root=document.getElementById("v218DungeonSystem");
    const dungeons=window.DUNGEONS_V218||[];
    if(!root)return;

    root.querySelectorAll("[data-v218-dungeon]").forEach(btn=>{
      const id=btn.dataset.v218Dungeon;
      const d=dungeons.find(x=>x.id===id);
      const card=btn.closest(".v218-dungeon-card");
      if(!d||!card)return;

      let box=card.querySelector(".v226-rarity-drop-box");
      if(!box){
        box=document.createElement("div");
        box.className="v226-rarity-drop-box";
        const reward=card.querySelector(".v218-rewards");
        if(reward)reward.after(box);
        else btn.before(box);
      }

      const rows=rarityRowsForDungeon(d);

      if(Number(d.reqPower||0)<55000){
        box.innerHTML=`
          <small>💎 Endgame rare gear</small>
          <div class="v226-locked">🔒 55 000+ ajánlott erősségű Dungeonban nyílik meg.</div>`;
        return;
      }

      box.innerHTML=`
        <small>💎 Ebből a Dungeonból eshet</small>
        <div class="v226-rarity-list">
          ${rows.map(r=>`
            <span class="v226-rarity ${r.key}">
              <b>${r.icon} ${r.name}</b>
              <em>${r.tierLabel || ("T"+r.tier)}</em>
              <small>${fmtN(r.minDungeonPower)}+ Dungeon</small>
            </span>
          `).join("")}
        </div>`;
    });
  }

  function injectGlobalLegend(){
    const page=document.getElementById("page-dungeon");
    if(!page)return;
    let legend=page.querySelector("#v226EndgameLegend");
    if(!legend){
      legend=document.createElement("section");
      legend.id="v226EndgameLegend";
      legend.className="card v226-endgame-legend";
      const root=page.querySelector("#v218DungeonSystem");
      if(root)page.insertBefore(legend,root);
      else page.prepend(legend);
    }

    const cfgs=window.v225EndgameRarities||{};
    legend.innerHTML=`
      <div class="v226-legend-head">
        <div>
          <h3>💎 Endgame Dungeon Gear</h3>
          <small>A magasabb Dungeonökből egyre magasabb rarity tier nyílik meg.</small>
        </div>
      </div>
      <div class="v226-legend-grid">
        ${Object.entries(cfgs).map(([key,cfg])=>`
          <div class="v226-legend-item ${key}">
            <span>${cfg.icon}</span>
            <div>
              <b>${cfg.name} · ${cfg.tierLabel || ("T"+cfg.tier)}</b>
              <small>${fmtN(cfg.minDungeonPower)}+ ajánlott Dungeon erőtől</small>
            </div>
          </div>`).join("")}
      </div>
      <p>55 000 alatt ezek a ritkaságok nem eshetnek. Minél magasabb Dungeonba mész, annál magasabb tier válik elérhetővé.</p>`;
  }

  function refresh(){
    injectGlobalLegend();
    injectDungeonRarityInfo();
  }

  window.v226RefreshDungeonRarityInfo=refresh;
  window.addEventListener("load",()=>setTimeout(refresh,350));
  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="dungeon"]'))setTimeout(refresh,120);
  },true);
})();

/* ================= V22.7 DISCORD WIDGET ================= */
(function(){
  function bindDiscord(){
    const w=document.getElementById("v227DiscordWidget");
    const t=document.getElementById("v227DiscordToggle");
    const c=document.getElementById("v227DiscordClose");
    if(!w||!t||t.dataset.bound)return;
    t.dataset.bound="1";
    t.onclick=()=>w.classList.toggle("open");
    if(c)c.onclick=()=>w.classList.remove("open");
    document.addEventListener("keydown",e=>{if(e.key==="Escape")w.classList.remove("open")});
  }
  window.addEventListener("load",bindDiscord);
})();

/* ================= V22.8 DISCORD LEVEL RANK LINK ================= */
(function(){
  async function getLinkCode(){
    const out=document.getElementById("v228DiscordLinkResult");
    if(!out)return;
    out.innerHTML="Kód készítése...";
    try{
      const r=await fetch("/api/discord/link-code",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"}});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||"Hiba");
      out.innerHTML=`
        <span class="v228-code">${d.code}</span>
        <small>Discordon írd be pontosan:</small>
        <code>/link code:${d.code}</code>
        <small>⏱️ A kód 15 percig érvényes.</small>`;
    }catch(e){
      out.innerHTML=`<span class="v228-error">❌ ${e.message}</span>`;
    }
  }
  function bind(){
    const b=document.getElementById("v228DiscordLinkCode");
    if(b && !b.dataset.bound228){
      b.dataset.bound228="1";
      b.onclick=getLinkCode;
    }
  }
  window.addEventListener("load",bind);
})();


/* ================= V22.9 PVP FIX + VISUAL BATTLE ================= */
(function(){
  let v229BattleTimer=null;
  let v229Battle=null;

  function page(){return document.getElementById("page-pvp");}
  function F(n){return (typeof fmt==="function")?fmt(Number(n||0)):Math.floor(Number(n||0)).toLocaleString("hu-HU");}

  async function api229(url,opt={}){
    const r=await fetch(url,{
      credentials:"include",
      headers:{"Content-Type":"application/json",...(opt.headers||{})},
      ...opt
    });
    let d={};
    try{d=await r.json()}catch(e){}
    if(!r.ok)throw new Error(d.error||d.message||`HTTP ${r.status}`);
    return d;
  }

  function ensureArena(){
    const p=page();
    if(!p)return null;

    let arena=p.querySelector("#v229PvpArena");
    if(!arena){
      arena=document.createElement("section");
      arena.id="v229PvpArena";
      arena.className="card v229-pvp-arena";
      const anchor=p.querySelector(".pvp-arena-v165,.pvp-arena,[class*='pvp-arena']");
      if(anchor?.parentNode)anchor.parentNode.insertBefore(arena,anchor);
      else p.prepend(arena);
    }
    return arena;
  }

  function drawBattle(){
    const arena=ensureArena();
    if(!arena)return;

    if(!v229Battle){
      arena.classList.add("empty");
      arena.innerHTML=`
        <div class="v229-empty">
          <span>⚔️</span>
          <div><b>PvP Aréna</b><small>Válassz ellenfelet és indíts párbajt. A harc itt jelenik meg vizuálisan.</small></div>
        </div>`;
      return;
    }

    arena.classList.remove("empty");
    const b=v229Battle;
    const aPct=Math.max(0,Math.min(100,b.a.hp/b.a.maxHp*100));
    const dPct=Math.max(0,Math.min(100,b.b.hp/b.b.maxHp*100));

    arena.innerHTML=`
      <div class="v229-head">
        <div><small>⚔️ ÉLŐ PÁRBAJ</small><h2>${b.a.name} VS ${b.b.name}</h2></div>
        <div class="v229-round">Kör ${b.round}</div>
      </div>

      <div class="v229-scene">
        <div class="v229-bg-runes">✦ ✧ ⚔ ✧ ✦</div>
        <div class="v229-ground"></div>
        <div class="v229-effect-layer">
          <i></i><i></i><i></i><i></i><i></i>
        </div>

        <div class="v229-fighters">
          <div class="v229-fighter me">
            <div class="v229-avatar">🧙</div>
            <div class="v229-fighter-body">
              <div class="v229-name"><b>${b.a.name}</b><span>${F(b.a.hp)} / ${F(b.a.maxHp)} HP</span></div>
              <div class="v229-hp"><div style="width:${aPct}%"></div></div>
              <small>⚔️ ATK ${F(b.a.atk)} · 🛡️ DEF ${F(b.a.def)} · 🎯 KRIT ${Math.round((b.a.crit||0)*100)}%</small>
            </div>
          </div>

          <div class="v229-vs">VS</div>

          <div class="v229-fighter enemy">
            <div class="v229-avatar">🧛</div>
            <div class="v229-fighter-body">
              <div class="v229-name"><b>${b.b.name}</b><span>${F(b.b.hp)} / ${F(b.b.maxHp)} HP</span></div>
              <div class="v229-hp enemy"><div style="width:${dPct}%"></div></div>
              <small>⚔️ ATK ${F(b.b.atk)} · 🛡️ DEF ${F(b.b.def)} · 🎯 KRIT ${Math.round((b.b.crit||0)*100)}%</small>
            </div>
          </div>
        </div>
      </div>

      <div class="v229-combat-log">${b.log||"A párbaj elkezdődött..."}</div>
    `;
  }

  function hitEffect(side,crit){
    const arena=document.getElementById("v229PvpArena");
    if(!arena)return;
    arena.classList.remove("hit-me","hit-enemy","crit");
    void arena.offsetWidth;
    arena.classList.add(side==="a"?"hit-enemy":"hit-me");
    if(crit)arena.classList.add("crit");
    setTimeout(()=>arena.classList.remove("hit-me","hit-enemy","crit"),260);
  }

  function playBattle(battle){
    clearInterval(v229BattleTimer);

    const A=battle.a||{};
    const B=battle.b||{};
    const logs=Array.isArray(battle.log)?battle.log:[];

    v229Battle={
      a:{...A,hp:Number(A.hp||1),maxHp:Number(A.hp||1)},
      b:{...B,hp:Number(B.hp||1),maxHp:Number(B.hp||1)},
      round:0,
      log:"⚔️ A párbaj elkezdődött..."
    };
    drawBattle();

    let idx=0;
    v229BattleTimer=setInterval(()=>{
      if(!v229Battle || idx>=logs.length){
        clearInterval(v229BattleTimer);
        v229BattleTimer=null;
        if(v229Battle){
          const win=Number(battle.winnerId)===Number(A.id);
          v229Battle.log=win
            ? `🏆 Győzelem! +${F(battle.rewardGold||0)} arany`
            : `💀 Vereség. Fejleszd tovább a karaktered és próbáld újra.`;
          drawBattle();
        }
        return;
      }

      const step=logs[idx++];
      v229Battle.round=Number(step.turn||Math.ceil(idx/2));
      v229Battle.a.hp=Math.max(0,Number(step.aHp ?? v229Battle.a.hp));
      v229Battle.b.hp=Math.max(0,Number(step.bHp ?? v229Battle.b.hp));
      v229Battle.log=`${step.from==="a"?"⚔️ Te":"💥 Ellenfél"} ${F(step.damage)} sebzést okozott${step.crit?" · KRITIKUS!":""}`;
      drawBattle();
      hitEffect(step.from,Boolean(step.crit));
    },420);
  }

  async function fight(defenderId,button){
    if(!defenderId)return;
    const old=button?.textContent;
    try{
      if(button){
        button.disabled=true;
        button.textContent="⚔️ Harc...";
      }
      const data=await api229("/api/pvp/fight",{
        method:"POST",
        body:JSON.stringify({defender_id:Number(defenderId)})
      });
      if(!data?.battle)throw new Error("A szerver nem adott vissza párbaj adatot.");
      playBattle(data.battle);
      if(typeof toast==="function"){
        const meId=data.battle?.a?.id;
        const won=Number(data.battle.winnerId)===Number(meId);
        toast(won?"🏆 PvP győzelem!":"💀 PvP vereség.");
      }
      // refresh opponent/history views after server-side rating/reward update
      if(typeof renderPvp==="function")setTimeout(renderPvp,800);
      if(typeof renderAll==="function")setTimeout(renderAll,900);
    }catch(e){
      if(typeof toast==="function")toast("❌ "+e.message);
      const arena=ensureArena();
      if(arena)arena.innerHTML=`<div class="v229-error">❌ ${e.message}</div>`;
    }finally{
      if(button){
        button.disabled=false;
        if(old!=null)button.textContent=old;
      }
    }
  }

  function bindFightButtons(){
    const p=page();
    if(!p)return;

    // Existing project has used several button/data naming variants over versions.
    const selectors=[
      "[data-pvp-fight]",
      "[data-fight]",
      "[data-defender]",
      ".pvp-fight-btn",
      ".fight-pvp-btn",
      "button[data-player-id]"
    ];

    p.querySelectorAll(selectors.join(",")).forEach(btn=>{
      if(btn.dataset.v229Bound==="1")return;

      const id =
        btn.dataset.pvpFight ||
        btn.dataset.fight ||
        btn.dataset.defender ||
        btn.dataset.playerId ||
        btn.closest("[data-player]")?.dataset.player ||
        btn.closest("[data-opponent]")?.dataset.opponent;

      if(!id)return;

      btn.dataset.v229Bound="1";
      // Capture phase + stopImmediatePropagation avoids old broken handler firing twice.
      btn.addEventListener("click",e=>{
        e.preventDefault();
        e.stopImmediatePropagation();
        fight(id,btn);
      },true);
    });
  }

  function setup(){
    ensureArena();
    drawBattle();
    bindFightButtons();
  }

  window.v229PvpFight=fight;
  window.v229SetupPvp=setup;

  window.addEventListener("load",()=>{setTimeout(setup,250);setTimeout(setup,800)});
  document.addEventListener("click",e=>{
    if(e.target.closest?.('[data-tab="pvp"]')){
      setTimeout(setup,100);
      setTimeout(bindFightButtons,400);
    }
  },true);

  const obs=new MutationObserver(()=>{
    if(page()?.classList.contains("active"))requestAnimationFrame(bindFightButtons);
  });
  window.addEventListener("load",()=>{
    const p=page();
    if(p)obs.observe(p,{childList:true,subtree:true});
  });
})();
