# Prompt: GitLab CI/CD for Azure Real‑Time Gaming Platform (sub_T03)

This prompt describes what to build and how to structure it. The goal is to produce a single `lib/ci-cd.yml` file that is production‑grade, readable, and easy to operate. Keep the language straightforward and practical.

---

## Context
We operate a real‑time multiplayer gaming backend with these Azure services:
- AKS for game servers
- Azure Functions for matchmaking
- Cosmos DB for player data
- Azure SignalR Service for WebSocket connections
- Azure Container Registry (ACR) for images
- Azure Front Door or Traffic Manager for global routing in front of multi‑region AKS

The platform must run across several Azure regions. Deployments use safe rollout strategies and are guarded by security, quality, and performance checks.

---

## Objective
Produce a single GitLab pipeline file at `lib/ci-cd.yml` that:
1. Builds and ships the game platform to Azure across dev, staging, and production.
2. Uses Azure Federated Identity with GitLab OIDC. No client secrets or long‑lived keys.
3. Contains no external scripts. All logic is inline and each job’s `script:` is five lines or fewer.
4. Enforces performance and reliability criteria before promotion.
5. Leaves a clear trail of artifacts and reports.

---

## Hard Requirements
1. Authentication
   - Use Azure Federated Identity with `$CI_JOB_JWT_V2`.
   - Use `az login --service-principal --tenant $AZURE_TENANT_ID --username $AZURE_CLIENT_ID --federated-token $CI_JOB_JWT_V2`.
   - Set the subscription with `az account set --subscription $AZURE_SUBSCRIPTION_ID`.
   - No client secrets, no device code auth, no service account keys.

2. Container Images
   - Build Docker images and push to ACR.
   - Image pattern: `$ACR_REGISTRY.azurecr.io/game-platform/<service-name>:$CI_COMMIT_SHA`.
   - Use `az acr login --expose-token` and pass the token to `docker login`.
   - Do not store credentials in files or artifacts.

3. Inline Scripts Only
   - No external shell scripts. Do not reference `./scripts/*.sh`.
   - Each job’s `script:` section must contain five or fewer lines.
   - Use anchors and variables to avoid repetition while staying within the five‑line limit when expanded in each job.

4. Tooling
   - Node 18 for Node tasks.
   - Helm 3 and kubectl 1.28 for Kubernetes tasks.
   - Cache npm using the lockfile. Avoid `npm audit` as a failure gate; produce an informational report instead.

5. Testing and Quality
   - Validation: eslint, prettier, `tsc --noEmit`, license checking, Hadolint for Dockerfiles.
   - Unit tests: Jest with coverage. Coverage regex `/All files[^|]*\|[^|]*\s+([\d\.]+)/`. Publish Cobertura.
   - Load testing: Artillery targeting 50k concurrent users. Persist JSON output.
   - Chaos testing: run against a staging AKS cluster with Chaos Mesh pre‑installed. Persist logs.
   - Latency smoke across regions and save a baseline file.

6. Security
   - Snyk code scan. Block on high severity in code scan. Container scan can be non‑blocking.
   - Checkov for Bicep or Terraform. Persist JSON.
   - A simple NSG/DDOS posture validation job that runs and emits a short report to artifacts.

7. Integration and System Validation
   - Playwright E2E covering matchmaking flow.
   - SignalR connectivity test to verify WebSocket connections.
   - Cosmos DB partition strategy validation.
   - Redis cache hit rate validation.

8. Environments and Deployments
   - Dev: deploy AKS workload and Functions to a dev resource group and AKS cluster in eastus.
   - Canary (staging): two regions (eastus and westeurope) with Flagger style canary progression 10% → 25% → 50% → 100% based on latency and error rate signals.
   - Staging: blue‑green across three regions (eastus, westeurope, southeastasia) with Linkerd. Manual approval required.
   - Production: rolling deployment across six regions (eastus, westus, northeurope, southeastasia, australiaeast, brazilsouth) with `maxUnavailable: 1` and `maxSurge: 2`. Pause and monitor between regions.
   - Use GitLab environments with deployment tiers and Azure Portal URLs where useful.

