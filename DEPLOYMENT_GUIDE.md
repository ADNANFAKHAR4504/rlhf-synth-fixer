# Deployment Guide - CDKTF Python Infrastructure

## Overview
This guide provides step-by-step instructions for deploying the Product Catalog API infrastructure using CDKTF with Python.

## Prerequisites
- Node.js and npm installed
- Python 3.x installed
- AWS account with appropriate permissions
- AWS CLI configured (optional but recommended)

## Error Resolution: TERRAFORM_STATE_BUCKET Configuration

### Problem
During deployment, you may encounter this error:
```
Error: Invalid Value
on cdk.tf.json line 802, in terraform.backend.s3:
802: "bucket": "",
The value cannot be empty or all whitespace
```

### Root Cause
The `TERRAFORM_STATE_BUCKET` environment variable is not set, causing the S3 backend configuration to be empty.

### Solution

#### Step 1: Configure Environment Variables

Use the provided `set-env.sh` script to configure all required environment variables:

```bash
source ./set-env.sh
```

This script sets:
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state
- `TERRAFORM_STATE_BUCKET_REGION`: Region for state bucket (us-east-1)
- `AWS_REGION`: Target AWS region for deployment
- `ENVIRONMENT_SUFFIX`: Environment identifier (e.g., pr5706)
- `REPOSITORY`: GitHub repository name
- `COMMIT_AUTHOR`: Author name for tagging
- `TF_VAR_db_username`: Database admin username
- `TF_VAR_db_password`: Database admin password

#### Step 2: Configure AWS Credentials

Before running deployment, configure AWS credentials using one of these methods:

**Method 1: Environment Variables** (Recommended for CI/CD)
```bash
export AWS_ACCESS_KEY_ID="your-access-key-id"
export AWS_SECRET_ACCESS_KEY="your-secret-access-key"
export AWS_REGION="us-east-1"
```

**Method 2: AWS CLI Profile**
```bash
export AWS_PROFILE="your-profile-name"
```

**Method 3: AWS CLI Configuration**
```bash
aws configure
```

#### Step 3: Run Deployment

```bash
source ./set-env.sh
./scripts/deploy.sh
```

## Complete Deployment Commands

```bash
# Configure environment
source ./set-env.sh

# Set AWS credentials (choose one method)
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"

# Run deployment
./scripts/deploy.sh
```

## Deployment Process

The deployment script performs these steps:

1. **Bootstrap Phase**
   - Validates metadata.json
   - Checks platform (cdktf) and language (py)
   - Verifies required tools

2. **Synthesis Phase**
   - Runs `npm run cdktf:synth`
   - Generates Terraform configurations
   - Validates S3 backend configuration

3. **Deploy Phase**
   - Initializes Terraform backend
   - Plans infrastructure changes
   - Applies changes with auto-approval

## Infrastructure Components

The deployment creates:

- **VPC**: 10.0.0.0/16 with DNS support
- **Subnets**: 2 public + 2 private across 2 AZs
- **Internet Gateway**: For public subnet access
- **Security Groups**: ALB, ECS, and RDS with least privilege
- **Application Load Balancer**: Public-facing HTTP listener
- **ECS Fargate Cluster**: With FARGATE_SPOT capacity
- **ECS Service**: 2-10 tasks with auto-scaling
- **RDS Aurora PostgreSQL**: Version 16.4, db.t3.medium
- **CloudFront Distribution**: CDN with managed cache policy
- **Secrets Manager**: Database credentials storage
- **CloudWatch Logs**: ECS task logging (7-day retention)
- **S3 Bucket**: Log storage (30-day lifecycle)
- **IAM Roles**: Task execution and policy attachments
- **Auto Scaling**: CPU-based (70% target)

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TERRAFORM_STATE_BUCKET` | Yes | iac-rlhf-tf-states | S3 bucket for state files |
| `TERRAFORM_STATE_BUCKET_REGION` | Yes | us-east-1 | State bucket region |
| `AWS_REGION` | Yes | us-east-1 | Target deployment region |
| `ENVIRONMENT_SUFFIX` | Yes | pr5706 | Environment identifier |
| `REPOSITORY` | No | TuringGpt/iac-test-automations | Repository name |
| `COMMIT_AUTHOR` | No | mayanksethi-turing | Author for tagging |
| `TF_VAR_db_username` | No | temp_admin | Database username |
| `TF_VAR_db_password` | No | TempPassword123! | Database password |
| `AWS_ACCESS_KEY_ID` | Yes* | - | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Yes* | - | AWS secret key |

*Required for deployment, not needed for synthesis only

## Troubleshooting

### Error: "No valid credential sources found"

**Cause**: AWS credentials are not configured

**Solution**:
```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
```

### Error: "TERRAFORM_STATE_BUCKET is empty"

**Cause**: Environment variable not set

**Solution**:
```bash
source ./set-env.sh
```

### Error: "terraform init failed"

**Cause**: S3 backend bucket doesn't exist or no access

**Solution**:
1. Verify bucket exists in AWS
2. Check AWS credentials have S3 access
3. Verify bucket name matches environment variable

## Testing Deployment

After successful deployment, verify:

1. **Check Terraform Outputs**
   ```bash
   cd cdktf.out/stacks/TapStackpr5706
   terraform output
   ```

2. **Verify ECS Service**
   ```bash
   aws ecs describe-services \
     --cluster catalog-api-cluster-pr5706 \
     --services catalog-api-service-pr5706 \
     --region us-east-1
   ```

3. **Test ALB Endpoint**
   ```bash
   # Get ALB DNS from outputs
   curl http://<alb-dns-name>/health
   ```

## Cleanup

To destroy all infrastructure:

```bash
source ./set-env.sh
npm run cdktf:destroy
```

## Configuration Files

- `set-env.sh`: Environment variable configuration
- `metadata.json`: Project metadata (platform, language, services)
- `tap.py`: CDKTF app entry point
- `lib/tap_stack.py`: Infrastructure stack definition
- `scripts/deploy.sh`: Deployment orchestration script
- `scripts/bootstrap.sh`: Bootstrap script for initialization

## Best Practices

1. **Always source `set-env.sh` before deployment**
2. **Use secure methods for AWS credentials** (avoid hardcoding)
3. **Verify state bucket exists before deployment**
4. **Use unique environment suffixes** to avoid conflicts
5. **Review Terraform plan** before applying changes
6. **Keep database passwords secure** (use Secrets Manager in production)

## Notes

- The deployment uses FARGATE_SPOT for cost optimization
- Auto-scaling is configured for 2-10 tasks based on CPU (70% target)
- RDS Aurora uses version 16.4 (compatible with all regions)
- CloudFront uses managed cache policy (no legacy forwarded_values)
- All resources include environment_suffix for uniqueness
- No deletion protection is enabled (for testing purposes)
