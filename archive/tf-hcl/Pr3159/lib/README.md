# E-Commerce Web Stack - Deployment Guide

## Overview

This directory contains Terraform infrastructure code for deploying a highly available e-commerce web application on AWS.

## Architecture

The infrastructure includes:

- **VPC**: Multi-AZ public subnets with Internet Gateway
- **Compute**: Auto Scaling Group with EC2 instances running Nginx
- **Load Balancing**: Application Load Balancer with health checks
- **Storage**: S3 bucket with encryption and versioning for static assets
- **Monitoring**: CloudWatch alarms for CPU, instance health, and ALB metrics
- **Security**: Security groups following least privilege principles

## File Structure

```text
lib/
├── provider.tf     # Terraform and provider configuration
├── variables.tf    # Input variables with defaults
├── main.tf         # All infrastructure resources
└── README.md       # This file
```

## Prerequisites

1. **Terraform**: Version 1.4.0 or higher
2. **AWS CLI**: Configured with appropriate credentials
3. **AWS Account**: With permissions to create VPC, EC2, ALB, S3, and CloudWatch resources
4. **S3 Backend**: Pre-configured S3 bucket and DynamoDB table for state management

## Quick Start

### 1. Initialize Terraform

```bash
cd lib

terraform init \
  -backend-config="bucket=your-terraform-state-bucket" \
  -backend-config="key=ecommerce/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=your-terraform-locks-table"
```

### 2. Review Configuration

Check the default variables in `variables.tf` and override them as needed:

```bash
# Create a terraform.tfvars file (optional)
cat > terraform.tfvars <<EOF
aws_region = "us-east-1"
instance_type = "t3.micro"
asg_min_size = 2
asg_max_size = 4
ssh_ingress_cidr = "YOUR_IP_CIDR/32"
EOF
```

### 3. Plan Deployment

```bash
terraform plan -out=tfplan
```

### 4. Apply Infrastructure

```bash
terraform apply tfplan
```

### 5. Access Application

After successful deployment, get the ALB URL:

```bash
terraform output alb_url
```

Test the application:

```bash
curl $(terraform output -raw alb_url)
```

## Configuration Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `aws_region` | AWS region for deployment | `us-east-1` | No |
| `vpc_cidr` | CIDR block for VPC | `10.0.0.0/16` | No |
| `public_subnet_cidrs` | Map of AZ to CIDR for public subnets | See variables.tf | No |
| `ssh_ingress_cidr` | CIDR allowed for SSH access | `203.0.113.0/24` | No |
| `instance_type` | EC2 instance type | `t3.micro` | No |
| `asg_min_size` | Minimum ASG size | `1` | No |
| `asg_desired_capacity` | Desired ASG capacity | `1` | No |
| `asg_max_size` | Maximum ASG size | `3` | No |
| `cpu_alarm_threshold` | CPU alarm threshold (%) | `70` | No |
| `s3_bucket_prefix` | S3 bucket name prefix | `ecommerce-static-assets` | No |

## Outputs

After deployment, the following outputs are available:

- `alb_dns_name` - DNS name of the load balancer
- `alb_url` - Full HTTP URL to access the application
- `s3_bucket_name` - Name of the S3 bucket for static assets
- `vpc_id` - VPC ID
- `public_subnet_ids` - List of public subnet IDs
- `asg_name` - Auto Scaling Group name

## Security Features

- **Network Isolation**: VPC with security groups limiting access
- **Encryption**: S3 bucket encrypted at rest with AES256
- **SSH Access**: Restricted to specified CIDR block
- **HTTP-Only ALB**: EC2 instances only accessible via ALB
- **Public Access Block**: S3 bucket blocks all public access
- **Instance Metadata**: IMDSv2 required for enhanced security

## Monitoring and Alarms

CloudWatch alarms configured for:

- **High CPU Utilization**: Triggers scale-up at 70% (configurable)
- **Instance Status Checks**: Monitors instance health
- **Unhealthy Hosts**: Alerts when targets fail health checks
- **Response Time**: Monitors ALB target response time

## Scaling

Auto-scaling is configured with:

- **Scale Up**: Triggered by CPU alarm when utilization > threshold
- **Scale Down**: Triggered when CPU returns to normal
- **Cooldown**: 5-minute cooldown between scaling actions
- **Instance Refresh**: Rolling updates with 50% minimum healthy percentage

## Updating Infrastructure

To update the infrastructure:

```bash
# Pull latest code
git pull origin main

# Plan changes
terraform plan -out=tfplan

# Review changes carefully
terraform show tfplan

# Apply if satisfied
terraform apply tfplan
```

## Destroying Infrastructure

To tear down all resources:

```bash
# Review what will be destroyed
terraform plan -destroy

# Destroy (requires confirmation)
terraform destroy

# Or with auto-approve (use with caution)
terraform destroy -auto-approve
```

## Troubleshooting

### Issue: Terraform init fails

**Solution**: Ensure S3 backend bucket exists and you have permissions:

```bash
aws s3 ls s3://your-terraform-state-bucket
```

### Issue: Instance not healthy in target group

**Solution**: Check security group rules and instance logs:

```bash
# Get instance ID from ASG
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names $(terraform output -raw asg_name)

# Check instance logs
aws ec2 get-console-output --instance-id i-xxxxx
```

### Issue: Cannot SSH to instances

**Solution**: Verify your IP is in the allowed CIDR range:

```bash
# Get your current public IP
curl -s ifconfig.me

# Update ssh_ingress_cidr in terraform.tfvars
```

### Issue: S3 bucket name already exists

**Solution**: The `random_string` resource ensures uniqueness. If this fails, manually specify a unique `s3_bucket_prefix`.

## Best Practices

1. **State Management**: Always use remote state (S3) with state locking (DynamoDB)
2. **Plan Before Apply**: Always run `terraform plan` and review changes
3. **Version Control**: Commit `tfplan` outputs to document changes (as text, not binary)
4. **Tagging**: Use `common_tags` variable to maintain consistent resource tagging
5. **Cost Monitoring**: Monitor AWS costs, especially for ASG and ALB
6. **Security**: Regularly update AMIs and review security group rules
7. **Backups**: S3 versioning is enabled; configure lifecycle policies as needed

## Cost Estimation

Estimated monthly costs (us-east-1, approximate):

- ALB: ~$16.20/month (base) + data processing
- EC2 t3.micro: ~$7.50/month per instance
- S3 storage: ~$0.023/GB/month
- Data transfer: Varies based on traffic

**Total**: ~$31-$54/month for minimal setup (1-2 instances)

## Support

For issues or questions:

1. Check CloudWatch Logs for application errors
2. Review CloudWatch Alarms for infrastructure issues
3. Use `terraform plan` to preview changes
4. Consult AWS documentation for service-specific issues

## License

This infrastructure code is provided as-is for educational and production use.

