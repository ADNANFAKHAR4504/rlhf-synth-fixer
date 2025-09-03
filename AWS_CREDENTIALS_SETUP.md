# AWS Terraform Configuration - Credential Setup Guide

## Problem Description
The error "No valid credential sources found" occurs when Terraform cannot authenticate with AWS. This happens because the AWS provider needs proper credentials to create, modify, or destroy AWS resources.

## Solutions

### Option 1: Environment Variables (Recommended for CI/CD)

Set the following environment variables in your CI/CD system:

```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_DEFAULT_REGION="us-east-1"
```

### Option 2: AWS IAM Role with OIDC (Most Secure for GitHub Actions)

1. Create an IAM role in AWS with the necessary permissions
2. Configure the role to trust GitHub's OIDC provider
3. Add the role ARN to your GitHub repository secrets as `AWS_ROLE_TO_ASSUME`
4. Use the `aws-actions/configure-aws-credentials` action in your workflow

### Option 3: Static Credentials via Terraform Variables

Create a `terraform.tfvars` file:

```hcl
aws_region = "us-east-1"
# Uncomment and set these (NOT recommended for production)
# aws_access_key_id     = "your-access-key-id"
# aws_secret_access_key = "your-secret-access-key"
```

### Option 4: AWS CLI Profiles (Local Development)

Configure AWS CLI:

```bash
aws configure
```

## GitHub Actions Setup

### For OIDC Authentication (Recommended):

1. In your AWS account, create an IAM role with the following trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
```

2. Attach necessary IAM policies to the role (e.g., EC2FullAccess, VPCFullAccess)

3. Add the role ARN to GitHub secrets as `AWS_ROLE_TO_ASSUME`

### For Static Credentials:

Add these secrets to your GitHub repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Troubleshooting

### Common Issues:

1. **Missing AWS_REGION**: Ensure the AWS region is set
2. **Incorrect permissions**: Verify the IAM user/role has necessary permissions
3. **Expired credentials**: Check if temporary credentials have expired
4. **EC2 IMDS errors**: This occurs when running outside AWS infrastructure without proper credentials

### Verification Commands:

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test Terraform configuration
terraform validate
terraform plan
```

## File Structure

```
lib/
├── provider.tf         # AWS provider configuration
├── variables.tf        # Variable definitions
├── terraform.tfvars.example  # Example variables file
└── main.tf            # Your infrastructure resources
```

## Quick Fix for Current Issue

1. Set these environment variables in your CI/CD system:
   ```bash
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_DEFAULT_REGION=us-east-1
   ```

2. Or update your GitHub Actions workflow to use the `configure-aws-credentials` action as shown in the example workflow.

3. Make sure your IAM user/role has the necessary permissions for EC2, VPC, and other services you're using.
