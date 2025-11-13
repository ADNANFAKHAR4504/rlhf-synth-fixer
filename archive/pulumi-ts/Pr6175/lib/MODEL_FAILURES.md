# Model Failures and Common Issues

This document outlines potential failures and common issues that LLM models might introduce when generating multi-region failover infrastructure code.

## Anticipated Model Issues

### 1. Multi-Region Provider Configuration

**Common Failure**: Not using separate AWS providers for different regions
```typescript
// WRONG: Single provider for multi-region
const vpc1 = new aws.ec2.Vpc("primary-vpc", { ... });
const vpc2 = new aws.ec2.Vpc("standby-vpc", { ... });

// CORRECT: Separate providers
const primaryProvider = new aws.Provider("primary", { region: "us-east-1" });
const standbyProvider = new aws.Provider("standby", { region: "us-east-2" });
```

### 2. Missing environmentSuffix in Resource Names

**Common Failure**: Hardcoded resource names without environmentSuffix
```typescript
// WRONG
name: "primary-vpc"

// CORRECT
name: `primary-vpc-${environmentSuffix}`
```

### 3. Incorrect Route 53 Weighted Routing

**Common Failure**: Using failover routing instead of weighted routing
```typescript
// WRONG: Using failoverRoutingPolicy
failoverRoutingPolicies: [{ type: "PRIMARY" }]

// CORRECT: Using weightedRoutingPolicies
weightedRoutingPolicies: [{ weight: 100 }]
```

### 4. DynamoDB Global Table Misconfiguration

**Common Failure**: Creating separate tables instead of global table with replicas
```typescript
// WRONG: Separate tables
new aws.dynamodb.Table("primary-table", { ... }, { provider: primaryProvider });
new aws.dynamodb.Table("standby-table", { ... }, { provider: standbyProvider });

// CORRECT: Global table with replicas
new aws.dynamodb.Table("table", {
  replicas: [{ regionName: "us-east-2" }]
}, { provider: primaryProvider });
```

### 5. Health Check Configuration Errors

**Common Failure**: Incorrect health check interval
```typescript
// WRONG: Default 30-second interval
requestInterval: 30

// CORRECT: 10-second interval as required
requestInterval: 10
```

### 6. Auto Scaling Capacity Mismatch

**Common Failure**: Same capacity for both regions
```typescript
// WRONG: Both regions with same capacity
primaryAsg: { desiredCapacity: 2 }
standbyAsg: { desiredCapacity: 2 }

// CORRECT: Different capacities
primaryAsg: { desiredCapacity: 2 }
standbyAsg: { desiredCapacity: 1 }
```

### 7. Missing Tags

**Common Failure**: Not including required tags
```typescript
// WRONG: Missing Environment and FailoverRole tags
tags: { Name: "resource" }

// CORRECT: Include all required tags
tags: {
  Name: "resource",
  Environment: "Production",
  FailoverRole: "Primary"
}
```

### 8. Incorrect VPC CIDR Blocks

**Common Failure**: Using same CIDR blocks for both regions
```typescript
// WRONG: Same CIDR
primaryVpc: { cidrBlock: "10.0.0.0/16" }
standbyVpc: { cidrBlock: "10.0.0.0/16" }

// CORRECT: Different CIDRs
primaryVpc: { cidrBlock: "10.0.0.0/16" }
standbyVpc: { cidrBlock: "10.1.0.0/16" }
```

### 9. Security Group Circular Dependencies

**Common Failure**: Circular reference in security group rules
```typescript
// WRONG: Direct circular reference
instanceSg: {
  ingress: [{ securityGroups: [albSg.id] }]
}
albSg: {
  ingress: [{ securityGroups: [instanceSg.id] }]
}

// CORRECT: One-way reference
instanceSg: {
  ingress: [{ securityGroups: [albSg.id] }]
}
```

### 10. Missing CloudWatch Alarm Configuration

**Common Failure**: Not configuring CloudWatch alarm for health checks
```typescript
// MISSING: CloudWatch alarm to monitor Route 53 health check

// SHOULD INCLUDE:
new aws.cloudwatch.MetricAlarm("alarm", {
  metricName: "HealthCheckStatus",
  namespace: "AWS/Route53",
  dimensions: { HealthCheckId: healthCheck.id }
});
```

### 11. IAM Policy Too Permissive

**Common Failure**: Using wildcard permissions instead of least privilege
```typescript
// WRONG: Too permissive
Action: "*"
Resource: "*"

// BETTER: Specific permissions
Action: ["dynamodb:GetItem", "dynamodb:PutItem"]
```

### 12. Missing SNS Topics

**Common Failure**: Not creating SNS topics in both regions
```typescript
// WRONG: Only primary region SNS
new aws.sns.Topic("sns", { ... }, { provider: primaryProvider });

// CORRECT: Both regions
new aws.sns.Topic("primary-sns", { ... }, { provider: primaryProvider });
new aws.sns.Topic("standby-sns", { ... }, { provider: standbyProvider });
```

### 13. Launch Template User Data Not Base64 Encoded

**Common Failure**: Passing raw user data string
```typescript
// WRONG: Raw string
userData: "#!/bin/bash\nyum update -y"

// CORRECT: Base64 encoded
userData: Buffer.from("#!/bin/bash\nyum update -y").toString('base64')
```

### 14. Missing Parent Resource Option

**Common Failure**: Not setting parent option in Pulumi resources
```typescript
// SUBOPTIMAL: No parent
new aws.ec2.Vpc("vpc", { ... });

// BETTER: With parent for proper resource hierarchy
new aws.ec2.Vpc("vpc", { ... }, { parent: this });
```

### 15. Incorrect ALB Subnet Configuration

**Common Failure**: Placing ALB in private subnets
```typescript
// WRONG: Private subnets for ALB
subnets: [privateSubnet1.id, privateSubnet2.id]

// CORRECT: Public subnets for ALB
subnets: [publicSubnet1.id, publicSubnet2.id]
```

## Testing Strategy

To catch these failures:
1. Validate resource naming includes environmentSuffix
2. Check multi-region provider configuration
3. Verify Route 53 weighted routing setup
4. Confirm DynamoDB global table configuration
5. Test health check intervals
6. Validate Auto Scaling capacities
7. Verify all required tags are present
8. Check CIDR block uniqueness
9. Test IAM policy permissions
10. Verify CloudWatch alarms are created
