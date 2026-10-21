# 内容数据流程

题库和大纲是一次性从 PDF 导入的，之后只改 `content/`。

| 文件 | 来源 | 说明 |
|---|---|---|
| `data/questions_en.json` | `extract_pdf.py` → `parse_bank.py` / `parse_bank2.py` | 152 道英文原题、答案、解析（第三方题库） |
| `data/syllabus_ja.json` | `parse_syllabus.py` | 官方日文大纲（5 领域、30 个 Task Statement） |
| `content/manifest.json` | 手工维护 | 题数、领域权重、领域简称、疑似重复题对 |
| `content/q/*.json` | AI 草稿 | 每题的中日翻译、解析、要点、Task Statement 归类；用 `check_q.py` 校验 |
| `content/ts_zh.json` | AI 草稿 | 领域和 Task Statement 的中文标题 |
| `content/lessons/<id>.md` | AI 草稿 | 每个 Task Statement 的中文课程 |
| `components/meta.ts` | **生成** | `npm run gen:meta`，前端用的元数据；过期时 `tests/meta.test.ts` 会失败 |

改了题库或 manifest 后：`python3 -I tools/check_q.py && npm run gen:meta && npm test`。
