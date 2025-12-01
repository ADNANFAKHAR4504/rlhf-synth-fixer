# CI/CD Pipeline Configuration - AWS CloudFormation Implementation

## Objective
You are a senior AWS infrastructure engineer specializing in **CI/CD for containerized microservices** in **multi-account AWS environments**. Your task is to produce a **single CloudFormation template** (YAML) that defines a **multi-stage CI/CD pipeline** using CodePipeline, CodeBuild, ECS Fargate, CodeDeploy, Lambda, SNS, S3, IAM, SSM, and EventBridge. The template must be production-ready, follow least-privilege principles, support cross-account deploys, and include monitoring and approvals.

## Technology Stack
Your implementation must use the following AWS services:
- **AWS CodePipeline** - Pipeline orchestration
- **AWS CodeBuild** - Build and test execution
- **AWS CodeDeploy** - ECS blue/green deployments
- **Amazon ECS Fargate** - Container runtime
- **AWS Lambda** - Custom validation and rollback logic
- **Amazon SNS** - Notifications and approvals
- **Amazon S3** - Artifact storage
- **AWS IAM** - Access control and cross-account permissions
- **AWS Systems Manager (SSM) Parameter Store** - Configuration management
- **Amazon EventBridge** - Event-driven monitoring and alerts

## Requirements

### 1. Template Basics
The CloudFormation template must:
- Use `AWSTemplateFormatVersion: "2010-09-09"` and a clear `Description`
- Organize resources with logical IDs and comments by section (Source, Pipeline, CodeBuild, ECS/CodeDeploy, Lambda, SNS, IAM, S3, SSM, EventBridge)
- Apply tags to key resources:
  - `Environment` (e.g., Shared-Tools or CI-CD)
  - `Project=PaymentMicroservices`
  - `ManagedBy=CloudFormation`
  - `Owner` / `CostCenter` placeholders

### 2. CodePipeline Definition (CRITICAL)
Define an **AWS::CodePipeline::Pipeline** with these **stages** at minimum:

1. `Source` (GitHub)
2. `Build`
3. `Test`
4. `Deploy-Dev`
5. `Deploy-Staging`
6. `Deploy-Prod`

**Source Action:**
- Use GitHub with **webhook/OAuth** integration (CodeStarSourceConnection pattern)
- Listen to `main` branch commits
- Repository owner, repository name, branch `main` as parameters
- OAuth token or CodeStar connection ARN passed as parameter (do **not** hardcode secrets)

**Build Action:**
- CodeBuild project that builds Docker images using `buildspec.yml` from repository
- Push images to ECR (assume repo/role exist or model minimally)

**Test Actions:**
- CodeBuild projects for **unit tests** and **integration tests**
- Test results uploaded as artifacts
- Enable reporting of test results (CodeBuild Reports or artifact-based)

**Deploy Actions:**
- `Deploy-Dev`, `Deploy-Staging`, `Deploy-Prod`: CodeDeploy ECS actions targeting different ECS services
- Blue/green deployments for each environment
- Manual approval actions:
  - No approval before Dev
  - Manual approval before **Staging** deploy
  - Manual approval before **Prod** deploy
- Manual approval actions send **SNS notifications** to a topic defined in the template

**Pipeline Requirements:**
- Use **S3 artifact bucket** defined in this template
- Use **KMS CMK** for artifact encryption (artifacts, CodeBuild, pipeline)

### 3. S3 Artifact Bucket + KMS
Create an **AWS::S3::Bucket** for pipeline artifacts:
- Versioning **enabled**
- Lifecycle policy (e.g., expire old noncurrent versions after N days)
- **BucketEncryption** using a **customer-managed KMS key** (AWS::KMS::Key)

KMS key policy must allow:
- Pipeline, CodeBuild, and other necessary principals to use it
- Use this bucket as the primary **artifact store** for CodePipeline

### 4. GitHub Source Integration
Use `AWS::CodePipeline::Pipeline` GitHub source action:
- Model repository owner, repository name, branch `main`
- OAuth token or CodeStar connection ARN passed as parameter (do **not** hardcode secrets)
- Ensure pipeline triggers on **push to main** (webhook semantics)

**Example Pattern:**
```yaml
SourceAction:
  Type: AWS::CodePipeline::Pipeline
  Properties:
    ArtifactStore:
      Type: S3
      Location: !Ref ArtifactBucket
    Stages:
      - Name: Source
        Actions:
          - Name: GitHubSource
            ActionTypeId:
              Category: Source
              Owner: AWS
              Provider: CodeStarSourceConnection
            Configuration:
              ConnectionArn: !Ref GitHubConnectionArn
              FullRepositoryId: !Sub "${GitHubOwner}/${GitHubRepo}"
              BranchName: main
```

### 5. CodeBuild Projects
Define **AWS::CodeBuild::Project** resources for:
- Build (Docker image build & push to ECR)
- Unit tests
- Integration tests

