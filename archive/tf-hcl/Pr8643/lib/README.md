# Multi-Environment Infrastructure Deployment

This Terraform configuration deploys identical infrastructure across three environments: dev, staging, and prod. Each environment has the same topology but with environment-specific scaling parameters.

## Architecture Overview

The infrastructure includes:

- **VPC** with public and private subnets across multiple AZs
- **EC2 Auto Scaling Groups** with environment-specific instance types
- **Application Load Balancer** for traffic distribution
- **RDS MySQL Database** with environment-appropriate sizing
- **S3 Bucket** for application storage
- **CloudWatch Log Groups** for monitoring
- **IAM Roles and Security Groups** for secure access

## Environment Differences

| Resource | Dev | Staging | Prod |
|----------|-----|---------|------|
| Instance Type | t3.micro | t3.small | t3.medium |
| ASG Min/Max/Desired | 1/2/1 | 1/4/2 | 2/6/3 |
| RDS Instance | db.t3.micro | db.t3.small | db.t3.medium |
| RDS Multi-AZ | No | Yes | Yes |
| NAT Gateway | No | Yes | Yes |
| Availability Zones | 2 | 2 | 3 |
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |

## Prerequisites

1. AWS Account with appropriate permissions
2. Terraform >= 1.4.0
3. AWS CLI configured
4. S3 backend bucket for Terraform state
5. Database password (set as environment variable or in tfvars)

## Deployment Instructions

### 1. Initialize Terraform

```bash
# Initialize with backend configuration
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=multi-env/dev/terraform.tfstate" \
  -backend-config="region=us-east-1"
```

### 2. Deploy to Development Environment

```bash
# Get the latest Amazon Linux 2 AMI ID
export TF_VAR_ami_id=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=amzn2-ami-hvm-*-x86_64-gp2" \
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
  --output text)

# Set database password
# export TF_VAR_db_password="<set-your-secure-password-here>"

# Plan and apply
terraform plan -var-file="lib/dev.tfvars"
terraform apply -var-file="lib/dev.tfvars"
```

### 3. Deploy to Staging Environment

```bash
# Reinitialize with staging state file
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=multi-env/staging/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -reconfigure

# Deploy
terraform plan -var-file="lib/staging.tfvars"
terraform apply -var-file="lib/staging.tfvars"
```

### 4. Deploy to Production Environment

```bash
# Reinitialize with prod state file
terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=multi-env/prod/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -reconfigure

# Deploy
terraform plan -var-file="lib/prod.tfvars"
terraform apply -var-file="lib/prod.tfvars"
```

## Accessing the Application

After deployment, get the ALB DNS name:

```bash
terraform output alb_dns_name
```

Open the DNS name in a browser to access the application.

## Destroying Resources

To destroy resources in any environment:

```bash
# For dev environment
terraform destroy -var-file="lib/dev.tfvars"

# For staging environment
terraform destroy -var-file="lib/staging.tfvars"

# For prod environment
terraform destroy -var-file="lib/prod.tfvars"
```

## Security Considerations

1. **Database Credentials**: Use AWS Secrets Manager or Parameter Store for production deployments
2. **SSH Access**: Restrict `ssh_cidr_blocks` to specific IP ranges
3. **HTTPS**: Configure SSL/TLS certificates on ALB for production
4. **Backup**: Ensure RDS backup retention is set appropriately per environment
5. **Network Isolation**: Each environment uses separate VPC CIDR ranges

## Customization

To customize for your needs:

1. Modify `variables.tf` to add new parameters
2. Update environment-specific `.tfvars` files with your values
3. Adjust `tap_stack.tf` resource configurations as needed
4. Update AMI ID for your preferred operating system

## Multi-Environment Management Best Practices

1. **Separate State Files**: Each environment has its own state file
2. **Consistent Naming**: All resources include environment suffix
3. **Environment Isolation**: No cross-environment dependencies
4. **Progressive Deployment**: Test in dev, then staging, then prod
5. **Tagging Strategy**: All resources tagged with environment identifier

## Troubleshooting

### Issue: AMI ID not found

Solution: Ensure you're setting `TF_VAR_ami_id` or provide it in tfvars file

### Issue: Database password not set

Solution: Set `TF_VAR_db_password` environment variable or add to tfvars (not recommended for prod)

### Issue: S3 bucket name conflicts

Solution: Ensure `environment_suffix` is unique across all deployments

### Issue: NAT Gateway costs in dev

Solution: Dev environment has `enable_nat_gateway = false` by default

## Outputs

The following outputs are available after deployment:

- `vpc_id`: VPC identifier
- `alb_dns_name`: Application Load Balancer DNS name
- `rds_endpoint`: RDS database endpoint
- `s3_bucket_name`: S3 bucket name for application storage

## Cost Optimization

Dev environment optimizations:
- No NAT Gateway (instances in public subnet or no internet access)
- Single AZ deployment where possible
- Smaller instance types
- Reduced backup retention
- Shorter log retention

Production environment features:
- Multi-AZ deployment for high availability
- Larger instances for better performance
- Extended backup retention
- Enhanced monitoring and logging
