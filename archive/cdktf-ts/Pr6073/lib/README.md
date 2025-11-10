# Payment Application ECS Fargate Infrastructure

This CDKTF TypeScript implementation provisions a complete infrastructure for deploying a containerized payment processing web application on AWS ECS Fargate.

## Architecture

### Network Infrastructure
- VPC with CIDR 10.0.0.0/16
- 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) across 3 availability zones
- 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) across 3 availability zones
- Internet Gateway for public subnet internet access
- 3 NAT Gateways (one per AZ) for private subnet outbound access
- Public and private route tables with appropriate routing

### Load Balancing
- Application Load Balancer in public subnets
- HTTPS listener on port 443 with ACM certificate
- HTTP listener on port 80 (redirects to HTTPS)
- Path-based routing for /api/* and /admin/* endpoints
- Target group for ECS tasks on port 8080

### Container Orchestration
- ECS Fargate cluster with CloudWatch Container Insights enabled
- ECS service with 3 minimum tasks
- Fargate Spot instances for cost optimization
- Task definition with 256 CPU and 512 MB memory
- Container health checks and logging to CloudWatch

### Database
- RDS PostgreSQL 16.4 instance (db.t3.medium)
- Multi-AZ deployment for high availability
- Encrypted storage with automated backups
- Deployed in private subnets
- Backup retention: 7 days
- Maintenance window: Sunday 04:00-05:00 UTC

### Security
- Secrets Manager for database connection credentials
- Security groups:
  - ALB: Allow HTTPS (443) and HTTP (80) from internet
  - ECS: Allow traffic from ALB on port 8080
  - RDS: Allow traffic from ECS on port 5432
- IAM roles:
  - ECS Task Execution Role with Secrets Manager access
  - ECS Task Role for application permissions
- Private ECR repository with image scanning enabled

### Auto-Scaling
- Application Auto Scaling for ECS service
- Min capacity: 3 tasks
- Max capacity: 10 tasks
- Target CPU utilization: 70%
- Scale-out cooldown: 60 seconds
- Scale-in cooldown: 300 seconds

### Monitoring
- CloudWatch Container Insights enabled on ECS cluster
- CloudWatch Logs for ECS task logs
- 7-day log retention
- RDS enhanced monitoring with PostgreSQL logs

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- AWS CLI configured with appropriate credentials
- Terraform >= 1.5
- CDKTF CLI installed

## Environment Variables

The following environment variables can be set:

- `ENVIRONMENT_SUFFIX`: Environment suffix for resource naming (default: 'dev')
- `AWS_REGION`: AWS region for deployment (default: 'us-east-1')
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state (default: 'iac-rlhf-tf-states')
- `TERRAFORM_STATE_BUCKET_REGION`: Region for state bucket (default: 'us-east-1')
- `REPOSITORY`: Repository name for tagging (default: 'unknown')
- `COMMIT_AUTHOR`: Commit author for tagging (default: 'unknown')

## Deployment Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Container Image

Build your payment application container image and push to ECR:

```bash
# Get ECR repository URL from outputs after initial deploy
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag your image
docker build -t payment-app:latest .
docker tag payment-app:latest <ecr-repository-url>:latest

# Push to ECR
docker push <ecr-repository-url>:latest
```

### 3. Initialize CDKTF

```bash
npm run cdktf:get
```

### 4. Synthesize Configuration

```bash
npm run cdktf:synth
```

### 5. Deploy Infrastructure

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=prod

# Deploy all resources
npm run cdktf:deploy
```

### 6. Retrieve Outputs

After deployment, retrieve important outputs:

```bash
cdktf output
```

Key outputs:
- `alb-dns-name`: Load balancer URL for accessing the application
- `ecr-repository-url`: ECR repository URL for pushing container images
- `rds-endpoint`: RDS database endpoint
- `db-secret-arn`: ARN of the database secret in Secrets Manager

## Post-Deployment Configuration

### 1. Configure DNS (if using custom domain)

- Point your domain to the ALB DNS name using a CNAME record
- Update the ACM certificate domain validation records in Route 53

### 2. Update Container Image

The initial deployment references `latest` tag in ECR. Push your application image:

```bash
docker push <ecr-repository-url>:latest
```

### 3. Force New Deployment

After pushing the image, force a new ECS deployment:

```bash
aws ecs update-service \
  --cluster payment-cluster-${ENVIRONMENT_SUFFIX} \
  --service payment-service-${ENVIRONMENT_SUFFIX} \
  --force-new-deployment \
  --region us-east-1
```

## Testing

### Health Check

Test the application health endpoint:

```bash
curl https://<alb-dns-name>/health
```

### Path-Based Routing

Test API and admin endpoints:

```bash
curl https://<alb-dns-name>/api/status
curl https://<alb-dns-name>/admin/dashboard
```

### Database Connection

The ECS tasks automatically retrieve database credentials from Secrets Manager. The connection string is available as the `DB_CONNECTION` environment variable in the container.

## Monitoring

### CloudWatch Container Insights

View ECS metrics in CloudWatch:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=payment-cluster-${ENVIRONMENT_SUFFIX} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-east-1
```

### View Logs

View ECS task logs:

```bash
aws logs tail /ecs/payment-app-${ENVIRONMENT_SUFFIX} --follow --region us-east-1
```

### RDS Logs

View PostgreSQL logs:

```bash
aws rds describe-db-log-files \
  --db-instance-identifier payment-db-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

## Scaling

The ECS service automatically scales based on CPU utilization:

- When average CPU > 70%, scales out (adds tasks)
- When average CPU < 70%, scales in (removes tasks)
- Min: 3 tasks, Max: 10 tasks

To manually scale:

```bash
aws ecs update-service \
  --cluster payment-cluster-${ENVIRONMENT_SUFFIX} \
  --service payment-service-${ENVIRONMENT_SUFFIX} \
  --desired-count 5 \
  --region us-east-1
```

## Troubleshooting

### ECS Tasks Not Starting

Check ECS service events:

```bash
aws ecs describe-services \
  --cluster payment-cluster-${ENVIRONMENT_SUFFIX} \
  --services payment-service-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

### Database Connection Issues

Verify security group rules allow ECS to RDS traffic:

```bash
aws ec2 describe-security-groups \
  --filters Name=group-name,Values=rds-sg-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

### ALB Health Check Failures

Check target group health:

```bash
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --region us-east-1
```

## Cleanup

To destroy all resources:

```bash
# Empty ECR repository first
aws ecr batch-delete-image \
  --repository-name payment-app-${ENVIRONMENT_SUFFIX} \
  --image-ids imageTag=latest \
  --region us-east-1

# Destroy infrastructure
npm run cdktf:destroy
```

## Security Considerations

1. **PCI DSS Compliance**:
   - All data at rest is encrypted (RDS, EBS volumes)
   - All data in transit uses TLS (ALB HTTPS, RDS encryption in transit)
   - Database credentials stored in Secrets Manager
   - Network segmentation with security groups

2. **Least Privilege**:
   - IAM roles follow least privilege principle
   - Security groups restrict traffic to only required ports

3. **Monitoring**:
   - CloudWatch Container Insights enabled
   - RDS enhanced monitoring enabled
   - All logs retained for 7 days

4. **High Availability**:
   - Multi-AZ RDS deployment
   - ECS tasks spread across 3 availability zones
   - NAT Gateway redundancy (one per AZ)

## Cost Optimization

- Fargate Spot instances used for ECS tasks (up to 70% cost savings)
- Auto-scaling ensures resources match demand
- NAT Gateways used only in private subnets (consider VPC endpoints for further savings)
- 7-day log retention to manage CloudWatch costs

## License

MIT
