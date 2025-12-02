# ECS Fargate Deployment - Optimized Implementation

This is the corrected and optimized implementation addressing all 8 requirements.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const containerMemory = config.get("containerMemory") || "512";
const containerCpu = config.get("containerCpu") || "256";

// Common tags for cost allocation
const commonTags = {
    Environment: environmentSuffix,
    Team: config.get("team") || "platform",
    Project: config.get("project") || "ecs-optimization",
};

// VPC and Networking
const vpc = new aws.ec2.Vpc(`app-vpc-${environmentSuffix}`, {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        ...commonTags,
        Name: `app-vpc-${environmentSuffix}`,
    },
});

const subnet1 = new aws.ec2.Subnet(`subnet-1-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "us-east-1a",
    mapPublicIpOnLaunch: true,
    tags: {
        ...commonTags,
        Name: `subnet-1-${environmentSuffix}`,
    },
});

const subnet2 = new aws.ec2.Subnet(`subnet-2-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: "us-east-1b",
    mapPublicIpOnLaunch: true,
    tags: {
        ...commonTags,
        Name: `subnet-2-${environmentSuffix}`,
    },
});

const igw = new aws.ec2.InternetGateway(`igw-${environmentSuffix}`, {
    vpcId: vpc.id,
    tags: {
        ...commonTags,
        Name: `igw-${environmentSuffix}`,
    },
});

const routeTable = new aws.ec2.RouteTable(`route-table-${environmentSuffix}`, {
    vpcId: vpc.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
    }],
    tags: {
        ...commonTags,
        Name: `route-table-${environmentSuffix}`,
    },
});

new aws.ec2.RouteTableAssociation(`rta-1-${environmentSuffix}`, {
    subnetId: subnet1.id,
    routeTableId: routeTable.id,
});

new aws.ec2.RouteTableAssociation(`rta-2-${environmentSuffix}`, {
    subnetId: subnet2.id,
    routeTableId: routeTable.id,
});

// Security Group for ALB
const albSg = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    description: "Security group for Application Load Balancer",
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow HTTP from internet",
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow all outbound",
    }],
    tags: {
        ...commonTags,
        Name: `alb-sg-${environmentSuffix}`,
    },
});

// Security Group for ECS
const ecsSg = new aws.ec2.SecurityGroup(`ecs-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    description: "Security group for ECS tasks",
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        securityGroups: [albSg.id],
        description: "Allow HTTP from ALB",
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow all outbound",
    }],
    tags: {
        ...commonTags,
        Name: `ecs-sg-${environmentSuffix}`,
    },
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`app-alb-${environmentSuffix}`, {
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSg.id],
    subnets: [subnet1.id, subnet2.id],
    tags: {
        ...commonTags,
        Name: `app-alb-${environmentSuffix}`,
    },
});

// Single Target Group with Health Check Configuration
const targetGroup = new aws.lb.TargetGroup(`app-tg-${environmentSuffix}`, {
    port: 80,
    protocol: "HTTP",
    vpcId: vpc.id,
    targetType: "ip",
    healthCheck: {
        enabled: true,
        path: "/",
        protocol: "HTTP",
        port: "80",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: "200-299",
    },
    tags: {
        ...commonTags,
        Name: `app-tg-${environmentSuffix}`,
    },
});

const listener = new aws.lb.Listener(`listener-${environmentSuffix}`, {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
    }],
    tags: {
        ...commonTags,
        Name: `listener-${environmentSuffix}`,
    },
});

// Single IAM Role - Task Execution Role
const taskExecutionRole = new aws.iam.Role(`task-execution-role-${environmentSuffix}`, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "ecs-tasks.amazonaws.com",
            },
        }],
    }),
    tags: {
        ...commonTags,
        Name: `task-execution-role-${environmentSuffix}`,
    },
});

new aws.iam.RolePolicyAttachment(`task-execution-policy-${environmentSuffix}`, {
    role: taskExecutionRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

// CloudWatch Log Group with 7-day retention
const logGroup = new aws.cloudwatch.LogGroup(`app-logs-${environmentSuffix}`, {
    name: `/ecs/app-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
        ...commonTags,
        Name: `app-logs-${environmentSuffix}`,
    },
});

// ECS Cluster
const cluster = new aws.ecs.Cluster(`app-cluster-${environmentSuffix}`, {
    tags: {
        ...commonTags,
        Name: `app-cluster-${environmentSuffix}`,
    },
});

// Task Definition
const taskDefinition = new aws.ecs.TaskDefinition(`app-task-${environmentSuffix}`, {
    family: `app-${environmentSuffix}`,
    cpu: containerCpu,
    memory: containerMemory,
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: taskExecutionRole.arn,
    containerDefinitions: pulumi.interpolate`[{
        "name": "app",
        "image": "nginx:latest",
        "memory": ${parseInt(containerMemory)},
        "cpu": ${parseInt(containerCpu)},
        "essential": true,
        "portMappings": [{
            "containerPort": 80,
            "protocol": "tcp"
        }],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "${logGroup.name}",
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "ecs"
            }
        }
    }]`,
    tags: {
        ...commonTags,
        Name: `app-task-${environmentSuffix}`,
    },
});

// ECS Service
const service = new aws.ecs.Service(`app-service-${environmentSuffix}`, {
    cluster: cluster.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    taskDefinition: taskDefinition.arn,
    networkConfiguration: {
        assignPublicIp: true,
        subnets: [subnet1.id, subnet2.id],
        securityGroups: [ecsSg.id],
    },
    loadBalancers: [{
        targetGroupArn: targetGroup.arn,
        containerName: "app",
        containerPort: 80,
    }],
    tags: {
        ...commonTags,
        Name: `app-service-${environmentSuffix}`,
    },
}, { dependsOn: [listener] });

// Exports
export const albDnsName = alb.dnsName;
export const serviceArn = service.id;
export const clusterName = cluster.name;
export const logGroupName = logGroup.name;
```

## File: Pulumi.yaml

```yaml
name: ecs-fargate-optimized
runtime: nodejs
description: Optimized ECS Fargate deployment with Pulumi TypeScript
```

## File: Pulumi.dev.yaml

```yaml
config:
  ecs-fargate-optimized:environmentSuffix: dev
  ecs-fargate-optimized:containerMemory: "512"
  ecs-fargate-optimized:containerCpu: "256"
  ecs-fargate-optimized:team: platform
  ecs-fargate-optimized:project: ecs-optimization
```

## File: package.json

```json
{
  "name": "ecs-fargate-optimized",
  "version": "1.0.0",
  "description": "Optimized ECS Fargate deployment",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "bin",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "bin"
  ]
}
```

## Key Improvements

1. **Parameterized Configuration**: Container memory and CPU now configurable via Pulumi.dev.yaml
2. **Consistent Naming**: All resources use `{type}-{environmentSuffix}` pattern
3. **Cost Allocation Tags**: All resources tagged with Environment, Team, Project
4. **Single Target Group**: Removed wasteful loop creating 10 target groups
5. **Health Check Configuration**: Added comprehensive health check settings
6. **Consolidated IAM**: Single execution role instead of duplicates
7. **Log Retention**: 7-day retention policy to reduce storage costs
8. **Proper Exports**: ALB DNS and service ARN exported for external use
