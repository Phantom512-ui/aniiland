// Joint steady-state mixed-integer model. All material quantities are batches/hour.
// Production and sales are separate variables: a unit can be consumed or sold, never both.
export function speed(level,required,gathering,bonus=false){
  const above=Math.max(0,level-required);
  return (gathering?1+above*(required===1?.5:.4):above===0?1:2+above)*(bonus?1.2:1);
}

// Crops and trees keep their fixed grow time. Planting/tending/harvesting are separate
// Aniimo jobs and are budgeted below.
export function cycle(item,settings){
  if(item.seconds)return item.seconds;
  const level=settings.worker==='minimum'?item.minAbility:Number(settings.worker);
  const bonus=settings.bonus&&!['Dance Pad Polisher','Aniipod Maker'].includes(item.facility);
  return item.workload/speed(level,item.minAbility,!Object.keys(item.ingredients).length,bonus);
}

export function eligible(data,settings){
  const mods=data.modules;
  let items=data.items.filter(i=>{
    const f=settings.facilities[i.facility];
    if(i.byproductOnly||!f||f.count<1||i.facilityLevel>f.level)return false;
    if(i.module){const[k,n]=i.module.split(':');if(mods[k][settings.level-1]<+n)return false}
    if(i.event&&!settings.events)return false;
    if(['quick_wool','quick_scales'].includes(i.id)&&!settings.unverified)return false;
    if(data.special.some(s=>s.name===i.id)&&!settings.special.includes(i.id))return false;
    if(!settings.climate&&i.environment)return false;
    if(settings.lightClimate===false&&i.environment==='Adequate')return false;
    if(settings.worker!=='minimum'&&i.minAbility>+settings.worker)return false;
    return i.seconds>0||i.workload>0;
  });

  // Woodland and Mine are RV-progression gatherers. Always run their newest eligible tier so
  // Wood Blocks / Mineral Sand keep pace with the RV instead of being traded away for short-term
  // coin profit. Every Woodland recipe in a tier has the same Wood Block yield in the current data;
  // Mine has one recipe per tier, so this also means "newest Mine recipe" exactly.
  for(const facility of ['Woodland','Mine']){
    const available=items.filter(i=>i.facility===facility);
    if(!available.length)continue;
    const newest=Math.max(...available.map(i=>i.facilityLevel));
    items=items.filter(i=>i.facility!==facility||i.facilityLevel===newest);
  }
  return items;
}

const expression=terms=>terms
  .filter(([c])=>Math.abs(c)>1e-11)
  .map(([c,n],idx)=>`${c<0?' - ':idx?' + ':''}${Math.abs(c).toFixed(10)} ${n}`).join('')||'0 dummy';

