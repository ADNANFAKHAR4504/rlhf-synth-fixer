# Model Response Analysis vs Implementation

### 1. Build Errors (TypeScript Compilation)

#### KMS Key Policy Property Error

**Issue**: The model used `keyPolicy` property which doesn't exist in the CDK `KeyProps` interface. The correct property is `policy`.

**Error Message**: `Object literal may only specify known properties, but 'keyPolicy' does not exist in type 'KeyProps'. Did you mean to write 'policy'?`

**Original Code**:

```typescript
const kmsKey = new kms.Key(this, `${prefix}-kms-key-${environment}`, {
  alias: `${prefix}-encryption-key-${environment}`,
  description: `KMS key for ${prefix} infrastructure encryption - ${environment}`,
  enableKeyRotation: true,
  keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
  keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  keyPolicy: new iam.PolicyDocument({
    // Invalid property name
    statements: [
      // ... policy statements
    ],
  }),
});
```

**Fixed Code**:

```typescript
const kmsKey = new kms.Key(this, `${prefix}-kms-key-${environment}`, {
  alias: `${prefix}-encryption-key-${environment}`,
  description: `KMS key for ${prefix} infrastructure encryption - ${environment}`,
  enableKeyRotation: true,
  keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
  keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  policy: new iam.PolicyDocument({
    // Changed from keyPolicy to policy
    statements: [
      // ... policy statements
    ],
  }),
});
```

### 2. Launch Template HTTP Endpoint Property Error

**Issue**: The model used `LaunchTemplateHttpEndpoint.ENABLED` which doesn't exist in the CDK. The property was incorrectly referenced and the `requireImdsv2` property was redundant with `httpTokens`.

**Error Message**: `Property 'LaunchTemplateHttpEndpoint' does not exist on type 'typeof import(...aws-ec2/index")'. Did you mean 'LaunchTemplateHttpTokens'?`

**Original Code**:

```typescript
const launchTemplate = new ec2.LaunchTemplate(
  this,
  `${prefix}-launch-template-${environment}`,
  {
    // ... other properties
    requireImdsv2: true, // Security best practice
    httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
    httpEndpoint: ec2.LaunchTemplateHttpEndpoint.ENABLED, // Invalid property
    httpPutResponseHopLimit: 2,
  }
);
```

**Fixed Code**:

```typescript
const launchTemplate = new ec2.LaunchTemplate(
  this,
  `${prefix}-launch-template-${environment}`,
  {
    // ... other properties
    httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
    httpPutResponseHopLimit: 2,
    // Removed requireImdsv2 and httpEndpoint properties
  }
);
```

### 3. Auto Scaling CPU Utilization Properties Error

**Issue**: The model used `scaleInCooldown` and `scaleOutCooldown` properties which don't exist in the `CpuUtilizationScalingProps` interface. The correct property is `cooldown`.

**Error Message**: `Object literal may only specify known properties, and 'scaleInCooldown' does not exist in type 'CpuUtilizationScalingProps'.`

**Original Code**:

```typescript
asg.scaleOnCpuUtilization(`${prefix}-cpu-scaling-${environment}`, {
  targetUtilizationPercent: 70,
  scaleInCooldown: cdk.Duration.seconds(300), // Invalid property
  scaleOutCooldown: cdk.Duration.seconds(300), // Invalid property
});
```

**Fixed Code**:

```typescript
asg.scaleOnCpuUtilization(`${prefix}-cpu-scaling-${environment}`, {
  targetUtilizationPercent: 70,
  cooldown: cdk.Duration.seconds(300), // Single cooldown property
});
```

## Lint Errors (ESLint)

### 1. Unused Variable: commonTags

**Issue**: The `commonTags` variable was declared but never used in the code.

**Error Message**: `'commonTags' is assigned a value but never used @typescript-eslint/no-unused-vars`

**Original Code**:

```typescript
// Common tags
const commonTags = {
  Environment: 'Production',
  Project: 'SecureWebApp',
  ManagedBy: 'CDK',
};

// Apply tags to the stack
cdk.Tags.of(this).add('Environment', 'Production');
cdk.Tags.of(this).add('Project', 'SecureWebApp');
cdk.Tags.of(this).add('ManagedBy', 'CDK');
```

**Fixed Code**:

```typescript
// Apply tags to the stack
cdk.Tags.of(this).add('Environment', 'Production');
cdk.Tags.of(this).add('Project', 'SecureWebApp');
cdk.Tags.of(this).add('ManagedBy', 'CDK');
```

### 2. Unused Variable: webAcl

**Issue**: The `webAcl` variable was assigned but never used after creation.

**Error Message**: `'webAcl' is assigned a value but never used @typescript-eslint/no-unused-vars`

**Original Code**:

```typescript
// 8. WAFv2
const webAcl = this.createWAFv2(alb, prefix, environment);
```

**Fixed Code**:

```typescript
// 8. WAFv2
this.createWAFv2(alb, prefix, environment);
```

## Deprecation Warnings (CDK Synthesis)

### 1. Health Check API Deprecation (FIXED)

