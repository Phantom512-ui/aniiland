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
  mq.addEventListener?.('change',syncMode);
  window.addEventListener('orientationchange',()=>setTimeout(syncMode,80));
  syncMode();
})();
