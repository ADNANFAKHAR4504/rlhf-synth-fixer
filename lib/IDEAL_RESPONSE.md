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
    default: "us-east-1"
  environment:
    type: enum
    enum: [dev, staging, prod]
    default: dev
  cloudfront-distribution:
    type: string
    default: "streaming-distribution"

executors:
  node-executor:
    docker:
      - image: "${PRIVATE_REGISTRY}/node:20-alpine"
    resource_class: large
    environment:
      AWS_REGION: << pipeline.parameters.aws-region >>

  python-executor:
    docker:
      - image: "${PRIVATE_REGISTRY}/python:3.11-slim"
    environment:
      AWS_REGION: << pipeline.parameters.aws-region >>

  ffmpeg-executor:
    docker:
      - image: "${PRIVATE_REGISTRY}/jrottenberg/ffmpeg:ubuntu"
    resource_class: xlarge
    environment:
      AWS_REGION: << pipeline.parameters.aws-region >>

  terraform-executor:
    docker:
      - image: "${PRIVATE_REGISTRY}/hashicorp/terraform:1.6"
    environment:
      AWS_REGION: << pipeline.parameters.aws-region >>

  docker-executor:
    docker:
      - image: cimg/base:stable
    resource_class: large
    environment:
      AWS_REGION: << pipeline.parameters.aws-region >>

commands:
  assume-role:
    description: "Assume AWS IAM role via OIDC using aws-cli orb (role from context env var AWS_ROLE_ARN)"
    steps:
      - aws-cli/setup:
          role-arn: "${AWS_ROLE_ARN}"
          region: << pipeline.parameters.aws-region >>

  install-media-tools:
    description: "Install additional media tools (mediainfo, x264, x265) for video quality tests"
    steps:
      - run:
          name: Install media tools
          command: |
            set -euo pipefail
            if command -v apt-get >/dev/null 2>&1; then
              sudo apt-get update
              sudo apt-get install -y mediainfo x264 x265
            elif command -v yum >/dev/null 2>&1; then
              sudo yum install -y epel-release || true
              sudo yum install -y mediainfo x264 x265 || true
            else
              echo "Unsupported package manager, assuming tools are already present"

