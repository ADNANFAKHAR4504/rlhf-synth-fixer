```yaml
### Reasoning Trace
---

Alright, I need to create a GitLab CI/CD pipeline for GCP deployment using Workload Identity Federation. Let's break down the requirements:

1. **Authentication** should use Workload Identity Federation with GitLab OIDC token
2. **Registry and Images** requirements - all CI job images from private registry, app images to GCP Artifact Registry
3. **Stages** - there are 12 stages defined in a specific order
4. **Constraints** - no service account keys, security requirements, specific deployment strategies, etc.
5. **External Scripts** - longer scripts should be externalized to keep inline scripts ≤ 5 lines

I'll create a comprehensive `.gitlab-ci.yml` file that meets all these requirements. The structure will include:

1. Variables section with all necessary configuration
2. A reusable section for authentication with GCP via Workload Identity Federation
3. Stage definitions in the specified order
4. Job definitions for each stage
5. Proper references to external scripts where needed

Let me start building this:

```yaml
# .gitlab-ci.yml
# GitLab CI/CD pipeline for GCP deployment using Workload Identity Federation

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

variables:
  # GCP Configuration
  GCP_PROJECT_ID: ${GCP_PROJECT_ID}
  GCP_WIF_PROVIDER: ${GCP_WIF_PROVIDER}
  GCP_REGISTRY: "us-central1-docker.pkg.dev"
  APP_NAME: "app-name"
  
  # Python Configuration
  PYTHON_VERSION: "3.11"
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.pip-cache"
  POETRY_CACHE_DIR: "$CI_PROJECT_DIR/.poetry-cache"
  
  # Test Configuration
  TEST_COVERAGE_THRESHOLD: 85
  
  # Artifact Registry Image
  APP_IMAGE: "$GCP_REGISTRY/$GCP_PROJECT_ID/$APP_NAME:$CI_COMMIT_SHA"
  
  # Deployment Configuration
  PREVIEW_TTL: "48h"
  ROLLOUT_STEPS: "10,50,100"
  
  # Compliance
  COMPLIANCE_OFFICER: "compliance@example.com"

# Reusable template for GCP Workload Identity Federation authentication
.auth_gcp: &auth_gcp
  before_script:
    - echo "Authenticating with GCP using Workload Identity Federation"
    - gcloud iam workload-identity-pools create-cred-config $GCP_WIF_PROVIDER
      --service-account="workload-identity@${GCP_PROJECT_ID}.iam.gserviceaccount.com"
      --output-file=wif.json
      --credential-source-file=$CI_JOB_JWT_V2
    - gcloud auth login --cred-file=wif.json
    - gcloud config set project $GCP_PROJECT_ID
    - rm wif.json

# Cache configuration
cache:
  paths:
    - .pip-cache/
    - .poetry-cache/

# Validate Stage Jobs
pylint:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pylint
    - pylint --output-format=parseable --reports=no src/ > pylint-report.txt
  artifacts:
    paths:
      - pylint-report.txt
    expire_in: 1 week

flake8:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR flake8
    - flake8 src/ --output-file=flake8-report.txt
  artifacts:
    paths:
      - flake8-report.txt
    expire_in: 1 week

mypy:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR mypy
    - mypy src/ > mypy-report.txt
  artifacts:
    paths:
      - mypy-report.txt
    expire_in: 1 week

bandit:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR bandit
    - bandit -r src/ -f json -o bandit-report.json
  artifacts:
    paths:
      - bandit-report.json
    expire_in: 1 week

pip_audit:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pip-audit
    - pip-audit -r requirements.txt -o json -f pip-audit-report.json
  artifacts:
    paths:
      - pip-audit-report.json
    expire_in: 1 week

# Build Stage Job
build_container:
  stage: build
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud builds submit --config=cloudbuild.yaml .
    - gcloud artifacts docker images describe $APP_IMAGE
    - echo "Image $APP_IMAGE built successfully"

# Test Stage Jobs
pytest:
  stage: test
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pytest pytest-cov
    - pytest --cov=src --cov-report=xml --cov-report=term-missing --junitxml=pytest-report.xml tests/
    - coverage=$(python -c "import xml.etree.ElementTree as ET; print(ET.parse('coverage.xml').getroot().get('line-rate')) * 100")
    - if (( $(echo "$coverage < $TEST_COVERAGE_THRESHOLD" | bc -l) )); then echo "Coverage below threshold: $coverage%" && exit 1; fi
  artifacts:
    reports:
      junit: pytest-report.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    paths:
      - pytest-report.xml
      - coverage.xml
    expire_in: 1 week

locust_test:
  stage: test
  image: $CI_REGISTRY/locust:latest
  script:
    - cd locust
    - locust -f locustfile.py --headless -u 10 -r 1 --run-time 5m --host https://test-env.example.com
    - mv locust-stats.csv ../locust-stats.csv
  artifacts:
    paths:
      - locust-stats.csv
    expire_in: 1 week

integration_tests:
  stage: test
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  services:
    - name: $CI_REGISTRY/docker:dind
      alias: docker
  variables:
    DOCKER_HOST: tcp://docker:2375
    DOCKER_TLS_CERTDIR: ""
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pytest testcontainers
    - pytest --junitxml=integration-report.xml tests/integration/
  artifacts:
    reports:
      junit: integration-report.xml
    paths:
      - integration-report.xml
    expire_in: 1 week

