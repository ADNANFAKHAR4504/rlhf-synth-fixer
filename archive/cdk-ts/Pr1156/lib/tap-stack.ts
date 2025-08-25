import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KmsConstruct } from './constructs/kms-construct';
import { IamConstruct } from './constructs/iam-construct';
import { NetworkConstruct } from './constructs/network-construct';
import { S3Construct } from './constructs/s3-construct';

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

    // Define common properties for all constructs
    const commonProps = {
      environment: environmentSuffix,
      service: 'tap',
      owner: 'devops-team',
      project: 'test-automation-platform',
    };

    // Create KMS keys first (other constructs depend on them)
    const kmsConstruct = new KmsConstruct(this, 'KmsConstruct', commonProps);

    // Create S3 buckets with encryption
    const s3Construct = new S3Construct(this, 'S3Construct', {
      ...commonProps,
      encryptionKey: kmsConstruct.dataEncryptionKey,
    });

    // Create IAM roles and policies
    const iamConstruct = new IamConstruct(this, 'IamConstruct', {
      ...commonProps,
      kmsKeys: {
        dataKey: kmsConstruct.dataEncryptionKey,
        logKey: kmsConstruct.logEncryptionKey,
        databaseKey: kmsConstruct.databaseEncryptionKey,
      },
    });

    // Create network infrastructure
    const networkConstruct = new NetworkConstruct(this, 'NetworkConstruct', {
      ...commonProps,
      logEncryptionKey: kmsConstruct.logEncryptionKey,
    });

    // Ensure NetworkConstruct waits for KmsConstruct to be fully created
    networkConstruct.node.addDependency(kmsConstruct);

    // Output important resource information
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkConstruct.vpc.vpcId,
      description: 'VPC ID for the secure network',
      exportName: `${id}-VpcId`,
    });

    new cdk.CfnOutput(this, 'DataKeyArn', {
      value: kmsConstruct.dataEncryptionKey.keyArn,
      description: 'ARN of the data encryption KMS key',
      exportName: `${id}-DataKeyArn`,
    });

    new cdk.CfnOutput(this, 'LambdaExecutionRoleArn', {
      value: iamConstruct.lambdaExecutionRole.roleArn,
      description: 'ARN of the Lambda execution role',
      exportName: `${id}-LambdaExecutionRoleArn`,
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: networkConstruct.alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `${id}-AlbDnsName`,
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: networkConstruct.webAcl.attrArn,
      description: 'ARN of the WAF Web ACL',
      exportName: `${id}-WebAclArn`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: s3Construct.dataBucket.bucketName,
      description: 'Name of the secure data S3 bucket',
      exportName: `${id}-DataBucketName`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: s3Construct.logsBucket.bucketName,
      description: 'Name of the logs S3 bucket',
      exportName: `${id}-LogsBucketName`,
    });

    new cdk.CfnOutput(this, 'MfaPolicyArn', {
      value: iamConstruct.mfaEnforcementPolicy.managedPolicyArn,
      description: 'ARN of the MFA enforcement policy',
      exportName: `${id}-MfaPolicyArn`,
    });
  }
}
