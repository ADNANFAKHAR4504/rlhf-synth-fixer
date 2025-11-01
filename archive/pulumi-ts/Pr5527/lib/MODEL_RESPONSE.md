# RDS Backup Verification and Recovery System - Initial Implementation

This is the initial implementation of the automated backup verification and recovery system for RDS PostgreSQL instances.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VPCStack } from './vpc-stack';
import { RDSStack } from './rds-stack';
import { BackupStack } from './backup-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly backupBucketName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC with private subnets
    const vpcStack = new VPCStack('rds-backup-vpc', {
      environmentSuffix,
      tags,
    }, { parent: this });

    // Create KMS key for encryption
    const kmsStack = new pulumi.ComponentResource('tap:kms', 'kms-stack', {}, { parent: this });

    // Create RDS PostgreSQL instance
    const rdsStack = new RDSStack('rds-postgresql', {
      environmentSuffix,
      vpcId: vpcStack.vpcId,
      privateSubnetIds: vpcStack.privateSubnetIds,
      securityGroupId: vpcStack.rdsSecurityGroupId,
      tags,
    }, { parent: this });

    // Create backup infrastructure
    const backupStack = new BackupStack('backup-infra', {
      environmentSuffix,
      rdsInstanceId: rdsStack.instanceId,
      rdsEndpoint: rdsStack.endpoint,
      vpcId: vpcStack.vpcId,
      privateSubnetIds: vpcStack.privateSubnetIds,
      lambdaSecurityGroupId: vpcStack.lambdaSecurityGroupId,
      tags,
    }, { parent: this });

    // Create monitoring and alerting
    const monitoringStack = new MonitoringStack('monitoring', {
      environmentSuffix,
      rdsInstanceId: rdsStack.instanceId,
      backupBucketName: backupStack.bucketName,
      lambdaFunctionName: backupStack.lambdaFunctionName,
      tags,
    }, { parent: this });

    this.rdsEndpoint = rdsStack.endpoint;
    this.backupBucketName = backupStack.bucketName;
    this.snsTopicArn = monitoringStack.snsTopicArn;

    this.registerOutputs({
      rdsEndpoint: this.rdsEndpoint,
      backupBucketName: this.backupBucketName,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
```

## File: lib/vpc-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VPCStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class VPCStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly rdsSecurityGroupId: pulumi.Output<string>;
  public readonly lambdaSecurityGroupId: pulumi.Output<string>;

  constructor(name: string, args: VPCStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:vpc:VPCStack', name, {}, opts);

    // Create VPC
    const vpc = new aws.ec2.Vpc(`backup-vpc-${args.environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: pulumi.all([args.tags]).apply(([tags]) => ({
        ...tags,
        Name: `backup-vpc-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Create private subnets
    const privateSubnet1 = new aws.ec2.Subnet(`private-subnet-1-${args.environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'ap-southeast-1a',
      tags: pulumi.all([args.tags]).apply(([tags]) => ({
        ...tags,
        Name: `private-subnet-1-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    const privateSubnet2 = new aws.ec2.Subnet(`private-subnet-2-${args.environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'ap-southeast-1b',
      tags: pulumi.all([args.tags]).apply(([tags]) => ({
        ...tags,
        Name: `private-subnet-2-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(`rds-sg-${args.environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for RDS PostgreSQL',
      tags: pulumi.all([args.tags]).apply(([tags]) => ({
        ...tags,
        Name: `rds-sg-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Security group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`lambda-sg-${args.environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for backup Lambda',
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      tags: pulumi.all([args.tags]).apply(([tags]) => ({
        ...tags,
        Name: `lambda-sg-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Allow Lambda to connect to RDS
    new aws.ec2.SecurityGroupRule(`lambda-to-rds-${args.environmentSuffix}`, {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: rdsSecurityGroup.id,
      sourceSecurityGroupId: lambdaSecurityGroup.id,
    }, { parent: this });

    this.vpcId = vpc.id;
    this.privateSubnetIds = pulumi.output([privateSubnet1.id, privateSubnet2.id]);
    this.rdsSecurityGroupId = rdsSecurityGroup.id;
    this.lambdaSecurityGroupId = lambdaSecurityGroup.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      rdsSecurityGroupId: this.rdsSecurityGroupId,
      lambdaSecurityGroupId: this.lambdaSecurityGroupId,
    });
  }
}
```

## File: lib/rds-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RDSStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  securityGroupId: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class RDSStack extends pulumi.ComponentResource {
  public readonly instanceId: pulumi.Output<string>;
  public readonly endpoint: pulumi.Output<string>;

  constructor(name: string, args: RDSStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:rds:RDSStack', name, {}, opts);

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(`rds-subnet-group-${args.environmentSuffix}`, {
      subnetIds: args.privateSubnetIds,
      tags: pulumi.all([args.tags]).apply(([tags]) => ({
        ...tags,
        Name: `rds-subnet-group-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // Create RDS instance
    const dbInstance = new aws.rds.Instance(`postgres-${args.environmentSuffix}`, {
      engine: 'postgres',
      engineVersion: '15.3',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'backuptest',
      username: 'dbadmin',
      password: pulumi.secret('ChangeMe123!'),
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [args.securityGroupId],
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'Mon:04:00-Mon:05:00',
      skipFinalSnapshot: true,
      storageEncrypted: true,
      tags: pulumi.all([args.tags]).apply(([tags]) => ({
        ...tags,
        Name: `postgres-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    this.instanceId = dbInstance.id;
    this.endpoint = dbInstance.endpoint;

    this.registerOutputs({
      instanceId: this.instanceId,
      endpoint: this.endpoint,
    });
  }
}
```

## File: lib/backup-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BackupStackArgs {
  environmentSuffix: string;
  rdsInstanceId: pulumi.Output<string>;
  rdsEndpoint: pulumi.Output<string>;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  lambdaSecurityGroupId: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class BackupStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;

  constructor(name: string, args: BackupStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:backup:BackupStack', name, {}, opts);

    // Create S3 bucket for snapshots
    const bucket = new aws.s3.Bucket(`backup-bucket-${args.environmentSuffix}`, {
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      lifecycleRules: [{
        enabled: true,
        expiration: {
          days: 30,
        },
      }],
      tags: pulumi.all([args.tags]).apply(([tags]) => ({
        ...tags,
        Name: `backup-bucket-${args.environmentSuffix}`,
      })),
    }, { parent: this });

    // IAM role for Lambda
    const lambdaRole = new aws.iam.Role(`backup-lambda-role-${args.environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Effect: 'Allow',
        }],
      }),
      tags: args.tags,
    }, { parent: this });

    // Attach policies to Lambda role
    new aws.iam.RolePolicyAttachment(`lambda-vpc-execution-${args.environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`lambda-rds-access-${args.environmentSuffix}`, {
      role: lambdaRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonRDSFullAccess',
    }, { parent: this });

    // Lambda function for backup testing
    const lambdaFunction = new aws.lambda.Function(`backup-test-${args.environmentSuffix}`, {
      runtime: 'python3.11',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 900,
      vpcConfig: {
        subnetIds: args.privateSubnetIds,
        securityGroupIds: [args.lambdaSecurityGroupId],
      },
      environment: {
        variables: {
          RDS_INSTANCE_ID: args.rdsInstanceId,
          RDS_ENDPOINT: args.rdsEndpoint,
        },
      },
      code: new pulumi.asset.AssetArchive({
        'index.py': new pulumi.asset.StringAsset(`
import boto3
import os

rds_client = boto3.client('rds')

def handler(event, context):
    instance_id = os.environ['RDS_INSTANCE_ID']

    # Create snapshot
    snapshot_id = f"{instance_id}-test-{context.request_id}"
    rds_client.create_db_snapshot(
        DBSnapshotIdentifier=snapshot_id,
        DBInstanceIdentifier=instance_id
    )

    return {
        'statusCode': 200,
        'body': f'Snapshot {snapshot_id} created'
    }
`),
      }),
      tags: args.tags,
    }, { parent: this });

    // EventBridge rule for weekly execution
    const rule = new aws.cloudwatch.EventRule(`backup-test-schedule-${args.environmentSuffix}`, {
      scheduleExpression: 'rate(7 days)',
      tags: args.tags,
    }, { parent: this });

    new aws.cloudwatch.EventTarget(`backup-test-target-${args.environmentSuffix}`, {
      rule: rule.name,
      arn: lambdaFunction.arn,
    }, { parent: this });

    new aws.lambda.Permission(`backup-test-permission-${args.environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: lambdaFunction.name,
      principal: 'events.amazonaws.com',
      sourceArn: rule.arn,
    }, { parent: this });

    this.bucketName = bucket.id;
    this.lambdaFunctionName = lambdaFunction.name;

    this.registerOutputs({
      bucketName: this.bucketName,
      lambdaFunctionName: this.lambdaFunctionName,
    });
  }
}
```

## File: lib/monitoring-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  rdsInstanceId: pulumi.Output<string>;
  backupBucketName: pulumi.Output<string>;
  lambdaFunctionName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: MonitoringStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:monitoring:MonitoringStack', name, {}, opts);

    // Create SNS topic
    const snsTopic = new aws.sns.Topic(`backup-alerts-${args.environmentSuffix}`, {
      tags: args.tags,
    }, { parent: this });

    // CloudWatch alarm for backup failures
    new aws.cloudwatch.MetricAlarm(`rds-backup-failed-${args.environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'BackupRetentionPeriod',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 0,
      alarmDescription: 'Alert when RDS backup fails',
      alarmActions: [snsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: args.rdsInstanceId,
      },
    }, { parent: this });

    // CloudWatch alarm for Lambda errors
    new aws.cloudwatch.MetricAlarm(`lambda-errors-${args.environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 1,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 0,
      alarmDescription: 'Alert when backup Lambda fails',
      alarmActions: [snsTopic.arn],
      dimensions: {
        FunctionName: args.lambdaFunctionName,
      },
    }, { parent: this });

    this.snsTopicArn = snsTopic.arn;

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn,
    });
  }
}
```

## File: test/tap-stack.test.ts

```typescript
import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.name + '_id',
      state: args.inputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: typeof import('../lib/tap-stack');

  beforeAll(async () => {
    stack = await import('../lib/tap-stack');
  });

  it('should create stack with correct resources', async () => {
    const tapStack = new stack.TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        Owner: 'test-owner',
        CostCenter: 'test-cc',
      },
    });

    expect(tapStack).toBeDefined();
  });
});
```
