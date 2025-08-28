# Model Failures Analysis

### 1. Security Issue - SSH Access Vulnerability
**Type of Issue**: Security vulnerability
**Description**: Model included SSH access from a specific IP range which creates unnecessary attack surface
**Model Code**:
```typescript
ingress: [
  {
    description: 'SSH from specific IP',
    fromPort: 22,
    toPort: 22,
    protocol: 'tcp',
    cidrBlocks: ['193.10.210.0/24'],
  },
],
```
**Correct Code**:
```typescript
// No SSH ingress rules - using Session Manager instead
egress: [
  {
    description: 'All outbound traffic',
    fromPort: 0,
    toPort: 0,
    protocol: '-1',
    cidrBlocks: ['0.0.0.0/0'],
  },
],
```

### 2. Security Issue - Overprivileged IAM Policy
**Type of Issue**: IAM security issue - excessive permissions
**Description**: Model granted broad S3 permissions including DeleteObject and ListBucket instead of minimal required permissions
**Model Code**:
```typescript
Action: [
  's3:GetObject',
  's3:PutObject',
  's3:DeleteObject',
  's3:ListBucket',
],
Resource: [bucketArn, `${bucketArn}/*`],
```
**Correct Code**:
```typescript
Action: ['s3:PutObject'],
Resource: `${bucketArn}/*`,
```

### 3. Security Issue - Missing S3 Public Access Block
**Type of Issue**: Security configuration missing
**Description**: Model did not implement S3 public access blocking, leaving bucket potentially exposed
**Model Code**: Missing implementation
**Correct Code**:
```typescript
new aws.s3.BucketPublicAccessBlock(
  `${environment}-block-public-access`,
  {
    bucket: this.s3Bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  },
  { provider }
);
```

### 4. Security Issue - Hardcoded Database Password
**Type of Issue**: Security vulnerability - credentials in code
**Description**: Model used hardcoded password instead of AWS managed password
**Model Code**:
```typescript
password: 'SecurePassword123!',
```
**Correct Code**:
```typescript
manageMasterUserPassword: true,
```

### 5. Missing Security Feature - CloudWatch Logs IAM Policy
**Type of Issue**: IAM configuration missing
**Description**: Model did not create IAM policy for CloudWatch Logs access
**Model Code**: Missing implementation
**Correct Code**:
```typescript
const cloudWatchPolicy = new aws.iam.Policy(
  `${environment}-cloudwatch-policy`,
  {
    name: `${environment}-cloudwatch-policy`,
    description: 'Policy for CloudWatch Logs access',
    policy: pulumi
      .all([this.cloudWatchLogGroup.arn])
      .apply(([logGroupArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: `${logGroupArn}:*`,
            },
          ],
        })
      ),
  },
  { provider }
);
```

### 6. Missing Security Feature - Session Manager Access
**Type of Issue**: IAM configuration missing
**Description**: Model did not attach Session Manager policy for secure EC2 access
**Model Code**: Missing implementation
**Correct Code**:
```typescript
new aws.iam.RolePolicyAttachment(
  `${environment}-ssm-policy-attachment`,
  {
    role: this.iamRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  },
  { provider }
);
```

### 7. Missing Monitoring Feature - CloudWatch Agent Configuration
**Type of Issue**: Monitoring configuration missing
**Description**: Model did not configure CloudWatch agent on EC2 instance for log collection
**Model Code**: Missing user data configuration
**Correct Code**:
```typescript
userData: pulumi
  .all([this.cloudWatchLogGroup.name])
  .apply(([logGroupName]) =>
    Buffer.from(
      `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
echo '{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "${logGroupName}",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`
    ).toString('base64')
  ),
```

### 8. Missing Monitoring Feature - RDS CloudWatch Logs
**Type of Issue**: Monitoring configuration missing
**Description**: Model did not enable CloudWatch logs export for RDS instance
**Model Code**: Missing configuration
**Correct Code**:
```typescript
enabledCloudwatchLogsExports: ['error', 'slowquery'],
```

### 9. Build Issue - MySQL Engine Version Handling
**Type of Issue**: Build/deployment failure
**Description**: Model used hardcoded MySQL version instead of dynamic lookup which could fail in different regions
**Model Code**:
```typescript
engineVersion: '8.0.35', // Fixed: Use a specific version that exists in ap-south-1
```
**Correct Code**:
```typescript
const engineVersion = aws.rds.getEngineVersion(
  {
    engine: 'mysql',
    defaultOnly: true,
  },
  { provider }
);
// Then use: engineVersion: engineVersion.then(e => e.version),
```

### 10. Code Quality Issue - Unused Variable Assignments
**Type of Issue**: Code quality issue
**Description**: Model assigned resources to variables that were never used
**Model Code**:
```typescript
const s3BucketVersioning = new aws.s3.BucketVersioning(...)
const s3BucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(...)
const rolePolicyAttachment = new aws.iam.RolePolicyAttachment(...)
const cloudWatchLogStream = new aws.cloudwatch.LogStream(...)
```
**Correct Code**:
```typescript
new aws.s3.BucketVersioning(...)
new aws.s3.BucketServerSideEncryptionConfiguration(...)
new aws.iam.RolePolicyAttachment(...)
new aws.cloudwatch.LogStream(...)
```

### 11. Missing Export Values
**Type of Issue**: Functionality missing
**Description**: Model's getExports() method was missing some important resource IDs
**Model Code**: Missing internetGatewayId and natGatewayId exports
**Correct Code**:
```typescript
return {
  // ... other exports
  internetGatewayId: this.internetGateway.id,
  natGatewayId: this.natGateway.id,
};
```
