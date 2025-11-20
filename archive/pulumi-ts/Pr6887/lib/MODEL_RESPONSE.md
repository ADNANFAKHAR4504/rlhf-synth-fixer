# Model Response: Serverless File Processing Pipeline (Initial Attempt)

This document simulates an initial LLM response with common issues that would need to be fixed.

## Issues in This Response

1. API Gateway deployment missing Stage resource (TypeScript compilation error)
2. Missing environmentSuffix in bin/tap.ts instantiation
3. No proper outputs exported from bin/tap.ts

These issues are documented in MODEL_FAILURES.md.

## Initial Implementation (With Issues)

The initial implementation attempted to create all required resources but had the following problems:

### Issue 1: API Gateway Configuration

The initial code tried to set `stageName` directly on the Deployment resource:

```typescript
const deployment = new aws.apigateway.Deployment(
  `api-deployment-${environmentSuffix}`,
  {
    restApi: api.id,
    stageName: 'prod',  // ERROR: stageName doesn't exist on Deployment
  },
  { parent: this, dependsOn: [statusIntegration] }
);
```

Then tried to reference it in the usage plan:

```typescript
apiStages: [
  {
    apiId: api.id,
    stage: deployment.stageName,  // ERROR: stageName property doesn't exist
  },
],
```

This caused TypeScript compilation errors because in Pulumi's AWS provider, the Deployment resource doesn't have a stageName property. You need to create a separate Stage resource.

### Issue 2: Missing environmentSuffix

The bin/tap.ts file didn't pass the environmentSuffix to TapStack:

```typescript
new TapStack(
  'pulumi-infra',
  {
    tags: defaultTags,  // Missing environmentSuffix!
  },
  { provider }
);
```

This meant all resources would use the default 'dev' suffix instead of the actual environment.

### Issue 3: No Outputs Exported

The bin/tap.ts file didn't capture the stack instance or export outputs:

```typescript
new TapStack(
  'pulumi-infra',
  {
    tags: defaultTags,
  },
  { provider }
);

// No exports! Stack outputs not accessible
```

## Fixed Version

The corrected implementation addresses all these issues:

1. Created separate Stage resource for API Gateway
2. Passed environmentSuffix to TapStack constructor
3. Captured stack instance and exported all outputs

See tap-stack.ts and bin/tap.ts for the corrected code.
