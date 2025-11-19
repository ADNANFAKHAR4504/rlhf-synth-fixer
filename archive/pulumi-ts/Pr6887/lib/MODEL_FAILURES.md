# Model Failures Documentation

This document details the issues found in the initial MODEL_RESPONSE.md and how they were corrected.

## Failure 1: API Gateway Deployment Missing Stage Resource

### Error Type
TypeScript Compilation Error

### Issue Description
The initial implementation tried to use `stageName` as a property of the `aws.apigateway.Deployment` resource:

```typescript
const deployment = new aws.apigateway.Deployment(
  `api-deployment-${environmentSuffix}`,
  {
    restApi: api.id,
    stageName: 'prod',  // ERROR: Property 'stageName' does not exist
  },
  { parent: this, dependsOn: [statusIntegration] }
);
```

Then attempted to reference `deployment.stageName` in the UsagePlan:

```typescript
const usagePlan = new aws.apigateway.UsagePlan(
  `api-usage-plan-${environmentSuffix}`,
  {
    name: `api-usage-plan-${environmentSuffix}`,
    apiStages: [
      {
        apiId: api.id,
        stage: deployment.stageName,  // ERROR: Property 'stageName' does not exist
      },
    ],
    // ...
  }
);
```

### Error Message
```
lib/tap-stack.ts(688,9): error TS2353: Object literal may only specify known properties, and 'stageName' does not exist in type 'DeploymentArgs'.
lib/tap-stack.ts(701,31): error TS2339: Property 'stageName' does not exist on type 'Deployment'.
```

### Root Cause
In Pulumi's AWS provider (unlike AWS CDK), the `Deployment` and `Stage` are separate resources. The `Deployment` resource doesn't have a `stageName` property. You must create a separate `aws.apigateway.Stage` resource that references the deployment.

### Fix Applied
Created a separate Stage resource:

```typescript
// Deployment without stageName
const deployment = new aws.apigateway.Deployment(
  `api-deployment-${environmentSuffix}`,
  {
    restApi: api.id,
  },
  { parent: this, dependsOn: [statusIntegration] }
);

// Separate Stage resource
const stage = new aws.apigateway.Stage(
  `api-stage-${environmentSuffix}`,
  {
    restApi: api.id,
    deployment: deployment.id,
    stageName: 'prod',
    tags: defaultTags,
  },
  { parent: this }
);

// Usage plan references the stage
const usagePlan = new aws.apigateway.UsagePlan(
  `api-usage-plan-${environmentSuffix}`,
  {
    name: `api-usage-plan-${environmentSuffix}`,
    apiStages: [
      {
        apiId: api.id,
        stage: stage.stageName,  // Correctly references Stage resource
      },
    ],
    throttleSettings: {
      rateLimit: 1000,
      burstLimit: 2000,
    },
    tags: defaultTags,
  },
  { parent: this }
);
```

### Lesson Learned
Always consult Pulumi AWS provider documentation for resource structure. API Gateway in Pulumi requires explicit Stage resources, unlike some other IaC tools that combine deployment and stage.

---

## Failure 2: Missing environmentSuffix Parameter

### Error Type
Configuration/Logic Error (not caught by compilation)

### Issue Description
The bin/tap.ts file instantiated TapStack without passing the `environmentSuffix` parameter:

```typescript
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// ...

new TapStack(
  'pulumi-infra',
  {
    tags: defaultTags,  // Missing environmentSuffix!
  },
  { provider }
);
```

### Impact
All resources would be created with the default 'dev' suffix (from the TapStack constructor default) instead of using the actual environment suffix from environment variables. This would break environment isolation and could cause resource naming conflicts.

### Fix Applied
Added environmentSuffix to the TapStackArgs:

```typescript
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,  // Correctly passed
    tags: defaultTags,
  },
  { provider }
);
```

### Lesson Learned
Always verify that environment-specific configuration is properly passed through the stack hierarchy. Resource naming with environmentSuffix is critical for multi-environment deployments.

---

## Failure 3: Stack Outputs Not Exported

### Error Type
Missing Functionality

### Issue Description
The bin/tap.ts file didn't capture the TapStack instance or export its outputs:

```typescript
new TapStack(
  'pulumi-infra',
  {
    tags: defaultTags,
  },
  { provider }
);

// No exports! Can't access stack outputs like bucket name, API endpoint, etc.
```

### Impact
Users deploying the stack wouldn't be able to access important output values like:
- S3 bucket name
- DynamoDB table name
- API Gateway endpoint URL
- Lambda function names

This makes the infrastructure difficult to use and integrate with other systems.

### Fix Applied
Captured the stack instance and exported all outputs:

```typescript
const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export all stack outputs
export const bucketName = stack.bucketName;
export const tableName = stack.tableName;
export const apiEndpoint = stack.apiEndpoint;
export const validatorFunctionName = stack.validatorFunctionName;
export const processorFunctionName = stack.processorFunctionName;
export const aggregatorFunctionName = stack.aggregatorFunctionName;
```

### Lesson Learned
Always export stack outputs to make infrastructure resources accessible to users and CI/CD systems. Outputs are essential for:
- Testing the deployed infrastructure
- Integrating with other systems
- Debugging and monitoring
- Documentation and user guidance

---

## Summary of Fixes

| Issue | Type | Severity | Fix Complexity |
|-------|------|----------|----------------|
| API Gateway Stage Missing | Compilation Error | High | Medium - Required understanding of Pulumi API Gateway structure |
| Missing environmentSuffix | Logic Error | High | Low - Simple parameter addition |
| No Stack Outputs | Missing Feature | Medium | Low - Simple export statements |

All three issues were successfully resolved in the final tap-stack.ts and bin/tap.ts implementation.
