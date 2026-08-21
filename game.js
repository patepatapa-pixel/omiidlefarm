const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const SLOT_NAMES={weapon:"Fegyver",helmet:"Sisak",armor:"Páncél",gloves:"Kesztyű",boots:"Csizma",ring:"Gyűrű"};
const SLOT_ICONS={weapon:"⚔️",helmet:"🪖",armor:"🛡️",gloves:"🧤",boots:"🥾",ring:"💍"};

// Expanded rarities with Celestial for extended progression
const RARITIES=[
 {key:"normal",name:"Normal",mult:1,chance:55},
 {key:"rare",name:"Rare",mult:1.35,chance:24},
 {key:"epic",name:"Epic",mult:1.8,chance:11},
 {key:"mythic",name:"Mythic",mult:2.5,chance:5},
 {key:"legendary",name:"Legendary",mult:3.5,chance:3},
 {key:"celestial",name:"Celestial",mult:5.0,chance:2}
];

const ZONES=[
 {name:"Zöld mező",icon:"🐗",enemy:"Vadkan",hp:45,gold:10,xp:6,need:1,drop:.10},
 {name:"Sötét erdő",icon:"🐺",enemy:"Árnyfarkas",hp:150,gold:9,xp:15,need:25,drop:.13},
 {name:"Elhagyott bánya",icon:"🦂",enemy:"Skorpió",hp:520,gold:16,xp:35,need:70,drop:.16},
 {name:"Démon torony",icon:"👹",enemy:"Démon őr",hp:1700,gold:28,xp:85,need:180,drop:.19},
 {name:"Sárkány-völgy",icon:"🐉",enemy:"Ősi sárkány",hp:6000,gold:48,xp:220,need:450,drop:.23},
 {name:"Mennydörgés fennsík",icon:"⚡",enemy:"Viharóriás",hp:18000,gold:80,xp:600,need:1000,drop:.27},
 {name:"Üresség",icon:"🌌",enemy:"Void Lord",hp:60000,gold:130,xp:1650,need:2200,drop:.31},
 {name:"Isteni kapu",icon:"👁️",enemy:"Égi őrző",hp:190000,gold:210,xp:4500,need:5000,drop:.36}
];

const BASE_UPS=[
 {key:"weaponTraining",name:"Fegyveredzés",icon:"⚔️",base:20,desc:"+ sebzés"},
 {key:"armorTraining",name:"Páncéledzés",icon:"🛡️",base:25,desc:"+ boss arany"},
 {key:"mining",name:"Bányászat",icon:"⛏️",base:35,desc:"+ érc drop"},
 {key:"luck",name:"Szerencse",icon:"🍀",base:50,desc:"+ ritka drop"}
];

