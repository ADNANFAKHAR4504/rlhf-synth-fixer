You are an expert DevOps engineer and GitHub Actions author.
Write a single GitHub Actions workflow file at .github/workflows/ci-cd.yml.
Output only valid YAML, no comments or explanations outside YAML.

Context:
- Project: e-commerce microservices on AWS.
- Infra: Terraform, ECS Fargate, RDS, ElastiCache, SQS, CloudFront, ALB.
- Traffic: 2M transactions per day.
- Compliance: strict PCI-DSS for all environments.

Global rules:
- Use OIDC only for AWS auth with aws-actions/configure-aws-credentials@v4.
- Never use static AWS keys.
- AWS role: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/GitHubActionsRole.
- Primary region: us-east-1.
- All containers push to private ECR in us-east-1.
- Multi-account: dev, staging, production via Terraform workspaces dev, staging, prod.
- Prevent parallel deploys per environment using concurrency groups.
- All inline shell run blocks must be 5 lines or fewer.
- Any shell logic needing more than 5 lines must be moved to scripts/ and called.
- Use these reusable scripts for long logic, no inlined bodies:
  - scripts/deploy-ecs.sh
  - scripts/deploy-blue-green.sh
  - scripts/run-migrations.sh
  - scripts/rollback-migrations.sh
  - scripts/rollback-ecs.sh
  - scripts/validate-pci.sh
  - scripts/generate-compliance-report.sh
  - scripts/update-monitoring.sh

Actions to use:
- actions/checkout@v4
- actions/setup-node@v4
- actions/setup-go@v5
- hashicorp/setup-terraform@v3
- aws-actions/configure-aws-credentials@v4
- docker/build-push-action@v5
- Upload and download artifacts using official GitHub Actions.

Caching:
- npm cache using package-lock.json hash.
- Go modules cache using go.sum hash.
- Terraform plugin and .terraform directory cache.

