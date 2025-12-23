```yaml
### Reasoning Trace
---
Alright, I'm being asked to design a complete CircleCI pipeline configuration for a video streaming platform on AWS. Let me break this down:

1. I need to create a `.circleci/config.yml` file that implements a CI/CD pipeline for a video streaming platform.
2. The platform uses AWS services including ECS Fargate, S3, CloudFront, AWS Elemental MediaConvert, and DynamoDB.
3. The pipeline should include stages for build, test, security scanning, performance testing, and deployment to multiple environments (dev, staging, prod).
4. AWS authentication must use OIDC (federated credentials) via CircleCI contexts.
5. The pipeline should support multi-region production deployment.

I'll start by creating the overall structure of the CircleCI configuration and then fill in the details for each section.

Let's begin with the version, orbs, parameters, and executors:

```yaml
version: 2.1

orbs:
  aws-cli: circleci/aws-cli@4.1
  aws-ecs: circleci/aws-ecs@4.0
  node: circleci/node@5.1
  python: circleci/python@2.1
  docker: circleci/docker@2.4

parameters:
  aws-region:
    type: string
    default: us-east-1
  environment:
    type: enum
    enum: [dev, staging, prod]
    default: dev
  cloudfront-distribution:
    type: string
    description: "Logical name/id for CloudFront distribution"
    default: ""

executors:
  node-executor:
    docker:
      - image: ${PRIVATE_REGISTRY}/node:20-alpine
    resource_class: large
    environment:
      AWS_REGION: << pipeline.parameters.aws-region >>
  
  python-executor:
    docker:
      - image: ${PRIVATE_REGISTRY}/python:3.11-slim
    environment:
      AWS_REGION: << pipeline.parameters.aws-region >>
  
  ffmpeg-executor:
    docker:
      - image: ${PRIVATE_REGISTRY}/jrottenberg/ffmpeg:ubuntu
    resource_class: xlarge
    environment:
      AWS_REGION: << pipeline.parameters.aws-region >>
  
  terraform-executor:
    docker:
      - image: ${PRIVATE_REGISTRY}/hashicorp/terraform:1.6
    environment:
      AWS_REGION: << pipeline.parameters.aws-region >>
  
  docker-executor:
    docker:
      - image: cimg/base:stable
    environment:
      AWS_REGION: << pipeline.parameters.aws-region >>
```

Now, let's define the reusable commands:

```yaml
commands:
  assume-role:
    description: "Assume AWS role via OIDC"
    steps:
      - aws-cli/setup:
          role-arn: ${AWS_ROLE_ARN}
          aws-region: << pipeline.parameters.aws-region >>
  
  install-media-tools:
    description: "Install media tools for transcoding tests"
    steps:
      - run:
          name: Install media tools
          command: |
            # Try apt-based install first (Debian/Ubuntu)
            if command -v apt-get &> /dev/null; then
              apt-get update
              apt-get install -y mediainfo x264 x265
            # Fallback to yum (Amazon Linux/CentOS)
            elif command -v yum &> /dev/null; then
              yum update -y
              yum install -y mediainfo x264 x265
            else
              echo "Unsupported package manager. Please install mediainfo, x264, x265 manually."
              exit 1
            fi
