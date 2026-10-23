# One-time helper (not part of the daily build): the Oct 2026 batch of 50 extra Who's That shadows. Same tracing as make_shadows.py
# (PokeAPI official artwork alpha), plus per-card crop overrides (kinds.json). Usage: python3 make_shadows_more.py sheet.jpg final.json
import json,os,sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage as nd
P=json.load(open(sys.argv[2] if len(sys.argv)>2 else 'pick.json')); K=json.load(open('kinds.json')) if os.path.exists('kinds.json') else {}
CROP={'r':(.085,.103,.915,.485),'ex':(.04,.12,.96,.50),'cz':(.12,.125,.925,.445),'ir':(.03,.03,.97,.62),'ir2':(.03,.15,.97,.70),'ae':(.03,.10,.97,.55),'sn':(.10,.115,.90,.47),'ty':(.075,.10,.925,.42),'fa':(.05,.09,.95,.50),'sn2':(.10,.135,.90,.47),'fa2':(.05,.12,.95,.52)}
def kind(cid,rar):
  if cid in K: return K[cid]
  return 'ir' if 'Illustration' in rar or 'Ultra' in rar else ('ex' if 'Double' in rar else 'r')
THIN={425}  # thin strings (Drifloon): keep them, thicken instead of opening
d=json.load(open('/workspace/site/data.json'))['cards']
def shadow(dex,cid):
  al=np.array(Image.open(f'poke/{dex}.png').convert('RGBA'))[:,:,3]
  m=al>=(60 if dex in THIN else 128)
  lab,n=nd.label(m); sizes=nd.sum(m,lab,range(1,n+1)); tot=m.sum()
  m=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>=0.004*tot])
  holes=nd.binary_fill_holes(m)&~m; hl,hn=nd.label(holes); hs=nd.sum(holes,hl,range(1,hn+1))
  m=m|np.isin(hl,[i+1 for i,s in enumerate(hs) if s<0.002*tot])
  m=nd.binary_closing(nd.binary_opening(m,iterations=1),iterations=1) if dex not in THIN else nd.binary_dilation(m,iterations=3)
  M=Image.fromarray((m*255).astype('uint8'))
  big=M.resize((M.width*3,M.height*3),Image.LANCZOS).filter(ImageFilter.GaussianBlur(3)).point(lambda v:255 if v>=128 else 0)
  bb=big.getbbox(); p=24; big=big.crop((max(0,bb[0]-p),max(0,bb[1]-p),min(big.width,bb[2]+p),min(big.height,bb[3]+p)))
  s=400/max(big.size); alpha=big.resize((max(1,round(big.width*s)),max(1,round(big.height*s))),Image.LANCZOS)
  out=Image.new('RGBA',alpha.size,(24,24,44,0)); out.putalpha(alpha); out.save(f'sil/{cid}.png',optimize=True); return n
for cid,name,dex in P:
  k=kind(cid,d[cid]['rarity'])
  im=Image.open(f'full/{cid}.jpg').convert('RGB');W,H=im.size;x0,y0,x1,y1=CROP[k]
  a=im.crop((int(W*x0),int(H*y0),int(W*x1),int(H*y1)));a=a.resize((420,int(420*a.height/a.width)),Image.LANCZOS)
  a.save(f'art/{cid}.jpg',quality=80,optimize=True)
  shadow(dex,cid)
cols=8; rows=(len(P)+cols-1)//cols
S=Image.new('RGB',(cols*250,rows*330),'white');dr=ImageDraw.Draw(S)
for i,(cid,name,dex) in enumerate(P):
  x,y=(i%cols)*250,(i//cols)*330
  bg=Image.new('RGB',(244,190),(255,214,64));s=Image.open(f'sil/{cid}.png');s.thumbnail((230,180));bg.paste(s,((244-s.width)//2,(190-s.height)//2),s)
  S.paste(bg,(x,y));ar=Image.open(f'art/{cid}.jpg');ar.thumbnail((244,112));S.paste(ar,(x,y+194))
  dr.text((x+2,y+312),f"{i+1}. {name}",fill='black')
S.save(sys.argv[1] if len(sys.argv)>1 else '/tmp/v3_sheet.jpg',quality=85)