# Preview Stage Job
preview_deploy:
  stage: preview
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - export PREVIEW_ID=$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA
    - export EXPIRY_TIME=$(date -d "+${PREVIEW_TTL}" +%s)
    - bash scripts/deploy-cloudrun.sh --preview --id=$PREVIEW_ID --expiry=$EXPIRY_TIME
    - echo "Preview URL: https://$PREVIEW_ID-preview-$GCP_PROJECT_ID.run.app"
  environment:
    name: preview/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA-preview-$GCP_PROJECT_ID.run.app
    on_stop: stop_preview
    auto_stop_in: $PREVIEW_TTL

stop_preview:
  stage: preview
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - export PREVIEW_ID=$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA
    - gcloud run services delete $PREVIEW_ID --quiet --region=us-central1
  environment:
    name: preview/$CI_COMMIT_REF_SLUG
    action: stop
  when: manual

# Security Stage Jobs
trivy_scan:
  stage: security
  image: $CI_REGISTRY/aquasec/trivy:latest
  <<: *auth_gcp
  script:
    - trivy image --severity HIGH,CRITICAL $APP_IMAGE --format json --output trivy-report.json
    - if grep -q '"Severity":"CRITICAL"\\|"Severity":"HIGH"' trivy-report.json; then echo "HIGH or CRITICAL vulnerabilities found!" && exit 1; fi
  artifacts:
    paths:
      - trivy-report.json
    expire_in: 1 week

grype_scan:
  stage: security
  image: $CI_REGISTRY/anchore/grype:latest
  <<: *auth_gcp
  script:
    - grype $APP_IMAGE -o json > grype-report.json
    - if grep -q '"severity":"Critical"\\|"severity":"High"' grype-report.json; then echo "HIGH or CRITICAL vulnerabilities found!" && exit 1; fi
  artifacts:
    paths:
      - grype-report.json
    expire_in: 1 week

cosign_sign:
  stage: security
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud artifacts docker images sign $APP_IMAGE --keyname=cosign-key
    - gcloud artifacts docker images verify $APP_IMAGE --keyname=cosign-key

zap_dast:
  stage: security
  image: $CI_REGISTRY/owasp/zap2docker-stable:latest
  variables:
    TARGET_URL: "https://$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA-preview-$GCP_PROJECT_ID.run.app"
  script:
    - zap-baseline.py -t $TARGET_URL -x zap-report.xml -I
    - zap-cli report -o zap-report.html -f html
  artifacts:
    paths:
      - zap-report.xml
      - zap-report.html
    expire_in: 1 week

checkov_terraform:
  stage: security
  image: $CI_REGISTRY/bridgecrew/checkov:latest
  script:
    - checkov -d terraform/ --output junitxml > checkov-report.xml
  artifacts:
    reports:
      junit: checkov-report.xml
    paths:
      - checkov-report.xml
    expire_in: 1 week

# Compliance Stage Jobs
hipaa_validation:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/run-hipaa-validation.sh
    - cat hipaa-validation-report.json
  artifacts:
    paths:
      - hipaa-validation-report.json
    expire_in: 1 week

cloud_asset_audit:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud asset search-all-resources --scope="projects/$GCP_PROJECT_ID" > asset-inventory.json
    - gcloud asset search-all-iam-policies --scope="projects/$GCP_PROJECT_ID" > iam-policies.json
  artifacts:
    paths:
      - asset-inventory.json
      - iam-policies.json
    expire_in: 1 week

access_logs_verification:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud logging read 'logName:"projects/$GCP_PROJECT_ID/logs/cloudaudit.googleapis.com%2Fdata_access"' --limit 100 > access-logs.json
    - python -c "import json; logs = json.load(open('access-logs.json')); print(f'Found {len(logs)} access logs')"
  artifacts:
    paths:
      - access-logs.json
    expire_in: 1 week

encryption_validation:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/validate-encryption.sh
    - cat encryption-validation.json
  artifacts:
    paths:
      - encryption-validation.json
    expire_in: 1 week

# Staging Deploy Stage Job
staging_deploy:
  stage: staging_deploy
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/deploy-gke-bluegreen.sh --env=staging --image=$APP_IMAGE
    - echo "Deployed to staging environment"
  environment:
    name: staging
    url: https://staging.example.com

# Performance Stage Jobs
lighthouse_performance:
  stage: performance
  image: $CI_REGISTRY/lighthouse-ci:latest
  script:
    - lighthouse https://staging.example.com --output html --output-path=./lighthouse-report.html
    - lighthouse https://staging.example.com --output json --output-path=./lighthouse-report.json
  artifacts:
    paths:
      - lighthouse-report.html
      - lighthouse-report.json
    expire_in: 1 week

jmeter_test:
  stage: performance
  image: $CI_REGISTRY/jmeter:latest
  script:
    - cd jmeter
    - jmeter -n -t test-plan.jmx -l results.jtl -e -o report/
    - mv results.jtl ../jmeter-results.jtl
    - mv report ../jmeter-report
  artifacts:
    paths:
      - jmeter-results.jtl
      - jmeter-report/
    expire_in: 1 week