```

Now, let's implement all the jobs. There are 29 jobs in total, so I'll work through them in chunks:

```yaml
jobs:
  validate-code:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run ESLint
          command: |
            npx eslint video-api/ upload-service/ webhook-handler/ admin-dashboard/
      - run:
          name: TypeScript compile checks
          command: |
            npx tsc --noEmit --project video-api/
            npx tsc --noEmit --project upload-service/
            npx tsc --noEmit --project webhook-handler/
            npx tsc --noEmit --project admin-dashboard/
      - store_artifacts:
          path: reports/lint
          destination: lint-reports
      - store_artifacts:
          path: reports/tsc
          destination: typescript-reports
  
  validate-infrastructure:
    executor: terraform-executor
    steps:
      - checkout
      - run:
          name: Terraform format check
          command: terraform fmt -check -recursive
      - run:
          name: Initialize and validate Terraform - S3
          command: |
            cd terraform/s3
            terraform init
            terraform validate
      - run:
          name: Initialize and validate Terraform - CloudFront
          command: |
            cd terraform/cloudfront
            terraform init
            terraform validate
      - run:
          name: Initialize and validate Terraform - ECS
          command: |
            cd terraform/ecs
            terraform init
            terraform validate
      - run:
          name: Initialize and validate Terraform - MediaConvert
          command: |
            cd terraform/mediaconvert
            terraform init
            terraform validate
      - run:
          name: Run tflint
          command: tflint --recursive
      - run:
          name: Run tfsec
          command: tfsec .
      - store_artifacts:
          path: reports/terraform
          destination: terraform-reports
  
  scan-dependencies:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run npm audit
          command: npm audit || true
      - run:
          name: Run Snyk security scan
          command: npx snyk test || true
      - run:
          name: Generate license report
          command: npx license-checker --json --out=reports/licenses.json
      - store_artifacts:
          path: reports
          destination: dependency-reports
```

Let me continue with more jobs:

```yaml
  build-transcoding-images:
    executor: docker-executor
    steps:
      - checkout
      - docker/check
      - assume-role
      - run:
          name: Login to ECR
          command: |
            aws ecr get-login-password | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
      - run:
          name: Build transcoding worker image
          command: |
            docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/transcoding-worker:${CIRCLE_SHA1} -f docker/transcoding-worker.Dockerfile .
      - run:
          name: Push transcoding worker image
          command: |
            docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/transcoding-worker:${CIRCLE_SHA1}
      - run:
          name: Run Trivy scan
          command: |
            trivy image --exit-code 1 --severity HIGH,CRITICAL ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/transcoding-worker:${CIRCLE_SHA1}
            trivy image --format json --output reports/trivy-report.json ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/transcoding-worker:${CIRCLE_SHA1}
      - store_artifacts:
          path: reports/trivy-report.json
          destination: security/trivy-report.json

  build-api-images:
    executor: docker-executor
    steps:
      - checkout
      - docker/check
      - assume-role
      - run:
          name: Login to ECR
          command: |
            aws ecr get-login-password | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
      - run:
          name: Build video-api image
          command: |
            docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/video-api:${CIRCLE_SHA1} -f docker/video-api.Dockerfile .
      - run:
          name: Build upload-service image
          command: |
            docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/upload-service:${CIRCLE_SHA1} -f docker/upload-service.Dockerfile .
      - run:
          name: Build webhook-handler image
          command: |
            docker build -t ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/webhook-handler:${CIRCLE_SHA1} -f docker/webhook-handler.Dockerfile .
      - run:
          name: Push images to ECR
          command: |
            docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/video-api:${CIRCLE_SHA1}
            docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/upload-service:${CIRCLE_SHA1}
            docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/webhook-handler:${CIRCLE_SHA1}
      - run:
          name: Run Grype scans
          command: |
            grype ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/video-api:${CIRCLE_SHA1} -o json > reports/grype-video-api.json
            grype ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/upload-service:${CIRCLE_SHA1} -o json > reports/grype-upload-service.json
            grype ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/webhook-handler:${CIRCLE_SHA1} -o json > reports/grype-webhook-handler.json
      - store_artifacts:
          path: reports/grype-*.json
          destination: security/grype-reports

  unit-tests:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run Jest tests
          command: npm test -- --coverage --reporters=default --reporters=jest-junit
          environment:
            JEST_JUNIT_OUTPUT_DIR: reports/junit/
      - store_test_results:
          path: reports/junit/
      - store_artifacts:
          path: coverage
          destination: coverage-reports
