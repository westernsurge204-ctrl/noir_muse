'use strict';
(function(){
const $=id=>document.getElementById(id);
const legacyProfile='noirMuseProfiles',legacyScenes='noirMuseScenes';
const target='noirMuseAtelierPreviewV1';
const box=document.createElement('article');box.className='panel';box.innerHTML='<h3>Bring your Classic characters</h3><p class="dataHint">Preview the migration, then import copies. Your original Classic records are never deleted or modified.</p><div class="btnrow"><button class="btn" id="migrationInspect">Check Classic records</button><button class="btn primary" id="migrationImport">Import copies</button></div><p id="migrationStatus" class="status" role="status"></p>';
const section=$('characters');section.append(box);
function parse(key){try{let v=localStorage.getItem(key);return v?JSON.parse(v):{}}catch{return null}}
function inspect(){const profiles=parse(legacyProfile),scenes=parse(legacyScenes);if(!profiles||!scenes||Array.isArray(profiles)||typeof profiles!=='object'){ $('migrationStatus').textContent='Classic data could not be read safely; no changes made.';return null}let names=Object.keys(profiles).filter(k=>profiles[k]&&typeof profiles[k]==='object');$('migrationStatus').textContent=names.length?names.length+' Classic characters found. Import makes separate copies.':'No Classic character profiles found in this browser.';return {profiles,scenes,names}}
$('migrationInspect').onclick=inspect;
$('migrationImport').onclick=()=>{
 const source=inspect();if(!source||!source.names.length)return;
 const oldText=localStorage.getItem(target);
 let data;try{data=oldText?JSON.parse(oldText):{version:1,characters:[],outfits:[],scenes:[]};if(!Array.isArray(data.characters)||!Array.isArray(data.scenes)||!Array.isArray(data.outfits))throw Error('Invalid Atelier data')}catch{$('migrationStatus').textContent='Atelier data invalid; nothing changed.';return}
 const stamp=JSON.stringify(data);let count=0,sceneCount=0;
 for(const name of source.names){
   const legacy=source.profiles[name], origin='classic:'+name;
   if(data.characters.some(c=>c.legacySource===origin))continue;
   const dna=legacy.dna||legacy;
   const read=(id)=>typeof dna[id]==='string'?dna[id]:'';
   const id=crypto.randomUUID(),character={id,name:read('name')||name,age:Math.max(18,Number.parseInt(read('age'))||25),face:[read('face'),read('eyes'),read('nose'),read('lips'),read('brows')].filter(Boolean).join('; '),skin:read('skin'),hair:read('hair'),body:[read('body'),read('bust'),read('waist'),read('hips'),read('physique')].filter(Boolean).join('; '),personality:read('details'),legacySource:origin,createdAt:new Date().toISOString()};
   data.characters.push(character);count++;
   const originalScenes=source.scenes?.[name];
   if(originalScenes&&typeof originalScenes==='object'&&!Array.isArray(originalScenes))for(const [title,values] of Object.entries(originalScenes)){if(!values||typeof values!=='object')continue;data.scenes.push({id:crypto.randomUUID(),story:'Imported from Classic',title,characterId:id,characterName:character.name,identitySnapshot:structuredClone(character),outfit:JSON.stringify(legacy.outfit||{}),pose:values.pose||'',notes:JSON.stringify(values),mood:values.expression||'',camera:values.capture||'',place:values.location||'',lighting:values.lighting||'',prompt:'Imported Classic scene settings — edit in Classic or create a new Atelier prompt.',createdAt:new Date().toISOString()});sceneCount++}
 }
 if(!count){$('migrationStatus').textContent='All discovered Classic characters were previously imported.';return}
 if(!confirm('Import '+count+' Classic characters and '+sceneCount+' scene records as separate copies?'))return;
 try{const value=JSON.stringify(data);localStorage.setItem(target,value);if(localStorage.getItem(target)!==value)throw Error('Save verification failed');$('migrationStatus').textContent=count+' character copies and '+sceneCount+' scenes imported. Refresh to view them.';}catch(e){if(oldText===null)localStorage.removeItem(target);else localStorage.setItem(target,oldText);$('migrationStatus').textContent='Migration could not be saved. Original Classic records are unaffected.'}
};
})();