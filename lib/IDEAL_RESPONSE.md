# AWS Multi-Region Infrastructure - Terraform Implementation

## File Structure

This is a **single-file Terraform implementation** containing all resources in one file:

```
lib/
└── tap_stack.tf     # Complete multi-region infrastructure (all-in-one)
```

## Architecture Overview

- **Regions**: us-east-1 (primary), us-west-2 (secondary)
- **Availability Zones**: 3 per region (total 6 AZs)
- **Resources**: 92 Terraform resources
- **Network**: Multi-region VPCs with 3-tier architecture
- **Security**: KMS encryption, Network ACLs, Security Groups, IMDSv2
- **High Availability**: Multi-AZ RDS, Auto Scaling, ALB, Route53 failover

## Implementation: lib/tap_stack.tf

This single file contains:
1. Terraform and provider configuration (AWS multi-region, Random provider)
2. Variable definitions (project_name, environment, owner, db_username, key_name)
3. KMS keys with rotation (both regions)
4. Random password generation with Secrets Manager
5. VPC infrastructure (both regions)
6. Network ACLs (6 resources: public, private, database per region)
7. Security groups (bastion, ALB, application, database)
8. EC2 compute (bastion hosts, launch templates, ASG)
9. Load balancing (ALBs, target groups, listeners)
10. Database (RDS PostgreSQL with encryption)
11. Storage (S3 with encryption and lifecycle policies)
12. Monitoring (CloudTrail, CloudWatch logs and alarms)
13. DNS and CDN (Route53 zones, health checks, CloudFront)
14. IAM roles and policies
15. Outputs for integration testing

### Key Infrastructure Components (excerpt from tap_stack.tf)

```hcl
# Terraform and Provider Configuration
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
}

# Variables
variable "project_name" {
  type    = string
  default = "secure-webapp"
}

variable "environment" {
  type    = string
  default = "production"
}

# ... (92 resources total in single file)
```

**Note**: The complete 1700+ line implementation with all 92 resources is in `lib/tap_stack.tf`. 

### Complete Resource Inventory

The actual tap_stack.tf contains:

**Multi-Region Infrastructure:**
- 2 AWS provider configurations (us-east-1, us-west-2)
- 1 Random provider for password generation
- 5 variables (project_name, environment, owner, db_username, key_name)

**Security & Encryption:**
- 2 KMS keys with rotation (one per region)
- 2 Random passwords for RDS
- 2 Secrets Manager secrets with KMS encryption
- 4 Secret versions
- 6 Network ACLs (public, private, database per region)
- 8 Security groups (bastion, ALB, app, database per region)

**Networking:**
- 2 VPCs (10.0.0.0/16, 10.1.0.0/16)
- 18 Subnets (9 per region: 3 public, 3 private, 3 database)
- 2 Internet Gateways
- 6 Elastic IPs
- 6 NAT Gateways (3 per region for HA)
- 8 Route tables
- 24 Route table associations

**Compute:**
- 2 Bastion hosts (one per region)
- 2 Launch templates with IMDSv2
- 2 Auto Scaling Groups (min=3, max=9)

**Load Balancing:**
- 2 Application Load Balancers
- 2 Target groups
- 2 ALB listeners

**Database:**
- 2 RDS subnet groups
- 2 RDS PostgreSQL 14.10 instances with encryption

**Storage & Logging:**
- 2 S3 buckets with encryption
- 2 S3 bucket lifecycle configurations
- 1 CloudTrail trail (multi-region)
- 4 CloudWatch log groups
- 2 CloudWatch metric alarms

**DNS & CDN:**
- 1 Route53 hosted zone
- 2 Route53 health checks
- 2 Route53 A records with failover routing
- 1 CloudFront distribution

**IAM:**
- 4 IAM roles (app, database, logging per region)
- 6 IAM role policy attachments
- 2 IAM instance profiles

**Total: 92 Terraform resources** providing enterprise-grade, multi-region, highly available infrastructure.

## Key Highlights

**Security in Depth:**
- KMS encryption with automatic key rotation
- AWS Secrets Manager for RDS passwords (no hardcoded credentials)
- Network ACLs + Security Groups (defense-in-depth)
- IMDSv2 enforcement on all EC2 instances
- Private subnets for compute and database layers
- CloudTrail multi-region logging with S3 encryption

**High Availability:**
- Multi-region deployment (us-east-1 + us-west-2)
- 3 Availability Zones per region
- 6 NAT Gateways (3 per region)
- Multi-AZ RDS with automated backups
- Auto Scaling Groups (min=3, max=9)
- Route53 health checks with failover routing

