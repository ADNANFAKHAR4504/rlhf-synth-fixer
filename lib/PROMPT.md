---

#### **Prompt:**

> You are a senior AWS CDK engineer specializing in **multi-account CI/CD automation** using **TypeScript (CDK v2)**.
> Your task is to **analyze the given specification** and generate a **complete CDK program** that automates code deployments for containerized microservices across development, staging, and production environments, with approval gates, rollback logic, and full observability.
>
> **Deliverables:**
>
> * `main.ts` — CDK entrypoint that initializes the multi-account deployment pipeline app.
> * `tapstack.ts` — Full CDK stack implementing the multi-stage pipeline (CodePipeline, CodeBuild, CodeDeploy, CloudWatch, IAM, S3, SNS, ECR, ECS) with all stages connected and secured.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK program to establish a complete CI/CD pipeline for a containerized microservices application. The configuration must: 1. Create a CodePipeline with source, build, test, and deploy stages 2. Configure S3 bucket for pipeline artifacts with proper versioning and encryption 3. Set up CodeBuild projects for compilation, unit testing, and container image building 4. Implement manual approval gate between staging and production environments 5. Configure CodeDeploy applications for blue-green deployments to ECS services 6. Create IAM roles and policies with least-privilege access for all pipeline components 7. Set up CloudWatch log groups with appropriate retention policies for all stages 8. Configure SNS notifications for pipeline state changes and approval requests 9. Implement CloudWatch alarms for deployment monitoring and automatic rollback triggers 10. Create ECR repositories for storing custom build environment Docker images. Expected output: A CDK program that deploys a production-ready CI/CD pipeline capable of automatically building, testing, and deploying containerized applications across multiple environments with proper security controls and monitoring.",
>   "background": "A software development team needs to establish an automated deployment pipeline for their microservices application. The pipeline must automatically deploy code changes through development, staging, and production environments while maintaining proper approval gates and rollback capabilities.",
>   "environment": "Multi-account AWS environment deployed in us-east-1 region. Infrastructure includes CodePipeline for orchestration, CodeBuild for compilation and testing, CodeDeploy for ECS deployments, and S3 for artifact storage. Requires CDK 2.x with TypeScript, Node.js 18+, and AWS CLI configured with cross-account roles for multi-environment deployments across dev, staging, and prod accounts.",
>   "constraints": [
>     "Pipeline must use S3 for artifact storage with versioning enabled",
>     "CodeBuild projects must use custom Docker images stored in ECR",
>     "Manual approval action required between staging and production deployments",
>     "All pipeline stages must have CloudWatch logging enabled with 30-day retention",
>     "Production deployment must include automatic rollback on CloudWatch alarm triggers"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Use **AWS CDK v2 with TypeScript** and include constructs from `aws-codepipeline`, `aws-codepipeline-actions`, `aws-codebuild`, `aws-codedeploy`, `aws-ecr`, `aws-ecs`, `aws-iam`, `aws-s3`, `aws-cloudwatch`, `aws-sns`, and `aws-events`.
> 2. Implement and connect the following resources:
>
>    * **Artifact Storage (S3):**
>
>      * Versioned, encrypted bucket for pipeline artifacts.
>      * Cross-account access for multi-env builds and deploys.
>    * **ECR Repositories:**
>
>      * Store **custom build images** for CodeBuild.
>      * Add lifecycle policies to retain latest 10 image versions.
>    * **CodeBuild Projects:**
>
>      * Build, test, and container image stages using ECR-based Docker images.
>      * Environment variables: branch, environment, artifact paths.
>      * Private subnets for network isolation (no public Internet).
>      * CloudWatch log groups with **30-day retention** and KMS encryption.
>    * **CodePipeline Orchestration:**
>
>      * Stages: **Source → Build → Test → Deploy (Staging) → Approval → Deploy (Prod)**.
>      * Manual approval between staging and prod with **SNS notification** to approvers.
>      * Artifact flow via S3 bucket.
>      * IAM roles with scoped permissions per stage.
>    * **CodeDeploy (ECS Blue-Green):**
>
>      * Separate applications/deployment groups for staging and prod.
>      * Auto-rollback triggered by **CloudWatch alarms** on failed health checks or latency.
>    * **Monitoring & Alerts:**
>
>      * CloudWatch **alarms** on pipeline failures, CodeBuild errors, and ECS deployment metrics.
>      * SNS topics for pipeline state changes and approval requests.
>      * CloudWatch dashboards summarizing pipeline status, build durations, and rollback counts.
> 3. Apply **least-privilege IAM** roles for CodePipeline, CodeBuild, CodeDeploy, Lambda (rollback triggers if used), and SNS.
> 4. Ensure **multi-account support** by defining cross-account roles or artifact replication between dev/staging/prod accounts.
> 5. Apply consistent **naming and tagging** convention: `{company}-{service}-{environment}-{resource}` and tags (`Environment`, `Team`, `CostCenter`).
> 6. Add comments dividing sections (`// 🔹 Artifact Store`, `// 🔹 CodeBuild`, `// 🔹 Pipeline`, `// 🔹 Rollback Monitoring`).
> 7. Output **only two files**:
>
>    * `main.ts` — CDK app initialization
>    * `tapstack.ts` — Full multi-stage pipeline implementation
> 8. No extra prose — output code only.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **multi-account, multi-stage CI/CD pipeline** using **AWS CDK (TypeScript)** that:
>
> * Automates code builds, tests, and deployments
> * Enforces approval gates between staging and production
> * Uses ECR for custom build environments
> * Maintains rollback automation on CloudWatch alarms
> * Ensures compliance with least-privilege IAM, logging, and artifact encryption
>
> Focus on:
>
> * **Accurate stage connections and artifact handoffs**
> * **Monitoring and rollback wiring**
> * **Cross-account IAM and security hardening**
> * **Clear modular CDK design**

---