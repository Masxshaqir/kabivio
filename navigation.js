'use strict';
// Fresh visits and reloads start at the hero, including old shared section links.
// In-page links and browser Back/Forward retain their normal navigation behavior.
(() => {
 const navigation=performance.getEntriesByType('navigation')[0];
 if(navigation?.type==='back_forward')return;
 try{
  history.scrollRestoration='manual';
  if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
 }catch{}
 let interacted=false;
 const events=['pointerdown','touchstart','wheel','keydown'];
 const markInteraction=()=>{
  interacted=true;
  try{history.scrollRestoration='auto';}catch{}
  events.forEach(type=>window.removeEventListener(type,markInteraction));
 };
 events.forEach(type=>window.addEventListener(type,markInteraction,{passive:true,once:true}));
 const startAtTop=()=>{if(!interacted)window.scrollTo({top:0,left:0,behavior:'instant'});};
 startAtTop();
 document.addEventListener('DOMContentLoaded',startAtTop,{once:true});
 window.addEventListener('pageshow',event=>{
  if(!event.persisted)startAtTop();
 },{once:true});
})();
