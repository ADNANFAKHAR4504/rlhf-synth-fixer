#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RegionalStack } from '../lib/regional-stack';
import { VpcPeeringStack } from '../lib/vpc-peering-stack';
import { RegionalConfig } from '../lib/types';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const primaryConfig: RegionalConfig = {
  region: 'us-east-1',
  isPrimary: true,
  wafBlockedCountries: ['CN', 'RU', 'KP'],
  cloudWatchLatencyThreshold: 500,
  environmentSuffix,
};

const secondaryConfig: RegionalConfig = {
  region: 'us-east-2',
  isPrimary: false,
  wafBlockedCountries: ['CN', 'RU', 'KP', 'IR'],
  cloudWatchLatencyThreshold: 300,
  environmentSuffix,
};

const commonTags = {
  Environment: 'production',
  CostCenter: 'fintech-ops',
};

const primaryStack = new RegionalStack(
  app,
  `PrimaryRegion-${environmentSuffix}`,
  {
    config: primaryConfig,
    env: { region: 'us-east-1' },
    tags: {
      ...commonTags,
      Region: 'us-east-1',
    },
    crossRegionReferences: true,
    description: 'Primary region infrastructure for fintech application',
  }
);

const secondaryStack = new RegionalStack(
  app,
  `SecondaryRegion-${environmentSuffix}`,
  {
    config: secondaryConfig,
    replicaRegion: 'us-east-1',
    env: { region: 'us-east-2' },
    tags: {
      ...commonTags,
      Region: 'us-east-2',
    },
    crossRegionReferences: true,
    description: 'Secondary region infrastructure for fintech application',
  }
);

primaryStack.addDependency(secondaryStack);

const vpcPeeringStack = new VpcPeeringStack(
  app,
  `VpcPeering-${environmentSuffix}`,
  {
    environmentSuffix,
    primaryVpcId: primaryStack.networking.vpc.vpcId,
    secondaryVpcId: secondaryStack.networking.vpc.vpcId,
    primaryRegion: 'us-east-1',
    secondaryRegion: 'us-east-2',
    primaryVpcCidr: '10.0.0.0/16',
    secondaryVpcCidr: '10.1.0.0/16',
    env: { region: 'us-east-1' },
    crossRegionReferences: true,
    description: 'VPC Peering connection between regions',
  }
);

vpcPeeringStack.addDependency(primaryStack);
vpcPeeringStack.addDependency(secondaryStack);

new cdk.CfnOutput(primaryStack, 'PrimaryVpcId', {
  value: primaryStack.networking.vpc.vpcId,
  description: 'Primary VPC ID',
  exportName: `primary-vpc-id-${environmentSuffix}`,
});

new cdk.CfnOutput(secondaryStack, 'SecondaryVpcId', {
  value: secondaryStack.networking.vpc.vpcId,
  description: 'Secondary VPC ID',
  exportName: `secondary-vpc-id-${environmentSuffix}`,
});

new cdk.CfnOutput(primaryStack, 'PrimaryDatabaseEndpoint', {
  value: primaryStack.database.database.dbInstanceEndpointAddress,
  description: 'Primary Database Endpoint',
  exportName: `primary-db-endpoint-${environmentSuffix}`,
});

new cdk.CfnOutput(secondaryStack, 'SecondaryDatabaseEndpoint', {
  value: secondaryStack.database.database.dbInstanceEndpointAddress,
  description: 'Secondary Database Endpoint',
  exportName: `secondary-db-endpoint-${environmentSuffix}`,
});

new cdk.CfnOutput(primaryStack, 'PrimaryBucketName', {
  value: primaryStack.storage.bucket.bucketName,
  description: 'Primary S3 Bucket',
  exportName: `primary-bucket-${environmentSuffix}`,
});

new cdk.CfnOutput(secondaryStack, 'SecondaryBucketName', {
  value: secondaryStack.storage.bucket.bucketName,
  description: 'Secondary S3 Bucket',
  exportName: `secondary-bucket-${environmentSuffix}`,
});

new cdk.CfnOutput(primaryStack, 'DynamoDBTableName', {
  value: primaryStack.dynamodb.table.tableName,
  description: 'DynamoDB Global Table',
  exportName: `dynamodb-table-${environmentSuffix}`,
});

new cdk.CfnOutput(primaryStack, 'PrimaryALBDnsName', {
  value: primaryStack.loadBalancer.alb.loadBalancerDnsName,
  description: 'Primary ALB DNS Name',
  exportName: `primary-alb-dns-${environmentSuffix}`,
});

new cdk.CfnOutput(secondaryStack, 'SecondaryALBDnsName', {
  value: secondaryStack.loadBalancer.alb.loadBalancerDnsName,
  description: 'Secondary ALB DNS Name',
  exportName: `secondary-alb-dns-${environmentSuffix}`,
});

app.synth();