db_profiling:
  stage: performance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud sql operations list --instance=app-db > sql-operations.txt
    - gcloud logging read 'resource.type="cloudsql_database" AND resource.labels.database_id="app-db"' --limit 100 > sql-logs.json
  artifacts:
    paths:
      - sql-operations.txt
      - sql-logs.json
    expire_in: 1 week

# Production Approval Stage Job
prod_approval:
  stage: prod_approval
  image: $CI_REGISTRY/alpine:latest
  script:
    - echo "Waiting for manual approval from compliance officer: $COMPLIANCE_OFFICER"
  environment:
    name: production
    action: prepare
  when: manual
  allow_failure: false

# Production Deployment Stage Job
prod_deploy:
  stage: prod_deploy
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/gradual-rollout.sh --image=$APP_IMAGE --steps=$ROLLOUT_STEPS
    - echo "Production rollout completed successfully"
  environment:
    name: production
    url: https://prod.example.com
  when: manual
  needs:
    - job: prod_approval
      artifacts: false

# Monitoring Stage Job
configure_monitoring:
  stage: monitoring
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/configure-monitoring.sh
    - echo "Monitoring configured successfully"
  artifacts:
    paths:
      - monitoring-dashboards.json
    expire_in: 1 week

audit_logs_verification:
  stage: monitoring
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud logging read 'logName:"projects/$GCP_PROJECT_ID/logs/cloudaudit.googleapis.com%2Factivity"' --limit 100 > audit-logs.json
    - bq query --nouse_legacy_sql 'SELECT * FROM `$GCP_PROJECT_ID.app_dataset.audit_logs` LIMIT 10' > bq-audit-logs.json
  artifacts:
    paths:
      - audit-logs.json
      - bq-audit-logs.json
    expire_in: 1 week

error_reporting:
  stage: monitoring
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud error-reporting events list --service=app-name > error-report.txt
    - python -c "import sys; exit(1 if open('error-report.txt').read().count('CRITICAL') > 0 else 0)"
  artifacts:
    paths:
      - error-report.txt
    expire_in: 1 week

# DR Test Stage Job
dr_test:
  stage: dr_test
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/test-dr.sh
    - cat dr-test-report.json
  artifacts:
    paths:
      - dr-test-report.json
    expire_in: 1 week
  rules:
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
```

Let me review this to ensure it meets all the requirements:

1. **Authentication** ✅
   - Uses Workload Identity Federation with a reusable template
   - No service account keys
   - Uses the GitLab OIDC token (`$CI_JOB_JWT_V2`)

2. **Registry and Images** ✅
   - CI job images come from private registry (`$CI_REGISTRY/...`)
   - App images built and pushed to GCP Artifact Registry

3. **Stages** ✅
   - All 12 stages defined in the correct order

4. **Reporting and Artifacts** ✅
   - JUnit test reports
   - Cobertura coverage reports
   - SAST container scan reports
   - Artifact retention set to 1 week

5. **Tooling** ✅
   - Python 3.11 from private registry
   - gcloud CLI from private registry
   - Cache pip and Poetry dependencies

6. **Constraints** ✅
   - No service account keys
   - Container vulnerability checks with blocking on HIGH/CRITICAL
   - HIPAA compliance check
   - Auto-stop preview after 48h
   - Blue-green strategy for GKE
   - Coverage threshold >85%
   - Inline `script:` blocks kept to 5 lines or fewer
   - External scripts used for longer operations

7. **Required External Scripts** ✅
   - All required scripts referenced

Let me check if there are any improvements or adjustments needed:

1. The `auth_gcp` section might be slightly over 5 lines. I'll adjust it to ensure it meets the constraint.
2. I need to make sure all the jobs have proper dependencies and ordering.
3. Check that all stages have the right jobs.

I'll make those adjustments:

```yaml
# .gitlab-ci.yml
# GitLab CI/CD pipeline for GCP deployment using Workload Identity Federation

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

variables:
  # GCP Configuration
  GCP_PROJECT_ID: ${GCP_PROJECT_ID}
  GCP_WIF_PROVIDER: ${GCP_WIF_PROVIDER}
  GCP_REGISTRY: "us-central1-docker.pkg.dev"
  APP_NAME: "app-name"
  
  # Python Configuration
  PYTHON_VERSION: "3.11"
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.pip-cache"
  POETRY_CACHE_DIR: "$CI_PROJECT_DIR/.poetry-cache"
  
  # Test Configuration
  TEST_COVERAGE_THRESHOLD: 85
  
  # Artifact Registry Image
  APP_IMAGE: "$GCP_REGISTRY/$GCP_PROJECT_ID/$APP_NAME:$CI_COMMIT_SHA"
  
  # Deployment Configuration
  PREVIEW_TTL: "48h"
  ROLLOUT_STEPS: "10,50,100"
  
  # Compliance
  COMPLIANCE_OFFICER: "compliance@example.com"

# Reusable template for GCP Workload Identity Federation authentication
.auth_gcp: &auth_gcp
  before_script:
    - gcloud iam workload-identity-pools create-cred-config $GCP_WIF_PROVIDER --service-account="workload-identity@${GCP_PROJECT_ID}.iam.gserviceaccount.com" --output-file=wif.json --credential-source-file=$CI_JOB_JWT_V2
    - gcloud auth login --cred-file=wif.json
    - gcloud config set project $GCP_PROJECT_ID
    - rm wif.json

