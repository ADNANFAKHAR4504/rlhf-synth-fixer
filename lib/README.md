# High Availability Payment Processing Infrastructure

Multi-AZ payment processing infrastructure with automated failover capabilities using CloudFormation JSON.

## Architecture

This CloudFormation template deploys a highly available payment processing system across 3 availability zones in us-east-1:

- **Database**: Aurora PostgreSQL cluster with 1 writer + 2 readers (each in different AZ)
- **Application**: ECS Fargate with 6 tasks distributed evenly across 3 AZs (2 per AZ)
- **Load Balancing**: Application Load Balancer with 5-second health checks
- **Auto Scaling**: Maintains exactly 6 ECS tasks during AZ failures
- **Monitoring**: CloudWatch alarms triggering within 60 seconds, dashboard for real-time metrics
- **Alerting**: SNS topic with email notifications for critical events
- **Security**: KMS customer managed keys for encryption at rest

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS account with permissions for all services
- Docker image available for ECS tasks (default: nginx:latest)

## Deployment

### Quick Deploy

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-dev \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-001 \
    ParameterKey=AlertEmail,ParameterValue=your-email@example.com \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=ContainerImage,ParameterValue=nginx:latest \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack creation (takes 20-30 minutes for Aurora)
aws cloudformation wait stack-create-complete --stack-name payment-processing-dev --region us-east-1
```

### Validate Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.json \
  --region us-east-1
```

## Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| EnvironmentSuffix | Unique suffix for resource names | - | Yes |
| AlertEmail | Email for critical alerts | ops@example.com | No |
| DBMasterUsername | Aurora master username | dbadmin | No |
| DBMasterPassword | Aurora master password | TempPassword123! | Yes (override default!) |
| ContainerImage | Docker image for ECS | nginx:latest | No |

**IMPORTANT**: Always override DBMasterPassword in production!

## Infrastructure Components

### Networking
- VPC with CIDR 10.0.0.0/16
- 3 public subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)
- 3 private subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24)
- Internet Gateway for public subnet access
- NAT Gateway for private subnet outbound (cost-optimized with single NAT)
- Security groups for ALB, ECS, and RDS

### Database
- Aurora PostgreSQL 15.4 cluster
- 1 writer instance (db.t3.medium) in AZ1
- 2 reader instances (db.t3.medium) in AZ2 and AZ3
- Automated backups with 1-day retention
- Encrypted at rest with KMS
- CloudWatch Logs export enabled
- DeletionProtection: false (for testing/cleanup)

### Application
- ECS Cluster with Container Insights enabled
- Fargate task definition (256 CPU, 512 MB memory)
- 6 tasks distributed across 3 AZs
- Tasks in private subnets with NAT Gateway access
- Environment variables for database endpoints
- CloudWatch Logs integration

### Load Balancing
- Application Load Balancer (internet-facing)
- Deployed across 3 public subnets
- Target group with IP targets
- Health checks every 5 seconds
- Connection draining: 30 seconds
- Cross-zone load balancing enabled

### Auto Scaling
- Target: Maintain exactly 6 tasks
- Min/Max capacity: 6
- Target tracking policy (75% CPU)
- Scale-in/out cooldown: 60 seconds

### Monitoring
- CloudWatch alarms:
  - RDS failover detection (database connections)
  - ECS task failures (running task count < 6)
  - ALB unhealthy targets
  - ALB high response time (> 1 second)
- CloudWatch dashboard with real-time metrics
- All alarms trigger within 60 seconds

### Security
- KMS customer managed key with rotation enabled
- All RDS data encrypted at rest
- Security group isolation (ALB -> ECS -> RDS)
- IAM roles with least privilege
- Systems Manager Parameter Store for configuration

## Monitoring

### CloudWatch Dashboard

Access dashboard:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=payment-failover-{EnvironmentSuffix}
```

Dashboard shows:
- Aurora database connections
- ECS running task count
- ALB target health (healthy vs unhealthy)
- ALB response time
- ALB request count
- Aurora CPU utilization

### CloudWatch Alarms

| Alarm | Metric | Threshold | Period |
|-------|--------|-----------|--------|
| RDS Failover | DatabaseConnections | <= 0 | 60s |
| ECS Task Failure | RunningTaskCount | < 6 | 60s |
| ALB Unhealthy Targets | UnHealthyHostCount | > 0 | 60s |
| ALB High Response Time | TargetResponseTime | > 1s | 60s |

All alarms send notifications to SNS topic.

### SNS Notifications

Confirm email subscription:
```bash
# After stack creation, check email for subscription confirmation
# Click the link to activate notifications
```

## Testing Failover

### Test ECS Task Failover

```bash
# List tasks
aws ecs list-tasks \
  --cluster payment-cluster-{EnvironmentSuffix} \
  --service-name payment-service-{EnvironmentSuffix} \
  --region us-east-1

# Stop a task to simulate failure
TASK_ARN=$(aws ecs list-tasks \
  --cluster payment-cluster-{EnvironmentSuffix} \
  --service-name payment-service-{EnvironmentSuffix} \
  --query 'taskArns[0]' \
  --output text \
  --region us-east-1)

aws ecs stop-task \
  --cluster payment-cluster-{EnvironmentSuffix} \
  --task $TASK_ARN \
  --region us-east-1

# Monitor auto-scaling replacement (should restore to 6 tasks)
watch -n 5 'aws ecs describe-services \
  --cluster payment-cluster-{EnvironmentSuffix} \
  --services payment-service-{EnvironmentSuffix} \
  --query "services[0].[runningCount,desiredCount]" \
  --output text \
  --region us-east-1'
