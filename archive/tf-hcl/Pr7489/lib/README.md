# Multi-Region Disaster Recovery Infrastructure

This Terraform configuration implements a complete multi-region disaster recovery solution for a transaction processing system spanning AWS us-east-1 (primary) and us-west-2 (DR).

## Architecture Overview

- **Primary Region**: us-east-1
- **DR Region**: us-west-2
- **RTO Target**: < 5 minutes
- **Failover**: Automated via Route 53 health checks

## Components

### Network Layer
- VPC in each region with 3 availability zones
- Public and private subnets
- NAT Gateways for outbound traffic
- VPC Peering for cross-region communication

### Database Layer
- RDS Aurora PostgreSQL Global Database
- Cross-region read replicas
- SSL/TLS encrypted replication
- CloudWatch alarms for replication lag > 60 seconds

### Session Management
- DynamoDB Global Tables
- Automatic cross-region replication
- On-demand billing mode

### Traffic Routing
- Route 53 hosted zone with failover routing
- Health checks monitoring primary ALB
- 30-second failure detection interval

### Storage
- S3 buckets in both regions
- Cross-region replication enabled
- Versioning enabled

### Compute
- Lambda functions deployed in both regions
- VPC-attached for secure access
- Packaged as ZIP files in S3

### Load Balancing
- Application Load Balancers in each region
- Lambda target groups
- Health check endpoints

### Monitoring & Alerting
- CloudWatch alarms for critical metrics
- SNS topics for notifications
- Email alerts for operations team

### Security
- IAM roles with least privilege
- No wildcard actions
- Cross-region assume role policies
- Security groups for all components

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- Domain name for Route 53 (or use example.com for testing)

## Deployment

1. **Configure Variables**:
```bash
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

2. **Initialize Terraform**:
```bash
terraform init
```

3. **Plan Deployment**:
```bash
terraform plan
```

4. **Deploy Infrastructure**:
```bash
terraform apply
```

## Required Variables

- `environment_suffix`: Unique identifier for resources (e.g., "dev-001")
- `db_master_password`: Secure password for RDS Aurora
- `alert_email`: Email address for SNS notifications
- `domain_name`: Domain for Route 53 hosted zone

## Outputs

After deployment, Terraform provides:

- VPC IDs for both regions
- RDS cluster endpoints
- DynamoDB table name
- S3 bucket names
- Lambda function ARNs
- ALB DNS names
- Route 53 hosted zone details
- SNS topic ARNs

## Testing Failover

1. **Check Health Status**:
```bash
aws route53 get-health-check-status --health-check-id <health-check-id>
```

2. **Simulate Primary Failure**:
```bash
# Stop primary ALB or modify security groups
aws elbv2 modify-load-balancer-attributes \
  --load-balancer-arn <primary-alb-arn> \
  --attributes Key=deletion_protection.enabled,Value=false
```

3. **Verify Failover**:
```bash
dig example.com
# Should return DR region ALB after 30-60 seconds
```

## Monitoring

### CloudWatch Alarms

- **Replication Lag**: Triggers when lag exceeds 60 seconds
- **Database Connections**: Monitors connection pool utilization
- **CPU Utilization**: Alerts at 80% threshold

### SNS Notifications

All alarms send notifications to the configured email address.

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Note**: All resources are configured to be fully destroyable without retention policies.

## Module Structure

```
.
├── main.tf                 # Root configuration
├── variables.tf            # Input variables
├── providers.tf            # Provider configuration
├── outputs.tf              # Output values
├── modules/
│   ├── vpc/                # VPC and networking
│   ├── vpc-peering/        # Cross-region VPC peering
│   ├── iam/                # IAM roles and policies
│   ├── s3/                 # S3 buckets with replication
│   ├── dynamodb/           # DynamoDB global tables
│   ├── rds/                # RDS Aurora global database
│   ├── lambda/             # Lambda functions
│   ├── alb/                # Application Load Balancers
│   ├── route53/            # DNS and health checks
│   ├── cloudwatch/         # Monitoring and alarms
│   └── sns/                # SNS topics and subscriptions
└── terraform.tfvars.example
```

## Security Considerations

1. **Encryption**: All data encrypted at rest and in transit
2. **SSL/TLS**: Enforced for RDS replication
3. **Least Privilege**: IAM policies follow principle of least privilege
4. **Network Isolation**: Private subnets for databases and Lambda
5. **Security Groups**: Restrictive ingress/egress rules

## Best Practices

- Use strong passwords for RDS (20+ characters, mixed case, symbols)
- Configure DNS TTL appropriately for failover requirements
- Test failover procedures regularly
- Monitor CloudWatch alarms and respond to alerts
- Review IAM policies periodically
- Keep Terraform state secure (use remote backend)

## Support

For issues or questions:
1. Check CloudWatch logs for Lambda functions
2. Review RDS cluster status and replication lag
3. Verify Route 53 health check status
4. Check SNS topic subscriptions for alert delivery
