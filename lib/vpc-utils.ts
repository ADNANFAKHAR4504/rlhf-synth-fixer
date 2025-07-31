// lib/vpc-utils.ts
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

export async function findVpcByCidr(cidr: string): Promise<string | undefined> {
  const client = new EC2Client({ region: 'us-east-1' });
  const result = await client.send(new DescribeVpcsCommand({}));
  return result.Vpcs?.find(v => v.CidrBlock === cidr)?.VpcId;
}
