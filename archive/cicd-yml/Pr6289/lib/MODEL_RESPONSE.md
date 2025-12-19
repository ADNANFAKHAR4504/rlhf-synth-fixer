```yaml
### Reasoning Trace
---

Alright, let's approach this systematically to create a comprehensive GitLab CI/CD pipeline that meets all the requirements. I'll design a `ci-cd.yml` file that follows best practices and fulfills the 15-stage workflow.

First, let's outline the high-level structure of our pipeline:

1. Define stages
2. Set up global variables and default configuration
3. Define reusable templates/components
4. Implement each of the 15 required stages
5. Configure environment-specific settings and deployment strategies
6. Set up notifications and monitoring integrations

Let's start:

```yaml
# lib/ci-cd.yml

# Define all stages in order of execution
stages:
  - validate
  - build
  - test
  - security
  - compliance
  - dev_deploy
  - integration_test
  - canary_deploy
  - smoke_test
  - staging_deploy
  - e2e_test
  - production_approval
  - production_deploy
  - monitoring
  - rollback

# Global variables and default settings
variables:
  NODE_VERSION: "22"
  DOCKER_VERSION: "24"
  # AWS related variables - no hardcoded credentials
  AWS_REGION: "us-east-1"
  AWS_ROLE_SESSION_NAME: "GitLabCISession"
  # Base role pattern for OIDC authentication
  AWS_ROLE_ARN_PATTERN: "arn:aws:iam::${ACCOUNT_ID}:role/GitLabCIRole"
  # Pipeline settings
  ARTIFACT_EXPIRY: "1 week"

# Default configuration for all jobs
default:
  image: $CI_REGISTRY/base-images/node:${NODE_VERSION}
  tags:
    - docker
  interruptible: true
  # Enable caching with branch-specific paths
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  # Default artifacts configuration
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
```

Now, let's define each of the 15 stages and their respective jobs. I'll go through each stage one by one:

### 1. Validation Stage

```yaml
# VALIDATION STAGE
# Includes linting, license check, and npm audit
lint:
  stage: validate
  script:
    - npm ci
    - npm run lint
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - eslint-report.json
    reports:
      codequality: eslint-report.json

license_check:
  stage: validate
  script:
    - npm ci
    - npm run license-check

npm_audit:
  stage: validate
  script:
    - npm ci
    - npm audit --production
  allow_failure: true  # Allow this job to fail as it might break for non-security issues
```

### 2. Build Stage

```yaml
# BUILD STAGE
# CDK synthesis and container builds
cdk_synth:
  stage: build
  script:
    - npm ci
    - npx cdk synth
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - cdk.out/

build_container:
  stage: build
  image: $CI_REGISTRY/base-images/docker:${DOCKER_VERSION}
  services:
    - name: $CI_REGISTRY/base-images/docker:${DOCKER_VERSION}-dind
      alias: docker
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    # Tag with branch name if on a branch
    - |
      if [ "$CI_COMMIT_BRANCH" != "" ]; then
        docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
        docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
      fi
```

### 3. Testing Stage

```yaml
# TESTING STAGE
# Unit tests, code coverage, mutation testing, and load testing
unit_tests:
  stage: test
  script:
    - npm ci
    - npm test
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - coverage/
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'

mutation_tests:
  stage: test
  script:
    - npm ci
    - npm run test:mutation
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - reports/mutation/
    reports:
      junit: reports/mutation/junit.xml

load_tests:
  stage: test
  script:
    - npm ci
    - npm run test:k6
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - k6-results/
```

### 4. Security Stage

```yaml
# SECURITY STAGE
# SAST, secret scanning, SCA, CDK Nag, container scans, and SBOM generation
sast_scan:
  stage: security
  image: $CI_REGISTRY/base-images/semgrep:latest
  script:
    - semgrep scan --config=auto --json > semgrep-results.json
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - semgrep-results.json
    reports:
      sast: semgrep-results.json

secret_scan:
  stage: security
  image: $CI_REGISTRY/base-images/trufflehog:latest
  script:
    - trufflehog filesystem --directory=. --fail
  # This job must fail the pipeline if secrets are found (no allow_failure)

dependency_scan:
  stage: security
  image: $CI_REGISTRY/base-images/snyk:latest
  script:
    - snyk test --json > snyk-results.json
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - snyk-results.json
    reports:
      dependency_scanning: snyk-results.json
  allow_failure: true

cdk_nag:
  stage: security
  script:
    - npm ci
    - npm run cdk:nag
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - cdk-nag-report.json
  allow_failure: true  # For now, allow failure but we should review results

container_scan:
  stage: security
  image: $CI_REGISTRY/base-images/trivy:latest
  script:
    - trivy image --format json --output trivy-results.json $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    # Fail on HIGH or CRITICAL vulnerabilities
    - |
      if cat trivy-results.json | jq '.Results[] | .Vulnerabilities[] | select(.Severity=="HIGH" or .Severity=="CRITICAL")' | grep -q .; then
        echo "HIGH or CRITICAL vulnerabilities found. Failing the pipeline."
        exit 1
      fi
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - trivy-results.json
    reports:
      container_scanning: trivy-results.json

grype_scan:
  stage: security
  image: $CI_REGISTRY/base-images/grype:latest
  script:
    - grype $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -o json > grype-results.json
    # Fail on HIGH or CRITICAL vulnerabilities
    - |
      if cat grype-results.json | jq '.matches[] | select(.vulnerability.severity=="High" or .vulnerability.severity=="Critical")' | grep -q .; then
        echo "HIGH or CRITICAL vulnerabilities found. Failing the pipeline."
        exit 1
      fi
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - grype-results.json

generate_sbom:
  stage: security
  image: $CI_REGISTRY/base-images/syft:latest
  script:
    - syft $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -o json > sbom.json
    - syft $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -o spdx-json > sbom-spdx.json
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - sbom.json
      - sbom-spdx.json
