# Model Failures Documentation

This document tracks issues identified in the model's code and their resolutions.

---

## Summary

All identified issues were security vulnerabilities, infrastructure misconfigurations, and compatibility issues that would expose the application to security risks or cause deployment failures:

1. **S3 Bucket Public Access**: Content bucket was publicly accessible instead of using CloudFront Origin Access Control
2. **Node.js Version Compatibility**: Node.js 18 had GLIBC compatibility issues on Amazon Linux 2
3. **KMS Key Access for EBS Encryption**: EC2 instances couldn't access KMS key for EBS volume decryption

These issues demonstrate the importance of:

- Following AWS security best practices
- Using proper access controls for S3 buckets
- Implementing CloudFront Origin Access Control for secure content delivery
- Ensuring runtime compatibility with the target operating system
- Testing Node.js versions for GLIBC compatibility
- Configuring proper KMS key policies for EBS encryption

---

### 1. S3 Bucket Public Access Security Vulnerability (CRITICAL)

**Location:** `lib/infrastructure.ts` lines 279-296

**Issue:**

```typescript
// MODEL (VULNERABLE):
const contentBucket = new s3.Bucket(
  this,
  `ContentBucket-${this.environmentSuffix}`,
  {
    bucketName: `tap-content-${this.environmentSuffix}-${this.account}`,
    publicReadAccess: true, // SECURITY RISK: Bucket is publicly accessible
    websiteIndexDocument: 'index.html',
    websiteErrorDocument: 'error.html',
    // ... other config
  }
);
```

**Security Risk:**

```
- S3 bucket is publicly accessible to anyone on the internet
- Content can be accessed directly via S3 URL, bypassing CloudFront
- No access control or rate limiting
- Potential for unauthorized access and data exfiltration
- Violates AWS security best practices
```

**Fix:**

```typescript
// IDEAL (SECURE):
const contentBucket = new s3.Bucket(
  this,
  `ContentBucket-${this.environmentSuffix}`,
  {
    bucketName: `tap-content-${this.environmentSuffix}-${this.account}`,
    publicReadAccess: false, // SECURITY FIX: Make bucket private
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // SECURITY FIX: Block all public access
    // Remove website configuration as it's not needed with CloudFront
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: kmsKey,
    // ... other config
  }
);

// Create Origin Access Control (OAC) for secure CloudFront access
const originAccessControl = new cloudfront.CfnOriginAccessControl(
  this,
  `OAC-${this.environmentSuffix}`,
  {
    originAccessControlConfig: {
      name: `tap-oac-${this.environmentSuffix}`,
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
      description: `OAC for TapStack ${this.environmentSuffix}`,
    },
  }
);

// Add bucket policy to allow CloudFront OAC access
contentBucket.addToResourcePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
    actions: ['s3:GetObject'],
    resources: [contentBucket.arnForObjects('*')],
    conditions: {
      StringEquals: {
        'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
      },
    },
  })
);
```

**Security Benefits:**

- S3 bucket is private and only accessible via CloudFront
- CloudFront OAC provides secure, authenticated access
- Content can only be accessed through CloudFront distribution
- Enables CloudFront features like caching, compression, and security headers
- Follows AWS security best practices

**Severity:** CRITICAL - Security vulnerability exposes content to unauthorized access

---

### 2. Node.js Version Compatibility Issue (BLOCKER)

**Location:** `lib/infrastructure.ts` lines 653, 409-410, 865-866

**Issue:**

```typescript
// MODEL (FAILED):
runtime: lambda.Runtime.NODEJS_18_X,  // FAILED: GLIBC compatibility issue

// In user data script:
// No Node.js installation specified - defaults to system version

// In CodeBuild:
// No Node.js installation specified - uses system version
```

**Error:**

```
[   49.458222] cloud-init[2492]: Error: Package: 2:nodejs-18.20.8-1nodesource.x86_64 (nodesource-nodejs)
[   49.460327] cloud-init[2492]: Requires: libm.so.6(GLIBC_2.27)(64bit)
[   49.461823] cloud-init[2492]: Error: Package: 2:nodejs-18.20.8-1nodesource.x86_64 (nodesource-nodejs)
```

**Root Cause:**

- Amazon Linux 2 has GLIBC 2.26, but Node.js 18 requires GLIBC 2.27
- This causes package installation failures during EC2 instance initialization
- Lambda runtime and CodeBuild environments also affected

