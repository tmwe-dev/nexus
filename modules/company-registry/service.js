'use strict';
const companies=new Map();
function normalize(input={}){const id=String(input.nexus_id||input.id||input.vat_number||input.tax_id||'').trim();if(!id)throw new Error('company_id_required');return {nexus_id:id,name:String(input.name||input.company_name||'').trim(),legal_name:String(input.legal_name||input.name||'').trim(),vat_number:input.vat_number||null,tax_id:input.tax_id||null,country:input.country||null,city:input.city||null,address:input.address||null,website:input.website||null,industry:input.industry||null,source:input.source||'nexus',updated_at:new Date().toISOString(),...input,nexus_id:id};}
async function upsert(input){const value=normalize(input);companies.set(value.nexus_id,value);return value;}
async function get(id){return companies.get(String(id))||null;}
async function list({search='',limit=50,offset=0}={}){const q=String(search).trim().toLowerCase();let items=[...companies.values()];if(q)items=items.filter(x=>[x.name,x.legal_name,x.vat_number,x.tax_id,x.country,x.city,x.website].some(v=>String(v||'').toLowerCase().includes(q)));return {items:items.slice(offset,offset+limit),total:items.length,limit,offset};}
module.exports={normalize,upsert,get,list};