const SKILL_TREE=[
 {key:"root",branch:"root",name:"Kalandor mag",icon:"✨",max:10,desc:"A teljes képességfa központja",effect:"+2% teljes sebzés / pont"},
 {key:"power",branch:"combat",name:"Harci erő",icon:"🔥",max:20,req:["root",2],desc:"Erősebb normál támadások",effect:"+2,5% sebzés / pont"},
 {key:"crit",branch:"combat",name:"Kritikus ösztön",icon:"🎯",max:12,req:["power",8],desc:"Gyakoribb kritikus találat",effect:"+0,5% krit esély / pont"},
 {key:"boss",branch:"combat",name:"Bossvadász",icon:"🐲",max:15,req:["crit",5],desc:"Extra sebzés bossok ellen",effect:"+3% boss sebzés / pont"},
 {key:"berserk",branch:"combat",name:"Berserker düh",icon:"🩸",max:12,req:["boss",6],desc:"Tovább növeli minden támadás erejét",effect:"+2% sebzés / pont"},
 {key:"precision",branch:"combat",name:"Halálos pontosság",icon:"🏹",max:10,req:["berserk",5],desc:"Finomítja a kritikus támadásokat",effect:"+0,3% krit esély / pont"},
 {key:"slayer",branch:"combat",name:"Óriásölő",icon:"⚔️",max:10,req:["precision",5],desc:"A legerősebb bossok ellen készít fel",effect:"+2,5% boss sebzés / pont"},
 {key:"warMaster",branch:"combat",name:"Hadúr mesterség",icon:"👹",max:5,req:["slayer",7],desc:"A harci ág végső képessége",effect:"+3% sebzés és +2% boss sebzés / pont"},
 {key:"gold",branch:"farm",name:"Aranyáldás",icon:"💰",max:15,req:["root",2],desc:"Növeli a bossok aranyjutalmát",effect:"+3% bossarany / pont"},
 {key:"drop",branch:"farm",name:"Kincsvadász",icon:"🎁",max:12,req:["gold",6],desc:"Jobb tárgy- és ritka drop",effect:"+0,6% drop / pont"},
 {key:"prospector",branch:"farm",name:"Aranyérzék",icon:"⛏️",max:15,req:["drop",5],desc:"Hatékonyabb hosszú távú farm",effect:"+2% bossarany / pont"},
 {key:"treasure",branch:"farm",name:"Rejtett kincsek",icon:"🗝️",max:10,req:["prospector",6],desc:"Felfedi a ritkább zsákmányt",effect:"+0,5% drop / pont"},
 {key:"merchant",branch:"farm",name:"Kereskedői érzék",icon:"⚖️",max:12,req:["treasure",5],desc:"Többet hoz a bossfarm",effect:"+2% bossarany / pont"},
 {key:"fortune",branch:"farm",name:"A szerencse kegye",icon:"🍀",max:10,req:["merchant",6],desc:"Tovább emeli a tárgydrop esélyét",effect:"+0,4% drop / pont"},
 {key:"farmMaster",branch:"farm",name:"Kincskirály",icon:"💎",max:5,req:["fortune",7],desc:"A farm ág végső képessége",effect:"+3% bossarany és +0,5% drop / pont"},
 {key:"afk",branch:"afk",name:"AFK kiképzés",icon:"💤",max:15,req:["root",2],desc:"Távollét alatt gyorsabban fejlődsz",effect:"+4% AFK farm / pont"},
 {key:"offline",branch:"afk",name:"Álomfarm",icon:"🌙",max:15,req:["afk",6],desc:"További offline kill és jutalom",effect:"+5% AFK farm / pont"},
 {key:"afkCap",branch:"afk",name:"Hosszú pihenő",icon:"⏳",max:10,req:["offline",6],desc:"Hosszabb távollétet számol el",effect:"+1 óra AFK idő / pont"},
 {key:"meditation",branch:"afk",name:"Mély meditáció",icon:"🧘",max:12,req:["afkCap",4],desc:"Hatékonyabbá teszi a távolléti farmot",effect:"+4% AFK farm / pont"},
 {key:"endurance",branch:"afk",name:"Végtelen kitartás",icon:"⌛",max:10,req:["meditation",5],desc:"További elszámolható távollét",effect:"+1 óra AFK idő / pont"},
 {key:"timeless",branch:"afk",name:"Időtlen vadászat",icon:"🌀",max:8,req:["endurance",5],desc:"A hosszú AFK időt is értékessé teszi",effect:"+5% AFK farm / pont"},
 {key:"dreamMaster",branch:"afk",name:"Álomjáró",icon:"🌌",max:5,req:["timeless",6],desc:"Az AFK ág végső képessége",effect:"+6% AFK farm és +1 óra / pont"},
 {key:"pet",branch:"pet",name:"Pet szinkron",icon:"🐾",max:15,req:["root",2],desc:"Felerősíti a petek bónuszait",effect:"+3% pet bónusz / pont"},
 {key:"pack",branch:"pet",name:"Falkavezér",icon:"👑",max:15,req:["pet",6],desc:"Minden felszerelt pet együtt erősödik",effect:"+3% pet bónusz / pont"},
 {key:"bond",branch:"pet",name:"Lélekkötelék",icon:"🔗",max:12,req:["pack",6],desc:"Mélyebb kapcsolat a petekkel",effect:"+2,5% pet bónusz / pont"},
 {key:"instinct",branch:"pet",name:"Vad ösztön",icon:"🐺",max:10,req:["bond",5],desc:"Felerősíti minden pet adottságát",effect:"+2,5% pet bónusz / pont"},
 {key:"alpha",branch:"pet",name:"Alfa parancs",icon:"🦁",max:10,req:["instinct",5],desc:"Összehangolja a teljes petcsapatot",effect:"+2% pet bónusz / pont"},
 {key:"evolution",branch:"pet",name:"Ősi evolúció",icon:"🐉",max:8,req:["alpha",6],desc:"Felszabadítja a petek rejtett erejét",effect:"+3% pet bónusz / pont"},
 {key:"petMaster",branch:"pet",name:"Bestiamester",icon:"🦅",max:5,req:["evolution",6],desc:"A pet ág végső képessége",effect:"+4% pet bónusz / pont"}
];

