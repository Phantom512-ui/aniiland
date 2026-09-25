import {cycle,eligible} from './solver.js';
import {renderLayoutPlanner} from './layout.js';
document.head.insertAdjacentHTML('beforeend','<link rel="stylesheet" href="v12.css">');
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const data=await fetch('./data.json').then(r=>r.json());
const APP_VERSION='1.6.4';
const PLAN_MODEL_SCHEMA=4; // bump only when an old solved result is no longer valid under mandatory planner rules
document.querySelector('.version').textContent=APP_VERSION;
const byId=new Map(data.items.map(i=>[i.id,i]));const fmt=(n,d=0)=>Number(n).toLocaleString(undefined,{maximumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=i=>i?.icon?`<img src="${esc(i.icon)}" alt="" loading="lazy">`:'<span class="muted">—</span>';
const coinIcon=(label='Home Coin')=>`<img class="coin-icon" src="assets/home_coin.png" alt="${esc(label)}">`;
const facilityIconMap={
 'Farmland':[[3,'assets/facilities/farm123.png'],[99,'assets/facilities/farm4567.png']],
 'Woodland':[[2,'assets/facilities/woodland12.png'],[99,'assets/facilities/woodland3456.png']],
 'Mine':[[3,'assets/facilities/mine123.png'],[99,'assets/facilities/mine456.png']],
 'Well':[[99,'assets/facilities/well.png']],
 'Tidewhisper Sandcastle':[[99,'assets/facilities/sandcastle.png']],
 'Dewy House':[[99,'assets/facilities/dewyhouse.png']],
 'Nimbus Bed':[[99,'assets/facilities/nimbusbed.png']],
 'Starfall Hammock':[[99,'assets/facilities/starfallhammock.png']],
 'Floral Windmill':[[99,'assets/facilities/floralwindmill.png']],
 'Heat Furnace':[[99,'assets/facilities/heater.png']],
 'Cooling Unit':[[99,'assets/facilities/cooler.png']],
 'Sunlamp':[[99,'assets/facilities/sunlamp.png']],
 'Carousel Mill':[[3,'assets/facilities/carouselmill123.png'],[99,'assets/facilities/carouselmill456.png']],
 'Crafting Table':[[4,'assets/facilities/craftingtable1234.png'],[99,'assets/facilities/craftingtable5678.png']],
 'Claw Game Cooker':[[4,'assets/facilities/clawgamecooker1234.png'],[99,'assets/facilities/clawgamecooker567.png']],
 'Jukebox Dryer':[[3,'assets/facilities/jukeboxdryer123.png'],[99,'assets/facilities/jukeboxdryer456.png']],
 'Simmering Pot':[[99,'assets/facilities/simmeringpot.png']],
 'Phonolfactory Table':[[2,'assets/facilities/phonolfactorytable12.png'],[99,'assets/facilities/phonolfactorytable3456.png']],
 'Bouncy Brew Keg':[[2,'assets/facilities/bouncybrewkeg12.png'],[99,'assets/facilities/bouncybrewkeg345.png']],
 'Blazing Stove':[[99,'assets/facilities/blazingstove.png']],
 'Pickling Jar':[[99,'assets/facilities/picklingjar.png']],
 'Joy Wheel Loom':[[1,'assets/facilities/joywheelloom1.png'],[99,'assets/facilities/joywheelloom234.png']],
 'Dance Pad Polisher':[[99,'assets/facilities/dancepadpolisher.png']],
 'Aniipod Maker':[[99,'assets/facilities/aniipodmaker.png']],
 'Woodworking Bench':[[99,'assets/facilities/woodworkingbench.png']],
 'Chimney Kiln':[[99,'assets/facilities/chimneykiln.png']],
 'Storage Unit':[[99,'assets/facilities/storageunit.png']],
 'Egg Incubator':[[99,'assets/facilities/eggincubator.png']]
};
const facilityIconFor=(name,level=1)=>{const key=(name===EVENT_RADISH_FACILITY||name===EVENT_PEPPER_FACILITY)?'Farmland':name;const rows=facilityIconMap[key];if(!rows)return'';const hit=rows.find(([max])=>level<=max)||rows[rows.length-1];return hit?.[1]||''};
const facilityIconHtml=(name,level=1,label='')=>{const src=facilityIconFor(name,level);return src?`<img class="facility-mini-icon" src="${esc(src)}" alt="${esc(label||name)}" loading="lazy">`:''};
const moonrayIcon=(label='Moonray Wheat')=>`<img class="coin-icon moonray-icon" src="assets/event/moonray_wheat.png" alt="${esc(label)}">`;
const craftingProductFacilityCell=i=>`<div class="craft-product-facility"><div class="craft-facility-icon">${facilityIconHtml(i.facility,i.facilityLevel)}</div><div class="craft-product-info"><div class="craft-product-top"><div class="craft-product-title">${icon(i)}${itemButton(i.id)}</div>${craftingAvailabilityNote(i)}</div><div class="craft-facility-name">${esc(i.facility)}</div></div></div>`;

let climateIconView=(()=>{try{const saved=window.localStorage.getItem('aniimo-climate-icon-view');return saved===null?true:saved==='true'}catch{return true}})();


const personalityIconMap={Energetic:'energetic',Faithful:'faithful',Instinctive:'instinctive',Judicious:'judicious',Nimble:'nimble',Playful:'playful',Practical:'practical',Tenacious:'tenacious'};
const personalityFallbackLetter=name=>name==='Practical'?'S':String(name||'?').charAt(0).toUpperCase();
const personalityBadge=name=>{
 if(!name||name==='Any')return `<span class="personality-inline no-icon"><span>${esc(name||'Any')}</span></span>`;
 const slug=personalityIconMap[name],letter=personalityFallbackLetter(name);
 if(!slug)return `<span class="personality-inline"><span class="personality-fallback">${esc(letter)}</span><span>${esc(name)}</span></span>`;
 return `<span class="personality-inline"><img class="personality-icon" src="assets/personality/${slug}.png" alt="" loading="lazy" onerror="this.insertAdjacentHTML('afterend','<span class=&quot;personality-fallback&quot;>${esc(letter)}</span>');this.remove()"><span>${esc(name)}</span></span>`;
};
const aniimoIcon=name=>`<img class="aniimo-icon" src="https://cdn.mobalytics.gg/cdn-cgi/image/format%3Dauto%2Cwidth%3D96/assets/news/images/aniimo/aniimos/${esc(name.toLowerCase())}.webp" alt="${esc(name)}" loading="lazy" onerror="this.remove()">`;
const itemButton=(id,label)=>`<button class="item-link" data-item="${esc(id)}">${esc(label||byId.get(id)?.name||id)}</button>`;
const worker=new Worker(new URL('./worker.js',import.meta.url),{type:'module'});let request=0;const pending=new Map();worker.onmessage=({data:r})=>{const p=pending.get(r.id);if(p){pending.delete(r.id);r.error?p.reject(new Error(r.error)):p.resolve(r.result)}};worker.onerror=e=>{for(const p of pending.values())p.reject(new Error(e.message));pending.clear()};
const EVENT_START_RV=10,EVENT_RADISH_FACILITY='Harvest Moon · Radish Farm',EVENT_PEPPER_FACILITY='Harvest Moon · Pepper Farm';
const EVENT_CROP_IDS=new Set(['moondew_radish','waxing_moon_pepper']);
const EVENT_RECIPE_UNLOCKS=[
 {id:'umbral_hot_pot',cost:80},
 {id:'umbral_pickle',cost:80},
 {id:'umbral_sweet_spicy_sauce',cost:80},
 {id:'harvest_platter',cost:120}
];
const EVENT_RECIPE_UNLOCK_IDS=new Set(EVENT_RECIPE_UNLOCKS.map(x=>x.id));
const EVENT_TASKS=[
 {id:'coop_sale',label:'Sell Home produce once at the Co-op Store.',defaultReward:150},
 {id:'three_orders',label:'Complete 3 Home orders.',defaultReward:150},
 {id:'relay_outing',label:'Complete 1 Aniimo outing at a relay station.',defaultReward:150},
 {id:'friend_soil',label:"Loosen the soil at a friend's Home once.",defaultReward:150}
];
const EVENT_FURNITURE=[
 ['f01','Harvest Moon – Round…',230],['f02','Harvest Moon – Low Stool',230],['f03','Harvest Moon – Tall Stool',230],
 ['f04','Harvest Moon – Fruit…',110],['f05','Harvest Moon – Starlight…',110],['f06','Harvest Moon – Golden…',110],
 ['f07','Harvest Moon – Moon Rabbit…',110],['f08','Harvest Moon – Stew Pot…',110],['f09','Harvest Moon – Crisp & …',110],
 ['f10','Harvest Moon – Wheat…',110],['f11','Harvest Moon – Flaky…',110],['f12','Harvest Moon – Abundant…',60],
 ['f13','Harvest Moon – Oranges',60],['f14','Harvest Moon – Apples',60],['f15','Harvest Moon – Crimson…',60],
 ['f16','Harvest Moon – Tart Berry…',60],['f17','Harvest Moon – Garden…',60],['f18','Harvest Moon – Sweet…',60],
 ['f19','Harvest Moon – Rice Wa…',30],['f20','Harvest Moon – Market',340],['f21','Harvest Moon – Osmant',230]
].map(([id,name,cost],idx)=>({id,name,cost,img:`assets/event/furniture_${String(idx+1).padStart(2,'0')}.png`}));
const EVENT_PERMANENT_UNLOCK_TOTAL=EVENT_RECIPE_UNLOCKS.reduce((n,x)=>n+x.cost,0)+EVENT_FURNITURE.reduce((n,x)=>n+x.cost,0);
const eventFacilityLabel=name=>name===EVENT_RADISH_FACILITY||name===EVENT_PEPPER_FACILITY?'1 reserved':`${activeFacilitiesConfig()?.[name]?.count||0} available`;
function cloneForSolve(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function reserveFacilityUnits(facility,count){
 if(!facility||count<=0)return;
 if(Array.isArray(facility.levels)){
  let left=count;const rows=[...facility.levels].sort((a,b)=>(a.level||1)-(b.level||1));
  for(const row of rows){const take=Math.min(left,Math.max(0,Number(row.count)||0));row.count-=take;left-=take;if(left<=0)break}
  facility.levels=rows.filter(row=>row.count>0);facility.count=facility.levels.reduce((n,row)=>n+row.count,0);facility.level=facility.levels.length?Math.max(...facility.levels.map(row=>row.level||1)):1;
 }else facility.count=Math.max(0,(Number(facility.count)||0)-count);
}
function solvePayload(settings){
 if(!(settings.events&&settings.level>=EVENT_START_RV))return{solverData:data,solverSettings:settings};
 const solverData=cloneForSolve(data),solverSettings=cloneForSolve(settings),farm=solverSettings.facilities?.Farmland;
 const ownedEventRecipes=new Set(Array.isArray(solverSettings.eventRecipeUnlocks)?solverSettings.eventRecipeUnlocks:[]);
 solverSettings.avoidedRecipes=[...new Set([...(solverSettings.avoidedRecipes||[]),...EVENT_RECIPE_UNLOCKS.filter(x=>!ownedEventRecipes.has(x.id)).map(x=>x.id)])];
 if(!farm||Number(farm.count||0)<2)throw new Error('Harvest Moon Event Mode needs at least 2 Farmlands.');
 reserveFacilityUnits(farm,2);
 solverSettings.facilities[EVENT_RADISH_FACILITY]={count:1,level:1};
 solverSettings.facilities[EVENT_PEPPER_FACILITY]={count:1,level:1};
 for(const item of solverData.items){
  if(item.id==='moondew_radish')item.facility=EVENT_RADISH_FACILITY;
  else if(item.id==='waxing_moon_pepper')item.facility=EVENT_PEPPER_FACILITY;
 }
 return{solverData,solverSettings};
}
function workerSolve(settings){const id=++request,{solverData,solverSettings}=solvePayload(settings);return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,data:solverData,settings:solverSettings})})}
async function solve(settings){
 if(!(settings.events&&settings.level>=EVENT_START_RV))return workerSolve(settings);
 // Control: keep the two festival Farmlands reserved, but run only the normal planner elsewhere.
 const controlSettings=cloneForSolve(settings);controlSettings.disableEventProduction=true;controlSettings.eventNoRawSale=true;controlSettings.eventPriority=false;delete controlSettings.minCoinRate;
 const control=await workerSolve(controlSettings);
 // Event candidate: raw event crops cannot be sold or wasted. Maximise useful event consumption
 // while retaining at least 85% of the control plan's Home Coin earnings for the same settings.
 const eventSettings=cloneForSolve(settings);eventSettings.disableEventProduction=false;eventSettings.eventNoRawSale=true;eventSettings.eventPriority=true;eventSettings.minCoinRate=Math.max(0,control.net*0.85);
 try{const result=await workerSolve(eventSettings);result.eventControlNet=control.net;result.eventCoinFloor=eventSettings.minCoinRate;result.eventApplied=true;return result}catch(e){control.eventControlNet=control.net;control.eventCoinFloor=eventSettings.minCoinRate;control.eventApplied=false;return control}
}
const UI_STORE='aniiland-user-state';
const UI_SCHEMA=2;
const PLAN_STORE='aniiland-accepted-plan';
const LEGACY_UI_STORES=['aniimo-homeland-planner-ui-v143','aniimo-homeland-planner-ui-v141','aniimo-homeland-planner-ui-v140','aniimo-homeland-planner-ui-v135','aniimo-homeland-planner-ui-v134','aniimo-homeland-planner-ui-v132'];
const loadUiState=()=>{try{const current=JSON.parse(localStorage.getItem(UI_STORE)||'{}');if(current&&Object.keys(current).length)return current;for(const key of LEGACY_UI_STORES){const legacy=JSON.parse(localStorage.getItem(key)||'{}');if(legacy&&Object.keys(legacy).length)return{...legacy,avoidUntilUnlocked:Array.isArray(legacy.avoidUntilUnlocked)?legacy.avoidUntilUnlocked:[]}}return{}}catch{return{}}};
const persistUiState=state=>{try{localStorage.setItem(UI_STORE,JSON.stringify({...state,schema:UI_SCHEMA}))}catch{}};
const loadAcceptedPlan=()=>{try{const saved=JSON.parse(localStorage.getItem(PLAN_STORE)||'null');return saved&&saved.result&&saved.userSignature?saved:null}catch{return null}};
const persistAcceptedPlan=snapshot=>{try{snapshot?localStorage.setItem(PLAN_STORE,JSON.stringify(snapshot)):localStorage.removeItem(PLAN_STORE)}catch{}};
const initialUi=loadUiState();
let acceptedPlanSnapshot=loadAcceptedPlan(),pendingPlannerUpdate=null,usingSavedPlan=false,quickNavVisible=false;
const moduleMeta={ecological_module:'Ecological Module',kitchen_module:'Kitchen Module',resource_detector:'Resource Detector',crafting_module:'Crafting Module'};
const premiumRecipeIds=new Set(data.special.map(x=>x.name));
const premiumRecipeMeta=Object.fromEntries(data.special.map(x=>[x.name,{cost:1,currency:'Dream Spark',vendor:'Homeland Shop Robot (Seed Shop)'}]));
const isPremiumRecipe=item=>!!item&&premiumRecipeIds.has(item.id);
let level=Number(initialUi.level)||9,tab='plan',last=null,busy=false,config={},special=Array.isArray(initialUi.special)?initialUi.special:[],generation=0,search='',category='all',catalogScope='all',workerMode=initialUi.workerMode==='minimum'?'minimum':'3',autoDurationFromUpgrade=!!initialUi.autoDurationFromUpgrade,scrollRestoreY=null,plannerStrategy=initialUi.strategy||'profit',plannerHours=initialUi.hours||'24',bonusEnabled=!!initialUi.bonus,climateEnabled=initialUi.climate!==false,lightClimateEnabled=initialUi.lightClimate!==false,eventsEnabled=!!initialUi.events,unverifiedEnabled=false,moduleLevels=initialUi.moduleLevels&&typeof initialUi.moduleLevels==='object'?{...initialUi.moduleLevels}:{},setupMode=initialUi.setupMode==='advanced'?'advanced':'simple',advancedFacilityGroups=initialUi.advancedFacilityGroups&&typeof initialUi.advancedFacilityGroups==='object'?structuredClone(initialUi.advancedFacilityGroups):null,advancedModuleLevels=initialUi.advancedModuleLevels&&typeof initialUi.advancedModuleLevels==='object'?{...initialUi.advancedModuleLevels}:null,advancedDraft=null,advancedTab='materials',avoidedRecipes=new Set(Array.isArray(initialUi.avoidedRecipes)?initialUi.avoidedRecipes:[]),avoidUntilUnlocked=new Set(Array.isArray(initialUi.avoidUntilUnlocked)?initialUi.avoidUntilUnlocked:[]),pendingLockRecipeId=null,orders=Array.isArray(initialUi.orders)?initialUi.orders.map(o=>({...o,reward:Math.max(0,Number(o.reward)||0),overrides:Array.isArray(o.overrides)?o.overrides:[],denied:Array.isArray(o.denied)?o.denied:[]})):[],orderDockOpen=initialUi.orderDockOpen!==false,pendingOrderRecipeCheck=null,eventCurrency=Math.max(0,Number(initialUi.eventCurrency)||0),eventRecipeUnlocks=new Set(Array.isArray(initialUi.eventRecipeUnlocks)?initialUi.eventRecipeUnlocks:[]),eventRecipePaidUnlocks=new Set(Array.isArray(initialUi.eventRecipePaidUnlocks)?initialUi.eventRecipePaidUnlocks:[]),eventFurnitureUnlocks=new Set(Array.isArray(initialUi.eventFurnitureUnlocks)?initialUi.eventFurnitureUnlocks:[]),eventTaskRewards=initialUi.eventTaskRewards&&typeof initialUi.eventTaskRewards==='object'?{...initialUi.eventTaskRewards}:{},eventTaskDone=initialUi.eventTaskDone&&typeof initialUi.eventTaskDone==='object'?{...initialUi.eventTaskDone}:{},eventActiveTab=initialUi.eventActiveTab||'orders';const cache=new Map();
const modes={minimum:'minimum recommended workers',3:'recommended level 3+ workers'};
const moduleCap=(key,l=level)=>Math.max(0,Number(data.modules?.[key]?.[l-1]??0));
const maxModules=l=>Object.fromEntries(Object.keys(moduleMeta).map(key=>[key,moduleCap(key,l)]));
function normalizeModuleLevels(target=moduleLevels,{advanced=false}={}){for(const key of Object.keys(moduleMeta)){const cap=moduleCap(key),fallback=advanced?(cap>0?1:0):cap;if(target[key]==null||!Number.isFinite(Number(target[key])))target[key]=fallback;else target[key]=Math.max(0,Math.min(cap,Math.floor(Number(target[key]))))}return target}
const combinedAvoided=()=>new Set([...avoidedRecipes,...avoidUntilUnlocked]);
function updateAvoidCount(){const el=$('#avoid-count');if(el)el.textContent=combinedAvoided().size}
function updatePremiumCount(){const el=$('#premium-count');if(el)el.textContent=special.length}
function saveUiState(){normalizeModuleLevels();if(advancedModuleLevels)normalizeModuleLevels(advancedModuleLevels,{advanced:true});persistUiState({level,workerMode,strategy:plannerStrategy,hours:plannerHours,bonus:bonusEnabled,climate:climateEnabled,lightClimate:lightClimateEnabled,events:eventsEnabled,unverified:unverifiedEnabled,special,moduleLevels:{...moduleLevels},setupMode,advancedFacilityGroups:advancedFacilityGroups?structuredClone(advancedFacilityGroups):null,advancedModuleLevels:advancedModuleLevels?{...advancedModuleLevels}:null,avoidedRecipes:[...avoidedRecipes],avoidUntilUnlocked:[...avoidUntilUnlocked],autoDurationFromUpgrade,orders,orderDockOpen,eventCurrency,eventRecipeUnlocks:[...eventRecipeUnlocks],eventRecipePaidUnlocks:[...eventRecipePaidUnlocks],eventFurnitureUnlocks:[...eventFurnitureUnlocks],eventTaskRewards:{...eventTaskRewards},eventTaskDone:{...eventTaskDone},eventActiveTab});updateAvoidCount();updatePremiumCount();updateEventButton()}
function userPlanSignature(){normalizeModuleLevels();return JSON.stringify({level,workerMode,strategy:plannerStrategy,hours:plannerHours,bonus:bonusEnabled,climate:climateEnabled,lightClimate:lightClimateEnabled,events:eventsEnabled,special:[...special].sort(),moduleLevels:{...moduleLevels},setupMode,advancedFacilityGroups:advancedFacilityGroups?structuredClone(advancedFacilityGroups):null,advancedModuleLevels:advancedModuleLevels?{...advancedModuleLevels}:null,avoidedRecipes:[...avoidedRecipes].sort(),avoidUntilUnlocked:[...avoidUntilUnlocked].sort(),eventRecipeUnlocks:[...eventRecipeUnlocks].sort()})}
function planScore(plan){if(!plan)return 0;if(plan.settings?.strategy==='upgrade')return Math.max(0,Number(plan.upgradeRate)||0);return Math.max(0,Number(plan.net)||0)}
function snapshotPlan(plan){if(!plan)return null;const result=structuredClone(plan);delete result.upgradePlan;return{appVersion:APP_VERSION,planModelSchema:PLAN_MODEL_SCHEMA,savedAt:Date.now(),userSignature:userPlanSignature(),result}}
function acceptCurrentPlan(plan=last){if(!plan)return;acceptedPlanSnapshot=snapshotPlan(plan);persistAcceptedPlan(acceptedPlanSnapshot);usingSavedPlan=false;pendingPlannerUpdate=null;renderPlannerUpdateButton()}
function renderPlannerUpdateButton(){const btn=$('#planner-update');if(!btn)return;if(!pendingPlannerUpdate){btn.hidden=true;btn.innerHTML='';return}const p=pendingPlannerUpdate,recipe=p.newRecipes?.length===1?`New recipe detected: ${esc(p.newRecipes[0])}`:p.newRecipes?.length>1?'New recipes detected':'Improved planner math detected';btn.hidden=false;btn.innerHTML=`<span><b>${recipe}</b><small>+${fmt(p.percent,1)}% efficiency · your saved plan stays active until you choose this.</small></span><strong>Use new plan ↗</strong>`}
function currentMathSettings(){const st=settings();if(setupMode==='simple'){st.facilities=defaults(level);st.moduleLevels=maxModules(level)}return st}
async function checkPlannerUpdate(){const saved=acceptedPlanSnapshot;if(!saved||saved.appVersion===APP_VERSION||saved.userSignature!==userPlanSignature()||!usingSavedPlan)return;try{const st=currentMathSettings(),key=JSON.stringify(st);let r=cache.get(key);if(!r){r=await solve(st);cache.set(key,r)}if(!usingSavedPlan||acceptedPlanSnapshot!==saved)return;const oldScore=planScore(saved.result),newScore=planScore(r),percent=oldScore>1e-9?(newScore-oldScore)/oldScore*100:(newScore>1e-9?100:0);if(percent<5-1e-9)return;const oldIds=new Set((saved.result.rows||[]).map(x=>x.id)),newRecipes=(r.rows||[]).filter(x=>!oldIds.has(x.id)).map(x=>byId.get(x.id)?.name||x.id);pendingPlannerUpdate={percent,newRecipes:[...new Set(newRecipes)].slice(0,2),candidate:{...r,settings:st,upgradePlan:null}};renderPlannerUpdateButton()}catch(e){console.warn('Planner update comparison failed',e)}}
function restoreAcceptedPlan(){const saved=acceptedPlanSnapshot;if(!saved||saved.userSignature!==userPlanSignature()||Number(saved.result?.level)!==level)return false;if(Number(saved.planModelSchema||0)!==PLAN_MODEL_SCHEMA)return false;last=structuredClone(saved.result);usingSavedPlan=saved.appVersion!==APP_VERSION;return true}
const layoutMismatchHtml=()=>'<div class="note warn layout-plan-mismatch"><span class="layout-plan-mismatch-icon">↻</span><div><b>Floor layout needs an update.</b><span>The current Production Plan can change which facilities, crops, or climate placement are needed. Press <strong>Auto-place this production plan</strong> to sync the floor layout; your owned-plot selections are kept.</span></div></div>';
function markLayoutPlannerStale(){if(tab!=='layout')return;const root=$('#layout-root');if(!root)return;let note=$('#content .layout-plan-mismatch');if(!note){root.insertAdjacentHTML('beforebegin',layoutMismatchHtml());note=$('#content .layout-plan-mismatch')}note?.classList.add('layout-plan-mismatch-live')}
function ensurePlanQuickNav(){let nav=$('#plan-quick-nav');if(nav)return nav;document.body.insertAdjacentHTML('beforeend',`<aside id="plan-quick-nav" class="plan-quick-nav" hidden><button type="button" class="plan-quick-nav-toggle" data-plan-nav-toggle aria-label="Collapse quick links"><span class="plan-quick-nav-toggle-icon">›</span><small>Sections</small></button><div class="plan-quick-nav-inner"><div class="plan-quick-nav-head"><span class="plan-quick-nav-mark">◆</span><div><small>QUICK LINKS</small><b>RV ${level} sections</b></div></div><div class="plan-quick-nav-links"></div></div></aside>`);nav=$('#plan-quick-nav');try{if(localStorage.getItem('aniiland-quick-nav-collapsed')==='true')nav.classList.add('collapsed')}catch{}return nav}
function renderPlanQuickNav(){const nav=ensurePlanQuickNav();if(tab!=='plan'||!quickNavVisible||!last){nav.hidden=true;return}nav.hidden=false;const links=[['Overview',$('#content .page-title')],...$$('#content .section-head').map(x=>[x.querySelector('h2')?.textContent?.replace(/\s+/g,' ').trim(),x]).filter(x=>x[0])];const box=nav.querySelector('.plan-quick-nav-links');box.innerHTML=links.map(([label,el],idx)=>{const id=`plan-section-${idx}`;el.id=id;return `<button type="button" data-plan-nav-target="${id}"><i></i><span>${esc(label)}</span></button>`}).join('');const title=nav.querySelector('.plan-quick-nav-head b');if(title)title.textContent=`RV ${level} sections`}
function sharedCraftAllocation(r,rows){
 const allocations=new Map(),summaries=[];
 for(const facility of ['Woodworking Bench','Chimney Kiln']){
  const rs=rows.filter(row=>row.shared&&row.facility===facility);if(!rs.length)continue;
  const cfg=r.settings?.facilities?.[facility]||{},levels=Array.isArray(cfg.levels)?cfg.levels.flatMap(g=>Array.from({length:Math.max(0,Math.floor(Number(g.count)||0))},()=>Math.max(1,Number(g.level)||1))):Array.from({length:Math.max(0,Math.floor(Number(cfg.count)||0))},()=>Math.max(1,Number(cfg.level)||1));
  const machines=levels.sort((a,b)=>a-b).map((level,idx)=>({idx:idx+1,level,load:0,parts:[]})),short=facility==='Woodworking Bench'?'Bench':'Kiln';
  const sorted=[...rs].sort((a,b)=>(byId.get(a.id)?.facilityLevel||1)-(byId.get(b.id)?.facilityLevel||1));
  for(const row of sorted){
   const need=byId.get(row.id)?.facilityLevel||1,rowParts=[];let remaining=Math.max(0,row.machineHours||0);
   while(remaining>1e-7){
    const compatible=machines.filter(m=>m.level>=need&&m.load<1-1e-7);if(!compatible.length)break;
    const empties=compatible.filter(m=>m.load<=1e-7),pool=empties.length?empties:compatible;
    const machine=[...pool].sort((a,b)=>a.load-b.load||a.idx-b.idx)[0],share=Math.min(remaining,Math.max(0,1-machine.load));
    if(share<=1e-7)break;
    const part={row,share};machine.parts.push(part);machine.load+=share;rowParts.push({machine,share});remaining-=share;
   }
   if(rowParts.length)allocations.set(row.id,{parts:rowParts,split:rowParts.length>1,rotates:false,busy:row.machineHours||0});
  }
  for(const m of machines.filter(x=>x.parts.length)){
   const label=`${short} ${m.idx}`,uniqueRows=[...new Map(m.parts.map(p=>[p.row.id,p.row])).values()],rotates=uniqueRows.length>1;
   for(const p of m.parts){const a=allocations.get(p.row.id);if(a&&rotates)a.rotates=true}
   summaries.push({facility,label,rows:uniqueRows,busy:m.load,rotates});
  }
  for(const row of rs){const a=allocations.get(row.id);if(!a)continue;a.label=a.parts.map(p=>`${short} ${p.machine.idx}${a.parts.length>1?` (${fmt(p.share*100,1)}%)`:''}`).join(' + ')}
 }
 return{allocations,summaries}
}
function sharedCraftAllocationHtml(info){if(!info.summaries.length)return'';return `<div class="upgrade-craft-allocation">${info.summaries.map(x=>`<div>${facilityIconHtml(x.facility,1)}<span><b>${esc(x.label)} → ${x.rows.map(r=>esc(byId.get(r.id)?.name||r.id)).join(' / ')}</b><small>${x.rotates?'Rotate these upgrade crafts on this machine':'Keep this machine on this upgrade craft'} · ${fmt(x.busy*100,1)}% combined busy</small></span></div>`).join('')}</div>`}

