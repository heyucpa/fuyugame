// 語音：自動挑台灣腔、家長選的優先、沒有台灣的會說明怎麼加裝
const { chromium } = require('playwright');
(async()=>{
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const p = await (await b.newContext({viewport:{width:1100,height:800}})).newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://' + (process.env.HOUSE_DIR || '/home/user/fuyugame') + '/house.html'); await p.waitForTimeout(1500); try{await p.getByText('跳過').click({timeout:1500});}catch(e){} await p.waitForTimeout(600);
  const r = await p.evaluate(async()=>{
    const out={}; G.guide='done'; $('#modal').hidden=true;
    const V=(name,lang,local=true)=>({name,lang,voiceURI:name,localService:local});
    const sets = {
      win10: [V('Microsoft Huihui - Chinese (Simplified, PRC)','zh-CN'), V('Microsoft Hanhan - Chinese (Traditional, Taiwan)','zh-TW'), V('Microsoft David','en-US')],
      edge: [V('Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)','zh-CN',false), V('Microsoft HsiaoChen Online (Natural) - Chinese (Taiwan)','zh-TW',false), V('Microsoft Huihui','zh-CN')],
      ipad: [V('Ting-Ting','zh-CN'), V('Sin-ji','zh-HK'), V('Mei-Jia','zh-TW')],
      chrome: [V('Google 普通话（中国大陆）','zh-CN',false), V('Google 國語（臺灣）','zh-TW',false), V('Google 粤語（香港）','zh-HK',false)],
      onlyCN: [V('Microsoft Huihui','zh-CN'), V('Microsoft David','en-US')],
      underscore: [V('Ting-Ting','zh_CN'), V('Mei-Jia','zh_TW')],
      none: [V('Microsoft David','en-US')]
    };
    const real = speechSynthesis.getVoices.bind(speechSynthesis); let cur=[]; speechSynthesis.getVoices = () => cur;
    const spoke=[]; const realSpeak = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = u => spoke.push({lang:u.lang, voice:u.voice && u.voice.name});
    localStorage.removeItem(ZH_VOICE_KEY);
    for (const [k, list] of Object.entries(sets)) { cur=list; const v=pickZhVoice(); out[k] = v ? v.name : null; }
    // 家長選了大陸的也要照選的
    cur = sets.win10; localStorage.setItem(ZH_VOICE_KEY, 'Microsoft Huihui - Chinese (Simplified, PRC)'); out.saved = pickZhVoice().name; localStorage.removeItem(ZH_VOICE_KEY);
    // speak 有用到挑的聲音
    // （假的聲音物件不能真的設給 u.voice，所以這裡不驗 speak 用了哪個；真機上 getVoices 給的是真的物件）
    cur = sets.none; speak('你好'); out.speakNoVoice = spoke[spoke.length-1];
    // 設定頁、選語音視窗
    cur = sets.onlyCN; openTab('save'); out.settings = /語音（台灣腔）/.test($('#tabBody').innerText) && /不是台灣腔/.test($('#tabBody').innerText);
    openVoicePicker(); out.pickerWarn = /沒有台灣腔/.test($('#modalCard').innerText) && /Edge/.test($('#modalCard').innerText);
    cur = sets.edge; openVoicePicker(); const rows=[...document.querySelectorAll('.voice-row')]; out.firstRowTW = rows[0] && /⭐/.test(rows[0].innerText);
    rows[2].querySelector('button:last-child').click(); out.pickedSaved = localStorage.getItem(ZH_VOICE_KEY)==='Microsoft Huihui';
    $('#modal').hidden=true; localStorage.removeItem(ZH_VOICE_KEY);
    speechSynthesis.getVoices = real; speechSynthesis.speak = realSpeak;
    return out; });
  console.log(JSON.stringify(r,null,0), errs); await b.close();
})();
