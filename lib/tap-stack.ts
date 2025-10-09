import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingStack } from './stacks/networking-stack';
import { DatabaseStack } from './stacks/database-stack';
import { RegionalStack } from './stacks/regional-stack';
import { GlobalStack } from './stacks/global-stack';

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
    const isMainRegion = region === 'eu-west-1';
    const cidr = isMainRegion ? '10.0.0.0/16' : '172.16.0.0/16';

    // Create networking stack
    const networkingStack = new NetworkingStack(
      this,
      `NetworkingStack-${environmentSuffix}`,
      {
        cidr: cidr,
        isMainRegion: isMainRegion,
        environmentSuffix: environmentSuffix,
      }
    );

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
      new DatabaseStack(this, `DatabaseStack-${environmentSuffix}`, {
        primaryVpc: networkingStack.vpc,
        environmentSuffix: environmentSuffix,
      });

      new GlobalStack(this, `GlobalStack-${environmentSuffix}`, {
        primaryAlb: regionalStack.loadBalancer,
        environmentSuffix: environmentSuffix,
      });
    }
  }
}
