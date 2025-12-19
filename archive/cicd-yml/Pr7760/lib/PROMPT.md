# Blue-Green CI/CD Pipeline - CloudFormation Template

## Objective
You are a senior AWS infrastructure engineer specializing in **blue-green CI/CD pipelines** on AWS.
Your job is to produce a **single CloudFormation YAML template** that defines a complete blue-green deployment pipeline for a Node.js application using CodePipeline, CodeBuild, CodeDeploy, ALB, Lambda, SSM Parameter Store, SNS, and CloudWatch.

## Deliverable

* `ci-cd.yml` — a full **CloudFormation YAML template** that, when deployed, provisions all CI/CD and supporting infrastructure for blue-green deployments as described below.

---

## Input Specification

```json
{
  "problem": "Create a CDKTF program to build a complete CI/CD pipeline for blue-green deployments. The configuration must: 1. Set up a CodePipeline with Source stage pulling from CodeCommit repository named 'nodejs-app'. 2. Configure Build stage using CodeBuild to run npm tests and create deployment packages. 3. Add Test stage that executes integration tests in a dedicated CodeBuild project. 4. Implement Deploy-Blue stage that deploys to ECS Fargate blue environment. 5. Create Switch-Traffic stage that gradually shifts ALB traffic from green to blue using weighted routing. 6. Configure Lambda function to validate deployment health before traffic switching. 7. Set up CloudWatch alarms monitoring ECS task failures, ALB target health, and 5xx errors. 8. Implement automated rollback triggered by CloudWatch alarms exceeding thresholds. 9. Store deployment metadata and configuration in Parameter Store with versioning enabled. 10. Create SNS topic for deployment notifications sent to 'devops-team@company.com'. Expected output: A CDKTF TypeScript application that provisions a complete blue-green deployment pipeline with automated testing, gradual traffic shifting, health monitoring, and rollback capabilities. The pipeline should handle failures gracefully and maintain zero-downtime deployments.",
  "background": "Your company is transitioning from manual deployments to automated CI/CD workflows. The development team needs infrastructure that supports blue-green deployments with automated testing and rollback capabilities for their Node.js applications.",
  "environment": "AWS deployment pipeline infrastructure in us-east-1 region using CodePipeline, CodeBuild, and CodeDeploy services. Requires CDKTF 0.18+ with TypeScript, Node.js 18+, and AWS CLI configured with appropriate permissions. Infrastructure includes Application Load Balancer with dual target groups for blue-green deployments, S3 buckets for artifact storage, Lambda functions for deployment orchestration, CloudWatch for monitoring, and Systems Manager for configuration management. VPC with public and private subnets across 2 availability zones.",
  "constraints": [
    "Use CodePipeline with exactly 5 stages: Source, Build, Test, Deploy-Blue, and Switch-Traffic",
    "CodeBuild projects must use Amazon Linux 2 runtime with Node.js 18",
    "Store build artifacts in S3 with lifecycle policies to delete after 30 days",
    "Use Application Load Balancer with weighted target groups for traffic shifting",
    "Implement Lambda functions for pre-deployment validation and post-deployment health checks",
    "Configure CloudWatch alarms for deployment failures with SNS notifications",
    "All IAM roles must follow least-privilege principle with explicit resource ARNs",
    "Use Systems Manager Parameter Store for storing deployment configuration values"
  ]
}
```

---

## Output Requirements

You must output a **single CloudFormation YAML template** named **`ci-cd.yml`** that does all of the following.

### 1. Template Skeleton

* Begin with:

  ```yaml
  # ci-cd.yml
  AWSTemplateFormatVersion: "2010-09-09"
  Description: >
    Blue-green CI/CD pipeline for nodejs-app using CodePipeline, CodeBuild, CodeDeploy,
    ALB weighted routing, Lambda health checks, CloudWatch alarms, SNS, S3 artifacts,
    and SSM Parameter Store configuration.
  ```

