# MODEL_FAILURES.md

This document describes the intentional errors in MODEL_RESPONSE.md and their fixes in IDEAL_RESPONSE.md.

## Error 1: Missing environmentSuffix in ECR Repository Name

**Category**: B (Medium Severity - Resource Naming)

**Location**: Line 329 in MODEL_RESPONSE.md

**Error Description**:
The API Gateway ECR repository resource name is missing the environmentSuffix parameter:
```typescript
const apiGatewayRepo = new aws.ecr.Repository(
  'api-gateway-repo',  // Missing environmentSuffix
  { ... }
);
```

**Fix Applied**:
Added environmentSuffix to the resource name to ensure unique resource naming across deployments:
```typescript
const apiGatewayRepo = new aws.ecr.Repository(
  `api-gateway-repo-${environmentSuffix}`,  // Fixed with environmentSuffix
  { ... }
);
```

**Rationale**:
- Resource names must include environmentSuffix for deployment isolation
- Without suffix, multiple deployments would conflict
- All other ECR repositories correctly use environmentSuffix
- Inconsistent naming breaks the naming convention requirement
- This prevents parallel deployments in the same AWS account

---

## Error 2: Missing Security Group Ingress Rules for ECS Tasks

**Category**: A (High Severity - Security/Networking)

**Location**: Lines 590-608 in MODEL_RESPONSE.md

