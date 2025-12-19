# CloudFormation CI/CD Infrastructure - Multi-Environment Implementation

## Objective

You are a senior AWS infrastructure engineer specializing in **multi-environment CI/CD** for containerized applications.
Your task is to produce a **single CloudFormation template (YAML)** that defines the **entire CI/CD infrastructure** across dev, staging, and prod, including VPCs, ECR, CodeCommit, CodePipeline, CodeBuild, ECS Fargate, CodeDeploy, SSM Parameter Store, CloudWatch, SNS, S3, and IAM.
The template must be production-ready, enforce strict environment isolation, use least-privilege IAM, and provide monitoring and approval gates.

## Deliverable

* `ci-cd.yml` — a complete **CloudFormation YAML template** that can be deployed to create all CI/CD and environment resources described below.

---

## Input Specification

```json
{
  "problem": "Create a CDK TypeScript program to deploy a complete CI/CD pipeline for containerized applications. The configuration must: 1. Set up three separate VPCs (development, staging, production) with private subnets and NAT gateways. 2. Create an ECR repository with image scanning enabled and lifecycle policies for untagged images. 3. Configure CodeCommit repository with branch triggers (dev, staging, main branches). 4. Build a CodePipeline with source, build, test, and deploy stages for each environment. 5. Implement CodeBuild projects for Docker image building and automated testing with buildspec files. 6. Configure ECS clusters and services in each VPC with Fargate launch type. 7. Set up CodeDeploy for blue-green deployments with automatic rollback on failures. 8. Create Parameter Store hierarchies (/app/dev/*, /app/staging/*, /app/prod/*) with KMS encryption. 9. Implement CloudWatch alarms for deployment failures, container health, and resource utilization. 10. Add manual approval action before production deployments with SNS topic for notifications. 11. Configure IAM roles with scoped permissions for each pipeline component. 12. Set up S3 bucket for pipeline artifacts with server-side encryption and lifecycle rules.",
  "expected_output": "A complete CDK application that deploys the entire CI/CD infrastructure with proper separation of concerns, security controls, and monitoring. The pipeline should automatically trigger on code commits, run tests, scan images, and deploy through environments with appropriate gates and notifications.",
  "background": "Your DevOps team needs to establish a multi-stage CI/CD pipeline for deploying containerized microservices across development, staging, and production environments. The pipeline must handle automated testing, security scanning, and blue-green deployments while maintaining strict isolation between environments.",
  "environment": "Multi-environment AWS infrastructure deployed across us-east-1 region using ECS Fargate for container orchestration, ECR for image registry, CodePipeline for CI/CD automation, CodeBuild for build and test stages, CodeDeploy for blue-green deployments. Requires CDK 2.x with TypeScript, Node.js 18+, Docker installed. Three isolated VPCs (dev, staging, prod) with private subnets, NAT gateways for outbound traffic. Parameter Store with KMS encryption for secrets management. CloudWatch for monitoring and SNS for alerts.",
  "constraints": [
    "Use AWS CodeCommit as the source repository with branch-based triggers",
    "Implement container image scanning with ECR and fail builds on critical vulnerabilities",
    "Deploy ECS services using blue-green deployment strategy with CodeDeploy",
    "Configure separate VPCs for each environment with no cross-environment access",
    "Use Parameter Store for environment-specific configuration with KMS encryption",
    "Implement automated integration tests using CodeBuild between deployment stages",
    "Configure CloudWatch alarms for deployment failures with SNS notifications",
    "Use IAM roles with least-privilege access for all pipeline stages",
    "Implement manual approval gates for production deployments only",
    "Store build artifacts in S3 with lifecycle policies for 30-day retention"
  ]
}
```

---

## Output Requirements

You must output a **single CloudFormation YAML template** named **`ci-cd.yml`** that does the following.

### 1. Template Skeleton

* Start with:

  ```yaml
  # ci-cd.yml
  AWSTemplateFormatVersion: "2010-09-09"
  Description: >
    Multi-environment CI/CD for containerized applications (dev/staging/prod)
    with isolated VPCs, ECR scanning, CodePipeline, CodeBuild, ECS Fargate,
    CodeDeploy blue/green, Parameter Store, CloudWatch, SNS, and S3 artifacts.
  ```
* Use logical, readable resource names and comments per section: `# VPCs`, `# ECR`, `# CodeCommit`, `# CodePipeline`, etc.

### 2. Three Isolated VPCs

* Define **three VPCs**:

  * `DevVpc`, `StagingVpc`, `ProdVpc`.
  * Each with:

    * Private subnets across at least 2 AZs.
    * NAT Gateways in public subnets for outbound access.
  * Ensure **no cross-environment routing** between these VPCs (no peering, no TGW in this template).
