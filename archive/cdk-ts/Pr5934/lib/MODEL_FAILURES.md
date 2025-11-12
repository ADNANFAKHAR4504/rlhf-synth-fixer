# Model Failures and Corrections

This document details the 6 critical fixes required to make the multi-environment CDK infrastructure functional, secure, and production-ready.

## FIX 1: RDS Storage Encryption (CRITICAL - Security)

**Severity**: CRITICAL
**Category**: Security Compliance
**File**: lib/database-construct.ts
**Line**: 202

**Problem**:
The initial implementation did not enable storage encryption for the RDS PostgreSQL database. This is a critical security vulnerability as database storage would contain unencrypted data at rest, violating security best practices and compliance requirements.

**Original Code**:
```typescript
this.database = new rds.DatabaseInstance(this, `Database-${props.environmentSuffix}`, {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_14_15,
  }),
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.T3,
    ec2.InstanceSize.MICRO
  ),
  // ... other properties
  backupRetention: cdk.Duration.days(props.config.rdsBackupRetention),
  // Missing: storageEncrypted
});
```

**Fixed Code**:
```typescript
this.database = new rds.DatabaseInstance(this, `Database-${props.environmentSuffix}`, {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_14_15,
  }),
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass[instanceClass],
    ec2.InstanceSize[instanceSize]
  ),
  // ... other properties
  storageEncrypted: true,  // FIX: Enable storage encryption
  backupRetention: cdk.Duration.days(props.config.rdsBackupRetention),
});
```

**Impact**:
- Without this fix, RDS data is stored unencrypted
- Violates security compliance requirements (SOC 2, HIPAA, PCI-DSS)
- Exposes sensitive data if storage media is compromised
- Cannot be enabled after database creation without rebuilding

---

## FIX 2: RDS Instance Type from Configuration (CRITICAL - Functionality)

**Severity**: CRITICAL
**Category**: Configuration Management
**File**: lib/database-construct.ts
**Lines**: 178-191

**Problem**:
The initial implementation hardcoded RDS instance type as T3.MICRO instead of reading from environment configuration. This meant all environments (dev, staging, prod) would use the same tiny instance size, causing performance issues in staging and production.

**Original Code**:
```typescript
this.database = new rds.DatabaseInstance(this, `Database-${props.environmentSuffix}`, {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_14_15,
  }),
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.T3,    // Hardcoded!
    ec2.InstanceSize.MICRO   // Hardcoded!
  ),
  // ... rest of config
});
```

**Fixed Code**:
```typescript
// Parse RDS instance type from config string (e.g., "db.t3.micro" -> T3, MICRO)
const instanceParts = props.config.rdsInstanceClass.split('.');
const instanceClass = instanceParts[1].toUpperCase() as keyof typeof ec2.InstanceClass;
const instanceSize = instanceParts[2].toUpperCase() as keyof typeof ec2.InstanceSize;

this.database = new rds.DatabaseInstance(this, `Database-${props.environmentSuffix}`, {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_14_15,
  }),
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass[instanceClass],  // FIX: Use parsed class (T3, R5, etc.)
    ec2.InstanceSize[instanceSize]     // FIX: Use parsed size (MICRO, SMALL, LARGE)
  ),
  // ... rest of config
});
```

**Impact**:
- Without this fix, production uses t3.micro instead of r5.large (severely underprovisioned)
- Staging uses t3.micro instead of t3.small (performance degradation)
- Environment-specific sizing requirements completely ignored
- Database becomes bottleneck under any real load

---

## FIX 3: Log Retention Using Enum (HIGH - Code Quality)

**Severity**: HIGH
**Category**: Configuration Management
**File**: lib/lambda-construct.ts
**Line**: 261

**Problem**:
The initial implementation hardcoded log retention to ONE_WEEK instead of using the environment-specific retention configuration. The CloudWatch RetentionDays enum requires specific constant names (DAYS_7, DAYS_30, DAYS_90), not numeric values.

**Original Code**:
```typescript
const logGroup = new logs.LogGroup(this, `LambdaLogGroup-${props.environmentSuffix}`, {
  logGroupName: `/aws/lambda/data-processor-${props.environmentSuffix}`,
  retention: logs.RetentionDays.ONE_WEEK,  // Hardcoded! Ignores config.logRetention
});
```

**Fixed Code**:
```typescript
const logGroup = new logs.LogGroup(this, `LambdaLogGroup-${props.environmentSuffix}`, {
  logGroupName: `/aws/lambda/data-processor-${props.environmentSuffix}`,
  retention: logs.RetentionDays[`DAYS_${props.config.logRetention}` as keyof typeof logs.RetentionDays],
  // FIX: Dynamically construct enum key from config (7 -> DAYS_7, 30 -> DAYS_30, 90 -> DAYS_90)
});
```

**Impact**:
- Without this fix, all environments get 7-day retention regardless of configuration
- Production logs lost after 7 days instead of required 90 days
- Violates compliance requirements for log retention
- Debugging production issues becomes impossible after 7 days

---

## FIX 4: RemovalPolicy for Log Groups (MEDIUM - Destroyability)

**Severity**: MEDIUM
**Category**: Resource Management
**File**: lib/lambda-construct.ts
**Line**: 262

**Problem**:
The initial implementation did not set RemovalPolicy.DESTROY for CloudWatch log groups. The default behavior is to retain log groups after stack deletion, causing issues with redeployment and cleanup in CI/CD environments.