function skillRank(key){return Math.max(0,Number(save?.skills?.[key]||0))}
function skillBonus(key){
 if(key==="power")return skillRank("root")*.02+skillRank("power")*.025+skillRank("berserk")*.02+skillRank("warMaster")*.03;
 if(key==="crit")return skillRank("crit")*.005+skillRank("precision")*.003;
 if(key==="boss")return skillRank("boss")*.03+skillRank("slayer")*.025+skillRank("warMaster")*.02;
 if(key==="gold")return skillRank("gold")*.03+skillRank("prospector")*.02+skillRank("merchant")*.02+skillRank("farmMaster")*.03;
 if(key==="drop")return skillRank("drop")*.006+skillRank("treasure")*.005+skillRank("fortune")*.004+skillRank("farmMaster")*.005;
 if(key==="offline")return skillRank("afk")*.04+skillRank("offline")*.05+skillRank("meditation")*.04+skillRank("timeless")*.05+skillRank("dreamMaster")*.06;
 if(key==="pet")return skillRank("pet")*.03+skillRank("pack")*.03+skillRank("bond")*.025+skillRank("instinct")*.025+skillRank("alpha")*.02+skillRank("evolution")*.03+skillRank("petMaster")*.04;
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
 {id:"cave",name:"Kristálybarlang",icon:"💎",need:80,hp:400,rewardGold:350,rewardGems:1,rewardSoul:3,tickets:1},
 {id:"demon",name:"Démon erőd",icon:"🔥",need:450,hp:2250,rewardGold:1200,rewardGems:2,rewardSoul:8,tickets:2},
 {id:"dragon",name:"Sárkányfészek",icon:"🐉",need:1800,hp:9000,rewardGold:3500,rewardGems:4,rewardSoul:16,tickets:3},
 {id:"void",name:"Void Citadella",icon:"🌌",need:6000,hp:30000,rewardGold:90000,rewardGems:8,rewardSoul:30,tickets:5}
];

const DAILY=[
 {id:"dk25",name:"Bemelegítés",desc:"Ölj meg 25 ellenfelet",target:25,type:"kills",reward:{gold:50}},
 {id:"dk100",name:"Harci lendület",desc:"Ölj meg 100 ellenfelet",target:100,type:"kills",reward:{ore:8}},
 {id:"dk250",name:"Szörnyirtó",desc:"Ölj meg 250 ellenfelet",target:250,type:"kills",reward:{gold:125}},
 {id:"dk500",name:"Fáradhatatlan vadász",desc:"Ölj meg 500 ellenfelet",target:500,type:"kills",reward:{gems:2}},
 {id:"dk1000",name:"Napi mészárlás",desc:"Ölj meg 1 000 ellenfelet",target:1000,type:"kills",reward:{tickets:1,gems:2}},
 {id:"dg50k",name:"Első erszény",desc:"Szerezz 800 aranyat",target:800,type:"goldEarned",reward:{ore:3}},
 {id:"dg250k",name:"Aranygyűjtő",desc:"Szerezz 3 000 aranyat",target:3000,type:"goldEarned",reward:{gold:300}},
 {id:"dg1m",name:"Napi milliomos",desc:"Szerezz 8 000 aranyat",target:8000,type:"goldEarned",reward:{gems:1}},
 {id:"dg10m",name:"Aranybánya",desc:"Szerezz 20 000 aranyat",target:20000,type:"goldEarned",reward:{gems:2,tickets:1}},
 {id:"di3",name:"Kezdő kincsvadász",desc:"Találj 3 felszerelést",target:3,type:"itemsFound",reward:{ore:6}},
 {id:"di10",name:"Felszerelésvadász",desc:"Találj 10 felszerelést",target:10,type:"itemsFound",reward:{ore:15}},
 {id:"di25",name:"Teli hátizsák",desc:"Találj 25 felszerelést",target:25,type:"itemsFound",reward:{gems:2,ore:20}},
 {id:"dc25",name:"Pontos csapások",desc:"Érj el 25 kritikus találatot",target:25,type:"critHits",reward:{gold:75}},
 {id:"dc100",name:"Kritikus vihar",desc:"Érj el 100 kritikus találatot",target:100,type:"critHits",reward:{ore:12}},
 {id:"dc300",name:"Sebezhető pont",desc:"Érj el 300 kritikus találatot",target:300,type:"critHits",reward:{gems:3}},
 {id:"db1",name:"Boss kihívó",desc:"Győzz le 1 bosst",target:1,type:"bosses",reward:{ore:10}},
 {id:"db5",name:"Bossvadász",desc:"Győzz le 5 bosst",target:5,type:"bosses",reward:{gems:3,tickets:1}},
 {id:"dd1",name:"Dungeon látogató",desc:"Teljesíts 1 dungeont",target:1,type:"dungeons",reward:{gold:100}},
 {id:"dd3",name:"Dungeon fosztogató",desc:"Teljesíts 3 dungeont",target:3,type:"dungeons",reward:{ore:20,gems:2}},
 {id:"dt15",name:"Negyedórás kaland",desc:"Játssz 15 percet",target:900,type:"playSeconds",reward:{gold:50}},
 {id:"dt60",name:"Kitartó kalandor",desc:"Játssz 60 percet",target:3600,type:"playSeconds",reward:{gems:2,ore:15}}
];

