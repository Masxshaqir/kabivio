'use strict';
// DOM regression tests, not a replacement for real browser/device testing.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const root=process.env.KABIVIO_TEST_ROOT||__dirname;
const source=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=source('index.html');
function setup(lang='en',{motion=false,reducedMotion=false}={}){
 const dom=new JSDOM(html,{url:'https://example.test/kabivio/?lang='+lang,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document,observers=[],tools=[];
 w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.matchMedia=query=>({matches:query.includes('reduced-motion')&&reducedMotion,addEventListener(){}});
 w.IntersectionObserver=class{constructor(callback){this.callback=callback;this.disconnected=false;observers.push(this);}observe(){}unobserve(){}disconnect(){this.disconnected=true;}};
 d.modelContext={registerTool(tool,{signal}){tools.push({tool,signal});}};
 const opened=[];w.open=(...args)=>{opened.push(args);return null;};
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>{w.copiedText=text;}}});
 const run=code=>new vm.Script(code).runInContext(dom.getInternalVMContext());
 run(source('translations.js'));run(source('app.js'));if(motion)run(source('motion.js'));
 const $=id=>d.getElementById(id);
 const input=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 const submit=()=>$('planner').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 const address=()=>{input('city','Frankfurt am Main');input('street','Teststraße');input('postal-code','60311');input('building-number','12a');d.querySelector('[name=electricity][value=available]').click();};
 return {dom,w,d,run,$,input,submit,address,opened,observers,tools,close:()=>w.close()};
}
test('HTML references, assets, labels, translation keys and external links are complete',()=>{
 const a=setup();try{
  const ids=[...a.d.querySelectorAll('[id]')].map(e=>e.id);assert.equal(new Set(ids).size,ids.length);
  for(const el of a.d.querySelectorAll('[aria-controls],[aria-describedby],label[for]')){
   for(const attr of ['aria-controls','aria-describedby','for'])for(const id of (el.getAttribute(attr)||'').split(/\s+/).filter(Boolean))assert.ok(a.$(id),attr+': '+id);
  }
  for(const el of a.d.querySelectorAll('a[href^="#"]'))assert.ok(a.$(el.hash.slice(1)),el.hash);
  for(const el of a.d.querySelectorAll('script[src],link[rel=stylesheet],img[src]')){
   const value=el.getAttribute('src')||el.getAttribute('href');assert.ok(fs.existsSync(path.join(root,value.split('?')[0])),value);
  }
  for(const el of a.d.querySelectorAll('a[target="_blank"]'))assert.match(el.rel,/noopener/);
  for(const el of a.d.querySelectorAll('img'))assert.ok(el.hasAttribute('alt'));
  const languages=a.run('translations');const keys=Object.keys(languages.de).sort();
  for(const [lang,copy] of Object.entries(languages)){
   assert.deepEqual(Object.keys(copy).sort(),keys,lang);
   for(const el of a.d.querySelectorAll('[data-i18n],[data-aria-i18n],[data-list],[data-placeholder]'))for(const attr of ['data-i18n','data-aria-i18n','data-list','data-placeholder'])if(el.hasAttribute(attr))assert.ok(copy[el.getAttribute(attr)],lang+': '+el.getAttribute(attr));
  }
 }finally{a.close();}
});
test('defence in depth: restrictive CSP, no inline execution, no-JS form inert, local assets',()=>{
 const dom=new JSDOM(html);try{
  const d=dom.window.document,csp=d.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content||'';
  for(const directive of ["default-src 'none'","script-src 'self'","form-action 'none'","base-uri 'none'","connect-src 'none'"])assert.ok(csp.includes(directive),directive);
  assert.ok(!csp.includes('unsafe-inline')&&!csp.includes('unsafe-eval'));
  assert.equal(d.querySelector('meta[name=referrer]')?.content,'no-referrer');
  assert.ok(d.querySelector('#planner').hasAttribute('inert'));
  for(const el of d.querySelectorAll('*'))for(const attr of el.attributes)assert.ok(!/^on/i.test(attr.name),'inline handler '+attr.name);
  for(const el of d.querySelectorAll('script'))assert.ok(el.src&&!el.textContent.trim());
  for(const file of ['app.js','motion.js','navigation.js'])assert.doesNotMatch(source(file),/\b(?:eval|fetch)\s*\(|innerHTML\s*=|document\.write\s*\(|localStorage|sessionStorage|sendBeacon/);
 }finally{dom.window.close();}
});
const prices={Basis:99,Intensiv:149,'Textil Plus':229};
for(const lang of ['de','en','tr','ar'])for(const pkg of Object.keys(prices))for(const power of ['available','needed','unsure'])for(const count of [1,2,20]){
 test(`${lang} / ${pkg} / ${power} / ${count}: review, total and safely encoded WhatsApp draft agree`,()=>{
  const a=setup(lang);try{
   a.d.querySelector(`[name=package][value="${pkg}"]`).click();a.input('quantity',String(count));a.submit();a.address();
   a.d.querySelector(`[name=electricity][value=${power}]`).click();a.input('date','2099-10-15');
   a.input('notes','Test only: <img src=x onerror=alert(1)> & ? # العربية Türkçe');a.submit();
   assert.equal(a.$('booking-step-2').hidden,false);assert.equal(a.$('errors').textContent,'');
   const expected=a.run(`money(${prices[pkg]*count})`);assert.equal(a.$('total').textContent,expected);
   const url=new URL(a.$('whatsapp-ready').href);assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/4915153520733');
   assert.equal(url.searchParams.get('text'),a.$('result').textContent);assert.equal([...url.searchParams].length,1);
   assert.ok(a.$('result').textContent.includes(expected));assert.ok(a.$('result').textContent.includes('Teststraße'));assert.ok(a.$('result').textContent.includes('12a'));
   assert.equal(a.$('review-notes').children.length,0);assert.ok(a.$('review-notes').textContent.includes('<img'));
   assert.equal(a.d.documentElement.dir,lang==='ar'?'rtl':'ltr');assert.equal(a.opened.length,0);
  }finally{a.close();}
 });
}
for(const value of ['','0','-1','1.5','21','1e3'])test('reject invalid truck count '+JSON.stringify(value),()=>{
 const a=setup();try{a.input('quantity',value);a.submit();assert.equal(a.$('booking-step-0').hidden,false);assert.equal(a.d.activeElement,a.$('quantity'));assert.equal(a.$('quantity').getAttribute('aria-invalid'),'true');}finally{a.close();}
});
test('missing address/power and malformed postcode prevent review and focus first error',()=>{
 const a=setup();try{
  a.submit();a.submit();assert.equal(a.d.activeElement,a.$('city'));
  for(const id of ['city','street','postal-code','building-number'])assert.equal(a.$(id).getAttribute('aria-invalid'),'true');
  a.address();a.input('postal-code','60A11');a.submit();assert.equal(a.d.activeElement,a.$('postal-code'));assert.equal(a.$('whatsapp-ready').hidden,true);
  a.input('postal-code','60311');a.d.querySelectorAll('[name=electricity]').forEach(e=>e.checked=false);a.submit();assert.ok(a.$('electricity-error').textContent);
 }finally{a.close();}
});
for(const postcode of ['٦٣٤٥٠','۶۳۴۵۰'])test('normalize international postcode digits '+postcode,()=>{
 const a=setup('ar');try{a.submit();a.address();a.input('postal-code',postcode);a.submit();assert.ok(a.$('result').textContent.includes('63450'));assert.equal(a.$('booking-step-2').hidden,false);}finally{a.close();}
});
test('past dates rejected even in collapsed optional section; today and omitted date accepted',()=>{
 const a=setup();try{
  a.submit();a.address();a.input('date','2000-01-01');a.submit();assert.equal(a.$('booking-step-1').hidden,false);assert.equal(a.d.activeElement,a.$('date'));assert.ok(a.d.querySelector('.extras').open);assert.match(a.$('date-error').textContent,/future/);
  a.input('date',a.$('date').min);a.submit();assert.equal(a.$('booking-step-2').hidden,false);
  a.$('booking-back').click();a.input('date','');a.submit();assert.equal(a.$('booking-step-2').hidden,false);
 }finally{a.close();}
});
test('edit/back/language switching preserves entries and refreshes draft; reset clears all data',async()=>{
 const a=setup();try{
  assert.ok(!a.$('planner').hasAttribute('inert'));
  a.submit();a.address();a.submit();a.d.querySelector('[data-edit-step="0"]').click();
  a.d.querySelector('#package-3').click();a.input('quantity','3');assert.ok(!a.$('whatsapp-ready').hasAttribute('href'));
  a.submit();a.submit();assert.equal(a.$('total').textContent,'€687.00');assert.ok(a.$('review-address').textContent.includes('Teststraße'));
  a.$('language').value='tr';a.$('language').dispatchEvent(new a.w.Event('change'));assert.equal(a.$('review-package').textContent,a.run("t('p3')"));assert.equal(new URL(a.$('whatsapp-ready').href).searchParams.get('text'),a.$('result').textContent);
  a.$('planner').reset();await new Promise(resolve=>a.w.setTimeout(resolve,5));
  assert.equal(a.$('booking-step-0').hidden,false);assert.equal(a.$('city').value,'');assert.equal(a.$('quantity').value,'1');assert.equal(a.$('draft-panel').hidden,true);assert.equal(a.$('whatsapp-ready').hidden,true);assert.equal(a.d.querySelector('[data-go-step="2"]').disabled,true);assert.equal(a.$('errors').textContent,'');
 }finally{a.close();}
});
test('copy uses current draft and mobile final submit opens only the fixed recipient',async()=>{
 const a=setup();try{a.submit();a.address();a.submit();a.$('copy').click();await new Promise(resolve=>a.w.setTimeout(resolve,0));assert.equal(a.w.copiedText,a.$('result').textContent);assert.equal(a.opened.length,0);a.submit();assert.equal(a.opened.length,1);assert.equal(new URL(a.opened[0][0]).pathname,'/4915153520733');assert.equal(a.opened[0][2],'noopener,noreferrer');}finally{a.close();}
});
test('clipboard denial gives a readable fallback without losing the enquiry',async()=>{
 const a=setup();try{
  a.submit();a.address();a.submit();a.w.navigator.clipboard.writeText=async()=>{throw new Error('Permission denied');};
  a.$('copy').click();await new Promise(resolve=>a.w.setTimeout(resolve,0));
  assert.equal(a.$('feedback').textContent,a.run("t('copyFail')"));assert.ok(a.$('result').textContent);assert.equal(a.$('draft-panel').hidden,false);
 }finally{a.close();}
});
test('download contains the exact localized enquiry and a safe filename',async()=>{
 const a=setup('ar');try{
  a.submit();a.address();a.input('notes','اختبار فقط');a.submit();let blob,filename;
  a.w.URL.createObjectURL=value=>{blob=value;return 'blob:https://example.test/test';};a.w.URL.revokeObjectURL=()=>{};
  a.w.HTMLAnchorElement.prototype.click=function(){filename=this.download;};a.$('download').click();
  const text=await new Promise((resolve,reject)=>{const reader=new a.w.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsText(blob);});
  assert.equal(text.replace(/^\uFEFF/,''),a.$('result').textContent);assert.equal(filename,'Kabivio-enquiry-ar.txt');assert.equal(a.$('feedback').textContent,a.run("t('downloaded')"));
 }finally{a.close();}
});
test('a stale restored review is revalidated and cannot keep an expired-date send link',()=>{
 const a=setup();try{
  a.submit();a.address();a.input('date','2099-10-15');a.submit();
  // Simulate a date that has become invalid while this page was away.
  a.$('date').value='2000-01-01';a.w.dispatchEvent(new a.w.PageTransitionEvent('pageshow',{persisted:true}));
  assert.ok(!a.$('whatsapp-ready').hasAttribute('href'));assert.equal(a.$('booking-step-1').hidden,false);assert.ok(a.$('date-error').textContent);
 }finally{a.close();}
});
test('reduced motion is respected while the interactive cabin remains usable',()=>{
 const a=setup('en',{motion:true,reducedMotion:true});try{
  assert.ok(a.d.documentElement.classList.contains('motion-paused'));a.d.querySelector('[data-zone=floor]').click();assert.equal(a.$('zone-title').textContent,a.run("t('floorTitle')"));
  assert.match(source('motion.css'),/@media\s*\(prefers-reduced-motion:reduce\)/);
 }finally{a.close();}
});
test('unsupported language falls back to German',()=>{const a=setup('__proto__');try{assert.equal(a.d.documentElement.lang,'de');}finally{a.close();}});
test('cached page retains observers and tools, final page disposal releases them',()=>{
 const a=setup('en',{motion:true});try{
  a.w.dispatchEvent(new a.w.PageTransitionEvent('pagehide',{persisted:true}));assert.ok(a.observers.every(o=>!o.disconnected));assert.ok(a.tools.every(t=>!t.signal.aborted));
  a.w.dispatchEvent(new a.w.PageTransitionEvent('pageshow',{persisted:true}));a.d.querySelector('[data-zone=dash]').click();assert.equal(a.$('zone-title').textContent,a.run("t('dashTitle')"));
  a.w.dispatchEvent(new a.w.PageTransitionEvent('pagehide',{persisted:false}));assert.ok(a.observers.every(o=>o.disconnected));assert.ok(a.tools.every(t=>t.signal.aborted));
 }finally{a.close();}
});
for(const type of ['navigate','reload','back_forward'])test('navigation policy: '+type,()=>{
 const dom=new JSDOM('<!doctype html>',{url:'https://example.test/?lang=ar#planner',runScripts:'outside-only'}),w=dom.window,calls=[];
 try{
  w.performance.getEntriesByType=()=>[{type}];w.scrollTo=options=>calls.push(options);
  new vm.Script(source('navigation.js')).runInContext(dom.getInternalVMContext());
  if(type==='back_forward'){assert.equal(w.location.hash,'#planner');assert.equal(calls.length,0);return;}
  assert.equal(w.location.hash,'');assert.equal(w.location.search,'?lang=ar');assert.equal(w.history.scrollRestoration,'manual');
  const before=calls.length;w.dispatchEvent(new w.Event('pointerdown'));w.dispatchEvent(new w.PageTransitionEvent('pageshow',{persisted:false}));assert.equal(calls.length,before,'late load must not yank a visitor who interacted');assert.equal(w.history.scrollRestoration,'auto');
 }finally{w.close();}
});