* Organize `Resources` with clear comments:

  * `# S3 Artifact Bucket`
  * `# CodeCommit Repository`
  * `# CodeBuild Projects`
  * `# ECS & ALB for Blue/Green`
  * `# CodeDeploy ECS Application & DeploymentGroup`
  * `# CodePipeline`
  * `# Lambda Functions`
  * `# CloudWatch Alarms`
  * `# SNS Topic`
  * `# SSM Parameters`
  * `# IAM Roles & Policies`

---

### 2. Core Services To Model (must be fully wired)

Core focus should be on:

* **CodePipeline** with exactly **5 stages** (Source, Build, Test, Deploy-Blue, Switch-Traffic).
* **ECS Fargate + ALB + CodeDeploy** for blue/green.
* **CodeBuild** for build + tests.
* **Lambda** for validation & health checks.

Supporting: S3, SSM Parameter Store, SNS, CloudWatch.

---

### 3. S3 Artifact Bucket + Lifecycle

* `AWS::S3::Bucket`:

  * For CodePipeline artifacts.
  * Server-side encryption (SSE-S3 or SSE-KMS; SSE-KMS preferred).
  * Versioning enabled.
  * Lifecycle policy to **delete artifacts after 30 days** (or delete non-current versions after 30 days).
* Used as `ArtifactStore` in the CodePipeline definition.

---

### 4. CodeCommit Repository

* `AWS::CodeCommit::Repository` named **`nodejs-app`**:

  * This is the **Source** for CodePipeline.
  * Branch can be `main` (or `master`) by default; pipeline Source stage must use this repo.

---

### 5. CodeBuild Projects (Amazon Linux 2 + Node 18)

Create two **AWS::CodeBuild::Project** resources:

1. **Build Project**

   * Source: CodeCommit `nodejs-app`.
   * Environment:

     * `Environment.Image`: Amazon Linux 2 image that supports Node.js 18 (e.g. `aws/codebuild/amazonlinux2-x86_64-standard:...`).
     * `ComputeType` appropriate for builds.
     * `Type: LINUX_CONTAINER`.
   * Buildspec from repo (e.g. `buildspec-build.yml`) that:

     * Runs `npm install`, `npm test`.
     * Builds deployment package / Docker image if desired.
   * Artifacts stored in S3 artifact bucket.

2. **Test Project** (Integration Tests)

   * Same image/runtime (Amazon Linux 2 + Node.js 18).
   * Buildspec from repo (e.g. `buildspec-test.yml`) that:

     * Runs integration test suite.
     * May take as input build artifacts from previous stage.

Both projects:

* Use CloudWatch Logs (`LogsConfig`).
* Use the artifact bucket with encryption.
* Must have IAM roles granting:

  * Limited S3 access (artifact bucket).
  * Read from CodeCommit.
  * Optional ECR access if you include Docker image steps.

---

### 6. ECS + ALB Blue/Green Setup

Model infrastructure for blue/green environment (you can focus on one environment since pipeline is centered on blue-green of same app):

* `AWS::ECS::Cluster`.
* `AWS::ECS::TaskDefinition` (Fargate):

  * Container uses Node.js app image (placeholder ECR URI is fine).
  * Environment variables from SSM Parameter Store (deployment config).
* `AWS::ECS::Service` for **blue** and **green**:

  * Or one service wired to CodeDeploy with blue/green configuration.
* `AWS::ElasticLoadBalancingV2::LoadBalancer` (ALB) with:

  * At least **two target groups**:

    * `BlueTargetGroup`
    * `GreenTargetGroup`
  * Listener with **weighted target group** routing used in `Switch-Traffic` stage via CodeDeploy or Lambda automation.

Security groups & subnets:

* Use an existing VPC (parameter) or a simple VPC with public + private subnets across 2 AZs.
* ECS tasks run in private subnets.

---

