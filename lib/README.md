# Multi-Region Disaster Recovery Infrastructure

This CDK application implements a comprehensive active-passive disaster recovery solution for a payment processing system across AWS regions us-east-1 (primary) and us-east-2 (DR).

## Architecture Overview

### Components

1. **Aurora Global Database**: PostgreSQL database with automatic replication between regions
2. **ECS Fargate**: Containerized payment processing application with auto-scaling
3. **Application Load Balancer**: Load distribution with health checks
4. **Route 53**: DNS failover routing with health-based automatic failover
5. **Lambda Functions**: Serverless payment validation deployed to both regions
6. **S3 with Cross-Region Replication**: Transaction log storage
7. **CloudWatch**: Monitoring and alerting for all components
8. **SNS**: Notification system for failover events

### Disaster Recovery Strategy

- **RTO**: < 15 minutes
- **RPO**: < 5 minutes
- **Pattern**: Active-Passive
- **Primary Region**: us-east-1 (10-50 tasks)
- **DR Region**: us-east-2 (2-50 tasks, minimal capacity)

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Python 3.8 or higher
- Node.js 14.x or higher (for CDK CLI)
- Docker (for Lambda function packaging)

## Installation

1. Install CDK CLI:
```bash
npm install -g aws-cdk
```

2. Create Python virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate.bat
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Bootstrap CDK in both regions:
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
cdk bootstrap aws://ACCOUNT-ID/us-east-2
```

## Deployment

### Step 1: Deploy Primary Region

```bash
cdk deploy PaymentDRPrimary-prod \
  --context environmentSuffix=prod \
  --context alertEmail=your-email@example.com \
  --region us-east-1
```

### Step 2: Deploy DR Region

```bash
cdk deploy PaymentDRSecondary-prod \
  --context environmentSuffix=prod \
  --context alertEmail=your-email@example.com \
  --region us-east-2
```

### Step 3: Configure Route 53 Failover

After deploying both regions, retrieve the ALB DNS names from stack outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name PaymentDRPrimary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region us-east-1

aws cloudformation describe-stacks \
  --stack-name PaymentDRSecondary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region us-east-2
```

Update `bin/tap.py` with the actual ALB DNS names and deploy Route 53 stack:

```bash
cdk deploy PaymentRoute53-prod \
  --context environmentSuffix=prod \
  --context domainName=your-domain.com \
  --region us-east-1
```

## Configuration

### Context Parameters

- `environmentSuffix`: Unique identifier for resources (default: "prod")
- `alertEmail`: Email address for SNS notifications
- `domainName`: Domain name for Route 53 hosted zone

### Environment Variables

Set in your terminal:
```bash
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1
```

## Monitoring

### CloudWatch Alarms

1. **Database Replication Lag**: Triggers when lag exceeds 5 minutes
2. **ALB Unhealthy Targets**: Alerts when targets become unhealthy
3. **ECS Task Count**: Monitors minimum task count

All alarms send notifications to the SNS topic configured with your email.

### CloudWatch Dashboards

Create custom dashboards to monitor:
- ECS task CPU and memory utilization
- ALB request count and latency
- Aurora database connections and queries
- Lambda invocation metrics

## Failover Process

### Automatic Failover

Route 53 health checks monitor the primary region ALB. When health checks fail:
1. Route 53 automatically updates DNS to point to DR region
2. CloudWatch alarms trigger SNS notifications
3. Traffic routes to DR region ALB
4. DR region ECS tasks auto-scale to handle increased load

### Manual Failover

If needed, manually promote DR region:
1. Scale up DR region ECS tasks
2. Update Route 53 to use DR region as primary
3. Promote Aurora secondary cluster to primary

## Cost Optimization

- DR region runs minimal capacity (2 tasks) until failover
- S3 lifecycle policies move old logs to cheaper storage
- CloudWatch log retention set to 7 days
- Aurora instances in DR use smaller instance types

## Security

- VPC isolation with private subnets
- Security groups restrict traffic between components
- IAM roles follow least privilege principle
- Encryption at rest for Aurora and S3
- Encryption in transit for all connections

## Testing

### Health Check Testing

Test ALB health endpoint:
```bash
PRIMARY_ALB=$(aws cloudformation describe-stacks \
  --stack-name PaymentDRPrimary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region us-east-1)

curl http://${PRIMARY_ALB}/health
```

### Failover Testing

Simulate primary region failure by modifying health check or scaling down ECS tasks:
```bash
aws ecs update-service \
  --cluster payment-cluster-prod \
  --service payment-service-prod \
  --desired-count 0 \
  --region us-east-1
```

Monitor Route 53 health check status and DNS resolution.

## Cleanup

Remove all stacks in reverse order:

```bash
cdk destroy PaymentRoute53-prod --region us-east-1
cdk destroy PaymentDRSecondary-prod --region us-east-2
cdk destroy PaymentDRPrimary-prod --region us-east-1
```

## Troubleshooting

### Stack Deployment Fails

- Verify AWS credentials and permissions
- Check CDK bootstrap in both regions
- Ensure unique environment suffix
- Review CloudFormation events for specific errors

### Health Checks Failing

- Verify ECS tasks are running and healthy
- Check security group rules allow health check traffic
- Review ALB target group health check configuration
- Examine ECS task logs for application errors

### Replication Lag High

- Check Aurora cluster metrics in CloudWatch
- Verify network connectivity between regions
- Review database workload and optimize queries
- Consider scaling up Aurora instances

## Production Considerations

1. **Domain Configuration**: Replace example.com with your actual domain
2. **Container Images**: Replace sample container with your payment processing application
3. **Database Credentials**: Use AWS Secrets Manager for database credentials
4. **SSL/TLS**: Add ACM certificates to ALB listeners
5. **WAF**: Add AWS WAF for additional security
6. **Backup Testing**: Regularly test backup and restore procedures
7. **Disaster Recovery Drills**: Schedule regular failover testing
8. **Monitoring**: Enhance monitoring with custom metrics and dashboards

## Support

For issues or questions:
- Review CloudWatch logs for detailed error messages
- Check CloudFormation stack events
- Consult AWS documentation for service-specific issues
- Contact AWS Support for infrastructure problems
