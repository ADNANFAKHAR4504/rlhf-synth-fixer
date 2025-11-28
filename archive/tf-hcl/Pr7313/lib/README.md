# Loan Processing Application Infrastructure

This Terraform configuration deploys a complete, PCI DSS-compliant loan processing application infrastructure on AWS with the following components:

## Architecture Overview

### Core Components

1. **VPC Architecture**
   - 3 Availability Zones for high availability
   - 3 Public subnets for ALB and NAT Gateway
   - 3 Private subnets for EC2 instances and Aurora database
   - Internet Gateway and NAT Gateway for connectivity

2. **Database Layer**
   - Aurora PostgreSQL Serverless v2 cluster
   - Scaling: 0.5 - 1.0 ACU
   - IAM database authentication enabled
   - Point-in-time recovery enabled
   - Encrypted with customer-managed KMS key

3. **Application Layer**
   - Application Load Balancer with path-based routing
   - EC2 Auto Scaling group (2-6 instances)
   - Mixed instance types with 20% spot instances
   - Target tracking based on CPU and memory metrics
   - CloudWatch Container Insights for monitoring

4. **Security Layer**
   - AWS WAF with SQL injection and XSS protection
   - Security groups with least privilege access
   - All data encrypted at rest with KMS
   - TLS 1.2 minimum for all communications
   - IAM roles following principle of least privilege

5. **Storage Layer**
   - S3 bucket for application logs (30-day retention)
   - S3 bucket for loan documents (90-day retention, 60-day Glacier transition)
   - S3 bucket for static assets with CloudFront distribution

6. **Monitoring & Automation**
   - CloudWatch alarms for CPU, memory, and database metrics
   - EventBridge rules for nightly batch processing
   - CloudWatch Logs with 7-day retention
   - CloudWatch Agent on EC2 for custom metrics

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- IAM permissions to create all resources
- Unique environment suffix for resource naming

## Deployment Instructions

### Step 1: Configure Variables

Copy the example variables file and update with your values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set the required variables:

```hcl
environment_suffix = "dev-12345"  # REQUIRED: Must be unique
aws_region         = "us-east-1"
```

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Review the Plan

```bash
terraform plan -out=tfplan
```

Review the planned changes to ensure everything looks correct.

### Step 4: Apply the Configuration

```bash
terraform apply tfplan
```

The deployment will take approximately 15-20 minutes, primarily due to:
- Aurora cluster provisioning (5-8 minutes)
- NAT Gateway creation (3-5 minutes)
- CloudFront distribution setup (10-15 minutes)

### Step 5: Retrieve Outputs

After deployment, retrieve key resource identifiers:

```bash
terraform output
```

Important outputs:
- `alb_dns_name`: Load balancer endpoint
- `aurora_cluster_endpoint`: Database writer endpoint
- `cloudfront_distribution_domain`: CDN endpoint
- `logs_bucket_id`: Logs bucket name
- `documents_bucket_id`: Documents bucket name

## Testing

### Verify ALB Health

```bash
ALB_DNS=$(terraform output -raw alb_dns_name)
curl http://${ALB_DNS}/health
```

### Verify Database Connectivity

From an EC2 instance in the Auto Scaling group:

```bash
psql -h $(terraform output -raw aurora_cluster_endpoint) \
     -U dbadmin \
     -d loandb
```

### Verify CloudFront Distribution

```bash
CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_distribution_domain)
curl https://${CLOUDFRONT_DOMAIN}/
```

## Resource Naming Convention

All resources include the `environment_suffix` variable for uniqueness:

- VPC: `loan-processing-vpc-${environment_suffix}`
- Aurora: `loan-processing-aurora-${environment_suffix}`
- ALB: `loan-proc-alb-${environment_suffix}`
- S3 Buckets: `loan-processing-{type}-${environment_suffix}`

## Security Considerations

### Encryption

- All data at rest encrypted with customer-managed KMS key
- Automatic key rotation enabled
- EBS volumes encrypted
- S3 buckets encrypted with KMS

### Network Security

- EC2 instances in private subnets only
- No direct internet access for compute resources
- Security groups with minimal required access
- WAF rules protecting against common attacks

### Access Control

