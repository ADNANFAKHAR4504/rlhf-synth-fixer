# Model Failures and Corrections

This document details the issues found in MODEL_RESPONSE and how they were fixed in IDEAL_RESPONSE.

## Summary of Issues

The MODEL_RESPONSE had 8 major categories of issues corresponding to the 8 requirements:

1. **Hardcoded Container Configuration** - Memory and CPU values were hardcoded
2. **Inconsistent Resource Naming** - No environmentSuffix in resource names
3. **Missing Cost Allocation Tags** - No tags on any resources
4. **Wasteful Target Group Loop** - Creating 10 target groups but using only one
5. **Missing Health Check Configuration** - Target group had no health checks
6. **Duplicate IAM Roles** - Two identical execution roles created
7. **No Log Retention Policy** - CloudWatch logs kept indefinitely
8. **Missing Stack Outputs** - No exports for ALB DNS or service ARN

## Detailed Corrections

### 1. Parameterize Container Configuration

**Issue**: Hardcoded values at the top of the file
```typescript
const containerMemory = "512";
const containerCpu = "256";
```

**Fix**: Use Pulumi Config with defaults
```typescript
const config = new pulumi.Config();
const containerMemory = config.get("containerMemory") || "512";
const containerCpu = config.get("containerCpu") || "256";
```

**Added**: Pulumi.dev.yaml configuration file for environment-specific settings

### 2. Fix Resource Naming

**Issue**: Resources had generic names without environmentSuffix
```typescript
const vpc = new aws.ec2.Vpc("app-vpc", { ... });
const alb = new aws.lb.LoadBalancer("app-alb", { ... });
```

**Fix**: All resources now include environmentSuffix
```typescript
const environmentSuffix = config.require("environmentSuffix");
const vpc = new aws.ec2.Vpc(`app-vpc-${environmentSuffix}`, { ... });
const alb = new aws.lb.LoadBalancer(`app-alb-${environmentSuffix}`, { ... });
```

**Impact**: Applied to all 20+ resources in the stack

### 3. Add Cost Allocation Tags

**Issue**: Resources had no tags or incomplete tags
```typescript
const alb = new aws.lb.LoadBalancer("app-alb", {
    // Missing tags
});
```

**Fix**: Created commonTags object and applied to all resources
```typescript
const commonTags = {
    Environment: environmentSuffix,
    Team: config.get("team") || "platform",
    Project: config.get("project") || "ecs-optimization",
};

const alb = new aws.lb.LoadBalancer(`app-alb-${environmentSuffix}`, {
    tags: {
        ...commonTags,
        Name: `app-alb-${environmentSuffix}`,
    },
});
```

**Impact**: All resources now properly tagged for cost tracking

### 4. Fix Target Group Loop

**Issue**: Creating 10 target groups in a loop but only using the first one
```typescript
const targetGroups: aws.lb.TargetGroup[] = [];
for (let i = 0; i < 10; i++) {
    const tg = new aws.lb.TargetGroup(`target-group-${i}`, { ... });
    targetGroups.push(tg);
}
// Only using targetGroups[0]
```

**Fix**: Create a single target group
```typescript
const targetGroup = new aws.lb.TargetGroup(`app-tg-${environmentSuffix}`, {
    port: 80,
    protocol: "HTTP",
    vpcId: vpc.id,
    targetType: "ip",
    // ... health check config
});
```

**Impact**: Eliminated 9 unnecessary resources, faster deployments, cleaner code

### 5. Configure Health Checks

**Issue**: Target group had no health check configuration
```typescript
const tg = new aws.lb.TargetGroup(`target-group-${i}`, {
    port: 80,
    protocol: "HTTP",
    vpcId: vpc.id,
    targetType: "ip",
    // Missing health check configuration
});
```

**Fix**: Added comprehensive health check configuration
```typescript
const targetGroup = new aws.lb.TargetGroup(`app-tg-${environmentSuffix}`, {
    // ... other config
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
});
```

**Impact**: Proper health monitoring, faster failure detection

### 6. Consolidate IAM Roles

**Issue**: Two identical IAM execution roles created
```typescript
const taskExecutionRole1 = new aws.iam.Role("task-execution-role-1", { ... });
const taskExecutionRole2 = new aws.iam.Role("task-execution-role-2", { ... });
```

**Fix**: Single IAM role with proper naming
```typescript
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
```

**Impact**: Eliminated duplicate resource, simplified IAM management

### 7. Add Log Retention Policy

**Issue**: CloudWatch log group with no retention policy (indefinite retention)
```typescript
const logGroup = new aws.cloudwatch.LogGroup("app-logs", {
    name: "/ecs/app",
    // Missing retentionInDays
});
```

**Fix**: Added 7-day retention policy
```typescript
const logGroup = new aws.cloudwatch.LogGroup(`app-logs-${environmentSuffix}`, {
    name: `/ecs/app-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
        ...commonTags,
        Name: `app-logs-${environmentSuffix}`,
    },
});
```

**Impact**: Significant cost savings on CloudWatch Logs storage

### 8. Export Key Outputs

**Issue**: No exports at all
```typescript
// Missing exports for ALB DNS and service ARN
```

**Fix**: Added comprehensive exports
```typescript
export const albDnsName = alb.dnsName;
export const serviceArn = service.id;
export const clusterName = cluster.name;
export const logGroupName = logGroup.name;
```

**Impact**: Outputs now accessible for monitoring, automation, and cross-stack references

## Additional Improvements

### Better Type Safety

**Issue**: Container definitions as plain JSON string
```typescript
containerDefinitions: JSON.stringify([{ ... }])
```

**Fix**: Used Pulumi interpolate for proper value resolution
```typescript
containerDefinitions: pulumi.interpolate`[{
    "name": "app",
    "memory": ${parseInt(containerMemory)},
    "cpu": ${parseInt(containerCpu)},
    "logConfiguration": {
        "options": {
            "awslogs-group": "${logGroup.name}"
        }
    }
}]`
```

### Added Dependency Management

**Fix**: Added explicit dependency to ensure listener exists before service
```typescript
const service = new aws.ecs.Service(`app-service-${environmentSuffix}`, {
    // ... config
}, { dependsOn: [listener] });
```

### Enhanced Descriptions

**Fix**: Added descriptions to security group rules for better documentation
```typescript
ingress: [{
    protocol: "tcp",
    fromPort: 80,
    toPort: 80,
    cidrBlocks: ["0.0.0.0/0"],
    description: "Allow HTTP from internet",
}]
```

## Configuration Files Added

Created supporting configuration files:
1. **Pulumi.yaml** - Project definition
2. **Pulumi.dev.yaml** - Environment-specific configuration
3. **package.json** - Dependencies
4. **tsconfig.json** - TypeScript configuration

## Training Value

This task demonstrates:
- Configuration management best practices
- Resource naming conventions
- Cost optimization techniques
- IAM role consolidation
- Health check configuration
- Proper use of Pulumi Config
- Tag management for cost allocation
- Stack output best practices

All 8 requirements successfully addressed with production-ready code.
