# AWS Compliance Platform Infrastructure

A secure, multi-tier AWS infrastructure for financial services regulatory compliance applications, built with CDKTF Python.

## Architecture Overview

This infrastructure deploys a complete compliance platform with:

- **Multi-AZ VPC**: 3 availability zones with public and private subnets
- **ECS Fargate**: Containerized application platform running nginx
- **Application Load Balancer**: HTTPS-only load balancing with SSL/TLS
- **RDS Aurora MySQL**: High-availability database cluster with encryption
- **S3 Storage**: Encrypted buckets for logs and application assets
- **CloudWatch Logging**: Comprehensive logging with 90-day retention and KMS encryption
- **KMS Encryption**: Customer-managed keys for data encryption
- **Security Groups**: Least-privilege network access controls

## Infrastructure Components

### Networking (VPC)

- **VPC CIDR**: 10.0.0.0/16
- **Public Subnets**: 3 subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) across 3 AZs
- **Private Subnets**: 3 subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) across 3 AZs
- **Internet Gateway**: For public subnet internet access
- **NAT Gateways**: 3 NAT gateways (one per AZ) for private subnet outbound traffic
- **Route Tables**: Separate route tables for public and private subnets

### Compute (ECS Fargate)

- **ECS Cluster**: Managed Fargate cluster
- **Task Definition**: Nginx container with 256 CPU / 512 MB memory
- **ECS Service**: 2 tasks for high availability
- **Network**: Tasks run in private subnets with no public IPs
- **IAM Roles**: Separate execution and task roles with least-privilege permissions

### Load Balancing

- **ALB**: Application Load Balancer in public subnets
- **Target Group**: IP-based target group for ECS services
- **HTTPS Listener**: Port 443 with TLS 1.3 security policy
- **SSL Certificate**: ACM certificate for HTTPS
- **Health Checks**: HTTP health checks on port 80 to containers

### Database (RDS Aurora MySQL)

- **Engine**: Aurora MySQL 8.0.mysql_aurora.3.02.0
- **Instances**: 2 instances (db.t3.medium) across AZs
- **Encryption**: Storage encrypted with KMS
- **Backups**: 30-day automated backup retention
- **Network**: Deployed in private subnets, accessible only from ECS
- **CloudWatch Logs**: Audit, error, general, and slow query logs exported
- **Password**: Stored in AWS Secrets Manager

### Storage (S3)

- **Logs Bucket**: compliance-logs-{suffix}
- **Assets Bucket**: compliance-assets-{suffix}
- **Encryption**: AES256 server-side encryption
- **Versioning**: Enabled on all buckets
- **Public Access**: Blocked on all buckets
- **Destroyability**: force_destroy enabled for testing

### Logging (CloudWatch)

- **ALB Logs**: /aws/alb/compliance-{suffix}
- **ECS Logs**: /aws/ecs/compliance-{suffix}
- **RDS Logs**: /aws/rds/compliance-{suffix}
- **Retention**: 90 days
- **Encryption**: KMS-encrypted with customer-managed key

### Encryption (KMS)

- **Customer-Managed Key**: For CloudWatch Logs, RDS, and other services
- **Key Rotation**: Automatic annual rotation enabled
- **Key Alias**: alias/compliance-{suffix}
- **Key Policy**: Allows CloudWatch Logs and ECS services access

### Security Groups

- **ALB Security Group**: Allows HTTPS (443) from internet (0.0.0.0/0)
- **ECS Security Group**: Allows HTTP (80) from ALB only
- **RDS Security Group**: Allows MySQL (3306) from ECS only
- **Principle**: Least-privilege access, no overly permissive rules

### Compliance Tagging

All resources tagged with:
- **Environment**: production
- **Project**: compliance-platform
- **CostCenter**: eng-compliance

## Prerequisites

- Python 3.9+
- Node.js 18+
- CDKTF CLI installed
- AWS CLI configured with credentials
- AWS account with sufficient permissions

## Environment Variables

The stack accepts the following configuration:

```python
environment_suffix = "dev"  # Unique suffix for resource names
aws_region = "us-east-1"  # AWS region
state_bucket = "iac-rlhf-tf-states"  # S3 bucket for Terraform state
state_bucket_region = "us-east-1"  # Region for state bucket
default_tags = {
    "Environment": "production",
    "Project": "compliance-platform",
    "CostCenter": "eng-compliance"
}
```

## Deployment

### 1. Install Dependencies

```bash
# Install Python dependencies
pipenv install

# Install Node.js dependencies (for CDKTF)
npm install
```

### 2. Synthesize Infrastructure

```bash
# Generate Terraform configuration
cdktf synth
```

### 3. Deploy Infrastructure

```bash
# Deploy the stack
cdktf deploy
```

### 4. Verify Deployment

After deployment, verify resources:

```bash
# Check ECS cluster
aws ecs list-clusters --region us-east-1

# Check RDS cluster
aws rds describe-db-clusters --region us-east-1

# Check ALB
aws elbv2 describe-load-balancers --region us-east-1
```

## Outputs

The stack exports these outputs:

- **vpc_id**: VPC identifier
- **alb_dns_name**: ALB DNS name for accessing the application
- **ecs_cluster_name**: ECS cluster name
- **rds_cluster_endpoint**: RDS cluster connection endpoint
- **logs_bucket_name**: S3 logs bucket name
- **assets_bucket_name**: S3 assets bucket name
- **kms_key_id**: KMS encryption key ID

