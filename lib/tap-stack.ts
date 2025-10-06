import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { VpcPeeringStack } from './vpc-peering-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';
import { DnsStack } from './dns-stack';
import { ResilienceStack } from './resilience-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      crossRegionReferences: true,
    });

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Define regions
    const primaryRegion = 'eu-west-2';
    const standbyRegion = 'eu-west-3';
    const domainName = this.node.tryGetContext('domainName');

    // Primary region stacks
    const primaryEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: primaryRegion,
    };

    // Standby region stacks
    const standbyEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: standbyRegion,
    };

    // Create VPC stacks
    const primaryVpcStack = new VpcStack(this, 'VpcStack-Primary', {
      env: primaryEnv,
      cidr: '10.0.0.0/16',
      description: 'VPC in primary region (eu-west-2)',
      stackName: `${this.stackName}-VpcStack-Primary`,
      crossRegionReferences: true,
    });

    const standbyVpcStack = new VpcStack(this, 'VpcStack-Standby', {
      env: standbyEnv,
      cidr: '10.1.0.0/16',
      description: 'VPC in standby region (eu-west-3)',
      stackName: `${this.stackName}-VpcStack-Standby`,
      crossRegionReferences: true,
    });

    // Create security stacks with KMS keys and security groups
    const primarySecurityStack = new SecurityStack(this, 'SecurityPrimary', {
      env: primaryEnv,
      vpc: primaryVpcStack.vpc,
      description: 'Security resources in primary region',
      stackName: `${this.stackName}-SecurityPrimary`,
      crossRegionReferences: true,
    });

    const standbySecurityStack = new SecurityStack(this, 'SecurityStandby', {
      env: standbyEnv,
      vpc: standbyVpcStack.vpc,
      description: 'Security resources in standby region',
      stackName: `${this.stackName}-SecurityStandby`,
      crossRegionReferences: true,
    });

    // Create VPC peering between regions
    const peeringStack = new VpcPeeringStack(this, 'VpcPeering', {
      env: primaryEnv,
      primaryVpc: primaryVpcStack.vpc,
      standbyVpc: standbyVpcStack.vpc,
      primaryRegion: primaryRegion,
      standbyRegion: standbyRegion,
      description: 'VPC Peering between primary and standby regions',
      stackName: `${this.stackName}-VpcPeering`,
      crossRegionReferences: true,
    });
    peeringStack.addDependency(primaryVpcStack);
    peeringStack.addDependency(standbyVpcStack);

    // Create storage stacks (EFS)
    const primaryStorageStack = new StorageStack(this, 'StoragePrimary', {
      env: primaryEnv,
      vpc: primaryVpcStack.vpc,
      kmsKey: primarySecurityStack.kmsKey,
      description: 'Storage resources in primary region',
      stackName: `${this.stackName}-StoragePrimary`,
      crossRegionReferences: true,
    });
    primaryStorageStack.addDependency(primaryVpcStack);
    primaryStorageStack.addDependency(primarySecurityStack);

    const standbyStorageStack = new StorageStack(this, 'StorageStandby', {
      env: standbyEnv,
      vpc: standbyVpcStack.vpc,
      kmsKey: standbySecurityStack.kmsKey,
      description: 'Storage resources in standby region',
      stackName: `${this.stackName}-StorageStandby`,
      crossRegionReferences: true,
    });
    standbyStorageStack.addDependency(standbyVpcStack);
    standbyStorageStack.addDependency(standbySecurityStack);

    // Create database stacks
    const primaryDatabaseStack = new DatabaseStack(this, 'DatabasePrimary', {
      env: primaryEnv,
      vpc: primaryVpcStack.vpc,
      kmsKey: primarySecurityStack.kmsKey,
      isReplica: false,
      description: 'Primary database resources',
      stackName: `${this.stackName}-DatabasePrimary`,
      crossRegionReferences: true,
    });
    primaryDatabaseStack.addDependency(primaryVpcStack);
    primaryDatabaseStack.addDependency(primarySecurityStack);

    const standbyDatabaseStack = new DatabaseStack(this, 'DatabaseStandby', {
      env: standbyEnv,
      vpc: standbyVpcStack.vpc,
      kmsKey: standbySecurityStack.kmsKey,
      isReplica: true,
      replicationSourceIdentifier: `db-primary-${environmentSuffix}`,
      sourceDatabaseInstance: primaryDatabaseStack.dbInstance,
      description: 'Standby database resources (read replica)',
      stackName: `${this.stackName}-DatabaseStandby`,
      crossRegionReferences: true,
    });
    standbyDatabaseStack.addDependency(standbyVpcStack);
    standbyDatabaseStack.addDependency(standbySecurityStack);
    standbyDatabaseStack.addDependency(primaryDatabaseStack);

    // Create compute stacks (ALB + ASG)
    const primaryComputeStack = new ComputeStack(this, 'ComputePrimary', {
      env: primaryEnv,
      vpc: primaryVpcStack.vpc,
      fileSystem: primaryStorageStack.fileSystem,
      dbInstance: primaryDatabaseStack.dbInstance,
      securityGroups: primarySecurityStack.securityGroups,
      description: 'Compute resources in primary region',
      stackName: `${this.stackName}-ComputePrimary`,
      crossRegionReferences: true,
    });
    primaryComputeStack.addDependency(primaryVpcStack);
    primaryComputeStack.addDependency(primaryStorageStack);
    primaryComputeStack.addDependency(primaryDatabaseStack);

    const standbyComputeStack = new ComputeStack(this, 'ComputeStandby', {
      env: standbyEnv,
      vpc: standbyVpcStack.vpc,
      fileSystem: standbyStorageStack.fileSystem,
      dbInstance: standbyDatabaseStack.dbInstance,
      securityGroups: standbySecurityStack.securityGroups,
      description: 'Compute resources in standby region',
      stackName: `${this.stackName}-ComputeStandby`,
      crossRegionReferences: true,
    });
    standbyComputeStack.addDependency(standbyVpcStack);
    standbyComputeStack.addDependency(standbyStorageStack);
    standbyComputeStack.addDependency(standbyDatabaseStack);

    // Create DNS stack with Route 53 failover
    const dnsStack = new DnsStack(this, 'Dns', {
      env: primaryEnv,
      primaryAlb: primaryComputeStack.loadBalancer,
      standbyAlb: standbyComputeStack.loadBalancer,
      domainName: domainName,
      description: 'DNS and failover routing resources',
      stackName: `${this.stackName}-Dns`,
      crossRegionReferences: true,
    });
    dnsStack.addDependency(primaryComputeStack);
    dnsStack.addDependency(standbyComputeStack);

    // Create resilience stack with FIS experiment and Resilience Hub
    const resilienceStack = new ResilienceStack(this, 'Resilience', {
      env: primaryEnv,
      primaryVpc: primaryVpcStack.vpc,
      primaryAlb: primaryComputeStack.loadBalancer,
      primaryAsg: primaryComputeStack.autoScalingGroup,
      primaryDatabase: primaryDatabaseStack.dbInstance,
      standbyVpc: standbyVpcStack.vpc,
      standbyAlb: standbyComputeStack.loadBalancer,
      standbyAsg: standbyComputeStack.autoScalingGroup,
      standbyDatabase: standbyDatabaseStack.dbInstance,
      description: 'Resilience testing and assessment resources',
      stackName: `${this.stackName}-Resilience`,
      crossRegionReferences: true,
    });
    resilienceStack.addDependency(dnsStack);
  }
}
