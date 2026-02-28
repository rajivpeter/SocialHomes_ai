#!/usr/bin/env bash
# ============================================================
# SocialHomes.Ai — Cloud Monitoring & Alerting Setup
# Creates alerting policies, notification channels, and
# log-based metrics for production monitoring.
# Tasks: 5.5.4 (Monitoring Alerts) + 5.5.9 (Log-based Monitoring)
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SocialHomes.Ai — Monitoring & Alerting Setup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}Error: No GCP project set.${NC}"
  exit 1
fi
echo -e "${YELLOW}GCP Project: ${PROJECT_ID}${NC}"

REGION="europe-west2"
SERVICE_NAME="socialhomes"

# ── Step 1: Create email notification channel ──
echo -e "\n${YELLOW}Step 1: Creating email notification channel...${NC}"
read -p "Enter alert email address [admin@yantra.works]: " ALERT_EMAIL
ALERT_EMAIL=${ALERT_EMAIL:-admin@yantra.works}

EMAIL_CHANNEL=$(gcloud monitoring channels create \
  --display-name="SocialHomes Alerts (Email)" \
  --type=email \
  --channel-labels="email_address=${ALERT_EMAIL}" \
  --project="${PROJECT_ID}" \
  --format="value(name)" 2>/dev/null || echo "")

if [ -n "$EMAIL_CHANNEL" ]; then
  echo -e "${GREEN}✓ Email channel created: ${EMAIL_CHANNEL}${NC}"
else
  echo -e "${YELLOW}  Email channel may already exist. Checking...${NC}"
  EMAIL_CHANNEL=$(gcloud monitoring channels list \
    --project="${PROJECT_ID}" \
    --filter="type=email AND labels.email_address=${ALERT_EMAIL}" \
    --format="value(name)" --limit=1 2>/dev/null || echo "")
  echo -e "${GREEN}✓ Using existing channel: ${EMAIL_CHANNEL}${NC}"
fi

# ── Step 2: Create log-based metrics ──
echo -e "\n${YELLOW}Step 2: Creating log-based metrics...${NC}"

# 2a: 5xx error rate metric
gcloud logging metrics create socialhomes_5xx_errors \
  --description="Count of 5xx responses from SocialHomes API" \
  --log-filter="resource.type=\"cloud_run_revision\"
resource.labels.service_name=\"${SERVICE_NAME}\"
httpRequest.status>=500" \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Metric socialhomes_5xx_errors already exists${NC}"

# 2b: 4xx error rate metric
gcloud logging metrics create socialhomes_4xx_errors \
  --description="Count of 4xx responses from SocialHomes API" \
  --log-filter="resource.type=\"cloud_run_revision\"
resource.labels.service_name=\"${SERVICE_NAME}\"
httpRequest.status>=400 AND httpRequest.status<500" \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Metric socialhomes_4xx_errors already exists${NC}"

# 2c: Auth failure metric
gcloud logging metrics create socialhomes_auth_failures \
  --description="Count of authentication failures (401 responses)" \
  --log-filter="resource.type=\"cloud_run_revision\"
resource.labels.service_name=\"${SERVICE_NAME}\"
httpRequest.status=401" \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Metric socialhomes_auth_failures already exists${NC}"

# 2d: Slow request metric (latency > 1s)
gcloud logging metrics create socialhomes_slow_requests \
  --description="Count of requests taking >1s" \
  --log-filter="resource.type=\"cloud_run_revision\"
resource.labels.service_name=\"${SERVICE_NAME}\"
httpRequest.latency>\"1s\"" \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Metric socialhomes_slow_requests already exists${NC}"

echo -e "${GREEN}✓ Log-based metrics created${NC}"

# ── Step 3: Create alerting policies ──
echo -e "\n${YELLOW}Step 3: Creating alerting policies...${NC}"

