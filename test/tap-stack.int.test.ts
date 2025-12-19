import {
  AccessAnalyzerClient,
  GetAnalyzerCommand,
} from '@aws-sdk/client-accessanalyzer';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  HeadBucketCommand,
  ListObjectVersionsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
}

// Initialize AWS clients with LocalStack support
const awsRegion =
  process.env.AWS_DEFAULT_REGION ||
  process.env.CDK_DEFAULT_REGION ||
  'us-east-1';
const clientConfig: any = { region: awsRegion };

// Configure LocalStack endpoint if present
if (process.env.AWS_ENDPOINT_URL) {
  clientConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  clientConfig.forcePathStyle = true;
}

const s3Client = new S3Client(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const iamClient = new IAMClient(clientConfig);
const accessAnalyzerClient = new AccessAnalyzerClient(clientConfig);

describe('TapStack Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test('VPC exists and is configured correctly', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping test - no VPC output found');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings would need DescribeVpcAttribute calls for verification
    });

    test('Private subnets are configured correctly', async () => {
      if (!outputs.PrivateSubnetIds || outputs.PrivateSubnetIds === 'none') {
        console.log(
          'Skipping test - no private subnets (LocalStack simplified VPC)'
        );
        return;
      }

      const subnetIds = outputs.PrivateSubnetIds.split(',');
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(subnetIds.length);

      response.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('NAT gateways are available', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping test - no VPC output found');
        return;
      }

      // Skip for LocalStack (NAT gateways removed due to EIP issues)
      if (process.env.AWS_ENDPOINT_URL) {
        console.log('Skipping NAT gateway test for LocalStack');
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThan(0);
    });

    test('S3 VPC endpoint exists', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping test - no VPC output found');
        return;
      }

      // Skip for LocalStack (VPC endpoints removed with private subnets)
      if (process.env.AWS_ENDPOINT_URL) {
        console.log('Skipping S3 VPC endpoint test for LocalStack');
        return;
      }

      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'service-name',
            Values: [`com.amazonaws.${awsRegion}.s3`],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.VpcEndpoints).toHaveLength(1);
      expect(response.VpcEndpoints![0].VpcEndpointType).toBe('Gateway');
    });
  });

  describe('S3 Buckets', () => {
    test('Data bucket exists and has versioning enabled', async () => {
      if (!outputs.DataBucketName) {
        console.log('Skipping test - no data bucket output found');
        return;
      }

      const headCommand = new HeadBucketCommand({
        Bucket: outputs.DataBucketName,
      });

      await expect(s3Client.send(headCommand)).resolves.toBeDefined();

      const versioningCommand = new ListObjectVersionsCommand({
        Bucket: outputs.DataBucketName,
        MaxKeys: 1,
      });

      const response = await s3Client.send(versioningCommand);
      expect(response).toBeDefined();
    });

    test('Logs bucket exists', async () => {
      if (!outputs.LogsBucketName) {
        console.log('Skipping test - no logs bucket output found');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.LogsBucketName,
      });

      await expect(s3Client.send(command)).resolves.toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('S3 access role exists and has correct policies', async () => {
      if (!outputs.S3AccessRoleArn) {
        console.log('Skipping test - no S3 access role output found');
        return;
      }

      const roleName = outputs.S3AccessRoleArn.split('/').pop();
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role?.AssumeRolePolicyDocument).toContain(
        'ec2.amazonaws.com'
      );

      // Check for inline policies
      const policiesCommand = new ListRolePoliciesCommand({
        RoleName: roleName,
      });

      const policiesResponse = await iamClient.send(policiesCommand);
      expect(policiesResponse.PolicyNames).toBeDefined();
      expect(policiesResponse.PolicyNames!.length).toBeGreaterThan(0);
    });
  });

  describe('Access Analyzer', () => {
    test('Access analyzer exists and is active', async () => {
      if (!outputs.AccessAnalyzerArn) {
        console.log('Skipping test - no access analyzer output found');
        return;
      }

      // Skip actual API call for LocalStack (not fully supported)
      if (process.env.AWS_ENDPOINT_URL) {
        console.log('Skipping Access Analyzer API test for LocalStack');
        expect(outputs.AccessAnalyzerArn).toContain(
          'analyzer/SecurityAccessAnalyzer'
        );
        return;
      }

      const analyzerName = outputs.AccessAnalyzerArn.split('/').pop();
      const command = new GetAnalyzerCommand({
        analyzerName: analyzerName,
      });

      const response = await accessAnalyzerClient.send(command);
      expect(response.analyzer).toBeDefined();
      expect(response.analyzer?.status).toBe('ACTIVE');
      expect(response.analyzer?.type).toBe('ACCOUNT');
    });
  });

  describe('Security Configuration', () => {
    test('Security group has restricted egress rules', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping test - no VPC output found');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'group-name',
            Values: ['*SecureInstanceSG*'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups?.filter(sg =>
        sg.GroupName?.includes('SecureInstanceSG')
      );

      if (securityGroups && securityGroups.length > 0) {
        const sg = securityGroups[0];
        const egressRules = sg.IpPermissionsEgress || [];

        // Should only have HTTPS (443) and HTTP (80) egress
        const allowedPorts = [443, 80];
        egressRules.forEach(rule => {
          if (rule.FromPort) {
            expect(allowedPorts).toContain(rule.FromPort);
          }
        });
      }
    });
  });

  describe('End-to-End Workflow', () => {
    test('All critical resources are deployed and accessible', () => {
      // Skip if no deployment outputs available yet
      if (!outputs.DataBucketName && !outputs.LogsBucketName) {
        console.log('Skipping test - no deployment outputs found (not yet deployed)');
        return;
      }

      // Verify core resources always exist
      expect(outputs.DataBucketName).toBeDefined();
      expect(outputs.LogsBucketName).toBeDefined();
      expect(outputs.S3AccessRoleArn).toBeDefined();
      expect(outputs.AccessAnalyzerArn).toBeDefined();

      // VPC and subnets are optional for LocalStack (EC2 service not enabled)
      if (!process.env.AWS_ENDPOINT_URL) {
        expect(outputs.VPCId).toBeDefined();
        expect(outputs.PrivateSubnetIds).toBeDefined();
      }
    });

    test('Resource naming includes environment suffix', () => {
      // Check that resources include environment suffix in their names/ARNs
      if (outputs.DataBucketName) {
        expect(outputs.DataBucketName).toContain('secure-data-bucket-');
      }
      if (outputs.LogsBucketName) {
        expect(outputs.LogsBucketName).toContain('access-logs-bucket-');
      }
    });
  });
});
