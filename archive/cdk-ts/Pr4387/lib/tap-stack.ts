import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Infrastructure } from './infrastructure';

// ? Import your stacks here
// import { MyStack } from './my-stack';

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

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Create primary region infrastructure
    new Infrastructure(this, 'PrimaryRegionInfrastructure', {
      environmentSuffix: environmentSuffix,
      region: 'us-west-2',
      secondaryRegion: 'ap-south-1',
      instanceType: 't3.large',
      minCapacity: 1,
      maxCapacity: 10,
      desiredCapacity: 1,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-west-2',
      },
    });

    // Create secondary region infrastructure
    new Infrastructure(this, 'SecondaryRegionInfrastructure', {
      environmentSuffix: environmentSuffix,
      region: 'ap-south-1',
      instanceType: 't3.large',
      minCapacity: 1,
      maxCapacity: 10,
      desiredCapacity: 1,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'ap-south-1',
      },
    });
  }
}
