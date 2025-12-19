# Terraform Infrastructure Configuration

This directory contains the Terraform configuration for the foundational AWS infrastructure.

## Quick Start

### 1. Configure Variables

Copy the example configuration:
```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your environment-specific values:
- `resource_suffix`: Unique suffix for your environment (e.g., "dev", "staging", "prod")
- `ssh_cidr_blocks`: IP ranges allowed to SSH to EC2 instances
- Other infrastructure parameters

### 2. Configure Backend (Optional)

If using S3 remote state, copy and configure the backend:
```bash
cp backend.conf.example backend.conf
```

Edit `backend.conf` with your S3 backend details.

### 3. Initialize Terraform

**With S3 backend:**
```bash
terraform init -backend-config=backend.conf
```

**With local state (development only):**
```bash
terraform init
```

### 4. Plan and Apply

```bash
terraform plan
terraform apply
```

## Important Notes

### Security
- ⚠️ **Never commit `terraform.tfvars` or `backend.conf` to git** - they contain environment-specific and potentially sensitive configuration
- ✅ Only commit `.example` files as templates
- 🔒 Set `ssh_cidr_blocks` to restrictive values - never use `["0.0.0.0/0"]` in production

### Backend Configuration
The `main.tf` file contains an empty S3 backend block:
```terraform
backend "s3" {}
```

This requires external configuration via:
1. Command line: `terraform init -backend-config="bucket=..." -backend-config="key=..."`
2. Config file: `terraform init -backend-config=backend.conf`
3. CI/CD environment variables

### CI/CD Integration
For automated deployments, provide backend configuration via:
- Environment variables (recommended for CI/CD)
- Pre-configured backend.conf file
- Terraform Cloud workspaces

## Outputs

After `terraform apply`, infrastructure details are exported to:
- `terraform-outputs.json` - Terraform native format
- `cfn-outputs/flat-outputs.json` - Flat format for integration tests

## Resources Created

This configuration creates:
- VPC with public and private subnets
- EC2 instance (Amazon Linux 2)
- RDS MySQL database
- S3 bucket for Terraform state
- IAM roles and security groups
- Secrets Manager for RDS credentials

For detailed requirements, see `PROMPT.md`.
