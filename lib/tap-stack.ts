import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
import { MultiEnvEcsStack, EnvironmentConfig } from './multienv-ecs-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

      // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Define configurations for each environment
    const devConfig: EnvironmentConfig = {
      envName: 'dev',
      vpcCidr: '10.0.0.0/16',
      hostedZoneName: 'dev.local',
      domainName: 'api.dev.local',
    };

    const prodConfig: EnvironmentConfig = {
      envName: 'prod',
      vpcCidr: '10.1.0.0/16',
      hostedZoneName: 'prod.local',
      domainName: 'api.prod.local',
    };

    // Deploy stacks for each environment
    new MultiEnvEcsStack(this, 'DevStack', devConfig, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });
    new MultiEnvEcsStack(this, 'ProdStack', prodConfig, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });
  }
}
