import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';

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

    // Create the security stack with all production security requirements
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
    });

    // Tag the main stack
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Project', 'SecureInfrastructure');

    // Export key resource references for use in other stacks
    new cdk.CfnOutput(this, 'SecurityStackKMSKeyArn', {
      description: 'Reference to Security Stack KMS Key',
      value: securityStack.kmsKey.keyArn,
    });

    new cdk.CfnOutput(this, 'SecurityStackS3BucketName', {
      description: 'Reference to Security Stack S3 Bucket',
      value: securityStack.secureS3Bucket.bucketName,
    });
  }
}
