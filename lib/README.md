# CI/CD Pipeline Infrastructure

This Terraform configuration deploys a complete multi-stage CI/CD pipeline for automating Terraform infrastructure deployments using AWS CodePipeline, CodeBuild, and GitHub integration.

## Architecture Overview

The pipeline consists of four stages:

1. **Source Stage**: Pulls code from GitHub using CodeStar Connections
2. **Validate Stage**: Runs terraform fmt, validate, and tfsec security scanning
3. **Plan Stage**: Generates Terraform plan with artifacts
4. **Approval Stage**: Manual approval gate before deployment
5. **Apply Stage**: Executes terraform apply with notifications

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.6.0 installed
- GitHub repository for infrastructure code
- Email address for pipeline notifications
- AWS account with permissions to create CodePipeline, CodeBuild, S3, DynamoDB, IAM resources

## Deployment Instructions

### Step 1: Configure Variables

Copy the example variables file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:

```hcl
environment_suffix   = "dev-001"              # Unique identifier
aws_region          = "us-east-1"             # AWS region
github_repository_id = "yourorg/yourrepo"     # GitHub repo (owner/name)
github_branch       = "main"                  # Branch to monitor
notification_email  = "team@example.com"      # Email for notifications
```

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Review Plan

```bash
terraform plan
```

### Step 4: Deploy Infrastructure

```bash
terraform apply
```

Review the changes and type `yes` to confirm.

### Step 5: Activate CodeStar Connection (CRITICAL)

After deployment, the CodeStar Connection requires manual activation in the AWS Console:

1. Navigate to AWS Console → CodePipeline → Settings → Connections
2. Find the connection named `github-connection-<your-suffix>`
3. Click "Update pending connection"
4. Follow the OAuth flow to authorize AWS access to your GitHub account
5. Complete the connection setup

**IMPORTANT**: The pipeline will not work until this step is completed.

### Step 6: Confirm SNS Email Subscription

Check your email inbox for the SNS subscription confirmation email and click the confirmation link.

### Step 7: Configure Remote State Backend (Optional)

To manage the pipeline infrastructure's own state remotely:

1. Note the outputs from deployment:
   ```bash
   terraform output state_bucket_name
   terraform output state_lock_table_name
   ```

2. Update `backend.tf.example` with your actual bucket and table names

3. Rename to `backend.tf` and migrate state:
   ```bash
   terraform init -migrate-state
   ```

## Usage

### Triggering the Pipeline

The pipeline automatically triggers when code is pushed to the configured GitHub branch.

### Manual Pipeline Execution

You can also trigger the pipeline manually via AWS Console or CLI:

```bash
aws codepipeline start-pipeline-execution \
  --name terraform-pipeline-<your-suffix>
```

### Monitoring Pipeline Execution

- **AWS Console**: CodePipeline → Pipelines → terraform-pipeline-<your-suffix>
- **CloudWatch Logs**: View build logs in CloudWatch Log Groups
- **Email Notifications**: Receive notifications for approvals and failures

### Approving Deployments

When the pipeline reaches the Approval stage:

1. You'll receive an email notification
2. Review the Terraform plan in the Plan stage logs
3. In AWS Console, approve or reject the deployment

## Pipeline Stages Details

### Validate Stage

- Runs `terraform fmt -check` to verify formatting
- Runs `terraform validate` to check syntax
- Runs `tfsec` for security scanning
- Duration: ~2-3 minutes

### Plan Stage

- Initializes Terraform with remote backend
- Generates execution plan
- Stores plan artifacts for Apply stage
- Duration: ~3-5 minutes

### Apply Stage

- Applies the Terraform plan
- Sends SNS notification on completion
- Duration: Varies based on resources

## State Management

The pipeline uses remote state with locking:

- **State Storage**: S3 bucket `terraform-state-<suffix>`
- **State Locking**: DynamoDB table `terraform-state-lock-<suffix>`
- **Encryption**: Server-side encryption enabled
- **Versioning**: Enabled with 90-day lifecycle

## Security Features

- All S3 buckets block public access
- Server-side encryption enabled
- IAM roles follow least privilege principle
- State locking prevents concurrent modifications
- Security scanning with tfsec
- Manual approval required before apply

## Troubleshooting

### Pipeline Fails at Source Stage

**Issue**: "Connection not available" error

**Solution**: Ensure CodeStar Connection is activated (see Step 5 above)

### Pipeline Fails at Validate Stage

**Issue**: Terraform format or validation errors

**Solution**: Run locally:
```bash
terraform fmt -recursive
terraform init -backend=false
terraform validate
```

### Pipeline Fails at Plan Stage

**Issue**: Backend initialization errors

**Solution**: Verify state bucket and DynamoDB table exist and IAM role has permissions

### Pipeline Fails at Apply Stage

**Issue**: Insufficient permissions

**Solution**: Review IAM role policy in `iam.tf` and ensure it includes necessary permissions for your infrastructure

## Resource Naming

All resources include the `environment_suffix` variable for uniqueness:

- Pipeline: `terraform-pipeline-<suffix>`
- CodeBuild Projects: `terraform-validate/plan/apply-<suffix>`
- S3 Buckets: `pipeline-artifacts-<suffix>`, `terraform-state-<suffix>`
- DynamoDB Table: `terraform-state-lock-<suffix>`
- IAM Roles: `codepipeline-role-<suffix>`, `codebuild-role-<suffix>`

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: S3 buckets are configured with `force_destroy = true` to allow cleanup even if they contain objects.

## Outputs

After deployment, the following outputs are available:

```bash
terraform output pipeline_name           # CodePipeline name
terraform output pipeline_arn            # CodePipeline ARN
terraform output artifact_bucket_name    # S3 artifacts bucket
terraform output state_bucket_name       # S3 state bucket
terraform output state_lock_table_name   # DynamoDB lock table
terraform output codestar_connection_arn # CodeStar Connection ARN
terraform output sns_topic_arn           # SNS notification topic
```

## Cost Optimization

The infrastructure uses cost-effective settings:

- CodeBuild: BUILD_GENERAL1_SMALL instances
- DynamoDB: Pay-per-request billing
- S3: Lifecycle policies for old versions
- CloudWatch Logs: 7-day retention (configurable)

Estimated monthly cost: $10-30 depending on pipeline execution frequency

## Additional Resources

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [Terraform Backend Configuration](https://www.terraform.io/docs/language/settings/backends/s3.html)
- [CodeStar Connections Setup](https://docs.aws.amazon.com/dtconsole/latest/userguide/connections.html)

## Support

For issues or questions, contact the DevOps team or open an issue in the repository.
