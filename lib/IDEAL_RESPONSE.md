# Ideal Response: Containerized Web Application with Pulumi TypeScript

This document provides the ideal implementation for deploying a containerized web application on AWS ECS Fargate using Pulumi with TypeScript.

## Project Structure

```
.
├── index.ts                    # Main entry point
├── lib/
│   ├── network-stack.ts        # VPC, subnets, security groups
│   ├── ecs-cluster-stack.ts    # ECS cluster, ECR repos, IAM roles
│   ├── alb-stack.ts            # ALB, target groups, listeners
│   ├── ecs-service-stack.ts    # ECS services with auto-scaling
│   ├── route53-stack.ts        # DNS configuration
│   └── tap-stack.ts            # Main stack orchestrator
└── Pulumi.yaml                 # Pulumi project configuration
```

## Implementation

### index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

// Get environment suffix from Pulumi config or environment
const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Create the main stack
const tapStack = new TapStack('TapStack', {
  environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'Pulumi',
    Project: 'WebApp',
  },
});

// Export stack outputs
export const vpcId = tapStack.networkStack.vpc.id;
export const publicSubnetIds = tapStack.networkStack.publicSubnets.map(s => s.id);
export const privateSubnetIds = tapStack.networkStack.privateSubnets.map(s => s.id);
export const albDnsName = tapStack.albStack.alb.dnsName;
export const albArn = tapStack.albStack.alb.arn;
export const ecsClusterName = tapStack.ecsClusterStack.cluster.name;
export const ecsClusterArn = tapStack.ecsClusterStack.cluster.arn;
export const frontendServiceName = tapStack.frontendService.service.name;
export const backendServiceName = tapStack.backendService.service.name;
```

### lib/network-stack.ts

Key features:
- VPC with public and private subnets across 2 AZs
- Internet Gateway for public subnet internet access
- NAT Gateway for private subnet internet access
- Security groups with least privilege (ALB and ECS)
- Proper routing tables for public and private subnets

```typescript
export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;

  // Implementation creates VPC, subnets, IGW, NAT, security groups
}
```

### lib/ecs-cluster-stack.ts

Key features:
- ECS cluster with container insights enabled
- ECR repositories for frontend and backend
- IAM execution role for pulling images and writing logs
- IAM task role for application permissions
- Proper IAM policies following least privilege

```typescript
export class EcsClusterStack extends pulumi.ComponentResource {
  public readonly cluster: aws.ecs.Cluster;
  public readonly ecrRepositoryFrontend: aws.ecr.Repository;
  public readonly ecrRepositoryBackend: aws.ecr.Repository;
  public readonly executionRole: aws.iam.Role;
  public readonly taskRole: aws.iam.Role;

  // Implementation creates cluster, repos, and IAM roles
}
```

### lib/alb-stack.ts

Key features:
- Application Load Balancer in public subnets
- Target groups for frontend (port 3000) and backend (port 8080)
- HTTP listener (or HTTPS with certificate)
- Listener rules for path-based routing (/api/* → backend, /* → frontend)
- Health checks with 30-second intervals
- Proper dependency ordering (ALB → Listeners → Rules)

```typescript
export class AlbStack extends pulumi.ComponentResource {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly httpsListener: aws.lb.Listener;
  public readonly frontendTargetGroup: aws.lb.TargetGroup;
  public readonly backendTargetGroup: aws.lb.TargetGroup;

  // Implementation creates ALB, target groups, and listeners
  // Ensures target groups are associated before ECS services use them
}
```

### lib/ecs-service-stack.ts

Key features:
- ECS Fargate service with proper network configuration
- Task definition with container configuration (CPU: 512, Memory: 1024)
- CloudWatch log group with 7-day retention
- Auto-scaling target with Application Auto Scaling
- Scaling policies based on CPU/memory utilization
- Load balancer attachment to target group
- Rolling deployment (200% max, 100% min healthy)
- Proper dependency ordering (ensures listener exists before service)

```typescript
export class EcsServiceStack extends pulumi.ComponentResource {
  public readonly service: aws.ecs.Service;
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly autoScalingTarget: aws.appautoscaling.Target;
  public readonly scalingPolicy: aws.appautoscaling.Policy;

  // Implementation creates complete service with auto-scaling
}
```

### lib/route53-stack.ts

Key features:
- Route53 hosted zone for domain
- A record with alias to ALB
- Proper DNS configuration

```typescript
export class Route53Stack extends pulumi.ComponentResource {
  public readonly zone: aws.route53.Zone;
  public readonly record: aws.route53.Record;