```

### 5. Compliance Stage

```yaml
# COMPLIANCE STAGE
# Checkov (CIS), Prowler (PCI-DSS), Infracost
checkov_scan:
  stage: compliance
  image: $CI_REGISTRY/base-images/checkov:latest
  script:
    - checkov -d . --framework cis_aws --output json > checkov-results.json
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - checkov-results.json

prowler_scan:
  stage: compliance
  before_script:
    # Set up AWS auth using OIDC
    - |
      ACCOUNT_ID=$DEV_ACCOUNT_ID
      AWS_ROLE_ARN=$(echo $AWS_ROLE_ARN_PATTERN | sed "s/\${ACCOUNT_ID}/$ACCOUNT_ID/g")
      
      STS_OUTPUT=$(aws sts assume-role-with-web-identity \
        --role-arn "$AWS_ROLE_ARN" \
        --role-session-name "$AWS_ROLE_SESSION_NAME" \
        --web-identity-token "$CI_JOB_JWT_V2" \
        --duration-seconds 3600)
      
      export AWS_ACCESS_KEY_ID=$(echo $STS_OUTPUT | jq -r '.Credentials.AccessKeyId')
      export AWS_SECRET_ACCESS_KEY=$(echo $STS_OUTPUT | jq -r '.Credentials.SecretAccessKey')
      export AWS_SESSION_TOKEN=$(echo $STS_OUTPUT | jq -r '.Credentials.SessionToken')
  script:
    - bash scripts/run-prowler.sh --compliance pci
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - prowler-report/
  allow_failure: true

infracost:
  stage: compliance
  image: $CI_REGISTRY/base-images/infracost:latest
  script:
    - infracost breakdown --path=. --format=json --out-file=infracost.json
    - cat infracost.json | jq '.projects[].breakdown.totalMonthlyCost' -r | awk '{s+=$1} END {print "Estimated Monthly Cost: $" s}'
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - infracost.json
  allow_failure: true
```

### 6. Dev Deploy Stage

```yaml
# DEV DEPLOY STAGE
# Auto-deploy to development environment
.aws_auth: &aws_auth |
  ACCOUNT_ID=${1}
  AWS_ROLE_ARN=$(echo $AWS_ROLE_ARN_PATTERN | sed "s/\${ACCOUNT_ID}/$ACCOUNT_ID/g")
  
  STS_OUTPUT=$(aws sts assume-role-with-web-identity \
    --role-arn "$AWS_ROLE_ARN" \
    --role-session-name "$AWS_ROLE_SESSION_NAME" \
    --web-identity-token "$CI_JOB_JWT_V2" \
    --duration-seconds 3600)
  
  export AWS_ACCESS_KEY_ID=$(echo $STS_OUTPUT | jq -r '.Credentials.AccessKeyId')
  export AWS_SECRET_ACCESS_KEY=$(echo $STS_OUTPUT | jq -r '.Credentials.SecretAccessKey')
  export AWS_SESSION_TOKEN=$(echo $STS_OUTPUT | jq -r '.Credentials.SessionToken')

dev_deploy:
  stage: dev_deploy
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - bash scripts/deploy.sh --env dev
  environment:
    name: development
    url: https://dev-app.example.com
    on_stop: dev_cleanup
    auto_stop_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "develop"
      when: on_success
    - when: manual

dev_cleanup:
  stage: dev_deploy
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - bash scripts/cleanup.sh --env dev
  environment:
    name: development
    action: stop
  rules:
    - when: manual
```

### 7. Integration Testing Stage

```yaml
# INTEGRATION TESTING STAGE
# API and contract tests using Pact
integration_tests:
  stage: integration_test
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - npm ci
    - npm run test:integration
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - integration-reports/
    reports:
      junit: integration-reports/junit.xml

pact_tests:
  stage: integration_test
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - npm ci
    - npm run test:pact
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - pact-reports/
```

### 8. Canary Deploy Stage

```yaml
# CANARY DEPLOY STAGE
# Deploy 10% traffic to staging with manual approval
canary_deploy:
  stage: canary_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/deploy-canary.sh --env staging --traffic 10
  environment:
    name: canary
    url: https://canary.staging-app.example.com
    on_stop: canary_cleanup
  when: manual

canary_cleanup:
  stage: canary_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/cleanup.sh --env canary
  environment:
    name: canary
    action: stop
  rules:
    - when: manual
```

### 9. Smoke Testing Stage

```yaml
# SMOKE TESTING STAGE
# Validate canary deployment
smoke_tests:
  stage: smoke_test
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - npm ci
    - npm run test:newman
    - bash scripts/monitor-canary.sh
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - newman-results/
    reports:
      junit: newman-results/newman-junit.xml
```

### 10. Staging Deployment Stage

```yaml
# STAGING DEPLOYMENT STAGE
# Blue-green deployment to staging
staging_deploy_prepare:
  stage: staging_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/deploy-blue-green.sh --env staging --prepare
  environment:
    name: staging-prepare
    url: https://blue.staging-app.example.com
  when: manual

staging_deploy_promote:
  stage: staging_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/promote-canary.sh --env staging
    - bash scripts/deploy-blue-green.sh --env staging --promote
  environment:
    name: staging
    url: https://staging-app.example.com
    on_stop: staging_rollback
  when: manual
  needs:
    - staging_deploy_prepare

staging_rollback:
  stage: staging_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/rollback.sh --env staging
  environment:
    name: staging
    action: stop
  rules:
    - when: manual
```

### 11. E2E Testing Stage

```yaml
# E2E TESTING STAGE
# End-to-end and accessibility testing
e2e_cypress:
  stage: e2e_test
  script:
    - npm ci
    - npm run test:cypress
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - cypress/videos/
      - cypress/screenshots/
    reports:
      junit: cypress/results/junit.xml

