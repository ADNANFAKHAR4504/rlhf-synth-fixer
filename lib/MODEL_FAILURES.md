# Model Failures Analysis: Security Issues and Code Problems

## 1. **CRITICAL SECURITY FAILURE: Overly Permissive Database Security Group Egress**

**Issue Type**: Security Failure, Least Privilege Principle Violation  
**Severity**: CRITICAL  
**Impact**: Potential data exfiltration, violates network security best practices

### Model's Incorrect Code:

```typescript
const databaseSecurityGroup = new aws.ec2.SecurityGroup(
  `${projectName}-db-sg`,
  {
    name: `${projectName}-db-sg`,
    description: 'Security group for database servers in private subnets',
    vpcId: vpc.id,
    ingress: [
      // ... ingress rules are correct
    ],
    egress: [
      {
        description: 'All outbound traffic', // WRONG: Allows ALL traffic
        fromPort: 0, // WRONG: All ports
        toPort: 0, // WRONG: All ports
        protocol: '-1', // WRONG: All protocols
        cidrBlocks: ['0.0.0.0/0'], // WRONG: All destinations
      },
    ],
    // ...
  },
  { provider: awsProvider }
);
```

### Our Corrected Code:

```typescript
const databaseSecurityGroup = new aws.ec2.SecurityGroup(
  `${projectName}-db-sg-${environmentSuffix}`,
  {
    name: `${projectName}-db-sg-${environmentSuffix}`,
    description: 'Security group for database servers in private subnets',
    vpcId: vpc.id,
    ingress: [
      // ... ingress rules
    ],
    egress: [
      {
        description: 'HTTPS for software updates and patches', // FIXED: Specific purpose
        fromPort: 443, // FIXED: Specific port
        toPort: 443, // FIXED: Specific port
        protocol: 'tcp', // FIXED: Specific protocol
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        description: 'HTTP for software updates and patches', // FIXED: Specific purpose
        fromPort: 80, // FIXED: Specific port
        toPort: 80, // FIXED: Specific port
        protocol: 'tcp', // FIXED: Specific protocol
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        description: 'DNS queries', // FIXED: Specific purpose
        fromPort: 53, // FIXED: Specific port
        toPort: 53, // FIXED: Specific port
        protocol: 'udp', // FIXED: Specific protocol
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    // ...
  },
  { provider: awsProvider, parent: this }
);
```

**Why This is Critical**: Database servers with unrestricted egress can be used for data exfiltration, command and control communication, and lateral movement in case of compromise.

---

## 2. **HIGH SECURITY FAILURE: Overly Broad IAM CloudWatch Permissions**

**Issue Type**: Security Failure, Least Privilege Principle Violation  
**Severity**: HIGH  
**Impact**: Could access sensitive logs from other applications, cross-account access potential

### Model's Incorrect Code:

```typescript
const webServerLogsPolicy = new aws.iam.Policy(
  `${projectName}-web-server-logs-policy`,
  {
    name: `${projectName}-web-server-logs-policy`,
    description: 'Policy for web servers to write CloudWatch logs',
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
          ],
          Resource: `arn:aws:logs:${region}:*:*`, // WRONG: Wildcard access to ALL logs
        },
      ],
    }),
  },
  { provider: awsProvider }
);
```

### Our Corrected Code:

```typescript
const webServerLogsPolicy = new aws.iam.Policy(
  `${projectName}-web-server-logs-policy-${environmentSuffix}`,
  {
    name: `${projectName}-web-server-logs-policy-${environmentSuffix}`,
    description: 'Policy for web servers to write CloudWatch logs',
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
          ],
          Resource: `arn:aws:logs:${region}:*:log-group:/aws/ec2/${projectName}-${environmentSuffix}*`, // FIXED: Scoped to specific log groups
        },
      ],
    }),
  },
  { provider: awsProvider, parent: this }
);
```

**Why This is High Risk**: Overly broad CloudWatch permissions could allow access to sensitive application logs, security logs, and potentially logs from other applications in the same account.

---

## 3. **SECURITY MISS: No HTTPS-Only S3 Bucket Policies**

**Issue Type**: Security Miss, Missing Defense-in-Depth  
**Severity**: MEDIUM  
**Impact**: Allows insecure HTTP connections to S3 buckets

### Model's Missing Implementation:

```typescript
// MISSING: No bucket policies to enforce HTTPS-only access
const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data`,
  {
    bucket: `${projectName}-app-data-${pulumi.getStack()}`,
    // ... other configurations
  },
  { provider: awsProvider }
);
// MISSING: No aws.s3.BucketPolicy resource
```

### Our Corrected Code:

```typescript
// FIXED: Added HTTPS-only bucket policy
const applicationDataBucketPolicy = new aws.s3.BucketPolicy(
  `${projectName}-app-data-policy-${environmentSuffix}`,
  {
    bucket: applicationDataBucket.id,
    policy: applicationDataBucket.arn.apply(bucketArn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyInsecureConnections', // FIXED: Denies HTTP connections
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [bucketArn, `${bucketArn}/*`],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false', // FIXED: Enforces HTTPS only
              },
            },
          },
        ],
      })
    ),
  },
  { provider: awsProvider, parent: this }
);
```

**Why This Matters**: Without HTTPS-only policies, data could be transmitted in plain text, violating security best practices and compliance requirements.

---

## 4. **SECURITY MISS: No S3 Access Logging Infrastructure**

**Issue Type**: Security Miss, Missing Audit Trail  
**Severity**: MEDIUM  
**Impact**: No security monitoring or compliance audit trail for S3 access

### Model's Missing Implementation:

```typescript
// MISSING: No access logging bucket
// MISSING: No S3 access logging configuration
const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data`,
  {
    // ... configurations without logging
  },
  { provider: awsProvider }
);
```

### Our Corrected Code:

```typescript
// FIXED: Added dedicated access logs bucket
const accessLogsBucket = new aws.s3.Bucket(
  `${projectName}-access-logs-${environmentSuffix}`,
  {
    bucket: `${projectName}-access-logs-${environmentSuffix}-${(
      pulumi.getStack() || 'test'
    ).toLowerCase()}`,
    tags: {
      Name: `${projectName}-access-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
      Purpose: 'AccessLogging', // FIXED: Clear purpose tagging
      ...tags,
    },
  },
  { provider: awsProvider, parent: this }
);