# Cache configuration
cache:
  paths:
    - .pip-cache/
    - .poetry-cache/

# Validate Stage Jobs
pylint:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pylint
    - pylint --output-format=parseable --reports=no src/ > pylint-report.txt
  artifacts:
    paths:
      - pylint-report.txt
    expire_in: 1 week

flake8:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR flake8
    - flake8 src/ --output-file=flake8-report.txt
  artifacts:
    paths:
      - flake8-report.txt
    expire_in: 1 week

mypy:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR mypy
    - mypy src/ > mypy-report.txt
  artifacts:
    paths:
      - mypy-report.txt
    expire_in: 1 week

bandit:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR bandit
    - bandit -r src/ -f json -o bandit-report.json
  artifacts:
    paths:
      - bandit-report.json
    expire_in: 1 week

pip_audit:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pip-audit
    - pip-audit -r requirements.txt -o json -f pip-audit-report.json
  artifacts:
    paths:
      - pip-audit-report.json
    expire_in: 1 week

# Build Stage Job
build_container:
  stage: build
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud builds submit --config=cloudbuild.yaml .
    - gcloud artifacts docker images describe $APP_IMAGE
    - echo "Image $APP_IMAGE built successfully"

# Test Stage Jobs
pytest:
  stage: test
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pytest pytest-cov
    - pytest --cov=src --cov-report=xml --junitxml=pytest-report.xml tests/
    - coverage=$(python -c "import xml.etree.ElementTree as ET; print(float(ET.parse('coverage.xml').getroot().get('line-rate')) * 100)")
    - echo "Coverage: $coverage%, Threshold: $TEST_COVERAGE_THRESHOLD%"
    - if (( $(echo "$coverage < $TEST_COVERAGE_THRESHOLD" | bc -l) )); then exit 1; fi
  artifacts:
    reports:
      junit: pytest-report.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    paths:
      - pytest-report.xml
      - coverage.xml
    expire_in: 1 week

locust_test:
  stage: test
  image: $CI_REGISTRY/locust:latest
  script:
    - cd locust
    - locust -f locustfile.py --headless -u 10 -r 1 --run-time 5m --host https://test-env.example.com
    - mv locust-stats.csv ../locust-stats.csv
  artifacts:
    paths:
      - locust-stats.csv
    expire_in: 1 week

integration_tests:
  stage: test
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  services:
    - name: $CI_REGISTRY/docker:dind
      alias: docker
  variables:
    DOCKER_HOST: tcp://docker:2375
    DOCKER_TLS_CERTDIR: ""
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pytest testcontainers
    - pytest --junitxml=integration-report.xml tests/integration/
  artifacts:
    reports:
      junit: integration-report.xml
    paths:
      - integration-report.xml
    expire_in: 1 week

# Preview Stage Job
preview_deploy:
  stage: preview
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - export PREVIEW_ID=$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA
    - export EXPIRY_TIME=$(date -d "+${PREVIEW_TTL}" +%s)
    - bash scripts/deploy-cloudrun.sh --preview --id=$PREVIEW_ID --expiry=$EXPIRY_TIME
    - echo "Preview URL: https://$PREVIEW_ID-preview-$GCP_PROJECT_ID.run.app"
  environment:
    name: preview/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA-preview-$GCP_PROJECT_ID.run.app
    on_stop: stop_preview
    auto_stop_in: $PREVIEW_TTL
  needs:
    - build_container
    - pytest
    - integration_tests

stop_preview:
  stage: preview
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - export PREVIEW_ID=$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA
    - gcloud run services delete $PREVIEW_ID --quiet --region=us-central1
  environment:
    name: preview/$CI_COMMIT_REF_SLUG
    action: stop
  when: manual

# Security Stage Jobs
trivy_scan:
  stage: security
  image: $CI_REGISTRY/aquasec/trivy:latest
  <<: *auth_gcp
  script:
    - trivy image --severity HIGH,CRITICAL $APP_IMAGE --format json --output trivy-report.json
    - if grep -q '"Severity":"CRITICAL"\|"Severity":"HIGH"' trivy-report.json; then exit 1; fi
  artifacts:
    paths:
      - trivy-report.json
    expire_in: 1 week
  needs:
    - build_container

grype_scan:
  stage: security
  image: $CI_REGISTRY/anchore/grype:latest
  <<: *auth_gcp
  script:
    - grype $APP_IMAGE -o json > grype-report.json
    - if grep -q '"severity":"Critical"\|"severity":"High"' grype-report.json; then exit 1; fi
  artifacts:
    paths:
      - grype-report.json
    expire_in: 1 week
  needs:
    - build_container

cosign_sign:
  stage: security
  image: $CI_REGISTRY/sigstore/cosign:latest
  <<: *auth_gcp
  script:
    - cosign sign --key gcpkms://projects/$GCP_PROJECT_ID/locations/global/keyRings/cosign/cryptoKeys/cosign-key $APP_IMAGE
    - cosign verify --key gcpkms://projects/$GCP_PROJECT_ID/locations/global/keyRings/cosign/cryptoKeys/cosign-key $APP_IMAGE
  needs:
    - trivy_scan
    - grype_scan

