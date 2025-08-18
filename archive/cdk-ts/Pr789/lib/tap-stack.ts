import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { SecurityGroupStack } from './security-group-stack';
import { S3Stack } from './s3-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC construct
    const vpcConstruct = new VpcStack(
      this,
      `VpcConstruct-${environmentSuffix}`,
      {
        environmentSuffix,
      }
    );

    // Create Security Group construct
    const securityGroupConstruct = new SecurityGroupStack(
      this,
      `SecurityGroupConstruct-${environmentSuffix}`,
      {
        vpc: vpcConstruct.vpc,
        environmentSuffix,
      }
    );

    // Create S3 construct
    const s3Construct = new S3Stack(this, `S3Construct-${environmentSuffix}`, {
      environmentSuffix,
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'SecureVpcInfrastructure');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Create outputs at the main stack level
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${environmentSuffix}-VpcId`,
    });

    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: securityGroupConstruct.webSecurityGroup.securityGroupId,
      description: 'Web Security Group ID',
      exportName: `${environmentSuffix}-WebSecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'SshSecurityGroupId', {
      value: securityGroupConstruct.sshSecurityGroup.securityGroupId,
      description: 'SSH Security Group ID',
      exportName: `${environmentSuffix}-SshSecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: s3Construct.bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${environmentSuffix}-BucketName`,
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: s3Construct.bucket.bucketArn,
      description: 'S3 Bucket ARN',
      exportName: `${environmentSuffix}-BucketArn`,
    });

    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: s3Construct.s3Key.keyId,
      description: 'KMS Key ID used for S3 encryption',
      exportName: `${environmentSuffix}-EncryptionKeyId`,
    });
  }
}
