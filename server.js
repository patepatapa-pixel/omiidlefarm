
const express=require("express");
const path=require("path");
const pg=require("pg");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const cookieParser=require("cookie-parser");

const app=express();
app.set("trust proxy",1);
app.use(express.json({limit:"2mb"}));
app.use(cookieParser());

const DATABASE_URL=process.env.DATABASE_URL;
const JWT_SECRET=process.env.JWT_SECRET || "CHANGE_ME_IN_RENDER";
if(!DATABASE_URL) console.warn("DATABASE_URL is not set.");

const pool=new pg.Pool({
  connectionString:DATABASE_URL,
  ssl:DATABASE_URL && !/localhost|127\.0\.0\.1/.test(DATABASE_URL) ? {rejectUnauthorized:false} : false
});
const q=(text,params=[])=>pool.query(text,params);

const DEFAULT_SAVE={
 gold:0,gems:10,ore:0,soul:0,tickets:3,level:1,xp:0,skillPoints:0,kills:0,zone:0,
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
  `);

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

app.get("/api/health",(req,res)=>res.json({ok:true,name:"OMI Idle Farm Online",version:"22.30.0"}));

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
    const power=Math.max(0,Math.floor(Number(req.body.power||0)));
    if(!data || typeof data!=="object")return res.status(400).json({error:"Hibás mentés."});
    const pending=(await q("SELECT patch FROM admin_pending_overrides WHERE user_id=$1",[req.user.id])).rows[0];
    const overrideApplied=Boolean(pending?.patch && Object.keys(pending.patch).length);
    if(overrideApplied)data=deepMergeSave(data,pending.patch);
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
    res.json({ok:true,save:data,overrideApplied});
  }catch(e){console.error(e);res.status(500).json({error:"A mentés nem sikerült."})}
});

app.get("/api/leaderboard",async(req,res)=>{
  try{
    const rows=(await q(`
      SELECT u.id,COALESCE(u.player_name,u.username) player_name,u.pvp_rating,
             g.power,g.level,g.kills,g.gold,g.updated_at,
             COALESCE(NULLIF(g.save_data->>'paragonLevel','')::INTEGER,0) paragon_level
      FROM game_saves g JOIN users u ON u.id=g.user_id
      WHERE u.role='player' AND u.banned=FALSE AND u.leaderboard_hidden=FALSE
      ORDER BY g.power DESC,g.level DESC,g.kills DESC
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
function pvpStats(save){
  const petArr=Array.isArray(save.pets)?save.pets:[];
  const activePet=petArr.find(p=>String(p.id??p.uid??p.name)===String(save.activePet)) || petArr.find(p=>p.active===true);
  const fusionMult=Math.max(1,Number(activePet?.fusionMultiplier||1));
  const fusionTier=Math.max(0,Number(activePet?.fusionLevel||0));

  save=save||{};
  const level=Math.max(1,Number(save.level||1));
  const base=save.base||{},ps=save.paragonStats||{};
  let atk=8+level*1.7+Number(base.weaponTraining||1)*5+Number(ps.damage||0)*3;
  let def=5+level*1.05+Number(base.armorTraining||1)*4+Number(save.prestigeLevel||0)*4;
  for(const id of Object.values(save.equipped||{})){
    const it=(save.inventory||[]).find(x=>x.id===id); if(!it)continue;
    const up=1+Number(it.plus||0)*.10;
    atk+=Number(it.atk||0)*up;def+=Number(it.def||0)*up;
  }
  let hp=Math.floor(220+level*18+def*3+Number(save.paragonLevel||0)*30);
  const skillLv=k=>Math.max(0,Math.min(5,Math.floor(Number(save.skills?.[k]||0))));
  atk*=1+Math.min(1,Number(save.skills?.root||0))*.05+skillLv("power")*.06;
  const crit=Math.min(.70,.05+skillLv("crit")*.015+Number(ps.crit||0)*.005);
  const petPvP=1+Math.min(.60,(fusionMult-1)*.55);
  atk*=petPvP;
  hp=Math.floor(hp*(1+Math.min(.35,(fusionMult-1)*.30)));
  return {level,atk:Math.max(1,Math.floor(atk)),def:Math.max(0,Math.floor(def)),hp:Math.max(1,hp),crit,fusionTier,petPvP};
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
  res.json({locked:false,minLevel:pc.minLevel,rows:rows.map(r=>({id:r.id,player_name:r.player_name,pvp_rating:r.pvp_rating,power:r.power,level:r.level,avatar:{equipped:r.save_data?.equipped||{},inventory:r.save_data?.inventory||[],activeAura:r.save_data?.activeAura||"none",activePet:r.save_data?.activePet}}))});
});
app.post("/api/pvp/fight",auth,async(req,res)=>{
  try{
    const defenderId=Number(req.body.defender_id);
    if(!Number.isInteger(defenderId)||defenderId<=0||defenderId===Number(req.user.id))
      return res.status(400).json({error:"Hibás ellenfél."});
    const cfg=await mainConfig(),pc={minLevel:20,rewardGold:500,cooldownSec:10,ratingChange:18,...(cfg.pvp||{})};
    const last=(await q("SELECT created_at FROM pvp_fights WHERE challenger_id=$1 ORDER BY id DESC LIMIT 1",[req.user.id])).rows[0];
    if(last && (Date.now()-new Date(last.created_at).getTime())<pc.cooldownSec*1000)return res.status(429).json({error:`Várj ${pc.cooldownSec} másodpercet két párbaj között.`});
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
      const ad=Math.max(1,Math.floor((A.atk*(aCrit?1.75:1)-B.def*.50)/(1+Math.max(0,B.fusionTier||0)*.025)));
      bh=Math.max(0,bh-ad);
      log.push({turn,from:"a",damage:ad,crit:aCrit,aHp:ah,bHp:bh});
      if(bh<=0)break;
      const bd=Math.max(1,Math.floor((B.atk*(bCrit?1.75:1)-A.def*.50)/(1+Math.max(0,A.fusionTier||0)*.025)));
      ah=Math.max(0,ah-bd);
      log.push({turn,from:"b",damage:bd,crit:bCrit,aHp:ah,bHp:bh});
    }
    const winnerId=ah===bh?(Math.random()<.5?a.id:b.id):(ah>bh?a.id:b.id);
    const loserId=winnerId===a.id?b.id:a.id;
    const change=Math.max(1,Number(pc.ratingChange||18));
    await q("UPDATE users SET pvp_rating=pvp_rating+$1 WHERE id=$2",[change,winnerId]);
    await q("UPDATE users SET pvp_rating=GREATEST(0,pvp_rating-$1) WHERE id=$2",[change,loserId]);
    const wg=(await q("SELECT save_data FROM game_saves WHERE user_id=$1",[winnerId])).rows[0]?.save_data||{};
    wg.gold=Number(wg.gold||0)+Number(pc.rewardGold||0);
    await q("UPDATE game_saves SET save_data=$1,gold=$2,updated_at=NOW() WHERE user_id=$3",[wg,Math.floor(wg.gold),winnerId]);
    const battle={
      a:{id:a.id,name:a.player_name||a.username,...A},
      b:{id:b.id,name:b.player_name||b.username,...B},
      winnerId,
      rewardGold:Number(pc.rewardGold||0),
      log:log.slice(0,80)
    };
    await q("INSERT INTO pvp_fights(challenger_id,defender_id,winner_id,battle_data) VALUES($1,$2,$3,$4)",[a.id,b.id,winnerId,battle]);
    res.json({ok:true,battle});
  }catch(e){
    console.error("PVP FIGHT ERROR:",e);
    res.status(500).json({error:"A párbaj nem sikerült."});
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
  const product=products.find(x=>String(x.id)===id);
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

    s.speed10Unlocked=Boolean(b.speed10Unlocked);
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
      speed10Unlocked:s.speed10Unlocked,combatSpeed:s.combatSpeed
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

app.use(express.static(path.join(__dirname,"public")));
app.get("/admin",(req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

const PORT=process.env.PORT||10000;
init().then(()=>
app.listen(PORT,"0.0.0.0",()=>console.log("OMI Idle Farm Online running on",PORT)))
.catch(e=>{console.error("INIT ERROR",e);process.exit(1)});
