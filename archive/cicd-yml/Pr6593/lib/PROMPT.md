---

You are an expert in CI/CD and cloud automation. Please generate a complete `.circleci/config.yml` (for CircleCI version 2.1) to deploy a multi-tenant B2B SaaS platform to AWS with tenant isolation using these major building blocks:  
- Kubernetes (EKS) for application workloads
- Amazon RDS Aurora (with per-tenant database isolation)
- ElastiCache for in-memory caching
- Cognito for authentication

**Core requirements for the CircleCI config:**

- **Everything must be deployed using OIDC authentication to AWS (no static access keys).**
- Use orbs:
  - `aws-cli: circleci/aws-cli@4.1`
  - `kubernetes: circleci/kubernetes@1.3`
  - `terraform: circleci/terraform@3.2`
  - `snyk: snyk/snyk@2.0`
  - `node: circleci/node@5.1`
  - `docker: circleci/docker@2.4`
- Define three custom executors:
  - **node-executor:** Docker image `${PRIVATE_REGISTRY}/node:20-alpine` with resource_class `medium`
  - **docker-executor:** Machine image `ubuntu-2204:current` for Docker builds
  - **terraform-executor:** Docker image `${PRIVATE_REGISTRY}/hashicorp/terraform:1.6`
- **Custom commands:**
  - `assume-aws-role` – wraps `aws-cli/setup`, consuming role ARN from context
  - `install-kubectl` – downloads kubectl v1.28 and Helm v3.13
  - `setup-tenant-context` – chooses kubeconfig & namespace per-tenant
- **Workflow jobs include:**
  - Code validation (checkout, lint, TypeScript, prettier, store results)
  - Infrastructure validation and security (terraform fmt, validate, tflint, tfsec, checkov)
  - Dependency scanning using Snyk and npm audit
  - Docker build & multi-arch push with cache, Trivy scanning, store reports
  - Terraform infrastructure build, plan/apply (workspace per env), store plan/artifacts
  - Unit and integration tests (Jest, Docker Compose, Pact contracts, E2E parallelization)
  - Security scan (semgrep, trufflehog, grype, checkov on k8s manifests)
  - Performance tests (k6, artillery, HTML report artifacts)
  - Environment deployments for dev, staging (blue/green), and production (rolling, canary)
  - Validation: integration/E2E/API/tenant isolation, security, compliance, smoke/prod tests
  - Monitoring setup (Datadog, Cloudwatch dashboards, PagerDuty, Sentry)
  - Rollback mechanisms (manual trigger, full rollback of all affected resources)
- **Workflows:** must encode build, test, deploy, verify, security, compliance, and approval flow as described (include all dependencies, parallelization, and filtering/approval logic).
- Use **contexts** for environment variable management (`aws-dev`, `aws-staging`, `aws-prod`), each holding the OIDC role ARN and AWS account ID.
- Every build and deployment step should store artifacts and test/security reports with a 7-day retention.
- Reference all external scripts (like `configure-tenant-isolation.sh`, `deploy-blue-green.sh`, etc.).
- Ensure that no AWS static secret keys are present—CircleCI authentication with AWS must use OIDC.
- Service images (for all 8 microservices) must be built, pushed, scanned, and deployed to AWS ECR with tags based on commit SHA.
- Use database and cache proxies, local Cognito for integration tests.
- Implement canary and blue-green deployment strategies, rolling updates (with Route53 weight), and health-check/audit steps before switching production traffic.
- Mandate security and compliance validation (Prowler for PCI-DSS, AWS Config rules, custom tenant isolation checks).
- Coverage, performance, and smoke/regression testing must be parallelized efficiently.
- Approval gates before production deploy; rollback on failure as a manual step.

**Your output must:**
- Use version 2.1 syntax only.
- Clearly organize orbs, executors, commands, jobs, workflows, and contexts as described.
- Use parameterized, modular, and reusable YAML constructs where possible.
- Document all key sections and reference where OIDC and context-based authentication is used.
- **Do NOT change, reinterpret, or omit any pipeline step, orb, or config item from the requirements above.**
- All artifact and secrets management must be secure by default.
- The resulting YAML must be ready to use or adapt in a modern, cloud-native SaaS organization.

Now generate the full `.circleci/config.yml` for this SaaS B2B platform CI/CD deployment pipeline.