Each project:
- Uses buildspec from source repo (`buildspec-build.yml`, `buildspec-unit.yml`, `buildspec-integration.yml` or similar)
- Uses S3 artifact bucket and KMS encryption
- Has **CloudWatch Logs** group configured (via `LogsConfig`)

Test projects must:
- Enable **reporting** of test results (CodeBuild Reports or artifact-based)

### 6. ECS Fargate + CodeDeploy (Blue/Green)
Model ECS Fargate services for **dev**, **staging**, and **prod**:
- `AWS::ECS::Service` for each environment
- Use `LaunchType: FARGATE`
- Assume they run in pre-existing VPC subnets (can be parameters or basic placeholders)

Define **Application Load Balancers** and **target groups** for blue/green, OR model just the ECS+CodeDeploy wiring with placeholders:
- `AWS::CodeDeploy::Application` (ECS)
- `AWS::CodeDeploy::DeploymentGroup` for each env:
  - References ECS service, target groups, and listener(s)
  - Configured for **blue/green** deployments
  - Connected to **CloudWatch alarms** for rollback (e.g., ALB 5xx, unhealthy hosts)

The CodePipeline **Deploy-Dev/Staging/Prod** stages must reference the correct DeploymentGroup.

### 7. Lambda Functions (Custom Validation & Rollback)
Create **AWS::Lambda::Function** resources for:
- Custom deployment validation (e.g., smoke tests post-deploy)
- Optional rollback helper logic

Enforce:
- Runtime: Node.js 18.x or Python 3.11
- **Timeout < 300 seconds** (under 5 minutes)

Wire them as:
- Either custom **CodePipeline actions** (e.g., Invoke Lambda) in deploy stages, or
- Targets of **EventBridge rules** that react to deployment/pipeline events

IAM roles for Lambda must be **least-privilege** (no wildcards where avoidable).

### 8. SNS, EventBridge (CloudWatch Events), and Alerts
Create an **SNS topic** for pipeline/deployment alerts:
- Email subscriptions (e.g., parameter for ops email)

Create **EventBridge Rules** to:
- Listen for CodePipeline `FAILED` or `CANCELED` events
- Target SNS or Lambda for notification / remediation

Connect manual approval actions to the SNS topic (approval notifications).

### 9. IAM & Cross-Account Deployments
Define **IAM roles** with least-privilege policies for:
- CodePipeline
- CodeBuild projects
- CodeDeploy ECS
- Lambda functions

Roles must include permissions for **cross-account deployments**:
- CloudFormation/CodeDeploy / ECS actions against dev/stage/prod account IDs:
  - Dev: `123456789012`
  - Staging: `234567890123`
  - Prod: `345678901234`
- Use `sts:AssumeRole` into environment-specific deployment roles (modeled as ARNs/parameters)

**CRITICAL:** No IAM policy should use `Action: "*"`, `Resource: "*"`, unless absolutely necessary and clearly scoped.

### 10. Parameter Store Integration (SSM)
Add **AWS::SSM::Parameter** resources (or expect existing ones) for:
- Environment-specific config (API endpoints, DB endpoints, feature flags, image tags)

Reference these parameters in:
- CodeBuild environment variables
- Lambda environment variables
- (Optionally) CodePipeline action configurations

Do not hardcode secrets; treat them as external or stored in SSM/Secrets Manager.

### 11. Security & Encryption (CRITICAL - AUTO-FAIL)
All **artifacts** (S3, CodeBuild, CodePipeline) encrypted with **customer-managed KMS key**.

**Forbidden:**
- AWS Access Keys: `AKIA...`
- Hardcoded passwords: `password: "mypassword123"`
- API keys: `api_key: "sk_live_abc123..."`
- Database credentials in connection strings
- Private SSH/TLS keys
- GitHub OAuth token / CodeStar connection ARN must be parameterized, not plaintext

**Example of What Will Fail:**
```yaml
Parameters:
  GitHubToken:
    Type: String
    Default: "ghp_xxxxxxxxxxxxxxxxxxxx"  # CRITICAL FAIL
```

### 12. Hardcoded Secrets Detection (CRITICAL - AUTO-FAIL)
Your template MUST NOT contain hardcoded secrets. The following will cause automatic failure:

**Forbidden:**
- AWS Access Keys: `AKIA...`
- Hardcoded passwords: `password: "mypassword123"`
- API keys: `api_key: "sk_live_abc123..."`
- Database credentials in connection strings
- Private SSH/TLS keys
- GitHub OAuth tokens or connection ARNs

## Input Specification

