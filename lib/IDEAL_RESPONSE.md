# Library Reference

This document enumerates every non-Markdown asset under `lib/` (excluding Terraform provider binaries/state). Each section preserves the complete file contents within an appropriate code fence.

## ci-cd.yml

```yaml
# CircleCI Configuration for Multi-tenant B2B SaaS Platform
# Version: 2.1
# Authentication: AWS OIDC (no static keys)
# Platform: EKS, RDS Aurora, ElastiCache, Cognito

version: 2.1

# ==================== ORBS ====================
orbs:
  aws-cli: circleci/aws-cli@4.1
  kubernetes: circleci/kubernetes@1.3
  terraform: circleci/terraform@3.2
  snyk: snyk/snyk@2.0
  node: circleci/node@5.1
  docker: circleci/docker@2.4

# ==================== EXECUTORS ====================
executors:
  # Node.js executor for application builds
  node-executor:
    docker:
      - image: ${PRIVATE_REGISTRY}/node:20-alpine
    resource_class: medium
    working_directory: ~/project

  # Docker executor for container builds
  docker-executor:
    machine:
      image: ubuntu-2204:current
    resource_class: medium
    working_directory: ~/project

  # Terraform executor for infrastructure
  terraform-executor:
    docker:
      - image: ${PRIVATE_REGISTRY}/hashicorp/terraform:1.6
    resource_class: medium
    working_directory: ~/project

# ==================== COMMANDS ====================
commands:
  # OIDC authentication wrapper for AWS CLI
  assume-aws-role:
    description: "Assume AWS role using OIDC authentication"
    parameters:
      role-arn:
        type: string
        description: "AWS IAM Role ARN from context"
    steps:
      - aws-cli/setup:
          role-arn: << parameters.role-arn >>
          role-session-name: circleci-${CIRCLE_BUILD_NUM}
          aws-region: ${AWS_DEFAULT_REGION}
          profile-name: deployment

  # Install kubectl and Helm
  install-kubectl:
    description: "Install kubectl v1.28 and Helm v3.13"
    steps:
      - run:
          name: Install kubectl
          command: |
            curl -LO "https://dl.k8s.io/release/v1.28.0/bin/linux/amd64/kubectl"
            chmod +x kubectl
            sudo mv kubectl /usr/local/bin/
            kubectl version --client
      - run:
          name: Install Helm
          command: |
            curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
            chmod 700 get_helm.sh
            ./get_helm.sh --version v3.13.0
            rm get_helm.sh
            helm version

  # Setup tenant-specific Kubernetes context
  setup-tenant-context:
    description: "Configure kubeconfig and namespace for tenant isolation"
    parameters:
      tenant-id:
        type: string
        description: "Tenant identifier"
      environment:
        type: string
        description: "Deployment environment"
    steps:
      - run:
          name: Configure tenant context
          command: |
            aws eks update-kubeconfig \
              --name ${CLUSTER_NAME}-<< parameters.environment >> \
              --region ${AWS_DEFAULT_REGION} \
              --role-arn ${ROLE_ARN}
            kubectl config set-context --current \
              --namespace=tenant-<< parameters.tenant-id >>-<< parameters.environment >>

# ==================== JOBS ====================
jobs:
  # -------------------- VALIDATION JOBS --------------------
  code-validation:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Lint code
          command: npm run lint
      - run:
          name: TypeScript check
          command: npm run type-check
      - run:
          name: Prettier check
          command: npm run prettier:check
      - store_test_results:
          path: reports/validation
      - store_artifacts:
          path: reports/validation
          retention: 7d

  infrastructure-validation:
    executor: terraform-executor
    steps:
      - checkout
      - assume-aws-role:
          role-arn: ${OIDC_ROLE_ARN}
      - run:
          name: Terraform format check
          command: |
            cd infrastructure
            terraform fmt -check -recursive
      - run:
          name: Terraform validate
          command: |
            cd infrastructure
            terraform init -backend=false
            terraform validate -json > ../reports/terraform-validate.json
            terraform validate 2>&1 | tee ../reports/terraform-validate.log
      - run:
          name: TFLint
          command: |
            curl -L "https://github.com/terraform-linters/tflint/releases/latest/download/tflint_linux_amd64.zip" > tflint.zip
            unzip tflint.zip
            ./tflint --recursive --format=json > ../reports/tflint-report.json
            ./tflint --recursive 2>&1 | tee ../reports/tflint.log
      - run:
          name: TFSec security scan
          command: |
            docker run --rm -v "$(pwd)":/src aquasec/tfsec:latest /src --format=json > reports/tfsec-report.json
            docker run --rm -v "$(pwd)":/src aquasec/tfsec:latest /src 2>&1 | tee reports/tfsec.log
      - run:
          name: Checkov scan
          command: |
            pip install checkov
            checkov -d infrastructure --output-file reports/checkov-report.json
      - store_artifacts:
          path: reports
          retention: 7d

  # -------------------- SECURITY SCANNING --------------------
  dependency-scan:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages
      - snyk/scan:
          severity-threshold: high
          fail-on-issues: true
          monitor-on-build: true
      - run:
          name: NPM audit
          command: |
            npm audit --audit-level=high
            npm audit --json > reports/npm-audit.json || true
      - store_artifacts:
          path: reports/npm-audit.json
          retention: 7d

  # -------------------- BUILD JOBS --------------------
  build-services:
    executor: docker-executor
    parameters:
      service-name:
        type: string
    steps:
      - checkout
      - assume-aws-role:
          role-arn: ${OIDC_ROLE_ARN}
      - run:
          name: Login to ECR
          command: |
            aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
      - run:
          name: Build multi-arch Docker image
          command: |
            docker buildx create --use
            docker buildx build \
              --platform linux/amd64,linux/arm64 \
              --cache-from type=registry,ref=${ECR_REGISTRY}/<< parameters.service-name >>:cache \
              --cache-to type=registry,ref=${ECR_REGISTRY}/<< parameters.service-name >>:cache \
              -t ${ECR_REGISTRY}/<< parameters.service-name >>:${CIRCLE_SHA1} \
              -t ${ECR_REGISTRY}/<< parameters.service-name >>:latest \
              --push \
              ./services/<< parameters.service-name >>
      - run:
          name: Trivy security scan
          command: |
            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
              -v $(pwd)/reports:/reports \
              aquasec/trivy:latest image \
              --format json \
              --output /reports/trivy-<< parameters.service-name >>.json \
              ${ECR_REGISTRY}/<< parameters.service-name >>:${CIRCLE_SHA1}
      - store_artifacts:
          path: reports
          retention: 7d

  # -------------------- INFRASTRUCTURE DEPLOYMENT --------------------
  terraform-deploy:
    executor: terraform-executor
    parameters:
      environment:
        type: string
    steps:
      - checkout
      - assume-aws-role:
          role-arn: ${OIDC_ROLE_ARN_<< parameters.environment >>}
      - terraform/init:
          path: infrastructure
          backend_config_file: backend-<< parameters.environment >>.conf
      - run:
          name: Select workspace
          command: |
            cd infrastructure
            terraform workspace select << parameters.environment >> || terraform workspace new << parameters.environment >>
      - terraform/plan:
          path: infrastructure
          var_file: environments/<< parameters.environment >>.tfvars
          out: tfplan-<< parameters.environment >>
      - terraform/apply:
          path: infrastructure
          plan: tfplan-<< parameters.environment >>
      - store_artifacts:
          path: infrastructure/tfplan-<< parameters.environment >>
          retention: 7d

  # -------------------- TESTING JOBS --------------------
  unit-tests:
    executor: node-executor
    parallelism: 4
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run unit tests
          command: |
            TESTFILES=$(circleci tests glob "src/**/*.test.ts" | circleci tests split --split-by=timings)
            npm run test:unit -- --coverage --ci --reporters=jest-junit ${TESTFILES}
          environment:
            JEST_JUNIT_OUTPUT_DIR: reports/junit
      - store_test_results:
          path: reports/junit
      - store_artifacts:
          path: coverage
          retention: 7d

  integration-tests:
    executor: docker-executor
    steps:
      - checkout
      - run:
          name: Setup test environment
          command: |
            docker-compose -f docker-compose.test.yml up -d
            ./scripts/wait-for-services.sh
      - run:
          name: Setup database and cache proxies
          command: |
            # Start database proxy for tenant isolation testing
            ./scripts/start-db-proxy.sh
            # Start cache proxy for ElastiCache testing
            ./scripts/start-cache-proxy.sh
      - run:
          name: Setup local Cognito
          command: |
            # Start local Cognito mock for authentication testing
            ./scripts/start-local-cognito.sh
      - run:
          name: Run integration tests
          command: |
            docker-compose -f docker-compose.test.yml \
              run --rm test-runner npm run test:integration
      - run:
          name: Pact contract tests
          command: |
            docker-compose -f docker-compose.test.yml \
              run --rm test-runner npm run test:contract
      - store_test_results:
          path: reports/integration
      - store_artifacts:
          path: reports
          retention: 7d

  e2e-tests:
    executor: docker-executor
    parallelism: 3
    steps:
      - checkout
      - run:
          name: Run E2E tests
          command: |
            SPECS=$(circleci tests glob "e2e/**/*.spec.ts" | circleci tests split)
            docker run --rm \
              -v $(pwd):/app \
              -e SPECS="${SPECS}" \
              ${PRIVATE_REGISTRY}/e2e-runner:latest
      - store_artifacts:
          path: reports
          retention: 7d

  # -------------------- SECURITY VALIDATION --------------------
  security-scan:
    executor: docker-executor
    steps:
      - checkout
      - run:
          name: Semgrep scan
          command: |
            docker run --rm -v $(pwd):/src \
              returntocorp/semgrep:latest \
              --config=auto --json -o reports/semgrep.json /src
      - run:
          name: Trufflehog secrets scan
          command: |
            docker run --rm -v $(pwd):/src \
              trufflesecurity/trufflehog:latest \
              filesystem /src --json > reports/trufflehog.json
      - run:
          name: Grype vulnerability scan
          command: |
            curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /tmp/
            /tmp/grype dir:. -o json > reports/grype.json
      - run:
          name: Checkov K8s manifests scan
          command: |
            pip install checkov
            checkov -d k8s-manifests --framework kubernetes -o json > reports/checkov-k8s.json
      - store_artifacts:
          path: reports
          retention: 7d

  # -------------------- PERFORMANCE TESTING --------------------
  performance-tests:
    executor: docker-executor
    parallelism: 2
    steps:
      - checkout
      - assume-aws-role:
          role-arn: ${OIDC_ROLE_ARN}
      - run:
          name: K6 load tests
          command: |
            docker run --rm \
              -v $(pwd)/tests/performance:/scripts \
              -v $(pwd)/reports:/reports \
              grafana/k6:latest run \
              --out json=/reports/k6-results.json \
              /scripts/load-test.js
      - run:
          name: Artillery stress tests
          command: |
            npm install -g artillery
            artillery run tests/performance/stress-test.yml \
              --output reports/artillery-report.json
            artillery report --output reports/artillery.html \
              reports/artillery-report.json
      - store_artifacts:
          path: reports
          retention: 7d

  # -------------------- DEPLOYMENT JOBS --------------------
  deploy-dev:
    executor: docker-executor
    steps:
      - checkout
      - assume-aws-role:
          role-arn: ${OIDC_ROLE_ARN_DEV}
      - install-kubectl
      - setup-tenant-context:
          tenant-id: "${TENANT_ID}"
          environment: "dev"
      - run:
          name: Deploy to dev
          command: |
            helm upgrade --install \
              saas-platform ./charts/saas-platform \
              -f ./charts/values/dev.yaml \
              --set image.tag=${CIRCLE_SHA1} \
              --wait --timeout 10m
      - run:
          name: Configure tenant isolation
          command: |
            ./scripts/configure-tenant-isolation.sh dev ${TENANT_ID}

  deploy-staging-blue-green:
    executor: docker-executor
    steps:
      - checkout
      - assume-aws-role:
          role-arn: ${OIDC_ROLE_ARN_STAGING}
      - install-kubectl
      - setup-tenant-context:
          tenant-id: "${TENANT_ID}"
          environment: "staging"
      - run:
          name: Deploy blue-green to staging
          command: |
            ./scripts/deploy-blue-green.sh staging ${CIRCLE_SHA1}
      - run:
          name: Validate deployment
          command: |
            ./scripts/validate-deployment.sh staging
      - run:
          name: Switch traffic
          command: |
            aws route53 change-resource-record-sets \
              --hosted-zone-id ${HOSTED_ZONE_ID} \
              --change-batch file://route53-staging-switch.json

  deploy-production:
    executor: docker-executor
    parameters:
      deployment-type:
        type: enum
        enum: ["rolling", "canary"]
        default: "rolling"
    steps:
      - checkout
      - assume-aws-role:
          role-arn: ${OIDC_ROLE_ARN_PROD}
      - install-kubectl
      - setup-tenant-context:
          tenant-id: "${TENANT_ID}"
          environment: "production"
      - when:
          condition:
            equal: [rolling, << parameters.deployment-type >>]
          steps:
            - run:
                name: Rolling update
                command: |
                  kubectl set image deployment/api-gateway \
                    api-gateway=${ECR_REGISTRY}/api-gateway:${CIRCLE_SHA1} \
                    --record
                  kubectl rollout status deployment/api-gateway
      - when:
          condition:
            equal: [canary, << parameters.deployment-type >>]
          steps:
            - run:
                name: Canary deployment 10%
                command: |
                  ./scripts/deploy-canary.sh production ${CIRCLE_SHA1} 10
            - run:
                name: Health check after 10%
                command: |
                  ./scripts/health-check.sh production
            - run:
                name: Audit after 10%
                command: |
                  ./scripts/audit-deployment.sh production 10
            - run:
                name: Sleep for monitoring
                command: sleep 300
            - run:
                name: Canary deployment 50%
                command: |
                  ./scripts/deploy-canary.sh production ${CIRCLE_SHA1} 50
            - run:
                name: Health check after 50%
                command: |
                  ./scripts/health-check.sh production
            - run:
                name: Audit after 50%
                command: |
                  ./scripts/audit-deployment.sh production 50
            - run:
                name: Sleep for monitoring
                command: sleep 300
            - run:
                name: Canary deployment 100%
                command: |
                  ./scripts/deploy-canary.sh production ${CIRCLE_SHA1} 100
            - run:
                name: Final health check
                command: |
                  ./scripts/health-check.sh production
            - run:
                name: Final audit
                command: |
                  ./scripts/audit-deployment.sh production 100

  # -------------------- VALIDATION JOBS --------------------
  validate-deployment:
    executor: node-executor
    parameters:
      environment:
        type: string
    steps:
      - checkout
      - run:
          name: Integration validation
          command: |
            npm run test:integration:<< parameters.environment >>
      - run:
          name: E2E validation
          command: |
            npm run test:e2e:<< parameters.environment >>
      - run:
          name: API validation
          command: |
            npm run test:api:<< parameters.environment >>
      - run:
          name: Tenant isolation check
          command: |
            ./scripts/test-tenant-isolation.sh << parameters.environment >>
      - store_test_results:
          path: reports/validation
      - store_artifacts:
          path: reports/validation
          retention: 7d

  security-compliance-check:
    executor: docker-executor
    parameters:
      environment:
        type: string
    steps:
      - checkout
      - assume-aws-role:
          role-arn: ${OIDC_ROLE_ARN_<< parameters.environment >>}
      - run:
          name: Prowler PCI-DSS scan
          command: |
            docker run --rm \
              -e AWS_REGION=${AWS_DEFAULT_REGION} \
              toniblyx/prowler:latest \
              -g pci_dss \
              -f json \
              > reports/prowler-<< parameters.environment >>.json
      - run:
          name: AWS Config compliance check
          command: |
            aws configservice describe-compliance-by-config-rule \
              --compliance-types NON_COMPLIANT \
              --output json > reports/aws-config-<< parameters.environment >>.json
      - run:
          name: Custom tenant isolation validation
          command: |
            ./scripts/validate-tenant-isolation.sh << parameters.environment >>
      - store_artifacts:
          path: reports
          retention: 7d

  smoke-tests:
    executor: node-executor
    parameters:
      environment:
        type: string
    steps:
      - checkout
      - run:
          name: Run smoke tests
          command: |
            npm run test:smoke:<< parameters.environment >>
      - store_test_results:
          path: reports/smoke
      - store_artifacts:
          path: reports/smoke
          retention: 7d

  # -------------------- MONITORING SETUP --------------------
  setup-monitoring:
    executor: docker-executor
    parameters:
      environment:
        type: string
    steps:
      - checkout
      - assume-aws-role:
          role-arn: ${OIDC_ROLE_ARN_<< parameters.environment >>}
      - run:
          name: Configure Datadog
          command: |
            helm upgrade --install datadog-agent datadog/datadog \
              -f monitoring/datadog-values-<< parameters.environment >>.yaml \
              --set datadog.apiKey=${DATADOG_API_KEY} \
              --namespace monitoring
      - run:
          name: Setup CloudWatch dashboards
          command: |
            aws cloudformation deploy \
              --template-file monitoring/cloudwatch-dashboards.yaml \
              --stack-name cloudwatch-dashboards-<< parameters.environment >> \
              --parameter-overrides Environment=<< parameters.environment >>
      - run:
          name: Configure PagerDuty
          command: |
            ./scripts/configure-pagerduty.sh << parameters.environment >>
      - run:
          name: Setup Sentry
          command: |
            ./scripts/configure-sentry.sh << parameters.environment >> ${SENTRY_DSN}

  # -------------------- ROLLBACK JOB --------------------
  rollback:
    executor: docker-executor
    parameters:
      environment:
        type: string
      rollback-type:
        type: enum
        enum: ["application", "infrastructure", "full"]
    steps:
      - checkout
      - assume-aws-role:
          role-arn: ${OIDC_ROLE_ARN_<< parameters.environment >>}
      - install-kubectl
      - when:
          condition:
            or:
              - equal: [application, << parameters.rollback-type >>]
              - equal: [full, << parameters.rollback-type >>]
          steps:
            - run:
                name: Rollback Kubernetes deployments
                command: |
                  kubectl rollout undo deployment --all -n tenant-${TENANT_ID}-<< parameters.environment >>
                  kubectl rollout status deployment --all -n tenant-${TENANT_ID}-<< parameters.environment >>
      - when:
          condition:
            or:
              - equal: [infrastructure, << parameters.rollback-type >>]
              - equal: [full, << parameters.rollback-type >>]
          steps:
            - run:
                name: Rollback Terraform changes
                command: |
                  cd infrastructure
                  terraform init -backend-config=backend-<< parameters.environment >>.conf
                  terraform workspace select << parameters.environment >>
                  ./scripts/terraform-rollback.sh << parameters.environment >>
      - run:
          name: Rollback Route53 changes
          command: |
            aws route53 change-resource-record-sets \
              --hosted-zone-id ${HOSTED_ZONE_ID} \
              --change-batch file://route53-rollback-<< parameters.environment >>.json
      - run:
          name: Validate rollback
          command: |
            ./scripts/validate-rollback.sh << parameters.environment >>

# ==================== WORKFLOWS ====================
workflows:
  version: 2
  
  # Main CI/CD pipeline workflow
  # Implements a comprehensive build-test-deploy-verify pipeline
  # with progressive delivery: dev -> staging (blue-green) -> production (rolling/canary)
  build-test-deploy:
    jobs:
      # Phase 1: Parallel validation (code quality, security, infrastructure)
      # These jobs run in parallel to catch issues early
      - code-validation:
          context: aws-dev
      - infrastructure-validation:
          context: aws-dev
      - dependency-scan:
          context: aws-dev
      
      # Phase 2: Parallel service builds (8 microservices)
      # Each service builds independently to maximize parallelism
      - build-services:
          name: build-api-gateway
          service-name: api-gateway
          context: aws-dev
          requires:
            - code-validation
            - dependency-scan
      - build-services:
          name: build-user-service
          service-name: user-service
          context: aws-dev
          requires:
            - code-validation
            - dependency-scan
      - build-services:
          name: build-tenant-service
          service-name: tenant-service
          context: aws-dev
          requires:
            - code-validation
            - dependency-scan
      - build-services:
          name: build-billing-service
          service-name: billing-service
          context: aws-dev
          requires:
            - code-validation
            - dependency-scan
      - build-services:
          name: build-notification-service
          service-name: notification-service
          context: aws-dev
          requires:
            - code-validation
            - dependency-scan
      - build-services:
          name: build-analytics-service
          service-name: analytics-service
          context: aws-dev
          requires:
            - code-validation
            - dependency-scan
      - build-services:
          name: build-audit-service
          service-name: audit-service
          context: aws-dev
          requires:
            - code-validation
            - dependency-scan
      - build-services:
          name: build-integration-service
          service-name: integration-service
          context: aws-dev
          requires:
            - code-validation
            - dependency-scan
      
      # Phase 3: Comprehensive testing (unit, integration, e2e, security)
      # Tests run in parallel where possible, with proper dependencies
      - unit-tests:
          context: aws-dev
          requires:
            - code-validation
      - integration-tests:
          context: aws-dev
          requires:
            - build-api-gateway
            - build-user-service
            - build-tenant-service
            - build-billing-service
            - build-notification-service
            - build-analytics-service
            - build-audit-service
            - build-integration-service
      - e2e-tests:
          context: aws-dev
          requires:
            - integration-tests
      - security-scan:
          context: aws-dev
          requires:
            - code-validation
      
      # Phase 4: Infrastructure deployment (dev environment)
      - terraform-deploy:
          name: deploy-infrastructure-dev
          environment: dev
          context: aws-dev
          requires:
            - infrastructure-validation
      
      # Phase 5: Application deployment (dev)
      - deploy-dev:
          context: aws-dev
          requires:
            - deploy-infrastructure-dev
            - unit-tests
            - integration-tests
            - e2e-tests
            - security-scan
      
      # Phase 6: Dev environment validation and monitoring
      - validate-deployment:
          name: validate-dev
          environment: dev
          context: aws-dev
          requires:
            - deploy-dev
      - security-compliance-check:
          name: compliance-check-dev
          environment: dev
          context: aws-dev
          requires:
            - deploy-dev
      - smoke-tests:
          name: smoke-test-dev
          environment: dev
          context: aws-dev
          requires:
            - deploy-dev
      - setup-monitoring:
          name: monitoring-dev
          environment: dev
          context: aws-dev
          requires:
            - deploy-dev
      
      # Phase 7: Performance testing (post-deployment)
      - performance-tests:
          context: aws-dev
          requires:
            - validate-dev
            - compliance-check-dev
      
      # Phase 8: Staging environment promotion
      # Only proceeds if dev validation passes
      - terraform-deploy:
          name: deploy-infrastructure-staging
          environment: staging
          context: aws-staging
          requires:
            - validate-dev
            - performance-tests
      
      - deploy-staging-blue-green:
          context: aws-staging
          requires:
            - deploy-infrastructure-staging
      
      # Phase 9: Staging validation
      - validate-deployment:
          name: validate-staging
          environment: staging
          context: aws-staging
          requires:
            - deploy-staging-blue-green
      - security-compliance-check:
          name: compliance-check-staging
          environment: staging
          context: aws-staging
          requires:
            - deploy-staging-blue-green
      - smoke-tests:
          name: smoke-test-staging
          environment: staging
          context: aws-staging
          requires:
            - deploy-staging-blue-green
      - setup-monitoring:
          name: monitoring-staging
          environment: staging
          context: aws-staging
          requires:
            - deploy-staging-blue-green
      
      # Phase 10: Production approval gate
      # Manual approval required before production deployment
      - hold-production:
          type: approval
          requires:
            - validate-staging
            - compliance-check-staging
            - smoke-test-staging
      
      # Phase 11: Production deployment
      - terraform-deploy:
          name: deploy-infrastructure-prod
          environment: production
          context: aws-prod
          requires:
            - hold-production
      
      - deploy-production:
          name: deploy-prod-rolling
          deployment-type: rolling
          context: aws-prod
          requires:
            - deploy-infrastructure-prod
          filters:
            branches:
              only: main
      
      # Phase 12: Production validation and monitoring
      - validate-deployment:
          name: validate-prod
          environment: production
          context: aws-prod
          requires:
            - deploy-prod-rolling
      - security-compliance-check:
          name: compliance-check-prod
          environment: production
          context: aws-prod
          requires:
            - deploy-prod-rolling
      - smoke-tests:
          name: smoke-test-prod
          environment: production
          context: aws-prod
          requires:
            - deploy-prod-rolling
      - setup-monitoring:
          name: monitoring-prod
          environment: production
          context: aws-prod
          requires:
            - deploy-prod-rolling

  # Emergency rollback workflow
  # Manually triggered for production incidents
  emergency-rollback:
    jobs:
      - hold-rollback:
          type: approval
      - rollback:
          environment: production
          rollback-type: full
          context: aws-prod
          requires:
            - hold-rollback
```

