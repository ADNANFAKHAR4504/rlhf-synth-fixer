```markdown
# AWS CodePipeline Terraform Infrastructure

This Terraform configuration creates a complete CI/CD pipeline for automating Terraform infrastructure deployments using AWS CodePipeline with GitHub integration.

## Architecture Overview

The pipeline implements a secure, automated workflow for Terraform deployments:

1. **Source Stage**: Monitors GitHub repository via CodeStar Connections
2. **Validate Stage**: Runs `terraform validate` to catch syntax errors
3. **Plan Stage**: Runs `terraform plan` to preview changes
4. **Approval Stage**: Manual approval gate before applying changes
5. **Apply Stage**: Runs `terraform apply` to deploy infrastructure

## Critical Information: CodeCommit Deprecation

**IMPORTANT**: AWS CodeCommit has been deprecated and is no longer available for new AWS accounts. This implementation uses GitHub as the source repository via AWS CodeStar Connections instead.

The CodeStar Connection requires manual authorization in the AWS Console before the pipeline will function. See Setup Instructions below.

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- GitHub repository with Terraform infrastructure code
- AWS account with permissions to create:
  - CodePipeline
  - CodeBuild
  - CodeStar Connections
  - S3 buckets
  - IAM roles and policies
  - SNS topics
  - CloudWatch log groups
  - EventBridge rules

## Resources Created

- **CodePipeline**: Main orchestration pipeline
- **CodeStar Connection**: GitHub integration (requires manual authorization)
- **CodeBuild Projects**: 3 projects (validate, plan, apply)
- **S3 Bucket**: Pipeline artifacts with encryption and versioning
- **IAM Roles**: Separate roles for CodePipeline, CodeBuild, and EventBridge
- **SNS Topic**: Pipeline notifications
- **CloudWatch Log Groups**: Build logs with 7-day retention
- **EventBridge Rule**: Automated pipeline triggers (optional)
- **CloudWatch Alarms**: Pipeline failure alerts (optional)

## Quick Start

### 1. Configure Variables

Copy the example file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars

Edit `terraform.tfvars` with your values:

```hcl
environment_suffix      = "prod-001"
github_repository_owner = "your-github-org"
github_repository_name  = "your-infrastructure-repo"
notification_email      = "team@example.com"

### 2. Initialize Terraform

```bash
terraform init

### 3. Plan Deployment

```bash
terraform plan -out=tfplan

### 4. Apply Infrastructure

```bash
terraform apply tfplan

### 5. Authorize GitHub Connection (CRITICAL)

After deployment, you **MUST** authorize the GitHub connection:

1. Go to AWS Console → Developer Tools → CodePipeline → Settings → Connections
2. Find connection: `github-connection-{your-environment-suffix}`
3. Status will show "Pending"
4. Click "Update pending connection"
5. Click "Install a new app" or "Use existing app"
6. Authorize AWS CodeStar to access your GitHub repository
7. Connection status will change to "Available"

**The pipeline will not work until this step is completed.**

### 6. Configure Email Notifications (Optional)

If you provided an email address:

1. Check your inbox for "AWS Notification - Subscription Confirmation"
2. Click "Confirm subscription"
3. You will now receive pipeline status notifications

### 7. Verify Pipeline

```bash
# Get pipeline details
terraform output pipeline_url

# Check connection status
terraform output codestar_connection_status

Visit the pipeline URL to see the pipeline dashboard.

## Usage

### Triggering the Pipeline

The pipeline automatically triggers when:
- Changes are pushed to the configured GitHub branch (default: main)
- You manually start the pipeline from AWS Console
- EventBridge detects repository changes (if configured)

### Manual Pipeline Execution

```bash
aws codepipeline start-pipeline-execution \
  --name $(terraform output -raw pipeline_name)

### Viewing Build Logs

```bash
# View validate logs
aws logs tail /aws/codebuild/terraform-validate-{environment-suffix} --follow

# View plan logs
aws logs tail /aws/codebuild/terraform-plan-{environment-suffix} --follow

# View apply logs
aws logs tail /aws/codebuild/terraform-apply-{environment-suffix} --follow

### Approving Changes

When the pipeline reaches the Approval stage:

1. Review the Terraform plan output in the Plan stage logs
2. Go to AWS Console → CodePipeline → Your Pipeline
3. Click "Review" on the Approval stage
4. Add comments (optional)
5. Click "Approve" or "Reject"

