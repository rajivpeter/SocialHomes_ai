#!/bin/bash
# =============================================================================
# SocialHomes.Ai — Google Secret Manager Setup
# =============================================================================
# Run this ONCE to create the required secrets in Google Secret Manager.
# After running, Cloud Build + Cloud Run will automatically pull secrets.
#
# Prerequisites:
#   - gcloud CLI installed and authenticated
#   - Project set: gcloud config set project YOUR_PROJECT_ID
#   - Secret Manager API enabled: gcloud services enable secretmanager.googleapis.com
# =============================================================================

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project)
echo "Project: ${PROJECT_ID}"

# Prompt for values (never hardcode them)
echo ""
echo "Enter the Firebase API Key (from Firebase Console > Project Settings):"
read -s FIREBASE_API_KEY
echo ""

echo "Enter the Firebase Auth Domain (e.g., your-project.firebaseapp.com):"
read FIREBASE_AUTH_DOMAIN
echo ""

echo "Enter the Firebase Project ID:"
read FIREBASE_PROJECT_ID
echo ""

echo "Enter the demo user password:"
read -s DEMO_USER_PASSWORD
echo ""

# Create secrets
echo "Creating secrets in Secret Manager..."

echo -n "${FIREBASE_API_KEY}" | gcloud secrets create FIREBASE_API_KEY --data-file=- 2>/dev/null || \
  echo -n "${FIREBASE_API_KEY}" | gcloud secrets versions add FIREBASE_API_KEY --data-file=-

echo -n "${FIREBASE_AUTH_DOMAIN}" | gcloud secrets create FIREBASE_AUTH_DOMAIN --data-file=- 2>/dev/null || \
  echo -n "${FIREBASE_AUTH_DOMAIN}" | gcloud secrets versions add FIREBASE_AUTH_DOMAIN --data-file=-

echo -n "${FIREBASE_PROJECT_ID}" | gcloud secrets create FIREBASE_PROJECT_ID --data-file=- 2>/dev/null || \
  echo -n "${FIREBASE_PROJECT_ID}" | gcloud secrets versions add FIREBASE_PROJECT_ID --data-file=-

echo -n "${DEMO_USER_PASSWORD}" | gcloud secrets create DEMO_USER_PASSWORD --data-file=- 2>/dev/null || \
  echo -n "${DEMO_USER_PASSWORD}" | gcloud secrets versions add DEMO_USER_PASSWORD --data-file=-

# Grant Cloud Run service account access
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Granting secret access to Cloud Run service account (${SA})..."

for SECRET in FIREBASE_API_KEY FIREBASE_AUTH_DOMAIN FIREBASE_PROJECT_ID DEMO_USER_PASSWORD; do
  gcloud secrets add-iam-policy-binding ${SECRET} \
    --member="serviceAccount:${SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || true
done

# Also grant to Cloud Build service account
BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
echo "Granting secret access to Cloud Build service account (${BUILD_SA})..."

for SECRET in FIREBASE_API_KEY FIREBASE_AUTH_DOMAIN FIREBASE_PROJECT_ID DEMO_USER_PASSWORD; do
  gcloud secrets add-iam-policy-binding ${SECRET} \
    --member="serviceAccount:${BUILD_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet 2>/dev/null || true
done

echo ""
echo "=== Setup Complete ==="
echo "Secrets created: FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, DEMO_USER_PASSWORD"
echo ""
echo "IMPORTANT: The Cloud Build trigger will now use --update-secrets to inject"
echo "these values into Cloud Run at deploy time. No secrets in source code."
echo ""
echo "To verify: gcloud secrets list"
echo "To rotate a key: echo -n 'NEW_VALUE' | gcloud secrets versions add SECRET_NAME --data-file=-"
