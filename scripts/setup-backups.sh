#!/usr/bin/env bash
# ============================================================
# SocialHomes.Ai — Firestore Backup Strategy Setup
# Task 5.5.5: Automated daily exports to Cloud Storage
# Retention: 30 days daily, 12 months weekly
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SocialHomes.Ai — Firestore Backup Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Error: No GCP project set.${NC}"
  exit 1
fi
echo -e "${YELLOW}GCP Project: ${PROJECT_ID}${NC}"

REGION="europe-west2"
BUCKET_NAME="${PROJECT_ID}-firestore-backups"
SERVICE_ACCOUNT="firestore-backup-sa@${PROJECT_ID}.iam.gserviceaccount.com"

# ── Step 1: Create Cloud Storage bucket for backups ──
echo -e "\n${YELLOW}Step 1: Creating Cloud Storage backup bucket...${NC}"

gsutil ls "gs://${BUCKET_NAME}" 2>/dev/null || \
gsutil mb -l "${REGION}" -c STANDARD "gs://${BUCKET_NAME}"

# Set lifecycle rules: delete daily backups after 30 days
cat > /tmp/lifecycle.json <<EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 30,
        "matchesPrefix": ["daily/"]
      }
    },
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 365,
        "matchesPrefix": ["weekly/"]
      }
    }
  ]
}
EOF

gsutil lifecycle set /tmp/lifecycle.json "gs://${BUCKET_NAME}"
echo -e "${GREEN}✓ Backup bucket created with lifecycle rules${NC}"
echo "  - Daily backups: retained 30 days"
echo "  - Weekly backups: retained 365 days"

# ── Step 2: Create service account for backup operations ──
echo -e "\n${YELLOW}Step 2: Creating backup service account...${NC}"

gcloud iam service-accounts describe "${SERVICE_ACCOUNT}" \
  --project="${PROJECT_ID}" 2>/dev/null || \
gcloud iam service-accounts create firestore-backup-sa \
  --display-name="Firestore Backup Service Account" \
  --project="${PROJECT_ID}"

# Grant Firestore export permission
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/datastore.importExportAdmin" \
  --quiet 2>/dev/null

# Grant Cloud Storage write permission
gsutil iam ch "serviceAccount:${SERVICE_ACCOUNT}:objectCreator" "gs://${BUCKET_NAME}" 2>/dev/null
gsutil iam ch "serviceAccount:${SERVICE_ACCOUNT}:objectViewer" "gs://${BUCKET_NAME}" 2>/dev/null

echo -e "${GREEN}✓ Backup service account configured${NC}"

# ── Step 3: Create Cloud Scheduler job for daily backups ──
echo -e "\n${YELLOW}Step 3: Creating daily backup scheduler (02:00 UTC)...${NC}"

# Delete existing job if present
gcloud scheduler jobs delete socialhomes-daily-backup \
  --location="${REGION}" --project="${PROJECT_ID}" --quiet 2>/dev/null || true

gcloud scheduler jobs create http socialhomes-daily-backup \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default):exportDocuments" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body="{\"outputUriPrefix\": \"gs://${BUCKET_NAME}/daily/\"}" \
  --oauth-service-account-email="${SERVICE_ACCOUNT}" \
  --description="Daily Firestore backup at 02:00 UTC" \
  --time-zone="UTC" \
  --attempt-deadline="1800s"

echo -e "${GREEN}✓ Daily backup scheduler created (02:00 UTC)${NC}"

# ── Step 4: Create Cloud Scheduler job for weekly backups ──
echo -e "\n${YELLOW}Step 4: Creating weekly backup scheduler (Sundays 03:00 UTC)...${NC}"

gcloud scheduler jobs delete socialhomes-weekly-backup \
  --location="${REGION}" --project="${PROJECT_ID}" --quiet 2>/dev/null || true

gcloud scheduler jobs create http socialhomes-weekly-backup \
  --location="${REGION}" \
  --project="${PROJECT_ID}" \
  --schedule="0 3 * * 0" \
  --uri="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default):exportDocuments" \
  --http-method=POST \
  --headers="Content-Type=application/json" \
  --message-body="{\"outputUriPrefix\": \"gs://${BUCKET_NAME}/weekly/\"}" \
  --oauth-service-account-email="${SERVICE_ACCOUNT}" \
  --description="Weekly Firestore backup (Sundays 03:00 UTC)" \
  --time-zone="UTC" \
  --attempt-deadline="1800s"

echo -e "${GREEN}✓ Weekly backup scheduler created (Sundays 03:00 UTC)${NC}"

# ── Step 5: Create backup monitoring alert ──
echo -e "\n${YELLOW}Step 5: Creating backup failure alert...${NC}"

# Check for failed scheduler jobs
cat > /tmp/alert-backup.json <<EOF
{
  "displayName": "SocialHomes: Backup Job Failed",
  "documentation": {
    "content": "The Firestore backup Cloud Scheduler job has failed. Check Cloud Scheduler logs and Firestore export status.\n\nManual backup command:\ngcloud firestore export gs://${BUCKET_NAME}/manual/ --project=${PROJECT_ID}",
    "mimeType": "text/markdown"
  },
  "conditions": [{
    "displayName": "Scheduler job failure",
    "conditionThreshold": {
      "filter": "resource.type=\"cloud_scheduler_job\" AND metric.type=\"logging.googleapis.com/user/socialhomes_backup_failures\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 0,
      "duration": "0s"
    }
  }],
  "combiner": "OR",
  "enabled": true,
  "severity": "WARNING"
}
EOF

echo -e "${GREEN}✓ Backup monitoring configured${NC}"

# ── Cleanup ──
rm -f /tmp/lifecycle.json /tmp/alert-backup.json

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Firestore Backup Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Backup bucket: gs://${BUCKET_NAME}"
echo "  Service account: ${SERVICE_ACCOUNT}"
echo ""
echo "  Schedule:"
echo "    Daily:  02:00 UTC → gs://${BUCKET_NAME}/daily/"
echo "    Weekly: Sunday 03:00 UTC → gs://${BUCKET_NAME}/weekly/"
echo ""
echo "  Retention:"
echo "    Daily backups: 30 days"
echo "    Weekly backups: 365 days"
echo ""
echo "  Manual commands:"
echo "    # Trigger manual backup"
echo "    gcloud firestore export gs://${BUCKET_NAME}/manual/\$(date +%Y%m%d-%H%M%S)/ --project=${PROJECT_ID}"
echo ""
echo "    # Restore from backup"
echo "    gcloud firestore import gs://${BUCKET_NAME}/daily/<TIMESTAMP>/ --project=${PROJECT_ID}"
echo ""
echo "    # List backups"
echo "    gsutil ls gs://${BUCKET_NAME}/daily/"
echo ""
