# Prompt: GitLab CI/CD for Azure Real‑Time Gaming Platform (sub_T03)

This prompt defines the requirements for building the GitLab CI/CD pipeline at `lib/ci-cd.yml`. It reflects the updated architecture where external scripts **are allowed** and placed under `lib/scripts/*.sh`.

---

## Context
We operate a real‑time multiplayer gaming backend with Azure services:
- AKS for game servers
- Azure Functions for matchmaking
- Cosmos DB for player data
- Azure SignalR Service for WebSocket connections
- Azure Container Registry (ACR)
- Azure Front Door / Traffic Manager for routing

The platform runs across multiple regions with safe rollout strategies and strong security/performance gates.

---

## Objective
Produce a GitLab pipeline at `lib/ci-cd.yml` that:
1. Builds, tests, validates, and deploys the game platform across dev, staging, and production.
2. Uses Azure Federated Identity via `$CI_JOB_JWT_V2` (no secrets).
3. Uses **external scripts** placed in `lib/scripts/*.sh`.
4. Ensures performance gates, quality controls, security scans, and safe multi‑region rollouts.
5. Saves all artifacts and logs.

---

## Updated Hard Requirements (External Script Model)

### 1. Azure Authentication
Use federated identity:
```
az login --service-principal --tenant $AZURE_TENANT_ID   --username $AZURE_CLIENT_ID --federated-token $CI_JOB_JWT_V2
az account set --subscription $AZURE_SUBSCRIPTION_ID
```
Authentication logic must be in a script such as:
```
lib/scripts/az-login.sh
```

---

### 2. Container Images
- Image pattern:
  ```
  $ACR_REGISTRY.azurecr.io/game-platform/<service>:$CI_COMMIT_SHA
  ```
- Use:
  ```
  az acr login --expose-token
  ```
- No secrets or stored credentials.

---

### 3. External Scripts Now Allowed
All complex logic will be inside:
```
lib/scripts/*.sh
```
Each *job* in YAML must still have **≤5 script lines**, but each line may call one script:
```
script:
  - bash lib/scripts/deploy-aks.sh
```

This avoids line-count violations and improves maintainability.

---

### 4. Tooling
- Node 18
- Helm 3
- kubectl 1.28
- Docker buildx

---

## Testing & Quality Requirements
Jobs must include:
- `lint_and_validate`: eslint, prettier, tsc, license checker
- `hadolint_and_audit`: Dockerfile validation
- `unit_tests`: Jest + coverage + JUnit + Cobertura
- Load testing (Artillery 50k concurrent)
- Chaos testing (Chaos Mesh)
- Latency smoke tests across regions

Complex logic (load, chaos, validation) handled by:
```
lib/scripts/test-*.sh
```

---

## Security Requirements
- Snyk code scanning (blocking on high severity)
- Snyk container scanning (non‑blocking)
- Checkov for Bicep/Terraform
- NSG/DDOS posture reporting:
  ```
  lib/scripts/net-guardrails.sh
  ```

---

## Integration Tests
Jobs:
- Playwright E2E
- SignalR connectivity
- Cosmos partition validation
- Redis hit‑rate validation

Use scripts:
```
lib/scripts/e2e-playwright.sh
lib/scripts/test-signalr.sh
...
```

---

## Deployment Requirements

### Dev
- Deploy Functions + Helm chart to eastus.
- Script:
  ```
  lib/scripts/deploy-dev.sh
  ```

### Canary
- Regions: eastus + westeurope.
- Script:
  ```
  lib/scripts/deploy-canary-flagger.sh
  ```

### Staging (Blue‑Green)
- Regions: eastus, westeurope, southeastasia.
- Script:
  ```
  lib/scripts/deploy-bluegreen-linkerd.sh
  ```

### Production Rolling Deployment
Regions:
- eastus
- westus
- northeurope
- southeastasia
- australiaeast
- brazilsouth

Rolling parameters:
```
maxUnavailable=1
maxSurge=2
```

Script:
```
lib/scripts/deploy-prod.sh
```

---

## Performance Gate
Fail deployment when:
- p95 latency > 50 ms
- matchmaking time > 3 sec

Script:
```
lib/scripts/perf-validate.sh
```

---

## Acceptance (Synthetic Players)
Script:
```
lib/scripts/synthetic-players.sh
```

Persist `$PERF_DIR/k6.json`.

---

## Monitoring & Alerts
After production:
- Generate monitoring snapshot.
- Optional PagerDuty notification:
  ```
  lib/scripts/monitoring.sh
  ```

---

## Required Pipeline Structure
Stages:
```
validate
build
test
security
integration
deploy_dev
canary
perf
deploy_staging
acceptance
prod_gate
deploy_prod
monitoring
```

---

## Required Jobs
Must include:
- Validation: lint_and_validate, hadolint_and_audit
- Build: bundles, charts, docker builds
- Test: unit, artillery, chaos, latency
- Security: snyk, checkov, net_guardrails
- Integration: playwright, signalr, cosmos, redis
- Deployments: dev, canary, staging, acceptance, prod gate, 6x prod
- Monitoring

---

## Variables to Define
- Azure identity vars
- ACR registry
- Resource groups + AKS clusters for 10 regions
- Report directories

---

## Acceptance Criteria
A correct answer:
1. Provides a valid GitLab YAML.
2. Each job’s script is ≤5 lines.
3. Uses external scripts for all heavy logic.
4. Uses Azure Federated Identity only.
5. Produces expected artifacts.
6. Implements canary, blue‑green, and rolling strategies.
7. Enforces performance thresholds.
8. Produces monitoring snapshots.
9. Fully readable and production‑ready.

---

## Deliverable
A single file:
```
lib/ci-cd.yml
```
all external logic in:
```
lib/scripts/*.sh
```

