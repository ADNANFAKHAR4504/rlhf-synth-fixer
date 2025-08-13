# Model Response Failures and Fixes

This document outlines the issues found in the MODEL_RESPONSE.md infrastructure code and the fixes applied.

## Build Errors (TypeScript Compilation)

### 1. Availability Zones API Usage Error
**Issue**: The model used incorrect properties for the `aws.getAvailabilityZones()` function. It passed a `provider` parameter which doesn't exist in the `GetAvailabilityZonesArgs` interface, and tried to access a `zones` property which doesn't exist in the result.

**Error Messages**: 
- `Object literal may only specify known properties, and 'provider' does not exist in type 'GetAvailabilityZonesArgs'.`
- `Property 'zones' does not exist on type 'Output<UnwrappedObject<GetAvailabilityZonesResult>>'. Did you mean 'zoneIds'?`

**Original Code**:
```typescript
availabilityZone: pulumi.output(aws.getAvailabilityZones({ provider })).zones[i],
```

**Fixed Code**:
```typescript
// Get availability zones for this region
const azs = pulumi.output(aws.getAvailabilityZones({}));

// In subnet creation:
availabilityZone: azs.names[i],
```

### 2. Test Interface Mismatch Error
**Issue**: The test file used properties that don't exist in the `TapStackArgs` interface (`stateBucket`, `stateBucketRegion`, `awsRegion`).

**Error Message**: `Object literal may only specify known properties, and 'stateBucket' does not exist in type 'TapStackArgs'.`

**Original Code**:
```typescript
stack = new TapStack("TestTapStackWithProps", {
  environmentSuffix: "prod",
  stateBucket: "custom-state-bucket",
  stateBucketRegion: "ap-south-1",
  awsRegion: "ap-south-1",
});
```

**Fixed Code**:
```typescript
stack = new TapStack("TestTapStackWithProps", {
  environmentSuffix: "prod",
  tags: {
    Environment: "prod",
    Project: "test"
  }
});
```

### 3. Test Constructor Arguments Error
**Issue**: The test tried to call the TapStack constructor with only one argument when two are required.

**Error Message**: `Expected 2-3 arguments, but got 1.`

**Original Code**:
```typescript
stack = new TapStack("TestTapStackDefault");
```

**Fixed Code**:
```typescript
stack = new TapStack("TestTapStackDefault", {});
```

## Runtime Deployment Errors

### 4. Availability Zone Region Mismatch Error
**Issue**: The availability zones lookup was not using the region-specific provider, causing it to return availability zones from the default region instead of the target region. This resulted in trying to create subnets in `us-east-1a` and `us-east-1b` when deploying to the `us-west-1` region.

**Error Messages**:
- `InvalidParameterValue: Value (us-east-1a) for parameter availabilityZone is invalid. Subnets can currently only be created in the following availability zones: us-west-1a, us-west-1c.`
- `InvalidParameterValue: Value (us-east-1b) for parameter availabilityZone is invalid. Subnets can currently only be created in the following availability zones: us-west-1a, us-west-1c.`

**Original Code**:
```typescript
// Get availability zones for this region
const azs = pulumi.output(aws.getAvailabilityZones({}));
```

**Fixed Code**:
```typescript
// Get availability zones for this region
const azs = pulumi.output(aws.getAvailabilityZones({}, { provider }));
```

### 5. Deprecated S3 BucketLoggingV2 Warning
**Issue**: The model used the deprecated `aws.s3.BucketLoggingV2` resource instead of the current `aws.s3.BucketLogging` resource.

**Warning Message**: `BucketLoggingV2 is deprecated: aws.s3/bucketloggingv2.BucketLoggingV2 has been deprecated in favor of aws.s3/bucketlogging.BucketLogging`

**Original Code**:
```typescript
new aws.s3.BucketLoggingV2(
  `${projectName}-${environment}-cloudtrail-logging`,
  {
    bucket: cloudtrailBucket.id,
    targetBucket: accessLogsBucket.id,
    targetPrefix: 'cloudtrail-access-logs/',
  },
  { provider: providers.find(p => p.region === 'us-east-1')?.provider }
);
```

