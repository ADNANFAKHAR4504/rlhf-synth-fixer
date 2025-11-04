# Client Dashboard Infrastructure

This CDKTF TypeScript project deploys a containerized web application on AWS using ECS Fargate with Application Load Balancer and RDS PostgreSQL database.

## Architecture

### Components

- **VPC**: Multi-AZ VPC with public and private subnets across 2 availability zones
- **ECS Fargate**: Serverless container orchestration for running the web application
- **Application Load Balancer**: Distributes traffic across ECS tasks with health checks
- **RDS PostgreSQL**: Managed database instance (db.t3.micro) in private subnets
- **ECR**: Container registry with lifecycle policy (keeps last 5 images)
- **Auto-Scaling**: Scales ECS tasks (2-10) based on CPU utilization
- **CloudWatch**: Centralized logging with 7-day retention
- **Secrets Manager**: Secure storage for database credentials

### Network Architecture

```
Internet
    |
    v
Internet Gateway
    |
    v
Public Subnets (2 AZs)
    |
    +-- Application Load Balancer
    |
    +-- NAT Gateways (2)
         |
         v
Private Subnets (2 AZs)
    |
    +-- ECS Fargate Tasks (2-10)
    |
    +-- RDS PostgreSQL Instance
```

### Security

- **ALB Security Group**: Allows HTTP (80) from internet
- **ECS Security Group**: Allows port 3000 only from ALB
- **RDS Security Group**: Allows PostgreSQL (5432) only from ECS tasks
- **IAM Roles**: Least privilege access for ECS task execution
- **Encryption**: RDS encryption at rest enabled
- **Secrets**: Database credentials in Secrets Manager

## Prerequisites

- Node.js 16+ and npm
- AWS CLI configured with appropriate credentials
- Docker (for building container images)
- CDKTF CLI installed: `npm install -g cdktf-cli`

## Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Environment Variables

```bash
export ENVIRONMENT_SUFFIX="your-unique-suffix"
export AWS_REGION="ap-southeast-1"
export TERRAFORM_STATE_BUCKET="your-state-bucket"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

### 3. Synthesize Terraform Configuration

```bash
cdktf synth
```

### 4. Deploy Infrastructure

```bash
cdktf deploy
```

This will create:
- VPC with networking components
- ECS cluster and service
- Application Load Balancer
- RDS PostgreSQL database
- ECR repository
- All supporting resources (security groups, IAM roles, etc.)

### 5. Build and Push Container Image

After deployment, build your container image and push to ECR:

```bash
# Get ECR repository URL from outputs
ECR_URL=$(cdktf output ecr-repository-url)

# Login to ECR
aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin $ECR_URL

# Build your application image
docker build -t client-dashboard-app .

# Tag and push
docker tag client-dashboard-app:latest $ECR_URL:latest
docker push $ECR_URL:latest
```

### 6. Update ECS Service

After pushing the image, ECS will automatically deploy new tasks with the latest image.

## Outputs

After deployment, the following outputs are available:

- `vpc-id`: VPC identifier
- `alb-dns`: Application Load Balancer DNS name (your application endpoint)
- `ecs-cluster-name`: ECS cluster name
- `ecr-repository-url`: ECR repository URL for pushing images
- `rds-endpoint`: RDS database endpoint

## Accessing the Application

The application will be accessible at the ALB DNS name:

```bash
ALB_DNS=$(cdktf output alb-dns)
curl http://$ALB_DNS
```

## Database Connection

The ECS tasks automatically receive database connection details via environment variables:

- `DB_HOST`: RDS endpoint
- `DB_PORT`: 5432
- `DB_NAME`: clientdashboard
- `DB_USERNAME`: Retrieved from Secrets Manager
- `DB_PASSWORD`: Retrieved from Secrets Manager

Your application should read these environment variables to connect to the database.

## Auto-Scaling

The ECS service is configured to auto-scale based on CPU utilization:

- **Target CPU**: 70%
- **Min tasks**: 2
- **Max tasks**: 10
- **Scale out cooldown**: 60 seconds
- **Scale in cooldown**: 300 seconds

## Monitoring

CloudWatch logs are available at:

```
/ecs/client-dashboard-{environmentSuffix}
```

View logs in AWS Console or using AWS CLI:

```bash
aws logs tail /ecs/client-dashboard-$ENVIRONMENT_SUFFIX --follow
```

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

Note: The RDS instance has deletion protection enabled. You'll need to disable it manually before destroying:

```bash
aws rds modify-db-instance \
  --db-instance-identifier client-dashboard-db-$ENVIRONMENT_SUFFIX \
  --no-deletion-protection
```

A final snapshot will be created automatically before deletion.

## Cost Optimization

This infrastructure includes:

- **NAT Gateways** (~$0.045/hour each): Required for ECS tasks to pull images from ECR
- **RDS db.t3.micro** (~$0.017/hour): Single-AZ for cost savings
- **ECS Fargate** (pay per vCPU/GB-hour): Scales down to 2 tasks during low traffic
- **ALB** (~$0.0225/hour + data processing): Required for load balancing

Consider:
- Using VPC endpoints for ECR to eliminate NAT gateway costs
- Using Aurora Serverless v2 for the database if usage is sporadic
- Implementing time-based scaling to reduce tasks during off-hours

## Troubleshooting

### ECS Tasks Not Starting

1. Check CloudWatch logs for errors
2. Verify ECR image exists and is accessible
3. Check security group rules allow communication
4. Verify IAM role has necessary permissions

### Database Connection Issues

1. Verify security group allows ECS to RDS communication
2. Check Secrets Manager contains valid credentials
3. Verify RDS instance is in available state
4. Check database subnet group configuration

### ALB Health Checks Failing

1. Ensure container exposes port 3000
2. Verify /health endpoint exists and returns 200 OK
3. Check ECS task security group allows traffic from ALB
4. Review target group health check settings

## Architecture Decisions

### Why CDKTF?

CDKTF provides the flexibility of Terraform with the expressiveness of TypeScript, enabling:
- Type-safe infrastructure definitions
- Better IDE support and autocomplete
- Easier testing and validation
- Familiar programming constructs (loops, conditionals)

### Why Fargate over EC2?

- No server management required
- Pay only for running tasks
- Automatic scaling without managing instances
- Better isolation between tasks

### Why Multi-AZ NAT Gateways?

- High availability for outbound internet access
- ECS tasks need to pull images from ECR
- Each AZ has independent NAT gateway to avoid cross-AZ data transfer charges

### Why Single-AZ RDS?

- Cost optimization for non-critical environments
- Backups and snapshots provide data durability
- Can be upgraded to Multi-AZ if needed

## Tags

All resources are tagged with:

- `Environment`: production
- `Project`: client-dashboard
- `Repository`: (from CI/CD environment)
- `CommitAuthor`: (from CI/CD environment)

## Security Best Practices

- Database credentials never hardcoded
- RDS not publicly accessible
- Least privilege IAM policies
- Encryption at rest for RDS
- Security groups follow principle of least access
- Deletion protection on critical resources

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review AWS Console for resource status
3. Verify all prerequisites are met
4. Ensure environment variables are correctly set