9. Performance Gates
   - Performance validation job that fails when p95 latency is greater than 50 ms or average matchmaking completion time is greater than 3 seconds.
   - Acceptance tests: synthetic players with K6 (100k users and a ramp toward 500k). Persist JSON.

10. Monitoring and Alerts
   - After production rollout, generate a short monitoring snapshot artifact.
   - Integrate with PagerDuty if a routing key is provided. Do not fail when the key is missing.

---

## Variables to Use
Define variables for the following in the YAML and expect GitLab CI variables to supply values:
- Azure: `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `AZURE_CLIENT_ID`, `ACR_REGISTRY`.
- Resource groups and AKS cluster names for dev, staging (3 regions), and production (6 regions).
- Paths for reports and artifacts (`REPORT_DIR`, `COVERAGE_DIR`, `LOADTEST_DIR`, `E2E_DIR`, `CHAOS_DIR`, `PERF_DIR`, `HELM_OUT_DIR`, `FUNCTIONS_OUT_DIR`).

---

## Pipeline Structure
Stages, in order:
1. validate
2. build
3. test
4. security
5. integration
6. deploy_dev
7. canary
8. perf
9. deploy_staging
10. acceptance
11. prod_gate
12. deploy_prod
13. monitoring

Jobs to include at minimum:
- Validation: lint_and_validate, hadolint_and_audit
- Build: build_bundles_and_package, build_helm_charts, docker_build_push_game, docker_build_push_lobby
- Test: unit_tests, load_tests_artillery, chaos_tests_mesh, latency_smoke_multi_region
- Security: snyk_scans, policy_checkov, net_guardrails
- Integration: e2e_playwright, signalr_connectivity, cosmos_partition_validation, redis_hit_validation
- Dev deploy: deploy_dev_eastus
- Canary: canary_staging_eastus_westeu
- Performance gate: performance_validation
- Staging blue‑green: deploy_staging_blue_green (manual approval)
- Acceptance: acceptance_k6
- Production gate: prod_approval_gate (manual approval)
- Production deploys: one job per region using a common template and variables
- Monitoring and alerts: monitoring_and_alerts

All of the above must follow the inline script limit and contain no external scripts.

---

## Anchors and Reuse
Provide small anchors to keep job scripts under the five‑line limit. Examples:
- `&wif_login_az` with two lines to log in and set the subscription.
- `&acr_docker_login` with two lines to retrieve a token and run `docker login`.
- `&helm_kube_ctx` with two lines to fetch AKS credentials and display client versions.

Do not use anchors that expand to more than two or three lines. Do not exceed five lines in any job’s `script:` after expansion.

---

## Artifacts and Reports
- Persist coverage reports (Cobertura), JUnit test results, Artillery and K6 JSON results, Checkov JSON, Snyk output where available, latency baselines, chaos logs, release notes for staging and dev.
- Set artifact expiry to 14 days by default. Production monitoring snapshots may be kept 30 days if needed.
- Keep release notes text files for staging and production to support change reviews.

---

## Formatting and Style
- Start the YAML with `---`.
- Keep the file readable: limit long lines where practical.
- Use clear variable names and avoid project‑specific secrets in the file.
- Each job should be self‑explanatory from its name and four or five steps.
- Provide `when: manual` on staging and production gates and deployments.
- Use `needs:` for correct DAG ordering and faster feedback.

---

## Acceptance Criteria
- The pipeline lints as valid GitLab CI YAML.
- Every job uses five or fewer script lines without external scripts.
- Azure authentication relies only on federated identity with `$CI_JOB_JWT_V2`.
- Images are pushed to ACR with the required naming pattern.
- Unit tests produce JUnit and Cobertura coverage, and the pipeline exposes coverage with the provided regex.
- Canary and blue‑green strategies are present with the specified regions.
- Production uses rolling updates per region with pauses in between.
- Performance gate fails when thresholds are not met.
- All reports and release notes are saved as artifacts.
- Monitoring and PagerDuty integration run after the last production job.
- The file is clear enough for another engineer to operate without additional documentation.

---

## Deliverable
Output a single file named `lib/ci-cd.yml` that implements everything above. Do not include any other files. The tone and structure should be pragmatic and concise.
