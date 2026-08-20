OMI IDLE FARM ONLINE V3

ÚJ:
- online regisztráció / belépés
- PostgreSQL felhőmentés
- online ranglista
- adminpanel: /admin
- játékoslista és statisztika
- tiltás / feloldás
- teljes játékosmentés reset
- admin jutalom hozzáadás: arany, kristály, érc, lélekkő, dungeon jegy
- admin műveleti napló
- automatikus cloud save kb. 15 másodpercenként
- a V2 teljes idle RPG rendszere megmaradt

RENDER TELEPÍTÉS – BLUEPRINT:
1. Csomagold ki ezt a ZIP-et.
2. Töltsd fel a fájlokat egy új GitHub repositoryba.
3. Render Dashboard → New → Blueprint.
4. Válaszd ki a GitHub repót. A render.yaml automatikusan létrehozza:
   - omi-idle-farm Web Service
   - omi-idle-farm-db PostgreSQL adatbázis
5. A Render bekéri az ADMIN_PASSWORD értékét. Adj meg erős jelszót.
6. Deploy.
7. Weboldal: a Render által adott *.onrender.com cím
8. Admin: https://SAJAT-CIMED.onrender.com/admin
9. Admin felhasználónév alapból: OmiAdmin
   (render.yaml ADMIN_USERNAME mezőben átírható)

MANUÁLIS TELEPÍTÉS ESETÉN szükséges Environment változók:
DATABASE_URL = Render PostgreSQL Internal Database URL
JWT_SECRET = hosszú véletlen titkos kulcs
ADMIN_USERNAME = pl. OmiAdmin
ADMIN_PASSWORD = erős admin jelszó

Build Command: npm install
Start Command: npm start

BIZTONSÁG:
- jelszavak bcrypt hash-sel vannak tárolva
- login httpOnly cookie JWT-t használ
- az admin végpontok szerepkör ellenőrzöttek
- ez már online mentés, de a játéklogika jelentős része kliensoldali, ezért komoly verseny/ranglista esetén további szerveroldali anti-cheat szükséges

V4 MODERN KARAKTER:
- Külön látványos saját karakter panel a Farm oldalon.
- A karakter körül 6 felszerelés slot látszik.
- A felszerelt weapon/armor/helmet vizuálisan megjelenik.
- Rare/Epic/Mythic/Legendary tárgyak színes keretet kapnak.
- Epic/Mythic/Legendary felszerelés automatikus aurát ad.
- Legendary aura arany, Mythic bíbor, Epic lila.
- A pet vizuálisan a karakter mellett lebeg.
- Az aktuális farmterület külön háttérhangulatot ad a karakter panelhez.
- A játék minden V3 online funkciója megmaradt: account, cloud save, ranglista, adminpanel, PostgreSQL.
- A megjelenés modern fantasy idle-RPG ihletésű, saját eredeti UI/ikon megoldással.

V5:
- Külön, alapból megnyíló Karakter fül.
- A felszerelt sisak/fegyver/páncél/kesztyű/csizma/gyűrű látszik a karakter körül.
- A karakter vizuálisan változik felszerelés és aura alapján.
- EQUIP BEST gomb: slotonként automatikusan a legerősebb tárgyat rakja fel.
- Automata wave rendszer.
- Minden wave végén automatikus boss.
- Amíg a bosst nem győzi le, nem lép tovább a következő wave-re.
- 200-as szinten Prestige.
- Prestige +1 Paragon szint, +5 Paragon statpont és +1 Aura token.
- Paragon pontok: sebzés / arany / drop / krit.
- Prestige Aura Shop.
- Prestige alatt inventory, felszerelés, petek, paragon és prestige megmarad.

V6 FIX:
- Javítva a V5 régi cloud save kompatibilitási hibája, ami lefagyás-szerű működést okozhatott.
- Minden régi mentést automatikusan V6 struktúrára egészít ki.
- A karakter teljesen új SVG humanoid fantasy hőst kapott.
- A páncél, sisak, kesztyű, csizma, gyűrű és fegyver ritkasága vizuálisan módosítja a karaktert.
- Equip Best javítva: minden felszerelési slotra ténylegesen a legerősebb, megfelelő típusú inventory tárgy kerül.
- Inventory kézi Felszerel gombjai változatlanul működnek.
- Karakteres látványelemek nem blokkolják többé az egérkattintásokat.
- Wave/Boss/Prestige/Paragon/Aura rendszer megmaradt.

V7 KARAKTER ADOTTSÁGOK:
- A Karakter fülön külön stat panel mutatja:
  Erő, Sebzés, Szerencse, Krit esély, Drop bónusz,
  Szint, Paragon, Prestige, Paragon pont, Aura token, Wave, Összes kill.

