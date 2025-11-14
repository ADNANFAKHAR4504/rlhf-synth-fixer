#!/usr/bin/env bash
set -euo pipefail
log() { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] [update-monitoring] $*"; }
CHANGELOG="${CHANGELOG:-Deployment of ${GITHUB_SHA:-unknown}}"
DATADOG_API_KEY="${DATADOG_API_KEY:-}"
NEW_RELIC_API_KEY="${NEW_RELIC_API_KEY:-}"
SENTRY_AUTH_TOKEN="${SENTRY_AUTH_TOKEN:-}"
SENTRY_ORG="${SENTRY_ORG:-}"
SENTRY_PROJECT="${SENTRY_PROJECT:-}"
PAGERDUTY_ROUTING_KEY="${PAGERDUTY_ROUTING_KEY:-}"
command -v jq >/dev/null 2>&1 || { log "jq is required for monitoring payloads"; exit 1; }
if [ -n "${DATADOG_API_KEY}" ]; then
  log "Creating Datadog deployment event"
  DD_PAYLOAD=$(jq -n --arg text "${CHANGELOG}" '{title:"Prod deploy",text:$text,tags:["service:shop","env:prod"]}')
  curl -sS -X POST "https://api.datadoghq.com/api/v1/events" -H "Content-Type: application/json" -H "DD-API-KEY: ${DATADOG_API_KEY}" -d "${DD_PAYLOAD}" >/dev/null || { log "Datadog event creation failed"; exit 1; }
fi
if [ -n "${NEW_RELIC_API_KEY}" ]; then
  log "Creating New Relic deployment marker"
  NR_PAYLOAD=$(jq -n --arg desc "${CHANGELOG}" '{deployment:{description:$desc,user:"github-actions"}}')
  curl -sS -X POST "https://api.newrelic.com/v2/applications/deployments.json" -H "X-Api-Key: ${NEW_RELIC_API_KEY}" -H "Content-Type: application/json" -d "${NR_PAYLOAD}" >/dev/null || { log "New Relic deployment marker failed"; exit 1; }
fi
if [ -n "${SENTRY_AUTH_TOKEN}" ] && [ -n "${SENTRY_ORG}" ] && [ -n "${SENTRY_PROJECT}" ]; then
  log "Creating Sentry release"
  sentry-cli releases new "${GITHUB_SHA:-manual}" || true
  sentry-cli releases set-commits "${GITHUB_SHA:-manual}" --auto || true
  sentry-cli releases finalize "${GITHUB_SHA:-manual}" || true
fi
if [ -n "${PAGERDUTY_ROUTING_KEY}" ]; then
  log "Sending PagerDuty change event"
  PD_PAYLOAD=$(jq -n --arg desc "${CHANGELOG}" '{routing_key:env.PAGERDUTY_ROUTING_KEY,event_action:"trigger",payload:{summary:$desc,source:"github-actions",severity:"info",component:"shop",group:"deployments",class:"deployment"}}')
  curl -sS -X POST "https://events.pagerduty.com/v2/enqueue" -H "Content-Type: application/json" -d "${PD_PAYLOAD}" >/dev/null || { log "PagerDuty event failed"; exit 1; }
fi
log "Monitoring systems updated successfully"
