import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const region = this.region;

    // Network Stack - VPC, Subnets, NAT Gateways
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
    });

    // Storage Stack - S3 with versioning, KMS keys
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
    });

    // Database Stack - RDS PostgreSQL with Multi-AZ
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      kmsKey: storageStack.kmsKey,
    });
    databaseStack.addDependency(networkStack);
    databaseStack.addDependency(storageStack);

    // Monitoring Stack - CloudWatch alarms, Lambda for database monitoring
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      database: databaseStack.database,
    });
    monitoringStack.addDependency(databaseStack);

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkStack.vpc.vpcId,
      description: `VPC ID for ${region}`,
      exportName: `${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.dbInstanceEndpointAddress,
      description: `Database endpoint for ${region}`,
      exportName: `${environmentSuffix}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'BackupBucket', {
      value: storageStack.backupBucket.bucketName,
      description: `S3 backup bucket for ${region}`,
      exportName: `${environmentSuffix}-backup-bucket`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: monitoringStack.alarmTopic.topicArn,
      description: `SNS topic ARN for ${region}`,
      exportName: `${environmentSuffix}-alarm-topic`,
    });

    // Additional Network Stack Outputs
    new cdk.CfnOutput(this, 'VpcCidrOutput', {
      value: networkStack.vpc.vpcCidrBlock,
      description: `VPC CIDR for ${region}`,
    });

    new cdk.CfnOutput(this, 'DbSecurityGroupId', {
      value: networkStack.dbSecurityGroup.securityGroupId,
      description: `Database security group ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: networkStack.lambdaSecurityGroup.securityGroupId,
      description: `Lambda security group ID for ${region}`,
    });

    // Additional Database Stack Outputs
    new cdk.CfnOutput(this, 'DatabasePort', {
      value: databaseStack.database.dbInstanceEndpointPort,
      description: `Database port for ${region}`,
    });

    new cdk.CfnOutput(this, 'DatabaseIdentifier', {
      value: databaseStack.database.instanceIdentifier,
      description: `Database identifier for ${region}`,
    });

    new cdk.CfnOutput(this, 'CredentialsSecretArn', {
      value: databaseStack.credentials.secretArn,
      description: `Database credentials secret ARN for ${region}`,
    });

    // Additional Storage Stack Outputs
    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: storageStack.backupBucket.bucketName,
      description: `Backup bucket name for ${region}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: storageStack.backupBucket.bucketArn,
      description: `Backup bucket ARN for ${region}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: storageStack.kmsKey.keyId,
      description: `KMS key ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: storageStack.kmsKey.keyArn,
      description: `KMS key ARN for ${region}`,
    });

    // Additional Monitoring Stack Outputs
    new cdk.CfnOutput(this, 'CompositeAlarmName', {
      value: monitoringStack.compositeAlarm.alarmName,
      description: `Composite alarm name for ${region}`,
    });
  }
}
