# 内容数据流程

每门考试的内容都在 `content/exams/<id>/`，格式见 [docs/new-exam.md](../docs/new-exam.md)。CCAR-F 的题库和大纲是一次性从 PDF 导入的，下面的 Python 脚本只是当时的记录，换一份 PDF 需要重写解析部分。

| 文件（`content/exams/ccar-f/` 下） | 来源 | 说明 |
|---|---|---|
| `questions.json` | `extract_pdf.py` → `parse_bank.py` / `parse_bank2.py` | 152 道英文原题、答案、解析（第三方题库） |
| `syllabus.json` | `parse_syllabus.py` | 官方日文大纲（5 领域、30 个 Task Statement） |
| `manifest.json` | 手工维护 | 考试 id、题数、领域权重、领域简称、疑似重复题对 |
| `q/*.json` | AI 草稿 | 每题的中日翻译、解析、要点、Task Statement 归类；用 `check_q.py` 校验 |
| `ts_zh.json` | AI 草稿 | 领域和 Task Statement 的中文标题 |
| `lessons/<id>.md` | AI 草稿 | 每个 Task Statement 的中文课程 |
| `components/meta.ts`（仓库根） | **生成** | `npm run gen:meta`，前端用的元数据；过期时 `tests/meta.test.ts` 会失败 |

改了内容后：`npm run validate && python3 -I tools/check_q.py && npm run gen:meta && npm test`。
