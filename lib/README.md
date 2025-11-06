# Payment Processing Infrastructure - Failure Recovery Automation

Highly available payment processing system with automatic failure recovery deployed across three availability zones in AWS us-east-1.

## Architecture Overview

### Infrastructure Components

1. **Networking Layer**
   - VPC with 10.0.0.0/16 CIDR block
   - 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) across different AZs
   - 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) across different AZs
   - Internet Gateway for public subnet traffic
   - NAT Gateway for private subnet outbound traffic
   - Route tables configured for public and private subnets

2. **Compute Layer**
   - Application Load Balancer in public subnets
   - Auto Scaling Group (3-9 instances) in private subnets
   - EC2 t3.medium instances with Amazon Linux 2023
   - Launch template with CloudWatch agent and SSM agent
   - Target group with health checks (15-second interval, 2-check threshold)
   - Deregistration delay of 30 seconds for graceful shutdown

3. **Database Layer**
   - RDS Aurora PostgreSQL 15.4 cluster
   - 1 writer instance in first AZ
   - 2 read replica instances in different AZs
   - KMS encryption at rest with key rotation enabled
   - Automated backups with 7-day retention
   - Performance Insights enabled with 7-day retention
   - CloudWatch Logs exports for PostgreSQL logs

4. **Monitoring & Alerting**
   - CloudWatch alarms for:
     - ALB unhealthy host count
     - ALB target response time (> 1 second)
     - ASG instance terminations
     - RDS CPU utilization (> 80%)
     - RDS database connections (> 80)
     - RDS replica lag (> 1 second)
     - EC2 CPU utilization (70% scale up, 30% scale down)
   - SNS topic with email subscription to ops@company.com
   - CloudWatch Log Groups with 30-day retention for ALB and EC2

5. **Failure Recovery**
   - Auto Scaling lifecycle hooks for graceful termination
   - Multi-AZ deployment across 3 availability zones
   - Automated EC2 instance replacement via Auto Scaling
   - RDS automatic failover to read replicas
   - S3-hosted static maintenance page for DNS failover

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 18 or later
- AWS CLI configured with credentials
- npm or yarn package manager

## Installation

1. Clone and navigate to directory:
```bash
cd worktree/synth-7nrco
```

2. Install dependencies:
```bash
npm install
```

3. Configure Pulumi:
```bash
pulumi stack init dev
pulumi config set aws:region us-east-1
```

4. Set environment suffix (optional):
```bash
export ENVIRONMENT_SUFFIX=dev
```

## Deployment

Deploy the infrastructure:

```bash
pulumi up
```

Review the preview and confirm to proceed with deployment.

## Stack Outputs

After successful deployment:

```bash
# Get ALB DNS name
pulumi stack output albDnsName

# Get Aurora cluster endpoint
pulumi stack output auroraEndpoint

# Get maintenance bucket name
pulumi stack output maintenanceBucket

# Get VPC ID
pulumi stack output vpcId

# Get SNS topic ARN
pulumi stack output snsTopicArn
```

## Testing

### 1. Health Check

Test the ALB health endpoint:

```bash
ALB_DNS=$(pulumi stack output albDnsName)
curl http://$ALB_DNS/health
# Expected: OK
```

### 2. Database Connection

Connect to Aurora cluster:

```bash
AURORA_ENDPOINT=$(pulumi stack output auroraEndpoint)
psql -h $AURORA_ENDPOINT -U dbadmin -d payments -W
# Password: ChangeMe123456!
```

### 3. Auto Scaling

Monitor Auto Scaling activity:

```bash
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names $(pulumi stack output asgName) \
  --query 'AutoScalingGroups[0].{Desired:DesiredCapacity,Min:MinSize,Max:MaxSize,Current:Instances[?HealthStatus==`Healthy`]|length(@)}'
```

### 4. CloudWatch Alarms

List current alarms:

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix alb-unhealthy-hosts \
  --query 'MetricAlarms[*].[AlarmName,StateValue]' \
  --output table