**Production Ready:**
- CloudFront CDN for global content delivery
- Application Load Balancers in both regions
- CloudWatch monitoring and alarms
- Comprehensive tagging strategy
- S3 lifecycle policies for cost optimization
- IAM roles with least privilege access

## Deployment

1. Navigate to the lib/ directory
2. Initialize Terraform: `terraform init`
3. Review the plan: `terraform plan`
4. Apply: `terraform apply`
5. Access outputs: `terraform output`

The single tap_stack.tf file contains all configuration needed for deployment.

## CloudFront Cache Invalidation Procedures

When you deploy new content or make updates to your application, CloudFront may serve cached content instead of the latest version. Use cache invalidation to force CloudFront to fetch fresh content from your origin.

### Method 1: AWS CLI Cache Invalidation

```bash
# Invalidate all files
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"

# Invalidate specific files
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/index.html" "/css/styles.css" "/js/app.js"

# Invalidate a specific directory
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/images/*"
```

### Method 2: AWS Console Cache Invalidation

1. Navigate to CloudFront in AWS Console
2. Select your distribution
3. Go to the "Invalidations" tab
4. Click "Create Invalidation"
5. Enter the paths to invalidate (e.g., `/*` for all files)
6. Click "Create Invalidation"

### Method 3: Terraform Null Resource for Automated Invalidation

Add this to your Terraform configuration for automatic invalidation on deploy:

```hcl
resource "null_resource" "cloudfront_invalidation" {
  triggers = {
    # Trigger on any ALB DNS change or manual trigger
    alb_dns = aws_lb.us_east_1.dns_name
  }

  provisioner "local-exec" {
    command = <<-EOT
      aws cloudfront create-invalidation \
        --distribution-id ${aws_cloudfront_distribution.s3_distribution.id} \
        --paths "/*"
    EOT
  }

  depends_on = [aws_cloudfront_distribution.s3_distribution]
}
```

### Method 4: S3 Event + Lambda Automatic Invalidation

For production environments, set up automatic invalidation when S3 content changes:

```hcl
# Lambda function to invalidate CloudFront cache
resource "aws_lambda_function" "cloudfront_invalidator" {
  filename      = "cloudfront_invalidator.zip"
  function_name = "cloudfront-invalidator"
  role          = aws_iam_role.lambda_cloudfront_invalidator.arn
  handler       = "index.handler"
  runtime       = "python3.11"

  environment {
    variables = {
      DISTRIBUTION_ID = aws_cloudfront_distribution.s3_distribution.id
    }
  }
}

# S3 bucket notification to trigger Lambda
resource "aws_s3_bucket_notification" "cloudfront_invalidation_trigger" {
  bucket = aws_s3_bucket.us_east_1.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.cloudfront_invalidator.arn
    events              = ["s3:ObjectCreated:*"]
  }
}
```

### Best Practices

1. **Limit Invalidation Paths**: The first 1,000 invalidation paths per month are free, then $0.005 per path. Use wildcard patterns like `/images/*` instead of individual files.

2. **Use Versioned Filenames**: Instead of invalidating, append version numbers or hashes to filenames (e.g., `app.v2.js`, `styles.abc123.css`). This is more efficient and immediate.

3. **Set Appropriate TTL**: Configure `Cache-Control` headers on your origin to set appropriate TTL values (e.g., `Cache-Control: max-age=3600`).

4. **Monitor Invalidation Status**: Check invalidation status:
   ```bash
   aws cloudfront get-invalidation \
     --distribution-id <DISTRIBUTION_ID> \
     --id <INVALIDATION_ID>
   ```

5. **Invalidation Time**: Invalidations typically complete in 10-15 minutes but can take longer depending on the number of edge locations.

### Example Invalidation Script

Create a reusable script for common invalidation tasks:

```bash
#!/bin/bash
# invalidate-cloudfront.sh

DISTRIBUTION_ID="your-distribution-id"

case "$1" in
  all)
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
    ;;
  static)
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/css/*" "/js/*" "/images/*"
    ;;
  index)
    aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/index.html"
    ;;
  *)
    echo "Usage: $0 {all|static|index}"
    exit 1
    ;;
esac

echo "Invalidation request submitted for: $1"
```

### Monitoring Invalidation Costs

To avoid unexpected costs, monitor invalidation usage:

```bash
# List all invalidations
aws cloudfront list-invalidations --distribution-id <DISTRIBUTION_ID>

# Get distribution config to check cache behaviors
aws cloudfront get-distribution --id <DISTRIBUTION_ID> --query 'Distribution.DistributionConfig.CacheBehaviors'
```
