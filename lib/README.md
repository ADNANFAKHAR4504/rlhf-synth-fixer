# E-Commerce Infrastructure - CDKTF Python

Production-ready e-commerce web application infrastructure using CDKTF with Python.

## Architecture

This infrastructure deploys a highly available, scalable e-commerce platform with:

- **Multi-AZ VPC**: 2 availability zones, 2 public subnets, 4 private subnets
- **Database**: Aurora Serverless v2 PostgreSQL (0.5-1.0 ACU)
- **Compute**: ECS Fargate with 2+ tasks, auto-scaling at 70% CPU
- **Load Balancing**: Application Load Balancer with AWS WAF (2000 req/5min limit)
- **Static Assets**: S3 + CloudFront with Origin Access Identity
- **Security**: Secrets Manager with 30-day rotation, security groups
- **Observability**: CloudWatch Logs, Container Insights

## Prerequisites

- Python 3.8+
- CDKTF 0.15+
- AWS CLI configured with credentials
- Terraform 1.5+

## Installation

```bash
# Install dependencies
pipenv install

# Generate CDKTF providers
cdktf get
```

## Configuration

Set environment variables:

```bash
export ENVIRONMENT_SUFFIX="prod123"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="your-state-bucket"
export TEAM="platform-team"
```

## Deployment

```bash
# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy

# Destroy infrastructure
cdktf destroy
```

## Resource Naming

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Example: `ecommerce-vpc-prod123`, `ecommerce-aurora-prod123`

## Blue/Green Deployment

The infrastructure includes two target groups (blue/green) for zero-downtime deployments:

1. Deploy new version to green target group
2. Test green environment
3. Switch ALB listener to green
4. Deprecate blue environment

## Auto-Scaling

ECS tasks automatically scale based on:
- **Metric**: CPU utilization
- **Threshold**: 70%
- **Min tasks**: 2
- **Max tasks**: 10
- **Scale-out cooldown**: 60s
- **Scale-in cooldown**: 300s

## Security Features

- **WAF**: Rate limiting (2000 requests per 5 minutes)
- **Secrets**: Database credentials in Secrets Manager, rotated every 30 days
- **Network**: Private subnets for database and app, public subnets for ALB only
- **HTTPS**: CloudFront enforces HTTPS for static assets
- **IAM**: Least privilege roles for ECS tasks

## Monitoring

- **CloudWatch Logs**: ECS container logs retained for 7 days
- **Container Insights**: Enabled on ECS cluster
- **Health Checks**: ALB health checks on `/health` endpoint

## Cost Optimization

- Aurora Serverless v2: 0.5-1.0 ACU (cost-effective scaling)
- ECS Fargate: Pay only for running tasks
- CloudFront: Efficient content delivery
- S3: Versioning enabled for static assets

## Testing

```bash
# Run unit tests
pytest test/test_ecommerce_stack.py -v

# Run with coverage
pytest test/ --cov=lib --cov-report=html
```

## Troubleshooting

### ECS Tasks Not Starting

- Check task execution role permissions
- Verify security group rules
- Review CloudWatch logs

### Database Connection Issues

- Verify security group allows traffic from ECS
- Check Secrets Manager secret format
- Ensure Aurora cluster is in available state

### ALB Health Check Failures

- Verify application exposes `/health` endpoint
- Check security group allows traffic on port 8080
- Review ECS task logs

## Outputs

After deployment:

- **ALB DNS**: Used to access the application
- **CloudFront Domain**: Used for static assets
- **Aurora Endpoint**: Database connection string (from Secrets Manager)

## Tags

All resources are tagged with:
- **Environment**: Environment suffix value
- **Project**: "ecommerce"
- **Owner**: "platform-team"
- **Repository**: From environment
- **PRNumber**: From environment

## AWS Services Used

- **VPC**: Networking and isolation
- **Aurora Serverless v2**: Database
- **ECS Fargate**: Container orchestration
- **Application Load Balancer**: Traffic distribution
- **AWS WAF**: Web application firewall
- **S3**: Static asset storage
- **CloudFront**: CDN
- **Secrets Manager**: Credential management
- **CloudWatch**: Logging and monitoring
- **IAM**: Access management
- **NAT Gateway**: Outbound connectivity for private subnets

<!-- Trigger deployment after resource cleanup -->

## Mandatory Requirements Implemented

All mandatory requirements from the specification are implemented:

1. VPC with 2 public and 4 private subnets across 2 AZs - COMPLETE
2. Aurora Serverless v2 PostgreSQL cluster in private subnets - COMPLETE
3. S3 bucket with CloudFront distribution for static assets - COMPLETE
4. Secrets Manager for database credentials with 30-day rotation - COMPLETE
5. AWS WAF on ALB with rate limiting of 2000 requests/5min - COMPLETE
6. ECS auto-scaling based on 70% CPU utilization - COMPLETE
7. Security groups allowing only HTTPS (443) from internet to ALB - COMPLETE
8. Consistent resource tagging (Environment, Project, Owner) - COMPLETE
<!-- Cleanup phase 2 complete - all resources verified deleted -->