function rememberScroll(){if(tab==='plan')scrollRestoreY=window.scrollY||window.pageYOffset||0}
function restoreScroll(){if(scrollRestoreY===null)return;const y=scrollRestoreY;scrollRestoreY=null;requestAnimationFrame(()=>window.scrollTo({top:y}))}
function syncStrategyButtons(){const value=$('#strategy')?.value;$$('[data-strategy-btn]').forEach(btn=>btn.classList.toggle('active',btn.dataset.strategyBtn===value))}
function applyStrategySelection(value,{recalc=true,remember=true}={}){const select=$('#strategy');if(!select)return;if(remember)rememberScroll();select.value=value;plannerStrategy=value;syncStrategyButtons();if(value==='upgrade'&&level<20){$('#hours').value='rv';plannerHours='rv';autoDurationFromUpgrade=true}else if(autoDurationFromUpgrade&&$('#hours').value==='rv'){$('#hours').value='24';plannerHours='24';autoDurationFromUpgrade=false}else{plannerHours=$('#hours').value}saveUiState();last=null;if(recalc&&(tab==='plan'||tab==='layout')){if(tab==='layout')markLayoutPlannerStale();calculate()}}

function defaults(l){return Object.fromEntries(data.facilities.map(f=>{const unlocks=Object.entries(f.unlocks).filter(([,n])=>n<=l).map(([n])=>+n);return[f.name,{count:unlocks.length?f.counts[Math.min(l,f.counts.length)-1]:0,level:unlocks.length?Math.max(...unlocks):1}]}))}
const noLevelFacilities=new Set(['Heat Furnace','Cooling Unit','Sunlamp']);
const advancedCategoryOrder=['materials','resource','environment','processing','special','components'];
const advancedCategoryLabels={materials:'Materials',resource:'Resource Facilities',environment:'Environment',processing:'Processing',special:'Special Facilities',components:'RV Components'};
const advancedCategoryFacilities={
 materials:['Farmland','Woodland','Mine','Well'],
 resource:['Tidewhisper Sandcastle','Dewy House','Nimbus Bed','Starfall Hammock','Floral Windmill'],
 environment:['Heat Furnace','Cooling Unit','Sunlamp'],
 processing:['Carousel Mill','Crafting Table','Claw Game Cooker','Jukebox Dryer','Simmering Pot','Phonolfactory Table','Bouncy Brew Keg','Blazing Stove','Pickling Jar','Joy Wheel Loom'],
 special:['Dance Pad Polisher','Aniipod Maker','Woodworking Bench','Chimney Kiln']
};
const facilityDef=name=>data.facilities.find(f=>f.name===name);
const maxFacilityLevel=(name,l=level)=>{const f=facilityDef(name);if(!f)return 1;const levels=Object.entries(f.unlocks||{}).filter(([,rv])=>rv<=l).map(([lv])=>+lv);return levels.length?Math.max(...levels):1};
const maxFacilityCount=(name,l=level)=>{const f=facilityDef(name);if(!f)return 0;return Number(f.counts?.[Math.min(l,f.counts.length)-1]??0)};
function blankAdvancedSetup(){
 const facilities={};for(const f of data.facilities)facilities[f.name]=[{count:0,level:1}];
 const modules=Object.fromEntries(Object.keys(moduleMeta).map(key=>[key,moduleCap(key)>0?1:0]));
 return{facilities,modules}
}
function fillAdvancedSetup(){
 const facilities={};const d=defaults(level);for(const f of data.facilities)facilities[f.name]=[{count:d[f.name]?.count||0,level:noLevelFacilities.has(f.name)?1:(d[f.name]?.level||1)}];
 return{facilities,modules:maxModules(level)}
}
function sanitizeAdvancedSetup(source){
 const draft=source?structuredClone(source):blankAdvancedSetup(),out={facilities:{},modules:{}};
 for(const f of data.facilities){
  const maxCount=maxFacilityCount(f.name),maxLevel=maxFacilityLevel(f.name);let remaining=maxCount;
  const rows=(draft.facilities?.[f.name]||[{count:0,level:1}]).map(row=>({count:Math.max(0,Math.floor(Number(row.count)||0)),level:noLevelFacilities.has(f.name)?1:Math.max(1,Math.min(maxLevel,Math.floor(Number(row.level)||1)))}));
  out.facilities[f.name]=rows.map(row=>{const count=Math.min(row.count,remaining);remaining-=count;return{count,level:row.level}});
  if(!out.facilities[f.name].length)out.facilities[f.name]=[{count:0,level:1}];
 }
 for(const key of Object.keys(moduleMeta)){const cap=moduleCap(key),v=Number(draft.modules?.[key]);out.modules[key]=Math.max(0,Math.min(cap,Number.isFinite(v)?Math.floor(v):(cap>0?1:0)))}
 return out
}
function advancedFacilitiesConfig(source={facilities:advancedFacilityGroups}){
 const facilities=source.facilities||{};return Object.fromEntries(data.facilities.map(f=>{const rows=(facilities[f.name]||[]).map(r=>({count:Math.max(0,Math.floor(Number(r.count)||0)),level:noLevelFacilities.has(f.name)?1:Math.max(1,Math.floor(Number(r.level)||1))})).filter(r=>r.count>0);const count=rows.reduce((n,r)=>n+r.count,0),max=rows.length?Math.max(...rows.map(r=>r.level)):1;return[f.name,{count,level:max,levels:rows}]}))
}
function activeFacilitiesConfig(){return setupMode==='advanced'&&advancedFacilityGroups?advancedFacilitiesConfig({facilities:advancedFacilityGroups}):config}
function activeModuleLevels(){if(setupMode==='advanced'){advancedModuleLevels??=blankAdvancedSetup().modules;normalizeModuleLevels(advancedModuleLevels,{advanced:true});return advancedModuleLevels}normalizeModuleLevels();return moduleLevels}
function activeFacilityCount(name){return activeFacilitiesConfig()?.[name]?.count||0}
function refreshCaps(){const root=$('#caps');if(!root)return;const farms=activeFacilityCount('Farmland'),eventOn=eventsEnabled&&level>=EVENT_START_RV&&farms>=2;root.innerHTML=[['Aniimo',data.aniimo[level-1]],['Farmland',eventOn?`${farms-2} normal + 2 event`:farms],['Woodland',activeFacilityCount('Woodland')],['Mine',activeFacilityCount('Mine')]].map(([n,v])=>`<div><span>${n}</span><b>${v}</b></div>`).join('')}
function renderSetupMode(){
 const simple=$('#simple-setup-panel'),advanced=$('#advanced-setup-summary');$$('[data-setup-mode]').forEach(b=>b.classList.toggle('active',b.dataset.setupMode===setupMode));
 if(simple)simple.hidden=setupMode!=='simple';if(advanced)advanced.hidden=setupMode!=='advanced';
 if(advanced&&setupMode==='advanced'){const active=activeFacilitiesConfig(),built=Object.values(active).reduce((n,f)=>n+(f.count||0),0);advanced.innerHTML=`<p class="hint"><b>Custom Setup active</b> · ${built} placed facilities. Mixed facility levels and custom RV Components are being used.</p><button type="button" class="secondary" id="edit-advanced-setup">Edit Custom Setup</button>`}
 refreshCaps()
}
function settings(l=level){const modules=l===level?{...activeModuleLevels()}:maxModules(l);return{level:l,facilities:l===level?structuredClone(activeFacilitiesConfig()):defaults(l),worker:workerMode,bonus:$('#bonus').checked,climate:$('#climate').checked,lightClimate:l<9||$('#light-climate').checked,strategy:$('#strategy').value,energyPerMinute:data.energyConsumptionPerMinute??10,special:[...special],moduleLevels:modules,avoidedRecipes:[...combinedAvoided()],events:l>=EVENT_START_RV&&($('#events')?.checked||false),eventRecipeUnlocks:[...eventRecipeUnlocks],unverified:$('#unverified')?.checked||false}}

