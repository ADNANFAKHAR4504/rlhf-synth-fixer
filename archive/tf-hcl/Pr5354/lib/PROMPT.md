I need help building a complete CI/CD pipeline that automatically deploys Terraform infrastructure code. The idea is that when our developers push Terraform changes to a CodeCommit repository, the pipeline automatically validates, plans, and applies those changes with proper safety gates. This is for a development team that wants full automation for infrastructure provisioning.

## Technology Stack: Terraform HCL

**All infrastructure must be written in Terraform 1.5+ using HCL with AWS Provider 5.x.** This pipeline will actually deploy other Terraform code, so we're using Terraform to build the CI/CD system that runs Terraform. It's meta, but it works really well.

## What We're Building

A fully automated infrastructure deployment pipeline where:
- Developers write Terraform code and push to CodeCommit
- CodePipeline automatically picks up the commit
- CodeBuild runs `terraform plan` to show what will change
- Manual approval required before production apply (but not dev/staging)
- CodeBuild runs `terraform apply` to actually make the changes
- SNS sends notifications at each step
- Everything is tracked and auditable

We need this for three environments: dev, staging, and production, each with its own pipeline.

## The Complete Pipeline Flow

1. Developer commits Terraform code to `dev` branch in CodeCommit
2. CodePipeline detects commit and starts automatically
3. **Source Stage:** Pull code from CodeCommit
4. **Plan Stage:** CodeBuild runs terraform init, validate, and plan
5. Plan output saved to S3 for review
6. SNS notification: "Plan ready for review"
7. **Approval Stage (production only):** Manual approval required with link to plan
8. **Apply Stage:** CodeBuild runs terraform apply with the saved plan
9. SNS notification: "Infrastructure updated" or "Failed"
10. Terraform state stored in S3, locked via DynamoDB

## Infrastructure Components We Need

### 1. CodeCommit Repository

Create a CodeCommit repository for storing Terraform infrastructure code:
- Name: `terraform-infrastructure`
- Initialize with README
- Set up three branches:
  - `dev` - Development environment
  - `staging` - Staging environment  
  - `main` - Production environment

