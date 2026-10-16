'use strict';
(function(){
const $=id=>document.getElementById(id);
const library={
"Top":["Keep current","Fitted cotton tee","Ribbed square-neck top","Linen shirt","Cropped cardigan","Halterneck top","Oversized printed tee","Satin blouse","Silk camisole","Denim shirt","Cotton kurti","Embroidered blouse","Knit sweater","Sports tee"],
"Bottom":["Keep current","Straight jeans","Wide-leg jeans","Denim mini skirt","Pleated midi skirt","Tailored trousers","Cotton shorts","Cargo pants","Palazzo trousers","Satin skirt","Athletic shorts","Leggings"],
"One-piece":["None","Floral sundress","Linen shirt dress","Satin midi dress","Evening maxi dress","Black jumpsuit","Cotton saree","Silk saree","Anarkali suit","Salwar suit","Printed co-ord","One-piece swimsuit","Two-piece swimsuit"],
"Color":["Natural / unspecified","Ivory","White","Black","Charcoal","Beige","Champagne","Blush pink","Dusty rose","Coral","Burgundy","Scarlet","Terracotta","Mustard","Olive","Emerald","Mint","Sky blue","Navy","Lavender","Plum","Chocolate brown","Silver","Gold"],
"Hair":["Keep signature hair","Loose natural waves","Straight and loose","Low messy bun","High ponytail","Low ponytail","Half-up style","Loose braid","Messy top bun","Claw-clip updo","Side-parted waves","Soft curls","Sleek bun"],
"Accessories":["None","Delicate silver pendant","Gold necklace","Small hoops","Statement earrings","Watch","Bangles","Sunglasses","Hairband","Silk scarf","Shoulder bag","Tote bag","Anklet"],
"Location":["Bedroom","Living room","Bathroom mirror","Kitchen","Balcony","Rooftop terrace","Neighborhood café","Bakery","Bookstore","Shopping mall","College campus","Metro station","Cab backseat","Office pantry","Street market","City sidewalk","Salon","Park","Garden","Beach","Beach café","Poolside","Resort room","Hotel lobby","Airport","Train","House party","Nightclub","Wedding","Restaurant","Concert"],
"Expression":["Relaxed","Curious","Mischievous","Shy","Laughing","Excited","Sarcastic","Confident","Sleepy","Surprised","Pouting","Amused","Annoyed","Thoughtful","Awkward","Concerned","Proud","Flirty","Distracted","Playful"],
"Pose":["Natural candid","Sitting casually","Standing with weight on one leg","Walking while looking back","Leaning on a table","Holding a cup","Laughing mid-conversation","Looking over shoulder","Peace sign beside face","Hand on hip","Cross-legged on chair","Lying comfortably on bed","Adjusting hair","Holding phone","Looking out window","Waving at photographer","Showing a new accessory"],
"Camera":["Friend-taken candid","Front-camera selfie","Mirror selfie","Night flash snapshot","Rear-camera candid","Close-up front-camera selfie","Three-quarter portrait","Full-body friend-taken photo","Wide environmental snapshot","Off-center friend snapshot"],
"Lighting":["Ordinary natural daylight","Indoor practical lighting","Phone flash at night","Overcast daylight","Warm evening light"],
"Framing":["Natural imperfect framing","Close-up face","Head and shoulders","Waist-up","Three-quarter body","Full body","Wide scene","Off-center casual crop"]
};
const wrapper=document.createElement('section');wrapper.className='quickPanel panel';
wrapper.innerHTML='<div class="subhead"><div><div class="eyebrow">NOIR MUSE / EASY STUDIO</div><h3 style="margin:5px 0">Make it your moment.</h3></div><span class="eyebrow">SELECT · CUSTOMIZE · COPY</span></div><p class="dataHint">Start with the dropdowns. Every field is optional, and every category supports your own wording. Character identity stays separate.</p><div id="quickDropdowns" class="quickDropdowns"></div><div class="btnrow" style="margin-top:15px"><button type="button" class="btn primary" id="quickGenerate">Generate prompt ↗</button><button type="button" class="btn" id="quickRandom">Surprise unlocked fields</button><button type="button" class="btn quiet" id="quickClear">Reset selections</button></div><p class="status" id="quickStatus" role="status"></p><details class="quickHelp"><summary>How does this work?</summary><p class="dataHint">Choose as few or as many options as you like. Advanced Studio below is always available for handwritten direction. Use Custom in any field when a listed choice does not fit.</p></details>';
const studio=$('studio'),work=studio.querySelector('.workspace');studio.insertBefore(wrapper,work);
const ids={};const selections={};const storageKey='noirMuseEasyStudioV1';
function getValue(k){const select=ids[k].select;return select.value==='__custom__'?ids[k].custom.value.trim():select.value}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(Object.keys(library).map(k=>[k,{value:ids[k].select.value,custom:ids[k].custom.value,locked:ids[k].lock.checked}]))))}catch{}}
function apply(){
const val=k=>getValue(k),location=val('Location'),mood=val('Expression'),camera=val('Camera');
for(const [kind,v] of [['place',location],['mood',mood],['camera',camera]]){if(!diceChoices[kind].includes(v))diceChoices[kind].push(v);diceState[kind]=diceChoices[kind].indexOf(v)}
const outfit=[val('Top'),val('Bottom'),val('One-piece'),val('Color'),val('Hair'),val('Accessories')].filter(v=>v&&!['Keep current','None','Natural / unspecified','Keep signature hair'].includes(v)).join('; ');
$('sOutfit').value=outfit;$('sPose').value=val('Pose');$('sLight').value=val('Lighting');
const framing=val('Framing');$('sNotes').value=framing==='Natural imperfect framing'?'':framing;
renderDice();for(const id of ['sOutfit','sPose','sLight','sNotes'])$(id).dispatchEvent(new Event('input',{bubbles:true}));
saveStudioDraft();return compile();
}
for(const [k,choices] of Object.entries(library)){
const field=document.createElement('div');field.className='quickField';const label=document.createElement('label');label.textContent=k;const select=document.createElement('select');select.id='quick-'+k.replace(/[^a-z]/gi,'');label.htmlFor=select.id;
for(const item of choices)select.add(new Option(item,item));select.add(new Option('✎ Custom…','__custom__'));
const custom=document.createElement('input');custom.placeholder='Describe your own '+k.toLowerCase();custom.hidden=true;custom.setAttribute('aria-label','Custom '+k);custom.maxLength=320;
const lock=document.createElement('input');lock.type='checkbox';lock.title='Lock this choice when randomizing';lock.setAttribute('aria-label','Lock '+k);const lockLabel=document.createElement('label');lockLabel.className='quickLock';lockLabel.append(lock,document.createTextNode(' Keep'));
select.addEventListener('change',()=>{custom.hidden=select.value!=='__custom__';persist();apply()});custom.addEventListener('input',()=>{persist();apply()});lock.addEventListener('change',persist);
field.append(label,select,custom,lockLabel);wrapper.querySelector('#quickDropdowns').append(field);ids[k]={select,custom,lock};
}
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');for(const k of Object.keys(ids)){const v=saved[k];if(!v)continue;ids[k].select.value=[...ids[k].select.options].some(x=>x.value===v.value)?v.value:library[k][0];ids[k].custom.value=v.custom||'';ids[k].custom.hidden=ids[k].select.value!=='__custom__';ids[k].lock.checked=!!v.lock}}catch{}
$('quickGenerate').onclick=()=>{$('quickStatus').textContent='Prompt updated. Copy it from the preview below.';apply();$('prompt').scrollIntoView({behavior:'smooth',block:'center'})};
$('quickRandom').onclick=()=>{for(const [k,opts] of Object.entries(library)){if(ids[k].lock.checked)continue;const pool=opts.filter(x=>!['Keep current','None','Natural / unspecified','Keep signature hair'].includes(x));let next=pool[Math.floor(Math.random()*pool.length)];if(next===ids[k].select.value)next=pool[(pool.indexOf(next)+1)%pool.length];ids[k].select.value=next;ids[k].custom.hidden=true}persist();apply();$('quickStatus').textContent='Unlocked selections shuffled.'};
$('quickClear').onclick=()=>{for(const [k,v] of Object.entries(ids))if(!v.lock.checked){v.select.value=library[k][0];v.custom.value='';v.custom.hidden=true}persist();apply();$('quickStatus').textContent='Unlocked selections reset.'};
})();
