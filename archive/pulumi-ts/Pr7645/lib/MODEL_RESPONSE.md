# ECS Fargate Deployment Optimization

This implementation refactors an ECS Fargate deployment with several intentional issues that need to be fixed.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Hardcoded values - should be configurable
const containerMemory = "512";
const containerCpu = "256";

// Get stack name but not using it consistently
const stackName = pulumi.getStack();

// VPC and Networking
const vpc = new aws.ec2.Vpc("app-vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
});

const subnet1 = new aws.ec2.Subnet("subnet-1", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "us-east-1a",
    mapPublicIpOnLaunch: true,
});

const subnet2 = new aws.ec2.Subnet("subnet-2", {
    vpcId: vpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: "us-east-1b",
    mapPublicIpOnLaunch: true,
});

const igw = new aws.ec2.InternetGateway("igw", {
    vpcId: vpc.id,
});

const routeTable = new aws.ec2.RouteTable("route-table", {
    vpcId: vpc.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
    }],
});

new aws.ec2.RouteTableAssociation("rta-1", {
    subnetId: subnet1.id,
    routeTableId: routeTable.id,
});

new aws.ec2.RouteTableAssociation("rta-2", {
    subnetId: subnet2.id,
    routeTableId: routeTable.id,
});

// Security Group for ALB
const albSg = new aws.ec2.SecurityGroup("alb-sg", {
    vpcId: vpc.id,
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

// Security Group for ECS
const ecsSg = new aws.ec2.SecurityGroup("ecs-sg", {
    vpcId: vpc.id,
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        securityGroups: [albSg.id],
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
    }],
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer("app-alb", {
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSg.id],
    subnets: [subnet1.id, subnet2.id],
    // Missing tags
});

// ISSUE: Creating 10 target groups in a loop - wasteful!
const targetGroups: aws.lb.TargetGroup[] = [];
for (let i = 0; i < 10; i++) {
    const tg = new aws.lb.TargetGroup(`target-group-${i}`, {
        port: 80,
        protocol: "HTTP",
        vpcId: vpc.id,
        targetType: "ip",
        // Missing health check configuration
    });
    targetGroups.push(tg);
}

// Only using the first target group
const listener = new aws.lb.Listener("listener", {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroups[0].arn,
    }],
});

// IAM Role 1 - Task Execution Role
const taskExecutionRole1 = new aws.iam.Role("task-execution-role-1", {
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

new aws.iam.RolePolicyAttachment("task-execution-policy-1", {
    role: taskExecutionRole1.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

// IAM Role 2 - Duplicate Task Execution Role
const taskExecutionRole2 = new aws.iam.Role("task-execution-role-2", {
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

new aws.iam.RolePolicyAttachment("task-execution-policy-2", {
    role: taskExecutionRole2.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
});

// CloudWatch Log Group - Missing retention policy
const logGroup = new aws.cloudwatch.LogGroup("app-logs", {
    name: "/ecs/app",
    // Missing retentionInDays
});

// ECS Cluster
const cluster = new aws.ecs.Cluster("app-cluster", {
    // Missing tags
});

// Task Definition
const taskDefinition = new aws.ecs.TaskDefinition("app-task", {
    family: "app",
    cpu: containerCpu,
    memory: containerMemory,
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    executionRoleArn: taskExecutionRole1.arn,
    containerDefinitions: JSON.stringify([{
        name: "app",
        image: "nginx:latest",
        memory: 512,
        cpu: 256,
        essential: true,
        portMappings: [{
            containerPort: 80,
            protocol: "tcp",
        }],
        logConfiguration: {
            logDriver: "awslogs",
            options: {
                "awslogs-group": logGroup.name,
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "ecs",
            },
        },
    }]),
});

// ECS Service
const service = new aws.ecs.Service("app-service", {
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
        targetGroupArn: targetGroups[0].arn,
        containerName: "app",
        containerPort: 80,
    }],
});

// Missing exports for ALB DNS and service ARN