export function buildModel(data,settings){
  let items=eligible(data,settings);

  // Remove impossible ingredient chains, including missing sources.
  let change=true;
  while(change){
    const produced=new Set(items.map(i=>i.product));
    if(items.some(i=>i.facility==='Woodland'))produced.add('wood_block');
    if(items.some(i=>i.facility==='Mine'))produced.add('mineral_sand');
    const next=items.filter(i=>Object.keys(i.ingredients).every(k=>produced.has(k)));
    change=next.length!==items.length;
    items=next;
  }

  const products=[...new Set([...items.map(i=>i.product),'wood_block','mineral_sand'])];
  const objectives=[],constraints=[],bounds=['dummy = 0'],integers=[];
  const facilities=Object.entries(settings.facilities)
    .filter(([name,f])=>f.count>0&&items.some(i=>i.facility===name));
  let serial=0;
  const add=(terms,sign,rhs)=>constraints.push(` c${serial++}: ${expression(terms)} ${sign} ${rhs}`);

  // Whole plots and their fixed growth throughput.
  items.forEach((i,n)=>{
    if(!i.seconds)return;
    integers.push(`z${n}`);
    bounds.push(`0 <= z${n} <= ${settings.facilities[i.facility].count}`);
    add([[1,`q${n}`],[-3600/cycle(i,settings),`z${n}`]],'<=',0);
    if(i.cost)objectives.push([-i.cost,`q${n}`]);
  });

  const foodProducts=new Map();
  items.forEach(i=>{if(i.energy>0&&!foodProducts.has(i.product))foodProducts.set(i.product,i.energy)});
  const upgradeCost=data.levelUpCosts?.[String(settings.level+1)];
  const upgradeItems=settings.strategy==='upgrade'&&upgradeCost?upgradeCost.items:{};

  // Every ingredient is either consumed, fed, reserved for an RV upgrade, or sold.
  products.forEach((p,n)=>{
    const item=items.find(i=>i.product===p);
    const price=item?.currency==='coins'?item.price:0;
    if(price>0)objectives.push([price,`s${n}`]); else bounds.push(`s${n} = 0`);
    const terms=[[-1,`s${n}`]];
    if(foodProducts.has(p)){bounds.push(`f${n} >= 0`);terms.push([-1,`f${n}`])}
    if(upgradeItems[p]){bounds.push(`r${n} >= 0`);terms.push([-1,`r${n}`])}
    items.forEach((i,j)=>{
      let coef=(i.product===p?i.yield:0)-(i.ingredients[p]||0);
      if(p==='wood_block'&&i.facility==='Woodland')coef+=i.byproduct;
      if(p==='mineral_sand'&&i.facility==='Mine')coef+=i.byproduct;
      if(coef)terms.push([coef,`q${j}`]);
    });
    add(terms,'>=',0);
  });

  // These presets guarantee a small set-and-forget side stream, then maximize the remaining cash.
  const sideTargets=[];
  if(['xp','xp_aniipod'].includes(settings.strategy))sideTargets.push('Dance Pad Polisher');
  if(settings.strategy==='xp_aniipod')sideTargets.push('Aniipod Maker');
  for(const facility of sideTargets){
    const candidates=items.map((i,n)=>[i,n]).filter(([i])=>i.facility===facility).sort((a,b)=>b[0].facilityLevel-a[0].facilityLevel);
    if(candidates.length){const[i,n]=candidates[0];add([[1,`q${n}`]],'>=',.1*3600/cycle(i,settings))}
  }

  // A normal machine stays assigned to one recipe. Only the non-sale Bench/Kiln progression
  // chains take turns on a machine.
  facilities.forEach(([name,f],facilityIndex)=>{
    const subset=items.map((i,j)=>[i,j]).filter(([i])=>i.facility===name);
    if(subset[0][0].seconds){
      add(subset.map(([,j])=>[1,`z${j}`]),'<=',f.count);
      return;
    }
    const regular=subset.filter(([i])=>i.currency!=='none');
    const shared=subset.filter(([i])=>i.currency==='none');
    const capacity=[];
    for(const[i,j]of regular){
      integers.push(`u${j}`);
      bounds.push(`0 <= u${j} <= ${f.count}`);
      add([[cycle(i,settings),`q${j}`],[-3600,`u${j}`]],'<=',0);
      capacity.push([1,`u${j}`]);
    }
    if(shared.length){
      integers.push(`m${facilityIndex}`);
      bounds.push(`0 <= m${facilityIndex} <= ${f.count}`);
      add([...shared.map(([i,j])=>[cycle(i,settings),`q${j}`]),[-3600,`m${facilityIndex}`]],'<=',0);
      capacity.push([1,`m${facilityIndex}`]);
    }
    add(capacity,'<=',f.count);
  });

  // Workers can move between jobs of the same ability while processors wait for ingredients.
  // Gatherers stay resident. Crop jobs use only their actual work time and do not extend growth.
  const staffGroups=new Map();
  const group=(key,label)=>{
    if(!staffGroups.has(key))staffGroups.set(key,{key,label,terms:[]});
    return staffGroups.get(key);
  };
  items.forEach((i,j)=>{
    if(i.seconds){
      for(const s of i.steps)group(`grow:${s.ability}`,`${s.ability} crop work`).terms.push([s.workload,`q${j}`]);
      return;
    }
    const bonus=settings.bonus&&!['Dance Pad Polisher','Aniipod Maker'].includes(i.facility);
    const key=bonus?`work:${i.ability}:${i.facility}`:`work:${i.ability}`;
    const label=bonus?`${i.ability} · ${i.facility} personality`:`${i.ability} work`;
    if(Object.keys(i.ingredients).length===0)group(key,label).terms.push([3600,`u${j}`]);
    else group(key,label).terms.push([cycle(i,settings),`q${j}`]);
  });

  // Each climate building selects one mode and one feasible non-overlapping coverage layout.
  const climateChoices=[];
  if(settings.climate&&data.coverage){
    const climates=[
      ['Heat Furnace',['Warm','Scorching'],'Fire'],
      ['Cooling Unit',['Cool','Freeze'],'Ice'],
      ['Sunlamp',['Adequate'],'Light']
    ];
    for(const[building,modes,ability]of climates){
      const total=settings.facilities[building]?.count||0;
      const all=[];
      for(const mode of modes){
        const relevant=items.map((i,n)=>[i,n]).filter(([i])=>i.environment===mode);
        if(!relevant.length)continue;
        const choices=[];
        data.coverage.options.forEach(option=>{
          const name=`env${climateChoices.length}`;
          climateChoices.push({name,building,mode,...option});
          integers.push(name);
          bounds.push(`0 <= ${name} <= ${total}`);
          choices.push([name,option]);
          all.push([1,name]);
          group(`env:${building}`,`${ability} · ${building}`).terms.push([3600,name]);
        });
        for(const[size,position]of [[5,0],[4,1],[2,2]]){
          const rel=relevant.filter(([i])=>(i.facility==='Farmland'?2:i.facility==='Woodland'?4:5)===size);
          if(!rel.length)continue;
          const demand=rel.map(([,n])=>[1,`z${n}`]);
          add([...demand,...choices.map(([name,o])=>[-o.counts[position],name])],'<=',0);
        }
      }
      if(all.length)add(all,'<=',total);
    }
  }

  // One hauling Aniimo is reserved. All other work, including climate facilities, must fit
  // inside the user's RV-level cap.
  const staffList=[...staffGroups.values()];
  if(settings.level>1){
    const cap=data.aniimo[settings.level-1];
    const staffTerms=[];
    staffList.forEach((g,n)=>{
      integers.push(`w${n}`);
      bounds.push(`0 <= w${n} <= ${cap}`);
      add([...g.terms,[-3600,`w${n}`]],'<=',0);
      staffTerms.push([1,`w${n}`]);
      // Break equal-profit ties in favour of the smallest team. One thousandth of a coin per
      // worker-hour is far below the displayed precision and cannot change a meaningful plan.
      objectives.push([-0.001,`w${n}`]);
    });
    add(staffTerms,'<=',Math.max(0,cap-1));

    const energyPerHour=(settings.energyPerMinute??data.energyConsumptionPerMinute??10)*60;
    const foodTerms=[];
    products.forEach((p,n)=>{if(foodProducts.has(p))foodTerms.push([foodProducts.get(p),`f${n}`])});
    staffList.forEach((g,n)=>foodTerms.push([-energyPerHour,`w${n}`]));
    add(foodTerms,'>=',energyPerHour); // hauling is the fixed extra resident
  }

  // One unit of g_upgrade is one complete next-level package. Cash includes the requested
  // 30% buffer; seed purchases come from the same cash stream.
  if(settings.strategy==='upgrade'&&upgradeCost){
    bounds.push('g_upgrade >= 0');
    for(const[p,amount]of Object.entries(upgradeItems)){
      const n=products.indexOf(p);
      if(n>=0)add([[1,`r${n}`],[-amount,'g_upgrade']],'>=',0);else bounds.push('g_upgrade = 0');
    }
    const cash=[];
    products.forEach((p,n)=>{const i=items.find(x=>x.product===p);if(i?.currency==='coins')cash.push([i.price,`s${n}`])});
    items.forEach((i,n)=>{if(i.seconds&&i.cost)cash.push([-i.cost,`q${n}`])});
    cash.push([-upgradeCost.coins*1.3,'g_upgrade']);
    add(cash,'>=',0);
    objectives.length=0;
    objectives.push([1000000,'g_upgrade']);
  }

  const lp=`Maximize\n profit: ${expression(objectives)}\nSubject To\n${constraints.join('\n')}\nBounds\n ${bounds.join('\n ')}\n${integers.length?'Generals\n '+integers.join(' '):''}\nEnd`;
  return {lp,items,products,facilities,staffList,settings,climateChoices,aniimoCap:data.aniimo[settings.level-1],foodProducts,upgradeCost};
}