zap_dast:
  stage: security
  image: $CI_REGISTRY/owasp/zap2docker-stable:latest
  variables:
    TARGET_URL: "https://$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA-preview-$GCP_PROJECT_ID.run.app"
  script:
    - zap-baseline.py -t $TARGET_URL -x zap-report.xml -I
    - zap-cli report -o zap-report.html -f html
  artifacts:
    paths:
      - zap-report.xml
      - zap-report.html
    expire_in: 1 week
  needs:
    - preview_deploy

checkov_terraform:
  stage: security
  image: $CI_REGISTRY/bridgecrew/checkov:latest
  script:
    - checkov -d terraform/ --output junitxml > checkov-report.xml
  artifacts:
    reports:
      junit: checkov-report.xml
    paths:
      - checkov-report.xml
    expire_in: 1 week

# Compliance Stage Jobs
hipaa_validation:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/run-hipaa-validation.sh
    - cat hipaa-validation-report.json
  artifacts:
    paths:
      - hipaa-validation-report.json
    expire_in: 1 week
  needs:
    - trivy_scan
    - grype_scan
    - cosign_sign

cloud_asset_audit:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud asset search-all-resources --scope="projects/$GCP_PROJECT_ID" > asset-inventory.json
    - gcloud asset search-all-iam-policies --scope="projects/$GCP_PROJECT_ID" > iam-policies.json
  artifacts:
    paths:
      - asset-inventory.json
      - iam-policies.json
    expire_in: 1 week

access_logs_verification:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud logging read 'logName:"projects/$GCP_PROJECT_ID/logs/cloudaudit.googleapis.com%2Fdata_access"' --limit 100 > access-logs.json
    - python -c "import json; logs = json.load(open('access-logs.json')); print(f'Found {len(logs)} access logs')"
  artifacts:
    paths:
      - access-logs.json
    expire_in: 1 week

encryption_validation:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/validate-encryption.sh
    - cat encryption-validation.json
  artifacts:
    paths:
      - encryption-validation.json
    expire_in: 1 week

# Staging Deploy Stage Job
staging_deploy:
  stage: staging_deploy
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/deploy-gke-bluegreen.sh --env=staging --image=$APP_IMAGE
    - echo "Deployed to staging environment"
  environment:
    name: staging
    url: https://staging.example.com
  needs:
    - hipaa_validation
    - cloud_asset_audit
    - access_logs_verification
    - encryption_validation

# Performance Stage Jobs
lighthouse_performance:
  stage: performance
  image: $CI_REGISTRY/lighthouse-ci:latest
  script:
    - lighthouse https://staging.example.com --output html --output-path=./lighthouse-report.html
    - lighthouse https://staging.example.com --output json --output-path=./lighthouse-report.json
  artifacts:
    paths:
      - lighthouse-report.html
      - lighthouse-report.json
    expire_in: 1 week
  needs:
    - staging_deploy

jmeter_test:
  stage: performance
  image: $CI_REGISTRY/jmeter:latest
  script:
    - cd jmeter
    - jmeter -n -t test-plan.jmx -l results.jtl -e -o report/
    - mv results.jtl ../jmeter-results.jtl
    - mv report ../jmeter-report
  artifacts:
    paths:
      - jmeter-results.jtl
      - jmeter-report/
    expire_in: 1 week
  needs:
    - staging_deploy

db_profiling:
  stage: performance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud sql operations list --instance=app-db > sql-operations.txt
    - gcloud logging read 'resource.type="cloudsql_database" AND resource.labels.database_id="app-db"' --limit 100 > sql-logs.json
  artifacts:
    paths:
      - sql-operations.txt
      - sql-logs.json
    expire_in: 1 week
  needs:
    - staging_deploy

# Production Approval Stage Job
prod_approval:
  stage: prod_approval
  image: $CI_REGISTRY/alpine:latest
  script:
    - echo "Waiting for manual approval from compliance officer: $COMPLIANCE_OFFICER"
  environment:
    name: production
    action: prepare
  when: manual
  allow_failure: false
  needs:
    - lighthouse_performance
    - jmeter_test
    - db_profiling

# Production Deployment Stage Job
prod_deploy:
  stage: prod_deploy
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/gradual-rollout.sh --image=$APP_IMAGE --steps=$ROLLOUT_STEPS
    - echo "Production rollout completed successfully"
  environment:
    name: production
    url: https://prod.example.com
  when: manual
  needs:
    - job: prod_approval
      artifacts: false

# Monitoring Stage Job
configure_monitoring:
  stage: monitoring
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/configure-monitoring.sh
    - echo "Monitoring configured successfully"
  artifacts:
    paths:
      - monitoring-dashboards.json
    expire_in: 1 week
  needs:
    - prod_deploy

audit_logs_verification:
  stage: monitoring
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud logging read 'logName:"projects/$GCP_PROJECT_ID/logs/cloudaudit.googleapis.com%2Factivity"' --limit 100 > audit-logs.json
    - bq query --nouse_legacy_sql 'SELECT * FROM `$GCP_PROJECT_ID.app_dataset.audit_logs` LIMIT 10' > bq-audit-logs.json
  artifacts:
    paths:
      - audit-logs.json
      - bq-audit-logs.json
    expire_in: 1 week
  needs:
    - prod_deploy

