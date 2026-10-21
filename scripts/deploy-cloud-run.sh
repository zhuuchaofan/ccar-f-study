#!/usr/bin/env bash
# Build from the Dockerfile with Cloud Build and deploy to Cloud Run. Run by hand; nothing deploys automatically.
# Usage: PROJECT_ID=my-project [GOOGLE_CLIENT_ID=...] bash scripts/deploy-cloud-run.sh
# SKIP_SETUP=1 only deploys (no API enabling / IAM changes); the GitHub Actions workflow uses that, so both share one set of flags.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

PROJECT_ID="${PROJECT_ID:?set PROJECT_ID, e.g. PROJECT_ID=my-gcp-project}"
REGION="${REGION:-asia-east1}"
SERVICE="${SERVICE:-ccar-f-study}"
RUNTIME_SA_NAME="${RUNTIME_SA_NAME:-ccar-f-study-run}"
RUNTIME_SA="${RUNTIME_SA:-${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com}"
INVITE_SECRET="${INVITE_SECRET:-ccar-invite-code}"
# Optional: OAuth web client ID enables "Continue with Google" (not a secret). See docs/deploy-cloud-run.md.
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
# Optional: EXAM_ID picks content/exams/<id>/ (default ccar-f). See docs/new-exam.md.
EXAM_ID="${EXAM_ID:-}"
ENV_VARS="STORAGE=firestore,FIRESTORE_PROJECT_ID=${PROJECT_ID}${GOOGLE_CLIENT_ID:+,GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}}${EXAM_ID:+,EXAM_ID=${EXAM_ID}}"

gcloud config set project "$PROJECT_ID" >/dev/null

if [[ "${SKIP_SETUP:-}" != 1 ]]; then
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com firestore.googleapis.com secretmanager.googleapis.com

# Firestore (native mode); skipped if the default database already exists.
gcloud firestore databases describe >/dev/null 2>&1 || gcloud firestore databases create --location="$REGION" --type=firestore-native

# Runtime identity with Firestore access only.
gcloud iam service-accounts describe "$RUNTIME_SA" >/dev/null 2>&1 || gcloud iam service-accounts create "$RUNTIME_SA_NAME" --display-name="CCAR-F study (Cloud Run)"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${RUNTIME_SA}" --role="roles/datastore.user" --condition=None >/dev/null

# Invite code lives in Secret Manager. Create it once: printf '%s' 'your-code' | gcloud secrets create ccar-invite-code --data-file=-
if ! gcloud secrets describe "$INVITE_SECRET" >/dev/null 2>&1; then
  echo "[ERROR] Secret '$INVITE_SECRET' not found. Create it first:" >&2
  echo "  printf '%s' 'choose-a-code' | gcloud secrets create $INVITE_SECRET --data-file=-" >&2
  exit 1
fi
gcloud secrets add-iam-policy-binding "$INVITE_SECRET" --member="serviceAccount:${RUNTIME_SA}" --role="roles/secretmanager.secretAccessor" >/dev/null

fi

gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --service-account "$RUNTIME_SA" \
  --allow-unauthenticated \
  --port 8080 --cpu 1 --memory 512Mi --concurrency 40 \
  --min-instances 0 --max-instances 2 \
  --set-env-vars "$ENV_VARS" \
  --set-secrets "INVITE_CODE=${INVITE_SECRET}:latest"

gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)'