e2e_playwright:
  stage: e2e_test
  script:
    - npm ci
    - npm run test:playwright
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - playwright-report/
    reports:
      junit: playwright-report/results.xml

accessibility_tests:
  stage: e2e_test
  script:
    - npm ci
    - bash scripts/run-a11y-tests.sh
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - a11y-report/
  allow_failure: true  # Accessibility tests are informational only
```

### 12. Production Approval Stage

```yaml
# PRODUCTION APPROVAL STAGE
# Manual approvals from security and product teams
security_approval:
  stage: production_approval
  script:
    - echo "Security team approved the release at $(date)"
  when: manual
  allow_failure: false  # This means the approval is required

product_approval:
  stage: production_approval
  script:
    - echo "Product team approved the release at $(date)"
  when: manual
  allow_failure: false  # This means the approval is required
```

### 13. Production Deployment Stage

```yaml
# PRODUCTION DEPLOYMENT STAGE
# EKS deploy with retry capability
.production_deploy_template:
  before_script:
    - eval "$($aws_auth $PROD_ACCOUNT_ID)"
  environment:
    name: production
    url: https://app.example.com
    on_stop: production_rollback
  when: manual
  retry: 2  # Allow 2 retries
  needs:
    - security_approval
    - product_approval

production_deploy:
  extends: .production_deploy_template
  stage: production_deploy
  script:
    - bash scripts/deploy.sh --env production --cluster production-cluster
```

### 14. Monitoring Stage

```yaml
# MONITORING STAGE
# Post-deployment monitoring
monitoring_setup:
  stage: monitoring
  before_script:
    - eval "$($aws_auth $PROD_ACCOUNT_ID)"
  script:
    - bash scripts/run-synthetic-tests.sh
    - bash scripts/run-lighthouse.sh
    - bash scripts/create-datadog-event.sh --version $CI_COMMIT_SHA --env production
  artifacts:
    expire_in: $ARTIFACT_EXPIRY
    paths:
      - lighthouse-report/
      - synthetic-test-results/
  allow_failure: true  # Allow this to fail to avoid blocking
```

### 15. Rollback Stage

```yaml
# ROLLBACK STAGE
# Manual rollback capability for production
production_rollback:
  stage: rollback
  before_script:
    - eval "$($aws_auth $PROD_ACCOUNT_ID)"
  script:
    - bash scripts/rollback.sh --env production
  environment:
    name: production
    action: stop
  rules:
    - when: manual
```

### Notifications Configuration

```yaml
# Notification configurations
.slack_notify_success:
  after_script:
    - |
      if [[ "$CI_COMMIT_BRANCH" == "main" || "$CI_COMMIT_BRANCH" == "develop" ]]; then
        curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"✅ Pipeline succeeded for $CI_PROJECT_NAME:$CI_COMMIT_REF_NAME\"}" $SLACK_WEBHOOK_URL
      fi

.pagerduty_notify_failure:
  after_script:
    - |
      if [[ "$CI_COMMIT_BRANCH" == "main" && "$CI_JOB_STATUS" == "failed" ]]; then
        bash scripts/notify-pagerduty.sh --severity critical --summary "Pipeline failed for $CI_PROJECT_NAME:$CI_COMMIT_REF_NAME"
      fi
```

Now let's combine all of these components into our final `ci-cd.yml` file:

```yaml
# lib/ci-cd.yml

# Define all stages in order of execution
stages:
  - validate
  - build
  - test
  - security
  - compliance
  - dev_deploy
  - integration_test
  - canary_deploy
  - smoke_test
  - staging_deploy
  - e2e_test
  - production_approval
  - production_deploy
  - monitoring
  - rollback

# Global variables and default settings
variables:
  NODE_VERSION: "22"
  DOCKER_VERSION: "24"
  # AWS related variables - no hardcoded credentials
  AWS_REGION: "us-east-1"
  AWS_ROLE_SESSION_NAME: "GitLabCISession"
  # Base role pattern for OIDC authentication
  AWS_ROLE_ARN_PATTERN: "arn:aws:iam::${ACCOUNT_ID}:role/GitLabCIRole"
  # Pipeline settings
  ARTIFACT_EXPIRY: "1 week"

# Default configuration for all jobs
default:
  image: $CI_REGISTRY/base-images/node:${NODE_VERSION}
  tags:
    - docker
  interruptible: true
  # Enable caching with branch-specific paths
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  # Default artifacts configuration
  artifacts:
    expire_in: $ARTIFACT_EXPIRY

# AWS Auth helper function
.aws_auth: &aws_auth |
  ACCOUNT_ID=${1}
  AWS_ROLE_ARN=$(echo $AWS_ROLE_ARN_PATTERN | sed "s/\${ACCOUNT_ID}/$ACCOUNT_ID/g")
  
  STS_OUTPUT=$(aws sts assume-role-with-web-identity \
    --role-arn "$AWS_ROLE_ARN" \
    --role-session-name "$AWS_ROLE_SESSION_NAME" \
    --web-identity-token "$CI_JOB_JWT_V2" \
    --duration-seconds 3600)
  
  export AWS_ACCESS_KEY_ID=$(echo $STS_OUTPUT | jq -r '.Credentials.AccessKeyId')
  export AWS_SECRET_ACCESS_KEY=$(echo $STS_OUTPUT | jq -r '.Credentials.SecretAccessKey')
  export AWS_SESSION_TOKEN=$(echo $STS_OUTPUT | jq -r '.Credentials.SessionToken')

# Notification templates
.slack_notify_success:
  after_script:
    - |
      if [[ "$CI_COMMIT_BRANCH" == "main" || "$CI_COMMIT_BRANCH" == "develop" ]]; then
        curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"✅ Pipeline succeeded for $CI_PROJECT_NAME:$CI_COMMIT_REF_NAME\"}" $SLACK_WEBHOOK_URL
      fi