const ACH=[
 {id:"k1",name:"Első vér",type:"kills",target:1,points:1},{id:"k100",name:"Százados",type:"kills",target:100,points:2},{id:"k1k",name:"Ezres vadász",type:"kills",target:1000,points:3},{id:"k10k",name:"Tízezres sereg",type:"kills",target:10000,points:5},{id:"k100k",name:"Legendás szörnyirtó",type:"kills",target:100000,points:12},
 {id:"g100k",name:"Teli erszény",type:"goldEarned",target:1000,points:2},{id:"g1m",name:"Első millió",type:"goldEarned",target:5000,points:3},{id:"g10m",name:"Aranymágnás",type:"goldEarned",target:20000,points:5},{id:"g100m",name:"Mesés vagyon",type:"goldEarned",target:75000,points:10},{id:"g1b",name:"Aranycsászár",type:"goldEarned",target:200000,points:20},
 {id:"p1k",name:"Erőre kapva",type:"power",target:100,points:2},{id:"p10k",name:"10 000 erő",type:"power",target:500,points:4},{id:"p100k",name:"Megállíthatatlan",type:"power",target:2500,points:8},{id:"p1m",name:"Világrengető erő",type:"power",target:10000,points:15},
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
 pets:[],activePet:null,activePets:[],petSlotsUnlocked:4,skillTreeVersion:3,
 stats:{goldEarned:0,itemsFound:0,legendary:0,bosses:0,dungeons:0,critHits:0,playSeconds:0},
 dailyClaimed:{},achClaimed:{},achievementPoints:0,dailyBaseline:null,last:Date.now(),
 lastDaily:new Date().toDateString(),uid:1,
 pvpStats:{atkBoost:0,defBoost:0,hpBoost:0,points:0}
};

if(save.lastDaily!==new Date().toDateString()){save.dailyClaimed={};save.dailyBaseline=null;save.lastDaily=new Date().toDateString()}

function normalizeSave(s){
 s=s&&typeof s==="object"?s:{};
 s.gold=Number(s.gold||0);s.gems=Number(s.gems||10);s.ore=Number(s.ore||0);s.soul=Number(s.soul||0);s.tickets=Number(s.tickets||3);
 s.level=Math.max(1,Number(s.level||1));s.xp=Number(s.xp||0);s.skillPoints=Number(s.skillPoints||0);s.kills=Number(s.kills||0);s.zone=Math.max(0,Math.min(ZONES.length-1,Number(s.zone||0)));
 s.base={weaponTraining:1,armorTraining:1,mining:1,luck:1,...(s.base||{})};
 s.skills={root:0,power:0,crit:0,boss:0,gold:0,drop:0,afk:0,offline:0,afkCap:0,pet:0,pack:0,...(s.skills||{})};
 s.inventory=Array.isArray(s.inventory)?s.inventory:[];
 s.equipped={weapon:null,helmet:null,armor:null,gloves:null,boots:null,ring:null,...(s.equipped||{})};
 s.pets=Array.isArray(s.pets)?s.pets:[];
 s.petSlotsUnlocked=4; // Fully unlocked slots visually
 s.activePets=Array.isArray(s.activePets)?s.activePets.slice(0,4):[];
 s.stats={goldEarned:0,itemsFound:0,legendary:0,bosses:0,dungeons:0,critHits:0,playSeconds:0,...(s.stats||{})};
 s.dailyClaimed=s.dailyClaimed||{};s.achClaimed=s.achClaimed||{};
 s.wave=Math.max(1,Number(s.wave||1));s.waveKills=Math.max(0,Number(s.waveKills||0));s.waveGoal=Math.max(1,Number(s.waveGoal||10));s.waveBoss=Boolean(s.waveBoss);s.bossHp=Math.max(0,Number(s.bossHp||0));
 s.paragonLevel=Math.max(0,Number(s.paragonLevel||0));s.prestigeLevel=Math.max(0,Number(s.prestigeLevel||0));
 s.paragonStats={damage:0,gold:0,drop:0,crit:0,...(s.paragonStats||{})};
 s.pvpStats={atkBoost:0,defBoost:0,hpBoost:0,points:0,...(s.pvpStats||{})};
 return s;
}
save=normalizeSave(save);