jobs:
  validate-code:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Lint TypeScript services with ESLint
          command: |
            set -euo pipefail
            npx eslint video-api upload-service webhook-handler admin-dashboard --ext .ts,.tsx
      - run:
          name: TypeScript compile check
          command: |
            set -euo pipefail
            npx tsc -p video-api/tsconfig.json
            npx tsc -p upload-service/tsconfig.json
            npx tsc -p webhook-handler/tsconfig.json
            npx tsc -p admin-dashboard/tsconfig.json
      - store_artifacts:
          path: reports/eslint
          when: always
      - store_artifacts:
          path: reports/tsc
          when: always

  validate-infrastructure:
    executor: terraform-executor
    steps:
      - checkout
      - run:
          name: Terraform fmt check
          command: |
            set -euo pipefail
            cd infra
            terraform fmt -check -recursive
      - run:
          name: Terraform validate (S3, CloudFront, ECS, MediaConvert)
          command: |
            set -euo pipefail
            cd infra
            terraform init -input=false
            terraform validate
      - run:
          name: tflint
          command: |
            set -euo pipefail
            cd infra
            tflint --recursive
      - run:
          name: tfsec security scan
          command: |
            set -euo pipefail
            cd infra
            tfsec .
      - store_artifacts:
          path: infra/reports
          when: always

  scan-dependencies:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: npm audit
          command: |
            set -euo pipefail
            npm audit || true
      - run:
          name: Snyk dependency scan
          command: |
            set -euo pipefail
            npx snyk test || true
      - run:
          name: License checker
          command: |
            set -euo pipefail
            mkdir -p reports
            npx license-checker --json > reports/license-report.json
      - store_artifacts:
          path: reports
          when: always

  build-transcoding-images:
    executor: docker-executor
    steps:
      - checkout
      - docker/check
      - assume-role
      - run:
          name: Login to ECR
          command: |
            set -euo pipefail
            aws ecr get-login-password --region "${AWS_REGION}" \
              | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
      - run:
          name: Build transcoding-worker image with ffmpeg/x264/x265
          command: |
            set -euo pipefail
            docker build -f docker/transcoding-worker.Dockerfile \
              -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/transcoding-worker:${CIRCLE_SHA1}" \
              .
      - run:
          name: Push transcoding-worker image to ECR
          command: |
            set -euo pipefail
            docker push "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/transcoding-worker:${CIRCLE_SHA1}"
      - run:
          name: Trivy scan (block on HIGH)
          command: |
            set -euo pipefail
            docker run --rm \
              -v /var/run/docker.sock:/var/run/docker.sock \
              aquasec/trivy:latest image \
              --exit-code 1 --severity HIGH,CRITICAL \
              "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/transcoding-worker:${CIRCLE_SHA1}" \
              --format sarif --output trivy-transcoding.sarif
      - store_artifacts:
          path: trivy-transcoding.sarif
          when: always

  build-api-images:
    executor: docker-executor
    steps:
      - checkout
      - docker/check
      - assume-role
      - run:
          name: Login to ECR
          command: |
            set -euo pipefail
            aws ecr get-login-password --region "${AWS_REGION}" \
              | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
      - run:
          name: Build API-related images
          command: |
            set -euo pipefail
            docker build -f docker/video-api.Dockerfile \
              -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/video-api:${CIRCLE_SHA1}" \
              ./video-api
            docker build -f docker/upload-service.Dockerfile \
              -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/upload-service:${CIRCLE_SHA1}" \
              ./upload-service
            docker build -f docker/webhook-handler.Dockerfile \
              -t "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/webhook-handler:${CIRCLE_SHA1}" \
              ./webhook-handler
      - run:
          name: Push API images to ECR
          command: |
            set -euo pipefail
            for svc in video-api upload-service webhook-handler; do
              docker push "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/${svc}:${CIRCLE_SHA1}"
            done
      - run:
          name: Grype container scan
          command: |
            set -euo pipefail
            for svc in video-api upload-service webhook-handler; do
              docker run --rm \
                anchore/grype:latest \
                "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/streaming/${svc}:${CIRCLE_SHA1}" \
                --output sarif > "grype-${svc}.sarif"
            done
      - store_artifacts:
          path: .
          when: always

  unit-tests:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Run Jest unit tests with coverage
          command: |
            set -euo pipefail
            npm test -- --coverage
      - store_test_results:
          path: reports/junit
          when: always
      - store_artifacts:
          path: coverage
          when: always

  integration-tests:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Start LocalStack via docker-compose
          command: |
            set -euo pipefail
            docker-compose -f docker-compose.localstack.yml up -d
      - run:
          name: Run integration tests (upload flow, webhook processing)
          command: |
            set -euo pipefail
            npm run test:integration
      - store_test_results:
          path: reports/integration
          when: always
      - store_artifacts:
          path: reports/integration
          when: always

  video-quality-tests:
    executor: ffmpeg-executor
    steps:
      - checkout
      - install-media-tools
      - run:
          name: Test transcoding quality (VMAF/HLS validation)
          command: |
            set -euo pipefail
            chmod +x scripts/test-transcoding-quality.sh
            scripts/test-transcoding-quality.sh \
              --profiles "1080p,720p,480p,360p" \
              --min-vmaf 90 \
              --validate-hls
      - store_artifacts:
          path: reports/video-quality
          when: always
      - store_artifacts:
          path: outputs/sample-videos
          when: always

  security-scan:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Semgrep static analysis
          command: |
            set -euo pipefail
            npx semgrep --config auto || true
      - run:
          name: TruffleHog secret scanning
          command: |
            set -euo pipefail
            trufflehog filesystem . --only-verified --fail || true
      - run:
          name: Checkov IaC scan (Terraform + K8s manifests)
          command: |
            set -euo pipefail
            checkov -d infra || true
      - store_artifacts:
          path: reports/security
          when: always

  performance-test:
    executor: node-executor
    resource_class: xlarge
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: k6 load test for 10k concurrent uploads
          command: |
            set -euo pipefail
            k6 run k6/upload-test.js
      - run:
          name: Artillery sustained load test
          command: |
            set -euo pipefail
            npx artillery run artillery/api-load.yml
      - store_artifacts:
          path: reports/performance
          when: always

  cdn-performance:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: Test CDN performance with CloudFront
          command: |
            set -euo pipefail
            chmod +x scripts/test-cdn-performance.sh
            scripts/test-cdn-performance.sh \
              --distribution-id "<< pipeline.parameters.cloudfront-distribution >>"
      - store_artifacts:
          path: reports/cdn
          when: always

  deploy-dev-infrastructure:
    executor: terraform-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: Terraform apply dev workspace (S3, CloudFront, ECS, MediaConvert, DynamoDB)
          command: |
            set -euo pipefail
            cd infra
            terraform init -input=false
            terraform workspace select dev || terraform workspace new dev
            terraform apply -auto-approve -input=false
      - store_artifacts:
          path: infra/terraform.tfstate.d/dev
          when: always

  deploy-dev-services:
    executor: node-executor
    steps:
      - checkout
      - assume-role
      - aws-ecs/update-service:
          family: "video-api"
          cluster-name: "streaming-dev-ecs"
          container-image-name-updates: "container=video-api,tag=${CIRCLE_SHA1}"
      - aws-ecs/update-service:
          family: "upload-service"
          cluster-name: "streaming-dev-ecs"
          container-image-name-updates: "container=upload-service,tag=${CIRCLE_SHA1}"
      - aws-ecs/update-service:
          family: "webhook-handler"
          cluster-name: "streaming-dev-ecs"
          container-image-name-updates: "container=webhook-handler,tag=${CIRCLE_SHA1}"
      - run:
          name: Run database migrations
          command: |
            set -euo pipefail
            npm run migrate
      - run:
          name: Configure MediaConvert job templates
          command: |
            set -euo pipefail
            chmod +x scripts/configure-mediaconvert.sh
            scripts/configure-mediaconvert.sh
      - store_artifacts:
          path: deploy/dev
          when: always

  integration-test-dev:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: Newman E2E test for dev environment
          command: |
            set -euo pipefail
            newman run postman/streaming-e2e.postman_collection.json \
              --env-var baseUrl="$DEV_BASE_URL"
      - store_test_results:
          path: reports/dev-e2e
          when: always
      - store_artifacts:
          path: reports/dev-e2e
          when: always

  deploy-staging-blue-green:
    executor: terraform-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: Terraform apply staging in 3 regions
          command: |
            set -euo pipefail
            cd infra
            terraform init -input=false
            terraform workspace select staging || terraform workspace new staging
            terraform apply -auto-approve -input=false \
              -var 'regions=["us-east-1","eu-west-1","ap-southeast-1"]'
      - run:
          name: Blue-green ECS deployment with smoke tests
          command: |
            set -euo pipefail
            chmod +x scripts/deploy-blue-green-ecs.sh
            scripts/deploy-blue-green-ecs.sh \
              --regions "us-east-1,eu-west-1,ap-southeast-1" \
              --keep-blue-hours 2
      - store_artifacts:
          path: deploy/staging
          when: always

  load-test-staging:
    executor: node-executor
    resource_class: 2xlarge
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Locust 50k concurrent users
          command: |
            set -euo pipefail
            locust -f load/locustfile.py --headless -u 50000 -r 1000 -t 30m
      - run:
          name: Analyze buffering and startup time
          command: |
            set -euo pipefail
            python scripts/analyze-load-metrics.py
      - store_artifacts:
          path: reports/staging-load
          when: always

  cdn-validation-staging:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: Validate CDN behavior in staging
          command: |
            set -euo pipefail
            chmod +x scripts/validate-cdn-staging.sh
            scripts/validate-cdn-staging.sh
      - store_artifacts:
          path: reports/staging-cdn
          when: always

  transcoding-scale-test:
    executor: python-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: MediaConvert throughput test (1000 parallel jobs)
          command: |
            set -euo pipefail
            chmod +x scripts/test-transcoding-throughput.sh
            scripts/test-transcoding-throughput.sh \
              --jobs 1000 \
              --min-vmaf 90
      - store_artifacts:
          path: reports/transcoding-scale
          when: always

  e2e-streaming-tests:
    executor: node-executor
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Playwright cross-browser streaming tests
          command: |
            set -euo pipefail
            npx playwright install-deps
            npx playwright test --config=playwright.config.ts
      - store_test_results:
          path: reports/e2e
          when: always
      - store_artifacts:
          path: reports/e2e
          when: always
      - store_artifacts:
          path: outputs/test-videos
          when: always

  security-dast:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: OWASP ZAP API scan
          command: |
            set -euo pipefail
            docker run --rm -v "$(pwd)":/zap/wrk -t owasp/zap2docker-stable \
              zap-baseline.py -t "$STAGING_BASE_URL" -x zap-report.xml || true
      - run:
          name: sqlmap scan
          command: |
            set -euo pipefail
            python scripts/run-sqlmap.py "$STAGING_BASE_URL" || true
      - run:
          name: nuclei scan
          command: |
            set -euo pipefail
            nuclei -u "$STAGING_BASE_URL" -o nuclei-report.txt || true
      - store_artifacts:
          path: reports/dast
          when: always

  compliance-check:
    executor: terraform-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: Prowler AWS security best practices
          command: |
            set -euo pipefail
            prowler -M json-asff -o prowler-report
      - run:
          name: Validate content protection
          command: |
            set -euo pipefail
            chmod +x scripts/validate-content-protection.sh
            scripts/validate-content-protection.sh
      - run:
          name: Check copyright controls
          command: |
            set -euo pipefail
            chmod +x scripts/check-copyright-controls.sh
            scripts/check-copyright-controls.sh
      - store_artifacts:
          path: reports/compliance
          when: always

  deploy-prod-multiregion:
    executor: terraform-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: Terraform apply multi-region production
          command: |
            set -euo pipefail
            cd infra
            terraform init -input=false
            terraform workspace select prod || terraform workspace new prod
            terraform apply -auto-approve -input=false \
              -var 'regions=["us-east-1","us-west-2","eu-west-1","eu-central-1","ap-southeast-1","ap-northeast-1"]'
      - store_artifacts:
          path: infra/terraform.tfstate.d/prod
          when: always

  canary-prod-deployment:
    executor: node-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: Canary ECS deployment 5% traffic in all regions
          command: |
            set -euo pipefail
            chmod +x scripts/deploy-canary-ecs.sh
            scripts/deploy-canary-ecs.sh \
              --regions "us-east-1,us-west-2,eu-west-1,eu-central-1,ap-southeast-1,ap-northeast-1" \
              --initial-traffic 5 \
              --error-threshold 0.1 \
              --buffer-threshold 2 \
              --observe-minutes 60
      - store_artifacts:
          path: reports/canary
          when: always

  promote-prod-canary:
    executor: node-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: Promote canary 5% → 25% → 50% → 100%
          command: |
            set -euo pipefail
            chmod +x scripts/promote-canary.sh
            scripts/promote-canary.sh \
              --regions "us-east-1,us-west-2,eu-west-1,eu-central-1,ap-southeast-1,ap-northeast-1" \
              --steps "5,25,50,100" \
              --interval-minutes 30
      - store_artifacts:
          path: reports/canary-promotion
          when: always

  smoke-test-prod:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: Synthetic playback tests from all regions
          command: |
            set -euo pipefail
            npm run test:smoke-prod
      - run:
          name: CDN edge validation
          command: |
            set -euo pipefail
            scripts/test-cdn-performance.sh --global-edges 20
      - store_artifacts:
          path: reports/prod-smoke
          when: always

  setup-monitoring:
    executor: python-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: Configure CloudWatch dashboards and alarms
          command: |
            set -euo pipefail
            chmod +x scripts/configure-cloudwatch.sh
            scripts/configure-cloudwatch.sh
      - run:
          name: Configure Datadog and Sentry & PagerDuty
          command: |
            set -euo pipefail
            chmod +x scripts/configure-datadog.sh
            scripts/configure-datadog.sh
            chmod +x scripts/setup-sentry.sh
            scripts/setup-sentry.sh
      - store_artifacts:
          path: reports/monitoring
          when: always

  video-analytics:
    executor: python-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: Configure analytics pipeline (Kinesis + Athena + QuickSight)
          command: |
            set -euo pipefail
            chmod +x scripts/configure-analytics.sh
            scripts/configure-analytics.sh
      - store_artifacts:
          path: reports/analytics
          when: always

  disaster-recovery-test:
    executor: terraform-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: Regional failover DR test
          command: |
            set -euo pipefail
            chmod +x scripts/test-regional-failover.sh
            scripts/test-regional-failover.sh
      - store_artifacts:
          path: reports/dr
          when: always

  rollback-production:
    executor: node-executor
    steps:
      - checkout
      - assume-role
      - run:
          name: Rollback ECS services and CDN
          command: |
            set -euo pipefail
            chmod +x scripts/rollback-ecs.sh
            scripts/rollback-ecs.sh \
              --regions "us-east-1,us-west-2,eu-west-1,eu-central-1,ap-southeast-1,ap-northeast-1"
      - store_artifacts:
          path: reports/rollback
          when: always

