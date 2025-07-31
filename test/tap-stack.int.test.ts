import { DescribeSubnetsCommand, DescribeTagsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { App } from 'cdktf';
import { config } from 'dotenv';
import { TapStack } from '../lib/tap-stack';

// Load AWS credentials from .env if needed
config();

const REGION = process.env.AWS_REGION || 'us-east-1';
const client = new EC2Client({ region: REGION });

describe('🧪 Real AWS Integration: TapStack VPC Deployment', () => {

  let vpcId: string | undefined;

  beforeAll(async () => {
    const app = new App();
    new TapStack(app, 'IntegrationTestStack');
    await app.synth(); // optionally synth only, but real test should assume deployed already

    // Fetch all VPCs and find one with the tag Name: TapVpc or similar
    const response = await client.send(new DescribeVpcsCommand({}));

    const matchingVpc = response.Vpcs?.find(vpc =>
      vpc.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('TapVpc'))
    );

    vpcId = matchingVpc?.VpcId;
    expect(vpcId).toBeDefined();
  });

  test('✅ VPC should exist with correct CIDR block', async () => {
    const vpc = await client.send(new DescribeVpcsCommand({ VpcIds: [vpcId!] }));
    expect(vpc.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
  });

  test('✅ Subnets should be created within the VPC', async () => {
    const subnets = await client.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId!] }] }));
    expect(subnets.Subnets?.length).toBeGreaterThan(0);
  });

  test('✅ VPC should have Environment tag set to Production', async () => {
    const tags = (await client.send(new DescribeTagsCommand({
      Filters: [
        { Name: 'resource-id', Values: [vpcId!] },
        { Name: 'key', Values: ['Environment'] }
      ]
    }))).Tags;

    const envTag = tags?.find(tag => tag.Key === 'Environment');
    expect(envTag?.Value).toBe('Production');
  });

});