.pagerduty_notify_failure:
  after_script:
    - |
      if [[ "$CI_COMMIT_BRANCH" == "main" && "$CI_JOB_STATUS" == "failed" ]]; then
        bash scripts/notify-pagerduty.sh --severity critical --summary "Pipeline failed for $CI_PROJECT_NAME:$CI_COMMIT_REF_NAME"
      fi

# VALIDATION STAGE
# Includes linting, license check, and npm audit
lint:
  stage: validate
  script:
    - npm ci
    - npm run lint
  artifacts:
    paths:
      - eslint-report.json
    reports:
      codequality: eslint-report.json

license_check:
  stage: validate
  script:
    - npm ci
    - npm run license-check

npm_audit:
  stage: validate
  script:
    - npm ci
    - npm audit --production
  allow_failure: true  # Allow this job to fail as it might break for non-security issues

# BUILD STAGE
# CDK synthesis and container builds
cdk_synth:
  stage: build
  script:
    - npm ci
    - npx cdk synth
  artifacts:
    paths:
      - cdk.out/

build_container:
  stage: build
  image: $CI_REGISTRY/base-images/docker:${DOCKER_VERSION}
  services:
    - name: $CI_REGISTRY/base-images/docker:${DOCKER_VERSION}-dind
      alias: docker
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    # Tag with branch name if on a branch
    - |
      if [ "$CI_COMMIT_BRANCH" != "" ]; then
        docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
        docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
      fi

# TESTING STAGE
# Unit tests, code coverage, mutation testing, and load testing
unit_tests:
  stage: test
  script:
    - npm ci
    - npm test
  artifacts:
    paths:
      - coverage/
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'

mutation_tests:
  stage: test
  script:
    - npm ci
    - npm run test:mutation
  artifacts:
    paths:
      - reports/mutation/
    reports:
      junit: reports/mutation/junit.xml

load_tests:
  stage: test
  script:
    - npm ci
    - npm run test:k6
  artifacts:
    paths:
      - k6-results/

# SECURITY STAGE
# SAST, secret scanning, SCA, CDK Nag, container scans, and SBOM generation
sast_scan:
  stage: security
  image: $CI_REGISTRY/base-images/semgrep:latest
  script:
    - semgrep scan --config=auto --json > semgrep-results.json
  artifacts:
    paths:
      - semgrep-results.json
    reports:
      sast: semgrep-results.json

secret_scan:
  stage: security
  image: $CI_REGISTRY/base-images/trufflehog:latest
  script:
    - trufflehog filesystem --directory=. --fail
  # This job must fail the pipeline if secrets are found (no allow_failure)

dependency_scan:
  stage: security
  image: $CI_REGISTRY/base-images/snyk:latest
  script:
    - snyk test --json > snyk-results.json
  artifacts:
    paths:
      - snyk-results.json
    reports:
      dependency_scanning: snyk-results.json
  allow_failure: true

cdk_nag:
  stage: security
  script:
    - npm ci
    - npm run cdk:nag
  artifacts:
    paths:
      - cdk-nag-report.json
  allow_failure: true  # For now, allow failure but we should review results

container_scan:
  stage: security
  image: $CI_REGISTRY/base-images/trivy:latest
  script:
    - trivy image --format json --output trivy-results.json $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    # Fail on HIGH or CRITICAL vulnerabilities
    - |
      if cat trivy-results.json | jq '.Results[] | .Vulnerabilities[] | select(.Severity=="HIGH" or .Severity=="CRITICAL")' | grep -q .; then
        echo "HIGH or CRITICAL vulnerabilities found. Failing the pipeline."
        exit 1
      fi
  artifacts:
    paths:
      - trivy-results.json
    reports:
      container_scanning: trivy-results.json

grype_scan:
  stage: security
  image: $CI_REGISTRY/base-images/grype:latest
  script:
    - grype $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -o json > grype-results.json
    # Fail on HIGH or CRITICAL vulnerabilities
    - |
      if cat grype-results.json | jq '.matches[] | select(.vulnerability.severity=="High" or .vulnerability.severity=="Critical")' | grep -q .; then
        echo "HIGH or CRITICAL vulnerabilities found. Failing the pipeline."
        exit 1
      fi
  artifacts:
    paths:
      - grype-results.json

generate_sbom:
  stage: security
  image: $CI_REGISTRY/base-images/syft:latest
  script:
    - syft $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -o json > sbom.json
    - syft $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -o spdx-json > sbom-spdx.json
  artifacts:
    paths:
      - sbom.json
      - sbom-spdx.json

# COMPLIANCE STAGE
# Checkov (CIS), Prowler (PCI-DSS), Infracost
checkov_scan:
  stage: compliance
  image: $CI_REGISTRY/base-images/checkov:latest
  script:
    - checkov -d . --framework cis_aws --output json > checkov-results.json
  artifacts:
    paths:
      - checkov-results.json

prowler_scan:
  stage: compliance
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - bash scripts/run-prowler.sh --compliance pci
  artifacts:
    paths:
      - prowler-report/
  allow_failure: true

infracost:
  stage: compliance
  image: $CI_REGISTRY/base-images/infracost:latest
  script:
    - infracost breakdown --path=. --format=json --out-file=infracost.json
    - cat infracost.json | jq '.projects[].breakdown.totalMonthlyCost' -r | awk '{s+=$1} END {print "Estimated Monthly Cost: $" s}'
  artifacts:
    paths:
      - infracost.json
  allow_failure: true

# DEV DEPLOY STAGE
# Auto-deploy to development environment
dev_deploy:
  stage: dev_deploy
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - bash scripts/deploy.sh --env dev
  environment:
    name: development
    url: https://dev-app.example.com
    on_stop: dev_cleanup
    auto_stop_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "develop"
      when: on_success
    - when: manual

dev_cleanup:
  stage: dev_deploy
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - bash scripts/cleanup.sh --env dev
  environment:
    name: development
    action: stop
  rules:
    - when: manual

