# Google Cloud Build CI/CD Pipeline Prompt 

## Overview
A financial services trading platform requires a fully automated **Google Cloud Build** CI/CD pipeline deploying a multi-region trading system on GCP using **Workload Identity** and private Artifact Registry builders.

This `prompt.md` defines the exact CI/CD requirements for generating a compliant `cloudbuild.yaml`.

---

## Architecture Components
- **Cloud Dataflow** (real-time stream processing)
- **Cloud Spanner** (transactional backend)
- **GKE** (trading engines + microservices)
- **Pub/Sub** (event-driven messaging)
- **Artifact Registry** (private container registry)
- **Secret Manager** (secure secrets)
- **GCS** (Terraform state, templates, artifacts)

---

## Pipeline Requirements

### 1. Validation
- Validate project quotas & IAM permissions using:
  - `gcr.io/cloud-builders/gcloud`
- License compliance via:
  - `scripts/check-licenses.sh`

### 2. Code Linting
Use private Artifact Registry builder `${_ARTIFACT_REGISTRY}/ci-tools/linters:latest`:
- Run ESLint, TSLint
- Run `go vet`, `gofmt` for Go code

### 3. Terraform Validation
Builder: `${_ARTIFACT_REGISTRY}/ci-tools/terraform:1.6`
- `terraform fmt`, `validate`
- `tflint`
- `tfsec` security scanning

### 4. Build All 5 Microservices
Using **Kaniko** from private registry:
- `order-engine`
- `market-data`
- `risk-calculator`
- `settlement`
- `reporting`

Tagging:
```
${_ARTIFACT_REGISTRY}/trading-platform/service:${SHORT_SHA}
```

### 5. Unit Tests
- Node 20 → Jest (coverage > 90%)
- Go 1.21 → race detector + coverage > 90%

### 6. Integration Tests
Use Testcontainers + Cloud SQL Proxy + Redis emulator + Pub/Sub emulator.

### 7. Security Scanning
All private builders:
- Trivy (HIGH/CRITICAL fail build)
- Semgrep SAST
- Gitleaks
- Snyk dependency scanning

### 8. Terraform Plan
Store plan:
```
gs://${_STATE_BUCKET}/plans/${BUILD_ID}/tfplan
```

### 9. Financial Compliance
Execute external scripts:
- `scripts/validate-finra.sh`
- `scripts/validate-sox.sh`

### 10. Infrastructure Deployment
- Apply Terraform only for main/prod
- Workload Identity → no service account keys

### 11. GKE Deployment
Scripts:
- `scripts/deploy-gke.sh`
- `scripts/promote-blue-green.sh`

### 12. Dataflow Deployment
- Launch streaming pipelines from:
  - `gs://${_TEMPLATES_BUCKET}/dataflow/`
- Via `scripts/deploy-dataflow.sh`

### 13. Database Migrations
- Spanner schema updates via `scripts/run-migrations.sh`

### 14. Canary Deployment
Istio 95/5 split for 30 minutes:
- Automated metric collection
- SLO validation:
  - p50 <10ms
  - p95 <50ms
  - p99 <100ms

### 15. Chaos Engineering
Run via:
- `scripts/chaos-tests.sh`

### 16. Monitoring Setup
- Dashboards, SLO, alerts
- `scripts/configure-monitoring.sh`

### 17. Smoke Tests
- Synthetic trades with Postman collection runner

### 18. Performance Tests
- k6 load tests: **100k orders/sec**

### 19. Audit Logging
Write metadata to BigQuery deployments table.

### 20. Artifact Archival
Store logs, coverage, test results:
```
gs://${_ARTIFACTS_BUCKET}/builds/${BUILD_ID}/
```

### 21. Rollback
On pipeline failure:
- `scripts/rollback.sh`

---

## Substitutions
```
_ARTIFACT_REGISTRY
_GCP_PROJECT_ID
_GKE_CLUSTER_DEV
_GKE_CLUSTER_STAGING
_GKE_CLUSTER_PROD
_SPANNER_INSTANCE
_DATAFLOW_REGION
_STATE_BUCKET
_TEMPLATES_BUCKET
_ARTIFACTS_BUCKET
```

---

## Cloud Build Options
```
machineType: E2_HIGHCPU_32
logging: CLOUD_LOGGING_ONLY
substitution_option: ALLOW_LOOSE
dynamic_substitutions: true
timeout: 3600s
```

---

## Script Requirements
All scripts >5 lines must be external:
- deploy-gke.sh
- deploy-dataflow.sh
- run-migrations.sh
- canary-analysis.sh
- chaos-tests.sh
- promote-blue-green.sh
- rollback.sh
- validate-finra.sh
- validate-sox.sh
- check-licenses.sh
- configure-monitoring.sh

---

## Trigger Rules
- **main** → production deployment  
- **develop** → staging  
- **feature/*** → ephemeral dev environments

---

## End of Prompt
This file should be used as the canonical source when generating or modifying the CI/CD pipeline.
