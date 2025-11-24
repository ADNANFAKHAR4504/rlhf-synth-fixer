# AWS Infrastructure Compliance Validator

A Terraform-based read-only infrastructure compliance validation system that analyzes existing AWS resources and generates comprehensive compliance reports.

## Overview

This solution performs automated compliance checks across AWS services including EC2, RDS, S3, VPC, and IAM. It uses Terraform data sources to query existing resources and validates them against security best practices and organizational standards.

## Features

- **EC2 Instance Validation**: Checks for approved AMIs, required tags, and security group usage
- **RDS Database Compliance**: Validates backup retention, encryption, and multi-AZ deployment
- **S3 Bucket Security**: Verifies encryption, versioning, and public access blocks
- **VPC Security Analysis**: Identifies overly permissive security group rules
- **IAM Policy Review**: Detects wildcard permissions and overly permissive assume role policies
- **Severity-Based Reporting**: Categorizes findings as critical, high, medium, or low
- **Lifecycle Preconditions**: Prevents apply if critical issues are found
- **JSON Report Generation**: Structured output for integration with dashboards and monitoring

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS IAM permissions to read resources (EC2, RDS, S3, VPC, IAM)

## Important: Input Variables Required

Due to Terraform data source limitations, this solution requires users to provide resource identifiers via input variables. Terraform does not provide data sources to list all resources of a type (e.g., `data "aws_s3_buckets"` does not exist).

### Why Input Variables?

- **Terraform Limitation**: AWS provider doesn't have data sources to list all S3 buckets, IAM roles, or RDS instances
- **Targeted Analysis**: Allows focusing on specific resources rather than entire AWS account
- **Performance**: Queries only specified resources, faster than account-wide scans
- **Flexibility**: Users control which resources to analyze

### Alternative Approach

For comprehensive account-wide scans, consider using AWS CLI with external data sources (requires additional setup).

## Usage

### 1. Clone and Navigate

```bash
cd lib
```

### 2. Configure Resources to Analyze

Copy the example variables file:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your resource identifiers:

```hcl
environment_suffix = "prod-compliance-scan"

ec2_instance_ids = ["i-1234567890abcdef0"]
approved_ami_ids = ["ami-0c55b159cbfafe1f0"]

rds_instance_identifiers = ["production-database"]

s3_bucket_names = ["my-production-data-bucket"]
production_bucket_names = ["my-production-data-bucket"]

iam_role_names = ["ProductionAppRole"]
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Run Compliance Scan

```bash
terraform plan
```

This will query all specified resources and generate the compliance report without making any changes.

### 5. View Compliance Report

```bash
terraform plan -out=plan.tfplan
terraform show -json plan.tfplan | jq '.planned_values.outputs.compliance_report.value'
```

Or after applying (no resources will be created):

```bash
terraform apply
terraform output -json compliance_report | jq .
```

## Configuration Variables

### Required Variables

- `environment_suffix`: Unique identifier for this compliance scan

### Resource Identifiers

- `ec2_instance_ids`: List of EC2 instance IDs to analyze
- `rds_instance_identifiers`: List of RDS database identifiers
- `s3_bucket_names`: List of S3 bucket names
- `iam_role_names`: List of IAM role names

### Compliance Standards

- `approved_ami_ids`: List of approved AMI IDs for EC2
- `minimum_backup_retention_days`: Minimum RDS backup retention (default: 7)
- `production_bucket_names`: S3 buckets requiring versioning
- `required_tags`: Tags required on production resources
- `sensitive_ports`: Ports that shouldn't be open to 0.0.0.0/0

## Output Report Structure

```json
{
  "metadata": {
    "environment_suffix": "prod-compliance-scan",
    "scan_timestamp": "2025-11-24T08:30:00Z",
    "aws_account_id": "123456789012",
    "aws_region": "us-east-1"
  },
  "summary": {
    "total_findings": 15,
    "critical_count": 3,
    "high_count": 5,
    "medium_count": 7,
    "low_count": 0,
    "compliance_status": "CRITICAL_ISSUES_FOUND"
  },
  "findings": {
    "critical": [...],
    "high": [...],
    "medium": [...],
    "low": [...]
  }
}
```

## Compliance Checks

### EC2 Instances
- AMI is in approved list
- Required tags are present
- Not using default security group

### RDS Databases
- Automated backups enabled
- Backup retention >= configured minimum
- Storage encryption enabled
- Multi-AZ for production databases

### S3 Buckets
- Server-side encryption configured
- Versioning enabled for production buckets
- Public access blocked
- Bucket logging enabled

### Security Groups
- No sensitive ports open to 0.0.0.0/0
- Default security groups not in use

### IAM Roles
- No wildcard actions in policies
- Assume role policies properly scoped

## Lifecycle Preconditions

If critical findings are detected, Terraform will fail the plan/apply with an error message:

```
CRITICAL COMPLIANCE ISSUES FOUND: 3 critical findings detected.
Review compliance report before proceeding.
```

This prevents accidental deployment when critical security issues exist.

## Limitations

1. **Manual Resource Specification**: Users must provide resource identifiers (not automatic discovery)
2. **IAM Policy Analysis**: Limited to assume role policies; inline and managed policy analysis requires additional AWS API calls
3. **Read-Only**: This tool does not remediate issues automatically
4. **Region-Specific**: Analyzes resources in specified region only

## Troubleshooting

### Error: Resource Not Found

If Terraform reports a resource doesn't exist:
- Verify resource identifiers in `terraform.tfvars`
- Check AWS region matches resource location
- Confirm IAM permissions to read the resource

### No Findings Generated

If compliance report is empty:
- Ensure resource identifiers are correctly specified
- Verify resources exist in the specified region
- Check that variables are being passed correctly

## Future Enhancements

- AWS CLI integration for automatic resource discovery
- Support for additional AWS services (Lambda, ECS, EKS)
- Custom compliance rule definitions
- Automated remediation scripts
- Historical trend analysis

## License

This is an internal tool for infrastructure compliance validation.