## infrastructure/.terraform.lock.hcl

```hcl
# This file is maintained automatically by "terraform init".
# Manual edits may be lost in future updates.

provider "registry.terraform.io/hashicorp/aws" {
  version     = "5.100.0"
  constraints = "~> 5.0"
  hashes = [
    "h1:edXOJWE4ORX8Fm+dpVpICzMZJat4AX0VRCAy/xkcOc0=",
    "zh:054b8dd49f0549c9a7cc27d159e45327b7b65cf404da5e5a20da154b90b8a644",
    "zh:0b97bf8d5e03d15d83cc40b0530a1f84b459354939ba6f135a0086c20ebbe6b2",
    "zh:1589a2266af699cbd5d80737a0fe02e54ec9cf2ca54e7e00ac51c7359056f274",
    "zh:6330766f1d85f01ae6ea90d1b214b8b74cc8c1badc4696b165b36ddd4cc15f7b",
    "zh:7c8c2e30d8e55291b86fcb64bdf6c25489d538688545eb48fd74ad622e5d3862",
    "zh:99b1003bd9bd32ee323544da897148f46a527f622dc3971af63ea3e251596342",
    "zh:9b12af85486a96aedd8d7984b0ff811a4b42e3d88dad1a3fb4c0b580d04fa425",
    "zh:9f8b909d3ec50ade83c8062290378b1ec553edef6a447c56dadc01a99f4eaa93",
    "zh:aaef921ff9aabaf8b1869a86d692ebd24fbd4e12c21205034bb679b9caf883a2",
    "zh:ac882313207aba00dd5a76dbd572a0ddc818bb9cbf5c9d61b28fe30efaec951e",
    "zh:bb64e8aff37becab373a1a0cc1080990785304141af42ed6aa3dd4913b000421",
    "zh:dfe495f6621df5540d9c92ad40b8067376350b005c637ea6efac5dc15028add4",
    "zh:f0ddf0eaf052766cfe09dea8200a946519f653c384ab4336e2a4a64fdd6310e9",
    "zh:f1b7e684f4c7ae1eed272b6de7d2049bb87a0275cb04dbb7cda6636f600699c9",
    "zh:ff461571e3f233699bf690db319dfe46aec75e58726636a0d97dd9ac6e32fb70",
  ]
}

provider "registry.terraform.io/hashicorp/tls" {
  version = "4.1.0"
  hashes = [
    "h1:Ka8mEwRFXBabR33iN/WTIEW6RP0z13vFsDlwn11Pf2I=",
    "zh:14c35d89307988c835a7f8e26f1b83ce771e5f9b41e407f86a644c0152089ac2",
    "zh:2fb9fe7a8b5afdbd3e903acb6776ef1be3f2e587fb236a8c60f11a9fa165faa8",
    "zh:35808142ef850c0c60dd93dc06b95c747720ed2c40c89031781165f0c2baa2fc",
    "zh:35b5dc95bc75f0b3b9c5ce54d4d7600c1ebc96fbb8dfca174536e8bf103c8cdc",
    "zh:38aa27c6a6c98f1712aa5cc30011884dc4b128b4073a4a27883374bfa3ec9fac",
    "zh:51fb247e3a2e88f0047cb97bb9df7c228254a3b3021c5534e4563b4007e6f882",
    "zh:62b981ce491e38d892ba6364d1d0cdaadcee37cc218590e07b310b1dfa34be2d",
    "zh:bc8e47efc611924a79f947ce072a9ad698f311d4a60d0b4dfff6758c912b7298",
    "zh:c149508bd131765d1bc085c75a870abb314ff5a6d7f5ac1035a8892d686b6297",
    "zh:d38d40783503d278b63858978d40e07ac48123a2925e1a6b47e62179c046f87a",
    "zh:f569b65999264a9416862bca5cd2a6177d94ccb0424f3a4ef424428912b9cb3c",
    "zh:fb07f708e3316615f6d218cec198504984c0ce7000b9f1eebff7516e384f4b54",
  ]
}
```

