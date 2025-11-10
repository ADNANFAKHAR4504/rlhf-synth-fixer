# Enterprise-Grade GitLab CI/CD Pipeline for Multi-Account AWS Infrastructure

We need a comprehensive, production-ready GitLab CI/CD pipeline for our AWS CDK infrastructure that meets enterprise standards. We're running GitLab Community Edition, so everything needs to use our private container registry.

## Context

We're a fintech company deploying to three AWS accounts (dev, staging, prod) with strict compliance requirements (PCI-DSS, SOC2, HIPAA). Our current manual deployment process doesn't scale and we need full automation with proper gates and monitoring.

## Core Requirements

### Authentication & Security
- Use GitLab OIDC with AWS (no stored credentials)
- All container images must come from our private GitLab registry ($CI_REGISTRY)
- Implement AWS STS assume-role-with-web-identity for all AWS operations
- Role ARN pattern: arn:aws:iam::${AWS_ACCOUNT_ID}:role/GitLabCIRole

### Multi-Stage Pipeline Architecture

**Stage 1: Validation**
- Lint code, YAML files, Dockerfiles
- Dependency vulnerability scanning (npm audit)
- License compliance checking

**Stage 2: Build**
- CDK synthesis with artifact generation
- Application bundling
- Container image builds (when Dockerfile changes)

**Stage 3: Testing**
- Unit tests with code coverage reporting
- Mutation testing (optional, can fail)
- Performance testing (Lighthouse, K6 load tests, Artillery)

**Stage 4: Security Scanning**
- SAST (Semgrep)
- Secret detection (Trufflehog) - must not allow failure
- Software Composition Analysis (Snyk)
- CDK Nag for infrastructure
- DAST scanning
- Container scanning with Trivy AND Grype
- Generate SBOM for containers

**Stage 5: Compliance**
- CIS benchmark checks (Checkov)
- PCI-DSS compliance (Prowler)
- HIPAA compliance (Prowler)
- SOC2 audit checks
- Infrastructure drift detection (scheduled)
- Cost estimation with Infracost

**Stage 6: Dev Deployment**
- Auto-deploy to dev on main/develop branches
- Needs: build + cdk-nag + unit tests to pass
- Should have auto-cleanup after 1 week

**Stage 7: Integration Testing**
- API integration tests
- Database integration tests
- Contract testing with Pact

**Stage 8: Canary Deployment**
- Deploy to canary environment (10% traffic)
- Manual approval required
- Kubernetes-based with EKS

**Stage 9: Smoke Testing**
- Canary smoke tests with Postman/Newman
- Monitor canary metrics with Datadog

**Stage 10: Staging Deployment**
- Promote canary to full staging
- Blue-green deployment strategy
- Manual approval after canary validation

**Stage 11: E2E Testing**
- Cypress E2E tests
- Playwright E2E tests
- Accessibility testing (a11y with Axe)

**Stage 12: Production Approvals**
- Require BOTH security team AND product team approval
- Separate manual approval jobs

**Stage 13: Production Deployment**
- Full production deployment with kubectl/EKS
- Retry up to 2 times on runner failures
- Manual trigger only

**Stage 14: Monitoring**
- Production smoke tests
- Create Sentry release
- Create Datadog deployment event
- Run synthetic monitoring tests

**Stage 15: Rollback**
- Manual rollback capability for production

### Deployment Strategies
- **Dev**: Standard deployment
- **Canary**: 10% traffic split to canary environment
- **Staging**: Blue-green deployment
- **Production**: Standard with kubectl

### Kubernetes Integration
Need a `.kubectl_setup` anchor that:
- Configures kubectl with EKS cluster
- Sets namespace context
- Should be extended by canary, staging blue-green, and production jobs

### Script Organization
Keep inline scripts under 5 lines. Anything longer should go in scripts/:
- scripts/deploy.sh (standard deployments)
- scripts/deploy-canary.sh
- scripts/deploy-blue-green.sh
- scripts/promote-canary.sh
- scripts/rollback.sh
- scripts/run-dast.sh
- scripts/run-prowler.sh
- scripts/run-soc2-audit.sh
- scripts/run-lighthouse.sh
- scripts/monitor-canary.sh
- scripts/create-datadog-event.sh
- scripts/run-synthetic-tests.sh
- scripts/run-a11y-tests.sh
- scripts/notify-pagerduty.sh

### Artifact Management
All jobs generating reports/artifacts should:
- Expire in 1 week
- Use proper GitLab artifact reporting (junit, coverage, SAST, etc.)
- Share artifacts between dependent jobs

### Coverage & Quality
- Unit tests should report coverage with regex: `/Lines\s*:\s*(\d+\.\d+)%/`
- Use Cobertura format for coverage reports
- Store test results as JUnit XML

### Notifications
- Slack webhooks for all main/develop pipeline completions
- PagerDuty alerts on failures (main branch only)

### Environment Configuration
Proper GitLab environments with:
- Deployment tiers (development, staging, production)
- Environment URLs
- Stop actions for dev cleanup
- Rollback actions for production

### Technology Stack
- Node 22 for CDK/application
- Docker 24 for container builds
- EKS for Kubernetes clusters
- Sentry for error tracking
- Datadog for monitoring

### Private Registry Images
Everything must use $CI_REGISTRY/category/tool:version pattern:
- Infrastructure: node, alpine, docker, curl, driftctl, infracost
- Security: semgrep, trufflehog, snyk, trivy, grype, syft, zap, checkov, prowler, hadolint, license-checker, cloudquery
- Testing: lighthouse, k6, artillery, postman, cypress, playwright, pact, axe
- Monitoring: datadog, sentry-cli

### Performance & Optimization
- Cache node_modules with branch-specific keys
- Run jobs in parallel where possible
- Use `only: changes:` for Dockerfile/src builds
- Use `only: schedules` for drift detection

### Compliance Requirements
- Secret scanning must fail pipeline (allow_failure: false)
- PCI/HIPAA/SOC2 scans can be informational (allow_failure: true)
- Container vulnerabilities (HIGH/CRITICAL) should block
- Accessibility tests can be informational

## Current State
We're using Node 22, CDK 2.x, and have EKS clusters named:
- dev-cluster (not used, CDK direct deploy)
- staging-cluster (for canary and blue-green)
- production-cluster

Account IDs are stored as GitLab CI variables: $DEV_ACCOUNT_ID, $STAGING_ACCOUNT_ID, $PROD_ACCOUNT_ID

## Success Criteria
- Zero hardcoded credentials or account IDs
- All images from private registry
- Proper gate checks before production
- Full audit trail with artifacts
- Compliance scanning for fintech requirements
- Canary → Blue-Green → Production progression
- Monitoring and rollback capabilities
