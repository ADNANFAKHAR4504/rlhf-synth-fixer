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
    const hostedZoneName = process.env.HOSTED_ZONE_NAME; // you should have this domain in route53
    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Define configurations for each environment
    let config: EnvironmentConfig;
    if (environmentSuffix === 'dev') {
      config = {
        hostedZoneName,
        imageName,
        imageTag,
        port,
        domainName: process.env.DOMAIN_NAME || 'api.dev.local',
        envName: 'dev',
        vpcCidr: '10.0.0.0/16',
        cpu: Number(process.env.CPU_VALUE) || 256,
        memoryLimit: Number(process.env.MEMORY_LIMIT) || 512,
      };
    } else {
      config = {
        hostedZoneName,
        imageName,
        imageTag,
        port,
        domainName: process.env.DOMAIN_NAME || `api.${environmentSuffix}.local`,
        envName: environmentSuffix,
        vpcCidr: '10.1.0.0/16',
        cpu: Number(process.env.CPU_VALUE) || 512,
        memoryLimit: Number(process.env.MEMORY_LIMIT) || 1024,
      };
    }

    // Deploy stacks for each environment
    function capitalize(str: string): string {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    new MultiEnvEcsStack(
      this,
      capitalize(`${environmentSuffix}Stack`),
      config,
      {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: process.env.CDK_DEFAULT_REGION,
        },
      }
    );
  }
}