```

Let's continue with more jobs:

```yaml
  integration-tests:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Start LocalStack
          command: docker-compose -f docker-compose.localstack.yml up -d
      - run:
          name: Wait for LocalStack
          command: |
            echo "Waiting for LocalStack to be ready..."
            sleep 10
      - run:
          name: Run upload flow integration tests
          command: npm run test:integration:upload -- --reporters=default --reporters=jest-junit
          environment:
            JEST_JUNIT_OUTPUT_DIR: reports/junit/upload/
      - run:
          name: Run webhook processing integration tests
          command: npm run test:integration:webhook -- --reporters=default --reporters=jest-junit
          environment:
            JEST_JUNIT_OUTPUT_DIR: reports/junit/webhook/
      - store_test_results:
          path: reports/junit/
      - store_artifacts:
          path: reports/integration
          destination: integration-test-reports

  video-quality-tests:
    executor: ffmpeg-executor
    steps:
      - checkout
      - install-media-tools
      - run:
          name: Run video transcoding quality tests
          command: ./scripts/test-transcoding-quality.sh
      - store_artifacts:
          path: reports/video-quality
          destination: video-quality-reports
      - store_artifacts:
          path: sample-outputs
          destination: encoded-samples

  security-scan:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Run Semgrep
          command: |
            pip install semgrep
            semgrep --config=p/ci scan . || true
      - run:
          name: Run TruffleHog
          command: |
            pip install truffleHog
            trufflehog --verify filesystem .
      - run:
          name: Run Checkov
          command: |
            pip install checkov
            checkov -d terraform/ --output junitxml > reports/checkov-terraform.xml
            checkov -d k8s/ --output junitxml > reports/checkov-k8s.xml || true
      - store_artifacts:
          path: reports/security
          destination: security-reports

  performance-test:
    executor: node-executor
    resource_class: xlarge
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Install k6
          command: |
            sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
            echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
            sudo apt-get update
            sudo apt-get install k6
      - run:
          name: Run k6 load tests
          command: k6 run load-tests/upload-concurrency.js -o json=reports/k6-results.json
      - run:
          name: Run Artillery API load tests
          command: |
            npm install -g artillery
            artillery run load-tests/api-sustained.yml -o reports/artillery-results.json
      - run:
          name: Validate metrics
          command: |
            node scripts/analyze-load-metrics.js reports/k6-results.json reports/artillery-results.json
      - store_artifacts:
          path: reports/performance
          destination: performance-reports
```

Let's continue with more jobs:

```yaml
  cdn-performance:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: Test CDN performance
          command: ./scripts/test-cdn-performance.sh
      - store_artifacts:
          path: reports/cdn
          destination: cdn-metrics

  deploy-dev-infrastructure:
    executor: terraform-executor
    context: aws-dev
    steps:
      - checkout
      - assume-role
      - run:
          name: Initialize Terraform
          command: terraform init
      - run:
          name: Select dev workspace
          command: terraform workspace select dev || terraform workspace new dev
      - run:
          name: Apply Terraform - S3 buckets
          command: |
            cd terraform/s3
            terraform apply -auto-approve
      - run:
          name: Apply Terraform - CloudFront distribution
          command: |
            cd terraform/cloudfront
            terraform apply -auto-approve
      - run:
          name: Apply Terraform - ECS Fargate cluster
          command: |
            cd terraform/ecs
            terraform apply -auto-approve
      - run:
          name: Apply Terraform - MediaConvert job templates
          command: |
            cd terraform/mediaconvert
            terraform apply -auto-approve
      - run:
          name: Apply Terraform - DynamoDB tables
          command: |
            cd terraform/dynamodb
            terraform apply -auto-approve
      - store_artifacts:
          path: terraform/output
          destination: terraform-outputs

  deploy-dev-services:
    executor: node-executor
    context: aws-dev
    steps:
      - checkout
      - assume-role
      - aws-ecs/update-service:
          family: video-api
          cluster-name: streaming-dev
          container-image-name-updates: "container=video-api,tag=${CIRCLE_SHA1}"
      - aws-ecs/update-service:
          family: upload-service
          cluster-name: streaming-dev
          container-image-name-updates: "container=upload-service,tag=${CIRCLE_SHA1}"
      - aws-ecs/update-service:
          family: webhook-handler
          cluster-name: streaming-dev
          container-image-name-updates: "container=webhook-handler,tag=${CIRCLE_SHA1}"
      - run:
          name: Run database migrations
          command: |
            npm run migrations:up
      - run:
          name: Configure MediaConvert
          command: ./scripts/configure-mediaconvert.sh
      - store_artifacts:
          path: deployment/dev
          destination: deployment-manifests

  integration-test-dev:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Install Newman
          command: npm install -g newman
      - run:
          name: Run full workflow tests
          command: newman run postman/upload-transcode-delivery.json -e postman/dev-environment.json --reporters cli,json --reporter-json-export reports/newman-results.json
      - run:
          name: Validate HLS manifest and CloudFront playback
          command: |
            node scripts/validate-hls-manifest.js
            node scripts/validate-cloudfront-playback.js
      - store_artifacts:
          path: reports/newman
          destination: newman-reports
