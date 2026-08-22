
const express=require("express");
const path=require("path");
const pg=require("pg");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const cookieParser=require("cookie-parser");
const vm=require("vm");

const app=express();
app.set("trust proxy",1);
app.use(express.json({limit:"2mb"}));
app.use(cookieParser());

app.get("/api/site-votes",async(req,res)=>{
  try{
    const rows=(await q("SELECT vote,COUNT(*)::int count FROM site_votes GROUP BY vote")).rows;
    let likes=0,dislikes=0,mine=0;
    rows.forEach(r=>{if(Number(r.vote)===1)likes=Number(r.count);else dislikes=Number(r.count)});
    try{const p=jwt.verify(req.cookies.omi_token,JWT_SECRET);const row=(await q("SELECT vote FROM site_votes WHERE user_id=$1",[p.id])).rows[0];mine=Number(row?.vote||0)}catch{}
    res.json({likes,dislikes,mine});
  }catch(e){res.status(500).json({error:"A szavazatok nem tölthetők be."})}
});

app.post("/api/site-votes",auth,async(req,res)=>{
  const vote=Number(req.body?.vote);
  if(![-1,1].includes(vote))return res.status(400).json({error:"Hibás szavazat."});
  await q("INSERT INTO site_votes(user_id,vote) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET vote=EXCLUDED.vote,updated_at=NOW()",[req.user.id,vote]);
  res.json({ok:true});
});

app.get("/api/update-votes",async(req,res)=>{
  try{
    const rows=(await q("SELECT update_id,vote,COUNT(*)::int count FROM update_votes GROUP BY update_id,vote")).rows;
    const votes={};
    rows.forEach(r=>{const id=String(r.update_id);votes[id]=votes[id]||{likes:0,dislikes:0,mine:0};if(Number(r.vote)===1)votes[id].likes=Number(r.count);else votes[id].dislikes=Number(r.count)});
    try{const p=jwt.verify(req.cookies.omi_token,JWT_SECRET);const mine=(await q("SELECT update_id,vote FROM update_votes WHERE user_id=$1",[p.id])).rows;mine.forEach(r=>{const id=String(r.update_id);votes[id]=votes[id]||{likes:0,dislikes:0,mine:0};votes[id].mine=Number(r.vote)})}catch{}
    res.json({votes});
  }catch(e){res.status(500).json({error:"A frissítésszavazatok nem tölthetők be."})}
});

app.post("/api/update-votes",auth,async(req,res)=>{
  try{
    const updateId=String(req.body?.updateId||"").trim().slice(0,100),vote=Number(req.body?.vote);
    if(!updateId||![-1,0,1].includes(vote))return res.status(400).json({error:"Hibás szavazat."});
    const cfg=await mainConfig(),entry=(Array.isArray(cfg.updates)?cfg.updates:[]).find(x=>String(x?.id)===updateId);
    if(!entry||!entry.visible)return res.status(404).json({error:"Ez a frissítés nem szavazható."});
    if(vote===0)await q("DELETE FROM update_votes WHERE update_id=$1 AND user_id=$2",[updateId,req.user.id]);
    else await q("INSERT INTO update_votes(update_id,user_id,vote) VALUES($1,$2,$3) ON CONFLICT(update_id,user_id) DO UPDATE SET vote=EXCLUDED.vote,updated_at=NOW()",[updateId,req.user.id,vote]);
    res.json({ok:true});
  }catch(e){res.status(500).json({error:"A szavazat mentése nem sikerült."})}
});

const DATABASE_URL=process.env.DATABASE_URL;
const JWT_SECRET=process.env.JWT_SECRET || "CHANGE_ME_IN_RENDER";
if(!DATABASE_URL) console.warn("DATABASE_URL is not set.");

const pool=new pg.Pool({
  connectionString:DATABASE_URL,
  ssl:DATABASE_URL && !/localhost|127\.0\.0\.1/.test(DATABASE_URL) ? {rejectUnauthorized:false} : false
});
const q=(text,params=[])=>pool.query(text,params);

const DEFAULT_SAVE={
 gold:0,gems:10,ore:0,soul:0,tickets:3,prestigeTokens:0,level:1,xp:0,skillPoints:0,kills:0,zone:0,fullAutoUnlocked:false,fullAutoEnabled:false,
 base:{weaponTraining:1,armorTraining:1,mining:1,luck:1},
 skills:{power:0,gold:0,crit:0,drop:0,offline:0,pet:0},
 inventory:[],equipped:{weapon:null,helmet:null,armor:null,gloves:null,boots:null,ring:null},
 pets:[],activePet:null,activePets:[],petSlotsUnlocked:1,skillTreeVersion:3,
 stats:{goldEarned:0,itemsFound:0,legendary:0,bosses:0,dungeons:0,critHits:0,playSeconds:0},
 dailyClaimed:{},achClaimed:{},achievementPoints:0,dailyBaseline:null,last:Date.now(),lastDaily:new Date().toDateString(),uid:1
};

function cleanName(v){return String(v||"").trim().slice(0,24)}
function publicUser(u){return {id:u.id,username:u.username,player_name:u.player_name||u.username,role:u.role,banned:u.banned,pvp_rating:Number(u.pvp_rating||1000),created_at:u.created_at}}
function sign(u){return jwt.sign({id:u.id,role:u.role},JWT_SECRET,{expiresIn:"30d"})}
function setAuth(res,u){
  res.cookie("omi_token",sign(u),{
    httpOnly:true,
    sameSite:"lax",
    secure:process.env.NODE_ENV==="production",
    maxAge:30*24*60*60*1000
  });
}
async function auth(req,res,next){
  try{
    const token=req.cookies.omi_token;
    if(!token)return res.status(401).json({error:"Nincs bejelentkezve."});
    const p=jwt.verify(token,JWT_SECRET);
    const u=(await q("SELECT * FROM users WHERE id=$1",[p.id])).rows[0];
    if(!u)return res.status(401).json({error:"A fiók nem található."});
    if(u.banned)return res.status(403).json({error:"Ez a fiók tiltva van."});
    req.user=u;next();
  }catch(e){res.status(401).json({error:"A munkamenet lejárt."})}
}
function admin(req,res,next){
  if(req.user.role!=="admin")return res.status(403).json({error:"Admin jogosultság szükséges."});
  next();
}
function deepMergeSave(target,patch){
  const out={...(target||{})};
  for(const [key,value] of Object.entries(patch||{})){
    if(value && typeof value==="object" && !Array.isArray(value))out[key]=deepMergeSave(out[key],value);
    else out[key]=value;
  }
  return out;
}

function serverPowerV283(s={}){
 const n=v=>Number.isFinite(Number(v))?Number(v):0,skills=s.skills||{},rank=k=>Math.max(0,n(skills[k]));
 const skillPower=rank("root")*.02+rank("power")*.025+rank("berserk")*.02+rank("warMaster")*.03;
 const petSkill=rank("pet")*.03+rank("pack")*.03+rank("bond")*.025+rank("instinct")*.025+rank("alpha")*.02+rank("evolution")*.03+rank("petMaster")*.04;
 const inv=Array.isArray(s.inventory)?s.inventory:[],eq=s.equipped||{},items=Object.values(eq).map(id=>inv.find(x=>String(x?.id)===String(id))).filter(Boolean);
 let atk=0,def=0,atkPct=0,defPct=0;
 for(const it of items){const mult=1+Math.max(0,n(it.plus))*.1,rawCap=({normal:260,rare:360,epic:480,mythic:640,legendary:800})[String(it.rarity||"normal")]||260;atk+=Math.min(2000,Math.floor(Math.min(rawCap,Math.max(0,n(it.atk)))*mult));def+=Math.floor(Math.max(0,n(it.def))*mult);for(const o of (Array.isArray(it.options)?it.options:[]).slice(0,5)){if(o?.key==="atkPct")atkPct+=n(o.value);if(o?.key==="defPct")defPct+=n(o.value)}}
 const pets=Array.isArray(s.pets)?s.pets:[],active=(Array.isArray(s.activePets)?s.activePets:[]).slice(0,Math.max(1,n(s.petSlotsUnlocked)||1));let petDamage=0;
 for(const i of active){const p=pets[i];if(!p)continue;const entries=[{bonus:p.bonus||"damage",value:Math.max(0,n(p.value))},...(Array.isArray(p.extraOptions)?p.extraOptions:[])];for(const o of entries){const v=Math.max(0,n(o?.value))*(1+petSkill);if(o?.bonus==="damage")petDamage+=v;else if(o?.bonus==="all")petDamage+=v}}
 const petCap=.65;petDamage=petCap*petDamage/(petDamage+petCap);atk*=1+petDamage;
 const level=Math.max(1,n(s.level)||1),paragon=Math.max(0,n(s.paragonLevel)),prestige=Math.max(0,Math.min(100,n(s.prestigeLevel))),base=s.base||{},ps=s.paragonStats||{};
 const damage=Math.max(1,Math.min(70000,Math.floor((5+level*.65+Math.max(1,n(base.weaponTraining)||1)*2.2+atk)*(1+skillPower+Math.min(4,n(ps.damage)*.02*paragon))*(1+atkPct/100)*(1+Math.min(.5,prestige*.005)))));
 const zone=Math.max(0,n(s.zone)),wave=Math.max(1,n(s.wave)||1),target=Math.max(10,Math.floor(30*(1+zone*1.2)*Math.pow(1+wave/100,.5)));
 const rawDef=Math.max(0,(def+Math.max(1,n(base.armorTraining)||1)*2+level*.3+prestige*1.5)*(1+defPct/100)),effectiveDef=Math.max(0,Math.floor(target*(3*rawDef/(rawDef+target*2))));
 const mount=s.mounts?.[s.activeMount],mountRaw=Math.max(0,Math.floor(n(mount?.level)))*.02,mountCap=.25,mountMult=1+mountCap*mountRaw/(mountRaw+mountCap);
 const raw=(damage*1.2+effectiveDef*.8+level*.8+Math.max(1,n(base.mining)||1)*.5+Math.max(1,n(base.luck)||1)*.5)*mountMult,cap=100000;
 return Math.max(0,Math.min(cap,Math.floor(cap*raw/(raw+cap*.42))));
}

