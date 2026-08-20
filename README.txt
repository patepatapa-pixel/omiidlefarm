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
