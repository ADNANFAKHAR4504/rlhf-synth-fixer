# Terraform CI/CD Pipeline for Multi-Account Deployments

This Terraform configuration deploys a complete CI/CD pipeline using AWS CodePipeline for automated Terraform deployments across multiple AWS accounts.

## Architecture

The pipeline consists of four stages:

1. **Source**: Monitors a CodeCommit repository for changes
2. **Plan**: Executes `terraform plan` using CodeBuild
3. **Approval**: Manual approval gate before production deployment
4. **Apply**: Executes `terraform apply` using CodeBuild

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Access to the pipeline account and target accounts (dev, staging, production)
- Email addresses for pipeline notifications

## Cross-Account Setup

Before deploying this pipeline, you must create IAM roles in the target accounts (dev, staging, prod) that allow the CodeBuild role to assume them.

### Target Account IAM Role

Create this role in each target account (dev, staging, prod):

```hcl
resource "aws_iam_role" "terraform_deployment" {
  name = "TerraformDeploymentRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::<PIPELINE_ACCOUNT_ID>:role/terraform-codebuild-role-<ENVIRONMENT_SUFFIX>"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "terraform_deployment" {
  role       = aws_iam_role.terraform_deployment.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}
```

## Deployment

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Review the plan**:
   ```bash
   terraform plan -var="environment_suffix=dev"
   ```

3. **Apply the configuration**:
   ```bash
   terraform apply -var="environment_suffix=dev"
   ```

4. **Confirm the email subscriptions**:
   Check your email for SNS subscription confirmation messages and click the confirmation links.

## Using the Pipeline

1. **Clone the CodeCommit repository**:
   ```bash
   aws codecommit get-repository --repository-name terraform-infrastructure-<ENVIRONMENT_SUFFIX>
   git clone <clone-url-http>
   ```

2. **Add your Terraform configurations**:
   Place your Terraform files in the repository with the following structure:
   ```
   .
   ├── main.tf
   ├── variables.tf
   ├── outputs.tf
   └── environments/
       ├── dev.tfvars
       ├── staging.tfvars
       └── prod.tfvars
   ```

3. **Commit and push changes**:
   ```bash
   git add .
   git commit -m "Add infrastructure configuration"
   git push origin main
   ```

4. **Pipeline execution**:
   - The pipeline automatically triggers on commits to the repository
   - The Plan stage executes and displays the Terraform plan
   - The Approval stage sends an SNS notification and waits for manual approval
   - After approval, the Apply stage executes and deploys the changes

## State Management

This pipeline configures Terraform to use:

- **S3 backend**: Stores state files in `terraform-state-<ENVIRONMENT_SUFFIX>`
- **DynamoDB locking**: Prevents concurrent state modifications using `terraform-state-locks-<ENVIRONMENT_SUFFIX>`

## Monitoring

- **CloudWatch Logs**: Build logs are stored in:
  - `/aws/codebuild/terraform-plan-<ENVIRONMENT_SUFFIX>`
  - `/aws/codebuild/terraform-apply-<ENVIRONMENT_SUFFIX>`
- **SNS Notifications**: Pipeline state changes trigger SNS notifications
- **EventBridge**: Monitors repository and pipeline events

## Security Features

- KMS encryption for pipeline artifacts
- KMS encryption for SNS notifications
- S3 bucket versioning for state files
- Public access blocked on all S3 buckets
- Least privilege IAM policies
- Cross-account role assumptions for deployments

## Cleanup

To destroy all resources:

```bash
terraform destroy -var="environment_suffix=dev"
```

Note: S3 buckets are configured with `force_destroy = true` to allow cleanup.

## Customization

- Modify CodeBuild buildspec files in `main.tf` to customize build steps
- Adjust timeout values for longer-running Terraform operations
- Add additional pipeline stages for multi-environment deployments
- Configure branch-specific pipelines for different environments

## Troubleshooting

### Pipeline fails at Plan stage
- Check CloudWatch Logs for Terraform errors
- Verify IAM permissions for CodeBuild role
- Ensure cross-account roles exist in target accounts

### Manual approval not received
- Check email spam folder for SNS subscription confirmation
- Verify SNS topic subscriptions are confirmed
- Check EventBridge rule configuration

### State locking errors
- Verify DynamoDB table exists and is accessible
- Check for stale locks in the DynamoDB table
- Ensure proper IAM permissions for DynamoDB operations