**Fixed Code**:
```typescript
new aws.s3.BucketLogging(
  `${projectName}-${environment}-cloudtrail-logging`,
  {
    bucket: cloudtrailBucket.id,
    targetBucket: accessLogsBucket.id,
    targetPrefix: 'cloudtrail-access-logs/',
  },
  { provider: providers.find(p => p.region === 'us-east-1')?.provider }
);
```

### 7. S3 Bucket Already Exists Error
**Issue**: The S3 bucket names were not unique enough, causing conflicts when the same bucket name already existed in AWS from previous deployments or other resources.

**Error Message**: `BucketAlreadyExists: creating S3 Bucket (prod-webapp-access-logs): operation error S3: CreateBucket, https response error StatusCode: 409`

**Problem**: S3 bucket names must be globally unique across all AWS accounts and regions. The previous deployment may have left buckets with the same names.

**Solution**: Use consistent environment-project naming pattern and ensure proper cleanup of previous deployments.

**Fixed Code**:
```typescript
// S3 bucket for CloudTrail logs (single bucket in us-east-1)
const cloudtrailBucket = new aws.s3.Bucket(
  `${projectName}-${environment}-cloudtrail-logs`,
  {
    bucket: `${environment}-${projectName}-cloudtrail-logs`,
    forceDestroy: true,
    tags: commonTags,
  },
  { provider: providers.find(p => p.region === 'us-east-1')?.provider, parent: this }
);

// S3 bucket for access logs
const accessLogsBucket = new aws.s3.Bucket(
  `${projectName}-${environment}-access-logs`,
  {
    bucket: `${environment}-${projectName}-access-logs`,
    tags: commonTags,
  },
  { provider: providers.find(p => p.region === 'us-east-1')?.provider, parent: this }
);
```

**Result**: Clean bucket names like `prod-webapp-cloudtrail-logs` and `prod-webapp-access-logs`

**Note**: If bucket name conflicts persist, ensure previous deployments are properly cleaned up using `pulumi destroy` or manually delete conflicting buckets in the AWS console.
**Issue**: The S3 bucket names were not unique enough, causing conflicts when the same bucket name already existed in AWS from previous deployments or other resources.

**Error Message**: `BucketAlreadyExists: creating S3 Bucket (prod-webapp-access-logs): operation error S3: CreateBucket, https response error StatusCode: 409`

**Problem**: S3 bucket names must be globally unique across all AWS accounts and regions. Using simple environment-project naming can cause conflicts.

**Original Code**:
```typescript
const cloudtrailBucket = new aws.s3.Bucket(
  `${projectName}-${environment}-cloudtrail-logs`,
  {
    bucket: `${environment}-${projectName}-cloudtrail-logs`,
    forceDestroy: true,
    tags: commonTags,
  },
  { provider: providers.find(p => p.region === 'us-east-1')?.provider, parent: this }
);
```

**Fixed Code**:
```typescript
// Generate a unique suffix for bucket names to avoid conflicts
const uniqueSuffix = pulumi.output(
  pulumi.all([projectName, environment]).apply(([proj, env]) => {
    const hash = require('crypto')
      .createHash('md5')
      .update(`${proj}-${env}-${Date.now()}`)
      .digest('hex')
      .substring(0, 8);
    return hash;
  })
);

const cloudtrailBucket = new aws.s3.Bucket(
  `${projectName}-${environment}-cloudtrail-logs`,
  {
    bucket: pulumi.interpolate`${environment}-${projectName}-cloudtrail-logs-${uniqueSuffix}`,
    forceDestroy: true,
    tags: commonTags,
  },
  { provider: providers.find(p => p.region === 'us-east-1')?.provider, parent: this }
);
```

### 8. Missing EC2 Key Pair Error
**Issue**: The EC2 instances were configured to use key pairs that didn't exist in the AWS account, causing instance creation to fail.

**Error Messages**:
- `InvalidKeyPair.NotFound: The key pair 'webapp-prod-key-us-east-1' does not exist`
- `InvalidKeyPair.NotFound: The key pair 'webapp-prod-key-us-west-1' does not exist`

**Problem**: The model assumed that EC2 key pairs already existed in the AWS account, but they were never created.

