# Model Failures Compared to Ideal Response

Below are the key misses or failures in the MODEL_RESPONSE compared to the IDEAL_RESPONSE, with code snippets for illustration:

---

## 1. **Missing Unique Naming for Lambda and Alias**
**Ideal:**
```typescript
const stackName = cdk.Stack.of(this).stackName;
const uniqueSuffix = this.node.addr.slice(-8);
const uniqueFunctionName = `${stackName}-lambda-nova-destruction-dev-${uniqueSuffix}`;
const uniqueAliasName = `${stackName}-live-${uniqueSuffix}`;
```
**Model:**
```typescript
functionName: 'lambda-nova-team-development',
aliasName: 'live',
```
**Failure:**
- Model uses static names for Lambda and Alias, not unique per stack.

---

## 2. **Incorrect/Extra Manual Application Auto Scaling Resources**
**Ideal:**
```typescript
// CORRECTED: Provisioned Concurrency Auto Scaling using the high-level helper method.
const scaling = lambdaAlias.addAutoScaling({
  minCapacity: 1,
  maxCapacity: 10,
});
scaling.scaleOnUtilization({ ... });
// --- The following manual definitions have been REMOVED ---
```
**Model:**
```typescript
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
// ...
const autoScalingRole = new iam.Role(this, 'AutoScalingRole', { ... });
const scalableTarget = new applicationautoscaling.ScalableTarget(...);
new applicationautoscaling.TargetTrackingScalingPolicy(...);
```
**Failure:**
- Model creates manual IAM Role, ScalableTarget, and ScalingPolicy, which are not needed with the high-level CDK helper.

---

## 3. **Incorrect Lambda Reserved Concurrency**
**Ideal:**
_No `reservedConcurrentExecutions` property on Lambda function._
**Model:**
```typescript
reservedConcurrentExecutions: 1000,
```
**Failure:**
- Model sets `reservedConcurrentExecutions` on the Lambda function, which is not recommended when using provisioned concurrency via alias.

---

## 4. **Missing/Incorrect Outputs**
**Ideal:**
```typescript
exportName: `${stackName}-lambda-function-name`,
exportName: `${stackName}-lambda-alias-name`,
exportName: `${stackName}-lambda-log-group`,
```
**Model:**
```typescript
exportName: 'nova-team-development-lambda-name',
exportName: 'nova-team-development-lambda-alias',
exportName: 'nova-team-development-log-group',
```
**Failure:**
- Model uses static export names instead of dynamic names based on the stack name.

---

## 5. **No Integration Test Outputs**
**Ideal:**
```typescript
new cdk.CfnOutput(this, 'S3BucketName', { ... });
new cdk.CfnOutput(this, 'DLQUrl', { ... });
```
**Model:**
- These outputs are missing.

---

## 6. **Tagging Not Explicit for All Resources**
**Ideal:**
```typescript
Object.entries(commonTags).forEach(([k, v]) =>
  cdk.Tags.of(lambdaLogGroup).add(k, v)
);
// ...for all taggable resources
```
**Model:**
- Tagging is not shown for all resources (e.g., log group, alias, API Gateway).

---

## 7. **Other Minor Misses**
- Model imports and uses `applicationautoscaling` directly, which is not needed.
- Model does not use the high-level scaling helper for provisioned concurrency.

---

> **Summary:**
> The model response misses dynamic naming, uses unnecessary manual scaling resources, sets reserved concurrency incorrectly, omits some outputs, and lacks explicit tagging for all resources.