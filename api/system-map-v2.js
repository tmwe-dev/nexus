'use strict';
const systemMap = require('./system-map');

module.exports = async function handler(req,res){
  const chunks=[];
  const mockRes={setHeader(){},status(){return this;},json(payload){chunks.push(payload);return payload;}};
  await systemMap(req,mockRes);
  const base=chunks[0]||{};
  const commit=process.env.VERCEL_GIT_COMMIT_SHA||process.env.NEXUS_RELEASE_SHA||'unknown';
  const branch=process.env.VERCEL_GIT_COMMIT_REF||process.env.NEXUS_RELEASE_BRANCH||'unknown';
  const expected=process.env.NEXUS_EXPECTED_RELEASE_SHA||null;
  const inSync=Boolean(expected&&commit!=='unknown'&&commit.startsWith(expected));
  const groups={...(base.groups||{})};
  if(Array.isArray(groups.safety)){
    groups.safety=groups.safety.map(item=>item[0]==='Production Cutover'?[item[0],Boolean(inSync&&base.runtime?.crm_store_reachable&&base.runtime?.auth_mode==='enforce'&&base.runtime?.connector_conformance===100),'release gate runtime']:item);
    groups.safety.push(['Deployment Sync',inSync,inSync?'vercel/main synced':'out-of-sync']);
  }
  const all=Object.values(groups).flat();
  const done=all.filter(x=>x[1]).length;
  res.setHeader('Cache-Control','no-store');
  return res.status(200).json({...base,contract:'system.map.v2',groups,summary:{done,total:all.length,todo:all.length-done,percent:Math.round(done/all.length*100)},deployment:{commit,branch,expected_release_sha:expected,in_sync:inSync}});
};
