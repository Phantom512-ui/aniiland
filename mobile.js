(()=>{
  const mq=window.matchMedia('(max-width:760px), (max-width:960px) and (pointer:coarse)');
  const sidebar=document.querySelector('.planner-sidebar');
  const toggle=document.querySelector('[data-mobile-settings-toggle]');
  const summary=document.querySelector('[data-mobile-settings-summary]');
  if(!sidebar||!toggle||!summary)return;

  const getGoal=()=>document.querySelector('#strategy-grid .goal-btn.active')?.textContent?.trim()||document.querySelector('#strategy')?.selectedOptions?.[0]?.textContent?.trim()||'Planner';
  const updateSummary=()=>{
    const rv=document.querySelector('#level-value')?.textContent?.trim()||document.querySelector('#level')?.value||'—';
    summary.textContent=`RV ${rv} · ${getGoal()}`;
  };
  const setOpen=(open)=>{
    if(!mq.matches)open=false;
    sidebar.classList.toggle('mobile-settings-open',!!open);
    toggle.setAttribute('aria-expanded',open?'true':'false');
    const action=toggle.querySelector('.mobile-settings-action>span');
    if(action)action.textContent=open?'Close':'Adjust';
  };
  const syncMode=()=>{
    document.documentElement.classList.toggle('aniiland-phone',mq.matches);
    if(!mq.matches)setOpen(false);
    updateSummary();
  };

  toggle.addEventListener('click',()=>setOpen(!sidebar.classList.contains('mobile-settings-open')));
  document.addEventListener('click',e=>{
    if(!mq.matches)return;
    if(e.target.closest('header nav [data-tab]'))setOpen(false);
    if(e.target.closest('#optimize'))setOpen(false);
  });

  const level=document.querySelector('#level-value');
  const goals=document.querySelector('#strategy-grid');
  if(level)new MutationObserver(updateSummary).observe(level,{childList:true,subtree:true,characterData:true});
  if(goals)new MutationObserver(updateSummary).observe(goals,{attributes:true,subtree:true,attributeFilter:['class']});
  document.querySelector('#strategy')?.addEventListener('change',updateSummary);


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

  mq.addEventListener?.('change',syncMode);
  window.addEventListener('orientationchange',()=>setTimeout(syncMode,80));
  syncMode();
})();
