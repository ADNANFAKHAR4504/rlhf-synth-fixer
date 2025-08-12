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

    // Instantiate the secure stack (not relying on outputs directly anymore)
    new SecureWebAppStack(this, 'TfSecureWebAppStack', {
      environment: environmentSuffix,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-west-2',
      },
      description:
        'Secure web application infrastructure with production-ready security configurations',
    });

    // Explicitly import and re-export outputs so they show up in this top-level stack
    this.exportOutput(
      'LoadBalancerDNS',
      `${prefix}-${environmentSuffix}-alb-dns`
    );
    this.exportOutput(
      'S3BucketName',
      `${prefix}-${environmentSuffix}-s3-bucket-name`
    );
    this.exportOutput('VPCId', `${prefix}-${environmentSuffix}-vpc-id`);
    this.exportOutput('KMSKeyId', `${prefix}-${environmentSuffix}-kms-key-id`);
    this.exportOutput(
      'AutoScalingGroupName',
      `${prefix}-${environmentSuffix}-asg-name`
    );
  }

  private exportOutput(key: string, importName: string) {
    new cdk.CfnOutput(this, `Tap${key}`, {
      value: cdk.Fn.importValue(importName),
      description: `Imported and re-exported value for ${key}`,
    });
  }
}