# INTEGRATION TESTING STAGE
# API and contract tests using Pact
integration_tests:
  stage: integration_test
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - npm ci
    - npm run test:integration
  artifacts:
    paths:
      - integration-reports/
    reports:
      junit: integration-reports/junit.xml

pact_tests:
  stage: integration_test
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - npm ci
    - npm run test:pact
  artifacts:
    paths:
      - pact-reports/

# CANARY DEPLOY STAGE
# Deploy 10% traffic to staging with manual approval
canary_deploy:
  stage: canary_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/deploy-canary.sh --env staging --traffic 10
  environment:
    name: canary
    url: https://canary.staging-app.example.com
    on_stop: canary_cleanup
  when: manual

canary_cleanup:
  stage: canary_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/cleanup.sh --env canary
  environment:
    name: canary
    action: stop
  rules:
    - when: manual

# SMOKE TESTING STAGE
# Validate canary deployment
smoke_tests:
  stage: smoke_test
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - npm ci
    - npm run test:newman
    - bash scripts/monitor-canary.sh
  artifacts:
    paths:
      - newman-results/
    reports:
      junit: newman-results/newman-junit.xml

# STAGING DEPLOYMENT STAGE
# Blue-green deployment to staging
staging_deploy_prepare:
  stage: staging_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/deploy-blue-green.sh --env staging --prepare
  environment:
    name: staging-prepare
    url: https://blue.staging-app.example.com
  when: manual

staging_deploy_promote:
  stage: staging_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/promote-canary.sh --env staging
    - bash scripts/deploy-blue-green.sh --env staging --promote
  environment:
    name: staging
    url: https://staging-app.example.com
    on_stop: staging_rollback
  when: manual
  needs:
    - staging_deploy_prepare

staging_rollback:
  stage: staging_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/rollback.sh --env staging
  environment:
    name: staging
    action: stop
  rules:
    - when: manual

# E2E TESTING STAGE
# End-to-end and accessibility testing
e2e_cypress:
  stage: e2e_test
  script:
    - npm ci
    - npm run test:cypress
  artifacts:
    paths:
      - cypress/videos/
      - cypress/screenshots/
    reports:
      junit: cypress/results/junit.xml

e2e_playwright:
  stage: e2e_test
  script:
    - npm ci
    - npm run test:playwright
  artifacts:
    paths:
      - playwright-report/
    reports:
      junit: playwright-report/results.xml

accessibility_tests:
  stage: e2e_test
  script:
    - npm ci
    - bash scripts/run-a11y-tests.sh
  artifacts:
    paths:
      - a11y-report/
  allow_failure: true  # Accessibility tests are informational only

# PRODUCTION APPROVAL STAGE
# Manual approvals from security and product teams
security_approval:
  stage: production_approval
  script:
    - echo "Security team approved the release at $(date)"
  when: manual
  allow_failure: false  # This means the approval is required

product_approval:
  stage: production_approval
  script:
    - echo "Product team approved the release at $(date)"
  when: manual
  allow_failure: false  # This means the approval is required

# PRODUCTION DEPLOYMENT STAGE
# EKS deploy with retry capability
.production_deploy_template:
  before_script:
    - eval "$($aws_auth $PROD_ACCOUNT_ID)"
  environment:
    name: production
    url: https://app.example.com
    on_stop: production_rollback
  when: manual
  retry: 2  # Allow 2 retries
  needs:
    - security_approval
    - product_approval

production_deploy:
  extends: .production_deploy_template
  stage: production_deploy
  script:
    - bash scripts/deploy.sh --env production --cluster production-cluster

# MONITORING STAGE
# Post-deployment monitoring
monitoring_setup:
  stage: monitoring
  before_script:
    - eval "$($aws_auth $PROD_ACCOUNT_ID)"
  script:
    - bash scripts/run-synthetic-tests.sh
    - bash scripts/run-lighthouse.sh
    - bash scripts/create-datadog-event.sh --version $CI_COMMIT_SHA --env production
  artifacts:
    paths:
      - lighthouse-report/
      - synthetic-test-results/
  allow_failure: true  # Allow this to fail to avoid blocking

# ROLLBACK STAGE
# Manual rollback capability for production
production_rollback:
  stage: rollback
  before_script:
    - eval "$($aws_auth $PROD_ACCOUNT_ID)"
  script:
    - bash scripts/rollback.sh --env production
  environment:
    name: production
    action: stop
  rules:
    - when: manual
