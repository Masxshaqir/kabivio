'use strict';
const brand='Kabivio';
const phone='4915153520733';
const prices={'Basis':99,'Intensiv':149,'Textil Plus':229};
const packageKeys={'Basis':'p1','Intensiv':'p2','Textil Plus':'p3'};
const locales={de:'de-DE',en:'en-IE',tr:'tr-TR',ar:'ar-EG'};
const $=id=>document.getElementById(id);
const form=$('planner'),quantity=$('quantity'),city=$('city'),street=$('street'),postalCode=$('postal-code'),buildingNumber=$('building-number'),date=$('date'),notes=$('notes');
const packageInputs=[...form.querySelectorAll('input[name=package]')];
const selectedPackage=()=>packageInputs.find(el=>el.checked)?.value;
const normalizePostalCode=value=>value.trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0));
const electricityInputs=[...form.querySelectorAll('input[name=electricity]')];
const electricityKeys={available:'electricityAvailable',needed:'electricityNeeded',unsure:'electricityUnsure'};
const electricityChoice=()=>electricityInputs.find(el=>el.checked)?.value;
const requestedLanguage=new URL(location.href).searchParams.get('lang');
let lang=Object.hasOwn(translations,requestedLanguage)?requestedLanguage:'de';
let draft='',hasDraft=false,currentStep=0,furthestStep=0,errorKeys={};
const t=key=>translations[lang][key];
const money=n=>new Intl.NumberFormat(locales[lang],{style:'currency',currency:'EUR'}).format(n);
const number=n=>new Intl.NumberFormat(locales[lang]).format(n);
const countValid=()=>Number.isInteger(Number(quantity.value))&&Number(quantity.value)>=1&&Number(quantity.value)<=20;
const fieldNodes={package:packageInputs,quantity:[quantity],city:[city],street:[street],'postal-code':[postalCode],'building-number':[buildingNumber],electricity:electricityInputs,date:[date]};
const fieldStep=id=>['package','quantity'].includes(id)?0:1;
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function setLanguage(next){
 if(!Object.hasOwn(translations,next))return;
 const faqOpen=[...document.querySelectorAll('#faq-items details')].map(e=>e.open);
 lang=next;document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';$('language').value=lang;
 document.title=t('title');document.querySelector('meta[name=description]').content=t('description');
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 document.querySelectorAll('[data-aria-i18n]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.ariaI18n)));
 document.querySelectorAll('[data-placeholder]').forEach(el=>el.placeholder=t(el.dataset.placeholder));
 document.querySelectorAll('[data-price]').forEach(el=>el.textContent=money(Number(el.dataset.price)));
 document.querySelector('.hero-image img').alt=t('imageAlt');
 $('navigation').setAttribute('aria-label',lang==='ar'?'التنقل':lang==='tr'?'Gezinme':'Navigation');
 $('minus').setAttribute('aria-label',t('minus'));$('plus').setAttribute('aria-label',t('plus'));
 document.querySelectorAll('[data-list]').forEach(el=>el.replaceChildren(...t(el.dataset.list).map(x=>node('li',x))));
 $('steps').replaceChildren(...t('steps').map((item,i)=>{const el=node('div');el.append(node('span',new Intl.NumberFormat(locales[lang],{minimumIntegerDigits:2}).format(i+1),'step-number'),node('h3',item[0]),node('p',item[1]));return el;}));
 $('faq-items').replaceChildren(...t('faqs').map((item,i)=>{const el=node('details');el.open=faqOpen[i]||false;el.append(node('summary',item[0]),node('p',item[1]));return el;}));
 const url=new URL(location.href);url.searchParams.set('lang',lang);try{history.replaceState(null,'',url);}catch{}
 updateTotal();renderErrors();updateStepUI();$('feedback').textContent='';
 if(hasDraft)renderDraft();
}
function selectionIcon(selected){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','22');svg.setAttribute('height','22');svg.setAttribute('fill','none');svg.setAttribute('focusable','false');
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',selected?'m5 12 4 4L19 6':'M12 5v14M5 12h14');svg.append(path);return svg;
}
function updateTotal(){
 const pkg=selectedPackage(),valid=countValid()&&Object.hasOwn(prices,pkg);
 $('total').textContent=valid?money(prices[pkg]*Number(quantity.value)):t('invalidQty');
 $('cost-equation').textContent=valid?t('costEquation').replace('{count}',number(Number(quantity.value))).replace('{unit}',money(prices[pkg])):'';
 $('minus').disabled=countValid()&&Number(quantity.value)<=1;$('plus').disabled=countValid()&&Number(quantity.value)>=20;
 document.querySelectorAll('[data-card]').forEach(el=>el.classList.toggle('is-selected',el.dataset.card===pkg));
 document.querySelectorAll('[data-package]').forEach(el=>{const selected=el.dataset.package===pkg;el.querySelector('[data-i18n]').textContent=t(selected?'selected':'choose');el.querySelector('.selection-symbol').replaceChildren(selectionIcon(selected));if(selected)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');});
}
function updateStepUI(){
 for(let i=0;i<3;i++)$('booking-step-'+i).hidden=i!==currentStep;
 form.querySelectorAll('[data-go-step]').forEach(button=>{
  const i=Number(button.dataset.goStep);button.disabled=i>furthestStep;button.classList.toggle('step-done',i<currentStep);
  if(i===currentStep)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
  button.querySelector('.progress-number').textContent=number(i+1);
 });
 $('step-counter').textContent=t('stepCounter').replace('{step}',number(currentStep+1));
 $('booking-back').hidden=currentStep===0;
 $('booking-next').hidden=currentStep===2;
 $('whatsapp-ready').hidden=currentStep!==2;
 $('draft-panel').hidden=currentStep!==2||!hasDraft;
 const key=['nextLocation','nextReview','openWhatsApp'][currentStep];
 $('next-label').textContent=t(key);$('mobile-next-label').textContent=t(key);
 $('booking-local-note').textContent=t(currentStep===2?'localNote':'stepLocalNote');
}
function showStep(step,{focus=true}={}){
 currentStep=step;furthestStep=Math.max(furthestStep,step);updateStepUI();renderErrors();
 if(focus){$('booking-title-'+step).focus({preventScroll:true});form.scrollIntoView({block:'start',behavior:'auto'});}
}
function renderErrors(){
 for(const [id,inputs] of Object.entries(fieldNodes)){
  const key=errorKeys[id],message=$(id+'-error');message.textContent=key?t(key):'';message.hidden=!key;
  inputs.forEach(el=>{if(key)el.setAttribute('aria-invalid','true');else el.removeAttribute('aria-invalid');});
 }
 const first=Object.keys(errorKeys).find(id=>fieldStep(id)===currentStep);
 $('errors').textContent=first?t(errorKeys[first]):'';
}
function refreshDateMinimum(){
 // The service operates in Germany, independent of the visitor's time zone.
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const part=type=>parts.find(item=>item.type===type).value;
 date.min=part('year')+'-'+part('month')+'-'+part('day');
 return date.min;
}
function getErrors(step){
 const errors={};
 if(step===undefined||step===0){
  if(!Object.hasOwn(prices,selectedPackage()))errors.package='packageRequired';
  if(!countValid())errors.quantity='invalidQty';
 }
 if(step===undefined||step===1){
  if(!city.value.trim())errors.city='cityRequired';
  if(!street.value.trim())errors.street='streetRequired';
  if(!/^[0-9]{5}$/.test(normalizePostalCode(postalCode.value)))errors['postal-code']='postalCodeRequired';
  if(!buildingNumber.value.trim())errors['building-number']='buildingNumberRequired';
  if(!Object.hasOwn(electricityKeys,electricityChoice()))errors.electricity='electricityRequired';
  const today=refreshDateMinimum();
  if(date.validity.badInput||(date.value&&(!/^\d{4}-\d{2}-\d{2}$/.test(date.value)||isNaN(new Date(date.value+'T12:00:00').getTime()))))errors.date='dateInvalid';
  else if(date.value&&date.value<today)errors.date='datePast';
 }
 return errors;
}
function validate(step){
 const errors=getErrors(step);
 for(const id of Object.keys(fieldNodes))if(step===undefined||fieldStep(id)===step)delete errorKeys[id];
 Object.assign(errorKeys,errors);renderErrors();
 const first=Object.keys(errors)[0];
 if(!first)return true;
 if(currentStep!==fieldStep(first))showStep(fieldStep(first),{focus:false});
 if(first==='date')form.querySelector('.extras').open=true;
 const input=fieldNodes[first][0];input.focus({preventScroll:true});input.scrollIntoView({block:'center',behavior:'auto'});return false;
}
function invalidateDraft(){hasDraft=false;draft='';$('draft-panel').hidden=true;$('whatsapp-ready').removeAttribute('href');$('feedback').textContent='';}
function update(){
 updateTotal();invalidateDraft();
 const now=getErrors();for(const id of Object.keys(errorKeys))if(!now[id])delete errorKeys[id];renderErrors();
}
function configure(packageName,count){
 if(!Object.hasOwn(prices,packageName)||!Number.isInteger(count)||count<1||count>20)throw new Error(t('invalidQty'));
 packageInputs.forEach(input=>input.checked=input.value===packageName);quantity.value=String(count);update();showStep(0,{focus:false});
 return {brand,package:packageName,quantity:count,provisionalPackageTotal:prices[packageName]*count,currency:'EUR',language:lang,bookingCreated:false};
}
function renderDraft(){
 const pkg=selectedPackage(),selectedDate=date.value?new Intl.DateTimeFormat(locales[lang],{year:'numeric',month:'long',day:'numeric'}).format(new Date(date.value+'T12:00:00')):t('open');
 const power=t(electricityKeys[electricityChoice()]);
 draft=[t('draftHeading'),brand+' · Marcus Shaqir','',t('packageLabel')+': '+t(packageKeys[pkg]),t('quantityLabel')+': '+number(Number(quantity.value)),t('locationLabel')+':',t('cityLabel')+': '+city.value.trim(),t('streetLabel')+': '+street.value.trim(),t('postalCodeLabel')+': '+normalizePostalCode(postalCode.value),t('buildingNumberLabel')+': '+buildingNumber.value.trim(),t('electricityLabel')+': '+power,t('dateLabel')+': '+selectedDate,t('notesLabel')+': '+(notes.value.trim()||t('none')),'',t('estimateLabel')+': '+money(prices[pkg]*Number(quantity.value)),t('draftDisclaimer')].join('\n');
 $('review-package').textContent=t(packageKeys[pkg]);$('review-package-description').textContent=t(packageKeys[pkg]+'difference');
 $('review-quantity').textContent=number(Number(quantity.value));
 // User-entered address and notes are rendered as text, never HTML.
 const line1=node('bdi',street.value.trim()+' '+buildingNumber.value.trim());line1.dir='auto';
 const line2=node('bdi',normalizePostalCode(postalCode.value)+' '+city.value.trim());line2.dir='auto';
 $('review-address').replaceChildren(line1,line2);$('review-electricity').textContent=power;
 $('review-date').textContent=selectedDate;$('review-notes').textContent=notes.value.trim()||t('none');$('review-notes').dir='auto';
 $('result').textContent=draft;$('whatsapp-ready').href='https://wa.me/'+phone+'?text='+encodeURIComponent(draft);hasDraft=true;
 return $('whatsapp-ready').href;
}
function prepareEnquiry({focus=true}={}){
 invalidateDraft();if(!validate())return null;
 const link=renderDraft();showStep(2,{focus});$('feedback').textContent=t('ready');return link;
}
function moveForward(){
 if(currentStep===0){if(validate(0))showStep(1);}
 else if(currentStep===1)prepareEnquiry();
 else{const link=prepareEnquiry({focus:false});if(link)window.open(link,'_blank','noopener,noreferrer');}
}
$('language').addEventListener('change',e=>setLanguage(e.target.value));
form.addEventListener('input',update);form.addEventListener('change',update);
form.addEventListener('reset',()=>{setTimeout(()=>{errorKeys={};furthestStep=0;form.querySelector('.extras').open=false;$('draft-panel').querySelector('details').open=false;update();showStep(0);},0);});
$('minus').addEventListener('click',()=>{quantity.value=String(Math.max(1,(countValid()?Number(quantity.value):2)-1));update();});
$('plus').addEventListener('click',()=>{quantity.value=String(Math.min(20,(countValid()?Number(quantity.value):0)+1));update();});
document.querySelectorAll('[data-package]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();configure(el.dataset.package,countValid()?Number(quantity.value):1);showStep(0);}));
$('booking-back').addEventListener('click',()=>showStep(Math.max(0,currentStep-1)));
form.querySelectorAll('[data-go-step]').forEach(button=>button.addEventListener('click',()=>{
 const step=Number(button.dataset.goStep);if(step===currentStep)return;
 if(step===2)prepareEnquiry();else if(step===0||validate(0))showStep(step);
}));
form.querySelectorAll('[data-edit-step]').forEach(button=>button.addEventListener('click',()=>{
 showStep(Number(button.dataset.editStep));
 if(button.hasAttribute('data-edit-extras')){form.querySelector('.extras').open=true;date.focus({preventScroll:true});date.scrollIntoView({block:'center',behavior:'auto'});}
}));
form.addEventListener('submit',e=>{e.preventDefault();moveForward();});
$('whatsapp-ready').addEventListener('click',e=>{if(!prepareEnquiry({focus:false}))e.preventDefault();});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(draft);$('feedback').textContent=t('copied');}catch{$('feedback').textContent=t('copyFail');}});
$('download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob(['\uFEFF'+draft],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Kabivio-enquiry-'+lang+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('feedback').textContent=t('downloaded');});
refreshDateMinimum();
window.addEventListener('pageshow',()=>{refreshDateMinimum();updateTotal();if(hasDraft){if(Object.keys(getErrors()).length){invalidateDraft();validate();}else renderDraft();}});
setLanguage(lang);
form.removeAttribute('inert');
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{const visible=entries[0].isIntersecting;$('mobile-submit').hidden=!visible;$('mobile-choose').hidden=visible;},{rootMargin:'-80px 0px -90px 0px',threshold:0});observer.observe(form);window.addEventListener('pagehide',event=>{if(!event.persisted)observer.disconnect();});}
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'configure_cleaning_draft',description:'Select a Kabivio cleaning package, truck count and optional page language. Updates visible state without contacting anyone or booking.',inputSchema:{type:'object',properties:{package:{type:'string',enum:Object.keys(prices)},quantity:{type:'integer',minimum:1,maximum:20},language:{type:'string',enum:['de','en','tr','ar']}},required:['package','quantity'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object')throw new Error('Invalid input');if(input.language!==undefined&&!Object.hasOwn(translations,input.language))throw new Error('Invalid language');const result=configure(input.package,input.quantity);if(input.language)setLanguage(input.language);return {...result,language:lang};}});
 register({name:'prepare_cleaning_enquiry',description:'Validate the visible form and show the Kabivio review step with a WhatsApp enquiry draft. Does not open WhatsApp, send any message, or book an appointment.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(){const url=prepareEnquiry();return url?{prepared:true,recipient:phone,url,messageSent:false,bookingCreated:false}:{prepared:false,error:$('errors').textContent,messageSent:false};}});
 window.addEventListener('pagehide',event=>{if(!event.persisted)lifecycle.abort();});
}