## Configuration Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `environment_suffix` | Unique suffix for resource names | `"prod-001"` |
| `github_repository_owner` | GitHub organization or user | `"my-org"` |
| `github_repository_name` | Repository name | `"infrastructure"` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS deployment region | `"us-east-1"` |
| `github_branch` | Branch to monitor | `"main"` |
| `notification_email` | Email for alerts | `""` (disabled) |
| `log_retention_days` | CloudWatch log retention | `7` |
| `enable_pipeline_alarms` | Enable failure alarms | `false` |
| `codebuild_compute_type` | CodeBuild compute size | `"BUILD_GENERAL1_SMALL"` |
| `codebuild_image` | CodeBuild container image | `"aws/codebuild/standard:7.0"` |

## Outputs

Key outputs from the deployment:

```bash
# Pipeline details
terraform output pipeline_name
terraform output pipeline_url

# GitHub connection (must authorize)
terraform output codestar_connection_arn
terraform output codestar_connection_status

# S3 artifact bucket
terraform output artifact_bucket_name

# SNS notification topic
terraform output notification_topic_arn

# Setup instructions
terraform output setup_instructions

## Security Considerations

### IAM Permissions

The CodeBuild role has broad permissions to deploy infrastructure. In production:

1. Review `iam.tf` and restrict permissions based on your needs
2. Use least-privilege access for specific AWS services
3. Consider using IAM permission boundaries
4. Regularly audit IAM policies

### S3 Bucket Security

The artifact bucket includes:
- Server-side encryption (AES256)
- Versioning enabled
- Public access blocked
- Lifecycle policies for artifact cleanup

### CodeStar Connection Security

- Connection requires manual authorization
- Uses OAuth for GitHub authentication
- Scoped to specific repositories
- Can be revoked from GitHub settings

## Cost Optimization

Estimated monthly costs (us-east-1):

- **CodePipeline**: ~$1/month (1 active pipeline)
- **CodeBuild**: ~$0.005/minute (BUILD_GENERAL1_SMALL)
- **S3**: ~$0.023/GB storage + requests
- **CloudWatch Logs**: ~$0.50/GB ingested
- **SNS**: Minimal (first 1,000 notifications free)

**Total estimated cost**: $5-15/month depending on usage

### Cost Reduction Tips

1. Use BUILD_GENERAL1_SMALL compute type (smallest)
2. Set short log retention (7 days default)
3. Enable S3 lifecycle policies (90 days default)
4. Disable alarms if not needed
5. Clean up old pipeline executions

## Troubleshooting

### Pipeline Fails at Source Stage

**Error**: "Could not access the CodeStar Connection"

**Solution**: Authorize the GitHub connection in AWS Console (see Setup step 5)

### Pipeline Fails at Validate Stage

**Error**: "terraform: command not found"

**Solution**: Ensure CodeBuild image includes Terraform (aws/codebuild/standard:7.0 includes it)

### Pipeline Fails at Plan Stage

**Error**: "Error: Failed to get existing workspaces"

**Solution**: Configure Terraform backend in your repository's Terraform code

### Pipeline Fails at Apply Stage

**Error**: "Error: Insufficient permissions"

**Solution**: Review and update the CodeBuild IAM role permissions in `iam.tf`

### Connection Status Shows "Pending"

**Solution**: You must manually authorize the connection in AWS Console → Connections

### No Email Notifications

**Solutions**:
1. Verify you confirmed the SNS subscription email
2. Check spam folder for AWS notification emails
3. Verify `notification_email` variable is set

## Cleanup

To destroy all resources:

```bash
# Review what will be destroyed
terraform plan -destroy

# Destroy all resources
terraform destroy

**Note**: The S3 bucket is configured with `force_destroy = true`, so it will be deleted along with all artifacts.

## Important Notes

1. **GitHub Connection**: Must be manually authorized before pipeline works
2. **Repository Configuration**: Update `terraform.tfvars` with your actual GitHub repository
3. **Manual Approval**: Plan stage output should be reviewed before approving
4. **State Management**: Configure Terraform backend in your infrastructure repository
5. **Permissions**: CodeBuild role has broad permissions - customize for production
6. **Cost Monitoring**: Monitor CodeBuild minutes and S3 storage usage

## Support and Contribution

For issues or questions:
1. Review the troubleshooting section above
2. Check AWS CodePipeline and CodeBuild documentation
3. Verify GitHub CodeStar Connection authorization
4. Review CloudWatch logs for detailed error messages

## References

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [AWS CodeStar Connections](https://docs.aws.amazon.com/codestar-connections/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [CodeCommit Deprecation Notice](https://aws.amazon.com/codecommit/)
