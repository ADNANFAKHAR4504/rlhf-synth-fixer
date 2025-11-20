#### **Prompt:**

> You are a senior AWS CDK engineer specializing in **multi-stage CI/CD** for containerized services using **TypeScript (CDK v2)**.
> Analyze the spec and produce a **complete CDK application** that wires CodeCommit → CodePipeline → CodeBuild (build/unit/integration) → ECR → ECS Fargate (blue/green via CodeDeploy) with alarms, rollbacks, Slack notifications, artifact S3, and SSM Parameter Store.
>
> **Deliverables**
>
> * `main.ts` — CDK app entrypoint and stack initialization.
> * `tapstack.ts` — Full pipeline stack: CodeCommit, ECR, S3 artifacts, CodeBuild projects, CodePipeline stages, CodeDeploy blue/green for ECS, ALB, CloudWatch alarms/rollback, Slack notifier Lambda, IAM, and SSM parameters — all connected.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to implement a multi-stage CI/CD pipeline for a containerized payment processing service. The configuration must: 1. Define a CodePipeline with source, build, test, and deploy stages connected to a CodeCommit repository. 2. Configure CodeBuild projects for building Docker images and running unit tests with pytest coverage reports. 3. Set up ECR repository with image scanning on push and lifecycle policies to retain only the last 10 images. 4. Implement ECS Fargate service with blue-green deployment using CodeDeploy and Application Load Balancer. 5. Create separate CodeBuild project for integration tests that runs against staging environment. 6. Configure Lambda function to post pipeline status updates to Slack via webhook. 7. Implement CloudWatch alarms for ECS service health with automatic rollback triggers. 8. Set up manual approval action before production deployment with SNS notifications. 9. Create IAM roles with least privilege for each pipeline component. 10. Configure S3 bucket for pipeline artifacts with versioning and lifecycle policies. 11. Implement parameter store for storing Slack webhook URL and other sensitive configuration.",
>   "expected_output": "A complete CDK stack that deploys a production-ready CI/CD pipeline with automated testing, security scanning, blue-green deployments, and rollback capabilities. The pipeline should handle the full lifecycle from code commit to production deployment with proper monitoring and notifications.",
>   "environment": "AWS us-east-1. Services: CodeCommit, CodePipeline, CodeBuild, ECR, ECS Fargate, CodeDeploy (blue/green), ALB, CloudWatch, SNS, Lambda, S3, SSM Parameter Store. CDK v2 + TypeScript, Node.js 18+, Docker installed.",
>   "constraints": [
>     "ECR image scanning on push and retain last 10 images",
>     "Unit tests run with pytest and publish coverage reports",
>     "Integration tests run against staging after deploy",
>     "Manual approval before production with SNS notifications",
>     "CloudWatch alarms must trigger automatic rollback for prod deploy",
>     "Artifact bucket must have versioning and lifecycle policies",
>     "Use SSM Parameter Store for Slack webhook and secrets",
>     "IAM least privilege for all pipeline components"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Use **AWS CDK v2 (TypeScript)** with:
>    `aws-codecommit`, `aws-codepipeline`, `aws-codepipeline-actions`, `aws-codebuild`, `aws-ecr`, `aws-ecs`, `aws-ecs-patterns` (optional), `aws-codedeploy`, `aws-elasticloadbalancingv2`, `aws-cloudwatch`, `aws-cloudwatch-actions`, `aws-sns`, `aws-sns-subscriptions`, `aws-lambda`, `aws-lambda-nodejs` (optional), `aws-s3`, `aws-ssm`, `aws-iam`, `aws-logs`.
> 2. Implement and correctly **wire** all components:
>
>    * **CodeCommit**: repo as pipeline source (branch = `main` by default).
>    * **Artifact Store (S3)**: versioning on; lifecycle to expire noncurrent versions after N days; encryption enabled.
>    * **ECR**: scanning on push; lifecycle to keep last **10** images; output repo URI.
>    * **CodeBuild Projects**:
>
>      * **Build**: Docker build/push to ECR; exports image tag/artifact.
>      * **Unit Tests**: run **pytest** with coverage; publish reports to artifacts/CloudWatch logs.
>      * **Integration Tests**: runs after staging deploy; targets staging endpoint via env vars/SSM.
>      * All projects in private subnets if needed; CW log groups with retention; minimal IAM.
>    * **ECS + CodeDeploy Blue/Green**:
>
>      * ECS Fargate service behind **ALB** with two target groups (blue/green).
>      * `CodeDeployEcsApplication` + `EcsDeploymentGroup` with automatic rollback on CW alarm.
>      * Health checks (e.g., `/health`) and prod/staging listeners.
>    * **Pipeline Stages**:
>
>      * **Source → Build (image) → UnitTest → Staging Deploy → IntegrationTest → ManualApproval → Prod Deploy**.
>      * Manual approval action sends **SNS** notification to approvers.
>    * **Slack Notifier Lambda**:
>
>      * Posts pipeline state changes to Slack via webhook URL from **SSM Parameter Store**.
>      * Subscribed to CodePipeline state change events or invoked by pipeline action.
>    * **Monitoring & Rollback**:
>
>      * CloudWatch **alarms** for ECS service health (5xx, UnhealthyHostCount, TargetResponseTime).
>      * Alarms wired to CodeDeploy for **automatic rollback** on prod deploy failures.
>    * **IAM**:
>
>      * Least privilege roles for Pipeline, CodeBuild, CodeDeploy, ECS tasks, Lambda notifier, and artifact access.
> 3. **Outputs**:
>
>    * ALB DNS name, ECR repository URI, CodeDeploy application name, and (optional) staging/prod URLs.
> 4. **Tags**:
>
>    * Apply consistent tags: `Environment`, `Service=Payments`, `ManagedBy=CDK`.
> 5. **Comments & Structure**:
>
>    * Clear section headers in code: `// 🔹 CodeCommit`, `// 🔹 Artifact Bucket`, `// 🔹 ECR`, `// 🔹 CodeBuild`, `// 🔹 ECS + CodeDeploy`, `// 🔹 Pipeline`, `// 🔹 Alarms`, `// 🔹 Slack Notifier`, `// 🔹 IAM`.
> 6. Output **only two files** — `main.ts` and `tapstack.ts` — in fenced code blocks. No extra prose.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **production-ready CI/CD pipeline** that:
>
> * Builds, tests, and deploys a containerized payment service to **ECS Fargate**
> * Uses **CodeDeploy blue/green** for zero-downtime releases with **automatic rollback**
> * Publishes **coverage and integration test results**
> * Sends **Slack** updates and **SNS approvals**
> * Enforces **least-privilege IAM** and secure artifact handling