let enemyHp=ZONES[save.zone].hp;

function persist(){save.last=Date.now();localStorage.setItem("omiIdleComplete",JSON.stringify(save));if($("#saveState"))$("#saveState").textContent="💾 Mentve"}
function toast(t){let e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1700)}
function fmt(n){return Math.floor(Number(n||0)).toLocaleString("hu-HU")}
function needXp(){return 100+save.level*45}
function equipObj(slot){let id=save.equipped[slot];return save.inventory.find(x=>x.id===id)||null}
function upgradeMult(item){return 1+item.plus*.10}

// Strict ATK Cap implementation
function itemStats(item){
 let m=upgradeMult(item);
 let rawAtk=Math.floor((item.atk||0)*m);
 return {
  atk:Math.min(1500, rawAtk), // Hard Cap per Item: 1500 ATK
  def:Math.floor((item.def||0)*m),
  gold:0,
  crit:(item.crit||0)*m,
  drop:(item.drop||0)*m
 }
}

function petObjs(){return (save.activePets||[]).map(i=>save.pets[i]).filter(Boolean).slice(0,4)}
function petScale(){return 1+skillBonus("pet")}
const PET_BONUS_NAMES={damage:"⚔️ Sebzés",gold:"💰 Arany",drop:"🎁 Drop",crit:"🎯 Krit",all:"✨ Minden"};
function petBonusEntries(p){return [{bonus:p?.bonus||"damage",value:Math.max(0,Number(p?.value||0))},...(Array.isArray(p?.extraOptions)?p.extraOptions:[])].filter(x=>x&&PET_BONUS_NAMES[x.bonus]&&Number(x.value)>0)}

function bonuses(){
 let atk=0,def=0,gold=0,crit=0,drop=0;
 Object.keys(save.equipped).forEach(s=>{let it=equipObj(s);if(!it)return;let st=itemStats(it);atk+=st.atk;def+=st.def;crit+=st.crit;drop+=st.drop});
 let pets=petObjs(),ps=petScale(),petDamage=0;
 pets.forEach(pet=>petBonusEntries(pet).forEach(opt=>{
  const v=Number(opt.value||0)*ps;
  if(opt.bonus==="damage")petDamage+=v;
  if(opt.bonus==="gold")gold+=v;
  if(opt.bonus==="crit")crit+=v;
  if(opt.bonus==="drop")drop+=v;
  if(opt.bonus==="all"){petDamage+=v;gold+=v;crit+=v*.5;drop+=v*.5}
 }));
 atk*=1+Math.min(1.5,petDamage);
 return {atk,def,gold,crit,drop}
}

// Global Cap applied: 15,000 Total Damage
function damage(){
 let b=bonuses(),io=itemOptionBonuses(),base=5+save.level*.65+save.base.weaponTraining*2.2+b.atk;
 let total=base*(1+skillBonus("power")+Math.min(4,save.paragonStats.damage*.02*save.paragonLevel))*(1+io.atkPct/100);
 if(save.waveBoss)total*=1+io.bossDmg/100;
 if(save.waveBoss)total*=1+skillBonus("boss");
 return Math.min(15000, Math.max(1,Math.floor(total))); 
}

