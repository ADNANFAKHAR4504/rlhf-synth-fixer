import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

import { WebServerStack } from './secure-web-server';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId: string;
}

export async function findVpcByCidr(cidr: string): Promise<string | undefined> {
  const client = new EC2Client({ region: 'us-east-1' });
  const result = await client.send(new DescribeVpcsCommand({}));

  const vpc = result.Vpcs?.find(v => v.CidrBlock === cidr);
  return vpc?.VpcId;
}

// async function to run before synthesis
async function main() {
  const app = new cdk.App();
  const cidr = '10.0.0.0/16';
  const vpcId = await findVpcByCidr(cidr);
  if (!vpcId) {
    throw new Error('VPC with given CIDR not found');
  }

  const stack = new cdk.Stack(app, 'MyStack');

  new TapStack(stack, 'FindVpcStack', {
    vpcId,
  });
}

main();

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    new WebServerStack(this, 'WebServerStack', {
      environmentSuffix,
      vpcId: props.vpcId,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });
  }
}