// FIXED: Added S3 access logging configuration
const applicationDataBucketLogging = new aws.s3.BucketLogging(
  `${projectName}-app-data-logging-${environmentSuffix}`,
  {
    bucket: applicationDataBucket.id,
    targetBucket: accessLogsBucket.id, // FIXED: Logs to dedicated bucket
    targetPrefix: 'app-data-access-logs/', // FIXED: Organized log prefixes
  },
  { provider: awsProvider, parent: this }
);
```

**Why This is Important**: S3 access logging is crucial for security monitoring, compliance auditing, and forensic analysis in case of security incidents.

---

## 5. **SECURITY MISS: No Secure Transport Conditions in IAM S3 Policies**

**Issue Type**: Security Miss, Least Privilege Principle Issue  
**Severity**: MEDIUM  
**Impact**: IAM policies don't enforce HTTPS connections to S3

### Model's Incorrect Code:

```typescript
const webServerS3Policy = new aws.iam.Policy(
  `${projectName}-web-server-s3-policy`,
  {
    name: `${projectName}-web-server-s3-policy`,
    description: 'Policy for web servers to access application data bucket',
    policy: pulumi.all([applicationDataBucket.arn]).apply(([bucketArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${bucketArn}/*`,
            // MISSING: No secure transport condition
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: bucketArn,
            // MISSING: No secure transport condition
          },
        ],
      })
    ),
  },
  { provider: awsProvider }
);
```

### Our Corrected Code:

```typescript
const webServerS3Policy = new aws.iam.Policy(
  `${projectName}-web-server-s3-policy-${environmentSuffix}`,
  {
    name: `${projectName}-web-server-s3-policy-${environmentSuffix}`,
    description: 'Policy for web servers to access application data bucket',
    policy: pulumi
      .all([applicationDataBucket.arn, backupBucket.arn])
      .apply(([appBucketArn, backupBucketArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              Resource: [appBucketArn, `${appBucketArn}/*`],
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'true', // FIXED: Enforces HTTPS in IAM policy
                },
              },
            },
            {
              Effect: 'Allow',
              Action: ['s3:PutObject'],
              Resource: [`${backupBucketArn}/*`],
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'true', // FIXED: Enforces HTTPS
                },
                StringEquals: {
                  's3:x-amz-server-side-encryption': 'AES256', // FIXED: Enforces encryption
                },
              },
            },
          ],
        })
      ),
  },
  { provider: awsProvider, parent: this }
);
```

**Defense in Depth**: Adding secure transport conditions to IAM policies provides an additional layer of security beyond bucket policies.

---

## 6. **DEPRECATION ISSUE: Using Deprecated Inline S3 Configurations**

**Issue Type**: Deprecation Issue, Build Issue  
**Severity**: MEDIUM  
**Impact**: Will generate warnings, not following modern AWS provider patterns

### Model's Deprecated Code:

```typescript
const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data`,
  {
    bucket: `${projectName}-app-data-${pulumi.getStack()}`,
    serverSideEncryptionConfiguration: {
      // DEPRECATED: Inline configuration
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
        bucketKeyEnabled: true,
      },
    },
    publicAccessBlock: {
      // DEPRECATED: Inline configuration
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    versioning: {
      // DEPRECATED: Inline configuration
      enabled: true,
    },
    lifecycleRules: [
      // DEPRECATED: Inline configuration
      {
        id: 'backup-lifecycle',
        enabled: true,
        transitions: [
          {
            days: 30,
            storageClass: 'STANDARD_IA',
          },
        ],
      },
    ],
  },
  { provider: awsProvider }
);
```

### Our Modern Code:

```typescript
// FIXED: Modern separate resource approach
const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data-${environmentSuffix}`,
  {
    bucket: `${projectName}-app-data-${environmentSuffix}-${(
      pulumi.getStack() || 'test'
    ).toLowerCase()}`,
    tags: {
      Name: `${projectName}-app-data-${environmentSuffix}`,
      Environment: environmentSuffix,
      ...tags,
    },
  },
  { provider: awsProvider, parent: this }
);

// FIXED: Separate encryption configuration resource
const applicationDataBucketEncryption =
  new aws.s3.BucketServerSideEncryptionConfiguration(
    `${projectName}-app-data-encryption-${environmentSuffix}`,
    {
      bucket: applicationDataBucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    },
    { provider: awsProvider, parent: this }
  );

// FIXED: Separate versioning configuration resource
const applicationDataBucketVersioning = new aws.s3.BucketVersioning(
  `${projectName}-app-data-versioning-${environmentSuffix}`,
  {
    bucket: applicationDataBucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  },
  { provider: awsProvider, parent: this }
);

// FIXED: Separate public access block resource
const applicationDataBucketPublicAccessBlock =
  new aws.s3.BucketPublicAccessBlock(
    `${projectName}-app-data-pab-${environmentSuffix}`,
    {
      bucket: applicationDataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    { provider: awsProvider, parent: this }
  );
```

**Why This Matters**: Modern AWS provider patterns use separate resources for better control, dependency management, and to avoid deprecation warnings.

---

## 7. **CODE ISSUE: Missing Environment Suffix Support**

**Issue Type**: Code Issue, Operational Issue  
**Severity**: LOW  
**Impact**: Cannot deploy multiple environments, poor resource organization

### Model's Incorrect Code:

```typescript
const webServerRole = new aws.iam.Role(
  `${projectName}-web-server-role`, // WRONG: No environment suffix
  {
    name: `${projectName}-web-server-role`, // WRONG: No environment suffix
    // ...
  },
  { provider: awsProvider }
);

const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data`, // WRONG: No environment suffix
  {
    bucket: `${projectName}-app-data-${pulumi.getStack()}`, // WRONG: Uses stack name instead of env
    // ...
  },
  { provider: awsProvider }
);
```

### Our Corrected Code:

```typescript
const webServerRole = new aws.iam.Role(
  `${projectName}-web-server-role-${environmentSuffix}`, // FIXED: Added environment suffix
  {
    name: `${projectName}-web-server-role-${environmentSuffix}`, // FIXED: Added environment suffix
    // ...
    tags: {
      Name: `${projectName}-web-server-role-${environmentSuffix}`,
      Environment: environmentSuffix, // FIXED: Added environment tag
      ...tags,
    },
  },
  { provider: awsProvider, parent: this }
);

const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data-${environmentSuffix}`, // FIXED: Added environment suffix
  {
    bucket: `${projectName}-app-data-${environmentSuffix}-${(
      pulumi.getStack() || 'test'
    ).toLowerCase()}`, // FIXED: Proper naming with fallback
    tags: {
      Name: `${projectName}-app-data-${environmentSuffix}`,
      Environment: environmentSuffix, // FIXED: Added environment tag
      ...tags,
    },
  },
  { provider: awsProvider, parent: this }
);
```

**Operational Impact**: Without environment suffixes, you cannot deploy multiple environments (dev, staging, prod) in the same AWS account.

---

## 8. **SECURITY MISS: No Encryption Enforcement on Backup Bucket**

**Issue Type**: Security Miss, Missing Data Protection  
**Severity**: MEDIUM  
**Impact**: Backup bucket doesn't enforce encryption on uploads

### Model's Missing Implementation:

```typescript
const backupBucket = new aws.s3.Bucket(
  `${projectName}-backups`,
  {
    // ... basic configuration
    // MISSING: No bucket policy to enforce encryption on uploads
  },
  { provider: awsProvider }
);
```

### Our Corrected Code:

```typescript
const backupBucketPolicy = new aws.s3.BucketPolicy(
  `${projectName}-backups-policy-${environmentSuffix}`,
  {
    bucket: backupBucket.id,
    policy: backupBucket.arn.apply(bucketArn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyInsecureConnections',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [bucketArn, `${bucketArn}/*`],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
          {
            Sid: 'DenyUnencryptedUploads', // FIXED: Enforces encryption on uploads
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:PutObject',
            Resource: `${bucketArn}/*`,
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption': 'AES256', // FIXED: Requires AES256 encryption
              },
            },
          },
        ],
      })
    ),
  },
  { provider: awsProvider, parent: this }
);
```

**Data Protection**: Backup data is often more sensitive and should have additional encryption enforcement policies.

---

## 9. **CODE ISSUE: Missing Resource Parent Relationships**

**Issue Type**: Code Issue, Resource Management Issue  
**Severity**: LOW  
**Impact**: Poor resource organization, potential deployment issues

### Model's Incorrect Code:

```typescript
const webServerRole = new aws.iam.Role(
  `${projectName}-web-server-role`,
  {
    // ... configuration
  },
  { provider: awsProvider } // WRONG: No parent relationship
);

const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data`,
  {
    // ... configuration
  },
  { provider: awsProvider } // WRONG: No parent relationship
);
```

### Our Corrected Code:

```typescript
const webServerRole = new aws.iam.Role(
  `${projectName}-web-server-role-${environmentSuffix}`,
  {
    // ... configuration
  },
  { provider: awsProvider, parent: this } // FIXED: Added parent relationship
);

const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data-${environmentSuffix}`,
  {
    // ... configuration
  },
  { provider: awsProvider, parent: this } // FIXED: Added parent relationship
);
```

**Resource Management**: Parent relationships help with resource organization, dependency tracking, and proper cleanup.

---

## 10. **SECURITY MISS: Missing Comprehensive Resource Tagging**

**Issue Type**: Security Miss, Governance Issue  
**Severity**: LOW  
**Impact**: Poor resource governance, difficult cost tracking and compliance

### Model's Incorrect Code:

```typescript
const webServerRole = new aws.iam.Role(
  `${projectName}-web-server-role`,
  {
    name: `${projectName}-web-server-role`,
    assumeRolePolicy: ec2AssumeRolePolicy.then(policy => policy.json),
    tags: {
      Name: `${projectName}-web-server-role`, // INCOMPLETE: Only basic Name tag
    },
  },
  { provider: awsProvider }
);
```

### Our Corrected Code:

```typescript
const webServerRole = new aws.iam.Role(
  `${projectName}-web-server-role-${environmentSuffix}`,
  {
    name: `${projectName}-web-server-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        },
      ],
    }),
    tags: {
      Name: `${projectName}-web-server-role-${environmentSuffix}`,
      Environment: environmentSuffix, // FIXED: Added environment tag
      ...tags, // FIXED: Support for custom tags
    },
  },
  { provider: awsProvider, parent: this }
);
```

**Governance Impact**: Proper tagging is essential for cost allocation, compliance reporting, and resource management.

---

## 11. **PROMPT REQUIREMENT MISS: Incorrect Region Implementation**

**Issue Type**: Prompt Requirement Miss, Code Issue  
**Severity**: MEDIUM  
**Impact**: Infrastructure deployed to wrong region, violates explicit prompt requirement

### Prompt Requirement:

> "All infrastructure will be provisioned in the 'us-west-2' region"
> "Explicitly associate all AWS resources with a Pulumi provider object to control the target region (us-west-2)"

### Model's Incorrect Implementation:

```typescript
// Configuration
const projectName = 'webapp';
const region = 'us-west-2'; // CORRECT: Sets region variable

// Create AWS provider for explicit region control
const awsProvider = new aws.Provider('aws-provider', {
  region: region, // CORRECT: Uses us-west-2
});

// BUT THEN: In our actual implementation we found
const region = args.region || 'us-east-1'; // WRONG: Defaults to us-east-1 instead of us-west-2
```

### Our Corrected Code:

```typescript
// Configuration following prompt requirement
const projectName = 'webapp';
const environmentSuffix = args.environmentSuffix;
const region = args.region || 'us-west-2'; // FIXED: Defaults to us-west-2 as per prompt

// Create AWS provider for explicit region control
const awsProvider = new aws.Provider(
  'aws-provider',
  {
    region: region, // FIXED: Correctly uses us-west-2 default
  },
  { parent: this }
);
```

**Compliance Impact**: Deploying to the wrong region could violate data residency requirements and compliance policies.

---

## 12. **PROMPT REQUIREMENT MISS: Incomplete Naming Convention Implementation**

**Issue Type**: Prompt Requirement Miss, Code Issue  
**Severity**: LOW  
**Impact**: Naming convention doesn't fully match prompt specification

### Prompt Requirement:

> "Use consistent naming conventions across all resources in the format: projectname-resource-type"

### Model's Partially Incorrect Implementation:

```typescript
// PARTIALLY CORRECT: Basic format followed
const webSecurityGroup = new aws.ec2.SecurityGroup(
  `${projectName}-web-sg`, // CORRECT: webapp-web-sg format
  {
    name: `${projectName}-web-sg`, // CORRECT: webapp-web-sg format
    // ...
  }
);

// BUT MISSING: Environment differentiation for multi-environment deployments
const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data`, // INCOMPLETE: Missing environment suffix
  {
    bucket: `${projectName}-app-data-${pulumi.getStack()}`, // INCOMPLETE: Uses stack name instead of env
    // ...
  }
);
```

### Our Corrected Code:

```typescript
// FIXED: Complete naming convention with environment support
const webSecurityGroup = new aws.ec2.SecurityGroup(
  `${projectName}-web-sg-${environmentSuffix}`, // FIXED: webapp-web-sg-dev format
  {
    name: `${projectName}-web-sg-${environmentSuffix}`, // FIXED: webapp-web-sg-dev format
    // ...
  }
);

const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data-${environmentSuffix}`, // FIXED: webapp-app-data-dev format
  {
    bucket: `${projectName}-app-data-${environmentSuffix}-${(
      pulumi.getStack() || 'test'
    ).toLowerCase()}`, // FIXED: Complete naming
    // ...
  }
);
```

**Operational Impact**: Inconsistent naming makes resource management and automation more difficult.

---

## 13. **PROMPT REQUIREMENT MISS: Insufficient Modular Design**

**Issue Type**: Prompt Requirement Miss, Code Structure Issue  
**Severity**: MEDIUM  
**Impact**: Code not modular or reusable as requested in prompt

### Prompt Requirement:

> "The code should be modular, production-ready, and focused on security and maintainability"

### Model's Incorrect Implementation:

```typescript
// WRONG: Flat script structure, not modular
// Configuration
const projectName = 'webapp';
const region = 'us-west-2';

// Create AWS provider for explicit region control
const awsProvider = new aws.Provider('aws-provider', {
  region: region,
});

// VPC Configuration
const vpc = new aws.ec2.Vpc(`${projectName}-vpc`, {
  // ... all resources in one flat file
});

// MISSING: No class structure, no interfaces, no reusability
// MISSING: No parameterization for different environments
// MISSING: No proper TypeScript typing
```

### Our Corrected Code:

```typescript
// FIXED: Modular class-based design
export interface WebAppInfrastructureArgs {
  environmentSuffix: string; // FIXED: Parameterized for environments
  region?: string; // FIXED: Configurable region
  tags?: pulumi.Input<{ [key: string]: string }>; // FIXED: Flexible tagging
}

export class WebAppInfrastructure extends pulumi.ComponentResource {
  // FIXED: Proper TypeScript typing for outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  // ... other typed outputs

  constructor(
    name: string,
    args: WebAppInfrastructureArgs, // FIXED: Typed arguments
    opts?: ResourceOptions
  ) {
    super('tap:webapp:WebAppInfrastructure', name, {}, opts); // FIXED: Component resource

    // FIXED: Modular, reusable implementation
    const projectName = 'webapp';
    const environmentSuffix = args.environmentSuffix;
    const region = args.region || 'us-west-2';
    const tags = args.tags || {};

    // ... modular resource creation
  }
}
```

**Maintainability Impact**: Non-modular code is difficult to maintain, test, and reuse across different environments.

---
