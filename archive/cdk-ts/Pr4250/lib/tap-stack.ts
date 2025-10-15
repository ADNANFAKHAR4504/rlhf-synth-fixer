import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';
import { CacheStack } from './cache-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Note: For multi-region deployment, create separate stacks per region
    // This stack deploys only to the primary region (ap-southeast-1)

    // Primary Region Infrastructure
    const primaryNetwork = new NetworkStack(this, 'PrimaryNetwork', {
      environmentSuffix,
      regionName: 'primary',
    });

    const primarySecurity = new SecurityStack(this, 'PrimarySecurity', {
      environmentSuffix,
      regionName: 'primary',
    });

    const primaryDatabase = new DatabaseStack(this, 'PrimaryDatabase', {
      environmentSuffix,
      regionName: 'primary',
      vpc: primaryNetwork.vpc,
      kmsKey: primarySecurity.kmsKey,
      databaseSecret: primarySecurity.databaseSecret,
    });

    // Cache is created but not passed to compute stack
    // The cache endpoints are available within the CacheStack outputs
    new CacheStack(this, 'PrimaryCache', {
      environmentSuffix,
      regionName: 'primary',
      vpc: primaryNetwork.vpc,
    });

    // Compute stack now includes storage to avoid circular dependency
    const primaryCompute = new ComputeStack(this, 'PrimaryCompute', {
      environmentSuffix,
      regionName: 'primary',
      vpc: primaryNetwork.vpc,
      databaseSecret: primarySecurity.databaseSecret,
      kmsKey: primarySecurity.kmsKey,
    });

    // Output important endpoints
    new cdk.CfnOutput(this, 'PrimaryALBEndpoint', {
      value: primaryCompute.loadBalancer.loadBalancerDnsName,
      description: 'Primary region ALB endpoint',
      exportName: `${environmentSuffix}-primary-alb-endpoint`,
    });

    new cdk.CfnOutput(this, 'PrimaryDatabaseEndpoint', {
      value: primaryDatabase.cluster.clusterEndpoint.hostname,
      description: 'Primary database endpoint',
      exportName: `${environmentSuffix}-primary-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'PrimaryVPCId', {
      value: primaryNetwork.vpc.vpcId,
      description: 'Primary VPC ID',
      exportName: `${environmentSuffix}-primary-vpc-id`,
    });

    new cdk.CfnOutput(this, 'PrimaryEFSId', {
      value: primaryCompute.fileSystem.fileSystemId,
      description: 'Primary EFS ID',
      exportName: `${environmentSuffix}-primary-efs-id`,
    });
  }
}
