import re, json, sys
RAW='/home/claude/ccar/data/raw/'
FILES=['part1_p1-50.txt','part2_p51-100.txt','part3_p101-144.txt']
CATS=['Claude Code Configuration and Workflows','Prompt Engineering and Structured Output','Tool Design and MCP Integration','Agentic Architecture and Orchestration','Context Management and Reliability']
txt='\n'.join(open(RAW+f).read() for f in FILES)
CJK=re.compile(r'[\u3000-\u9fff\uff00-\uffef]+')
def clean(s):
    s=s.replace('\\\\','').replace('\\#','#').replace('\\[','[').replace('\\]',']').replace('\\~','~').replace('\\_','_').replace('\\*','*')
    s=CJK.sub('',s)
    s=re.sub(r'^\s*Anthropic - CCAR-F\s*$','',s,flags=re.M)
    s=re.sub(r'<?https?://www\.examsvce\.com\S*>?','',s)
    s=re.sub(r'^\s*\\?={5,}\s*$','',s,flags=re.M)
    s=re.sub(r'^\s*(?:6\s*)+$','',s,flags=re.M)
    return s
marks=[(m.start(),int(m.group(1))) for m in re.finditer(r'\\#:\s*(\d+)',txt)]
out=[]
for i,(p,n) in enumerate(marks):
    e=marks[i+1][0] if i+1<len(marks) else len(txt)
    raw=txt[p:e]
    # header zone intact?
    hdr_ok=bool(re.match(r'\\#:\s*\d+ - \\\[(%s)\\\]'%'|'.join(CATS),raw))
    body=clean(raw)
    cat=None
    for c in CATS:
        if c in body[:300]: cat=c;break
    mm=re.search(r'Answer:\s*([A-F](?:[ ,]+[A-F])*)',body)
    ans=re.sub(r'[ ,]+',',',mm.group(1)) if mm else None
    pre=body[:mm.start()] if mm else body
    post=body[mm.end():] if mm else ''
    ex=re.search(r'Explanation',post)
    expl=post[ex.end():].strip() if ex else post.strip()
    pre=re.sub(r'^#:\s*\d+\s*-?\s*\[[^\]]*\]','',pre.strip())
    paras=[re.sub(r'\s+',' ',x).strip() for x in re.split(r'\n\s*\n',pre) if x.strip()]
    paras=[x for x in paras if not re.fullmatch(r'A\.? ?B\.? ?C\.? ?D\.?( ?E\.?)?( ?F\.?)?',x)]
    qi=max([k for k,x in enumerate(paras) if x.endswith('?') or re.search(r'\(Select|Choose (two|three)',x)] or [0])
    stem=' '.join(paras[:qi+1]); opts=paras[qi+1:]
    out.append(dict(num=n,category=cat,header_intact=hdr_ok,stem=stem,options=opts,answer=ans,explanation=expl))
json.dump(out,open('/home/claude/ccar/data/parsed/questions_auto.json','w'),ensure_ascii=False,indent=1)
from collections import Counter
print(Counter(len(q['options']) for q in out)); print('no cat',[q['num'] for q in out if not q['category']])
print('no ans',[q['num'] for q in out if not q['answer']]); print('hdr bad',[q['num'] for q in out if not q['header_intact']])
print('opts!=4',[(q['num'],len(q['options']),q['answer']) for q in out if len(q['options'])!=4])
print(Counter(q['category'] for q in out))
