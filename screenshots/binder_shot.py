import sys
from playwright.sync_api import sync_playwright
BASE=sys.argv[1]; OUT=sys.argv[2]; widths=[int(x) for x in (sys.argv[3] if len(sys.argv)>3 else '412').split(',')]
errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for w in widths:
        h={360:780,390:844,412:915,430:932,820:1180,1180:820,1440:900}.get(w,900)
        ctx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=2,is_mobile=w<1000,has_touch=w<1000,
          user_agent='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36')
        pg=ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(BASE+'#/binder/1/2'); pg.wait_for_selector('.binder .cell'); pg.wait_for_timeout(1500)
        info=pg.evaluate("""()=>{const g=document.querySelector('.binder .grid');const cs=[...g.children].map(c=>{const r=c.getBoundingClientRect();return [Math.round(r.left),Math.round(r.width),Math.round(r.height)]});
          const br=document.querySelector('.binder').getBoundingClientRect();return {cols:getComputedStyle(g).gridTemplateColumns,cells:cs,binderBottom:Math.round(br.bottom),maxCellBottom:Math.round(Math.max(...[...g.children].map(c=>c.getBoundingClientRect().bottom))),sw:document.documentElement.scrollWidth}}""")
        print(w,info)
        pg.screenshot(path=f'{OUT}_{w}.png',full_page=True)
        ctx.close()
print('errors',errs)
