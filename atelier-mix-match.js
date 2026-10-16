'use strict';
(function(){
const options={
 Top:['None','Ribbed cotton top','Classic shirt','Halterneck top','Printed kurti','Satin blouse','Knit cardigan'],
 Bottom:['None','Straight jeans','Wide-leg trousers','Denim skirt','Pleated skirt','Tailored shorts','Palazzo trousers'],
 Dress:['None','Floral sundress','Satin midi dress','Cotton maxi dress','Tailored jumpsuit','Printed saree'],
 Shoes:['None','White sneakers','Flat sandals','Ankle boots','Strappy heels','Loafers'],
 Accessories:['None','Silver pendant','Gold necklace','Hoop earrings','Hairband','Silk scarf','Shoulder bag'],
 Color:['None','Ivory','Blush pink','Midnight blue','Olive green','Burgundy','Lilac','Champagne']
};
const key='noirMuseAtelierMixFavoritesV1', $=id=>document.getElementById(id);
const state=Object.fromEntries(Object.keys(options).map(k=>[k,{value:'None',locked:false}]));
function favorites(){try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[]}catch{return []}}
function store(list){try{const raw=JSON.stringify(list);localStorage.setItem(key,raw);if(localStorage.getItem(key)!==raw)throw Error('Write not retained');return true}catch{message('Save failed. Check browser storage.');return false}}
function message(t){$('mixFeedback').textContent=t}
const panel=document.createElement('article');panel.className='panel';
panel.innerHTML='<div class="subhead"><h3>Mix & Match</h3><span class="eyebrow">CURATE A LOOK</span></div><p class="dataHint">Choose garments and accessories, lock favorites, and shuffle the rest. Every saved look belongs to its character.</p><div class="formgrid" id="mixGrid"></div><div class="btnrow" style="margin:14px 0"><button class="btn" id="mixShuffle">↝ Shuffle</button><button class="btn primary" id="mixApply">Apply to outfit</button><button class="btn" id="mixReset">Clear unlocked</button></div><div id="mixPreview" class="output" style="min-height:70px"></div><div class="divider"></div><h3>Favorite Looks</h3><div class="formgrid"><div class="field"><label for="mixName">Look name</label><input id="mixName" maxlength="90" placeholder="Friday evening"></div><div class="field"><label for="mixFavorite">Saved favorites</label><select id="mixFavorite"></select></div></div><div class="btnrow" style="margin-top:12px"><button class="btn primary" id="mixSave">Save favorite</button><button class="btn" id="mixLoad">Load favorite</button><button class="btn quiet" id="mixDelete">Delete</button></div><p id="mixFeedback" class="status" role="status"></p>';
const studio=document.querySelector('#studio .stack'); const dice=[...studio.querySelectorAll('.panel')].find(p=>p.textContent.includes('Creative Dice'));studio.insertBefore(panel,dice);
function description(){return Object.entries(state).filter(([,v])=>v.value!=='None').map(([k,v])=>k+': '+v.value).join('; ')}
function render(){const root=$('mixGrid');root.replaceChildren();for(const [k,choices] of Object.entries(options)){const wrap=document.createElement('div');wrap.className='field';const label=document.createElement('label');label.textContent=k;label.htmlFor='mix-'+k;const sel=document.createElement('select');sel.id='mix-'+k;for(const opt of choices)sel.add(new Option(opt,opt));sel.value=state[k].value;sel.onchange=()=>{state[k].value=sel.value;preview()};const lock=document.createElement('button');lock.type='button';lock.className='chip'+(state[k].locked?' locked':'');lock.textContent=state[k].locked?'🔒 Locked':'🔓 Lock';lock.setAttribute('aria-pressed',String(state[k].locked));lock.onclick=()=>{state[k].locked=!state[k].locked;render()};wrap.append(label,sel,lock);root.append(wrap)}preview()}
function preview(){$('mixPreview').textContent=description()||'Select your favorite pieces to build a look.'}
function characterId(){return $('sCharacter').value}
function renderFavorites(){const sel=$('mixFavorite'),prev=sel.value;sel.replaceChildren(new Option('Choose a favorite',''));for(const look of favorites().filter(x=>x.characterId===characterId()))sel.add(new Option(look.name,look.id));if([...sel.options].some(x=>x.value===prev))sel.value=prev}
$('mixShuffle').onclick=()=>{for(const [k,v] of Object.entries(state)){if(v.locked)continue;const choices=options[k].filter(x=>x!=='None'&&x!==v.value);v.value=choices[Math.floor(Math.random()*choices.length)]}render()};
$('mixReset').onclick=()=>{for(const v of Object.values(state))if(!v.locked)v.value='None';render()};
$('mixApply').onclick=()=>{const text=description();if(!text){message('Choose some pieces first.');return}const field=$('sOutfit');field.value=[field.value.trim(),text].filter(Boolean).join('; ');field.dispatchEvent(new Event('input',{bubbles:true}));message('Look added to current scene. Character DNA unchanged.')};
$('mixSave').onclick=()=>{const name=$('mixName').value.trim(),id=characterId();if(!name||!id||!description()){message('Select a character, choose pieces and enter a look name.');return}const list=favorites();list.push({id:crypto.randomUUID(),characterId:id,name,parts:JSON.parse(JSON.stringify(state))});if(store(list)){renderFavorites();message('Favorite saved locally for this character.')}};
$('mixLoad').onclick=()=>{const found=favorites().find(x=>x.id===$('mixFavorite').value&&x.characterId===characterId());if(!found)return;for(const [k,v] of Object.entries(found.parts||{}))if(state[k]&&options[k].includes(v.value))state[k]={value:v.value,locked:!!v.locked};render();message('Favorite loaded. Apply when ready.')};
$('mixDelete').onclick=()=>{const id=$('mixFavorite').value,found=favorites().find(x=>x.id===id&&x.characterId===characterId());if(!found||!confirm('Delete favorite '+found.name+'?'))return;if(store(favorites().filter(x=>x.id!==id))){renderFavorites();message('Favorite deleted.')}};
$('sCharacter').addEventListener('change',renderFavorites);
render();renderFavorites();
})();