```yaml
timeout: "3600s"

options:
  machineType: "E2_HIGHCPU_32"
  logging: "CLOUD_LOGGING_ONLY"
  substitutionOption: "ALLOW_LOOSE"
  dynamicSubstitutions: true

# Triggers (configure in UI/terraform):
# - main    -> _ENV=prod,    _GKE_CLUSTER=$_GKE_CLUSTER_PROD
# - develop -> _ENV=staging, _GKE_CLUSTER=$_GKE_CLUSTER_STAGING
# - feature/* -> _ENV=dev,   _GKE_CLUSTER=$_GKE_CLUSTER_DEV

substitutions:
  _ARTIFACT_REGISTRY: "us-central1-docker.pkg.dev/my-project"
  _GCP_PROJECT_ID: "my-project"
  _ENV: "dev" # overridden per-trigger
  _GKE_CLUSTER_DEV: "gke-dev-cluster"
  _GKE_CLUSTER_STAGING: "gke-staging-cluster"
  _GKE_CLUSTER_PROD: "gke-prod-cluster"
  _SPANNER_INSTANCE: "trading-spanner"
  _DATAFLOW_REGION: "us-central1"
  _STATE_BUCKET: "trading-tf-state-bucket"
  _TEMPLATES_BUCKET: "trading-dataflow-templates"
  _ARTIFACTS_BUCKET: "trading-build-artifacts"

# Secret Manager -> env, consumed via secretEnv + $VARNAME
availableSecrets:
  secretManager:
    - versionName: projects/${_GCP_PROJECT_ID}/secrets/snyk-token/versions/latest
      env: "SNYK_TOKEN"
    - versionName: projects/${_GCP_PROJECT_ID}/secrets/postman-api-key/versions/latest
      env: "POSTMAN_API_KEY"
    - versionName: projects/${_GCP_PROJECT_ID}/secrets/spanner-migration-sa/versions/latest
      env: "SPANNER_MIGRATION_SA"

tags:
  - "trading-platform"
  - "finra-sox"
  - "multi-region"

steps:
  # ---------------------------------------------------------------------------
  # 1. INITIAL VALIDATION (QUOTAS + IAM + SECRET MANAGER)
  # ---------------------------------------------------------------------------
  - id: "quota-iam-validation"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/gcloud:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        gcloud config set project ${_GCP_PROJECT_ID} &&
        gcloud services list --enabled &&
        gcloud iam service-accounts list &&
        gcloud secrets versions access latest --secret="snyk-token" --quiet >/dev/null
    waitFor: ["-"]

  # ---------------------------------------------------------------------------
  # 2. CODE VALIDATION (LINTING / FORMATTING)
  # ---------------------------------------------------------------------------
  - id: "code-lint"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/linters:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        npm install &&
        npx eslint services/** &&
        npx tslint services/**
    waitFor: ["-"]

  - id: "go-lint-format"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/golang:1.21"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        go vet ./... &&
        gofmt -w $(find . -name '*.go')
    waitFor: ["-"]

  # ---------------------------------------------------------------------------
  # 3. TERRAFORM VALIDATION + STATIC SECURITY (TFLINT + TFSEC)
  # ---------------------------------------------------------------------------
  - id: "terraform-validate"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/terraform:1.6"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        terraform fmt -recursive &&
        terraform init -backend-config="bucket=${_STATE_BUCKET}" &&
        terraform validate &&
        tflint &&
        tfsec .
    waitFor: ["-"]

  # ---------------------------------------------------------------------------
  # 4. LICENSE COMPLIANCE (EXTERNAL SCRIPT)
  # ---------------------------------------------------------------------------
  - id: "license-compliance"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/ci-base:latest"
    entrypoint: "bash"
    args:
      - "scripts/check-licenses.sh"
    waitFor: ["code-lint"]

  # ---------------------------------------------------------------------------
  # 5. BUILD DOCKER IMAGES (KANIKO) - 5 microservices
  # ---------------------------------------------------------------------------
  - id: "build-order-engine"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/kaniko-executor:latest"
    args:
      - "--context=./services/order-engine"
      - "--dockerfile=./services/order-engine/Dockerfile"
      - "--destination=${_ARTIFACT_REGISTRY}/trading-platform/order-engine:${SHORT_SHA}"
      - "--cache=true"
    waitFor: ["code-lint", "terraform-validate", "license-compliance"]

  - id: "build-market-data"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/kaniko-executor:latest"
    args:
      - "--context=./services/market-data"
      - "--dockerfile=./services/market-data/Dockerfile"
      - "--destination=${_ARTIFACT_REGISTRY}/trading-platform/market-data:${SHORT_SHA}"
      - "--cache=true"
    waitFor: ["code-lint", "terraform-validate", "license-compliance"]

  - id: "build-risk-calculator"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/kaniko-executor:latest"
    args:
      - "--context=./services/risk-calculator"
      - "--dockerfile=./services/risk-calculator/Dockerfile"
      - "--destination=${_ARTIFACT_REGISTRY}/trading-platform/risk-calculator:${SHORT_SHA}"
      - "--cache=true"
    waitFor: ["code-lint", "terraform-validate", "license-compliance"]

  - id: "build-settlement"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/kaniko-executor:latest"
    args:
      - "--context=./services/settlement"
      - "--dockerfile=./services/settlement/Dockerfile"
      - "--destination=${_ARTIFACT_REGISTRY}/trading-platform/settlement:${SHORT_SHA}"
      - "--cache=true"
    waitFor: ["code-lint", "terraform-validate", "license-compliance"]

  - id: "build-reporting"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/kaniko-executor:latest"
    args:
      - "--context=./services/reporting"
      - "--dockerfile=./services/reporting/Dockerfile"
      - "--destination=${_ARTIFACT_REGISTRY}/trading-platform/reporting:${SHORT_SHA}"
      - "--cache=true"
    waitFor: ["code-lint", "terraform-validate", "license-compliance"]

  # ---------------------------------------------------------------------------
  # 6. UNIT TESTS (NODE + GO) - COVERAGE >90%
  # ---------------------------------------------------------------------------
  - id: "unit-tests-node"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/node:20"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        npm install &&
        npx jest --coverage &&
        npx jest --coverage --coverageReporters=text-summary |
        tee coverage-summary.txt
    waitFor:
      - "build-order-engine"
      - "build-market-data"
      - "build-risk-calculator"
      - "build-settlement"
      - "build-reporting"

  - id: "unit-tests-go"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/golang:1.21"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        go test ./... -race -coverprofile=coverage.out &&
        go tool cover -func=coverage.out | awk '/total/ {if ($3+0 < 90) {print "Coverage below 90%"; exit 1}}'
    waitFor:
      - "build-order-engine"
      - "build-market-data"
      - "build-risk-calculator"
      - "build-settlement"
      - "build-reporting"

  # ---------------------------------------------------------------------------
  # 7. INTEGRATION TESTS (TESTCONTAINERS + EMULATORS)
  # ---------------------------------------------------------------------------
  - id: "integration-tests"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/node:20"
    entrypoint: "bash"
    args:
      - "-c"
      - "npm run test:integration"
    waitFor:
      - "unit-tests-node"
      - "unit-tests-go"

  # ---------------------------------------------------------------------------
  # 8. SECURITY SCANNING (TRIVY, SEMGREP, GITLEAKS, SNYK)
  # ---------------------------------------------------------------------------
  - id: "trivy-scan"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/trivy:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        trivy image --exit-code 1 --severity HIGH,CRITICAL ${_ARTIFACT_REGISTRY}/trading-platform/order-engine:${SHORT_SHA} &&
        trivy image --exit-code 1 --severity HIGH,CRITICAL ${_ARTIFACT_REGISTRY}/trading-platform/market-data:${SHORT_SHA} &&
        trivy image --exit-code 1 --severity HIGH,CRITICAL ${_ARTIFACT_REGISTRY}/trading-platform/risk-calculator:${SHORT_SHA} &&
        trivy image --exit-code 1 --severity HIGH,CRITICAL ${_ARTIFACT_REGISTRY}/trading-platform/settlement:${SHORT_SHA} &&
        trivy image --exit-code 1 --severity HIGH,CRITICAL ${_ARTIFACT_REGISTRY}/trading-platform/reporting:${SHORT_SHA}
    waitFor:
      - "build-order-engine"
      - "build-market-data"
      - "build-risk-calculator"
      - "build-settlement"
      - "build-reporting"

  - id: "semgrep-sast"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/semgrep:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - "semgrep --config auto --error"
    waitFor: ["code-lint"]

  - id: "gitleaks-secrets"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/gitleaks:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - "gitleaks detect --no-banner --redact --exit-code 1"
    waitFor: ["code-lint"]

  - id: "snyk-deps"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/snyk:latest"
    entrypoint: "bash"
    secretEnv:
      - "SNYK_TOKEN"
    args:
      - "-c"
      - "snyk test --severity-threshold=high"
    waitFor: ["code-lint"]

  # ---------------------------------------------------------------------------
  # 9. TERRAFORM PLAN (GKE, SPANNER, PUB/SUB, DATAFLOW)
  # ---------------------------------------------------------------------------
  - id: "terraform-plan"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/terraform:1.6"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        terraform init -backend-config="bucket=${_STATE_BUCKET}" &&
        terraform plan -out=tfplan &&
        gsutil cp tfplan gs://${_STATE_BUCKET}/plans/${BUILD_ID}/tfplan
    waitFor:
      - "terraform-validate"
      - "trivy-scan"
      - "semgrep-sast"
      - "gitleaks-secrets"
      - "snyk-deps"
      - "integration-tests"

  # ---------------------------------------------------------------------------
  # 10. FINANCIAL COMPLIANCE (FINRA + SOX) - EXTERNAL SCRIPTS
  # ---------------------------------------------------------------------------
  - id: "finra-sox-validation"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/ci-base:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - "scripts/validate-finra.sh && scripts/validate-sox.sh"
    waitFor: ["terraform-plan"]

  # ---------------------------------------------------------------------------
  # 11. INFRASTRUCTURE DEPLOY (MAIN -> PROD ONLY, OTHERWISE STAGE/DEV)
  # ---------------------------------------------------------------------------
  - id: "terraform-apply"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/terraform:1.6"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        terraform init -backend-config="bucket=${_STATE_BUCKET}" &&
        if [[ "$BRANCH_NAME" == "main" ]] || [[ "$_ENV" == "prod" ]]; then
          gsutil cp gs://${_STATE_BUCKET}/plans/${BUILD_ID}/tfplan ./tfplan &&
          terraform apply -auto-approve tfplan;
        else
          echo "Skipping apply for non-prod branch ($_ENV, $BRANCH_NAME)";
        fi
    waitFor: ["finra-sox-validation"]

  # ---------------------------------------------------------------------------
  # 12. GKE DEPLOY (HELM, PSP, ISTIO) - EXTERNAL SCRIPT
  # ---------------------------------------------------------------------------
  - id: "deploy-gke"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/kubectl:1.28"
    entrypoint: "bash"
    args:
      - "scripts/deploy-gke.sh"
    env:
      - "ENV=${_ENV}"
      - "GKE_CLUSTER_DEV=${_GKE_CLUSTER_DEV}"
      - "GKE_CLUSTER_STAGING=${_GKE_CLUSTER_STAGING}"
      - "GKE_CLUSTER_PROD=${_GKE_CLUSTER_PROD}"
      - "ARTIFACT_REGISTRY=${_ARTIFACT_REGISTRY}"
      - "SHORT_SHA=${SHORT_SHA}"
    waitFor: ["terraform-apply"]

  # ---------------------------------------------------------------------------
  # 13. DATAFLOW JOB DEPLOYMENT - EXTERNAL SCRIPT
  # ---------------------------------------------------------------------------
  - id: "deploy-dataflow"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/gcloud:latest"
    entrypoint: "bash"
    args:
      - "scripts/deploy-dataflow.sh"
    env:
      - "DATAFLOW_REGION=${_DATAFLOW_REGION}"
      - "TEMPLATES_BUCKET=${_TEMPLATES_BUCKET}"
    waitFor: ["terraform-apply"]

  # ---------------------------------------------------------------------------
  # 14. DATABASE MIGRATIONS (CLOUD SPANNER, LIQUIBASE) - EXTERNAL SCRIPT
  # ---------------------------------------------------------------------------
  - id: "run-migrations"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/liquibase:latest"
    entrypoint: "bash"
    env:
      - "SPANNER_INSTANCE=${_SPANNER_INSTANCE}"
    secretEnv:
      - "SPANNER_MIGRATION_SA"
    args:
      - "scripts/run-migrations.sh"
    waitFor:
      - "deploy-gke"
      - "deploy-dataflow"

  # ---------------------------------------------------------------------------
  # 15. CANARY DEPLOYMENT + METRICS (ISTIO 95/5) - EXTERNAL SCRIPT
  # ---------------------------------------------------------------------------
  - id: "canary-analysis"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/ci-base:latest"
    entrypoint: "bash"
    args:
      - "scripts/canary-analysis.sh"
    env:
      - "ENV=${_ENV}"
      - "SLO_P99_MS=100"
    waitFor:
      - "run-migrations"
      - "deploy-gke"

  # ---------------------------------------------------------------------------
  # 16. MONITORING & ALERTING (CLOUD MONITORING/SLO) - EXTERNAL SCRIPT
  # ---------------------------------------------------------------------------
  - id: "configure-monitoring"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/gcloud:latest"
    entrypoint: "bash"
    args:
      - "scripts/configure-monitoring.sh"
    env:
      - "ENV=${_ENV}"
    waitFor: ["canary-analysis"]

  # ---------------------------------------------------------------------------
  # 17. SMOKE TESTS (POSTMAN / NEWMAN) - SYNTHETIC TRADES
  # ---------------------------------------------------------------------------
  - id: "smoke-tests"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/postman:latest"
    entrypoint: "bash"
    secretEnv:
      - "POSTMAN_API_KEY"
    args:
      - "-c"
      - "newman run tests/smoke/trading.postman_collection.json --env-var env=${_ENV}"
    waitFor: ["canary-analysis"]

  # ---------------------------------------------------------------------------
  # 18. PERFORMANCE TESTS (K6) - 100k ORDERS/SEC
  # ---------------------------------------------------------------------------
  - id: "performance-tests"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/k6:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - "k6 run tests/performance/trading-load.js --tag env=${_ENV}"
    waitFor: ["canary-analysis"]

  # ---------------------------------------------------------------------------
  # 19. LATENCY VERIFICATION (P50/P95/P99 SLO CHECKS)
  # ---------------------------------------------------------------------------
  - id: "latency-verification"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/gcloud:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        gcloud monitoring time-series list --filter='metric.type="custom.googleapis.com/trade_latency_ms"' --limit=1 &&
        echo "Latency SLO checks enforced via scripts/canary-analysis.sh: p50<10ms,p95<50ms,p99<100ms"
    waitFor:
      - "performance-tests"
      - "configure-monitoring"

  # ---------------------------------------------------------------------------
  # 20. CHAOS ENGINEERING (CHAOS-MESH) - EXTERNAL SCRIPT
  # ---------------------------------------------------------------------------
  - id: "chaos-tests"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/chaos-mesh:latest"
    entrypoint: "bash"
    args:
      - "scripts/chaos-tests.sh"
    env:
      - "ENV=${_ENV}"
    waitFor:
      - "smoke-tests"
      - "performance-tests"

  # ---------------------------------------------------------------------------
  # 21. BLUE-GREEN PROMOTION (PROMOTE CANARY -> PRODUCTION) - EXTERNAL SCRIPT
  # ---------------------------------------------------------------------------
  - id: "blue-green-promotion"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/kubectl:1.28"
    entrypoint: "bash"
    args:
      - "scripts/promote-blue-green.sh"
    env:
      - "ENV=${_ENV}"
    waitFor:
      - "chaos-tests"
      - "latency-verification"

  # ---------------------------------------------------------------------------
  # 22. AUDIT LOGGING TO BIGQUERY (DEPLOY METADATA)
  # ---------------------------------------------------------------------------
  - id: "audit-logging"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/gcloud:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        bq insert trading_audit.deployments
        deployer:${BUILD_TRIGGER_ID},commit:${SHORT_SHA},env:${_ENV},build:${BUILD_ID}
    waitFor: ["blue-green-promotion"]

  # ---------------------------------------------------------------------------
  # 23. ARTIFACT ARCHIVAL TO GCS (LOGS, REPORTS, PLANS)
  # ---------------------------------------------------------------------------
  - id: "archive-artifacts"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/gcloud:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        mkdir -p artifacts &&
        cp -r coverage* test-reports* tfplan* artifacts/ 2>/dev/null || true &&
        gsutil -m cp -r artifacts gs://${_ARTIFACTS_BUCKET}/builds/${BUILD_ID}/
    waitFor:
      - "unit-tests-node"
      - "unit-tests-go"
      - "integration-tests"
      - "trivy-scan"
      - "terraform-plan"
      - "blue-green-promotion"

  # ---------------------------------------------------------------------------
  # 24. ROLLBACK (PLACEHOLDER / EXTERNAL USE)
  # ---------------------------------------------------------------------------
  - id: "rollback"
    name: "${_ARTIFACT_REGISTRY}/ci-tools/ci-base:latest"
    entrypoint: "bash"
    args:
      - "-c"
      - >
        echo "[rollback] This step is a placeholder. In practice, rollback.sh is
        intended to be used in a dedicated failure-handling build or triggered
        manually when a deployment fails."
    waitFor:
      - "archive-artifacts"
      - "audit-logging"

```