**Error Description**:
The ECS task security group lacks ingress rules to allow traffic from the ALB and between services:
```typescript
const ecsTaskSecurityGroup = new aws.ec2.SecurityGroup(
  `ecs-task-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for ECS tasks',
    // Missing ingress rules - only egress defined
    egress: [ ... ],
  }
);
```

**Fix Applied**:
Added ingress rules to allow traffic from ALB to frontend (port 3000) and API gateway (port 8080), and VPC traffic to processing service (port 9090):
```typescript
const ecsTaskSecurityGroup = new aws.ec2.SecurityGroup(
  `ecs-task-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for ECS tasks',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 3000,
        toPort: 3000,
        securityGroups: [albSecurityGroup.id],
        description: 'Allow frontend traffic from ALB',
      },
      {
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        securityGroups: [albSecurityGroup.id],
        description: 'Allow API Gateway traffic from ALB',
      },
      {
        protocol: 'tcp',
        fromPort: 9090,
        toPort: 9090,
        cidrBlocks: ['10.0.0.0/16'],
        description: 'Allow processing service traffic from VPC',
      },
    ],
    egress: [ ... ],
  }
);
```

**Rationale**:
- Without ingress rules, ECS tasks cannot receive traffic from the ALB
- This would cause service unavailability - ALB health checks would fail
- Frontend and API Gateway services need to accept traffic from ALB
- Processing service needs to accept internal VPC traffic from other services
- This is a critical networking misconfiguration that prevents the application from working

---

## Error 3: Overly Permissive S3 IAM Policy

**Category**: A (High Severity - Security/Least Privilege)

**Location**: Lines 685-701 in MODEL_RESPONSE.md

**Error Description**:
The frontend task role has excessive S3 permissions (`s3:*` on all resources) when it only needs read access:
```typescript
new aws.iam.RolePolicy(
  `frontend-s3-policy-${environmentSuffix}`,
  {
    role: frontendTaskRole.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['s3:*'],  // Overly permissive - allows delete, put, etc.
          Resource: ['*'],
        },
      ],
    }),
  }
);
```

**Fix Applied**:
Restricted S3 permissions to read-only actions following least-privilege principle:
```typescript
new aws.iam.RolePolicy(
  `frontend-s3-policy-${environmentSuffix}`,
  {
    role: frontendTaskRole.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['s3:GetObject', 's3:ListBucket'],  // Read-only access
          Resource: ['*'],
        },
      ],
    }),
  }
);
```

**Rationale**:
- PROMPT.md specifies "read-only access to S3 static assets" for frontend
- `s3:*` grants all S3 actions including delete, put, and administrative operations
- Frontend only needs to read static assets, not modify or delete them
- Violates least-privilege principle and security best practices
- Over-permissive IAM policies increase attack surface and security risks
- AWS Well-Architected Framework requires minimal permissions for IAM roles

---

## Error 4: Incorrect CPU/Memory Allocation for Processing Service

**Category**: B (Medium Severity - Resource Configuration)

**Location**: Lines 931-985 in MODEL_RESPONSE.md

**Error Description**:
The processing service task definition has insufficient CPU/memory (512/1024) when requirements specify 2048/4096:
```typescript
const processingTaskDefinition = new aws.ecs.TaskDefinition(
  `processing-task-${environmentSuffix}`,
  {
    family: `processing-service-${environmentSuffix}`,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    cpu: '512',    // Should be '2048'
    memory: '1024', // Should be '4096'
    ...
  }
);
```

**Fix Applied**:
Updated CPU and memory to match requirements specified in PROMPT.md:
```typescript
const processingTaskDefinition = new aws.ecs.TaskDefinition(
  `processing-task-${environmentSuffix}`,
  {
    family: `processing-service-${environmentSuffix}`,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    cpu: '2048',    // Fixed to match requirements
    memory: '4096', // Fixed to match requirements
    ...
  }
);
```

**Rationale**:
- PROMPT.md explicitly states: "processing: 2048/4096" for CPU/memory allocation
- Processing service handles trade executions requiring higher compute resources
- Insufficient resources would cause performance issues and container crashes
- Trading platform requires adequate resources for high-frequency transaction processing
- Under-provisioned tasks may fail during peak market hours
- Violates the explicit technical requirements in the specification

---

## Error 5: Missing Target Group for API Gateway Service

**Category**: A (High Severity - Load Balancing/Connectivity)

**Location**: Lines 1023-1024 in MODEL_RESPONSE.md

**Error Description**:
The API Gateway service lacks a target group, preventing external access through the ALB:
```typescript
// ERROR 5: Missing target group for API Gateway
// Target group for API Gateway should be created here

// API Gateway Service
const apiGatewayService = new aws.ecs.Service(
  `api-gateway-service-${environmentSuffix}`,
  {
    cluster: cluster.arn,
    taskDefinition: apiGatewayTaskDefinition.arn,
    // Missing loadBalancers configuration
    serviceRegistries: {
      registryArn: apiDiscoveryService.arn,
    },
  }
);
```

**Fix Applied**:
Created target group for API Gateway and attached it to the service with proper listener rule:
```typescript
// Added target group for API Gateway service
const apiGatewayTargetGroup = new aws.lb.TargetGroup(
  `api-gateway-tg-${environmentSuffix}`,
  {
    port: 8080,
    protocol: 'HTTP',
    vpcId: vpc.id,
    targetType: 'ip',
    healthCheck: {
      enabled: true,
      path: '/health',
      protocol: 'HTTP',
      matcher: '200',
      interval: 30,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
    },
    tags: { ...tags, Name: `api-gateway-tg-${environmentSuffix}` },
  }
);

// Updated API Gateway service with load balancer configuration
const apiGatewayService = new aws.ecs.Service(
  `api-gateway-service-${environmentSuffix}`,
  {
    cluster: cluster.arn,
    taskDefinition: apiGatewayTaskDefinition.arn,
    loadBalancers: [
      {
        targetGroupArn: apiGatewayTargetGroup.arn,
        containerName: 'api-gateway',
        containerPort: 8080,
      },
    ],
    serviceRegistries: {
      registryArn: apiDiscoveryService.arn,
    },
    healthCheckGracePeriodSeconds: 60,
  }
);

// Added ALB listener rule for API Gateway routing
new aws.lb.ListenerRule(
  `api-gateway-listener-rule-${environmentSuffix}`,
  {
    listenerArn: albListener.arn,
    priority: 100,
    actions: [
      {
        type: 'forward',
        targetGroupArn: apiGatewayTargetGroup.arn,
      },
    ],
    conditions: [
      {
        pathPattern: {
          values: ['/api/*'],
        },
      },
    ],
  }
);
```

**Rationale**:
- Without a target group, the API Gateway service cannot be accessed externally
- PROMPT.md requires ALB for traffic distribution to services
- API Gateway needs to handle backend requests from the frontend
- Missing target group means the service is only accessible via internal service discovery
- Health checks require target group configuration to monitor service health
- Frontend service has target group, so API Gateway should too for consistency
- Critical for the multi-tier application architecture to function properly

---

## Summary

All 5 errors have been corrected in IDEAL_RESPONSE.md:

1. **Error 1** (Category B): Added environmentSuffix to ECR repository name
2. **Error 2** (Category A): Added security group ingress rules for ECS tasks
3. **Error 3** (Category A): Changed S3 policy from `s3:*` to read-only
4. **Error 4** (Category B): Fixed processing service CPU/Memory to 2048/4096
5. **Error 5** (Category A): Added API Gateway target group and load balancer configuration

**Category Breakdown**:
- **Category A (High Severity)**: 3 errors - Security, networking, and load balancing issues
- **Category B (Medium Severity)**: 2 errors - Resource naming and configuration issues

These errors represent common real-world mistakes in ECS Fargate deployments and provide valuable training data for identifying infrastructure code issues.
