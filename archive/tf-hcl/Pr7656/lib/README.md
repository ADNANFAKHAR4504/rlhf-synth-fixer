# E-Commerce Product Catalog API Infrastructure

This Terraform configuration deploys a highly available, auto-scaling web application API infrastructure on AWS.

## Architecture

- **VPC**: Custom VPC with CIDR 10.0.0.0/16
- **Subnets**: 2 public subnets across 2 availability zones
- **Load Balancer**: Application Load Balancer (ALB) in public subnets
- **Compute**: Auto Scaling Group with EC2 t3.micro instances (min 2, max 6)
- **Scaling**: Target tracking policy maintaining 70% CPU utilization
- **Security**: Separate security groups for ALB and EC2 instances
- **Monitoring**: CloudWatch alarms for CPU and unhealthy hosts

## Prerequisites

- Terraform >= 1.5.0
- AWS CLI configured with appropriate credentials
- AWS Provider >= 5.0

## Deployment

### 1. Initialize Terraform

```bash
terraform init
```

### 2. Review the Plan

```bash
terraform plan -var="environment_suffix=dev"
```

### 3. Apply the Configuration

```bash
terraform apply -var="environment_suffix=dev"
```

### 4. Get Outputs

```bash
terraform output alb_dns_name
terraform output api_endpoint
```

## Testing

### Health Check

```bash
ALB_DNS=$(terraform output -raw alb_dns_name)
curl http://$ALB_DNS/health
```

### API Endpoint

```bash
ALB_DNS=$(terraform output -raw alb_dns_name)
curl http://$ALB_DNS
```

### Monitor Auto Scaling

```bash
# Get Auto Scaling Group name
ASG_NAME=$(terraform output -raw autoscaling_group_name)

# Describe Auto Scaling Group
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME

# View scaling activities
aws autoscaling describe-scaling-activities --auto-scaling-group-name $ASG_NAME
```

## Configuration

### Variables

- `aws_region`: AWS region (default: us-east-1)
- `environment_suffix`: Environment suffix for resource naming (required for uniqueness)
- `repository`: Repository name for tagging
- `commit_author`: Commit author for tagging
- `pr_number`: PR number for tagging
- `team`: Team name for tagging

### Outputs

- `alb_dns_name`: DNS name of the Application Load Balancer
- `target_group_arn`: ARN of the target group
- `api_endpoint`: Full API endpoint URL
- `health_check_endpoint`: Health check endpoint URL
- `autoscaling_group_name`: Name of the Auto Scaling Group

## Features

### High Availability

- Instances deployed across 2 availability zones
- Application Load Balancer distributes traffic
- Health checks ensure only healthy instances receive traffic

### Auto Scaling

- Minimum 2 instances for redundancy
- Maximum 6 instances for cost control
- Target tracking policy maintains 70% CPU utilization
- Automatic scale-out during high load
- Automatic scale-in during low load

### Security

- ALB accepts HTTP/HTTPS from internet (0.0.0.0/0)
- EC2 instances only accept traffic from ALB security group
- No direct internet access to EC2 instances
- Principle of least privilege

### Monitoring

- CloudWatch alarm for high CPU utilization (>80%)
- CloudWatch alarm for unhealthy hosts
- Detailed monitoring enabled on all instances
- Auto Scaling metrics published to CloudWatch

### Session Persistence

- Sticky sessions enabled with 24-hour cookie duration
- Ensures user sessions remain on same instance

### Path-Based Routing

- Listener rule configured for /api/v1/* paths
- Supports API versioning for future expansion

## Cleanup

To destroy all resources:

```bash
terraform destroy -var="environment_suffix=dev"
```

## Cost Optimization

- Uses t3.micro instances (cost-effective)
- Auto Scaling ensures minimum resources during low traffic
- No NAT Gateways (all instances in public subnets)
- No additional data transfer costs

## Troubleshooting

### Instances Not Healthy

Check security group rules and health check configuration:

```bash
aws elbv2 describe-target-health --target-group-arn $(terraform output -raw target_group_arn)
```

### Auto Scaling Not Working

Verify scaling policy and CloudWatch metrics:

```bash
aws autoscaling describe-policies --auto-scaling-group-name $(terraform output -raw autoscaling_group_name)
```

### Connection Issues

Ensure ALB is active and has healthy targets:

```bash
aws elbv2 describe-load-balancers --load-balancer-arns $(terraform output -raw alb_arn)
```

## Notes

- All resources are tagged with `environment_suffix` for easy identification
- Deletion protection is disabled for easy cleanup
- Latest Amazon Linux 2 AMI is automatically selected
- User data script installs and configures Apache httpd
- Health check endpoint returns "OK" at /health
