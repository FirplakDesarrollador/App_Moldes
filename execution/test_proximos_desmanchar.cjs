const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ts=require('typescript');
let pages=[],queries=[],failure=null;
const db={from(table){
 assert.equal(table,'moldes');const calls=[];queries.push(calls);
 const q={};for(const name of ['select','gt','order','range'])q[name]=(...args)=>{calls.push([name,...args]);return q};
 q.then=(yes,no)=>Promise.resolve({data:pages.shift()||[],error:failure}).then(yes,no);
 return q;
}};
const context={exports:{},console,require:name=>name.includes('supabase')?{createClient:()=>db}:{ensureMoldPlant:async()=>{}}};
const source=ts.transpileModule(fs.readFileSync('src/services/molds.service.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
vm.runInNewContext(source,context);
const run=()=>context.exports.moldsService.getMoldesProximosDesmanchar();
(async()=>{
 const mold=(id,actual,limit)=>({id,serial:'M'+id,nombre_articulo:'Molde '+id,vueltas_actuales:actual,Vueltas_Desmanchado:limit});
 const filler=Array.from({length:500},(_,i)=>mold(i,1,28));
 pages=[filler,filler,[mold(1001,27,28),mold(1002,28,28),mold(1003,29,28),mold(1004,null,28),mold(1005,11,12),mold(1006,19,20),mold(1007,35,36),mold(1008,0,null),mold(1009,-1,0)]];
 const result=await run();
 assert.deepEqual(Array.from(result,r=>r.id),[1001,1006,1007]);
 assert.equal(queries.length,3);assert.deepEqual(queries[2].find(x=>x[0]==='range'),['range',1000,1499]);
 assert.ok(queries.every(q=>q.every(c=>!JSON.stringify(c).includes('estado'))));
 pages=[[]];assert.equal((await run()).length,0);
 failure={message:'Error simulado'};await assert.rejects(run(),e=>e.message==='Error simulado');
 console.log('PASS: igualdad exacta, límite 12 excluido, límites 20/28/36 incluidos, nulos y sobrepasados excluidos, paginación más allá de 1000, todos los estados, vacío y errores.');
})().catch(e=>{console.error(e);process.exitCode=1});
