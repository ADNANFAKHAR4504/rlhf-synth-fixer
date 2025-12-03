# ECS Fargate Deployment Optimization - Implementation

This implementation provides an ECS Fargate deployment with an Application Load Balancer. The code includes configurations that need optimization as per the requirements.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const imageUri = config.get("imageUri") || "nginx:latest"; // Using 'latest' tag
const region = aws.getRegionOutput().name;

// Get default VPC and subnets
const defaultVpc = aws.ec2.getVpc({ default: true });
const defaultVpcId = defaultVpc.then(vpc => vpc.id);

const publicSubnets = aws.ec2.getSubnets({
    filters: [
        {
            name: "vpc-id",
            values: [defaultVpcId],
        },
    ],
});

// Security Group for ALB
const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
    vpcId: defaultVpcId,
    description: "Security group for Application Load Balancer",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
});

// Security Group for ECS Tasks
const ecsSecurityGroup = new aws.ec2.SecurityGroup(`ecs-sg-${environmentSuffix}`, {
    vpcId: defaultVpcId,
    description: "Security group for ECS tasks",
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
        },
    ],
    egress: [
        {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
});

// CloudWatch Log Group (no retention policy)
const logGroup = new aws.cloudwatch.LogGroup(`ecs-logs-${environmentSuffix}`, {
    name: `/ecs/api-${environmentSuffix}`,
    // Missing retention policy - logs will be kept indefinitely
});

// IAM Role for ECS Task Execution
const executionRole = new aws.iam.Role(`ecs-execution-role-${environmentSuffix}`, {
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
});

new aws.iam.RolePolicyAttachment(`ecs-execution-policy-${environmentSuffix}`, {
    role: executionRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

// IAM Role for ECS Task (overly broad permissions)
const taskRole = new aws.iam.Role(`ecs-task-role-${environmentSuffix}`, {
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
});

// Overly broad policy - grants full access to S3, DynamoDB, and SQS
const taskPolicy = new aws.iam.RolePolicy(`ecs-task-policy-${environmentSuffix}`, {
    role: taskRole.id,
    policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "s3:*",  // Too broad
                    "dynamodb:*",  // Too broad
                    "sqs:*",  // Too broad
                ],
                Resource: "*",  // Too broad
            },
        ],
    }),
});

// ECS Cluster
const cluster = new aws.ecs.Cluster(`api-cluster-${environmentSuffix}`, {
    name: `api-cluster-${environmentSuffix}`,
    // Missing tags
});

// Task Definition with incorrect CPU/memory combination
const taskDefinition = new aws.ecs.TaskDefinition(`api-task-${environmentSuffix}`, {
    family: `api-task-${environmentSuffix}`,
    cpu: "256",  // Should be 512
    memory: "1024",  // Should match 512 CPU (this combination is invalid)
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: executionRole.arn,
    taskRoleArn: taskRole.arn,
    containerDefinitions: JSON.stringify([
        {
            name: "api-container",
            image: imageUri,  // Using 'latest' tag instead of SHA digest
            portMappings: [
                {
                    containerPort: 80,
                    protocol: "tcp",
                },
            ],
            logConfiguration: {
                logDriver: "awslogs",
                options: {
                    "awslogs-group": logGroup.name,
                    "awslogs-region": region,
                    "awslogs-stream-prefix": "ecs",
                },
            },
        },
    ]),
    // Missing tags
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`api-alb-${environmentSuffix}`, {
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSecurityGroup.id],
    subnets: publicSubnets.then(subnets => subnets.ids),
    // Missing tags
});

// Target Group with incorrect health check settings
const targetGroup = new aws.lb.TargetGroup(`api-tg-${environmentSuffix}`, {
    port: 80,
    protocol: "HTTP",
    vpcId: defaultVpcId,
    targetType: "ip",
    healthCheck: {
        enabled: true,
        path: "/health",
        interval: 30,
        timeout: 3,  // Too short - should be at least 5 seconds
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        matcher: "200",
    },
    // Missing tags
});

// Primary Listener
const listener = new aws.lb.Listener(`api-listener-${environmentSuffix}`, {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [
        {
            type: "forward",
            targetGroupArn: targetGroup.arn,
        },
    ],
});

// Unnecessary additional listener rule (redundant)
const listenerRule = new aws.lb.ListenerRule(`api-listener-rule-${environmentSuffix}`, {
    listenerArn: listener.arn,
    priority: 100,
    actions: [
        {
            type: "forward",
            targetGroupArn: targetGroup.arn,
        },
    ],
    conditions: [
        {
            pathPattern: {
                values: ["/*"],
            },
        },
    ],
});

// ECS Service
const service = new aws.ecs.Service(`api-service-${environmentSuffix}`, {
    cluster: cluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    networkConfiguration: {
        subnets: publicSubnets.then(subnets => subnets.ids),
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: true,
    },
    loadBalancers: [
        {
            targetGroupArn: targetGroup.arn,
            containerName: "api-container",
            containerPort: 80,
        },
    ],
    // Missing proper error handling and dependency management
    // Missing tags
}, { dependsOn: [listener] });

// Exports
export const albDnsName = alb.dnsName;
export const clusterName = cluster.name;
export const serviceName = service.name;
```

## File: Pulumi.yaml

```yaml
name: ecs-fargate-optimization
runtime: nodejs
description: ECS Fargate deployment optimization project
```

## File: package.json

```json
{
  "name": "ecs-fargate-optimization",
  "version": "1.0.0",
  "description": "Optimized ECS Fargate deployment with Pulumi",
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
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./bin",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "bin"]
}
```

## Issues to Address

This implementation has several issues that need optimization:

1. **Task Definition**: Uses incompatible CPU (256) and memory (1024) combination - should be 512/1024
2. **Image Tag**: Uses 'latest' tag instead of SHA256 digest
3. **Health Check**: Timeout of 3 seconds is too short, should be at least 5 seconds
4. **IAM Permissions**: Task role has overly broad permissions (s3:*, dynamodb:*, sqs:*)
5. **CloudWatch Logs**: No retention policy, logs will accumulate indefinitely
6. **Tagging**: Missing cost allocation tags on all resources
7. **ALB Listener**: Unnecessary listener rule creating redundant target group attachment
8. **Error Handling**: No proper error handling or resource dependencies
