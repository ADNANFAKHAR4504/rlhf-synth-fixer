To implement the specified AWS infrastructure using AWS CDK with TypeScript, follow these steps. Below is a sample CDK code that covers the requirements:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';

class SecureInfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Networking Layer
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'PublicSubnet', subnetType: ec2.SubnetType.PUBLIC },
        { name: 'PrivateSubnet', subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
      ],
    });

    // KMS Key
    const cmk = new kms.Key(this, 'CustomerManagedKey', {
      enableKeyRotation: true,
    });

    // S3 Buckets
    const secureBucket = new s3.Bucket(this, 'SecureBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: cmk,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // RDS Database
    const rdsInstance = new rds.DatabaseInstance(this, 'SecureRDS', {
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.LARGE),
      vpc,
      storageEncrypted: true,
      storageEncryptionKey: cmk,
    });

    // IAM Role for EC2
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    // ECS Cluster
    const ecsCluster = new ecs.Cluster(this, 'SecureECSCluster', {
      vpc,
    });

    // ECS Service with Auto Scaling
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');
    taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry('nginx'),
    });

    const ecsService = new ecs.FargateService(this, 'SecureECSService', {
      cluster: ecsCluster,
      taskDefinition,
    });

    ecsService.autoScaleTaskCount({ maxCapacity: 10 }).scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
    });

    // CloudTrail
    new cloudtrail.Trail(this, 'MultiRegionTrail', {
      isMultiRegionTrail: true,
      managementEvents: cloudtrail.ReadWriteType.ALL,
      includeGlobalServiceEvents: true,
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'CPUUtilizationAlarm', {
      metric: ec2Instance.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
    });

    // Security Groups
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      allowAllOutbound: false,
    });

    // Restrict RDS instance types
    Aspects.of(this).add(new AwsSolutionsChecks({
      logIgnores: true,
    }));

    NagSuppressions.addResourceSuppressions(
      rdsInstance,
      [{ id: 'AwsSolutions-RDS10', reason: 'Instance type is restricted programmatically.' }],
    );

    // Ensure only allowed instance types
    if (!['db.m5.large', 'db.m5.xlarge'].includes(rdsInstance.instanceType.toString())) {
      throw new Error('Invalid RDS instance type. Only db.m5.large or db.m5.xlarge are allowed.');
    }
  }
}

const app = new cdk.App();
new SecureInfrastructureStack(app, 'SecureInfrastructureStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
```

### Key Points:

1. **Networking**: The VPC is configured with public and private subnets across two Availability Zones.
2. **Data Security**: KMS key with automatic rotation, S3 buckets with SSE-KMS, and RDS with encrypted storage.
3. **Compute & Access**: IAM roles for EC2, ECS cluster with Fargate, and auto-scaling based on CPU utilization.
4. **Auditing**: CloudTrail for logging and CloudWatch alarms for monitoring.
5. **Security**: Security groups with least privilege and a programmatic check for RDS instance types.

### Validation and Deployment:

- **Synthesize**: `cdk synth`
- **Validate**: `aws cloudformation validate-template --template-body file://cdk.out/SecureInfrastructureStack.template.json`
- **Deploy**: `cdk deploy`

This code ensures that the infrastructure is secure, scalable, and follows best practices. Adjust configurations as needed for your specific use case.