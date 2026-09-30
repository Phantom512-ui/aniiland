(function(){
  'use strict';

  const SITE_STORAGE_KEY='aniiland-language';
  const GAME_STORAGE_KEY='aniiland-game-language';
  const GAME_EXPLICIT_KEY='aniiland-game-language-explicit';
  const DEFAULT_LOCALE='en-US';
  const DEFAULT_GAME_LOCALE='en';

  const registry=window.AniilandLocales=window.AniilandLocales||{};
  const gameRegistry=window.AniilandGameLocales=window.AniilandGameLocales||{};
  const loaded=new Set();
  const loading=new Map();
  const gameLoaded=new Set();
  const gameLoading=new Map();

  const locales=[
    {id:'en-US',language:'en',native:'English (US)',short:'US',variant:'US',flag:'us'},
    {id:'en-GB',language:'en',native:'English (UK)',short:'UK',variant:'UK',flag:'gb',parent:'en-US'},
    {id:'de-DE',language:'de',native:'Deutsch',short:'DE',flag:'de'},
    {id:'fr-FR',language:'fr',native:'Français',short:'FR',flag:'fr'},
    {id:'es-ES',language:'es',native:'Español (ES)',short:'ES',variant:'ES',flag:'es'},
    {id:'es-MX',language:'es',native:'Español (MX)',short:'MX',variant:'MX',flag:'mx',parent:'es-ES'},
    {id:'es-AR',language:'es',native:'Español (Arg)',short:'AR',variant:'Arg',flag:'ar',parent:'es-ES'},
    {id:'pt-BR',language:'pt',native:'Português (BR)',short:'BR',variant:'BR',flag:'br',parent:'pt-PT'},
    {id:'pt-PT',language:'pt',native:'Português (PT)',short:'PT',variant:'PT',flag:'pt'},
    {id:'it-IT',language:'it',native:'Italiano',short:'IT',flag:'it'},
    {id:'pl-PL',language:'pl',native:'Polski',short:'PL',flag:'pl'},
    {id:'ru-RU',language:'ru',native:'Русский',short:'RU',flag:'ru'},
    {id:'zh-CN',language:'zh',native:'简体中文',short:'CN',variant:'CN',flag:'cn'},
    {id:'zh-TW',language:'zh',native:'繁體中文',short:'TW',variant:'TW',flag:'tw'},
    {id:'ja-JP',language:'ja',native:'日本語',short:'JP',flag:'jp'},
    {id:'ko-KR',language:'ko',native:'한국어',short:'KR',flag:'kr'},
    {id:'ms-MY',language:'ms',native:'Bahasa Melayu',short:'MY',flag:'my'},
    {id:'id-ID',language:'id',native:'Bahasa Indonesia',short:'ID',flag:'id'},
    {id:'fil-PH',language:'fil',native:'Filipino',short:'PH',flag:'ph'},
    {id:'th-TH',language:'th',native:'ไทย',short:'TH',flag:'th'},
    {id:'vi-VN',language:'vi',native:'Tiếng Việt',short:'VN',flag:'vn'},
    {id:'nl-NL',language:'nl',native:'Nederlands',short:'NL',flag:'nl'},
    {id:'sv-SE',language:'sv',native:'Svenska',short:'SE',flag:'se'},
    {id:'no-NO',language:'no',native:'Norsk',short:'NO',flag:'no'},
    {id:'da-DK',language:'da',native:'Dansk',short:'DK',flag:'dk'},
    {id:'fi-FI',language:'fi',native:'Suomi',short:'FI',flag:'fi'},
    {id:'cs-CZ',language:'cs',native:'Čeština',short:'CZ',flag:'cz'},
    {id:'sk-SK',language:'sk',native:'Slovenčina',short:'SK',flag:'sk'},
    {id:'hu-HU',language:'hu',native:'Magyar',short:'HU',flag:'hu'},
    {id:'el-GR',language:'el',native:'Ελληνικά',short:'GR',flag:'gr'},
    {id:'ro-RO',language:'ro',native:'Română',short:'RO',flag:'ro'},
    {id:'bg-BG',language:'bg',native:'Български',short:'BG',flag:'bg'},
    {id:'hr-HR',language:'hr',native:'Hrvatski',short:'HR',flag:'hr'},
    {id:'sl-SI',language:'sl',native:'Slovenščina',short:'SI',flag:'si'},
    {id:'sr-RS',language:'sr',native:'Српски',short:'RS',flag:'rs'},
    {id:'lt-LT',language:'lt',native:'Lietuvių',short:'LT',flag:'lt'},
    {id:'et-EE',language:'et',native:'Eesti',short:'EE',flag:'ee'},
    {id:'tr-TR',language:'tr',native:'Türkçe',short:'TR',flag:'tr'},
    {id:'uk-UA',language:'uk',native:'Українська',short:'UA',flag:'ua'},
    {id:'he-IL',language:'he',native:'עברית',short:'IL',flag:'il'},
    {id:'hi-IN',language:'hi',native:'हिन्दी',short:'IN',flag:'in'},
    {id:'bn-BD',language:'bn',native:'বাংলা',short:'BD',flag:'bd'},
    {id:'ar-SA',language:'ar',native:'العربية (SA)',short:'SA',variant:'SA',flag:'sa'},
    {id:'ar-EG',language:'ar',native:'العربية (EG)',short:'EG',variant:'EG',flag:'eg',parent:'ar-SA'},
    {id:'ar-AE',language:'ar',native:'العربية (UAE)',short:'AE',variant:'UAE',flag:'ae',parent:'ar-SA'}
  ];

  const gameLocales=[
    {id:'en',language:'en',native:'English',flag:'us',site:'en-US'},
    {id:'de_DE',language:'de',native:'Deutsch',flag:'de',site:'de-DE'},
    {id:'fr_FR',language:'fr',native:'Français',flag:'fr',site:'fr-FR'},
    {id:'es_ES',language:'es',native:'Español',flag:'es',site:'es-ES'},
    {id:'pt_PT',language:'pt',native:'Português',flag:'pt',site:'pt-PT'},
    {id:'ru_RU',language:'ru',native:'Русский',flag:'ru',site:'ru-RU'},
    {id:'id_ID',language:'id',native:'Indonesia',flag:'id',site:'id-ID'},
    {id:'th_TH',language:'th',native:'ไทย',flag:'th',site:'th-TH'},
    {id:'vi_VN',language:'vi',native:'Tiếng Việt',flag:'vn',site:'vi-VN'},
    {id:'ja_JP',language:'ja',native:'日本語',flag:'jp',site:'ja-JP'},
    {id:'ko_KR',language:'ko',native:'한국어',flag:'kr',site:'ko-KR'},
    {id:'zh_CN',language:'zh',native:'简体中文',flag:'cn',site:'zh-CN',variant:'CN'},
    {id:'zh_TW',language:'zh',native:'繁體中文',flag:'tw',site:'zh-TW',variant:'TW'}
  ];

  const localeById=Object.fromEntries(locales.map(x=>[x.id,x]));
  const gameLocaleById=Object.fromEntries(gameLocales.map(x=>[x.id,x]));
  const siteToGame={
    'en-US':'en','en-GB':'en','de-DE':'de_DE','fr-FR':'fr_FR',
    'es-ES':'es_ES','es-MX':'es_ES','es-AR':'es_ES',
    'pt-PT':'pt_PT','pt-BR':'pt_PT','ru-RU':'ru_RU','id-ID':'id_ID',
    'th-TH':'th_TH','vi-VN':'vi_VN','ja-JP':'ja_JP','ko-KR':'ko_KR',
    'zh-CN':'zh_CN','zh-TW':'zh_TW'
  };

  const textState=new WeakMap();
  const attrState=new WeakMap();
  let current=readSiteSaved();
  let gameExplicit=readGameExplicit();
  let currentGame=readGameSaved(current);
  let currentStrings={};
  let replacements=[];
  let observer=null;
  let trigger=null;
  let menu=null;
  let pickerMode='site';
  let ready=false;

  function readSiteSaved(){
    try{const v=localStorage.getItem(SITE_STORAGE_KEY);if(v&&localeById[v])return v}catch{}
    return DEFAULT_LOCALE;
  }
  function readGameExplicit(){try{return localStorage.getItem(GAME_EXPLICIT_KEY)==='1'}catch{return false}}
  function readGameSaved(siteId){
    try{const v=localStorage.getItem(GAME_STORAGE_KEY);if(v&&gameLocaleById[v])return v}catch{}
    return siteToGame[siteId]||DEFAULT_GAME_LOCALE;
  }

  function escapeRegExp(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
  function compileStrings(strings){
    currentStrings=strings||{};
    replacements=Object.keys(currentStrings)
      .filter(k=>k&&currentStrings[k]!==undefined&&currentStrings[k]!==k&&k.length>=2)
      .sort((a,b)=>b.length-a.length)
      .map(k=>[k,String(currentStrings[k]),new RegExp(escapeRegExp(k),'g')]);
  }
  function mergedStrings(id,seen=new Set()){
    if(!id||id===DEFAULT_LOCALE||seen.has(id))return {};
    seen.add(id);
    const meta=localeById[id]||{};
    const entry=registry[id]||{};
    const parent=entry.extends||meta.parent;
    return Object.assign({},mergedStrings(parent,seen),entry.strings||{});
  }
  function translateString(source){
    if(!source)return source;
    const values=[],pattern=source.replace(/-?\d+(?:[.,]\d+)*/g,n=>{values.push(n);return `NUM${String(values.length-1).padStart(3,'0')}TOKEN`});
    const ui=window.AniilandUITranslations?.[current];
    const localized=ui?.[pattern]??ui?.[source];
    const resolve=text=>window.AniilandV2Text?.resolveGame?.(text)??text;
    if(localized!==undefined)return resolve(localized.replace(/NUM(\d{3})TOKEN/g,(_,index)=>values[Number(index)]??''));
    if(current===DEFAULT_LOCALE)return source;
    if(Object.prototype.hasOwnProperty.call(currentStrings,source))return resolve(currentStrings[source]);
    // Match the original English text once; translated words are never translated again.
    const keys=replacements.map(([key])=>key);
    if(!keys.length)return source;
    const rx=new RegExp(keys.map(escapeRegExp).join('|'),'g');
    return resolve(source.replace(rx,key=>currentStrings[key]));
  }

  function shouldSkip(node){
    const p=node.nodeType===1?node:node.parentElement;
    return !p||!!p.closest('script,style,code,pre,[data-i18n-ignore]');
  }
  function applyTextNode(node){
    if(!node||node.nodeType!==3||shouldSkip(node))return;
    let st=textState.get(node);const now=node.nodeValue||'';
    if(!st){st={source:now,rendered:now};textState.set(node,st)}
    else if(now!==st.rendered)st.source=now;
    const source=st.source;if(!source.trim()){st.rendered=now;return}
    const lead=source.match(/^\s*/)?.[0]||'',tail=source.match(/\s*$/)?.[0]||'';
    const core=source.slice(lead.length,source.length-tail.length),next=lead+translateString(core)+tail;
    if(now!==next)node.nodeValue=next;st.rendered=next;
  }
  function applyAttr(el,name){
    if(!el||el.nodeType!==1||shouldSkip(el)||!el.hasAttribute(name))return;
    let states=attrState.get(el);if(!states){states={};attrState.set(el,states)}
    const now=el.getAttribute(name)||'';let st=states[name];
    if(!st){st={source:now,rendered:now};states[name]=st}else if(now!==st.rendered)st.source=now;
    const next=translateString(st.source);if(now!==next)el.setAttribute(name,next);st.rendered=next;
  }
  function applyNode(root){
    if(!root)return;if(root.nodeType===3){applyTextNode(root);return}
    if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
    if(root.nodeType===1){applyAttr(root,'placeholder');applyAttr(root,'title');applyAttr(root,'aria-label')}
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;
    while((n=walker.nextNode())){if(n.nodeType===3)applyTextNode(n);else{applyAttr(n,'placeholder');applyAttr(n,'title');applyAttr(n,'aria-label')}}
  }
  function applyDocument(){
    if(!document.body)return;
    applyNode(document.body);
    document.documentElement.lang=current;
    // Planner geometry stays LTR for every language. RTL scripts render naturally inside text runs.
    document.documentElement.dir='ltr';
    document.documentElement.dataset.locale=current;
    document.documentElement.dataset.gameLocale=currentGame;
    document.documentElement.classList.toggle('lang-ar',current.startsWith('ar-'));
    document.documentElement.classList.toggle('lang-he',current.startsWith('he-'));
    document.documentElement.classList.toggle('lang-cjk',current.startsWith('zh-')||current.startsWith('ja-')||current.startsWith('ko-'));
    updatePicker();
  }

  function loadScript(id){
    if(id===DEFAULT_LOCALE||loaded.has(id)||registry[id]){loaded.add(id);return Promise.resolve()}
    if(loading.has(id))return loading.get(id);
    const meta=localeById[id];
    const promise=(async()=>{
      if(meta?.parent)await loadScript(meta.parent);
      await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`languages/${id}.js`;s.async=true;s.onload=()=>{loaded.add(id);resolve()};s.onerror=()=>reject(new Error(`Could not load site language file: ${id}`));document.head.appendChild(s)});
    })().finally(()=>loading.delete(id));
    loading.set(id,promise);return promise;
  }
  function loadGameScript(id){
    if(gameLoaded.has(id)||gameRegistry[id]){gameLoaded.add(id);return Promise.resolve()}
    if(gameLoading.has(id))return gameLoading.get(id);
    const promise=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=`game-languages/${id}.js`;s.async=true;s.onload=()=>{gameLoaded.add(id);resolve()};s.onerror=()=>reject(new Error(`Could not load game localization file: ${id}`));document.head.appendChild(s)}).finally(()=>gameLoading.delete(id));
    gameLoading.set(id,promise);return promise;
  }

  async function setGameLanguage(id,{persist=true,explicit=true,dispatch=true}={}){
    if(!gameLocaleById[id])id=DEFAULT_GAME_LOCALE;
    try{await loadGameScript(id)}catch(err){console.warn('[Aniiland game i18n]',err);id=DEFAULT_GAME_LOCALE;await loadGameScript(id).catch(()=>{})}
    currentGame=id;
    if(explicit)gameExplicit=true;
    if(persist){try{localStorage.setItem(GAME_STORAGE_KEY,id);if(explicit)localStorage.setItem(GAME_EXPLICIT_KEY,'1')}catch{}}
    document.documentElement.dataset.gameLocale=currentGame;
    updatePicker();
    applyDocument();
    if(dispatch)window.dispatchEvent(new CustomEvent('aniiland:gamelanguagechange',{detail:{locale:id}}));
  }

  const uiLoading=new Map();
  function loadUiScript(id){
    if(window.AniilandUITranslations?.[id])return Promise.resolve();
    if(uiLoading.has(id))return uiLoading.get(id);
    const promise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=`languages/ui/${id}.js`;script.onload=resolve;script.onerror=()=>reject(new Error(`Could not load UI translation file: ${id}`));document.head.appendChild(script)}).finally(()=>uiLoading.delete(id));
    uiLoading.set(id,promise);return promise;
  }
  async function setLanguage(id,{persist=true}={}){
    if(!localeById[id])id=DEFAULT_LOCALE;
    try{await loadScript(id);await loadUiScript(id)}catch(err){console.warn('[Aniiland i18n]',err);id=DEFAULT_LOCALE}
    current=id;compileStrings(mergedStrings(id));
    if(persist){try{localStorage.setItem(SITE_STORAGE_KEY,id)}catch{}}
    if(persist&&!gameExplicit){await setGameLanguage(siteToGame[id]||DEFAULT_GAME_LOCALE,{persist:true,explicit:false,dispatch:true})}
    applyDocument();
    window.dispatchEvent(new CustomEvent('aniiland:languagechange',{detail:{locale:id}}));
  }

  function gameId(kind,source){
    source=String(source??'');
    if(kind==='aniimo')source=source.replace(/\s*\(Prismana\)\s*$/i,'');
    return window.AniilandOfficialGameData?.ids?.[kind]?.[source]??null;
  }

  function gameT(kind,source,id=null){
    source=String(source??'');if(!source)return source;
    const prism=kind==='aniimo'&&/\s*\(Prismana\)\s*$/i.test(source);
    const base=prism?source.replace(/\s*\(Prismana\)\s*$/i,''):source;
    const strings=gameRegistry[currentGame]?.strings||{};
    const resolvedId=id??gameId(kind,base);
    const idBucket=strings.ids?.[kind];
    let translated=(resolvedId!=null&&idBucket&&Object.prototype.hasOwnProperty.call(idBucket,String(resolvedId)))?idBucket[String(resolvedId)]:null;
    if(translated==null){
      const bucket=strings[kind];
      if(bucket&&Object.prototype.hasOwnProperty.call(bucket,base))translated=bucket[base];
    }
    if(translated==null&&kind==='auto'){
      for(const k of ['facility','aniimo','item','ability','personality','term']){
        const autoId=gameId(k,base),autoIds=strings.ids?.[k];
        if(autoId!=null&&autoIds&&Object.prototype.hasOwnProperty.call(autoIds,String(autoId))){translated=autoIds[String(autoId)];break}
        if(strings[k]&&Object.prototype.hasOwnProperty.call(strings[k],base)){translated=strings[k][base];break}
      }
    }
    translated=translated??base;
    if(prism){const prismName=strings.term?.Prismana||'Prismana';return `${translated} (${prismName})`}
    return translated;
  }

  function closeMenu(){if(menu)menu.hidden=true;trigger?.setAttribute('aria-expanded','false')}
  function positionMenu(){
    if(!menu||menu.hidden||!trigger)return;
    const r=trigger.getBoundingClientRect(),targetW=window.innerWidth>=900?780:420,w=Math.min(targetW,window.innerWidth-24);
    const left=Math.min(window.innerWidth-w-12,Math.max(12,r.right-w));
    let top=r.bottom+8;const maxH=Math.min(720,window.innerHeight-24);if(top+maxH>window.innerHeight-8)top=Math.max(8,r.top-maxH-8);
    Object.assign(menu.style,{width:`${w}px`,left:`${left}px`,top:`${top}px`,maxHeight:`${maxH}px`});
  }

  function translatedLanguageName(meta){
    const lang=meta?.language||meta?.id?.split(/[-_]/)[0]||'';let name='';
    try{name=new Intl.DisplayNames([current],{type:'language'}).of(lang)||''}catch{}
    if(!name){try{name=new Intl.DisplayNames(['en'],{type:'language'}).of(lang)||meta?.native||meta?.id||''}catch{name=meta?.native||meta?.id||''}}
    if(name)name=name.charAt(0).toLocaleUpperCase(current)+name.slice(1);
    if(meta?.variant)name+=` (${meta.variant})`;
    return name;
  }

  function renderPickerGrid(){
    if(!menu)return;
    const grid=menu.querySelector('.language-grid');if(!grid)return;
    const list=pickerMode==='game'?gameLocales:locales,active=pickerMode==='game'?currentGame:current;
    grid.innerHTML=list.map(l=>`<button type="button" class="language-option ${l.id===active?'active':''}" data-locale="${l.id}"><img src="languages/flags/${l.flag}.svg" alt="" loading="lazy"><span><b>${l.native}</b><small>${translatedLanguageName(l)}</small></span><i aria-hidden="true">✓</i></button>`).join('');
  }

  function makePicker(){
    if(document.getElementById('language-trigger'))return;
    const nav=document.querySelector('header nav');if(!nav)return;
    trigger=document.createElement('button');trigger.type='button';trigger.id='language-trigger';trigger.className='language-trigger';trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('data-i18n-ignore','');nav.appendChild(trigger);
    const translationNote=document.createElement('button');
    translationNote.type='button';translationNote.id='translation-note-trigger';translationNote.className='translation-note-trigger';translationNote.textContent='?';translationNote.setAttribute('aria-label','Translation information');translationNote.setAttribute('data-i18n-ignore','');nav.appendChild(translationNote);
    const translationDialog=document.createElement('dialog');translationDialog.id='translation-note-dialog';translationDialog.className='info-dialog translation-note-dialog';translationDialog.setAttribute('data-i18n-ignore','');document.body.appendChild(translationDialog);
    const renderTranslationNote=()=>{translationDialog.innerHTML=`<button type="button" class="close" data-translation-note-close aria-label="Close">×</button><h2>${window.AniilandV2Text?.t?.('translation_note_title')||'Translation note'}</h2><p>${window.AniilandV2Text?.t?.('translation_note_body')||''}</p><p>${window.AniilandV2Text?.t?.('translation_help')||''}</p>`};
    translationNote.addEventListener('click',()=>{renderTranslationNote();translationDialog.showModal()});translationDialog.addEventListener('click',e=>{if(e.target.closest('[data-translation-note-close]'))translationDialog.close()});
    menu=document.createElement('div');menu.id='language-menu';menu.className='language-menu';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Languages');menu.setAttribute('data-i18n-ignore','');
    menu.innerHTML=`<div class="language-menu-head"><div><b data-picker-title>Languages</b><span data-picker-caption></span></div></div><div class="language-split"><button type="button" class="language-mode active" data-language-mode="site"><img alt=""><span><b data-site-language-label>Site Language</b><small data-site-language-current></small></span></button><button type="button" class="language-mode" data-language-mode="game"><img alt=""><span><b data-game-language-label>Game Language</b><small data-game-language-current></small></span></button></div><div class="language-mode-note"></div><div class="language-grid"></div>`;
    document.body.appendChild(menu);
    trigger.addEventListener('click',e=>{e.stopPropagation();const opening=menu.hidden;menu.hidden=!opening;trigger.setAttribute('aria-expanded',opening?'true':'false');if(opening){updatePicker();positionMenu()}});
    menu.addEventListener('click',async e=>{
      const mode=e.target.closest('[data-language-mode]');if(mode){pickerMode=mode.dataset.languageMode;updatePicker();return}
      const btn=e.target.closest('[data-locale]');if(!btn)return;
      if(pickerMode==='game')await setGameLanguage(btn.dataset.locale,{persist:true,explicit:true,dispatch:true});
      else await setLanguage(btn.dataset.locale,{persist:true});
      closeMenu();
    });
    document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target!==trigger)closeMenu()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
    window.addEventListener('resize',positionMenu,{passive:true});
    window.addEventListener('scroll',()=>{if(menu&&!menu.hidden)positionMenu()},{passive:true,capture:true});
    updatePicker();
  }

  function updatePicker(){
    if(!trigger||!menu)return;
    const meta=localeById[current]||localeById[DEFAULT_LOCALE],gameMeta=gameLocaleById[currentGame]||gameLocaleById[DEFAULT_GAME_LOCALE];
    trigger.innerHTML=`<img src="languages/flags/${meta.flag}.svg" alt=""><i aria-hidden="true">⌄</i>`;
    trigger.title=`${translateString('Site Language')}: ${meta.native} · ${translateString('Game Language')}: ${gameMeta.native}`;
    trigger.setAttribute('aria-label',trigger.title);
    const translationNote=document.getElementById('translation-note-trigger');if(translationNote)translationNote.hidden=current==='en-US'||current==='en-GB';
    const title=menu.querySelector('[data-picker-title]');if(title)title.textContent=translateString('Languages');
    const caption=menu.querySelector('[data-picker-caption]');if(caption)caption.textContent=pickerMode==='game'?translateString('Official game languages'):translateString('Aniiland interface');
    const siteLabel=menu.querySelector('[data-site-language-label]');if(siteLabel)siteLabel.textContent=translateString('Site Language');
    const gameLabel=menu.querySelector('[data-game-language-label]');if(gameLabel)gameLabel.textContent=translateString('Game Language');
    const siteCurrent=menu.querySelector('[data-site-language-current]');if(siteCurrent)siteCurrent.textContent=meta.native;
    const gameCurrent=menu.querySelector('[data-game-language-current]');if(gameCurrent)gameCurrent.textContent=gameMeta.native;
    const siteMode=menu.querySelector('[data-language-mode="site"]'),gameMode=menu.querySelector('[data-language-mode="game"]');
    if(siteMode){siteMode.classList.toggle('active',pickerMode==='site');siteMode.querySelector('img').src=`languages/flags/${meta.flag}.svg`}
    if(gameMode){gameMode.classList.toggle('active',pickerMode==='game');gameMode.querySelector('img').src=`languages/flags/${gameMeta.flag}.svg`}
    const note=menu.querySelector('.language-mode-note');if(note)note.textContent=pickerMode==='game'?translateString('In-game names'):translateString('Aniiland interface');
    renderPickerGrid();
  }

  function startObserver(){
    if(observer||!document.body)return;
    observer=new MutationObserver(records=>{for(const rec of records){if(rec.type==='characterData')applyTextNode(rec.target);else for(const n of rec.addedNodes)applyNode(n)}});
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  async function init(){
    if(ready)return;ready=true;makePicker();startObserver();
    try{await loadGameScript(currentGame)}catch(err){console.warn('[Aniiland game i18n]',err);currentGame=DEFAULT_GAME_LOCALE;await loadGameScript(currentGame).catch(()=>{})}
    await setLanguage(current,{persist:false});
    document.documentElement.dataset.gameLocale=currentGame;updatePicker();
    // The planner script is loaded before DOMContentLoaded. Re-emit the selected official
    // game locale after its table has loaded so initial game-owned labels render correctly.
    window.dispatchEvent(new CustomEvent('aniiland:gamelanguagechange',{detail:{locale:currentGame,initial:true}}));
  }

  window.AniilandI18n={
    locales:[...locales],gameLocales:[...gameLocales],
    getLanguage:()=>current,setLanguage,
    getGameLanguage:()=>currentGame,setGameLanguage,
    t:s=>translateString(String(s??'')),gameT,gameId,
    retranslate:applyDocument
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