```json
{
  "problem": "Create a CDK TypeScript program to deploy a multi-stage CI/CD pipeline for containerized microservices. The configuration must: 1. Define a CodePipeline with Source, Build, Test, Deploy-Dev, Deploy-Staging, and Deploy-Prod stages. 2. Configure GitHub as the source provider with OAuth authentication and automatic triggering on main branch commits. 3. Set up CodeBuild projects for building Docker images with buildspec files stored in the repository. 4. Implement automated unit and integration test stages using CodeBuild with test result reporting. 5. Create ECS Fargate services in each environment with blue/green deployments using CodeDeploy. 6. Configure manual approval actions before staging and production deployments with SNS notifications. 7. Implement Lambda functions for custom deployment validation and rollback logic. 8. Set up CloudWatch Events rules to monitor pipeline failures and send alerts via SNS. 9. Create IAM roles with least-privilege policies for cross-account deployments. 10. Configure S3 buckets for artifact storage with versioning and lifecycle policies. 11. Implement parameter store integration for managing environment-specific configurations.",
  "expected_output": "A complete CloudFormation template that creates a production-ready CI/CD pipeline with proper separation of concerns, security controls, and monitoring capabilities. The solution should be deployable to create all necessary resources in the tooling/shared services account.",
  "background": "A fintech startup needs to establish a multi-stage CI/CD pipeline for their payment processing microservices. The pipeline must support automated testing, security scanning, and progressive rollouts across development, staging, and production environments while maintaining PCI compliance requirements.",
  "environment": "Multi-account AWS setup spanning us-east-1 region with separate AWS accounts for dev (123456789012), staging (234567890123), and production (345678901234). Each environment has its own VPC with private subnets for compute resources. CodePipeline orchestrates deployments using CodeBuild for building container images, ECR for image storage, and ECS Fargate for running microservices. S3 buckets store pipeline artifacts with cross-account access policies.",
  "constraints": [
    "Pipeline must use AWS CodePipeline with at least 4 distinct stages",
    "Each deployment stage must include manual approval gates except for development",
    "All artifacts must be encrypted at rest using customer-managed KMS keys",
    "Pipeline must integrate with existing GitHub repository using webhooks",
    "Lambda functions for custom actions must have execution timeouts under 5 minutes"
  ]
}
```

## Validation Criteria

Your pipeline will be validated against:

1. **Template Structure** - Correct CloudFormation syntax and organization
2. **Pipeline Stages** - All required stages present (Source, Build, Test, Deploy-Dev, Deploy-Staging, Deploy-Prod)
3. **GitHub Integration** - Proper source configuration with webhook/OAuth
4. **CodeBuild Projects** - Build, unit test, and integration test projects defined
5. **ECS + CodeDeploy** - Blue/green deployment configuration for all environments
6. **Manual Approvals** - Approval gates before staging and production
7. **KMS Encryption** - All artifacts encrypted with customer-managed KMS key
8. **S3 Artifact Bucket** - Versioning and lifecycle policies configured
9. **Cross-Account IAM** - Least-privilege policies for multi-account deployments
10. **Lambda Functions** - Custom validation/rollback with proper timeouts
11. **SNS + EventBridge** - Monitoring and alerting configured
12. **SSM Integration** - Parameter Store usage for configuration
13. **Secret Management** - No hardcoded secrets, proper parameterization
14. **Security** - Least-privilege IAM, no wildcard permissions

## Deliverables

1. `lib/ci-cd.yml` - A complete CloudFormation YAML template that can be deployed (via CloudFormation or CDK synth output) to create all CI/CD infrastructure resources in the tooling/shared services account
2. Template must be production-ready and follow least-privilege principles
3. Support cross-account deploys to dev/staging/prod accounts
4. Include monitoring, approvals, and security controls
5. No hardcoded secrets or sensitive data

## File Output Contract

You must output **exactly one file** named **`ci-cd.yml`** in a single fenced code block:

- The block should start with:

  ```yaml
  # ci-cd.yml
  AWSTemplateFormatVersion: "2010-09-09"
  ...
  ```

- And contain the full YAML template.
- Do **not** include any explanation text outside the YAML block.
- Do **not** emit TypeScript files (`main.ts`, `tapstack.ts`) for this task.

## Tips for Success

1. Start with template structure - ensure proper CloudFormation syntax
2. Define all required pipeline stages in correct order
3. Use parameters for all configuration values (no hardcoded secrets)
4. Implement KMS encryption for all artifacts
5. Configure proper IAM roles with least-privilege policies
6. Set up cross-account assume role permissions correctly
7. Include manual approval actions with SNS notifications
8. Configure EventBridge rules for pipeline failure monitoring
9. Use SSM Parameter Store for environment-specific configurations
10. Test that all resource dependencies are properly wired

## Anti-Patterns to Avoid

- Hardcoded credentials or secrets in template
- Missing manual approval gates before production
- Wildcard IAM permissions (`Action: "*"`, `Resource: "*"`)
- Missing KMS encryption for artifacts
- No cross-account IAM configuration
- Missing EventBridge rules for failure monitoring
- Lambda functions with timeouts > 5 minutes
- Missing SNS notifications for approvals
- No SSM Parameter Store integration
- Poor resource organization and logical ID naming
