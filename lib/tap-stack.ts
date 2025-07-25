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
    const imageName = process.env.IMAGE_NAME || 'nginx';
    const imageTag = process.env.IMAGE_TAG || '1.25.3';
    const port = Number(process.env.PORT) || 80;
    const hostedZoneName = process.env.HOSTED_ZONE_NAME;
    const domainName = process.env.DOMAIN_NAME || 'api.dev.local';
    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Define configurations for each environment
    const devConfig: EnvironmentConfig = {
      hostedZoneName,
      domainName,
      imageName,
      imageTag,
      port,
      envName: 'dev',
      vpcCidr: '10.0.0.0/16',
      cpu: Number(process.env.CPU_VALUE) || 256,
      memoryLimit: Number(process.env.MEMORY_Limit) || 512,
    };

    const prodConfig: EnvironmentConfig = {
      hostedZoneName,
      domainName,
      imageName,
      imageTag,
      port,
      envName: 'prod',
      vpcCidr: '10.1.0.0/16',
      cpu: Number(process.env.CPU_VALUE) || 512,
      memoryLimit: Number(process.env.MEMORY_Limit) || 1024,
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
