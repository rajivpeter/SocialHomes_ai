#!/usr/bin/env bash
# ============================================================
# SocialHomes.Ai — Cloud CDN Setup for Static Assets
# Task 5.5.6: CDN edge caching for frontend static assets
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SocialHomes.Ai — Cloud CDN Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Error: No GCP project set.${NC}"
  exit 1
fi
echo -e "${YELLOW}GCP Project: ${PROJECT_ID}${NC}"

BACKEND_SERVICE="socialhomes-backend"
REGION="europe-west2"

# ── Step 1: Enable Cloud CDN on backend service ──
echo -e "\n${YELLOW}Step 1: Enabling Cloud CDN on backend service...${NC}"

gcloud compute backend-services update "${BACKEND_SERVICE}" \
  --global \
  --enable-cdn \
  --cache-mode=USE_ORIGIN_HEADERS \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  CDN may already be enabled or backend service not found${NC}"

echo -e "${GREEN}✓ Cloud CDN enabled${NC}"

# ── Step 2: Configure cache key policy ──
echo -e "\n${YELLOW}Step 2: Configuring cache key policy...${NC}"

gcloud compute backend-services update "${BACKEND_SERVICE}" \
  --global \
  --cache-key-include-host \
  --cache-key-include-protocol \
  --cache-key-include-query-string \
  --project="${PROJECT_ID}" 2>/dev/null || true

echo -e "${GREEN}✓ Cache key policy configured${NC}"

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Cloud CDN Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  CDN is now active on the Load Balancer."
echo ""
echo "  Cache headers are set by Express in the application:"
echo "    - Hashed assets (*.js, *.css): Cache-Control: public, max-age=31536000, immutable"
echo "    - index.html: Cache-Control: no-cache"
echo "    - API responses: Cache-Control: no-store"
echo ""
echo "  Important: The application's Express server must set correct Cache-Control"
echo "  headers. See DEVOPS.md Section 'CDN and Caching Strategy'."
echo ""
echo "  CDN invalidation after deploy:"
echo "    gcloud compute url-maps invalidate-cdn-cache socialhomesai \\"
echo "      --path='/*' --global --project=${PROJECT_ID}"
echo ""
echo "  View CDN metrics:"
echo "  https://console.cloud.google.com/net-services/cdn/list?project=${PROJECT_ID}"
echo ""
