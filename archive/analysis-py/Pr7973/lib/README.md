# Infrastructure Analysis Module

A comprehensive Terraform module for analyzing and validating AWS infrastructure compliance without modifying resources.

## Overview

This module performs non-destructive analysis of existing AWS resources, checking compliance against organizational policies for:
- EC2 instance types and costs
- RDS backup configurations
- S3 bucket security settings
- Security group rules
- Resource tagging standards

## Requirements

- Terraform >= 1.5.0
- AWS Provider ~> 5.0
- Read-only AWS credentials with permissions to describe:
  - EC2 instances
  - RDS databases
  - S3 buckets and configurations
  - Security groups

## Usage

### Basic Usage

```hcl
module "infrastructure_analysis" {
  source = "./lib"

  aws_region         = "us-east-1"
  environment_suffix = "dev"

  ec2_instance_ids = [
    "i-0123456789abcdef0",
    "i-0fedcba9876543210"
  ]

  rds_db_instance_ids = [
    "mydb-dev",
    "analytics-dev"
  ]

  s3_bucket_names = [
    "mybucket-dev",
    "logs-dev"
  ]

  security_group_ids = [
    "sg-0123456789abcdef0",
    "sg-0fedcba9876543210"
  ]
}
```

### Resource Discovery by Environment Suffix

The module supports discovering resources by naming pattern:

```bash
# List EC2 instances with environment suffix
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*-dev" \
  --query 'Reservations[].Instances[].InstanceId' \
  --output text

# List RDS instances with environment suffix
aws rds describe-db-instances \
  --query 'DBInstances[?contains(DBInstanceIdentifier, `-dev`)].DBInstanceIdentifier' \
  --output text

# List S3 buckets with environment suffix
aws s3api list-buckets \
  --query 'Buckets[?contains(Name, `-dev`)].Name' \
  --output text
```

### Running Analysis

```bash
# Initialize Terraform
terraform init

# Run analysis
terraform plan

# Apply to generate compliance reports
terraform apply -auto-approve

# View specific outputs
terraform output ec2_instance_analysis
terraform output compliance_summary
terraform output cicd_report
```

## Compliance Checks

### EC2 Instance Validation
- **Approved Types**: t3.micro, t3.small, t3.medium
- **Cost Threshold**: Warns for instances > $100/month
- **Status**: Reports violations with instance IDs and types

### RDS Database Validation
- **Backup Enabled**: Automated backups must be enabled
- **Retention Period**: Minimum 7 days
- **Status**: Reports non-compliant databases

### S3 Bucket Security
- **Versioning**: Must be enabled
- **Encryption**: Server-side encryption required
- **Status**: Reports non-compliant buckets

### Security Group Analysis
- **Allowed Public Access**: Ports 80 and 443
- **Violations**: Any other port with 0.0.0.0/0 access
- **Status**: Reports unrestricted access rules

### Tagging Compliance
- **Required Tags**: Environment, Owner, CostCenter, Project
- **Metrics**: Compliance percentage calculated
- **Status**: Reports resources with missing tags

## Outputs

### Detailed Outputs
- `ec2_instance_analysis` - EC2 compliance and cost data
- `rds_database_analysis` - RDS backup compliance
- `s3_bucket_analysis` - S3 security compliance
- `security_group_analysis` - Security group rule violations
- `tagging_compliance_analysis` - Tag compliance metrics

### Summary Outputs
- `compliance_summary` - Overall compliance status
- `cost_summary` - Infrastructure cost analysis
- `cicd_report` - Machine-readable JSON for CI/CD

### Example Output

```json
{
  "compliance_summary": {
    "total_resources_analyzed": 15,
    "total_violations": 3,
    "compliance_by_category": {
      "ec2_instances": "PASS",
      "rds_databases": "FAIL",
      "s3_buckets": "FAIL",
      "security_groups": "PASS",
      "tagging": "FAIL"
    },
    "overall_compliance_percentage": 80,
    "overall_status": "FAIL"
  }
}
```

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| aws_region | AWS region for analysis | string | "us-east-1" | no |
| environment_suffix | Environment suffix for resource discovery | string | "" | no |
| ec2_instance_ids | List of EC2 instance IDs to analyze | list(string) | [] | no |
| rds_db_instance_ids | List of RDS database identifiers | list(string) | [] | no |
| s3_bucket_names | List of S3 bucket names | list(string) | [] | no |
| security_group_ids | List of security group IDs | list(string) | [] | no |

## IAM Permissions

Minimum required IAM permissions for read-only analysis:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeSecurityGroups",
        "rds:DescribeDBInstances",
        "s3:GetBucketVersioning",
        "s3:GetEncryptionConfiguration",
        "s3:ListBucket",
        "s3:GetBucketTagging"
      ],
      "Resource": "*"
    }
  ]
}
```

## CI/CD Integration

Use the `cicd_report` output for automated compliance checking:

```bash
# Run analysis and extract CI/CD report
terraform apply -auto-approve
REPORT=$(terraform output -raw cicd_report)

# Parse compliance status
STATUS=$(echo $REPORT | jq -r '.compliance.overall_status')

if [ "$STATUS" != "PASS" ]; then
  echo "Compliance check failed"
  exit 1
fi
```

## Cost Estimates

Monthly cost estimates for EC2 instances (us-east-1):
- t3.micro: $7.30/month
- t3.small: $14.60/month
- t3.medium: $29.20/month
- Other types: Estimated at $100/month (flagged as warnings)

## Limitations

- Analysis only - no resources are created or modified
- Requires existing resources with proper IAM permissions
- Cost estimates are approximate based on on-demand pricing
- Does not analyze stopped EC2 instances for compliance
