import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

import { WebServerStack } from './web-server';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';
    console.log(process.env.CDK_DEFAULT_ACCOUNT)
    new WebServerStack(this, 'WebServerStack', {
      environmentSuffix,
      vpcId: props.vpcId,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1', // process.env.CDK_DEFAULT_REGION,
      },
    });
  }
}