**Fix:**

```typescript
// IDEAL (CORRECT):
runtime: lambda.Runtime.NODEJS_22_X,  // CORRECT: Node.js 22 has better GLIBC compatibility

// In user data script:
'curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -',
'yum install -y nodejs',

// In CodeBuild:
'curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -',
'yum install -y nodejs',
'node --version',
'npm --version',
```

**Benefits:**

- Node.js 22 has better GLIBC compatibility with Amazon Linux 2
- Resolves package installation failures
- Ensures consistent Node.js version across all environments
- Provides latest Node.js features and security updates

**Severity:** CRITICAL - Deployment fails due to package installation errors

---

### 3. KMS Key Access for EBS Encryption (BLOCKER)

**Location:** `lib/infrastructure.ts` lines 133-162, 269-285, 471-478

**Issue:**

```typescript
// MODEL (FAILED):
// No KMS permissions for EC2 role
const ec2Role = this.createEc2Role(); // Missing KMS key parameter

// No KMS key policy for EC2 service
const kmsKey = new kms.Key(this, `KmsKey-${this.environmentSuffix}`, {
  alias: `alias/tap-stack-${this.environmentSuffix}`,
  description: `KMS key for TapStack ${this.environmentSuffix}`,
  enableKeyRotation: true,
  removalPolicy: this.removalPolicy,
  // Missing EC2 service permissions
});

// CRITICAL ISSUE: EC2 instances had no IAM instance profile attached
// This means they couldn't assume any IAM role, including the one with KMS permissions

// PROBLEMATIC: Using custom KMS key for EBS encryption
blockDevices: [{
  deviceName: '/dev/xvda',
  volume: ec2.BlockDeviceVolume.ebs(20, {
    volumeType: ec2.EbsDeviceVolumeType.GP3,
    encrypted: true,
    kmsKey, // PROBLEM: Custom KMS key requires complex permissions
  }),
}],
```

**Error:**

```
One or more of the attached Amazon EBS volumes are encrypted with an inaccessible AWS KMS key.
Client.InvalidKMSKey.InvalidState: The KMS key provided is in an incorrect state
```

**Root Cause:**

- EBS volumes are encrypted with custom KMS key
- EC2 instances don't have permission to decrypt the KMS key
- **CRITICAL**: EC2 instances had no IAM instance profile attached (IamInstanceProfile.Arn was null)
- Without an instance profile, EC2 instances cannot assume IAM roles
- Custom KMS keys require complex IAM policies and service permissions
- AWS managed EBS keys are more reliable and don't require additional permissions

**Fix:**

```typescript
// IDEAL (CORRECT):
// 1. Use AWS managed EBS key for EBS encryption (SIMPLER & MORE RELIABLE)
blockDevices: [{
  deviceName: '/dev/xvda',
  volume: ec2.BlockDeviceVolume.ebs(20, {
    volumeType: ec2.EbsDeviceVolumeType.GP3,
    encrypted: true,
    // Use AWS managed EBS key instead of custom KMS key for better reliability
  }),
}],

// 2. CDK automatically creates instance profile when role is passed to launch template
const launchTemplate = new ec2.LaunchTemplate(this, `LaunchTemplate-${this.environmentSuffix}`, {
  // ... other config
  role, // This automatically creates an instance profile for EC2 instances
  // ... other config
});

// 3. Keep custom KMS key for other resources (S3, RDS, Lambda) but not EBS
// Note: KMS permissions removed from EC2 role - using AWS managed EBS key for EBS encryption
// Custom KMS key is still used for other resources (S3, RDS, Lambda)
```

**Benefits:**

- **SIMPLER**: AWS managed EBS keys don't require additional IAM permissions
- **MORE RELIABLE**: AWS managed keys are always available and properly configured
- **SECURE**: EBS volumes are still encrypted, just with AWS managed key
- **NO PERMISSION COMPLEXITY**: No need for complex KMS policies or EC2 service permissions
- **CRITICAL**: EC2 instances now have proper IAM instance profile to assume roles
- **BEST PRACTICE**: Use AWS managed keys for EBS encryption unless you need specific compliance requirements

**Severity:** CRITICAL - EC2 instances fail to start due to encrypted volume access issues

---
