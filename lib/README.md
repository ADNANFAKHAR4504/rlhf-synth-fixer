# Payment Processing Web Application Infrastructure

Production-grade payment processing web application infrastructure built with Pulumi and Python.

## Architecture

This infrastructure implements a secure, scalable payment processing platform with:

- **VPC**: Multi-AZ deployment with public and private subnets across 3 availability zones
- **Compute**: ECS Fargate with auto-scaling (3-10 tasks) based on CPU and memory
- **Database**: Aurora PostgreSQL with multi-AZ, encryption at rest
- **Frontend**: S3 + CloudFront CDN for React application
- **Load Balancing**: Application Load Balancer with HTTPS
- **Monitoring**: CloudWatch logs with 30-day retention
- **Security**: Secrets Manager for credentials, security groups, encrypted database

## Components

### VPC Stack
- 3 availability zones with public and private subnets
- NAT Gateways in public subnets
- Internet Gateway for public subnet routing
- Route tables for subnet traffic management

### Database Stack
- Aurora PostgreSQL cluster with multi-AZ deployment
- Encryption at rest enabled
- Secrets Manager integration for credentials
- DB subnet group across private subnets
- Security group restricting access to VPC

### ECS Stack
- ECS cluster with Fargate launch type
- Minimum 3 tasks, maximum 10 tasks
- Auto-scaling policies:
  - CPU utilization > 70%
  - Memory utilization > 80%
- Container health checks (30-second intervals)
- Application Load Balancer in public subnets
- Security groups: HTTPS only from internet to ALB

### Frontend Stack
- S3 bucket for static website hosting
- CloudFront distribution with HTTPS
- Origin Access Identity for secure S3 access
- Custom error responses for SPA routing

### Monitoring Stack
- CloudWatch log groups for ECS tasks
- CloudWatch log groups for ALB access
- 30-day retention policy

## Deployment

### Prerequisites

- Python 3.9+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- Environment suffix for resource naming

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Configure Pulumi
pulumi login

# Set AWS region
export AWS_REGION=us-east-1

# Set environment suffix (required)
export ENVIRONMENT_SUFFIX=dev
```

### Deploy

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Outputs

After deployment, the following outputs are available:

- `vpc_id`: VPC identifier
- `alb_url`: Application Load Balancer URL (API endpoint)
- `cloudfront_url`: CloudFront distribution URL (frontend)
- `database_cluster_endpoint`: Aurora PostgreSQL endpoint
- `ecs_cluster_name`: ECS cluster name
- `frontend_bucket_name`: S3 bucket name

## Resource Naming

All resources include the `environment_suffix` parameter to ensure global uniqueness:

```
{resource-type}-{environment-suffix}
```

Examples:
- `payment-vpc-dev`
- `payment-ecs-cluster-prod`
- `payment-frontend-staging`

## Security

### Network Isolation
- All compute resources (ECS tasks, database) in private subnets
- Public subnets only for ALB and NAT Gateways
- Security groups enforce least-privilege access

### Encryption
- Database encryption at rest enabled
- HTTPS enforced via CloudFront and ALB
- Secrets stored in AWS Secrets Manager

### Access Control
- IAM roles with minimum required permissions
- Database credentials injected via Secrets Manager
- No hardcoded credentials

## Auto-Scaling

### ECS Task Auto-Scaling
- **CPU-based**: Scales when CPU > 70%
- **Memory-based**: Scales when memory > 80%
- **Scale-out cooldown**: 60 seconds
- **Scale-in cooldown**: 300 seconds
- **Min capacity**: 3 tasks
- **Max capacity**: 10 tasks

## Monitoring

### CloudWatch Logs
- ECS task logs: `/aws/ecs/payment-api-{suffix}`
- ALB access logs: `/aws/alb/payment-{suffix}`
- Retention: 30 days

### Health Checks
- Container health check: 30-second intervals
- ALB target group health check: 30-second intervals
- Unhealthy threshold: 3 consecutive failures
- Healthy threshold: 2 consecutive successes

## Cost Optimization

This infrastructure uses cost-effective resources:

- **ECS Fargate**: Pay only for running tasks
- **Aurora Serverless**: Automatic scaling (if configured)
- **NAT Gateway**: Required but expensive (~$0.045/hour per AZ)
- **CloudFront**: Free tier available, pay-as-you-go

To minimize costs in non-production environments:
- Reduce NAT Gateway count to 1 AZ
- Use Aurora Serverless v2 with low minimum capacity
- Configure shorter log retention periods

## Cleanup

```bash
# Destroy all resources
pulumi destroy

# Remove stack
pulumi stack rm
```

All resources are configured for complete destroyability with no manual intervention required.

## Tags

All resources are tagged with:
- `Environment`: production
- `CostCenter`: payments
- Additional tags from provider defaults

## Troubleshooting

### Common Issues

1. **NAT Gateway timeout**: NAT Gateways take 3-5 minutes to create/destroy
2. **Database connectivity**: Ensure security groups allow traffic from ECS
3. **CloudFront deployment**: Can take 15-20 minutes for global distribution
4. **S3 bucket conflicts**: Ensure environment_suffix is unique

### Debug Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster payment-ecs-cluster-{suffix} --services payment-service-{suffix}

# View ECS task logs
aws logs tail /aws/ecs/payment-api-{suffix} --follow

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn {target-group-arn}
```

## Production Considerations

### Required Enhancements for Production

1. **SSL/TLS Certificates**
   - Configure ACM certificate with DNS validation
   - Update ALB HTTPS listener with certificate
   - Update CloudFront to use custom certificate

2. **Database**
   - Use AWS Secrets Manager rotation for DB credentials
   - Configure automated backups and point-in-time recovery
   - Set up read replicas for read-heavy workloads

3. **Monitoring**
   - Set up CloudWatch alarms for critical metrics
   - Configure SNS topics for alert notifications
   - Implement distributed tracing with AWS X-Ray

4. **Security**
   - Implement WAF rules on ALB and CloudFront
   - Enable VPC Flow Logs
   - Configure AWS Config for compliance monitoring
   - Implement AWS GuardDuty for threat detection

5. **Disaster Recovery**
   - Configure cross-region replication for S3
   - Set up Aurora Global Database for cross-region failover
   - Document and test DR procedures

## Support

For issues or questions:
- Review CloudWatch logs for application errors
- Check ECS task definitions for configuration issues
- Verify security group rules for connectivity problems
