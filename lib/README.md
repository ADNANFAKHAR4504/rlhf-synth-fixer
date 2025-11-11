# Flask Application Infrastructure

This Pulumi Python project deploys a highly available, auto-scaling containerized Flask application on AWS using ECS Fargate.

## Architecture Overview

The infrastructure includes:

- **VPC**: Custom VPC with 2 public and 2 private subnets across 2 availability zones
- **Application Load Balancer**: Distributes traffic to ECS tasks with health checks
- **ECS Fargate**: Runs containerized Flask application with auto-scaling
- **RDS PostgreSQL**: Managed database with automated backups
- **DynamoDB**: Session management with TTL
- **ECR**: Private container registry with image scanning
- **CloudWatch Logs**: Centralized logging with 7-day retention
- **Secrets Manager**: Secure credential storage
- **Auto-scaling**: CPU-based scaling between 2-10 tasks

## Prerequisites

- Python 3.8 or higher
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Docker for building container images

## Project Structure

```
.
├── __main__.py              # Main entry point
├── vpc.py                   # VPC and networking resources
├── ecr.py                   # ECR repository configuration
├── rds.py                   # RDS PostgreSQL database
├── dynamodb.py              # DynamoDB table
├── ecs.py                   # ECS cluster and service
├── alb.py                   # Application Load Balancer
├── autoscaling.py           # Auto-scaling policies
├── Pulumi.yaml              # Pulumi project configuration
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## Configuration

Set the following configuration values:

```bash
pulumi config set aws:region us-east-2
pulumi config set environmentSuffix dev
```

## Deployment

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Initialize Pulumi stack:
```bash
pulumi stack init dev
```

3. Configure AWS region and environment suffix:
```bash
pulumi config set aws:region us-east-2
pulumi config set environmentSuffix dev
```

4. Preview changes:
```bash
pulumi preview
```

5. Deploy infrastructure:
```bash
pulumi up
```

6. Build and push Docker image to ECR:
```bash
# Get ECR repository URL
ECR_URL=$(pulumi stack output ecr_repository_url)

# Login to ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin $ECR_URL

# Build and tag image
docker build -t webapp:latest .
docker tag webapp:latest $ECR_URL:latest

# Push to ECR
docker push $ECR_URL:latest
```

7. Update ECS service to pull new image:
```bash
aws ecs update-service --cluster $(pulumi stack output ecs_cluster_name) \
  --service $(pulumi stack output ecs_service_name) --force-new-deployment
```

## Stack Outputs

After deployment, the following outputs are available:

- `alb_dns_name`: DNS name of the Application Load Balancer
- `alb_url`: Full HTTP URL to access the application
- `vpc_id`: VPC identifier
- `ecr_repository_url`: ECR repository URL for pushing images
- `ecs_cluster_name`: ECS cluster name
- `ecs_service_name`: ECS service name
- `rds_endpoint`: RDS database endpoint
- `dynamodb_table_name`: DynamoDB table name
- `log_group_name`: CloudWatch log group name

## Accessing the Application

Get the Application Load Balancer URL:

```bash
pulumi stack output alb_url
```

Access the application:
- Health endpoint: `http://<alb_dns_name>/health`
- API endpoints: `http://<alb_dns_name>/api/*`

## Auto-Scaling

The ECS service automatically scales based on CPU utilization:
- **Minimum tasks**: 2
- **Maximum tasks**: 10
- **Scale trigger**: 70% average CPU utilization
- **Cooldown**: 300 seconds

## Monitoring

View logs in CloudWatch:
```bash
aws logs tail /ecs/flask-$(pulumi config get environmentSuffix) --follow
```

View metrics in CloudWatch Console:
- ECS service CPU utilization
- ALB request count and latency
- Target group health status

## Security

- All traffic between ALB and ECS tasks is within the VPC
- Database credentials stored in AWS Secrets Manager
- RDS instance in private subnets with no public access
- Security groups restrict traffic to necessary ports only
- Encryption at rest enabled for RDS and DynamoDB
- ECR images scanned for vulnerabilities on push

## Cost Optimization

- ECS Fargate with minimum 2 tasks
- RDS db.t3.micro instance
- DynamoDB on-demand pricing
- CloudWatch logs with 7-day retention
- ECR lifecycle policy keeps only 5 recent images

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Troubleshooting

### ECS tasks not starting
- Check CloudWatch logs for task errors
- Verify ECR image exists and is accessible
- Ensure IAM roles have necessary permissions

### Health checks failing
- Verify Flask application responds on port 5000
- Check /health endpoint returns 200 status
- Review security group rules

### Database connection issues
- Verify Secrets Manager contains valid connection string
- Check RDS security group allows traffic from ECS tasks
- Ensure RDS instance is in available state

## Support

For issues or questions, refer to:
- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
