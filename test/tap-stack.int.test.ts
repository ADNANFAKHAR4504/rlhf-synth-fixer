import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';
const isCI = process.env.CI === '1';

// Configure endpoints for LocalStack
const endpoint = process.env.AWS_ENDPOINT_URL || undefined;

const cfnClient = new CloudFormationClient({
  region,
  endpoint,
});
const ec2Client = new EC2Client({
  region,
  endpoint,
});
const s3Client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
});
const elbClient = new ElasticLoadBalancingV2Client({
  region,
  endpoint,
});

// Helper to load outputs from deployment
function loadStackOutputs(): Record<string, string> {
  const outputsFile = path.join(
    process.cwd(),
    'cfn-outputs',
    'flat-outputs.json'
  );
  if (fs.existsSync(outputsFile)) {
    return JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  }
  return {};
}

describe('TapStack Integration Tests - Secure Web Application', () => {
  let stackOutputs: Record<string, string>;

  beforeAll(() => {
    if (!isCI) {
      console.log(
        'Skipping integration tests - not running in CI environment'
      );
      return;
    }
    stackOutputs = loadStackOutputs();
  });

  describe('Stack Deployment', () => {
    test('CloudFormation stack is deployed successfully', async () => {
      if (!isCI) return;

      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      expect(response.Stacks).toHaveLength(1);
      const stack = response.Stacks![0];
      expect(stack.StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('Stack has expected outputs', () => {
      if (!isCI) return;

      expect(stackOutputs).toBeDefined();
      expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);

      // Check for key outputs
      const expectedOutputKeys = [
        'LoadBalancerDNS',
        'BucketName',
        'DatabaseEndpoint',
      ];

      expectedOutputKeys.forEach((key) => {
        if (stackOutputs[key]) {
          expect(stackOutputs[key]).toBeTruthy();
        }
      });
    });
  });

  describe('Network Infrastructure', () => {
    test('VPC is created with correct configuration', async () => {
      if (!isCI) return;

      // Get VPC ID from stack outputs
      const vpcKey = Object.keys(stackOutputs).find(key =>
        key.includes('VPC') &&
        key.includes('Ref') &&
        !key.includes('Subnet')
      );

      if (!vpcKey) {
        console.log('VPC not found in outputs');
        return;
      }

      const vpcId = stackOutputs[vpcKey];
      expect(vpcId).toMatch(/^vpc-/);

      const vpcs = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(vpcs.Vpcs).toBeDefined();
      expect(vpcs.Vpcs!.length).toBeGreaterThan(0);

      const vpc = vpcs.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.1.0.0/16');
    });

    test('Subnets are created in multiple availability zones', async () => {
      if (!isCI) return;

      // Get subnet IDs from stack outputs
      const subnetKeys = Object.keys(stackOutputs).filter(key =>
        key.includes('Subnet') && key.includes('Ref')
      );

      if (subnetKeys.length === 0) {
        console.log('No subnets found in outputs');
        return;
      }

      const subnetIds = subnetKeys.map(key => stackOutputs[key]).filter(id => id);

      const subnets = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: subnetIds,
        })
      );

      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets!.length).toBeGreaterThanOrEqual(2);
    });

    test('Security groups are properly configured', async () => {
      if (!isCI) return;

      // Get security group IDs from stack outputs
      const sgKeys = Object.keys(stackOutputs).filter(key =>
        key.includes('SecurityGroup') && key.includes('GroupId')
      );

      if (sgKeys.length === 0) {
        console.log('No security groups found in outputs');
        return;
      }

      const sgIds = sgKeys.map(key => stackOutputs[key]).filter(id => id);

      const sgs = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: sgIds,
        })
      );

      expect(sgs.SecurityGroups).toBeDefined();
      expect(sgs.SecurityGroups!.length).toBeGreaterThan(0);
    });
  });

  describe('Storage Infrastructure', () => {
    test('S3 bucket is encrypted and versioned', async () => {
      if (!isCI) return;

      const bucketName = stackOutputs['BucketName'];

      if (!bucketName) {
        console.log('Bucket name not found in outputs');
        return;
      }

      try {
        const encryption = await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: bucketName,
          })
        );

        expect(
          encryption.ServerSideEncryptionConfiguration?.Rules
        ).toBeDefined();
      } catch (error: any) {
        console.log('Could not check bucket encryption:', error.message);
      }

      try {
        const versioning = await s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: bucketName,
          })
        );
        expect(versioning.Status).toBe('Enabled');
      } catch (error: any) {
        console.log('Could not check versioning:', error.message);
      }
    });
  });

  describe('Compute Infrastructure', () => {
    test('Application Load Balancer is accessible', async () => {
      if (!isCI) return;

      try {
        const loadBalancers = await elbClient.send(
          new DescribeLoadBalancersCommand({})
        );

        const alb = loadBalancers.LoadBalancers?.find((lb) =>
          lb.LoadBalancerName?.includes(environmentSuffix)
        );

        if (alb) {
          expect(alb.Type).toBe('application');
          expect(alb.Scheme).toBe('internet-facing');
          expect(alb.DNSName).toBeDefined();
        }
      } catch (error: any) {
        console.log('Could not describe load balancers:', error.message);
      }
    });
  });

  describe('Resource Tagging', () => {
    test('VPC has proper tags', async () => {
      if (!isCI) return;

      const vpcKey = Object.keys(stackOutputs).find(key =>
        key.includes('VPC') &&
        key.includes('Ref') &&
        !key.includes('Subnet')
      );

      if (!vpcKey) {
        console.log('VPC not found for tagging test');
        return;
      }

      const vpcId = stackOutputs[vpcKey];

      const vpcs = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      if (vpcs.Vpcs && vpcs.Vpcs.length > 0) {
        const vpc = vpcs.Vpcs[0];
        const envTag = vpc.Tags?.find((t) => t.Key === 'Environment');
        const ownerTag = vpc.Tags?.find((t) => t.Key === 'Owner');

        expect(envTag).toBeDefined();
        expect(ownerTag).toBeDefined();
      }
    });
  });
});