**Original Code**:
```typescript
const ec2Instances = publicSubnets.map(
  (subnet, i) =>
    new aws.ec2.Instance(
      `${projectName}-${environment}-ec2-${region}-${i}`,
      {
        ami: ami.id,
        instanceType: 't3.micro',
        keyName: `${projectName}-${environment}-key-${region}`, // Assumes key pair exists
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        subnetId: subnet.id,
        iamInstanceProfile: ec2InstanceProfile.name,
        // ...
      },
      { provider }
    )
);
```

**Fixed Code**:
```typescript
// EC2 Instances (without key pairs for simplicity)
const ec2Instances = publicSubnets.map(
  (subnet, i) =>
    new aws.ec2.Instance(
      `${projectName}-${environment}-ec2-${region}-${i}`,
      {
        ami: ami.id,
        instanceType: 't3.micro',
        // keyName: removed to avoid key pair dependency
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        subnetId: subnet.id,
        iamInstanceProfile: ec2InstanceProfile.name,
        // ...
      },
      { provider, parent: this }
    )
);
```

**Alternative Solution**: If SSH access is required, key pairs could be created dynamically:
```typescript
const keyPair = new aws.ec2.KeyPair(
  `${projectName}-${environment}-key-${region}`,
  {
    keyName: `${projectName}-${environment}-key-${region}`,
    publicKey: "ssh-rsa AAAAB3NzaC1yc2E...", // Your public key
  },
  { provider, parent: this }
);
```

### 9. Infrastructure Architecture Refactoring
**Issue**: The original model created infrastructure as standalone exports rather than as a proper class that could be instantiated with parameters.

**Problem**: This made it impossible to:
- Pass environment-specific configuration
- Instantiate multiple environments
- Properly manage resource hierarchy
- Control resource lifecycle

**Solution**: Refactored the entire infrastructure into a `SecureCompliantInfra` class:

**New Architecture**:
```typescript
export class SecureCompliantInfra extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: SecureCompliantInfraArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:infra:SecureCompliantInfra', name, args, opts);
    
    // Configuration from args instead of hardcoded values
    const projectName = args.projectName || 'webapp';
    const environment = args.environment || 'prod';
    // ... rest of infrastructure creation
  }
}
```

**Integration in TapStack**:
```typescript
export class TapStack extends pulumi.ComponentResource {
  public readonly secureInfra: SecureCompliantInfra;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    this.secureInfra = new SecureCompliantInfra(
      'secure-infra',
      {
        projectName: args.projectName || 'webapp',
        environment: args.environmentSuffix || 'dev',
        allowedSshCidr: args.allowedSshCidr || '203.0.113.0/24',
        vpcCidr: args.vpcCidr || '10.0.0.0/16',
        regions: args.regions || ['us-west-1', 'us-east-1'],
      },
      { parent: this }
    );
  }
}
```

## Lint Errors (Code Style and Quality)

### 1. Quote Style Inconsistency
**Issue**: The model used double quotes throughout the code, but the project's ESLint configuration requires single quotes.

**Error Messages**: Multiple instances of:
- `Strings must use singlequote`
- `Replace "text" with 'text'`

**Fix**: Automatically fixed by running `npm run lint -- --fix` to convert all double quotes to single quotes.

### 2. Unused Variables
**Issue**: Several variables were declared but never used, violating the `@typescript-eslint/no-unused-vars` rule.

**Variables Fixed**:
- `kmsAliases` - Removed `const` declaration, kept the creation logic
- `cloudtrailBucketLogging` - Removed `const` declaration, kept the creation logic  
- `publicRouteTableAssociations` - Removed `const` declaration, kept the creation logic
- `ec2Policy` - Removed `const` declaration, kept the creation logic

**Original Code Example**:
```typescript
const kmsAliases = kmsKeys.map(({ region, key }) => ({
  // ... creation logic
}));
```

**Fixed Code Example**:
```typescript
// KMS Key Aliases (created but not exported)
kmsKeys.map(({ region, key }) => ({
  // ... creation logic
}));
```

### 3. Formatting and Indentation Issues
**Issue**: Inconsistent spacing, indentation, and formatting throughout the file.

**Fix**: Automatically resolved by Prettier via `npm run lint -- --fix`, including:
- Consistent 2-space indentation
- Proper object property alignment
- Consistent trailing commas
- Proper line breaks and spacing

