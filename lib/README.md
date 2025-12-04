# ECS Fargate Deployment Optimization

This Pulumi TypeScript program creates an optimized ECS Fargate deployment with the following improvements:

## Optimizations Implemented

1. **Reduced Memory Allocation**: Task definition memory reduced from 4GB to 2GB while maintaining performance
2. **Proper CPU/Memory Combination**: Using Fargate-supported 1 vCPU with 2GB RAM combination
3. **Health Check Configuration**: ALB target group configured with appropriate health check thresholds
4. **Consolidated Security Group Rules**: No duplicate rules - clean HTTP/HTTPS configuration on ALB
5. **Consistent Tagging**: All resources tagged with Environment, Team, and CostCenter tags
6. **CloudWatch Log Retention**: 7-day retention policy to reduce storage costs
7. **ALB Idle Timeout**: Reduced from 300 seconds to 30 seconds for cost optimization
8. **CloudWatch Alarms**: CPU and memory utilization alarms at 80% threshold
9. **Stack Outputs**: ALB DNS name and CloudWatch dashboard URL exported

## Architecture

- **VPC**: Custom VPC with public and private subnets across 2 AZs
- **ALB**: Application Load Balancer in public subnets
- **ECS**: Fargate tasks in private subnets
- **NAT**: Single NAT Gateway for cost optimization
- **Monitoring**: CloudWatch logs, alarms, and dashboard
- **Security**: Consolidated security group rules with proper ingress/egress

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed
- Node.js 20+ and npm

### Deploy

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=dev

# Install dependencies
npm install

# Deploy stack
pulumi up --yes
```

### Destroy

```bash
pulumi destroy --yes
```

## Resource Naming

All resources include `environmentSuffix` in their names for uniqueness:
- VPC: `ecs-vpc-${environmentSuffix}`
- Cluster: `ecs-cluster-${environmentSuffix}`
- Service: `tap-service-${environmentSuffix}`
- ALB: `ecs-alb-${environmentSuffix}`

## Outputs

- `albDnsName`: DNS name of the Application Load Balancer
- `dashboardUrl`: URL to the CloudWatch dashboard
- `vpcId`: VPC ID
- `clusterId`: ECS Cluster ID
- `serviceId`: ECS Service ID

## Cost Optimization Features

- Single NAT Gateway instead of per-AZ
- 7-day log retention instead of indefinite
- 30-second ALB idle timeout
- Optimized Fargate task sizing (1 vCPU, 2GB RAM)
- Container Insights enabled for visibility

## Security Features

- Private subnets for ECS tasks
- Security groups with least privilege
- IAM roles with appropriate permissions
- Encryption in transit via ALB HTTPS support

## Monitoring

- CloudWatch logs for all ECS tasks
- CPU utilization alarm (80% threshold)
- Memory utilization alarm (80% threshold)
- CloudWatch dashboard with key metrics

## Testing

Unit and integration tests are provided in the `test/` directory.