function advancedFacilityCard(name){
 const f=facilityDef(name),rows=advancedDraft.facilities[name]||[{count:0,level:1}],maxCount=maxFacilityCount(name),maxLevel=maxFacilityLevel(name),noLevel=noLevelFacilities.has(name),available=maxCount>0;
 const rowHtml=rows.map((row,idx)=>`<div class="advanced-level-row" data-advanced-row="${idx}"><label><span>Count</span><input type="number" min="0" max="${maxCount}" value="${row.count}" ${available?'':'disabled'} data-adv-count="${esc(name)}" data-adv-index="${idx}"></label>${noLevel?'':`<label><span>Level</span><select ${available?'':'disabled'} data-adv-level="${esc(name)}" data-adv-index="${idx}">${Array.from({length:maxLevel},(_,n)=>`<option value="${n+1}" ${n+1===row.level?'selected':''}>Lv.${n+1}</option>`).join('')}</select></label>`}${rows.length>1?`<button type="button" class="advanced-remove-row" data-adv-remove="${esc(name)}" data-adv-index="${idx}" aria-label="Remove ${esc(name)} level row">×</button>`:''}</div>`).join('');
 return `<article class="advanced-facility-card ${available?'':'unavailable'}"><header><div class="advanced-card-title">${facilityIconHtml(name,rows?.[0]?.level||1)}<div><h3>${esc(name)}</h3><small>${available?`Maximum ${maxCount}${noLevel?'':` · up to Lv.${maxLevel}`}`:`Not available at RV ${level}`}</small></div></div></header><div class="advanced-level-rows">${rowHtml}</div>${!noLevel&&available?`<button type="button" class="advanced-add-level" data-adv-add="${esc(name)}">+ Add Level</button>`:''}</article>`
}
function advancedComponentCard(key){const cap=moduleCap(key),value=Math.min(cap,Number(advancedDraft.modules[key])||0),options=cap?Array.from({length:cap},(_,n)=>`<option value="${n+1}" ${n+1===Math.max(1,value)?'selected':''}>Lv.${n+1}</option>`).join(''):'<option value="0" selected>Not unlocked</option>';return `<article class="advanced-facility-card component-card ${cap?'':'unavailable'}"><header><div><h3>${esc(moduleMeta[key])}</h3><small>${cap?`Maximum at RV ${level}: Lv.${cap}`:`Not available at RV ${level}`}</small></div></header><label class="advanced-component-level"><span>Level</span><select data-adv-module="${key}" ${cap?'':'disabled'}>${options}</select></label></article>`}
function renderAdvancedSetup(){
 const tabs=$('#advanced-setup-tabs'),content=$('#advanced-setup-content');if(!tabs||!content||!advancedDraft)return;
 tabs.innerHTML=advancedCategoryOrder.map(key=>`<button type="button" class="${key===advancedTab?'active':''}" data-advanced-tab="${key}">${advancedCategoryLabels[key]}</button>`).join('');
 content.innerHTML=advancedTab==='components'?`<div class="advanced-card-grid component-grid">${Object.keys(moduleMeta).map(advancedComponentCard).join('')}</div>`:`<div class="advanced-card-grid">${(advancedCategoryFacilities[advancedTab]||[]).map(advancedFacilityCard).join('')}</div>`;
 const fill=$('#advanced-fill');if(fill)fill.textContent=`Fill to RV ${level}`
}
function openAdvancedSetup(){advancedDraft=advancedFacilityGroups?sanitizeAdvancedSetup({facilities:advancedFacilityGroups,modules:advancedModuleLevels||{}}):blankAdvancedSetup();advancedTab='materials';renderAdvancedSetup();$('#advanced-setup-dialog').showModal()}
function advancedValidation(){const cfg=advancedFacilitiesConfig(advancedDraft);for(const f of data.facilities){const total=cfg[f.name].count,max=maxFacilityCount(f.name);if(total>max)return `${f.name} exceeds the RV ${level} maximum of ${max}.`}return''}


const moduleRequirementLabel=item=>{if(!item?.module)return'';const[key,n]=item.module.split(':');return `${moduleMeta[key]||key.replaceAll('_',' ')} Lv.${n}`};
const moduleRequirement=item=>{if(!item?.module)return null;const[key,n]=item.module.split(':');return{key,level:Number(n)||0,label:moduleMeta[key]||key.replaceAll('_',' ')}};
function recipeToggleRow(item,{checked=false,attr='data-avoid',status=''}={}){return `<label class="recipe-toggle-row">${icon(item)}<span><b>${esc(item?.name||item?.id||'Unknown recipe')}</b><small>${esc(item?.facility||'')}${status?` · <strong>${esc(status)}</strong>`:''}</small></span><input type="checkbox" ${attr} value="${esc(item?.id||'')}" ${checked?'checked':''}></label>`}
function renderModuleControls(){normalizeModuleLevels();const root=$('#module-controls');if(!root)return;root.innerHTML=Object.keys(moduleMeta).map(key=>{const cap=moduleCap(key),value=Math.min(cap,Number(moduleLevels[key])||0);return `<div class="module-control"><div><b>${esc(moduleMeta[key])}</b><small>Maximum at RV ${level}: Lv.${cap}</small></div><select data-module="${key}" aria-label="${esc(moduleMeta[key])} level">${Array.from({length:cap+1},(_,n)=>`<option value="${n}" ${n===value?'selected':''}>${n===0?'Not owned':`Lv.${n}`}</option>`).join('')}</select></div>`}).join('')}
function renderSpecialRecipes(){const root=$('#special');if(!root)return;root.innerHTML=data.special.map(x=>{const item=byId.get(x.name),meta=premiumRecipeMeta[x.name];return recipeToggleRow(item,{checked:special.includes(x.name),attr:'data-special',status:meta?`${meta.cost} ${meta.currency}`:''})}).join('')||'<p class="muted">No premium recipes in this data.</p>';updatePremiumCount()}
function avoidableRecipes(){const normal=data.items.filter(i=>!i.byproductOnly&&!i.event&&!premiumRecipeIds.has(i.id)&&i.unlock<=level&&(i.seconds>0||i.workload>0));const selected=[...combinedAvoided()].map(id=>byId.get(id)).filter(Boolean);return [...new Map([...selected,...normal].map(i=>[i.id,i])).values()]}
function renderAvoidRecipes(query=''){const root=$('#avoid-recipes');if(!root)return;const q=String(query||'').trim().toLowerCase(),selected=combinedAvoided();const items=avoidableRecipes().filter(i=>!q||`${i.name} ${i.facility}`.toLowerCase().includes(q)).sort((a,b)=>(selected.has(b.id)?1:0)-(selected.has(a.id)?1:0)||a.facility.localeCompare(b.facility)||a.name.localeCompare(b.name));root.innerHTML=items.map(i=>{const temp=avoidUntilUnlocked.has(i.id),req=moduleRequirement(i),status=temp?(req?`Until ${req.label} Lv.${req.level}`:'Until unlocked'):(avoidedRecipes.has(i.id)?'Avoided':'');return recipeToggleRow(i,{checked:selected.has(i.id),status})}).join('')||'<p class="muted">No matching recipes.</p>';updateAvoidCount()}
function renderRecipeAvailability(){renderModuleControls();renderSpecialRecipes();renderAvoidRecipes($('#avoid-search')?.value||'')}
function clearConditionalAvoidsForModule(key,value){let changed=false;for(const id of [...avoidUntilUnlocked]){const req=moduleRequirement(byId.get(id));if(req?.key===key&&value>=req.level){avoidUntilUnlocked.delete(id);changed=true}}return changed}
function openRecipeLockDialog(id){
 const item=byId.get(id);if(!item)return;pendingLockRecipeId=id;
 const req=moduleRequirement(item),premium=isPremiumRecipe(item),body=$('#recipe-lock-content'),untilBtn=$('.lock-until-btn'),dialog=$('#recipe-lock-dialog');dialog.dataset.mode=premium?'premium':'module';
 if(premium){
  const meta=premiumRecipeMeta[item.id]||{cost:1,currency:'Dream Spark',vendor:'Homeland Shop Robot (Seed Shop)'};
  body.innerHTML=`<div class="lock-dialog-head">${icon(item)}<div><div class="eyebrow">RECIPE AVAILABILITY</div><h2>${esc(item.name)}</h2><p><span class="recipe-premium-tag">Premium Recipe</span></p></div></div><p>This recipe is unlocked by buying it from the <b>${esc(meta.vendor)}</b> for <button type="button" class="dream-spark-link" data-dream-spark-info>${meta.cost} ${esc(meta.currency)}</button>.</p><div class="lock-dialog-note"><b>Avoid recipe</b> keeps it excluded until you manually re-enable it.</div><div id="dream-spark-info" class="dream-spark-info" hidden><img src="assets/dream_spark_info.png" alt="Dream Spark item information and ways to obtain it"></div><p class="hint">This does not change your <b>Premium Recipes</b> selection. You can always reverse it from <b>Avoided Recipes</b> in the left menu.</p>`;
  if(untilBtn)untilBtn.hidden=true;
 }else if(req){
  body.innerHTML=`<div class="lock-dialog-head">${icon(item)}<div><div class="eyebrow">RECIPE AVAILABILITY</div><h2>${esc(item.name)}</h2><p>${esc(req.label)} Lv.${req.level} required</p></div></div><p>This recipe unlocks with <b>${esc(req.label)} Lv.${req.level}</b>. You can unlock it by upgrading that module in the <b>Component Upgrade</b> menu.</p><div class="lock-dialog-note"><b>Avoid recipe</b> keeps it excluded until you manually re-enable it.<br><b>Avoid until unlocked</b> keeps it excluded until you later set ${esc(req.label)} to Lv.${req.level} or higher.</div><p class="hint">Neither of the options edits your set RV component Level. Either choice can always be reversed from <b>Avoided Recipes</b> in the left menu.</p>`;
  if(untilBtn)untilBtn.hidden=false;
 }else{return}
 dialog.showModal()
}
function resetConfig(){
 config=defaults(level);normalizeModuleLevels();if(advancedFacilityGroups){const sanitized=sanitizeAdvancedSetup({facilities:advancedFacilityGroups,modules:advancedModuleLevels||{}});advancedFacilityGroups=sanitized.facilities;advancedModuleLevels=sanitized.modules}
 $('#level-value').textContent=level;$('#level').value=level;const rvDuration=$('#hours option[value="rv"]');if(rvDuration)rvDuration.disabled=level>=20;if(level>=20&&plannerHours==='rv'){plannerHours='24';autoDurationFromUpgrade=false}
 const levelButtons=$('#level-buttons');if(levelButtons)levelButtons.innerHTML='';
 $('#facilities').innerHTML='<div class="facility-input"><span>Facility</span><span>Count</span><span>Level</span></div>'+data.facilities.filter(f=>config[f.name].count>0).map(f=>`<div class="facility-input"><span class="facility-name-cell">${facilityIconHtml(f.name,config[f.name].level||1)}<span>${esc(f.name)}</span></span><input type="number" min="0" max="${maxFacilityCount(f.name)}" value="${config[f.name].count}" data-facility="${esc(f.name)}" data-key="count" aria-label="${esc(f.name)} count">${noLevelFacilities.has(f.name)?'<span class="facility-no-level">—</span>':`<input type="number" min="1" max="${maxFacilityLevel(f.name)}" value="${config[f.name].level}" data-facility="${esc(f.name)}" data-key="level" aria-label="${esc(f.name)} level">`}</div>`).join('');
 $('#strategy').value=plannerStrategy;$('#hours').value=plannerHours;$('#bonus').checked=bonusEnabled;$('#climate').checked=climateEnabled;$('#light-climate-option').style.display=level>=9?'flex':'none';if(level>=9&&$('#light-climate'))$('#light-climate').checked=lightClimateEnabled;const eventOption=$('#event-mode-option'),eventInput=$('#events'),eventHint=$('#event-mode-hint');if(eventOption)eventOption.classList.toggle('disabled-option',level<EVENT_START_RV);if(eventInput){eventInput.checked=eventsEnabled;eventInput.disabled=level<EVENT_START_RV}if(eventHint)eventHint.textContent=level<EVENT_START_RV?'Unlocks at RV 10.':eventsEnabled?'1 Moondew Radish + 1 Waxing Moon Pepper farm are reserved; seeds are demand-capped.':'Reserves 2 Farmlands and uses event production while it stays within the 15% Home Coin threshold.';$$('[data-worker]').forEach(x=>x.classList.toggle('active',x.dataset.worker===workerMode));
 syncStrategyButtons();renderRecipeAvailability();renderSetupMode();saveUiState()
}
function title(t,sub,extra=''){return `<div class="page-title"><div><div class="eyebrow">HOMELAND / LEVEL ${level}</div><h1>${t}</h1><p class="subtitle">${sub}</p></div>${extra}</div>`}
function blank(){return title('Your Production Plan','Farmland, woodland, mines and crafting — optimized together.')+'<div class="loading"><span class="spinner"></span>Balancing production chains…</div>'}
async function calculate(){const my=++generation;busy=true;$('#optimize').disabled=true;pendingPlannerUpdate=null;renderPlannerUpdateButton();if(tab==='plan')$('#content').innerHTML=blank();const st=settings();try{const key=JSON.stringify(st);let r=cache.get(key);if(!r){r=await solve(st);cache.set(key,r)}let upgradePlan=null;if(level<20){const us={...st,strategy:'upgrade'};const uk=JSON.stringify(us);upgradePlan=cache.get(uk);if(!upgradePlan){upgradePlan=st.strategy==='upgrade'?r:await solve(us);cache.set(uk,upgradePlan)}}if(my!==generation)return;last={...r,settings:st,upgradePlan};acceptCurrentPlan(last);if(tab==='plan'){renderPlanV12();renderPlanQuickNav()}if(tab==='layout')renderLayout();renderOrderDock()}catch(e){if(my===generation)$('#content').innerHTML=title('Could not calculate this setup','Your settings have been kept.')+`<div class="note warn">${esc(e.message)}</div><button class="secondary" data-retry>Try again</button>`}finally{if(my===generation){busy=false;$('#optimize').disabled=false;restoreScroll()}}}
function duration(h){if(!isFinite(h)||h<=0)return 'Not reachable';const minutes=Math.max(1,Math.ceil(h*60-1e-9));if(minutes<60)return `${minutes} min`;if(minutes<2880){const hours=Math.floor(minutes/60),mins=minutes%60;return `${hours}h${mins?` ${mins}m`:''}`}const days=Math.floor(minutes/1440),rem=minutes-days*1440,hours=Math.floor(rem/60),mins=rem%60;return `${days}d${hours?` ${hours}h`:''}${mins?` ${mins}m`:''}`}
const upgradeChains=[['wood_block','rough_lumber','standard_planks','laminated_beams','densified_timber_component'],['mineral_sand','coarse_sifted_ore','sintered_ore_brick','refined_ore','microcrystalline_ore_plate']];
function upgradeRawNeed(id,amount){for(const chain of upgradeChains){const idx=chain.indexOf(id);if(idx<0)continue;let mult=1;for(let n=1;n<=idx;n++){const recipe=byId.get(chain[n]),need=recipe?.ingredients?.[chain[n-1]];if(!need)return null;mult*=need}return{raw:chain[0],rawAmount:amount*mult,mult}}return null}
function upgradeTiming(r){if(level>=20)return null;const target=data.levelUpCosts?.[String(level+1)];if(!target)return null;const coinRequired=target.coins*1.3,coinEta=coinRequired/Math.max(r.net,1e-9);const materials=Object.entries(target.items).map(([id,amount])=>{const raw=upgradeRawNeed(id,amount),rate=raw?(r.byproducts?.[raw.raw]||0):0,eta=raw&&rate>0?raw.rawAmount/rate:Infinity;return{id,amount,eta,raw,rate}});const total=Math.max(coinEta,...materials.map(x=>x.eta));return{target,coinRequired,coinEta,materials,total}}
function planPeriod(r){let selected=$('#hours').value;const timing=upgradeTiming(r);if(selected==='rv'&&timing&&isFinite(timing.total))return{hours:timing.total,label:`until RV ${level+1}`,title:`Until RV ${level+1}`,detail:duration(timing.total),timing};if(selected==='rv'){selected='24';$('#hours').value='24'}const hours=Math.max(0.01,Number(selected)||24);return{hours,label:`${fmt(hours,1).replace('.0','')}h`,title:`${fmt(hours,1).replace('.0','')} Hours`,detail:`${fmt(hours,1).replace('.0','')}h`,timing}}
function practicalFlows(r,hours){const saleMap=new Map(r.sales.map(s=>[s.id,s]));const food=r.food.map(x=>{const base=Math.ceil(x.quantity*hours-1e-9),saleWhole=Math.max(0,Math.floor((saleMap.get(x.id)?.quantity||0)*hours+1e-9)),wantedBuffer=Math.ceil(x.quantity*4-1e-9),buffer=Math.min(wantedBuffer,saleWhole);return{...x,base,buffer,total:base+buffer}});const bufferById=new Map(food.map(x=>[x.id,x.buffer]));const sales=r.sales.map(s=>{const units=Math.max(0,Math.floor(s.quantity*hours+1e-9)-(bufferById.get(s.id)||0));return{...s,units,revenue:units*s.price}}).filter(x=>x.units>0);const seeds=r.seeds.map(x=>{const units=Math.ceil(x.quantity*hours-1e-9),unitCost=x.quantity>1e-12?x.cost/x.quantity:(byId.get(x.id)?.cost||0);return{...x,units,totalCost:units*unitCost}}).filter(x=>x.units>0);return{food,sales,seeds,gross:sales.reduce((a,x)=>a+x.revenue,0),seedCost:seeds.reduce((a,x)=>a+x.totalCost,0)}}
function bonusOutputs(r,hours){const rows=r.rows.map(row=>({row,item:byId.get(row.id)}));const xp=rows.filter(x=>x.item?.currency==='aniimo_exp').map(({row,item})=>({id:item.id,name:item.name,units:Math.max(0,Math.floor(row.batches*hours+1e-9)*item.yield),value:item.price||0})).filter(x=>x.units>0);const pods=rows.filter(x=>x.item?.currency==='aniipods').map(({row,item})=>({id:item.id,name:item.name,units:Math.max(0,Math.floor(row.batches*hours+1e-9)*item.yield)})).filter(x=>x.units>0);return{xp,pods,totalXp:xp.reduce((a,x)=>a+x.units*x.value,0)}}
function climateProfile(r){const heat=r.climate.find(x=>x.building==='Heat Furnace')?.mode,cool=r.climate.find(x=>x.building==='Cooling Unit')?.mode;const hi=heat==='Scorching'?2:heat==='Warm'?1:0,lo=cool==='Freeze'?-2:cool==='Cool'?-1:0;return [...new Set([lo,0,hi,lo+hi])].sort((a,b)=>a-b).filter((x,i,a)=>i===0||x!==a[i-1]).map(x=>x>0?`+${x}`:x).join(' / ')}
function climateDiagram(r){
 if(!r.climate.length)return '<div class="empty">No climate-controlled production is used.</div>';
 const colors={Farmland:'#62bd83',Woodland:'#32a997',Large:'#9c7bd1','Heat Furnace':'#e9805b','Cooling Unit':'#58b9e8',Sunlamp:'#e9ce56'};
 return `<p class="hint climate-placement-note"><b>Only the crops/facilities shown in this section need special placement.</b> They must touch the required temperature or lighting range. Crops with no temperature/light requirement can be placed anywhere you want.</p><div class="climate-visual-toggle"><label class="check"><input type="checkbox" id="climate-icon-toggle" ${climateIconView?'checked':''}><span></span>Use facility icons</label></div><div class="climate-grid">${r.climate.map((c,ci)=>{
  const required=[];r.rows.forEach(row=>{const i=byId.get(row.id);if(i?.environment===c.mode&&row.plots)for(let n=0;n<row.plots;n++)required.push({name:i.name,facility:i.facility,size:i.facility==='Farmland'?2:i.facility==='Woodland'?4:5,facilityLevel:i.facilityLevel||1})});
  const used=[];for(const s of [5,4,2]){const group=required.filter(x=>x.size===s),slots=c.layout.filter(x=>x.s===s).sort((a,b)=>Math.hypot(a.x+a.s/2,a.y+a.s/2)-Math.hypot(b.x+b.s/2,b.y+b.s/2));group.forEach((item,n)=>{if(slots[n])used.push({...slots[n],...item})})}
  const minX=Math.min(-4.25,...used.map(x=>x.x-.5)),minY=Math.min(-4.25,...used.map(x=>x.y-.5)),maxX=Math.max(5.75,...used.map(x=>x.x+x.s+.5)),maxY=Math.max(5.75,...used.map(x=>x.y+x.s+.5));
  const deviceColor=colors[c.building],legend=[...new Map(used.map(x=>[`${x.name}|${x.facility}`,x])).values()];
  return `<figure class="climate-map"><div class="climate-visual"><svg viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}" role="img" aria-label="${esc(c.building)} ${esc(c.mode)} coverage"><defs><pattern id="g${ci}" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M 1 0 L 0 0 0 1" fill="none" stroke="#ffffff25" stroke-width=".04"/></pattern></defs><rect x="${minX}" y="${minY}" width="${maxX-minX}" height="${maxY-minY}" fill="url(#g${ci})"/><rect x="-3.5" y="-3.5" width="9" height="9" rx=".25" fill="${deviceColor}22" stroke="${deviceColor}" stroke-width=".14"/>${used.map(p=>`<g><rect x="${p.x}" y="${p.y}" width="${p.s}" height="${p.s}" rx=".12" fill="${colors[p.facility]||colors.Large}b8" stroke="#dff6ff" stroke-width=".09"/>${climateIconView&&facilityIconFor(p.facility,p.facilityLevel)?`<image href="${facilityIconFor(p.facility,p.facilityLevel)}" x="${p.x+.1}" y="${p.y+.1}" width="${Math.max(.6,p.s-.2)}" height="${Math.max(.6,p.s-.2)}" preserveAspectRatio="xMidYMid meet"/>`:''}</g>`).join('')}<g><rect x="0" y="0" width="2" height="2" rx=".15" fill="${deviceColor}" stroke="#fff8" stroke-width=".08"/>${climateIconView&&facilityIconFor(c.building,1)?`<image href="${facilityIconFor(c.building,1)}" x=".12" y=".12" width="1.76" height="1.76" preserveAspectRatio="xMidYMid meet"/>`:''}</g></svg><div class="climate-key"><div>${climateIconView&&facilityIconFor(c.building,1)?`<img class="climate-key-icon" src="${esc(facilityIconFor(c.building,1))}" alt="">`:`<i style="background:${deviceColor}"></i>`}<span><b>${esc(c.building)}</b><small>${esc(c.mode)} · 9×9 range</small></span></div>${legend.map(x=>`<div>${climateIconView&&facilityIconFor(x.facility,x.facilityLevel)?`<img class="climate-key-icon" src="${esc(facilityIconFor(x.facility,x.facilityLevel))}" alt="">`:`<i style="background:${colors[x.facility]||colors.Large}"></i>`}<span><b>${esc(x.name)}</b><small>${used.filter(y=>y.name===x.name&&y.facility===x.facility).length} × ${esc(x.facility)} · ${x.size}×${x.size}</small></span></div>`).join('')}</div></div><figcaption><b>${esc(c.building)} · ${esc(c.mode)}</b><small>Every shown facility overlaps the colored range and receives the full effect.</small></figcaption></figure>`;
 }).join('')}</div>`;
}
const abilityOrder=['Fire','Grass','Water','Earth','Lightning','Ice','Wind','Dark','Light','Hauling','Artisanship','Leisure','Perfumery'];
const abilityMeta={Fire:['fire','#ff4758'],Grass:['grass','#45b978'],Water:['water','#2b91f0'],Earth:['earth','#c0a273'],Lightning:['lightning','#e9c300'],Ice:['ice','#57c9df'],Wind:['wind','#42bfae'],Dark:['dark','#9653d5'],Light:['light','#f2a51a'],Hauling:['hauling','#5a78cc'],Artisanship:['artisanship','#59b94f'],Leisure:['leisure','#eb6b94'],Perfumery:['perfumery','#ae60ce']};
const hiddenAniimoRecommendations=new Set(['Fennelun','Fennolun','Soleon','Irisalis','Somniwing','Geoclaw']);
const familyRequirementByItem={wool:'Nimbi',quick_wool:'Nimbi',petals:'Iris',sea_salt:'Susuta',quick_sea_salt:'Susuta',pearl:'Shelly',aromathyst:'Dewy',quick_aromathyst:'Dewy',star:'Celestis',scales:'Flutternym',quick_scales:'Flutternym'};
const requiredFamily=item=>familyRequirementByItem[item?.id]||'';
const traitLevelText=value=>value==='Any'?'Any':`Lv. ${value}`;
const productionFamilyNote=item=>{const family=requiredFamily(item);return family?`<p class="family-requirement"><b>Needed: ${esc(family)} Family Aniimo</b><span>${esc(item.ability||'Leisure')} Lv.${Math.max(1,item.minAbility||1)}+</span></p>`:''};
const facilityPersonality=name=>data.facilities.find(f=>f.name===name)?.personality||'Any';
function workerJobDetails(r,ability){
 const out=[];
 const activeRowsForFacility=facility=>r.rows.filter(row=>{const item=byId.get(row.id);return row.facility===facility&&row.plots===null&&item?.ability===ability});
 const traitForItems=items=>{if(!items.length)return'Any';if(r.settings.worker!=='minimum')return Number(r.settings.worker)||3;const required=Math.max(...items.map(i=>Math.max(1,Number(i.minAbility)||1)));return required<=1?'Any':required};
 for(const[label,count]of Object.entries(r.staff)){
  if(label.split(/\s|·/)[0]!==ability)continue;
  let role='Homeland jobs',personality='Any',traitLevel='Any',families=[];
  if(label.endsWith(' crop work')){
   const cropRows=r.rows.filter(row=>{const item=byId.get(row.id);return row.plots!==null&&item?.steps?.some(s=>s.ability===ability)}),facilities=[...new Set(cropRows.map(row=>row.facility))];
   role=facilities.length?facilities.join(' / '):'Farmland / Woodland';
   const stepLevels=cropRows.flatMap(row=>(byId.get(row.id)?.steps||[]).filter(s=>s.ability===ability).map(s=>Number(s.minLevel||s.min_level||1)));
   traitLevel=stepLevels.length&&Math.max(...stepLevels)>1?Math.max(...stepLevels):'Any';
  }else if(label.includes(' · ')){
   role=label.split(' · ')[1].replace(/ personality$/,'');
   personality=facilityPersonality(role);
   const items=activeRowsForFacility(role).map(row=>byId.get(row.id)).filter(Boolean);
   traitLevel=traitForItems(items);
   families=[...new Set(items.map(requiredFamily).filter(Boolean))];
  }else if(label==='Hauling'){
   role='Hauling';traitLevel='Any';
  }else if(label.endsWith(' work')){
   const rows=r.rows.filter(row=>{const item=byId.get(row.id);return row.plots===null&&item?.ability===ability});
   const familyRows=rows.filter(row=>requiredFamily(byId.get(row.id)));
   if(familyRows.length){
    const grouped=new Map();
    for(const row of familyRows){const item=byId.get(row.id),family=requiredFamily(item),key=`${row.facility}|${family}`;const entry=grouped.get(key)||{count:0,role:row.facility,personality:facilityPersonality(row.facility),traitLevel:traitForItems([item]),families:[family]};entry.count+=Math.max(1,Math.round(Number(row.units)||1));if(r.settings.worker==='minimum'){const t=traitForItems([item]);if(t!=='Any'&&(entry.traitLevel==='Any'||Number(t)>Number(entry.traitLevel)))entry.traitLevel=t}else entry.traitLevel=traitForItems([item]);grouped.set(key,entry)}
    const familyJobs=[...grouped.values()];
    const used=familyJobs.reduce((n,j)=>n+j.count,0);
    out.push(...familyJobs);
    const remaining=Math.max(0,count-used);
    const nonFamilyRows=rows.filter(row=>!requiredFamily(byId.get(row.id)));
    if(remaining||nonFamilyRows.length){const facilities=[...new Set(nonFamilyRows.map(row=>row.facility))];out.push({count:remaining||count,role:facilities.length?facilities.join(' / '):'Compatible Homeland jobs',personality:'Any',traitLevel:traitForItems(nonFamilyRows.map(row=>byId.get(row.id)).filter(Boolean)),families:[]})}
    continue;
   }
   const facilities=[...new Set(rows.map(row=>row.facility))];
   role=facilities.length?facilities.join(' / '):'Compatible Homeland jobs';
   traitLevel=traitForItems(rows.map(row=>byId.get(row.id)).filter(Boolean));
  }
  out.push({count,role,personality,traitLevel,families});
 }
 return out;
}

