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
 await page.locator('#cNationality').selectOption('Indian');
 await page.locator('#cEthnicity').selectOption('South Asian');
 await page.locator('#detail-face-shape').selectOption('Round');
 await page.getByRole('button',{name:'Save dossier'}).click();
 await expect(page.locator('#characterFeedback')).toContainText('Dossier saved');
}
test('character → wardrobe → saved story survives reload', async ({ page }) => {
 await start(page); await createCharacter(page);
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await page.locator('#five-top').selectOption('Shirt');
 
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
 await page.locator('#five-category').selectOption('Formal');
 await page.locator('#five-sub').selectOption('Cocktail dress');
 await page.locator('#sceneTitle').fill('Night');
 await page.getByRole('button',{name:'Save to Storybook'}).click();
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('noirMuseAtelierPreviewV1')));
 expect(data.characters[0].identityDetails['Face shape'].value).toBe('Round');
 expect(data.scenes[0].identitySnapshot.identityDetails['Face shape'].value).toBe('Round');
});
test('draft persists without altering original Noir Muse keys', async ({ page }) => {
 await start(page); await createCharacter(page);
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await page.locator('.fiveSection').nth(2).locator('summary').click(); await page.locator('#five-place').selectOption('Balcony');
 await page.reload(); await page.getByRole('button',{name:'Studio',exact:true}).click();
 await expect(page.locator('#five-place')).toHaveValue('Balcony');
 const untouched=await page.evaluate(()=>['noirMuseProfiles','noirMuseScenes','noirMuseOutfits'].every(k=>localStorage.getItem(k)===null));
 expect(untouched).toBe(true);
});
test('five-section locking and surprise preserves scene', async ({page})=>{await start(page);await createCharacter(page);await page.getByRole('button',{name:'Studio',exact:true}).click();await page.locator('.fiveSection').nth(2).locator('summary').click(); await page.locator('#five-place').selectOption('Beach');await page.getByRole('checkbox',{name:'Lock Location'}).check();await page.locator('#fiveShuffle').click();await expect(page.locator('#five-place')).toHaveValue('Beach');await expect(page.locator('#prompt')).toContainText('Beach');});
test.skip('Legacy Mix & Match saves favorites for the selected character and exports them', async ({ page }) => {
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


test('five-section wardrobe and scene dropdowns compile prompt',async ({page})=>{await start(page);await createCharacter(page);await page.getByRole('button',{name:'Studio',exact:true}).click();await page.locator('#five-top').selectOption('Blouse');await page.locator('.fiveSection').nth(2).locator('summary').click(); await page.locator('#five-place').selectOption('Beach café');await page.locator('.fiveSection').nth(3).locator('summary').click(); await page.locator('#five-expression').selectOption('Sarcastic');await expect(page.locator('#prompt')).toContainText('Blouse');await expect(page.locator('#prompt')).toContainText('Beach café');await expect(page.locator('#prompt')).toContainText('Sarcastic');});
test('dossier fields save individually and appear in prompt',async({page})=>{
 await start(page);
 await page.getByRole('button',{name:'Characters',exact:true}).click();
 await page.getByRole('button',{name:'＋ New Character'}).click();
 await page.locator('#cName').fill('Detailed Muse');
 await page.locator('#detail-eye-shape').selectOption('Downturned');
 await page.locator('#detail-hair-texture').selectOption('Natural waves');
 await page.getByRole('checkbox',{name:'Lock Eye shape'}).check();
 await page.getByRole('button',{name:'Save dossier'}).click();
 await expect(page.locator('#dossierDetailStatus')).toContainText('saved');
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await expect(page.locator('#prompt')).toContainText('Eye shape: Downturned');
 await expect(page.locator('#prompt')).toContainText('Hair texture: Natural waves');
 await page.reload();
 await page.getByRole('button',{name:'Characters',exact:true}).click();
 await page.getByRole('button',{name:'Open dossier'}).click();
 await expect(page.locator('#detail-eye-shape')).toBeDisabled();
 await expect(page.getByRole('checkbox',{name:'Lock Eye shape'})).toBeChecked();
});

test('dossier search and lock-all controls', async ({page})=>{
 await start(page);
 await page.getByRole('button',{name:'Characters',exact:true}).click();
 await page.getByRole('button',{name:'＋ New Character'}).click();
 await page.locator('#dossierSearch').fill('eye');
 await expect(page.locator('#detail-eye-shape')).toBeVisible();
 await expect(page.locator('#detail-hair-texture')).toBeHidden();
 await page.getByRole('button',{name:'Lock all',exact:true}).click();
 await expect(page.locator('#detail-eye-shape')).toBeDisabled();
 await page.getByRole('button',{name:'Unlock all'}).click();
 await expect(page.locator('#detail-eye-shape')).toBeEnabled();
});

test('nationality and ethnicity are saved, compiled, and survive editing without losing details', async ({page})=>{
 await start(page); await createCharacter(page,'Identity Muse');
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await expect(page.locator('#prompt')).toContainText('Nationality: Indian');
 await expect(page.locator('#prompt')).toContainText('Ethnicity: South Asian');
 await page.getByRole('button',{name:'Characters',exact:true}).click();
 await page.getByRole('button',{name:'Open dossier'}).click();
 await page.locator('#cEthnicity').selectOption('Other / custom');
 await page.locator('#cEthnicityCustom').fill('Custom community');
 await page.getByRole('button',{name:'Save dossier'}).click();
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('noirMuseAtelierPreviewV1')).characters[0]);
 expect(data.ethnicity).toBe('Custom community');
 expect(data.identityDetails['Face shape'].value).toBe('Round');
});

test('Identity Details v2 saves hairstyle and independent locks across six groups',async ({page})=>{
 await start(page);
 await page.getByRole('button',{name:'Characters',exact:true}).click();
 await page.getByRole('button',{name:'＋ New Character'}).click();
 await page.locator('#cName').fill('Hair Identity');
 await expect(page.locator('.identityGroup')).toHaveCount(6);
 await page.locator('#detail-signature-hairstyle').selectOption('Low messy bun');
 await page.locator('#detail-haircut').selectOption('Long layers');
 await page.getByRole('checkbox',{name:'Lock Signature hairstyle'}).check();
 await page.getByRole('button',{name:'Save dossier'}).click();
 await page.getByRole('button',{name:'Studio',exact:true}).click();
 await expect(page.locator('#prompt')).toContainText('Signature hairstyle: Low messy bun');
 await page.reload();
 await page.getByRole('button',{name:'Characters',exact:true}).click();
 await page.getByRole('button',{name:'Open dossier'}).click();
 await expect(page.locator('#detail-signature-hairstyle')).toHaveValue('Low messy bun');
 await expect(page.locator('#detail-signature-hairstyle')).toBeDisabled();
});
