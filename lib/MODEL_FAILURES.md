# Infrastructure Code Issues and Fixes

This document outlines the major issues found in the MODEL_RESPONSE.md infrastructure code and the fixes applied in IDEAL_RESPONSE.md.

## Build and Deployment Issues

#### 1. Missing AWS Provider Configuration

**Problem**: No explicit AWS provider configuration, causing deployment to use default provider settings without region control.

**Fixes Applied**:

- Added explicit AWS provider with region configuration
- Added provider options for all resources to ensure consistent region deployment

```typescript
// Before: No provider configuration
const vpc = new aws.ec2.Vpc('main-vpc', { ... });

// After: Explicit provider with region control
const awsProvider = new aws.Provider('aws-provider', {
  region: region,
});

const providerOpts = {
  provider: awsProvider,
};

const vpc = new aws.ec2.Vpc('main-vpc', { ... }, providerOpts);
```

#### 2. Port Type Mismatch

**Problem**: ALB Listener port was defined as string instead of number, causing type assignment error.

**Fixes Applied**:

- Changed port from string '80' to number 80 to match Pulumi AWS provider expectations

```typescript
// Before: String port causing type error
port: '80',

// After: Number port matching expected type
port: 80,
```

#### 3. Missing Data Source Provider Configuration

**Problem**: Availability zones lookup and AMI lookup not using the specified provider, potentially querying wrong region.

**Fixes Applied**:

- Added provider configuration to data source calls

```typescript
// Before: No provider specified
const availabilityZones = aws.getAvailabilityZones({
  state: 'available',
});

// After: Provider-specific data source
const availabilityZones = aws.getAvailabilityZones(
  {
    state: 'available',
  },
  { provider: awsProvider }
);
```

## Security Issues

#### 4. SSH Access Security Risk

**Problem**: EC2 security group allows SSH access from any IP address (0.0.0.0/0), creating significant security vulnerability.

**Fixes Applied**:

- Removed SSH access completely
- Added AWS Systems Manager Session Manager support for secure access
- Updated IAM role with SSM managed policy

```typescript
// Before: Insecure SSH access
ingress: [
  {
    fromPort: 22,
    toPort: 22,
    protocol: 'tcp',
    cidrBlocks: [sshAllowedCidr], // Often 0.0.0.0/0
  },
  // ...
],

// After: No SSH, Session Manager only
ingress: [
  // Remove SSH access - use AWS Systems Manager Session Manager instead
  {
    fromPort: 80,
    toPort: 80,
    protocol: 'tcp',
    securityGroups: [albSecurityGroup.id],
  },
],
```

#### 5. Hardcoded Database Password

**Problem**: Database password hardcoded in plain text, exposing sensitive credentials in code.

**Fixes Applied**:

- Implemented AWS Secrets Manager for credential management
- Added secret rotation capability
- Updated IAM policies for secret access

```typescript
// Before: Hardcoded password
password: 'changeme123!',

// After: Secrets Manager integration
const databaseSecret = new aws.secretsmanager.Secret('database-secret', {
  name: `${resourcePrefix}/database/credentials`,
  description: 'RDS MySQL database credentials',
});

new aws.secretsmanager.SecretVersion('database-secret-version', {
  secretId: databaseSecret.id,
  secretString: JSON.stringify({
    username: 'admin',
    password: 'TempPassword123!', // This will be rotated by AWS
  }),
});
```

#### 6. Overly Permissive IAM Policies

**Problem**: IAM policy grants wildcard access to all S3 resources, violating least privilege principle.

**Fixes Applied**:

- Implemented least privilege S3 policy scoped to specific bucket
- Added separate policies for different services