Add branch protection on `main` requiring pull request reviews (can't push directly).

### 2. S3 Bucket for Terraform State

This is where Terraform stores its state files (the current state of infrastructure).

Bucket configuration:
- Name: `terraform-state-{account-id}-us-east-1`
- **Versioning: Enabled** (critical - lets us recover previous states)
- **Encryption: Enabled** (mandatory - use SSE-S3 or KMS)
- Block all public access
- Bucket policy: Only allow our CodeBuild service roles to access
- Lifecycle policy: Keep old state versions for 90 days then delete

State file organization:
- `project/dev/terraform.tfstate`
- `project/staging/terraform.tfstate`
- `project/prod/terraform.tfstate`

Each environment gets its own state file so they don't interfere.

### 3. DynamoDB Table for State Locking

When Terraform runs, it locks the state file to prevent concurrent modifications. We use DynamoDB for this:

- Table name: `terraform-state-lock`
- Partition key: `LockID` (String)
- Billing mode: On-demand (we don't lock that often)
- Point-in-time recovery: Enabled
- Encryption: Enabled

If two pipelines try to run at the same time on the same environment, the second one waits or fails. This prevents state corruption.

### 4. Custom Docker Image for Terraform

CodeBuild needs a Docker image with Terraform installed. Create an ECR repository and image:

**ECR Repository:**
- Name: `terraform-runner`
- Image scanning: Enabled
- Lifecycle policy: Keep last 5 images

**Dockerfile:**
```
FROM hashicorp/terraform:1.5
RUN apk add --no-cache \
    aws-cli \
    git \
    bash \
    python3 \
    py3-pip
RUN pip3 install checkov
COPY entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

This gives us Terraform 1.5, AWS CLI for authentication, and checkov for security scanning.

### 5. CodeBuild Projects (Two Per Environment)

We need separate CodeBuild projects for plan and apply operations.

**Terraform Plan Project:**
- Name: `terraform-plan-{environment}` (e.g., terraform-plan-dev)
- Docker image: Custom ECR image we built
- Compute: BUILD_GENERAL1_SMALL (or MEDIUM for large configs)
- VPC config: Run in private subnets (more secure, uses NAT for internet)
- Environment variables:
  - `ENVIRONMENT` = dev/staging/prod
  - `AWS_REGION` = us-east-1
  - `TF_VAR_*` for any Terraform variables
- Timeout: 30 minutes
- Buildspec: `buildspec-plan.yml`

**buildspec-plan.yml:**
```
version: 0.2
phases:
  pre_build:
    commands:
      - echo "Initializing Terraform for $ENVIRONMENT"
      - cd infrastructure/
      - terraform init -backend-config="bucket=terraform-state-ACCOUNT-us-east-1" -backend-config="key=project/$ENVIRONMENT/terraform.tfstate"
  build:
    commands:
      - terraform validate
      - terraform plan -var-file=environments/$ENVIRONMENT.tfvars -out=tfplan
      - terraform show -no-color tfplan > plan-output.txt
  post_build:
    commands:
      - echo "Plan completed. Review plan-output.txt"
artifacts:
  files:
    - infrastructure/tfplan
    - infrastructure/plan-output.txt
    - infrastructure/**/*
```

**Terraform Apply Project:**
- Name: `terraform-apply-{environment}`
- Same config as plan project
- Buildspec: `buildspec-apply.yml`

**buildspec-apply.yml:**
```
version: 0.2
phases:
  pre_build:
    commands:
      - cd infrastructure/
      - terraform init -backend-config="bucket=terraform-state-ACCOUNT-us-east-1" -backend-config="key=project/$ENVIRONMENT/terraform.tfstate"
  build:
    commands:
      - terraform apply -auto-approve tfplan
  post_build:
    commands:
      - echo "Infrastructure updated successfully"
```

Create these projects for all three environments (6 total projects).

### 6. CodePipeline (One Per Environment)

Create three pipelines: dev, staging, prod

**Pipeline Name:** `terraform-pipeline-{environment}`

**Stages:**

**Stage 1 - Source:**
- Source provider: CodeCommit
- Repository: `terraform-infrastructure`
- Branch: Environment-specific (dev, staging, or main)
- Detection: CloudWatch Events (automatic trigger on commit)
- Output artifact: `SourceOutput`

**Stage 2 - Plan:**
- Action: CodeBuild
- Project: `terraform-plan-{environment}`
- Input artifact: `SourceOutput`
- Output artifact: `PlanOutput`
- Purpose: Validate and create execution plan

**Stage 3 - Approve (Production Only):**
- Action: Manual approval
- SNS topic for notification: `terraform-approval-notifications`
- Custom message: "Review plan at s3://artifacts/plan-output.txt"
- URL: Link to S3 plan output
- Only include this stage for production pipeline!

**Stage 4 - Apply:**
- Action: CodeBuild
- Project: `terraform-apply-{environment}`
- Input artifact: `PlanOutput`
- Purpose: Execute the terraform apply

**Pipeline Settings:**
- Artifact store: S3 bucket with encryption
- Service role: Pipeline service role
- Failure action: STOP_PIPELINE_EXECUTION

For dev and staging, skip the approval stage - just plan then apply automatically.

### 7. IAM Roles (Least Privilege)

**CodePipeline Service Role:**
Needs permissions to:
- Get source from CodeCommit
- Start CodeBuild projects
- Read/write S3 artifacts
- Publish to SNS for notifications
- Write CloudWatch Logs

**CodeBuild Service Role for Plan:**
Needs permissions to:
- Read/write S3 state bucket
- Read/write DynamoDB state lock table
- Pull Docker image from ECR
- Write CloudWatch Logs
- Read-only access to AWS resources (to gather info during plan)
- Create/delete VPC network interfaces (if using VPC)

**CodeBuild Service Role for Apply:**
Same as plan role, plus:
- Full permissions to create/modify infrastructure resources
- Scope this based on what your Terraform actually creates
- For example: EC2, RDS, Lambda, IAM, VPC, etc.

Separate roles for plan and apply provides defense in depth - plan can't accidentally create resources.

### 8. SNS Topics for Notifications

**Pipeline Notifications Topic:**
- Name: `terraform-pipeline-notifications-{environment}`
- Subscriptions:
  - Email to infrastructure team
  - Slack webhook (optional)

**Approval Topic (Production):**
- Name: `terraform-approval-notifications`
- Subscriptions:
  - Email to infrastructure approvers with link to plan

**Events to Send:**
- Pipeline started
- Plan stage completed (include S3 link to plan output)
- Waiting for approval (production)
- Apply started
- Pipeline succeeded
- Pipeline failed (with error details)

### 9. Multi-Environment Support

**Branch Strategy:**
Each environment has its own branch and pipeline:
- `dev` branch → triggers dev pipeline
- `staging` branch → triggers staging pipeline
- `main` branch → triggers prod pipeline (with approval)

**Workflow:**
1. Developer creates feature branch from `dev`
2. Makes Terraform changes, commits
3. Creates PR to `dev` branch
4. Merges to `dev` → dev pipeline auto-runs
5. After testing in dev, create PR to `staging`
6. Merge to `staging` → staging pipeline auto-runs
7. After staging validation, create PR to `main`
8. Merge to `main` → prod pipeline runs plan, waits for approval
9. Approver reviews plan, clicks approve
10. Apply runs in production

**Environment-Specific Variables:**
Store in `environments/` directory:
- `environments/dev.tfvars`
- `environments/staging.tfvars`
- `environments/prod.tfvars`

Each has different sizes, counts, etc:
```
# dev.tfvars
instance_type = "t3.small"
min_size = 1
max_size = 2

# prod.tfvars
instance_type = "c5.large"
min_size = 3
max_size = 10
```

### 10. Error Handling and Rollback

**When Plan Fails:**
- CodeBuild returns non-zero exit code
- Pipeline stops, doesn't proceed to apply
- SNS notification sent
- CloudWatch Logs have full error details
- Developer fixes code and commits again

**When Apply Fails:**
- Pipeline stops in failed state
- SNS alert sent immediately
- State might be partially updated
- Manual intervention required:
  - Check CloudWatch Logs for error
  - Fix underlying issue
  - Manually run `terraform apply` to recover
  - Or revert code commit and re-run pipeline

**Rollback Procedure:**
- State versioning in S3 means we can restore previous state
- Git revert the commit that broke things
- Push revert, pipeline runs again
- Or manually restore state: `terraform state pull > backup.tfstate`

**State Lock Issues:**
If a build crashes and leaves a lock:
```
# Manually unlock (use with caution)
terraform force-unlock LOCK_ID
```

## Mandatory Requirements - No Exceptions

1. **Pipeline must include manual approval stage before production deployment** (not dev/staging)
2. **All Terraform state files must be stored in S3 with encryption enabled**
3. **CodeBuild projects must use custom Docker images** (not default images)
4. **Pipeline must support multiple environments** (dev, staging, prod) with separate branches
5. **All resources must be tagged** with Environment and Project keys

## What We Need From You - Terraform HCL Code

**Main Terraform Files:**
- `versions.tf` (Terraform >= 1.5, AWS >= 5.x)
- `providers.tf` (AWS provider for us-east-1)
- `variables.tf` (all inputs)
- `codecommit.tf` (repository with branches)
- `s3-backend.tf` (state bucket with versioning and encryption)
- `dynamodb.tf` (state lock table)
- `ecr.tf` (Docker image repository)
- `codebuild.tf` (plan and apply projects for all environments)
- `codepipeline.tf` (pipelines for all environments)
- `iam.tf` (all service roles and policies)
- `sns.tf` (notification topics)
- `outputs.tf` (repository URL, bucket name, pipeline names, etc.)

**Additional Files:**
- `docker/Dockerfile` (custom Terraform runner image)
- `buildspecs/buildspec-plan.yml`
- `buildspecs/buildspec-apply.yml`
- `.gitignore` (exclude .terraform, tfstate files, etc.)

**Documentation:**
Comprehensive README.md covering:
- What this pipeline does
- Architecture diagram (CodeCommit → CodePipeline → CodeBuild → Resources)
- Prerequisites (AWS CLI configured, Terraform installed locally)
- Setup instructions:
  1. Deploy this Terraform code to create the pipeline
  2. Build and push Docker image to ECR
  3. Initialize the repository with starter code
  4. Make a commit to test
- How to use the pipeline:
  - Commit workflow
  - How approval works
  - Where to find plan outputs
  - How to monitor pipeline
- Multi-environment strategy explanation
- Troubleshooting common issues:
  - State lock conflicts
  - Build failures
  - Permission errors
  - Approval timeouts
- Security best practices
- Cost estimates
- How to add a new environment

## Design Considerations

**Security:**
- State encrypted at rest and in transit
- CodeBuild in private subnets
- IAM roles scoped to minimum permissions
- Manual approval prevents accidental prod changes
- CloudTrail logs all actions
- No secrets in code (use Secrets Manager if needed)

**Reliability:**
- State locking prevents concurrent modifications
- State versioning allows recovery
- Separate environments prevent cross-contamination
- Pipeline stops on first failure
- Notifications ensure team knows what's happening

**Cost Optimization:**
- On-demand DynamoDB (only pays when locked)
- Small CodeBuild instances for most operations
- S3 lifecycle policies on old artifacts
- Use same Docker image across all projects

**Scalability:**
- Easy to add new environments (just add branch and pipeline)
- Can run multiple pipelines for different projects
- Docker image can be updated independently
- Modular IAM roles can be reused

Make everything production-ready, well-documented, and easy for developers to use. The goal is that they never need to run `terraform apply` locally - everything goes through the pipeline!
```
