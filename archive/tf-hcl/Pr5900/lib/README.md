# ECS Fargate Microservices Architecture

This Terraform configuration deploys a containerized microservices architecture on Amazon ECS Fargate with three services: payment-service, auth-service, and analytics-service.

## Architecture Overview

- **ECS Cluster**: fintech-cluster with Container Insights enabled
- **Services**: Three ECS Fargate services, each running 2 tasks minimum
- **Networking**: Multi-AZ VPC with private subnets across 3 availability zones
- **Load Balancing**: Internal Application Load Balancer with separate target groups per service
- **Auto Scaling**: CPU and memory-based auto-scaling (70% threshold)
- **Logging**: CloudWatch log groups with '/ecs/fintech/' prefix and 7-day retention
- **Security**: IAM roles for ECR and Parameter Store access, security groups restricting traffic to port 8080

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** version 1.5 or higher
3. **AWS CLI** configured with credentials
4. **ECR Repositories** with container images:
   - payment-service
   - auth-service
   - analytics-service

## Deployment Instructions

### Step 1: Configure Variables

Copy the example tfvars file and customize:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and update:
- `environment_suffix`: Your environment identifier (e.g., "dev", "staging", "prod")
- `ecr_repository_urls`: Your ECR repository URLs
- `container_image_tags`: Your container image tags

### Step 2: Initialize Terraform

```bash
terraform init
```

### Step 3: Review the Plan

```bash
terraform plan
```

### Step 4: Deploy

```bash
terraform apply
```

Review the changes and type `yes` to confirm.

### Step 5: Verify Deployment

Check ECS services:

```bash
aws ecs list-services --cluster fintech-cluster-${ENVIRONMENT_SUFFIX} --region ap-southeast-1
```

Check ALB health:

```bash
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw payment_service_target_group_arn) \
  --region ap-southeast-1
```

## Resource Naming Convention

All resources use the `environment_suffix` variable in their names:
- ECS Cluster: `fintech-cluster-${environment_suffix}`
- Services: `payment-service-${environment_suffix}`, etc.
- ALB: `fintech-alb-${environment_suffix}`
- Security Groups: `fintech-ecs-${environment_suffix}`, `fintech-alb-${environment_suffix}`

## Configuration Details

### Task Specifications
- **CPU**: 512 units
- **Memory**: 1024 MiB
- **Network Mode**: awsvpc (required for Fargate)

### Health Checks
- **Interval**: 30 seconds
- **Timeout**: 5 seconds
- **Healthy Threshold**: 2
- **Unhealthy Threshold**: 3
- **Paths**:
  - Payment Service: `/health`
  - Auth Service: `/auth/health`
  - Analytics Service: `/analytics/health`

### Auto Scaling
- **Minimum Tasks**: 2
- **Maximum Tasks**: 10
- **CPU Threshold**: 70%
- **Memory Threshold**: 70%
- **Scale Out Cooldown**: 60 seconds
- **Scale In Cooldown**: 300 seconds

### Circuit Breaker
Enabled on all services with automatic rollback on deployment failures.

## Security

### IAM Roles

**Task Execution Role** permissions:
- Pull images from ECR
- Write to CloudWatch Logs
- Access Secrets Manager (if needed)

**Task Role** permissions:
- Read from Parameter Store (`/fintech/*` path)
- Write to CloudWatch Logs

### Security Groups

**ALB Security Group**:
- Ingress: HTTP (80), HTTPS (443) from VPC CIDR
- Egress: All traffic

**ECS Services Security Group**:
- Ingress: Port 8080 from ALB and same security group (inter-service)
- Egress: All traffic

### Network Isolation
- ECS tasks run in private subnets
- Internal ALB for service-to-service communication
- NAT Gateways for outbound internet access

## Monitoring

### CloudWatch Logs
- Log groups: `/ecs/fintech/{service-name}-${environment_suffix}`
- Retention: 7 days (configurable)

### Container Insights
Enabled by default, provides:
- CPU and memory utilization metrics
- Network metrics
- Task-level metrics

### ALB Metrics
- Request count
- Target response time
- HTTP error codes
- Healthy/unhealthy host count

## Outputs

After deployment, Terraform outputs:
- ECS cluster name and ARN
- ALB DNS name
- Target group ARNs
- Service names
- VPC and subnet IDs
- Security group IDs
- CloudWatch log group names

Access outputs:

```bash
terraform output
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete all ECS services, tasks, load balancer, and networking resources.

## Troubleshooting

### Service fails to start
1. Check CloudWatch logs for container errors
2. Verify ECR repository access
3. Ensure container images exist with specified tags
4. Check security group rules

### Health checks failing
1. Verify health check paths match application endpoints
2. Check container is listening on port 8080
3. Review security group rules allow ALB to task communication
4. Check CloudWatch logs for application errors

### Auto scaling not triggering
1. Verify CloudWatch metrics are being published
2. Check auto scaling policy configuration
3. Ensure Container Insights is enabled
4. Review scaling cooldown periods

## Cost Optimization

- Uses Fargate for serverless container management (no EC2 instances)
- Auto scaling adjusts capacity based on load
- 7-day log retention (adjust as needed)
- Consider using Fargate Spot for non-critical workloads

## Support

For issues or questions:
1. Check CloudWatch logs for error messages
2. Review AWS service quotas
3. Verify IAM permissions
4. Consult Terraform state file for resource status
