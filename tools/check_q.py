"""Validate content/exams/<id>/q/*.json translation batches. Usage: EXAM_ID=ccar-f python3 -I tools/check_q.py [first last]"""
import json, os, sys, re
root = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'content', 'exams', os.environ.get('EXAM_ID', 'ccar-f'))
bank = {q['num']: q for q in json.load(open(os.path.join(root, 'questions.json')))}
ts_ids = {t['id'] for d in json.load(open(os.path.join(root, 'syllabus.json'))) for t in d['task_statements']}
dom = {'Agentic Architecture and Orchestration': '1', 'Tool Design and MCP Integration': '2', 'Claude Code Configuration and Workflows': '3', 'Prompt Engineering and Structured Output': '4', 'Context Management and Reliability': '5'}
seen, errs = {}, []
d = os.path.join(root, 'q')
for f in sorted(os.listdir(d)):
    if not f.endswith('.json'): continue
    try: data = json.load(open(os.path.join(d, f)))
    except Exception as e: errs.append(f'{f}: invalid JSON: {e}'); continue
    for k, v in data.items():
        n = int(k)
        if n in seen: errs.append(f'Q{n}: in both {seen[n]} and {f}')
        seen[n] = f; q = bank[n]
        if v.get('ts') not in ts_ids: errs.append(f'Q{n}: bad ts {v.get("ts")}')
        elif v['ts'].split('.')[0] != dom[q['category']]: print(f'note Q{n}: ts {v["ts"]} outside category domain {dom[q["category"]]}')
        for lang in ('zh', 'ja'):
            t = v.get(lang)
            if not t: errs.append(f'Q{n}: missing {lang}'); continue
            if set(t) != {'stem', 'options', 'explanation', 'takeaway'}: errs.append(f'Q{n}.{lang}: keys {sorted(t)}')
            if sorted(t.get('options', {})) != [o['label'] for o in q['options']]: errs.append(f'Q{n}.{lang}: option labels')
            for s in [t.get('stem', ''), t.get('explanation', ''), t.get('takeaway', ''), *t.get('options', {}).values()]:
                if len(s) < 2: errs.append(f'Q{n}.{lang}: empty text')
            if len(t.get('explanation', '')) < 0.35 * len(q['explanation_en']) * (0.55 if lang == 'zh' else 0.6): errs.append(f'Q{n}.{lang}: explanation looks too short (should be a full translation)')
            if lang == 'ja' and not re.search('[ぁ-ん]', t.get('stem', '')): errs.append(f'Q{n}.ja: no kana in stem')
lo, hi = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) == 3 else (1, 152)
missing = [n for n in range(lo, hi + 1) if n not in seen]
print(f'{len([n for n in seen if lo <= n <= hi])}/{hi - lo + 1} questions translated in range {lo}-{hi}')
if missing: print('missing:', missing)
print('\n'.join(errs) or 'OK: no errors')
sys.exit(1 if errs else 0)
