import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureNetworking } from './constructs/secure-networking';
import { SecureStorage } from './constructs/secure-storage';
import { WebServer } from './constructs/web-server';

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

    // Create secure networking infrastructure
    const networking = new SecureNetworking(this, 'SecureNetworking', {
      maxAzs: 2,
    });

    // Create secure storage
    const storage = new SecureStorage(this, 'SecureStorage', {
      bucketName: `production-logs-${environmentSuffix}-${this.account}`,
      enableVersioning: true,
    });

    // Create web server
    new WebServer(this, 'WebServer', {
      vpc: networking.vpc,
      securityGroup: networking.webServerSecurityGroup,
      logBucket: storage.logBucket,
    });

    // Apply stack-level tags
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SecureWebInfrastructure');

    // Output important information
    new cdk.CfnOutput(this, 'VPCId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'LogBucketName', {
      value: storage.logBucket.bucketName,
      description: 'S3 Log Bucket Name',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: storage.encryptionKey.keyId,
      description: 'KMS Key ID for S3 encryption',
    });
  }
}
