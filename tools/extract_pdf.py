import pdfplumber, json
FILES=[('data/pdf/p1_1-50.pdf',0),('data/pdf/p2_51-100.pdf',50),('data/pdf/p3_101-144.pdf',100)]
pages=[]
for f,off in FILES:
    with pdfplumber.open(f) as pdf:
        for i,pg in enumerate(pdf.pages):
            g=pg.filter(lambda o: o.get('object_type')!='char' or 'KaiTi' not in o['fontname'])
            pages.append(dict(page=off+i+1,text=g.extract_text() or ''))
json.dump(pages,open('data/parsed/pages_clean.json','w'),ensure_ascii=False,indent=1)
print(len(pages),[p['page'] for p in pages][:3],pages[-1]['page'])
