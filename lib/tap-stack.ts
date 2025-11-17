import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RegionalStack } from './regional-stack';
import { VpcPeeringStack } from './vpc-peering-stack';
import { RegionalConfig } from './types';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      crossRegionReferences: true,
    });

    const primaryConfig: RegionalConfig = {
      region: 'us-east-1',
      isPrimary: true,
      wafBlockedCountries: ['CN', 'RU', 'KP'],
      cloudWatchLatencyThreshold: 500,
      environmentSuffix: props.environmentSuffix,
    };

    const secondaryConfig: RegionalConfig = {
      region: 'us-east-2',
      isPrimary: false,
      wafBlockedCountries: ['CN', 'RU', 'KP', 'IR'],
      cloudWatchLatencyThreshold: 300,
      environmentSuffix: props.environmentSuffix,
    };

    const commonTags = {
      Environment: 'production',
      CostCenter: 'fintech-ops',
    };

    const primaryStack = new RegionalStack(this, 'PrimaryRegion', {
      config: primaryConfig,
      env: { region: 'us-east-1' },
      tags: {
        ...commonTags,
        Region: 'us-east-1',
      },
      crossRegionReferences: true,
    });

    const secondaryStack = new RegionalStack(this, 'SecondaryRegion', {
      config: secondaryConfig,
      replicaRegion: 'us-east-1',
      env: { region: 'us-east-2' },
      tags: {
        ...commonTags,
        Region: 'us-east-2',
      },
      crossRegionReferences: true,
    });

    primaryStack.addDependency(secondaryStack);

    const vpcPeeringStack = new VpcPeeringStack(this, 'VpcPeering', {
      environmentSuffix: props.environmentSuffix,
      primaryVpcId: primaryStack.networking.vpc.vpcId,
      secondaryVpcId: secondaryStack.networking.vpc.vpcId,
      primaryRegion: 'us-east-1',
      secondaryRegion: 'us-east-2',
      primaryVpcCidr: '10.0.0.0/16',
      secondaryVpcCidr: '10.1.0.0/16',
      env: { region: 'us-east-1' },
      crossRegionReferences: true,
    });

    vpcPeeringStack.addDependency(primaryStack);
    vpcPeeringStack.addDependency(secondaryStack);

    new cdk.CfnOutput(this, 'PrimaryVpcId', {
      value: primaryStack.networking.vpc.vpcId,
      description: 'Primary VPC ID',
    });

    new cdk.CfnOutput(this, 'SecondaryVpcId', {
      value: secondaryStack.networking.vpc.vpcId,
      description: 'Secondary VPC ID',
    });

    new cdk.CfnOutput(this, 'PrimaryDatabaseEndpoint', {
      value: primaryStack.database.database.dbInstanceEndpointAddress,
      description: 'Primary Database Endpoint',
    });

    new cdk.CfnOutput(this, 'SecondaryDatabaseEndpoint', {
      value: secondaryStack.database.database.dbInstanceEndpointAddress,
      description: 'Secondary Database Endpoint',
    });

    new cdk.CfnOutput(this, 'PrimaryBucketName', {
      value: primaryStack.storage.bucket.bucketName,
      description: 'Primary S3 Bucket',
    });

    new cdk.CfnOutput(this, 'SecondaryBucketName', {
      value: secondaryStack.storage.bucket.bucketName,
      description: 'Secondary S3 Bucket',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: primaryStack.dynamodb.table.tableName,
      description: 'DynamoDB Global Table',
    });
  }
}
