const STORE='aniimo-homeland-layout-v132';
const PLOT_W=20,PLOT_H=15,MAP_COLS=4,MAP_ROWS=4,SCALE=18,DRAG_STEP=1/16,AUTO_STEP=.5;
const PLOTS={1:[2,3],2:[1,3],3:[2,2],4:[1,2],5:[3,3],6:[3,2],7:[1,1],8:[2,1],9:[3,1],10:[0,3],11:[0,2],12:[0,1],13:[0,0],14:[1,0],15:[2,0],16:[3,0]};
const MAP_ORDER=[13,14,15,16,12,7,8,9,11,4,3,6,10,2,1,5];
const climateValue={Warm:1,Scorching:2,Cool:-1,Freeze:-2,Adequate:0};
const climateNames=['Heat Furnace','Cooling Unit','Sunlamp'];
const climateColors={Scorching:'#e9805b',Warm:'#efa76f',Cool:'#58b9e8',Freeze:'#769de8',Adequate:'#e9ce56'};
const facilityColors={Farmland:'#62bd83',Woodland:'#32a997',Mine:'#687daf',Well:'#48a8cc','Storage Unit':'#7b8795','Egg Incubator':'#d9a84d'};
const load=()=>{try{return JSON.parse(window.localStorage.getItem(STORE))||{}}catch{return{}}};
const save=s=>window.localStorage.setItem(STORE,JSON.stringify(s));
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const access=i=>i.name==='Egg Incubator'?{x:i.x,y:i.y+i.h,w:i.w,h:1,access:true}:null;
const rectangles=i=>[i,access(i)].filter(Boolean);
const plotRect=id=>{const[c,r]=PLOTS[+id];return{x:c*PLOT_W,y:r*PLOT_H,w:PLOT_W,h:PLOT_H}};
const inflate=(r,g)=>({x:r.x-g,y:r.y-g,w:r.w+2*g,h:r.h+2*g});
const colorFor=i=>climateNames.includes(i.name)?climateColors[i.environment]||'#f0c661':i.environment?climateColors[i.environment]:(facilityColors[i.name]||`hsl(${[...i.name].reduce((a,c)=>a+c.charCodeAt(0)*7,0)%360} 48% 55%)`);
const slotSize=i=>i.name==='Farmland'?2:i.name==='Woodland'?4:Math.max(i.w,i.h)>=4.5?5:Math.max(i.w,i.h);

