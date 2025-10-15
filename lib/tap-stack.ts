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

    // Instantiate the multi-component application stack and keep a reference
    // so we can re-expose important runtime values without using CloudFormation
    // exports/imports (which can cause circular create-time dependency issues).
    const child = new MultiComponentApplicationStack(
      this.node.root as cdk.App,
      'MultiComponentApplication',
      {
        ...props,
        stackName: `prod-multi-component-stack-${environmentSuffix}`,
      }
    );

    // Re-expose key runtime tokens from the child stack as top-level outputs.
    // These are CDK tokens and will resolve at deploy time; they don't rely on
    // CloudFormation exports being present beforehand.
    const forward = {
      VpcId: child.vpcId,
      ApiGatewayUrl: child.apiUrl,
      LambdaFunctionArn: child.lambdaFunctionArn,
      RdsEndpoint: child.rdsEndpoint,
      S3BucketName: child.s3BucketName,
      SqsQueueUrl: child.sqsQueueUrl,
      CloudFrontDomainName: child.cloudFrontDomainName,
      HostedZoneId: child.hostedZoneId,
      DatabaseSecretArn: child.databaseSecretArn,
      LambdaRoleArn: child.lambdaRoleArn,
      DatabaseSecurityGroupId: child.databaseSecurityGroupId,
      LambdaSecurityGroupId: child.lambdaSecurityGroupId,
      LambdaLogGroupName: child.lambdaLogGroupName,
    } as Record<string, string>;

    for (const [key, value] of Object.entries(forward)) {
      new cdk.CfnOutput(this, key, {
        value: value ?? cdk.Aws.NO_VALUE,
      });
    }
  }
}
