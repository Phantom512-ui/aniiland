import highsModule from './vendor/highs/highs.mjs';
import {buildModel,decode} from './solver.js';
let highs;
self.onmessage=async({data:{id,data,settings}})=>{try{highs??=await highsModule({locateFile:path=>new URL('./vendor/highs/'+path,import.meta.url).href});const model=buildModel(data,settings);const solved=highs.solve(model.lp,{time_limit:15,mip_rel_gap:0});self.postMessage({id,result:decode(model,solved)})}catch(e){self.postMessage({id,error:String(e.message||e)})}};