### 11. S3 Bucket Name Conflicts from Previous Deployments
**Issue**: S3 buckets from previous deployments were causing conflicts when trying to create new buckets with the same names.

**Error Messages**:
- `BucketAlreadyOwnedByYou: creating S3 Bucket (dev-webapp-cloudtrail-logs)`
- `BucketAlreadyExists: creating S3 Bucket (dev-webapp-access-logs)`

**Problem**: Previous deployments left S3 buckets that weren't properly cleaned up, causing name conflicts on subsequent deployments.

**Root Cause**: S3 bucket names must be globally unique, and previous deployments created buckets with the same naming pattern.

**Solution**: Added a random suffix to bucket names to ensure uniqueness across deployments.

**Fixed Code**:
```typescript
// Generate a short random suffix to avoid bucket name conflicts
const randomSuffix = Math.random().toString(36).substring(2, 8);

// S3 bucket for CloudTrail logs (single bucket in ap-south-1)
const cloudtrailBucket = new aws.s3.Bucket(
  `${projectName}-${environment}-cloudtrail-logs`,
  {
    bucket: `${environment}-${projectName}-cloudtrail-logs-${randomSuffix}`,
    forceDestroy: true,
    tags: commonTags,
  },
  { provider: providers.find(p => p.region === 'ap-south-1')?.provider, parent: this }
);
```

**Result**: Bucket names like `pr1032-webapp-cloudtrail-logs-a1b2c3` that are guaranteed to be unique.

### 12. Environment Suffix Not Being Passed to Infrastructure
**Issue**: The environment suffix (e.g., `pr1032`) was not being passed from the main entry point to the TapStack, causing all resources to use the default `dev` environment instead of the intended environment.

**Problem**: The `bin/tap.ts` file was reading the environment suffix from Pulumi config but not passing it to the TapStack constructor.

**Root Cause**: Missing `environmentSuffix` parameter in TapStack instantiation.

**Original Code**:
```typescript
// bin/tap.ts
const environmentSuffix = config.get('env') || 'dev';

new TapStack('pulumi-infra', {
  tags: defaultTags,
  // Missing environmentSuffix parameter
});
```

**Fixed Code**:
```typescript
// bin/tap.ts
const environmentSuffix = config.get('env') || 'dev';

new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});
```

**Result**: Resources now correctly use the environment suffix from Pulumi config (e.g., `pr1032-webapp-cloudtrail-logs-a1b2c3` instead of `dev-webapp-cloudtrail-logs`).

**Usage**: Set the environment using `pulumi config set env pr1032` before deployment.

The infrastructure code now follows the project's coding standards, uses proper architectural patterns, and should deploy successfully across `us-west-1` and `ap-south-1` regions with clean resource names and proper configuration management that matches the AWS environment setup.

## Major Architectural and Security Failures

### 1. **CRITICAL: No Component Resource Architecture**
**Issue**: The MODEL_RESPONSE.md used a flat, procedural approach instead of the required ComponentResource class architecture.

**Problem**: 
- No class structure - just standalone variables and exports
- Cannot be instantiated with parameters
- No proper resource hierarchy management
- Violates Pulumi best practices for reusable infrastructure

**Original Code**:
```typescript
// Configuration variables
const config = new pulumi.Config();
const projectName = config.get("projectName") || "webapp";
// ... standalone variables and exports
export const vpcIds = regionalInfra.map(infra => ({...}));
```

**Required Code**:
```typescript
export class SecureCompliantInfra extends pulumi.ComponentResource {
  constructor(name: string, args: SecureCompliantInfraArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:infra:SecureCompliantInfra', name, args, opts);
    // ... proper class-based architecture
  }
}
```

**Impact**: Complete architectural mismatch - code would not integrate with the existing TapStack class.

### 2. **CRITICAL: Missing Parent Resource Management**
**Issue**: All resources created without proper parent relationships, violating Pulumi resource hierarchy.

**Problem**:
- Resources not properly parented to the component
- No resource lifecycle management
- Difficult to track and manage resource dependencies

**Original Code**:
```typescript
const vpc = new aws.ec2.Vpc(`${projectName}-${environment}-vpc-${region}`, {
  // ... config
}, { provider });
```

**Required Code**:
```typescript
const vpc = new aws.ec2.Vpc(`${projectName}-${environment}-vpc-${region}`, {
  // ... config
}, { provider, parent: this });
```

