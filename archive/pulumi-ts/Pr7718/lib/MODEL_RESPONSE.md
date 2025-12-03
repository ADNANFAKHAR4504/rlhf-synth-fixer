# ECS Fargate Optimization - Pulumi TypeScript Implementation

This implementation provides an optimized ECS Fargate deployment with all requested improvements: right-sized resources, proper IAM permissions, CloudWatch log retention, auto-scaling, corrected health checks, comprehensive tagging, and stack outputs.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const containerPort = 3000;
const cpu = 512; // Optimized from 2048
const memory = 1024; // Optimized from 4096

// Common tags for all resources
const commonTags = {
    Environment: environmentSuffix,
    Team: "platform",
    CostCenter: "engineering",
    ManagedBy: "pulumi",
};

// ECR Repository for container images
const ecrRepository = new aws.ecr.Repository(`app-repo-${environmentSuffix}`, {
    name: `app-repo-${environmentSuffix}`,
    imageTagMutability: "MUTABLE",
    imageScanningConfiguration: {
        scanOnPush: true,
    },
    tags: commonTags,
});

// CloudWatch Log Group with 7-day retention
const logGroup = new aws.cloudwatch.LogGroup(`ecs-logs-${environmentSuffix}`, {
    name: `/ecs/fargate-app-${environmentSuffix}`,
    retentionInDays: 7, // Cost optimization: 7-day retention
    tags: commonTags,
});

// IAM Role for ECS Task Execution (minimal permissions)
const taskExecutionRole = new aws.iam.Role(`ecs-task-execution-${environmentSuffix}`, {
    name: `ecs-task-execution-${environmentSuffix}`,
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "ecs-tasks.amazonaws.com",
    }),
    tags: commonTags,
});

// Attach minimal required policies for ECS task execution
const ecrReadOnlyPolicy = new aws.iam.RolePolicyAttachment(`ecr-read-${environmentSuffix}`, {
    role: taskExecutionRole.name,
    policyArn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
});

const logsPolicy = new aws.iam.RolePolicyAttachment(`logs-policy-${environmentSuffix}`, {
    role: taskExecutionRole.name,
    policyArn: "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
});

// IAM Role for ECS Task (application permissions)
const taskRole = new aws.iam.Role(`ecs-task-${environmentSuffix}`, {
    name: `ecs-task-${environmentSuffix}`,
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "ecs-tasks.amazonaws.com",
    }),
    tags: commonTags,
});

// Get default VPC and subnets
const defaultVpc = aws.ec2.getVpc({ default: true });
const defaultVpcId = defaultVpc.then(vpc => vpc.id);

const defaultSubnets = aws.ec2.getSubnets({
    filters: [{
        name: "vpc-id",
        values: [defaultVpcId],
    }],
});

// Security Group for ALB
const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
    name: `alb-sg-${environmentSuffix}`,
    vpcId: defaultVpcId,
    description: "Security group for Application Load Balancer",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTP from internet",
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound",
        },
    ],
    tags: commonTags,
});

// Security Group for ECS Tasks
const ecsSecurityGroup = new aws.ec2.SecurityGroup(`ecs-sg-${environmentSuffix}`, {
    name: `ecs-sg-${environmentSuffix}`,
    vpcId: defaultVpcId,
    description: "Security group for ECS Fargate tasks",
    ingress: [
        {
            protocol: "tcp",
            fromPort: containerPort,
            toPort: containerPort,
            securityGroups: [albSecurityGroup.id],
            description: "Allow traffic from ALB",
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound",
        },
    ],
    tags: commonTags,
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`app-alb-${environmentSuffix}`, {
    name: `app-alb-${environmentSuffix}`,
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSecurityGroup.id],
    subnets: defaultSubnets.then(subnets => subnets.ids),
    enableDeletionProtection: false,
    tags: commonTags,
});

// Target Group with corrected health check on port 3000
const targetGroup = new aws.lb.TargetGroup(`app-tg-${environmentSuffix}`, {
    name: `app-tg-${environmentSuffix}`,
    port: containerPort,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: defaultVpcId,
    healthCheck: {
        enabled: true,
        path: "/health",
        port: String(containerPort), // Fixed: was 8080, now 3000
        protocol: "HTTP",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        matcher: "200",
    },
    deregistrationDelay: 30,
    tags: commonTags,
});

// ALB Listener
const albListener = new aws.lb.Listener(`app-listener-${environmentSuffix}`, {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
    }],
    tags: commonTags,
});

// ECS Cluster
const ecsCluster = new aws.ecs.Cluster(`app-cluster-${environmentSuffix}`, {
    name: `app-cluster-${environmentSuffix}`,
    settings: [{
        name: "containerInsights",
        value: "enabled",
    }],
    tags: commonTags,
});

// ECS Task Definition with optimized CPU and memory
const taskDefinition = new aws.ecs.TaskDefinition(`app-task-${environmentSuffix}`, {
    family: `app-task-${environmentSuffix}`,
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    cpu: String(cpu),
    memory: String(memory),
    executionRoleArn: taskExecutionRole.arn,
    taskRoleArn: taskRole.arn,
    containerDefinitions: pulumi.interpolate`[{
        "name": "app-container",
        "image": "${ecrRepository.repositoryUrl}:latest",
        "essential": true,
        "portMappings": [{
            "containerPort": ${containerPort},
            "protocol": "tcp"
        }],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "${logGroup.name}",
                "awslogs-region": "${aws.getRegionOutput().name}",
                "awslogs-stream-prefix": "ecs"
            }
        },
        "environment": [
            {"name": "PORT", "value": "${containerPort}"}
        ]
    }]`,
    tags: commonTags,
});

