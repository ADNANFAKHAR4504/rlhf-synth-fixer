import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';
import { FailoverStack } from './failover-stack';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  isPrimary: boolean;
  primaryRegion: string;
  drRegion: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix, isPrimary, primaryRegion, drRegion } = props;
    const currentRegion = isPrimary ? primaryRegion : drRegion;

    // Network Stack - VPC, Subnets, NAT Gateways, VPC Peering
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
      isPrimary,
      primaryRegion,
      drRegion,
    });

    // Storage Stack - S3 with cross-region replication, KMS keys
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
      isPrimary,
      primaryRegion,
      drRegion,
    });

    // Database Stack - RDS PostgreSQL with read replicas
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      isPrimary,
      primaryRegion,
      drRegion,
      vpc: networkStack.vpc,
      kmsKey: storageStack.kmsKey,
    });
    databaseStack.addDependency(networkStack);
    databaseStack.addDependency(storageStack);

    // Monitoring Stack - CloudWatch alarms, Lambda for replication lag
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
      isPrimary,
      primaryRegion,
      drRegion,
      vpc: networkStack.vpc,
      database: databaseStack.database,
      readReplica: databaseStack.readReplica,
    });
    monitoringStack.addDependency(databaseStack);

    // Failover Stack - Route53, EventBridge, SNS (only in primary region)
    if (isPrimary) {
      const failoverStack = new FailoverStack(this, 'FailoverStack', {
        environmentSuffix,
        primaryRegion,
        drRegion,
        primaryDatabase: databaseStack.database,
        alarmTopic: monitoringStack.alarmTopic,
      });
      failoverStack.addDependency(monitoringStack);
    }

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkStack.vpc.vpcId,
      description: `VPC ID for ${currentRegion}`,
      exportName: `${environmentSuffix}-vpc-id-${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.dbInstanceEndpointAddress,
      description: `Database endpoint for ${currentRegion}`,
      exportName: `${environmentSuffix}-db-endpoint-${currentRegion}`,
    });

    if (databaseStack.readReplica) {
      new cdk.CfnOutput(this, 'ReadReplicaEndpoint', {
        value: databaseStack.readReplica.dbInstanceEndpointAddress,
        description: `Read replica endpoint for ${currentRegion}`,
        exportName: `${environmentSuffix}-replica-endpoint-${currentRegion}`,
      });
    }

    new cdk.CfnOutput(this, 'BackupBucket', {
      value: storageStack.backupBucket.bucketName,
      description: `S3 backup bucket for ${currentRegion}`,
      exportName: `${environmentSuffix}-backup-bucket-${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: monitoringStack.alarmTopic.topicArn,
      description: `SNS topic ARN for ${currentRegion}`,
      exportName: `${environmentSuffix}-alarm-topic-${currentRegion}`,
    });
  }
}
