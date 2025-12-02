# Payment Processor ECS Fargate Migration

This Pulumi Python program migrates a payment processing application from EC2 instances to ECS Fargate with full containerization, auto-scaling, and monitoring.

## Architecture

- **ECS Cluster**: Fargate-based cluster with Container Insights enabled
- **ECR Repository**: Private repository with vulnerability scanning and lifecycle policies
- **Task Definition**: 2 vCPU, 4GB memory with Secrets Manager integration
- **ECS Service**: 3 tasks distributed across availability zones
- **Auto-scaling**: CPU (70%) and memory (80%) based scaling between 3-10 tasks
- **Monitoring**: CloudWatch logs with 30-day retention and encryption
- **Security**: Private subnets, Secrets Manager for credentials, encrypted logs

## Prerequisites

1. Python 3.9 or later
2. Pulumi CLI 3.x installed
3. AWS CLI configured with appropriate IAM permissions
4. Existing legacy infrastructure stack with VPC, subnets, ALB, and security groups

## Required Legacy Stack Outputs

The legacy infrastructure stack must export:
- `vpcId`: VPC ID
- `privateSubnetIds`: Array of private subnet IDs
- `publicSubnetIds`: Array of public subnet IDs
- `albSecurityGroupId`: ALB security group ID
- `appSecurityGroupId`: Application security group ID
- `albArn`: Application Load Balancer ARN
- `albListenerArn`: ALB HTTP/HTTPS listener ARN
- `albDnsName`: ALB DNS name

## Deployment

### 1. Install Dependencies

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Stack

```bash
pulumi stack init dev
pulumi config set aws:region us-east-2
pulumi config set environmentSuffix dev
pulumi config set legacyStackName legacy-infrastructure
```

### 3. Build and Push Container Image

Before deploying, build and push your payment-processor container:

```bash
# Get ECR repository URL (after first deployment or from preview)
ECR_URL=$(pulumi stack output ecr_repository_url)

# Login to ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin $ECR_URL

# Build and push
docker build -t payment-processor:latest .
docker tag payment-processor:latest $ECR_URL:latest
docker push $ECR_URL:latest
```

### 4. Deploy Infrastructure

```bash
pulumi up
```

### 5. Update Database Credentials

After deployment, update the Secrets Manager secret with real credentials:

```bash
aws secretsmanager update-secret \
  --secret-id db-credentials-dev \
  --secret-string '{
    "username": "actual_username",
    "password": "actual_password",
    "host": "actual-rds-host.region.rds.amazonaws.com",
    "port": "5432",
    "database": "payments"
  }' \
  --region us-east-2
```

## Configuration Options

| Parameter | Description | Default |
|-----------|-------------|---------|
| `environmentSuffix` | Environment suffix for resource naming | Required |
| `legacyStackName` | Legacy infrastructure stack name | `legacy-infrastructure` |
| `aws:region` | AWS deployment region | `us-east-2` |

## Resource Naming

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- `payment-processor-cluster-dev`
- `payment-processor-ecr-dev`
- `ecs-tasks-sg-dev`

## Auto-Scaling

The service automatically scales based on:
- **CPU**: Scales out when average CPU > 70%, scales in when < 70%
- **Memory**: Scales out when average memory > 80%, scales in when < 80%
- **Limits**: Minimum 3 tasks, maximum 10 tasks
- **Cooldown**: 60s scale-out, 300s scale-in

## Monitoring

### CloudWatch Logs
- Log group: `/ecs/payment-processor-{environment-suffix}`
- Retention: 30 days
- Encryption: AWS managed keys

### CloudWatch Alarms
- High CPU: Triggers when CPU > 80% for 2 consecutive periods (5 min each)
- High Memory: Triggers when memory > 85% for 2 consecutive periods

## Security

- **Network**: Tasks run in private subnets with no public IP
- **Credentials**: Database credentials stored in Secrets Manager
- **Images**: ECR repository has vulnerability scanning enabled
- **Logs**: CloudWatch logs encrypted at rest
- **IAM**: Least-privilege roles for task execution and runtime

## Health Checks

- **Container Health**: Internal health check on `http://localhost:8080/health`
- **Target Group Health**: ALB health check on `/health` endpoint
- **Custom Header**: Health checks require `X-Health-Check: true` header

## Deployment Strategies

The infrastructure supports both deployment strategies:

### Rolling Updates (Default)
- Controlled by `deployment_configuration` in ECS service
- Maximum 200% capacity, minimum 100% healthy

### Blue/Green Deployment
To enable blue/green deployments:
1. Set up AWS CodeDeploy application and deployment group
2. Update `deployment_controller` to `CODE_DEPLOY` type
3. Use CodeDeploy for deployments

## Troubleshooting

### Tasks Not Starting
1. Check CloudWatch logs: `/ecs/payment-processor-{environment-suffix}`
2. Verify ECR image exists: `aws ecr describe-images --repository-name payment-processor-{suffix}`
3. Check IAM permissions for task execution role

### Database Connection Issues
1. Verify Secrets Manager secret contains correct credentials
2. Check security group rules allow outbound traffic
3. Verify RDS security group allows inbound from ECS tasks

### Auto-Scaling Not Working
1. Check CloudWatch metrics for CPU and memory utilization
2. Verify auto-scaling policies are active
3. Check service events in ECS console

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Cost Optimization

- Uses Fargate Spot for non-critical environments (modify task definition)
- ECR lifecycle policy keeps only 10 most recent images
- CloudWatch logs retention set to 30 days
- Auto-scaling prevents over-provisioning

## Outputs

| Output | Description |
|--------|-------------|
| `ecs_cluster_name` | ECS cluster name |
| `ecs_cluster_arn` | ECS cluster ARN |
| `ecs_service_name` | ECS service name |
| `ecr_repository_url` | ECR repository URL for pushing images |
| `load_balancer_dns` | ALB DNS name for accessing the service |
| `target_group_arn` | Target group ARN |
| `log_group_name` | CloudWatch log group name |
| `task_definition_arn` | ECS task definition ARN |
| `db_secret_arn` | Secrets Manager secret ARN |

## CI/CD Integration

Use these outputs in your CI/CD pipeline:

```bash
# Get ECR URL and push new image
ECR_URL=$(pulumi stack output ecr_repository_url)
docker push $ECR_URL:$VERSION

# Force new deployment
aws ecs update-service \
  --cluster $(pulumi stack output ecs_cluster_name) \
  --service $(pulumi stack output ecs_service_name) \
  --force-new-deployment
```
