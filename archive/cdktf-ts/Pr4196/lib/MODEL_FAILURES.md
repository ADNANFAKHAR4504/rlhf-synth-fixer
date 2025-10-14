# MODEL FAILURES

## Critical Deployment Failures - MODEL_RESPONSE vs IDEAL_RESPONSE

---

### 1. DB Subnet Group Naming Convention Violation

**Deployment Error:**
```
Error: only lowercase alphanumeric characters, hyphens, underscores, periods, and spaces allowed in "name"
│ with aws_db_subnet_group.main-vpc_db-subnet-group_D9EB4817 (main-vpc/db-subnet-group),
│ on cdk.tf.json line 372, in resource.aws_db_subnet_group.main-vpc_db-subnet-group_D9EB4817:
│  372:         "name": "TapStackpr4196-pr4196-vpc-db-subnet-group",
```

**MODEL_RESPONSE (Failed):**
```typescript
// In SecureVpc class
this.dbSubnetGroup = new rds.DbSubnetGroup(this, 'db-subnet-group', {
  name: `${props.projectName}-${props.environment}-db`, // TapStackpr4196-pr4196-vpc-db-subnet-group
  // Capital letters not allowed in DB subnet group names!
```

**IDEAL_RESPONSE (Fixed):**
```typescript
// lib/modules.ts - Line 526-532
this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
  name:
    config.name.toLowerCase().replace(/[^a-z0-9\-_.]/g, '-') +
    '-db-subnet-group',
  subnetIds: this.privateSubnets.map(s => s.id),
  tags: { ...config.tags, Name: `${config.name}-db-subnet-group` },
});
```
**Fix Applied:** Converts name to lowercase and replaces invalid characters with hyphens.

---

### 2. RDS Instance Identifier Format Violation

**Deployment Error:**
```
Error: only lowercase alphanumeric characters and hyphens allowed in "identifier"
Error: first character of "identifier" must be a letter
│ with aws_db_instance.main-rds_instance_2D733CBC (main-rds/instance),
│  343:         "identifier": "TapStackpr4196-pr4196-db",
```

**MODEL_RESPONSE (Failed):**
```typescript
instanceIdentifier: `${props.projectName}-${props.environment}-db`,
// Results in: "TapStackpr4196-pr4196-db" - starts with capital letter!
```