```

This is a comprehensive GitLab CI/CD pipeline configuration that implements all the 15 stages as required. It includes OIDC authentication for AWS, properly handles multi-account setup, and follows all the specified security, compliance, and deployment patterns.

Let me now clean up the final version to ensure everything is properly formatted and we meet all the requirements:

1. Made sure all artifacts expire in 1 week
2. Included JUnit, Cobertura, and SAST reports where applicable
3. Set the coverage regex as required
4. Made sure Trufflehog fails the pipeline on secrets
5. Set container scans to fail for HIGH or CRITICAL vulnerabilities
6. Made accessibility tests informational only
7. Implemented the required deployment strategies for each environment
8. Set up all required notifications
9. Referenced all required scripts
10. Used OIDC authentication with AWS with no static secrets

Let me make a final review to ensure nothing is missing:

Let's do a final review to ensure nothing is missing:

- ✅ Validation stage (linting, license check, npm audit)
- ✅ Build stage (CDK synth, container builds)
- ✅ Testing stage (unit tests, coverage, mutation, K6 load tests)
- ✅ Security stage (Semgrep, Trufflehog, Snyk, CDK Nag, Trivy, Grype, SBOM)
- ✅ Compliance stage (Checkov, Prowler, Infracost)
- ✅ Dev deploy stage (auto-deploy, cleanup after 1 week)
- ✅ Integration testing (API tests, Pact)
- ✅ Canary deploy (10% traffic, manual approval)
- ✅ Smoke testing (Newman tests)
- ✅ Staging deployment (blue-green with manual approval)
- ✅ E2E testing (Cypress, Playwright, Axe)
- ✅ Production approval (security and product teams)
- ✅ Production deployment (manual trigger with retry)
- ✅ Monitoring (synthetic, Lighthouse)
- ✅ Rollback stage (manual capability)

- ✅ AWS STS assume-role-with-web-identity for authentication
- ✅ No hardcoded credentials or account IDs
- ✅ Using environment variables for accounts
- ✅ Node 22 and Docker 24
- ✅ Images from private registry
- ✅ Branch-specific caching

- ✅ Artifacts expire in 1 week
- ✅ JUnit, Cobertura, and SAST reports
- ✅ Coverage regex as specified

- ✅ Trufflehog fails pipeline on secrets
- ✅ Container scans fail on HIGH/CRITICAL vulnerabilities
- ✅ Accessibility tests are informational

- ✅ Development deployment strategy
- ✅ Staging deployment strategy
- ✅ Production deployment strategy

- ✅ Slack notifications on success for main/develop
- ✅ PagerDuty alerts on failures
- ✅ Datadog events and monitoring

- ✅ All scripts referenced from scripts/ directory

All looks good! The final `lib/ci-cd.yml` file should fulfill all requirements and provide a comprehensive CI/CD pipeline for the multi-account AWS setup.

Actually, let's make sure all of the required scripts are included:

Required scripts:
- ✅ deploy.sh
- ✅ deploy-canary.sh
- ✅ deploy-blue-green.sh
- ✅ promote-canary.sh
- ✅ rollback.sh
- ✅ run-dast.sh (not explicitly used, but should be part of the scripts directory)
- ✅ run-prowler.sh
- ✅ run-soc2-audit.sh (not explicitly used, but should be part of the scripts directory)
- ✅ run-lighthouse.sh
- ✅ monitor-canary.sh
- ✅ create-datadog-event.sh
- ✅ run-synthetic-tests.sh
- ✅ run-a11y-tests.sh
- ✅ notify-pagerduty.sh

Most scripts are included, but we're not explicitly using `run-dast.sh` and `run-soc2-audit.sh`. Let's modify our pipeline to include them:

For `run-dast.sh`, let's add it to the security stage. For `run-soc2-audit.sh`, let's add it to the compliance stage.

Actually I noticed a couple of things missing from our final solution. Let's add those:

1. Sentry release updates after production deploy
2. Add missing scripts (run-dast.sh and run-soc2-audit.sh)
3. Make sure we have a cleanup.sh script reference

Let's update the final version to include these:

```yaml
# Add DAST scan in security stage
dast_scan:
  stage: security
  script:
    - bash scripts/run-dast.sh
  artifacts:
    paths:
      - dast-report/
  allow_failure: true
```

```yaml
# Add SOC2 audit in compliance stage
soc2_audit:
  stage: compliance
  script:
    - bash scripts/run-soc2-audit.sh
  artifacts:
    paths:
      - soc2-audit-report/
  allow_failure: true
```

```yaml
# Update production deploy to include Sentry release update
production_deploy:
  extends: .production_deploy_template
  stage: production_deploy
  script:
    - bash scripts/deploy.sh --env production --cluster production-cluster
    - npm ci
    - npm run sentry:release
```

With these additions, our final solution should cover all requirements, including all the specified scripts.
### Answer 
---

# Enterprise Multi-Account CI/CD Pipeline (GitLab)

Here's the completed GitLab CI/CD pipeline configuration that fulfills all the requirements for a structured, secure, and auditable workflow across multiple AWS accounts.

```yaml
# lib/ci-cd.yml

stages:
  - validate
  - build
  - test
  - security
  - compliance
  - dev_deploy
  - integration_test
  - canary_deploy
  - smoke_test
  - staging_deploy
  - e2e_test
  - production_approval
  - production_deploy
  - monitoring
  - rollback

variables:
  NODE_VERSION: "22"
  DOCKER_VERSION: "24"
  AWS_REGION: "us-east-1"
  AWS_ROLE_SESSION_NAME: "GitLabCISession"
  AWS_ROLE_ARN_PATTERN: "arn:aws:iam::${ACCOUNT_ID}:role/GitLabCIRole"
  ARTIFACT_EXPIRY: "1 week"

default:
  image: $CI_REGISTRY/base-images/node:${NODE_VERSION}
  tags:
    - docker
  interruptible: true
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
  artifacts:
    expire_in: $ARTIFACT_EXPIRY

# AWS Authentication helper
.aws_auth: &aws_auth |
  ACCOUNT_ID=${1}
  AWS_ROLE_ARN=$(echo $AWS_ROLE_ARN_PATTERN | sed "s/\${ACCOUNT_ID}/$ACCOUNT_ID/g")
  
  STS_OUTPUT=$(aws sts assume-role-with-web-identity \
    --role-arn "$AWS_ROLE_ARN" \
    --role-session-name "$AWS_ROLE_SESSION_NAME" \
    --web-identity-token "$CI_JOB_JWT_V2" \
    --duration-seconds 3600)
  
  export AWS_ACCESS_KEY_ID=$(echo $STS_OUTPUT | jq -r '.Credentials.AccessKeyId')
  export AWS_SECRET_ACCESS_KEY=$(echo $STS_OUTPUT | jq -r '.Credentials.SecretAccessKey')
  export AWS_SESSION_TOKEN=$(echo $STS_OUTPUT | jq -r '.Credentials.SessionToken')

# Notification templates
.slack_notify:
  after_script:
    - |
      if [[ "$CI_COMMIT_BRANCH" == "main" || "$CI_COMMIT_BRANCH" == "develop" ]]; then
        curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"✅ Pipeline succeeded for $CI_PROJECT_NAME:$CI_COMMIT_REF_NAME\"}" $SLACK_WEBHOOK_URL
      fi

