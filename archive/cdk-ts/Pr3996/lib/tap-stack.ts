import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { DatabaseStack } from './stacks/database-stack';
import { GlobalStack } from './stacks/global-stack';
import { NetworkingStack } from './stacks/networking-stack';
import { RegionalStack } from './stacks/regional-stack';
import { TgwPeeringStack } from './stacks/tgw-peering-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const region = this.region;
    const isMainRegion = region === 'ap-northeast-2';
    const cidr = isMainRegion ? '10.0.0.0/16' : '172.16.0.0/16';
    const remoteCidr = isMainRegion ? '172.16.0.0/16' : '10.0.0.0/16';

    // Create networking stack
    const networkingStack = new NetworkingStack(
      this,
      `NetworkingStack-${environmentSuffix}`,
      {
        cidr: cidr,
        isMainRegion: isMainRegion,
        environmentSuffix: environmentSuffix,
        remoteCidr: remoteCidr,
      }
    );

    // Store Transit Gateway ID in SSM Parameter for cross-region access
    new ssm.StringParameter(this, `TGWIdParameter-${environmentSuffix}`, {
      parameterName: `/trading-platform/tgw-id/${region}${environmentSuffix}`,
      stringValue: networkingStack.transitGateway.ref,
      description: `Transit Gateway ID for ${region}`,
    });

    // Create regional stack with ECS and ALB
    const regionalStack = new RegionalStack(
      this,
      `RegionalStack-${environmentSuffix}`,
      {
        vpc: networkingStack.vpc,
        isMainRegion: isMainRegion,
        environmentSuffix: environmentSuffix,
      }
    );

    // Only create database and global stacks in primary region
    if (isMainRegion) {
      const databaseStack = new DatabaseStack(
        this,
        `DatabaseStack-${environmentSuffix}`,
        {
          primaryVpc: networkingStack.vpc,
          environmentSuffix: environmentSuffix,
        }
      );

      const globalStack = new GlobalStack(
        this,
        `GlobalStack-${environmentSuffix}`,
        {
          primaryAlb: regionalStack.loadBalancer,
          environmentSuffix: environmentSuffix,
        }
      );

      // Create Transit Gateway peering (primary region creates the peering request)
      // Note: Deploy secondary stack first, then primary stack with peering
      // Use context flag to conditionally enable peering after both stacks exist
      const enablePeering =
        this.node.tryGetContext('enableTgwPeering') === 'true';

      if (enablePeering) {
        const primaryTgwId = networkingStack.transitGateway.ref;
        const secondaryTgwId = cdk.Fn.importValue(
          `TransitGatewayId-ap-southeast-2-${environmentSuffix}`
        );

        const tgwPeeringStack = new TgwPeeringStack(
          this,
          `TGWPeeringStack-${environmentSuffix}`,
          {
            primaryTgwId: primaryTgwId,
            primaryRegion: 'ap-northeast-2',
            secondaryTgwId: secondaryTgwId,
            secondaryRegion: 'ap-southeast-2',
            environmentSuffix: environmentSuffix,
          }
        );

        // Add explicit dependencies to ensure TGW peering runs after all other stacks
        tgwPeeringStack.node.addDependency(networkingStack);
        tgwPeeringStack.node.addDependency(regionalStack);
        tgwPeeringStack.node.addDependency(databaseStack);
        tgwPeeringStack.node.addDependency(globalStack);
      }
    }
  }
}