- IAM roles with least privilege
- IAM database authentication for Aurora
- Instance Metadata Service v2 (IMDSv2) enforced
- S3 buckets with public access blocked

### Compliance

- PCI DSS considerations implemented
- CloudWatch logging enabled
- Encryption enforced
- Network segmentation with security groups

## Cost Optimization

### Spot Instances

- 20% of Auto Scaling capacity uses spot instances
- Capacity-optimized allocation strategy
- Reduces compute costs by ~70% for spot instances

### Serverless Database

- Aurora Serverless v2 scales from 0.5-1.0 ACU
- Pay only for capacity used
- Automatic scaling based on workload

### Storage Lifecycle

- Application logs expire after 30 days
- Loan documents transition to Glacier after 60 days
- Old versions deleted automatically

### Single NAT Gateway

- Single NAT Gateway for all AZs
- Reduces costs from $96/month to $32/month
- Consider VPC endpoints for additional savings

## Maintenance

### Backup and Recovery

- Aurora automated backups with 7-day retention
- Point-in-time recovery enabled
- S3 versioning enabled for critical buckets

### Monitoring

CloudWatch alarms configured for:
- High CPU utilization (> 80%)
- Unhealthy targets in load balancer
- Aurora CPU utilization (> 80%)
- Aurora database connections (> 80)

### Scheduled Tasks

EventBridge rules for:
- Nightly batch processing (2 AM UTC daily)
- Business hours monitoring (9 AM - 5 PM UTC, Mon-Fri)

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: All resources are configured to be fully destroyable:
- `skip_final_snapshot = true` for Aurora
- `deletion_protection = false` for all resources
- No retention policies blocking destruction

## Troubleshooting

### Aurora Connection Issues

1. Verify security group rules allow traffic from EC2
2. Check IAM database authentication configuration
3. Ensure EC2 instance has correct IAM role

### Auto Scaling Not Working

1. Check CloudWatch Agent is running on instances
2. Verify custom metrics are being published
3. Review Auto Scaling policies and alarms

### WAF Blocking Legitimate Traffic

1. Review WAF logs in CloudWatch
2. Adjust rule sensitivity in `waf.tf`
3. Add custom rules to allow specific patterns

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
         ┌────────▼─────────┐
         │   CloudFront     │
         │  Distribution    │
         └────────┬─────────┘
                  │
         ┌────────▼─────────┐
         │   S3 Static      │
         │    Assets        │
         └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      AWS Cloud                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              VPC (10.0.0.0/16)                      │   │
│  │                                                      │   │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐ │   │
│  │  │Public AZ-A │   │Public AZ-B │   │Public AZ-C │ │   │
│  │  │            │   │            │   │            │ │   │
│  │  │   ALB      │───│    ALB     │───│    ALB     │ │   │
│  │  │   WAF      │   │            │   │            │ │   │
│  │  └─────┬──────┘   └────────────┘   └────────────┘ │   │
│  │        │                                            │   │
│  │  ┌─────▼──────┐   ┌────────────┐   ┌────────────┐ │   │
│  │  │Private AZ-A│   │Private AZ-B│   │Private AZ-C│ │   │
│  │  │            │   │            │   │            │ │   │
│  │  │  EC2 ASG   │   │  EC2 ASG   │   │  EC2 ASG   │ │   │
│  │  │            │   │            │   │            │ │   │
│  │  └─────┬──────┘   └─────┬──────┘   └─────┬──────┘ │   │
│  │        │                │                │         │   │
│  │        └────────────────┼────────────────┘         │   │
│  │                         │                          │   │
│  │                  ┌──────▼──────┐                   │   │
│  │                  │   Aurora    │                   │   │
│  │                  │ PostgreSQL  │                   │   │
│  │                  │ Serverless  │                   │   │
│  │                  └─────────────┘                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  S3 Logs     │  │S3 Documents  │  │  CloudWatch  │     │
│  │  Bucket      │  │   Bucket     │  │     Logs     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ EventBridge  │  │     KMS      │                        │
│  │    Rules     │  │     Key      │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Support

For issues or questions:
1. Review CloudWatch logs for error messages
2. Check AWS service health dashboard
3. Review Terraform state for resource status
4. Consult AWS documentation for service-specific issues

## License

This infrastructure code is provided as-is for deployment of the loan processing application.
