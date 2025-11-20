# Transaction Processing System - High Availability

A production-ready, single-region high-availability transaction processing system built with AWS CDK (Python).

## Architecture

- **VPC**: Multi-AZ deployment across 2 availability zones
- **Aurora Serverless v2**: PostgreSQL 15.8 with automatic failover
- **ECS Fargate**: Container-based transaction processors with ALB
- **DynamoDB**: Session management with GSI and PITR
- **S3**: Transaction logs with versioning and lifecycle policies
- **Lambda**: Event processing with retry logic and DLQ
- **CloudWatch**: Monitoring, alarms, and dashboard

## Deployment

```bash
# Install dependencies
npm install -g aws-cdk
pip install -r requirements.txt

# Deploy with environment suffix
cdk deploy --parameters environmentSuffix=dev123

# View outputs
cdk deploy --outputs-file cfn-outputs/flat-outputs.json
```

## Configuration

- **Region**: us-east-1 (configurable via lib/AWS_REGION)
- **Availability Zones**: 2
- **Aurora**: 0.5-4 ACU auto-scaling
- **ECS**: 2-10 tasks auto-scaling
- **Backup Retention**: 7 days

## High Availability Features

- Multi-AZ Aurora with automatic failover
- ECS Fargate tasks across 2 AZs
- ALB health checks with automatic task replacement
- DynamoDB point-in-time recovery
- S3 versioning for data protection
- Lambda retry with exponential backoff

## Monitoring

- CloudWatch Dashboard: All service metrics
- Alarms: Aurora CPU, ECS health, Lambda errors
- Log Aggregation: 7-day retention
- SNS Notifications: Critical alerts

## Cost Optimization

- Aurora Serverless v2 (auto-scaling)
- DynamoDB on-demand billing
- Single NAT Gateway (development)
- 7-day log retention

## Destroyability

All resources configured with `RemovalPolicy.DESTROY`:
- No deletion protection
- S3 auto-delete enabled
- Complete stack cleanup on destroy

```bash
cdk destroy
```
