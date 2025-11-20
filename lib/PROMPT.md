---

#### **Prompt:**

> You are a senior AWS CDK engineer specializing in **CI/CD for containerized microservices** using **TypeScript (CDK v2)**.
> Your task is to generate a **complete CDK application** that provisions a multi-stage CI/CD pipeline for ECS Fargate microservices, with automated tests, OWASP dependency scanning, blue-green deployments via CodeDeploy, and full observability.
>
> **Deliverables**
>
> * `main.ts` — CDK app entrypoint and stack initialization.
> * `tapstack.ts` — Full infrastructure stack wiring CodePipeline, CodeBuild, ECS Fargate, CodeDeploy, ALB, S3, SNS, SSM Parameter Store, IAM, and CloudWatch Logs end-to-end.
>
> ---
>
> ### 📘 Input Specification
>
> ```json
> {
>   "problem": "Create a CDK TypeScript program to build a CI/CD pipeline for containerized microservices. The configuration must: 1. Define a CodePipeline with source, build, test, and deploy stages 2. Configure CodeBuild projects for unit testing, integration testing, and security scanning using OWASP dependency check 3. Set up ECS Fargate service with task definitions supporting blue-green deployments via CodeDeploy 4. Create an Application Load Balancer with target groups for blue and green environments 5. Implement S3 buckets for storing build artifacts with 30-day retention policies 6. Configure SNS topic and email subscriptions for pipeline failure notifications 7. Add manual approval action before production deployment stage 8. Store deployment parameters (image tags, environment variables) in Parameter Store 9. Set up IAM roles with least privilege for pipeline, build projects, and ECS tasks 10. Configure CodeDeploy application with deployment group for ECS blue-green deployments 11. Enable CloudWatch Logs for all CodeBuild projects and ECS tasks 12. Tag all resources with Environment, Team, and CostCenter tags.",
>   "expected_output": "A complete CDK application that deploys a fully functional CI/CD pipeline capable of building Docker images from source code, running automated tests, performing security scans, and deploying to ECS using blue-green deployment strategy with zero-downtime releases.",
>   "background": "A fintech startup needs to establish a continuous integration and deployment pipeline for their payment processing microservices. The team requires automated testing, security scanning, and blue-green deployments to minimize downtime during releases.",
>   "environment": "AWS deployment in us-east-1 region utilizing CodePipeline for CI/CD orchestration, CodeBuild for build and test execution, ECS Fargate for container hosting, and CodeDeploy for blue-green deployments. Infrastructure includes VPC with public and private subnets across 2 availability zones, Application Load Balancer for traffic distribution, and ECR for container image storage. Requires CDK 2.x with TypeScript, Node.js 16+, Docker installed locally, and AWS CLI configured with appropriate permissions.",
>   "constraints": [
>     "Use AWS CodePipeline as the primary orchestration service",
>     "Implement separate stages for unit tests, integration tests, and security scans",
>     "Deploy to ECS Fargate with blue-green deployment strategy",
>     "Store build artifacts in S3 with lifecycle policies",
>     "Use CodeBuild for all build and test stages",
>     "Implement manual approval gates before production deployment",
>     "Configure SNS notifications for pipeline failures",
>     "Use Parameter Store for storing deployment configuration"
>   ]
> }
> ```
>
> ---
>
> ### 🧩 Output Requirements
>
> 1. Use **AWS CDK v2 (TypeScript)** with modules:
>
>    * `aws-codepipeline`, `aws-codepipeline-actions`, `aws-codebuild`, `aws-codecommit` (or GitHub placeholder if needed),
>    * `aws-ecr`, `aws-ecs`, `aws-ecs-patterns` (optional), `aws-codedeploy`, `aws-elasticloadbalancingv2`,
>    * `aws-s3`, `aws-s3-deployment` (optional), `aws-sns`, `aws-sns-subscriptions`,
>    * `aws-ssm`, `aws-iam`, `aws-logs`, `aws-cloudwatch`, `aws-cloudwatch-actions`, `aws-ec2`.
> 2. Implement and correctly **wire** all components:
>
>    * **VPC & Networking**
>
>      * VPC in `us-east-1` with 2 AZs, public subnets for ALB, private subnets for ECS Fargate tasks.
>    * **Artifact Storage (S3)**
>
>      * Bucket for pipeline artifacts with **versioning** and **30-day lifecycle retention**; encryption enabled.
>    * **ECR Repository**
>
>      * For microservice images; image scanning on push (if you choose to include it as an enhancement).
>    * **ECS Fargate + ALB + CodeDeploy**
>
>      * ECS Cluster using Fargate.
>      * Task Definition with appropriate CPU/memory and **CloudWatch Logs** configured.
>      * ECS Service configured for **blue-green** via CodeDeploy ECS:
>
>        * Application Load Balancer with **two target groups**: blue and green.
>        * Listener(s) routing to blue/green as managed by CodeDeploy.
>      * CodeDeploy ECS Application + DeploymentGroup wired to the ECS service and ALB target groups.
>    * **CodeBuild Projects**
>
>      * **Unit Test Project**: runs unit tests (e.g., pytest or equivalent) and publishes results to logs/artifacts.
>      * **Integration Test Project**: runs after deploying to a staging/green environment; uses environment variables/SSM to hit the right endpoint.
>      * **Security Scan Project**: runs **OWASP Dependency Check** (or equivalent) as a dedicated stage.
>      * All projects use CloudWatch Logs and least-privilege IAM; Docker build/push if you include ECR build.
>    * **CodePipeline**
>
>      * Stages:
>
>        1. **Source** (CodeCommit or placeholder)
>        2. **Build** (Docker build + push, optional)
>        3. **UnitTests** (CodeBuild)
>        4. **SecurityScan** (CodeBuild OWASP)
>        5. **DeployToStaging** (ECS blue/green or separate ECS service)
>        6. **IntegrationTests** (CodeBuild against staging)
>        7. **ManualApproval** (pre-prod) with **SNS** notifications to email subscribers
>        8. **DeployToProd** (CodeDeploy ECS blue/green)
>      * Uses the S3 artifact bucket for all artifacts.
>    * **Notifications & Config**
>
>      * **SNS Topic** with email subscriptions for pipeline **failures**.
>      * **SSM Parameter Store** holds deployment configuration (image tags, env vars, endpoint URLs).
>    * **IAM**
>
>      * Separate, least-privilege roles for:
>
>        * CodePipeline
>        * CodeBuild projects
>        * ECS task execution & task role
>        * CodeDeploy ECS
>      * Only required actions allowed for each component.
>    * **Logging & Monitoring**
>
>      * CloudWatch Logs enabled and configured for:
>
>        * All CodeBuild projects
>        * ECS tasks (application + sidecars if any)
>      * Optional: simple CloudWatch alarms for pipeline failures or unhealthy ECS tasks.
> 3. **Tagging**
>
>    * Tag **all resources** with at least:
>
>      * `Environment`
>      * `Team`
>      * `CostCenter`
> 4. **Code Style & Structure**
>
>    * Clear, modular CDK code with inline comments for each major section:
>      `// 🔹 VPC`, `// 🔹 Artifact Bucket`, `// 🔹 ECR`, `// 🔹 ECS & ALB`, `// 🔹 CodeDeploy`, `// 🔹 CodeBuild Projects`, `// 🔹 CodePipeline`, `// 🔹 SNS & SSM`, `// 🔹 IAM`.
> 5. Output **only two files** in fenced code blocks:
>
>    * `main.ts`
>    * `tapstack.ts`
>      No extra prose.
>
> ---
>
> ### 🎯 Goal
>
> Deliver a **production-ready CI/CD pipeline** that:
>
> * Uses **CodePipeline** as the main orchestrator
> * Builds and tests Dockerized microservices with **unit, integration, and OWASP security scans**
> * Deploys to **ECS Fargate** using **blue-green via CodeDeploy** for zero-downtime releases
> * Stores artifacts in S3 with lifecycle policies
> * Sends **SNS notifications** on failures and uses **SSM Parameter Store** for deployment configuration
> * Enforces **least-privilege IAM** and consistent tagging across all resources

---