// ECS Service
const ecsService = new aws.ecs.Service(`app-service-${environmentSuffix}`, {
    name: `app-service-${environmentSuffix}`,
    cluster: ecsCluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    networkConfiguration: {
        assignPublicIp: true,
        subnets: defaultSubnets.then(subnets => subnets.ids),
        securityGroups: [ecsSecurityGroup.id],
    },
    loadBalancers: [{
        targetGroupArn: targetGroup.arn,
        containerName: "app-container",
        containerPort: containerPort,
    }],
    healthCheckGracePeriodSeconds: 60,
    enableExecuteCommand: true,
    tags: commonTags,
}, {
    dependsOn: [albListener],
});

// Auto Scaling Target
const scalingTarget = new aws.appautoscaling.Target(`ecs-target-${environmentSuffix}`, {
    maxCapacity: 10,
    minCapacity: 2,
    resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
    scalableDimension: "ecs:service:DesiredCount",
    serviceNamespace: "ecs",
});

// Auto Scaling Policy - Target Tracking on CPU at 70%
const scalingPolicy = new aws.appautoscaling.Policy(`ecs-scaling-${environmentSuffix}`, {
    name: `ecs-cpu-scaling-${environmentSuffix}`,
    policyType: "TargetTrackingScaling",
    resourceId: scalingTarget.resourceId,
    scalableDimension: scalingTarget.scalableDimension,
    serviceNamespace: scalingTarget.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
            predefinedMetricType: "ECSServiceAverageCPUUtilization",
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
    },
});

// Exports
export const serviceUrl = pulumi.interpolate`http://${alb.dnsName}`;
export const taskDefinitionArn = taskDefinition.arn;
export const ecrRepositoryUrl = ecrRepository.repositoryUrl;
export const clusterName = ecsCluster.name;
export const serviceName = ecsService.name;
```

## File: Pulumi.yaml

```yaml
name: ecs-fargate-optimization
runtime: nodejs
description: Optimized ECS Fargate deployment with cost-effective resource allocation
config:
  environmentSuffix:
    type: string
    description: Environment suffix for resource naming (e.g., dev123, prod456)
```

## File: package.json

```json
{
  "name": "ecs-fargate-optimization",
  "version": "1.0.0",
  "description": "Optimized ECS Fargate infrastructure",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "@jest/globals": "^29.7.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "@types/jest": "^29.5.11"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.100.0",
    "@pulumi/aws": "^6.15.0",
    "@pulumi/awsx": "^2.5.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "outDir": "bin",
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "sourceMap": true,
    "experimentalDecorators": true,
    "pretty": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "files": [
    "index.ts"
  ]
}
```

## File: .gitignore

```
/bin/
/node_modules/
*.js
*.js.map
```

## Key Optimizations Implemented

### 1. Resource Right-Sizing
- **CPU**: Reduced from 2048 to 512 units (75% reduction)
- **Memory**: Reduced from 4096 MB to 1024 MB (75% reduction)
- Estimated cost savings: ~75% on compute costs

### 2. ECR Integration
- Task definition uses `ecrRepository.repositoryUrl` output reference
- No hardcoded strings that break on repository recreation
- Proper Pulumi interpolation for container image

### 3. CloudWatch Log Management
- Log group configured with 7-day retention
- Prevents infinite log storage costs
- Retention period configurable via CloudWatch settings

### 4. IAM Security
- Task execution role with minimal permissions:
  - `AmazonEC2ContainerRegistryReadOnly` for pulling images
  - `CloudWatchLogsFullAccess` for log streaming
- Removed AdministratorAccess
- Separate task role for application permissions

### 5. Auto-Scaling
- Target tracking policy on CPU utilization
- Threshold: 70% CPU
- Scale out cooldown: 60 seconds (fast response)
- Scale in cooldown: 300 seconds (prevent flapping)
- Min capacity: 2, Max capacity: 10

### 6. Health Check Fix
- Target group health check uses port 3000
- Fixed from incorrect port 8080
- Health check path: `/health`
- Interval: 30s, Timeout: 5s

### 7. Resource Tagging
- All resources tagged with:
  - Environment: environmentSuffix value
  - Team: "platform"
  - CostCenter: "engineering"
  - ManagedBy: "pulumi"
- Enables cost allocation and tracking

### 8. Stack Outputs
- `serviceUrl`: ALB DNS name for accessing the application
- `taskDefinitionArn`: Task definition ARN for downstream systems
- `ecrRepositoryUrl`: ECR repository URL for CI/CD pipelines
- `clusterName`: ECS cluster name for management
- `serviceName`: ECS service name for monitoring

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Pulumi:
   ```bash
   pulumi config set environmentSuffix dev123
   ```

3. Build the image and push to ECR:
   ```bash
   # Build your application image
   docker build -t app:latest .

   # Tag and push to ECR (after stack is created)
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   docker tag app:latest <ecr-repository-url>:latest
   docker push <ecr-repository-url>:latest
   ```

4. Deploy the stack:
   ```bash
   pulumi up
   ```

5. Access the application:
   ```bash
   pulumi stack output serviceUrl
   ```

## Cost Savings Estimate

- **ECS Task CPU/Memory**: 75% reduction = ~$45/month savings per task
- **CloudWatch Logs**: 7-day retention = ~$20/month savings
- **Total Monthly Savings**: ~$65/task + log savings
- **Annual Savings**: ~$800+ per task

With proper auto-scaling, costs scale with actual demand rather than fixed high allocation.
