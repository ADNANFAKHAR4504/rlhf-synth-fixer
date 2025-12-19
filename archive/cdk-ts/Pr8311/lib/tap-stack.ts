import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
import { SecureEnvironmentStack } from './secure-environment-stack';

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

    // Create the secure environment stack
    const secureEnvStack = new SecureEnvironmentStack(
      this,
      'SecureEnvironment',
      {
        environmentSuffix: environmentSuffix,
        env: {
          account: cdk.Stack.of(this).account,
          region: cdk.Stack.of(this).region,
        },
      }
    );

    // Export outputs from nested stack to parent stack for CI/CD validation
    new cdk.CfnOutput(this, 'VpcId', {
      value: secureEnvStack.vpc.vpcId,
      description: 'VPC ID for the secure environment',
      exportName: `SecureVpc-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecureBucketName', {
      value: secureEnvStack.securityBucket.bucketName,
      description: 'Name of the secure S3 bucket',
      exportName: `SecureBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: secureEnvStack.logsBucket.bucketName,
      description: 'Name of the logs S3 bucket',
      exportName: `LogsBucket-${environmentSuffix}`,
    });
  }
}
