(()=>{
  const header=document.querySelector('header');
  if(!header)return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.id='guide-open';
  btn.className='guide-open-btn';
  btn.innerHTML='<span class="guide-q">?</span><span>How to use</span>';
  const nav=header.querySelector('nav');
  header.insertBefore(btn,nav);

  const overlay=document.createElement('div');
  overlay.id='guide-overlay';
  overlay.className='guide-overlay';
  overlay.hidden=true;
  overlay.innerHTML='<div class="guide-spotlight"></div><div class="guide-card" role="dialog" aria-modal="true" aria-label="Aniiland quick guide"><div class="guide-progress"></div><div class="guide-step-count"></div><h2></h2><div class="guide-copy"></div><div class="guide-actions"><button type="button" data-guide-close class="guide-skip">Close</button><div><button type="button" data-guide-back class="guide-back">Back</button><button type="button" data-guide-next class="guide-next">Next</button></div></div></div>';
  document.body.appendChild(overlay);

  const spot=overlay.querySelector('.guide-spotlight');
  const card=overlay.querySelector('.guide-card');
  const title=card.querySelector('h2');
  const copy=card.querySelector('.guide-copy');
  const count=card.querySelector('.guide-step-count');
  const progress=card.querySelector('.guide-progress');

  let index=0,activeRect=null,resizeRaf=0;
  const isPhone=()=>window.matchMedia('(max-width:760px), (max-width:960px) and (pointer:coarse)').matches;
  const $=s=>document.querySelector(s);
  const visible=el=>!!(el&&el.getClientRects().length&&!el.hidden);
  const unionRect=els=>{
    const rects=(els||[]).filter(visible).map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0);
    if(!rects.length)return null;
    return rects.reduce((acc,r)=>({left:Math.min(acc.left,r.left),top:Math.min(acc.top,r.top),right:Math.max(acc.right,r.right),bottom:Math.max(acc.bottom,r.bottom)}),{left:rects[0].left,top:rects[0].top,right:rects[0].right,bottom:rects[0].bottom});
  };
  const finalizeRect=r=>r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.right-r.left,height:r.bottom-r.top}:null;

  const steps=[
    {
      title:'Set your RV level',
      getEls(){return [$('.planner-sidebar .eyebrow'),$('.level-heading'),$('#level'),$('.setup-mode-main')].filter(Boolean)},
      copy:'<p>Start by setting the <b>RV level</b> you are actually on. <b>Simple Setup</b> fills in the normal facility counts, unlocks, and modules for that RV automatically.</p><p>Use <b>Custom Setup</b> only when your Homeland is different, or if you lack or don’t want to use certain facilities/modules.</p>'
    },
    {
      title:'Choose your planning goal',
      getEls(){return [$('#strategy-grid'),$('.goal-shared-note')].filter(Boolean)},
      copy:'<p><b>Most Coins</b> spends your spare Homeland capacity on coin profit. <b>Simplest RV Upgrade</b> keeps the plan focused on the cleanest path to the next RV.</p><p><b>Coins &amp; AniiEXP</b> uses spare capacity for Growth items, and <b>Coins &amp; AniiEXP &amp; Aniipods</b> adds Aniipod production too. The three general production goals keep the normal RV-upgrade timing. Simplest RV Upgrade is more aggressive: it keeps both upgrade-material chains running and builds extra Home Coins for the next level.</p>'
    },
    {
      title:'Choose worker strength and plan length',
      getEls(){return [$('#worker'),$('label[for="hours"]'),$('#hours')].filter(Boolean)},
      copy:'<p><b>Minimum</b> uses the lowest ability levels that can do the jobs. <b>Recommended Lv.3+</b> is the normal fast setup. <b>Best available Lv.4</b> uses verified Lv.4 workers and prefers Prismana picks where they actually help.</p><p>The duration only changes for how long we plan the production and the seed supply for it. <b>Till the next RV level</b> is set to run until the slowest upgrade requirement is met.</p>'
    },
    {
      title:'Use the Sections menu to read the result',
      getEls(){return [$('#plan-quick-nav')].filter(Boolean)},
      copy:'<p>The floating <b>Sections</b> menu is the fastest way to move around a finished plan. It jumps you straight to the important parts instead of making you scroll through the whole page.</p><p><b>Overview</b> shows the headline result, <b>What to Grow &amp; Gather</b> and <b>What to Craft</b> show what each facility should run, <b>Aniimo Needed</b> shows the worker types and recommendations, and <b>Climate / Light / Power</b> shows the support setup behind the plan.</p>'
    },
    {
      title:'Track seasonal progress in the Event Center',
      getEls(){return [$('#event-center-btn')].filter(Boolean)},
      copy:'<p>The <b>Event Center</b> is where the Harvest Moon event lives. It keeps the normal planner cleaner by putting the event tools in one place.</p><p>Use it to reserve the event farms, track unlocks, manage event orders and daily tasks, and check the current event strategy.</p>'
    },
    {
      title:'Use Order Solver for temporary requests',
      getEls(){return [$('.order-fab-row'),$('.order-panel')].filter(Boolean)},
      copy:'<p><b>Order Solver</b> is for temporary orders that you want to clear without rebuilding the whole permanent plan by hand.</p><p>Add your active orders there and Aniiland will show the temporary switches needed to make them, while keeping the main production setup intact.</p>'
    },
    {
      title:'Finish with the Floor Planner',
      getEls(){return [header.querySelector('nav [data-tab="layout"]')].filter(Boolean)},
      copy:'<p>Once the Production Plan looks right, open <b>Floor Planner</b> and press <b>Auto-place current production plan</b>. It lays out the active facilities, climate support, storage, and Crackle power coverage for you.</p><p>It is a starting point, not a lock. You can still drag things around afterward and fine-tune the layout manually.</p>'
    }
  ];

  const targetForStep=step=>{
    const els=typeof step.getEls==='function'?step.getEls():[];
    const rect=finalizeRect(unionRect(els));
    const target=els.find(visible)||$('.planner-sidebar')||header;
    return {target,rect};
  };

  const ensureVisible=target=>{
    if(!target)return;
    if(isPhone()&&target.closest('.planner-sidebar')){
      document.querySelector('.planner-sidebar')?.classList.add('mobile-settings-open');
      document.querySelector('[data-mobile-settings-toggle]')?.setAttribute('aria-expanded','true');
    }
    if(target.id==='plan-quick-nav'&&target.hidden)return;
    const r=target.getBoundingClientRect();
    if(r.top<72||r.bottom>window.innerHeight-60)target.scrollIntoView({behavior:'instant',block:'center'});
  };

  function place(){
    if(overlay.hidden||!activeRect)return;
    const pad=isPhone()?8:12;
    const left=Math.max(8,activeRect.left-pad);
    const top=Math.max(8,activeRect.top-pad);
    const width=Math.max(28,Math.min(window.innerWidth-left-8,activeRect.width+pad*2));
    const height=Math.max(28,Math.min(window.innerHeight-top-8,activeRect.height+pad*2));
    Object.assign(spot.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`});

    const cw=Math.min(isPhone()?window.innerWidth-24:460,window.innerWidth-24);
    card.style.width=`${cw}px`;
    requestAnimationFrame(()=>{
      const ch=card.offsetHeight;
      let x=12,y=12;
      if(isPhone()){
        x=Math.max(12,Math.min(window.innerWidth-cw-12,left));
        y=Math.min(window.innerHeight-ch-12,Math.max(12,top+height+14));
        if(y<12||y>window.innerHeight-ch-12)y=window.innerHeight-ch-12;
      }else{
        const gap=18;
        const candidates=[
          {x:left+width+gap,y:Math.max(12,Math.min(window.innerHeight-ch-12,top+(height-ch)/2)),fits:(left+width+gap+cw)<=window.innerWidth-12},
          {x:Math.max(12,left+(width-cw)/2),y:top+height+gap,fits:(top+height+gap+ch)<=window.innerHeight-12},
          {x:left-cw-gap,y:Math.max(12,Math.min(window.innerHeight-ch-12,top+(height-ch)/2)),fits:(left-cw-gap)>=12},
          {x:Math.max(12,left+(width-cw)/2),y:top-ch-gap,fits:(top-ch-gap)>=12}
        ];
        const good=candidates.find(c=>c.fits) || candidates[0];
        x=Math.max(12,Math.min(window.innerWidth-cw-12,good.x));
        y=Math.max(12,Math.min(window.innerHeight-ch-12,good.y));
      }
      card.style.left=`${x}px`;
      card.style.top=`${y}px`;
    });
  }

  function render(){
    const step=steps[index];
    let {target,rect}=targetForStep(step);
    if(!target||!rect){
      target=$('.planner-sidebar')||header;
      const r=target.getBoundingClientRect();
      rect={left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
    }
    ensureVisible(target);
    const fresh=targetForStep(step).rect;
    if(fresh)rect=fresh;
    activeRect=rect;
    count.textContent=`${index+1} / ${steps.length}`;
    progress.innerHTML=steps.map((_,i)=>`<i class="${i<=index?'active':''}"></i>`).join('');
    title.textContent=step.title;
    copy.innerHTML=step.copy;
    card.querySelector('[data-guide-back]').disabled=index===0;
    card.querySelector('[data-guide-next]').textContent=index===steps.length-1?'Done':'Next';
    setTimeout(place,80);
  }

  function open(){index=0;overlay.hidden=false;document.documentElement.classList.add('guide-open');render()}
  function close(){overlay.hidden=true;document.documentElement.classList.remove('guide-open');activeRect=null}

  btn.addEventListener('click',open);
  overlay.addEventListener('click',e=>{
    if(e.target.closest('[data-guide-close]'))return close();
    if(e.target.closest('[data-guide-back]')){if(index>0){index--;render()}return}
    if(e.target.closest('[data-guide-next]')){if(index>=steps.length-1)return close();index++;render();return}
  });
  window.addEventListener('resize',()=>{if(resizeRaf)return;resizeRaf=requestAnimationFrame(()=>{resizeRaf=0;place()})});
  window.addEventListener('scroll',()=>{if(!overlay.hidden)place()},{passive:true});
  document.addEventListener('keydown',e=>{if(!overlay.hidden&&e.key==='Escape')close()});
})();
