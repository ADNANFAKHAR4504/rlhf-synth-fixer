# MODEL FAILURES

## Critical Deployment Failures - TAP Infrastructure Project

### 1. Module Import Pattern Failures (Compilation Breaking)

**Model Response:**
```typescript
import {
  ec2,
  iam,
  rds,
  elasticloadbalancingv2,
  autoscaling,
  ssm,
  cloudwatch,
  logs,
  sns,
  cloudtrail,
  s3,
  kms,
} from '@cdktf/provider-aws';
```
**Errors:** 
- `Module "@cdktf/provider-aws" has no exported member 'ec2'`
- `Module "@cdktf/provider-aws" has no exported member 'iam'`
- Similar errors for all namespace imports

**Actual Implementation:**
```typescript
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DataAwsElbServiceAccount } from '@cdktf/provider-aws/lib/data-aws-elb-service-account';
// ... specific class imports
```
CDKTF requires importing specific classes from their exact paths, not namespace imports. This fundamental misunderstanding broke the entire compilation.

---

### 2. CDKTF Token Array Access Failure (Runtime Breaking)

**Model Response:**
```typescript
// Line 85 - Direct array access causing token errors
availabilityZone: azs.names.get(i),  // WRONG - causes "Found an encoded list token string" error
```

**Actual Implementation:**
```typescript
// Lines 108-109 - Proper token handling
const availabilityZone = Fn.element(azs.names, i);
// ...
availabilityZone: availabilityZone,
```
**Fix:** Used `Fn.element()` to properly handle CDKTF tokens that represent lists with unknown runtime values. Direct array access causes synthesis failures.

---

### 3. S3 Bucket Deprecated Configuration (Deployment Warnings & Failures)

**Model Response:**
```typescript
this.bucket = new s3.S3Bucket(this, 'cloudtrail-bucket', {
  bucket: `${config.tags.Project}-cloudtrail-${Date.now()}`,
  versioning: {               // DEPRECATED - inline configuration
    enabled: true,
  },
  serverSideEncryptionConfiguration: {  // DEPRECATED
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
    },
  },
  lifecycleRule: [            // DEPRECATED
    // ...
  ],
});
```

**Actual Implementation:**
```typescript
// Create bucket without deprecated inline configurations
const bucket = new S3Bucket(this, 'alb-logs-bucket', {
  bucket: `${tags.Project}-alb-logs-${tags.Environment}-${Date.now()}`,
  tags: tags,
});

// Use separate resource constructs
new S3BucketVersioningA(this, 'alb-logs-versioning', {
  bucket: bucket.id,
  versioningConfiguration: {
    status: 'Enabled',
  },
});

new S3BucketServerSideEncryptionConfigurationA(this, 'alb-logs-encryption', {
  bucket: bucket.id,
  rule: [{
    applyServerSideEncryptionByDefault: {
      sseAlgorithm: 'AES256',
    },
  }],
});

new S3BucketLifecycleConfiguration(this, 'alb-logs-lifecycle', {
  bucket: bucket.id,
  rule: [{
    id: 'delete-old-logs',
    status: 'Enabled',
    expiration: [{
      days: 90,
    }],
  }],
});
```
AWS deprecated inline bucket configurations in favor of separate resource constructs for better state management.

---

### 4. RDS Password Generation Failure (Deployment Breaking)

**Model Response:**
```typescript
// Line 428 - Hardcoded non-compliant password
password: 'temp-password-change-me',  // FAILS AWS password validation
```
**Error:** `The parameter MasterUserPassword is not a valid password. Only printable ASCII characters besides '/', '@', '"', ' ' may be used.`

**Actual Implementation:**
```typescript
// Lines 546-562 - Proper password generation
private generateRandomPassword(): string {
  // Fix: Generate password without forbidden characters ('/', '@', '"', ' ')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&*+,-.:<=>?[]^_`{|}~';
  let password = '';
  
  // Ensure password meets complexity requirements
  password += 'Db';  // Start with uppercase and lowercase
  password += Math.floor(Math.random() * 10);  // Add a number
  password += '!';   // Add a special character
  
  // Generate remaining characters
  for (let i = 4; i < 20; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}
