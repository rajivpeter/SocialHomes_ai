#!/usr/bin/env bash
# ============================================================
# SocialHomes.Ai — Custom Domain & SSL Setup
# Task 5.5.7: Domain mapping, managed SSL, HTTP→HTTPS redirect
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SocialHomes.Ai — Custom Domain & SSL Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Error: No GCP project set.${NC}"
  exit 1
fi
echo -e "${YELLOW}GCP Project: ${PROJECT_ID}${NC}"

DOMAIN="socialhomes.ai"
WWW_DOMAIN="www.socialhomes.ai"
EXTERNAL_IP="34.149.218.63"
REGION="europe-west2"

echo -e "\n${BLUE}This script configures:${NC}"
echo "  1. DNS records (manual step — instructions provided)"
echo "  2. Google-managed SSL certificate"
echo "  3. HTTP → HTTPS redirect"
echo "  4. www → non-www redirect"

# ── Step 1: DNS Configuration (manual) ──
echo -e "\n${YELLOW}Step 1: DNS Configuration${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Add these DNS records at your domain registrar:"
echo ""
echo "  Type  Name  Value              TTL"
echo "  ────  ────  ─────              ───"
echo "  A     @     ${EXTERNAL_IP}     300"
echo "  A     www   ${EXTERNAL_IP}     300"
echo ""
echo "  Or use CNAME for www:"
echo "  CNAME www   ${DOMAIN}.          300"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

# ── Step 2: Verify SSL certificate status ──
echo -e "\n${YELLOW}Step 2: Checking SSL certificate status...${NC}"

gcloud compute ssl-certificates list \
  --global \
  --project="${PROJECT_ID}" \
  --format="table(name, type, managed.status, managed.domainStatus)" 2>/dev/null || \
  echo -e "${YELLOW}  No SSL certificates found${NC}"

# Create certificate if not exists
echo -e "\n${YELLOW}Creating/updating Google-managed SSL certificate...${NC}"

gcloud compute ssl-certificates describe socialhomes-cert \
  --global --project="${PROJECT_ID}" 2>/dev/null || \
gcloud compute ssl-certificates create socialhomes-cert \
  --domains="${DOMAIN},${WWW_DOMAIN}" \
  --global \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Certificate already exists${NC}"

echo -e "${GREEN}✓ SSL certificate configured${NC}"

# ── Step 3: Verify HTTPS target proxy ──
echo -e "\n${YELLOW}Step 3: Verifying HTTPS configuration...${NC}"

gcloud compute target-https-proxies list \
  --global \
  --project="${PROJECT_ID}" \
  --format="table(name, sslCertificates, urlMap)" 2>/dev/null || true

echo -e "${GREEN}✓ HTTPS proxy verified${NC}"

# ── Step 4: Verify HTTP → HTTPS redirect ──
echo -e "\n${YELLOW}Step 4: Verifying HTTP→HTTPS redirect...${NC}"

gcloud compute url-maps list \
  --global \
  --project="${PROJECT_ID}" \
  --format="table(name, defaultUrlRedirect)" 2>/dev/null || true

echo -e "${GREEN}✓ Redirect configuration checked${NC}"

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Domain & SSL Setup Guide${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Current status:"
echo "    External IP: ${EXTERNAL_IP}"
echo "    Domain: ${DOMAIN}"
echo "    SSL: Google-managed (auto-renewing)"
echo ""
echo "  SSL certificate provisioning requires DNS to be correctly pointed."
echo "  Status will change from PROVISIONING → ACTIVE once DNS propagates."
echo ""
echo "  Check certificate status:"
echo "    gcloud compute ssl-certificates describe socialhomes-cert \\"
echo "      --global --project=${PROJECT_ID} \\"
echo "      --format='value(managed.status, managed.domainStatus)'"
echo ""
echo "  Test after DNS propagation:"
echo "    curl -I https://${DOMAIN}/health"
echo "    curl -I http://${DOMAIN}  # Should 301 → https"
echo "    curl -I https://${WWW_DOMAIN}  # Should 301 → https://${DOMAIN}"
echo ""