function growGatherAvailabilityNote(item){
 if(item?.module)return `<div class="recipe-module-note grow-recipe-availability"><span>${esc(moduleRequirementLabel(item))}</span><button type="button" class="recipe-lock-btn" data-lock-recipe="${esc(item.id)}">Recipe locked in game?</button></div>`;
 if(isPremiumRecipe(item))return `<div class="recipe-module-note grow-recipe-availability"><span class="recipe-premium-tag">Premium Recipe</span><button type="button" class="recipe-lock-btn" data-lock-recipe="${esc(item.id)}">Recipe locked in game?</button></div>`;
 return '';
}
function craftingAvailabilityNote(item){
 if(item?.currency==='none')return `<div class="recipe-module-note"><span class="recipe-upgrade-tag">RV Upgrade Material</span></div>`;
 if(item?.module)return `<div class="recipe-module-note"><span>${esc(moduleRequirementLabel(item))}</span><button type="button" class="recipe-lock-btn" data-lock-recipe="${esc(item.id)}">Recipe locked in game?</button></div>`;
 if(isPremiumRecipe(item))return `<div class="recipe-module-note"><span class="recipe-premium-tag">Premium Recipe</span><button type="button" class="recipe-lock-btn" data-lock-recipe="${esc(item.id)}">Recipe locked in game?</button></div>`;
 return '';
}
function workerCards(r){
 const rank=a=>{const n=abilityOrder.indexOf(a);return n<0?999:n},grouped=new Map();
 for(const[label,count]of Object.entries(r.staff)){const ability=label.split(/\s|·/)[0],entry=grouped.get(ability)||{ability,count:0};entry.count+=count;grouped.set(ability,entry)}
 const totalAssigned=[...grouped.values()].reduce((n,x)=>n+x.count,0),cap=Math.max(0,Number(data.aniimo?.[level-1])||0),freeSlots=Math.max(0,cap-totalAssigned);
 const wateringSlots=freeSlots>=3?2:freeSlots>=1?1:0,flexSlots=Math.max(0,freeSlots-wateringSlots);
 if(wateringSlots){const entry=grouped.get('Water')||{ability:'Water',count:0};entry.watering=wateringSlots;grouped.set('Water',entry)}
 const cards=[...grouped.values()].sort((a,b)=>rank(a.ability)-rank(b.ability)).map(({ability,count,watering=0})=>{
  const names=(r.settings.worker==='minimum'?[]:data.workerSuggestions?.[ability]||[]).filter(name=>!hiddenAniimoRecommendations.has(name));
  const jobs=workerJobDetails(r,ability),[asset,color]=abilityMeta[ability]||['hauling','#7ecbfa'];
  const normalJobs=jobs.map(job=>`<div class="worker-job"><div class="worker-job-main"><span class="worker-job-count">${job.count}</span><span class="worker-job-role">Working in ${esc(job.role)}</span></div><div class="worker-job-meta"><div class="worker-job-personality">Rec Personality: ${personalityBadge(job.personality)}</div><div class="worker-job-trait">Trait ${traitLevelText(job.traitLevel)}</div>${job.families?.length?`<div class="worker-job-family">Needed: ${job.families.map(f=>`${esc(f)} Family Aniimo`).join(' / ')}</div>`:''}</div></div>`).join('');
  const wateringJob=watering?`<div class="worker-job watering-support-job"><div class="worker-job-main"><span class="worker-job-count">+${watering}</span><span class="worker-job-role">Watering Farmland / Woodland</span></div><div class="worker-job-meta"><div class="worker-job-personality">Uses otherwise-free slots to support the two-waterings grow-time assumption.</div></div></div>`:'';
  const displayCount=count+watering;
  return `<article class="worker-card" style="--ability-color:${color}"><div class="worker-ability"><b>${displayCount} × <span>${esc(ability)}</span>${watering?` <small class="worker-extra-note">${count} essential + ${watering} watering</small>`:''}</b><img src="assets/ability_${asset}.png" alt="${esc(ability)} ability"></div><div class="worker-jobs">${normalJobs}${wateringJob}</div>${names.length?`<div class="aniimo-options">${names.slice(0,5).map(name=>`<span>${aniimoIcon(name)}<small>${esc(name)}</small></span>`).join('')}</div>`:'<small>Any Aniimo meeting the displayed minimum ability.</small>'}<em>Once Aniimo are in the Homeland, the game automatically assigns them to the most suitable roles.</em>${ability==='Light'?'<em>Optional: Prismana Glacy; save Lunara/Helion for combat if preferred.</em>':''}</article>`;
 });
 if(flexSlots>0&&r.settings.worker!=='minimum'){
  const earth=(data.workerSuggestions?.Earth||[]).filter(name=>!hiddenAniimoRecommendations.has(name)).slice(0,3);
  const grass=(data.workerSuggestions?.Grass||[]).filter(name=>!hiddenAniimoRecommendations.has(name)).slice(0,3);
  const fire=(data.workerSuggestions?.Fire||[]).filter(name=>!hiddenAniimoRecommendations.has(name)).slice(0,3);
  cards.push(`<article class="worker-card flex-support-card" style="--ability-color:#8b6fc8"><div class="worker-ability"><b>${flexSlots} spare slot${flexSlots===1?'':'s'}</b><img src="assets/spare-slots-icon.png" alt="Spare slots"></div><div class="worker-jobs"><div class="worker-job"><div class="worker-job-main"><span class="worker-job-count">+${flexSlots}</span><span class="worker-job-role">Flexible Earth / Grass / Fire support</span></div><div class="worker-job-meta"><div class="worker-job-personality">Use Earth + Grass for farm-heavy plans, or Earth + Fire when smelting/cooking needs more help.</div></div></div></div><div class="aniimo-options grouped">${earth.length?`<span class="aniimo-group"><b>Earth</b>${earth.map(name=>`<span>${aniimoIcon(name)}<small>${esc(name)}</small></span>`).join('')}</span>`:''}${grass.length?`<span class="aniimo-group"><b>Grass</b>${grass.map(name=>`<span>${aniimoIcon(name)}<small>${esc(name)}</small></span>`).join('')}</span>`:''}${fire.length?`<span class="aniimo-group"><b>Fire</b>${fire.map(name=>`<span>${aniimoIcon(name)}<small>${esc(name)}</small></span>`).join('')}</span>`:''}</div><em>Watering support is already folded into the Water card; these are the remaining free Homeland slots.</em></article>`);
 }
 return cards.join('')||'<div class="empty">Manual crop tending</div>';
}

