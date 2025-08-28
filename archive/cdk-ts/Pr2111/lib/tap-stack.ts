import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { S3Stack } from './s3-stack';
import { IAMStack } from './iam-stack';

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

    // Create S3 stack for this region
    const s3Stack = new S3Stack(this, `S3Stack-${region}`, {
      region: region,
      environmentSuffix: environmentSuffix,
      env: { account: this.account, region: region },
      stackName: `trainr302-s3-stack-${region}-${environmentSuffix}`,
    });

    // Create IAM stack for this region
    const iamStack = new IAMStack(this, `IAMStack-${region}`, {
      s3Buckets: [s3Stack.bucket],
      region: region,
      environmentSuffix: environmentSuffix,
      env: { account: this.account, region: region },
      stackName: `trainr302-iam-stack-${region}-${environmentSuffix}`,
    });

    // Ensure IAM stack depends on S3 stack
    iamStack.addDependency(s3Stack);

    // Apply tags at stack level for inheritance
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'trainr302');
    cdk.Tags.of(this).add('Region', region);
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);

    // Export bucket information for cross-stack references
    new cdk.CfnOutput(this, 'BucketInfo', {
      value: JSON.stringify({
        bucketName: s3Stack.bucket.bucketName,
        bucketArn: s3Stack.bucket.bucketArn,
        region: region,
      }),
      description: `S3 bucket information for region ${region}`,
      exportName: `BucketInfo-${region}-${environmentSuffix}`,
    });
  }
}
