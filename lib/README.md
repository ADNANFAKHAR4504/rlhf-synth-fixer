# Payment Processing Web Application Infrastructure

This infrastructure provides a highly available, secure payment processing web application deployment on AWS using Pulumi with TypeScript.

## Architecture Overview

### Network Layer
- **Production VPC**: 10.0.0.0/16 with private and public subnets across 2 AZs
- **Staging VPC**: 10.1.0.0/16 with private and public subnets across 2 AZs
- **VPC Peering**: Secure communication between production and staging environments
- **Security Groups**: Least privilege access for ALB, EC2, and RDS resources

### Database Layer
- **Aurora PostgreSQL Serverless v2**: Auto-scaling database cluster (0.5-2 ACUs)
- **Encryption**: KMS encryption at rest, SSL/TLS in transit
- **Backups**: 7-day retention with automated backup window
- **Secrets Management**: Database credentials stored in AWS Secrets Manager with KMS encryption

### Compute Layer
- **EC2 Instances**: t3.medium instances running in Auto Scaling Groups
- **Blue-Green Deployment**: Separate ASGs and target groups for zero downtime deployments
- **Observability**: CloudWatch agent and X-Ray daemon pre-configured
- **IAM Roles**: Least privilege access to Secrets Manager, CloudWatch, and X-Ray

### Load Balancing
- **Application Load Balancer**: Public-facing ALB in public subnets
- **SSL/TLS Termination**: ACM certificate with DNS validation
- **Access Logs**: Stored in encrypted S3 bucket with 90-day retention
- **Health Checks**: Configured on /health endpoint

### Monitoring & Observability
- **CloudWatch Dashboard**: Real-time metrics for ALB, Aurora, and ASGs
- **CloudWatch Alarms**: 5XX errors, database connections, ASG health
- **CloudWatch Logs**: Encrypted log aggregation with 30-day retention
- **X-Ray Tracing**: Distributed tracing enabled for all EC2 instances

### Security
- **KMS Encryption**: Customer-managed keys for secrets and logs
- **IAM Roles**: Session tags support for temporary access
- **Security Groups**: Network isolation with minimal required access
- **Secrets Rotation**: Infrastructure ready for 30-day credential rotation

## Blue-Green Deployment

This infrastructure supports zero-downtime deployments using blue-green strategy:

1. **Blue Environment** (Active):
   - Auto Scaling Group with 2-4 instances
   - Connected to blue target group
   - ALB listener routes traffic to blue

2. **Green Environment** (Standby):
   - Auto Scaling Group with 0-4 instances
   - Connected to green target group
   - Ready for deployment testing

### Deployment Process

1. Deploy new application version to green ASG
2. Scale green ASG to desired capacity (2 instances)
3. Verify health checks pass on green target group
4. Update ALB listener to route traffic to green target group
5. Monitor application metrics and logs
6. If successful: Scale blue ASG to 0, keep green running
7. If issues: Rollback by routing traffic back to blue

## Resource Naming

All resources include `environmentSuffix` for uniqueness:
- Format: `{resource-type}-{environment-suffix}`
- Example: `payment-app-alb-prod-001`

## Configuration

### Stack Configuration Files

- `Pulumi.production.yaml`: Production environment settings
- `Pulumi.staging.yaml`: Staging environment settings

### Required Configuration Values

```yaml
payment-app:environmentSuffix: <unique-suffix>
payment-app:environment: <production|staging>
aws:region: us-east-1
```

## Deployment

### Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- Node.js 18+ installed
- npm or yarn installed

### Deploy Production Stack

```bash
# Install dependencies
npm install

# Select production stack
pulumi stack select production

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Deploy Staging Stack

```bash
# Select staging stack
pulumi stack select staging

# Deploy infrastructure
pulumi up
```

## Outputs

The stack exports the following outputs:

- `productionVpcId`: Production VPC identifier
- `stagingVpcId`: Staging VPC identifier
- `vpcPeeringConnectionId`: VPC peering connection ID
- `albDnsName`: ALB DNS name (application endpoint)
- `albArn`: ALB ARN
- `auroraClusterEndpoint`: Aurora cluster write endpoint
- `auroraClusterReadEndpoint`: Aurora cluster read endpoint
- `databaseName`: Database name
- `dbConnectionSecretArn`: Secrets Manager ARN for database connection
- `certificateArn`: ACM certificate ARN
- `blueTargetGroupArn`: Blue deployment target group ARN
- `greenTargetGroupArn`: Green deployment target group ARN
- `blueAsgName`: Blue Auto Scaling Group name
- `greenAsgName`: Green Auto Scaling Group name
- `logGroupName`: CloudWatch log group name
- `dashboardName`: CloudWatch dashboard name
- `kmsKeyId`: KMS key ID
- `kmsKeyArn`: KMS key ARN

## Cost Optimization

- **Aurora Serverless v2**: Auto-scales from 0.5 to 2 ACUs based on load
- **No NAT Gateways**: Uses VPC endpoints where possible
- **Auto Scaling**: Scales down during low traffic periods
- **S3 Lifecycle**: 90-day retention policy on ALB logs
- **CloudWatch Logs**: 30-day retention to control costs

## Compliance & Tags

All resources are tagged with:
- `Environment`: production or staging
- `Application`: payment-app
- `CostCenter`: fintech-payments
- `ManagedBy`: pulumi

## Destroyability

All resources are configured to be fully destroyable:
- No deletion protection enabled
- No retain policies
- Skip final snapshots on database
- Clean stack teardown with `pulumi destroy`

## Security Considerations

1. **Database Access**: Only accessible from EC2 security group
2. **Secrets**: Never hardcoded, stored in Secrets Manager
3. **Encryption**: KMS encryption for data at rest
4. **TLS**: Required for all external connections
5. **IAM**: Least privilege roles with specific permissions
6. **Logs**: Encrypted with customer-managed keys

## Future Enhancements

Optional enhancements to consider:
- API Gateway with request throttling
- SQS queues for asynchronous processing
- ElastiCache Redis for session management
- Route 53 health checks and failover
- AWS WAF for application firewall
- Lambda function for secrets rotation

## Troubleshooting

### Certificate Validation

ACM certificates require DNS validation. Ensure:
1. Domain exists in Route 53 or another DNS provider
2. DNS validation records are added
3. Certificate status is "Issued" before ALB can use it

### Database Connectivity

Test database connection:
```bash
# Get connection secret
aws secretsmanager get-secret-value --secret-id <dbConnectionSecretArn>

# Connect using psql
psql "postgresql://dbadmin:<password>@<endpoint>:5432/paymentdb?sslmode=require"
```

### Blue-Green Deployment

Monitor deployment:
```bash
# Check target group health
aws elbv2 describe-target-health --target-group-arn <targetGroupArn>

# View ASG instances
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names <asgName>
```

## Support

For issues or questions:
1. Check CloudWatch logs for application errors
2. Review CloudWatch dashboard for metrics anomalies
3. Verify security group rules allow required traffic
4. Check ALB target group health status