V9 ADMIN LINK FIX
- Admin belépés után a játék felső sávjában megjelenik a ⚙️ Adminpanel gomb.
- A gomb közvetlenül a /admin oldalra visz.
- Normál játékosok nem látják az admin gombot.
- Közvetlen admin cím továbbra is: /admin

V10 TELJES HARC / ADMIN FIX:
- Adminpanel HTML betöltési sorrend javítva: az Admin Game Studio most ténylegesen megjelenik és működik.
- Admin gomb mindig látható a felső sávban; a /admin oldal továbbra is jogosultsággal védett.
- Játékos saját HP-val és védelemmel rendelkezik.
- Mobok és bossok automatikusan visszatámadnak.
- Halál után a farm megáll a beállított respawn ideig.
- Játékos HP regeneráció állítható.
- Boss HP regeneráció %-osan adminból állítható.
- Normál mob HP regen külön állítható.
- Játékos/mob támadási idő, boss sebzés, mob sebzés, respawn, boss reward, wave kill és boss HP growth adminból állítható.
- Wave boss továbbra is blokkolja a továbbhaladást, amíg él.

V11 SOCIAL / PVP / SHOP / CONTENT
- Regisztrációnál külön belépési felhasználónév és külön játékosnév.
- Ranglista és PvP a játékosnevet mutatja, nem a felhasználónevet.
- Admin játékost elrejthet/visszatehet a ranglistára.
- Admin játékosnevet módosíthat.
- PvP külön fülön, adminból állítható minimum szint, jutalom, cooldown és rating.
- PvP arénában mindkét karakter vizuálisan megjelenik HP csíkkal és animált harccal.
- Discord / Feltöltés külön fül, nervos11 elérhetőséggel.
- Valódi fizetési adatot a weboldal nem kezel; vásárlási igényt rögzít, az egyeztetés privát Discordon történik.
- Admin vásárlási csomagokat hozhat létre és az igények státuszát kezelheti.
- Boss készítő: név, ikon, HP, sebzés, XP, arany, regen %, drop %, minimum szint/terület.
- Tárgy készítő: név, slot, rarity, ATK, DEF, arany/krit/drop bónusz.
- Pet, aura és terület készítő bővítve.
- Adminból létrehozott egyedi területek/petek/aurák/tárgyak/bossok játék közben betöltődnek.

V11.2: Admin Játékosok listájából normál játékos végleg törölhető kétlépcsős megerősítéssel. Adminfiók nem törölhető innen.

V12: teljes dark-fantasy vizuális frissítés a jóváhagyott mockup irányában; sötét harcos, arany/lila UI, karakter-színpad effektek. V11.3 játékostörlés megmaradt.

V13 MOCKUP CHARACTER
- A Karakter panel most ténylegesen a jóváhagyott sötét fantasy látványból készült raster artworköt használja.
- A korábbi rajzolt/SVG figura el van rejtve.
- A felszerelés slotok, karakter statok, aura/pet/wave/paragon adatok funkcionálisan megmaradtak.
- A teljes V12/V11.3 funkcionalitás megmaradt.

V15 EXACT SCREEN LAYOUT
- A Karakter oldal 3 oszlopos elrendezése az elfogadott mockupot követi.
- Bal oldalon Admin Game Studio előnézet.
- Középen a dark fantasy karakter, körülötte 6 tárgykártya valódi item képpel.
- Jobb oldalon Prestige / Paragon / Aura Shop.
- A tárgyak valós +0 ... +15 szintje automatikusan megjelenik.
- A tárgykártyák ritkaság szerinti keretet/glow-t kapnak.

V15.5 WAVE / BOSS / PARAGON
- Minden 10. wave után automatikusan Boss jön.
- Ha a Boss megöli a játékost, az aktuális wave újraindul.
- Paragon 1 követelmény: Wave 500.
- Paragon 2 követelmény: Wave 510.
- Paragon 3 követelmény: Wave 520.
- Minden további Paragon +10 wave követelményt ad.
- Paragon szintlépés nem nullázza a wave-et.

V15.6: Full HP respawn; fejleszthető HP regen; max 5 item opt; rarity szerinti 1/2/3/4/5 opt; aranyért opt forgatás; opt magyarázat.

V15.8: Javítva a 'Cannot access V10CFG before initialization' belépési hiba. A HP inicializálás csak a combat config betöltése után fut.

V16.1: élő gold/wave/XP kijelzés frissítés nélkül; kezdő mob sebzésvédelem; halálkor azonnali MAX HP + respawn védelem.

V16.2: játékosonként 1x/2x/3x/4x harci és wave sebesség. 4x prémium, 3 EUR, Feltöltés/Discord oldalon megjelenítve; entitlement mentésben speed4Unlocked.

