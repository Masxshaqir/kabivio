'use strict';
const brand='Kabivio';
const phone='4915153520733';
const prices={'Basis':99,'Intensiv':149,'Textil Plus':229};
const packageKeys={'Basis':'p1','Intensiv':'p2','Textil Plus':'p3'};
const locales={de:'de-DE',en:'en-IE',tr:'tr-TR',ar:'ar-EG'};
const $=id=>document.getElementById(id);
const form=$('planner'),pkg=$('package'),quantity=$('quantity'),locationField=$('location'),date=$('date'),notes=$('notes');
const electricityInputs=[...form.querySelectorAll('input[name=electricity]')];
const electricityKeys={available:'electricityAvailable',needed:'electricityNeeded',unsure:'electricityUnsure'};
const electricityChoice=()=>electricityInputs.find(el=>el.checked)?.value;
const requestedLanguage=new URL(location.href).searchParams.get('lang');
let lang=Object.hasOwn(translations,requestedLanguage)?requestedLanguage:'de';
let draft='',hasDraft=false;
const t=key=>translations[lang][key];
const money=n=>new Intl.NumberFormat(locales[lang],{style:'currency',currency:'EUR'}).format(n);
const countValid=()=>Number.isInteger(Number(quantity.value))&&Number(quantity.value)>=1&&Number(quantity.value)<=20;
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function setLanguage(next){
 if(!Object.hasOwn(translations,next))return;
 const faqOpen=[...document.querySelectorAll('#faq-items details')].map(e=>e.open);
 lang=next;document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';$('language').value=lang;
 document.title=t('title');document.querySelector('meta[name=description]').content=t('description');
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 document.querySelectorAll('[data-placeholder]').forEach(el=>el.placeholder=t(el.dataset.placeholder));
 document.querySelector('.hero-image img').alt=t('imageAlt');
 $('navigation').setAttribute('aria-label',lang==='ar'?'التنقل':lang==='tr'?'Gezinme':'Navigation');
 $('minus').setAttribute('aria-label',t('minus'));$('plus').setAttribute('aria-label',t('plus'));
 document.querySelectorAll('[data-list]').forEach(el=>el.replaceChildren(...t(el.dataset.list).map(x=>node('li',x))));
 $('steps').replaceChildren(...t('steps').map((item,i)=>{const el=node('div');el.append(node('span',new Intl.NumberFormat(locales[lang],{minimumIntegerDigits:2}).format(i+1),'step-number'),node('h3',item[0]),node('p',item[1]));return el;}));
 $('faq-items').replaceChildren(...t('faqs').map((item,i)=>{const el=node('details');el.open=faqOpen[i]||false;el.append(node('summary',item[0]),node('p',item[1]));return el;}));
 const url=new URL(location.href);url.searchParams.set('lang',lang);try{history.replaceState(null,'',url);}catch{}
 updateTotal();$('feedback').textContent='';$('errors').textContent='';
 if(hasDraft)renderDraft();
}
function updateTotal(){
 const valid=countValid();$('total').textContent=valid?money(prices[pkg.value]*Number(quantity.value)):t('invalidQty');
 $('minus').disabled=valid&&Number(quantity.value)<=1;$('plus').disabled=valid&&Number(quantity.value)>=20;
 document.querySelectorAll('[data-card]').forEach(el=>el.classList.toggle('is-selected',el.dataset.card===pkg.value));
 document.querySelectorAll('[data-package]').forEach(el=>{const selected=el.dataset.package===pkg.value;el.querySelector('[data-i18n]').textContent=t(selected?'selected':'choose');el.querySelector('.selection-symbol').textContent=selected?'✓':'+';if(selected)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');});
}
function clearDraft(){hasDraft=false;draft='';$('draft-panel').hidden=true;$('feedback').textContent='';$('errors').textContent='';[quantity,locationField,date,...electricityInputs].forEach(el=>el.removeAttribute('aria-invalid'));}
function update(){updateTotal();clearDraft();}
function configure(packageName,count){
 if(!Object.hasOwn(prices,packageName)||!Number.isInteger(count)||count<1||count>20)throw new Error(t('invalidQty'));
 pkg.value=packageName;quantity.value=String(count);update();
 return {brand,package:packageName,quantity:count,provisionalPackageTotal:prices[packageName]*count,currency:'EUR',language:lang,bookingCreated:false};
}
function renderDraft(){
 const selectedDate=date.value?new Intl.DateTimeFormat(locales[lang],{year:'numeric',month:'long',day:'numeric'}).format(new Date(date.value+'T12:00:00')):t('open');
 draft=[t('draftHeading'),brand+' · Marcus Shaqir','',t('packageLabel')+': '+t(packageKeys[pkg.value]),t('quantityLabel')+': '+new Intl.NumberFormat(locales[lang]).format(Number(quantity.value)),t('locationLabel')+': '+locationField.value.trim(),t('electricityLabel')+': '+t(electricityKeys[electricityChoice()]),t('dateLabel')+': '+selectedDate,t('notesLabel')+': '+(notes.value.trim()||t('none')),'',t('estimateLabel')+': '+money(prices[pkg.value]*Number(quantity.value)),t('draftDisclaimer')].join('\n');
 $('result').textContent=draft;$('whatsapp-ready').href='https://wa.me/'+phone+'?text='+encodeURIComponent(draft);$('draft-panel').hidden=false;hasDraft=true;
 return $('whatsapp-ready').href;
}
function prepareEnquiry(){
 clearDraft();let invalid=null,error='';
 if(!countValid()){invalid=quantity;error=t('invalidQty');}
 else if(!locationField.value.trim()){invalid=locationField;error=t('locationRequired');}
 else if(!Object.hasOwn(electricityKeys,electricityChoice())){invalid=electricityInputs[0];error=t('electricityRequired');}
 else if(date.validity.badInput||(date.value&&(!/^\d{4}-\d{2}-\d{2}$/.test(date.value)||isNaN(new Date(date.value+'T12:00:00').getTime())))){invalid=date;error=t('dateInvalid');}
 if(invalid){invalid.setAttribute('aria-invalid','true');$('errors').textContent=error;invalid.focus();return null;}
 const link=renderDraft();$('feedback').textContent=t('ready');return link;
}
$('language').addEventListener('change',e=>setLanguage(e.target.value));
form.addEventListener('input',update);form.addEventListener('change',update);
form.addEventListener('reset',()=>{setTimeout(update,0);});
$('minus').addEventListener('click',()=>{quantity.value=String(Math.max(1,(countValid()?Number(quantity.value):2)-1));update();});
$('plus').addEventListener('click',()=>{quantity.value=String(Math.min(20,(countValid()?Number(quantity.value):0)+1));update();});
document.querySelectorAll('[data-package]').forEach(el=>el.addEventListener('click',()=>configure(el.dataset.package,countValid()?Number(quantity.value):1)));
form.addEventListener('submit',e=>{e.preventDefault();const link=prepareEnquiry();if(link)window.open(link,'_blank','noopener,noreferrer');});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(draft);$('feedback').textContent=t('copied');}catch{$('feedback').textContent=t('copyFail');}});
$('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob(['\uFEFF'+draft],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Kabivio-enquiry-'+lang+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('feedback').textContent=t('downloaded');});
setLanguage(lang);
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{const visible=entries[0].isIntersecting;$('mobile-submit').hidden=!visible;$('mobile-choose').hidden=visible;},{rootMargin:'-80px 0px -90px 0px',threshold:0});observer.observe(form);window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});}
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'configure_cleaning_draft',description:'Select a Kabivio cleaning package, truck count and optional page language. Updates visible state without contacting anyone or booking.',inputSchema:{type:'object',properties:{package:{type:'string',enum:Object.keys(prices)},quantity:{type:'integer',minimum:1,maximum:20},language:{type:'string',enum:['de','en','tr','ar']}},required:['package','quantity'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object')throw new Error('Invalid input');if(input.language!==undefined&&!Object.hasOwn(translations,input.language))throw new Error('Invalid language');const result=configure(input.package,input.quantity);if(input.language)setLanguage(input.language);return {...result,language:lang};}});
 register({name:'prepare_cleaning_enquiry',description:'Validate the visible form and prepare the visible Kabivio WhatsApp enquiry draft. Does not open WhatsApp, send any message, or book an appointment.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(){const url=prepareEnquiry();return url?{prepared:true,recipient:phone,url,messageSent:false,bookingCreated:false}:{prepared:false,error:$('errors').textContent,messageSent:false};}});
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
