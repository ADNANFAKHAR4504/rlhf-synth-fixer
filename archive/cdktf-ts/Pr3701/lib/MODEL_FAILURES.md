# MODEL FAILURES

## Critical Deployment Failures - TAP Infrastructure Stack

### 1. RDS Storage Configuration Breaking Deployment ❌

**Model Response (FAILED):**
```typescript
// lib/modules.ts - Line 226-237
this.rdsInstance = new DbInstance(this, "rds-instance", {
  instanceClass: dbInstanceClass,
  allocatedStorage: dbStorageGb,
  storageType: "gp2",  // ❌ gp2 with small storage causes IOPS error
  // Missing storage configuration for gp3
```

**Deployment Error:**
```
Error: creating RDS DB Instance (tap-pr3701-db): api error InvalidParameterCombination: 
You can't specify IOPS or storage throughput for engine mysql and a storage size less than 400.
```

**Actual Implementation Fix (IDEAL):**
```typescript
// lib/modules.ts - Line 243-248
this.dbInstance = new DbInstance(this, 'rds-instance', {
  instanceClass: config.instanceClass,
  allocatedStorage: config.allocatedStorage,
  storageType: 'gp3',  // ✅ gp3 supports small storage sizes
  storageEncrypted: true,
  // No IOPS specified for small instances
```

---

### 2. Performance Insights Misconfiguration ❌

**Model Response (FAILED):**
```typescript
// lib/modules.ts - Line 238-240
// Missing performance insights configuration
// No conditional logic for instance type compatibility
```

**Deployment Error:**
```
Error: creating RDS DB Instance: api error InvalidParameterCombination: 
Performance Insights not supported for this configuration.
```

**Actual Implementation Fix (IDEAL):**
```typescript
// lib/modules.ts - Line 269-271
performanceInsightsEnabled: false,  // ✅ Disabled for db.t3.micro
// performanceInsightsRetentionPeriod: 7,  // Commented out when disabled
monitoringInterval: 60,
```

---

### 3. Elastic IP Domain API Change ❌

**Model Response (DEPRECATED):**
```typescript
// lib/modules.ts - Line 84
this.natEip = new Eip(this, "nat-eip", {
  vpc: true,  // ❌ Deprecated parameter
  tags: {
```

**Actual Implementation Fix (IDEAL):**
```typescript
// lib/modules.ts - Line 88-93
this.elasticIp = new Eip(this, 'nat-eip', {
  domain: 'vpc',  // ✅ Updated to new API parameter
  tags: {
    ...config.tags,
    Name: `${config.projectName}-${config.environment}-nat-eip`,
  },
});
```

---

### 4. IAM Role Policy Attachment Deprecation Warning ⚠️

**Model Response (DEPRECATED):**
```typescript
// Missing proper IAM role policy attachment implementation
// No separate IamRolePolicyAttachment resource created
```

**Warning in Deployment:**
```
Warning: Argument is deprecated
managed_policy_arns is deprecated. Use the aws_iam_role_policy_attachment resource instead.
```

**Actual Implementation Fix (IDEAL):**
```typescript
// lib/modules.ts - Line 225-238
const monitoringRole = new IamRole(this, 'rds-monitoring-role', {
  name: `${config.projectName}-${config.environment}-rds-monitoring`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: { Service: 'monitoring.rds.amazonaws.com' },
      Action: 'sts:AssumeRole',
    }],
  }),
});

// ✅ Separate policy attachment resource
new IamRolePolicyAttachment(this, 'rds-monitoring-policy-attachment', {
  role: monitoringRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
});
```

---

### 5. Missing S3 Backend Configuration with State Locking ❌

**Model Response (MISSING):**
```typescript
// lib/tap-stack.ts - No backend configuration
// Missing critical state management setup
```

**Actual Implementation Fix (IDEAL):**
```typescript
// lib/tap-stack.ts - Line 40-48
new S3Backend(this, {
  bucket: stateBucket,
  key: `${environmentSuffix}/${id}.tfstate`,
  region: stateBucketRegion,
  encrypt: true,
});
// ✅ Critical: Enable state locking
this.addOverride('terraform.backend.s3.use_lockfile', true);
```