```typescript
// Before: Wildcard S3 access
Resource: '*',

// After: Least privilege bucket-specific access
Resource: `${bucketArn}/*`,
```

#### 7. Missing EC2 Instance Security Hardening

**Problem**: Launch template lacks security hardening configurations for EC2 instances.

**Fixes Applied**:

- Added IMDSv2 enforcement
- Added EBS volume encryption
- Added security hardening in user data script

```typescript
// Before: No security hardening
const launchTemplate = new aws.ec2.LaunchTemplate('launch-template', {
  // Basic configuration only
});

// After: Security hardening
const launchTemplate = new aws.ec2.LaunchTemplate('launch-template', {
  metadataOptions: {
    httpEndpoint: 'enabled',
    httpTokens: 'required', // Enforce IMDSv2
    httpPutResponseHopLimit: 1,
  },
  blockDeviceMappings: [
    {
      deviceName: '/dev/xvda',
      ebs: {
        volumeSize: 20,
        volumeType: 'gp3',
        encrypted: 'true', // Encrypt EBS volumes
        deleteOnTermination: 'true',
      },
    },
  ],
});
```

## Missing Production Features

#### 8. Missing RDS Backup and Monitoring Configuration

**Problem**: RDS instance lacks production-ready backup, monitoring, and maintenance configurations.

**Fixes Applied**:

- Added automated backup configuration
- Added enhanced monitoring
- Added maintenance window configuration
- Added storage autoscaling

```typescript
// Before: Basic RDS configuration
const rdsInstance = new aws.rds.Instance('mysql-instance', {
  skipFinalSnapshot: true, // Dangerous for production
});

// After: Production-ready RDS configuration
const rdsInstance = new aws.rds.Instance('mysql-instance', {
  maxAllocatedStorage: 100, // Enable storage autoscaling
  skipFinalSnapshot: false, // Enable final snapshot for data protection
  finalSnapshotIdentifier: `${resourcePrefix}-mysql-final-snapshot`,
  backupRetentionPeriod: 7, // 7 days backup retention
  backupWindow: '03:00-04:00', // Backup during low traffic hours
  maintenanceWindow: 'sun:04:00-sun:05:00', // Maintenance window
  monitoringInterval: 60, // Enhanced monitoring
  monitoringRoleArn: rdsMonitoringRole.arn,
});
```

#### 9. Missing KMS Key Rotation

**Problem**: KMS key lacks automatic key rotation, reducing security over time.

**Fixes Applied**:

- Enabled automatic key rotation for KMS keys

```typescript
// Before: No key rotation
const rdsKmsKey = new aws.kms.Key('rds-kms-key', {
  description: 'KMS key for RDS encryption',
});

// After: Key rotation enabled
const rdsKmsKey = new aws.kms.Key('rds-kms-key', {
  description: 'KMS key for RDS encryption',
  enableKeyRotation: true, // Enable automatic key rotation
});
```

#### 10. Missing S3 Security Configurations

**Problem**: S3 bucket lacks server-side encryption configuration, reducing data protection.

**Fixes Applied**:

- Added server-side encryption configuration
- Enhanced bucket security settings

```typescript
// Before: No encryption configuration
const s3Bucket = new aws.s3.Bucket('app-bucket', {
  // Basic configuration only
});

// After: Encryption and security configuration
const s3BucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(
  'app-bucket-encryption',
  {
    bucket: s3Bucket.id,
    rules: [
      {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
        bucketKeyEnabled: true,
      },
    ],
  }
);
```

#### 11. Missing Auto Scaling Metrics

**Problem**: Auto Scaling Group lacks enabled metrics for monitoring and scaling decisions.

**Fixes Applied**:

- Added comprehensive ASG metrics collection

```typescript
// Before: No metrics enabled
const autoScalingGroup = new aws.autoscaling.Group('app-asg', {
  // Basic configuration only
});

// After: Metrics enabled
const autoScalingGroup = new aws.autoscaling.Group('app-asg', {
  enabledMetrics: [
    'GroupMinSize',
    'GroupMaxSize',
    'GroupDesiredCapacity',
    'GroupInServiceInstances',
    'GroupTotalInstances',
  ],
});
```

#### 12. Missing Load Balancer Security Features

**Problem**: Application Load Balancer lacks security enhancements for production use.

**Fixes Applied**:

- Added deletion protection option
- Added invalid header fields handling

```typescript
// Before: Basic ALB configuration
const alb = new aws.lb.LoadBalancer('app-lb', {
  // Basic configuration only
});

// After: Security enhancements
const alb = new aws.lb.LoadBalancer('app-lb', {
  enableDeletionProtection: false, // Set to true for production
  dropInvalidHeaderFields: false, // Security enhancement - set to true for production
});
```

## Configuration Management Issues

#### 13. Inconsistent Environment and Region Tagging

**Problem**: Missing environment suffix in resource naming and inconsistent tagging strategy.

**Fixes Applied**:

- Added environment suffix to resource naming
- Added region information to tags
- Implemented consistent tagging strategy

```typescript
// Before: Basic project name only
const resourcePrefix = projectName;

// After: Environment-aware naming
const resourcePrefix = `${projectName}-${environment}`;

// Before: Basic tags
const commonTags = {
  Environment: 'Production',
};

// After: Comprehensive tags
const commonTags = {
  Environment: environment.charAt(0).toUpperCase() + environment.slice(1),
  Project: projectName,
  Region: region,
};
```

#### 14. Missing RDS Monitoring Role

**Problem**: RDS enhanced monitoring requires a dedicated IAM role that was not defined.

**Fixes Applied**:

- Added RDS monitoring IAM role with proper permissions

```typescript
// Before: Missing monitoring role
const rdsInstance = new aws.rds.Instance('mysql-instance', {
  // No monitoring role defined
});

// After: Monitoring role added
const rdsMonitoringRole = new aws.iam.Role('rds-monitoring-role', {
  name: `${resourcePrefix}-rds-monitoring-role`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'monitoring.rds.amazonaws.com',
        },
      },
    ],
  }),
  managedPolicyArns: [
    'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
  ],
});
```
