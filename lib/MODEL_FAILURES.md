# Model Response Failures

## Issue 1: Incorrect KMS Key Policy Implementation
**Problem**: Model used `pulumi.interpolate` incorrectly for account ID resolution in KMS key policy, which would cause deployment failures.

**Wrong Code**:
```typescript
const keyPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "Enable IAM User Permissions",
      Effect: "Allow",
      Principal: {
        AWS: pulumi.interpolate`arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root`
      },
      Action: "kms:*",
      Resource: "*"
    }
  ]
};

this.key = new aws.kms.Key(`${name}-key`, {
  policy: JSON.stringify(keyPolicy),
  // ...
});
```

**Change Made**: Used `pulumi.all()` to properly handle Output types and applied the policy correctly.

**Correct Code**:
```typescript
// Get account ID first
const accountId = aws.getCallerIdentity().then(id => id.accountId);

// Create key policy using pulumi.all to properly handle the Output
const keyPolicy = pulumi.all([accountId]).apply(([accountId]) => ({
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'Enable IAM User Permissions',
      Effect: 'Allow',
      Principal: {
        AWS: `arn:aws:iam::${accountId}:root`,
      },
      Action: 'kms:*',
      Resource: '*',
    }
  ]
}));

this.key = new aws.kms.Key(`${name}-key`, {
  policy: keyPolicy.apply(policy => JSON.stringify(policy)),
  // ...
});
```

## Issue 2: Missing CloudWatch Logs KMS Permissions
**Problem**: Model didn't include CloudWatch Logs service permissions in KMS key policy, preventing CloudTrail from encrypting logs.

**Wrong Code**:
```typescript
// Missing CloudWatch Logs permissions in KMS key policy
const keyPolicy = {
  Statement: [
    // Only had CloudTrail and S3 permissions, missing CloudWatch Logs
  ]
};
```

**Change Made**: Added CloudWatch Logs service permissions to KMS key policy.

**Correct Code**:
```typescript
{
  Sid: 'Allow CloudWatch Logs to encrypt logs',
  Effect: 'Allow',
  Principal: {
    Service: 'logs.amazonaws.com',
  },
  Action: [
    'kms:Encrypt',
    'kms:Decrypt',
    'kms:ReEncrypt*',
    'kms:GenerateDataKey*',
    'kms:DescribeKey',
  ],
  Resource: '*',
},
```

## Issue 3: Incorrect S3 API Usage
**Problem**: Model used deprecated S3 API resources instead of the newer V2 APIs.

**Wrong Code**:
```typescript
this.bucket = new aws.s3.BucketV2(`${name}-bucket`, {
  // ...
});

new aws.s3.BucketVersioningV2(`${name}-versioning`, {
  // ...
});

new aws.s3.BucketServerSideEncryptionConfigurationV2(`${name}-encryption`, {
  // ...
});
```

**Change Made**: Used the correct non-V2 API resources that are stable and properly supported.

**Correct Code**:
```typescript
this.bucket = new aws.s3.Bucket(`${name}-bucket`, {
  // ...
});

new aws.s3.BucketVersioning(`${name}-versioning`, {
  // ...
});

new aws.s3.BucketServerSideEncryptionConfiguration(`${name}-encryption`, {
  // ...
});
```

## Issue 4: Missing CloudTrail S3 Bucket Permissions
**Problem**: Model's S3 bucket policy didn't include proper CloudTrail service permissions for ACL checks and log writing.

**Wrong Code**:
```typescript
const bucketPolicyDocument = pulumi.all([this.bucket.arn]).apply(([bucketArn]) => ({
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "DenyInsecureConnections",
      Effect: "Deny",
      // ... only had deny policies, missing CloudTrail allow policies
    }
  ]
}));
```

**Change Made**: Added proper CloudTrail service permissions for bucket access.

