(function(){
  function mountPct(level){
    const raw=Math.max(0,Number(level)||0)*.02,cap=.25;
    return 100*cap*raw/(raw+cap);
  }
  function refresh(){
    if(typeof save==="undefined"||!save?.mounts)return;
    const ids={"Erdei Agancsos":"stag","Vasagyar":"boar","Sivatagi Vándor":"camel","Hadimén":"horse","Fagyar":"wolf","Jádetigris":"tiger","Viharszarvas":"elk","Árnyékpárduc":"panther","Arany Griff":"griffin","Főnix":"phoenix","Égi Sárkány":"dragon","Örök Kirin":"kirin"};
    document.querySelectorAll('.mount-card-v237').forEach(card=>{
      const name=card.querySelector('h3')?.textContent;
      const owned=save.mounts[ids[name]],label=card.querySelector('b');
      const text=owned?`Erő +${mountPct(owned.level).toFixed(1)}%`:"";if(label&&owned&&label.textContent!==text)label.textContent=text;
    });
  }
  window.mountBonusDisplayV288=mountPct;
  window.addEventListener('load',()=>{refresh();setTimeout(refresh,650)});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-tab="mounts"],[data-mu],[data-me]'))setTimeout(refresh,80)},true);
  new MutationObserver(refresh).observe(document.getElementById('page-mounts')||document.body,{childList:true,subtree:true});
})();