General workflow triggers:
- on push to main and feature branches (e.g. feature/*).
- on pull_request to main.
- on workflow_dispatch for production deploy and rollback flows.

Global env:
- Define AWS_REGION=us-east-1.
- Set ECR base registry: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com.
- Use distinct ECR repos per service: order-service, payment-service, inventory-service, notification-service.
- Use image tags based on ${{ github.sha }}.

Job: validation
- Runs on every push and pull_request.
- Steps:
  - Checkout.
  - Setup Node 20.
  - Setup Go 1.22.
  - Setup Terraform.
  - Run terraform fmt -check.
  - Run terraform validate.
  - Run tflint.
  - Run tfsec.
  - Run checkov for Terraform compliance.
  - Run shellcheck on all bash scripts.
  - Run markdown lint (e.g. markdownlint) on docs.
  - Run YAML validation on workflow and config files.
- All run steps must keep shell bodies 5 lines or fewer.

Job: build
- Needs: validation.
- Steps:
  - Checkout.
  - Setup Node 20 with npm cache.
  - Setup Go 1.22 with module cache.
  - Login to ECR via OIDC using aws-actions/configure-aws-credentials@v4 and aws ecr get-login-password.
  - Build and push Docker images for 4 services using docker/build-push-action@v5:
    - order-service
    - payment-service
    - inventory-service
    - notification-service
  - Each image pushed to ECR repo service-name with tag ${{ github.sha }}.
  - Build frontend (Node.js) using npm ci and npm run build.
  - Run terraform init and terraform plan for current branch.
  - Upload terraform plan as artifact for later jobs.
- No run block exceeds 5 lines.
- Use artifacts for build outputs when needed.

Job: test
- Needs: build.
- Steps:
  - Checkout.
  - Setup Node 20 and Go 1.22.
  - Restore build artifacts when needed.
  - Run Jest tests for frontend with @testing-library/react.
  - Run Go unit tests for all 4 services using testify.
  - Run integration tests using testcontainers.
  - Run contract tests using Pact for inter-service communication.
  - Run Vegeta performance tests at 10k RPS against test endpoints.
  - Collect JUnit XML reports and Cobertura coverage.
  - Upload test and coverage reports as artifacts.
- Ensure Vegeta checks p95 and error rate thresholds and fails on breaches.
- Keep each run script body 5 lines or fewer.

Job: security
- Needs: test.
- Steps:
  - Checkout.
  - Setup Node and Go.
  - Run Snyk container scans against built images, failing on HIGH severity or above.
  - Run Trivy filesystem and container scans.
  - Upload Trivy SARIF to GitHub Security tab.
  - Generate SBOM with Grype for images.
  - Run Semgrep SAST over code.
  - Run TruffleHog secret scanning and fail workflow on any secret found.
  - Run Prowler for PCI-DSS checks.
  - Run Parliament to validate IAM policies.
  - Upload security and compliance artifacts (JSON or SARIF).
- All complex scan commands should keep run blocks within 5 lines.

Job: infrastructure-preview
- Runs on pull_request only.
- Needs: security.
- Steps:
  - Checkout.
  - Setup Terraform and AWS via OIDC.
  - Run terraform init and terraform plan for PR branch, without apply.
  - Upload plan as artifact.
  - Use Infracost to generate cost estimate and upload report.
  - Run driftctl to detect drift against production.
  - Post PR comment summarizing plan changes, cost impact, and drift.
- All comments generated via a single short script or tool command.

Job: deploy-dev
- Runs on push to main only.
- Needs: validation, build, test, security.
- concurrency group: deploy-dev to avoid parallel dev deploys.
- environment: development with url https://dev.shop.example.com.
- Steps:
  - Checkout.
  - Configure AWS credentials for dev account via OIDC.
  - Setup Terraform.
  - Run terraform init and terraform apply using workspace dev.
  - Update ECS Fargate services for all 4 microservices with new images.
  - Run database migrations on dev using Flyway via scripts/run-migrations.sh.
  - Verify ElastiCache Redis health in dev.
  - Check ALB target group health.
- For complex deployment logic use scripts/deploy-ecs.sh.

Job: integration-test
- Needs: deploy-dev.
- Steps:
  - Checkout.
  - Run Postman or Newman API tests against https://dev.shop.example.com.
  - Run database transaction tests.
  - Test cache invalidation behavior.
  - Validate SQS based message processing.
  - Upload integration test reports and logs as artifacts.

Job: deploy-staging
- Needs: integration-test.
- concurrency group: deploy-staging.
- environment: staging with url https://staging.shop.example.com and protection rules.
- Runs only when branch is main and after manual approval using environment protection.
- Steps:
  - Checkout.
  - Configure AWS credentials for staging via OIDC.
  - Setup Terraform.
  - Apply Terraform with workspace staging.
  - Perform blue-green deployment on ECS using two target groups and ALB listener switching.
  - Run database migrations with rollback capability.
  - Use scripts/deploy-blue-green.sh and scripts/run-migrations.sh for complex steps.

Job: e2e-test
- Needs: deploy-staging.
- Steps:
  - Checkout.
  - Run Playwright tests simulating complete purchase flow on staging.
  - Test payment gateway integrations using test cards.
  - Validate order fulfillment workflow including inventory updates.
  - Verify notification delivery (email or SMS).
  - Run accessibility tests with axe-core.
  - Upload E2E test and accessibility reports.

Job: security-scan-live
- Needs: e2e-test.
- Steps:
  - Checkout.
  - Run OWASP ZAP DAST against staging with authenticated scans.
  - Run SQLMap against staging database related endpoints carefully.
  - Run Nuclei scans for known vulnerabilities.
  - Upload all DAST and scan reports as artifacts.
- Ensure scans respect rate limits and do not overload staging.

Job: performance-test
- Needs: security-scan-live.
- Steps:
  - Checkout.
  - Run K6 load test ramping from 100 to 5000 VUs over 10 minutes.
  - Ensure p95 latency under 500ms and error rate under 0.1 percent.
  - Run Apache JMeter for sustained load at 80 percent capacity for 30 minutes.
  - Use AWS X-Ray to analyze traces and bottlenecks.
  - Upload detailed performance test results and SLO checks.
- Fail job if SLOs are not met.

Job: compliance-validation
- Needs: performance-test.
- Steps:
  - Checkout.
  - Configure AWS credentials for each account as needed via OIDC.
  - Run Prowler PCI-DSS checks again across dev, staging, and prod accounts.
  - Verify CloudTrail logging, encryption at rest for RDS and S3, and VPC flow logs.
  - Review Security Hub findings for critical or high issues.
  - Generate a compliance report using scripts/validate-pci.sh and scripts/generate-compliance-report.sh.
  - Upload compliance reports as JSON artifacts.

Job: deploy-prod-approval
- Needs: compliance-validation.
- environment: production with url https://shop.example.com.
- concurrency group: deploy-prod.
- This job does not change infra.
- Used to gate deploy-production by requiring approvals from security and ops via environment protection.
- Simple job that succeeds after environment approval only.

Job: deploy-production
- Trigger: workflow_dispatch only.
- Needs: compliance-validation and deploy-prod-approval.
- environment: production with url https://shop.example.com.
- concurrency group: deploy-prod.
- Steps:
  - Checkout.
  - Configure AWS credentials for production via OIDC.
  - Setup Terraform.
  - Apply Terraform using workspace prod.
  - Perform rolling ECS deployment with 25 percent increments and circuit breaker.
  - Enable rollback on two failed health checks.
  - Create or update CloudWatch alarms.
  - Use scripts/deploy-ecs.sh and scripts/run-migrations.sh when logic exceeds 5 lines.
- Configure job retry for runner failures up to 2 times.

Job: smoke-test
- Needs: deploy-production.
- Steps:
  - Checkout.
  - Run Postman smoke tests against https://shop.example.com.
  - Verify synthetic purchase transactions.
  - Check health of all 4 microservices.
  - Validate payment gateway connectivity.
  - Check CDN via CloudFront urls.
  - Test database connection pooling.
  - Upload smoke test logs.

Job: monitoring
- Needs: smoke-test.
- Steps:
  - Checkout.
  - Call scripts/update-monitoring.sh to:
    - Create Datadog deployment event with changelog.
    - Create New Relic deployment marker.
    - Create Sentry release with commit metadata.
    - Update CloudWatch dashboards and verify X-Ray service map.
    - Configure or update PagerDuty on call schedule.
  - Upload monitoring config and logs as artifacts.

Job: rollback
- Trigger: workflow_dispatch only.
- concurrency group: deploy-prod.
- environment: production.
- Steps:
  - Checkout.
  - Configure AWS credentials for target account via OIDC.
  - Select correct Terraform workspace.
  - Roll back ECS services to previous task definitions using scripts/rollback-ecs.sh.
  - Run database rollback migrations via scripts/rollback-migrations.sh.
  - Clear caches where needed.
  - Verify health checks after rollback.
  - Upload rollback logs and reports.

Artifacts required:
- Terraform plans.
- Test reports as JUnit XML.
- Coverage as Cobertura.
- Security and container scan SARIF files.
- Compliance reports as JSON.
- Performance test outputs.

Final requirements:
- YAML must be valid for GitHub Actions.
- Use matrix or reuse patterns where it helps but keep readability high.
- Respect all inline script 5 line limits.
- Respect OIDC only, no static AWS keys.
