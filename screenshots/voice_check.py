import sys, json
from playwright.sync_api import sync_playwright
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/'
errors=[]
V=lambda n,l='en-US',d=False:{'name':n,'lang':l,'default':d,'voiceURI':n}
LISTS={
 'iPad stock (iOS 17)':[V('Albert'),V('Bad News'),V('Bubbles'),V('Fred'),V('Junior'),V('Ralph'),V('Daniel','en-GB'),V('Karen','en-AU'),V('Moira','en-IE'),V('Rishi','en-IN'),V('Aaron'),V('Nicky'),V('Samantha',d=True),V('Thomas','fr-FR')],
 'iPad + Enhanced voice':[V('Aaron'),V('Samantha',d=True),V('Ava (Enhanced)'),V('Nicky'),V('Fred')],
 'iPad Premium':[V('Samantha'),V('Zoe (Premium)'),V('Aaron')],
 'iPad no Samantha':[V('Fred'),V('Nicky'),V('Aaron'),V('Daniel','en-GB')],
 'only Fred + novelty':[V('Zarvox'),V('Fred'),V('Whisper')],
 'Chrome desktop':[V('Google Deutsch','de-DE'),V('Google US English'),V('Google UK English Female','en-GB')],
 'Edge':[V('Microsoft David - English (United States)'),V('Microsoft Ana Online (Natural) - English (United States)'),V('Microsoft Aria Online (Natural) - English (United States)')],
 'UK only':[V('Daniel','en-GB'),V('Amélie','fr-CA')],
 'no English':[V('Thomas','fr-FR')],
 'empty (iOS before voiceschanged)':[],
}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome'); ctx=b.new_context(viewport={'width':820,'height':1180},is_mobile=True,has_touch=True)
    pg=ctx.new_page(); pg.on('pageerror',lambda e:errors.append(str(e))); pg.on('console',lambda m:m.type=='error' and errors.append(m.text))
    # iOS-like: voices empty at load, then arrive via voiceschanged
    pg.add_init_script("""window.FG_NO_AUTO_PACKS=1;
      window._said=[]; let vs=[];
      const mk=(n,l,d)=>{const v=Object.create(SpeechSynthesisVoice.prototype);Object.defineProperties(v,{name:{value:n},lang:{value:l},default:{value:!!d},voiceURI:{value:n},localService:{value:true}});return v;};
      speechSynthesis.getVoices=()=>vs;
      window.SpeechSynthesisUtterance=class{constructor(t){this.text=t;this.voice=null;}};
      speechSynthesis.speak=u=>{window._said.push({t:u.text,v:u.voice&&u.voice.name,p:u.pitch,r:u.rate,vol:u.volume,lang:u.lang});};
      window._arrive=()=>{vs=[mk('Bad News','en-US'),mk('Fred','en-US'),mk('Aaron','en-US'),mk('Samantha','en-US',true),mk('Daniel','en-GB')];speechSynthesis.dispatchEvent(new Event('voiceschanged'));};
    """)
    pg.goto(BASE+'#/games'); pg.wait_for_selector('.fg-pick')
    for k,l in LISTS.items():
        r=pg.evaluate("l=>{const v=FentonGames.pickVoice(l);return v?v.name+' ('+v.lang+')':'(browser default, lang en-US)'}",l); print(f'{k:34s} -> {r}')
    print('before voiceschanged:', pg.evaluate("(FentonGames._voice()||{}).name||null"))
    pg.evaluate('_arrive()'); print('after voiceschanged:', pg.evaluate("FentonGames._voice().name"))
    # play each game a little and capture utterances
    pg.goto(BASE+'#/games/memory'); pg.wait_for_timeout(800)
    pg.goto(BASE+'#/games/who'); pg.wait_for_selector('.fg-opt'); pg.wait_for_timeout(600)
    a=pg.evaluate("document.querySelector('#whoArt').getAttribute('alt')")
    labs=pg.evaluate("[...document.querySelectorAll('.fg-opt')].map(o=>o.getAttribute('aria-label'))")
    pg.locator('.fg-opt').nth([i for i,x in enumerate(labs) if x!=a][0]).click(); pg.wait_for_timeout(900)
    pg.locator('.fg-opt').nth(labs.index(a)).click(); pg.wait_for_timeout(1800)
    print('who text:', pg.inner_text('#whoText'))
    pg.goto(BASE+'#/games/tcg'); pg.wait_for_selector('.tc .want'); pg.wait_for_timeout(500)
    for i in range(6): pg.locator('.tc .want').first.click(); pg.wait_for_timeout(2500)
    pg.screenshot(path='/workspace/site/screenshots/trainer_coach.png')
    for s in pg.evaluate('_said'): print('  said:',s)
    b.close()
print('errors',errors)
