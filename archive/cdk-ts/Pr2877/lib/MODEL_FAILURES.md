This document captures the specific failures observed in AI model responses when generating AWS CDK infrastructure code for serverless applications.

## Case 1: Incorrect Resource Configuration

**Task**: Create an S3 bucket with versioning enabled and public read access

**Expected Output**:
```typescript
const bucket = new s3.Bucket(this, 'MyBucket', {
  versioned: true,
  publicReadAccess: true,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS
});
```

**Model's Incorrect Response**:
```typescript
const bucket = new s3.Bucket(this, 'MyBucket', {
  versioned: true,
  publicReadAccess: true,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL  // WRONG: This blocks all public access
});
```

**Failure Reason**: The model incorrectly used `BLOCK_ALL` instead of `BLOCK_ACLS`, which would block all public access despite setting `publicReadAccess: true`. This creates a contradictory configuration that would fail deployment.

**Impact**: Infrastructure deployment would fail with a validation error about conflicting bucket policies.

---

## Case 2: Missing Required Properties

**Task**: Create an RDS instance with encryption enabled

**Expected Output**:
```typescript
const db = new rds.DatabaseInstance(this, 'MyDatabase', {
  engine: rds.DatabaseInstanceEngine.mysql({
    version: rds.MysqlEngineVersion.VER_8_0
  }),
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  storageEncrypted: true,
  vpc: vpc,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
  }
});
```

**Model's Incorrect Response**:
```typescript
const db = new rds.DatabaseInstance(this, 'MyDatabase', {
  engine: rds.DatabaseInstanceEngine.mysql({
    version: rds.MysqlEngineVersion.VER_8_0
  }),
  storageEncrypted: true
  // MISSING: instanceType, vpc, and vpcSubnets are required
});
```

**Failure Reason**: The model omitted critical required properties like `instanceType`, `vpc`, and `vpcSubnets`, which are mandatory for RDS instance creation.

**Impact**: CDK synthesis would fail with validation errors about missing required properties.

---

## Case 3: Incorrect Import Statements

**Task**: Create a Lambda function with an IAM role

**Expected Output**:
```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

const role = new iam.Role(this, 'LambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
});

const fn = new lambda.Function(this, 'MyFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromInline('exports.handler = async () => "Hello World";'),
  role: role
});
```

**Model's Incorrect Response**:
```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
// MISSING: import * as iam from 'aws-cdk-lib/aws-iam';

const role = new iam.Role(this, 'LambdaRole', {  // ERROR: iam is not imported
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
});

const fn = new lambda.Function(this, 'MyFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  code: lambda.Code.fromInline('exports.handler = async () => "Hello World";'),
  role: role
});
```

**Failure Reason**: The model failed to import the `aws-iam` module but attempted to use `iam.Role` and `iam.ServicePrincipal`, causing a compilation error.

**Impact**: TypeScript compilation would fail with "Cannot find name 'iam'" errors.

---

## Case 4: Incorrect Resource Naming Convention

**Task**: Create a CloudWatch alarm for high CPU usage

**Expected Output**:
```typescript
const alarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
  metric: ec2Instance.metricCpuUtilization(),
  threshold: 80,
  evaluationPeriods: 2,
  alarmDescription: 'Alarm when CPU exceeds 80%'
});
```

**Model's Incorrect Response**:
```typescript
const alarm = new cloudwatch.Alarm(this, 'high-cpu-alarm', {  // WRONG: kebab-case instead of PascalCase
  metric: ec2Instance.metricCpuUtilization(),
  threshold: 80,
  evaluationPeriods: 2,
  alarmDescription: 'Alarm when CPU exceeds 80%'
});
```

**Failure Reason**: The model used kebab-case (`'high-cpu-alarm'`) instead of PascalCase (`'HighCpuAlarm'`) for the construct ID, which violates CDK naming conventions and can cause issues with resource naming.

**Impact**: While this might not cause immediate failure, it leads to inconsistent resource naming and potential conflicts in complex stacks.

---

## Case 5: Incorrect Environment Configuration

**Task**: Create an ECS service with Fargate

**Expected Output**:
```typescript
const service = new ecs.FargateService(this, 'MyService', {
  cluster: cluster,
  taskDefinition: taskDefinition,
  desiredCount: 2,
  assignPublicIp: false,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
  }
});
```

**Model's Incorrect Response**:
```typescript
const service = new ecs.FargateService(this, 'MyService', {
  cluster: cluster,
  taskDefinition: taskDefinition,
  desiredCount: 2,
  assignPublicIp: true,  // WRONG: Should be false for private subnets
  vpcSubnets: {
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS  // CONFLICT: Private subnets with public IP
  }
});
```

**Failure Reason**: The model set `assignPublicIp: true` while using `PRIVATE_WITH_EGRESS` subnets, which creates a configuration conflict. Private subnets should not have public IPs assigned.

**Impact**: ECS service deployment would fail with a validation error about incompatible subnet and IP assignment configuration.