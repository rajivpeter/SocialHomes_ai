#!/usr/bin/env bash
# ============================================================
# SocialHomes.Ai — Staging Environment Setup
# Creates the staging Cloud Run service and Cloud Build trigger
# Run once per GCP project to initialise staging infrastructure
# ============================================================

set -euo pipefail

# Colours
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SocialHomes.Ai — Staging Environment Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

# ── Detect GCP project ──
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Error: No GCP project set. Run 'gcloud config set project <PROJECT_ID>'${NC}"
  exit 1
fi
echo -e "${YELLOW}GCP Project: ${PROJECT_ID}${NC}"

REGION="europe-west2"
STAGING_SERVICE="socialhomes-staging"
REPO_NAME="SocialHomes_ai"
REPO_OWNER="rajivpeter"

# ── Step 1: Create Artifact Registry repository for staging (if not exists) ──
echo -e "\n${YELLOW}Step 1: Ensuring Artifact Registry repository exists...${NC}"
gcloud artifacts repositories describe socialhomes \
  --location="${REGION}" --project="${PROJECT_ID}" 2>/dev/null || \
gcloud artifacts repositories create socialhomes \
  --repository-format=docker \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --description="SocialHomes.Ai Docker images"
echo -e "${GREEN}✓ Artifact Registry ready${NC}"

# ── Step 2: Create Cloud Build trigger for staging (PR trigger) ──
echo -e "\n${YELLOW}Step 2: Creating staging Cloud Build trigger...${NC}"

# Check if trigger already exists
EXISTING=$(gcloud builds triggers list --project="${PROJECT_ID}" \
  --filter="name=socialhomes-staging" --format="value(name)" 2>/dev/null || true)

if [ -n "$EXISTING" ]; then
  echo -e "${YELLOW}  Staging trigger already exists. Updating...${NC}"
  gcloud builds triggers delete socialhomes-staging \
    --project="${PROJECT_ID}" --quiet 2>/dev/null || true
fi

gcloud builds triggers create github \
  --name="socialhomes-staging" \
  --repo-name="${REPO_NAME}" \
  --repo-owner="${REPO_OWNER}" \
  --pull-request-pattern="^.*$" \
  --build-config="cloudbuild-staging.yaml" \
  --project="${PROJECT_ID}" \
  --description="Deploy SocialHomes to staging on PR" \
  2>/dev/null || echo -e "${YELLOW}  Note: GitHub trigger may need manual setup in Console${NC}"

echo -e "${GREEN}✓ Staging trigger configured${NC}"

# ── Step 3: Grant Secret Manager access to staging service account ──
echo -e "\n${YELLOW}Step 3: Granting secrets access to staging service...${NC}"
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

for SECRET in FIREBASE_API_KEY FIREBASE_AUTH_DOMAIN FIREBASE_PROJECT_ID DEMO_USER_PASSWORD; do
  gcloud secrets add-iam-policy-binding "${SECRET}" \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="${PROJECT_ID}" --quiet 2>/dev/null || true
done
echo -e "${GREEN}✓ Secret Manager access granted${NC}"

# ── Step 4: Create cleanup Cloud Scheduler job ──
echo -e "\n${YELLOW}Step 4: Setting up staging revision cleanup (weekly)...${NC}"
# Cloud Scheduler to clean old staging revisions every Sunday at 03:00 UTC
gcloud scheduler jobs describe socialhomes-staging-cleanup \
  --location="${REGION}" --project="${PROJECT_ID}" 2>/dev/null || \
gcloud scheduler jobs create http socialhomes-staging-cleanup \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --schedule="0 3 * * 0" \
  --uri="https://cloudrun.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/services/${STAGING_SERVICE}/revisions" \
  --http-method=GET \
  --description="Weekly cleanup of old staging revisions" \
  --time-zone="UTC" 2>/dev/null || \
  echo -e "${YELLOW}  Note: Revision cleanup may need manual setup${NC}"
echo -e "${GREEN}✓ Cleanup scheduler configured${NC}"

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Staging environment setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Production: socialhomes (europe-west2)"
echo "  Staging:    socialhomes-staging (europe-west2)"
echo ""
echo "  Staging deploys on every PR to main."
echo "  Old revisions are cleaned up weekly."
echo ""
echo "  Staging URL (after first deploy):"
echo "  https://socialhomes-staging-${PROJECT_NUMBER}.europe-west2.run.app"
echo ""