Access outputs:

```bash
cdktf output
```

## Security Considerations

### Network Isolation

- ECS tasks run in private subnets with no public IPs
- Database accessible only from ECS security group
- Public access blocked on all S3 buckets
- HTTPS-only traffic to ALB from internet

### Encryption

- RDS storage encrypted with KMS
- S3 buckets encrypted with AES256
- CloudWatch Logs encrypted with KMS
- TLS 1.3 for ALB HTTPS connections

### IAM Permissions

- ECS task execution role: Minimal permissions for pulling images and writing logs
- ECS task role: Application-specific permissions (currently minimal)
- KMS key policy: Allows only necessary services

### Secrets Management

- Database password stored in AWS Secrets Manager
- No hardcoded credentials in code
- Secrets retrievable with proper IAM permissions

## Compliance Features

### Audit Logging

- All CloudWatch log groups with 90-day retention
- RDS audit logs exported to CloudWatch
- ALB access logs (if enabled)

### Data Protection

- Encryption at rest for all data stores (RDS, S3, CloudWatch)
- Encryption in transit with TLS 1.3
- Automated backups with 30-day retention

### High Availability

- Multi-AZ deployment across 3 availability zones
- RDS cluster with 2 instances
- ECS service with 2 tasks
- NAT gateway in each AZ for redundancy

## Testing

### Accessing the Application

```bash
# Get ALB DNS name
ALB_DNS=$(cdktf output -json | jq -r '.alb_dns_name.value')

# Test HTTPS endpoint (will show certificate warning for self-signed cert)
curl -k https://$ALB_DNS
```

### Verifying Security Groups

```bash
# Check ALB security group
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=alb-sg-*" \
  --region us-east-1

# Verify only port 443 is open
```

### Database Connection

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(cdktf output -json | jq -r '.rds_cluster_endpoint.value')

# Get database password from Secrets Manager
DB_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id compliance-db-password-* \
  --query SecretString \
  --output text | jq -r '.password')

# Connect from ECS task (not from outside)
mysql -h $RDS_ENDPOINT -u admin -p$DB_PASSWORD compliancedb
```

## Cleanup

To destroy all infrastructure:

```bash
# Destroy the stack
cdktf destroy
```

**Note**: All resources are configured for destroyability:
- RDS: skip_final_snapshot=True, deletion_protection=False
- S3: force_destroy=True
- Secrets Manager: recovery_window_in_days=0

## Cost Optimization Notes

### Expected Monthly Costs (us-east-1, approximate)

- **NAT Gateways**: $96/month (3 x $32/month) - HIGHEST COST
- **RDS Aurora**: $80-120/month (2 x db.t3.medium instances)
- **ECS Fargate**: $15-20/month (2 tasks, 256 CPU, 512 MB memory)
- **ALB**: $20-25/month (base + LCU charges)
- **S3**: $1-5/month (depending on storage and requests)
- **CloudWatch Logs**: $1-10/month (depending on log volume)
- **KMS**: $1/month (single key)

**Total**: ~$210-280/month

### Cost Reduction Options

For testing/development:
1. **Reduce NAT Gateways**: Use 1 instead of 3 (saves ~$64/month)
2. **Smaller RDS Instances**: Use db.t3.small or Aurora Serverless v2
3. **Reduce ECS Tasks**: Run 1 task instead of 2
4. **Shorter Log Retention**: 7-14 days instead of 90 days

## Troubleshooting

### ECS Tasks Not Starting

Check CloudWatch Logs:
```bash
aws logs tail /aws/ecs/compliance-* --follow
```

Common issues:
- Task execution role missing KMS permissions
- Image pull failures
- Insufficient memory/CPU

### Database Connection Failures

Verify:
- Security group rules (RDS SG allows ECS SG)
- Database is in available state
- Correct endpoint and credentials
- ECS tasks in same VPC

### ALB Health Check Failures

Check:
- Target group health check settings
- ECS tasks are running
- Security group allows ALB to reach ECS on port 80
- Container is listening on port 80

## Architecture Diagram

```
                                    Internet
                                        |
                                   [IGW]
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
            [Public Subnet 1]   [Public Subnet 2]   [Public Subnet 3]
                    |                   |                   |
              [NAT Gateway 1]     [NAT Gateway 2]     [NAT Gateway 3]
                    |                   |                   |
                    +-------------------+-------------------+
                                        |
                                      [ALB]
                                  (HTTPS:443)
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
            [Private Subnet 1]  [Private Subnet 2]  [Private Subnet 3]
                    |                   |                   |
               [ECS Task 1]        [ECS Task 2]            |
                    |                   |                   |
                    +-------------------+-------------------+
                                        |
                                   [RDS Cluster]
                                (Aurora MySQL)
                                        |
                            [RDS Instance 1] [RDS Instance 2]


                    [S3 Logs]  [S3 Assets]  [CloudWatch Logs]
                         |          |              |
                         +----------+--------------+
                                    |
                                [KMS Key]
```

## License

This infrastructure is provided as-is for educational and training purposes.

## Support

For issues or questions:
1. Check CloudWatch Logs for application errors
2. Verify security group configurations
3. Review IAM role permissions
4. Check AWS service quotas
