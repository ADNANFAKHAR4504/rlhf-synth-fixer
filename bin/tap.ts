#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

export async function findVpcByCidr(cidr: string): Promise<string | undefined> {
  const client = new EC2Client({ region: 'us-east-1' });
  const result = await client.send(new DescribeVpcsCommand({}));

  const vpc = result.Vpcs?.find(v => v.CidrBlock === cidr);
  console.log(vpc?.VpcId);
  return vpc?.VpcId;
}

async function main() {
  const app = new cdk.App();
  // Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
  const environmentSuffix =
    app.node.tryGetContext('environmentSuffix') || 'dev';
  const stackName = `TapStack${environmentSuffix}`;

  const repositoryName = process.env.REPOSITORY || 'unknown';
  const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

  // Apply tags to all stacks in this app (optional - you can do this at stack level instead)

  function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  Tags.of(app).add('Environment', capitalize(environmentSuffix));
  Tags.of(app).add('Repository', repositoryName);
  Tags.of(app).add('Author', commitAuthor);

  const cidr = '10.0.0.0/16';
  const vpcId = await findVpcByCidr(cidr); // Resolve Promise here

  const stack = new cdk.Stack(app, 'MyStack');
  if (!vpcId) {
    throw new Error('VPC with given CIDR not found');
  }

  new TapStack(stack, stackName, {
    stackName: stackName, // This ensures CloudFormation stack name includes the suffix
    environmentSuffix: environmentSuffix, // Pass the suffix to the stack
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    vpcId,
  });
}

main();