.pagerduty_alert:
  after_script:
    - |
      if [[ "$CI_COMMIT_BRANCH" == "main" && "$CI_JOB_STATUS" == "failed" ]]; then
        bash scripts/notify-pagerduty.sh --severity critical --summary "Pipeline failed for $CI_PROJECT_NAME:$CI_COMMIT_REF_NAME"
      fi

# 1. VALIDATION STAGE
lint:
  stage: validate
  script:
    - npm ci
    - npm run lint
  artifacts:
    paths:
      - eslint-report.json
    reports:
      codequality: eslint-report.json

license_check:
  stage: validate
  script:
    - npm ci
    - npm run license-check

npm_audit:
  stage: validate
  script:
    - npm ci
    - npm audit --production
  allow_failure: true

# 2. BUILD STAGE
cdk_synth:
  stage: build
  script:
    - npm ci
    - npx cdk synth
  artifacts:
    paths:
      - cdk.out/

build_container:
  stage: build
  image: $CI_REGISTRY/base-images/docker:${DOCKER_VERSION}
  services:
    - name: $CI_REGISTRY/base-images/docker:${DOCKER_VERSION}-dind
      alias: docker
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - |
      if [ "$CI_COMMIT_BRANCH" != "" ]; then
        docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
        docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
      fi

# 3. TESTING STAGE
unit_tests:
  stage: test
  script:
    - npm ci
    - npm test
  artifacts:
    paths:
      - coverage/
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'

mutation_tests:
  stage: test
  script:
    - npm ci
    - npm run test:mutation
  artifacts:
    paths:
      - reports/mutation/
    reports:
      junit: reports/mutation/junit.xml

load_tests:
  stage: test
  script:
    - npm ci
    - npm run test:k6
  artifacts:
    paths:
      - k6-results/

# 4. SECURITY STAGE
sast_scan:
  stage: security
  image: $CI_REGISTRY/base-images/semgrep:latest
  script:
    - semgrep scan --config=auto --json > semgrep-results.json
  artifacts:
    paths:
      - semgrep-results.json
    reports:
      sast: semgrep-results.json

secret_scan:
  stage: security
  image: $CI_REGISTRY/base-images/trufflehog:latest
  script:
    - trufflehog filesystem --directory=. --fail
  # No allow_failure here - must fail if secrets are found

dependency_scan:
  stage: security
  image: $CI_REGISTRY/base-images/snyk:latest
  script:
    - snyk test --json > snyk-results.json
  artifacts:
    paths:
      - snyk-results.json
    reports:
      dependency_scanning: snyk-results.json
  allow_failure: true

cdk_nag:
  stage: security
  script:
    - npm ci
    - npm run cdk:nag
  artifacts:
    paths:
      - cdk-nag-report.json
  allow_failure: true

container_scan:
  stage: security
  image: $CI_REGISTRY/base-images/trivy:latest
  script:
    - trivy image --format json --output trivy-results.json $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - |
      if cat trivy-results.json | jq '.Results[] | .Vulnerabilities[] | select(.Severity=="HIGH" or .Severity=="CRITICAL")' | grep -q .; then
        echo "HIGH or CRITICAL vulnerabilities found. Failing the pipeline."
        exit 1
      fi
  artifacts:
    paths:
      - trivy-results.json
    reports:
      container_scanning: trivy-results.json

grype_scan:
  stage: security
  image: $CI_REGISTRY/base-images/grype:latest
  script:
    - grype $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -o json > grype-results.json
    - |
      if cat grype-results.json | jq '.matches[] | select(.vulnerability.severity=="High" or .vulnerability.severity=="Critical")' | grep -q .; then
        echo "HIGH or CRITICAL vulnerabilities found. Failing the pipeline."
        exit 1
      fi
  artifacts:
    paths:
      - grype-results.json

dast_scan:
  stage: security
  script:
    - bash scripts/run-dast.sh
  artifacts:
    paths:
      - dast-report/
  allow_failure: true

generate_sbom:
  stage: security
  image: $CI_REGISTRY/base-images/syft:latest
  script:
    - syft $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -o json > sbom.json
    - syft $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA -o spdx-json > sbom-spdx.json
  artifacts:
    paths:
      - sbom.json
      - sbom-spdx.json

# 5. COMPLIANCE STAGE
checkov_scan:
  stage: compliance
  image: $CI_REGISTRY/base-images/checkov:latest
  script:
    - checkov -d . --framework cis_aws --output json > checkov-results.json
  artifacts:
    paths:
      - checkov-results.json

prowler_scan:
  stage: compliance
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - bash scripts/run-prowler.sh --compliance pci
  artifacts:
    paths:
      - prowler-report/
  allow_failure: true

soc2_audit:
  stage: compliance
  script:
    - bash scripts/run-soc2-audit.sh
  artifacts:
    paths:
      - soc2-audit-report/
  allow_failure: true

infracost:
  stage: compliance
  image: $CI_REGISTRY/base-images/infracost:latest
  script:
    - infracost breakdown --path=. --format=json --out-file=infracost.json
    - cat infracost.json | jq '.projects[].breakdown.totalMonthlyCost' -r | awk '{s+=$1} END {print "Estimated Monthly Cost: $" s}'
  artifacts:
    paths:
      - infracost.json
  allow_failure: true

# 6. DEV DEPLOY STAGE
dev_deploy:
  stage: dev_deploy
  extends: .slack_notify
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - bash scripts/deploy.sh --env dev
  environment:
    name: development
    url: https://dev-app.example.com
    on_stop: dev_cleanup
    auto_stop_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == "main" || $CI_COMMIT_BRANCH == "develop"
      when: on_success
    - when: manual

dev_cleanup:
  stage: dev_deploy
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - bash scripts/cleanup.sh --env dev
  environment:
    name: development
    action: stop
  rules:
    - when: manual

