# Disaster Recovery Solution - Multi-Region Active-Passive Failover

Production-grade disaster recovery solution with automated failover across AWS us-east-1 (primary) and us-east-2 (secondary) regions.

## Targets

- RPO: 15 minutes
- RTO: 30 minutes

## Architecture

### Components

1. **Network**: VPC with public/private subnets, VPC endpoints
2. **Database**: Aurora PostgreSQL Serverless v2 (VER_15_5) with cross-region replication
3. **Storage**: S3 with cross-region replication, DynamoDB global tables
4. **Compute**: ECS Fargate with ALB in both regions
5. **Monitoring**: CloudWatch dashboards, alarms, SNS notifications
6. **Failover**: Lambda health checks, EventBridge orchestration, Route 53 health checks
7. **Backup**: AWS Backup with 7-day retention

## Deployment

### Prerequisites

- AWS CLI configured
- Node.js 18+
- CDK CLI: `npm install -g aws-cdk`

### Bootstrap

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
cdk bootstrap aws://ACCOUNT-ID/us-east-2
```

### Deploy

```bash
npm install
cdk synth
cdk deploy --all -c environmentSuffix=prod -c AlertEmail1=ops@example.com -c AlertEmail2=oncall@example.com
```

## Testing Failover

```bash
# Simulate primary failure
aws ecs update-service --cluster dr-cluster-prod-us-east-1 --service dr-service-prod-us-east-1 --desired-count 0 --region us-east-1

# Monitor CloudWatch dashboard: DR-prod-us-east-1
# Check Route 53 health checks
aws route53 get-health-check-status --health-check-id <id>
```

## Monitoring

- Dashboard: `DR-{environmentSuffix}-us-east-1`
- Metrics: EndpointHealth, RTOMinutes, RPOMinutes
- Logs: `/ecs/dr-service-*`, `/aws/lambda/dr-*`

## Cleanup

```bash
cdk destroy --all -c environmentSuffix=prod
```

## Security

- KMS encryption for all data at rest
- IAM least privilege with regional restrictions
- No public database access
- VPC isolation

## Cost Optimization

- Aurora Serverless v2 with auto-scaling
- DynamoDB on-demand
- No NAT Gateways (VPC endpoints)
- Minimal secondary region resources
