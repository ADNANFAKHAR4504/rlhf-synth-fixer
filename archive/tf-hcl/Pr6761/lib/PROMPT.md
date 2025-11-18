# AWS CodePipeline Infrastructure Automation

Hey team,

We need to build an automated CI/CD pipeline for deploying Terraform infrastructure changes. The pipeline should validate, plan, and apply Terraform configurations automatically when changes are pushed to our GitHub repository. I've been asked to create this infrastructure using **Terraform with hcl** for deployment in the us-east-1 region.

One critical note before we start: AWS CodeCommit has been deprecated and is no longer available for new AWS accounts. We originally considered using CodeCommit as the source repository, but we need to use GitHub with CodeStar Connections instead. This is a mandatory change due to the service deprecation.

The business wants a fully automated pipeline that catches configuration errors early through validation, shows what changes will be made through Terraform plan output, and then applies those changes after manual approval. This will help our infrastructure team deploy changes faster while maintaining safety through the multi-stage approval process.

## What we need to build

Create a complete CI/CD pipeline infrastructure using **Terraform with hcl** that automates Terraform infrastructure deployments from a GitHub repository.

### Core Requirements

1. **Source Integration with GitHub**
   - Use GitHub repository as the source (NOT CodeCommit - service deprecated)
   - Connect via AWS CodeStar Connections service
   - Connection name format: `github-connection-${var.environment_suffix}`
   - Repository: Placeholder "owner/infrastructure-repo" (user will configure actual repo)
   - Monitor the "main" branch for changes
   - Automatically trigger pipeline on repository changes

2. **Multi-Stage CodePipeline**
   - Stage 1 (Source): Pull code from GitHub using CodeStarSourceConnection
   - Stage 2 (Validate): Run `terraform validate` to catch syntax errors
   - Stage 3 (Plan): Run `terraform plan` to preview infrastructure changes
   - Stage 4 (Apply): Run `terraform apply` with manual approval gate before execution

3. **CodeBuild Projects**
   - Validate project: Executes `terraform init && terraform validate`
   - Apply project: Executes `terraform init && terraform apply -auto-approve`
   - Use compute type: BUILD_GENERAL1_SMALL for cost efficiency
   - Use image: aws/codebuild/standard:7.0 (includes Terraform)
   - Environment type: LINUX_CONTAINER

4. **Artifact Storage**
   - S3 bucket for pipeline artifacts and Terraform state files
   - Bucket name: `pipeline-artifacts-${var.environment_suffix}`
   - Versioning enabled for artifact history
   - Server-side encryption with AES256
   - Block all public access for security
   - Must be fully destroyable (no retention policies)

5. **Notifications and Monitoring**
   - SNS topic for pipeline status notifications
   - Topic name: `pipeline-notifications-${var.environment_suffix}`
   - Email subscription support for team alerts
   - CloudWatch log groups for CodeBuild project logs
   - Log retention: 7 days to control costs
   - Optional CloudWatch alarms for pipeline failures

6. **Event-Driven Automation**
   - EventBridge rule to detect GitHub repository changes
   - Automatically trigger CodePipeline when changes detected
   - Connect EventBridge to CodePipeline as target

### Technical Requirements

- All infrastructure defined using **Terraform with hcl**
- Use **CodePipeline** for orchestration
- Use **CodeBuild** for Terraform execution (validate and apply)
- Use **CodeStarConnections** for GitHub integration (replaces deprecated CodeCommit)
- Use **S3** for artifact storage with encryption
- Use **IAM** roles and policies with least-privilege access
- Use **SNS** for pipeline notifications
- Use **CloudWatch** for logging and optional alarming
- Use **EventBridge** for event-driven pipeline triggers
- Resource names must include **environmentSuffix** variable for uniqueness
- Follow naming convention: `{resource-type}-environment-suffix`
- Deploy to **us-east-1** region
- Terraform version: >= 1.0
- AWS provider version: ~> 5.0

### Deployment Requirements (CRITICAL)

- All resources must include the **environmentSuffix** parameter in their names
- All resources must be fully destroyable - NO RemovalPolicy RETAIN or DeletionPolicy Retain
- No hardcoded credentials or sensitive values
- Use Terraform variables for all configurable values
- S3 buckets must have force_destroy = true to allow cleanup
- IAM policies must follow least-privilege principles
- CloudWatch log groups should be automatically deleted with infrastructure

### Constraints

- Security: S3 encryption enabled, no public access, least-privilege IAM policies
- Compliance: All resources tagged appropriately for auditing
- Cost optimization: Use smallest compute types, short log retention, serverless where possible
- Reliability: Include proper error handling in CodeBuild buildspec files
- Maintainability: Clear variable names, organized file structure, comprehensive outputs
- Service limitation: Cannot use CodeCommit (deprecated) - must use GitHub with CodeStar Connections

## Success Criteria

- **Functionality**: Pipeline automatically triggers on GitHub commits and executes all stages
- **Validation**: Terraform syntax errors caught in Validate stage before Plan/Apply
- **Visibility**: Terraform plan output visible before manual approval
- **Safety**: Manual approval required before applying infrastructure changes
- **Notifications**: Team receives alerts for pipeline status changes
- **Security**: All credentials secured, S3 encrypted, least-privilege IAM
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: Complete infrastructure can be torn down without manual intervention
- **Code Quality**: Clean hcl code, well-structured, comprehensive tests, documented

## What to deliver

- Complete **Terraform with hcl** implementation
- provider.tf with AWS provider configuration (~> 5.0) and required Terraform version (>= 1.0)
- variables.tf with all variable definitions including environment_suffix
- main.tf with core infrastructure (CodePipeline, CodeBuild, CodeStar Connection)
- s3.tf for artifact bucket with encryption and versioning
- iam.tf for roles and policies (CodePipeline role, CodeBuild role)
- sns.tf for notification topic
- cloudwatch.tf for log groups and optional alarms
- eventbridge.tf for pipeline trigger rules
- outputs.tf exposing pipeline ARN, S3 bucket name, CodeStar Connection ARN
- terraform.tfvars.example showing example variable values
- README.md with setup instructions including GitHub connection configuration
- Comprehensive unit and integration tests achieving 100% coverage target
- Documentation explaining the CodeCommit to GitHub migration

## Important Notes

- CodeCommit has been deprecated by AWS and is unavailable for new accounts
- Users must manually create the GitHub CodeStar Connection in AWS Console before deployment
- The connection ARN should be exposed as an output for easy reference
- Include clear documentation about setting up the GitHub connection
- The pipeline will not function until the GitHub connection is authorized
