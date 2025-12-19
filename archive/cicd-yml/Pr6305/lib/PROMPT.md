
# Task: GitLab CI/CD for GCP Deployment with Workload Identity Federation

## Goal
Create a **GitLab CI/CD** pipeline that deploys to **Google Cloud Platform** using **Workload Identity Federation** (no service account keys). The pipeline must support **preview**, **staging**, and **production** across regions, enforce strong security/compliance, and keep all inline shell blocks to five lines or fewer.

## Authentication
- Use **GCP Workload Identity Federation** with the service account:
  - `workload-identity@${GCP_PROJECT_ID}.iam.gserviceaccount.com`
- No service account keys. Use the GitLab OIDC token (`$CI_JOB_JWT_V2`) to obtain short-lived credentials.
- The workload identity provider resource name should be provided as a variable:
  - `$GCP_WIF_PROVIDER` (e.g., `projects/123456789/locations/global/workloadIdentityPools/pool-id/providers/provider-id`)

## Registries and Images
- All CI job images come from a **private registry**, referenced as `$CI_REGISTRY/...`
- Application images are built and pushed to **GCP Artifact Registry** with:
  - `$GCP_REGISTRY/$GCP_PROJECT_ID/app-name:$CI_COMMIT_SHA`

## Stages (in order)
1. **validate** – linting and static analysis: `pylint`, `flake8`, `mypy`, `bandit`, `pip-audit`
2. **build** – build container images via Cloud Build and push to Artifact Registry
3. **test** – run `pytest` (coverage >85%), `locust` load tests, and `testcontainers` integration tests
4. **preview** – deploy ephemeral Cloud Run previews (auto-cleanup after 48h)
5. **security** – Trivy + Grype scans (block on HIGH/CRITICAL), Cosign signing, ZAP DAST, Checkov for Terraform
6. **compliance** – HIPAA validation, Cloud Asset audit, access logging verification, encryption validation
7. **staging_deploy** – blue-green deployment to GKE with Istio traffic split
8. **performance** – Lighthouse, JMeter, and DB profiling
9. **prod_approval** – manual approval by compliance officer
10. **prod_deploy** – multi-region Cloud Run rollout (10% → 50% → 100%) with health checks
11. **monitoring** – SLO dashboards, tracing, Error Reporting, BigQuery audit log verification
12. **dr_test** – scheduled job for backup restoration and RTO/RPO validation

## Reporting and Artifacts
- **JUnit** test reports
- **Cobertura** coverage reports
- **SAST** container scan reports
- Artifact retention: **1 week**

## Tooling
- **Python 3.11** and **gcloud CLI** (from private registry)
- Cache **pip** and **Poetry** dependencies

## Constraints
- No service account keys (Workload Identity only)
- Container vulnerabilities (HIGH/CRITICAL) must block deployment
- HIPAA compliance required
- Auto-stop preview after 48h
- Blue-green strategy for GKE
- Coverage threshold: >85%
- Inline `script:` blocks ≤5 lines; longer scripts in `scripts/` directory

## Required External Scripts
`scripts/deploy-cloudrun.sh`  
`scripts/deploy-gke-bluegreen.sh`  
`scripts/run-hipaa-validation.sh`  
`scripts/configure-monitoring.sh`  
`scripts/test-dr.sh`  
`scripts/gradual-rollout.sh`  
`scripts/validate-encryption.sh`
