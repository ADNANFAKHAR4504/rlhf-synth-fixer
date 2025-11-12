# Model Response Failures and Fixes

This document outlines the issues found in the initial model response and the fixes that were applied to reach the ideal implementation.

## 1. DynamoDB VPC Endpoint Configuration

**Issue:** The initial implementation attempted to enable private DNS for the DynamoDB VPC interface endpoint, which is not supported by AWS.

**Error:** `Resource handler returned message: "Private DNS can't be enabled because the service com.amazonaws.us-east-1.dynamodb does not provide a private DNS name."`

**Fix:** Added `privateDnsEnabled: false` to the DynamoDB interface endpoint configuration:

```typescript
vpc.addInterfaceEndpoint('DynamoDbEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.DYNAMODB,
  privateDnsEnabled: false, // DynamoDB endpoint does not support private DNS
});
```

## 2. SQS Event Source Batching Window Configuration

**Issue:** The initial implementation used an incorrect property name `maxBatchingWindowInMs` instead of the correct CDK property.

**Fix:** Changed to use the correct CDK Duration-based property:

```typescript
new lambda_event_sources.SqsEventSource(batchQueue, {
  batchSize: 25,
  maxBatchingWindow: cdk.Duration.seconds(5), // Fixed from maxBatchingWindowInMs
  reportBatchItemFailures: true,
})
```

## 3. Conditional Lambda Layer Creation

**Issue:** The initial implementation attempted to create a Lambda layer unconditionally, which would fail if the directory doesn't exist.

**Fix:** Added conditional logic to check for directory existence before creating the layer:

```typescript
const lambdaLayerPath = path.join(__dirname, '..', 'lambda-layer');
let sharedLayer: lambda.ILayerVersion | undefined;

if (fs.existsSync(lambdaLayerPath)) {
  sharedLayer = new lambda.LayerVersion(this, 'SharedDependencies', {
    // ... layer configuration
  });
}
// Then use: layers: sharedLayer ? [sharedLayer] : undefined
```

## 4. Email Subscription Update

**Issue:** The initial implementation used a placeholder email address for SNS subscriptions.

**Fix:** Updated to use the actual email address provided:

```typescript
alertTopic.addSubscription(
  new sns_subscriptions.EmailSubscription('prakhar.j@turing.com')
);
```

## 5. Stack Structure and Naming

**Issue:** The initial model response suggested a different stack structure with separate files that didn't match the actual project structure.

**Fix:** Aligned with the actual project structure where:
- Entry point is `bin/tap.ts` (not `main.ts`)
- Stack implementation is `lib/tap-stack.ts` (maintaining TapStack class name)
- Uses `environmentSuffix` pattern for dynamic naming

## 6. Environment Suffix Handling

**Issue:** The initial implementation didn't properly handle environment suffix from multiple sources (props, context, default).

**Fix:** Implemented proper fallback logic:

```typescript
const environmentSuffix =
  props?.environmentSuffix ||
  this.node.tryGetContext('environmentSuffix') ||
  'dev';
```

## 7. Resource Naming Convention

**Issue:** Need to ensure consistent naming pattern `{environment}-{service}-{component}` across all resources.

**Fix:** Created a naming prefix at the stack level and used it consistently:

```typescript
const namingPrefix = `prod-transaction-${environmentSuffix}`;
// Used in all resource names: `${namingPrefix}-resource-name`
```

These fixes ensure the infrastructure can be deployed successfully while maintaining all optimization requirements and operational constraints.
