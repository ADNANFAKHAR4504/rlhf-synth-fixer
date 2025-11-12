import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';
import { BackupStack } from './backup-stack';
import { FailoverStack } from './failover-stack';
import { Route53Stack } from './route53-stack';
import { ParameterStoreStack } from './parameter-store-stack';
import { EventBridgeStack } from './eventbridge-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, { ...props, crossRegionReferences: true });

    // Get environment suffix
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Define regions
    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-east-2';

    // ===========================
    // PRIMARY REGION (us-east-1)
    // ===========================

    // Network Stack - Primary
    const networkPrimaryStack = new NetworkStack(this, 'NetworkPrimary', {
      environmentSuffix,
      region: primaryRegion,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: primaryRegion,
      },
    });

    // Database Stack - Primary
    const databasePrimaryStack = new DatabaseStack(this, 'DatabasePrimary', {
      environmentSuffix,
      region: primaryRegion,
      vpc: networkPrimaryStack.vpc,
      databaseSecurityGroup: networkPrimaryStack.databaseSecurityGroup,
      isPrimary: true,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: primaryRegion,
      },
    });

    databasePrimaryStack.addDependency(networkPrimaryStack);

    // Compute Stack - Primary
    const computePrimaryStack = new ComputeStack(this, 'ComputePrimary', {
      environmentSuffix,
      region: primaryRegion,
      vpc: networkPrimaryStack.vpc,
      albSecurityGroup: networkPrimaryStack.albSecurityGroup,
      ecsSecurityGroup: networkPrimaryStack.ecsSecurityGroup,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: primaryRegion,
      },
    });

    computePrimaryStack.addDependency(networkPrimaryStack);

    // Backup Stack - Primary
    new BackupStack(this, 'BackupPrimary', {
      environmentSuffix,
      region: primaryRegion,
      isPrimary: true,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: primaryRegion,
      },
    });

    // ===========================
    // SECONDARY REGION (us-east-2)
    // ===========================

    // Network Stack - Secondary
    const networkSecondaryStack = new NetworkStack(this, 'NetworkSecondary', {
      environmentSuffix,
      region: secondaryRegion,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: secondaryRegion,
      },
    });

    // Storage Stack - Secondary (for S3 CRR destination)
    const storageSecondaryStack = new StorageStack(this, 'StorageSecondary', {
      environmentSuffix,
      region: secondaryRegion,
      isPrimary: false,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: secondaryRegion,
      },
    });

    // CRITICAL: Configure S3 CRR after both buckets exist
    // This is done by updating the primary bucket's replication configuration
    // after the secondary bucket is created
    const storagePrimaryStackWithCRR = new StorageStack(
      this,
      'StoragePrimaryWithCRR',
      {
        environmentSuffix,
        region: primaryRegion,
        isPrimary: true,
        destinationBucket: storageSecondaryStack.bucket,
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: primaryRegion,
        },
      }
    );

    storagePrimaryStackWithCRR.addDependency(storageSecondaryStack);

    // Database Stack - Secondary
    const databaseSecondaryStack = new DatabaseStack(
      this,
      'DatabaseSecondary',
      {
        environmentSuffix,
        region: secondaryRegion,
        vpc: networkSecondaryStack.vpc,
        databaseSecurityGroup: networkSecondaryStack.databaseSecurityGroup,
        isPrimary: false,
        globalClusterIdentifier: databasePrimaryStack.globalClusterIdentifier,
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: secondaryRegion,
        },
      }
    );

    databaseSecondaryStack.addDependency(networkSecondaryStack);
    databaseSecondaryStack.addDependency(databasePrimaryStack);

    // Compute Stack - Secondary
    const computeSecondaryStack = new ComputeStack(this, 'ComputeSecondary', {
      environmentSuffix,
      region: secondaryRegion,
      vpc: networkSecondaryStack.vpc,
      albSecurityGroup: networkSecondaryStack.albSecurityGroup,
      ecsSecurityGroup: networkSecondaryStack.ecsSecurityGroup,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: secondaryRegion,
      },
    });

    computeSecondaryStack.addDependency(networkSecondaryStack);

    // Backup Stack - Secondary
    new BackupStack(this, 'BackupSecondary', {
      environmentSuffix,
      region: secondaryRegion,
      isPrimary: false,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: secondaryRegion,
      },
    });

    // ===========================
    // MONITORING (Both Regions)
    // ===========================

    // Monitoring Stack - Primary
    const monitoringPrimaryStack = new MonitoringStack(
      this,
      'MonitoringPrimary',
      {
        environmentSuffix,
        region: primaryRegion,
        endpointUrl: `http://${computePrimaryStack.loadBalancer.loadBalancerDnsName}`,
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: primaryRegion,
        },
      }
    );

    monitoringPrimaryStack.addDependency(computePrimaryStack);

    // Monitoring Stack - Secondary
    const monitoringSecondaryStack = new MonitoringStack(
      this,
      'MonitoringSecondary',
      {
        environmentSuffix,
        region: secondaryRegion,
        endpointUrl: `http://${computeSecondaryStack.loadBalancer.loadBalancerDnsName}`,
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: secondaryRegion,
        },
      }
    );

    monitoringSecondaryStack.addDependency(computeSecondaryStack);

    // ===========================
    // GLOBAL SERVICES
    // ===========================

    // Route 53 Stack (Global)
    const route53Stack = new Route53Stack(this, 'Route53', {
      environmentSuffix,
      primaryLoadBalancer: computePrimaryStack.loadBalancer,
      secondaryLoadBalancer: computeSecondaryStack.loadBalancer,
      primaryRegion,
      secondaryRegion,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: primaryRegion, // Route 53 is global but created in primary region
      },
    });

    route53Stack.addDependency(computePrimaryStack);
    route53Stack.addDependency(computeSecondaryStack);

    // Failover Stack (Primary Region)
    new FailoverStack(this, 'Failover', {
      environmentSuffix,
      region: primaryRegion,
      isPrimary: true,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: primaryRegion,
      },
    });

    // Parameter Store Stack (Both Regions)
    new ParameterStoreStack(this, 'ParameterStorePrimary', {
      environmentSuffix,
      region: primaryRegion,
      isPrimary: true,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: primaryRegion,
      },
    });

    new ParameterStoreStack(this, 'ParameterStoreSecondary', {
      environmentSuffix,
      region: secondaryRegion,
      isPrimary: false,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: secondaryRegion,
      },
    });

    // EventBridge Stack (Both Regions)
    new EventBridgeStack(this, 'EventBridgePrimary', {
      environmentSuffix,
      region: primaryRegion,
      isPrimary: true,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: primaryRegion,
      },
    });

    new EventBridgeStack(this, 'EventBridgeSecondary', {
      environmentSuffix,
      region: secondaryRegion,
      isPrimary: false,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: secondaryRegion,
      },
    });

    // Root stack outputs
    new cdk.CfnOutput(this, 'PrimaryRegion', {
      value: primaryRegion,
      description: 'Primary AWS Region',
    });

    new cdk.CfnOutput(this, 'SecondaryRegion', {
      value: secondaryRegion,
      description: 'Secondary AWS Region',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment Suffix',
    });
  }
}
