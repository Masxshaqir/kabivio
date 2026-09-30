'use strict';
(() => {
 const root=document.documentElement;
 const media=window.matchMedia('(prefers-reduced-motion: reduce)');
 let paused=media.matches,zone='seat';
 const localText=key=>translations[root.lang]?.[key]||translations.de[key];
 const refreshMotion=()=>{
  paused=media.matches;
  root.classList.toggle('motion-paused',paused);
 };
 media.addEventListener('change',refreshMotion);
 refreshMotion();
 const zoneInfo=document.querySelector('.zone-info');
 const refreshZone=()=>{
  document.querySelectorAll('[data-zone]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.zone===zone)));
  const title=document.getElementById('zone-title'),description=document.getElementById('zone-text');
  title.dataset.i18n=zone+'Title';description.dataset.i18n=zone+'Text';
  title.textContent=localText(zone+'Title');description.textContent=localText(zone+'Text');
  zoneInfo.querySelector('.zone-number').textContent={seat:'01',dash:'02',floor:'03'}[zone];
 };
 document.querySelectorAll('[data-zone]').forEach(button=>button.addEventListener('click',()=>{
  if(zone===button.dataset.zone)return;
  zone=button.dataset.zone;refreshZone();
  zoneInfo.classList.remove('changing');
  requestAnimationFrame(()=>{zoneInfo.classList.add('changing');});
 }));
 zoneInfo.addEventListener('animationend',()=>zoneInfo.classList.remove('changing'));
 document.getElementById('language').addEventListener('change',refreshZone);
 // Keep the selected cabin area in the current page language.
 const languageObserver=new MutationObserver(refreshZone);
 languageObserver.observe(root,{attributes:true,attributeFilter:['lang']});
 let frame=0;
 const progress=document.querySelector('.reading-progress');
 const updateProgress=()=>{
  const distance=root.scrollHeight-window.innerHeight;
  progress.style.transform='scaleX('+(distance>0?Math.min(1,Math.max(0,window.scrollY/distance)):0)+')';frame=0;
 };
 window.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(updateProgress);},{passive:true});
 window.addEventListener('resize',updateProgress,{passive:true});updateProgress();
 let revealObserver;
 if('IntersectionObserver' in window){
  revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add('in-view');revealObserver.unobserve(entry.target);}
  }),{threshold:.07,rootMargin:'0px 0px -25px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>{
   if(el.getBoundingClientRect().top>=window.innerHeight){el.classList.add('motion-ready');revealObserver.observe(el);}
  });
 }
 if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  document.querySelectorAll('.package').forEach(card=>{
   card.addEventListener('pointermove',e=>{
    if(paused)return;
    const rect=card.getBoundingClientRect();
    card.style.setProperty('--pointer-x',(e.clientX-rect.left)+'px');
    card.style.setProperty('--pointer-y',(e.clientY-rect.top)+'px');
   },{passive:true});
  });
 }
 window.addEventListener('pageshow',()=>{refreshMotion();updateProgress();});
 window.addEventListener('pagehide',event=>{
  if(frame){cancelAnimationFrame(frame);frame=0;}
  // A cached page resumes with these observers intact when the visitor returns.
  if(!event.persisted){languageObserver.disconnect();revealObserver?.disconnect();}
 });
})();
