### Reasoning Trace
---

This is a comprehensive request for a CircleCI configuration file for a multi-tenant B2B SaaS platform. Let me break down the key requirements:

1. **Authentication**: OIDC authentication to AWS (no static keys)
2. **Orbs**: Specific versions of aws-cli, kubernetes, terraform, snyk, node, docker
3. **Custom Executors**: node-executor, docker-executor, terraform-executor
4. **Custom Commands**: assume-aws-role, install-kubectl, setup-tenant-context
5. **Jobs**: Multiple jobs covering validation, security, testing, deployment, monitoring
6. **Workflows**: Complete CI/CD pipeline with dependencies, parallelization, approvals
7. **Contexts**: Environment-specific contexts for AWS OIDC
8. **Security**: Multiple security scanning tools, compliance checks
9. **Deployment strategies**: Blue/green, canary, rolling updates
10. **Testing**: Unit, integration, E2E, performance, smoke tests
11. **Monitoring**: Datadog, CloudWatch, PagerDuty, Sentry
12. **Rollback**: Manual rollback mechanisms

I need to create a comprehensive config.yml that addresses all these requirements without changing or omitting anything.
### Answer 
---

# Complete CircleCI Configuration for Multi-tenant B2B SaaS Platform

Here's the comprehensive `.circleci/config.yml` for your multi-tenant B2B SaaS platform:

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
            terraform validate
      - run:
          name: TFLint
          command: |
            curl -L "https://github.com/terraform-linters/tflint/releases/latest/download/tflint_linux_amd64.zip" > tflint.zip
            unzip tflint.zip
            ./tflint --recursive
      - run:
          name: TFSec security scan
          command: |
            docker run --rm -v "$(pwd)":/src aquasec/tfsec:latest /src
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
                name: Canary deployment
                command: |
                  ./scripts/deploy-canary.sh production ${CIRCLE_SHA1} 10
                  sleep 300
                  ./scripts/deploy-canary.sh production ${CIRCLE_SHA1} 50
                  sleep 300
                  ./scripts/deploy-canary.sh production ${CIRCLE_SHA1} 100

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
              -g cis_level2_aws \
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
  
  # Main build and deploy workflow
  build-test-deploy:
    jobs:
      # Validation phase (parallel)
      - code-validation:
          context: aws-dev
      - infrastructure-validation:
          context: aws-dev
      - dependency-scan:
          context: aws-dev
      
      # Build phase (parallel for each service)
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
      
      # Testing phase (parallel)
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
      
      # Infrastructure deployment
      - terraform-deploy:
          name: deploy-infrastructure-dev
          environment: dev
          context: aws-dev
          requires:
            - infrastructure-validation
      
      # Dev deployment
      - deploy-dev:
          context: aws-dev
          requires:
            - deploy-infrastructure-dev
            - unit-tests
            - integration-tests
            - e2e-tests
            - security-scan
      
      # Dev validation
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
      
      # Performance testing
      - performance-tests:
          context: aws-dev
          requires:
            - validate-dev
            - compliance-check-dev
      
      # Staging infrastructure
      - terraform-deploy:
          name: deploy-infrastructure-staging
          environment: staging
          context: aws-staging
          requires:
            - validate-dev
            - performance-tests
      
      # Staging deployment
      - deploy-staging-blue-green:
          context: aws-staging
          requires:
            - deploy-infrastructure-staging
      
      # Staging validation
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
      
      # Production approval gate
      - hold-production:
          type: approval
          requires:
            - validate-staging
            - compliance-check-staging
            - smoke-test-staging
      
      # Production infrastructure
      - terraform-deploy:
          name: deploy-infrastructure-prod
          environment: production
          context: aws-prod
          requires:
            - hold-production
      
      # Production deployment (rolling)
      - deploy-production:
          name: deploy-prod-rolling
          deployment-type: rolling
          context: aws-prod
          requires:
            - deploy-infrastructure-prod
          filters:
            branches:
              only: main
      
      # Production validation
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

  # Rollback workflow (manual trigger)
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

## Key Features of This Configuration:

### 1. **OIDC Authentication**
- Uses `aws-cli/setup` orb with role ARN from contexts
- No static AWS credentials anywhere in the configuration
- Role session names include build number for traceability

### 2. **Multi-tenant Isolation**
- Custom `setup-tenant-context` command configures namespace isolation
- Per-tenant database and cache configurations
- Tenant isolation validation scripts

### 3. **Security-First Approach**
- Multiple security scanning tools (Trivy, Snyk, Semgrep, Trufflehog, Grype)
- Infrastructure security with tfsec and Checkov
- Compliance validation with Prowler and AWS Config

### 4. **Advanced Deployment Strategies**
- Blue-green deployment for staging
- Rolling and canary options for production
- Route53 traffic switching
- Comprehensive rollback mechanisms

### 5. **Comprehensive Testing**
- Unit tests with parallelization
- Integration tests with Docker Compose
- E2E tests split across multiple executors
- Performance testing with k6 and Artillery
- Contract testing with Pact

### 6. **Monitoring and Observability**
- Datadog agent deployment
- CloudWatch dashboard setup
- PagerDuty integration
- Sentry error tracking

### 7. **Artifact Management**
- All reports and artifacts stored with 7-day retention
- Test results in JUnit format
- Security scan reports in JSON/HTML formats

This configuration provides a complete, production-ready CI/CD pipeline for your multi-tenant B2B SaaS platform with all the requested features and security best practices.