```

Let's continue with more jobs:

```yaml
  deploy-staging-blue-green:
    executor: terraform-executor
    context: aws-staging
    steps:
      - checkout
      - assume-role
      - run:
          name: Apply Terraform - US East 1
          command: |
            cd terraform/multi-region
            terraform workspace select staging-us-east-1 || terraform workspace new staging-us-east-1
            terraform apply -auto-approve -var="region=us-east-1"
      - run:
          name: Apply Terraform - EU West 1
          command: |
            cd terraform/multi-region
            terraform workspace select staging-eu-west-1 || terraform workspace new staging-eu-west-1
            terraform apply -auto-approve -var="region=eu-west-1"
      - run:
          name: Apply Terraform - AP Southeast 1
          command: |
            cd terraform/multi-region
            terraform workspace select staging-ap-southeast-1 || terraform workspace new staging-ap-southeast-1
            terraform apply -auto-approve -var="region=ap-southeast-1"
      - run:
          name: Deploy Blue/Green to ECS
          command: ./scripts/deploy-blue-green-ecs.sh
      - store_artifacts:
          path: deployment/staging
          destination: deployment-records

  load-test-staging:
    executor: node-executor
    resource_class: 2xlarge
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Install Locust
          command: pip install locust
      - run:
          name: Run Locust load test
          command: locust -f load-tests/streaming-users.py --headless -u 50000 -r 500 -t 30m --csv=reports/locust
      - run:
          name: Analyze streaming metrics
          command: |
            python scripts/analyze-streaming-metrics.py \
              --buffering-threshold 1.0 \
              --startup-threshold 2.0 \
              --csv-file reports/locust_stats.csv
      - store_artifacts:
          path: reports/locust
          destination: locust-load-test

  cdn-validation-staging:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: Validate CDN on staging
          command: ./scripts/validate-cdn-staging.sh
      - store_artifacts:
          path: reports/cdn-validation
          destination: cdn-validation-results

  transcoding-scale-test:
    executor: python-executor
    context: aws-staging
    steps:
      - checkout
      - assume-role
      - run:
          name: Test transcoding throughput
          command: ./scripts/test-transcoding-throughput.sh
      - store_artifacts:
          path: reports/transcoding
          destination: transcoding-throughput-results
```

Let's continue with more jobs:

```yaml
  e2e-streaming-tests:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages
      - run:
          name: Install Playwright
          command: npx playwright install --with-deps
      - run:
          name: Run HLS & DASH playback tests
          command: npx playwright test tests/e2e/playback.spec.ts
      - run:
          name: Run Widevine DRM tests
          command: npx playwright test tests/e2e/drm.spec.ts
      - run:
          name: Run multi-bitrate adaptation tests
          command: npx playwright test tests/e2e/bitrate-adaptation.spec.ts
      - run:
          name: Run accessibility checks
          command: npx playwright test tests/e2e/accessibility.spec.ts
      - store_artifacts:
          path: playwright-report
          destination: test-videos-and-reports

  security-dast:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: Install ZAP
          command: |
            sudo apt-get update
            sudo apt-get install -y openjdk-11-jre-headless
            curl -L https://github.com/zaproxy/zaproxy/releases/download/v2.12.0/ZAP_2.12.0_Linux.tar.gz | tar zx
      - run:
          name: Run OWASP ZAP scan
          command: |
            ./ZAP_2.12.0/zap.sh -cmd -quickurl https://staging-api.example.com -quickout reports/zap-report.html
      - run:
          name: Run SQLMap scan
          command: python3 scripts/run-sqlmap.py
      - run:
          name: Run Nuclei scan
          command: |
            wget -q https://github.com/projectdiscovery/nuclei/releases/download/v2.9.1/nuclei_2.9.1_linux_amd64.zip
            unzip nuclei_2.9.1_linux_amd64.zip
            ./nuclei -u https://staging-api.example.com -o reports/nuclei-results.txt
      - store_artifacts:
          path: reports/security-dast
          destination: dast-reports

  compliance-check:
    executor: terraform-executor
    context: aws-prod
    steps:
      - checkout
      - assume-role
      - run:
          name: Install Prowler
          command: |
            pip install prowler
      - run:
          name: Run Prowler AWS security checks
          command: prowler aws --output json --output-file reports/prowler-results.json
      - run:
          name: Validate content protection
          command: ./scripts/validate-content-protection.sh
      - run:
          name: Check copyright controls
          command: ./scripts/check-copyright-controls.sh
      - store_artifacts:
          path: reports/compliance
          destination: compliance-reports