```

### 5. Maintenance Page

Access the S3 maintenance page:

```bash
BUCKET=$(pulumi stack output maintenanceBucket)
echo "http://$BUCKET.s3-website-us-east-1.amazonaws.com"
```

## Architecture Highlights

### High Availability

- **Multi-AZ Deployment**: All components span 3 availability zones
- **Auto Scaling**: Automatically maintains 3-9 instances based on CPU load
- **Database Replicas**: 2 read replicas for failover and load distribution
- **Health Checks**: Multiple layers of health monitoring
- **Graceful Shutdown**: 30-second connection draining before termination

### Automatic Recovery

1. **EC2 Instance Failure**: Auto Scaling replaces unhealthy instances
2. **AZ Failure**: Traffic automatically routes to healthy AZs
3. **Database Failure**: Aurora fails over to read replica in different AZ
4. **High Load**: Auto Scaling adds instances at 70% CPU
5. **Low Load**: Auto Scaling removes instances at 30% CPU

### Security

- **Encryption at Rest**: KMS encryption for RDS with key rotation
- **Encryption in Transit**: TLS for all data transfers
- **Network Isolation**: Private subnets for compute and database tiers
- **Least Privilege IAM**: Minimal permissions for EC2 instances
- **Security Groups**: Restricted ingress/egress rules
- **IMDSv2**: Enforced on all EC2 instances

### Monitoring

- **CloudWatch Alarms**: 8 alarms covering all critical metrics
- **SNS Notifications**: Email alerts for all alarm states
- **CloudWatch Logs**: 30-day retention for ALB and EC2 logs
- **Performance Insights**: RDS query performance monitoring
- **CloudWatch Agent**: Application log collection from EC2

## Cost Optimization

The infrastructure uses several cost-optimized configurations:

- **Single NAT Gateway**: $32/month instead of $96/month (3 AZs)
- **t3.medium Instances**: Burstable performance for variable workloads
- **Aurora t3.medium**: Right-sized database instances
- **7-Day Backups**: Minimum retention for production
- **30-Day Logs**: Balanced retention for troubleshooting

**Estimated Monthly Cost**: $450-600 depending on traffic and data volume

Breakdown:
- NAT Gateway: ~$32
- ALB: ~$25
- EC2 Instances (3x t3.medium): ~$150
- RDS Aurora (3x t3.medium): ~$200
- Data Transfer: ~$20-50
- CloudWatch: ~$10-20
- S3/KMS/Misc: ~$13-30

## Troubleshooting

### High Response Times

1. Check EC2 CPU utilization:
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=AutoScalingGroupName,Value=asg-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

2. Check RDS performance:
```bash
aws rds describe-db-clusters \
  --db-cluster-identifier aurora-cluster-dev \
  --query 'DBClusters[0].{Status:Status,Endpoint:Endpoint}'
```

3. Review ALB target health:
```bash
TG_ARN=$(pulumi stack output targetGroupArn)
aws elbv2 describe-target-health --target-group-arn $TG_ARN
```

### Instance Launch Failures

1. Check Auto Scaling events:
```bash
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name asg-dev \
  --max-records 10
```

2. Verify security group rules:
```bash
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=instance-sg-dev" \
  --query 'SecurityGroups[0].{GroupId:GroupId,Ingress:IpPermissions}'
```

3. Check IAM instance profile:
```bash
aws iam get-instance-profile --instance-profile-name instance-profile-dev
```

### Database Connection Issues

1. Test connectivity from EC2:
```bash
# SSH into EC2 instance via Session Manager
aws ssm start-session --target <instance-id>

# Test database connection
nc -zv $AURORA_ENDPOINT 5432
```

2. Review security group rules:
```bash
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=db-sg-dev" \
  --query 'SecurityGroups[0].IpPermissions'
```

3. Check cluster status:
```bash
aws rds describe-db-clusters \
  --db-cluster-identifier aurora-cluster-dev \
  --query 'DBClusters[0].Status'
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Confirm the deletion when prompted. All resources will be removed, including:
- EC2 instances
- Auto Scaling Group
- Application Load Balancer
- RDS Aurora cluster (without final snapshot)
- VPC and networking components
- CloudWatch logs and alarms
- SNS topic
- S3 bucket
- KMS keys

## Route 53 Configuration (Optional)

To enable DNS health checks and failover:

1. Create or use existing Route 53 hosted zone
2. Edit `lib/monitoring-stack.ts`
3. Uncomment the Route 53 sections
4. Update domain name references
5. Redeploy: `pulumi up`

This will add:
- Health check for ALB endpoint (10-second interval)
- Primary DNS record pointing to ALB
- Secondary DNS record pointing to S3 maintenance page
- Automatic failover on health check failure

## Support

For infrastructure issues:
- **Email**: ops@company.com
- **SNS Topic**: alerts-topic-dev
- **CloudWatch Dashboard**: AWS Console → CloudWatch → Dashboards

## Compliance

- ✅ Data encrypted at rest (KMS)
- ✅ Data encrypted in transit (TLS)
- ✅ Automated backups enabled
- ✅ Multi-AZ deployment
- ✅ Audit logging enabled
- ✅ IAM least privilege
- ✅ Network isolation

## License

This infrastructure code is generated for internal use.
