# Payment Processing Infrastructure - Terraform

This Terraform configuration deploys a production-ready payment processing infrastructure on AWS.

## Architecture Overview

This configuration creates:
- **VPC**: 10.0.0.0/16 with 3 availability zones
- **Subnets**: 3 public and 3 private subnets
- **Compute**: Auto Scaling Group with 2-6 t3.medium EC2 instances
- **Database**: Multi-AZ RDS PostgreSQL 15.3
- **Load Balancer**: Application Load Balancer with HTTPS
- **Storage**: S3 buckets for static assets and VPC flow logs
- **Security**: KMS encryption, security groups, IAM roles
- **Monitoring**: CloudWatch alarms for CPU and database connections

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** 1.5+ installed
3. **AWS CLI** configured with credentials
4. **ACM Certificate** created in us-east-1 region

### Creating ACM Certificate

Before deploying, create an ACM certificate:

```bash
aws acm request-certificate \
  --domain-name "*.example.com" \
  --validation-method DNS \
  --region us-east-1
```

Note the certificate ARN for use in terraform.tfvars.

## Deployment Instructions

### 1. Initialize Terraform

```bash
cd lib
terraform init
```

### 2. Configure Variables

Copy the example variables file and update with your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `environment_suffix`: Unique identifier (e.g., "prod-001")
- `acm_certificate_arn`: Your ACM certificate ARN
- `db_password`: Strong database password
- `ami_id`: Latest Amazon Linux 2 AMI ID

### 3. Validate Configuration

```bash
terraform validate
terraform fmt
```

### 4. Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the plan carefully to ensure all resources are correct.

### 5. Apply Configuration

```bash
terraform apply tfplan
```

This will create approximately 40+ resources. Deployment takes 15-20 minutes.

### 6. Get Outputs

```bash
terraform output
```

Important outputs:
- `alb_dns_name`: Load balancer DNS name for application access
- `rds_endpoint`: Database connection endpoint

## Resource Naming

All resources include the `environment_suffix` variable to ensure uniqueness:
- S3 Buckets: `payment-gateway-*-{suffix}`
- RDS Instance: `payment-gateway-{suffix}-*`
- ALB: `pg-{suffix}-*`

## Security Features

1. **Encryption at Rest**: KMS encryption for RDS and S3
2. **Network Isolation**: EC2 instances in private subnets
3. **Least Privilege IAM**: Explicit deny statements included
4. **Security Groups**: Restricted ingress/egress rules
5. **Multi-AZ**: RDS deployed across availability zones
6. **VPC Flow Logs**: Network traffic logging to S3

## Cost Optimization

- Single NAT Gateway shared across AZs
- VPC Endpoints for S3 to avoid NAT charges
- S3 lifecycle policy transitions to Glacier after 90 days
- t3.medium instances with Auto Scaling

## Monitoring

### CloudWatch Alarms

1. **CPU Utilization**: Triggers when average CPU > 80%
2. **Database Connections**: Triggers when connections > 90% of max

### CloudWatch Logs

- EC2 instance logs: `/aws/ec2/payment-gateway-{suffix}`
- RDS logs: PostgreSQL and upgrade logs exported

## Destroying Infrastructure

To tear down all resources:

```bash
terraform destroy
```

**Note**: RDS has `skip_final_snapshot = true` for easier cleanup.

## Maintenance

### Updating AMI

To update EC2 instances to a new AMI:

1. Update `ami_id` in terraform.tfvars
2. Run `terraform apply`
3. Auto Scaling Group will gradually replace instances

### Scaling

Adjust Auto Scaling limits in `main.tf`:
- `min_size`: Minimum instances (default: 2)
- `max_size`: Maximum instances (default: 6)

### Backup and Recovery

- **RDS Backups**: Automated daily backups, 7-day retention
- **S3 Versioning**: Enabled on all buckets
- **Backup Window**: 03:00-04:00 UTC
- **Maintenance Window**: Monday 04:00-05:00 UTC

## Troubleshooting

### ACM Certificate Issues

If HTTPS listener fails, verify:
- Certificate is in `us-east-1` region
- Certificate status is "Issued"
- Domain validation is complete

### RDS Connection Issues

If applications can't connect to RDS:
- Verify security groups allow traffic
- Check database credentials
- Ensure EC2 instances are in private subnets

### Auto Scaling Issues

If instances aren't launching:
- Verify IAM instance profile permissions
- Check AMI ID is valid for us-east-1
- Review launch template user data logs

## Compliance

This configuration meets the following requirements:
- ✅ Data encrypted at rest (KMS)
- ✅ Multi-AZ deployment for high availability
- ✅ TLS/SSL termination with ACM
- ✅ Private subnet deployment for compute
- ✅ Least privilege IAM with explicit denies

## Support

For issues or questions:
1. Check Terraform plan output for errors
2. Review CloudWatch logs for application issues
3. Verify AWS service limits aren't exceeded

## License

Internal use only - Payment Gateway Project