## infrastructure/backend-dev.conf

```hcl
bucket = "iac-test-automations-terraform-state-123456789012"
key = "dev/terraform.tfstate"
region = "us-east-1"
encrypt = true
dynamodb_table = "iac-test-automations-terraform-locks-123456789012"
```

## infrastructure/backend-production.conf

```hcl
bucket = "iac-test-automations-terraform-state-123456789012"
key = "production/terraform.tfstate"
region = "us-east-1"
encrypt = true
dynamodb_table = "iac-test-automations-terraform-locks-123456789012"
```

## infrastructure/backend-staging.conf

```hcl
bucket = "iac-test-automations-terraform-state-123456789012"
key = "staging/terraform.tfstate"
region = "us-east-1"
encrypt = true
dynamodb_table = "iac-test-automations-terraform-locks-123456789012"
```

## infrastructure/environments/dev.tfvars

```hcl
region = "us-east-1"
environment = "dev"
cluster_name = "saas-platform-dev"
db_cluster_identifier = "saas-db-dev"
db_master_username = "admin"
cache_cluster_id = "saas-cache-dev"
cognito_user_pool_name = "saas-users-dev"
ecr_repository_names = [
  "api-gateway",
  "user-service",
  "tenant-service",
  "billing-service",
  "notification-service",
  "analytics-service",
  "audit-service",
  "integration-service"
]
github_repo = "TuringGpt/iac-test-automations"
```