### 7. CodeDeploy ECS Application & Deployment Group

* `AWS::CodeDeploy::Application` (ComputePlatform: ECS).
* `AWS::CodeDeploy::DeploymentGroup`:

  * Associated with the ECS service (or services), ALB, and both target groups (blue/green).
  * Deployment configuration for **blue/green**:

    * Use `BlueGreenDeploymentConfiguration` with:

      * `TerminationWaitTimeInMinutes` if desired.
      * `DeploymentReadyOption` if you want pre-traffic hooks.
  * Configure **CloudWatch alarms** to drive **automatic rollback** on:

    * ECS task failure metrics.
    * ALB 5xx errors.
    * Unhealthy target counts.

---

### 8. Lambda Functions (Validation & Health Checks)

Create at least two **AWS::Lambda::Function** resources:

1. **Pre-Deployment Validation Lambda**

   * Runs before Deploy-Blue or early in Switch-Traffic to ensure environment readiness.
   * Might check Parameter Store config, basic endpoint health, etc.

2. **Post-Deployment Health Check Lambda**

   * Runs after deploying to blue, before finalizing traffic shift.
   * Validates key endpoints / smoke tests.

Both:

* Runtime: Node.js 18.x.
* Timeout: **< 300 seconds** (under 5 minutes).
* Env vars for configuration (e.g., endpoint URL, SSM paths).
* IAM roles:

  * Read access to SSM Parameter Store paths.
  * Describe ECS/ALB/CodeDeploy as needed.
  * Write to CloudWatch Logs.
* Connected into pipeline:

  * As **CodePipeline actions** in Deploy-Blue / Switch-Traffic stages, or
  * As pre/post hooks in CodeDeploy (appspec style assumed).

---

### 9. CloudWatch Alarms + SNS

* `AWS::SNS::Topic`:

  * Name/DisplayName indicates deployment notifications.
  * Add `AWS::SNS::Subscription`:

    * `Protocol: email`
    * `Endpoint: devops-team@company.com`.
* `AWS::CloudWatch::Alarm` resources for:

  * ECS task failures (e.g., `ECS/Service` metrics).
  * ALB target health / `UnHealthyHostCount`.
  * ALB 5xx error rate (`AWS/ApplicationELB`).
* Connect these alarms:

  * `AlarmActions` include SNS topic.
  * Also referenced by CodeDeploy DeploymentGroup for **automatic rollback**.

---

### 10. SSM Parameter Store (Deployment Metadata & Config)

* `AWS::SSM::Parameter` resources for:

  * Deployment metadata (current version, last successful deployment, etc).
  * Configuration values (e.g., `/nodejs-app/config/...`).
* Use `Type: String` or `SecureString` as appropriate.
* Versioning is implicit in Parameter Store; template should make it clear parameters are updated per deployment (you can model initial parameters and IAM to update them).
* Lambda and/or CodeBuild should read these parameters (IAM allowed).

---

### 11. CodePipeline (Exactly 5 Stages)

* Define a single `AWS::CodePipeline::Pipeline` resource with:

  Stages (in order, **exactly 5**):

  1. `Source`

     * Action: CodeCommit (repo `nodejs-app`).
     * Output: Source artifact.

  2. `Build`

     * Action: CodeBuild (build project).
     * Input: Source artifact.
     * Output: Build artifact (deployment package, image tag info, etc).

  3. `Test`

     * Action: CodeBuild (integration tests).
     * Input: Build artifact.

  4. `Deploy-Blue`

     * Action: CodeDeploy ECS blue deployment using DeploymentGroup, OR Lambda-driven deploy to blue target group.
     * May include **pre-deployment validation Lambda**.

  5. `Switch-Traffic`

     * Action: CodeDeploy traffic-shifting or a custom Lambda that calls ALB/CodeDeploy APIs to adjust weights from green to blue.
     * Should integrate **post-deployment health check Lambda**.
     * Rollback on CloudWatch alarm triggers.

