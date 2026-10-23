# One-time helper (not part of the daily build): Who's That shadows from PokeAPI official artwork alpha + our card art crops.
# Needs full/<card>.jpg card scans, poke/<dex>.png artwork and pool.json [[card id, name, dex no, crop kind], ...].
import json,os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage as nd
P=json.load(open('pool.json'))
CROP={'r':(.085,.103,.915,.485),'ex':(.04,.12,.96,.50),'cz':(.12,.125,.925,.445)}
os.makedirs('sil2',exist_ok=True)
for cid,name,dex,k in P:
  src=f'full/{cid}.jpg' if os.path.exists(f'full/{cid}.jpg') else f"full/{cid.split('-')[1]}.jpg"
  im=Image.open(src).convert('RGB');W,H=im.size;x0,y0,x1,y1=CROP[k]
  a=im.crop((int(W*x0),int(H*y0),int(W*x1),int(H*y1)));a=a.resize((420,int(420*a.height/a.width)),Image.LANCZOS)
  a.save(f'art2/{cid}.jpg',quality=80,optimize=True)
  al=np.array(Image.open(f'poke/{dex}.png').convert('RGBA'))[:,:,3]
  m=al>=128
  lab,n=nd.label(m); sizes=nd.sum(m,lab,range(1,n+1)); tot=m.sum()
  m=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>=0.004*tot])          # drop specks
  holes=nd.binary_fill_holes(m)&~m; hl,hn=nd.label(holes); hs=nd.sum(holes,hl,range(1,hn+1))
  m=m|np.isin(hl,[i+1 for i,s in enumerate(hs) if s<0.002*tot])               # fill pinholes only; keep real gaps (arms, tails)
  m=nd.binary_closing(nd.binary_opening(m,iterations=1),iterations=1)
  M=Image.fromarray((m*255).astype('uint8'))
  big=M.resize((M.width*3,M.height*3),Image.LANCZOS).filter(ImageFilter.GaussianBlur(3)).point(lambda v:255 if v>=128 else 0)
  bb=big.getbbox(); p=24; big=big.crop((max(0,bb[0]-p),max(0,bb[1]-p),min(big.width,bb[2]+p),min(big.height,bb[3]+p)))
  s=400/max(big.size); alpha=big.resize((max(1,round(big.width*s)),max(1,round(big.height*s))),Image.LANCZOS)   # antialiased edge
  out=Image.new('RGBA',alpha.size,(24,24,44,0)); out.putalpha(alpha)
  out.save(f'sil2/{cid}.png',optimize=True)
  print(cid,name,out.size,n,'parts')
# contact sheet: silhouette over yellow, with card art beside
S=Image.new('RGB',(6*320,5*380),'white');d=ImageDraw.Draw(S)
for i,(cid,name,dex,k) in enumerate(P):
  x,y=(i%6)*320,(i//6)*380
  bg=Image.new('RGB',(310,230),(255,214,64));s=Image.open(f'sil2/{cid}.png');s.thumbnail((290,215));bg.paste(s,((310-s.width)//2,(230-s.height)//2),s)
  S.paste(bg,(x,y));ar=Image.open(f'art2/{cid}.jpg');ar.thumbnail((200,125));S.paste(ar,(x,y+234))
  d.text((x+206,y+240),f"{i+1}. {name}",fill='black')
S.save('/tmp/sil2_sheet.jpg',quality=88)