## infrastructure/environments/production.tfvars

```hcl
region = "us-east-1"
environment = "production"
cluster_name = "saas-platform-prod"
db_cluster_identifier = "saas-db-prod"
db_master_username = "admin"
cache_cluster_id = "saas-cache-prod"
cognito_user_pool_name = "saas-users-prod"
ecr_repository_names = [
  "api-gateway",
  "user-service",
  "tenant-service",
  "billing-service",
  "notification-service",
  "analytics-service",
  "audit-service",
  "integration-service"
]
github_repo = "TuringGpt/iac-test-automations"
```

## infrastructure/environments/staging.tfvars

```hcl
region = "us-east-1"
environment = "staging"
cluster_name = "saas-platform-staging"
db_cluster_identifier = "saas-db-staging"
db_master_username = "admin"
cache_cluster_id = "saas-cache-staging"
cognito_user_pool_name = "saas-users-staging"
ecr_repository_names = [
  "api-gateway",
  "user-service",
  "tenant-service",
  "billing-service",
  "notification-service",
  "analytics-service",
  "audit-service",
  "integration-service"
]
github_repo = "TuringGpt/iac-test-automations"
```

## infrastructure/main.tf

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "iac-test-automations-terraform-state-${data.aws_caller_identity.current.account_id}"
    key            = "${var.environment}/terraform.tfstate"
    region         = var.region
    encrypt        = true
    dynamodb_table = "iac-test-automations-terraform-locks-${data.aws_caller_identity.current.account_id}"
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = var.tags
  }
}