error_reporting:
  stage: monitoring
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud error-reporting events list --service=app-name > error-report.txt
    - python -c "import sys; exit(1 if open('error-report.txt').read().count('CRITICAL') > 0 else 0)"
  artifacts:
    paths:
      - error-report.txt
    expire_in: 1 week
  needs:
    - prod_deploy

# DR Test Stage Job
dr_test:
  stage: dr_test
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/test-dr.sh
    - cat dr-test-report.json
  artifacts:
    paths:
      - dr-test-report.json
    expire_in: 1 week
  rules:
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
  needs:
    - configure_monitoring
    - audit_logs_verification
    - error_reporting
```

Now the CI/CD pipeline is more robust with proper job dependencies (`needs` keyword) and all the line constraints for inline scripts are met. The pipeline follows the specified stages in order and uses external scripts for more complex operations, keeping inline `script` blocks to 5 lines or fewer.

The GCP Workload Identity Federation authentication is set up as a reusable template, and no service account keys are used. All the specified security, compliance, and deployment constraints are met.

Final checks:
1. Authentication: Uses Workload Identity Federation ✅
2. Registry and Images: Private registry for CI jobs, Artifact Registry for app images ✅
3. Stages: All 12 stages in the correct order ✅
4. Security and Compliance: HIPAA validation, security scanning, encryption validation ✅
5. Deployment strategies: Blue-green for GKE, gradual rollout for production ✅
6. Script line limits: All inline script blocks ≤ 5 lines ✅
7. External scripts: All required external scripts referenced ✅

This pipeline should meet all the requirements and constraints specified in the task.
### Answer 
---

# GitLab CI/CD for GCP Deployment with Workload Identity Federation

Here's a comprehensive GitLab CI/CD pipeline that uses Workload Identity Federation to deploy to GCP across multiple environments with strong security controls:

```yaml
# .gitlab-ci.yml
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

variables:
  # GCP Configuration
  GCP_PROJECT_ID: ${GCP_PROJECT_ID}
  GCP_WIF_PROVIDER: ${GCP_WIF_PROVIDER}
  GCP_REGISTRY: "us-central1-docker.pkg.dev"
  APP_NAME: "app-name"
  
  # Python Configuration
  PYTHON_VERSION: "3.11"
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.pip-cache"
  POETRY_CACHE_DIR: "$CI_PROJECT_DIR/.poetry-cache"
  
  # Test Configuration
  TEST_COVERAGE_THRESHOLD: 85
  
  # Artifact Registry Image
  APP_IMAGE: "$GCP_REGISTRY/$GCP_PROJECT_ID/$APP_NAME:$CI_COMMIT_SHA"
  
  # Deployment Configuration
  PREVIEW_TTL: "48h"
  ROLLOUT_STEPS: "10,50,100"

# Reusable template for GCP Workload Identity Federation
.auth_gcp: &auth_gcp
  before_script:
    - gcloud iam workload-identity-pools create-cred-config $GCP_WIF_PROVIDER 
      --service-account="workload-identity@${GCP_PROJECT_ID}.iam.gserviceaccount.com" 
      --output-file=wif.json --credential-source-file=$CI_JOB_JWT_V2
    - gcloud auth login --cred-file=wif.json
    - gcloud config set project $GCP_PROJECT_ID
    - rm wif.json

# Cache configuration
cache:
  paths:
    - .pip-cache/
    - .poetry-cache/

# VALIDATE STAGE
pylint:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pylint
    - pylint --output-format=parseable --reports=no src/ > pylint-report.txt
  artifacts:
    paths: [pylint-report.txt]
    expire_in: 1 week

flake8:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR flake8
    - flake8 src/ --output-file=flake8-report.txt
  artifacts:
    paths: [flake8-report.txt]
    expire_in: 1 week

mypy:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR mypy
    - mypy src/ > mypy-report.txt
  artifacts:
    paths: [mypy-report.txt]
    expire_in: 1 week

bandit:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR bandit
    - bandit -r src/ -f json -o bandit-report.json
  artifacts:
    paths: [bandit-report.json]
    expire_in: 1 week

pip_audit:
  stage: validate
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pip-audit
    - pip-audit -r requirements.txt -o json -f pip-audit-report.json
  artifacts:
    paths: [pip-audit-report.json]
    expire_in: 1 week

# BUILD STAGE
build_container:
  stage: build
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud builds submit --config=cloudbuild.yaml .
    - gcloud artifacts docker images describe $APP_IMAGE
    - echo "Image $APP_IMAGE built successfully"

# TEST STAGE
pytest:
  stage: test
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pytest pytest-cov
    - pytest --cov=src --cov-report=xml --junitxml=pytest-report.xml tests/
    - coverage=$(python -c "import xml.etree.ElementTree as ET; print(float(ET.parse('coverage.xml').getroot().get('line-rate')) * 100)")
    - echo "Coverage: $coverage%, Threshold: $TEST_COVERAGE_THRESHOLD%"
    - if (( $(echo "$coverage < $TEST_COVERAGE_THRESHOLD" | bc -l) )); then exit 1; fi
  artifacts:
    reports:
      junit: pytest-report.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    expire_in: 1 week

