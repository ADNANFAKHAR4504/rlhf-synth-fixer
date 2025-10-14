# MODEL_FAILURES

## Critical Deployment Failures

### 1. AWS Config Configuration Recorder Missing
**Location**: lib/tap-stack.ts  
**Issue**: Model response does not create AWS Config Configuration Recorder or Delivery Channel

**Model Response (Lines 154-196)**:
```typescript
private setupAwsConfigRules(complianceTopic: sns.Topic): void {
  // Directly creates Config rules without recorder
  new config.ManagedRule(this, 'S3BucketEncryptionRule', {
    identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
    description: 'Checks that S3 buckets have server-side encryption enabled',
  });
  // ... more rules
}
```

**Ideal Response (Lines 167-217)**:
```typescript
// Create S3 bucket for AWS Config
const configBucket = new s3.Bucket(this, 'ConfigBucket', {
  bucketName: `tap-config-${this.stackName.toLowerCase()}-${this.account}-${this.region}`,
  encryption: s3.BucketEncryption.KMS,
  encryptionKey: kmsKey,
  versioned: true,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  enforceSSL: true,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});

// IAM role for AWS Config
const configRole = new iam.Role(this, 'ConfigRole', {
  roleName: `tap-config-role-${this.stackName}`,
  assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole'),
  ],
});

configBucket.grantReadWrite(configRole);
kmsKey.grantEncryptDecrypt(configRole);

// AWS Config Configuration Recorder
const configRecorder = new config.CfnConfigurationRecorder(
  this,
  'ConfigRecorder',
  {
    name: `tap-config-recorder-${this.stackName}`,
    roleArn: configRole.roleArn,
    recordingGroup: {
      allSupported: true,
      includeGlobalResourceTypes: true,
    },
  }
);

// AWS Config Delivery Channel
const configDeliveryChannel = new config.CfnDeliveryChannel(
  this,
  'ConfigDeliveryChannel',
  {
    name: `tap-config-delivery-${this.stackName}`,
    s3BucketName: configBucket.bucketName,
    s3KmsKeyArn: kmsKey.keyArn,
  }
);
```

**Impact**: CRITICAL - Config rules will fail to deploy with error "NoAvailableConfigurationRecorder"

**Fix**: Add Configuration Recorder, Delivery Channel, Config S3 bucket, and Config IAM role before creating Config rules

---

### 2. Config Rules Missing Dependencies
**Location**: lib/tap-stack.ts, setupAwsConfigRules method  
**Issue**: Config rules don't have dependencies on Configuration Recorder and Delivery Channel

**Model Response**:
```typescript
new config.ManagedRule(this, 'S3BucketEncryptionRule', {
  identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
  description: 'Checks that S3 buckets have server-side encryption enabled',
});
```

**Ideal Response**:
```typescript
const s3EncryptionRule = new config.ManagedRule(
  this,
  'S3BucketEncryptionRule',
  {
    configRuleName: `s3-encryption-${this.stackName}`,
    identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
    description: 'Checks that S3 buckets have server-side encryption enabled',
  }
);
const s3EncryptionCfnRule = s3EncryptionRule.node.defaultChild as config.CfnConfigRule;
s3EncryptionCfnRule.addDependency(configRecorder);
s3EncryptionCfnRule.addDependency(configDeliveryChannel);
```

**Impact**: CRITICAL - Deployment will fail with "NoAvailableDeliveryChannelException"

**Fix**: Add proper CloudFormation dependencies to ensure resources are created in the correct order

---

### 3. Invalid Config Rule Identifier
**Location**: lib/tap-stack.ts line 169  
**Issue**: `INCOMING_SSH_DISABLED` does not exist in ManagedRuleIdentifiers

**Model Response**:
```typescript
new config.ManagedRule(this, 'RestrictedSSHRule', {
  identifier: config.ManagedRuleIdentifiers.INCOMING_SSH_DISABLED,
  description: 'Checks that security groups do not allow unrestricted SSH access',
});
```