const ORDER_GROW_SWITCH_CAP={Farmland:5,Woodland:5};
const orderRecipeCandidates=product=>data.items.filter(i=>!i.byproductOnly&&i.product===product&&(i.seconds>0||i.workload>0));
function orderFacilityCount(name,minLevel=1){
 const f=activeFacilitiesConfig()?.[name];if(!f)return 0;let count=0;
 if(Array.isArray(f.levels))count=f.levels.filter(row=>(row.level||1)>=minLevel).reduce((n,row)=>n+(Number(row.count)||0),0);
 else if((f.level||1)>=minLevel)count=Number(f.count)||0;
 if(name==='Farmland'&&eventsEnabled&&level>=EVENT_START_RV)count=Math.max(0,count-2);
 return count;
}
function orderUnlockHelp(item){
 if(!item)return'No recipe data is available.';
 if(item.unlock>level)return `Unlocks at RV ${item.unlock}.`;
 if(EVENT_RECIPE_UNLOCK_IDS.has(item.id)){const meta=EVENT_RECIPE_UNLOCKS.find(x=>x.id===item.id);return `Unlock this Recipe Note in Harvest Moon Event → Recipes for ${meta?.cost||0} Moonray Wheat.`}
 if(isPremiumRecipe(item)){const meta=premiumRecipeMeta[item.id]||{cost:1,currency:'Dream Spark',vendor:'Homeland Shop Robot (Seed Shop)'};return `Buy this Premium Recipe from the ${meta.vendor} for ${meta.cost} ${meta.currency}.`;}
 const req=moduleRequirement(item);if(req)return `Upgrade ${req.label} to Lv.${req.level} in Component Upgrade.`;
 return `This is a normal ${item.facility} Lv.${item.facilityLevel} recipe. Check the in-game recipe list for its unlock requirement.`;
}
function orderRecipeAccess(item,order){
 if(!item)return{usable:false,hard:true,reason:'Missing recipe data'};
 const overrides=new Set(order?.overrides||[]),denied=new Set(order?.denied||[]);
 if(item.event&&!(eventsEnabled&&level>=EVENT_START_RV))return{usable:false,hard:true,reason:'Harvest Moon Event Mode is off',help:'Enable Harvest Moon Event Mode at RV 10+.'};
 if(item.unlock>level)return{usable:false,hard:true,reason:`Requires RV ${item.unlock}`,help:`Reach RV ${item.unlock}.`};
 if(orderFacilityCount(item.facility,item.facilityLevel)<1)return{usable:false,hard:true,reason:`No ${item.facility} Lv.${item.facilityLevel}+ available`,help:`Build or upgrade ${item.facility} to Lv.${item.facilityLevel}.`};
 if(overrides.has(item.id))return{usable:true,override:true};
 if(denied.has(item.id))return{usable:false,confirm:false,reason:'Marked locked for this order',help:orderUnlockHelp(item)};
 if(combinedAvoided().has(item.id))return{usable:false,confirm:true,reason:'Recipe is currently avoided',help:orderUnlockHelp(item)};
 if(EVENT_RECIPE_UNLOCK_IDS.has(item.id)&&!eventRecipeUnlocks.has(item.id))return{usable:false,confirm:true,reason:'Harvest Moon Recipe Note is not marked as unlocked',help:orderUnlockHelp(item)};
 if(isPremiumRecipe(item)&&!special.includes(item.id))return{usable:false,confirm:true,reason:'Premium Recipe is not marked as owned',help:orderUnlockHelp(item)};
 const req=moduleRequirement(item);if(req&&(activeModuleLevels()?.[req.key]||0)<req.level)return{usable:false,confirm:true,reason:`${req.label} is set below Lv.${req.level}`,help:orderUnlockHelp(item)};
 return{usable:true};
}
function orderCandidateScore(item,st){const seconds=Math.max(.001,cycle(item,st)),out=Math.max(.001,Number(item.yield)||1);return seconds/out}
function pickOrderRecipe(product,order){
 const st=settings(),candidates=orderRecipeCandidates(product).filter(i=>i.unlock<=level||orderRecipeAccess(i,order).confirm);
 const rows=candidates.map(item=>({item,access:orderRecipeAccess(item,order)}));
 const usable=rows.filter(x=>x.access.usable).sort((a,b)=>orderCandidateScore(a.item,st)-orderCandidateScore(b.item,st));
 if(usable.length)return{item:usable[0].item,access:usable[0].access};
 const confirm=rows.filter(x=>x.access.confirm).sort((a,b)=>orderCandidateScore(a.item,st)-orderCandidateScore(b.item,st));
 if(confirm.length)return{item:confirm[0].item,access:confirm[0].access};
 const denied=rows.find(x=>!x.access.usable);return denied||{item:null,access:{usable:false,hard:true,reason:`No usable recipe produces ${byId.get(product)?.name||product}`}};
}
function orderExistingSupply(){
 const supply=new Map();
 for(const row of last?.rows||[]){
  const item=byId.get(row.id);if(!item)continue;
  const rate=Math.max(0,Number(row.produced)||0);if(rate<=1e-9)continue;
  const e=supply.get(item.product)||{rate:0,reserved:0};e.rate+=rate;supply.set(item.product,e);
 }
 return supply;
}
function planOneOrder(order,supply){
 const demanded=Math.max(1,Math.floor(Number(order.quantity)||1)),target=byId.get(order.itemId);if(!target)return{blocked:{reason:'Unknown order item'},steps:[],reserved:[],eta:0};
 const steps=[],reserved=[];
 function need(product,quantity,path=new Set()){
  if(quantity<=1e-9)return{eta:0};
  if(path.has(product))return{blocked:{reason:`Recipe loop detected at ${product}`}};
  const existing=supply.get(product);
  if(existing?.rate>1e-9){
   existing.reserved+=quantity;reserved.push({id:product,quantity,rate:existing.rate});
   return{eta:existing.reserved/existing.rate*3600,existing:true};
  }
  const chosen=pickOrderRecipe(product,order),item=chosen.item,access=chosen.access;
  if(!item||!access.usable)return{blocked:{recipeId:item?.id||null,item,access,reason:access.reason||`No usable recipe for ${product}`,help:access.help||orderUnlockHelp(item)}};
  const batches=Math.ceil(quantity/Math.max(.001,Number(item.yield)||1)-1e-9),step={id:item.id,item,batches,quantity:batches*(Number(item.yield)||1)};steps.push(step);
  const nextPath=new Set(path);nextPath.add(product);let ingredientEta=0;
  for(const[id,n]of Object.entries(item.ingredients||{})){const child=need(id,batches*n,nextPath);if(child.blocked)return child;ingredientEta=Math.max(ingredientEta,child.eta||0)}
  const availableUnits=Math.max(1,orderFacilityCount(item.facility,item.facilityLevel));
  const cap=ORDER_GROW_SWITCH_CAP[item.facility]||1;
  const units=Math.max(1,Math.min(availableUnits,cap,Math.max(1,batches)));
  const totalSeconds=batches*cycle(item,settings()),ownSeconds=totalSeconds/units;
  step.units=units;step.totalSeconds=totalSeconds;step.durationSeconds=ownSeconds;
  return{eta:ingredientEta+ownSeconds};
 }
 const result=need(order.itemId,demanded);return{blocked:result.blocked||null,steps,reserved,eta:result.eta||0,target,demanded};
}
function donorCapacity(row){return row.plots!==null?Math.max(0,Math.floor(Number(row.plots)||0)):Math.max(0,Math.floor(Number(row.units)||0))}
function donorEnvironment(id){return byId.get(id)?.environment||''}
function assignOrderSwitches(steps){
 const pools=new Map(),usedByRow=new Map(),switches=[];
 for(const row of last?.rows||[]){const cap=donorCapacity(row);if(cap<=0)continue;const arr=pools.get(row.facility)||[];arr.push({row,cap});pools.set(row.facility,arr)}
 for(const step of steps){
  let left=Math.max(1,Math.floor(step.units||1)),adjusted=step.durationSeconds||0;
  const donors=(pools.get(step.item.facility)||[]).filter(x=>x.row.id!==step.id).sort((a,b)=>b.cap-a.cap);
  for(const d of donors){
   if(left<=0)break;const used=usedByRow.get(d.row.id)||0,free=Math.max(0,d.cap-used);if(!free)continue;
   const take=Math.min(left,free);usedByRow.set(d.row.id,used+take);left-=take;
   const fromEnv=donorEnvironment(d.row.id),toEnv=step.item.environment||'',needsLight=toEnv==='Adequate',tempMismatch=!needsLight&&toEnv!==fromEnv&&(toEnv||fromEnv);
   const factor=tempMismatch?1.25:1;adjusted=Math.max(adjusted,(step.durationSeconds||0)*factor);
   switches.push({facility:step.item.facility,count:take,fromId:d.row.id,toId:step.id,durationSeconds:(step.durationSeconds||0)*factor,tempMismatch:!!tempMismatch,needsLight});
  }
  if(left>0)switches.push({facility:step.item.facility,count:left,fromId:null,toId:step.id,durationSeconds:step.durationSeconds||0,tempMismatch:false,needsLight:(step.item.environment||'')==='Adequate'});
  step.adjustedDurationSeconds=adjusted;
 }
 return{switches,borrowed:usedByRow};
}
function mergeOrderPlans(){
 const supply=orderExistingSupply(),perOrder=[],merged=new Map(),reserved=new Map();let blocked=null,eta=0;
 for(const order of orders){const plan=planOneOrder(order,supply);perOrder.push({order,plan});if(plan.blocked&&!blocked)blocked={order,...plan.blocked};eta=Math.max(eta,plan.eta||0);for(const st of plan.steps){const e=merged.get(st.id)||{...st,batches:0,units:st.units||1};e.batches+=st.batches;e.quantity=e.batches*(Number(st.item.yield)||1);e.totalSeconds=e.batches*cycle(st.item,settings());const cap=ORDER_GROW_SWITCH_CAP[st.item.facility]||1;e.units=Math.max(1,Math.min(orderFacilityCount(st.item.facility,st.item.facilityLevel),cap,e.batches));e.durationSeconds=e.totalSeconds/e.units;merged.set(st.id,e)}for(const r of plan.reserved)reserved.set(r.id,(reserved.get(r.id)||0)+r.quantity)}
 const steps=[...merged.values()].map(step=>({...step,available:orderFacilityCount(step.item.facility,step.item.facilityLevel),kind:step.item.seconds?'grow':Object.keys(step.item.ingredients||{}).length?'craft':'gather'}));
 const impossible=steps.find(st=>st.available<1);if(impossible&&!blocked)blocked={reason:`No ${impossible.item.facility} is available for ${impossible.item.name}.`,help:`Build or enable ${impossible.item.facility}.`};
 const assigned=assignOrderSwitches(steps);for(const st of steps)eta=Math.max(eta,st.adjustedDurationSeconds||0);
 return{perOrder,steps,reserved,blocked,eta,switches:assigned.switches,borrowed:assigned.borrowed};
}
function orderDisplayName(item,facility){
 if(!item)return'idle';
 if(facility==='Farmland'||facility==='Woodland')return byId.get(item.product)?.name||item.name;
 return item.name;
}
function orderSwitchLabel(sw){
 const from=sw.fromId?byId.get(sw.fromId):null,to=byId.get(sw.toId),n=sw.count,fromName=orderDisplayName(from,sw.facility),toName=orderDisplayName(to,sw.facility);
 if(sw.facility==='Farmland')return `${n} ${from?esc(fromName):'idle'} Farm${n===1?'':'s'} → ${n} ${esc(toName)} Farm${n===1?'':'s'}`;
 if(sw.facility==='Woodland')return `${n} ${from?esc(fromName):'idle'} Woodland${n===1?'':'s'} → ${n} ${esc(toName)} Woodland${n===1?'':'s'}`;
 return `${n} ${from?esc(fromName):'idle'} → ${n} ${esc(toName)} on ${esc(sw.facility)}`;
}
function orderSwitchCard(sw){
 const from=sw.fromId?byId.get(sw.fromId):null,to=byId.get(sw.toId),n=sw.count,fromName=orderDisplayName(from,sw.facility),toName=orderDisplayName(to,sw.facility);
 const fromLabel=`${n} × ${from?esc(fromName):'Idle'}`;
 const toLabel=`${n} × ${esc(toName)}`;
 return `<div class="order-switch-row"><div class="order-switch-change"><div class="order-switch-side order-switch-from">${from?icon(from):'<span class="order-idle-icon">—</span>'}<div><small>REPLACE</small><b>${fromLabel}</b><em>${esc(sw.facility)}</em></div></div><span class="order-switch-arrow">→</span><div class="order-switch-side order-switch-to">${icon(to)}<div><small>REPLACE WITH THIS FOR THE ORDER</small><b>${toLabel}</b><em>${esc(sw.facility)}</em></div></div></div><div class="order-switch-meta"><span>${duration(sw.durationSeconds/3600)}</span><small>${sw.needsLight?'Put only this temporary crop in Sunlamp/light coverage.':sw.tempMismatch?'Keep the current heater/cooler setup; estimate includes ~25% slower growth.':'No layout change needed.'}</small></div></div>`;
}
function renderOrderPlanSection(analysis){
 if(!orders.length)return'';
 const activeOrders=(analysis?.perOrder||[]).map(({order,plan})=>{const item=byId.get(order.itemId);return `<article class="override-order-card ${plan?.blocked?'blocked':''}">${icon(item)}<div><b>${esc(item?.name||order.itemId)} × ${Math.max(1,Math.floor(Number(order.quantity)||1))}</b><small>${plan?.blocked?'Recipe check needed':plan?.eta?`Approx. ${duration(plan.eta/3600)}`:'Uses current production'}</small></div>${plan?.blocked?`<button type="button" class="secondary" data-order-resolve="${esc(order.id)}">Check recipe</button>`:`<button type="button" class="order-complete override-complete" data-order-complete="${esc(order.id)}">Complete</button>`}</article>`}).join('');
 if(analysis?.blocked)return `<section class="order-plan-section blocked"><div class="section-head"><h2>Order Overrides</h2><span>Temporary only</span></div><div class="override-order-list">${activeOrders}</div><div class="order-plan-warning"><b>Recipe check needed.</b> ${esc(analysis.blocked.reason||'Resolve the affected order below.')}</div></section>`;
 const switches=analysis?.switches||[],count=switches.reduce((n,x)=>n+x.count,0);
 return `<section class="order-plan-section"><div class="section-head"><h2>Order Overrides</h2><span>Only these assignments change · everything returns automatically when the order is complete</span></div><div class="override-order-list">${activeOrders}</div><div class="order-plan-card"><div class="order-plan-head"><div><b>${switches.length?`${count} temporary switch${count===1?'':'es'}`:'No facility switches needed'}</b><small>${analysis?.eta?`Approx. combined order run: ${duration(analysis.eta/3600)}`:'Use current production'}</small></div></div>${switches.length?`<div class="order-switch-grid">${switches.map(orderSwitchCard).join('')}</div>`:`<p>Everything required is already produced by the permanent plan. Divert only the required output to the orders; downstream ingredients can stockpile until the orders are finished.</p>`}</div></section>`;
}
function orderSelectableItems(){
 const seen=new Set(),items=[];for(const i of data.items){if(i.byproductOnly||!Object.keys(i.ingredients||{}).length||i.unlock>level)continue;if(i.event&&!(eventsEnabled&&level>=EVENT_START_RV))continue;if(seen.has(i.id))continue;seen.add(i.id);items.push(i)}
 return items.sort((a,b)=>a.name.localeCompare(b.name));
}
function eventOrderSelectableItems(){return orderSelectableItems().filter(i=>i.event).sort((a,b)=>a.name.localeCompare(b.name))}
function isEventOrder(order){return !!byId.get(order?.itemId)?.event}
function ensureOrderDock(){
 if($('#order-dock'))return;
 document.body.insertAdjacentHTML('beforeend',`<div id="order-dock" class="order-dock"></div><dialog id="order-recipe-dialog" class="recipe-lock-dialog order-recipe-dialog"><div id="order-recipe-content"></div><div class="lock-dialog-actions order-lock-actions"><button type="button" class="primary" data-order-recipe-choice="yes">Unlocked — use for this order</button><button type="button" class="secondary danger-soft" data-order-recipe-choice="no">It is locked</button><button type="button" class="secondary" data-order-recipe-choice="cancel">Cancel</button></div></dialog>`);
}
function positionSuggestionBox(input,box,direction='down'){
 if(!input||!box||box.hidden)return;const r=input.getBoundingClientRect(),gap=6,max=Math.min(320,Math.max(120,(direction==='up'?r.top:window.innerHeight-r.bottom)-18));
 box.style.position='fixed';box.style.left=`${Math.max(8,r.left)}px`;box.style.width=`${Math.max(220,r.width)}px`;box.style.maxHeight=`${max}px`;box.style.right='auto';
 if(direction==='up'){box.style.top='auto';box.style.bottom=`${Math.max(8,window.innerHeight-r.top+gap)}px`}else{box.style.bottom='auto';box.style.top=`${Math.min(window.innerHeight-80,r.bottom+gap)}px`}
}
function renderOrderSuggestions(query=''){
 const box=$('#order-suggestions');if(!box)return;const q=query.trim().toLowerCase();if(!q){box.hidden=true;box.innerHTML='';return}
 const rows=orderSelectableItems().filter(i=>i.name.toLowerCase().includes(q)).slice(0,10);
 box.innerHTML=rows.map(i=>`<button type="button" data-order-suggest="${esc(i.id)}">${icon(i)}<span>${esc(i.name)}<small>${esc(i.facility)}</small></span></button>`).join('');box.hidden=!rows.length;if(rows.length)requestAnimationFrame(()=>positionSuggestionBox($('#order-item-input'),box,'up'));
}
function renderEventOrderSuggestions(query=''){
 const box=$('#event-order-suggestions');if(!box)return;const q=query.trim().toLowerCase();if(!q){box.hidden=true;box.innerHTML='';return}
 const rows=eventOrderSelectableItems().filter(i=>i.name.toLowerCase().includes(q)).slice(0,10);
 box.innerHTML=rows.map(i=>`<button type="button" data-event-order-suggest="${esc(i.id)}">${icon(i)}<span>${esc(i.name)}<small>${esc(i.facility)}</small></span></button>`).join('');box.hidden=!rows.length;
}
function renderOrderDock(){
 ensureOrderDock();const root=$('#order-dock'),analysis=orders.length?mergeOrderPlans():null,activeCount=orders.length;
 const cards=orders.map(o=>{const item=byId.get(o.itemId),p=analysis?.perOrder.find(x=>x.order.id===o.id)?.plan,status=p?.blocked?`<span class="order-status blocked">Needs recipe check</span>`:`<span class="order-status ready">Ready</span>`;return `<article class="order-card"><div class="order-card-main">${icon(item)}<div><b>${esc(item?.name||o.itemId)}</b>${status}</div><input type="number" min="1" step="1" value="${Math.max(1,Math.floor(Number(o.quantity)||1))}" data-order-qty="${esc(o.id)}" aria-label="Order quantity"></div><div class="order-card-reward"><label>${isEventOrder(o)?'Moonray reward':'Optional event reward'} <input type="number" min="0" step="1" value="${Math.max(0,Number(o.reward)||0)}" data-order-reward="${esc(o.id)}"></label></div>${p?.blocked?`<p class="order-blocked-text">${esc(p.blocked.reason)}${p.blocked.help?` · ${esc(p.blocked.help)}`:''}</p><button type="button" class="order-mini-btn" data-order-resolve="${esc(o.id)}">Check recipe</button>`:''}<div class="order-card-actions"><button type="button" class="order-complete" data-order-complete="${esc(o.id)}">Complete order</button><button type="button" class="order-done" data-order-remove="${esc(o.id)}">Remove</button></div></article>`}).join('');
 const quick=orders.map(o=>{const item=byId.get(o.itemId);return `<button type="button" class="order-quick-icon ${isEventOrder(o)?'event-order':''}" data-order-quick-complete="${esc(o.id)}" title="Complete ${esc(item?.name||o.itemId)} × ${Math.max(1,Math.floor(Number(o.quantity)||1))}">${icon(item)}<span>✓</span></button>`}).join('');
 root.innerHTML=`<section class="order-panel" ${orderDockOpen?'':'hidden'}><header><div><span class="eyebrow">TEMPORARY OVERRIDES</span><h3>Order Solver</h3></div><button type="button" class="order-close" data-order-toggle aria-label="Close orders">×</button></header><p class="order-intro">Add normal orders here. Event recipes can also be added directly from Harvest Moon → Orders & Tasks. Only the smallest required part of the permanent plan is borrowed temporarily.</p><div class="order-add"><div class="order-search-wrap"><input id="order-item-input" placeholder="Recipe / item…" autocomplete="off"><div id="order-suggestions" class="order-suggestions" hidden></div></div><input id="order-item-qty" type="number" min="1" value="1" aria-label="Order quantity"><button type="button" data-order-add>Add</button></div><div class="order-list">${cards||'<p class="muted">No active orders. Add as many as you currently have in game.</p>'}</div></section><div class="order-fab-row"><div class="order-quick-icons">${quick}</div><button type="button" class="order-fab ${activeCount?'has-orders':''}" data-order-toggle><span>Orders</span><b>${activeCount}</b></button></div>`;
}
function resolveOrderInput(){
 const input=$('#order-item-input'),qty=$('#order-item-qty');if(!input||!qty)return;
 const selected=input.dataset.selectedId,item=selected?byId.get(selected):orderSelectableItems().find(i=>i.name.toLowerCase()===input.value.trim().toLowerCase()||i.id.toLowerCase()===input.value.trim().toLowerCase());
 if(!item){input.setCustomValidity('Choose an item from the recipe list.');input.reportValidity();return}
 input.setCustomValidity('');orders.push({id:`o${Date.now()}_${Math.random().toString(36).slice(2,7)}`,itemId:item.id,quantity:Math.max(1,Math.floor(Number(qty.value)||1)),reward:0,overrides:[],denied:[]});input.value='';delete input.dataset.selectedId;qty.value='1';saveUiState();renderOrderDock();if(tab==='plan'&&last)renderPlanV12();renderEventCenter();setTimeout(()=>promptOrderRecipeIssue(orders[orders.length-1]?.id),0)
}
function resolveEventOrderInput(){
 const input=$('#event-order-item-input'),qty=$('#event-order-item-qty');if(!input||!qty)return;
 const selected=input.dataset.selectedId,item=selected?byId.get(selected):eventOrderSelectableItems().find(i=>i.name.toLowerCase()===input.value.trim().toLowerCase()||i.id.toLowerCase()===input.value.trim().toLowerCase());
 if(!item||!item.event){input.setCustomValidity('Choose a Harvest Moon event recipe from the list.');input.reportValidity();return}
 input.setCustomValidity('');const order={id:`o${Date.now()}_${Math.random().toString(36).slice(2,7)}`,itemId:item.id,quantity:Math.max(1,Math.floor(Number(qty.value)||1)),reward:0,overrides:[],denied:[]};orders.push(order);saveUiState();renderOrderDock();renderEventCenter();if(tab==='plan'&&last)renderPlanV12();setTimeout(()=>promptOrderRecipeIssue(order.id),0)
}
function completeOrder(orderId){
 const order=orders.find(o=>o.id===orderId);if(!order)return;
 eventCurrency+=Math.max(0,Number(order.reward)||0);orders=orders.filter(o=>o.id!==orderId);saveUiState();renderOrderDock();renderEventCenter();if(tab==='plan'&&last)renderPlanV12();
}
function promptOrderRecipeIssue(orderId){const order=orders.find(o=>o.id===orderId);if(!order)return;const plan=planOneOrder(order,orderExistingSupply()),b=plan.blocked;if(!b?.recipeId||!b.item||!b.access?.confirm)return;pendingOrderRecipeCheck={orderId,recipeId:b.recipeId};const i=b.item,isEventUnlock=EVENT_RECIPE_UNLOCK_IDS.has(i.id);$('#order-recipe-content').innerHTML=`<div class="lock-dialog-head">${icon(i)}<div><div class="eyebrow">ORDER RECIPE CHECK</div><h2>${esc(i.name)}</h2><p>${esc(b.reason)}</p></div></div><p>The permanent planner currently treats this recipe as locked or avoided. Is it actually unlocked in your game?</p><div class="lock-dialog-note"><b>If yes:</b> ${isEventUnlock?'it will be used for this order and also marked as unlocked in Harvest Moon → Recipes without spending Moonray Wheat.':'it will be used for this order only. Your Event/Premium unlocks, component levels, and Avoided Recipes settings will not change.'}<br><b>If no:</b> ${esc(b.help||orderUnlockHelp(i))}</div>`;$('#order-recipe-dialog').showModal()}
function orderRecipeChoice(choice){const pending=pendingOrderRecipeCheck;if(!pending)return;const order=orders.find(o=>o.id===pending.orderId),dialog=$('#order-recipe-dialog');if(!order){dialog.close();pendingOrderRecipeCheck=null;return}if(choice==='yes'){order.overrides=[...new Set([...(order.overrides||[]),pending.recipeId])];order.denied=(order.denied||[]).filter(id=>id!==pending.recipeId);if(EVENT_RECIPE_UNLOCK_IDS.has(pending.recipeId))eventRecipeUnlocks.add(pending.recipeId)}else if(choice==='no'){order.denied=[...new Set([...(order.denied||[]),pending.recipeId])];order.overrides=(order.overrides||[]).filter(id=>id!==pending.recipeId)}dialog.close();pendingOrderRecipeCheck=null;saveUiState();renderOrderDock();renderEventCenter();if(tab==='plan'&&last)renderPlanV12();if(choice==='yes')setTimeout(()=>promptOrderRecipeIssue(order.id),0)}