function insideUnlocked(rect,unlocked){
 // Exact rectangle-in-owned-land check. Plot coordinates are in placement squares;
 // this avoids rounding a facility to a coarse 1/4-square sampling grid.
 const plots=unlocked.map(plotRect).filter(p=>overlaps(rect,p));
 const xs=[rect.x,rect.x+rect.w],ys=[rect.y,rect.y+rect.h];
 for(const p of plots){
  xs.push(Math.max(rect.x,p.x),Math.min(rect.x+rect.w,p.x+p.w));
  ys.push(Math.max(rect.y,p.y),Math.min(rect.y+rect.h,p.y+p.h));
 }
 const sx=[...new Set(xs)].sort((a,b)=>a-b),sy=[...new Set(ys)].sort((a,b)=>a-b);
 for(let xi=0;xi<sx.length-1;xi++)for(let yi=0;yi<sy.length-1;yi++){
  if(sx[xi+1]<=sx[xi]||sy[yi+1]<=sy[yi])continue;
  const x=(sx[xi]+sx[xi+1])/2,y=(sy[yi]+sy[yi+1])/2;
  if(!plots.some(p=>x>=p.x&&x<p.x+p.w&&y>=p.y&&y<p.y+p.h))return false;
 }
 return plots.length>0;
}
function valid(item,items,unlocked,gap=0){
 if(!rectangles(item).every(r=>insideUnlocked(r,unlocked)))return false;
 return !items.some(o=>o.id!==item.id&&rectangles(item).some(a=>rectangles(o).some(b=>overlaps(inflate(a,item.group===o.group?gap:gap+0.5),b))));
}
function desired(ctx,state){
 const labels={};
 for(const row of ctx.plan?.rows||[]){
  if(row.plots==null)continue;
  const product=ctx.data.items.find(x=>x.id===row.id);
  (labels[row.facility]??=[]).push(...Array.from({length:row.plots},()=>({label:product?.name||row.id,environment:product?.environment||''})));
 }
 const climateModes=Object.fromEntries((ctx.plan?.climate||[]).map(x=>[x.building,x.mode]));
 const out=[];
 for(const[name,f]of Object.entries(ctx.config)){
  const size=ctx.data.facilitySizes[name];if(!size||!f.count)continue;
  if(climateNames.includes(name)&&!climateModes[name])continue;
  for(let i=0;i<f.count;i++){
   const product=labels[name]?.[i],environment=product?.environment||climateModes[name]||'';
   const group=environment?`climate:${environment}`:(['Farmland','Woodland','Mine','Well'].includes(name)?'raw':climateNames.includes(name)?'climate:unused':'processing');
   out.push({id:`${name}:${i}`,name,label:product?.label||name,w:size[0],h:size[1],level:f.level,environment,group});
  }
 }
 if(state.storage)for(let i=0;i<3;i++)out.push({id:`Storage Unit:${i}`,name:'Storage Unit',label:'Storage',w:2,h:2,level:1,group:'storage'});
 if(state.incubators)for(let i=0;i<ctx.level+1;i++)out.push({id:`Egg Incubator:${i}`,name:'Egg Incubator',label:`Incubator ${i+1}`,w:2,h:2,level:1,group:'incubator'});
 return out;
}
function autoPlace(ctx,state){
 const wants=desired(ctx,state),unlocked=(state.unlocked||[]).filter(id=>+id<=Math.min(ctx.level,16));
 const placed=[];let moved=0;const missing=[],gap=Number(state.spacing??.5);
 // Climate clusters are rebuilt from the exact solver coverage layout. Other valid
 // positions remain stable when the RV level or production plan changes.
 for(const d of wants.filter(x=>!x.environment&&!climateNames.includes(x.name))){const old=state.items?.[d.id];if(!old)continue;const item={...d,x:old.x,y:old.y};if(valid(item,placed,unlocked,gap))placed.push(item)}
 const failed=new Set(),maxX=MAP_COLS*PLOT_W,maxY=MAP_ROWS*PLOT_H;
 const climateChoices=[...(ctx.plan?.climate||[])].sort((a,b)=>{
  const area=choice=>wants.filter(x=>x.environment===choice.mode&&!climateNames.includes(x.name)).reduce((n,x)=>n+x.w*x.h,0);
  return area(b)-area(a);
 });
 for(const choice of climateChoices){
  const device=wants.find(x=>x.name===choice.building),deps=wants.filter(x=>x.environment===choice.mode&&!climateNames.includes(x.name));
  if(!device)continue;
  const slots=[];
  for(const size of [5,4,2]){
   const group=deps.filter(x=>slotSize(x)===size);
   const available=choice.layout.filter(x=>x.s===size).sort((a,b)=>Math.hypot(a.x+a.s/2,a.y+a.s/2)-Math.hypot(b.x+b.s/2,b.y+b.s/2));
   group.forEach((item,n)=>{if(available[n])slots.push({item,slot:available[n]})});
   if(available.length<group.length)group.slice(available.length).forEach(x=>failed.add(x.id));
  }
  let cluster=null;
  for(let cy=1;cy<=maxY-1&&!cluster;cy+=AUTO_STEP)for(let cx=1;cx<=maxX-1;cx+=AUTO_STEP){
   // Repository layout offsets are relative to the climate device's top-left.
   const candidate=[{...device,x:cx,y:cy},...slots.map(({item,slot})=>({...item,x:cx+slot.x,y:cy+slot.y}))];
   const local=[];const fits=candidate.every(item=>{const ok=valid(item,[...placed,...local],unlocked,0);if(ok)local.push(item);return ok});
   const combined=[...placed,...candidate],climateSafe=combined.filter(x=>x.environment&&!climateNames.includes(x.name)).every(x=>envFor(x,combined,ctx).ok);
   if(fits&&climateSafe){cluster=candidate;break}
  }
  if(cluster){placed.push(...cluster);moved+=cluster.length}else{failed.add(device.id);deps.forEach(x=>failed.add(x.id))}
 }
 const zoneOrder=['climate:Scorching','climate:Warm','climate:Cool','climate:Freeze','climate:Adequate','raw','processing','storage','incubator','climate:unused'];
 const pending=wants.filter(x=>!placed.some(p=>p.id===x.id)&&!failed.has(x.id)).sort((a,b)=>zoneOrder.indexOf(a.group)-zoneOrder.indexOf(b.group)||b.w*b.h-a.w*a.h);
 for(const item of pending){
  let found=false;
  for(let y=0;y<=maxY-item.h-(item.name==='Egg Incubator'?1:0)&&!found;y+=AUTO_STEP)for(let x=0;x<=maxX-item.w;x+=AUTO_STEP){
   const test={...item,x,y};if(!valid(test,placed,unlocked,gap))continue;placed.push(test);moved++;found=true;break;
  }
  if(!found)missing.push(item);
 }
 for(const id of failed){const item=wants.find(x=>x.id===id);if(item)missing.push(item)}
 state.unlocked=unlocked;state.items=Object.fromEntries(placed.map(x=>[x.id,x]));save(state);return{placed,moved,missing};
}
function envFor(item,items,ctx){
 const need=item.environment||'';let temp=0,light=false;
 for(const c of items.filter(x=>climateNames.includes(x.name))){
  const choice=ctx.plan?.climate.find(x=>x.building===c.name);if(!choice)continue;
  const area={x:c.x-3.5,y:c.y-3.5,w:9,h:9};
  if(overlaps(item,area)){if(c.name==='Sunlamp')light=true;else temp+=climateValue[choice.mode]||0}
 }
 return{need,temp,light,ok:!need||(need==='Adequate'?light:climateValue[need]===temp)};
}
function draw(ctx,state,status=''){
 const root=document.querySelector('#layout-root');if(!root)return;
 const limit=Math.min(ctx.level,16),unlocked=(state.unlocked||[]).filter(id=>+id<=limit),items=Object.values(state.items||{});
 root.querySelector('.plot-picker').innerHTML=MAP_ORDER.map(id=>{const available=id<=limit,active=unlocked.includes(String(id));return `<button data-plot="${id}" class="${active?'active':''} ${available?'':'locked'}" ${available?'':'disabled'}><b>Plot ${id}</b><small>${available?(active?'Owned':'Available'):`RV ${id}`}</small></button>`}).join('');
 const canvas=root.querySelector('.layout-canvas');
 const stage=root.querySelector('.layout-canvas-stage');
 applyZoom(root,state);
 canvas.innerHTML=MAP_ORDER.map(id=>{const[c,r]=PLOTS[id],active=unlocked.includes(String(id)),available=id<=limit;return `<div class="land-plot ${active?'unlocked':''} ${available?'available':'locked'}" style="left:${c*PLOT_W*SCALE}px;top:${r*PLOT_H*SCALE}px;width:${PLOT_W*SCALE}px;height:${PLOT_H*SCALE}px"><span>Plot ${id}</span><small>${active?'OWNED':available?'AVAILABLE':`RV ${id}`}</small></div>`}).join('')+items.map(i=>{
  const env=envFor(i,items,ctx),climate=climateNames.includes(i.name),a=access(i);
  const description=`${i.label} · ${i.w}×${i.h}${i.level?` · Lv.${i.level}`:''}${env.need?` · ${env.need} ${env.ok?'covered':'not covered'}`:''}`;
  return `${climate?`<div class="climate-range ${i.name.replaceAll(' ','-').toLowerCase()}" style="left:${(i.x-3.5)*SCALE}px;top:${(i.y-3.5)*SCALE}px;width:${9*SCALE}px;height:${9*SCALE}px"></div>`:''}<div class="placed ${climate?'climate-device':''} ${env.need&&!env.ok?'bad-env':''}" data-id="${i.id}" title="${description}" aria-label="${description}" style="--block-color:${colorFor(i)};left:${i.x*SCALE}px;top:${i.y*SCALE}px;width:${i.w*SCALE}px;height:${i.h*SCALE}px"><span class="sr-only">${description}</span></div>${a?`<div class="access-strip" style="left:${a.x*SCALE}px;top:${a.y*SCALE}px;width:${a.w*SCALE}px;height:${a.h*SCALE}px"></div>`:''}`;
 }).join('');
 const entries=new Map();for(const i of items){const key=i.environment&&!climateNames.includes(i.name)?`${i.label}|${i.name}|${i.environment}`:i.name;const e=entries.get(key)||{label:i.label===i.name?i.name:`${i.label} · ${i.name}`,detail:`${i.w}×${i.h}${i.environment?` · ${i.environment}`:''}`,color:colorFor(i),count:0};e.count++;entries.set(key,e)}
 root.querySelector('.layout-legend').innerHTML=[...entries.values()].map(e=>`<div><i style="background:${e.color}"></i><span><b>${e.label}</b><small>${e.count} placed · ${e.detail}</small></span></div>`).join('')||'<p class="muted">Auto-place facilities to build the legend.</p>';
 const uncovered=items.filter(i=>i.environment&&!climateNames.includes(i.name)&&!envFor(i,items,ctx).ok).length;
 root.querySelector('.layout-status').innerHTML=status||`${items.length} facilities placed · ${unlocked.length} of ${limit} available plots owned${uncovered?` · ${uncovered} climate placements need attention`:' · all climate placements covered'}`;
 bindDrag(ctx,state,canvas);
}
function applyZoom(root,state){const scroll=root.querySelector('.layout-scroll'),stage=root.querySelector('.layout-canvas-stage'),canvas=root.querySelector('.layout-canvas');if(!scroll||!stage||!canvas)return;const z=Math.max(.45,Math.min(1.8,Number(state.zoom)||1));state.zoom=z;stage.style.width=`${Math.round(1440*z)}px`;stage.style.height=`${Math.round(1080*z)}px`;canvas.style.transform=`scale(${z})`;canvas.style.transformOrigin='top left';const meter=root.querySelector('.layout-zoom-value');if(meter)meter.textContent=`${Math.round(z*100)}%`;save(state)}
function fitZoom(root,state){const scroll=root.querySelector('.layout-scroll');if(!scroll)return;const available=Math.max(700,scroll.clientWidth-16);state.zoom=Math.max(.45,Math.min(1.4,available/1440));applyZoom(root,state)}
function bindDrag(ctx,state,canvas){
 canvas.querySelectorAll('.placed').forEach(el=>el.onpointerdown=e=>{e.preventDefault();const id=el.dataset.id,item=state.items[id],start={x:item.x,y:item.y,px:e.clientX,py:e.clientY};el.setPointerCapture(e.pointerId);el.onpointermove=ev=>{item.x=Math.max(0,Math.round((start.x+(ev.clientX-start.px)/SCALE)/DRAG_STEP)*DRAG_STEP);item.y=Math.max(0,Math.round((start.y+(ev.clientY-start.py)/SCALE)/DRAG_STEP)*DRAG_STEP);el.style.left=`${item.x*SCALE}px`;el.style.top=`${item.y*SCALE}px`};el.onpointerup=()=>{const others=Object.values(state.items);if(!valid(item,others,state.unlocked||[],0)){item.x=start.x;item.y=start.y;draw(ctx,state,'That position overlaps another facility, an incubator access strip, or locked land.')}else{save(state);draw(ctx,state)}}});
}
export function renderLayoutPlanner(container,ctx){
 const state=load();state.unlocked??=['1'];state.items??={};state.storage??=ctx.level>=8;state.incubators??=false;state.spacing??=.5;state.zoom??=.85;
 state.unlocked=state.unlocked.map(String).filter(id=>PLOTS[id]&&+id<=Math.min(ctx.level,16));if(!state.unlocked.length&&ctx.level>=1)state.unlocked=['1'];
 container.innerHTML=ctx.title('Floor planner','Each plot is 20×15 squares. Each square is 4×4 tiles, and each tile is 4×4 smallest tiles.')+`<div id="layout-root"><div class="layout-controls"><div><h3>Homeland plots</h3><div class="plot-picker"></div></div><div class="layout-actions"><label class="check"><input id="layout-storage" type="checkbox" ${state.storage?'checked':''}>Include 3 storage units</label><label class="check"><input id="layout-incubators" type="checkbox" ${state.incubators?'checked':''}>Include ${ctx.level+1} egg incubators + access</label><label for="layout-spacing">Space between normal buildings</label><select id="layout-spacing"><option value=".25" ${state.spacing===.25?'selected':''}>Compact · ¼ square</option><option value=".5" ${state.spacing===.5?'selected':''}>Comfortable · ½ square</option><option value="1" ${state.spacing===1?'selected':''}>Wide · 1 square</option></select><div class="layout-zoom-controls"><button type="button" class="secondary" id="layout-zoom-out">−</button><button type="button" class="secondary" id="layout-zoom-fit">Fit</button><button type="button" class="secondary" id="layout-zoom-in">+</button><span class="layout-zoom-value">100%</span></div><button class="primary" id="auto-layout">Auto-place this production plan</button><button class="secondary" id="clear-layout">Clear facility positions</button></div></div><div class="note"><b>Exact Homeland scale:</b> 1 plot = 20×15 squares · 1 square = 4×4 tiles · 1 tile = 4×4 smallest tiles. Climate devices are 2×2 squares with a 9×9-square range, and any positive overlap is enough to apply the full effect.</div><div class="layout-workspace"><div class="layout-scroll"><div class="layout-canvas-stage"><div class="layout-canvas"></div></div></div><aside class="layout-legend" aria-label="Facility color legend"></aside></div><div class="layout-status"></div><p class="hint">Blocks are color-coded; hover a block for its exact name, footprint, level and climate status. The grid shows placement squares with 4×4 tile subdivisions. Dragging snaps to the smallest tile (1/16 square). Incubators reserve one square of access space in front.</p></div>`;
 const root=container.querySelector('#layout-root');
 root.onclick=e=>{const p=e.target.closest('[data-plot]');if(p&&!p.disabled){const id=p.dataset.plot;state.unlocked=state.unlocked.includes(id)?state.unlocked.filter(x=>x!==id):[...state.unlocked,id];save(state);draw(ctx,state);return}if(e.target.closest('#layout-zoom-in')){state.zoom=Math.min(1.8,(Number(state.zoom)||1)+.1);applyZoom(root,state);return}if(e.target.closest('#layout-zoom-out')){state.zoom=Math.max(.45,(Number(state.zoom)||1)-.1);applyZoom(root,state);return}if(e.target.closest('#layout-zoom-fit')){fitZoom(root,state);return}if(e.target.closest('#auto-layout')){const r=autoPlace(ctx,state),missing=[...new Set(r.missing.map(x=>x.label))].join(', ');draw(ctx,state,r.missing.length?`Could not fit ${r.missing.length} facilities (${missing}) with the selected spacing. Mark more plots as owned or reduce spacing.`:`Placed everything; ${r.moved} new or invalid facilities moved · all climate placements covered.`)}if(e.target.closest('#clear-layout')){state.items={};save(state);draw(ctx,state,'Facility positions cleared; owned plots were kept.')}};
 root.onchange=e=>{if(e.target.id==='layout-storage')state.storage=e.target.checked;if(e.target.id==='layout-incubators')state.incubators=e.target.checked;if(e.target.id==='layout-spacing')state.spacing=Number(e.target.value);save(state);draw(ctx,state)};
 draw(ctx,state);
 setTimeout(()=>fitZoom(root,state),0);
}