* Tag each VPC and subnet with `Environment=dev|staging|prod`.

### 3. ECR Repository

* `AWS::ECR::Repository`:

  * Image scanning **on push** enabled.
  * **Lifecycle policy** for untagged images (e.g., delete after N images or N days).
  * Optionally, retain a limited number of tagged images if you want.

### 4. CodeCommit Repository

* `AWS::CodeCommit::Repository`:

  * Main repo for app source.
  * Support **branch-based triggers** for at least `dev`, `staging`, and `main`.
* Configure repository `Triggers` so that pushes to those branches can notify CodePipeline, or rely on CodePipeline Source stage polling/webhook (you can model the linkage in the pipeline stage).

### 5. Artifact S3 Bucket + KMS

* `AWS::S3::Bucket` for pipeline artifacts:

  * Server-side encryption (SSE-S3 or SSE-KMS with a **customer-managed KMS key**).
  * Versioning enabled.
  * Lifecycle policy: expire objects / noncurrent versions after **30 days**.
* `AWS::KMS::Key` for artifact encryption (if using SSE-KMS).
* Use this bucket in CodePipeline `ArtifactStore`.

### 6. Parameter Store Hierarchies

* `AWS::SSM::Parameter` resources for:

  * `/app/dev/...`
  * `/app/staging/...`
  * `/app/prod/...`
* All parameters must:

  * Use **KMS encryption** (SecureString).
  * Represent environment-specific config (e.g., DB endpoints, feature flags, etc.).
* KMS key policy must allow appropriate readers (CodeBuild, ECS task roles, etc.).

### 7. ECS Clusters & Services (Fargate)

* For **each environment** (dev/staging/prod):

  * `AWS::ECS::Cluster` in that environment's VPC.
  * `AWS::ECS::TaskDefinition` with Fargate-compatible settings.
  * `AWS::ECS::Service` using `LaunchType: FARGATE`, wired to subnets and security groups.
* You can assume existing ALBs / target groups or define basic ones per env if needed:

  * Enough to tie into **CodeDeploy ECS blue/green**.

### 8. CodeDeploy Blue/Green

* `AWS::CodeDeploy::Application` (ECS).
* `AWS::CodeDeploy::DeploymentGroup` for each environment:

  * Associated with:

    * The ECS service.
    * Blue and green target groups.
    * Listener(s) on ALB if you define them.
  * Enable **blue/green deployment** and **automatic rollback** on CloudWatch alarms (e.g., deployment failures, unhealthy tasks).

### 9. CodeBuild Projects

* Define **AWS::CodeBuild::Project** resources:

  * Build project: builds Docker image and pushes to ECR using repo `buildspec` file.
  * Test projects:

    * Unit tests.
    * Integration tests (run between deployments, especially before promoting from staging to prod).
* All projects:

  * Use the S3 artifact bucket.
  * Have `Environment` with `PrivilegedMode: true` if building Docker in Docker.
  * Use `Source` type `CODECOMMIT`.
  * Enable CloudWatch Logs via `LogsConfig`.
  * Fail builds on critical ECR scan findings (you can simulate via buildspec assumption and CodeBuild environment variables).

### 10. CodePipeline

* Single `AWS::CodePipeline::Pipeline` that orchestrates all environments:

  * At least these **stages**:

    1. `Source` (CodeCommit)
    2. `Build` (CodeBuild Docker image build)
    3. `Test` (unit and/or integration tests via CodeBuild)
    4. `Deploy-Dev` (CodeDeploy ECS to Dev)
    5. `Deploy-Staging` (CodeDeploy ECS to Staging)
    6. `Deploy-Prod` (CodeDeploy ECS to Prod)
  * Use **separate actions** per environment's deploy stage.
  * Trigger:

    * On CodeCommit changes (branch-based trigger).
  * Manual approvals:

    * **Only** before **production** deployment.
    * Use `ManualApproval` action wiring to **SNS topic**.

### 11. CloudWatch Alarms & SNS

* `AWS::SNS::Topic`:

  * For deployment / pipeline failure alerts.
  * Include at least one `AWS::SNS::Subscription` with `Protocol: email` (email can be a parameter).
* `AWS::CloudWatch::Alarm` resources:

  * Deployment failures (CodeDeploy / CodePipeline metrics).
  * ECS container health / task count.
  * Resource utilization (CPU/memory) if you choose.
* Alarms must:

  * Target the SNS topic via `AlarmActions`.

### 12. Event-Driven Notifications / Integration Tests (Optional But Preferred)

* You can add **EventBridge Rules** (`AWS::Events::Rule`) to:

  * Listen to CodeDeploy / CodePipeline events for failures and send SNS notifications.
  * Trigger a CodeBuild integration test project between staging and prod deploys (or embed this as a pipeline stage).

