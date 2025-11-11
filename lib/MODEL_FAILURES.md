# Model Failures and Corrections — sub_T03 (CI/CD for Azure multi‑region gaming backend)

This document records issues found in the initially generated **`lib/ci-cd.yml`** and the precise corrections applied to produce a safer, reliable pipeline for **AKS + Azure Functions + Cosmos DB + SignalR + ACR** using **Azure Federated Identity** (no client secrets).

> Scope: validation → build → test → security → integration → dev deploy → canary (Flagger) → performance validation → staging (blue‑green via Linkerd) → acceptance (K6) → prod gate → progressive multi‑region prod deploy → monitoring/alerting.

---

## Summary of Critical Fixes (TL;DR)

- **Switched all Azure auth to federated OIDC (`$CI_JOB_JWT_V2`)**; removed any lingering login flows that could fallback to device code or client secrets.
- **Hardened ACR login** by using `az acr login --expose-token` → `docker login` with ephemeral token in image build jobs.
- **Pinned tooling versions** (kubectl 1.28, Helm 3.14.x, Azure CLI image) to prevent drift.
- **Made tests & scanners artifact-friendly**: Jest JUnit, Cobertura coverage, Artillery/K6 JSON, Checkov JSON, Snyk outputs, chaos logs.
- **Introduced SLO gates**: p95 latency < 50ms; matchmaking < 3s; hard fail on violation.
- **Manual approvals on staging & prod** with environment tiers and deployment notes enforcement.
- **Rolling update guarantees** in prod with `maxUnavailable: 1`, `maxSurge: 2`, and monitored pauses between regional rollouts.
- **PagerDuty integration** placed post‑deploy with idempotent event payload; safe to run with or without key.
- **All long scripts externalized** to `./scripts/*.sh` per requirement (>5 lines).

---

## Category A — Security & Identity (CRITICAL)

### A1. Mixing auth methods (client secrets/device code)
**Issue**: Some Azure CLI logins can implicitly fall back to interactive or secret-based auth in CI.
**Fix**: Enforce federated login only.
```bash
az login --service-principal   --tenant "$AZURE_TENANT_ID"   --username "$AZURE_CLIENT_ID"   --federated-token "$CI_JOB_JWT_V2"
az account set --subscription "$AZURE_SUBSCRIPTION_ID"
```
**Impact**: Eliminates persistent secrets; uses short‑lived OIDC tokens only.

### A2. ACR auth during docker builds
**Issue**: Using `az acr login` without a Docker credential handoff can break in DinD contexts.
**Fix**: Use `--expose-token` and pass the ephemeral token to `docker login`.
```bash
TOKEN="$(az acr login -n "$ACR_REGISTRY" --expose-token --query accessToken -o tsv)"
docker login "$ACR_REGISTRY.azurecr.io" -u 00000000-0000-0000-0000-000000000000 -p "$TOKEN"
```
**Impact**: Avoids storing credentials; works predictably in GitLab runners.

### A3. Snyk and Checkov gating
**Issue**: Scans were advisory only.
**Fix**: Snyk code scan blocks on `high` severity; infra scans uploaded as artifacts; network guardrail checks added (NSG, DDoS).
**Impact**: Prevents promotion with critical security debt.

---

## Category B — Build & Packaging (HIGH)

### B1. Unpinned tools causing “works yesterday, breaks today”
**Issue**: kubectl/helm drift leading to schema errors.
**Fix**: Pin versions: `KUBECTL_VERSION=v1.28.9`, `HELM_VERSION=v3.14.4`, Azure CLI container tag.

### B2. NPM cache misses and audit noise
**Issue**: Slow builds due to cache churn; noisy audits failing CI.
**Fix**: Cache keyed by `package-lock.json`; use `npm ci --no-audit --no-fund` in CI; run `npm audit` as info-only in **validate** stage and export report.

### B3. Helm/chart outputs not persisted
**Issue**: Downstream deploy jobs missing charts.
**Fix**: Package to `dist/helm`, persist via artifacts; include image tags files (`dist/*.image`).

---

## Category C — Testing & Quality (HIGH)

### C1. Coverage not visible in MR
**Issue**: Jest coverage not parsed by GitLab.
**Fix**: Add coverage regex & Cobertura report.
```yaml
coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
reports:
  junit: reports/jest-junit.xml
  coverage_report: { coverage_format: cobertura, path: reports/coverage/cobertura-coverage.xml }
```

### C2. Load test fidelity
**Issue**: Artillery output not persisted; unclear scale.
**Fix**: Scenario file `artillery/scenarios/50k.yml`; JSON report to `reports/load/artillery-report.json`.

### C3. Chaos engineering isolation
**Issue**: Chaos experiments running against shared clusters.
**Fix**: Constrain to **test/staging eastus** AKS; export experiment logs to `reports/chaos/` and always upload artifacts.

### C4. Latency smoke across regions
**Issue**: No baseline check before canary.
**Fix**: Add `validate-global-latency.sh` to collect region latencies; store as artifacts for trend analysis.

---

## Category D — Integration & System Validation (HIGH)

### D1. SignalR, Cosmos partitions, Redis hit-rate
**Issue**: Lacked distinct gates.
**Fix**: Separate jobs:
- `signalr_connectivity_test` (WebSocket handshake, message fan‑out),
- `cosmos_partition_strategy_validation` (hot-partition detection),
- `redis_cache_hit_validation` (SLA on hit rate).

### D2. Playwright E2E not runner-ready
**Issue**: Missing browsers & deps.
**Fix**: `npx playwright install --with-deps` in job; JUnit output to `$E2E_DIR`.

---

## Category E — Deployments (CRITICAL)

