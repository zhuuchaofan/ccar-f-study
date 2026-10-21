# 部署到 Google Cloud（Cloud Run + Firestore）

网站跑在 Cloud Run，用户数据（账号、作答、进度、收藏、模考）存在 Firestore。本地开发和测试仍然用 SQLite（`STORAGE` 不设就是 sqlite）。
Cloud Run 不保存本地文件，所以线上必须用 Firestore（`STORAGE=firestore`，Dockerfile 里已默认）。

## 你需要先做的事（一次性）

1. **GCP 项目**：在 Google Cloud 控制台新建一个项目（或用现有的），并开通计费。记下 Project ID。
2. **本机装 gcloud 并登录**：`gcloud auth login`。登录账号需要是该项目的 Owner（或能创建服务账号、开启 API、部署 Cloud Run 的角色）。
3. **邀请码**：选一个只给自己和信任的人的字符串，存进 Secret Manager：
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   gcloud services enable secretmanager.googleapis.com
   printf '%s' '你选的邀请码' | gcloud secrets create ccar-invite-code --data-file=-
   ```
   没有邀请码的人无法注册（登录不受影响）。
4. **部署**（在仓库根目录）：
   ```bash
   PROJECT_ID=YOUR_PROJECT_ID bash scripts/deploy-cloud-run.sh
   ```
   脚本会：开启需要的 API；创建 Firestore（native 模式，默认 `asia-east1`）；创建只有 Firestore 权限的运行账号；用 Cloud Build 按 Dockerfile 构建镜像并部署到 Cloud Run；最后打印网站网址。可重复运行，重复运行就是发布新版本。
5. 打开网址，用邀请码注册自己的账号。

## 用 GitHub Actions 部署（可选）

`.github/workflows/deploy-cloud-run.yml` 只能在 GitHub 的 Actions 页面手动点运行，不会因为合并代码自动部署。需要先配 Workload Identity Federation，并在仓库 Settings → Variables 里设置：
`GCP_PROJECT_ID`、`WIF_PROVIDER`、`GCP_DEPLOY_SERVICE_ACCOUNT`、`CLOUD_RUN_SERVICE_ACCOUNT`（可选：`GCP_REGION`、`CLOUD_RUN_SERVICE`）。如果只是自己用，直接用第 4 步的脚本更省事。

## 说明

- **费用**：`min-instances=0`，没人访问时不收计算费用；Firestore 个人用量一般在免费额度内。
- **线上不装 SQLite**：`better-sqlite3` 是可选依赖，只在本地开发用。Docker 构建里没有 Python 和编译器，npm 会跳过它，线上走 Firestore 用不到它。所以这个镜像不能用 `STORAGE=sqlite` 运行。
- **最多 2 个实例**：登录失败限速目前放在内存里，实例多了限速会不准，所以限制了实例数。
- **Firestore 数据结构**：见 `core/repo-firestore.ts` 顶部注释。只用单字段索引，不需要额外建索引。
- **本地试 Firestore**：`firebase emulators:start --only firestore`，然后
  `STORAGE=firestore FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 FIRESTORE_PROJECT_ID=demo-ccar npm test`
  （设了 `FIRESTORE_EMULATOR_HOST` 时，存储契约测试会同时跑 SQLite 和 Firestore）。
- **版权**：题库来自第三方。网站有邀请码保护，但仓库本身是公开的。