function ensureEventCenter(){
 if(!$('#event-center-btn')){
  const nav=document.querySelector('nav');
  nav?.insertAdjacentHTML('beforebegin',`<button type="button" id="event-center-btn" class="event-center-btn" data-event-open><img src="assets/event/moonray_wheat.png" alt=""><span><b>Harvest Moon</b><small>Event Center</small></span><strong id="event-center-progress">0/25</strong></button>`);
 }
 if(!$('#event-center-dialog'))document.body.insertAdjacentHTML('beforeend',`<dialog id="event-center-dialog" class="event-center-dialog"><div id="event-center-content"></div></dialog>`);
}
function updateEventButton(){
 ensureEventCenter();const btn=$('#event-center-btn'),progress=$('#event-center-progress');if(!btn)return;
 const unlocked=eventRecipeUnlocks.size+eventFurnitureUnlocks.size;if(progress)progress.textContent=`${unlocked}/${EVENT_RECIPE_UNLOCKS.length+EVENT_FURNITURE.length}`;
 btn.classList.toggle('event-active',eventsEnabled&&level>=EVENT_START_RV);btn.classList.toggle('event-locked',level<EVENT_START_RV);
 const small=btn.querySelector('small');if(small)small.textContent=level<EVENT_START_RV?'Unlocks at RV 10':eventsEnabled?'Event Mode active':'Event Center';
}
function eventRewardForTask(id){const t=EVENT_TASKS.find(x=>x.id===id);return Math.max(0,Number(eventTaskRewards[id]??t?.defaultReward??0))}
function renderEventOrdersTasks(){
 const eventOrders=orders.filter(isEventOrder);
 const orderRows=eventOrders.map(o=>{const i=byId.get(o.itemId);return `<article class="event-order-row">${icon(i)}<div class="event-order-name"><b>${esc(i?.name||o.itemId)}</b><small>Quantity: ${Math.max(1,Math.floor(Number(o.quantity)||1))}</small></div><label>Moonray reward<input type="number" min="0" step="1" value="${Math.max(0,Number(o.reward)||0)}" data-event-order-reward="${esc(o.id)}"></label><button type="button" class="event-complete-btn" data-event-order-complete="${esc(o.id)}">Complete</button></article>`}).join('');
 const tasks=EVENT_TASKS.map(t=>{const done=!!eventTaskDone[t.id],reward=eventRewardForTask(t.id);return `<article class="event-task-row ${done?'done':''}"><div><b>${esc(t.label)}</b><small>${done?'Completed for this daily set':'Daily task'}</small></div><label>Moonray reward<input type="number" min="0" step="1" value="${reward}" data-event-task-reward="${esc(t.id)}" ${done?'disabled':''}></label><button type="button" class="event-complete-btn" data-event-task-complete="${esc(t.id)}" ${done?'disabled':''}>${done?'Done':`Complete +${fmt(reward)}`}</button></article>`}).join('');
 return `<div class="event-mode-row"><label class="check switch"><input type="checkbox" data-event-mode-popup ${eventsEnabled?'checked':''} ${level<EVENT_START_RV?'disabled':''}><span></span>Reserve 2 Farmlands for Harvest Moon</label><small>${level<EVENT_START_RV?'Available from RV 10.':'1 Moondew Radish + 1 Waxing Moon Pepper. May earn a little fewer Home Coins than normal mode in exchange for stacking Harvest Moon progress.'}</small></div><div class="event-subhead"><div><h3>Season Orders</h3><p>Add Harvest Moon orders here. They also appear beside the floating Orders button and in the main Order Overrides section.</p></div></div><div class="event-order-add"><div class="event-order-search-wrap"><input id="event-order-item-input" placeholder="Search event recipe…" autocomplete="off"><div id="event-order-suggestions" class="order-suggestions event-order-suggestions" hidden></div></div><input id="event-order-item-qty" type="number" min="1" value="1" aria-label="Event order quantity"><button type="button" data-event-order-add>Add event order</button></div><div class="event-order-list">${orderRows||'<div class="event-empty">No active Harvest Moon orders. Search an event recipe above to add one.</div>'}</div><div class="event-subhead"><div><h3>Daily Tasks</h3><p>Defaults match your supplied screenshot: four tasks at 150 Moonray Wheat each.</p></div><button type="button" class="secondary" data-event-reset-tasks>Reset daily tasks</button></div><div class="event-task-list">${tasks}</div>`;
}
function renderEventRecipes(){
 return `<div class="event-unlock-summary"><b>${eventRecipeUnlocks.size}/${EVENT_RECIPE_UNLOCKS.length} Recipe Notes unlocked</b><span>${EVENT_RECIPE_UNLOCKS.reduce((n,x)=>n+x.cost,0)} Moonray Wheat total</span></div><div class="event-unlock-grid">${EVENT_RECIPE_UNLOCKS.map(meta=>{const i=byId.get(meta.id),owned=eventRecipeUnlocks.has(meta.id),paid=eventRecipePaidUnlocks.has(meta.id),canBuy=eventCurrency>=meta.cost;return `<article class="event-unlock-card ${owned?'owned':''}">${icon(i)}<div><b>${esc(i?.name||meta.id)}</b><small>Recipe Note · ${meta.cost} Moonray Wheat${owned?(paid?' · paid from balance':' · order-confirmed / free toggle'):''}</small></div><button type="button" data-event-recipe-unlock="${esc(meta.id)}" ${!owned&&!canBuy?'disabled':''}>${owned?'Unlocked · click to lock':canBuy?`Unlock · ${meta.cost}`:`Need ${fmt(meta.cost-eventCurrency)} more`}</button></article>`}).join('')}</div><p class="event-footnote">Moondew Radish Slices and Roasted Waxing Moon Pepper are the base event recipes. The four Recipe Notes above are the purchasable unlocks from your screenshots. Confirming one through an event order also marks it unlocked here without spending Moonray Wheat. Clicking an unlocked Recipe Note locks it again; a refund is only given if the unlock was originally paid from this tracked balance.</p>`;
}
function renderEventFurniture(){
 const spent=EVENT_FURNITURE.filter(x=>eventFurnitureUnlocks.has(x.id)).reduce((n,x)=>n+x.cost,0);
 return `<div class="event-unlock-summary"><b>${eventFurnitureUnlocks.size}/${EVENT_FURNITURE.length} Furniture Blueprints unlocked</b><span>${fmt(spent)} / ${fmt(EVENT_FURNITURE.reduce((n,x)=>n+x.cost,0))} Moonray Wheat tracked</span></div><div class="event-furniture-grid">${EVENT_FURNITURE.map(f=>{const owned=eventFurnitureUnlocks.has(f.id),canBuy=eventCurrency>=f.cost;return `<article class="event-furniture-card ${owned?'owned':''}"><img src="${esc(f.img)}" alt="${esc(f.name)}"><div><b>${esc(f.name)}</b><small>${f.cost} Moonray Wheat</small></div><button type="button" data-event-furniture-unlock="${esc(f.id)}" ${owned||!canBuy?'disabled':''}>${owned?'Unlocked':canBuy?`Unlock · ${f.cost}`:`Need ${fmt(f.cost-eventCurrency)} more`}</button></article>`}).join('')}</div><p class="event-footnote">The card crops are taken directly from your supplied in-game screenshots. A few long blueprint names are shortened in the text label where the screenshot itself cuts the name off.</p>`;
}
function renderEventCenter(){
 ensureEventCenter();updateEventButton();const root=$('#event-center-content');if(!root)return;
 const totalUnlocked=eventRecipeUnlocks.size+eventFurnitureUnlocks.size,totalUnlocks=EVENT_RECIPE_UNLOCKS.length+EVENT_FURNITURE.length;
 const tabs=[['orders','Orders & Tasks'],['recipes','Recipes'],['furniture','Furniture']];
 let body=eventActiveTab==='recipes'?renderEventRecipes():eventActiveTab==='furniture'?renderEventFurniture():renderEventOrdersTasks();
 root.innerHTML=`<div class="event-dialog-head"><div><span class="eyebrow">HARVEST MOON FESTIVAL</span><h2>Event Center</h2><p>${totalUnlocked}/${totalUnlocks} permanent unlocks tracked · ${fmt(EVENT_PERMANENT_UNLOCK_TOTAL)} Moonray Wheat total</p></div><div class="event-currency-box"><img src="assets/event/moonray_wheat.png" alt=""><label>Moonray Wheat<input id="event-currency-input" type="number" min="0" step="1" value="${Math.max(0,Math.floor(eventCurrency))}"></label></div><button type="button" class="event-dialog-close" data-event-close aria-label="Close">×</button></div><div class="event-tabs">${tabs.map(([id,label])=>`<button type="button" data-event-tab="${id}" class="${eventActiveTab===id?'active':''}">${label}</button>`).join('')}</div><div class="event-dialog-body">${body}</div>`;
}
function spendEventCurrency(cost){cost=Math.max(0,Number(cost)||0);if(eventCurrency+1e-9<cost)return false;eventCurrency-=cost;return true}
function toggleEventRecipeUnlock(id){const meta=EVENT_RECIPE_UNLOCKS.find(x=>x.id===id);if(!meta)return;if(eventRecipeUnlocks.has(id)){eventRecipeUnlocks.delete(id);if(eventRecipePaidUnlocks.has(id)){eventCurrency+=meta.cost;eventRecipePaidUnlocks.delete(id)}saveUiState();last=null;cache.clear();renderEventCenter();if(tab==='plan'||tab==='layout'){if(tab==='layout')markLayoutPlannerStale();calculate()}return}if(!spendEventCurrency(meta.cost))return;eventRecipeUnlocks.add(id);eventRecipePaidUnlocks.add(id);saveUiState();last=null;cache.clear();renderEventCenter();if(tab==='plan'||tab==='layout'){if(tab==='layout')markLayoutPlannerStale();calculate()}}
function unlockEventFurniture(id){const meta=EVENT_FURNITURE.find(x=>x.id===id);if(!meta||eventFurnitureUnlocks.has(id)||!spendEventCurrency(meta.cost))return;eventFurnitureUnlocks.add(id);saveUiState();renderEventCenter()}
function completeEventTask(id){if(eventTaskDone[id])return;eventCurrency+=eventRewardForTask(id);eventTaskDone[id]=true;saveUiState();renderEventCenter()}

