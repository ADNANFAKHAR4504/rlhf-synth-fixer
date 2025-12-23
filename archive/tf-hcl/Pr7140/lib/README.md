# Multi-Region Disaster Recovery Architecture for Payment Processing

This Terraform configuration implements a complete active-passive disaster recovery (DR) solution for a payment processing application across AWS regions us-east-1 (primary) and us-west-2 (DR).

## Architecture Overview

### Key Components

1. **Aurora PostgreSQL Global Database**
   - Primary cluster in us-east-1 with 2 instances
   - Secondary cluster in us-west-2 with 2 instances
   - Automated cross-region replication with < 5 minute RPO
   - 7-day backup retention in both regions
   - Encryption at rest enabled

2. **ECS Fargate Multi-Region Deployment**
   - Containerized payment application
   - Active deployment in primary region (us-east-1)
   - Standby deployment in DR region (us-west-2)
   - Auto-scaling from 2-10 tasks based on CPU utilization
   - Application Load Balancers in both regions

3. **VPC Architecture**
   - Separate VPCs in each region with non-overlapping CIDR blocks
   - 3 private subnets per region across 3 availability zones
   - NAT Gateway for outbound connectivity
   - Security groups for database, ECS tasks, and load balancers

4. **Route53 Failover Routing**
   - Health checks monitoring primary region availability
   - Automated DNS failover to DR region on primary failure
   - Failover completes in < 15 minutes (RTO requirement)

5. **CloudWatch Monitoring**
   - Aurora replication lag alarms (threshold: 30 seconds)
   - ECS service health monitoring
   - Route53 health check status
   - SNS notifications for critical alarms

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS account with permissions for all required services
- Unique environment suffix for resource naming

## Deployment Instructions

### 1. Configure Variables

Copy the example variables file and customize:

```bash
cd lib
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and set:
- `environment_suffix`: Unique identifier (e.g., "prod-abc123")
- `db_master_password`: Strong database password
- `container_image`: Your payment application Docker image
- Other variables as needed

### 2. Initialize Terraform

```bash
terraform init
```

### 3. Review Plan

```bash
terraform plan
```

Review the plan to ensure all resources will be created correctly.

### 4. Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted. Deployment takes approximately 30-40 minutes due to Aurora Global Database provisioning.

### 5. Verify Deployment

After deployment completes, verify key outputs:

```bash
terraform output
```

Expected outputs:
- Primary and DR VPC IDs
- Aurora cluster endpoints
- ECS cluster names
- Load balancer DNS names
- Route53 zone and failover domain

## Failover Testing

### Manual Failover Test

1. **Stop primary ECS tasks** to simulate region failure:
   ```bash
   aws ecs update-service \
     --cluster $(terraform output -raw primary_ecs_cluster_name) \
     --service payment-service-primary-<suffix> \
     --desired-count 0 \
     --region us-east-1
   ```

2. **Monitor Route53 health check** (takes 3-5 minutes):
   ```bash
   aws route53 get-health-check-status \
     --health-check-id $(terraform output -raw primary_health_check_id)
   ```

3. **Verify DNS failover** to DR region:
   ```bash
   dig app.payment-dr-<suffix>.example.com
   ```

4. **Restore primary region**:
   ```bash
   aws ecs update-service \
     --cluster $(terraform output -raw primary_ecs_cluster_name) \
     --service payment-service-primary-<suffix> \
     --desired-count 2 \
     --region us-east-1
   ```

### Aurora Failover Test

To test Aurora Global Database failover (promotes DR cluster to primary):

```bash
aws rds failover-global-cluster \
  --global-cluster-identifier global-aurora-<suffix> \
  --target-db-cluster-identifier aurora-dr-<suffix> \
  --region us-west-2