```
Implements proper password generation that meets AWS RDS password requirements.

---

### 5. RDS Engine Version Failure (Deployment Breaking)

**Model Response:**
```typescript
// Line 418 - Non-existent RDS version
engineVersion: '14.9',  // FAILS: Cannot find version 14.9 for postgres
```

**Actual Implementation:**
```typescript
// No hardcoded version - allows AWS to select latest compatible version
engine: config.engine || 'postgres',
// engineVersion not specified, uses AWS default
```
Removed hardcoded engine version to use AWS default stable version, preventing version mismatch errors.

---

### 6. CloudWatch Log Group KMS Key Failure (Deployment Breaking)

**Model Response:**
```typescript
// Missing KMS key configuration for CloudWatch Log Group
this.logGroup = new logs.CloudwatchLogGroup(this, 'app-logs', {
  name: `/aws/application/${config.tags.Project}`,
  retentionInDays: 30,
  tags: config.tags,
  // Missing kmsKeyId configuration
});
```
**Error:** `The specified KMS Key Id could not be found.`

**Actual Implementation:**
```typescript
// Properly configured without KMS (uses AWS default encryption)
this.logGroup = new CloudwatchLogGroup(this, 'app-log-group', {
  name: `/aws/ec2/${tags.Project}-${tags.Environment}/application`,
  retentionInDays: 30,
  tags: tags,
  // No kmsKeyId specified - uses AWS managed encryption
});
```
Removed explicit KMS configuration to use AWS-managed encryption, avoiding KMS key lookup failures.

---

### 7. S3 Backend State Configuration Missing (Infrastructure Management)

**Model Response:**
```typescript
// No S3 backend configuration for Terraform state management
```

**Actual Implementation:**
```typescript
// Configure S3 Backend with native state locking
new S3Backend(this, {
  bucket: stateBucket,
  key: `${environmentSuffix}/${id}.tfstate`,
  region: stateBucketRegion,
  encrypt: true,
});
// Using escape hatch for state locking
this.addOverride('terraform.backend.s3.use_lockfile', true);
```
Added proper S3 backend configuration with state locking for safe concurrent operations.

---

### 8. AWS Provider Configuration Missing (Authentication)

**Model Response:**
```typescript
// Basic provider configuration without proper tags
new AwsProvider(this, 'aws', {
  region: 'us-east-1',
  defaultTags: [{
    tags: {
      Terraform: 'true',
      ManagedBy: 'CDKTF',
    },
  }],
});
```

**Actual Implementation:**
```typescript
// Flexible provider configuration with overrides
const awsRegion = AWS_REGION_OVERRIDE ? AWS_REGION_OVERRIDE : props?.awsRegion || 'us-east-1';
const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

new AwsProvider(this, 'aws', {
  region: awsRegion,
  defaultTags: defaultTags,
});
```
Implemented configurable AWS provider with region override capability and flexible default tags.

---

### 9. Security Group Rule Creation Pattern (Circular Dependency Risk)

**Model Response:**
```typescript
// Inline ingress rules in security group definition - can cause circular dependencies
this.albSecurityGroup = new ec2.SecurityGroup(this, 'alb-sg', {
  ingress: [
    // Inline rules
  ],
});
```

**Actual Implementation:**
```typescript
// Create security group first, then add rules separately
this.ec2Sg = new SecurityGroup(this, 'ec2-sg', {
  name: `${tags.Project}-ec2-sg-${tags.Environment}`,
  vpcId: vpcId,
  // No inline ingress rules
});

// Add rules after creation to avoid circular dependencies
new SecurityGroupRule(this, 'ec2-sg-rule-alb', {
  type: 'ingress',
  fromPort: 80,
  toPort: 80,
  protocol: 'tcp',
  sourceSecurityGroupId: this.albSg.id,
  securityGroupId: this.ec2Sg.id,
});
```
Separated security group creation from rule attachment to prevent circular dependency issues.

---

### 10. ALB Listener Configuration (Missing Critical Parameters)

**Model Response:**
```typescript
// Basic listener configuration
defaultAction: [
  {
    type: 'forward',
    targetGroupArn: this.targetGroup.arn,
  },
],
```

**Actual Implementation:**
```typescript
// Complete listener configuration with proper array syntax
defaultAction: [
  {
    type: 'forward',
    targetGroupArn: this.targetGroup.arn,
  },
],
// Removed 'deregistrationDelay' from listener (belongs in target group)
```
Fixed listener configuration to use proper CDKTF array syntax for default actions.