### E1. Dev deploy missing functions
**Issue**: Only AKS deployed.
**Fix**: Add Azure Functions deployment first, then Helm release for AKS.
```bash
bash scripts/deploy-functions.sh "dev" "dist/functions/matchmaking.zip" "dev-functions-app"
bash scripts/deploy-aks.sh "dev" "$RG_DEV_EASTUS" "$AKS_DEV_EASTUS" "dist/helm" "$ACR_REGISTRY" "$CI_COMMIT_SHA"
```

### E2. Canary (Flagger) progression not metrics-gated
**Issue**: Percent shifts not tied to latency/error metrics.
**Fix**: Pass policy to helper script: `10,25,50,100` with `latency,error_rate` checks. Promotion halts on SLO breach.

### E3. Staging blue‑green across 3 regions (Linkerd)
**Issue**: Single-region staging; no service mesh policy.
**Fix**: Blue‑green deploy per region (`eastus`, `westeurope`, `southeastasia`) via `deploy-bluegreen-linkerd.sh`. Require **manual** approval.

### E4. Production rollouts — lack of guardrails
**Issue**: No rolling params; no pause/monitor between regions.
**Fix**: Enforce `maxUnavailable=1,maxSurge=2`, sequential regional jobs (`eastus → westus → northeurope → southeastasia → australiaeast → brazilsouth`), monitoring after each region using `configure-monitoring.sh`.

---

## Category F — Performance & SLOs (CRITICAL)

### F1. No automatic SLO enforcement
**Issue**: p95 latency & matchmaking time not gating pipeline.
**Fix**: Hard validation job:
- **p95 < 50ms** (from JSON written by latency validation script),
- **matchmaking < 3s** (custom script `validate:matchmaking-sla`).

**Impact**: Prevents promotion on degraded UX.

---

## Category G — Monitoring, Alerts, and Reporting (HIGH)

### G1. Observability wiring after deploy
**Issue**: App Insights/Monitor/Grafana not consistently configured per region.
**Fix**: Post‑deploy hook `configure-monitoring.sh` per region plus global pass; export telemetry config snapshot to artifacts.

### G2. PagerDuty signals
**Issue**: Alerts triggered even when key absent → failures.
**Fix**: Conditional POST only when `PAGERDUTY_ROUTING_KEY` is set; use informative non‑blocking notification.

---

## Category H — Artifacts & Traceability (MEDIUM)

- All reports (coverage, load, chaos, perf, E2E, security) are stored under `reports/**`.
- Image digests recorded in `dist/*.image` for SBOM/traceability.
- Staging/prod release notes captured in `dist/helm/*-notes*.txt` by deploy scripts (ensure scripts write these files).

---

## Category I — Variables & Secrets Hygiene (HIGH)

- Required **masked, protected** variables:
  - `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_CLIENT_ID`, `ACR_REGISTRY`
  - Optional: `SNYK_TOKEN`, `PAGERDUTY_ROUTING_KEY`
- Map your **resource groups** and **AKS cluster names** for each region/env via CI variables shown in YAML.
- Ensure **GitLab OIDC** → **Azure Federated Credential** subject filter matches your project/ref.

---

## Local Validation & Linting

```bash
# YAML structure
pipx install yamllint && yamllint lib/ci-cd.yml

# GitLab CI syntax
curl -s --request POST   --form token="$GITLAB_TOKEN"   --form "content=$(cat lib/ci-cd.yml)"   "https://gitlab.com/api/v4/ci/lint"

# Prettier / ESLint / TypeScript
npm run lint && npm run format:check && npx tsc --noEmit

# Quick env check for required CI vars (example stub)
grep -E 'AZURE_TENANT_ID|AZURE_SUBSCRIPTION_ID|AZURE_CLIENT_ID|ACR_REGISTRY' <<< "$(env)"
```

---

## Open Items / Assumptions

- **AKS clusters** are configured with **Azure CNI** and **AAD Pod Identity**; Helm charts must include **aad-pod-identity** bindings where needed.
- **Flagger** uses Prometheus metrics; ensure the metric templates for latency/error are installed in staging clusters.
- **Front Door/Traffic Manager** DNS routing is pre‑provisioned; deploy scripts simply update backends/weights where applicable.
- **License checker** policy: current output is **report-only**. If you want to block on forbidden licenses, add a policy file and fail on violations.

---

## Quick Diff‑Style Reference (Applied Fixes)

```diff
- az login                               # (implicit device code / no OIDC)
+ az login --service-principal --tenant "$AZURE_TENANT_ID" +   --username "$AZURE_CLIENT_ID" --federated-token "$CI_JOB_JWT_V2"

- az acr login -n "$ACR_REGISTRY"
+ TOKEN="$(az acr login -n "$ACR_REGISTRY" --expose-token -o tsv --query accessToken)"
+ docker login "$ACR_REGISTRY.azurecr.io" -u 00000000-0000-0000-0000-000000000000 -p "$TOKEN"

- helm upgrade --install ...             # no rollout params
+ helm upgrade --install ... --set strategy.rollingParams="maxUnavailable=1,maxSurge=2"

- echo "Canary 10→25→50→100"             # no gating
+ deploy-canary-flagger.sh ... "10,25,50,100" "latency,error_rate"

- # no SLO gates
+ node -e "const m=require('$PERF_DIR/latency.json'); if(m.p95 > 50){ process.exit(1) }"
+ npm run validate:matchmaking-sla -- --maxSec=3
```

---

### Final Status
All critical security and reliability gaps are closed. Pipeline now:
- Authenticates via **federated OIDC only**, 
- Builds & pushes images to **ACR** with ephemeral tokens,
- Enforces **quality, security, and performance SLOs** before promotion,
- Orchestrates **safe multi‑region rollouts** with observability and human approvals.