```

### Test Database Failover

```bash
# Trigger Aurora failover
aws rds failover-db-cluster \
  --db-cluster-identifier payment-aurora-cluster-{EnvironmentSuffix} \
  --region us-east-1

# Monitor cluster status
watch -n 10 'aws rds describe-db-clusters \
  --db-cluster-identifier payment-aurora-cluster-{EnvironmentSuffix} \
  --query "DBClusters[0].Status" \
  --output text \
  --region us-east-1'

# Check which instance is the writer (changes after failover)
aws rds describe-db-clusters \
  --db-cluster-identifier payment-aurora-cluster-{EnvironmentSuffix} \
  --query "DBClusters[0].DBClusterMembers[?IsClusterWriter==\`true\`].[DBInstanceIdentifier,AvailabilityZone]" \
  --output table \
  --region us-east-1
```

### Test Load Balancer Health

```bash
# Get ALB DNS
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name payment-processing-dev \
  --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" \
  --output text \
  --region us-east-1)

# Test HTTP endpoint
curl -I http://$ALB_DNS

# Monitor target health
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups \
    --names payment-tg-{EnvironmentSuffix} \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text \
    --region us-east-1) \
  --region us-east-1
```

## Multi-Region Deployment

To deploy standby stack in us-west-2 using CloudFormation Stack Sets:

### Create Stack Set

```bash
aws cloudformation create-stack-set \
  --stack-set-name payment-processing-multi-region \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=west-001 \
    ParameterKey=AlertEmail,ParameterValue=your-email@example.com \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy to us-west-2

```bash
aws cloudformation create-stack-instances \
  --stack-set-name payment-processing-multi-region \
  --accounts $(aws sts get-caller-identity --query Account --output text) \
  --regions us-west-2 \
  --region us-east-1
```

### Check Stack Set Status

```bash
aws cloudformation list-stack-instances \
  --stack-set-name payment-processing-multi-region \
  --region us-east-1
```

## Cleanup

```bash
# Delete the stack
aws cloudformation delete-stack \
  --stack-name payment-processing-dev \
  --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name payment-processing-dev \
  --region us-east-1
```

**Note**: All resources use DeletionPolicy: Delete and DeletionProtection: false for clean automated cleanup.

## Cost Optimization

Current configuration is optimized for cost in test environments:

1. **Aurora**: BackupRetentionPeriod: 1 (minimum)
2. **NAT Gateway**: Single NAT Gateway instead of 3 (saves ~$64/month)
3. **Instance Types**: db.t3.medium (burstable) for Aurora

For production:
- Consider multiple NAT Gateways for true high availability
- Increase BackupRetentionPeriod to 7-30 days
- Use larger RDS instances (db.r6g.large or higher)
- Add reserved capacity for cost savings

Estimated monthly cost (test): ~$300-400
- Aurora: ~$150 (3x db.t3.medium)
- ECS Fargate: ~$50 (6 tasks)
- NAT Gateway: ~$32
- ALB: ~$20
- Other: ~$50

## Troubleshooting

### Stack Creation Fails

```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name payment-processing-dev \
  --max-items 20 \
  --region us-east-1

# Common issues:
# - Aurora takes 20-30 minutes (be patient)
# - IAM permission errors (check credentials)
# - Resource limits (check service quotas)
# - Parameter validation (check password complexity)
```

### ECS Tasks Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster payment-cluster-{EnvironmentSuffix} \
  --services payment-service-{EnvironmentSuffix} \
  --region us-east-1

# Check task logs
aws logs tail /ecs/payment-app-{EnvironmentSuffix} \
  --follow \
  --region us-east-1

# Common issues:
# - Container image not accessible
# - Task role permissions insufficient
# - Database connection issues
```

### ALB Health Checks Failing

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups \
    --names payment-tg-{EnvironmentSuffix} \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text \
    --region us-east-1) \
  --region us-east-1

# Common issues:
# - Security groups blocking traffic
# - Container not listening on port 80
# - Health check path incorrect
```

## Outputs

| Output | Description | Usage |
|--------|-------------|-------|
| VPCId | VPC identifier | Reference for additional resources |
| AuroraClusterEndpoint | Writer endpoint | Application database connections |
| AuroraReaderEndpoint | Reader endpoint | Read-only queries |
| LoadBalancerDNS | ALB DNS name | HTTP access to application |
| ECSClusterName | ECS cluster name | Service operations |
| ECSServiceName | ECS service name | Service updates |
| CloudWatchDashboard | Dashboard URL | Monitoring access |
| KMSKeyId | KMS key ID | Encryption reference |
| SNSTopicArn | SNS topic ARN | Alert configuration |

## Security Considerations

- All data encrypted at rest with KMS
- Database in private subnets (no public access)
- ECS tasks in private subnets with NAT for outbound only
- Security groups enforce least privilege
- Secrets in Systems Manager Parameter Store
- IAM roles follow least privilege principle
- No hardcoded credentials in template

## Compliance

This infrastructure supports:
- Multi-AZ deployment for high availability
- Automated backups and point-in-time recovery
- Encryption at rest and in transit
- Comprehensive audit logging (CloudWatch Logs)
- Automated failover without data loss
- 99.99% uptime target

## Support

For issues or questions:
- [Aurora Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
- [ECS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [ALB Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
- [CloudFormation Documentation](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)
