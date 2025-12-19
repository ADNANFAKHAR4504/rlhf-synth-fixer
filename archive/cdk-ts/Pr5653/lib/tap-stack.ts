import { Construct } from 'constructs';
import { AuroraGlobalStack } from './stacks/aurora-global-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
// import { FailoverStack } from './stacks/failover-stack';

interface TapStackProps {
  environmentSuffix?: string;
}

export class TapStack extends Construct {
  public readonly primaryStack: AuroraGlobalStack;
  public readonly secondaryStack: AuroraGlobalStack;
  public readonly monitoringStack: MonitoringStack;
  // public readonly failoverStack: FailoverStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Environment configurations
    const primaryEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    };
    const secondaryEnv = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-west-2',
    };

    // Default tags for all resources
    const defaultTags = {
      CostCenter: 'Platform',
      Environment: 'Production',
      'DR-Role': 'Active',
    };

    // Deploy primary stack in us-east-1
    this.primaryStack = new AuroraGlobalStack(
      scope,
      `TapStack${environmentSuffix}-Aurora-DR-Primary`,
      {
        env: primaryEnv,
        isPrimary: true,
        environmentSuffix,
        tags: defaultTags,
        crossRegionReferences: true,
      }
    );

    // Deploy secondary stack in us-west-2
    this.secondaryStack = new AuroraGlobalStack(
      scope,
      `TapStack${environmentSuffix}-Aurora-DR-Secondary`,
      {
        env: secondaryEnv,
        isPrimary: false,
        environmentSuffix,
        globalClusterIdentifier: this.primaryStack.globalClusterIdentifier,
        tags: { ...defaultTags, 'DR-Role': 'Standby' },
        crossRegionReferences: true,
      }
    );

    // Deploy monitoring stack
    this.monitoringStack = new MonitoringStack(
      scope,
      `TapStack${environmentSuffix}-Aurora-DR-Monitoring`,
      {
        env: {
          region: primaryEnv.region,
          account: process.env.CDK_DEFAULT_ACCOUNT,
        },
        environmentSuffix,
        primaryCluster: this.primaryStack.cluster,
        secondaryCluster: this.secondaryStack.cluster,
        crossRegionReferences: true,
      }
    );

    // Failover automation stack (commented out due to complex dependencies)
    // this.failoverStack = new FailoverStack(
    //   scope,
    //   `TapStack${environmentSuffix}-Aurora-DR-Failover`,
    //   {
    //     env: {
    //       region: primaryEnv.region,
    //       account: process.env.CDK_DEFAULT_ACCOUNT,
    //     },
    //     environmentSuffix,
    //     primaryStack: this.primaryStack,
    //     secondaryStack: this.secondaryStack,
    //     crossRegionReferences: true,
    //   },
    // );
  }
}
