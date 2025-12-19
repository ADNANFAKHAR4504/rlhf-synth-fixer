# Model Failures Analysis

## 1. Security Issue - Hardcoded Database Password
**Type**: Security vulnerability
**Description**: Model exposed database password in plain text in the code
**Model Code**: 
```typescript
password: "password123"
```
**Correct Code**: 
```typescript
manageMasterUserPassword: true
```
**Impact**: Hardcoded passwords are a critical security vulnerability that can lead to unauthorized database access.

## 2. Deprecated API Usage - S3 Bucket Versioning
**Type**: Deprecation issue
**Description**: Model used deprecated S3 bucket versioning API
**Model Code**: 
```typescript
new aws.s3.BucketVersioningV2(`s3-bucket-versioning-${environment}`, {
    bucket: this.s3Bucket.id,
    versioningConfiguration: {
        status: "Enabled",
    },
}, { provider });
```
**Correct Code**: 
```typescript
new aws.s3.BucketVersioning(`s3-bucket-versioning-${this.environment}`, {
    bucket: bucket.id,
    versioningConfiguration: { status: 'Enabled' },
}, { provider: this.provider });
```
**Impact**: Using deprecated APIs can cause build failures and future compatibility issues.

## 3. Build Failure - Availability Zone Access
**Type**: Runtime error
**Description**: Model accessed availability zones array without proper null checking
**Model Code**: 
```typescript
availabilityZone: azs.then(azs => azs.names[i])
```
**Correct Code**: 
```typescript
availabilityZone: azs.then(azs => this.getAvailabilityZone(azs.names, i))

public getAvailabilityZone(names: string[] | undefined | null, index: number): string {
    if (!names || names.length === 0) {
        return `us-east-1${String.fromCharCode(97 + index)}`;
    }
    return names[index % names.length] || `us-east-1${String.fromCharCode(97 + index)}`;
}
```
**Impact**: Runtime errors when availability zones are undefined or empty, causing deployment failures.

## 4. Security Issue - Overly Permissive IAM Policies
**Type**: Security vulnerability
**Description**: Model used AWS managed policies instead of least privilege custom policies
**Model Code**: 
```typescript
new aws.iam.RolePolicyAttachment(`ec2-policy-${environment}`, {
    role: ec2Role.name,
    policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
}, { provider });
```
**Correct Code**: 
```typescript
new aws.iam.RolePolicy(`ec2-policy-${this.environment}`, {
    role: role.id,
    policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
            Effect: 'Allow',
            Action: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
            Resource: '*',
        }],
    }),
}, { provider: this.provider });
```
**Impact**: Violates least privilege principle and grants unnecessary permissions.

## 5. Security Issue - Hardcoded Secrets in Code
**Type**: Security vulnerability
**Description**: Model stored sensitive data directly in secrets manager without proper generation
**Model Code**: 
```typescript
secretString: JSON.stringify({
    database_password: "password123",
    api_key: "secret-api-key",
})
```
**Correct Code**: 
```typescript
const password = new random.RandomPassword(`password-${this.environment}`, {
    length: 16,
    special: true,
});

secretString: pulumi.jsonStringify({
    username: 'admin',
    password: password.result,
})
```
**Impact**: Hardcoded secrets in code can be exposed in version control and logs.

## 6. Build Failure - Missing Random Password Provider
**Type**: Build error
**Description**: Model didn't import the random provider needed for secure password generation
**Model Code**: Missing import
**Correct Code**: 
```typescript
import * as random from '@pulumi/random';
```
**Impact**: Build failures due to missing dependencies.

## 7. Security Issue - Bucket Naming with Random Suffix
**Type**: Security/Predictability issue
**Description**: Model used Math.random() for bucket naming which is not cryptographically secure
**Model Code**: 
```typescript
bucket: `s3-bucket-${environment}-${Math.random().toString(36).substring(7)}`
```
**Correct Code**: 
```typescript
bucket: `s3-bucket-${this.environment}`
```
**Impact**: Predictable bucket names can be security risks; better to use deterministic naming with proper resource management.

## 8. Missing Monitoring - Incomplete CloudWatch Alarms
**Type**: Monitoring gap
**Description**: Model only created CPU alarm for EC2, missing comprehensive monitoring
**Model Code**: Only EC2 CPU alarm
**Correct Code**: 
```typescript
// Multiple alarms for different services
new aws.cloudwatch.MetricAlarm(`ec2-cpu-alarm-${this.environment}`, ...);
new aws.cloudwatch.MetricAlarm(`rds-cpu-alarm-${this.environment}`, ...);
new aws.cloudwatch.MetricAlarm(`lambda-error-alarm-${this.environment}`, ...);
new aws.cloudwatch.MetricAlarm(`alb-target-response-alarm-${this.environment}`, ...);
new aws.cloudwatch.MetricAlarm(`cf-error-rate-alarm-${this.environment}`, ...);
```
**Impact**: Incomplete monitoring can lead to undetected issues in production.

## 9. IAM Issue - Missing KMS Grants for DynamoDB
**Type**: IAM/Encryption issue
**Description**: Model didn't create proper KMS grants for DynamoDB encryption
**Model Code**: Missing KMS grant
**Correct Code**: 
```typescript
new aws.kms.Grant(`dynamo-kms-grant-${this.environment}`, {
    keyId: this.kmsKey.keyId,
    granteePrincipal: 'dynamodb.amazonaws.com',
    operations: [
        'Encrypt', 'Decrypt', 'ReEncryptFrom', 'ReEncryptTo',
        'GenerateDataKey', 'DescribeKey',
    ],
}, { provider: this.provider });
```
**Impact**: DynamoDB encryption may fail without proper KMS grants.

## 10. Security Issue - AMI Filter Outdated
**Type**: Security/Maintenance issue
**Description**: Model used outdated Amazon Linux 2 AMI instead of Amazon Linux 2023
**Model Code**: 
```typescript
filters: [{
    name: "name",
    values: ["amzn2-ami-hvm-*-x86_64-gp2"],
}]
```
**Correct Code**: 
```typescript
filters: [
    { name: 'name', values: ['al2023-ami-*-x86_64'] },
    { name: 'state', values: ['available'] },
]
```
**Impact**: Using outdated AMIs can expose systems to security vulnerabilities and miss latest features.