**Ideal Response**:
```typescript
const sshRule = new config.CfnConfigRule(this, 'RestrictedSSHRule', {
  configRuleName: `restricted-ssh-${this.stackName}`,
  source: {
    owner: 'AWS',
    sourceIdentifier: 'INCOMING_SSH_DISABLED',
  },
  description: 'Checks that security groups do not allow unrestricted SSH access',
});
```

**Impact**: HIGH - Compilation error: Property 'INCOMING_SSH_DISABLED' does not exist on type 'typeof ManagedRuleIdentifiers'

**Fix**: Use CfnConfigRule with source property instead of ManagedRule

---

### 4. KMS Key Missing CloudWatch Logs Permissions
**Location**: lib/tap-stack.ts  
**Issue**: KMS key policy doesn't grant CloudWatch Logs service permission to use the key

**Model Response**:
```typescript
const kmsKey = new kms.Key(this, 'TapKmsKey', {
  description: 'KMS key for TAP infrastructure encryption',
  enableKeyRotation: true,
  alias: `alias/tap-${props.environment}-key`,
});
// No additional policy added
```

**Ideal Response**:
```typescript
const kmsKey = new kms.Key(this, 'TapKmsKey', {
  description: 'KMS key for TAP infrastructure encryption',
  enableKeyRotation: true,
  alias: `alias/tap-${props.environment}-key`,
});

// Grant CloudWatch Logs permission to use the KMS key
kmsKey.addToResourcePolicy(
  new iam.PolicyStatement({
    sid: 'Allow CloudWatch Logs to use the key',
    effect: iam.Effect.ALLOW,
    principals: [
      new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
    ],
    actions: [
      'kms:Encrypt',
      'kms:Decrypt',
      'kms:ReEncrypt*',
      'kms:GenerateDataKey*',
      'kms:CreateGrant',
      'kms:DescribeKey',
    ],
    resources: ['*'],
    conditions: {
      ArnLike: {
        'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
      },
    },
  })
);
```

**Impact**: HIGH - Deployment fails with error "The specified KMS key does not exist or is not allowed to be used"

**Fix**: Add explicit KMS key policy statement granting CloudWatch Logs service permissions

---

### 5. Missing Database Integration in Lambda
**Location**: lib/tap-stack.ts  
**Issue**: Lambda function created without database integration

**Model Response (Lines 91-118)**:
```typescript
const exampleFunction = new lambda.Function(this, 'ExampleFunction', {
  // ... configuration
  environment: {
    BUCKET_NAME: dataBucket.bucketName,
    ENVIRONMENT: props.environment,
  },
  // ... rest of config
});

// Database created AFTER Lambda (line 120-126)
const database = new DatabaseConstruct(this, 'Database', {
  vpc: networking.vpc,
  securityGroup: security.databaseSecurityGroup,
  kmsKey: kmsKey,
  environment: props.environment,
});
```

**Ideal Response (Lines 116-165)**:
```typescript
// Create encrypted RDS database BEFORE Lambda
const database = new DatabaseConstruct(this, 'Database', {
  vpc: networking.vpc,
  securityGroup: security.databaseSecurityGroup,
  kmsKey: kmsKey,
  environment: props.environment,
});

// Grant Lambda access to database secret
database.cluster.secret!.grantRead(lambdaRole);

// Create Lambda function with database environment variables
const exampleFunction = new lambda.Function(this, 'ExampleFunction', {
  // ... configuration
  environment: {
    BUCKET_NAME: dataBucket.bucketName,
    ENVIRONMENT: props.environment,
    DB_ENDPOINT: database.cluster.clusterEndpoint.hostname,
    DB_PORT: database.cluster.clusterEndpoint.port.toString(),
    DB_NAME: `tap_${props.environment}`,
    DB_SECRET_ARN: database.cluster.secret!.secretArn,
  },
  // ... rest of config
});
```

**Impact**: MEDIUM - Lambda cannot access database, missing environment variables

**Fix**: Create database before Lambda, add database environment variables, grant secret read permissions

