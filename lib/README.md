# Transaction Processing Application Infrastructure

This AWS CDK Python application deploys a complete containerized transaction processing infrastructure with blue-green deployment capabilities.

## Architecture

- **VPC**: 3 public and 3 private subnets across 3 availability zones
- **ECS Fargate**: Two services (blue/green) running containerized application
- **RDS Aurora Serverless v2**: PostgreSQL cluster with writer and reader instances
- **Application Load Balancer**: Weighted target groups for blue-green deployment (80/20 split)
- **CloudWatch**: Dashboard with ECS task count and RDS connection metrics
- **Security**: Least privilege security groups and IAM roles

## Prerequisites

- AWS CDK 2.x installed (`npm install -g aws-cdk`)
- Python 3.9 or higher
- AWS CLI configured with appropriate credentials
- Docker installed (for local development)

## Deployment

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Bootstrap CDK** (first time only):
   ```bash
   cdk bootstrap
   ```

3. **Deploy with custom environment suffix**:
   ```bash
   cdk deploy -c environmentSuffix=prod
   ```

   Or use default "dev" suffix:
   ```bash
   cdk deploy
   ```

4. **View outputs**:
   After deployment, the stack outputs will display:
   - ALB DNS name for accessing the application
   - Database endpoint for application configuration
   - Database credentials secret ARN
   - ECS cluster and service names
   - CloudWatch dashboard URL

## Blue-Green Deployment

The infrastructure includes two ECS services with weighted target groups:
- **Blue service**: Receives 80% of traffic (2 tasks)
- **Green service**: Receives 20% of traffic (1 task)

To shift traffic between blue and green deployments:
1. Update the ALB listener weights in the stack code
2. Redeploy the stack with `cdk deploy`

## Configuration

### Environment Suffix

The `environmentSuffix` parameter ensures unique resource names across multiple deployments:
```bash
cdk deploy -c environmentSuffix=staging
```

### Resource Configuration

Key resources can be customized in `lib/tap_stack.py`:
- ECS task CPU/memory (currently 2 vCPU, 4 GB)
- RDS Aurora Serverless v2 capacity (0.5-1 ACU)
- NAT Gateway count (currently 1 for cost optimization)
- Health check intervals (currently 30 seconds)
- Log retention (currently 3 days)

## Monitoring

Access the CloudWatch dashboard using the URL from stack outputs. The dashboard displays:
- ECS task count and CPU utilization for blue and green services
- RDS database connections
- Service health metrics

## Clean Up

To destroy all resources:
```bash
cdk destroy
```

All resources are configured with `RemovalPolicy.DESTROY` for easy cleanup without manual intervention.

## Security

- Security groups follow least privilege with explicit port definitions
- IAM roles avoid wildcard permissions except for CloudWatch Logs
- RDS credentials stored in AWS Secrets Manager
- Database encryption enabled by default
- Private subnets for ECS tasks and RDS cluster
- Public subnets only for ALB

## Cost Optimization

- Single NAT Gateway instead of per-AZ deployment
- Aurora Serverless v2 with automatic scaling (0.5-1 ACU)
- Minimal backup retention (1 day)
- 3-day log retention for ECS tasks

## Troubleshooting

### Deployment fails due to capacity issues
- Check that your AWS account has sufficient limits for ECS tasks and RDS instances
- Verify that the selected region (us-east-1) supports Aurora Serverless v2

### Application not accessible
- Check ALB security group allows inbound traffic on port 80
- Verify ECS tasks are in RUNNING state
- Check target group health checks are passing

### Database connection issues
- Verify ECS security group can reach RDS security group on port 5432
- Check that database credentials secret is accessible by ECS task execution role
- Confirm RDS cluster is in AVAILABLE state
