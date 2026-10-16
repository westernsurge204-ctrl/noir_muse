'use strict';
(function(){
const $=id=>document.getElementById(id),storage='noirMuseDossierDetailsV1';
const specs={
'Forehead':['Average','Broad','Narrow','Rounded','High forehead'],
'Facial asymmetry':['Natural subtle asymmetry','Uneven smile','Slightly uneven eyes','Distinctive asymmetric features'],
'Eye size':['Small','Medium','Large','Naturally proportioned'],
'Eye spacing':['Close-set','Average','Wide-set'],
'Eyelids':['Monolid','Hooded','Double eyelid','Heavy-lidded','Visible crease'],
'Under-eye appearance':['Natural softness','Full under-eyes','Light shadows','Subtle under-eye lines'],
'Nose bridge':['Low bridge','Straight bridge','High bridge','Prominent bridge'],
'Nose tip':['Rounded','Upturned','Downturned','Defined','Soft tip'],
'Lip shape':['Rounded','Cupid bow','Wide smile','Soft asymmetrical'],
'Natural lip color':['Pink-brown','Rose','Neutral brown','Mauve','Deep brown'],
'Skin undertone':['Warm','Cool','Neutral','Olive','Golden'],
'Distinctive marks':['None','Freckles','Beauty mark','Dimples','Small scar','Birthmark'],
'Haircut':['Long layers','Blunt cut','Wolf cut','Bob','Lob','Pixie','Shag','U-cut','Straight cut'],
'Signature hairstyle':['Loose natural hair','Soft waves','Straight and loose','Low messy bun','Ponytail','Half-up','Braided','Short tousled'],
'Fringe / bangs':['None','Curtain bangs','Full fringe','Side bangs','Wispy bangs'],
'Hair parting':['Center','Left side','Right side','Natural uneven part'],
'Hair volume':['Fine','Average','Full','Thick','Voluminous'],
'Bust proportions':['Small','Average','Full','Proportionate to frame'],
'Torso length':['Short torso','Balanced torso','Long torso'],
'Leg proportions':['Shorter legs','Balanced','Long-legged'],
'Overall silhouette':['Straight','Hourglass','Pear-shaped','Athletic','Soft curvy'],
'Teeth and smile':['Natural teeth','Toothy smile','Closed-lip smile','Slightly uneven teeth','One-sided smile'],
'Signature features':['Subtle dimples','Distinctive smile','Signature glasses','Natural facial asymmetry','Beauty mark'],
'Face shape':['Oval','Soft oval','Round','Heart-shaped','Square','Diamond','Oblong','Softly angular'],
'Cheeks':['Natural fullness','Full cheeks','High cheekbones','Softly rounded cheeks','Subtle cheekbones'],
'Jawline':['Soft taper','Rounded jaw','Defined jaw','Narrow jaw','Broad jaw'],
'Chin':['Rounded','Narrow rounded','Pointed','Square','Softly tapered'],
'Eye shape':['Almond','Round','Downturned','Upturned','Heavy-lidded','Hooded','Deep-set'],
'Eye color':['Dark brown','Brown','Hazel','Light brown','Green','Blue','Gray'],
'Eyebrows':['Softly arched','Straight','Full natural','Fine natural','Uneven natural','High arch'],
'Nose':['Small straight','Rounded tip','Soft button','Defined bridge','Wide bridge','Aquiline'],
'Lips':['Natural medium','Full','Thin','Defined cupid bow','Uneven natural'],
'Skin tone':['Fair warm','Light brown','Medium brown','Deep brown','Olive','Neutral beige'],
'Skin texture':['Natural pores','Freckles','Slight uneven pigmentation','Natural under-eye softness','Visible fine skin texture'],
'Hair color':['Natural black','Dark brown','Chestnut','Light brown','Blonde','Auburn','Cherry highlights'],
'Hair length':['Short','Shoulder length','Mid-back','Waist length','Long'],
'Hair texture':['Straight','Loose waves','Natural waves','Defined curls','Coily','Slightly frizzy'],
'Height':['5 ft 0 in','5 ft 2 in','5 ft 4 in','5 ft 6 in','5 ft 8 in','5 ft 10 in','6 ft 0 in'],
'Body frame':['Petite','Slim','Athletic','Average','Curvy','Broad','Soft natural build'],
'Shoulders':['Narrow','Average','Broad','Soft rounded'],
'Waist':['Natural','Defined','Straight','Soft waist'],
'Hips':['Narrow','Balanced','Rounded','Wide'],
'Posture':['Relaxed','Upright','Casual slouch','Athletic'],
'Personality':['Mischievous','Quiet','Confident','Playful','Awkward','Reserved','Funny','Warm','Sarcastic','Expressive'],
'Typical expression':['Subtle smile','Asymmetric smile','Sleepy neutral','Raised eyebrow','Playful smirk','Relaxed neutral']
};
const labels=Object.keys(specs);let currentId=null;
function read(){try{return JSON.parse(localStorage.getItem(storage)||'{}')}catch{return {}}}
function write(d){try{localStorage.setItem(storage,JSON.stringify(d));return true}catch{return false}}
function persistedProfile(){try{const a=JSON.parse(localStorage.getItem('noirMuseAtelierPreviewV1')||'{}');return a.characters||[]}catch{return []}}
const host=$('characterEditor');if(!host)return;
const section=document.createElement('section');section.className='dossierDetails';section.innerHTML='<div class="divider"></div><div class="subhead"><h3>Identity details</h3><span class="eyebrow">INDEPENDENT LOCKS</span></div><p class="dataHint">Choose precise features or select Custom. Lock each detail to prevent accidental changes. These structured choices are saved with the dossier and included in the generated identity description.</p><div class="btnrow" style="margin:12px 0"><button type="button" class="btn" id="dossierLockAll">Lock all</button><button type="button" class="btn quiet" id="dossierUnlockAll">Unlock all</button></div><div class="field" style="margin-bottom:12px"><label for="dossierSearch">Find a detail</label><input id="dossierSearch" type="search" placeholder="Search face, hair, skin, body…"></div><div id="dossierDetailGrid" class="formgrid"></div><p id="dossierDetailStatus" class="status" role="status"></p>';
host.querySelector('.btnrow').before(section);
const grid=section.querySelector('#dossierDetailGrid'),controls={};
const groupDefinitions=[
['Face & facial structure',['Face shape','Forehead','Cheeks','Jawline','Chin','Facial asymmetry']],
['Eyes, brows, nose & lips',['Eye shape','Eye color','Eye size','Eye spacing','Eyelids','Under-eye appearance','Eyebrows','Nose','Nose bridge','Nose tip','Lips','Lip shape','Natural lip color']],
['Skin & distinguishing marks',['Skin tone','Skin undertone','Skin texture','Distinctive marks']],
['Hair identity',['Hair color','Hair length','Hair texture','Haircut','Signature hairstyle','Fringe / bangs','Hair parting','Hair volume']],
['Body & proportions',['Height','Body frame','Shoulders','Bust proportions','Waist','Hips','Torso length','Leg proportions','Overall silhouette']],
['Signature characteristics',['Posture','Personality','Typical expression','Teeth and smile','Signature features']]
];
const groups={};for(const [name,fields] of groupDefinitions){const details=document.createElement('details');details.className='identityGroup';details.open=name==='Hair identity';const summary=document.createElement('summary');summary.textContent=name;const inner=document.createElement('div');inner.className='formgrid';details.append(summary,inner);grid.append(details);for(const field of fields)groups[field]=inner}

for(const label of labels){const id='detail-'+label.toLowerCase().replace(/[^a-z0-9]+/g,'-');const cell=document.createElement('div');cell.className='field';cell.dataset.detailLabel=label.toLowerCase();const title=document.createElement('label');title.htmlFor=id;title.textContent=label;const sel=document.createElement('select');sel.id=id;sel.add(new Option('Not specified',''));for(const option of specs[label])sel.add(new Option(option,option));sel.add(new Option('Custom…','__custom__'));const custom=document.createElement('input');custom.placeholder='Custom '+label.toLowerCase();custom.hidden=true;custom.maxLength=240;custom.setAttribute('aria-label','Custom '+label);const lockLabel=document.createElement('label');lockLabel.className='detailLock';const check=document.createElement('input');check.type='checkbox';check.setAttribute('aria-label','Lock '+label);lockLabel.append(check,document.createTextNode(' Lock this detail'));cell.append(title,sel,custom,lockLabel);(groups[label]||grid).append(cell);controls[label]={sel,custom,check};sel.onchange=()=>{custom.hidden=sel.value!=='__custom__';custom.disabled=check.checked};check.onchange=()=>{sel.disabled=check.checked;custom.disabled=check.checked};}
$('dossierSearch').oninput=()=>{const q=$('dossierSearch').value.trim().toLowerCase();for(const cell of grid.querySelectorAll('[data-detail-label]'))cell.hidden=!cell.dataset.detailLabel.includes(q);for(const group of grid.querySelectorAll('.identityGroup')){const visible=[...group.querySelectorAll('[data-detail-label]')].some(cell=>!cell.hidden);group.hidden=!visible;if(q&&visible)group.open=true}};
for(const [button,value] of [['dossierLockAll',true],['dossierUnlockAll',false]])$(button).onclick=()=>{for(const c of Object.values(controls)){c.check.checked=value;c.sel.disabled=value;c.custom.disabled=value}section.querySelector('#dossierDetailStatus').textContent='Locks changed; save dossier to keep them.'};
const originalOpen=window.openCharacter;
if(typeof originalOpen==='function'){window.openCharacter=function(id){originalOpen(id);currentId=id||null;hydrate()}}
else {document.addEventListener('click',e=>{if(e.target?.id==='newCharacter')setTimeout(()=>{currentId=null;hydrate()},0)})}
function hydrate(){const all=read(),record=currentId?all[currentId]:null;for(const [label,c] of Object.entries(controls)){const value=record?.[label]?.value||'';const lock=!!record?.[label]?.locked;c.sel.value=specs[label].includes(value)?value:value?'__custom__':'';c.custom.value=c.sel.value==='__custom__'?value:'';c.custom.hidden=c.sel.value!=='__custom__';c.check.checked=lock;c.sel.disabled=lock;c.custom.disabled=lock}section.querySelector('#dossierDetailStatus').textContent=''}
function capture(){const d={};for(const [label,c] of Object.entries(controls)){const value=c.sel.value==='__custom__'?c.custom.value.trim():c.sel.value;d[label]={value,locked:c.check.checked}}return d}
function describe(details){return Object.entries(details).filter(([,v])=>v.value).map(([k,v])=>k+': '+v.value).join('; ')}
$('saveCharacter').addEventListener('click',()=>{setTimeout(()=>{const name=$('cName').value.trim();const c=persistedProfile().find(x=>x.name===name);if(!c)return;const all=read();const next=capture();const previous=all[c.id]||{};for(const [k,v] of Object.entries(previous))if(v.locked&&next[k]?.value!==v.value)next[k]=v;all[c.id]=next;if(write(all)){currentId=c.id;const text=describe(next);const savedData=JSON.parse(localStorage.getItem('noirMuseAtelierPreviewV1'));const target=savedData.characters.find(x=>x.id===c.id);if(target){target.identityDetails=next;try{localStorage.setItem('noirMuseAtelierPreviewV1',JSON.stringify(savedData))}catch{}}const live=data.characters.find(x=>x.id===c.id);if(live)live.identityDetails=next;if(typeof renderStudio==='function')renderStudio();section.querySelector('#dossierDetailStatus').textContent='Individual details and locks saved.'}else section.querySelector('#dossierDetailStatus').textContent='Could not save detailed fields.'},0)});
// The core compiler incorporates identityDetails directly; no global overrides needed.
})();