**Correct Code**:
```typescript
const bucketPolicyDocument = pulumi.all([
  this.bucket.arn,
  aws.getCallerIdentity().then(id => id.accountId),
]).apply(([bucketArn, accountId]) => ({
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'AllowRootAccountFullAccess',
      Effect: 'Allow',
      Principal: {
        AWS: `arn:aws:iam::${accountId}:root`,
      },
      Action: 's3:*',
      Resource: [bucketArn, `${bucketArn}/*`],
    },
    {
      Sid: 'AllowCloudTrailAclCheck',
      Effect: 'Allow',
      Principal: {
        Service: 'cloudtrail.amazonaws.com',
      },
      Action: 's3:GetBucketAcl',
      Resource: bucketArn,
    },
    {
      Sid: 'AllowCloudTrailWrite',
      Effect: 'Allow',
      Principal: {
        Service: 'cloudtrail.amazonaws.com',
      },
      Action: 's3:PutObject',
      Resource: `${bucketArn}/*`,
      Condition: {
        StringEquals: {
          's3:x-amz-acl': 'bucket-owner-full-control',
        },
      },
    }
  ]
}));
```

## Issue 5: Incorrect CloudTrail Event Selectors
**Problem**: Model used deprecated `eventSelectors` instead of `advancedEventSelectors` for CloudTrail configuration.

**Wrong Code**:
```typescript
this.trail = new aws.cloudtrail.Trail(`${name}-trail`, {
  eventSelectors: [
    {
      readWriteType: "All",
      includeManagementEvents: true,
      dataResources: [
        {
          type: "AWS::S3::Object",
          values: ["arn:aws:s3:::*/*"]
        }
      ]
    }
  ]
});
```

**Change Made**: Used `advancedEventSelectors` with proper field selector structure.

**Correct Code**:
```typescript
this.trail = new aws.cloudtrail.Trail(`${name}-trail`, {
  advancedEventSelectors: [
    {
      name: 'Log all S3 data events',
      fieldSelectors: [
        {
          field: 'eventCategory',
          equals: ['Data'],
        },
        {
          field: 'resources.type',
          equals: ['AWS::S3::Object'],
        },
      ],
    },
    {
      name: 'Log all management events',
      fieldSelectors: [
        {
          field: 'eventCategory',
          equals: ['Management'],
        },
      ],
    },
  ]
});
```

## Issue 6: Missing Input Validation
**Problem**: Model didn't include proper input validation for required parameters.

**Wrong Code**:
```typescript
constructor(name: string, args: SecureS3BucketArgs, opts?: pulumi.ComponentResourceOptions) {
  super('custom:security:SecureS3Bucket', name, {}, opts);
  
  // No validation of required args.kmsKeyId
  this.bucket = new aws.s3.Bucket(`${name}-bucket`, {
    // ...
  });
}
```

**Change Made**: Added input validation to ensure required parameters are provided.

**Correct Code**:
```typescript
constructor(name: string, args: SecureS3BucketArgs, opts?: pulumi.ComponentResourceOptions) {
  super('custom:security:SecureS3Bucket', name, {}, opts);

  // Input validation
  if (!args.kmsKeyId) {
    throw new Error(`KMS Key ID is required for secure S3 bucket ${name}`);
  }

  this.bucket = new aws.s3.Bucket(`${name}-bucket`, {
    // ...
  });
}
```

## Issue 7: Missing Resource Dependencies
**Problem**: Model didn't specify proper resource dependencies, which could cause deployment race conditions.

**Wrong Code**:
```typescript
new aws.s3.BucketVersioning(`${name}-versioning`, {
  bucket: this.bucket.id,
  // Missing dependsOn
});

new aws.s3.BucketServerSideEncryptionConfiguration(`${name}-encryption`, {
  bucket: this.bucket.id,
  // Missing dependsOn
});
```

**Change Made**: Added explicit resource dependencies to ensure proper deployment order.

**Correct Code**:
```typescript
new aws.s3.BucketVersioning(`${name}-versioning`, {
  bucket: this.bucket.id,
  // ...
}, { parent: this, dependsOn: [this.bucket] });

new aws.s3.BucketServerSideEncryptionConfiguration(`${name}-encryption`, {
  bucket: this.bucket.id,
  // ...
}, { parent: this, dependsOn: [this.bucket] });
```

## Issue 8: Missing Enhanced Security Policies
**Problem**: Model only provided basic security policies instead of comprehensive security policy framework.

**Wrong Code**:
```typescript
const securityPolicy = new aws.iam.Policy("security-baseline", {
  policy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        // Only basic MFA enforcement, missing other security policies
      }
    ]
  })
});
```

**Change Made**: Implemented comprehensive security policies module with multiple policy types.

**Correct Code**:
```typescript
// MFA enforcement policy (simplified for deployment)
this.mfaEnforcementPolicy = new aws.iam.Policy(`mfa-enforcement-${environmentSuffix}`, {
  name: `MFAEnforcement-${environmentSuffix}`,
  description: 'Requires MFA for sensitive operations',
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'DenySensitiveActionsWithoutMFA',
        Effect: 'Deny',
        Action: [
          'iam:DeleteRole',
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          's3:DeleteBucket',
          's3:PutBucketPolicy',
          'kms:ScheduleKeyDeletion',
          'kms:DisableKey',
          'cloudtrail:DeleteTrail',
          'cloudtrail:StopLogging',
        ],
        Resource: '*',
        Condition: {
          Bool: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      },
    ],
  })
});

// EC2 lifecycle policy
this.ec2LifecyclePolicy = new aws.iam.Policy(`ec2-lifecycle-${environmentSuffix}`, {
  name: `EC2Lifecycle-${environmentSuffix}`,
  description: 'Controls EC2 instance lifecycle operations',
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'DenyProductionInstanceTermination',
        Effect: 'Deny',
        Action: 'ec2:TerminateInstances',
        Resource: '*',
        Condition: {
          StringLike: {
            'ec2:ResourceTag/Environment': 'prod*',
          },
        },
      }
    ],
  })
});
```
