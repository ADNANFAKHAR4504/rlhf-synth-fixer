import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureWebAppStack } from './secure-web-app-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-west-2',
      },
    });

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const prefix = 'tf';

    // Instantiate the child stack
    new SecureWebAppStack(this, 'TfSecureWebAppStack', {
      environment: environmentSuffix,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-west-2',
      },
      description:
        'Secure web application infrastructure with production-ready security configurations',
    });

    // Export outputs under exact names used in integration tests
    this.exportOutput(
      'LoadBalancerDNS',
      `${prefix}-${environmentSuffix}-alb-dns`,
      'LoadBalancerDNS'
    );
    this.exportOutput(
      'S3BucketName',
      `${prefix}-${environmentSuffix}-s3-bucket-name`,
      'S3BucketName'
    );
    this.exportOutput(
      'VPCId',
      `${prefix}-${environmentSuffix}-vpc-id`,
      'VPCId'
    );
    this.exportOutput(
      'KMSKeyId',
      `${prefix}-${environmentSuffix}-kms-key-id`,
      'KMSKeyId'
    );
    this.exportOutput(
      'AutoScalingGroupName',
      `${prefix}-${environmentSuffix}-asg-name`,
      'AutoScalingGroupName'
    );
  }

  private exportOutput(
    logicalId: string,
    importName: string,
    outputKey: string
  ) {
    new cdk.CfnOutput(this, outputKey, {
      value: cdk.Fn.importValue(importName),
      description: `Imported and re-exported value for ${outputKey}`,
    });
  }
}
