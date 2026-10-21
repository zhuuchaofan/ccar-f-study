# 导入一门新考试

现在一个部署只服务一门考试，用环境变量 `EXAM_ID` 选（默认 `ccar-f`）。所有内容都在 `content/exams/<id>/` 下，格式固定，`npm run import:exam` 导入前会先校验。

## 1. 准备导入目录

把题库整理成下面这几份文件（PDF 转 JSON 这一步每份题库不一样，可以让 Claude 帮你做一次）：

```
my-exam/
  manifest.json      必需：考试信息
  questions.json     必需：题目（英文原文或原始语言）
  syllabus.json      必需：大纲（领域 → Task Statement）
  ts_zh.json         可选：领域和 Task Statement 的中文标题
  q/*.json           可选：每题的中日翻译、解析、要点、归类
  lessons/<ts>.md    可选：每个 Task Statement 的课程
```

### manifest.json

```json
{
  "id": "my-exam",
  "title": "My Certification – Associate",
  "source_language": "en",
  "syllabus_language": "en",
  "question_count": 120,
  "domains": [
    { "id": 1, "category": "Domain name exactly as in questions.json", "weight": 40, "short_zh": "领域简称" },
    { "id": 2, "category": "Another domain", "weight": 60, "short_zh": "另一个领域" }
  ],
  "duplicate_pairs": [[3, 77]]
}
```

- `id`：小写字母、数字、连字符，同时也是目录名。
- `weight`：各领域在正式考试中的占比，加起来是 100；模拟考试按它抽题。
- `duplicate_pairs`：疑似重复的两道题，模拟考试不会同时抽到。

### questions.json

按 `num` 从 1 开始连续编号：

```json
[
  {
    "num": 1,
    "category": "Domain name exactly as in questions.json",
    "stem": "题干……",
    "options": [{ "label": "A", "text": "……" }, { "label": "B", "text": "……" }],
    "answer": ["A"],
    "explanation_en": "原文解析，没有就留空字符串",
    "source_type": "third_party_bank",
    "source_name": "题库名称和版本",
    "review_status": "extracted_unreviewed",
    "pdf_pages": [1, 2]
  }
]
```

选项按 A、B、C… 顺序；多选题的 `answer` 写多个字母。

### syllabus.json

```json
[
  { "id": 1, "title_ja": "领域标题（大纲原文语言）", "task_statements": [
    { "id": "1.1", "title_ja": "Task Statement 标题", "knowledge": ["……"], "skills": ["……"] }
  ] }
]
```

字段名里的 `_ja` 是历史原因，表示「大纲原文语言」，不一定是日文。

### 可选文件

- `ts_zh.json`：`{ "domains": { "1": "中文" }, "ts": { "1.1": "中文" } }`
- `q/001.json` 等：`{ "1": { "ts": "1.1", "zh": { "stem", "options": { "A": "…" }, "explanation", "takeaway" }, "ja": { … } } }`
- `lessons/1.1.md`：中文课程，Markdown 子集。

## 2. 导入和检查

```bash
npm run import:exam -- ./my-exam          # 校验并复制到 content/exams/my-exam/
EXAM_ID=my-exam npm run gen:meta          # 生成前端元数据
EXAM_ID=my-exam npm test && npm run validate
EXAM_ID=my-exam npm run build && EXAM_ID=my-exam npm start   # 本地看一遍
```

校验不过时会逐条列出问题（缺文件、字段格式、答案不在选项里、领域对不上、权重和不是 100 等），改完再导入。已存在的目录要加 `--force` 才会覆盖。

## 3. 部署

```bash
EXAM_ID=my-exam GOOGLE_CLIENT_ID=… PROJECT_ID=zhumyproject SERVICE=my-exam-study bash scripts/deploy-cloud-run.sh
```

**注意：现在每个部署只能跑一门考试，用户的答题记录也只按题号保存。**

- 新考试请用**新的 Cloud Run 服务名**（`SERVICE=…`）。
- 如果它和 CCAR-F 共用同一个 Firestore 库，两个站的答题记录会按题号混在一起。要么给新考试单独开一个 Firestore 数据库，要么等「多考试存储」改造：记录按考试分开、迁移已有数据、站内加考试切换。等真的有第二门考试时再做这一步。