function critChance(){let io=itemOptionBonuses();return Math.min(.85,.05+skillBonus("crit")+bonuses().crit+save.paragonStats.crit*.005*save.paragonLevel+io.crit/100)}
function goldBonus(){return 1+((save.base.armorTraining-1)*.05+skillBonus("gold")+bonuses().gold)+save.paragonStats.gold*.03*save.paragonLevel}
function dropBonus(){
 let io=itemOptionBonuses();
 let waveBonus=(save.wave>=400)?0.03:0; // Guaranteed +3% drop rate on Wave 400+
 return skillBonus("drop")+bonuses().drop+(save.base.luck-1)*.01+save.paragonStats.drop*.01*save.paragonLevel+io.drop/100+waveBonus;
}
function power(){let b=bonuses();return Math.floor(damage()*1.2+b.def*.8+save.level*.8+save.base.mining*.5+save.base.luck*.5)}
function rankName(){let p=power();return p<25?"Kezdő":p<180?"Harcos":p<1000?"Elit":p<5000?"Mester":p<15000?"Hős":"Isteni"}
function baseCost(d){return Math.floor(d.base*Math.pow(1.32,save.base[d.key]-1))}

function rarityRoll(){
 let bonus=(save.base.luck-1)*.25+skillBonus("drop")*15;
 let r=Math.random()*100;
 if(save.wave>=400 && Math.random()<0.03) return RARITIES[4]; // Guaranteed 3% Legendary chance at Wave 400+
 if(r<1+bonus*.08)return RARITIES[5];
 if(r<3+bonus*.10)return RARITIES[4];
 if(r<8+bonus*.15)return RARITIES[3];
 if(r<18+bonus*.28)return RARITIES[2];
 if(r<42+bonus*.45)return RARITIES[1];
 return RARITIES[0];
}

const ITEM_OPT_DEFS={
 atkPct:{name:"Sebzés %",unit:"%",min:1,max:12},
 hpPct:{name:"Max HP %",unit:"%",min:1,max:15},
 defPct:{name:"Védelem %",unit:"%",min:1,max:12},
 crit:{name:"Krit esély",unit:"%",min:.5,max:6},
 drop:{name:"Drop bónusz",unit:"%",min:.5,max:8},
 bossDmg:{name:"Boss sebzés",unit:"%",min:2,max:15}
};

function rollItemOptions(it){
 it.options=[];
 const count=Math.min(5, {normal:1,rare:2,epic:3,mythic:4,legendary:5,celestial:5}[it.rarity]||1);
 const keys=Object.keys(ITEM_OPT_DEFS);
 for(let i=0;i<count;i++){
  const key=keys[Math.floor(Math.random()*keys.length)];
  const d=ITEM_OPT_DEFS[key];
  const value=Math.round((d.min+Math.random()*(d.max-d.min))*10)/10;
  it.options.push({key,value});
 }
 return it;
}

function itemOptionBonuses(){
 const out={atkPct:0,hpPct:0,defPct:0,crit:0,drop:0,bossDmg:0};
 Object.keys(save.equipped||{}).forEach(slot=>{
  const it=equipObj(slot);if(!it)return;
  (it.options||[]).forEach(o=>{if(o && out[o.key]!==undefined)out[o.key]+=Number(o.value||0)});
 });
 return out;
}

function createItem(){
 let rar=rarityRoll(),slots=Object.keys(SLOT_NAMES),slot=slots[Math.floor(Math.random()*slots.length)];
 let scale=(1+save.zone*.75)*(1+save.level*.04)*rar.mult;
 let it={id:save.uid++,slot,rarity:rar.key,name:`${rar.name} ${SLOT_NAMES[slot]}`,plus:0,atk:0,def:0,crit:0,drop:0};
 if(slot==="weapon")it.atk=Math.min(1500, Math.max(2,Math.floor(7*scale)));
 else if(slot==="armor"||slot==="helmet")it.def=Math.max(2,Math.floor(6*scale));
 else if(slot==="gloves")it.crit=.005*scale;
 else if(slot==="boots")it.def=Math.max(1,Math.floor(3*scale));
 else if(slot==="ring")it.drop=.012*scale;
 return rollItemOptions(it);
}

function rarityName(k){return RARITIES.find(x=>x.key===k)?.name||k}
function sellValue(it){let r=RARITIES.find(x=>x.key===it.rarity)||RARITIES[0];return Math.floor((5+save.level*1.2)*(1+save.zone*.35)*r.mult*(1+it.plus*.25))}

