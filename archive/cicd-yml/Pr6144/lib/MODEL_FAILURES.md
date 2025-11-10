# Model Failures and Corrections - Enterprise GitLab CI Pipeline

## Critical Issue: Public Docker Hub Images (Affects 30+ Jobs)

**Problem**: Model used public Docker Hub images throughout the pipeline instead of private GitLab Container Registry

**Examples of violations:**
```yml
image: node:22-alpine  # Should be: $CI_REGISTRY/infrastructure/node:22-alpine

lint:code:
  image: node:22-alpine  # Public

lint:yaml:
  image: alpine:latest  # Public

lint:dockerfile:
  image: hadolint/hadolint:latest  # Public

validate:license:
  image: license-checker:latest  # Public

build:
  image: node:22  # Public

security:sast:
  image: returntocorp/semgrep:latest  # Public

security:secrets:
  image: trufflesecurity/trufflehog:latest  # Public

security:sca:
  image: snyk/snyk:latest  # Public

security:dast:
  image: owasp/zap2docker-stable:latest  # Public

compliance:cis:
  image: bridgecrew/checkov:latest  # Public

compliance:pci-dss:
  image: prowler:latest  # Public

compliance:hipaa:
  image: prowler:latest  # Public

compliance:soc2:
  image: cloudquery/cloudquery:latest  # Public

drift:detection:
  image: snyk/driftctl:latest  # Public

cost:estimation:
  image: infracost/infracost:latest  # Public

container:build:
  image: docker:24  # Public
  services:
    - docker:24-dind  # Public

container:scan:trivy:
  image: aquasec/trivy:latest  # Public

container:scan:grype:
  image: anchore/grype:latest  # Public

container:sbom:
  image: anchore/syft:latest  # Public

performance:lighthouse:
  image: googlechrome/lighthouse:latest  # Public

performance:k6:
  image: grafana/k6:latest  # Public

performance:artillery:
  image: artilleryio/artillery:latest  # Public

test:integration:contract:
  image: pactfoundation/pact-cli:latest  # Public

test:smoke:canary:
  image: postman/newman:latest  # Public

monitor:canary:metrics:
  image: datadog/agent:latest  # Public

test:e2e:cypress:
  image: cypress/included:latest  # Public

test:e2e:playwright:
  image: mcr.microsoft.com/playwright:latest  # Public

test:accessibility:
  image: axe-core/cli:latest  # Public

approval:security:
  image: alpine:latest  # Public

approval:product:
  image: alpine:latest  # Public

test:smoke:production:
  image: postman/newman:latest  # Public

monitor:sentry:release:
  image: getsentry/sentry-cli:latest  # Public

monitor:datadog:deployment:
  image: datadog/agent:latest  # Public

monitor:synthetic:
  image: datadog/synthetics-ci:latest  # Public

notify:slack:
  image: curlimages/curl:latest  # Public

notify:pagerduty:
  image: curlimages/curl:latest  # Public
```

**Fixed**: All images must use `$CI_REGISTRY/category/tool:version` pattern for GitLab CE private registry:
```yml
image: $CI_REGISTRY/infrastructure/node:22-alpine

lint:code:
  # Uses global default image

lint:yaml:
  image: $CI_REGISTRY/infrastructure/alpine:latest

lint:dockerfile:
  image: $CI_REGISTRY/security/hadolint:latest

validate:license:
  image: $CI_REGISTRY/security/license-checker:latest

security:sast:
  image: $CI_REGISTRY/security/semgrep:latest

security:secrets:
  image: $CI_REGISTRY/security/trufflehog:latest

security:sca:
  image: $CI_REGISTRY/security/snyk:latest

security:cdk-nag:
  image: $CI_REGISTRY/infrastructure/node:22

security:dast:
  image: $CI_REGISTRY/security/zap:latest

compliance:cis:
  image: $CI_REGISTRY/security/checkov:latest

compliance:pci-dss:
  image: $CI_REGISTRY/security/prowler:latest

compliance:hipaa:
  image: $CI_REGISTRY/security/prowler:latest

compliance:soc2:
  image: $CI_REGISTRY/security/cloudquery:latest

drift:detection:
  image: $CI_REGISTRY/infrastructure/driftctl:latest

cost:estimation:
  image: $CI_REGISTRY/infrastructure/infracost:latest

container:build:
  image: $CI_REGISTRY/infrastructure/docker:24
  services:
    - $CI_REGISTRY/infrastructure/docker:24-dind

container:scan:trivy:
  image: $CI_REGISTRY/security/trivy:latest

container:scan:grype:
  image: $CI_REGISTRY/security/grype:latest

container:sbom:
  image: $CI_REGISTRY/security/syft:latest

performance:lighthouse:
  image: $CI_REGISTRY/testing/lighthouse:latest

performance:k6:
  image: $CI_REGISTRY/testing/k6:latest

performance:artillery:
  image: $CI_REGISTRY/testing/artillery:latest

test:integration:contract:
  image: $CI_REGISTRY/testing/pact:latest

test:smoke:canary:
  image: $CI_REGISTRY/testing/postman:latest

monitor:canary:metrics:
  image: $CI_REGISTRY/monitoring/datadog:latest

test:e2e:cypress:
  image: $CI_REGISTRY/testing/cypress:latest

test:e2e:playwright:
  image: $CI_REGISTRY/testing/playwright:latest

test:accessibility:
  image: $CI_REGISTRY/testing/axe:latest

approval:security:
  image: $CI_REGISTRY/infrastructure/alpine:latest

approval:product:
  image: $CI_REGISTRY/infrastructure/alpine:latest

test:smoke:production:
  image: $CI_REGISTRY/testing/postman:latest

monitor:sentry:release:
  image: $CI_REGISTRY/monitoring/sentry-cli:latest

monitor:datadog:deployment:
  image: $CI_REGISTRY/monitoring/datadog:latest

monitor:synthetic:
  image: $CI_REGISTRY/monitoring/datadog:latest

notify:slack:
  image: $CI_REGISTRY/infrastructure/curl:latest

notify:pagerduty:
  image: $CI_REGISTRY/infrastructure/curl:latest
```

