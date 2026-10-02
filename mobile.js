(()=>{
  const mq=window.matchMedia('(max-width:760px), (max-width:960px) and (pointer:coarse)');
  const sidebar=document.querySelector('.planner-sidebar');
  const toggle=document.querySelector('[data-mobile-settings-toggle]');
  const summary=document.querySelector('[data-mobile-settings-summary]');
  if(!sidebar||!toggle||!summary)return;
  const settingsDisclosures=[...sidebar.querySelectorAll('[data-mobile-expand]')];
  const mobileDisclosureState=new Map();

  const getGoal=()=>document.querySelector('#strategy-grid .goal-btn.active')?.textContent?.trim()||document.querySelector('#strategy')?.selectedOptions?.[0]?.textContent?.trim()||'Planner';
  const getWorkerSummary=()=>{
    if(document.querySelector('#custom-aniimo-open.active'))return window.AniilandI18n?.t?.('Custom Aniimo Team')||'Custom Aniimo Team';
    const mode=document.querySelector('#worker button.active')?.dataset.worker;
    const worker=mode==='minimum'?'Minimum':mode==='4'?'Lv.4 Prismana':'Trait Lvl.3';
    const enabled=['bonus','climate','light-climate','emode'].filter(id=>{
      const input=document.getElementById(id);
      return input&&!input.disabled&&input.checked;
    }).length;
    return `${window.AniilandI18n?.t?.(worker)||worker} · ${enabled} ${window.AniilandV2Text?.t?.('options_on')||'options on'}`;
  };
  const updateSettingsChoices=()=>{
    const goalChoice=document.querySelector('[data-settings-choice="goal"]');
    const workerChoice=document.querySelector('[data-settings-choice="workers"]');
    if(goalChoice)goalChoice.textContent=getGoal();
    if(workerChoice)workerChoice.textContent=getWorkerSummary();
  };
  const updateSummary=()=>{
    const rv=document.querySelector('#level-value')?.value||document.querySelector('#level-value')?.textContent?.trim()||document.querySelector('#level')?.value||'—';
    summary.textContent=`RV ${rv} · ${getGoal()}`;
    updateSettingsChoices();
  };
  window.addEventListener('aniiland:languagechange',updateSummary);
  window.addEventListener('aniiland:gamelanguagechange',updateSummary);
  const setOpen=(open)=>{
    if(!mq.matches)open=false;
    sidebar.classList.toggle('mobile-settings-open',!!open);
    toggle.setAttribute('aria-expanded',open?'true':'false');
    const action=toggle.querySelector('.mobile-settings-action>span');
    if(action)action.textContent=open?'Close':'Adjust';
  };
  const syncMode=()=>{
    document.documentElement.classList.toggle('aniiland-phone',mq.matches);
    settingsDisclosures.forEach(disclosure=>{
      if(mq.matches){
        if(!mobileDisclosureState.has(disclosure))mobileDisclosureState.set(disclosure,disclosure.open);
        disclosure.open=true;
      }else if(mobileDisclosureState.has(disclosure)){
        disclosure.open=mobileDisclosureState.get(disclosure);
        mobileDisclosureState.delete(disclosure);
      }
    });
    if(!mq.matches)setOpen(false);
    updateSummary();
  };

  toggle.addEventListener('click',()=>setOpen(!sidebar.classList.contains('mobile-settings-open')));
  document.addEventListener('click',e=>{
    if(!mq.matches||document.documentElement.classList.contains('guide-open'))return;
    if(!sidebar.contains(e.target)||e.target.closest('header nav [data-tab]')||e.target.closest('#optimize'))setOpen(false);
  });
  document.addEventListener('keydown',e=>{
    if(!mq.matches||e.key!=='Escape'||!sidebar.classList.contains('mobile-settings-open'))return;
    setOpen(false);
    toggle.focus();
  });

  const level=document.querySelector('#level-value');
  const goals=document.querySelector('#strategy-grid');
  const workers=document.querySelector('#worker');
  if(level)new MutationObserver(updateSummary).observe(level,{childList:true,subtree:true,characterData:true});
  if(goals)new MutationObserver(updateSummary).observe(goals,{attributes:true,subtree:true,attributeFilter:['class']});
  if(workers)new MutationObserver(updateSettingsChoices).observe(workers,{attributes:true,subtree:true,attributeFilter:['class']});
  document.querySelector('#strategy')?.addEventListener('change',updateSummary);
  sidebar.addEventListener('change',e=>{
    if(e.target.matches('#bonus,#climate,#light-climate,#emode'))updateSettingsChoices();
  });
  sidebar.addEventListener('input',e=>{if(e.target.matches('#level,#level-value'))updateSummary()});
  sidebar.addEventListener('change',e=>{if(e.target.matches('#level,#level-value'))updateSummary()});
  updateSettingsChoices();

  // Mobile Production Plan quick tree: reuse the desktop navigator, but make it
  // feel like a compact phone drawer. The app creates it lazily after RV changes.
  let quickNavRaf=0;
  const updateQuickNavActive=()=>{
    if(!mq.matches)return;
    const nav=document.querySelector('#plan-quick-nav');
    if(!nav||nav.hidden)return;
    const buttons=[...nav.querySelectorAll('[data-plan-nav-target]')];
    if(!buttons.length)return;
    const probe=Math.max(88,Math.min(window.innerHeight*.34,230));
    let active=buttons[0];
    for(const btn of buttons){
      const target=document.getElementById(btn.dataset.planNavTarget);
      if(!target)continue;
      const r=target.getBoundingClientRect();
      if(r.top<=probe)active=btn;
      else break;
    }
    buttons.forEach(btn=>btn.classList.toggle('active',btn===active));
  };
  const queueQuickNavActive=()=>{
    if(quickNavRaf)return;
    quickNavRaf=requestAnimationFrame(()=>{quickNavRaf=0;updateQuickNavActive()});
  };
  window.addEventListener('scroll',queueQuickNavActive,{passive:true});
  window.addEventListener('resize',queueQuickNavActive,{passive:true});
  document.addEventListener('click',e=>{
    if(!mq.matches)return;
    const jump=e.target.closest('[data-plan-nav-target]');
    if(jump){
      // Let the main app start the smooth scroll first, then tuck the drawer away.
      requestAnimationFrame(()=>{
        const nav=document.querySelector('#plan-quick-nav');
        nav?.classList.add('collapsed');
        try{localStorage.setItem('aniiland-quick-nav-collapsed','true')}catch{}
        setTimeout(updateQuickNavActive,260);
      });
    }
  });
  const content=document.querySelector('#content');
  if(content)new MutationObserver(queueQuickNavActive).observe(content,{childList:true,subtree:true});
  new MutationObserver(queueQuickNavActive).observe(document.body,{childList:true});


  // In the mobile Event Center, switching a tab scrolls the large activation/header area away
  // so the selected tab gets the full phone screen instead of being squeezed into the bottom.
  document.addEventListener('click',e=>{
    if(!mq.matches)return;
    const tab=e.target.closest('[data-event-tab]');
    if(!tab)return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const scroller=document.querySelector('#event-center-content');
      const tabs=document.querySelector('#event-center-content .event-tabs');
      if(scroller&&tabs)scroller.scrollTo({top:Math.max(0,tabs.offsetTop-2),behavior:'smooth'});
    }));
  });

  mq.addEventListener?.('change',syncMode);
  window.addEventListener('orientationchange',()=>setTimeout(syncMode,80));
  syncMode();
})();
