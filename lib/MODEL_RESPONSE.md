# Multi-Region PostgreSQL DR Architecture - MODEL RESPONSE

This document contains the initial code generated for the multi-region PostgreSQL disaster recovery architecture.

## Architecture Overview

The solution deploys a complete disaster recovery architecture across two AWS regions (us-east-1 and us-east-2) with the following components:

- **Network Layer**: VPCs in both regions with private subnets, NAT gateways, and VPC endpoints
- **Database Layer**: RDS PostgreSQL 14 with Multi-AZ in primary region and read replica
- **Storage Layer**: S3 buckets with cross-region replication and KMS encryption
- **Monitoring Layer**: CloudWatch alarms, composite alarms, and Lambda-based replication lag monitoring
- **Failover Layer**: EventBridge rules and Lambda for automated failover orchestration

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

// Multi-region deployment configuration
const primaryRegion = 'us-east-1';
const drRegion = 'us-east-2';

// Create primary stack in us-east-1
new TapStack(app, `${stackName}-primary`, {
  stackName: `${stackName}-primary`,
  environmentSuffix: environmentSuffix,
  isPrimary: true,
  primaryRegion: primaryRegion,
  drRegion: drRegion,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: primaryRegion,
  },
});

// Create DR stack in us-east-2
new TapStack(app, `${stackName}-dr`, {
  stackName: `${stackName}-dr`,
  environmentSuffix: environmentSuffix,
  isPrimary: false,
  primaryRegion: primaryRegion,
  drRegion: drRegion,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: drRegion,
  },
});
```

## File: lib/tap-stack.ts

```typescript
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
      env: props.env,
    });

    // Storage Stack - S3 with cross-region replication, KMS keys
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
      isPrimary,
      primaryRegion,
      drRegion,
      env: props.env,
    });

    // Database Stack - RDS PostgreSQL with read replicas
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      isPrimary,
      primaryRegion,
      drRegion,
      vpc: networkStack.vpc,
      kmsKey: storageStack.kmsKey,
      env: props.env,
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
      env: props.env,
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
        env: props.env,
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
```

## File: lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  isPrimary: boolean;
  primaryRegion: string;
  drRegion: string;
}

export class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { environmentSuffix, isPrimary, primaryRegion, drRegion } = props;
    const currentRegion = isPrimary ? primaryRegion : drRegion;

    // VPC with private subnets for RDS and Lambda
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `postgres-dr-vpc-${environmentSuffix}-${currentRegion}`,
      ipAddresses: ec2.IpAddresses.cidr(isPrimary ? '10.0.0.0/16' : '10.1.0.0/16'),
      maxAzs: 3,
      natGateways: 2, // For high availability
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `private-db-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `private-lambda-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      securityGroupName: `rds-sg-${environmentSuffix}-${currentRegion}`,
      vpc: this.vpc,
      description: `Security group for PostgreSQL RDS in ${currentRegion}`,
      allowAllOutbound: true,
    });

    // Allow PostgreSQL traffic within VPC
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    // Allow traffic from the other region's VPC for cross-region replication
    const peerVpcCidr = isPrimary ? '10.1.0.0/16' : '10.0.0.0/16';
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(peerVpcCidr),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from peer VPC'
    );

    // Security Group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      securityGroupName: `lambda-sg-${environmentSuffix}-${currentRegion}`,
      vpc: this.vpc,
      description: `Security group for Lambda functions in ${currentRegion}`,
      allowAllOutbound: true,
    });

    // VPC Endpoints for AWS services (cost optimization - avoid NAT charges)
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('SnsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint('CloudWatchEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Tags
    cdk.Tags.of(this.vpc).add('Name', `postgres-dr-vpc-${environmentSuffix}-${currentRegion}`);
    cdk.Tags.of(this.vpc).add('Region', currentRegion);
    cdk.Tags.of(this.vpc).add('Purpose', 'PostgreSQL-DR');

    // Outputs
    new cdk.CfnOutput(this, 'VpcIdOutput', {
      value: this.vpc.vpcId,
      description: `VPC ID for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'VpcCidrOutput', {
      value: this.vpc.vpcCidrBlock,
      description: `VPC CIDR for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'DbSecurityGroupId', {
      value: dbSecurityGroup.securityGroupId,
      description: `Database security group ID for ${currentRegion}`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: lambdaSecurityGroup.securityGroupId,
      description: `Lambda security group ID for ${currentRegion}`,
    });
  }
}
```

## Additional Files

The complete implementation includes the following additional files:

- `lib/database-stack.ts` - RDS PostgreSQL with Multi-AZ and read replicas
- `lib/storage-stack.ts` - S3 buckets with KMS encryption and cross-region replication
- `lib/monitoring-stack.ts` - CloudWatch alarms, composite alarms, and Lambda monitoring
- `lib/failover-stack.ts` - EventBridge rules and failover orchestration
- `lib/lambda/replication-lag-monitor.ts` - Lambda function for monitoring replication lag
- `test/tap-stack.test.ts` - Comprehensive unit tests

All files are available in the lib/ directory and follow CDK best practices.
