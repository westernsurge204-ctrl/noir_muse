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
 await expect(page.locator('#sOutfit')).toContainText('Classic shirt');
 const other=await page.evaluate(()=>JSON.parse(localStorage.getItem('noirMuseAtelierMixFavoritesV1')));
 expect(other).toHaveLength(1);
 expect(other[0].characterId).toBeTruthy();
});