### 13. IAM (Least Privilege)

* Define **IAM Roles** for:

  * CodePipeline.
  * Each CodeBuild project.
  * CodeDeploy ECS.
  * ECS task execution and task roles.
* Policies must:

  * Be **least-privilege**: scope `Action` and `Resource` as tightly as possible.
  * Avoid `Action: "*"`, `Resource: "*"`, except when absolutely required and then constrained (for example to specific service prefixes or ARNs).
* Ensure roles have permission to:

  * Read/write S3 artifact bucket.
  * Access ECR repos.
  * Use SSM Parameters for their env.
  * Interact with ECS, CodeDeploy, and CloudWatch as needed.

### 14. Security & Isolation

* Enforce **no cross-environment access**:

  * No shared subnets or peering between dev/staging/prod VPCs.
  * IAM roles that act per environment must not unnecessarily access other env's resources.
* ECR, S3, and SSM are shared global-ish, but environment separation should be via naming/tags/paths and IAM scoping.

### 15. Tags

* Tag key resources with:

  * `Environment` (dev/staging/prod for env-specific resources; CI-CD/Shared for pipeline infra).
  * `Project=ContainerizedAppPipeline`.
  * `ManagedBy=CloudFormation`.
  * `CostCenter` placeholder.

### 16. File Output Contract

* Output **exactly one fenced code block**:

  * Starting with:

    ```yaml
    # ci-cd.yml
    AWSTemplateFormatVersion: "2010-09-09"
    ...
    ```
  * Containing the full CloudFormation YAML template.
* Do **not** print anything outside this YAML code block.
* Do **not** emit TypeScript files; this task is purely the **synthesized YAML**.

---

## Goal

Produce **`ci-cd.yml`**, a single CloudFormation template that:

* Builds a **multi-environment CI/CD pipeline** (dev/staging/prod) for containerized applications.
* Uses **CodeCommit + CodePipeline + CodeBuild + ECR + ECS Fargate + CodeDeploy** as the core.
* Enforces **environment isolation via separate VPCs**, Parameter Store hierarchies, and least-privilege IAM.
* Handles **testing, image scanning, blue/green deployments, and approval gates**, with CloudWatch + SNS-based alerting and 30-day artifact retention.

## Validation Criteria

Your CloudFormation template will be validated against:

1. **Template Structure** - Correct CloudFormation YAML syntax and format
2. **Resource Completeness** - All required resources (VPCs, ECR, CodeCommit, CodePipeline, CodeBuild, ECS, CodeDeploy, SSM, CloudWatch, SNS, S3, IAM) are defined
3. **Environment Isolation** - Separate VPCs with no cross-environment access
4. **Security** - Least-privilege IAM, KMS encryption, no hardcoded secrets
5. **Pipeline Stages** - All required stages (Source, Build, Test, Deploy-Dev, Deploy-Staging, Deploy-Prod) are present
6. **Blue/Green Deployment** - CodeDeploy configured with blue/green strategy and automatic rollback
7. **Monitoring** - CloudWatch alarms and SNS notifications configured
8. **Artifact Management** - S3 bucket with encryption, versioning, and lifecycle policies
9. **Tagging** - Proper tags applied to all resources
10. **Best Practices** - Production-ready configuration following AWS best practices

## Deliverables

1. `ci-cd.yml` - Complete CloudFormation YAML template
2. All resources properly configured with environment isolation
3. IAM roles with least-privilege policies
4. No hardcoded secrets or sensitive data
5. Proper tagging and resource organization

## Tips for Success

1. Start with the template skeleton and resource organization
2. Define VPCs first to establish network isolation
3. Create shared resources (ECR, S3, KMS) before environment-specific ones
4. Use IAM roles with scoped permissions - avoid wildcards
5. Test each section incrementally if possible
6. Ensure all resource dependencies are properly defined
7. Use CloudFormation parameters for configurable values
8. Add comprehensive tags for resource management
9. Validate YAML syntax before submission
10. Review IAM policies for least-privilege compliance

## Anti-Patterns to Avoid

- Wildcard IAM permissions (`Action: "*"`, `Resource: "*"`)
- Cross-environment VPC peering or shared subnets
- Hardcoded secrets or credentials in the template
- Missing environment isolation
- Incomplete IAM role definitions
- Missing CloudWatch alarms for critical failures
- No encryption for sensitive resources (S3, SSM Parameters)
- Missing lifecycle policies for S3 artifacts
- Incomplete CodeDeploy blue/green configuration
- Missing manual approval gates for production
- Poor resource naming conventions
- Missing tags on resources
- Incomplete error handling and rollback mechanisms
