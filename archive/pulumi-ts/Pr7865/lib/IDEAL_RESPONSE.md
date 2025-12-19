# Ideal Response: Lambda ETL Optimization

## Expected Implementation

The ideal solution should implement all 10 requirements with proper Pulumi TypeScript patterns:

### 1. ARM64 Architecture (Graviton2)
All Lambda functions must specify:
```typescript
architectures: ["arm64"]
```

### 2. Reserved Concurrency
The data-transform function must have:
```typescript
reservedConcurrentExecutions: 50
```

### 3. Memory Optimization
Functions should be right-sized from 3008MB:
- Light workloads: 512MB
- Medium workloads: 1024MB
- Heavy workloads: 2048MB

### 4. Lambda SnapStart
Transform function should have:
```typescript
snapStart: {
    applyOn: 'PublishedVersions'
}
```

### 5. Pulumi Configuration
Use `pulumi.Config()` for bucket names:
```typescript
const config = new pulumi.Config();
const ingestionBucket = config.get('ingestionBucket');
```

### 6. X-Ray Tracing
All functions should have:
```typescript
tracingConfig: {
    mode: 'Active'
}
```

Function code should use X-Ray SDK:
```typescript
const AWSXRay = require('aws-xray-sdk-core');
const xrayAWS = AWSXRay.captureAWS(AWS);
```

### 7. Comprehensive Tagging
All resources should include:
- Environment
- Team
- CostCenter
- ManagedBy
- Project

### 8. CloudWatch Alarms
Error rate alarms with:
- Threshold: > 1% error rate
- SNS topic for notifications
- Appropriate evaluation periods

### 9. Lambda Layer
Shared layer with:
- Common dependencies (aws-sdk, aws-xray-sdk-core)
- ARM64 compatibility
- Proper directory structure (nodejs/)

### 10. Appropriate Timeouts
Based on historical data:
- Ingestion: 60s
- Transform: 300s
- Output: 120s

## Code Quality Standards

### IAM Permissions
- Least privilege principle
- Separate policies for different services
- Proper role assumption policy

### Testing
- 100% code coverage
- Test all exports
- Validate configuration
- Check resource properties

### Documentation
- Clear comments
- Proper exports
- Configuration documentation

### Error Handling
- Proper try-catch blocks
- X-Ray error tracking
- CloudWatch alarm integration

## Pulumi Best Practices

1. Use strongly-typed resources
2. Export stack outputs
3. Use Pulumi config for environment-specific values
4. Implement proper dependencies
5. Use asset archives for Lambda code
6. Tag all resources consistently
