# Single-Region PostgreSQL High-Availability Architecture - MODEL RESPONSE

This document contains the initial code generated for the single-region PostgreSQL high-availability architecture.

## Architecture Overview

The solution deploys a complete high-availability architecture in a single AWS region with the following components:

- **Network Layer**: VPC with private subnets, NAT gateways, and VPC endpoints
- **Database Layer**: RDS PostgreSQL 14 with Multi-AZ for high availability
- **Storage Layer**: S3 bucket with versioning and KMS encryption
- **Monitoring Layer**: CloudWatch alarms and composite alarms for comprehensive monitoring

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

// Single region deployment configuration
const region = process.env.AWS_REGION || 'us-east-1';

// Create stack in single region
new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
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

    // Monitoring Stack - CloudWatch alarms
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
}

export class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const region = cdk.Stack.of(this).region;

    // VPC with private subnets for RDS and Lambda
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: `postgres-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
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
      securityGroupName: `rds-sg-${environmentSuffix}`,
      vpc: this.vpc,
      description: `Security group for PostgreSQL RDS in ${region}`,
      allowAllOutbound: true,
    });

    // Allow PostgreSQL traffic within VPC
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    // Security Group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      securityGroupName: `lambda-sg-${environmentSuffix}`,
      vpc: this.vpc,
      description: `Security group for Lambda functions in ${region}`,
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
    cdk.Tags.of(this.vpc).add('Name', `postgres-vpc-${environmentSuffix}`);
    cdk.Tags.of(this.vpc).add('Region', region);
    cdk.Tags.of(this.vpc).add('Purpose', 'PostgreSQL');

    // Outputs
    new cdk.CfnOutput(this, 'VpcIdOutput', {
      value: this.vpc.vpcId,
      description: `VPC ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'VpcCidrOutput', {
      value: this.vpc.vpcCidrBlock,
      description: `VPC CIDR for ${region}`,
    });

    new cdk.CfnOutput(this, 'DbSecurityGroupId', {
      value: dbSecurityGroup.securityGroupId,
      description: `Database security group ID for ${region}`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: lambdaSecurityGroup.securityGroupId,
      description: `Lambda security group ID for ${region}`,
    });
  }
}
```

## Additional Files

The complete implementation includes the following additional files:

- `lib/database-stack.ts` - RDS PostgreSQL with Multi-AZ for high availability
- `lib/storage-stack.ts` - S3 buckets with KMS encryption and versioning
- `lib/monitoring-stack.ts` - CloudWatch alarms and composite alarms
- `test/tap-stack.test.ts` - Comprehensive unit tests

All files are available in the lib/ directory and follow CDK best practices.
