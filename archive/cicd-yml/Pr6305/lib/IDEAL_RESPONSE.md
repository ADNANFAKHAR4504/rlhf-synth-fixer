```yaml
# lib/ci-cd.yml
# GitLab CI/CD for GCP with Workload Identity Federation (no SA keys).
# Stages: validate → build → test → preview → security → compliance → staging_deploy
#         → performance → prod_approval → prod_deploy → monitoring → dr_test
# Notes:
# - All CI images are pulled from a private registry: $CI_REGISTRY/...
# - Application images are built for Artifact Registry: $GCP_REGISTRY/$GCP_PROJECT_ID/app-name:$CI_COMMIT_SHA
# - Any script longer than 5 lines is externalized to scripts/.

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "push"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_PIPELINE_SOURCE == "schedule"
    - when: always

stages:
  - validate
  - build
  - test
  - preview
  - security
  - compliance
  - staging_deploy
  - performance
  - prod_approval
  - prod_deploy
  - monitoring
  - dr_test

default:
  interruptible: true
  cache:
    key: "py-${CI_PROJECT_NAME}-${CI_COMMIT_REF_SLUG}"
    paths:
      - .cache/pip
      - .venv
      - $HOME/.cache/pypoetry
    policy: pull-push
  artifacts:
    expire_in: 1 week

# -------------------------
# Anchors: WIF + GKE helper
# -------------------------
.gcp_wif_setup: &gcp_wif_setup
  image: $CI_REGISTRY/cli/gcloud:latest
  before_script:
    - mkdir -p .gcp && echo "$CI_JOB_JWT_V2" > .gcp/token
    - gcloud iam workload-identity-pools create-cred-config --workload-identity-provider="$GCP_WIF_PROVIDER" --service-account="workload-identity@${GCP_PROJECT_ID}.iam.gserviceaccount.com" --credential-source-file=.gcp/token --output-file=.gcp/adc.json
    - export GOOGLE_APPLICATION_CREDENTIALS=.gcp/adc.json && gcloud auth login --cred-file="$GOOGLE_APPLICATION_CREDENTIALS"
    - gcloud config set project "$GCP_PROJECT_ID"
    - gcloud auth configure-docker "$GCP_REGISTRY"

.gke_setup: &gke_setup
  before_script:
    - gcloud container clusters get-credentials staging-gke-us-central1 --region us-central1 --project "$GCP_PROJECT_ID"

.python311: &python311
  image: $CI_REGISTRY/ci/python:3.11

# ---------------
# 1) VALIDATION
# ---------------
validate_python:
  stage: validate
  <<: *python311
  rules:
    - changes:
        - "src/**"
        - "tests/**"
        - "pyproject.toml"
        - "requirements*.txt"
  script:
    - python -m pip install -U pip wheel && pip install -r requirements.txt -r requirements-dev.txt
    - pylint src && flake8 src tests
    - mypy src
    - bandit -r src
    - pip-audit -r requirements.txt --strict
  artifacts:
    reports:
      junit: reports/junit/validate-python.xml
    paths:
      - reports/

# ----------
# 2) BUILD
# ----------
cloud_build_app:
  stage: build
  <<: *gcp_wif_setup
  variables:
    APP_NAME: "app-name"
    IMAGE_TAG: "$GCP_REGISTRY/$GCP_PROJECT_ID/${APP_NAME}:$CI_COMMIT_SHA"
  rules:
    - changes:
        - "Dockerfile"
        - "cloudbuild.yaml"
        - "src/**"
  script:
    - gcloud builds submit --config=cloudbuild.yaml --substitutions=_IMAGE_TAG="$IMAGE_TAG"
    - echo "$IMAGE_TAG" > image.txt
  artifacts:
    paths:
      - image.txt

# ---------
# 3) TEST
# ---------
pytest_coverage:
  stage: test
  <<: *python311
  needs: [cloud_build_app]
  script:
    - pip install -r requirements.txt -r requirements-dev.txt && pip install pytest pytest-cov
    - pytest -q --junitxml=reports/junit/pytest.xml --cov=src --cov-report=xml:coverage.xml
    - python -c "import sys,xml.etree.ElementTree as ET;print( ET.parse('coverage.xml').getroot().attrib['line-rate'] );"
    - coverage report --fail-under=85 || (echo 'Coverage <85%' && exit 1)
  artifacts:
    reports:
      junit: reports/junit/pytest.xml
      cobertura: coverage.xml
    paths:
      - coverage.xml
      - reports/

locust_load:
  stage: test
  image: $CI_REGISTRY/qa/locust:latest
  rules:
    - changes:
        - "load/**"
  script:
    - locust -f load/locustfile.py --headless -u 50 -r 5 -t 2m --csv=reports/locust
  artifacts:
    paths:
      - reports/locust*

testcontainers_integration:
  stage: test
  <<: *python311
  rules:
    - changes:
        - "tests/integration/**"
        - "docker-compose*.yml"
  script:
    - pip install -r requirements.txt -r requirements-dev.txt && pip install testcontainers
    - pytest tests/integration -q --junitxml=reports/junit/integration.xml
  artifacts:
    reports:
      junit: reports/junit/integration.xml

# --------------
# 4) PREVIEW
# --------------
preview_deploy:
  stage: preview
  <<: *gcp_wif_setup
  variables:
    PREVIEW_NAME: "preview-${CI_COMMIT_REF_SLUG}"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  script:
    - bash scripts/deploy-cloudrun.sh "$PREVIEW_NAME" "$GCP_PROJECT_ID" "$GCP_REGISTRY" "$CI_COMMIT_SHA"
  environment:
    name: "preview/$CI_COMMIT_REF_SLUG"
    url: "https://$CI_COMMIT_REF_SLUG.run.app"   # your deploy script should update the final URL
    auto_stop_in: 48 hours
    tier: development
  artifacts:
    reports:
      dotenv: preview.env
    paths:
      - preview.env

# ------------
# 5) SECURITY
# ------------
trivy_scan:
  stage: security
  <<: *gcp_wif_setup
  needs: [preview_deploy, cloud_build_app]
  image: $CI_REGISTRY/security/trivy:latest
  script:
    - export IMAGE="$(cat image.txt)" && trivy image --exit-code 1 --severity HIGH,CRITICAL --format json --output reports/trivy.json "$IMAGE"
    - cp reports/trivy.json reports/trivy-sast.json || true
  artifacts:
    reports:
      sast: reports/trivy-sast.json
    paths:
      - reports/trivy.json
  allow_failure: false

grype_scan:
  stage: security
  image: $CI_REGISTRY/security/grype:latest
  needs: [cloud_build_app]
  script:
    - export IMAGE="$(cat image.txt)" && grype "$IMAGE" -o json > reports/grype.json
  artifacts:
    paths:
      - reports/grype.json
  allow_failure: false

cosign_sign:
  stage: security
  <<: *gcp_wif_setup
  image: $CI_REGISTRY/security/cosign:latest
  needs: [cloud_build_app, trivy_scan]
  script:
    - export IMAGE="$(cat image.txt)" && cosign sign --yes "$IMAGE"
  allow_failure: false

zap_dast_preview:
  stage: security
  image: $CI_REGISTRY/security/zap:latest
  needs: [preview_deploy]
  script:
    - source preview.env && zap-baseline.py -t "$PREVIEW_URL" -r reports/zap.html -J reports/zap.json
  artifacts:
    paths:
      - reports/zap.html
      - reports/zap.json

checkov_tf:
  stage: security
  image: $CI_REGISTRY/compliance/checkov:latest
  rules:
    - changes:
        - "**/*.tf"
        - ".checkov.yml"
  script:
    - checkov -d . -o junitxml > reports/junit/checkov.xml
  artifacts:
    reports:
      junit: reports/junit/checkov.xml

# ---------------
# 6) COMPLIANCE
# ---------------
hipaa_validation:
  stage: compliance
  <<: *gcp_wif_setup
  script:
    - bash scripts/run-hipaa-validation.sh
  artifacts:
    paths:
      - reports/hipaa/

cai_audit:
  stage: compliance
  <<: *gcp_wif_setup
  script:
    - gcloud asset search-all-resources --scope="projects/$GCP_PROJECT_ID" --page-size=1000 --format=json > reports/cai-resources.json
  artifacts:
    paths:
      - reports/cai-resources.json

access_logging_validation:
  stage: compliance
  <<: *gcp_wif_setup
  script:
    - bash scripts/validate-encryption.sh access-logging
  artifacts:
    paths:
      - reports/access-logging.txt

encryption_at_rest_validation:
  stage: compliance
  <<: *gcp_wif_setup
  script:
    - bash scripts/validate-encryption.sh at-rest
  artifacts:
    paths:
      - reports/encryption-results.txt

# -----------------------
# 7) STAGING DEPLOYMENT
# -----------------------
staging_bluegreen_gke:
  stage: staging_deploy
  <<: [*gcp_wif_setup, *gke_setup]
  script:
    - bash scripts/deploy-gke-bluegreen.sh "staging-gke-us-central1"
  environment:
    name: staging
    url: https://staging.example.com
    tier: staging
  needs:
    - trivy_scan
    - grype_scan
    - cosign_sign
    - hipaa_validation

# ------------------
# 8) PERFORMANCE
# ------------------
lighthouse_ci:
  stage: performance
  image: $CI_REGISTRY/qa/lhci:latest
  needs: [staging_bluegreen_gke]
  script:
    - lhci autorun --upload.target=temporary-public-storage
  artifacts:
    paths:
      - .lighthouseci/

jmeter_api:
  stage: performance
  image: $CI_REGISTRY/qa/jmeter:latest
  script:
    - jmeter -n -t perf/jmeter/api-tests.jmx -l reports/jmeter-results.jtl -e -o reports/jmeter-html
  artifacts:
    paths:
      - reports/jmeter-results.jtl
      - reports/jmeter-html/

db_profile:
  stage: performance
  <<: *python311
  script:
    - pip install -r requirements.txt -r requirements-dev.txt && python perf/db_profile.py --out reports/db-profile.json
  artifacts:
    paths:
      - reports/db-profile.json

# --------------------
# 9) PROD APPROVAL
# --------------------
prod_compliance_approval:
  stage: prod_approval
  when: manual
  allow_failure: false
  environment:
    name: production
    action: prepare
    tier: production

# -------------------
# 10) PROD DEPLOY
# -------------------
prod_cloudrun_gradual:
  stage: prod_deploy
  <<: *gcp_wif_setup
  variables:
    REGIONS: "us-central1 us-east1 europe-west1"
  needs:
    - prod_compliance_approval
    - trivy_scan
    - grype_scan
    - cosign_sign
  script:
    - bash scripts/gradual-rollout.sh "$REGIONS" "$GCP_PROJECT_ID" "$(cat image.txt)"
  environment:
    name: production
    url: https://prod.example.com
    tier: production
  when: manual
  allow_failure: false

# -----------------
# 11) MONITORING
# -----------------
configure_monitoring:
  stage: monitoring
  <<: *gcp_wif_setup
  script:
    - bash scripts/configure-monitoring.sh "$GCP_PROJECT_ID"
  needs:
    - prod_cloudrun_gradual

# ---------------------------
# 12) DISASTER RECOVERY TEST
# ---------------------------
dr_restore_validation:
  stage: dr_test
  <<: *gcp_wif_setup
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
  script:
    - bash scripts/test-dr.sh "$GCP_PROJECT_ID"
  allow_failure: false

```