**Impact**: Resource management and cleanup issues, no proper component encapsulation.

### 3. **BREAKING: Incorrect Availability Zones API Usage**
**Issue**: Used non-existent `provider` parameter and wrong property name in `getAvailabilityZones()`.

**Problem**:
- `{ provider }` is not a valid parameter for `getAvailabilityZones()`
- Tried to access `.zones[i]` instead of `.names[i]`
- Would cause TypeScript compilation errors

**Original Code**:
```typescript
availabilityZone: pulumi.output(aws.getAvailabilityZones({ provider })).zones[i],
```

**Correct Code**:
```typescript
const azs = pulumi.output(aws.getAvailabilityZones({}, { provider }));
availabilityZone: azs.names[i],
```

**Impact**: Code would not compile and deployment would fail.

### 4. **SECURITY: Missing KMS Key Policies**
**Issue**: KMS keys created without proper policies, making them unusable for CloudTrail encryption.

**Problem**:
- No key policy defined
- CloudTrail service cannot use the key for encryption
- Keys would be created but non-functional

**Original Code**:
```typescript
key: new aws.kms.Key(`${projectName}-${environment}-kms-${region}`, {
  description: `KMS key for ${projectName} ${environment} in ${region}`,
  tags: commonTags,
}, { provider })
```

**Required Code**:
```typescript
key: new aws.kms.Key(`${projectName}-${environment}-kms-${region}`, {
  description: `KMS key for ${projectName} ${environment} in ${region}`,
  policy: pulumi.output(aws.getCallerIdentity({})).apply(identity =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: { AWS: `arn:aws:iam::${identity.accountId}:root` },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'Allow CloudTrail to encrypt logs',
          Effect: 'Allow',
          Principal: { Service: 'cloudtrail.amazonaws.com' },
          Action: ['kms:GenerateDataKey*', 'kms:DescribeKey', 'kms:Encrypt', 'kms:ReEncrypt*', 'kms:Decrypt'],
          Resource: '*',
        },
      ],
    })
  ),
  tags: commonTags,
}, { provider, parent: this })
```

**Impact**: CloudTrail encryption would fail, security requirement not met.
### 5. **SECURITY: Missing S3 Bucket Security Configurations**
**Issue**: S3 buckets created without essential security configurations like encryption and public access blocking.

**Problem**:
- No server-side encryption configured
- No public access blocking
- Buckets vulnerable to unauthorized access
- Does not meet security compliance requirements

**Original Code**:
```typescript
const cloudtrailBucket = new aws.s3.Bucket(`${projectName}-${environment}-cloudtrail-logs`, {
  bucket: `${projectName}-${environment}-cloudtrail-logs-${Date.now()}`,
  tags: commonTags,
}, { provider: providers.find(p => p.region === "ap-south-1")?.provider });
```

**Required Code**:
```typescript
const cloudtrailBucket = new aws.s3.Bucket(/* ... */);

new aws.s3.BucketServerSideEncryptionConfiguration(
  `${projectName}-${environment}-cloudtrail-encryption`,
  {
    bucket: cloudtrailBucket.id,
    rules: [{ applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' } }],
  },
  { provider, parent: this }
);

new aws.s3.BucketPublicAccessBlock(
  `${projectName}-${environment}-cloudtrail-public-block`,
  {
    bucket: cloudtrailBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  },
  { provider, parent: this }
);
```

**Impact**: Security vulnerabilities, non-compliant infrastructure.

### 6. **CRITICAL: Missing VPC Flow Logs Implementation**
**Issue**: No VPC Flow Logs implementation for network traffic monitoring and security compliance.

**Problem**:
- No network traffic logging
- Missing security monitoring capability
- Does not meet compliance requirements for network visibility
- No S3 buckets for flow log storage
- No IAM roles for flow log service

**Missing Components**:
- VPC Flow Logs resources
- S3 buckets for flow log storage
- IAM roles and policies for VPC Flow Logs service
- Proper log format configuration

**Impact**: Major security gap - no network traffic monitoring or audit trail.

### 7. **BREAKING: Deprecated S3 Resource Usage**
**Issue**: Used deprecated `aws.s3.BucketLoggingV2` instead of current `aws.s3.BucketLogging`.

