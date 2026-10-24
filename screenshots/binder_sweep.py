import sys, json
from playwright.sync_api import sync_playwright
BASE=sys.argv[1]; d=json.load(open('/workspace/site/data.json'))
bad=[]; errs=[]; n=0
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome')
    for w,h in [(360,780),(412,915),(820,1180),(1180,820)]:
        pg=b.new_page(viewport={'width':w,'height':h}); pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto(BASE+'#/'); pg.wait_for_timeout(1200)
        for bi,bd in enumerate(d['binders']):
            for pi,slots in enumerate(bd['pages']):
                pg.evaluate(f"location.hash='#/binder/{bi}/{pi+1}'"); pg.wait_for_timeout(120)
                r=pg.evaluate("""()=>{const g=document.querySelector('.binder .grid');const c=[...g.children];const ws=c.map(x=>Math.round(x.getBoundingClientRect().width));
                  const ids=c.map(x=>x.dataset.card||null);const br=document.querySelector('.binder').getBoundingClientRect();
                  return {ws,ids,over:Math.max(...c.map(x=>x.getBoundingClientRect().bottom))>br.bottom+1,sw:document.documentElement.scrollWidth}}""")
                n+=1; exp=[s['id'] if s else None for s in slots]
                if max(r['ws'])-min(r['ws'])>2 or r['over'] or r['sw']>w or r['ids']!=exp: bad.append((w,bd['name'],pi+1,r['ws'],r['over'],r['sw'],r['ids']==exp))
        pg.close()
print('pages checked',n,'problems',len(bad)); [print(x) for x in bad[:20]]; print('errors',errs)
