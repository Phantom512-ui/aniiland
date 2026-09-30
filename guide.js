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

  const tr=s=>window.AniilandI18n?.t?.(s)||s;
  const ft=(key,fallback)=>window.AniilandFeatureText?.t?.(key,fallback)||fallback;
  let steps=[];
  const buildSteps=()=>[
    {
      title:tr('Your RV Level'),
      getEls(){return [$('.planner-sidebar .eyebrow'),$('.level-heading'),$('#level'),$('.setup-mode-main')].filter(Boolean)},
      copy:`<p>${ft('setup','Simple Setup uses the normal RV defaults. Custom Setup lets you match the facilities and RV Components you actually own.')}</p>`
    },
    {
      title:tr('Your Homeland Goal'),
      getEls(){return [$('#strategy-grid'),$('.goal-shared-note')].filter(Boolean)},
      copy:`<p>${ft('goal','Choose what the planner should prioritize while it keeps the required RV upgrade materials running.')}</p>`
    },
    {
      title:tr('Your Aniimo Workers'),
      getEls(){return [$('#worker')?.previousElementSibling,$('#worker'),$('#custom-aniimo-open')].filter(Boolean)},
      copy:`<p>${ft('workers','Minimum uses the lowest valid trait level. Trait Level 3 is the recommended default. Lv.4 uses the best verified workers.')}</p>`
    },
    {
      title:tr('Sections'),
      getEls(){return [$('#plan-quick-nav')].filter(Boolean)},
      copy:`<p>${ft('results','Use the result sections to see what to grow, produce, sell, and which Aniimos and support facilities are needed.')}</p>`
    },
    {
      title:tr('Event Center'),
      getEls(){return [$('#event-center-btn')].filter(Boolean)},
      copy:`<p>${ft('event','Event Center keeps seasonal tools separate from the normal production plan.')}</p>`
    },
    {
      title:tr('Order Solver'),
      getEls(){return [$('.order-fab-row'),$('.order-panel')].filter(Boolean)},
      copy:`<p>${ft('orders','Order Solver handles temporary orders without replacing the permanent production plan.')}</p>`
    },
    {
      title:tr('Floor Planner'),
      getEls(){return [header.querySelector('nav [data-tab="layout"]')].filter(Boolean)},
      copy:`<p>${ft('floor','Floor Planner turns the current plan into a layout. Changes made while it is open redeploy automatically; Reverse Layout restores one of the last five layouts.')}</p>`
    }
  ];

  const targetForStep=step=>{
    const els=typeof step.getEls==='function'?step.getEls():[];
    for(const el of els){const disclosure=el?.closest('details');if(disclosure)disclosure.open=true;}
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
    activeRect=targetForStep(steps[index]).rect||activeRect;
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

  function open(){steps=buildSteps();index=0;overlay.hidden=false;document.documentElement.classList.add('guide-open');render()}
  function close(){overlay.hidden=true;document.documentElement.classList.remove('guide-open');activeRect=null}

  btn.addEventListener('click',open);
  overlay.addEventListener('click',e=>{
    if(!card.contains(e.target))return close();
    if(e.target.closest('[data-guide-close]'))return close();
    if(e.target.closest('[data-guide-back]')){if(index>0){index--;render()}return}
    if(e.target.closest('[data-guide-next]')){if(index>=steps.length-1)return close();index++;render();return}
  });
  window.addEventListener('resize',()=>{if(resizeRaf)return;resizeRaf=requestAnimationFrame(()=>{resizeRaf=0;place()})});
  window.addEventListener('aniiland:languagechange',()=>{if(!overlay.hidden){steps=buildSteps();index=Math.min(index,steps.length-1);render()}});
  document.addEventListener('scroll',()=>{if(!overlay.hidden)place()},{passive:true,capture:true});
  document.addEventListener('keydown',e=>{if(!overlay.hidden&&e.key==='Escape')close()});
})();