  // Implementation creates DNS records
}
```

### lib/tap-stack.ts

Key features:
- Orchestrates all sub-stacks
- Configures AWS provider for eu-west-2 region
- Passes environment suffix to all resources
- Ensures proper dependency ordering:
  1. Network Stack
  2. ECS Cluster Stack
  3. ALB Stack (depends on Network)
  4. ECS Services (depend on ALB listener creation)
  5. Route53 Stack (depends on ALB)
- Applies consistent tagging

```typescript
export class TapStack extends pulumi.ComponentResource {
  public readonly networkStack: NetworkStack;
  public readonly ecsClusterStack: EcsClusterStack;
  public readonly albStack: AlbStack;
  public readonly frontendService: EcsServiceStack;
  public readonly backendService: EcsServiceStack;
  public readonly route53Stack: Route53Stack;

  // Implementation orchestrates all infrastructure
}
```

## Key Implementation Details

### 1. Resource Naming
All resources include `environmentSuffix` for uniqueness:
- Pattern: `{resource-name}-{environment-suffix}`
- Example: `webapp-alb-alb-pr5406`
- ALB and target group names limited to 32 characters

### 2. Dependency Management
Critical dependency ordering:
```typescript
// ALB listeners must exist before ECS services
frontendService = new EcsServiceStack(..., {
  ...resourceOpts,
  dependsOn: [this.albStack.httpsListener]
});
```

### 3. Region Configuration
```typescript
const awsProvider = new aws.Provider('aws-provider', {
  region: 'eu-west-2',
}, { parent: this });
```

### 4. Network Architecture
- Public subnets (10.0.1.0/24, 10.0.2.0/24) for ALB
- Private subnets (10.0.10.0/24, 10.0.11.0/24) for ECS tasks
- NAT Gateway for private subnet internet access
- Proper security group rules

### 5. Auto-Scaling Configuration
Frontend:
- Desired: 2, Min: 2, Max: 10
- Target tracking on CPU 70%

Backend:
- Desired: 3, Min: 3, Max: 15
- Target tracking on CPU 70%

### 6. Health Checks
Both target groups:
- Path: `/` (frontend), `/api/health` (backend)
- Protocol: HTTP
- Interval: 30 seconds
- Timeout: 5 seconds
- Healthy threshold: 2
- Unhealthy threshold: 3

### 7. Container Configuration
```typescript
{
  name: serviceName,
  image: ecrRepositoryUrl,
  cpu: 512,
  memory: 1024,
  portMappings: [{ containerPort, protocol: 'tcp' }],
  environment: containerEnvironment,
  logConfiguration: { ... }
}
```

### 8. IAM Roles
Execution Role (minimal permissions):
- ECR image pull
- CloudWatch log writing
- Secrets Manager (if needed)

Task Role:
- Application-specific AWS service access

### 9. Certificate Handling
For production:
```typescript
if (args.certificateArn) {
  // Create HTTPS listener
} else {
  // Use HTTP listener for testing
}
```

## Testing

### Unit Tests
- Mock Pulumi resources
- Test resource creation
- Validate configuration
- Verify dependencies

### Integration Tests
- Deploy to AWS
- Verify service connectivity
- Test auto-scaling
- Validate DNS resolution

## Deployment

```bash
# Install dependencies
npm ci

# Build
npm run build

# Deploy
pulumi up --yes --refresh --stack TapStack${ENVIRONMENT_SUFFIX}
```

## Outputs

The stack exports:
- `vpcId`: VPC identifier
- `albDnsName`: Load balancer DNS name
- `ecsClusterArn`: ECS cluster ARN
- `frontendServiceName`: Frontend service name
- `backendServiceName`: Backend service name

## Best Practices Demonstrated

1. **Modular Design**: Separate stacks for concerns
2. **Type Safety**: Full TypeScript types
3. **Dependency Management**: Explicit `dependsOn`
4. **Resource Naming**: Consistent with environment suffix
5. **Security**: Least privilege, private subnets
6. **High Availability**: Multi-AZ deployment
7. **Observability**: CloudWatch logs with retention
8. **Scalability**: Auto-scaling configuration
9. **Maintainability**: Clear code structure
10. **Testability**: Unit and integration tests

## Common Issues and Solutions

### Issue 1: Target Group Not Associated
**Problem**: ECS service fails with "target group does not have an associated load balancer"

**Solution**: Ensure ECS services depend on listener creation:
```typescript
{ dependsOn: [this.albStack.httpsListener] }
```

### Issue 2: Certificate Not Found
**Problem**: HTTPS listener fails with certificate not found

**Solution**: Make certificate optional, use HTTP for testing:
```typescript
if (args.certificateArn) {
  // HTTPS listener
} else {
  // HTTP listener
}
```

### Issue 3: Type Errors with Pulumi Outputs
**Problem**: `.split()` not found on Pulumi Output type

**Solution**: Use proper type checking:
```typescript
pulumi.output(arn).apply((a) => {
  if (typeof a === 'string') {
    return a.split('/').pop()!;
  }
  return String(a).split('/').pop()!;
});
```
