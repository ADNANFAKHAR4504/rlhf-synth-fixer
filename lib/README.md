# AWS Infrastructure Analysis Tool

This Terraform configuration provides comprehensive analysis of existing AWS infrastructure for compliance, security, and cost optimization.

## Features

- **EC2 Analysis**: Tag compliance, cost estimation, state tracking
- **Security Group Analysis**: Unrestricted access detection, SSH/RDP exposure
- **S3 Bucket Analysis**: Encryption and versioning checks
- **IAM Role Analysis**: Overly permissive policy detection
- **VPC Analysis**: Subnet utilization, CIDR tracking
- **RDS Analysis**: Backup, encryption, and accessibility validation
- **Cost Estimation**: Monthly cost projections for EC2 resources
- **Summary Reports**: Comprehensive overview with critical findings

## Prerequisites

- Terraform >= 1.5.0
- AWS Provider >= 5.0
- AWS credentials configured
- Read access to AWS resources

## Usage

### Initialize Terraform

```bash
terraform init
```

### Run Analysis

```bash
# Set environment suffix (optional)
export TF_VAR_environment_suffix="prod"

# Set AWS region (optional)
export TF_VAR_aws_region="us-east-1"

# Run terraform apply to generate reports
terraform apply
```

### View Reports

Reports are generated in the `infrastructure-analysis-reports/` directory:

- `ec2-analysis-{env}.json` - EC2 instance analysis
- `security-group-analysis-{env}.json` - Security group analysis
- `s3-analysis-{env}.json` - S3 bucket analysis
- `iam-analysis-{env}.json` - IAM role analysis
- `vpc-analysis-{env}.json` - VPC and subnet analysis
- `rds-analysis-{env}.json` - RDS instance analysis
- `cost-estimation-{env}.json` - Cost estimation report
- `summary-{env}.json` - Overall summary with critical findings

### View Summary Output

```bash
terraform output analysis_summary
terraform output critical_findings
terraform output reports_generated
```

### Clean Up

```bash
# Remove generated reports
terraform destroy
```

## Configuration

### Variables

- `aws_region` - AWS region to analyze (default: us-east-1)
- `environment_suffix` - Environment identifier (default: dev)
- `output_dir` - Output directory for reports (default: ./infrastructure-analysis-reports)

### Customization

Edit `variables.tf` to change defaults or pass variables via command line:

```bash
terraform apply -var="aws_region=us-west-2" -var="environment_suffix=staging"
```

## Compliance Checks

### EC2 Instances

- Required tags: Environment, Owner, CostCenter
- Instance state monitoring
- Cost estimation based on instance type

### Security Groups

- Unrestricted inbound rules (0.0.0.0/0)
- SSH port 22 open to world
- RDP port 3389 open to world

### RDS Instances

- Automated backups enabled (>= 7 days retention)
- Storage encryption enabled
- Not publicly accessible

## Limitations

- S3 encryption and versioning details require additional AWS API calls
- IAM policy analysis for wildcards requires deeper inspection
- Cost estimates are approximate based on standard pricing
- No actual AWS resources are created or modified

## Multi-Account Support

To analyze multiple accounts, configure AWS provider with assume role:

```hcl
provider "aws" {
  region = var.aws_region

  assume_role {
    role_arn = "arn:aws:iam::ACCOUNT_ID:role/AnalysisRole"
  }
}
```

## Security Considerations

- This configuration only reads existing resources
- No AWS resources are created or modified
- Reports may contain sensitive information - handle appropriately
- Use appropriate IAM permissions for read-only access

## Cost

Running this analysis incurs minimal costs:
- Terraform state storage (if using S3 backend)
- AWS API calls (typically free tier eligible)
- No infrastructure resources are created

## Support

For issues or questions, refer to the Terraform and AWS provider documentation.
