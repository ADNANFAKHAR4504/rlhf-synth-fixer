# Task: Enterprise Multi-Account CI/CD Pipeline (GitLab)

## Objective
Design and implement a GitLab CI/CD pipeline (`ci-cd.yml`) for a multi-account AWS setup covering **dev**, **staging**, and **production** environments.  
The pipeline must use **OIDC-based authentication** to AWS (no stored credentials) and follow a **structured, secure, and auditable 15-stage workflow**.

---

## Pipeline Requirements

1. **Validation stage** — linting, license check, npm audit.  
2. **Build stage** — CDK synth and container builds using private `$CI_REGISTRY`.  
3. **Testing stage** — unit tests with coverage, mutation tests, and K6 load tests.  
4. **Security stage** — Semgrep (SAST), Trufflehog (secret scan, blocking), Snyk (SCA), CDK Nag, Trivy + Grype scans, SBOM generation.  
5. **Compliance stage** — Checkov (CIS), Prowler (PCI-DSS), Infracost (cost estimation).  
6. **Dev deploy stage** — auto-deploy on main/develop branches; cleanup after 1 week.  
7. **Integration testing** — API and contract tests using Pact.  
8. **Canary deploy** — 10% traffic to staging EKS, manual approval required.  
9. **Smoke testing** — Newman tests validating canary rollout.  
10. **Staging deployment** — blue-green strategy with manual approval after canary.  
11. **E2E testing** — Cypress + Playwright with accessibility (Axe) tests.  
12. **Production approval** — manual approvals from both security and product teams.  
13. **Production deployment** — EKS deploy with retry (2x) and manual trigger only.  
14. **Monitoring** — Sentry, Datadog, synthetic, and Lighthouse tests.  
15. **Rollback stage** — manual rollback capability for production.

---

## Authentication and Configuration

- Use **AWS STS assume-role-with-web-identity** with role pattern:  
  `arn:aws:iam::${ACCOUNT_ID}:role/GitLabCIRole`  
- No hardcoded credentials or account IDs.  
- Use `$DEV_ACCOUNT_ID`, `$STAGING_ACCOUNT_ID`, and `$PROD_ACCOUNT_ID`.  
- Node 22 and Docker 24 required.  
- All images pulled from `$CI_REGISTRY`.  
- Branch-specific caching for `node_modules`.

---

## Artifacts and Reports

- Artifacts expire in **1 week**.  
- Include **JUnit**, **Cobertura**, and **SAST** reports where applicable.  
- Coverage regex: `/Lines\s*:\s*(\d+\.\d+)%/`.

---

## Security and Compliance

- **Trufflehog** secret scan must **fail the pipeline** if secrets are found.  
- Container scans must fail for **HIGH** or **CRITICAL** vulnerabilities.  
- Accessibility (a11y) tests are informational only.  
- Compliance includes **PCI-DSS, CIS, HIPAA, and SOC2**.

---

## Environments and Deployment Strategy

- **Development** — auto-deploy on main/develop; auto-cleanup after 1 week.  
- **Staging** — canary (10%) → blue-green rollout with manual approval.  
- **Production** — manual trigger only, requires both approvals.  
- EKS clusters:  
  - `staging-cluster` (for canary/blue-green)  
  - `production-cluster` (for prod deploy)  
- GitLab environments must include stop/rollback actions.

---

## Monitoring and Notifications

- Slack notifications on success for **main/develop**.  
- PagerDuty alerts on main branch failures.  
- Datadog events and Sentry release updates after production deploy.

---

## Script Management

All scripts longer than 5 lines must live in `scripts/` directory.

**Required scripts:**  
`deploy.sh`, `deploy-canary.sh`, `deploy-blue-green.sh`, `promote-canary.sh`, `rollback.sh`,  
`run-dast.sh`, `run-prowler.sh`, `run-soc2-audit.sh`, `run-lighthouse.sh`, `monitor-canary.sh`,  
`create-datadog-event.sh`, `run-synthetic-tests.sh`, `run-a11y-tests.sh`, `notify-pagerduty.sh`.

---

## Deliverable

A single deployable file: **`lib/ci-cd.yml`**  
It should be production-ready, follow best practices, and use **zero static secrets** while maintaining full auditability.
