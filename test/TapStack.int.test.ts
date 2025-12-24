import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { DescribeTransitGatewaysCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

interface StackOutputs {
  [key: string]: string;
}

// Read region from lib/AWS_REGION file if it exists
function getRegion(): string {
  const regionFilePath = path.join(process.cwd(), 'lib', 'AWS_REGION');
  if (fs.existsSync(regionFilePath)) {
    const regionFromFile = fs.readFileSync(regionFilePath, 'utf-8').trim();
    return process.env.AWS_REGION || regionFromFile || 'us-east-1';
  }
  return process.env.AWS_REGION || 'us-east-1';
}

describe('Hub-and-Spoke CloudFormation Integration Tests', () => {
  let outputs: StackOutputs;
  const region = getRegion();
  const ec2Client = new EC2Client({ region });
  const cfnClient = new CloudFormationClient({ region });
  const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  const candidateStackNames = [`localstack-stack-${envSuffix}`, `TapStack-${envSuffix}`, `TapStack${envSuffix}`];
  let stackName = '';

  beforeAll(async () => {
    console.log(`Looking for stack candidates: ${candidateStackNames.join(', ')} in region: ${region}`);
    console.log(`AWS_REGION env var: ${process.env.AWS_REGION}`);
    console.log(`ENVIRONMENT_SUFFIX env var: ${process.env.ENVIRONMENT_SUFFIX}`);

    // Try each candidate name until we find the deployed stack
    for (const candidate of candidateStackNames) {
      try {
        const command = new DescribeStacksCommand({ StackName: candidate });
        const response = await cfnClient.send(command);
        const stack = response.Stacks?.[0];

        if (stack) {
          stackName = candidate;
          outputs = (stack.Outputs || []).reduce((acc: StackOutputs, output) => {
            if (output.OutputKey && output.OutputValue) {
              acc[output.OutputKey] = output.OutputValue;
            }
            return acc;
          }, {});

          console.log(`Found deployed stack: ${stackName}`);
          break;
        }
      } catch (error: any) {
        // If stack doesn't exist, continue to next candidate. Otherwise rethrow.
        const msg = error?.message || '';
        if (msg.includes('does not exist') || (error?.name === 'ValidationError')) {
          console.log(`Stack ${candidate} not found in region ${region}, trying next candidate`);
          continue;
        }
        console.error(`Error while checking stack ${candidate}:`, msg);
        throw error;
      }
    }

    if (!stackName) {
      throw new Error(`Failed to find deployed stack in region ${region}. Tried: ${candidateStackNames.join(', ')}`);
    }
  });

  describe('VPC Validation', () => {
    test('Hub VPC should exist and be available', async () => {
      const vpcId = outputs.HubVpcId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBeGreaterThan(0);
      expect(response.Vpcs?.[0]?.CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs?.[0]?.State).toBe('available');
    });

    test('Finance VPC should exist with correct CIDR', async () => {
      const vpcId = outputs.FinanceVpcId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs?.[0]?.CidrBlock).toBe('10.1.0.0/16');
      expect(response.Vpcs?.[0]?.State).toBe('available');
    });

    test('Engineering VPC should exist with correct CIDR', async () => {
      const vpcId = outputs.EngineeringVpcId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs?.[0]?.CidrBlock).toBe('10.2.0.0/16');
      expect(response.Vpcs?.[0]?.State).toBe('available');
    });

    test('Marketing VPC should exist with correct CIDR', async () => {
      const vpcId = outputs.MarketingVpcId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs?.[0]?.CidrBlock).toBe('10.3.0.0/16');
      expect(response.Vpcs?.[0]?.State).toBe('available');
    });
  });

  describe('Transit Gateway Validation', () => {
    test('Transit Gateway should exist and be available', async () => {
      const tgwId = outputs.TransitGatewayId;
      expect(tgwId).toBeDefined();

      const command = new DescribeTransitGatewaysCommand({
        TransitGatewayIds: [tgwId]
      });
      const response = await ec2Client.send(command);

      expect(response.TransitGateways).toBeDefined();
      expect(response.TransitGateways?.length).toBeGreaterThan(0);
      expect(response.TransitGateways?.[0]?.State).toBe('available');
    });
  });
});