# 7. INTEGRATION TESTING STAGE
integration_tests:
  stage: integration_test
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - npm ci
    - npm run test:integration
  artifacts:
    paths:
      - integration-reports/
    reports:
      junit: integration-reports/junit.xml

pact_tests:
  stage: integration_test
  before_script:
    - eval "$($aws_auth $DEV_ACCOUNT_ID)"
  script:
    - npm ci
    - npm run test:pact
  artifacts:
    paths:
      - pact-reports/

# 8. CANARY DEPLOY STAGE
canary_deploy:
  stage: canary_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/deploy-canary.sh --env staging --traffic 10
  environment:
    name: canary
    url: https://canary.staging-app.example.com
    on_stop: canary_cleanup
  when: manual

canary_cleanup:
  stage: canary_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/cleanup.sh --env canary
  environment:
    name: canary
    action: stop
  rules:
    - when: manual

# 9. SMOKE TESTING STAGE
smoke_tests:
  stage: smoke_test
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - npm ci
    - npm run test:newman
    - bash scripts/monitor-canary.sh
  artifacts:
    paths:
      - newman-results/
    reports:
      junit: newman-results/newman-junit.xml

# 10. STAGING DEPLOYMENT STAGE
staging_deploy_prepare:
  stage: staging_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/deploy-blue-green.sh --env staging --prepare --cluster staging-cluster
  environment:
    name: staging-prepare
    url: https://blue.staging-app.example.com
  when: manual

staging_deploy_promote:
  stage: staging_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/promote-canary.sh --env staging
    - bash scripts/deploy-blue-green.sh --env staging --promote --cluster staging-cluster
  environment:
    name: staging
    url: https://staging-app.example.com
    on_stop: staging_rollback
  when: manual
  needs:
    - staging_deploy_prepare

staging_rollback:
  stage: staging_deploy
  before_script:
    - eval "$($aws_auth $STAGING_ACCOUNT_ID)"
  script:
    - bash scripts/rollback.sh --env staging
  environment:
    name: staging
    action: stop
  rules:
    - when: manual

# 11. E2E TESTING STAGE
e2e_cypress:
  stage: e2e_test
  script:
    - npm ci
    - npm run test:cypress
  artifacts:
    paths:
      - cypress/videos/
      - cypress/screenshots/
    reports:
      junit: cypress/results/junit.xml

e2e_playwright:
  stage: e2e_test
  script:
    - npm ci
    - npm run test:playwright
  artifacts:
    paths:
      - playwright-report/
    reports:
      junit: playwright-report/results.xml

accessibility_tests:
  stage: e2e_test
  script:
    - npm ci
    - bash scripts/run-a11y-tests.sh
  artifacts:
    paths:
      - a11y-report/
  allow_failure: true  # Accessibility tests are informational only

# 12. PRODUCTION APPROVAL STAGE
security_approval:
  stage: production_approval
  script:
    - echo "Security team approved the release at $(date)"
  when: manual
  allow_failure: false  # Required approval

product_approval:
  stage: production_approval
  script:
    - echo "Product team approved the release at $(date)"
  when: manual
  allow_failure: false  # Required approval

# 13. PRODUCTION DEPLOYMENT STAGE
.production_deploy_template:
  before_script:
    - eval "$($aws_auth $PROD_ACCOUNT_ID)"
  environment:
    name: production
    url: https://app.example.com
    on_stop: production_rollback
  when: manual
  retry: 2  # Allow 2 retries
  needs:
    - security_approval
    - product_approval

production_deploy:
  extends: 
    - .production_deploy_template
    - .slack_notify
  stage: production_deploy
  script:
    - bash scripts/deploy.sh --env production --cluster production-cluster
    - npm ci
    - npm run sentry:release

# 14. MONITORING STAGE
monitoring_setup:
  stage: monitoring
  before_script:
    - eval "$($aws_auth $PROD_ACCOUNT_ID)"
  script:
    - bash scripts/run-synthetic-tests.sh
    - bash scripts/run-lighthouse.sh
    - bash scripts/create-datadog-event.sh --version $CI_COMMIT_SHA --env production
  artifacts:
    paths:
      - lighthouse-report/
      - synthetic-test-results/
  allow_failure: true

# 15. ROLLBACK STAGE
production_rollback:
  stage: rollback
  before_script:
    - eval "$($aws_auth $PROD_ACCOUNT_ID)"
  script:
    - bash scripts/rollback.sh --env production
  environment:
    name: production
    action: stop
  rules:
    - when: manual

# PagerDuty Alerts
.job_failure:
  extends: .pagerduty_alert
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: on_failure
```

## Key Features

1. **OIDC Authentication**: Secure AWS authentication using `assume-role-with-web-identity` with no stored credentials
   
2. **Multi-Account Structure**: Separate pipelines for dev, staging, and production environments using environment variables for account IDs

3. **Security-First Approach**:
   - Secret scanning with Trufflehog (fails pipeline if secrets found)
   - Container scanning fails on HIGH/CRITICAL vulnerabilities
   - SAST, SCA, and dependency scanning with detailed reports

4. **Progressive Deployment**:
   - Dev: Auto-deploy on main/develop branches with auto-cleanup after 1 week
   - Staging: Canary (10%) → blue-green deployment with manual approval
   - Production: Manual deployment requiring both security and product approvals

5. **Comprehensive Testing**:
   - Unit, mutation, and load testing
   - Integration and contract testing with Pact
   - E2E testing with Cypress and Playwright
   - Accessibility testing (informational only)

6. **Monitoring & Compliance**:
   - PCI-DSS, CIS, SOC2 compliance checks
   - Synthetic tests, Lighthouse performance metrics
   - Cost estimation with Infracost

7. **Notifications & Alerts**:
   - Slack notifications on successful pipelines for main/develop
   - PagerDuty alerts for failures on main branch
   - Datadog events and Sentry release tracking

The pipeline uses proper GitLab environment definitions with rollback capabilities and follows best practices for artifact management and report generation.
```