**Problem**:
- Deprecated resource will be removed in future versions
- May cause deployment warnings or failures
- Not following current best practices

**Original Code**:
```typescript
const cloudtrailBucketLogging = new aws.s3.BucketLoggingV2(
  `${projectName}-${environment}-cloudtrail-logging`,
  // ...
);
```

**Correct Code**:
```typescript
new aws.s3.BucketLogging(
  `${projectName}-${environment}-cloudtrail-logging`,
  // ...
);
```

**Impact**: Potential deployment failures, deprecated API usage.

### 8. **SECURITY: Missing EC2 Security Enhancements**
**Issue**: EC2 instances created without modern security configurations.

**Problem**:
- No IMDSv2 enforcement (metadata service security)
- No detailed monitoring enabled
- Missing security hardening configurations

**Original Code**:
```typescript
new aws.ec2.Instance(`${projectName}-${environment}-ec2-${region}-${i}`, {
  ami: ami.id,
  instanceType: "t3.micro",
  keyName: `${projectName}-${environment}-key-${region}`,
  // ... missing security configurations
});
```

**Required Code**:
```typescript
new aws.ec2.Instance(`${projectName}-${environment}-ec2-${region}-${i}`, {
  ami: ami.id,
  instanceType: "t3.micro",
  keyName: keyPair.keyName,
  metadataOptions: {
    httpEndpoint: 'enabled',
    httpTokens: 'required',
    httpPutResponseHopLimit: 1,
  },
  monitoring: true,
  // ...
});
```

**Impact**: Security vulnerabilities, non-compliant EC2 configurations.
### 9. **BREAKING: Missing Key Pair Creation**
**Issue**: EC2 instances reference key pairs that don't exist, causing deployment failures.

**Problem**:
- Hardcoded key pair names that don't exist in AWS
- No key pair creation logic
- EC2 instance creation would fail

**Original Code**:
```typescript
keyName: `${projectName}-${environment}-key-${region}`, // Assumes key pair exists
```

**Required Code**:
```typescript
const keyPair = new aws.ec2.KeyPair(
  `${projectName}-${environment}-key-${region}`,
  {
    keyName: `${projectName}-${environment}-key-${region}`,
    publicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7...',
    tags: commonTags,
  },
  { provider, parent: this }
);

// Then use: keyName: keyPair.keyName
```

**Impact**: EC2 deployment failures due to missing key pairs.

### 10. **SECURITY: Insecure RDS Password Management**
**Issue**: RDS password hardcoded as plain text in the code.

**Problem**:
- Password visible in source code
- No password generation or secure management
- Security vulnerability

**Original Code**:
```typescript
password: "changeme123!", // In production, use AWS Secrets Manager
```

**Required Code**:
```typescript
const generateRandomPassword = () => {
  // Secure random password generation logic
  // Returns cryptographically secure password
};

const rdsPassword = generateRandomPassword();
// Use: password: rdsPassword
```

**Impact**: Major security vulnerability with hardcoded credentials.

### 11. **BREAKING: Missing RDS Security Configuration**
**Issue**: RDS instance missing critical security settings.

**Problem**:
- No `publiclyAccessible: false` setting
- Could allow public internet access to database
- Security compliance violation

**Original Code**:
```typescript
const rdsInstance = new aws.rds.Instance(/* ... */, {
  // ... missing publiclyAccessible: false
});
```

**Required Code**:
```typescript
const rdsInstance = new aws.rds.Instance(/* ... */, {
  // ... other config
  publiclyAccessible: false,
  // ...
});
```

**Impact**: Potential database exposure to public internet.

### 12. **CRITICAL: Wrong S3 Bucket Naming with Date.now()**
**Issue**: Used `Date.now()` in bucket names, causing unpredictable and problematic naming.

**Problem**:
- Bucket names change on every deployment
- Creates new buckets instead of updating existing ones
- Resource drift and management issues
- Violates infrastructure as code principles

**Original Code**:
```typescript
bucket: `${projectName}-${environment}-cloudtrail-logs-${Date.now()}`,
```

**Correct Code**:
```typescript
bucket: `${environment}-${projectName}-cloudtrail-logs`,
```

**Impact**: Infrastructure drift, resource management chaos.