function addItem(it){
 if(save.inventory.length>=120){save.gold+=sellValue(it);return toast("🎒 Inventory tele — tárgy automatikusan eladva.")}
 save.inventory.push(it);save.stats.itemsFound++;if(it.rarity==="legendary")save.stats.legendary++;
 if($("#lastDrop"))$("#lastDrop").innerHTML=`<b class="rarity-${it.rarity}">${SLOT_ICONS[it.slot]} ${it.name} +${it.plus}</b>`;
 toast(`🎁 Drop: ${it.name}`);
}

function kill(){
 let z=ZONES[save.zone],g=Math.floor(z.gold*goldBonus());
 save.gold+=g;save.stats.goldEarned+=g;save.xp+=z.xp;save.kills++;
 if(Math.random()<.07)save.ore++;
 if(Math.random()<.007+dropBonus()*.05)save.soul++;
 if(Math.random()<z.drop+dropBonus())addItem(createItem());
 while(save.xp>=needXp()){save.xp-=needXp();save.level++;toast(`⭐ Szintlépés! Lv.${save.level}`)}
 save.waveKills++;
 if(save.waveKills>=save.waveGoal){
  save.waveBoss=true;
  save.bossHp=Math.floor(z.hp*(6+save.wave*.18));
  enemyHp=save.bossHp;
 }else{
  enemyHp=z.hp;
 }
 persist();
}

// Boss Fight Fast-Forward / Skip feature
function skipBossFight(){
 if(!save.waveBoss)return;
 let dmg=damage();
 save.bossHp-=dmg*5;
 if(save.bossHp<=0){
  save.waveBoss=false;
  save.wave++;
  save.waveKills=0;
  save.stats.bosses++;
  toast(`👹 Boss sikeresen legyőzve! Léptél a(z) ${save.wave}. hullámra.`);
 }
 persist(); renderAll();
}

// Multi-Summon Pet Feature (10x Summon for Gems)
function summonPetMulti(){
 if(save.gems<100) return toast("Nincs elég drágaköved (100 Drágakő szükséges 10x Idézéshez)!");
 save.gems-=100;
 let newPets=[];
 for(let i=0;i<10;i++){
  let p=PET_POOL[Math.floor(Math.random()*PET_POOL.length)];
  let petObj={...p, id:save.uid++};
  save.pets.push(petObj);
  newPets.push(p.name);
 }
 toast(`🐾 10x Pet Sikeresen Beidézve!`);
 persist(); renderAll();
}

// Bulk Upgrade All Items
function upgradeAllItems(){
 let totalCost=0, count=0;
 save.inventory.forEach(it=>{
  let cost=Math.floor((50+it.plus*30)*upgradeMult(it));
  if(save.gold>=cost && it.plus<15){
   save.gold-=cost;
   it.plus++;
   count++;
  }
 });
 toast(`🔨 ${count} tárgy sikeresen fejlesztve!`);
 persist(); renderAll();
}

// Detached Independent PvP System
function upgradePvpStat(type){
 let cost=5;
 if(save.soul<cost) return toast("Nincs elég Lélekkőd!");
 if((save.pvpStats[type]||0)>=40) return toast("Ez a PvP fejlesztés elérte a maximális 40%-os határt!");
 save.soul-=cost;
 save.pvpStats[type]=(save.pvpStats[type]||0)+2; // +2% per level up to 40%
 toast(`⚔️ PvP ${type.toUpperCase()} fejlesztve (+2%)!`);
 persist(); renderAll();
}

function renderAll(){
 if($("#gold"))$("#gold").textContent=fmt(save.gold);
 if($("#gems"))$("#gems").textContent=fmt(save.gems);
 if($("#ore"))$("#ore").textContent=fmt(save.ore);
 if($("#soul"))$("#soul").textContent=fmt(save.soul);
 if($("#tickets"))$("#tickets").textContent=fmt(save.tickets);
 if($("#level"))$("#level").textContent=save.level;
 if($("#power"))$("#power").textContent=fmt(power());
 if($("#dmg"))$("#dmg").textContent=fmt(damage());
 
 // Upper Boss HUD Render
 if($("#bossHudBar")){
  if(save.waveBoss){
   $("#bossHudBar").style.display="flex";
   if($("#bossHpText"))$("#bossHpText").textContent=`👹 BOSS HP: ${fmt(save.bossHp)}`;
  }else{
   $("#bossHudBar").style.display="none";
  }
 }
}

// Initialization loop
setInterval(()=>{
 kill();
 renderAll();
}, 1000);

document.addEventListener("DOMContentLoaded",()=>{
 renderAll();
});