function renderPlan(){if(!last||last.level!==level){$('#content').innerHTML=blank();return}const r=last,hours=+$('#hours').value;const staff=Object.values(r.staff).reduce((a,b)=>a+b,0);const growers=r.rows.filter(x=>x.plots!==null),processing=r.rows.filter(x=>x.plots===null);const groups=[...new Set(growers.map(x=>x.facility).concat(processing.filter(x=>!Object.keys(byId.get(x.id).ingredients).length).map(x=>x.facility)))];const consumed={};for(const row of r.rows){for(const[id,n]of Object.entries(byId.get(row.id).ingredients))consumed[id]=(consumed[id]||0)+row.batches*n}
const cards=groups.map(f=>{const rs=r.rows.filter(x=>x.facility===f);return `<article class="production-card"><h3>${esc(f)}<small>${eventFacilityLabel(f)}</small></h3>${rs.map(row=>{const i=byId.get(row.id),sale=r.sales.find(s=>s.id===i.product);return `<div class="product-row">${icon(i)}<div><b>${itemButton(row.id)}</b><p>${row.plots!==null?`${row.plots} plots · ${fmt(row.batches*hours,1)} harvests`:`${row.units??1} assigned · ${fmt(row.machineHours*100)}% busy`}</p><span class="qty">${fmt(row.produced*hours,1)} produced / ${hours}h</span>${productionFamilyNote(i)}<p>${consumed[i.product]>0?`${fmt(consumed[i.product]*hours,1)} → crafting`:''}${sale?`${consumed[i.product]>0?' · ':''}${fmt(sale.quantity*hours,1)} → sell`:''}</p></div></div>`}).join('')}</article>`}).join('');
const craft=processing.filter(x=>Object.keys(byId.get(x.id).ingredients).length).sort((a,b)=>byId.get(a.id).unlock-byId.get(b.id).unlock);const sold=r.sales.sort((a,b)=>b.quantity*b.price-a.quantity*a.price);
$('#content').innerHTML=title('Your Production Plan',`Level ${level} · ${modes[r.settings.worker]} · all facilities calculated together`, `<span class="badge">${r.proven?'Optimal within this setup':'Best feasible plan found'}</span>`)+`<div class="metrics"><div class="metric"><label>COINS / HOUR</label><strong>${fmt(r.net,1)}</strong><small>Sale revenue; seed prices ignored</small></div><div class="metric"><label>PROJECTED / ${hours} HOURS</label><strong>${fmt(r.net*hours)}</strong><small>At sustained production</small></div><div class="metric"><label>ANIIMO ASSIGNED</label><strong>${staff}<span class="muted"> / ${data.aniimo[level-1]}</span></strong><small>${level===1?'Manual tending at level 1':'Includes tending, climate and hauling'}</small></div></div><div class="note">${r.settings.climate?'Climate building modes and coverage capacity are included. ':''}${r.settings.lightClimate===false?'Light Aniimo and all Sunlamp-dependent production are excluded for this test. ':''}Every plot and normal processor keeps one assignment for the whole plan. Rates apply after production chains are running, with prompt collection. Food, rest, travel and random mutations are not included.</div>${level>=9?'<p class="hint">Facility-count defaults follow the current Aniimax release table. Counts are confirmed there through RV 11; above RV 11, non-gatherer facilities keep their RV 11 cap until further verification.</p>':''}<div class="section-head"><h2>Grow & Gather</h2><span>Run these facilities in parallel</span></div><div class="production-grid">${cards||'<div class="empty">No production is available for these settings.</div>'}</div><div class="section-head"><h2>Crafting Allocation</h2><span>Each normal machine keeps one recipe</span></div>${craft.length?`<div class="table-wrap"><table><thead><tr><th>Product / facility</th><th>Ingredients per batch</th><th class="num">Batch time</th><th class="num">Batches / ${hours}h</th><th class="num">Assigned / busy</th></tr></thead><tbody>${craft.map(row=>{const i=byId.get(row.id);return `<tr><td>${craftingProductFacilityCell(i)}</td><td>${Object.entries(i.ingredients).map(([id,n])=>`${n} × ${itemButton(id)}`).join('<br>')}</td><td class="num">${fmt(row.seconds,1)}s</td><td class="num">${fmt(row.batches*hours,1)}</td><td class="num">${row.shared?'shared':fmt(row.units)} / ${fmt(row.machineHours*100,1)}%</td></tr>`}).join('')}</tbody></table></div><p class="hint">Each normal processor is assigned to one recipe; its busy percentage may be low when ingredients grow more slowly than it crafts. Only Woodworking Bench and Chimney Kiln progression recipes take turns. Rates are long-run averages; crafts and harvests remain whole batches.</p>`:'<div class="empty">Selling raw products is the best plan for this setup.</div>'}<div class="section-head"><h2>What to Sell</h2><span>After reserving all crafting ingredients</span></div><div class="table-wrap"><table><thead><tr><th>Final product</th><th class="num">Units / ${hours}h</th><th class="num">Unit price</th><th class="num">Revenue / ${hours}h</th></tr></thead><tbody>${sold.map(s=>`<tr><td>${icon(byId.get(s.id))}${itemButton(s.id)}</td><td class="num">${fmt(s.quantity*hours,1)}</td><td class="num">${fmt(s.price)}</td><td class="num profit">${fmt(s.quantity*s.price*hours)}</td></tr>`).join('')}<tr><td colspan="3"><strong>Total coins</strong></td><td class="num profit"><strong>${fmt(r.net*hours,1)}</strong></td></tr></tbody></table></div><div class="section-head"><h2>Aniimo Team</h2></div><div class="staff">${Object.entries(r.staff).map(([n,c])=>`<span><b>${c}</b> · ${esc(n)}</span>`).join('')||'<span>Manual crop tending</span>'}</div><p class="hint">Aniimo move between compatible jobs while processors wait for ingredients. Gatherers and active climate facilities stay occupied; one hauling Aniimo is reserved. This assumes you own the listed abilities.</p><div class="section-head"><h2>Climate Allocation</h2></div><div class="staff">${(r.climate||[]).map(c=>`<span><b>${c.count} ${esc(c.building)}</b> · ${esc(c.mode)}<br><small>Capacity: ${c.counts[2]} farmland · ${c.counts[1]} woodland · ${c.counts[0]} large facility per building</small></span>`).join('')||'<span>No climate-controlled production needed.</span>'}</div><p class="hint">Uses feasible coverage arrangements from the repository’s candidate grids. Distinct climate buildings are assumed to have room for separate zones. Placement editing is reserved for version 2.</p><div class="section-head"><h2>Additional Materials</h2></div><div class="staff"><span>${fmt(r.byproducts.wood_block*hours,1)} Wood Blocks / ${hours}h</span><span>${fmt(r.byproducts.mineral_sand*hours,1)} Mineral Sand / ${hours}h</span></div>`}
function renderPlanV12(){
 const r=last,period=planPeriod(r),hours=period.hours,staff=Object.values(r.staff).reduce((a,b)=>a+b,0),growers=r.rows.filter(x=>x.plots!==null),processing=r.rows.filter(x=>x.plots===null),consumed={},orderAnalysis=orders.length?mergeOrderPlans():null,orderBorrowed=orderAnalysis?.borrowed||new Map();
 for(const row of r.rows)for(const[id,n]of Object.entries(byId.get(row.id).ingredients))consumed[id]=(consumed[id]||0)+row.batches*n;
 const groups=[...new Set(growers.map(x=>x.facility).concat(processing.filter(x=>!Object.keys(byId.get(x.id).ingredients).length).map(x=>x.facility)))];
 const cards=groups.map(f=>`<article class="production-card"><h3><span class="facility-card-title">${facilityIconHtml(f,config[f]?.level||1)}<span>${esc(f)}</span></span><small>${eventFacilityLabel(f)}</small></h3>${r.rows.filter(x=>x.facility===f).map(row=>{const i=byId.get(row.id),sale=r.sales.find(s=>s.id===i.product),borrow=Math.min(donorCapacity(row),orderBorrowed.get(row.id)||0),left=Math.max(0,donorCapacity(row)-borrow),assignment=row.plots!==null?`${row.plots}${borrow?`(${left})`:''} plots · ${fmt(row.batches*hours,1)} harvests`:`${row.units??1}${borrow?`(${left})`:''} assigned · ${fmt(row.machineHours*100)}% busy`;return `<div class="product-row ${borrow?'order-borrowed-row':''}">${icon(i)}<div><b>${itemButton(row.id)}</b><p>${assignment}${borrow?` <span class="order-borrow-note">· ${borrow} temporarily on order</span>`:''}</p><span class="qty">${fmt(row.produced*hours,1)} produced / ${period.label}</span>${productionFamilyNote(i)}${growGatherAvailabilityNote(i)}<p>${consumed[i.product]?`${fmt(consumed[i.product]*hours,1)} → crafting`:''}${sale?`${consumed[i.product]?' · ':''}${fmt(sale.quantity*hours,1)} → sell`:''}</p></div></div>`}).join('')}</article>`).join('');
 const craft=processing.filter(x=>Object.keys(byId.get(x.id).ingredients).length).sort((a,b)=>Number(a.shared)-Number(b.shared)),craftAllocation=sharedCraftAllocation(r,craft),flows=practicalFlows(r,hours),timing=period.timing||upgradeTiming(r),target=timing?.target;
 const upgrade=level===20?'<div class="note">RV 20 is the current maximum.</div>':`<div class="upgrade-card"><div class="upgrade-summary"><span>NEXT RV</span><strong>${level} → ${level+1}</strong><small>Ready when the slowest requirement finishes: <b>${duration(timing?.total)}</b></small></div><div class="upgrade-parts"><span class="upgrade-part">${coinIcon()}<span><b>${fmt(target.coins)} Home Coins</b><small>Ready in ${duration(timing.coinEta)} · 30% coin reserve included</small></span></span>${timing.materials.map(({id,amount,eta})=>{const item=byId.get(id);return `<span class="upgrade-part">${icon(item)}<span><b>${fmt(amount)} ${itemButton(id)}</b><small>Ready in ${duration(eta)}</small></span></span>`}).join('')}</div></div>`;
 const foodEnergy=r.food.reduce((a,x)=>a+x.quantity*x.energy,0),projectedNet=flows.gross-flows.seedCost,periodHeader=period.label==='1h'?'1h':period.label;
 const eventPlanNote='';
 const foodBlock=`<div class="food-strip"><div class="food-strip-title"><span>Food for Aniimo</span><small>Keep these items available for the plan.</small></div><div class="food-items">${flows.food.map(x=>`<div class="food-item">${icon(byId.get(x.id))}<span>${itemButton(x.id)}<b>× ${fmt(x.total)}</b></span></div>`).join('')||'<span class="muted">No food needed at RV 1.</span>'}</div></div>`;
 const saleTable=`<article class="flow-card"><h3>Products to Sell</h3><div class="table-wrap compact-flow"><table><colgroup><col class="item-col"><col class="qty-col"><col class="value-col"></colgroup><thead><tr><th>Item</th><th class="num">Sold / ${periodHeader}</th><th class="num">Profit / ${periodHeader}</th></tr></thead><tbody>${flows.sales.map(x=>`<tr><td><div class="flow-item-cell">${icon(byId.get(x.id))}${itemButton(x.id)}</div></td><td class="num"><b>${fmt(x.units)}</b></td><td class="num profit"><span class="metric-money">${coinIcon()}<span>${fmt(x.revenue)}</span></span></td></tr>`).join('')||'<tr><td colspan="3" class="muted">Nothing is sold during this plan.</td></tr>'}<tr class="flow-total"><td><strong>Total Profit</strong></td><td></td><td class="num profit"><strong><span class="metric-money">${coinIcon()}<span>${fmt(flows.gross)}</span></span></strong></td></tr></tbody></table></div></article>`;
 const eventMoonray=flows.seeds.filter(x=>EVENT_CROP_IDS.has(x.id)).reduce((n,x)=>n+x.units*4,0);
 const seedTable=`<article class="flow-card"><h3>Seeds Needed</h3><div class="table-wrap compact-flow"><table><colgroup><col class="item-col"><col class="qty-col"><col class="value-col"></colgroup><thead><tr><th>Item</th><th class="num">Needed / ${periodHeader}</th><th class="num">Cost / ${periodHeader}</th></tr></thead><tbody>${flows.seeds.map(x=>`<tr><td><div class="flow-item-cell">${icon(byId.get(x.id))}${itemButton(x.id)}</div></td><td class="num"><b>${fmt(x.units)}</b></td><td class="num">${EVENT_CROP_IDS.has(x.id)?`<span class="metric-money moonray-money">${moonrayIcon()}<span>${fmt(x.units*4)}</span></span>`:`<span class="metric-money">${coinIcon()}<span>${fmt(x.totalCost)}</span></span>`}</td></tr>`).join('')||'<tr><td colspan="3" class="muted">No seeds are needed.</td></tr>'}<tr class="flow-total"><td><strong>Total Home Coin Seed Cost</strong></td><td></td><td class="num"><strong><span class="metric-money">${coinIcon()}<span>${fmt(flows.seedCost)}</span></span></strong></td></tr>${eventMoonray?`<tr class="flow-total event-wheat-total"><td><strong>Harvest Moon seed budget</strong></td><td></td><td class="num"><strong><span class="metric-money moonray-money">${moonrayIcon()}<span>${fmt(eventMoonray)}</span></span></strong></td></tr>`:''}</tbody></table></div></article>`;
 const extras=bonusOutputs(r,hours),showExtras=['xp','xp_aniipod'].includes(r.settings.strategy),extraTitle=r.settings.strategy==='xp_aniipod'?'Aniimo Training & Aniipods':'Aniimo Training',extraBlock=showExtras?`<div class="section-head"><h2>${extraTitle}</h2><span>Completed items / ${periodHeader}</span></div><div class="bonus-output-card">${extras.xp.map(x=>`<div>${icon(byId.get(x.id))}<span><b>${esc(x.name)} × ${fmt(x.units)}</b><small>${fmt(x.units*x.value)} Aniimo EXP</small></span></div>`).join('')}${extras.pods.map(x=>`<div>${icon(byId.get(x.id))}<span><b>${esc(x.name)} × ${fmt(x.units)}</b><small>Completed Aniipods</small></span></div>`).join('')}${extras.totalXp?`<div class="bonus-total"><span><b>Total Aniimo EXP</b><small>from completed Growth items</small></span><strong>${fmt(extras.totalXp)}</strong></div>`:''}</div>`:'';
 $('#content').innerHTML=title('Your Production Plan',`Level ${level} · ${modes[r.settings.worker]} · ${$('#strategy').selectedOptions[0].text}`,`<span class="badge">${r.proven?'Optimal within this setup':'Best feasible plan found'}</span>`)+`<div class="metrics"><div class="metric"><label>NET HOME COINS / HOUR</label><strong>${coinIcon()}${fmt(r.net,1)}</strong><small>${coinIcon()}${fmt(r.gross,1)} sales − ${coinIcon()}${fmt(r.cost,1)} seeds</small></div><div class="metric"><label>PROJECTED / ${period.title.toUpperCase()}</label><strong>${coinIcon()}${fmt(projectedNet)}</strong><small>${period.label.startsWith('until')?`${period.detail} plan · `:''}${coinIcon()}${fmt(flows.gross)} sales − ${coinIcon()}${fmt(flows.seedCost)} seeds</small></div><div class="metric"><label>ANIIMO ASSIGNED</label><strong>${staff}<span class="muted"> / ${data.aniimo[level-1]}</span></strong><small>Food: ${fmt(foodEnergy)} energy/hour</small></div></div>${eventPlanNote}${upgrade}${renderOrderPlanSection(orderAnalysis)}<div class="section-head"><h2>Grow & Gather</h2><span>Fixed assignment · no crop rotation</span></div><div class="production-grid">${cards||'<div class="empty">No production is available.</div>'}</div><div class="section-head"><h2>Crafting Allocation</h2><span>Normal machines keep one recipe · RV upgrade materials get explicit Bench/Kiln assignments</span></div>${craft.length?`<div class="table-wrap"><table><thead><tr><th>Product / facility</th><th>Ingredients</th><th class="num">Cycle</th><th class="num">Batches / ${periodHeader}</th><th class="num">Assigned / busy</th></tr></thead><tbody>${craft.map(row=>{const i=byId.get(row.id),shared=craftAllocation.allocations.get(row.id);return `<tr><td>${craftingProductFacilityCell(i)}</td><td>${Object.entries(i.ingredients).map(([id,n])=>`${n} × ${itemButton(id)}`).join('<br>')}</td><td class="num">${fmt(row.seconds,1)}s</td><td class="num">${fmt(row.batches*hours,1)}</td><td class="num">${row.shared?(shared?`${esc(shared.label)}${shared.split?' · split':''}${shared.rotates?' · rotates':''}`:'shared'):`${fmt(row.units)}`} / ${fmt(row.machineHours*100,1)}%</td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Selling raw products is best for this setup.</div>'}<div class="section-head"><h2>Sell, Feed & Restock</h2><span>Practical whole-item amounts for ${periodHeader}</span></div>${foodBlock}<div class="flow-pair">${saleTable}${seedTable}</div>${extraBlock}<div class="section-head"><h2>Aniimo Needed <strong class="section-count">${staff}</strong></h2><span>${r.settings.bonus?'Best-slot personalities enabled':'Ability recommendations'}</span></div><div class="worker-grid">${workerCards(r)}</div><div class="section-head"><h2>Climate Placement</h2><span>Temperature profile: ${climateProfile(r)||'0'}</span></div>${climateDiagram(r)}<div class="section-head"><h2>Upgrade Byproducts</h2><span>Produced alongside this plan</span></div><div class="material-cards"><div>${icon(byId.get('wood_block'))}<span><b>${fmt(r.byproducts.wood_block*hours,1)} Wood Blocks</b><small>over ${periodHeader}</small></span></div><div>${icon(byId.get('mineral_sand'))}<span><b>${fmt(r.byproducts.mineral_sand*hours,1)} Mineral Sand</b><small>over ${periodHeader}</small></span></div></div>`;
 renderPlanQuickNav();
}
function renderCatalog(){const fs=[...new Set(data.items.map(i=>i.facility))];$('#content').innerHTML=title('Recipes & Items',`${data.items.length} production entries · original screenshot artwork`)+`<div class="catalog-controls"><input type="search" id="search" aria-label="Search items" placeholder="Find an item or ingredient…" value="${esc(search)}"><select id="category" aria-label="Facility filter"><option value="all">All facilities</option>${fs.map(f=>`<option ${f===category?'selected':''}>${esc(f)}</option>`).join('')}</select><select id="scope" aria-label="Unlock filter"><option value="all">All levels</option><option value="unlocked" ${catalogScope==='unlocked'?'selected':''}>Unlocked at level ${level}</option></select></div><div id="catalog-grid" class="catalog"></div>`;filterCatalog()}
function filterCatalog(){const list=data.items.filter(i=>(category==='all'||i.facility===category)&&(catalogScope==='all'||i.unlock<=level)&&(!search||`${i.name} ${i.facility} ${Object.keys(i.ingredients).join(' ').replaceAll('_',' ')}`.toLowerCase().includes(search.toLowerCase())));$('#catalog-grid').innerHTML=list.map(i=>`<button class="item-card ${i.unlock>level?'locked':''}" data-item="${i.id}">${icon(i)}<b>${esc(i.name)}</b><small>${esc(i.facility)} · ${i.event?'Event':`RV ${i.unlock}`}</small><span>${i.currency==='coins'?coinIcon()+fmt(i.price):i.byproductOnly?'Upgrade material':esc(i.currency.replaceAll('_',' '))}</span>${i.id.startsWith('quick_')?'<small>Quick recipe · same product</small>':''}</button>`).join('')||'<div class="empty">No matching items.</div>'}
function showRecipe(id){const i=byId.get(id);if(!i)return;const used=data.items.filter(x=>x.ingredients[i.product]);const st=settings();$('#recipe-content').innerHTML=`<div class="recipe-top">${icon(i)}<div><div class="eyebrow">${esc(i.facility)} · LEVEL ${i.facilityLevel}</div><h2>${esc(i.name)}</h2><span class="tag">${i.event?'Harvest Moon event':`Unlocks at RV ${i.unlock}`}</span></div></div><div class="recipe-stats"><div><small>Unit sale price</small><strong>${i.currency==='coins'?coinIcon()+fmt(i.price):'Not sold for Home Coins'}</strong></div><div><small>${i.seconds?'Growing time':'Workload'}</small><strong>${i.seconds?fmt(i.seconds/60,1)+' min':i.workload||'Byproduct'}</strong></div><div><small>Output per batch</small><strong>${i.yield}</strong></div></div>${i.seconds?`<p>Seed prices are ignored. The fixed growing time is separate from planting, tending and harvesting work.</p>`:i.workload?`<p>Calculated batch time: <b>${fmt(cycle(i,st),1)} seconds</b> with the selected worker settings. Workload is converted using Aniimo efficiency.</p>`:''}<h3>Ingredients</h3><div class="ingredients">${Object.entries(i.ingredients).map(([id,n])=>`<button data-item="${id}">${icon(byId.get(id))}${n} × ${esc(byId.get(id)?.name||id)}</button>`).join('')||`<span class="muted">${i.byproductOnly?'Collected alongside the main product.':i.seconds?'1 seed per plot / harvest.':'Gathered directly at this facility.'}</span>`}</div>${i.environment?`<p>Environment: <b>${esc(i.environment)}</b></p>`:''}${i.module?`<p>Module: ${esc(i.module.replaceAll('_',' ').replace(':',' level '))}</p>`:''}${data.special.some(s=>s.name===id)?'<p class="note warn">Premium Recipe: enable it under Premium Recipes before planning.</p>':''}<h3>Used to make</h3><div class="ingredients">${used.map(x=>`<button data-item="${x.id}">${icon(x)}${esc(x.name)}</button>`).join('')||'<span class="muted">No further recipe in the current data.</span>'}</div><p class="hint">Source: ${esc(i.source)}.${i.checked.length?' Screenshot cross-check: '+i.checked.join(', ')+'.':''}</p>${i.screenshot?`<a href="${i.screenshot}" target="_blank" rel="noopener">View original screenshot ↗</a>`:''}`;if(!$('#recipe').open)$('#recipe').showModal()}
async function renderLevels(){const own=++generation;$('#content').innerHTML=title('Level-by-Level Guide','Each level is solved afresh, including older ingredients and newly unlocked recipes.')+`<div class="note">Uses maximum level defaults, your Aniimo setting and selected recipe unlocks. Results are sustained rates under the same assumptions as the production plan.</div><div class="table-wrap level-guide-wrap"><table class="level-guide-table"><thead><tr><th>RV level</th><th>New products & recipes</th><th>Best sales</th><th class="num">Home Coins / hour</th><th class="num">Change</th></tr></thead><tbody id="level-results"></tbody></table></div><p id="level-progress" class="hint">Calculating level 1 of 20…</p>`;let prev=null;for(let l=1;l<=20;l++){if(tab!=='levels'||own!==generation)return;const s=settings(l);s.facilities=defaults(l);try{const key=JSON.stringify(s);let r=cache.get(key);if(!r){r=await solve(s);cache.set(key,r)}if(tab!=='levels'||own!==generation)return;const unlocks=data.items.filter(i=>i.unlock===l&&!i.event&&!i.byproductOnly);const sales=r.sales.sort((a,b)=>b.quantity*b.price-a.quantity*a.price).slice(0,3);const delta=prev!==null?r.net-prev:null;$('#level-results').insertAdjacentHTML('beforeend',`<tr class="level-row" data-level="${l}"><td><strong>${l}</strong><div class="hint">${data.aniimo[l-1]} Aniimo</div></td><td>${unlocks.slice(0,4).map(i=>esc(i.name)).join(', ')}${unlocks.length>4?` <span class="muted">+${unlocks.length-4} more</span>`:''}</td><td>${sales.map(x=>esc(byId.get(x.id)?.name||x.id)).join(', ')||'—'}</td><td class="num profit"><span class="metric-money">${coinIcon()}<span>${fmt(r.net,1)}</span></span></td><td class="num level-change"><span class="level-change-value ${delta===null?'neutral':delta>=0?'positive':'negative'}">${delta!==null?`${delta>=0?'+':''}${fmt(delta,1)}`:'—'}</span></td></tr>`);prev=r.net;$('#level-progress').textContent=l===20?'Select a level to open its full production plan.':`Calculating level ${l+1} of 20…`}catch(e){if($('#level-progress'))$('#level-progress').textContent=`Level ${l}: ${e.message}`;break}}}
function renderSources(){$('#content').innerHTML=title('Data & Assumptions','Know what the numbers include before you use the plan.')+`<section class="source-block"><h2>Release Data, Checked Against Your Screenshots</h2><p>The baseline comes from <a href="https://github.com/ae-bii/aniimax" target="_blank" rel="noopener">ae-bii / aniimax</a>, whose README explicitly identifies its data as updated for the full release. Snapshot: <code>${data.sourceCommit.slice(0,12)}</code>. Its MIT licence is included <a href="ANIIMAX-LICENSE">here</a>. HiGHS performs the joint optimization.</p><p>Your 292 supplied screenshots provide ${data.items.filter(i=>i.icon&&!i.id.startsWith('quick_')).length} distinct item icons, product details, RV module thresholds and facility-limit evidence. Original screenshots can be opened from item details. Quick recipes reuse the same product icon.</p><p>The floor planner is reserved for version 2.</p></section><section class="source-block"><h2>How This Version Calculates Profit</h2><ul><li>All facilities compete for one shared supply of ingredients. Materials reserved for crafting are removed from the sale quantity.</li><li>Seed prices and cash crafting fees are ignored. Intermediate ingredients are produced within the plan.</li><li>Farmland and Woodland use whole plots. A normal processor is assigned to one recipe; only Woodworking Bench and Chimney Kiln progression chains take turns.</li><li>Aniimo are counted as whole workers. Compatible crafting and crop jobs share a worker's available time; gatherers and climate buildings stay occupied. One hauling Aniimo is reserved. Level 1 uses manual tending.</li><li>Craft time = workload ÷ efficiency. Plant growth is not accelerated by the selected crafting efficiency.</li><li>“Optimal” means the solver proved the highest net rate within these settings and assumptions. Climate optimization is restricted to the verified candidate arrangements. It is not a guarantee of exact in-game earnings.</li></ul></section><section class="source-block"><h2>Limits That Remain Explicit</h2><ul><li>Climate buildings each select one mode and a non-overlapping coverage arrangement from the repository’s candidate grids. These are feasible layouts, but that finite grid family does not exhaust every possible placement. Separate climate zones are assumed to fit in your Homeland; interactive placement and the full floor plan are reserved for version 2.</li><li>Calculations represent sustained production after startup, with prompt collection and sufficient energy. Offline gaps, walking, fatigue, feeding, storage limits and mutations are not modelled.</li><li>${esc(data.notes.facilityLimits)} Storage Units are currently assumed as 1 at RV 2, 2 at RV 4, 3 at RV 8, and 4 at RV 10+. Egg Incubators are currently assumed as RV level + 1 up to a cap of 10 from RV 9 onward.</li><li>Facility upgrade thresholds use repository release data. RV module thresholds and Aniimo caps use the supplied screenshots and your list.</li><li>${esc(data.notes.unverifiedQuick)} They are excluded by default.</li><li>Harvest Moon recipes are in the catalogue. Planning with them is optional because event availability and ability requirements need confirmation. Their tending workloads use the standard crop assumption.</li><li>The three Aniipod products are in the repository but were not present in the supplied screenshots. Their catalogue entries have no invented icon.</li></ul></section><section class="source-block"><h2>Why a Plan Changes at the Next Level</h2><p>Each level reopens the entire production network. A newly unlocked recipe can make an older crop valuable again. Additional plots or processors can also relieve a bottleneck, even when no new raw material unlocks. The level guide compares the resulting net rates and main sale products.</p></section>`}
function showRecipeV12(id){showRecipe(id);const i=byId.get(id);if(!i)return;const p=[...$('#recipe-content').querySelectorAll('p')].find(x=>x.textContent.includes('Seed prices are ignored'));if(p)p.innerHTML=`Seed cost: ${coinIcon()}${fmt(i.cost||0)} per harvest. Fixed growth time is separate from planting, tending and harvesting work.`;if(i.energy>0)$('#recipe-content .recipe-stats')?.insertAdjacentHTML('beforeend',`<div><small>Food energy</small><strong>${fmt(i.energy)} energy</strong></div>`)}
function renderSourcesV12(){$('#content').innerHTML=title('Data Sources & Assumptions','Where the planner data comes from, what it assumes, and where the project lives.')+
`<section class="source-block"><h2>Project Links</h2><ul><li><a href="https://aniiland.wintira.win/" target="_blank" rel="noopener">Live site</a></li><li><a href="https://github.com/Phantom512-ui/aniiland" target="_blank" rel="noopener">GitHub repository</a></li></ul></section><section class="source-block"><h2>Primary Sources</h2><ul><li><b>Aniimax</b> provides the core post-release Homeland data/model base. Embedded snapshot: <code>${data.sourceCommit.slice(0,12)}</code>. Aniimax is MIT-licensed; its notice is included in <code>ANIIMAX-LICENSE</code>.</li><li><b>In-game screenshots supplied by the project owner</b> are the source of truth where values have been directly verified, including icons/artwork, Home Coin and Moonray Wheat assets, and Harvest Moon recipe details. Facility-count defaults follow Aniimax where confirmed. As a temporary unverified extrapolation, Woodworking Bench and Chimney Kiln are assumed to gain another machine with each RV-material recipe tier (RV 6 / 10 / 14 / 18), giving 1 / 2 / 3 / 4 of each so every unlocked tier can run simultaneously.</li><li><b>Mobalytics</b> is used only for Aniimo portrait/recommendation reference in the current UI.</li><li><b>HiGHS / highs-js</b> is the optimization engine bundled under <code>vendor/highs/</code>.</li></ul></section><section class="source-block"><h2>Core Solver Assumptions</h2><ul><li>Net profit subtracts Home Coin seed costs. Moonray Wheat is tracked separately.</li><li>All facilities share one ingredient pool. Normal processors keep one recipe. Woodworking Bench and Chimney Kiln progression chains are kept active in every planning goal. Simple Setup temporarily assumes one Bench/Kiln per unlocked upgrade-material tier; Custom Setup with fewer machines rotates those progression crafts.</li><li>Farmland and Woodland use the current watering model: two waterings per grow cycle, bringing the effective grow timer down to 75% of the displayed time.</li><li>Woodland stays on its newest available recipe tier. Mine also stays on its newest tier, except the Aniipod goal may let one Mine step down when needed for inputs.</li><li>Premium recipes stay off until enabled. Avoided recipes stay excluded. Custom Setup overrides RV defaults when used.</li></ul></section><section class="source-block"><h2>Harvest Moon Event Mode</h2><ul><li>Available from RV 10. It reserves 2 Farmlands: 1 Moondew Radish and 1 Waxing Moon Pepper.</li><li>Event crops are demand-capped. The planner will not grow extra raw event crops just to sell or discard them.</li><li>In short: Event Mode may make a little less Home Coin than Normal Mode in exchange for stacking Harvest Moon progress. It is only used while staying within 15% of the same-settings control plan with those two Farmlands reserved.</li><li>Event recipes may also be used for food when that improves the plan.</li></ul></section><section class="source-block"><h2>Limits & Scope</h2><ul><li>Travel time, fatigue, storage overflow, random mutations, offline gaps, and electrical E-mode are not simulated.</li><li>Climate placement uses verified candidate arrangements, not an exhaustive search of every possible manual layout.</li><li>${esc(data.notes.facilityLimits)}</li><li>Storage Units are currently assumed as 1 at RV 2, 2 at RV 4, 3 at RV 8, and 4 at RV 10+. Egg Incubators are assumed as RV level + 1 up to a cap of 10 from RV 9 onward.</li></ul></section><section class="source-block"><h2>Licensing & Disclaimer</h2><p>Aniiland's original code is released under the MIT License and can be freely used, copied, forked, and adapted under that license. Aniimax is also MIT-licensed. Game-derived names, artwork, screenshots, and trademarks are not relicensed by Aniiland and remain with their respective owners.</p><p>Aniiland is an unofficial fan/community project. It is not affiliated with, endorsed by, sponsored by, or officially connected to Aniimo or its developers/publishers.</p></section>`}
document.addEventListener('click',e=>{
 const toggle=e.target.closest('[data-order-toggle]');if(toggle){orderDockOpen=!orderDockOpen;saveUiState();renderOrderDock();return}
 const quickComplete=e.target.closest('[data-order-quick-complete]');if(quickComplete){quickComplete.classList.add('completed');quickComplete.disabled=true;setTimeout(()=>completeOrder(quickComplete.dataset.orderQuickComplete),420);return}
 if(e.target.closest('[data-order-add]')){resolveOrderInput();return}
 if(e.target.closest('[data-event-order-add]')){resolveEventOrderInput();return}
 const suggest=e.target.closest('[data-order-suggest]');if(suggest){const i=byId.get(suggest.dataset.orderSuggest),input=$('#order-item-input');if(i&&input){input.value=i.name;input.dataset.selectedId=i.id;$('#order-suggestions').hidden=true}return}
 const eventSuggest=e.target.closest('[data-event-order-suggest]');if(eventSuggest){const i=byId.get(eventSuggest.dataset.eventOrderSuggest),input=$('#event-order-item-input');if(i&&input){input.value=i.name;input.dataset.selectedId=i.id;$('#event-order-suggestions').hidden=true}return}
 const complete=e.target.closest('[data-order-complete]');if(complete){completeOrder(complete.dataset.orderComplete);return}
 const remove=e.target.closest('[data-order-remove]');if(remove){orders=orders.filter(o=>o.id!==remove.dataset.orderRemove);saveUiState();renderOrderDock();renderEventCenter();if(tab==='plan'&&last)renderPlanV12();return}
 const resolve=e.target.closest('[data-order-resolve]');if(resolve){promptOrderRecipeIssue(resolve.dataset.orderResolve);return}
 const choice=e.target.closest('[data-order-recipe-choice]');if(choice){if(choice.dataset.orderRecipeChoice==='cancel'){pendingOrderRecipeCheck=null;$('#order-recipe-dialog').close()}else orderRecipeChoice(choice.dataset.orderRecipeChoice);return}
 if(e.target.closest('[data-event-open]')){renderEventCenter();$('#event-center-dialog').showModal();return}
 if(e.target.closest('[data-event-close]')){$('#event-center-dialog').close();return}
 const etab=e.target.closest('[data-event-tab]');if(etab){eventActiveTab=etab.dataset.eventTab;saveUiState();renderEventCenter();return}
  const eru=e.target.closest('[data-event-recipe-unlock]');if(eru){toggleEventRecipeUnlock(eru.dataset.eventRecipeUnlock);return}
 const efu=e.target.closest('[data-event-furniture-unlock]');if(efu){unlockEventFurniture(efu.dataset.eventFurnitureUnlock);return}
 const etc=e.target.closest('[data-event-task-complete]');if(etc){completeEventTask(etc.dataset.eventTaskComplete);return}
 const eoc=e.target.closest('[data-event-order-complete]');if(eoc){completeOrder(eoc.dataset.eventOrderComplete);return}
 if(e.target.closest('[data-event-reset-tasks]')){eventTaskDone={};saveUiState();renderEventCenter();return}
});
document.addEventListener('change',e=>{
 if(e.target.dataset.orderQty){const order=orders.find(o=>o.id===e.target.dataset.orderQty);if(order){order.quantity=Math.max(1,Math.floor(Number(e.target.value)||1));e.target.value=order.quantity;order.denied=[];saveUiState();renderOrderDock();renderEventCenter();if(tab==='plan'&&last)renderPlanV12();setTimeout(()=>promptOrderRecipeIssue(order.id),0)}return}
 if(e.target.id==='event-currency-input'||e.target.dataset.eventTaskReward||e.target.dataset.eventOrderReward){saveUiState();renderEventCenter();return}
 if(e.target.matches('[data-event-mode-popup]')){const hidden=$('#events');if(hidden){hidden.checked=e.target.checked;hidden.dispatchEvent(new Event('change',{bubbles:true}))}return}
});
document.addEventListener('click',e=>{
 const normalWrap=e.target.closest('.order-search-wrap');if(!normalWrap){const box=$('#order-suggestions');if(box)box.hidden=true}
 const eventWrap=e.target.closest('.event-order-search-wrap');if(!eventWrap){const box=$('#event-order-suggestions');if(box)box.hidden=true}
 if(orderDockOpen&&!e.target.closest('#order-dock')&&!e.target.closest('[data-order-toggle]')){orderDockOpen=false;saveUiState();renderOrderDock()}
 $$('details.sidebar-dropdown[open]').forEach(d=>{if(!d.contains(e.target))d.open=false});
});
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;if(e.target.id==='order-item-input'){e.preventDefault();resolveOrderInput()}else if(e.target.id==='event-order-item-input'){e.preventDefault();resolveEventOrderInput()}});
$('#recipe')?.addEventListener('click',e=>{if(e.target===$('#recipe'))$('#recipe').close()});
$('#order-recipe-dialog')?.addEventListener('click',e=>{if(e.target===$('#order-recipe-dialog')){pendingOrderRecipeCheck=null;$('#order-recipe-dialog').close()}});
$('#event-center-dialog')?.addEventListener('click',e=>{if(e.target===$('#event-center-dialog'))$('#event-center-dialog').close()});
$('#recipe-lock-dialog').addEventListener('click',e=>{if(e.target===$('#recipe-lock-dialog')){pendingLockRecipeId=null;$('#recipe-lock-dialog').close()}});$('#advanced-setup-dialog').addEventListener('click',e=>{if(e.target===$('#advanced-setup-dialog')){advancedDraft=null;$('#advanced-setup-dialog').close()}});
resetConfig();syncStrategyButtons();saveUiState();renderOrderDock();if(restoreAcceptedPlan()){renderPlanV12();renderOrderDock();renderPlannerUpdateButton();setTimeout(checkPlannerUpdate,0)}else await calculate();
