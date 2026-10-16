const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const pageUrl = pathToFileURL(path.resolve(__dirname, '../../atelier-preview.html')).href;
async function start(page) { await page.goto(pageUrl); }
async function createCharacter(page, name='Test Character') {
 await page.getByRole('button',{name:'Characters',exact:true}).click();
 await page.getByRole('button',{name:'＋ New Character'}).click();
 await page.locator('#cName').fill(name);
 await page.locator('#cAge').fill('25');
 await page.locator('#cFace').fill('Round face, expressive eyes');
 await page.getByRole('button',{name:'Save dossier'}).click();
 await expect(page.locator('#characterFeedback')).toContainText('Dossier saved');
}
test('character → wardrobe → saved story survives reload', async ({ page }) => {
 await start(page); await createCharacter(page);
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await page.locator('#sOutfit').fill('Simple blue cotton shirt');
 await page.locator('#outfitName').fill('Blue casual');
 await page.getByRole('button',{name:'Save look'}).click();
 await expect(page.locator('#savedOutfits option')).toHaveCount(2);
 await page.locator('#storyTitle').fill('Weekend');
 await page.locator('#sceneTitle').fill('Cafe scene');
 await page.getByRole('button',{name:'Save to Storybook'}).click();
 await page.reload();
 await page.getByRole('button',{name:'Stories',exact:true}).click();
 await expect(page.locator('#storiesList')).toContainText('Cafe scene');
 await expect(page.locator('#storiesList')).toContainText('Test Character');
});
test('scene edits preserve stored character identity', async ({ page }) => {
 await start(page); await createCharacter(page);
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await page.locator('#sNotes').fill('Different hairstyle just for this scene');
 await page.locator('#sOutfit').fill('Evening dress');
 await page.locator('#sceneTitle').fill('Night');
 await page.getByRole('button',{name:'Save to Storybook'}).click();
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('noirMuseAtelierPreviewV1')));
 expect(data.characters[0].face).toBe('Round face, expressive eyes');
 expect(data.scenes[0].identitySnapshot.face).toBe('Round face, expressive eyes');
});
test('draft persists without altering original Noir Muse keys', async ({ page }) => {
 await start(page); await createCharacter(page);
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await page.locator('#sPose').fill('Standing by the window');
 await page.reload(); await page.getByRole('button',{name:'Studio',exact:true}).click();
 await expect(page.locator('#sPose')).toHaveValue('Standing by the window');
 const untouched=await page.evaluate(()=>['noirMuseProfiles','noirMuseScenes','noirMuseOutfits'].every(k=>localStorage.getItem(k)===null));
 expect(untouched).toBe(true);
});
test('creative dice locking and reroll works', async ({ page }) => {
 await start(page);await createCharacter(page);
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 const dice=page.locator('#dice .dicecell').first();
 const original=await dice.locator('strong').textContent();
 await dice.getByRole('button',{name:'🔓 Lock'}).click();
 await page.getByRole('button',{name:'↝ Surprise Me'}).click();
 await expect(dice.locator('strong')).toHaveText(original);
 await dice.getByRole('button',{name:'🔒 Locked'}).click();
 await dice.getByRole('button',{name:'↝ Reroll'}).click();
 await expect(dice.locator('strong')).not.toHaveText(original);
});


test('Mix & Match saves favorites for the selected character and exports them', async ({ page }) => {
 await start(page); await createCharacter(page,'Muse One');
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await page.locator('#mix-Top').selectOption('Classic shirt');
 await page.locator('#mix-Bottom').selectOption('Straight jeans');
 await page.locator('#mixName').fill('Everyday favorite');
 await page.locator('#mixSave').click();
 await expect(page.locator('#mixFeedback')).toContainText('Favorite saved');
 await page.locator('#mix-Top').selectOption('None');
 await page.locator('#mixFavorite').selectOption({label:'Everyday favorite'});
 await page.locator('#mixLoad').click();
 await expect(page.locator('#mix-Top')).toHaveValue('Classic shirt');
 await page.locator('#mixApply').click();
 await expect(page.locator('#sOutfit')).toHaveValue(/Classic shirt/);
 const other=await page.evaluate(()=>JSON.parse(localStorage.getItem('noirMuseAtelierMixFavoritesV1')));
 expect(other).toHaveLength(1);
 expect(other[0].characterId).toBeTruthy();
});