```

Let's continue with more jobs:

```yaml
  deploy-prod-multiregion:
    executor: terraform-executor
    context: aws-prod
    steps:
      - checkout
      - assume-role
      - run:
          name: Apply Terraform - US East 1
          command: |
            cd terraform/multi-region
            terraform workspace select prod-us-east-1 || terraform workspace new prod-us-east-1
            terraform apply -auto-approve -var="region=us-east-1" -var="environment=prod"
      - run:
          name: Apply Terraform - US West 2
          command: |
            cd terraform/multi-region
            terraform workspace select prod-us-west-2 || terraform workspace new prod-us-west-2
            terraform apply -auto-approve -var="region=us-west-2" -var="environment=prod"
      - run:
          name: Apply Terraform - EU West 1
          command: |
            cd terraform/multi-region
            terraform workspace select prod-eu-west-1 || terraform workspace new prod-eu-west-1
            terraform apply -auto-approve -var="region=eu-west-1" -var="environment=prod"
      - run:
          name: Apply Terraform - EU Central 1
          command: |
            cd terraform/multi-region
            terraform workspace select prod-eu-central-1 || terraform workspace new prod-eu-central-1
            terraform apply -auto-approve -var="region=eu-central-1" -var="environment=prod"
      - run:
          name: Apply Terraform - AP Southeast 1
          command: |
            cd terraform/multi-region
            terraform workspace select prod-ap-southeast-1 || terraform workspace new prod-ap-southeast-1
            terraform apply -auto-approve -var="region=ap-southeast-1" -var="environment=prod"
      - run:
          name: Apply Terraform - AP Northeast 1
          command: |
            cd terraform/multi-region
            terraform workspace select prod-ap-northeast-1 || terraform workspace new prod-ap-northeast-1
            terraform apply -auto-approve -var="region=ap-northeast-1" -var="environment=prod"
      - run:
          name: Configure Route53 Latency Routing
          command: |
            cd terraform/route53
            terraform apply -auto-approve
      - run:
          name: Configure AWS Global Accelerator
          command: |
            cd terraform/global-accelerator
            terraform apply -auto-approve
      - store_artifacts:
          path: terraform/prod/outputs
          destination: prod-infra-outputs

  canary-prod-deployment:
    executor: node-executor
    context: aws-prod
    steps:
      - checkout
      - assume-role
      - run:
          name: Deploy canary to ECS
          command: ./scripts/deploy-canary-ecs.sh
      - run:
          name: Monitor canary metrics
          command: |
            ./scripts/monitor-canary.sh \
              --max-error-rate 0.1 \
              --max-buffer-ratio 2.0 \
              --duration 3600
      - store_artifacts:
          path: reports/canary
          destination: canary-metrics
```

Let's continue with more jobs:

```yaml
  promote-prod-canary:
    executor: node-executor
    context: aws-prod
    steps:
      - checkout
      - assume-role
      - run:
          name: Promote canary to 25% traffic### Answer 
---
```