V16.3: Equip Best; tömeges rarity törlés/eladás; speed panel biztosan Farm fülön; 2x/3x/4x ténylegesen gyorsítja a player/enemy combat timereket.

V16.4: karakter gear ikonok újraigazítva; ritkaság szerinti helyes keretek: Normal szürke, Rare kék, Epic magenta, Mythic lila, Legendary arany/sárga.

V16.6: új saját karakter/felszerelés grafika beépítve; régi lila sárkány háttér eltávolítva; Mythic=lila, Legendary=arany rarity keretek; slotok újraigazítva.

V16.7: karakter nézet kitisztítva; a kép mögötti/alatti duplikált felszerelés ikonok eltávolítva. Inventory, Equip Best, rarity és speed rendszer megmaradt.

V16.8: teljesen dinamikus karakter-felszerelés rendszer. A karakteroldali itemek közvetlenül az equipped adatokból renderelődnek; +szint és rarity azonnal követi a valódi tárgyat; üres slot üres; fegyver csak felszerelve jelenik meg a karakter kezében.

V16.9: a Karakter/Farm/Inventory/... navigációs csíksáv már nem sticky/fixed, görgetéskor normálisan eltűnik felfelé.

V17.0: teljes karakteroldal layout újrarendezve normál 100% zoomhoz; max 1320px tartalom, státuszok karakter mellett, alsó statok kompaktak, nincs széthúzott óriási oldal.

V17.1
- HP Regen fejlesztés átkerült Farm > Alap fejlesztések alá.
- Aura Shop külön felső navigációs fület és saját oldalt kapott.
- Aura Shopon külön látszik Prestige, Aura token és Paragon.
- Karakter oldal 80% böngésző zoomra újraméretezve / szélesítve.

V17.2: Aura/Pet/Wave/Paragon alsó csík végleg a karakter panelbe rögzítve; nem követi a görgetést és nem nyúlik teljes képernyő szélességre. A felszerelés-összegző címke is a karakteren belül marad.

V17.3: prémium 4× speed lecserélve 10× speedre. 1×/2×/3× ingyenes, 10× prémium 3 EUR. Régi 4× unlock automatikusan migrál 10× jogosultságra.

V17.4: Prestige Aura Shop saját felső fülön; HP Regen áthelyezve Farm > Alap fejlesztések alá. V17.3 10x speed és minden korábbi funkció megmaradt.

V19.5 STABLE ROLLBACK
- Visszaállítva a V17.4 stabil állapot.
- A karakteroldal régi, működő dinamikus felszerelés-rendszere visszaállt.
- 10x Speed megmarad.
- Prestige Aura Shop külön fül megmarad.
- HP Regen Farm > Alap fejlesztések alatt marad.
- A későbbi V18/V19 oldal-átrendezések és hibás rejtések nincsenek benne.

V19.6: Paragon / Prestige és Paragon statpontok a Farm oldalról külön Paragon / Prestige fülre kerültek. Karakter státuszhoz nem nyúltunk.

V19.7
- Karakter státusz átkerült a külön Paragon / Prestige fülre.
- A Karakter fülön már nem jelenik meg ez a státuszblokk.
- A státuszértékek továbbra is élőben frissülnek.
- A működő karakter/felszerelés rendszerhez nem nyúltunk.

V19.8 LONG TERM PROGRESSION
- Minden képesség végtelenül fejleszthető.
- Diminishing-return balansz: nincs hard cap, de később lassabban erősödik.
- Mob HP minden wave-ben skálázódik.
- Boss továbbra is minden 10. wave-en.
- Wave farmkövetelmény 25 wave-enként fokozatosan nő, maximum 40 mob/wave.
- Aranyjutalom együtt skálázódik a nehézséggel.
- 50/100 wave mérföldköveknél extra farmanyag jár.
- Paragon 500/510/520... rendszer változatlan.
- Meglévő karakter, inventory, item rarity, aura, pet, dungeon, PvP és speed rendszer megmaradt.

V19.9
- A felső „Farmolj automatikusan…” + Arany/Kristály/Érc/Lélekkő/Dungeon jegy/Szint blokk kizárólag a Karakter fülön látható.
- Farm, Inventory, Fejlesztés, Képességek, Petek, Paragon, Aura Shop, Dungeon, Küldetések, PvP, Shop és Statisztika oldalra nem követi a játékost.
- A blokk működéséhez és élő értékeihez nem nyúltunk.

V20.0
- AUTOMATA FARM RPG fejléc csak a Karakter fülön látható.
- A felső Arany/Kristály/Érc/Lélekkő/Dungeon jegy/Szint sor csak a Karakter fülön látható.
- Erő/Sebzés/Életerő/Védelem/Szerencse/Krit/Drop/Szint/Paragon/Prestige/Paragon pont/Aura token/Wave/Összes kill/Halál összegző blokk csak Karakter fülön látható.
- Karakter fül: saját karakter bal oldalon, Inventory jobb oldalon.
- Az Inventory saját fülön továbbra is használható.
- A jelenlegi Equip működés megmarad.
- A Felhőbe mentve/Mentés kijelzés fix szélességet kapott, így nem tolja arrébb a felső menüket.

