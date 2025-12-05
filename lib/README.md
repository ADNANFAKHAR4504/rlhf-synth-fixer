# Infrastructure Analysis Tool

This tool analyzes existing AWS infrastructure using Terraform data sources and generates detailed JSON reports.

## Prerequisites

- Terraform 1.5+
- AWS credentials configured
- AWS CLI installed

## Usage

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Set Variables

```bash
export TF_VAR_environment_suffix="dev"
export TF_VAR_aws_region="us-east-1"
```

### 3. Run Analysis

```bash
terraform apply -auto-approve
```

### 4. View Reports

Reports are generated in the `outputs/` directory:

- `ec2-analysis-{env}.json` - EC2 instance analysis
- `security-group-analysis-{env}.json` - Security group violations
- `s3-analysis-{env}.json` - S3 bucket configuration analysis
- `iam-analysis-{env}.json` - IAM role and policy analysis
- `vpc-analysis-{env}.json` - VPC and subnet analysis
- `rds-analysis-{env}.json` - RDS instance configuration
- `cost-estimation-{env}.json` - Cost breakdown and recommendations
- `summary-{env}.json` - Overall analysis summary

## Analysis Categories

### EC2 Instance Analysis
- Tag compliance (Environment, Owner, CostCenter)
- Instance state monitoring
- Availability zone distribution
- Cost estimation by instance type

### Security Group Analysis
- Unrestricted inbound rules (0.0.0.0/0)
- SSH/RDP exposure from internet
- Unused security groups
- Overly permissive outbound rules

### S3 Bucket Analysis
- Encryption configuration
- Versioning status
- Public access configuration
- Lifecycle policies

### IAM Role Analysis
- Wildcard permissions on resources
- Administrator access policies
- Role usage activity
- Trust relationship security

### VPC Analysis
- Subnet CIDR allocation
- Unused subnets
- VPC flow logs status
- Internet gateway exposure

### RDS Analysis
- Automated backup configuration
- Backup retention periods
- Encryption at rest
- Public accessibility

### Cost Estimation
- Monthly cost by instance type
- Top 10 most expensive resources
- Cost optimization recommendations

## Cleanup

```bash
terraform destroy -auto-approve
```

This removes all generated report files.

## Environment Variables

- `TF_VAR_environment_suffix` - Environment identifier (default: dev)
- `TF_VAR_aws_region` - AWS region to analyze (default: us-east-1)
- `TF_VAR_output_dir` - Directory for reports (default: outputs)

## Notes

- This tool only reads AWS resources, it does not create or modify infrastructure
- All analysis uses Terraform data sources
- Reports are generated as JSON files using `local_file` resources
- The tool supports multi-account analysis via AWS assume role configuration