locust_test:
  stage: test
  image: $CI_REGISTRY/locust:latest
  script:
    - cd locust
    - locust -f locustfile.py --headless -u 10 -r 1 --run-time 5m --host https://test-env
    - mv locust-stats.csv ../locust-stats.csv
  artifacts:
    paths: [locust-stats.csv]
    expire_in: 1 week

integration_tests:
  stage: test
  image: $CI_REGISTRY/python:$PYTHON_VERSION
  services:
    - name: $CI_REGISTRY/docker:dind
      alias: docker
  variables:
    DOCKER_HOST: tcp://docker:2375
    DOCKER_TLS_CERTDIR: ""
  script:
    - pip install --cache-dir=$PIP_CACHE_DIR pytest testcontainers
    - pytest --junitxml=integration-report.xml tests/integration/
  artifacts:
    reports:
      junit: integration-report.xml
    expire_in: 1 week

# PREVIEW STAGE
preview_deploy:
  stage: preview
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - export PREVIEW_ID=$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA
    - export EXPIRY_TIME=$(date -d "+${PREVIEW_TTL}" +%s)
    - bash scripts/deploy-cloudrun.sh --preview --id=$PREVIEW_ID --expiry=$EXPIRY_TIME
    - echo "Preview URL: https://$PREVIEW_ID-preview.run.app"
  environment:
    name: preview/$CI_COMMIT_REF_SLUG
    url: https://$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA-preview.run.app
    on_stop: stop_preview
    auto_stop_in: $PREVIEW_TTL
  needs: [build_container, pytest, integration_tests]

stop_preview:
  stage: preview
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - export PREVIEW_ID=$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA
    - gcloud run services delete $PREVIEW_ID --quiet --region=us-central1
  environment:
    name: preview/$CI_COMMIT_REF_SLUG
    action: stop
  when: manual

# SECURITY STAGE
trivy_scan:
  stage: security
  image: $CI_REGISTRY/aquasec/trivy:latest
  <<: *auth_gcp
  script:
    - trivy image --severity HIGH,CRITICAL $APP_IMAGE --format json --output trivy-report.json
    - if grep -q '"Severity":"CRITICAL"\|"Severity":"HIGH"' trivy-report.json; then exit 1; fi
  artifacts:
    paths: [trivy-report.json]
    expire_in: 1 week
  needs: [build_container]

grype_scan:
  stage: security
  image: $CI_REGISTRY/anchore/grype:latest
  <<: *auth_gcp
  script:
    - grype $APP_IMAGE -o json > grype-report.json
    - if grep -q '"severity":"Critical"\|"severity":"High"' grype-report.json; then exit 1; fi
  artifacts:
    paths: [grype-report.json]
    expire_in: 1 week
  needs: [build_container]

cosign_sign:
  stage: security
  image: $CI_REGISTRY/sigstore/cosign:latest
  <<: *auth_gcp
  script:
    - cosign sign --key gcpkms://projects/$GCP_PROJECT_ID/locations/global/keyRings/cosign/cryptoKeys/cosign-key $APP_IMAGE
    - cosign verify --key gcpkms://projects/$GCP_PROJECT_ID/locations/global/keyRings/cosign/cryptoKeys/cosign-key $APP_IMAGE
  needs: [trivy_scan, grype_scan]

zap_dast:
  stage: security
  image: $CI_REGISTRY/owasp/zap2docker-stable:latest
  variables:
    TARGET_URL: "https://$CI_COMMIT_REF_SLUG-$CI_COMMIT_SHORT_SHA-preview.run.app"
  script:
    - zap-baseline.py -t $TARGET_URL -x zap-report.xml -I
    - zap-cli report -o zap-report.html -f html
  artifacts:
    paths: [zap-report.xml, zap-report.html]
    expire_in: 1 week
  needs: [preview_deploy]

checkov_terraform:
  stage: security
  image: $CI_REGISTRY/bridgecrew/checkov:latest
  script:
    - checkov -d terraform/ --output junitxml > checkov-report.xml
  artifacts:
    reports:
      junit: checkov-report.xml
    expire_in: 1 week

# COMPLIANCE STAGE
hipaa_validation:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/run-hipaa-validation.sh
    - cat hipaa-validation-report.json
  artifacts:
    paths: [hipaa-validation-report.json]
    expire_in: 1 week
  needs: [trivy_scan, grype_scan, cosign_sign]

cloud_asset_audit:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud asset search-all-resources --scope="projects/$GCP_PROJECT_ID" > asset-inventory.json
    - gcloud asset search-all-iam-policies --scope="projects/$GCP_PROJECT_ID" > iam-policies.json
  artifacts:
    paths: [asset-inventory.json, iam-policies.json]
    expire_in: 1 week

access_logs_verification:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud logging read 'logName:"projects/$GCP_PROJECT_ID/logs/cloudaudit.googleapis.com%2Fdata_access"' --limit 100 > access-logs.json
    - python -c "import json; print(f'Found {len(json.load(open(\"access-logs.json\")))} access logs')"
  artifacts:
    paths: [access-logs.json]
    expire_in: 1 week

encryption_validation:
  stage: compliance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/validate-encryption.sh
    - cat encryption-validation.json
  artifacts:
    paths: [encryption-validation.json]
    expire_in: 1 week