---

### 6. Missing Lambda Function Outputs
**Location**: lib/tap-stack.ts  
**Issue**: Model doesn't output Lambda function ARN and name

**Model Response (Lines 137-151)**:
```typescript
new cdk.CfnOutput(this, 'VpcId', {
  value: networking.vpc.vpcId,
  description: 'VPC ID',
});

new cdk.CfnOutput(this, 'BucketName', {
  value: dataBucket.bucketName,
  description: 'Data bucket name',
});

new cdk.CfnOutput(this, 'DatabaseEndpoint', {
  value: database.cluster.clusterEndpoint.hostname,
  description: 'Database endpoint',
});
```

**Ideal Response (Lines 246-259)**:
```typescript
new cdk.CfnOutput(this, 'LambdaFunctionArn', {
  value: exampleFunction.functionArn,
  description: 'Lambda function ARN',
});

new cdk.CfnOutput(this, 'LambdaFunctionName', {
  value: exampleFunction.functionName,
  description: 'Lambda function name',
});

new cdk.CfnOutput(this, 'ConfigBucketName', {
  value: configBucket.bucketName,
  description: 'AWS Config bucket name',
});
```

**Impact**: MEDIUM - Integration tests cannot locate Lambda function or Config bucket

**Fix**: Add Lambda function ARN, name, and Config bucket outputs

---

### 7. Config Rules Missing Stack Name in Naming
**Location**: lib/tap-stack.ts, setupAwsConfigRules method  
**Issue**: Config rule names don't include stack name, causing conflicts in multi-stack deployments

**Model Response**:
```typescript
new config.ManagedRule(this, 'S3BucketEncryptionRule', {
  identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
  description: 'Checks that S3 buckets have server-side encryption enabled',
});
```

**Ideal Response**:
```typescript
const s3EncryptionRule = new config.ManagedRule(
  this,
  'S3BucketEncryptionRule',
  {
    configRuleName: `s3-encryption-${this.stackName}`,
    identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
    description: 'Checks that S3 buckets have server-side encryption enabled',
  }
);
```

**Impact**: MEDIUM - Multiple stack deployments to same account/region will conflict

**Fix**: Add configRuleName with stack name suffix to all Config rules

---

### 8. SNS Topic Missing Stack Name
**Location**: lib/tap-stack.ts  
**Issue**: SNS topic name doesn't include stack name

**Model Response (Line 129-132)**:
```typescript
const complianceTopic = new sns.Topic(this, 'ComplianceTopic', {
  topicName: `tap-${props.environment}-compliance-alerts`,
  masterKey: kmsKey,
});
```

**Ideal Response (Line 218-221)**:
```typescript
const complianceTopic = new sns.Topic(this, 'ComplianceTopic', {
  topicName: `tap-compliance-alerts-${this.stackName}`,
  masterKey: kmsKey,
});
```

**Impact**: LOW - May cause naming conflicts in multi-stack scenarios

**Fix**: Use `this.stackName` instead of `props.environment` for uniqueness

---

### 9. CloudWatch Alarm Missing Stack Name
**Location**: lib/tap-stack.ts  
**Issue**: Alarm name not specified, may cause conflicts

**Model Response (Line 190-195)**:
```typescript
new cloudwatch.Alarm(this, 'NonComplianceAlarm', {
  metric: nonCompliantMetric,
  threshold: 1,
  evaluationPeriods: 1,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  alarmDescription: 'Alert when resources are non-compliant with Config rules',
}).addAlarmAction(new cloudwatchActions.SnsAction(complianceTopic));
```

**Ideal Response (Line 335-343)**:
```typescript
new cloudwatch.Alarm(this, 'NonComplianceAlarm', {
  alarmName: `tap-non-compliance-${this.stackName}`,
  metric: nonCompliantMetric,
  threshold: 1,
  evaluationPeriods: 1,
  treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  alarmDescription: 'Alert when resources are non-compliant with Config rules',
}).addAlarmAction(new cloudwatchActions.SnsAction(complianceTopic));
```

