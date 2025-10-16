# MODEL FAILURES 
## Critical Deployment Failures

### 1. RDS Parameter Group Family Mismatch

**Model Response:**
```typescript
// In RdsModule
const parameterGroupFamily = config.parameterGroupFamily || "postgres15";

// In tap-stack.ts  
parameterGroupFamily: ' postgres17 ', // Mismatched with default
```

**Deployment Error:**
```
Error: creating RDS DB Instance (tap-project-pr4477-db): 
The parameter group tap-project-pr4477-db-params with DBParameterGroupFamily postgres15 
can't be used for this instance. Use a parameter group with DBParameterGroupFamily postgres17.
```

**Actual Implementation Fix:**
```typescript
// In RdsModule - Consistent default
const parameterGroupFamily = config.parameterGroupFamily || 'postgres15';

// In tap-stack.ts - No override, or matching override
// Simply don't specify or use matching version
engine: 'postgres',
// parameterGroupFamily removed or matched to postgres15
```

---

### 2. DB Parameter Group Apply Method Missing

**Model Response:**
```typescript
parameter: [
  {
    name: "shared_preload_libraries",
    value: "pg_stat_statements",
    // Missing applyMethod - CRITICAL OMISSION
  },
  {
    name: "log_statement", 
    value: "all",
    // Missing applyMethod
  },
],
```

**Deployment Error:**
```
Error: modifying RDS DB Parameter Group: 
cannot use immediate apply method for static parameter
```

**Actual Implementation Fix:**
```typescript
parameter: [
  {
    name: 'shared_preload_libraries',
    value: 'pg_stat_statements',
    applyMethod: 'pending-reboot', // REQUIRED for static parameters
  },
  {
    name: 'log_statement',
    value: 'all',
    applyMethod: 'immediate', // For dynamic parameters
  },
],
lifecycle: {
  createBeforeDestroy: true, // Prevent disruption during updates
},
```

---

### 3. RDS Password Generation with Invalid Characters

**Model Response:**
```typescript
private generatePassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  // Includes forbidden characters: @, space could be generated
}
```

**Deployment Error:**
```
Error: creating RDS DB Instance: 
The parameter MasterUserPassword is not a valid password. 
Only printable ASCII characters besides '/', '@', '"', ' ' may be used.
```

**Actual Implementation Fix:**
```typescript
// Use AWS Secrets Manager Random Password
const randomPassword = new DataAwsSecretsmanagerRandomPassword(
  this,
  'db-password',
  {
    passwordLength: 32,
    excludeCharacters: '/@" ', // Explicitly exclude forbidden characters
  }
);

// In RDS Instance
password: config.masterPassword || randomPassword.randomPassword,
```

---

### 4. Import Statement Architecture Failure

**Model Response:**
```typescript
// Grouped namespace imports - causes namespace pollution
import { 
  vpc, ec2, iam, rds, autoscaling, elb, s3, 
  cloudwatch, sns, ssm, kms 
} from "@cdktf/provider-aws";

// Usage requires namespace prefix
new vpc.Vpc(this, "vpc", {...})
new elb.LbAccessLogs(this, "alb-access-logs", {...}) // Non-existent in namespace
```

**Actual Implementation Fix:**
```typescript
// Individual direct imports - cleaner, type-safe
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
// ... etc

// Direct usage without namespace
new Vpc(this, 'vpc', {...})
```

---

### 5. ALB Access Logs Configuration Error

**Model Response:**
```typescript
// Attempted to use non-existent class
new elb.LbAccessLogs(this, "alb-access-logs", {
  loadBalancerArn: this.alb.arn,
  bucket: config.accessLogsBucket.id,
  prefix: `alb-logs/${config.projectName}-${config.environment}`,
  enabled: true,
});
```

**Actual Implementation Fix:**
```typescript
// Access logs should be configured directly on the ALB
// The model attempted to use a non-existent resource type
// Actual implementation omits this feature or implements differently
```

---

### 6. Missing Data Source for Availability Zones

**Model Response:**
```typescript
import { dataAwsAvailabilityZones } from "@cdktf/provider-aws";

const azs = new dataAwsAvailabilityZones.DataAwsAvailabilityZones(this, "azs", {
  state: "available",
});
// Then uses: azs.names.slice(0, 2)
```

**Actual Implementation Fix:**
```typescript
// Direct AZ specification in VPC module
availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
// More predictable and doesn't require data source
```

---

### 7. Terraform State Backend Configuration

**Model Response:**
```typescript
// Missing S3 backend configuration entirely
// No state management setup
```

**Actual Implementation Fix:**
```typescript
import { S3Backend } from 'cdktf';

new S3Backend(this, {
  bucket: stateBucket,
  key: `${environmentSuffix}/${id}.tfstate`,
  region: stateBucketRegion,
  encrypt: true,
});

// Critical: Enable state locking
this.addOverride('terraform.backend.s3.use_lockfile', true);
```

---

### 8. Target Group Deregistration Delay Type Error

**Model Response:**
```typescript
deregistrationDelay: 30, // Incorrect type - number instead of string
```

**Actual Implementation Fix:**
```typescript
deregistrationDelay: '30', // Must be string type
```

---

### 9. Missing AWS Account Identity Data

**Model Response:**
```typescript
// No account ID retrieval for outputs
```

**Actual Implementation Fix:**
```typescript
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

const current = new DataAwsCallerIdentity(this, 'current', {});

// Use in outputs
new TerraformOutput(this, 'aws-account-id', {
  value: current.accountId,
  description: 'Current AWS Account ID',
});
```

---

### 10. Engine Version Specification Issue

**Model Response:**
```typescript
// In RdsModule
engineVersion: engineVersion, // Hardcoded to "15.4"

// This can cause compatibility issues with parameter groups
```

**Actual Implementation Fix:**
```typescript
// Don't specify engineVersion, let AWS choose compatible version
// Or ensure it matches parameter group family
engine: engine,
// engineVersion omitted for flexibility
```

---

## Summary of Critical Fixes

1. **Parameter Group Compatibility**: Ensure RDS engine version matches parameter group family
2. **Apply Methods Required**: Static RDS parameters must specify `applyMethod: 'pending-reboot'`
3. **Password Character Restrictions**: Use AWS Secrets Manager or exclude forbidden characters
4. **Import Architecture**: Use individual imports from specific paths, not grouped namespaces
5. **Type Safety**: Ensure correct types (string vs number) for all parameters
6. **State Management**: Implement proper S3 backend with state locking
7. **Resource Dependencies**: Add proper lifecycle management and dependencies

These fixes prevent the three critical deployment failures and ensure infrastructure deploys successfully.