```

**Warning**: This is a destructive operation that changes replication direction. Only perform in non-production environments or during planned maintenance.

## Monitoring and Alerts

### CloudWatch Alarms

The infrastructure includes the following alarms:

1. **Aurora Replication Lag** (us-east-1)
   - Threshold: 30 seconds
   - Evaluation: 2 periods of 1 minute
   - Action: SNS notification to admin@example.com

2. **Aurora Primary CPU** (us-east-1)
   - Threshold: 80%
   - Evaluation: 2 periods of 5 minutes
   - Action: SNS notification

3. **ECS Service Health** (both regions)
   - Threshold: < 1 healthy host
   - Evaluation: 2 periods of 1 minute
   - Action: Logged for analysis

4. **Route53 Health Check** (primary region)
   - Threshold: Health check status < 1
   - Evaluation: 2 periods of 1 minute
   - Action: Logged, triggers DNS failover

### Viewing Logs

ECS application logs:
```bash
aws logs tail /ecs/payment-app-primary-<suffix> --follow --region us-east-1
aws logs tail /ecs/payment-app-dr-<suffix> --follow --region us-west-2
```

## Cost Optimization

Estimated monthly costs (as of 2024):

- **Aurora Global Database**: ~$500-700
  - 2x db.r6g.large instances per region
  - Storage and I/O
  - Cross-region data transfer

- **ECS Fargate**: ~$50-100
  - 2 tasks @ 0.25 vCPU, 0.5 GB RAM
  - Application Load Balancers

- **VPC/Networking**: ~$70-100
  - 2x NAT Gateways (~$32/month each)
  - Data transfer

- **Route53**: ~$1-5
  - Hosted zone and health checks

**Total**: ~$620-905/month

### Cost Reduction Strategies

1. **Use Aurora Serverless v2**: Reduces costs during low-traffic periods
2. **Scale down DR region**: Reduce ECS task count to 0-1 in DR
3. **Single NAT Gateway**: Use 1 NAT Gateway per region instead of per AZ
4. **Reserved Instances**: Commit to 1-year reserved capacity for Aurora

## Resource Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted. Destruction takes 15-20 minutes.

**Important**: All resources are configured with `skip_final_snapshot = true` and `deletion_protection = false` for easy cleanup. In production, enable deletion protection and configure final snapshots.

## Security Considerations

### Current Configuration

- Aurora encryption at rest enabled
- Private subnets for database and ECS tasks
- Security groups restrict traffic to necessary ports
- IAM roles with least privilege for ECS tasks

### Production Recommendations

1. **Secrets Management**: Use AWS Secrets Manager for database credentials
2. **TLS/SSL**: Enable HTTPS on load balancers with ACM certificates
3. **VPC Flow Logs**: Enable for network traffic analysis
4. **WAF**: Add AWS WAF to protect load balancers
5. **GuardDuty**: Enable account-level threat detection
6. **AWS Config**: Track configuration changes and compliance

## Troubleshooting

### Common Issues

**Issue**: Aurora DR cluster fails to create
- **Cause**: Primary cluster not fully available (takes 20-30 minutes)
- **Solution**: Wait for primary cluster to reach "available" state, then retry

**Issue**: ECS tasks fail to start
- **Cause**: Container image not accessible or security group misconfigured
- **Solution**: Verify container image exists and security groups allow traffic

**Issue**: Route53 health check always fails
- **Cause**: Health check using HTTPS but ALB only has HTTP listener
- **Solution**: Change health check type to HTTP or add HTTPS listener with certificate

**Issue**: Terraform apply times out
- **Cause**: Aurora provisioning exceeds Terraform default timeout
- **Solution**: Increase provider timeouts or apply in stages

## Architecture Decisions

### Why Aurora Global Database?

- Native cross-region replication (< 1 second lag typical)
- Automatic failover promotion capability
- Consistent read performance in both regions
- Meets RPO requirement of < 5 minutes

### Why ECS Fargate over EC2?

- No instance management overhead
- Faster cold start than provisioning EC2
- Pay only for task runtime
- Easier to scale and update

### Why Active-Passive vs Active-Active?

- Simpler data consistency (single write region)
- Lower cross-region data transfer costs
- Meets RTO/RPO requirements without complexity
- Can upgrade to active-active if needed

## Module Structure

```
lib/
├── main.tf                 # Root module orchestration
├── providers.tf            # AWS provider configuration (multi-region)
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── terraform.tfvars.example # Example variable values
├── README.md               # This file
├── PROMPT.md               # Requirements specification
├── MODEL_RESPONSE.md       # Generated code reference
└── modules/
    ├── vpc/                # VPC with 3 private subnets
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── aurora/             # Aurora Global Database
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── ecs/                # ECS Fargate with ALB
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── route53/            # Health checks and failover
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Compliance and Best Practices

### AWS Well-Architected Framework

This architecture follows AWS Well-Architected Framework pillars:

1. **Operational Excellence**: Infrastructure as Code, automated deployment
2. **Security**: Encryption, private subnets, security groups, IAM roles
3. **Reliability**: Multi-region, auto-scaling, health checks, backups
4. **Performance Efficiency**: Right-sized instances, Fargate, Aurora
5. **Cost Optimization**: Auto-scaling, serverless options, resource tagging

### Disaster Recovery Metrics

- **RTO (Recovery Time Objective)**: < 15 minutes ✓
- **RPO (Recovery Point Objective)**: < 5 minutes ✓
- **Availability Target**: 99.95% (multi-region)

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review CloudWatch alarms and logs
2. **Monthly**: Test failover procedures
3. **Quarterly**: Review and update security groups
4. **Annually**: Review architecture for cost optimization

### Upgrading Components

**Aurora Engine Version**:
```bash
# Update in terraform.tfvars
engine_version = "14.7"  # or newer

terraform plan
terraform apply
```

**ECS Task Definition**:
```bash
# Update container_image in terraform.tfvars
container_image = "my-app:v2.0.0"

terraform apply
# ECS performs rolling update automatically
```

## References

- [AWS Aurora Global Database](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html)
- [ECS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [Route53 Health Checks](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## License

This infrastructure code is provided as-is for demonstration purposes.