# 3a: Error rate > 5% alert
cat > /tmp/alert-error-rate.json <<EOF
{
  "displayName": "SocialHomes: Error Rate > 5%",
  "documentation": {
    "content": "The error rate for SocialHomes production has exceeded 5% for 5 minutes. Check Cloud Run logs for details.\n\nRunbook: See DEVOPS.md Section 'Incident Response'",
    "mimeType": "text/markdown"
  },
  "conditions": [{
    "displayName": "5xx error rate > 5%",
    "conditionThreshold": {
      "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE_NAME}\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 5,
      "duration": "300s",
      "aggregations": [{
        "alignmentPeriod": "60s",
        "perSeriesAligner": "ALIGN_RATE"
      }]
    }
  }],
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["${EMAIL_CHANNEL}"],
  "alertStrategy": {
    "autoClose": "604800s"
  },
  "severity": "CRITICAL"
}
EOF

gcloud monitoring policies create \
  --policy-from-file=/tmp/alert-error-rate.json \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Error rate alert may already exist${NC}"

# 3b: P95 latency > 1s alert
cat > /tmp/alert-latency.json <<EOF
{
  "displayName": "SocialHomes: P95 Latency > 1s",
  "documentation": {
    "content": "P95 request latency has exceeded 1 second for 5 minutes. Check for slow Firestore queries or external API timeouts.",
    "mimeType": "text/markdown"
  },
  "conditions": [{
    "displayName": "P95 latency > 1000ms",
    "conditionThreshold": {
      "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE_NAME}\" AND metric.type=\"run.googleapis.com/request_latencies\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 1000,
      "duration": "300s",
      "aggregations": [{
        "alignmentPeriod": "60s",
        "perSeriesAligner": "ALIGN_PERCENTILE_95"
      }]
    }
  }],
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["${EMAIL_CHANNEL}"],
  "alertStrategy": {
    "autoClose": "604800s"
  },
  "severity": "WARNING"
}
EOF

gcloud monitoring policies create \
  --policy-from-file=/tmp/alert-latency.json \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Latency alert may already exist${NC}"

# 3c: Memory utilisation > 80% alert
cat > /tmp/alert-memory.json <<EOF
{
  "displayName": "SocialHomes: Memory > 80%",
  "documentation": {
    "content": "Memory utilisation has exceeded 80% on a Cloud Run instance. Consider increasing --memory or investigating memory leaks.",
    "mimeType": "text/markdown"
  },
  "conditions": [{
    "displayName": "Memory utilisation > 80%",
    "conditionThreshold": {
      "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE_NAME}\" AND metric.type=\"run.googleapis.com/container/memory/utilizations\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 0.8,
      "duration": "300s",
      "aggregations": [{
        "alignmentPeriod": "60s",
        "perSeriesAligner": "ALIGN_MEAN"
      }]
    }
  }],
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["${EMAIL_CHANNEL}"],
  "alertStrategy": {
    "autoClose": "604800s"
  },
  "severity": "WARNING"
}
EOF

gcloud monitoring policies create \
  --policy-from-file=/tmp/alert-memory.json \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Memory alert may already exist${NC}"

# 3d: Health check failure alert
cat > /tmp/alert-health.json <<EOF
{
  "displayName": "SocialHomes: Health Check Failed",
  "documentation": {
    "content": "The /health endpoint is not responding with 'healthy' status. The service may be down or Firestore connectivity lost.\n\nImmediate actions:\n1. Check Cloud Run logs\n2. Verify Firestore status\n3. Consider rolling back to previous revision",
    "mimeType": "text/markdown"
  },
  "conditions": [{
    "displayName": "Uptime check failure",
    "conditionThreshold": {
      "filter": "resource.type=\"uptime_url\" AND metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND metric.labels.check_id=has_substring(\"socialhomes\")",
      "comparison": "COMPARISON_LT",
      "thresholdValue": 1,
      "duration": "300s",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_FRACTION_TRUE"
      }]
    }
  }],
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["${EMAIL_CHANNEL}"],
  "alertStrategy": {
    "autoClose": "604800s"
  },
  "severity": "CRITICAL"
}
EOF

