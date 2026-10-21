# CCAR-F 学习平台（私人学习用途）

Claude Certified Architect – Foundations 备考网站。Next.js 15 + TypeScript + SQLite（better-sqlite3）。

## 状态（阶段 B 进行中）
已完成：152 题结构化题库（原文、PDF 页码、来源标注）、官方大纲 30 个 Task Statement 入口、注册/登录、刷题（顺序/随机/按领域/未做/到期复习/错题/收藏）、答案提交后才显示、间隔重复进度、学习统计、深浅色模式、键盘操作。
**尚未完成**：中文/日文题目翻译与解析、题目到 Task Statement 的映射、课程讲解与实验、模拟考试、Firestore 实现。界面上这些位置会明确显示「尚未生成」，不会伪装成已有内容。

## 运行
```bash
npm install
npm run build && CCAR_DB=./data/app.db npm start   # http://localhost:3000
npm test          # 单元测试（题库完整性、复习算法、认证、持久化）
npm run e2e       # Playwright 端到端（桌面 + 手机视口）
```

## 数据
- `data/questions_en.json`：第三方题库（examsvce v3.1）。来源类型 `third_party_bank`，状态 `extracted_unreviewed`。第 78 题原文只有 3 个选项，按原样保留。疑似重复：2≈8、27≈129、54≈149、55≈105。
- `data/syllabus_ja.json`：官方考试指南（日文 v1.0）大纲。中文标题在 `content/ts_zh.json`，为 AI 翻译草稿。
- `tools/*.py`：从 PDF 提取（过滤红色 KaiTi 水印字体）的脚本，记录提取方法。
- 用户数据（账号、作答、进度、收藏）在 SQLite；数据访问集中在 `core/repo.ts` 的 `Repo` 接口，上线时可替换为 Firestore 实现。

## 注意
- 题库来自第三方，仅限私人学习，**不要公开发布**；仓库应保持私有。
- 练习正确率不是官方 720 分制成绩。
- 题库自带解析引用的 Anthropic 文档出处尚未逐条核实。
