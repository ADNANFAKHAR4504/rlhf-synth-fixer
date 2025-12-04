# ECS Deployment Optimization - Initial Implementation

This implementation addresses the ECS optimization requirements with intentional learning opportunities for improvement.

## File: lib/index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");

// Create VPC and networking
const vpc = new aws.ec2.Vpc(`ecs-vpc-${environmentSuffix}`, {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
});

const subnet1 = new aws.ec2.Subnet(`ecs-subnet-1-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "us-east-1a",
    mapPublicIpOnLaunch: true,
});

const subnet2 = new aws.ec2.Subnet(`ecs-subnet-2-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: "us-east-1b",
    mapPublicIpOnLaunch: true,
});

const igw = new aws.ec2.InternetGateway(`ecs-igw-${environmentSuffix}`, {
    vpcId: vpc.id,
});

const routeTable = new aws.ec2.RouteTable(`ecs-rt-${environmentSuffix}`, {
    vpcId: vpc.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
    }],
});

new aws.ec2.RouteTableAssociation(`ecs-rta-1-${environmentSuffix}`, {
    subnetId: subnet1.id,
    routeTableId: routeTable.id,
});

new aws.ec2.RouteTableAssociation(`ecs-rta-2-${environmentSuffix}`, {
    subnetId: subnet2.id,
    routeTableId: routeTable.id,
});

// Security groups - with some unused rules
const albSg = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    ingress: [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidrBlocks: ["0.0.0.0/0"] },
        { protocol: "tcp", fromPort: 443, toPort: 443, cidrBlocks: ["0.0.0.0/0"] },
        // Unused rule from previous iteration
        { protocol: "tcp", fromPort: 8080, toPort: 8080, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

const ecsSg = new aws.ec2.SecurityGroup(`ecs-sg-${environmentSuffix}`, {
    vpcId: vpc.id,
    ingress: [
        { protocol: "tcp", fromPort: 3000, toPort: 3000, securityGroups: [albSg.id] },
        // Another unused rule
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
    ],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

// CloudWatch log group without retention policy
const logGroup = new aws.cloudwatch.LogGroup(`ecs-logs-${environmentSuffix}`, {
    name: `/ecs/app-${environmentSuffix}`,
});

// ECS Cluster
const cluster = new aws.ecs.Cluster(`app-cluster-${environmentSuffix}`, {
    name: `app-cluster-${environmentSuffix}`,
});

// Task definition with hardcoded values
const taskDefinition = new aws.ecs.TaskDefinition(`app-task-${environmentSuffix}`, {
    family: `app-task-${environmentSuffix}`,
    cpu: "256",
    memory: "512",
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
    containerDefinitions: JSON.stringify([{
        name: "app",
        image: "nginx:latest",
        cpu: 256,
        memory: 512,
        essential: true,
        portMappings: [{
            containerPort: 3000,
            protocol: "tcp",
        }],
        logConfiguration: {
            logDriver: "awslogs",
            options: {
                "awslogs-group": `/ecs/app-${environmentSuffix}`,
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "app",
            },
        },
    }]),
});

// ALB with aggressive health checks
const alb = new aws.lb.LoadBalancer(`app-alb-${environmentSuffix}`, {
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSg.id],
    subnets: [subnet1.id, subnet2.id],
});

const targetGroup = new aws.lb.TargetGroup(`app-tg-${environmentSuffix}`, {
    port: 3000,
    protocol: "HTTP",
    vpcId: vpc.id,
    targetType: "ip",
    healthCheck: {
        enabled: true,
        interval: 5,
        timeout: 2,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        path: "/health",
    },
});

const listener = new aws.lb.Listener(`app-listener-${environmentSuffix}`, {
    loadBalancerArn: alb.arn,
    port: 80,
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
    }],
});

// Duplicate ECS service definition 1
const service1 = new aws.ecs.Service(`app-service-1-${environmentSuffix}`, {
    cluster: cluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    networkConfiguration: {
        subnets: [subnet1.id, subnet2.id],
        securityGroups: [ecsSg.id],
        assignPublicIp: true,
    },
    loadBalancers: [{
        targetGroupArn: targetGroup.arn,
        containerName: "app",
        containerPort: 3000,
    }],
    placementConstraints: [],
    orderedPlacementStrategies: [{
        type: "spread",
        field: "attribute:ecs.availability-zone",
    }],
});

// Duplicate ECS service definition 2 (same task definition)
const service2 = new aws.ecs.Service(`app-service-2-${environmentSuffix}`, {
    cluster: cluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    networkConfiguration: {
        subnets: [subnet1.id, subnet2.id],
        securityGroups: [ecsSg.id],
        assignPublicIp: true,
    },
    loadBalancers: [{
        targetGroupArn: targetGroup.arn,
        containerName: "app",
        containerPort: 3000,
    }],
    placementConstraints: [],
    orderedPlacementStrategies: [{
        type: "spread",
        field: "attribute:ecs.availability-zone",
    }],
});

// Auto-scaling based on request count (not CPU)
const target1 = new aws.appautoscaling.Target(`app-target-1-${environmentSuffix}`, {
    maxCapacity: 10,
    minCapacity: 2,
    resourceId: pulumi.interpolate`service/${cluster.name}/${service1.name}`,
    scalableDimension: "ecs:service:DesiredCount",
    serviceNamespace: "ecs",
});

const scalingPolicy1 = new aws.appautoscaling.Policy(`app-policy-1-${environmentSuffix}`, {
    policyType: "TargetTrackingScaling",
    resourceId: target1.resourceId,
    scalableDimension: target1.scalableDimension,
    serviceNamespace: target1.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
            predefinedMetricType: "ALBRequestCountPerTarget",
        },
        targetValue: 100,
    },
});

export const albDnsName = alb.dnsName;
export const clusterName = cluster.name;
```

## File: Pulumi.yaml

```yaml
name: ecs-optimization-j2l9s6d6
runtime: nodejs
description: ECS deployment optimization project
```

## File: package.json

```json
{
  "name": "ecs-optimization",
  "version": "1.0.0",
  "description": "ECS deployment optimization with Pulumi",
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
    "typescript": "^5.0.0"
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
  "include": ["lib/**/*"],
  "exclude": ["node_modules"]
}
```

## Issues in this implementation:

1. **No Service Consolidation**: Two separate services using the same task definition
2. **Suboptimal Placement Strategy**: Spreads across all AZs unnecessarily
3. **Missing Resource Reservations**: No proper CPU/memory limits configured
4. **Hardcoded Values**: Execution role ARN and other values hardcoded
5. **No CloudWatch Retention**: Log group created without retention policy
6. **Aggressive Health Checks**: 5-second interval is too frequent
7. **No Tagging Strategy**: Resources lack proper tags for cost allocation
8. **Unused Security Rules**: Port 8080 and SSH rules not needed
9. **Missing Dependencies**: No explicit resource dependencies declared
10. **Wrong Auto-scaling Metric**: Using request count instead of CPU utilization