**IDEAL_RESPONSE (Fixed):**
```typescript
// lib/tap-stack.ts - Line 256
const rdsModule = new SecureRdsInstance(this, 'main-rds', {
  name: `db-${id.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${environmentSuffix}`,
  // Ensures identifier starts with letter 'db-' and is lowercase
```
**Fix Applied:** Prefixes with 'db-' to ensure starting with letter, converts to lowercase, removes invalid characters.

---

### 3. S3 Lifecycle Configuration Missing Required Filter

**Deployment Error:**
```
Warning: No attribute specified when one (and only one) of [rule[0].filter,rule[0].prefix] is required
│ with aws_s3_bucket_lifecycle_configuration.audit-trail_audit-bucket_lifecycle
```

**MODEL_RESPONSE (Failed):**
```typescript
// Missing filter in lifecycle rule
new s3.S3BucketLifecycleConfiguration(this, 'lifecycle', {
  bucket: this.bucket.id,
  rule: [{
    id: 'expire-old-versions',
    status: 'Enabled',
    noncurrentVersionExpiration: {
      noncurrentDays: props.lifecycleDays,
    },
    // NO FILTER SPECIFIED!
  }],
});
```

**IDEAL_RESPONSE (Fixed):**
```typescript
// lib/modules.ts - Line 182-196
lifecycleRules: [
  {
    id: 'expire-old-versions',
    status: 'Enabled',
    filter: {}, // Add empty filter - REQUIRED!
    noncurrentVersionExpiration: {
      noncurrent_days: 90, // Correct property name
    },
  },
],
```
**Fix Applied:** Added required `filter: {}` property and corrected property name.

---

### 4. S3 Lifecycle Property Name Mismatch

**Deployment Error:**
```
Error: Extraneous JSON object property
│ on cdk.tf.json line 1001, in noncurrent_version_expiration:
│ 1001:               "days": 90
│ No argument or block type is named "days".

Error: The argument "noncurrent_days" is required, but no definition was found.
```

**MODEL_RESPONSE (Failed):**
```typescript
// Wrong property names
noncurrentVersionExpiration: {
  noncurrentDays: 90, // Wrong! Used camelCase
}
// Also tried "days" instead of "noncurrent_days"
```

**IDEAL_RESPONSE (Fixed):**
```typescript
// lib/tap-stack.ts - Line 237-245
lifecycleRules: [
  {
    id: 'expire-old-versions',
    status: 'Enabled',
    filter: {}, // Add empty filter
    noncurrentVersionExpiration: {
      noncurrent_days: 90, // Correct: snake_case with full name
    },
  },
],
```
**Fix Applied:** Used correct Terraform property name `noncurrent_days` with snake_case.

---

### 5. KMS Key ID vs ARN for RDS Encryption

**Deployment Error:**
```
Error: "kms_key_id" (5b8fbce3-9589-44b7-9cca-c59dcacbe130) is an invalid ARN: arn: invalid prefix
│ with aws_db_instance.main-rds_instance_2D733CBC
│  328:         "kms_key_id": "${aws_kms_key.main-kms_key_0BE179F2.key_id}",
```

**MODEL_RESPONSE (Failed):**
```typescript
// Used keyId instead of keyArn
this.instance = new rds.DbInstance(this, 'instance', {
  kmsKeyId: props.kmsKeyId, // Passed key ID, not ARN!
  // ...
});
```

**IDEAL_RESPONSE (Fixed):**
```typescript
// lib/modules.ts - Line 320 and lib/tap-stack.ts - Line 261
const rdsModule = new SecureRdsInstance(this, 'main-rds', {
  kmsKeyId: kmsModule.keyArn, // Pass ARN, not ID!
  // ...
});
```
**Fix Applied:** Passes `keyArn` instead of `keyId` to RDS instance configuration.

---

### 6. IAM Role Duplicate Tag Keys

**Deployment Error:**
```
Error: creating IAM Role: Duplicate tag keys found. Please note that Tag keys are case insensitive.
│ with aws_iam_role.audit-trail_trail-role_8CF661E1 (audit-trail/trail-role/role)
```

**MODEL_RESPONSE (Failed):**
```typescript
// Case-sensitive duplicate tags
const commonTags = {
  project: config.projectName,
  Project: config.projectName, // DUPLICATE! IAM treats as same key
  environment,
  Environment: environment, // DUPLICATE!
  // ...
};
```

**IDEAL_RESPONSE (Fixed):**
```typescript
// lib/modules.ts - Line 75-86
// Filter out duplicate tags (case-insensitive)
const uniqueTags: { [key: string]: string } = {};
Object.entries(config.tags).forEach(([key, value]) => {
  const lowerKey = key.toLowerCase();
  if (!Object.keys(uniqueTags).some(k => k.toLowerCase() === lowerKey)) {
    uniqueTags[key] = value;
  }
});

this.role = new IamRole(this, 'role', {
  name: config.name,
  assumeRolePolicy: JSON.stringify(config.assumeRolePolicy),
  tags: uniqueTags, // Use filtered tags
});
```
**Fix Applied:** Implements case-insensitive duplicate tag filtering before applying to IAM resources.

---

### 7. CloudTrail S3 Bucket Policy Insufficient Permissions

**Deployment Error:**
```
Error: creating CloudTrail Trail: InsufficientS3BucketPolicyException: 
Incorrect S3 bucket policy is detected for bucket: tapstackpr4196-pr4196-audit-logs
```

**MODEL_RESPONSE (Failed):**
```typescript
// Incomplete bucket policy for CloudTrail
const bucketPolicy = new s3.S3BucketPolicy(this, 'bucket-policy', {
  bucket: this.bucket.bucket.id,
  policy: JSON.stringify({
    Statement: [
      {
        Sid: 'AWSCloudTrailAclCheck',
        Effect: 'Allow',
        Principal: { Service: 'cloudtrail.amazonaws.com' },
        Action: 's3:GetBucketAcl',
        Resource: this.bucket.bucket.arn,
      },
      // Missing encryption context and describe key permissions!
    ],
  }),
});
```

**IDEAL_RESPONSE (Fixed):**
```typescript
// lib/modules.ts - Line 137-165
const keyPolicy = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'Enable IAM User Permissions',
      Effect: 'Allow',
      Principal: {
        AWS: config.accountId
          ? `arn:aws:iam::${config.accountId}:root`
          : '*',
      },
      Action: 'kms:*',
      Resource: '*',
    },
    {
      Sid: 'Allow CloudTrail to encrypt logs',
      Effect: 'Allow',
      Principal: { Service: 'cloudtrail.amazonaws.com' },
      Action: ['kms:GenerateDataKey*', 'kms:DecryptDataKey*'],
      Resource: '*',
      Condition: {
        StringLike: {
          'kms:EncryptionContext:aws:cloudtrail:arn': '*',
        },
      },
    },
    {
      Sid: 'Allow CloudTrail to describe key',
      Effect: 'Allow',
      Principal: { Service: 'cloudtrail.amazonaws.com' },
      Action: 'kms:DescribeKey',
      Resource: '*',
    },
  ],
};
```
**Fix Applied:** Adds complete CloudTrail permissions including KMS encryption context and describe key permissions.

---

### 8. S3 Bucket Naming Convention Violation

**MODEL_RESPONSE (Failed):**
```typescript
// Bucket names can't have uppercase letters
bucketName: `${props.projectName}-${props.environment}-data`,
// Results in: "TapStackpr4196-pr4196-data" - contains uppercase!
```

**IDEAL_RESPONSE (Fixed):**
```typescript
// lib/tap-stack.ts - Lines 232 & 248
const publicS3Module = new EncryptedS3Bucket(this, 'public-s3', {
  name: `${id.toLowerCase()}-${environmentSuffix}-public-assets`, // .toLowerCase() added!
  // ...
});
```
**Fix Applied:** Applies `.toLowerCase()` to ensure S3 bucket names comply with AWS naming requirements.

---

### 9. Missing Enhanced Monitoring Role for RDS

**MODEL_RESPONSE (Failed):**
```typescript
// Missing monitoring role configuration
this.instance = new rds.DbInstance(this, 'instance', {
  monitoringInterval: 60, // Set but no role!
  // monitoringRoleArn: undefined - MISSING!
});
```

**IDEAL_RESPONSE (Fixed):**
```typescript
// lib/modules.ts - Lines 324-344
if (config.monitoringInterval && config.monitoringInterval > 0) {
  this.monitoringRole = new IamRole(this, 'monitoring-role', {
    name: `${config.name}-rds-monitoring-role`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { Service: 'monitoring.rds.amazonaws.com' },
        Action: 'sts:AssumeRole',
      }],
    }),
    managedPolicyArns: [
      'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
    ],
    tags: config.tags,
  });
  monitoringRoleArn = this.monitoringRole.arn;
}
```
**Fix Applied:** Creates dedicated monitoring role when `monitoringInterval` is specified.

---

### 10. Import Statement Failures

**MODEL_RESPONSE (Failed):**
```typescript
// Incorrect/outdated imports
import { AwsProvider, iam, kms, s3, rds, ec2 } from '@cdktf/provider-aws';
// Wrong! These are not valid import paths

// Also used deprecated classes:
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
// Should be S3BucketVersioningA
```

**IDEAL_RESPONSE (Fixed):**
```typescript
// lib/modules.ts - Lines 1-45
// Correct individual imports for each resource
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
// Properly imports each class from its specific module
```
**Fix Applied:** Uses correct import paths for CDKTF v0.20+ with individual resource imports.

---

## Summary of Critical Fixes

The IDEAL_RESPONSE successfully addresses all deployment-breaking issues:

1. **Resource Naming**: Properly formats all AWS resource names (lowercase, valid characters)
2. **Property Names**: Uses correct Terraform property names (snake_case, not camelCase)
3. **Required Parameters**: Includes all required parameters (filters, ARNs vs IDs)
4. **IAM Policies**: Implements complete policies with proper permissions
5. **Tag Management**: Handles case-insensitive duplicate tag filtering
6. **Import Structure**: Uses correct CDKTF v0.20+ import patterns
7. **Role Management**: Creates all necessary IAM roles (monitoring, EC2, etc.)
8. **Bucket Policies**: Implements complete S3 policies for CloudTrail
9. **Type Safety**: Properly handles TypeScript types and null checks
10. **AWS Compliance**: Ensures all resources comply with AWS naming and configuration requirements
