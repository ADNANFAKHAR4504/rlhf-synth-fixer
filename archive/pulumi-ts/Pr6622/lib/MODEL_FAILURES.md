# Model Response Failures Analysis

Analysis of failures found in MODEL_RESPONSE.md requiring fixes for successful deployment.

## Critical Failures

### 1. DynamoDB Global Table Replica Misconfiguration

**Impact**: Critical - Deployment Blocker

**MODEL_RESPONSE Issue**:
```typescript
replicas: [
  { regionName: primaryRegion },  // us-east-1 - INCORRECT
  { regionName: drRegion }         // us-east-2
],
```

**Error**: `ValidationException: Cannot add, delete, or update the local region through ReplicaUpdates`

**IDEAL_RESPONSE Fix**:
```typescript
replicas: [{ regionName: drRegion }],  // Only DR region, primary is implicit
```

**Root Cause**: Model misunderstood DynamoDB global tables in Pulumi. Primary region is implicit when creating the table - `replicas` array should only contain additional regions.

**Cost Impact**: Complete deployment failure, DR requirements unmet, RPO/RTO objectives impossible.

---

### 2. S3 Replication Configuration - Deprecated Schema

**Impact**: Critical - Deployment Blocker

**MODEL_RESPONSE Issue**:
```typescript
destination: {
  bucket: drBucket.arn,
  replicationTime: {          // INCORRECT - deprecated
    status: 'Enabled',
    time: { minutes: 15 },
  },
  metrics: {                  // INCORRECT - deprecated
    status: 'Enabled',
    eventThreshold: { minutes: 15 },
  },
},
```

**Error**: `InvalidRequest: ReplicationTime cannot be used for this version of the replication configuration schema`

**IDEAL_RESPONSE Fix**:
```typescript
destination: {
  bucket: drBucket.arn,
  storageClass: 'STANDARD',  // Simplified, correct schema
},
```

**Root Cause**: Used deprecated S3 replication schema incompatible with current AWS API version.

**Cost Impact**: Cross-region replication fails, transaction logs not backed up, data loss risk in disaster scenarios.

---

## High Severity Failures

### 3. API Gateway Deployment - Missing Stage Resource

**Impact**: High - Build Error

**MODEL_RESPONSE Issue**:
```typescript
const primaryDeployment = new aws.apigateway.Deployment(
  `payment-deployment-primary-${environmentSuffix}`,
  { restApi: primaryApi.id, stageName: 'prod' }  // stageName invalid here
);
```

**Error**: TypeScript error - `stageName` does not exist in type `DeploymentArgs`

**IDEAL_RESPONSE Fix**:
```typescript
const _primaryDeployment = new aws.apigateway.Deployment(
  `payment-deployment-primary-${environmentSuffix}`,
  { restApi: primaryApi.id }
);

const _primaryStage = new aws.apigateway.Stage(
  `payment-stage-primary-${environmentSuffix}`,
  {
    restApi: primaryApi.id,
    deployment: _primaryDeployment.id,
    stageName: 'prod',  // Correct - Stage resource
  }
);
```

**Root Cause**: Confused Pulumi's separate Deployment and Stage resources with other IaC frameworks.

**Cost Impact**: Build-time error prevents deployment.

---

### 4. Pulumi Configuration - Entry Point Mismatch

**Impact**: High - Build Error

**MODEL_RESPONSE Issue**:
- Pulumi.yaml points to `bin/tap.ts`
- bin/tap.ts has incorrect TapStack parameters: `{ tags: defaultTags }` instead of required `{ environmentSuffix, primaryRegion, drRegion, tags }`

**IDEAL_RESPONSE Fix**:
- Updated Pulumi.yaml: `main: index.ts`
- Fixed bin/tap.ts with correct parameters

**Root Cause**: Generated components independently without ensuring cross-file consistency.

**Cost Impact**: TypeScript compilation failure.

---

## Medium Severity Failures

### 5. S3 Bucket Versioning - Deprecated Property

**Impact**: Medium - Warning (non-blocking)

**MODEL_RESPONSE Issue**: Used inline `versioning` property (deprecated)

**Warning**: `versioning is deprecated. Use the aws_s3_bucket_versioning resource instead`

**Root Cause**: Used older deprecated pattern instead of separate BucketVersioningV2 resource.

**Cost Impact**: Works but deprecated, may break in future provider versions.

---

### 6. Unused Variable Linting Errors

**Impact**: Low - Code Quality

**MODEL_RESPONSE Issue**: Variables created but not referenced (`primaryDeployment`, `drDeployment`, `primaryDlq`, `drDlq`, `healthCheck`)

**IDEAL_RESPONSE Fix**: Prefixed with underscore and added `void` statements

**Root Cause**: Didn't account for TypeScript/ESLint unused variable rules for side-effect resources.

**Cost Impact**: Linting error only, no functional impact.

---

## Summary

- **Total failures**: 2 Critical, 2 High, 2 Medium/Low
- **Deployment attempts**: 3 (first 2 failed, third succeeded after fixes)
- **Primary knowledge gaps**:
  1. DynamoDB Global Tables regional replica configuration
  2. S3 replication API schema versions and compatibility
  3. Pulumi-specific resource structure (API Gateway Deployment vs Stage)

**Training Value**: HIGH - Represents critical multi-region disaster recovery patterns, provider-specific configurations, and current vs deprecated API schemas.