gcloud monitoring policies create \
  --policy-from-file=/tmp/alert-health.json \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Health check alert may already exist${NC}"

echo -e "${GREEN}✓ Alerting policies created${NC}"

# ── Step 4: Create log sink to BigQuery (optional) ──
echo -e "\n${YELLOW}Step 4: Creating log sink to BigQuery for long-term analysis...${NC}"

DATASET_NAME="socialhomes_logs"

# Create BigQuery dataset
bq mk --dataset --location="${REGION}" \
  --description="SocialHomes log data for analysis" \
  "${PROJECT_ID}:${DATASET_NAME}" 2>/dev/null || \
  echo -e "${YELLOW}  Dataset ${DATASET_NAME} already exists${NC}"

# Create log sink
gcloud logging sinks create socialhomes-bigquery-sink \
  "bigquery.googleapis.com/projects/${PROJECT_ID}/datasets/${DATASET_NAME}" \
  --log-filter="resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE_NAME}\"" \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Log sink already exists${NC}"

# Grant BigQuery write access to log sink service account
SINK_SA=$(gcloud logging sinks describe socialhomes-bigquery-sink \
  --project="${PROJECT_ID}" --format="value(writerIdentity)" 2>/dev/null || echo "")
if [ -n "$SINK_SA" ]; then
  bq add-iam-policy-binding \
    --member="${SINK_SA}" \
    --role="roles/bigquery.dataEditor" \
    "${PROJECT_ID}:${DATASET_NAME}" 2>/dev/null || true
fi

echo -e "${GREEN}✓ BigQuery log sink configured${NC}"

# ── Step 5: Create monitoring dashboard ──
echo -e "\n${YELLOW}Step 5: Creating monitoring dashboard...${NC}"

cat > /tmp/dashboard.json <<EOF
{
  "displayName": "SocialHomes.Ai — Production Dashboard",
  "gridLayout": {
    "columns": "2",
    "widgets": [
      {
        "title": "Request Count (by status)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE_NAME}\" AND metric.type=\"run.googleapis.com/request_count\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_RATE",
                  "groupByFields": ["metric.labels.response_code_class"]
                }
              }
            }
          }]
        }
      },
      {
        "title": "P95 Latency (ms)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE_NAME}\" AND metric.type=\"run.googleapis.com/request_latencies\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_PERCENTILE_95"
                }
              }
            }
          }]
        }
      },
      {
        "title": "Instance Count",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE_NAME}\" AND metric.type=\"run.googleapis.com/container/instance_count\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            }
          }]
        }
      },
      {
        "title": "Memory Utilisation",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${SERVICE_NAME}\" AND metric.type=\"run.googleapis.com/container/memory/utilizations\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            }
          }]
        }
      }
    ]
  }
}
EOF

gcloud monitoring dashboards create \
  --config-from-file=/tmp/dashboard.json \
  --project="${PROJECT_ID}" 2>/dev/null || \
  echo -e "${YELLOW}  Dashboard may already exist${NC}"

echo -e "${GREEN}✓ Monitoring dashboard created${NC}"

# ── Cleanup ──
rm -f /tmp/alert-*.json /tmp/dashboard.json

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Monitoring setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "  Alerts configured:"
echo "    ✓ Error rate > 5% (CRITICAL)"
echo "    ✓ P95 latency > 1s (WARNING)"
echo "    ✓ Memory > 80% (WARNING)"
echo "    ✓ Health check failure (CRITICAL)"
echo ""
echo "  Log-based metrics:"
echo "    ✓ socialhomes_5xx_errors"
echo "    ✓ socialhomes_4xx_errors"
echo "    ✓ socialhomes_auth_failures"
echo "    ✓ socialhomes_slow_requests"
echo ""
echo "  Log sink: BigQuery → ${DATASET_NAME}"
echo "  Dashboard: SocialHomes.Ai — Production Dashboard"
echo ""
echo "  View in console:"
echo "  https://console.cloud.google.com/monitoring?project=${PROJECT_ID}"
echo ""