**Original Code**:
```typescript
const logGroup = new logs.LogGroup(this, `LambdaLogGroup-${props.environmentSuffix}`, {
  logGroupName: `/aws/lambda/data-processor-${props.environmentSuffix}`,
  retention: logs.RetentionDays[`DAYS_${props.config.logRetention}` as keyof typeof logs.RetentionDays],
  // Missing: removalPolicy
});
```

**Fixed Code**:
```typescript
const logGroup = new logs.LogGroup(this, `LambdaLogGroup-${props.environmentSuffix}`, {
  logGroupName: `/aws/lambda/data-processor-${props.environmentSuffix}`,
  retention: logs.RetentionDays[`DAYS_${props.config.logRetention}` as keyof typeof logs.RetentionDays],
  removalPolicy: cdk.RemovalPolicy.DESTROY,  // FIX: Allow clean deletion
});
```

**Impact**:
- Without this fix, log groups persist after stack deletion
- Redeploying with same name fails due to existing log group
- CI/CD test environments accumulate orphaned log groups
- Manual cleanup required for every test deployment

---

## FIX 5: Environment Validation (MEDIUM - Error Handling)

**Severity**: MEDIUM
**Category**: Input Validation
**File**: lib/environment-config.ts
**Lines**: 62-64

**Problem**:
The initial implementation only checked if configuration exists but did not validate the environment name against allowed values. This could lead to silent failures or unexpected behavior with typos or invalid environment names.

**Original Code**:
```typescript
export function getEnvironmentConfig(env: string): EnvironmentConfig {
  const config = configs[env];
  if (!config) {
    throw new Error(`Configuration not found for environment: ${env}`);
  }
  return config;
}
```

**Fixed Code**:
```typescript
export function getEnvironmentConfig(env: string): EnvironmentConfig {
  // FIX: Validate against allowed values first
  const validEnvironments = ['dev', 'staging', 'prod'];
  if (!validEnvironments.includes(env)) {
    throw new Error(`Invalid environment: ${env}. Valid values: ${validEnvironments.join(', ')}`);
  }
  const config = configs[env];
  if (!config) {
    throw new Error(`Configuration not found for environment: ${env}`);
  }
  return config;
}
```

**Impact**:
- Without this fix, typos like "prodution" fail with unclear error message
- User doesn't know what valid values are
- Debugging deployment issues takes longer
- Better error messages improve developer experience

---

## FIX 6: Environment-Specific Configurations (INFORMATIONAL - Documentation)

**Severity**: INFORMATIONAL
**Category**: Configuration Completeness
**File**: lib/environment-config.ts
**Lines**: 23-58

**Problem**:
While the initial implementation included environment-specific configurations, this fix ensures they are complete and properly documented with the correct values for each environment tier.

**Configuration Values**:
```typescript
const configs: Record<string, EnvironmentConfig> = {
  dev: {
    vpcCidr: '10.0.0.0/16',              // Separate CIDR per environment
    maxAzs: 2,
    rdsInstanceClass: 'db.t3.micro',      // Smallest instance for cost optimization
    rdsBackupRetention: 7,                 // Minimal backup retention
    rdsMultiAz: false,                     // Single-AZ to reduce costs
    lambdaMemorySize: 512,                 // Minimal memory allocation
    logRetention: 7,                       // Short retention
    s3Versioning: false,                   // No versioning needed
    dynamodbBillingMode: 'PAY_PER_REQUEST', // On-demand for variable load
  },
  staging: {
    vpcCidr: '10.1.0.0/16',              // Different CIDR range
    maxAzs: 2,
    rdsInstanceClass: 'db.t3.small',      // Medium instance size
    rdsBackupRetention: 14,                // 2-week backup retention
    rdsMultiAz: false,                     // Single-AZ acceptable
    lambdaMemorySize: 1024,                // Increased memory
    logRetention: 30,                      // Month retention
    s3Versioning: true,                    // Enable versioning
    dynamodbBillingMode: 'PAY_PER_REQUEST',
  },
  prod: {
    vpcCidr: '10.2.0.0/16',              // Production CIDR range
    maxAzs: 2,
    rdsInstanceClass: 'db.r5.large',      // Production-grade instance
    rdsBackupRetention: 30,                // Month backup retention
    rdsMultiAz: true,                      // Multi-AZ for high availability
    lambdaMemorySize: 2048,                // Maximum memory
    logRetention: 90,                      // 3-month retention for compliance
    s3Versioning: true,                    // Versioning required
    dynamodbBillingMode: 'PROVISIONED',    // Provisioned capacity for predictable costs
    dynamodbReadCapacity: 5,
    dynamodbWriteCapacity: 5,
  },
};
```

**Impact**:
- Ensures proper resource sizing for each environment tier
- Cost optimization in dev (smallest instances, no versioning)
- High availability in production (multi-AZ, larger instances)
- Compliance with retention requirements per environment

---

## Summary

**Total Fixes**: 6
**Critical Fixes**: 2 (FIX 1, FIX 2)
**High Priority Fixes**: 1 (FIX 3)
**Medium Priority Fixes**: 2 (FIX 4, FIX 5)
**Informational**: 1 (FIX 6)

**Key Takeaways**:
1. Security (encryption) must be enabled by default
2. Environment-specific configurations must be properly parsed and applied
3. CloudWatch enums require specific constant names, not direct values
4. All resources must have proper removal policies for clean deletion
5. Input validation improves error messages and developer experience
6. Proper tiering of resources across environments optimizes cost and performance