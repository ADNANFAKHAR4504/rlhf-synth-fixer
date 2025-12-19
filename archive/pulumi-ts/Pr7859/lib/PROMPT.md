# Lambda Transaction Processing System Optimization

Hey team,

We've got a Lambda-based transaction processing system that's been running for a while, and it's time to optimize it. The current setup works, but we're seeing higher costs than necessary and some performance issues during peak hours. The business has asked us to implement a series of optimizations to reduce costs, improve performance, and add better observability.

We need to refactor three existing Lambda functions - payment-validator, fraud-detector, and notification-sender - with several architectural improvements. This includes migrating to Graviton2 processors for cost savings, adding provisioned concurrency to eliminate cold starts, and implementing Lambda function URLs to remove the API Gateway dependency. We also need to right-size memory allocations based on profiling data and set up proper CloudWatch log retention policies.

The infrastructure needs to be built using **Pulumi with TypeScript**, following AWS best practices and component patterns. All resources must use unique naming with an environmentSuffix parameter, and everything needs to be fully destroyable for testing purposes.

## What we need to build

Create an optimized Lambda-based transaction processing infrastructure using **Pulumi with TypeScript** that implements cost and performance improvements across three Lambda functions.

### Core Requirements

1. **Graviton2 Migration**
   - Refactor payment-validator function to use ARM64 architecture
   - Refactor fraud-detector function to use ARM64 architecture
   - Refactor notification-sender function to use ARM64 architecture
   - All functions must use AWS Graviton2 processors for cost savings

2. **Provisioned Concurrency**
   - Implement provisioned concurrency for payment-validator function
   - Eliminate cold starts during peak business hours (8 AM - 6 PM EST)
   - Configure appropriate concurrency levels based on traffic patterns

3. **Function URLs**
   - Add Lambda function URL endpoints for direct HTTPS invocation
   - Remove dependency on API Gateway
   - Configure function URLs for all three Lambda functions

4. **Memory Optimization**
   - Configure payment-validator with 512MB memory
   - Configure fraud-detector with 256MB memory
   - Configure notification-sender with 128MB memory
   - Memory settings based on profiling data

5. **Log Retention**
   - Set up CloudWatch Log Groups with 7-day retention
   - Replace current indefinite retention policy
   - Apply to all three Lambda functions

6. **Environment-Specific Timeouts**
   - Production environment: 30 second timeout
   - Development environment: 60 second timeout
   - Implement environment detection logic

7. **X-Ray Tracing**
   - Enable X-Ray tracing for all Lambda functions
   - Add custom subsegments for database calls
   - Configure proper tracing permissions

8. **Concurrency Limits**
   - Configure payment-validator with 100 reserved concurrent executions
   - Configure fraud-detector with 50 reserved concurrent executions
   - Configure notification-sender with 50 reserved concurrent executions

9. **IAM Roles**
   - Create separate IAM roles for each function
   - Grant least-privilege access to DynamoDB tables
   - Include X-Ray write permissions

10. **Resource Tagging**
    - Tag all resources with CostCenter
    - Tag all resources with Environment
    - Tag all resources with Owner
    - Consistent tagging across all infrastructure

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** with ARM64 architecture (Graviton2)
- Use **CloudWatch Logs** with 7-day retention
- Use **AWS X-Ray** for distributed tracing
- Use **AWS IAM** for function roles and policies
- Reference **DynamoDB** for IAM permissions setup
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{function-name}-{environmentSuffix}`
- Deploy to **us-east-1** region (unless overridden by lib/AWS_REGION)

### Lambda Function Code

Since this is an optimization task, create minimal placeholder Lambda functions:

```typescript
// payment-validator/index.ts
export const handler = async (event: any) => {
  console.log('Payment validation logic');
  return { statusCode: 200, body: 'Payment validated' };
};

// fraud-detector/index.ts
export const handler = async (event: any) => {
  console.log('Fraud detection logic');
  return { statusCode: 200, body: 'Fraud check complete' };
};

// notification-sender/index.ts
export const handler = async (event: any) => {
  console.log('Notification sending logic');
  return { statusCode: 200, body: 'Notification sent' };
};
```

### Constraints

- All resources must be destroyable (no Retain deletion policies)
- Use serverless architecture patterns for cost optimization
- Environment parameter must support both "production" and "development"
- No multi-cloud support required (AWS only)
- Include proper error handling and logging

## Deployment Requirements (CRITICAL)

### Resource Naming
- ALL resources MUST include environmentSuffix in their names
- Use format: `{resource-type}-{environmentSuffix}` for uniqueness
- This enables parallel deployments without conflicts

### Destroyability
- ALL resources MUST be fully destroyable
- FORBIDDEN: RemovalPolicy.RETAIN or DeletionPolicy: Retain
- Required: RemovalPolicy.DESTROY for all stateful resources
- This is CRITICAL for automated testing and cleanup

### Lambda Runtime Compatibility
- Use Node.js 18.x or higher runtime
- Graviton2 requires ARM64 architecture specification
- Ensure Lambda functions include proper IAM permissions for X-Ray

## Success Criteria

- **Cost Optimization**: Graviton2 migration reduces compute costs by ~20%
- **Performance**: Provisioned concurrency eliminates cold starts for payment-validator
- **Simplification**: Function URLs remove API Gateway dependency
- **Resource Efficiency**: Memory settings optimized per profiling data
- **Compliance**: Log retention policy reduces storage costs
- **Observability**: X-Ray tracing enabled with proper instrumentation
- **Reliability**: Concurrency limits prevent throttling
- **Security**: IAM roles follow least-privilege principle
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript, well-typed, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- Three Lambda functions with ARM64 architecture
- Lambda function URLs for direct invocation
- CloudWatch Log Groups with 7-day retention
- X-Ray tracing configuration
- IAM roles with DynamoDB access
- Resource tagging across all components
- Exported outputs: function ARNs, function URLs, IAM role ARNs, log group names
- Unit tests for infrastructure components
- Documentation and deployment instructions
