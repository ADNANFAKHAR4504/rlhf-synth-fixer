# Trading Application Multi-Region Failover Infrastructure

This Pulumi TypeScript project implements a complete multi-region failover system for a trading application with automated cross-region disaster recovery capabilities.

## Architecture Overview

### Primary Region (us-east-1)
- VPC with 2 public and 2 private subnets across 2 AZs
- Application Load Balancer in public subnets
- Auto Scaling Group with 2 instances in private subnets
- Route 53 health check monitoring
- Primary DynamoDB table with global replication
- SNS topic for failover notifications
- CloudWatch alarms

### Standby Region (us-east-2)
- Identical VPC setup with different CIDR blocks
- Application Load Balancer in public subnets
- Auto Scaling Group with 1 instance in private subnets
- DynamoDB replica table
- SNS topic for notifications
- Ready for immediate failover

### Failover Mechanism
- Route 53 weighted routing (Primary: 100%, Standby: 0%)
- Health checks every 10 seconds
- Automatic failover after 3 consecutive failures (30 seconds)
- DynamoDB global table ensures session state consistency
- CloudWatch alarms notify on health check failures

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI installed
- AWS credentials configured
- Appropriate IAM permissions for multi-region resource creation

## Installation

```bash
npm install
```

## Configuration

Set required Pulumi configuration values:

```bash
# Set environment suffix (required)
pulumi config set environmentSuffix prod

# Set domain name for Route 53 (optional, defaults to trading-{env}.example.com)
pulumi config set domainName trading.example.com

# Set AWS region (should be us-east-1 for primary)
pulumi config set aws:region us-east-1
```

## Deployment

### Initial Deployment

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up
```

### Update Deployment

```bash
# Make code changes, then preview
pulumi preview

# Apply changes
pulumi up
```

### Destroy Infrastructure

```bash
# Remove all resources
pulumi destroy
```

## Outputs

After deployment, Pulumi exports the following outputs:

- `primaryVpcId` - VPC ID in primary region
- `standbyVpcId` - VPC ID in standby region
- `primaryAlbDns` - Primary ALB DNS name
- `standbyAlbDns` - Standby ALB DNS name
- `primaryAsgName` - Primary Auto Scaling Group name
- `standbyAsgName` - Standby Auto Scaling Group name
- `dynamoTableName` - DynamoDB global table name
- `hostedZoneId` - Route 53 hosted zone ID
- `hostedZoneNameServers` - Nameservers for DNS delegation
- `primarySnsTopicArn` - Primary SNS topic ARN
- `standbySnsTopicArn` - Standby SNS topic ARN
- `primaryHealthCheckId` - Route 53 health check ID
- `applicationUrl` - Application URL

View outputs:
```bash
pulumi stack output
```

## DNS Configuration

After deployment, update your domain registrar to use the Route 53 nameservers:

```bash
pulumi stack output hostedZoneNameServers
```

## Testing Failover

### Manual Failover Test

1. Monitor health check status:
```bash
aws route53 get-health-check-status --health-check-id $(pulumi stack output primaryHealthCheckId)
```

2. Stop primary instances to simulate failure:
```bash
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name $(pulumi stack output primaryAsgName) \
  --desired-capacity 0 \
  --region us-east-1
```

3. Monitor Route 53 to verify failover (takes ~30 seconds)

4. Restore primary capacity:
```bash
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name $(pulumi stack output primaryAsgName) \
  --desired-capacity 2 \
  --region us-east-1
```

### Verify DynamoDB Replication

```bash
# Write to primary region
aws dynamodb put-item \
  --table-name $(pulumi stack output dynamoTableName) \
  --item '{"sessionId":{"S":"test-session"},"data":{"S":"test-data"}}' \
  --region us-east-1

# Read from standby region (should see same data)
aws dynamodb get-item \
  --table-name $(pulumi stack output dynamoTableName) \
  --key '{"sessionId":{"S":"test-session"}}' \
  --region us-east-2
```

## Monitoring

### CloudWatch Dashboards

Monitor the infrastructure through AWS CloudWatch:
- ALB metrics (request count, latency, errors)
- Auto Scaling Group metrics (CPU, instance count)
- Route 53 health check status
- DynamoDB metrics (read/write capacity, replication lag)

### SNS Notifications

Subscribe to SNS topics to receive failover alerts:

```bash
# Subscribe to primary region notifications
aws sns subscribe \
  --topic-arn $(pulumi stack output primarySnsTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1

# Subscribe to standby region notifications
aws sns subscribe \
  --topic-arn $(pulumi stack output standbySnsTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-2
```

## Cost Optimization

The infrastructure is designed for cost efficiency:
- Primary region: 2 t3.medium instances
- Standby region: 1 t3.medium instance
- DynamoDB: PAY_PER_REQUEST billing mode
- No NAT Gateways (instances in private subnets, ALB in public)
- Auto Scaling based on CPU utilization

Estimated monthly cost (varies by usage):
- EC2 instances: ~$150-200
- ALB: ~$40-60
- DynamoDB: Usage-based
- Route 53: ~$1-5
- Data transfer: Variable

## Security Considerations

- EC2 instances in private subnets
- ALB in public subnets with restricted security groups
- IAM roles with least privilege access
- DynamoDB encryption at rest enabled
- Security groups limit traffic to necessary ports
- No direct internet access for EC2 instances (through ALB only)

## Troubleshooting

### Health Check Failing

Check ALB target health:
```bash
aws elbv2 describe-target-health \
  --target-group-arn $(pulumi stack output primaryTargetGroupArn) \
  --region us-east-1
```

### Instances Not Starting

Check Auto Scaling Group events:
```bash
aws autoscaling describe-scaling-activities \
  --auto-scaling-group-name $(pulumi stack output primaryAsgName) \
  --region us-east-1
```

### DynamoDB Replication Issues

Check table status:
```bash
aws dynamodb describe-table \
  --table-name $(pulumi stack output dynamoTableName) \
  --region us-east-1
```

## Project Structure

```
.
├── bin/
│   └── tap.ts                 # Pulumi entry point
├── lib/
│   ├── tap-stack.ts           # Main stack implementation
│   ├── PROMPT.md              # Original requirements
│   ├── MODEL_RESPONSE.md      # Generated implementation
│   ├── IDEAL_RESPONSE.md      # Reference implementation
│   ├── MODEL_FAILURES.md      # Common failure patterns
│   └── README.md              # This file
├── test/
│   └── tap-stack.test.ts      # Unit tests
├── Pulumi.yaml                # Pulumi project configuration
├── package.json               # Node.js dependencies
└── tsconfig.json              # TypeScript configuration
```

## Support

For issues or questions:
1. Check CloudWatch Logs for error messages
2. Review CloudWatch Alarms for health status
3. Verify security group rules
4. Check IAM role permissions
5. Review Pulumi state for drift

## License

See repository LICENSE file.