test('non-destructive Classic migration creates character copies', async ({page}) => {
 await start(page);
 await page.evaluate(() => {
  localStorage.setItem('noirMuseProfiles',JSON.stringify({'Legacy Muse':{dna:{name:'Legacy Muse',age:'25 years old',face:'Oval',eyes:'Brown'},outfit:{top:'White shirt'}}}));
  localStorage.setItem('noirMuseScenes',JSON.stringify({'Legacy Muse':{'Cafe day':{pose:'Seated',location:'Cafe'}}}));
 });
 await page.getByRole('button',{name:'Characters',exact:true}).click();
 await page.getByRole('button',{name:'Check Classic records'}).click();
 await expect(page.locator('#migrationStatus')).toContainText('1 Classic characters');
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Import copies'}).click();
 const record=await page.evaluate(()=>({
  classic:JSON.parse(localStorage.getItem('noirMuseProfiles')),
  atelier:JSON.parse(localStorage.getItem('noirMuseAtelierPreviewV1'))
 }));
 expect(record.classic['Legacy Muse'].dna.face).toBe('Oval');
 expect(record.atelier.characters.some(c=>c.name==='Legacy Muse')).toBe(true);
 expect(record.atelier.scenes.some(s=>s.title==='Cafe day')).toBe(true);
});
test('gallery imports photo for saved scene and remains after reload',async ({page})=>{
 await start(page);await createCharacter(page);
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await page.locator('#sceneTitle').fill('Gallery moment');
 await page.getByRole('button',{name:'Save to Storybook'}).click();
 await page.getByRole('button',{name:'Stories',exact:true}).click();
 await page.locator('#galleryScene').selectOption({label:'Untitled Collection / Gallery moment'});
 await page.locator('#galleryImage').setInputFiles({name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64')});
 await page.getByRole('button',{name:'Add to collection'}).click();
 await expect(page.locator('#galleryGrid img')).toHaveCount(1);
 await page.reload();
 await page.getByRole('button',{name:'Stories',exact:true}).click();
 await expect(page.locator('#galleryGrid img')).toHaveCount(1);
});


test('Easy Studio dropdowns compose prompt and preserve identity',async ({page})=>{
 await start(page);await createCharacter(page,'Easy Muse');
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await page.locator('#quick-Top').selectOption('Satin blouse');
 await page.locator('#quick-Location').selectOption('Beach café');
 await page.locator('#quick-Expression').selectOption('Sarcastic');
 await expect(page.locator('#prompt')).toContainText('Satin blouse');
 await expect(page.locator('#prompt')).toContainText('Beach café');
 await expect(page.locator('#prompt')).toContainText('Sarcastic');
 const c=await page.evaluate(()=>JSON.parse(localStorage.getItem('noirMuseAtelierPreviewV1')).characters[0]);
 expect(c.face).toBe('Round face, expressive eyes');
});
test('Easy Studio custom dropdown and lock shuffle',async ({page})=>{
 await start(page);await createCharacter(page,'Custom Muse');
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await page.locator('#quick-Top').selectOption('__custom__');
 await page.getByRole('textbox',{name:'Custom Top'}).fill('Hand embroidered indigo blouse');
 const loc=page.locator('#quick-Location');
 await loc.selectOption('Garden');
 await page.getByRole('checkbox',{name:'Lock Location'}).check();
 await page.getByRole('button',{name:'Surprise unlocked fields'}).click();
 await expect(loc).toHaveValue('Garden');
 await expect(page.locator('#prompt')).toContainText('Garden');
});
