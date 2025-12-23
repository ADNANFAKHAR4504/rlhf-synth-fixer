# Optimized ECS Deployment

This infrastructure implements an optimized ECS deployment with proper resource allocation, autoscaling, monitoring, and security best practices.

## Architecture Overview

### Components

1. **ECS Cluster** - Fargate cluster with Container Insights enabled
2. **ECS Task Definition** - Optimized CPU (512 units) and memory (1GB initial)
3. **ECS Service** - Runs tasks with autoscaling capabilities
4. **Application Auto Scaling** - Scales tasks between 1-4 based on memory utilization
5. **CloudWatch Alarms** - CPU (>80%) and Memory (>90%) alerts
6. **IAM Roles** - Least privilege permissions (s3:GetObject only)
7. **Security Group** - Network security for ECS tasks

### Resource Optimization

- **CPU**: Reduced from 2048 to 512 units (75% reduction)
- **Memory**: Autoscales between 1GB and 4GB based on actual usage
- **Cost Savings**: Significant reduction in compute costs while maintaining performance

### Security Improvements

- IAM roles follow least privilege principle
- S3 access limited to GetObject (no s3:* permissions)
- Network security with proper security groups
- CloudWatch logging for audit trails

### Monitoring and Alerting

- Container Insights enabled for enhanced metrics
- CPU utilization alarm at 80% threshold
- Memory utilization alarm at 90% threshold
- Comprehensive CloudWatch logging

## Configuration

### Required Parameters

- `environmentSuffix` - Environment identifier (dev, staging, prod)
- `containerImageUri` - Docker image URI (parameterized, not hard-coded)
- `s3BucketName` - S3 bucket for application data access
- `vpcId` - VPC ID for deployment (optional, uses default VPC)
- `subnetIds` - Subnet IDs for tasks (optional, uses default subnets)
- `desiredCount` - Initial number of tasks (optional, default: 2)

### Example Usage

```typescript
import { TapStack } from './lib/tap-stack';

new TapStack('my-ecs-stack', {
  environmentSuffix: 'dev',
  containerImageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:latest',
  s3BucketName: 'my-data-bucket',
  desiredCount: 2,
});
```

## Deployment

### Prerequisites

- Node.js 18+
- Pulumi CLI
- AWS credentials configured

### Installation

```bash
npm install
```

### Deploy

```bash
pulumi up
```

### Configuration

Set stack configuration:

```bash
pulumi config set aws:region us-east-1
pulumi config set containerImageUri 123456789012.dkr.ecr.us-east-1.amazonaws.com/app:latest
pulumi config set s3BucketName my-data-bucket
```

## Best Practices Implemented

1. **No Hard-Coded Values** - All configuration parameterized
2. **Proper Resource Naming** - Uses environmentSuffix consistently
3. **Resource Tagging** - All resources tagged for cost allocation
4. **Destroyable Resources** - No RETAIN policies, easy cleanup
5. **Container Insights** - Enhanced monitoring enabled
6. **Least Privilege IAM** - Minimal permissions granted
7. **CloudWatch Logging** - Comprehensive logging with 7-day retention
8. **Autoscaling** - Memory-based autoscaling with proper cooldowns

## Testing

```bash
npm test
```

## Cleanup

```bash
pulumi destroy
```

All resources will be properly destroyed with no manual cleanup required.

## Cost Optimization

This optimized implementation provides:

- 75% reduction in CPU allocation (2048 → 512)
- Dynamic memory scaling (1-4GB) based on actual usage
- Efficient Fargate Spot pricing compatibility
- Proper resource tagging for cost tracking

## Monitoring

Access metrics and alarms in CloudWatch:

- CPU Utilization: Alert at 80%
- Memory Utilization: Alert at 90%
- Container Insights: Enhanced metrics and logs
- Log Group: /ecs/tap-{environmentSuffix}
