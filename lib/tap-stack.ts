import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiComponentApplicationStack } from './multi-component-stack';

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

    // Instantiate the multi-component application stack
    new MultiComponentApplicationStack(
      this.node.root as cdk.App,
      'MultiComponentApplication',
      {
        ...props,
        stackName: `prod-multi-component-stack-${environmentSuffix}`,
      }
    );

    // Import and re-expose key outputs from the MultiComponentApplication stack
    const childStackName = `prod-multi-component-stack-${environmentSuffix}`;

    const keysToForward = [
      'VpcId',
      'ApiGatewayUrl',
      'LambdaFunctionArn',
      'RdsEndpoint',
      'S3BucketName',
      'SqsQueueUrl',
      'CloudFrontDomainName',
      'HostedZoneId',
      'DatabaseSecretArn',
      'LambdaRoleArn',
      'DatabaseSecurityGroupId',
      'LambdaSecurityGroupId',
      'LambdaLogGroupName',
    ];

    for (const key of keysToForward) {
      // import the exported value from the child stack (if present) and
      // create a top-level output so scripts that read TapStack outputs can
      // find them easily.
      const importName = `${childStackName}-${key}`;
      try {
        const value = cdk.Fn.importValue(importName);
        new cdk.CfnOutput(this, key, {
          value: value,
          exportName: `${this.stackName}-${key}`,
        });
      } catch (e) {
        // If importValue fails during synth (e.g., stack not yet deployed),
        // fall back to NO_VALUE so synth still succeeds and the output is
        // omitted at deploy-time.
        new cdk.CfnOutput(this, `${key}Missing`, {
          value: cdk.Aws.NO_VALUE,
        });
      }
    }
  }
}
