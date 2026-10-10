const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:760}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file:///home/user/fuyugame/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(800);
  const r = await p.evaluate(()=>{ G.guide='done'; $('#modal').hidden=true; G.kidFood={}; G.food={}; G.kidFood.shrink=1; G.kidFood[KID_FOODS[0].id]=2; G.kidFood[KID_FOODS[1].id]=1; G.food.shrink_pet=1; G.food.apple=2; G.food.milk=1;
    const out={}; showFoodMenu('kid'); out.kid=[...document.querySelectorAll('#foodMenu > *')].map(x=>x.textContent); $('#foodMenu').hidden=true; showFoodMenu('pet'); out.pet=[...document.querySelectorAll('#foodMenu > *')].map(x=>x.textContent); $('#foodMenu').hidden=true;
    G.kidFood={shrink:1}; G.food={}; showFoodMenu('kid'); out.onlyPotion=[...document.querySelectorAll('#foodMenu > *')].map(x=>x.textContent); return out; });
  console.log(JSON.stringify(r,null,0), errs); await b.close();
})();
