import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KmsConstruct } from './constructs/kms-construct';
import { IamConstruct } from './constructs/iam-construct';
import { NetworkConstruct } from './constructs/network-construct';

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
  }
}
