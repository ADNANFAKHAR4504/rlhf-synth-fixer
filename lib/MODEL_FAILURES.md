# Model Failures and Issues

## Critical Infrastructure Issues

### 1. **Provider Framework Violation**
**Issue**: Model never followed the Pulumi provider prompt requirements and missing parent references

**Model Code**:
```typescript
const vpc = new aws.ec2.Vpc("main-vpc", {
  // Missing environment prefix and parent reference
});
```

**Correct Code**:
```typescript
const vpc = new aws.ec2.Vpc(
  `${sanitizedName}-main-vpc`,
  {
    tags: {
      Name: `${sanitizedName}-vpc`,
      Environment: environment,
    },
  },
  { parent: this }
);
```

### 2. **ALB KMS Encryption Misconception**
**Issue**: Model suggested KMS encryption for ALB access logs bucket, but ALB doesn't support KMS-encrypted buckets for logging

**Model Code**:
```typescript
const albLogsBucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration("alb-logs-encryption", {
    bucket: albLogsBucket.id,
    rules: [{
        applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms", // ALB doesn't support KMS for access logs
            kmsMasterKeyId: kmsKey.arn,
        },
    }],
});
```

**Correct Code**:
```typescript
// ALB access logs use SSE-S3 by default (KMS not supported)
// No separate encryption configuration needed for ALB logs bucket
const albLogsBucket = new aws.s3.Bucket("alb-access-logs", {
    bucket: albBucketName,
    forceDestroy: true,
    // ALB automatically uses SSE-S3 encryption
});
```

### 3. **Bucket Naming with Timestamps**
**Issue**: Using timestamps in bucket names creates deployment inconsistencies

**Model Code**:
```typescript
const timestamp = Date.now().toString();
const albBucketName = `${sanitizedName}-alb-logs-${timestamp}`;
```

**Correct Code**:
```typescript
// Generate bucket names without timestamps for consistency
const albBucketName = `${sanitizedName}-alb-logs`;
const cloudFrontBucketName = `${sanitizedName}-cf-logs`;
```

### 4. **CloudFront Logs Missing Service Permissions**
**Issue**: Missing CloudFront service permissions in S3 bucket policy

**Model Code**:
```typescript
const cloudFrontLogsBucketPolicy = new aws.s3.BucketPolicy("cloudfront-logs-bucket-policy", {
    policy: cloudFrontLogsBucket.arn.apply(bucketArn => 
        JSON.stringify({
            Statement: [
                // Only SSL enforcement, missing CloudFront service permissions
            ]
        })
    )
});
```

**Correct Code**:
```typescript
new aws.s3.BucketPolicy("cloudfront-logs-bucket-policy", {
    policy: pulumi.all([cloudFrontLogsBucket.arn, current]).apply(([bucketArn, currentAccount]) =>
        JSON.stringify({
            Statement: [
                {
                    Effect: "Allow",
                    Principal: { Service: "cloudfront.amazonaws.com" },
                    Action: "s3:PutObject",
                    Resource: `${bucketArn}/cloudfront-logs/*`,
                    Condition: {
                        StringEquals: { "aws:SourceAccount": currentAccount.accountId }
                    }
                }
            ]
        })
    )
});
```

### 5. **CloudFront Logs Bucket ACL Configuration**
**Issue**: Missing proper ACL configuration for CloudFront logging

**Model Code**:
```typescript
// Missing ACL configuration for CloudFront logging
const cloudFrontLogsBucket = new aws.s3.Bucket("cloudfront-logs", {
    // Missing ownership controls and ACL setup
});
```

**Correct Code**:
```typescript
const cloudFrontLogsBucketOwnership = new aws.s3.BucketOwnershipControls("cloudfront-logs-ownership", {
    bucket: cloudFrontLogsBucket.id,
    rule: { objectOwnership: "BucketOwnerPreferred" },
});

const cloudFrontLogsBucketAcl = new aws.s3.BucketAclV2("cloudfront-logs-acl", {
    bucket: cloudFrontLogsBucket.id,
    acl: "private",
}, { dependsOn: [cloudFrontLogsBucketOwnership] });
```

### 6. **IAM Policy Still Too Broad**
**Issue**: Still using overly broad AWS managed policies

**Model Code**:
```typescript
const ec2RolePolicyAttachment = new aws.iam.RolePolicyAttachment("ec2-role-policy", {
    role: ec2Role.name,
    policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy", // Still too broad
});
```

**Correct Code**:
```typescript
const ec2Policy = new aws.iam.Policy("ec2-policy", {
    policy: JSON.stringify({
        Statement: [{
            Effect: "Allow",
            Action: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            Resource: `arn:aws:logs:*:*:log-group:/aws/ec2/${sanitizedName}*`,
        }]
    })
});

new aws.iam.RolePolicyAttachment("ec2-role-policy", {
    role: ec2Role.name,
    policyArn: ec2Policy.arn,
});
```