import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MultiComponentApplicationStack } from './multi-component-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  secondaryRegion?: string;
  baseEnvironmentSuffix?: string;
  isPrimary?: boolean;
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
      this,
      'MultiComponentApplication',
      {
        ...props,
        // forward secondaryRegion through props so nested stack can optionally
        // configure cross-region replication when requested by context.
        secondaryRegion: (props as any)?.secondaryRegion,
        // forward isPrimary so nested stacks can decide whether to create
        // global resources like HostedZone and Route53 failover records.
        isPrimary: (props as any)?.isPrimary,
      } as any
    );

    // Re-expose selected runtime tokens from the nested child as top-level outputs.
    // Because the child is a NestedStack, these outputs are resolved within the
    // same CloudFormation stack (no account-level exports/imports are created),
    // avoiding the cross-stack export/import blocking issue.
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
    } as Record<string, string | undefined>;

    for (const [key, value] of Object.entries(forward)) {
      new cdk.CfnOutput(this, key, {
        value: value ?? cdk.Aws.NO_VALUE,
      });
    }

    // IMPORTANT: Do NOT create CloudFormation-level outputs that reference
    // child stack tokens here. Referencing child stack tokens from this stack
    // causes CDK to generate CloudFormation exports/imports which create a
    // hard dependency: the child stack cannot change or remove those exports
    // while this stack imports them. That leads to deployment failures like
    // "Cannot update export ... as it is in use by TapStack..." when the
    // child stack is updated. If you need these runtime values at test/runtime
    // use the `cfn-outputs/flat-outputs.json` produced by the deployment or
    // publish shared values to SSM/SecretsManager instead.

    // Intentionally do not re-expose child runtime tokens here to avoid
    // cross-stack CloudFormation exports/imports.
  }
}