async function init(){
  await q(`
    CREATE TABLE IF NOT EXISTS users(
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player',
      banned BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ,
      last_save_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS game_saves(
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      save_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      power BIGINT NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      kills BIGINT NOT NULL DEFAULT 0,
      gold NUMERIC(30,0) NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS admin_logs(
      id BIGSERIAL PRIMARY KEY,
      admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      target_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS anticheat_alerts(
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      alert_type TEXT NOT NULL DEFAULT 'autoclicker',
      risk_level TEXT NOT NULL DEFAULT 'suspicious',
      evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      reviewed_by BIGINT REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS anticheat_alerts_user_created_idx ON anticheat_alerts(user_id,created_at DESC);
    CREATE TABLE IF NOT EXISTS ai_development_runs(
      id BIGSERIAL PRIMARY KEY,
      admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      request_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'started',
      summary TEXT,
      commit_sha TEXT,
      changed_files JSONB NOT NULL DEFAULT '[]'::jsonb,
      error_text TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      finished_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS admin_pending_overrides(
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      patch JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS pvp_fights(
      id BIGSERIAL PRIMARY KEY,
      challenger_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      defender_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      winner_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      battle_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS purchase_requests(
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price_text TEXT,
      note TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS site_votes(
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      vote SMALLINT NOT NULL CHECK(vote IN (-1,1)),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS update_votes(
      update_id TEXT NOT NULL,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      vote SMALLINT NOT NULL CHECK(vote IN (-1,1)),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY(update_id,user_id)
    );
    CREATE TABLE IF NOT EXISTS system_migrations(
      migration_key TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // V22.41 one-time economy restart. Persistent special tokens stay untouched.
  const balanceMigration="v2241_compact_economy_reset";
  const already=(await q("SELECT 1 FROM system_migrations WHERE migration_key=$1",[balanceMigration])).rows[0];
  if(!already){
    const rows=(await q("SELECT user_id,save_data FROM game_saves")).rows;
    for(const row of rows){
      const s=row.save_data||{};
      s.gold=0;s.gems=0;s.ore=0;s.soul=0;s.achievementPoints=0;
      // tickets, auraTokens and mountShards intentionally remain unchanged.
      await q("UPDATE game_saves SET save_data=$1,gold=0,updated_at=NOW() WHERE user_id=$2",[s,row.user_id]);
    }
    await q("CREATE TABLE IF NOT EXISTS game_content(key TEXT PRIMARY KEY,value JSONB NOT NULL DEFAULT '{}'::jsonb,updated_at TIMESTAMPTZ DEFAULT NOW())");
    const contentRow=(await q("SELECT value FROM game_content WHERE key='main'")).rows[0];
    const content=contentRow?.value||{};
    content.balanceVersion=2241;
    content.gameplay={...(content.gameplay||{}),basePlayerHp:100,hpPerLevel:5,defenseEffectPct:.8,bossDamageMult:1.45,bossRegenPct:.2,respawnSec:5,zoneFixedGold:[5,9,16,28,48,80,130,210],defaultBossFixedGold:120,bossGemDropChance:20,mobTargetHits:2,waveKills:8,bossHpGrowthPct:8};
    content.mounts={...(content.mounts||{}),shardChancePct:2,shardAmount:1,shardsRequired:10,chestCost:{gold:1500,gems:10,ore:25,soul:1,tickets:1},upgradeCostMultiplier:1};
    content.economy={...(content.economy||{}),exchange:{gems:{gold:2500,amount:5},ore:{gold:1200,amount:10},tickets:{gold:3500,amount:1}}};
    if(Array.isArray(content.bosses))content.bosses=content.bosses.map(b=>({...b,gold:Math.max(40,Math.floor(Number(b.gold||120)/20))}));
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[content]);
    await q("INSERT INTO system_migrations(migration_key) VALUES($1)",[balanceMigration]);
  }

  // Every deployed release is automatically registered here as a hidden draft.
  // Publishing remains an explicit per-entry admin decision.
  await q("CREATE TABLE IF NOT EXISTS game_content(key TEXT PRIMARY KEY,value JSONB NOT NULL DEFAULT '{}'::jsonb,updated_at TIMESTAMPTZ DEFAULT NOW())");
  const updateContentRow=(await q("SELECT value FROM game_content WHERE key='main'")).rows[0];
  const updateContent=updateContentRow?.value||{};
  updateContent.updates=Array.isArray(updateContent.updates)?updateContent.updates:[];
  updateContent.store={discord:"nervos11",products:[],...(updateContent.store||{})};
  updateContent.store.products=Array.isArray(updateContent.store.products)?updateContent.store.products:[];
  const fullAutoProduct=updateContent.store.products.find(p=>p?.id==="full_auto_20_eur");
  if(fullAutoProduct){Object.assign(fullAutoProduct,{name:"Teljes Automata Rendszer",icon:"🤖",priceText:"20 €",description:"Teljes Prestige-felkészítő automatizálás: Equip Best, item fejlesztés/forgatás, alap fejlesztések, Paragon statok, selejtezés és automatikus Paragon/Prestige."});}
  else updateContent.store.products.push({id:"full_auto_20_eur",name:"Teljes Automata Rendszer",icon:"🤖",priceText:"20 €",description:"Teljes Prestige-felkészítő automatizálás: Equip Best, item fejlesztés/forgatás, alap fejlesztések, Paragon statok, selejtezés és automatikus Paragon/Prestige.",visible:true});
  const dungeonBatchProduct=updateContent.store.products.find(p=>p?.id==="dungeon_batch_10_eur");
  if(dungeonBatchProduct){Object.assign(dungeonBatchProduct,{name:"Dungeon 10× prémium futam",icon:"🏰",description:"Az 1× / 2× / 3× / 5× futam ingyenes. Ez a csomag kizárólag a 10× futamot oldja fel."});}
  else updateContent.store.products.push({id:"dungeon_batch_10_eur",name:"Dungeon 10× prémium futam",icon:"🏰",priceText:"10 €",description:"Az 1× / 2× / 3× / 5× futam ingyenes. Ez a csomag kizárólag a 10× futamot oldja fel.",visible:true});
  if(!updateContent.updates.some(x=>x&&x.id==="v22_91")){
    updateContent.updates.unshift({id:"v22_91",version:"V22.91 FINAL",title:"Végső PvP és endgame balance",date:"2026-08-21",summary:"A PvP teljesen külön fejlődési rendszert kapott, és elkészült a végső dungeon/gear balance.",changes:["PvP-ben a PvE erő, szint, Paragon és pet nem számít.","PvP ATK, HP, DEF, Block, Szerencse/Krit és Dupla találat kizárólag Lélekkőből fejleszthető.","Block maximum 40%.","Felszerelésből csak a PvP sebzés opció számít PvP-ben.","1× / 2× / 3× / 5× dungeon futam ingyenes; csak a 10× prémium.","Legendary alap rarity 3%.","Endgame rarity: Legendary → Imperial → Celestial → Eternal.","Fegyver attack végső plafon: 1500."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_42")){
    updateContent.updates.unshift({id:"v22_42",version:"V22.42",title:"Admin által vezérelt frissítések",date:"2026-08-21",summary:"Új, átlátható fejlesztési napló került a játékba.",changes:["Minden új verzió automatikusan bekerül az admin Frissítések oldalára.","Az admin bejegyzésenként közzéteheti vagy elrejtheti a frissítéseket.","A játékosok kizárólag a közzétett változásokat látják.","A legújabb látható frissítés ÚJ jelvényt kap."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_43")){
    updateContent.updates.unshift({id:"v22_43",version:"V22.43",title:"Gyorsabb váltópiac",date:"2026-08-21",summary:"A nagyobb nyersanyag- és tokencsomagok kényelmesebben megvásárolhatók.",changes:["Külön megmarad a kiválasztott csomagméret gyémántnál, ércnél és dungeon tokennél.","A választott mennyiségek a játékos szerveres mentésébe kerülnek.","Új 50× és 100× csomagméret került be.","Vásárlás előtt látható a teljes aranyár és a teljes jutalom.","Vásárlás után nem áll vissza a kiválasztás 1×-re."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_44")){
    updateContent.updates.unshift({id:"v22_44",version:"V22.44",title:"PvP rating ranglista",date:"2026-08-21",summary:"A PvP eredmények mostantól közvetlenül alakítják a ranglistasorrendet.",changes:["Győzelem alapból +18 PvP rating.","Vereség alapból −20 PvP rating.","A rating nem csökkenhet 0 alá.","A ranglistán megjelenik minden játékos PvP ratingje.","A Paragon-szint marad az elsődleges sorrend, azon belül a PvP rating dönt.","A győzelmi és vereségi érték külön állítható az adminpanelben."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_45")){
    updateContent.updates.unshift({id:"v22_45",version:"V22.45",title:"Kibővített képességfa és update-szavazás",date:"2026-08-21",summary:"Sokkal hosszabb karakterfejlődés és frissítésenkénti játékos-visszajelzés érkezett.",changes:["A képességfa 29 külön képességre és több mint 300 fejlesztési szintre bővült.","Négy hosszú ág: Harc, Farm, AFK és Pet.","Új mesterskillek és több egymásra épülő előfeltétel.","A lélekkőköltség fokozatosan, egyre gyorsabban növekszik.","A régi kiosztott képességpontok megmaradnak.","Minden látható frissítés külön like/dislike szavazást kapott.","Egy játékos frissítésenként egy szavazatot adhat, amely módosítható vagy visszavonható."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_46")){
    updateContent.npcShop={refreshHours:6,gearOffers:4,rarePetChancePct:8,arrowAmount:1000,arrowDamagePct:15,arrowGoldCost:1200,gearGoldBase:1800,gearOreBase:8,petGemBase:80,configVersion:1,...(updateContent.npcShop||{})};
    updateContent.economyCaps={gold:5000000,gems:50000,ore:100000,soul:50000,...(updateContent.economyCaps||{})};
    updateContent.updates.unshift({id:"v22_46",version:"V22.46",title:"Vándorkereskedő és gazdaságvédelem",date:"2026-08-21",summary:"Megérkezett az állandó játékon belüli NPC bolt, korlátozott forgó kínálattal.",changes:["Új Vándorkereskedő oldal felszerelésekkel, nyílvesszőkkel és ritka petekkel.","A kínálat 6 óránként frissül, a felszerelés és pet ajánlatonként egyszer vehető meg.","A nyílvesszők fogyóeszközként növelik a támadások sebzését.","A bolt aranyat, ércet és gyémántot von ki a gazdaságból.","Szerveroldali pénztárcaplafon védi a játékot a milliós–milliárdos felhalmozástól.","Adminból állítható minden NPC-boltérték és valutaplafon.","Dungeon token, aura token és hátastöredék nem resetelődik."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_47")){
    updateContent.casino={minBet:{gold:100,gems:1,ore:5},maxBet:{gold:25000,gems:100,ore:500},games:{coin:{chance:47,mult:1.9},skull:{chance:28,mult:3.2},dragon:{chance:8,mult:10}},...(updateContent.casino||{})};
    updateContent.updates.unshift({id:"v22_47",version:"V22.47",title:"Árnyék Kaszinó és intelligens adminpanel",date:"2026-08-21",summary:"Új játékbeli kaszinó, látható nyílvesszőállapot és gyorsabb tartalomkészítés.",changes:["Az automata harcnál látható az aktív nyílvesszők száma és sebzésbónusza.","Új Kaszinó fül Coin Flip, Koponya és Sárkány Slot játékokkal.","Adminból külön állítható minden nyerési esély, szorzó és tétlimit.","A kaszinó nyereménye nem lépheti túl a valutaplafonokat.","Az adminpanel sötét, kártyás és nagyobb méretű elrendezést kapott.","Új területnél és bossnál elég nevet megadni: a többi érték automatikusan az előző legerősebb fölé skálázódik."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_48")){
    updateContent.updates.unshift({id:"v22_48",version:"V22.48",title:"Animált kaszinógépek és nyerési hangok",date:"2026-08-21",summary:"A kaszinójátékok mostantól teljes pörgetési animációval és hanggal működnek.",changes:["A Coin Flip valódi forgó érmeanimációt kapott.","A Koponya és Sárkány Slot három külön pörgő tekercset használ.","Győzelemnél arany felvillanás, konfetti és csilingelő dallam szól.","Vereségnél vörös rázkódás és mély bukáshang hallható.","Pörgetés közben minden kaszinógomb lezár, ezért egy tét csak egyszer számolódhat el.","Csökkentett animációs beállításnál a látványelemek automatikusan visszafogottak."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_49")){
    updateContent.updates.unshift({id:"v22_49",version:"V22.49",title:"Slot ingyen pörgetések",date:"2026-08-21",summary:"A Koponya és Sárkány Slot kis eséllyel ingyen pörgetéseket adhat.",changes:["A Koponya Slot alapból 5% eséllyel 1 free spint ad.","A Sárkány Slot alapból 3% eséllyel 2 free spint ad.","A free spin az eredeti tétet és valutát jegyzi meg, ezért nem használható ki tétváltással.","A megmaradt ingyen pörgetések száma közvetlenül a slotkártyán látható.","Adminból külön állítható mindkét játék free-spin esélye és mennyisége.","Ingyen pörgetésből is nyerhető további ingyen pörgetés."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_50")){
    updateContent.updates.unshift({id:"v22_50",version:"V22.50",title:"Kaszinó egyenlegjavítás",date:"2026-08-21",summary:"A vesztes kaszinókörök többé semmilyen valutát nem írhatnak jóvá.",changes:["A kaszinó minden körben rögzíti a kezdőegyenleget, tétet, kifizetést és záróegyenleget.","Fizetős vesztes kör eredménye pontosan: kezdőegyenleg mínusz tét.","Ingyen pörgetés elvesztésekor az egyenleg változatlan marad.","A kijelzett nyereség vagy veszteség a tényleges egyenlegváltozást mutatja.","Az utolsó 20 kaszinótranzakció ellenőrzési célból mentésre kerül."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_51")){
    updateContent.updates.unshift({id:"v22_51",version:"V22.51",title:"Tartós képességfa",date:"2026-08-21",summary:"A képességfa Paragon szintlépés után teljes egészében megmarad.",changes:["A megszerzett képességszintek nem nullázódnak Paragonkor.","A kiosztott és megmaradt képességpontok is megmaradnak.","A Paragon megerősítő ablaka külön felsorolja a tartós képességfát."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_52")){
    updateContent.updates.unshift({id:"v22_52",version:"V22.52",title:"Rejtett kaszinóesélyek",date:"2026-08-21",summary:"A kaszinó pontos nyerési százalékai kizárólag az admin számára láthatók.",changes:["A játékoskártyákról eltűnt a nyerési esély százaléka.","Az ingyen pörgetés megszerzési százaléka sem látható a játékosnak.","A kifizetési szorzó és a meglévő ingyen pörgetések száma továbbra is látható.","Az adminpanelben minden esély továbbra is állítható."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_53")){
    updateContent.updates.unshift({id:"v22_53",version:"V22.53",title:"Kötelező kaszinó tétlevonás",date:"2026-08-21",summary:"Minden kaszinójáték vesztes köre garantáltan levonja a teljes tétet.",changes:["Vesztes kör: kezdőegyenleg mínusz a teljes tét.","Nyertes kör: a kisorsolt nyeremény hozzáadódik a kezdőegyenleghez.","A szabály az aranyra, gyémántra és ércre is azonos.","A vesztes eredményen látszik az előtte és utána egyenleg.","A kaszinógombok közvetlenül az egyetlen új elszámolófüggvényt használják.","A kör végi eredmény azonnal felhőbe mentődik."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_54")){
    updateContent.updates.unshift({id:"v22_54",version:"V22.54",title:"Kaszinó és automata farm szétválasztása",date:"2026-08-21",summary:"A háttérben futó automata farm többé nem fedheti el a kaszinó vesztes tétlevonását.",changes:["A kaszinópörgetés alatt az automata harc rövid időre szünetel.","Vesztes eredmény után 2,5 másodpercig változatlan marad az elszámolt egyenleg.","A kaszinóeredmény után az automata farm magától folytatódik.","A vesztes kör továbbra is pontosan a teljes tétet vonja le.","Minden kaszinógomb kizárólag az új elszámolófüggvényt hívja."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_55")){
    updateContent.updates.unshift({id:"v22_55",version:"V22.55",title:"Látványos kaszinóeredmények",date:"2026-08-21",summary:"Minden kaszinójáték animációval és részletes naplóval jelzi a jutalmat vagy veszteséget.",changes:["Nyeréskor aranyszínű felvillanás és felúszó jutalom jelenik meg.","Vesztéskor vörös effekt mutatja a levont tétet.","Minden játékkártya megőrzi a saját utolsó eredményét.","Látható a valuta típusa, a tét, a kifizetés és az egyenlegváltozás.","Az ingyen pörgetés jutalma külön animált jelzést kap.","Új kaszinónapló mutatja az utolsó 8 részletes eredményt."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_56")){
    updateContent.updates.unshift({id:"v22_56",version:"V22.56",title:"Elkülönített kaszinó és farmarany",date:"2026-08-21",summary:"A kaszinózás alatt termelt automata farmarany külön gyűlik, és csak kilépéskor kerül az egyenlegre.",changes:["A kaszinóba belépéskor rögzül az aktuális aranyegyenleg.","Az automata farm a Kaszinó fülön is tovább dolgozik, de jutalma külön számlálón gyűlik.","A farmarany nem zavarja meg a kaszinó nyereményének és veszteségének kijelzését.","A Kaszinó fül elhagyásakor a teljes összeg automatikusan hozzáadódik.","Kilépéskor látványos értesítés mutatja a hozzáadott farmaranyat.","Megszakadt munkamenet esetén a függő jutalom mentve marad és biztonságosan jóváíródik."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_57")){
    updateContent.updates.unshift({id:"v22_57",version:"V22.57",title:"Prestige 100 fejlődési rendszer",date:"2026-08-21",summary:"A Paragon, Prestige, ranglista és Prestige Shop teljes hosszú távú fejlődési rendszerré alakult.",changes:["A valódi Prestige-rendszer maximuma 100.","Prestige 1-hez 10 Paragon kell, majd 4 Prestige-szintenként +1, legfeljebb 35.","A Paragon wave-követelménye fokozatosan 250-ről maximum 1500-ig nő.","Minden Prestige +0,5% sebzést és +0,25% automatafarm-sebességet ad.","Látható jutalomút készült a fontos Prestige-mérföldkövekhez.","Prestige 100 feloldja az ötödik pethelyet.","A Prestige Shop külön Prestige tokennel működik, új Prestige 15–100 aurákkal.","A Prestige-játékosok citromsárga ranglistasort és jelvényt kapnak.","A ranglista Prestige, Paragon, PvP rating, erő, szint és kill alapján rendez.","Az Automata Paragon kapcsoló az Autofarm oldalon is elérhető az admin által engedélyezett játékosoknak.","A 10× gyorsító, Automata Paragon, képességfa és gyűjthető rendszerek Prestige után megmaradnak."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_58")){
    updateContent.updates.unshift({id:"v22_58",version:"V22.58",title:"Rendezett navigáció és összecsukható frissítések",date:"2026-08-21",summary:"A felső menü többé nem lóg ki a képernyőről, a frissítési napló pedig tömören kezelhető.",changes:["A navigáció több sorba rendeződik vízszintes görgetés nélkül.","A menügombok automatikusan tömörödnek a rendelkezésre álló szélességhez.","Mobilon kétoszlopos, jól érinthető navigáció jelenik meg.","A frissítések alapból összecsukható kártyák.","A legújabb frissítés nyitva, a korábbiak zárva jelennek meg.","A like és dislike szám összecsukott állapotban is látható.","Új Összes megnyitása és Összes bezárása vezérlők készültek."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_59")){
    updateContent.updates.unshift({id:"v22_59",version:"V22.59",title:"Frissítési részletek megjelenítési javítása",date:"2026-08-21",summary:"Az összecsukható frissítések részletes változáslistája most már teljesen látható.",changes:["A hibás teljes magasságú összecsukott fejléc eltávolítva.","A lenyíló rész saját látható tartalomblokkot kapott.","Megnyitáskor a kártya automatikusan a teljes változáslistához igazodik.","A gombfelirat jelzi, hogy a részletek megnyithatók vagy bezárhatók.","Az Összes megnyitása és Összes bezárása vezérlők továbbra is működnek."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_60")){
    updateContent.updates.unshift({id:"v22_60",version:"V22.60",title:"Kötelező területhaladás és felszerelésvédelem",date:"2026-08-21",summary:"Felszerelés levételével többé nem lehet a kezdő területen maradni vagy visszafarmolni.",changes:["A minimum farmterületet a wave, Paragon, Prestige és a valaha elért terület együtt határozza meg.","A valaha elért legmagasabb terület tartósan mentésre kerül.","A korábbi gyengébb területek automatikusan lezáródnak.","Területváltáskor a rendszer automatikusan felszereli a legerősebb elérhető tárgyakat.","Minden hiányzó felszereléshelyre területhez skálázott Kalandor kezdőtárgy kerül.","A Kalandor kezdőszett nem adható el és a tömeges eladás sem törli.","A rendes droptárgyak erősebb fejlődést adnak, ezért továbbra is megéri felszerelést farmolni.","Paragon és Prestige után sem lehet felszerelés nélkül visszamaradni az első területen."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_61")){
    updateContent.updates.unshift({id:"v22_61",version:"V22.61",title:"Biztonságos automatikus tárgytörlés",date:"2026-08-21",summary:"Az automatikus tárgytörlés csak a Démon torony elérése után használható, Paragon és Prestige után pedig kikapcsol.",changes:["A Démon torony eléréséig az automatikus törlés kapcsolói zároltak.","A korábban bekapcsolt beállítás régi mentésből sem kerülhet aktív állapotba.","A korai játékban megtelt inventory nem adja el automatikusan az új dropot.","Paragon-szintlépés után az automatikus törlés kikapcsol.","Prestige-szintlépés után az automatikus törlés szintén kikapcsol.","A védett Kalandor kezdőszettet az automatikus törlés soha nem érinti."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_62")){
    updateContent.updates.unshift({id:"v22_62",version:"V22.62",title:"Felszerelés-központú automata farm",date:"2026-08-21",summary:"A wave önmagában többé nem elég: a hosszú távú haladáshoz valódi felszerelést is kell gyűjteni és használni.",changes:["Minden 25. wave felszerelési próba lett.","A szükséges valódi felszereléshelyek száma fokozatosan 2-ről 6-ra nő.","A Kalandor kezdőszett nem számít bele a felszerelési próbába.","A próba a tárgyak tényleges támadását, védelmét, kritjét, dropját és opcióit is pontozza.","Sikertelen próba esetén a játékos ugyanazon a wave-en marad, de garantált segítő tárgydropot kap.","A normál és az egyedi bossok sem kerülhetik meg a felszerelési kaput.","A Paragonhoz a wave-követelmény mellett az aktuális felszerelési próba is szükséges.","Az Automata farm oldalon élő állapotjelző mutatja a szükséges tárgyhelyet és gear erőt.","A V22.61 külön visszaállítási csomagként változatlanul megmarad."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_63")){
    updateContent.updates.unshift({id:"v22_63",version:"V22.63",title:"Közös felszerelésfejlesztés",date:"2026-08-21",summary:"A farmfelkészültségi sávból egyetlen gombbal fejleszthető az összes felszerelt valódi tárgy.",changes:["Új MINDENT FEJLESZT gomb került a farmfelkészültségi panelre.","A gomb minden felszerelt valódi tárgyon egyszerre egy fejlesztési kísérletet végez.","A teljes arany- és ércköltség előre látható.","Ha nincs meg a teljes fedezet, semmit nem von le és a gomb nem indítható.","Minden tárgy megtartja a saját fejlesztési esélyét.","A Kalandor kezdőszett kimarad, mert nem számít bele a felszerelési próbába.","A fejlesztés után a gear erő és a farmfelkészültség azonnal frissül."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_64")){
    updateContent.updates.unshift({id:"v22_64",version:"V22.64",title:"Farm aktivitás és kezdőgear eltávolítás",date:"2026-08-21",summary:"A gear-erő kapu helyett többféle játéktevékenység biztosítja a folyamatos és változatos wave-haladást.",changes:["A gear-erő követelmény teljesen megszűnt.","Minden 25. wave előtt 15 Farm aktivitáspont gyűjthető.","A tárgydrop legfeljebb 5, két boss összesen 6 pontot ad.","Egy tárgyfejlesztési próbálkozás 4 pontot ad, így a kizárólagos wave-farm önmagában nem elég.","Egy dungeon teljesítése 8 pontot ad, és kiválthatja a fejlesztési utat.","Az aktivitás már menet közben gyűlik, ezért aktív játéknál az ellenőrzőpont nem lassítja a wave-et.","A Paragon a legutóbbi Farm aktivitás ellenőrzés teljesítését is vizsgálja.","A Kalandor kezdőfelszerelés kiosztása megszűnt.","A korábban kiosztott Kalandor kezdőtárgyak mentésbetöltéskor automatikusan eltávolításra kerülnek.","A MINDENT FEJLESZT gomb megmaradt, és aktivitáspontot is ad."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_65")){
    updateContent.updates.unshift({id:"v22_65",version:"V22.65",title:"Jelentős DEF és blokkolás",date:"2026-08-21",summary:"A védelem most valóban meghatározza a túlélést: sebzéscsökkentést, több HP-t és blokkolási esélyt biztosít.",changes:["A DEF új, területhez és wave-hez igazodó sebzéscsökkentési képletet kapott.","A közepes védelem már érezhető, a magas védelem pedig fokozatosan közelít a 75%-os maximumhoz.","A DEF külön blokkolási esélyt ad, legfeljebb 25%-ot.","Sikeres blokk alapból további 50%-kal csökkenti az adott ütést.","A DEF maximális HP-hoz adott értéke 1,5-ről 2,5 HP-ra nőtt pontonként.","A Páncéledzés szintenként lényegesen több valódi védelmet ad.","Az Automata harc élőben mutatja a DEF-et, a sebzéscsökkentést és a blokk esélyét.","Blokkoláskor külön látványos BLOKK jelzés jelenik meg.","A Karakter statisztikában is látszik mindhárom védelmi érték."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_66")){
    updateContent.updates.unshift({id:"v22_66",version:"V22.66",title:"DEF-hez hangolt teljes PvE sebzés",date:"2026-08-21",summary:"A mobok, wave bossok, egyedi bossok és dungeonok sebzése most az új védelemrendszerhez igazodik.",changes:["A normál mobok alapsebzése a játékos HP-jához, az aktuális területhez és a wave-hez skálázódik.","A wave bossok külön, lényegesen veszélyesebb sebzésgörbét kaptak.","Az adminból létrehozott bossok megtartják a beállított sebzésüket, de legalább a megfelelő wave-szintű veszélyt jelentik.","A DEF sebzéscsökkentése minden normál és bossütésre érvényes.","A dungeon sikerességi esélyét az erő mellett most a DEF és a blokk esélye is módosítja.","Alacsony védelem csökkenti, megfelelő védelem érezhetően növeli a dungeon győzelmi esélyét.","A dungeonban kijelzett beérkező sebzés ténylegesen csökken a DEF alapján.","A dungeon harci felület kiírja az aktuális DEF-et és sebzéscsökkentést.","A kezdő szakasz védelmet kapott a halálspirál ellen, miközben a későbbi bossok veszélyesek maradnak."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_67")){
    updateContent.updates.unshift({id:"v22_67",version:"V22.67",title:"Dungeon nélküli Farm aktivitás",date:"2026-08-21",summary:"A wave- és Paragon-haladáshoz többé semmilyen dungeon teljesítése nem szükséges.",changes:["A dungeon kikerült a Farm aktivitáspontok forrásai közül.","A 15 pont pontosan teljesíthető 5 drop-ponttal, 6 boss-ponttal és egy 4 pontos tárgyfejlesztéssel.","A dungeon továbbra is külön jutalmas opcionális tartalom marad.","A Farm aktivitás panel egyértelműen jelzi, hogy dungeon nem szükséges.","A wave ellenőrzőpont és a Paragon kizárólag a dropot, bossokat és tárgyfejlesztést vizsgálja."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_68")){
    updateContent.updates.unshift({id:"v22_68",version:"V22.68",title:"Fejlesztés nélküli Farm aktivitás",date:"2026-08-21",summary:"A wave- és Paragon-haladáshoz többé tárgyfejlesztés sem szükséges.",changes:["A tárgyfejlesztés kikerült a Farm aktivitáspontok forrásai közül.","A Farm aktivitás követelménye 15-ről 11 pontra csökkent.","Öt tárgydrop összesen 5 pontot ad.","Két boss legyőzése összesen 6 pontot ad.","A MINDENT FEJLESZT gomb megmarad, de nem befolyásolja a wave- vagy Paragon-haladást.","Sem dungeon, sem tárgyfejlesztés nem kötelező az ellenőrzőpontokhoz."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_69")){
    updateContent.updates.unshift({id:"v22_69",version:"V22.69",title:"Stabil dungeon harcfelület",date:"2026-08-21",summary:"A dungeon újraindításakor a harci panel és az oldal görgetési helyzete többé nem ugrál el.",changes:["A dungeon harcpanel állandó helyet kapott a kazamatafelület tetején.","A panel többé nem költözik bele a kiválasztott dungeon kártyájába.","Jutalom- és statfrissítéskor a harcpanel megmarad, nem épül újra más pozícióban.","Új dungeon indításakor az oldal megtartja az aktuális görgetési pozíciót.","A harc befejezése után a panel ugyanott záródik be.","Az ismételt dungeonindítás ugyanazon a stabil felületen jelenik meg."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_70")){
    updateContent.updates.unshift({id:"v22_70",version:"V22.70",title:"Boss minden wave végén és helyben nyíló dungeonharc",date:"2026-08-21",summary:"Minden wave utolsó normál killje bosst idéz, a dungeonharc pedig a kiválasztott kártyán belül marad.",changes:["Minden wave utolsó szükséges normál killje után automatikusan boss jelenik meg.","A következő wave kizárólag a boss legyőzése után indul el.","A korábbi minden 10. wave-es bossrendszer megszűnt.","A dungeon harcpanel közvetlenül a megnyitott dungeon kártyájának alján jelenik meg.","A harc lefelé nyitja ki a kártyát, ezért nem kell a lap tetejére görgetni.","Dungeon megnyitásakor és újraindításakor a görgetési pozíció változatlan marad.","Jutalom- és statfrissítéskor a panel ugyanabban a dungeon kártyában marad."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_71")){
    updateContent.updates.unshift({id:"v22_71",version:"V22.71",title:"Célértékes DEF-balansz minden PvE tartalomhoz",date:"2026-08-21",summary:"A területi mobok, bossok és dungeonok külön ajánlott DEF alapján biztosítanak jól követhető túlélési fejlődést.",changes:["Minden terület az aktuális wave alapján ajánlott DEF-et mutat.","Ajánlott DEF alatt a mob- és bosssebzés fokozatosan veszélyesebb, de nem okoz azonnali halálspirált.","Ajánlott DEF körül stabil automata farm érhető el.","Az ajánlottnál magasabb DEF tovább javítja a túlélést, de a sebzéscsökkentési és blokkplafon megmarad.","A normál mobok és wave bossok külön sebzésgörbét használnak.","Az adminból létrehozott bossok beállított sebzése megmarad, majd a DEF-célértékhez igazodik.","Minden dungeon külön ajánlott DEF-et jelenít meg.","A dungeon győzelmi esélye az erő és az adott dungeonhoz szükséges DEF együttese alapján számolódik.","A dungeonban kijelzett tényleges beérkező sebzés ugyanazt a DEF-képletet használja.","Az Automata harc élőben mutatja az aktuális és ajánlott DEF-et."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_72")){
    updateContent.updates.unshift({id:"v22_72",version:"V22.72",title:"Valódi blokkolás minden PvE harcban",date:"2026-08-21",summary:"A blokk esélye most minden területi, boss- és dungeonütésnél külön sorsolódik, a DEF rendszerével összehangolva.",changes:["A normál mobok minden támadása blokkolható.","A wave bossok és az egyedi bossok támadásaira is hat a blokk.","A dungeon boss minden ütésénél külön blokkpróba történik.","A DEF először csökkenti a sebzést, sikeres blokk pedig további 50%-ot fog fel.","A dungeon számítása többé nem számolja kétszer a blokk átlagos értékét.","Sikeres blokknál látványos kék BLOKK jelzés jelenik meg.","A dungeon harcfelület kiírja a játékos aktuális blokk esélyét.","A blokk maximuma és ereje továbbra is az admin játékmenet-beállításaival szabályozható."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_73")){
    updateContent.updates.unshift({id:"v22_73",version:"V22.73",title:"Farm aktivitás eltávolítva",date:"2026-08-21",summary:"A wave- és Paragon-haladást többé semmilyen Farm aktivitáspont vagy ellenőrzőpont nem korlátozza.",changes:["A Farm aktivitáspontok teljesen kikerültek a játékból.","Megszűnt a 25 wave-enkénti aktivitás-ellenőrzés.","A Paragon szintlépéshez kizárólag az előírt wave szükséges.","A drop, bossölés, tárgyfejlesztés és dungeon többé nem tölt kötelező aktivitássávot.","A MINDENT FEJLESZT gyorsgomb megmaradt külön, átlátható felszerelésfejlesztő panelként.","Minden wave végén továbbra is automatikusan boss jelenik meg."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_74")){
    updateContent.updates.unshift({id:"v22_74",version:"V22.74",title:"Paragon túlfarm-védelem",date:"2026-08-21",summary:"Az Automata farm továbbra is kényelmes, de a Paragonra kész karakterrel nem termelhető végtelen wave és teljes aranyjutalom.",changes:["A Paragon wave-követelményéig minden farmjutalom 100%-os.","A Paragon elérése után még 25 wave teljes jutalmú türelmi szakasz jár.","Ezután 25 wave-enként fokozatosan csökken a normál és boss arany, valamint a tárgydrop esélye.","A Paragon-követelmény felett 100 wave-nél a wave-haladás megáll.","A farm tovább futhat, de a limitnél csak 10%-os arany- és dropjutalmat ad.","A prémium Automata Paragon a jogosult játékosnál automatikusan új ciklust indít.","A Farm felület élőben mutatja a teljes jutalmat, a türelmi szakaszt, a csökkentést és a wave-limitet.","A rendszerhez nem kell dungeon, fejlesztés vagy aktivitáspont."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_75")){
    updateContent.updates.unshift({id:"v22_75",version:"V22.75",title:"Játékos DEF teljes újrabalanszolása",date:"2026-08-21",summary:"A saját DEF többé nem szalad el a mobokhoz és bossokhoz képest; minden védelmi érték az adott terület ajánlott céljához igazodik.",changes:["A meglévő felszerelések DEF-je egyszeri 28%-os arányos átskálázást kap, ezért a tárgyak és fejlesztéseik nem vesznek el.","Az új páncélok, sisakok és csizmák lényegesen kisebb, kezelhető DEF-értékekkel esnek.","A Páncéledzés, karakterszint és Prestige DEF-hozzájárulása csökkent.","Az effektív DEF lágy plafont kapott: extrém régi vagy admin tárgyakkal sem nőhet értelmetlenül több ezres értékre.","Az ajánlott DEF terület- és wave-alapú görbéje az új tárgyértékekhez igazodik.","Ajánlott DEF körül nagyjából 40–50% sebzéscsökkentés érhető el.","Ajánlott DEF körül a blokk esélye körülbelül 12–16%. Alacsonyabb DEF gyengébb, kétszeres DEF erős, de nem halhatatlan.","A 75%-os sebzéscsökkentési és 25%-os blokkplafon csak komoly végjátékos túlépítéssel közelíthető meg.","A DEF-ből származó maximális HP 2,5-ről 1,75 HP/DEF értékre csökkent.","A mob-, boss- és dungeonsebzés továbbra is ugyanahhoz az ajánlott DEF-célhoz igazodik."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_76")){
    updateContent.updates.unshift({id:"v22_76",version:"V22.76",title:"Autoclicker-figyelő és adminértesítés",date:"2026-08-21",summary:"A játék felismeri a tartósan gépies kattintásmintákat, figyelmezteti a játékost és ellenőrizhető értesítést küld az adminnak.",changes:["A rendszer a kattintási sebességet, az időközök szabályosságát és az azonos cél ismétlését együtt vizsgálja.","Egyetlen gyors kattintás vagy rövid sorozat nem vált ki jelzést.","A beépített Automata farm és a weboldal saját programozott eseményei nem számítanak autoclickernek.","Gyanú esetén teljes képernyős figyelmeztetés jelzi, hogy az autoclicker használata kitiltással járhat.","Az esemény szerveroldali adatbázisba kerül, és nem tűnik el oldalfrissítéskor.","Az adminpanel új Csalásfigyelő füle mutatja a játékost, időpontot, kattintás/másodperc értéket, szabályosságot és azonos cél arányát.","Az admin közvetlenül megnyithatja a jelzett játékos adatlapját és ellenőrzöttnek jelölheti az értesítést.","Az ismétlődő jelentések 90 másodperces szerveroldali korlátozást kaptak.","A rendszer nem oszt automatikus bant; a végleges döntést az admin hozza meg."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_77")){
    updateContent.updates.unshift({id:"v22_77",version:"V22.77",title:"Egységes, stabil összerő",date:"2026-08-21",summary:"Megszűnt az a hiba, amely miatt ugyanaz a karakter egyszer 17k, máskor 33k erőt mutathatott.",changes:["A hibát a hátas erőbónuszának késleltetett, második számítása okozta.","A hátas bónusza most közvetlenül az egyetlen központi erőképlet része.","A később betöltődő, erőt újraszámoló hátaskód eltávolításra került.","A Karakter, Farm, Statisztika, dungeon és PvP ugyanazt az erőt mutatja.","A szervermentés és az online ranglista is pontosan ezt az egységes értéket kapja.","Fülváltás, oldalbetöltés és automatikus frissítés közben többé nem ugorhat két erőérték között.","A hátas tényleges százalékos erőbónusza változatlanul megmarad."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_78")){
    updateContent.updates.unshift({id:"v22_78",version:"V22.78",title:"Többszörös dungeonfutam",date:"2026-08-21",summary:"Elegendő dungeon jeggyel egyetlen stabil harcfelületen 1×, 3×, 5× vagy 10× kazamata teljesíthető.",changes:["Minden dungeon kártyán külön futamszám-választó jelent meg.","Választható 1×, 3×, 5× és 10× teljesítés.","A teljes jegyköltség indítás előtt pontosan látható és egyszerre kerül levonásra.","Minden futam külön siker- vagy bukáspróbát kap; a többszörös futam nem kerüli meg a dungeon esélyét.","Minden siker külön arany-, érc-, gyémánt- és lélekkő-jutalmat sorsol.","Minden siker külön ritka dungeonfelszerelés-droppróbát kap.","A végeredmény összesítve mutatja a sikerek, bukások, jutalmak és ritka tárgydropok számát.","A harc ugyanabban a kiválasztott dungeon kártyában marad, nem ugrik el a felület.","A dungeononként kiválasztott futamszám és harci gyorsítás megmarad."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_79")){
    updateContent.updates.unshift({id:"v22_79",version:"V22.79",title:"Prémium többszörös dungeonfutam",date:"2026-08-21",summary:"Az 1× dungeon ingyenes marad, a 2×, 3× és 5× futam pedig közös, egyszeri 10 €-s prémium jogosultságot kapott.",changes:["Az ingyenes játékos korlátozás nélkül indíthat 1× dungeonfutamot.","A prémium csomag feloldja a 2×, 3× és 5× futamot.","A korábbi 10× futam kikerült.","A Feltöltés oldalon megjelenik a Dungeon 2× / 3× / 5× futam 10 €-s terméke.","A dungeon kártya zárolt állapotban mutatja a prémium lehetőséget és az árat.","Az admin játékosonként külön be- vagy kikapcsolhatja a jogosultságot.","Minden futam külön kulcsot fogyaszt, és külön siker-, jutalom- és droppróbát kap.","A termék neve, ára, leírása és láthatósága a Feltöltés adminoldalon szerkeszthető."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_80")){
    updateContent.updates.unshift({id:"v22_80",version:"V22.80",title:"Kompakt erő és legyőzhető végjáték",date:"2026-08-21",summary:"Az összerő nem nő hatalmas számokra, miközben valódi végjátékos sebzéssel az utolsó terület és a legerősebb dungeon is együthetővé válhat.",changes:["A kijelzett összerő 30 000-es lágy végjátékos plafont kapott.","Minden további fejlesztés erősít, de az erőszám egyre lassabban nő.","A mob HP többé nem másolja automatikusan a játékos aktuális sebzését.","A pet- és felszerelésfejlődés valódi előnyt ad, nem növeli vissza rögtön az ellenfél HP-ját.","A területi mob HP az ajánlott területi erőből és a wave-ből számolódik.","Azonos fejlődési szinten a mobok és bossok veszélyesek maradnak.","Jól felépített végjátékos karakterrel az utolsó területi mob egy ütéssel legyőzhető.","Elég magas tényleges sebzéssel a legerősebb dungeon boss is együthetővé válik, miközben a kijelzett erő nem lesz milliós.","A DEF nem növelheti aránytalanul az összerőt."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_81")){
    updateContent.updates.unshift({id:"v22_81",version:"V22.81",title:"Boss közben is stabil összerő",date:"2026-08-21",summary:"Az összerő többé nem ugrál például 28k és 44k között a normál mob és a wave boss váltakozásakor.",changes:["A hiba oka az volt, hogy az összerő a pillanatnyilag aktív Boss sebzés bónuszt is beleszámolta.","A stabil összerő most kizárólag a karakter állandó alapsebzéséből számolódik.","A Boss sebzés opció és a képességfa Boss sebzése továbbra is teljes erővel működik boss harc közben.","A harci Boss sebzés többé nem módosítja a karakterlapon látható összerőt.","A ranglista, területfeloldás, dungeonkövetelmény és PvP ugyanazt a stabil erőt használja.","Normál mob és boss váltásakor az erőérték változatlan marad.","Valódi felszerelés-, pet-, hátas- vagy statváltozás továbbra is azonnal frissíti az összerőt."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_82")){
    updateContent.updates.unshift({id:"v22_82",version:"V22.82",title:"Paragon farmciklus és gyorsítási HP-terhelés",date:"2026-08-21",summary:"Paragon után az Automata harc valóban az első területről indul újra, a nagyobb sebességek pedig több mob- és boss HP-val járnak.",changes:["Paragon és Prestige után a karakter Wave 1-re, az első területre és normál mobállapotba kerül.","A korábbi legmagasabb terület minden új ciklusban alaphelyzetbe áll.","A megmaradó Paragon-, Prestige-, pet- vagy hátaserő nem ugorhatja át azonnal a területeket.","A területek minden ciklusban wave alapján nyílnak meg újra.","Az egyedi további területek 950 wave után 400 wave-enként nyílnak.","A 2× gyorsítás 1,35× mob- és boss HP-t ad.","A 3× gyorsítás 1,75× mob- és boss HP-t ad.","A 10× gyorsítás 3,5× mob- és boss HP-t ad.","A gyorsítás továbbra is előnyös, de nem teszi aránytalanul gyorssá a wave-haladást.","Sebességváltáskor az aktuális ellenfél HP-ja azonnal az új terhelésre áll.","A HP-szorzók a játékmenet-konfiguráció combatSpeedHpMultipliers mezőjében módosíthatók.","A ranglistán tárolt régi, 30 000 feletti erők szerveroldali korrekciót kapnak."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_83")){
    updateContent.updates.unshift({id:"v22_83",version:"V22.83",title:"Valós ranglistaerő minden játékosnál",date:"2026-08-21",summary:"A ranglista szerveroldalon, a teljes karaktermentésből számolja újra az összerőt.",changes:["A ranglista többé nem bízik a böngészőből küldött erőértékben.","A szerver a felszerelésből, opciókból, petekből, skillekből, Paragonból, Prestige-ből, DEF-ből és hátasból számol.","A boss közbeni ideiglenes sebzésbónusz nem változtatja meg a ranglistaerőt.","Minden korábban regisztrált játékos ereje egyszerre újraszámítódik, belépés nélkül is.","A régi DEF-értékek ugyanabban a migrációban kerülnek az új balanszra."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_84")){
    updateContent.updates.unshift({id:"v22_84",version:"V22.84",title:"Ritka Hasadék Boss jutalomesemény",date:"2026-08-21",summary:"Minden wave bossnál 3% eséllyel ritka Hasadék Boss érkezhet, amely garantáltan öt wave-et ugrik.",changes:["A Hasadék Boss megjelenési esélye pontosan 3%.","Legyőzése garantált +5 wave-haladást ad.","A normál bossok külön kisebb véletlen wave-ugrásai megmaradnak.","Győzelemkor teljes képernyős kék–arany effekt és nagy +5 WAVE felirat jelenik meg.","A ritka győzelmet háromhangú csilingelés jelzi."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_85")){
    updateContent.updates.unshift({id:"v22_85",version:"V22.85",title:"Paragonhoz igazított területút",date:"2026-08-21",summary:"Minden terület wave alapján nyílik, az utolsó terület pedig pontosan az aktuális Paragon-követelménynél válik elérhetővé.",changes:["A területfeloldást kizárólag az aktuális wave határozza meg.","A feloldási pontok minden Paragon-ciklus követelményéhez automatikusan újraosztódnak.","Az utolsó terület pontosan a Paragonhoz szükséges wave-en nyílik meg.","A területkártyák kiírják a saját feloldási wave-jüket és az aktuális Paragon-célt.","Adminból hozzáadott új területeknél a rendszer automatikusan újraosztja a teljes útvonalat."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_86")){
    updateContent.updates.unshift({id:"v22_86",version:"V22.86",title:"Fix Wave 400 Paragon-út és végjátékfarm",date:"2026-08-21",summary:"Minden Paragon-ciklus Wave 400-ig tart, a területek egyirányúan nyílnak, a végén pedig teljes jutalmú fejlesztőfarm marad.",changes:["A Paragon wave-követelménye minden szinten fixen 400.","A nyolc alap terület feloldási pontja: 1, 45, 98, 155, 214, 274, 337 és 400.","Új terület megnyitásakor a játékos automatikusan továbblép, a korábbi területek pedig lezáródnak az adott ciklusban.","Wave 400 után a wave nem nő tovább Paragon nélkül.","Az utolsó területen továbbra is 100%-os arany-, nyersanyag- és tárgyjutalom jár.","A játékos így a Paragon előtt tovább erősítheti felszerelését a nehezebb dungeonokhoz.","Paragon után újra Wave 1 és az első terület következik."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_87")){
    updateContent.updates.unshift({id:"v22_87",version:"V22.87",title:"Tömeges petidézés és intelligens petkraft",date:"2026-08-21",summary:"Egyszerre több pet idézhető, az összes megfelelő azonos pet pedig egyetlen gombbal végigkraftolható.",changes:["Petidézésnél 1×, 10×, 25× és 50× mennyiség választható.","A gomb előre mutatja a kiválasztott idézések teljes gyémántárát.","A tömeges idézés egy összesítőben mutatja a kapott ritkaságokat.","Új ÖSSZES AZONOS PET KRAFTOLÁSA gomb készült.","A tömeges kraft kizárólag azonos fajtájú, fő adottságú és kraftszintű peteket használ.","Az elkészült azonos magasabb szintű peteket automatikusan tovább kraftolja, amíg van elegendő darab és gyémánt.","Minden egyes kraft külön levonja az adminban beállított gyémántárat.","A ritka +5 wave teljes képernyős kijelzése és csilingelése kizárólag a Farm fülön jelenik meg."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_88")){
    updateContent.updates.unshift({id:"v22_88",version:"V22.88",title:"Pet- és hátasbónuszok újrabalanszolása",date:"2026-08-21",summary:"A petek és hátasok továbbra is értékes gyűjthető fejlesztések, de többé nem emelik aránytalanul magasra a karakter erejét.",changes:["Az újonnan idézett petek alapbónuszai a kompakt Wave 400-as játékmenethez igazodnak.","A meglévő petértékek és extra opciók egyszeri arányos átskálázást kapnak; egyetlen pet sem törlődik.","A pet sebzés, arany, krit és drop külön csökkenő hatásfokú lágy plafont használ.","Az összekraftolt érték továbbra is maradéktalanul összeadódik és látható marad.","A tényleges petsebzés maximuma fokozatosan 65%, a petaranyé 45%, a petkrité 18%, a petdropé 30% felé közelít.","A hátas szintenkénti ereje csökkenő hatásfokkal, legfeljebb 25% felé közelít.","A hátasok felülete az új tényleges százalékot mutatja.","Az Equip Best, a Karakter, Farm, dungeon, PvP, szervermentés és ranglista az új képleteket használja."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_89")){
    updateContent.updates.unshift({id:"v22_89",version:"V22.89",title:"Még kompaktabb meglévő petbónuszok",date:"2026-08-21",summary:"A jelenlegi és új petek számai tovább csökkentek, hogy a felszerelés, DEF, Paragon és dungeonfejlődés jelentősége megmaradjon.",changes:["Minden meglévő pet fő értéke az eredeti balanszolt alap 20%-ára kerül.","A meglévő extra petopciók ugyanezt az arányos korrekciót kapják.","Azok a fiókok is pontos értéket kapnak, amelyek már futtatták a V22.88 migrációját.","Az újonnan idézett alap- és adminpetek már közvetlenül az új kisebb értékkel érkeznek.","A pet neve, ritkasága, fúziós szintje, opciótípusa és gyűjteményi értéke megmarad.","A ranglista ereje minden meglévő játékosnál szerveroldalon újraszámítódik."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  if(!updateContent.updates.some(x=>x&&x.id==="v22_90")){
    updateContent.updates.unshift({id:"v22_90",version:"V22.90",title:"2000 ATK felszerelés és 30 000 sebzésplafon",date:"2026-08-21",summary:"A felszerelések és a teljes harci sebzés kompakt, ritkaság- és fejlődésalapú végjátékbalanszt kaptak.",changes:["Egyetlen felszerelés tényleges ATK-ja sem lehet több 2000-nél.","A ritkasági +15 ATK-célértékek: Normal 650, Rare 900, Epic 1200, Mythic 1600, Legendary 2000.","A 2000 ATK kizárólag kiváló végjátékos Legendary tárggyal és magas fejlesztéssel érhető el.","A tárgy ATK dobása az aktuális területhez és a Wave 400-as fejlődéshez igazodik.","A nem fegyver típusú tárgyakon az extra ATK csak 8% eséllyel jelenik meg és lényegesen kisebb.","A Vándorkereskedő felszerelései nem adhatnak azonnal maximális ATK-ot.","A meglévő túl magas tárgyak ritkaságuk szerint automatikusan korrekciót kapnak, de nem törlődnek.","A végső találati sebzés kritikus találattal, nyílvesszővel és bossbónusszal együtt sem lépheti túl a 30 000-et.","A szerveres ranglista- és PvP-számítás ugyanezeket a korlátokat használja."],visible:false,createdAt:new Date().toISOString()});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[updateContent]);
  }
  const powerCapMigration="v2316_rank_power_cap_100000";
  if(!(await q("SELECT 1 FROM system_migrations WHERE migration_key=$1",[powerCapMigration])).rows[0]){await q("UPDATE game_saves SET power=LEAST(power,100000)");await q("INSERT INTO system_migrations(migration_key) VALUES($1)",[powerCapMigration])}
  const realPowerMigration="v2283_recalculate_real_power";
  if(!(await q("SELECT 1 FROM system_migrations WHERE migration_key=$1",[realPowerMigration])).rows[0]){
    const rows=(await q("SELECT user_id,save_data FROM game_saves")).rows;
    for(const row of rows){const s=row.save_data||{};if(!s.defBalanceV275){for(const it of (Array.isArray(s.inventory)?s.inventory:[])){if(Number(it?.def)>0)it.def=Math.max(1,Math.round(Number(it.def)*.28))}s.defBalanceV275=true}await q("UPDATE game_saves SET save_data=$1,power=$2,updated_at=NOW() WHERE user_id=$3",[s,serverPowerV283(s),row.user_id])}
    await q("INSERT INTO system_migrations(migration_key) VALUES($1)",[realPowerMigration]);
  }
  const petMountMigration="v2288_pet_mount_balance";
  if(!(await q("SELECT 1 FROM system_migrations WHERE migration_key=$1",[petMountMigration])).rows[0]){
    const rows=(await q("SELECT user_id,save_data FROM game_saves")).rows;
    for(const row of rows){const s=row.save_data||{};if(!s.petMountBalanceV288){for(const p of (Array.isArray(s.pets)?s.pets:[])){if(!p||typeof p!=="object")continue;p.value=Math.max(0,Number(p.value||0)*.35);if(Array.isArray(p.extraOptions))for(const o of p.extraOptions)o.value=Math.max(0,Number(o?.value||0)*.35)}s.petMountBalanceV288=true}await q("UPDATE game_saves SET save_data=$1,power=$2,updated_at=NOW() WHERE user_id=$3",[s,serverPowerV283(s),row.user_id])}
    await q("INSERT INTO system_migrations(migration_key) VALUES($1)",[petMountMigration]);
  }
  const petBalanceMigration="v2289_pet_values_20pct";
  if(!(await q("SELECT 1 FROM system_migrations WHERE migration_key=$1",[petBalanceMigration])).rows[0]){
    const rows=(await q("SELECT user_id,save_data FROM game_saves")).rows;
    for(const row of rows){const s=row.save_data||{};if(!s.petBalanceV289){for(const p of (Array.isArray(s.pets)?s.pets:[])){if(!p||typeof p!=="object")continue;p.value=Math.max(0,Number(p.value||0)*(4/7));if(Array.isArray(p.extraOptions))for(const o of p.extraOptions)o.value=Math.max(0,Number(o?.value||0)*(4/7))}s.petBalanceV289=true}await q("UPDATE game_saves SET save_data=$1,power=$2,updated_at=NOW() WHERE user_id=$3",[s,serverPowerV283(s),row.user_id])}
    await q("INSERT INTO system_migrations(migration_key) VALUES($1)",[petBalanceMigration]);
  }
  const itemAttackMigration="v2290_item_attack_caps";
  if(!(await q("SELECT 1 FROM system_migrations WHERE migration_key=$1",[itemAttackMigration])).rows[0]){
    const rows=(await q("SELECT user_id,save_data FROM game_saves")).rows,caps={normal:260,rare:360,epic:480,mythic:640,legendary:800};
    for(const row of rows){const s=row.save_data||{};if(!s.itemAttackBalanceV290){for(const it of (Array.isArray(s.inventory)?s.inventory:[])){if(!it||typeof it!=="object")continue;it.atk=Math.max(0,Math.min(caps[String(it.rarity||"normal")]||260,Number(it.atk||0)))}s.itemAttackBalanceV290=true}await q("UPDATE game_saves SET save_data=$1,power=$2,updated_at=NOW() WHERE user_id=$3",[s,serverPowerV283(s),row.user_id])}
    await q("INSERT INTO system_migrations(migration_key) VALUES($1)",[itemAttackMigration]);
  }
  const capMigration="v2246_wallet_caps";
  const capDone=(await q("SELECT 1 FROM system_migrations WHERE migration_key=$1",[capMigration])).rows[0];
  if(!capDone){
    const rows=(await q("SELECT user_id,save_data FROM game_saves")).rows;
    for(const row of rows){const s=row.save_data||{},clean=(v,max)=>Math.min(max,Math.max(0,Number.isFinite(Number(v))?Number(v):0));s.gold=clean(s.gold,5000000);s.gems=clean(s.gems,50000);s.ore=clean(s.ore,100000);s.soul=clean(s.soul,50000);await q("UPDATE game_saves SET save_data=$1,gold=$2,updated_at=NOW() WHERE user_id=$3",[s,Math.floor(s.gold),row.user_id])}
    await q("INSERT INTO system_migrations(migration_key) VALUES($1)",[capMigration]);
  }

  await q(`
    CREATE TABLE IF NOT EXISTS discord_links(
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      discord_user_id TEXT UNIQUE,
      link_code TEXT UNIQUE,
      link_expires_at TIMESTAMPTZ,
      linked_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await q("ALTER TABLE users ADD COLUMN IF NOT EXISTS player_name TEXT");
  await q("ALTER TABLE users ADD COLUMN IF NOT EXISTS leaderboard_hidden BOOLEAN NOT NULL DEFAULT FALSE");
  await q("ALTER TABLE users ADD COLUMN IF NOT EXISTS pvp_rating INTEGER NOT NULL DEFAULT 1000");
  await q("UPDATE users SET player_name=username WHERE player_name IS NULL OR BTRIM(player_name)=''");
  await q("CREATE UNIQUE INDEX IF NOT EXISTS users_player_name_lower_unique ON users(LOWER(player_name))");


  const au=cleanName(process.env.ADMIN_USERNAME||"OmiAdmin");
  const ap=String(process.env.ADMIN_PASSWORD||"");
  if(ap){
    let row=(await q("SELECT id FROM users WHERE role='admin' LIMIT 1")).rows[0];
    if(!row){
      // Ha az ADMIN_USERNAME már létezik normál felhasználóként,
      // ne omoljon össze az indulás unique constraint miatt.
      const existing=(await q("SELECT id,role FROM users WHERE LOWER(username)=LOWER($1) LIMIT 1",[au])).rows[0];
      if(existing){
        await q("UPDATE users SET role='admin' WHERE id=$1",[existing.id]);
        console.log("Existing user promoted to admin:",au);
      }else{
        const hash=await bcrypt.hash(ap,12);
        const r=(await q("INSERT INTO users(username,player_name,password_hash,role) VALUES($1,$1,$2,'admin') RETURNING id",[au,hash])).rows[0];
        await q("INSERT INTO game_saves(user_id,save_data) VALUES($1,$2)",[r.id,DEFAULT_SAVE]);
        console.log("Admin created:",au);
      }
    }
  }else{
    console.warn("ADMIN_PASSWORD is not set. Admin account will not be auto-created.");
  }
}

app.get("/api/health",(req,res)=>res.json({ok:true,name:"OMI Idle Farm Online",version:"22.90.0"}));

app.post("/api/register",async(req,res)=>{
  try{
    const username=cleanName(req.body.username);
    const playerName=String(req.body.player_name||"").trim().slice(0,24);
    const password=String(req.body.password||"");
    if(!/^[A-Za-z0-9_ÁÉÍÓÖŐÚÜŰáéíóöőúüű-]{3,24}$/.test(username))
      return res.status(400).json({error:"A felhasználónév 3–24 karakter legyen, szóköz nélkül."});
    if(playerName.length<3)return res.status(400).json({error:"Adj meg legalább 3 karakteres játékosnevet."});
    if(password.length<6)return res.status(400).json({error:"A jelszó legalább 6 karakter legyen."});
    const exists=(await q("SELECT 1 FROM users WHERE LOWER(username)=LOWER($1)",[username])).rows[0];
    if(exists)return res.status(409).json({error:"Ez a felhasználónév már foglalt."});
    const playerExists=(await q("SELECT 1 FROM users WHERE LOWER(player_name)=LOWER($1)",[playerName])).rows[0];
    if(playerExists)return res.status(409).json({error:"Ez a játékosnév már foglalt."});
    const hash=await bcrypt.hash(password,12);
    const u=(await q("INSERT INTO users(username,player_name,password_hash) VALUES($1,$2,$3) RETURNING *",[username,playerName,hash])).rows[0];
    await q("INSERT INTO game_saves(user_id,save_data,power,level,kills,gold) VALUES($1,$2,0,1,0,0)",[u.id,DEFAULT_SAVE]);
    setAuth(res,u);
    res.json({ok:true,user:publicUser(u),save:DEFAULT_SAVE});
  }catch(e){
    // PostgreSQL unique constraint: két azonos regisztráció egyszerre is
    // biztonságosan, normális 409 válasszal kezelhető.
    if(e && e.code==="23505"){
      const c=String(e.constraint||"");
      const d=String(e.detail||"");
      if(c==="users_username_key" || d.includes("(username)=")){
        return res.status(409).json({
          error:"Ez a felhasználónév már foglalt.",
          code:"USERNAME_TAKEN"
        });
      }
      if(c==="users_player_name_lower_unique" || d.includes("(lower(player_name))=") || d.includes("(player_name)=")){
        return res.status(409).json({
          error:"Ez a játékosnév már foglalt.",
          code:"PLAYER_NAME_TAKEN"
        });
      }
      return res.status(409).json({
        error:"Ez az adat már használatban van.",
        code:"DUPLICATE_VALUE"
      });
    }
    console.error("Register error:",e);
    return res.status(500).json({error:"A regisztráció nem sikerült."});
  }
});

app.post("/api/login",async(req,res)=>{
  try{
    const username=cleanName(req.body.username);
    const password=String(req.body.password||"");
    const u=(await q("SELECT * FROM users WHERE LOWER(username)=LOWER($1)",[username])).rows[0];
    if(!u || !(await bcrypt.compare(password,u.password_hash)))
      return res.status(401).json({error:"Hibás felhasználónév vagy jelszó."});
    if(u.banned)return res.status(403).json({error:"Ez a fiók tiltva van."});
    await q("UPDATE users SET last_login_at=NOW() WHERE id=$1",[u.id]);
    setAuth(res,u);
    const gs=(await q("SELECT * FROM game_saves WHERE user_id=$1",[u.id])).rows[0];
    res.json({ok:true,user:publicUser(u),save:gs?.save_data||DEFAULT_SAVE});
  }catch(e){console.error(e);res.status(500).json({error:"A belépés nem sikerült."})}
});

app.post("/api/logout",(req,res)=>{
  res.clearCookie("omi_token");
  res.json({ok:true});
});


// ================= V22.8 DISCORD ACCOUNT LINK + LEVEL RANKS =================
function discordLevelRank(level){
  level=Math.max(1,Math.floor(Number(level||1)));
  const ranks=[
    {min:250,key:"immortal",name:"♾️ Lv250 Immortal"},
    {min:150,key:"legendary",name:"💎 Lv150 Legendás"},
    {min:100,key:"master",name:"👑 Lv100 Mester"},
    {min:75,key:"elite",name:"🌟 Lv75 Elit"},
    {min:50,key:"veteran",name:"🔥 Lv50 Veterán"},
    {min:25,key:"warrior",name:"⚔️ Lv25 Harcos"},
    {min:10,key:"adventurer",name:"🗡️ Lv10 Kalandor"},
    {min:1,key:"newcomer",name:"🌱 Újonc"}
  ];
  return ranks.find(r=>level>=r.min)||ranks[ranks.length-1];
}

function makeDiscordLinkCode(){
  const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out="";
  for(let i=0;i<8;i++)out+=chars[Math.floor(Math.random()*chars.length)];
  return out;
}

app.post("/api/discord/link-code",auth,async(req,res)=>{
  try{
    let code;
    for(let i=0;i<8;i++){
      code=makeDiscordLinkCode();
      const exists=(await q("SELECT 1 FROM discord_links WHERE link_code=$1",[code])).rows[0];
      if(!exists)break;
    }
    const expires=new Date(Date.now()+15*60*1000);
    await q(`
      INSERT INTO discord_links(user_id,link_code,link_expires_at,updated_at)
      VALUES($1,$2,$3,NOW())
      ON CONFLICT(user_id) DO UPDATE SET
        link_code=EXCLUDED.link_code,
        link_expires_at=EXCLUDED.link_expires_at,
        updated_at=NOW()
    `,[req.user.id,code,expires]);
    res.json({ok:true,code,expiresAt:expires.toISOString(),command:`/link code:${code}`});
  }catch(e){
    console.error("discord link-code",e);
    res.status(500).json({error:"Nem sikerült Discord összekötő kódot készíteni."});
  }
});

app.get("/api/discord/link-status",auth,async(req,res)=>{
  try{
    const link=(await q("SELECT discord_user_id,linked_at FROM discord_links WHERE user_id=$1",[req.user.id])).rows[0]||null;
    const gs=(await q("SELECT level FROM game_saves WHERE user_id=$1",[req.user.id])).rows[0];
    const level=Math.max(1,Number(gs?.level||1));
    res.json({ok:true,linked:Boolean(link?.discord_user_id),discordUserId:link?.discord_user_id||null,level,rank:discordLevelRank(level)});
  }catch(e){res.status(500).json({error:"Discord státusz nem kérhető le."})}
});

app.post("/api/discord/unlink",auth,async(req,res)=>{
  try{
    await q("UPDATE discord_links SET discord_user_id=NULL,link_code=NULL,link_expires_at=NULL,linked_at=NULL,updated_at=NOW() WHERE user_id=$1",[req.user.id]);
    res.json({ok:true});
  }catch(e){res.status(500).json({error:"Nem sikerült leválasztani a Discord fiókot."})}
});

// Bot claims a short-lived one-time code. No password/user secret is exposed.
app.post("/api/discord/claim",async(req,res)=>{
  try{
    const code=String(req.body?.code||"").trim().toUpperCase();
    const discordUserId=String(req.body?.discordUserId||"").trim();
    if(!/^[A-Z2-9]{8}$/.test(code) || !/^\d{15,25}$/.test(discordUserId))
      return res.status(400).json({error:"Hibás összekötő kód vagy Discord ID."});

    const row=(await q(`
      SELECT dl.user_id,u.username,u.player_name,g.level
      FROM discord_links dl
      JOIN users u ON u.id=dl.user_id
      LEFT JOIN game_saves g ON g.user_id=u.id
      WHERE dl.link_code=$1 AND dl.link_expires_at>NOW()
      LIMIT 1
    `,[code])).rows[0];
    if(!row)return res.status(404).json({error:"A kód hibás vagy lejárt. Kérj új kódot a weboldalon."});

    const already=(await q("SELECT user_id FROM discord_links WHERE discord_user_id=$1 AND user_id<>$2",[discordUserId,row.user_id])).rows[0];
    if(already)return res.status(409).json({error:"Ez a Discord fiók már másik játékfiókhoz van kapcsolva."});

    await q(`
      UPDATE discord_links SET
        discord_user_id=$1,link_code=NULL,link_expires_at=NULL,linked_at=NOW(),updated_at=NOW()
      WHERE user_id=$2
    `,[discordUserId,row.user_id]);

    const level=Math.max(1,Number(row.level||1));
    res.json({
      ok:true,
      playerName:row.player_name||row.username,
      level,
      rank:discordLevelRank(level)
    });
  }catch(e){
    console.error("discord claim",e);
    res.status(500).json({error:"A Discord összekötés nem sikerült."});
  }
});

// Read-only endpoint used by the bot for automatic rank sync.
app.get("/api/discord/rank/:discordId",async(req,res)=>{
  try{
    const id=String(req.params.discordId||"");
    if(!/^\d{15,25}$/.test(id))return res.status(400).json({error:"Hibás Discord ID."});
    const row=(await q(`
      SELECT u.username,u.player_name,g.level,g.power
      FROM discord_links dl
      JOIN users u ON u.id=dl.user_id
      LEFT JOIN game_saves g ON g.user_id=u.id
      WHERE dl.discord_user_id=$1
      LIMIT 1
    `,[id])).rows[0];
    if(!row)return res.status(404).json({linked:false});
    const level=Math.max(1,Number(row.level||1));
    res.json({
      linked:true,
      playerName:row.player_name||row.username,
      level,
      power:Math.max(0,Number(row.power||0)),
      rank:discordLevelRank(level)
    });
  }catch(e){res.status(500).json({error:"A Discord rang nem kérhető le."})}
});

app.get("/api/me",auth,async(req,res)=>{
  const gs=(await q("SELECT * FROM game_saves WHERE user_id=$1",[req.user.id])).rows[0];
  res.json({user:publicUser(req.user),save:gs?.save_data||DEFAULT_SAVE});
});

app.post("/api/save",auth,async(req,res)=>{
  try{
    let data=req.body.save;
    if(!data || typeof data!=="object")return res.status(400).json({error:"Hibás mentés."});
    const stored=(await q("SELECT save_data FROM game_saves WHERE user_id=$1",[req.user.id])).rows[0]?.save_data||{};
    const pending=(await q("SELECT patch FROM admin_pending_overrides WHERE user_id=$1",[req.user.id])).rows[0];
    const overrideApplied=Boolean(pending?.patch && Object.keys(pending.patch).length);
    if(overrideApplied)data=deepMergeSave(data,pending.patch);
    const premiumSource=overrideApplied?data:stored;
    const prestigeAdvancedV298=Math.max(0,Number(data.prestigeLevel||0))>Math.max(0,Number(stored.prestigeLevel||0));
    if(prestigeAdvancedV298){
      data.pvpBuild={atk:0,hp:0,def:0,block:0,luck:0,double:0};
      data.paragonStats={damage:0,gold:0,drop:0,crit:0};
      data.paragonPoints=0;
      delete data.pvpSoulSession;
    }
    data.speed10Unlocked=Boolean(stored.speed10Unlocked || premiumSource.speed10Unlocked);
    data.autoParagonUnlocked=Boolean(premiumSource.autoParagonUnlocked);
    data.dungeonBatchUnlocked=Boolean(stored.dungeonBatchUnlocked || premiumSource.dungeonBatchUnlocked);
    data.fullAutoUnlocked=Boolean(stored.fullAutoUnlocked || premiumSource.fullAutoUnlocked);
    if(!data.fullAutoUnlocked)data.fullAutoEnabled=false;
    // PvP progression/session is server-authoritative. A stale browser autosave must never roll it back.
    if(!prestigeAdvancedV298 && stored && stored.pvpBuild && typeof stored.pvpBuild==="object")data.pvpBuild=pvpBuild(stored);
    if(stored && stored.pvpSoulSession && stored.pvpSoulSession.active){
      data.pvpSoulSession={...stored.pvpSoulSession,active:true,budget:Math.max(0,Math.floor(Number(stored.pvpSoulSession.budget||0)))};
    }
    const power=serverPowerV283(data);
    const requestedWallet={gold:Number(data.gold||0),gems:Number(data.gems||0),ore:Number(data.ore||0),soul:Number(data.soul||0)};
    const economyConfig=await mainConfig(),caps={gold:5000000,gems:50000,ore:100000,soul:50000,...(economyConfig.economyCaps||{})};
    ["gold","gems","ore","soul"].forEach(k=>{const cap=Math.max(1,Math.floor(Number(caps[k])||1)),value=Math.floor(Number(data[k])||0);data[k]=Math.max(0,Math.min(cap,value))});
    const economyCapped=["gold","gems","ore","soul"].some(k=>Math.floor(requestedWallet[k])!==Number(data[k]));
    const level=Math.max(1,Math.floor(Number(data.level||1)));
    const kills=Math.max(0,Math.floor(Number(data.kills||0)));
    const gold=Math.max(0,Math.floor(Number(data.gold||0)));

    // Basic sanity limits; this is not a full anti-cheat system.
    if(level>1000000 || power>1000000000000 || kills>100000000000000)
      return res.status(400).json({error:"A mentésben érvénytelen érték található."});

    await q(`
      INSERT INTO game_saves(user_id,save_data,power,level,kills,gold,updated_at)
      VALUES($1,$2,$3,$4,$5,$6,NOW())
      ON CONFLICT(user_id) DO UPDATE SET
        save_data=EXCLUDED.save_data,power=EXCLUDED.power,level=EXCLUDED.level,
        kills=EXCLUDED.kills,gold=EXCLUDED.gold,updated_at=NOW()
    `,[req.user.id,data,power,level,kills,gold]);
    await q("UPDATE users SET last_save_at=NOW() WHERE id=$1",[req.user.id]);
    if(overrideApplied)await q("DELETE FROM admin_pending_overrides WHERE user_id=$1",[req.user.id]);
    res.json({ok:true,save:data,overrideApplied,economyCapped,walletCaps:caps});
  }catch(e){console.error(e);res.status(500).json({error:"A mentés nem sikerült."})}
});

app.get("/api/leaderboard",async(req,res)=>{
  try{
    const rows=(await q(`
      SELECT u.id,COALESCE(u.player_name,u.username) player_name,u.pvp_rating,
             g.power,g.level,g.kills,g.gold,g.updated_at,
             COALESCE(NULLIF(g.save_data->>'paragonLevel','')::INTEGER,0) paragon_level,
             LEAST(100,COALESCE(NULLIF(g.save_data->>'prestigeLevel','')::INTEGER,0)) prestige_level
      FROM game_saves g JOIN users u ON u.id=g.user_id
      WHERE u.role='player' AND u.banned=FALSE AND u.leaderboard_hidden=FALSE
      ORDER BY prestige_level DESC,paragon_level DESC,u.pvp_rating DESC,g.power DESC,g.level DESC,g.kills DESC
      LIMIT 100
    `)).rows;
    res.json({rows:rows.map((r,i)=>({...r,rank:i+1}))});
  }catch(e){res.status(500).json({error:"A ranglista nem tölthető be."})}
});

app.get("/api/admin/players",auth,admin,async(req,res)=>{
  const rows=(await q(`
    SELECT u.id,u.username,u.player_name,u.role,u.banned,u.leaderboard_hidden,u.pvp_rating,u.created_at,u.last_login_at,u.last_save_at,
           COALESCE(g.power,0) power,COALESCE(g.level,1) level,COALESCE(g.kills,0) kills,COALESCE(g.gold,0) gold
    FROM users u LEFT JOIN game_saves g ON g.user_id=u.id
    ORDER BY u.role DESC,g.power DESC,u.id ASC
  `)).rows;
  res.json({rows});
});

app.post("/api/anticheat/autoclicker",auth,async(req,res)=>{
 try{
  if(req.user.role==="admin")return res.json({ok:true,ignored:true});
  const src=req.body?.evidence||{},clean=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const evidence={
   samples:Math.floor(clean(src.samples,0,100)),
   cps:clean(src.cps,0,50),
   meanIntervalMs:clean(src.meanIntervalMs,0,5000),
   regularity:clean(src.regularity,0,1),
   sameTargetRatio:clean(src.sameTargetRatio,0,1),
   target:String(src.target||"game-action").slice(0,80)
  };
  if(evidence.samples<24||evidence.cps<5||evidence.regularity<.72||evidence.sameTargetRatio<.7)return res.status(400).json({error:"A minta nem érte el az értesítési küszöböt."});
  const recent=(await q("SELECT id FROM anticheat_alerts WHERE user_id=$1 AND alert_type='autoclicker' AND created_at>NOW()-INTERVAL '90 seconds' LIMIT 1",[req.user.id])).rows[0];
  if(recent)return res.json({ok:true,deduplicated:true});
  const risk=evidence.cps>=8&&evidence.regularity>=.88&&evidence.sameTargetRatio>=.85?"high":"suspicious";
  const row=(await q("INSERT INTO anticheat_alerts(user_id,alert_type,risk_level,evidence) VALUES($1,'autoclicker',$2,$3) RETURNING id",[req.user.id,risk,evidence])).rows[0];
  res.json({ok:true,alert_id:row.id,risk_level:risk});
 }catch(e){console.error(e);res.status(500).json({error:"Az autoclicker-jelzés mentése nem sikerült."})}
});

app.get("/api/admin/anticheat-alerts",auth,admin,async(req,res)=>{
 try{
  const rows=(await q(`SELECT a.id,a.user_id,a.alert_type,a.risk_level,a.evidence,a.status,a.created_at,a.reviewed_at,u.username,u.player_name
    FROM anticheat_alerts a JOIN users u ON u.id=a.user_id ORDER BY (a.status='new') DESC,a.created_at DESC LIMIT 200`)).rows;
  res.json({rows});
 }catch(e){console.error(e);res.status(500).json({error:"Az értesítések betöltése nem sikerült."})}
});

app.post("/api/admin/anticheat-alert/:id/read",auth,admin,async(req,res)=>{
 try{await q("UPDATE anticheat_alerts SET status='read',reviewed_at=NOW(),reviewed_by=$1 WHERE id=$2",[req.user.id,req.params.id]);res.json({ok:true})}
 catch(e){console.error(e);res.status(500).json({error:"Az értesítés frissítése nem sikerült."})}
});

app.get("/api/admin/player/:id",auth,admin,async(req,res)=>{
  const u=(await q("SELECT id,username,player_name,role,banned,leaderboard_hidden,pvp_rating,created_at,last_login_at,last_save_at FROM users WHERE id=$1",[req.params.id])).rows[0];
  if(!u)return res.status(404).json({error:"Játékos nem található."});
  const g=(await q("SELECT * FROM game_saves WHERE user_id=$1",[req.params.id])).rows[0];
  res.json({user:u,game:g||null});
});

app.post("/api/admin/player/:id/ban",auth,admin,async(req,res)=>{
  const banned=Boolean(req.body.banned);
  const t=(await q("SELECT role FROM users WHERE id=$1",[req.params.id])).rows[0];
  if(!t)return res.status(404).json({error:"Játékos nem található."});
  if(t.role==="admin")return res.status(400).json({error:"Admin nem tiltható."});
  await q("UPDATE users SET banned=$1 WHERE id=$2",[banned,req.params.id]);
  await q("INSERT INTO admin_logs(admin_id,target_user_id,action) VALUES($1,$2,$3)",[req.user.id,req.params.id,banned?"BAN":"UNBAN"]);
  res.json({ok:true});
});

app.post("/api/admin/player/:id/reset",auth,admin,async(req,res)=>{
  const t=(await q("SELECT role FROM users WHERE id=$1",[req.params.id])).rows[0];
  if(!t)return res.status(404).json({error:"Játékos nem található."});
  if(t.role==="admin")return res.status(400).json({error:"Admin mentése innen nem resetelhető."});
  await q("UPDATE game_saves SET save_data=$1,power=0,level=1,kills=0,gold=0,updated_at=NOW() WHERE user_id=$2",[DEFAULT_SAVE,req.params.id]);
  await q("INSERT INTO admin_logs(admin_id,target_user_id,action) VALUES($1,$2,'RESET_SAVE')",[req.user.id,req.params.id]);
  res.json({ok:true});
});

app.post("/api/admin/player/:id/grant",auth,admin,async(req,res)=>{
  const type=String(req.body.type||"");
  const amount=Math.floor(Number(req.body.amount));
  if(!["gold","gems","ore","soul","tickets","achievementPoints","skillPoints","paragonStatPoints","auraTokens"].includes(type))return res.status(400).json({error:"Hibás jutalomtípus."});
  if(!Number.isFinite(amount)||amount<=0)return res.status(400).json({error:"Adj meg 0-nál nagyobb mennyiséget."});
  if(amount>1e12)return res.status(400).json({error:"Túl nagy mennyiség."});
  const g=(await q("SELECT save_data FROM game_saves WHERE user_id=$1",[req.params.id])).rows[0];
  if(!g)return res.status(404).json({error:"Mentés nem található."});
  const s=g.save_data||{};
  s[type]=Math.max(0,Number(s[type]||0)+amount);
  await q("UPDATE game_saves SET save_data=$1,gold=$2,updated_at=NOW() WHERE user_id=$3",[s,Math.floor(Number(s.gold||0)),req.params.id]);
  await q(`
    INSERT INTO admin_pending_overrides(user_id,patch,updated_at) VALUES($1,$2,NOW())
    ON CONFLICT(user_id) DO UPDATE SET patch=admin_pending_overrides.patch || EXCLUDED.patch,updated_at=NOW()
  `,[req.params.id,{[type]:s[type]}]);
  await q("INSERT INTO admin_logs(admin_id,target_user_id,action) VALUES($1,$2,$3)",[req.user.id,req.params.id,`GRANT_${type}_${amount}`]);
  res.json({ok:true});
});

app.get("/api/admin/logs",auth,admin,async(req,res)=>{
  const rows=(await q(`
    SELECT l.id,l.action,l.created_at,a.username admin_name,t.username target_name
    FROM admin_logs l
    LEFT JOIN users a ON a.id=l.admin_id
    LEFT JOIN users t ON t.id=l.target_user_id
    ORDER BY l.id DESC LIMIT 200
  `)).rows;
  res.json({rows});
});


// V8 ADMIN STUDIO
app.get("/api/admin/players-full",auth,admin,async(req,res)=>{
  try{
    const rows=(await q(`
      SELECT u.id,u.username,u.player_name,u.role,u.banned,u.leaderboard_hidden,u.pvp_rating,
             u.created_at,u.last_login_at,
             COALESCE(g.save_data,'{}'::jsonb) save_data
      FROM users u
      LEFT JOIN game_saves g ON g.user_id=u.id
      ORDER BY COALESCE(u.player_name,u.username)
    `)).rows;
    res.json({ok:true,players:rows});
  }catch(e){res.status(500).json({error:e.message})}
});

app.post("/api/admin/player-save",auth,admin,async(req,res)=>{
  try{
    const {id,save}=req.body||{};
    if(!id||!save||typeof save!=="object")return res.status(400).json({error:"Hiányzó vagy hibás adat"});
    const gold=Math.max(0,Math.floor(Number(save.gold||0)));
    await q(`
      INSERT INTO game_saves(user_id,save_data,gold,updated_at)
      VALUES($1,$2,$3,NOW())
      ON CONFLICT(user_id) DO UPDATE SET save_data=EXCLUDED.save_data,gold=EXCLUDED.gold,updated_at=NOW()
    `,[id,save,gold]);
    await q("INSERT INTO admin_logs(admin_id,target_user_id,action) VALUES($1,$2,$3)",[req.user.id,id,"FULL_SAVE_EDIT"]);
    res.json({ok:true});
  }catch(e){res.status(500).json({error:e.message})}
});

app.get("/api/content-config",async(req,res)=>{
  try{
    await q("CREATE TABLE IF NOT EXISTS game_content(key TEXT PRIMARY KEY,value JSONB NOT NULL DEFAULT '{}'::jsonb,updated_at TIMESTAMPTZ DEFAULT NOW())");
    const row=(await q("SELECT value FROM game_content WHERE key='main'")).rows[0];
    res.json({ok:true,config:row?.value||{}});
  }catch(e){res.json({ok:true,config:{}})}
});

app.post("/api/admin/content-config",auth,admin,async(req,res)=>{
  try{
    const config=req.body?.config||{};
    await q("CREATE TABLE IF NOT EXISTS game_content(key TEXT PRIMARY KEY,value JSONB NOT NULL DEFAULT '{}'::jsonb,updated_at TIMESTAMPTZ DEFAULT NOW())");
    await q(`
      INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW())
      ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()
    `,[config]);
    await q("INSERT INTO admin_logs(admin_id,action) VALUES($1,$2)",[req.user.id,"GAME_CONTENT_EDIT"]);
    res.json({ok:true});
  }catch(e){res.status(500).json({error:e.message})}
});


// ===================== V11 SOCIAL / PVP / SHOP =====================
async function mainConfig(){
  try{
    await q("CREATE TABLE IF NOT EXISTS game_content(key TEXT PRIMARY KEY,value JSONB NOT NULL DEFAULT '{}'::jsonb,updated_at TIMESTAMPTZ DEFAULT NOW())");
    return (await q("SELECT value FROM game_content WHERE key='main'")).rows[0]?.value||{};
  }catch{return {}}
}
function pvpGearBonusPct(save){
  save=save||{};
  let pct=0;
  const inv=Array.isArray(save.inventory)?save.inventory:[];
  for(const id of Object.values(save.equipped||{})){
    const it=inv.find(x=>String(x.id)===String(id));
    if(!it)continue;
    for(const o of (Array.isArray(it.options)?it.options:[])){
      if(o && o.key==="pvpDmg")pct+=Math.max(0,Number(o.value||0));
    }
  }
  return Math.min(80,pct);
}
function pvpBuild(save){
  save=save||{};
  const raw=save.pvpBuild||{};
  return {
    atk:Math.max(0,Math.min(100,Math.floor(Number(raw.atk||0)))),
    hp:Math.max(0,Math.min(100,Math.floor(Number(raw.hp||0)))),
    def:Math.max(0,Math.min(100,Math.floor(Number(raw.def||0)))),
    block:Math.max(0,Math.min(40,Math.floor(Number(raw.block||0)))),
    luck:Math.max(0,Math.min(60,Math.floor(Number(raw.luck||0)))),
    double:Math.max(0,Math.min(40,Math.floor(Number(raw.double||0))))
  };
}
function pvpUpgradeDiscount(save){
  save=save||{};
  const paragon=Math.max(0,Math.floor(Number(save.paragonLevel||0)));
  const prestige=Math.max(0,Math.floor(Number(save.prestigeLevel||0)));
  // V22.98: Paragon -1% / szint, Prestige -2% / szint, összesen max. -70%.
  return Math.min(.70,paragon*.01+prestige*.02);
}
function pvpUpgradeCost(stat,level,save){
  const base={atk:3,hp:3,def:3,block:6,luck:5,double:7}[stat]||5;
  const raw=base*Math.pow(1.11,Math.max(0,Number(level||0)));
  return Math.max(1,Math.floor(raw*(1-pvpUpgradeDiscount(save))));
}
function pvpStats(save){
  save=save||{};
  const b=pvpBuild(save),gearPvpPct=pvpGearBonusPct(save);
  // FINAL RULE: no PvE level, Paragon, pets, PvE attack/defense or total power are used here.
  let atk=100+b.atk*15;
  const hp=1000+b.hp*80;
  const def=40+b.def*10;
  atk*=1+gearPvpPct/100;
  const crit=Math.min(.40,.05+b.luck*.005);
  const block=Math.min(.40,b.block*.01);
  const doubleHit=Math.min(.20,b.double*.005);
  return {level:1,atk:Math.max(1,Math.floor(atk)),def:Math.max(0,Math.floor(def)),hp:Math.max(1,Math.floor(hp)),crit,block,doubleHit,gearPvpPct,build:b};
}
app.post("/api/admin/player/:id/leaderboard",auth,admin,async(req,res)=>{
  const hidden=Boolean(req.body.hidden);
  await q("UPDATE users SET leaderboard_hidden=$1 WHERE id=$2 AND role<>'admin'",[hidden,req.params.id]);
  await q("INSERT INTO admin_logs(admin_id,target_user_id,action) VALUES($1,$2,$3)",[req.user.id,req.params.id,hidden?"HIDE_LEADERBOARD":"SHOW_LEADERBOARD"]);
  res.json({ok:true});
});
app.post("/api/admin/player/:id/profile",auth,admin,async(req,res)=>{
  const playerName=String(req.body.player_name||"").trim().slice(0,24);
  if(playerName.length<3)return res.status(400).json({error:"A játékosnév túl rövid."});
  const exists=(await q("SELECT 1 FROM users WHERE LOWER(player_name)=LOWER($1) AND id<>$2",[playerName,req.params.id])).rows[0];
  if(exists)return res.status(409).json({error:"Ez a játékosnév már foglalt."});
  await q("UPDATE users SET player_name=$1 WHERE id=$2",[playerName,req.params.id]);
  res.json({ok:true});
});


app.post("/api/pvp/session/start",auth,async(req,res)=>{
  try{
    const row=(await q("SELECT save_data FROM game_saves WHERE user_id=$1 FOR UPDATE",[req.user.id])).rows[0];
    if(!row)return res.status(404).json({error:"Mentés nem található."});
    const save=row.save_data||{};
    // The browser is the live game state; accept the visible soul balance, but never above the configured wallet cap.
    const cfg=await mainConfig(),cap=Math.max(1,Math.floor(Number(cfg.economyCaps?.soul||50000)));
    const visible=Math.max(0,Math.min(cap,Math.floor(Number(req.body?.soul ?? save.soul ?? 0))));
    let sess=save.pvpSoulSession;
    if(!sess?.active){
      sess={active:true,budget:visible,startedAt:Date.now()};
      save.pvpSoulSession=sess;
      save.soul=0; // new farmed soulstones collect here while PvP is open
      await q("UPDATE game_saves SET save_data=$1,updated_at=NOW() WHERE user_id=$2",[save,req.user.id]);
    }
    const levels=pvpBuild(save),stats=pvpStats(save),costs={};for(const k of Object.keys(levels))costs[k]=pvpUpgradeCost(k,levels[k],save);
    res.json({ok:true,budget:Math.max(0,Math.floor(Number(sess.budget||0))),pending:Math.max(0,Math.floor(Number(save.soul||0))),levels,stats,costs,discountPct:Math.round(pvpUpgradeDiscount(save)*100)});
  }catch(e){console.error("PVP SESSION START ERROR:",e);res.status(500).json({error:"A PvP lélekkő keret nem indítható."})}
});

app.post("/api/pvp/session/end",auth,async(req,res)=>{
  try{
    const row=(await q("SELECT save_data FROM game_saves WHERE user_id=$1 FOR UPDATE",[req.user.id])).rows[0];
    if(!row)return res.status(404).json({error:"Mentés nem található."});
    const save=row.save_data||{},sess=save.pvpSoulSession;
    if(!sess?.active)return res.json({ok:true,dropped:0,total:Math.max(0,Math.floor(Number(save.soul||0)))});
    const cfg=await mainConfig(),cap=Math.max(1,Math.floor(Number(cfg.economyCaps?.soul||50000)));
    const dropped=Math.max(0,Math.floor(Number(save.soul||0))),remaining=Math.max(0,Math.floor(Number(sess.budget||0)));
    save.soul=Math.min(cap,dropped+remaining);
    delete save.pvpSoulSession;
    await q("UPDATE game_saves SET save_data=$1,updated_at=NOW() WHERE user_id=$2",[save,req.user.id]);
    res.json({ok:true,dropped,remaining,total:save.soul});
  }catch(e){console.error("PVP SESSION END ERROR:",e);res.status(500).json({error:"A PvP lélekkő keret lezárása nem sikerült."})}
});

app.get("/api/pvp/profile",auth,async(req,res)=>{
  const row=(await q("SELECT save_data FROM game_saves WHERE user_id=$1",[req.user.id])).rows[0];
  if(!row)return res.status(404).json({error:"Mentés nem található."});
  const save=row.save_data||{},levels=pvpBuild(save),stats=pvpStats(save),sess=save.pvpSoulSession;
  const costs={};for(const k of Object.keys(levels))costs[k]=pvpUpgradeCost(k,levels[k],save);
  res.json({levels,stats,costs,soul:Math.max(0,Math.floor(Number(sess?.active?sess.budget:save.soul||0))),pendingSoul:Math.max(0,Math.floor(Number(sess?.active?save.soul:0))),sessionActive:Boolean(sess?.active),discountPct:Math.round(pvpUpgradeDiscount(save)*100)});
});
app.post("/api/pvp/upgrade",auth,async(req,res)=>{
  try{
    const stat=String(req.body.stat||"");
    const max={atk:100,hp:100,def:100,block:40,luck:60,double:40};
    if(!(stat in max))return res.status(400).json({error:"Ismeretlen PvP stat."});
    const row=(await q("SELECT save_data FROM game_saves WHERE user_id=$1 FOR UPDATE",[req.user.id])).rows[0];
    if(!row)return res.status(404).json({error:"Mentés nem található."});
    const save=row.save_data||{},levels=pvpBuild(save),sess=save.pvpSoulSession;
    let lv=Math.max(0,Number(levels[stat]||0));
    if(lv>=max[stat])return res.status(400).json({error:"Ez a PvP stat már maximumon van."});
    let available=Math.max(0,Math.floor(Number(sess?.active?sess.budget:save.soul||0)));
    const rawAmount=req.body.amount;
    const wanted=String(rawAmount).toLowerCase()==="max"?max[stat]-lv:Math.max(1,Math.min(10,Math.floor(Number(rawAmount||1))));
    let added=0,spent=0;
    for(let i=0;i<wanted&&lv<max[stat];i++){
      const oneCost=Math.max(0,Math.floor(Number(pvpUpgradeCost(stat,lv,save)||0)));
      if(available<oneCost)break;
      available-=oneCost;spent+=oneCost;lv++;added++;
    }
    if(!added)return res.status(400).json({error:`Nincs elég lélekkő. Következő pont ára: ${Math.max(0,Math.floor(Number(pvpUpgradeCost(stat,lv,save)||0)))}`});
    if(sess?.active){sess.budget=available;save.pvpSoulSession=sess}else save.soul=available;
    save.pvpBuild={...levels,[stat]:lv};
    await q("UPDATE game_saves SET save_data=$1,updated_at=NOW() WHERE user_id=$2",[save,req.user.id]);
    res.json({ok:true,cost:spent,added,soul:available,pendingSoul:Math.max(0,Math.floor(Number(sess?.active?save.soul:0))),levels:save.pvpBuild,stats:pvpStats(save),sessionActive:Boolean(sess?.active),discountPct:Math.round(pvpUpgradeDiscount(save)*100)});
  }catch(e){console.error("PVP UPGRADE ERROR:",e);res.status(500).json({error:"A PvP fejlesztés nem sikerült."});}
});

app.get("/api/pvp/opponents",auth,async(req,res)=>{
  const cfg=await mainConfig(),pc={minLevel:20,...(cfg.pvp||{})};
  const me=(await q("SELECT level FROM game_saves WHERE user_id=$1",[req.user.id])).rows[0];
  if(Number(me?.level||1)<pc.minLevel)return res.json({locked:true,minLevel:pc.minLevel,rows:[]});
  const rows=(await q(`
    SELECT u.id,COALESCE(u.player_name,u.username) player_name,u.pvp_rating,g.power,g.level,g.save_data
    FROM users u JOIN game_saves g ON g.user_id=u.id
    WHERE u.id<>$1 AND u.role='player' AND u.banned=FALSE AND g.level >= $2
    ORDER BY ABS(u.pvp_rating-$3),g.power DESC LIMIT 30
  `,[req.user.id,pc.minLevel,req.user.pvp_rating||1000])).rows;
  res.json({locked:false,minLevel:pc.minLevel,rows:rows.map(r=>({id:r.id,player_name:r.player_name,pvp_rating:r.pvp_rating,power:Math.floor(pvpStats(r.save_data).atk+pvpStats(r.save_data).def+pvpStats(r.save_data).hp/10),level:r.level,avatar:{equipped:r.save_data?.equipped||{},inventory:r.save_data?.inventory||[],activeAura:r.save_data?.activeAura||"none",activePet:r.save_data?.activePet}}))});
});
app.post("/api/pvp/fight",auth,async(req,res)=>{
  try{
    const defenderId=Number(req.body.defender_id);
    if(!Number.isInteger(defenderId)||defenderId<=0||defenderId===Number(req.user.id))
      return res.status(400).json({error:"Hibás ellenfél."});
    const cfg=await mainConfig(),pc={minLevel:20,rewardGold:500,cooldownSec:60,ratingWin:18,ratingLoss:20,...(cfg.pvp||{})};pc.cooldownSec=60;
    const last=(await q("SELECT created_at FROM pvp_fights WHERE challenger_id=$1 ORDER BY id DESC LIMIT 1",[req.user.id])).rows[0];
    if(last && (Date.now()-new Date(last.created_at).getTime())<pc.cooldownSec*1000){
      const remaining=Math.max(1,Math.ceil((pc.cooldownSec*1000-(Date.now()-new Date(last.created_at).getTime()))/1000));
      return res.status(429).json({error:`Várj ${remaining} másodpercet két párbaj között.`,cooldownRemaining:remaining,cooldownSec:Number(pc.cooldownSec||60)});
    }
    const rows=(await q(`
      SELECT u.id,u.username,u.player_name,u.pvp_rating,g.save_data,g.level
      FROM users u JOIN game_saves g ON g.user_id=u.id WHERE u.id=ANY($1::bigint[])
    `,[[req.user.id,defenderId]])).rows;
    const a=rows.find(x=>x.id==req.user.id),b=rows.find(x=>x.id==defenderId);
    if(!a||!b)return res.status(404).json({error:"Játékos nem található."});
    if(a.level<pc.minLevel||b.level<pc.minLevel)return res.status(400).json({error:`PvP csak ${pc.minLevel}. szinttől érhető el.`});
    const A=pvpStats(a.save_data),B=pvpStats(b.save_data);
    let ah=A.hp,bh=B.hp,turn=0,log=[];
    while(ah>0&&bh>0&&turn<200){
      turn++;
      const aCrit=Math.random()<A.crit,bCrit=Math.random()<B.crit;
      const aBlocked=Math.random()<B.block;
      let ad=aBlocked?0:Math.max(1,Math.floor(A.atk*(aCrit?1.75:1)-B.def*.50));
      const aDouble=!aBlocked&&Math.random()<A.doubleHit;if(aDouble)ad*=2;
      bh=Math.max(0,bh-ad);
      log.push({turn,from:"a",damage:ad,crit:aCrit,blocked:aBlocked,doubleHit:aDouble,aHp:ah,bHp:bh});
      if(bh<=0)break;
      const bBlocked=Math.random()<A.block;
      let bd=bBlocked?0:Math.max(1,Math.floor(B.atk*(bCrit?1.75:1)-A.def*.50));
      const bDouble=!bBlocked&&Math.random()<B.doubleHit;if(bDouble)bd*=2;
      ah=Math.max(0,ah-bd);
      log.push({turn,from:"b",damage:bd,crit:bCrit,blocked:bBlocked,doubleHit:bDouble,aHp:ah,bHp:bh});
    }
    const winnerId=ah===bh?(Math.random()<.5?a.id:b.id):(ah>bh?a.id:b.id);
    const loserId=winnerId===a.id?b.id:a.id;
    const winChange=Math.max(1,Math.floor(Number(pc.ratingWin??pc.ratingChange??18)));
    const lossChange=Math.max(1,Math.floor(Number(pc.ratingLoss??20)));
    const winnerRating=(await q("UPDATE users SET pvp_rating=pvp_rating+$1 WHERE id=$2 RETURNING pvp_rating",[winChange,winnerId])).rows[0]?.pvp_rating;
    const loserRating=(await q("UPDATE users SET pvp_rating=GREATEST(0,pvp_rating-$1) WHERE id=$2 RETURNING pvp_rating",[lossChange,loserId])).rows[0]?.pvp_rating;
    const wg=(await q("SELECT save_data FROM game_saves WHERE user_id=$1",[winnerId])).rows[0]?.save_data||{};
    wg.gold=Number(wg.gold||0)+Number(pc.rewardGold||0);
    await q("UPDATE game_saves SET save_data=$1,gold=$2,updated_at=NOW() WHERE user_id=$3",[wg,Math.floor(wg.gold),winnerId]);
    const battle={
      a:{id:a.id,name:a.player_name||a.username,...A},
      b:{id:b.id,name:b.player_name||b.username,...B},
      winnerId,
      ratingWin:winChange,
      ratingLoss:lossChange,
      winnerRating:Number(winnerRating||0),
      loserRating:Number(loserRating||0),
      rewardGold:Number(pc.rewardGold||0),
      log:log.slice(0,80)
    };
    await q("INSERT INTO pvp_fights(challenger_id,defender_id,winner_id,battle_data) VALUES($1,$2,$3,$4)",[a.id,b.id,winnerId,battle]);
    res.json({ok:true,battle,cooldownSec:Number(pc.cooldownSec||60),serverNow:Date.now()});
  }catch(e){
    console.error("PVP FIGHT ERROR:",e);
    res.status(500).json({error:"A párbaj nem sikerült."});
  }
});

app.get("/api/pvp/cooldown",auth,async(req,res)=>{
  try{
    const cfg=await mainConfig(),pc={minLevel:20,rewardGold:500,cooldownSec:60,ratingWin:18,ratingLoss:20,...(cfg.pvp||{})};pc.cooldownSec=60;
    const last=(await q("SELECT created_at FROM pvp_fights WHERE challenger_id=$1 ORDER BY id DESC LIMIT 1",[req.user.id])).rows[0];
    let remaining=0;
    if(last){
      const elapsed=Date.now()-new Date(last.created_at).getTime();
      remaining=Math.max(0,Math.ceil((Number(pc.cooldownSec||60)*1000-elapsed)/1000));
    }
    res.json({ok:true,cooldownSec:Number(pc.cooldownSec||60),remaining,ready:remaining<=0});
  }catch(e){
    console.error("PVP COOLDOWN ERROR:",e);
    res.status(500).json({error:"A PvP visszaszámlálás nem kérhető le."});
  }
});

app.get("/api/pvp/history",auth,async(req,res)=>{
  const rows=(await q(`
    SELECT f.id,f.winner_id,f.created_at,
           COALESCE(a.player_name,a.username) challenger,
           COALESCE(b.player_name,b.username) defender
    FROM pvp_fights f JOIN users a ON a.id=f.challenger_id JOIN users b ON b.id=f.defender_id
    WHERE f.challenger_id=$1 OR f.defender_id=$1 ORDER BY f.id DESC LIMIT 30
  `,[req.user.id])).rows;
  res.json({rows});
});

app.post("/api/shop/request",auth,async(req,res)=>{
  const cfg=await mainConfig(),products=cfg.store?.products||[];
  const id=String(req.body.product_id||"");
  const product=products.find(x=>String(x.id)===id) || (id==="auto_paragon_10_eur"?{id,name:"Auto Paragon szintelő",priceText:"10 €"}:id==="dungeon_batch_10_eur"?{id,name:"Dungeon 10× prémium futam",priceText:"10 €"}:id==="full_auto_20_eur"?{id,name:"Teljes Automata Rendszer",priceText:"20 €"}:null);
  if(!product)return res.status(404).json({error:"A termék nem található."});
  const note=String(req.body.note||"").slice(0,500);
  await q("INSERT INTO purchase_requests(user_id,product_id,product_name,price_text,note) VALUES($1,$2,$3,$4,$5)",[req.user.id,id,product.name||id,product.priceText||"",note]);
  res.json({ok:true,message:"A vásárlási igény rögzítve. A fizetés/átadás privát egyeztetéssel történik Discordon: nervos11."});
});
app.get("/api/admin/shop-requests",auth,admin,async(req,res)=>{
  const rows=(await q(`
    SELECT r.*,COALESCE(u.player_name,u.username) player_name
    FROM purchase_requests r JOIN users u ON u.id=r.user_id ORDER BY r.id DESC LIMIT 200
  `)).rows;res.json({rows});
});
app.post("/api/admin/shop-request/:id/status",auth,admin,async(req,res)=>{
  const status=String(req.body.status||"new");
  if(!["new","contacted","paid","delivered","cancelled"].includes(status))return res.status(400).json({error:"Hibás státusz."});
  await q("UPDATE purchase_requests SET status=$1 WHERE id=$2",[status,req.params.id]);res.json({ok:true});
});
// ==================================================================


// V11.3 - megbízható teljes játékostörlés adminból
app.delete("/api/admin/player/:id",auth,admin,async(req,res)=>{
  try{
    const targetId=Number(req.params.id);
    if(!Number.isInteger(targetId)||targetId<=0)return res.status(400).json({error:"Hibás játékos ID."});
    if(targetId===Number(req.user.id))return res.status(400).json({error:"A saját adminfiókodat nem törölheted."});
    const rr=await q("SELECT id,username,role FROM users WHERE id=$1",[targetId]);
    const target=rr.rows[0];
    if(!target)return res.status(404).json({error:"A játékos nem található."});
    if(target.role==="admin")return res.status(403).json({error:"Adminfiók nem törölhető."});
    // A game_saves, pvp_fights és purchase_requests FK-k ON DELETE CASCADE beállításúak.
    // admin_logs target_user_id ON DELETE SET NULL, ezért a users törlés biztonságosan takarít.
    await q("DELETE FROM users WHERE id=$1",[targetId]);
    await q("INSERT INTO admin_logs(admin_id,target_user_id,action) VALUES($1,NULL,$2)",
      [req.user.id,`DELETE_PLAYER ${target.username} (#${targetId})`]).catch(()=>{});
    res.json({ok:true,message:`${target.username} játékos végleg törölve.`});
  }catch(e){
    console.error("DELETE PLAYER ERROR:",e);
    res.status(500).json({error:"A játékos törlése nem sikerült: "+e.message});
  }
});



// ================= V22.2 FULL PLAYER ADMIN CONTROL =================
app.post("/api/admin/player/:id/state",auth,admin,async(req,res)=>{
  try{
    const id=Number(req.params.id);
    const row=(await q("SELECT save_data FROM game_saves WHERE user_id=$1",[id])).rows[0];
    if(!row)return res.status(404).json({error:"Mentés nem található."});

    const s=row.save_data||{};
    const b=req.body||{};
    const setNum=(obj,key,val,min=0)=>{
      if(val===null||val===undefined||val==="")return;
      const n=Number(val);
      if(Number.isFinite(n))obj[key]=Math.max(min,n);
    };

    setNum(s,"gold",b.gold);
    setNum(s,"gems",b.gems);
    setNum(s,"ore",b.ore);
    setNum(s,"soul",b.soul);
    setNum(s,"tickets",b.tickets);
    setNum(s,"level",b.level,1);
    setNum(s,"xp",b.xp);
    setNum(s,"wave",b.wave,1);
    setNum(s,"paragonLevel",b.paragonLevel);
    s.paragon=s.paragonLevel||0;
    setNum(s,"prestigeLevel",b.prestigeLevel);
    s.prestige=s.prestigeLevel||0;
    setNum(s,"paragonStatPoints",b.paragonStatPoints);
    setNum(s,"auraTokens",b.auraTokens);
    setNum(s,"prestigeTokens",b.prestigeTokens);
    setNum(s,"skillPoints",b.skillPoints);
    setNum(s,"hpRegenLevel",b.hpRegenLevel);
    setNum(s,"kills",b.kills);
    setNum(s,"deaths",b.deaths);

    s.base=s.base||{};
    for(const k of ["weaponTraining","armorTraining","mining","luck"]){
      if(b.base && b.base[k]!==null && b.base[k]!==undefined){
        setNum(s.base,k,b.base[k]);
      }
    }

    s.skills=s.skills||{};
    for(const k of ["power","gold","crit","drop","offline","pet"]){
      if(b.skills && b.skills[k]!==null && b.skills[k]!==undefined){
        setNum(s.skills,k,b.skills[k]);
      }
    }

    s.speed10Unlocked=Boolean(s.speed10Unlocked || b.speed10Unlocked);
    s.autoParagonUnlocked=Boolean(b.autoParagonUnlocked);
    s.dungeonBatchUnlocked=Boolean(s.dungeonBatchUnlocked || b.dungeonBatchUnlocked);
    s.fullAutoUnlocked=Boolean(s.fullAutoUnlocked || b.fullAutoUnlocked);
    s.fullAutoEnabled=Boolean(s.fullAutoUnlocked && b.fullAutoEnabled);
    const spd=Number(b.combatSpeed||1);
    s.combatSpeed=[1,2,3,10].includes(spd) ? (spd===10 && !s.speed10Unlocked ? 3 : spd) : 1;

    await q(
      "UPDATE game_saves SET save_data=$1,level=$2,kills=$3,gold=$4,updated_at=NOW() WHERE user_id=$5",
      [s,Math.floor(Number(s.level||1)),Math.floor(Number(s.kills||0)),Math.floor(Number(s.gold||0)),id]
    );
    const overridePatch={
      gold:s.gold,gems:s.gems,ore:s.ore,soul:s.soul,tickets:s.tickets,
      level:s.level,xp:s.xp,wave:s.wave,paragonLevel:s.paragonLevel,prestigeLevel:s.prestigeLevel,
      paragonStatPoints:s.paragonStatPoints,auraTokens:s.auraTokens,skillPoints:s.skillPoints,
      hpRegenLevel:s.hpRegenLevel,kills:s.kills,deaths:s.deaths,base:s.base,skills:s.skills,
      speed10Unlocked:s.speed10Unlocked,autoParagonUnlocked:s.autoParagonUnlocked,dungeonBatchUnlocked:s.dungeonBatchUnlocked,fullAutoUnlocked:s.fullAutoUnlocked,fullAutoEnabled:s.fullAutoEnabled,combatSpeed:s.combatSpeed
    };
    await q(`
      INSERT INTO admin_pending_overrides(user_id,patch,updated_at) VALUES($1,$2,NOW())
      ON CONFLICT(user_id) DO UPDATE SET patch=admin_pending_overrides.patch || EXCLUDED.patch,updated_at=NOW()
    `,[id,overridePatch]);
    await q("INSERT INTO admin_logs(admin_id,target_user_id,action) VALUES($1,$2,$3)",
      [req.user.id,id,"FULL_PLAYER_EDIT"]).catch(()=>{});

    const u=(await q("SELECT id,username,player_name,role,banned,leaderboard_hidden,pvp_rating,created_at,last_login_at,last_save_at FROM users WHERE id=$1",[id])).rows[0];
    const g=(await q("SELECT * FROM game_saves WHERE user_id=$1",[id])).rows[0];
    res.json({user:u,game:g||null});
  }catch(e){
    console.error("FULL PLAYER EDIT ERROR:",e);
    res.status(500).json({error:"A játékos módosítása nem sikerült."});
  }
});

app.post("/api/admin/player/:id/quick",auth,admin,async(req,res)=>{
  try{
    const id=Number(req.params.id);
    const row=(await q("SELECT save_data FROM game_saves WHERE user_id=$1",[id])).rows[0];
    if(!row)return res.status(404).json({error:"Mentés nem található."});
    const s=row.save_data||{};
    const action=String(req.body.action||"");

    if(action==="give10x"){
      s.speed10Unlocked=true;
      s.combatSpeed=10;
    }else if(action==="remove10x"){
      s.speed10Unlocked=false;
      if(Number(s.combatSpeed)===10)s.combatSpeed=3;
    }else if(action==="giveDungeon10x"){
      s.dungeonBatchUnlocked=true;
    }else if(action==="removeDungeon10x"){
      s.dungeonBatchUnlocked=false;
      if(s.dungeonBatchV278&&typeof s.dungeonBatchV278==="object")for(const k of Object.keys(s.dungeonBatchV278))if(Number(s.dungeonBatchV278[k])===10)s.dungeonBatchV278[k]=5;
    }else if(action==="fullhp"){
      const baseHp=Math.max(100,1000+Number(s.level||1)*80+Number(s.paragonLevel||0)*20);
      s.playerHp=Math.max(Number(s.playerHp||0),baseHp);
    }else{
      return res.status(400).json({error:"Ismeretlen admin művelet."});
    }

    await q(
      "UPDATE game_saves SET save_data=$1,level=$2,kills=$3,gold=$4,updated_at=NOW() WHERE user_id=$5",
      [s,Math.floor(Number(s.level||1)),Math.floor(Number(s.kills||0)),Math.floor(Number(s.gold||0)),id]
    );
    await q("INSERT INTO admin_logs(admin_id,target_user_id,action) VALUES($1,$2,$3)",
      [req.user.id,id,"QUICK_"+action.toUpperCase()]).catch(()=>{});

    const u=(await q("SELECT id,username,player_name,role,banned,leaderboard_hidden,pvp_rating,created_at,last_login_at,last_save_at FROM users WHERE id=$1",[id])).rows[0];
    const g=(await q("SELECT * FROM game_saves WHERE user_id=$1",[id])).rows[0];
    res.json({user:u,game:g||null});
  }catch(e){
    console.error("QUICK ADMIN ERROR:",e);
    res.status(500).json({error:"Az admin művelet nem sikerült."});
  }
});



/* ================= V22.92 AI FEJLESZTŐ + GITHUB + RENDER DEPLOY ================= */
const AI_ALLOWED_FILES=["server.js","public/game.js","public/index.html","public/admin.js","public/admin.html","public/style.css","render.yaml","package.json","README.txt"];
function aiDevConfig(){
  return {
    openai:Boolean(process.env.OPENAI_API_KEY),
    github:Boolean(process.env.GITHUB_TOKEN&&process.env.GITHUB_REPO),
    render:Boolean(process.env.RENDER_DEPLOY_HOOK_URL),
    repo:String(process.env.GITHUB_REPO||""),
    branch:String(process.env.GITHUB_BRANCH||"main"),
    model:String(process.env.OPENAI_MODEL||"gpt-5.6")
  };
}
function aiReadProjectFile(rel){
  if(!AI_ALLOWED_FILES.includes(rel))throw new Error("Nem engedélyezett projektfájl: "+rel);
  const full=path.join(__dirname,rel);
  const normalized=path.normalize(full);
  if(!normalized.startsWith(path.normalize(__dirname+path.sep)))throw new Error("Hibás fájlútvonal.");
  return require("fs").readFileSync(normalized,"utf8");
}
function aiPickContextFiles(prompt){
  const p=String(prompt||"").toLowerCase();
  const picked=new Set(["server.js","public/game.js","public/index.html"]);
  if(/admin|panel|játékos|beállítás|konfigur|moder|boss|pet|dungeon|pvp/.test(p)){picked.add("public/admin.js");picked.add("public/admin.html")}
  if(/kinézet|design|szín|css|méret|gomb|panel|elrendez|mobil|reszponz|anim|effekt|vizu/.test(p))picked.add("public/style.css");
  return [...picked];
}
function aiExtractText(data){
  if(typeof data?.output_text==="string"&&data.output_text.trim())return data.output_text;
  const out=[];
  for(const item of (data?.output||[]))for(const c of (item?.content||[]))if(typeof c?.text==="string")out.push(c.text);
  return out.join("\n");
}
function aiParseJson(text){
  let t=String(text||"").trim();
  t=t.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/i,"");
  const a=t.indexOf("{"),b=t.lastIndexOf("}");
  if(a>=0&&b>a)t=t.slice(a,b+1);
  return JSON.parse(t);
}
async function aiGeneratePatch(requestText){
  const files=aiPickContextFiles(requestText);
  let budget=620000,parts=[];
  for(const rel of files){
    let content=aiReadProjectFile(rel);
    if(content.length>budget)content=content.slice(0,budget);
    budget-=content.length;
    parts.push(`\n===== FILE: ${rel} =====\n${content}`);
    if(budget<=0)break;
  }
  const instructions=`Te az OMI IDLE FARM webjáték senior fejlesztője vagy. A feladatod kizárólag biztonságos, célzott forráskód-módosítás készítése.\n\nSZABÁLYOK:\n- Csak a megadott projektfájlokat módosíthatod.\n- Nem kérhetsz és nem olvashatsz környezeti változókat, tokeneket, jelszavakat, cookie-kat vagy adatbázis-titkokat.\n- Nem adhatsz hozzá eval/Function/child_process/exec/spawn/shell parancsfuttatást, távoli kódletöltést vagy rejtett backdoort.\n- Ne gyengítsd az auth/admin ellenőrzést.\n- Tartsd meg a meglévő funkciókat, hacsak a kérés nem kéri kifejezetten a változtatásukat.\n- Kizárólag JSON-t adj vissza, markdown nélkül.\n- Minden módosítás exact search/replace legyen. A search szövegnek egyedinek és szó szerint megtalálhatónak kell lennie.\n- Egy műveletben ne cserélj indokolatlanul teljes fájlt; célzott blokkokat használj.\n\nJSON forma:\n{"summary":"rövid magyar összefoglaló","operations":[{"path":"public/game.js","search":"pontos régi szöveg","replace":"új szöveg"}]}\nMaximum 10 operation. Engedélyezett fájlok: ${AI_ALLOWED_FILES.join(", ")}.`;
  const body={model:String(process.env.OPENAI_MODEL||"gpt-5.6"),instructions,input:`ADMIN FEJLESZTÉSI KÉRÉS:\n${requestText}\n\nAKTUÁLIS FORRÁSKÓD:${parts.join("")}`};
  const r=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+process.env.OPENAI_API_KEY},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error("AI API hiba: "+(d?.error?.message||r.status));
  const patch=aiParseJson(aiExtractText(d));
  if(!patch||!Array.isArray(patch.operations)||!patch.operations.length)throw new Error("Az AI nem adott alkalmazható módosítást.");
  if(patch.operations.length>10)throw new Error("Túl sok módosítási művelet érkezett.");
  return patch;
}
function aiApplyPatch(patch){
  const changed=new Map();
  for(const op of patch.operations){
    const rel=String(op?.path||"");
    if(!AI_ALLOWED_FILES.includes(rel))throw new Error("Az AI tiltott fájlt próbált módosítani: "+rel);
    const search=String(op?.search??""),replace=String(op?.replace??"");
    if(!search||search.length>180000||replace.length>220000)throw new Error("Érvénytelen módosítási blokk: "+rel);
    if(/child_process|\beval\s*\(|new\s+Function\s*\(|\.exec\s*\(|\.spawn\s*\(/i.test(replace))throw new Error("Biztonsági okból tiltott kódrészletet adott az AI: "+rel);
    let content=changed.has(rel)?changed.get(rel):aiReadProjectFile(rel);
    const first=content.indexOf(search);
    if(first<0)throw new Error("Nem található a módosítandó kódrészlet: "+rel);
    if(content.indexOf(search,first+1)>=0)throw new Error("Nem egyedi a módosítandó kódrészlet: "+rel);
    content=content.slice(0,first)+replace+content.slice(first+search.length);
    changed.set(rel,content);
  }
  for(const [rel,content] of changed){
    if(rel.endsWith(".js"))new vm.Script(content,{filename:rel});
    if(content.includes("OPENAI_API_KEY=")||content.includes("GITHUB_TOKEN=")||content.includes("RENDER_DEPLOY_HOOK_URL="))throw new Error("Titkos kulcs nem írható forrásfájlba.");
  }
  return changed;
}
async function ghApi(url,opt={}){
  const r=await fetch("https://api.github.com"+url,{...opt,headers:{"Accept":"application/vnd.github+json","Authorization":"Bearer "+process.env.GITHUB_TOKEN,"X-GitHub-Api-Version":"2026-03-10","Content-Type":"application/json",...(opt.headers||{})}});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error("GitHub API hiba: "+(d?.message||r.status));
  return d;
}
function ghRepoParts(){
  const [owner,repo]=String(process.env.GITHUB_REPO||"").split("/");
  if(!owner||!repo)throw new Error("A GITHUB_REPO formátuma owner/repo legyen.");
  return {owner,repo};
}
async function aiVerifyGitHubBase(changed){
  const {owner,repo}=ghRepoParts(),branch=String(process.env.GITHUB_BRANCH||"main");
  for(const [rel,localNew] of changed){
    const d=await ghApi(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${rel.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`);
    const remote=Buffer.from(String(d.content||"").replace(/\n/g,""),"base64").toString("utf8");
    const localOld=aiReadProjectFile(rel);
    if(remote!==localOld)throw new Error(`A GitHub ${rel} fájlja eltér a jelenleg futó verziótól. Előbb a legfrissebb commitot deployold, majd próbáld újra.`);
    if(localNew===localOld)throw new Error("A módosítás nem változtatott a fájlon: "+rel);
  }
}
async function aiCommitGitHub(changed,summary){
  const {owner,repo}=ghRepoParts(),branch=String(process.env.GITHUB_BRANCH||"main");
  const ref=await ghApi(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodeURIComponent(branch)}`);
  const parentSha=ref?.object?.sha;
  const parent=await ghApi(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits/${parentSha}`);
  const tree=[];
  for(const [rel,content] of changed){
    const blob=await ghApi(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/blobs`,{method:"POST",body:JSON.stringify({content:Buffer.from(content,"utf8").toString("base64"),encoding:"base64"})});
    tree.push({path:rel,mode:"100644",type:"blob",sha:blob.sha});
  }
  const newTree=await ghApi(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees`,{method:"POST",body:JSON.stringify({base_tree:parent.tree.sha,tree})});
  const commit=await ghApi(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits`,{method:"POST",body:JSON.stringify({message:"AI Admin: "+String(summary||"játékfejlesztés").slice(0,120),tree:newTree.sha,parents:[parentSha]})});
  await ghApi(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/refs/heads/${encodeURIComponent(branch)}`,{method:"PATCH",body:JSON.stringify({sha:commit.sha,force:false})});
  return commit.sha;
}
async function aiTriggerRender(commitSha){
  const raw=String(process.env.RENDER_DEPLOY_HOOK_URL||"");
  if(!raw)return {skipped:true};
  const u=new URL(raw);u.searchParams.set("ref",commitSha);
  const r=await fetch(u,{method:"POST"});
  if(!r.ok)throw new Error("A GitHub commit elkészült, de a Render deploy indítása hibát adott: HTTP "+r.status);
  return {ok:true,status:r.status};
}

// ===================== V22.94 FREE GAME SETTING ASSISTANT =====================
function huNorm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function firstNum(s,rx){const m=String(s).match(rx);return m?Number(String(m[1]).replace(/\s/g,"")):null}
app.post("/api/admin/game-assistant/apply",auth,admin,async(req,res)=>{
  try{
    const request=String(req.body?.request||"").trim();
    if(request.length<4)return res.status(400).json({error:"Írd le, mit szeretnél beállítani."});
    const n=huNorm(request),cfg=await mainConfig(),changes=[];
    cfg.bosses=Array.isArray(cfg.bosses)?cfg.bosses:[];cfg.pvp={...(cfg.pvp||{})};cfg.gameplay={...(cfg.gameplay||{})};
    const hp=firstNum(n,/(?:hp|eletero)\s*(?:legyen|=|:)??\s*([0-9 ]+)/i);
    const dmg=firstNum(n,/(?:sebzes|damage)\s*(?:legyen|=|:)??\s*([0-9 ]+)/i);
    const gold=firstNum(n,/(?:arany(?:\s*jutalom)?|gold)\s*(?:legyen|=|:)??\s*([0-9 ]+)/i);
    const gems=firstNum(n,/(?:gyemant(?:\s*jutalom)?|gem)\s*(?:legyen|=|:)??\s*([0-9 ]+)/i);
    const drop=firstNum(n,/(?:drop(?:\s*esely)?|targy drop)\s*(?:legyen|=|:)??\s*([0-9]+(?:[.,][0-9]+)?)/i);
    const targetAll=/minden\s+boss|osszes\s+boss/.test(n);
    let targets=[];
    if(targetAll)targets=cfg.bosses;
    else if(/boss/.test(n)){
      targets=cfg.bosses.filter(b=>{const bn=huNorm(b.name||b.id);return bn&&n.includes(bn)});
      if(!targets.length&&cfg.bosses.length===1)targets=[cfg.bosses[0]];
    }
    if(targets.length){
      targets.forEach(b=>{
        if(hp!=null){b.hp=Math.max(1,Math.floor(hp));changes.push(`${b.name||b.id}: HP = ${b.hp}`)}
        if(dmg!=null){b.damage=Math.max(0,Math.floor(dmg));changes.push(`${b.name||b.id}: sebzés = ${b.damage}`)}
        if(gold!=null){b.gold=Math.max(0,Math.floor(gold));changes.push(`${b.name||b.id}: arany = ${b.gold}`)}
        if(gems!=null){b.gems=Math.max(0,Math.floor(gems));changes.push(`${b.name||b.id}: gyémánt = ${b.gems}`)}
        if(drop!=null){b.dropChance=Math.max(0,Math.min(100,Number(String(drop).replace(',','.'))));changes.push(`${b.name||b.id}: drop = ${b.dropChance}%`)}
      });
    }
    if(/pvp/.test(n)){
      const reward=firstNum(n,/(?:jutalom|reward|arany)\s*(?:legyen|=|:)??\s*([0-9 ]+)/i);
      const cooldown=firstNum(n,/(?:cooldown|varakozas)\s*(?:legyen|=|:)??\s*([0-9 ]+)/i);
      const minLevel=firstNum(n,/(?:minimum\s*szint|min\s*szint)\s*(?:legyen|=|:)??\s*([0-9 ]+)/i);
      if(reward!=null){cfg.pvp.rewardGold=Math.max(0,Math.floor(reward));changes.push(`PvP győzelmi arany = ${cfg.pvp.rewardGold}`)}
      if(cooldown!=null){cfg.pvp.cooldownSec=Math.max(0,Math.floor(cooldown));changes.push(`PvP várakozás = ${cfg.pvp.cooldownSec} mp`)}
      if(minLevel!=null){cfg.pvp.minLevel=Math.max(1,Math.floor(minLevel));changes.push(`PvP minimum szint = ${cfg.pvp.minLevel}`)}
    }
    const soulCap=firstNum(n,/(?:lelekk(?:o|ő)\s*(?:limit|maximum|max)|soul\s*cap)\s*(?:legyen|=|:)??\s*([0-9 ]+)/i);
    if(soulCap!=null){cfg.economyCaps={gold:5000000,gems:50000,ore:100000,soul:50000,...(cfg.economyCaps||{}),soul:Math.max(1,Math.floor(soulCap))};changes.push(`Lélekkő maximum = ${cfg.economyCaps.soul}`)}
    if(!changes.length)return res.status(400).json({error:"Ezt a kérést még nem ismerem fel. Próbáld például: ‘Minden boss HP legyen 500000’ vagy ‘PvP jutalom legyen 5000 arany’."});
    await q("INSERT INTO game_content(key,value,updated_at) VALUES('main',$1,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[cfg]);
    await q("INSERT INTO admin_logs(admin_id,target_user_id,action) VALUES($1,NULL,$2)",[req.user.id,`GAME_ASSISTANT: ${request.slice(0,180)}`]);
    res.json({ok:true,changes,config:cfg,message:"A játékbeállítás azonnal elmentve."});
  }catch(e){console.error("GAME ASSISTANT ERROR",e);res.status(500).json({error:"A játékbeállítás nem sikerült."})}
});

app.get("/api/admin/ai-developer/status",auth,admin,async(req,res)=>{
  const cfg=aiDevConfig();
  const rows=(await q("SELECT id,request_text,status,summary,commit_sha,changed_files,error_text,created_at,finished_at FROM ai_development_runs ORDER BY id DESC LIMIT 12")).rows.catch(()=>[]);
  res.json({configured:cfg.openai&&cfg.github&&cfg.render,services:cfg,runs:rows});
});
app.post("/api/admin/ai-developer/run",auth,admin,async(req,res)=>{
  const requestText=String(req.body?.request||"").trim().slice(0,6000),cfg=aiDevConfig();
  if(requestText.length<8)return res.status(400).json({error:"Írd le részletesebben, mit szeretnél fejleszteni."});
  if(!cfg.openai||!cfg.github||!cfg.render)return res.status(400).json({error:"Az AI fejlesztő nincs teljesen beállítva. Szükséges: OPENAI_API_KEY, GITHUB_TOKEN, GITHUB_REPO, RENDER_DEPLOY_HOOK_URL."});
  let runId=null;
  try{
    runId=(await q("INSERT INTO ai_development_runs(admin_id,request_text,status) VALUES($1,$2,'thinking') RETURNING id",[req.user.id,requestText])).rows[0].id;
    const patch=await aiGeneratePatch(requestText);
    await q("UPDATE ai_development_runs SET status='validating',summary=$1 WHERE id=$2",[String(patch.summary||""),runId]);
    const changed=aiApplyPatch(patch);
    await aiVerifyGitHubBase(changed);
    await q("UPDATE ai_development_runs SET status='publishing',changed_files=$1 WHERE id=$2",[JSON.stringify([...changed.keys()]),runId]);
    const sha=await aiCommitGitHub(changed,patch.summary);
    await q("UPDATE ai_development_runs SET status='deploying',commit_sha=$1 WHERE id=$2",[sha,runId]);
    await aiTriggerRender(sha);
    await q("UPDATE ai_development_runs SET status='done',finished_at=NOW() WHERE id=$1",[runId]);
    await q("INSERT INTO admin_logs(admin_id,action) VALUES($1,$2)",[req.user.id,"AI_DEV_DEPLOY_"+sha.slice(0,8)]).catch(()=>{});
    res.json({ok:true,summary:String(patch.summary||"Fejlesztés elkészült."),changedFiles:[...changed.keys()],commitSha:sha,message:"A módosítás GitHubra került, a Render deploy elindult."});
  }catch(e){
    console.error("AI DEVELOPER ERROR",e);
    if(runId)await q("UPDATE ai_development_runs SET status='failed',error_text=$1,finished_at=NOW() WHERE id=$2",[String(e.message||e).slice(0,4000),runId]).catch(()=>{});
    res.status(500).json({error:String(e.message||"Az AI fejlesztés nem sikerült.")});
  }
});

app.use(express.static(path.join(__dirname,"public")));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

const PORT=process.env.PORT||10000;
init().then(()=>
app.listen(PORT,"0.0.0.0",()=>console.log("OMI Idle Farm Online running on",PORT)))
.catch(e=>{console.error("INIT ERROR",e);process.exit(1)});