data "aws_caller_identity" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ==================== VPC ====================
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_subnet" "private" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "${var.environment}-private-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "private"
    "kubernetes.io/role/internal-elb" = "1"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_subnet" "public" {
  count = 3

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, 3 + count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.environment}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "public"
    "kubernetes.io/role/elb" = "1"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-igw"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_nat_gateway" "main" {
  count = 3

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.environment}-nat-gw-${count.index + 1}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_eip" "nat" {
  count = 3

  domain = "vpc"

  tags = {
    Name        = "${var.environment}-nat-eip-${count.index + 1}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_route_table" "private" {
  count = 3

  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "${var.environment}-private-rt-${count.index + 1}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "private"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "${var.environment}-public-rt"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "public"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_route_table_association" "private" {
  count = 3

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "public" {
  count = 3

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ==================== Network ACLs ====================
resource "aws_network_acl" "private" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-private-nacl"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "private"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_network_acl" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.environment}-public-nacl"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "network"
    Owner       = "platform-team"
    CostCenter  = "engineering"
    Type        = "public"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Private NACL rules - restrictive inbound, allow all outbound
resource "aws_network_acl_rule" "private_inbound_http" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "private_inbound_https" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "private_inbound_mysql" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 3306
  to_port        = 3306
}

resource "aws_network_acl_rule" "private_inbound_redis" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 130
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 6379
  to_port        = 6379
}

resource "aws_network_acl_rule" "private_inbound_ephemeral" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 140
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "private_outbound_all" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# Public NACL rules - allow HTTP/HTTPS inbound, allow all outbound
resource "aws_network_acl_rule" "public_inbound_http" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "public_inbound_https" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_inbound_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 120
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "public_outbound_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# Associate NACLs with subnets
resource "aws_network_acl_association" "private" {
  count = 3

  network_acl_id = aws_network_acl.private.id
  subnet_id      = aws_subnet.private[count.index].id
}

resource "aws_network_acl_association" "public" {
  count = 3

  network_acl_id = aws_network_acl.public.id
  subnet_id      = aws_subnet.public[count.index].id
}

# ==================== EKS ====================
resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.cluster_name}-cluster-role"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "kubernetes"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  role       = aws_iam_role.eks_cluster.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }

  tags = {
    Name        = var.cluster_name
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "kubernetes"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role" "eks_node" {
  name = "${var.cluster_name}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.cluster_name}-node-role"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "kubernetes"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "eks_node" {
  for_each = toset([
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  ])

  role       = aws_iam_role.eks_node.name
  policy_arn = each.value
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-node-group"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = 3
    max_size     = 5
    min_size     = 1
  }

  instance_types = ["t3.medium"]

  tags = {
    Name        = "${var.cluster_name}-node-group"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "kubernetes"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# OIDC provider for EKS
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = {
    Name        = "${var.cluster_name}-oidc-provider"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "kubernetes"
    Component   = "authentication"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# OIDC provider for CircleCI
resource "aws_iam_openid_connect_provider" "circleci" {
  url             = "https://oidc.circleci.com"
  client_id_list  = ["circleci"]
  thumbprint_list = ["9de5069c5afe602b2ea0a04b66beb2c0cca9c5b0"]

  tags = {
    Name        = "circleci-oidc-provider"
    Environment = "shared"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "authentication"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== S3 Backend ====================
resource "aws_s3_bucket" "terraform_state" {
  bucket = "iac-test-automations-terraform-state-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "iac-test-automations-terraform-state-${data.aws_caller_identity.current.account_id}"
    Environment = "shared"
    Project     = "iac-test-automations"
    Application = "infrastructure"
    Component   = "terraform-backend"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "iac-test-automations-terraform-locks-${data.aws_caller_identity.current.account_id}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name        = "iac-test-automations-terraform-locks-${data.aws_caller_identity.current.account_id}"
    Environment = "shared"
    Project     = "iac-test-automations"
    Application = "infrastructure"
    Component   = "terraform-backend"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== KMS Keys ====================
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7

  tags = {
    Name        = "${var.environment}-rds-kms-key"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "encryption"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_kms_key" "cache" {
  description             = "KMS key for ElastiCache encryption"
  deletion_window_in_days = 7

  tags = {
    Name        = "${var.environment}-cache-kms-key"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "encryption"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.db_cluster_identifier}-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${var.db_cluster_identifier}-subnet-group"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "database"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_rds_cluster" "main" {
  cluster_identifier              = var.db_cluster_identifier
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.02.0"
  master_username                 = var.db_master_username
  manage_master_user_password     = true
  master_user_secret_kms_key_id   = aws_kms_key.rds.arn
  db_subnet_group_name            = aws_db_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.rds.id]
  skip_final_snapshot             = true
  deletion_protection             = false

  tags = {
    Name        = var.db_cluster_identifier
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "database"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_rds_cluster_instance" "main" {
  count              = 2
  identifier         = "${var.db_cluster_identifier}-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.t3.small"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  tags = {
    Name        = "${var.db_cluster_identifier}-${count.index}"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "database"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_security_group" "rds" {
  name   = "${var.db_cluster_identifier}-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name        = "${var.db_cluster_identifier}-sg"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "database"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== ElastiCache ====================
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.cache_cluster_id}-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${var.cache_cluster_id}-subnet-group"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "cache"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = var.cache_cluster_id
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.cache.id]

  tags = {
    Name        = var.cache_cluster_id
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "cache"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_security_group" "cache" {
  name   = "${var.cache_cluster_id}-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name        = "${var.cache_cluster_id}-sg"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "cache"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== Cognito ====================
resource "aws_cognito_user_pool" "main" {
  name = var.cognito_user_pool_name

  tags = {
    Name        = var.cognito_user_pool_name
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "authentication"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.cognito_user_pool_name}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== ECR ====================
resource "aws_ecr_repository" "services" {
  for_each = toset(var.ecr_repository_names)

  name = each.value

  tags = {
    Name        = each.value
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "container-registry"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== IAM Roles for CircleCI OIDC ====================
resource "aws_iam_role" "circleci_dev" {
  name = "circleci-dev-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/oidc.circleci.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "oidc.circleci.com:aud" = "https://oidc.circleci.com"
          }
          StringLike = {
            "oidc.circleci.com:sub" = "org/*/project/*/vcs/github/TuringGpt/iac-test-automations:ref:refs/heads/dev"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "circleci-dev-role"
    Environment = "dev"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "circleci_dev" {
  role       = aws_iam_role.circleci_dev.name
  policy_arn = aws_iam_policy.circleci_dev.arn
}

resource "aws_iam_policy" "circleci_dev" {
  name = "circleci-dev-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:DescribeCluster",
          "eks:ListClusters",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "circleci-dev-policy"
    Environment = "dev"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# Similar for staging and prod, with different branch conditions

resource "aws_iam_role" "circleci_staging" {
  name = "circleci-staging-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/oidc.circleci.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "oidc.circleci.com:aud" = "https://oidc.circleci.com"
          }
          StringLike = {
            "oidc.circleci.com:sub" = "org/*/project/*/vcs/github/TuringGpt/iac-test-automations:ref:refs/heads/staging"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "circleci-staging-role"
    Environment = "staging"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "circleci_staging" {
  role       = aws_iam_role.circleci_staging.name
  policy_arn = aws_iam_policy.circleci_staging.arn
}

resource "aws_iam_policy" "circleci_staging" {
  name = "circleci-staging-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:*",
          "ecr:*",
          "rds:*",
          "elasticache:*",
          "route53:*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "circleci-staging-policy"
    Environment = "staging"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role" "circleci_prod" {
  name = "circleci-prod-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/oidc.circleci.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "oidc.circleci.com:aud" = "https://oidc.circleci.com"
          }
          StringLike = {
            "oidc.circleci.com:sub" = "org/*/project/*/vcs/github/TuringGpt/iac-test-automations:ref:refs/heads/main"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "circleci-prod-role"
    Environment = "production"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_iam_role_policy_attachment" "circleci_prod" {
  role       = aws_iam_role.circleci_prod.name
  policy_arn = aws_iam_policy.circleci_prod.arn
}

resource "aws_iam_policy" "circleci_prod" {
  name = "circleci-prod-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:*",
          "ecr:*",
          "rds:*",
          "elasticache:*",
          "route53:*",
          "cloudformation:*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "circleci-prod-policy"
    Environment = "production"
    Project     = "iac-test-automations"
    Application = "ci-cd"
    Component   = "iam"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ==================== CloudWatch Monitoring ====================
# EKS Cluster CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "eks_cpu_utilization" {
  alarm_name          = "${var.cluster_name}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EKS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors EKS cluster CPU utilization"
  alarm_actions       = []

  dimensions = {
    ClusterName = var.cluster_name
  }

  tags = {
    Name        = "${var.cluster_name}-cpu-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# EKS Cluster Memory Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "eks_memory_utilization" {
  alarm_name          = "${var.cluster_name}-memory-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/EKS"
  period              = "300"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "This metric monitors EKS cluster memory utilization"
  alarm_actions       = []

  dimensions = {
    ClusterName = var.cluster_name
  }

  tags = {
    Name        = "${var.cluster_name}-memory-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# RDS CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_utilization" {
  alarm_name          = "${var.db_cluster_identifier}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = []

  dimensions = {
    DBClusterIdentifier = var.db_cluster_identifier
  }

  tags = {
    Name        = "${var.db_cluster_identifier}-cpu-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# RDS Free Storage Space Alarm
resource "aws_cloudwatch_metric_alarm" "rds_free_storage_space" {
  alarm_name          = "${var.db_cluster_identifier}-free-storage-space"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = []

  dimensions = {
    DBClusterIdentifier = var.db_cluster_identifier
  }

  tags = {
    Name        = "${var.db_cluster_identifier}-storage-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ElastiCache CPU Utilization Alarm
resource "aws_cloudwatch_metric_alarm" "cache_cpu_utilization" {
  alarm_name          = "${var.cache_cluster_id}-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors ElastiCache CPU utilization"
  alarm_actions       = []

  dimensions = {
    CacheClusterId = var.cache_cluster_id
  }

  tags = {
    Name        = "${var.cache_cluster_id}-cpu-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# ElastiCache Freeable Memory Alarm
resource "aws_cloudwatch_metric_alarm" "cache_freeable_memory" {
  alarm_name          = "${var.cache_cluster_id}-freeable-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = "100000000" # 100MB in bytes
  alarm_description   = "This metric monitors ElastiCache freeable memory"
  alarm_actions       = []

  dimensions = {
    CacheClusterId = var.cache_cluster_id
  }

  tags = {
    Name        = "${var.cache_cluster_id}-memory-alarm"
    Environment = var.environment
    Project     = "iac-test-automations"
    Application = "multi-tenant-saas"
    Component   = "monitoring"
    Owner       = "platform-team"
    CostCenter  = "engineering"
  }

  lifecycle {
    prevent_destroy = false
  }
}
```

## infrastructure/outputs.tf

```hcl
output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "ecr_registry" {
  description = "ECR registry URL"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
}

output "rds_cluster_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cache_cluster_endpoint" {
  description = "ElastiCache cluster endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "cognito_user_pool_id" {
  description = "Cognito user pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito user pool client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "circleci_dev_role_arn" {
  description = "CircleCI dev role ARN"
  value       = aws_iam_role.circleci_dev.arn
}

output "circleci_staging_role_arn" {
  description = "CircleCI staging role ARN"
  value       = aws_iam_role.circleci_staging.arn
}

output "circleci_prod_role_arn" {
  description = "CircleCI prod role ARN"
  value       = aws_iam_role.circleci_prod.arn
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}
```

## infrastructure/variables.tf

```hcl
variable "region" {
  description = "AWS region"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "db_cluster_identifier" {
  description = "RDS Aurora cluster identifier"
  type        = string
}

variable "db_master_username" {
  description = "RDS master username"
  type        = string
  default     = "admin"
}

variable "cache_cluster_id" {
  description = "ElastiCache cluster ID"
  type        = string
}

variable "cognito_user_pool_name" {
  description = "Cognito user pool name"
  type        = string
}

variable "ecr_repository_names" {
  description = "List of ECR repository names"
  type        = list(string)
}

variable "github_repo" {
  description = "GitHub repository for OIDC"
  type        = string
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    "iac-rlhf-amazon" = "true"
  }
}
```

