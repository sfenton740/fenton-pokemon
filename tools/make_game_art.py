# One-time helper (NOT part of the daily build): makes games/art/<id>.jpg art crops and games/sil/<id>.png shadows
# from our own card scans, using rembg (pip install "rembg[cpu]"). Input: full/<n>.jpg + list.json. Hand-pick results.
import json,sys
from PIL import Image, ImageFilter
from rembg import remove, new_session
S=new_session(sys.argv[1] if len(sys.argv)>1 else 'u2net')
L=json.load(open('list.json'))
for c in L:
  im=Image.open(f"full/{c['n']}.jpg").convert('RGB');W,H=im.size
  art=im.crop((int(W*.085),int(H*.103),int(W*.915),int(H*.485)))
  art=art.resize((420,int(420*art.height/art.width)),Image.LANCZOS)
  art.save(f"out/{c['n']}.jpg",quality=78,optimize=True)
  m=remove(art,session=S,only_mask=True).convert('L')
  w,h=m.size
  m.paste(0,(int(w*.79),int(h*.70),w,h))  # hide the 30th Pikachu logo
  m=m.point(lambda v:255 if v>110 else 0).filter(ImageFilter.MedianFilter(5))
  sil=Image.new('RGBA',(w,h),(0,0,0,0)); sil.paste((25,25,45,255),(0,0,w,h),m)
  bb=m.getbbox(); cov=sum(m.histogram()[255:])/(w*h)
  c['cov']=round(cov,3); sil.save(f"out/{c['n']}s.png",optimize=True)
  print(c['n'],c['name'],c['cov'],bb)
json.dump(L,open('list.json','w'),indent=0)
