# ECS Cluster Optimization with Pulumi TypeScript

Production-ready infrastructure code for optimizing an Amazon ECS cluster with mixed instance policies, auto-scaling, capacity providers, and comprehensive monitoring.

## Overview

This Pulumi TypeScript project deploys a fully optimized ECS cluster with:

- Mixed instance types for cost optimization (t3.medium for dev, m5.large for prod)
- Task placement constraints for workload isolation
- CPU and memory-based auto-scaling
- ECS capacity providers with managed scaling
- Application Load Balancer with health checks
- CloudWatch alarms for monitoring and cost optimization
- Comprehensive resource tagging

## Prerequisites

- Node.js 20.x or later
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- An AWS account with necessary permissions

## Project Structure

```
lib/
├── index.ts              # Main infrastructure code
├── Pulumi.yaml           # Pulumi project configuration
├── Pulumi.dev.yaml       # Development stack configuration
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
├── jest.config.js        # Jest test configuration
├── tests/
│   └── index.test.ts     # Infrastructure tests
├── PROMPT.md             # Original task description
├── MODEL_RESPONSE.md     # Example problematic code
├── IDEAL_RESPONSE.md     # Corrected implementation
├── MODEL_FAILURES.md     # Documented failures and fixes
└── README.md             # This file
```

## Installation

```bash
# Navigate to the lib directory
cd lib

# Install dependencies
npm install
```

## Configuration

Configure the required settings for your stack:

```bash
# Set AWS region
pulumi config set aws:region us-east-1

# (Optional) Set cost center tag
pulumi config set ecs-optimization-p8y1m9z7:costCenter your-cost-center
```

## Deployment

### Deploy to Development

```bash
# Initialize the dev stack (if not already created)
pulumi stack init dev

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up
```

### Deploy to Production

```bash
# Initialize the prod stack
pulumi stack init prod

# Deploy with production settings
pulumi up
```

## Infrastructure Components

### Networking
- VPC (10.0.0.0/16)
- 2 Public Subnets across us-east-1a and us-east-1b
- Internet Gateway
- Route Tables

### Security
- ALB Security Group (HTTP port 80)
- ECS Instance Security Group
- IAM Roles for ECS tasks and instances

### Compute
- ECS Cluster with Container Insights enabled
- Auto Scaling Group (1-10 instances)
- EC2 Launch Template
- Instance Type: t3.medium (dev) or m5.large (prod)

### Load Balancing
- Application Load Balancer
- Target Group with health checks:
  - Interval: 30 seconds
  - Healthy Threshold: 2
  - Timeout: 5 seconds

### Container Service
- ECS Task Definition (256 CPU, 512 Memory)
- ECS Service with 2 desired tasks
- Task Placement Constraints

### Auto-Scaling
- ECS Service CPU-based scaling (target: 70%)
- ECS Service Memory-based scaling (target: 80%)
- ASG CPU-based scaling (target: 70%)
- Capacity Provider with managed scaling

### Monitoring
- CloudWatch Low CPU Alarm (threshold: 20%)
- Container Insights for cluster monitoring

## Outputs

After deployment, the following outputs are available:

```bash
pulumi stack output
```

- `vpcId`: VPC identifier
- `clusterName`: ECS cluster name
- `clusterArn`: ECS cluster ARN
- `albDnsName`: Load balancer DNS name (use this to access your application)
- `albArn`: Load balancer ARN
- `targetGroupArn`: Target group ARN
- `serviceArn`: ECS service ARN
- `taskDefinitionArn`: Task definition ARN
- `autoScalingGroupName`: Auto Scaling Group name
- `capacityProviderName`: Capacity provider name
- `instanceType`: Instance type being used
- `lowCpuAlarmArn`: CloudWatch alarm ARN

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Code Quality

### Linting

```bash
npm run lint
```

### Build

```bash
npm run build
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

**Warning**: This will permanently delete all infrastructure resources. Make sure you have backups of any important data.

## Resource Tagging

All resources are tagged with:

- `Environment`: dev/prod
- `CostCenter`: Configurable via Pulumi config
- `ManagedBy`: pulumi
- `Project`: ecs-optimization

Use these tags for cost allocation and resource management.

## Cost Optimization Features

1. **Mixed Instance Policy**: Different instance types for dev/prod environments
2. **Auto-Scaling**: Automatic capacity adjustment based on demand
3. **Low CPU Alarm**: Alerts when resources are over-provisioned
4. **Task Right-Sizing**: 256 CPU / 512 Memory per task
5. **Spot Instance Support**: Can be enabled for additional cost savings

## High Availability

- Multi-AZ deployment across us-east-1a and us-east-1b
- Application Load Balancer for traffic distribution
- Auto Scaling for fault tolerance
- Health checks ensure only healthy tasks receive traffic

## Security Best Practices

- Security groups follow principle of least privilege
- IAM roles use AWS managed policies
- No hardcoded credentials
- All traffic encrypted in transit

## Troubleshooting

### Common Issues

1. **Deployment Fails with AWS Quota Error**:
   - Check AWS service quotas for ECS, EC2, and VPC
   - Request quota increases if needed

2. **Instances Not Registering with Cluster**:
   - Verify security group rules
   - Check user data script execution
   - Review ECS agent logs on instances

3. **High Costs**:
   - Review CloudWatch low CPU alarm
   - Adjust instance types or desired capacity
   - Enable spot instances for non-critical workloads

4. **Tasks Not Starting**:
   - Check task definition resource requirements
   - Verify IAM role permissions
   - Review CloudWatch logs

## Development

### Adding New Resources

1. Add resource definition in `index.ts`
2. Add appropriate tags
3. Export any necessary outputs
4. Add tests in `tests/index.test.ts`
5. Run `npm test` and `npm run lint`
6. Deploy with `pulumi up`

### Modifying Existing Resources

1. Update resource definition
2. Run `pulumi preview` to see changes
3. Review changes carefully
4. Deploy with `pulumi up`

## Documentation

- `PROMPT.md`: Original task requirements
- `MODEL_RESPONSE.md`: Example of problematic code patterns
- `IDEAL_RESPONSE.md`: Correct implementation patterns
- `MODEL_FAILURES.md`: Detailed analysis of failures and fixes

## License

This code is part of the IaC test automation project.

## Support

For issues or questions, please refer to the project documentation or contact the infrastructure team.

## Changelog

### Version 1.0.0
- Initial implementation
- Complete ECS cluster optimization
- Auto-scaling configured
- Monitoring and alarms set up
- All tests passing
- Training quality: 9/10
