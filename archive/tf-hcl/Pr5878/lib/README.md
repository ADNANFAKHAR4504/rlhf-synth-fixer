# E-Commerce Web Application Infrastructure

This Terraform configuration deploys a highly available e-commerce web application infrastructure on AWS with the following components:

## Architecture Overview

- **VPC**: Custom VPC with 3 public and 3 private subnets across 3 availability zones
- **Application Load Balancer**: HTTPS-enabled ALB in public subnets for traffic distribution
- **Auto Scaling Group**: EC2 instances (Amazon Linux 2023, t3.medium) in private subnets with CPU-based scaling
- **RDS MySQL**: Multi-AZ MySQL 8.0 database with encryption at rest and automated backups
- **S3 + CloudFront**: S3 bucket for static assets with CloudFront CDN for global content delivery
- **Security Groups**: Least-privilege security groups controlling traffic flow
- **IAM Roles**: EC2 instance profiles with S3 and CloudWatch access
- **CloudWatch**: Alarms for ALB target health and RDS CPU utilization
- **NAT Gateways**: Outbound internet access for private instances

## Prerequisites

1. **Terraform**: Version 1.5 or higher
2. **AWS CLI**: Configured with appropriate credentials
3. **ACM Certificate**: Pre-validated SSL certificate in us-east-1
4. **AWS Account**: With necessary permissions to create resources

## Quick Start

### 1. Configure Variables

Copy the example tfvars file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and provide:
- `environment_suffix`: Unique suffix for resource naming (REQUIRED)
- `acm_certificate_arn`: Your pre-validated ACM certificate ARN (REQUIRED)
- `db_password`: Secure database password (REQUIRED)

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review the Plan

```bash
terraform plan
```

### 4. Deploy Infrastructure

```bash
terraform apply
```

When prompted, review the changes and type `yes` to proceed.

### 5. Access Outputs

After successful deployment:

```bash
terraform output alb_dns_name
terraform output cloudfront_distribution_url
terraform output rds_endpoint
```

## Architecture Details

### Network Configuration

- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- **Availability Zones**: Uses first 3 available AZs in the region

### Security Groups

1. **ALB Security Group**:
   - Ingress: HTTPS (443) from 0.0.0.0/0
   - Egress: HTTP (80) to EC2 instances

2. **EC2 Security Group**:
   - Ingress: HTTP (80) from ALB
   - Egress: HTTPS (443) to internet, MySQL (3306) to RDS

3. **RDS Security Group**:
   - Ingress: MySQL (3306) from EC2 instances
   - Egress: Denied

### Auto Scaling Configuration

- **Scaling Policy**: CPU-based scaling at 70% threshold
- **Min Size**: 2 instances
- **Max Size**: 10 instances
- **Health Check**: ELB health check with 5-minute grace period
- **Instance Metadata**: IMDSv2 required for enhanced security

### Database Configuration

- **Engine**: MySQL 8.0.35
- **Instance Class**: db.t3.medium
- **Storage**: 100 GB GP3 with encryption
- **Multi-AZ**: Enabled for high availability
- **Backups**: 7-day retention with automated daily backups
- **Encryption**: AWS KMS encryption at rest

### Storage and CDN

- **S3 Bucket**: Versioning enabled, public access blocked
- **CloudFront**: Global CDN with HTTPS redirect
- **Origin Access Control**: Secure S3 access from CloudFront only

### Monitoring and Alarms

1. **ALB Unhealthy Hosts**: Alerts when targets are unhealthy
2. **RDS CPU High**: Alerts when CPU exceeds 80%
3. **RDS Storage Low**: Alerts when free storage < 10GB
4. **ALB Response Time**: Alerts when response time > 1 second
5. **ASG CPU High/Low**: Triggers auto-scaling actions

## Resource Naming Convention

All resources use the `environment_suffix` variable for unique naming:
- VPC: `vpc-${environment_suffix}`
- ALB: `alb-${environment_suffix}`
- ASG: `asg-${environment_suffix}`
- RDS: `rds-${environment_suffix}`
- S3: `static-assets-${environment_suffix}`

## Cost Optimization

The infrastructure is designed for cost efficiency:
- NAT Gateways: $0.045/hour × 3 = ~$97/month
- ALB: ~$22/month + data processing
- EC2 (t3.medium): 2-10 instances based on demand
- RDS (db.t3.medium): Multi-AZ ~$120/month
- CloudFront: Pay-per-use for data transfer

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: RDS is configured with `skip_final_snapshot = true` for easy cleanup.

## Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `environment_suffix` | Unique suffix for resource naming | - | Yes |
| `acm_certificate_arn` | ACM certificate ARN | - | Yes |
| `db_password` | Database master password | - | Yes |
| `aws_region` | AWS region | us-east-1 | No |
| `vpc_cidr` | VPC CIDR block | 10.0.0.0/16 | No |
| `instance_type` | EC2 instance type | t3.medium | No |
| `asg_min_size` | Min ASG size | 2 | No |
| `asg_max_size` | Max ASG size | 10 | No |
| `db_instance_class` | RDS instance class | db.t3.medium | No |

## Outputs

| Output | Description |
|--------|-------------|
| `alb_dns_name` | Application Load Balancer DNS name |
| `cloudfront_distribution_url` | CloudFront distribution URL |
| `rds_endpoint` | RDS MySQL endpoint |
| `vpc_id` | VPC ID |
| `s3_bucket_name` | S3 bucket name |

## Security Best Practices

1. **IMDSv2**: All EC2 instances require IMDSv2
2. **Encryption**: RDS uses KMS encryption, S3 uses AES256
3. **Least Privilege**: IAM policies use specific resource ARNs
4. **Network Isolation**: Private subnets for compute and database
5. **HTTPS Only**: ALB uses HTTPS, CloudFront redirects to HTTPS
6. **Secrets**: Use AWS Secrets Manager for production passwords

## Troubleshooting

### Issue: Terraform fails with "InvalidParameterValue"
- **Solution**: Verify ACM certificate is in us-east-1 and validated

### Issue: RDS instance creation fails
- **Solution**: Check db_password meets complexity requirements (8+ chars, mixed case, numbers)

### Issue: Health checks failing
- **Solution**: Verify security group rules and /health endpoint is responding

### Issue: Auto Scaling not working
- **Solution**: Check CloudWatch alarms and ASG policies are created

## Support

For issues or questions:
1. Check AWS CloudWatch logs: `/aws/ec2/ecommerce-${environment_suffix}`
2. Review Terraform state: `terraform show`
3. Verify resource health in AWS Console

## License

This infrastructure code is provided as-is for educational and production use.