workflows:
  streaming-pipeline:
    jobs:
      - validate-code
      - validate-infrastructure
      - scan-dependencies

      - build-transcoding-images:
          requires:
            - scan-dependencies

      - build-api-images:
          requires:
            - scan-dependencies

      - unit-tests:
          requires:
            - validate-code

      - integration-tests:
          requires:
            - build-api-images

      - video-quality-tests:
          requires:
            - build-transcoding-images

      - security-scan:
          requires:
            - scan-dependencies

      - performance-test:
          requires:
            - integration-tests

      - cdn-performance:
          requires:
            - integration-tests

      - deploy-dev-infrastructure:
          context:
            - aws-dev
          requires:
            - validate-code
            - validate-infrastructure
            - scan-dependencies
            - security-scan
            - performance-test
            - cdn-performance
          filters:
            branches:
              only: main

      - deploy-dev-services:
          context:
            - aws-dev
          requires:
            - deploy-dev-infrastructure
          filters:
            branches:
              only: main

      - integration-test-dev:
          requires:
            - deploy-dev-services
          filters:
            branches:
              only: main

      - staging-approval:
          type: approval
          requires:
            - integration-test-dev
          filters:
            branches:
              only: main

      - deploy-staging-blue-green:
          context:
            - aws-staging
          requires:
            - staging-approval
          filters:
            branches:
              only: main

      - load-test-staging:
          requires:
            - deploy-staging-blue-green
          filters:
            branches:
              only: main

      - cdn-validation-staging:
          requires:
            - load-test-staging
          filters:
            branches:
              only: main

      - transcoding-scale-test:
          context:
            - aws-staging
          requires:
            - load-test-staging
          filters:
            branches:
              only: main

      - e2e-streaming-tests:
          requires:
            - cdn-validation-staging
          filters:
            branches:
              only: main

      - security-dast:
          requires:
            - cdn-validation-staging
          filters:
            branches:
              only: main

      - compliance-check:
          context:
            - aws-prod
          requires:
            - security-dast
          filters:
            branches:
              only: main

      - production-approval:
          type: approval
          requires:
            - compliance-check
          filters:
            branches:
              only: main

      - deploy-prod-multiregion:
          context:
            - aws-prod
          requires:
            - production-approval
          filters:
            branches:
              only: main

      - canary-prod-deployment:
          context:
            - aws-prod
          requires:
            - deploy-prod-multiregion
          filters:
            branches:
              only: main

      - promote-prod-canary:
          context:
            - aws-prod
          requires:
            - canary-prod-deployment
          filters:
            branches:
              only: main

      - smoke-test-prod:
          requires:
            - promote-prod-canary
          filters:
            branches:
              only: main

      - setup-monitoring:
          context:
            - aws-prod
          requires:
            - smoke-test-prod
          filters:
            branches:
              only: main

      - video-analytics:
          context:
            - aws-prod
          requires:
            - smoke-test-prod
          filters:
            branches:
              only: main

      - disaster-recovery-test:
          context:
            - aws-prod
          requires:
            - setup-monitoring
          filters:
            branches:
              only: main

      - approve-rollback:
          type: approval
          context:
            - aws-prod
          filters:
            branches:
              only: main

      - rollback-production:
          context:
            - aws-prod
          requires:
            - approve-rollback
          filters:
            branches:
              only: main

```