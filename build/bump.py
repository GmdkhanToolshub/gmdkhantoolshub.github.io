import re,glob,hashlib,os,sys
os.chdir(sys.argv[1])
h=lambda p:hashlib.md5(open(p,'rb').read()).hexdigest()[:8]
m=open('assets/js/main.js',encoding='utf-8',newline='').read()
m2=re.sub(r"voice\.js\?v=[0-9a-f]{8}","voice.js?v="+h('assets/js/voice.js'),m)
if m2!=m: open('assets/js/main.js','w',encoding='utf-8',newline='').write(m2)
import subprocess; subprocess.run([sys.executable,'build/make-core.py'],check=True)
n=0
for f in glob.glob('**/*.html',recursive=True):
    if f.replace('\\','/').startswith(('backend/','products/','node_modules/')): continue
    x=open(f,encoding='utf-8',newline='').read()
    y=re.sub(r'((?:\.\./)*|\./)(assets/(?:css|js)/[\w./-]+?)\?v=[0-9a-f]{8}',lambda k:(k.group(1)+k.group(2)+'?v='+h(k.group(2))) if os.path.exists(k.group(2)) else k.group(0),x)
    if y!=x: open(f,'w',encoding='utf-8',newline='').write(y);n+=1
print('bumped',n)
