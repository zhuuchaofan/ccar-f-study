# CCAR-F 学习平台（私人学习用途）

Claude Certified Architect – Foundations 备考网站。Next.js 15 + TypeScript + SQLite（better-sqlite3）。

## 状态
- 152 题结构化题库（英文原文、PDF 页码、来源标注），每题都有中文和日文的题干、选项、完整解析和一句话要点（**AI 翻译草稿**，界面上有标注，可随时切回英文原文）。
- 每道题归到一个官方 Task Statement（AI 判断），大纲页可按知识点练习对应题目。
- 30 个 Task Statement 都有中文课程讲解：考点、核心概念、正确做法与反模式、常见陷阱、实操练习、自测清单（**AI 草稿，未经人工审核**）。
- 刷题：顺序/随机/按领域/按知识点/未做/到期复习/错题/收藏，答案提交后才显示，间隔重复进度。
- 模拟考试：60 题、120 分钟，按领域权重抽题，交卷前不显示对错，交卷后看各领域得分和逐题解析。
- 注册/登录、学习统计、深浅色模式、键盘操作。
- 存储：本地 SQLite，线上 Firestore（同一个 `Repo` 接口，同一组契约测试）。
- 尚未完成：内容的人工审核。

## 运行
```bash
npm install
npm run build && CCAR_DB=./data/app.db npm start   # http://localhost:3000
npm test          # 单元测试（题库完整性、复习算法、认证、持久化）
npm run e2e       # Playwright 端到端（桌面 + 手机视口）
npm run lint      # ESLint
npm run validate  # 按导入格式校验 content/exams/ 下的所有考试
npm run gen:meta  # 改了题库或 manifest.json 后重新生成 components/meta.ts
# Firestore 路径：npx firebase-tools emulators:exec --only firestore --project demo-ccar "STORAGE=firestore npx playwright test"
#   （需设 FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 FIRESTORE_PROJECT_ID=demo-ccar）
```

## 部署
见 [docs/deploy-cloud-run.md](docs/deploy-cloud-run.md)：Cloud Run + Firestore，注册需要邀请码（环境变量 `INVITE_CODE`，不设则开放注册，仅限本地开发）。

## 数据
- `content/exams/ccar-f/questions.json`：第三方题库（examsvce v3.1）。来源类型 `third_party_bank`，状态 `extracted_unreviewed`。第 78 题原文只有 3 个选项，按原样保留。疑似重复：2≈8、27≈129、54≈149、55≈105，翻译时又发现 1≈49、41≈48、56≈67（选项顺序不同）。
- `content/exams/ccar-f/syllabus.json`：官方考试指南（日文 v1.0）大纲。中文标题在 `content/exams/ccar-f/ts_zh.json`，为 AI 翻译草稿。
- `content/exams/ccar-f/q/*.json`：题目的中日翻译、解析、要点和 Task Statement 归类（AI 草稿）。`python3 -I tools/check_q.py` 校验完整性。
- `content/exams/ccar-f/lessons/<id>.md`：课程讲解（AI 草稿），由 `components/ui/Markdown.tsx` 渲染（只支持一个小的 Markdown 子集）。
- `tools/*.py`：从 PDF 提取（过滤红色 KaiTi 水印字体）的脚本，记录提取方法。
- 用户数据（账号、作答、进度、收藏）在 SQLite；数据访问集中在 `core/repo.ts` 的 `Repo` 接口，线上用 `core/repo-firestore.ts`（`STORAGE=firestore`）。

## 注意
- 题库来自第三方，仅限私人学习。仓库目前是公开的（所有者的选择）。
- 练习正确率不是官方 720 分制成绩。
- 题库自带解析引用的 Anthropic 文档出处尚未逐条核实。

## 新考试

见 [docs/new-exam.md](docs/new-exam.md)：导入格式、`npm run import:exam` 和部署时的 `EXAM_ID`。
