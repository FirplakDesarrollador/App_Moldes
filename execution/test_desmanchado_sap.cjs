
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),ts=require('typescript');
const transpile=path=>ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
(async()=>{
 let networkCalls=0;
 const routeContext={exports:{},console:{log(){},error(){}},process:{env:{}},fetch:async()=>{networkCalls++;throw Error('No se permite red')},require:name=>{
  if(name==='next/server')return {NextResponse:{json:(body,options)=>({body,status:options?.status||200})}};
  if(name==='undici')return {Agent:class {}};
  throw Error(name);
 }};
 vm.runInNewContext(transpile('src/app/api/sap-items/update/route.ts'),routeContext);
 for(const state of ['En espera - Produccion','EN ESPERA-PRODUCCIÓN','En espera-produccion']){
  const res=await routeContext.exports.POST({json:async()=>({itemCode:'M1',serialNumber:'M1',estado_sap:state})});
  assert.equal(res.body.skipped,true);assert.equal(res.body.success,true);
 }
 assert.equal(networkCalls,0);
 for(const [input,want] of [['En reparación','En reparación'],['Entregado','Activo'],['Destruido','Baja']]){
  const fn=fs.readFileSync('src/app/api/sap-items/update/route.ts','utf8').match(/function mapEstadoToSAP[\s\S]*?\n}/)[0];
  const js=ts.transpileModule(fn,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
  assert.equal(vm.runInNewContext(js+';mapEstadoToSAP('+JSON.stringify(input)+')'),want);
 }
 let queries=[],phase=0,sapPayload;
 const row={id:7,'CODIGO MOLDE':'M1','ESTADO':'En reparación','Modified By':'Sistema Automático'};
 const client={from:table=>{
  const calls=[];queries.push(calls);
  const q={};for(const op of ['select','ilike','or','limit','eq','update'])q[op]=(...args)=>{calls.push([op,...args]);return q};
  q.then=(resolve,reject)=>{
   const data=phase++===0?[row]:phase===2?[{id:7}]:[];
   return Promise.resolve({data,error:null}).then(resolve,reject);
  };
  return q;
 }};
 const context={exports:{},console:{log(){},error(){},warn(){}},Date,crypto:globalThis.crypto,
  fetch:async(url,options)=>{sapPayload=JSON.parse(options.body);return {json:async()=>({success:true})}},
  require:name=>name.includes('supabase')?{createClient:()=>client,createClientTH:()=>client}:{ensureMoldPlant:async()=>{}}};
 vm.runInNewContext(transpile('src/services/molds.service.ts'),context);
 const result=await context.exports.moldsService.notifyAutoDesmanchadoToSAP(7);
 assert.equal(result.notified[0],'M1');assert.equal(sapPayload.estado_sap,'En reparación');
 assert.ok(queries[0].some(c=>c[0]==='eq'&&c[1]==='id'&&c[2]===7));
 assert.ok(queries[0].some(c=>c[0]==='ilike'&&c[1]==='ESTADO'&&c[2]==='%reparaci%'));
 assert.ok(queries[1].some(c=>c[0]==='ilike'&&c[1]==='ESTADO'));
 console.log('PASS: espera de Producción sin acceso a SAP; mapeos reparación/entrega/baja; aviso dirigido y reclamo condicionado al estado.');
})().catch(e=>{console.error(e);process.exitCode=1});