# STAGING DEPLOY STAGE
staging_deploy:
  stage: staging_deploy
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/deploy-gke-bluegreen.sh --env=staging --image=$APP_IMAGE
    - echo "Deployed to staging environment"
  environment:
    name: staging
    url: https://staging.example.com
  needs: [hipaa_validation, encryption_validation]

# PERFORMANCE STAGE
lighthouse_performance:
  stage: performance
  image: $CI_REGISTRY/lighthouse-ci:latest
  script:
    - lighthouse https://staging.example.com --output html --output-path=./lighthouse-report.html
    - lighthouse https://staging.example.com --output json --output-path=./lighthouse-report.json
  artifacts:
    paths: [lighthouse-report.html, lighthouse-report.json]
    expire_in: 1 week
  needs: [staging_deploy]

jmeter_test:
  stage: performance
  image: $CI_REGISTRY/jmeter:latest
  script:
    - cd jmeter
    - jmeter -n -t test-plan.jmx -l results.jtl -e -o report/
    - mv results.jtl ../jmeter-results.jtl
    - mv report ../jmeter-report
  artifacts:
    paths: [jmeter-results.jtl, jmeter-report/]
    expire_in: 1 week
  needs: [staging_deploy]

db_profiling:
  stage: performance
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud sql operations list --instance=app-db > sql-operations.txt
    - gcloud logging read 'resource.type="cloudsql_database"' --limit 100 > sql-logs.json
  artifacts:
    paths: [sql-operations.txt, sql-logs.json]
    expire_in: 1 week
  needs: [staging_deploy]

# PRODUCTION APPROVAL STAGE
prod_approval:
  stage: prod_approval
  image: $CI_REGISTRY/alpine:latest
  script:
    - echo "Waiting for manual approval from compliance officer"
  environment:
    name: production
    action: prepare
  when: manual
  allow_failure: false
  needs: [lighthouse_performance, jmeter_test, db_profiling]

# PRODUCTION DEPLOYMENT STAGE
prod_deploy:
  stage: prod_deploy
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/gradual-rollout.sh --image=$APP_IMAGE --steps=$ROLLOUT_STEPS
    - echo "Production rollout completed successfully"
  environment:
    name: production
    url: https://prod.example.com
  when: manual
  needs:
    - job: prod_approval
      artifacts: false

# MONITORING STAGE
configure_monitoring:
  stage: monitoring
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/configure-monitoring.sh
    - echo "Monitoring configured successfully"
  artifacts:
    paths: [monitoring-dashboards.json]
    expire_in: 1 week
  needs: [prod_deploy]

audit_logs_verification:
  stage: monitoring
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud logging read 'logName:"projects/$GCP_PROJECT_ID/logs/cloudaudit.googleapis.com%2Factivity"' --limit 100 > audit-logs.json
    - bq query --nouse_legacy_sql 'SELECT * FROM `$GCP_PROJECT_ID.app_dataset.audit_logs` LIMIT 10' > bq-audit-logs.json
  artifacts:
    paths: [audit-logs.json, bq-audit-logs.json]
    expire_in: 1 week
  needs: [prod_deploy]

error_reporting:
  stage: monitoring
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - gcloud error-reporting events list --service=app-name > error-report.txt
    - python -c "import sys; exit(1 if open('error-report.txt').read().count('CRITICAL') > 0 else 0)"
  artifacts:
    paths: [error-report.txt]
    expire_in: 1 week
  needs: [prod_deploy]

# DR TEST STAGE
dr_test:
  stage: dr_test
  image: $CI_REGISTRY/google-cloud-sdk:latest
  <<: *auth_gcp
  script:
    - bash scripts/test-dr.sh
    - cat dr-test-report.json
  artifacts:
    paths: [dr-test-report.json]
    expire_in: 1 week
  rules:
    - if: '$CI_PIPELINE_SOURCE == "schedule"'
  needs: [configure_monitoring, audit_logs_verification]
```

## Key Features

### Authentication
- Uses Workload Identity Federation to obtain short-lived credentials via the GitLab OIDC token
- No service account keys stored in the pipeline or GitLab
- Authentication logic implemented in a reusable template

### Security Controls
- Container scanning with Trivy and Grype that blocks deployments with HIGH/CRITICAL vulnerabilities
- Image signing with Cosign for software supply chain security
- ZAP DAST scans against preview environments
- Checkov for Infrastructure as Code security validation
- HIPAA validation for regulatory compliance

### Deployment Strategies
- Preview environments on Cloud Run with automatic cleanup after 48 hours
- Blue-green deployment to GKE staging environment
- Gradual production rollout (10% → 50% → 100%) with health checks

### Observability
- Comprehensive performance testing (Lighthouse, JMeter, DB profiling)
- Monitoring setup with SLO dashboards
- Audit logging verification
- Error reporting

### Best Practices
- All inline script blocks kept to 5 lines or fewer
- Complex logic moved to external scripts
- Proper caching of dependencies
- Artifacts retained for exactly 1 week
- Test coverage threshold enforcement (>85%)
- Disaster recovery testing implemented as a scheduled job

This pipeline ensures secure, compliant, and reliable deployments across all environments while maintaining a clean, maintainable configuration.
```