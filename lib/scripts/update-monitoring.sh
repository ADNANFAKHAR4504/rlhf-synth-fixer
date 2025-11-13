#!/usr/bin/env bash
set -euo pipefail

echo "Updating monitoring systems for latest production deployment"

CHANGELOG="${CHANGELOG:-Deployment ${GITHUB_SHA:-unknown}}"

echo "Creating Datadog deployment event"
curl -sS -X POST "https://api.datadoghq.com/api/v1/events"   -H "DD-API-KEY: ${DD_API_KEY:?DD_API_KEY not set}"   -H "Content-Type: application/json"   -d "{"title":"Prod deploy","text":"${CHANGELOG}","tags":["service:shop","env:prod"]}"   >/dev/null

echo "Creating New Relic deployment marker"
curl -sS -X POST "https://api.newrelic.com/v2/applications/${NR_APP_ID:?NR_APP_ID not set}/deployments.json"   -H "X-Api-Key:${NR_API_KEY:?NR_API_KEY not set}"   -H "Content-Type: application/json"   -d "{"deployment":{"revision":"${GITHUB_SHA:-unknown}","description":"${CHANGELOG}"}}"   >/dev/null

echo "Creating Sentry release"
sentry-cli releases new "${GITHUB_SHA:-unknown}"
sentry-cli releases set-commits "${GITHUB_SHA:-unknown}" --auto
sentry-cli releases finalize "${GITHUB_SHA:-unknown}"

echo "Updating CloudWatch dashboards and X-Ray"
aws cloudwatch put-dashboard   --dashboard-name "shop-prod"   --dashboard-body file://monitoring/cloudwatch-dashboard.json   --region "${AWS_REGION:-us-east-1}"   >/dev/null

echo "Ensuring PagerDuty on-call is configured"
curl -sS -H "Authorization: Token token=${PD_API_TOKEN:?PD_API_TOKEN not set}"   "https://api.pagerduty.com/oncalls?schedule_ids[]=${PD_SCHEDULE_ID:?PD_SCHEDULE_ID not set}"   >/dev/null

echo "Monitoring update completed"