**Impact**: LOW - Missing explicit alarm name may cause auto-generated names

**Fix**: Add `alarmName` property with stack name

---

## Non-Critical Issues

### 10. Database Construct Using Deprecated API
**Location**: lib/constructs/database.ts  
**Issue**: Uses deprecated `instances` and `instanceProps` instead of `writer` and `readers`

**Model Response (Lines 418-429)**:
```typescript
this.cluster = new rds.DatabaseCluster(this, 'Database', {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_14_6,
  }),
  credentials: rds.Credentials.fromSecret(databaseSecret),
  instances: 2, // Multi-AZ deployment for high availability
  instanceProps: {
    vpc: props.vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    },
    securityGroups: [props.securityGroup],
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T4G,
      ec2.InstanceSize.MEDIUM
    ),
  },
  // ... rest
});
```

**Ideal Response**:
```typescript
this.cluster = new rds.DatabaseCluster(this, 'Database', {
  engine: rds.DatabaseClusterEngine.auroraPostgres({
    version: rds.AuroraPostgresEngineVersion.VER_14_6,
  }),
  credentials: rds.Credentials.fromSecret(databaseSecret),
  vpc: props.vpc,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
  },
  securityGroups: [props.securityGroup],
  writer: rds.ClusterInstance.provisioned('WriterInstance', {
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T4G,
      ec2.InstanceSize.MEDIUM
    ),
  }),
  readers: [
    rds.ClusterInstance.provisioned('ReaderInstance', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MEDIUM
      ),
    }),
  ],
  // ... rest
});
```

**Impact**: MEDIUM - Deprecated API may be removed in future CDK versions

**Fix**: Use `writer` and `readers` properties instead of `instances` and `instanceProps`

---

### 11. Database Deletion Protection Not Environment-Aware
**Location**: lib/constructs/database.ts  
**Issue**: Deletion protection hardcoded to true for all environments

**Model Response (Line 437)**:
```typescript
deletionProtection: true,
```

**Ideal Response (Line 66)**:
```typescript
deletionProtection: props.environment === 'prod',
```

**Impact**: LOW - Dev/staging databases have deletion protection, making cleanup difficult

**Fix**: Make deletion protection conditional based on environment

---

### 12. Inconsistent Retention Constants
**Location**: Multiple files  
**Issue**: Uses THIRTY_DAYS instead of ONE_MONTH

**Model Response**:
```typescript
retention: logs.RetentionDays.THIRTY_DAYS,  // Line 85
cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.THIRTY_DAYS,  // Line 439
```

**Ideal Response**:
```typescript
retention: logs.RetentionDays.ONE_MONTH,
cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_MONTH,
```

**Impact**: NEGLIGIBLE - Both constants have the same value (30 days)

**Fix**: Use ONE_MONTH for consistency

---

### 13. Unnecessary Import in Security Construct
**Location**: lib/constructs/security.ts  
**Issue**: Imports route53 but never uses it

**Model Response (Line 280)**:
```typescript
import * as route53 from 'aws-cdk-lib/aws-route53';
```

**Ideal Response**:
No import of route53

**Impact**: NEGLIGIBLE - Unused import, no functional impact

**Fix**: Remove unused import

---

### 14. Missing setupAwsConfigRules Method Parameters
**Location**: lib/tap-stack.ts  
**Issue**: Method signature doesn't include required parameters for proper Config setup

**Model Response (Line 154)**:
```typescript
private setupAwsConfigRules(complianceTopic: sns.Topic): void {
```

**Ideal Response (Lines 264-267)**:
```typescript
private setupAwsConfigRules(
  complianceTopic: sns.Topic,
  configRecorder: config.CfnConfigurationRecorder,
  configDeliveryChannel: config.CfnDeliveryChannel
): void {
```

**Impact**: CRITICAL - Cannot add dependencies without these parameters

**Fix**: Update method signature to accept configRecorder and configDeliveryChannel