**Warning**: `aws-cdk-lib.aws_autoscaling.HealthCheck#elb` is deprecated. Use newer health check configuration.

**Original Code**:

```typescript
healthCheck: autoscaling.HealthCheck.elb({
  grace: cdk.Duration.seconds(300),
}),
```

**Fixed Code**:

```typescript
// Removed explicit health check configuration to use CDK defaults
// CDK will automatically configure appropriate health checks
// This eliminates deprecation warnings while maintaining functionality
```

### 2. ALB Metrics API Deprecation (FIXED)

**Warning**: Multiple ALB metric methods were deprecated:

- `ApplicationLoadBalancer.metricRequestCount` → Use `ApplicationLoadBalancer.metrics.requestCount`
- `ApplicationLoadBalancer.metricTargetResponseTime` → Use `ApplicationLoadBalancer.metrics.targetResponseTime`
- `ApplicationLoadBalancer.metricHttpCodeTarget` → Use `ApplicationLoadBalancer.metrics.httpCodeTarget`

**Original Code**:

```typescript
left: [alb.metricRequestCount()],
left: [alb.metricTargetResponseTime()],
left: [
  alb.metricHttpCodeTarget(elbv2.HttpCodeTarget.TARGET_4XX_COUNT),
  alb.metricHttpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT),
],
```

**Fixed Code**:

```typescript
left: [alb.metrics.requestCount()],
left: [alb.metrics.targetResponseTime()],
left: [
  alb.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_4XX_COUNT),
  alb.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT),
],
```

### 3. Auto Scaling Group Desired Capacity Warning (FIXED)

**Warning**: `desiredCapacity has been configured. Be aware this will reset the size of your AutoScalingGroup on every deployment.`

**Original Code**:

```typescript
const asg = new autoscaling.AutoScalingGroup(
  this,
  `${prefix}-asg-${environment}`,
  {
    // ... other properties
    desiredCapacity: 2, // This causes the warning
  }
);
```

**Fixed Code**:

```typescript
const asg = new autoscaling.AutoScalingGroup(
  this,
  `${prefix}-asg-${environment}`,
  {
    // ... other properties
    // Removed desiredCapacity to avoid reset on every deployment
    // ASG will start with minCapacity instances
  }
);
```


## Deployment Issues Identified and Fixed

### 1. ALB Access Logs S3 Bucket Permission Error

**Issue**: Application Load Balancer failed to create due to insufficient S3 bucket permissions for access logs.

**Error Message**: `Access Denied for bucket: tf-alb-access-logs-***. Please check S3bucket permission (Service: ElasticLoadBalancingV2, Status Code: 400)`

**Root Cause**: The ALB service needs specific IAM permissions to write access logs to the S3 bucket. The model created the S3 bucket but didn't configure the necessary bucket policy to allow the ELB service account to write logs.

**Original Code (MODEL_RESPONSE.md)**:

```typescript
// Enable access logs
const accessLogsBucket = new s3.Bucket(
  this,
  `${prefix}-alb-logs-${environment}`,
  {
    bucketName: `${prefix}-alb-access-logs-${environment}-${this.account}`,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    encryption: s3.BucketEncryption.S3_MANAGED,
    lifecycleRules: [
      {
        id: 'DeleteOldLogs',
        expiration: cdk.Duration.days(90),
      },
    ],
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  }
);

alb.setAttribute('access_logs.s3.enabled', 'true');
alb.setAttribute('access_logs.s3.bucket', accessLogsBucket.bucketName);
```

**Fixed Code (IDEAL_RESPONSE.md)**:

```typescript
// Enable access logs
const accessLogsBucket = new s3.Bucket(
  this,
  `${prefix}-alb-logs-${environment}`,
  {
    bucketName: `${prefix}-alb-access-logs-${environment}`,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    encryption: s3.BucketEncryption.S3_MANAGED,
    lifecycleRules: [
      {
        id: 'DeleteOldLogs',
        expiration: cdk.Duration.days(90),
      },
    ],
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  }
);

// Add bucket policy to allow ALB to write access logs
// Use CDK's built-in ELB service principal instead of hardcoded account IDs
accessLogsBucket.addToResourcePolicy(
  new iam.PolicyStatement({
    sid: 'AllowELBServiceAccount',
    effect: iam.Effect.ALLOW,
    principals: [
      new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com'),
    ],
    actions: ['s3:PutObject'],
    resources: [`${accessLogsBucket.bucketArn}/*`],
    conditions: {
      StringEquals: {
        's3:x-amz-acl': 'bucket-owner-full-control',
      },
    },
  })
);

accessLogsBucket.addToResourcePolicy(
  new iam.PolicyStatement({
    sid: 'AllowELBServiceAccountGetBucketAcl',
    effect: iam.Effect.ALLOW,
    principals: [
      new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com'),
    ],
    actions: ['s3:GetBucketAcl'],
    resources: [accessLogsBucket.bucketArn],
  })
);

alb.setAttribute('access_logs.s3.enabled', 'true');
alb.setAttribute('access_logs.s3.bucket', accessLogsBucket.bucketName);
```