* Pipeline-level details:

  * Use S3 artifact bucket for `ArtifactStore` (encrypted).
  * Use appropriate `RoleArn` with least-privilege permissions.
  * Enable CloudWatch Events / EventBridge for pipeline state changes (optional; you can rely on CloudWatch metrics).

---

### 12. IAM (Least Privilege, Explicit ARNs)

* Define IAM roles for:

  * CodePipeline service role.
  * CodeBuild (build + test) roles.
  * CodeDeploy ECS role.
  * Lambda execution roles.

* Policies must:

  * Use explicit resource ARNs where possible (e.g., specific bucket, specific repo, specific ECR, specific ECS cluster/service).
  * Avoid `Action: "*"`, `Resource: "*"`.
  * Grant only necessary actions:

    * S3 read/write on artifact bucket.
    * CodeCommit read access.
    * ECR (if Docker push is modeled).
    * ECS/CodeDeploy/CloudWatch/SSM as required.

---

### 13. Tags

* Apply tags to all major resources (Pipeline, CodeBuild, ECS, ALB, S3, Lambda, CodeDeploy, SSM, etc.):

  * `Project=nodejs-app`
  * `Environment=CI-CD` (for pipeline resources)
  * `ManagedBy=CloudFormation`
  * `Owner=DevOps`
  * `CostCenter` placeholder

---

### 14. File Output Contract

* Output **exactly one fenced code block** containing the full template:

  ```yaml
  # ci-cd.yml
  AWSTemplateFormatVersion: "2010-09-09"
  ...
  ```

---

## Validation Criteria

Your CloudFormation template will be validated against:

1. **Template Structure** - Correct CloudFormation YAML syntax and organization
2. **5-Stage Pipeline** - Exactly 5 stages: Source, Build, Test, Deploy-Blue, Switch-Traffic
3. **CodeBuild Configuration** - Amazon Linux 2 with Node.js 18 runtime
4. **S3 Lifecycle** - Artifacts deleted after 30 days
5. **ALB Weighted Routing** - Dual target groups for blue-green traffic shifting
6. **Lambda Functions** - Pre and post-deployment validation with Node.js 18.x
7. **CloudWatch Alarms** - ECS, ALB monitoring with SNS integration
8. **Automated Rollback** - CloudWatch alarms trigger CodeDeploy rollback
9. **SSM Parameter Store** - Deployment metadata and configuration storage
10. **IAM Least Privilege** - Explicit ARNs, no wildcard permissions
11. **Resource Tagging** - Consistent tags across all resources
12. **No Hardcoded Secrets** - All sensitive data via Parameter Store or Secrets Manager

---

## Deliverables

1. `lib/ci-cd.yml` - Complete CloudFormation YAML template
2. All resources properly wired and referenced
3. IAM roles with least-privilege policies
4. No hardcoded secrets or sensitive data
5. Production-ready blue-green deployment pipeline

---

## Tips for Success

1. Start with template skeleton and resource organization
2. Define IAM roles early with explicit ARNs
3. Wire CodePipeline stages sequentially with proper artifact passing
4. Configure CodeDeploy blue-green deployment configuration
5. Set up CloudWatch alarms before connecting to rollback
6. Use SSM Parameter Store for all configuration values
7. Test resource references and dependencies
8. Apply consistent tagging strategy

---

## Anti-Patterns to Avoid

- Hardcoded credentials or secrets
- Wildcard IAM permissions (`Action: "*"`, `Resource: "*"`)
- Missing CloudWatch alarms for rollback
- Incorrect CodePipeline stage count (must be exactly 5)
- Missing S3 lifecycle policies
- No encryption on S3 artifact bucket
- Lambda timeouts exceeding 300 seconds
- Missing SSM Parameter Store integration
- Incomplete blue-green target group configuration
- Missing SNS notifications for deployment events