---

### 6. RDS Master Password Management Security Issue 🔒

**Model Response (INSECURE):**
```typescript
// lib/modules.ts - Line 230-231
username: "admin", // AWS will manage the password
manageMainUserPassword: true, // Missing proper implementation
```

**Actual Implementation Fix (IDEAL):**
```typescript
// lib/modules.ts - Line 252-253
username: 'admin',
manageMasterUserPassword: true,  // ✅ Correct parameter name
// AWS Secrets Manager automatically manages password
```

---

### 7. Variable Management vs Environment Configuration ❌

**Model Response (INFLEXIBLE):**
```typescript
// lib/tap-stack.ts - Lines 8-45
const projectName = new TerraformVariable(this, "projectName", {
  type: "string",
  description: "Name of the project",
});
// ❌ Requires manual variable input for every deployment
```

**Actual Implementation Fix (IDEAL):**
```typescript
// lib/tap-stack.ts - Lines 24-29
const environmentSuffix = props?.environmentSuffix || 'dev';
const awsRegion = AWS_REGION_OVERRIDE 
  ? AWS_REGION_OVERRIDE 
  : props?.awsRegion || 'us-east-1';
// ✅ Uses props pattern with defaults for better automation
```

---

### 8. Hard-coded Availability Zones Breaking Multi-Region Deployments ❌

**Model Response (FAILED):**
```typescript
// lib/tap-stack.ts - Line 79
azs: ["us-east-1a", "us-east-1b"],  // ❌ Hard-coded AZs
```

**Actual Implementation Fix (IDEAL):**
```typescript
// lib/tap-stack.ts - Line 65
availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],  // ✅ Dynamic based on region
```

---

### 9. Missing RDS Multi-AZ Dependencies and Subnet Requirements ❌

**Model Response (INCOMPLETE):**
```typescript
// lib/modules.ts - Line 232
multiAz: true, // Enable Multi-AZ deployment
// Missing subnet group validation for multi-AZ
```

**Actual Implementation Fix (IDEAL):**
```typescript
// lib/modules.ts - Line 208-216
this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
  name: `${config.projectName}-${config.environment}-db-subnet-group`,
  description: `Database subnet group for ${config.projectName} ${config.environment}`,
  subnetIds: config.subnetIds,  // ✅ Ensures multiple AZ coverage
  tags: {
    ...config.tags,
    Name: `${config.projectName}-${config.environment}-db-subnet-group`,
  },
});
```

---

### 10. Security Group Rule Port Range Misconfiguration ⚠️

**Model Response (INCORRECT):**
```typescript
// lib/modules.ts - Line 139
fromPort: 0,
toPort: 0,  // ❌ Invalid port range for protocol "-1"
protocol: "-1",
```

**Actual Implementation Fix (IDEAL):**
```typescript
// lib/modules.ts - Line 123
fromPort: 0,
toPort: 65535,  // ✅ Correct port range for all traffic
protocol: '-1',
```

---

## Summary of Critical Deployment Failures

| Issue | Severity | Impact | Fix Applied |
|-------|----------|--------|-------------|
| RDS gp2 storage with <400GB | **CRITICAL** | Deployment fails | Changed to gp3 storage type |
| Performance Insights on t3.micro | **CRITICAL** | Deployment fails | Disabled for incompatible instances |
| Missing S3 backend state locking | **HIGH** | State corruption risk | Added S3Backend with locking |
| EIP vpc parameter deprecated | **MEDIUM** | API deprecation warning | Updated to domain: 'vpc' |
| Hard-coded AZs | **HIGH** | Multi-region failure | Dynamic AZ based on region |
| IAM policy attachment deprecated | **MEDIUM** | Future breaking change | Separate IamRolePolicyAttachment |
| Invalid security group ports | **MEDIUM** | Network connectivity issues | Fixed port ranges |
| RDS password management | **HIGH** | Security vulnerability | manageMasterUserPassword |