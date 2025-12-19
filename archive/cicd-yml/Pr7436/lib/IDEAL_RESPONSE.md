```yaml
# ci-cd.yml - Google Cloud Build pipeline for global multiplayer gaming backend
#  CI/CD Optimization - GKE Autopilot, Memorystore, Firestore, Cloud CDN, Global LB

timeout: "5400s"

substitutions:
  _ARTIFACT_REGISTRY: "us-docker.pkg.dev/my-project"
  _ENVIRONMENT: "dev" # dev | staging | prod
  _CDN_BUCKET: "my-gaming-cdn-bucket"
  # For dev/staging/prod, configure _GKE_REGIONS via trigger:
  #   dev:     us-central1
  #   staging: us-central1,us-east1,us-west1
  #   prod:    us-central1,us-east1,us-west1,europe-west1,europe-west4,asia-northeast1,asia-southeast1,australia-southeast1
  _GKE_REGIONS: "us-central1,us-east1,us-west1,europe-west1,europe-west4,asia-northeast1,asia-southeast1,australia-southeast1"
  _MEMORYSTORE_TIER: "STANDARD_HA"
  _FIRESTORE_MODE: "NATIVE" # NATIVE | DATASTORE_MODE
  _PLAYER_COUNT_TARGET: "10000"
  _WORKER_POOL: "projects/my-project/locations/global/workerPools/gaming-highcpu-pool"

options:
  machineType: "N1_HIGHCPU_32"
  dynamic_substitutions: true
  logging: CLOUD_LOGGING_ONLY
  pool:
    name: "${_WORKER_POOL}"

steps:
  # ------------------------------------------------------------------
  # 1. Pre-flight checks
  #    - Validate global HTTP(S) Load Balancer config
  #    - Validate Cloud CDN cache & cache keys
  #    - Validate Cloud Armor WAF rules
  #    - Validate GKE clusters exist in all configured regions
  # ------------------------------------------------------------------
  - id: "preflight-checks"
    name: "gcr.io/cloud-builders/gcloud"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/preflight-checks.sh               --environment "${_ENVIRONMENT}"               --gke-regions "${_GKE_REGIONS}"

  # ------------------------------------------------------------------
  # 2. Code validation (linting)
  # ------------------------------------------------------------------
  - id: "golang-lint"
    name: "${_ARTIFACT_REGISTRY}/game-tools/golangci-lint:latest"
    dir: "services/game-server"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        golangci-lint run ./...

  - id: "node-eslint"
    name: "${_ARTIFACT_REGISTRY}/game-tools/eslint:latest"
    dir: "services/matchmaking-service"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        eslint . --ext .js,.ts

  - id: "dockerfile-hadolint"
    name: "${_ARTIFACT_REGISTRY}/game-tools/hadolint:latest"
    dir: "."
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        find . -name "Dockerfile*" -print0 | xargs -0 -n1 hadolint

  # ------------------------------------------------------------------
  # 3. Terraform validation + tfsec (GKE, Memorystore, Firestore, CDN)
  # ------------------------------------------------------------------
  - id: "terraform-validate"
    name: "${_ARTIFACT_REGISTRY}/game-tools/terraform:1.6"
    dir: "infra/terraform"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        terraform init -input=false
        terraform fmt -check
        terraform validate

  - id: "terraform-tfsec-scan"
    name: "${_ARTIFACT_REGISTRY}/game-tools/tfsec:latest"
    dir: "infra/terraform"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        tfsec .

  # ------------------------------------------------------------------
  # 4. Dependency scanning (Go + Node)
  # ------------------------------------------------------------------
  - id: "go-deps-nancy"
    name: "${_ARTIFACT_REGISTRY}/game-tools/nancy:latest"
    dir: "services"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        find . -name "go.sum" -print0 | while IFS= read -r -d '' f; do
          echo "Scanning $f with nancy..."
          cat "$f" | nancy sleuth
        done

  - id: "node-deps-audit"
    name: "node:20"
    dir: "services/matchmaking-service"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        npm ci
        npm audit --audit-level=high

  # ------------------------------------------------------------------
  # 5. Build Docker images with Kaniko (3 services, parallel)
  # ------------------------------------------------------------------
  - id: "build-game-server"
    name: "gcr.io/kaniko-project/executor:latest"
    waitFor: ["go-deps-nancy", "golang-lint", "dockerfile-hadolint"]
    dir: "services/game-server"
    args:
      - "--destination=${_ARTIFACT_REGISTRY}/gaming-platform/game-server:${SHORT_SHA}"
      - "--context=."
      - "--dockerfile=./Dockerfile"
      - "--cache=true"
      - "--cache-ttl=12h"

  - id: "build-matchmaking-service"
    name: "gcr.io/kaniko-project/executor:latest"
    waitFor: ["node-deps-audit", "node-eslint", "dockerfile-hadolint"]
    dir: "services/matchmaking-service"
    args:
      - "--destination=${_ARTIFACT_REGISTRY}/gaming-platform/matchmaking-service:${SHORT_SHA}"
      - "--context=."
      - "--dockerfile=./Dockerfile"
      - "--cache=true"
      - "--cache-ttl=12h"

  - id: "build-stats-aggregator"
    name: "gcr.io/kaniko-project/executor:latest"
    waitFor: ["go-deps-nancy", "golang-lint", "dockerfile-hadolint"]
    dir: "services/stats-aggregator"
    args:
      - "--destination=${_ARTIFACT_REGISTRY}/gaming-platform/stats-aggregator:${SHORT_SHA}"
      - "--context=."
      - "--dockerfile=./Dockerfile"
      - "--cache=true"
      - "--cache-ttl=12h"

  # ------------------------------------------------------------------
  # 6. Build static assets (React lobby UI) + upload to Cloud Storage
  # ------------------------------------------------------------------
  - id: "build-static-assets"
    name: "node:20"
    dir: "web/lobby-ui"
    waitFor: ["node-eslint"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        npm ci
        npm run build

  - id: "upload-static-assets"
    name: "gcr.io/cloud-builders/gcloud"
    dir: "web/lobby-ui"
    waitFor: ["build-static-assets"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        gsutil -m rsync -r ./build "gs://${_CDN_BUCKET}/assets/${SHORT_SHA}/"

  # ------------------------------------------------------------------
  # 7. Unit tests (Go + Node)
  # ------------------------------------------------------------------
  - id: "unit-tests-go"
    name: "${_ARTIFACT_REGISTRY}/game-tools/golang:1.21"
    dir: "services"
    waitFor: ["build-game-server", "build-stats-aggregator"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        go test ./... -race -run=. -bench=. -benchmem

  - id: "unit-tests-node"
    name: "node:20"
    dir: "services/matchmaking-service"
    waitFor: ["build-matchmaking-service"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        npm test -- --runInBand

  # ------------------------------------------------------------------
  # 8. Performance testing (10k players, tick rate, matchmaking throughput)
  # ------------------------------------------------------------------
  - id: "performance-testing"
    name: "${_ARTIFACT_REGISTRY}/game-tools/game-load-tester:latest"
    waitFor: ["unit-tests-go", "unit-tests-node"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        game-load-tester               --target-player-count "${_PLAYER_COUNT_TARGET}"               --concurrent-players 10000               --tick-rate-target 60               --matchmaking-rpm 50000               --packet-loss "0,1,3,5"               --latency-profiles "10,50,150,300"

  # ------------------------------------------------------------------
  # 9. Integration testing (test GKE cluster + Agones lifecycle)
  # ------------------------------------------------------------------
  - id: "integration-tests-agones"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["performance-testing"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/deploy-agones.sh               --environment "test"               --region "us-central1"               --image-prefix "${_ARTIFACT_REGISTRY}/gaming-platform"               --tag "${SHORT_SHA}"

  # ------------------------------------------------------------------
  # 10. Security scanning (containers + SAST)
  # ------------------------------------------------------------------
  - id: "trivy-scan"
    name: "${_ARTIFACT_REGISTRY}/game-tools/trivy:latest"
    waitFor: ["build-game-server", "build-matchmaking-service", "build-stats-aggregator"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        trivy image --exit-code 1 --severity HIGH,CRITICAL               "${_ARTIFACT_REGISTRY}/gaming-platform/game-server:${SHORT_SHA}"               "${_ARTIFACT_REGISTRY}/gaming-platform/matchmaking-service:${SHORT_SHA}"               "${_ARTIFACT_REGISTRY}/gaming-platform/stats-aggregator:${SHORT_SHA}"

  - id: "grype-scan"
    name: "${_ARTIFACT_REGISTRY}/game-tools/grype:latest"
    waitFor: ["build-game-server", "build-matchmaking-service", "build-stats-aggregator"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        grype               "${_ARTIFACT_REGISTRY}/gaming-platform/game-server:${SHORT_SHA}"               "${_ARTIFACT_REGISTRY}/gaming-platform/matchmaking-service:${SHORT_SHA}"               "${_ARTIFACT_REGISTRY}/gaming-platform/stats-aggregator:${SHORT_SHA}"               --fail-on High

  - id: "gosec-sast"
    name: "${_ARTIFACT_REGISTRY}/game-tools/gosec:latest"
    dir: "services"
    waitFor: ["unit-tests-go"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        gosec ./...

  - id: "semgrep-sast-node"
    name: "${_ARTIFACT_REGISTRY}/game-tools/semgrep:latest"
    dir: "services/matchmaking-service"
    waitFor: ["unit-tests-node"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        semgrep --config=auto .

  # ------------------------------------------------------------------
  # 11. DDoS protection tests (Cloud Armor)
  # ------------------------------------------------------------------
  - id: "ddos-protection-tests"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["trivy-scan", "grype-scan", "gosec-sast", "semgrep-sast-node"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/ddos-tests.sh               --environment "${_ENVIRONMENT}"

  # ------------------------------------------------------------------
  # 12. Chaos testing (latency, packet loss, pod failures)
  # ------------------------------------------------------------------
  - id: "chaos-testing"
    name: "${_ARTIFACT_REGISTRY}/game-tools/chaos-mesh:latest"
    waitFor: ["ddos-protection-tests"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/chaos-tests.sh               --gke-regions "${_GKE_REGIONS}"

  # ------------------------------------------------------------------
  # 13. Terraform apply (dev/staging/prod fan-out via workspaces)
  # ------------------------------------------------------------------
  - id: "terraform-apply"
    name: "${_ARTIFACT_REGISTRY}/game-tools/terraform:1.6"
    dir: "infra/terraform"
    waitFor: ["chaos-testing"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        terraform init -input=false
        terraform workspace select "${_ENVIRONMENT}" || terraform workspace new "${_ENVIRONMENT}"
        terraform apply -input=false -auto-approve               -var="environment=${_ENVIRONMENT}"               -var="gke_regions=${_GKE_REGIONS}"               -var="memorystore_tier=${_MEMORYSTORE_TIER}"               -var="firestore_mode=${_FIRESTORE_MODE}"               -var="player_count_target=${_PLAYER_COUNT_TARGET}"

  # ------------------------------------------------------------------
  # 14. Multi-region GKE deploy (parallel per region, Helm + Agones)
  # ------------------------------------------------------------------
  - id: "deploy-gke-us-central1"
    name: "${_ARTIFACT_REGISTRY}/game-tools/kubectl:1.28"
    waitFor: ["terraform-apply"]
    entrypoint: "bash"
    env:
      - "GKE_REGION=us-central1"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/deploy-gke-multiregion.sh               --environment "${_ENVIRONMENT}"               --region "${GKE_REGION}"               --image-prefix "${_ARTIFACT_REGISTRY}/gaming-platform"               --tag "${SHORT_SHA}"

  - id: "deploy-gke-us-east1"
    name: "${_ARTIFACT_REGISTRY}/game-tools/kubectl:1.28"
    waitFor: ["terraform-apply"]
    entrypoint: "bash"
    env:
      - "GKE_REGION=us-east1"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/deploy-gke-multiregion.sh               --environment "${_ENVIRONMENT}"               --region "${GKE_REGION}"               --image-prefix "${_ARTIFACT_REGISTRY}/gaming-platform"               --tag "${SHORT_SHA}"

  - id: "deploy-gke-us-west1"
    name: "${_ARTIFACT_REGISTRY}/game-tools/kubectl:1.28"
    waitFor: ["terraform-apply"]
    entrypoint: "bash"
    env:
      - "GKE_REGION=us-west1"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/deploy-gke-multiregion.sh               --environment "${_ENVIRONMENT}"               --region "${GKE_REGION}"               --image-prefix "${_ARTIFACT_REGISTRY}/gaming-platform"               --tag "${SHORT_SHA}"

  - id: "deploy-gke-europe-west1"
    name: "${_ARTIFACT_REGISTRY}/game-tools/kubectl:1.28"
    waitFor: ["terraform-apply"]
    entrypoint: "bash"
    env:
      - "GKE_REGION=europe-west1"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/deploy-gke-multiregion.sh               --environment "${_ENVIRONMENT}"               --region "${GKE_REGION}"               --image-prefix "${_ARTIFACT_REGISTRY}/gaming-platform"               --tag "${SHORT_SHA}"

  - id: "deploy-gke-europe-west4"
    name: "${_ARTIFACT_REGISTRY}/game-tools/kubectl:1.28"
    waitFor: ["terraform-apply"]
    entrypoint: "bash"
    env:
      - "GKE_REGION=europe-west4"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/deploy-gke-multiregion.sh               --environment "${_ENVIRONMENT}"               --region "${GKE_REGION}"               --image-prefix "${_ARTIFACT_REGISTRY}/gaming-platform"               --tag "${SHORT_SHA}"

  - id: "deploy-gke-asia-northeast1"
    name: "${_ARTIFACT_REGISTRY}/game-tools/kubectl:1.28"
    waitFor: ["terraform-apply"]
    entrypoint: "bash"
    env:
      - "GKE_REGION=asia-northeast1"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/deploy-gke-multiregion.sh               --environment "${_ENVIRONMENT}"               --region "${GKE_REGION}"               --image-prefix "${_ARTIFACT_REGISTRY}/gaming-platform"               --tag "${SHORT_SHA}"

  - id: "deploy-gke-asia-southeast1"
    name: "${_ARTIFACT_REGISTRY}/game-tools/kubectl:1.28"
    waitFor: ["terraform-apply"]
    entrypoint: "bash"
    env:
      - "GKE_REGION=asia-southeast1"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/deploy-gke-multiregion.sh               --environment "${_ENVIRONMENT}"               --region "${GKE_REGION}"               --image-prefix "${_ARTIFACT_REGISTRY}/gaming-platform"               --tag "${SHORT_SHA}"

  - id: "deploy-gke-australia-southeast1"
    name: "${_ARTIFACT_REGISTRY}/game-tools/kubectl:1.28"
    waitFor: ["terraform-apply"]
    entrypoint: "bash"
    env:
      - "GKE_REGION=australia-southeast1"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/deploy-gke-multiregion.sh               --environment "${_ENVIRONMENT}"               --region "${GKE_REGION}"               --image-prefix "${_ARTIFACT_REGISTRY}/gaming-platform"               --tag "${SHORT_SHA}"

  # ------------------------------------------------------------------
  # 15. Memorystore, Firestore, CDN, Global LB configuration
  # ------------------------------------------------------------------
  - id: "configure-memorystore"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor:
      - "deploy-gke-us-central1"
      - "deploy-gke-us-east1"
      - "deploy-gke-us-west1"
      - "deploy-gke-europe-west1"
      - "deploy-gke-europe-west4"
      - "deploy-gke-asia-northeast1"
      - "deploy-gke-asia-southeast1"
      - "deploy-gke-australia-southeast1"
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/configure-memorystore.sh               --environment "${_ENVIRONMENT}"               --gke-regions "${_GKE_REGIONS}"               --tier "${_MEMORYSTORE_TIER}"

  - id: "setup-firestore"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["configure-memorystore"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/setup-firestore.sh               --environment "${_ENVIRONMENT}"               --mode "${_FIRESTORE_MODE}"

  - id: "configure-cdn"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["upload-static-assets", "setup-firestore"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/configure-cdn.sh               --bucket "${_CDN_BUCKET}"               --asset-prefix "assets/${SHORT_SHA}/"

  - id: "setup-load-balancer"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["configure-cdn"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/setup-load-balancer.sh               --environment "${_ENVIRONMENT}"               --gke-regions "${_GKE_REGIONS}"

  # ------------------------------------------------------------------
  # 16. Canary deployment: 5% traffic to new version across all regions
  # ------------------------------------------------------------------
  - id: "canary-deployment"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["setup-load-balancer"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/canary-deployment.sh               --environment "${_ENVIRONMENT}"               --gke-regions "${_GKE_REGIONS}"               --weight "5"

  # ------------------------------------------------------------------
  # 17. Smoke tests + performance SLO validation + player migration
  # ------------------------------------------------------------------
  - id: "smoke-tests"
    name: "${_ARTIFACT_REGISTRY}/game-tools/postman:latest"
    waitFor: ["canary-deployment"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        newman run tests/postman/multiplayer-smoke.json               --env-var "baseUrl=https://game.${_ENVIRONMENT}.example.com"

  - id: "performance-validation"
    name: "${_ARTIFACT_REGISTRY}/game-tools/game-load-tester:latest"
    waitFor: ["smoke-tests"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        game-load-tester validate-slo               --p50 50               --p95 150               --p99 300               --tick-min 55               --matchmaking-p95 5

  - id: "player-migration-tests"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["performance-validation"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/test-player-migration.sh               --environment "${_ENVIRONMENT}"               --gke-regions "${_GKE_REGIONS}"

  # ------------------------------------------------------------------
  # 18. Blue-green promotion (100% to green, blue as hot standby)
  # ------------------------------------------------------------------
  - id: "promote-blue-green"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["player-migration-tests"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/promote-blue-green.sh               --environment "${_ENVIRONMENT}"               --gke-regions "${_GKE_REGIONS}"               --keep-blue-hot-standby "true"

  # ------------------------------------------------------------------
  # 19. Monitoring & alerting: dashboards, SLOs, Discord notifications
  # ------------------------------------------------------------------
  - id: "configure-monitoring"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["promote-blue-green"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/configure-monitoring.sh               --environment "${_ENVIRONMENT}"               --gke-regions "${_GKE_REGIONS}"

  # ------------------------------------------------------------------
  # 20. Compliance (COPPA, GDPR, data residency)
  # ------------------------------------------------------------------
  - id: "compliance-checks"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["configure-monitoring"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/validate-coppa.sh               --environment "${_ENVIRONMENT}"
        ./scripts/validate-gdpr.sh               --environment "${_ENVIRONMENT}"

  # ------------------------------------------------------------------
  # 21. Rollback preparation (scripts and metadata)
  # ------------------------------------------------------------------
  - id: "rollback-prepare"
    name: "gcr.io/cloud-builders/gcloud"
    waitFor: ["compliance-checks"]
    entrypoint: "bash"
    args:
      - "-c"
      - |
        set -euo pipefail
        ./scripts/rollback.sh               --environment "${_ENVIRONMENT}"               --gke-regions "${_GKE_REGIONS}"               --image-prefix "${_ARTIFACT_REGISTRY}/gaming-platform"               --tag "${SHORT_SHA}"

```