**Location**: Global image declaration and 30+ job-specific image declarations
**Severity**: CRITICAL - Security and compliance requirement for GitLab CE

---

## Issue 2: Inline Deployment Command in deploy:dev

**Problem**: Used inline CDK deploy command instead of external script
```yml
deploy:dev:
  script:
    - npm ci
    - npx cdk deploy --all --require-approval never --context environment=dev
```

**Fixed**: Use external deployment script
```yml
deploy:dev:
  script:
    - npm ci
    - ./scripts/deploy.sh
```

**Location**: deploy:dev job script section
**Severity**: Medium - Script organization policy

---

## Issue 3: Inline kubectl Commands in deploy:canary (>5 Lines)

**Problem**: Canary deployment had inline kubectl commands
```yml
deploy:canary:
  script:
    - npm ci
    - npx kubectl apply -f k8s/canary.yml
    - npx kubectl set image deployment/app app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
# Total: 3 lines in script section - but this could grow
```

**Fixed**: Use external canary deployment script
```yml
deploy:canary:
  script:
    - npm ci
    - ./scripts/deploy-canary.sh
```

**Location**: deploy:canary job
**Severity**: Medium - Script organization and maintainability

---

## Issue 4: Missing `only` Restrictions on Validation Jobs

**Problem**: Some validation jobs missing branch restrictions for efficiency
```yml
validate:dependencies:
  # Missing: only: - merge_requests / - main

validate:license:
  # Missing: only: - merge_requests / - main
```

**Fixed**: Added appropriate restrictions
```yml
validate:dependencies:
  only:
    - merge_requests
    - main

validate:license:
  only:
    - merge_requests
    - main
```

**Location**: validate:dependencies, validate:license jobs
**Severity**: Low - Pipeline efficiency

---

## Issue 5: compliance:cis Missing AWS Credentials

**Problem**: CIS compliance job needs AWS credentials but doesn't extend .aws_credentials
```yml
compliance:cis:
  image: bridgecrew/checkov:latest
  variables:
    AWS_ACCOUNT_ID: $DEV_ACCOUNT_ID
  # Missing: extends: .aws_credentials
```

**Fixed**: Added AWS credentials extension
```yml
compliance:cis:
  extends: .aws_credentials
  variables:
    AWS_ACCOUNT_ID: $DEV_ACCOUNT_ID
```

**Location**: compliance:cis job
**Severity**: High - Job would fail without AWS access

---

## Issue 6: Missing `only` Restrictions on cost:estimation

**Problem**: Cost estimation runs on all branches instead of MRs and main
```yml
cost:estimation:
  needs:
    - build
  # Missing: only: - merge_requests / - main
```

**Fixed**: Added restrictions
```yml
cost:estimation:
  only:
    - merge_requests
    - main
```

**Location**: cost:estimation job
**Severity**: Low - Pipeline efficiency

---

## Issue 7: Missing `only` Restrictions on Performance Tests

**Problem**: Performance tests run on all branches
```yml
performance:lighthouse:
  # Missing: only: - merge_requests / - main

performance:k6:
  # Missing: only: - merge_requests / - main

performance:artillery:
  # Missing: only: - merge_requests / - main
```

**Fixed**: Added restrictions
```yml
performance:lighthouse:
  only:
    - merge_requests
    - main

performance:k6:
  only:
    - merge_requests
    - main

performance:artillery:
  only:
    - merge_requests
    - main
```

**Location**: All performance test jobs
**Severity**: Low - Resource optimization

---

## Issue 8: Missing `only` Restrictions on Security Jobs

**Problem**: Some security jobs missing restrictions
```yml
security:sast:
  only:
    - merge_requests
    - main  # Has it

security:secrets:
  only:
    - merge_requests
    - main  # Has it

security:sca:
  # Missing restrictions

security:cdk-nag:
  only:
    - merge_requests
    - main  # Has it

security:dast:
  # Missing restrictions
```

**Fixed**: Added restrictions to all security jobs
```yml
security:sca:
  only:
    - merge_requests
    - main

security:dast:
  only:
    - merge_requests
    - main
```

**Location**: security:sca, security:dast jobs
**Severity**: Low - Pipeline efficiency

---

## Summary

**Critical Issues (GitLab CE Requirement)**: 1
- All Docker images using public registries instead of $CI_REGISTRY (30+ jobs affected)

**High Severity Issues**: 1
- Missing AWS credentials for CIS compliance scanning

**Medium Severity Issues**: 2
- Inline CDK deploy command instead of external script
- Inline kubectl commands in canary deployment

**Low Severity Issues**: 5
- Missing branch restrictions on validation jobs (2 jobs)
- Missing branch restrictions on cost estimation
- Missing branch restrictions on performance tests (3 jobs)
- Missing branch restrictions on security jobs (2 jobs)

**Total Issues Fixed**: 9 categories affecting 40+ jobs

**Key Takeaway**: The model correctly implemented:
- ✅ OIDC authentication with AWS
- ✅ Complex multi-stage pipeline architecture
- ✅ Canary and blue-green deployment strategies
- ✅ Comprehensive security and compliance scanning
- ✅ Proper artifact management and job dependencies
- ✅ Monitoring and rollback capabilities

But missed:
- ❌ Private registry requirement for GitLab CE (critical for fintech compliance)
- ❌ Script externalization in a few deployment jobs
- ❌ Some branch restrictions for pipeline efficiency