export function decode(model,result){
  if(!['Optimal','Time limit reached'].includes(result.Status))throw Error(`No feasible plan: ${result.Status}`);
  const val=k=>Math.max(0,result.Columns?.[k]?.Primal||0);
  const {items,products,facilities,staffList,settings,aniimoCap,foodProducts,upgradeCost}=model;
  const rows=items.map((i,n)=>({
    id:i.id,
    facility:i.facility,
    batches:val(`q${n}`),
    produced:val(`q${n}`)*i.yield,
    plots:i.seconds?Math.round(val(`z${n}`)):null,
    units:i.seconds?null:(i.currency==='none'?null:Math.round(val(`u${n}`))),
    shared:i.currency==='none',
    seconds:cycle(i,settings),
    machineHours:cycle(i,settings)*val(`q${n}`)/3600
  })).filter(r=>r.batches>1e-7);

  const sales=products.map((p,n)=>{
    const i=items.find(i=>i.product===p);
    return {id:p,quantity:val(`s${n}`),price:i?.price||0};
  }).filter(s=>s.quantity>1e-7);
  const food=products.map((p,n)=>({id:p,quantity:val(`f${n}`),energy:foodProducts.get(p)||0})).filter(x=>x.quantity>1e-7);
  const upgradeReserved=products.map((p,n)=>({id:p,quantity:val(`r${n}`)})).filter(x=>x.quantity>1e-7);

  const staff={};
  if(settings.level>1){
    staff.Hauling=1;
    staffList.forEach((g,n)=>{const workers=Math.round(val(`w${n}`));if(workers)staff[g.label]=workers});
  }

  const gross=sales.reduce((a,s)=>a+s.quantity*s.price,0);
  const seedCost=rows.reduce((a,r)=>{const i=items.find(x=>x.id===r.id);return a+(i.seconds?(i.cost||0)*r.batches:0)},0);
  const seeds=rows.filter(r=>items.find(x=>x.id===r.id).seconds).map(r=>{const i=items.find(x=>x.id===r.id);return{id:r.id,quantity:r.batches,cost:(i.cost||0)*r.batches}});
  const byproducts={wood_block:0,mineral_sand:0};
  rows.forEach(r=>{
    const i=items.find(i=>i.id===r.id);
    if(i.facility==='Woodland')byproducts.wood_block+=i.byproduct*r.batches;
    if(i.facility==='Mine')byproducts.mineral_sand+=i.byproduct*r.batches;
  });

  // Independently audit balances and facility capacity before displaying a result.
  for(const product of products){
    const made=rows.reduce((a,r)=>a+(items.find(i=>i.id===r.id).product===product?r.produced:0),0)+(byproducts[product]||0);
    const consumed=rows.reduce((a,r)=>a+(items.find(i=>i.id===r.id).ingredients[product]||0)*r.batches,0);
    const sold=sales.find(s=>s.id===product)?.quantity||0;
    const fed=food.find(s=>s.id===product)?.quantity||0;
    const reserved=upgradeReserved.find(s=>s.id===product)?.quantity||0;
    if(consumed+sold+fed+reserved>made+1e-4)throw Error(`Material balance failed: ${product}`);
  }
  for(const[name,f]of facilities){
    const rs=rows.filter(r=>r.facility===name);
    const used=rs[0]?.plots!==null
      ?rs.reduce((a,r)=>a+r.plots,0)
      :rs.filter(r=>!r.shared).reduce((a,r)=>a+r.units,0)+Math.ceil(rs.filter(r=>r.shared).reduce((a,r)=>a+r.machineHours,0)-1e-7);
    if(used>f.count+1e-5)throw Error(`Facility capacity exceeded: ${name}`);
  }
  if(Object.values(staff).reduce((a,b)=>a+b,0)>(settings.level===1?0:aniimoCap))throw Error('Aniimo cap exceeded');

  return {
    status:result.Status,
    proven:result.Status==='Optimal',
    rows,
    sales,
    food,
    seeds,
    upgradeReserved,
    staff,
    gross,
    cost:seedCost,
    net:gross-seedCost,
    byproducts,
    level:settings.level,
    climate:model.climateChoices.filter(c=>val(c.name)>.5).map(c=>({...c,count:Math.round(val(c.name))})),
    upgradeRate:upgradeCost?val('g_upgrade'):0,
    upgradeCost
  };
}