V20.1
- Karakter + Inventory oldal vizuálisan újrarendezve.
- Karakter bal oldalon, Inventory / Equip kezelés jobb oldalon.
- Felszerelés slotok szimmetrikusabban elhelyezve.
- Inventory jobb oldali része kompaktabb és görgethető.
- Felszerelés opciók kizárólag a Fejlesztés fülön jelenik meg.
- Equip Best és tömeges rarity kezelés megmaradt.

V20.2
- ADMIN GAME STUDIO játékosok számára rejtett.
- Csak admin jogosultságú felhasználónak jelenik meg.
- OmiAdmin továbbra is adminnak számít.
- A többi karakter/inventory funkcióhoz nem nyúltunk.

V20.3
- A Felszerelés kezelés panel jobbra került.
- Nagyobb fix rés van a Saját karakter és a Felszerelés kezelés között.
- A két panel nem fedheti egymást.
- Keskeny kijelzőn a Felszerelés kezelés automatikusan a karakter alá kerül.

V20.4
- Felszerelés kezelés fizikailag kikerült a Saját karakter kártyából.
- Karakter külön bal oldali oszlop.
- Felszerelés kezelés külön jobb oldali oszlop.
- Nincs átfedés vagy belelógás.
- Keskeny kijelzőn a jobb oldali blokk a karakter alá kerül.

V20.6
- Admin Game Studio, Saját karakter és Felszerelés kezelés ablak egérrel szabadon mozgatható.
- Az ablak címsoránál fogva lehet húzni.
- A pozíció böngészőben automatikusan mentődik.
- Dupla kattintás a címsoron visszaállítja az adott ablak alaphelyzetét.
- Gombok továbbra is normálisan kattinthatók.
- Mobil/keskeny kijelzőn a mozgatás automatikusan kikapcsol.

V20.7
- Saját karakter és Felszerelés kezelés teljesen külön, egymástól független mozgatható ablak.
- Mindkettő külön pozíciót ment a böngészőben.
- Egyik húzása nem mozgatja a másikat.
- Dupla kattintás a saját címsorán csak az adott ablakot állítja vissza.
- Régi közös grid elrendezés többé nem befolyásolja a két ablakot.

V20.8
- Javítva a V20.7 karakterablak szétesése.
- A teljes Saját karakter tartalom egyetlen mozgatható ablakba került:
  karakterfigura, felszerelés slotok, felszerelt tárgy összegzés, Aura/Pet/Wave/Paragon.
- Felszerelés kezelés továbbra is külön, függetlenül mozgatható ablak.
- Régi V20.7 wrapper/pozicionálás kikapcsolva, így nem vágja le a karaktert.

V20.9
- A Felszerelés kezelés alaphelyzetben közvetlenül a Saját karakter mellett jelenik meg.
- A két ablak külön DOM-elem és külön mozgatható.
- A karakter mozgatása nem mozgatja a felszerelés ablakot.
- A felszerelés mozgatása nem mozgatja a karaktert.
- Mindkét ablak továbbra is külön menti a pozícióját.

V21.0
- A Felszerelés kezelés alapból zárva van.
- A Saját karakter ablakból külön „Felszerelés kezelés” gombbal nyitható/zárható.
- A Felszerelés kezelés továbbra is külön és függetlenül mozgatható ablak.
- Az EQUIP BEST gomb bekerült a Saját karakter ablakba.
- Az eredeti Equip Best funkció megmarad, mert ugyanaz a valódi gomb került át.
- A Felszerelés kezelés saját X bezáró gombot kapott.

V21.1
- Javítva a Felszerelés kezelés gomb.
- Kattintásra garantáltan megnyílik a külön mozgatható Felszerelés kezelés ablak.
- Az ablak közvetlenül a floating canvasba kerül, így régi wrapper nem tudja elrejteni.
- Régi hidden classok automatikusan törlődnek megnyitáskor.
- Az X bezáró gomb továbbra is működik.

V21.2
- Oldalanként releváns fizetőeszköz/státusz sáv.
- Petek: Gyémánt + Arany + Erő.
- Fejlesztés/Inventory/Farm: Arany + Érc/Lélekkő + Erő.
- Képességek/Paragon: Statpont + Erő.
- Aura Shop: Aura token + Erő.
- Dungeon: Dungeon jegy + Erő + Arany.
- PvP/Statisztika: Erő + Arany.
- Minden érték élőben frissül.
