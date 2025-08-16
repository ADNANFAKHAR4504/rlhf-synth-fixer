import * as fs from 'fs';
import * as path from 'path';
import { EC2Client, DescribeVpcsCommand, DescribeNetworkAclsCommand, NetworkAcl, Vpc, Tag } from '@aws-sdk/client-ec2';
import { S3Client, ListBucketsCommand, GetBucketLocationCommand, Bucket } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand, Role } from '@aws-sdk/client-iam';

describe('TAP Stack Integration Tests', () => {
  let outputs: Record<string, string> = {};
  let awsClients: {
    ec2: EC2Client;
    s3: S3Client;
    iam: IAMClient;
  };

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    
    console.log(`Looking for outputs file at: ${outputsPath}`);
    
    if (fs.existsSync(outputsPath)) {
      console.log('Found outputs file, loading...');
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
      console.log('Loaded outputs:', JSON.stringify(outputs, null, 2));
    } else {
      console.warn('No deployment outputs found at path:', outputsPath);
      outputs = {
        vpc_id: process.env.VPC_ID || 'vpc-mock12345',
        s3_bucket_name: process.env.S3_BUCKET_NAME || 'prod-test-storage-us-east-1-xyz789',
        cross_account_role_name: process.env.CROSS_ACCOUNT_ROLE_NAME || 'prod-test-cross-account-role-us-east-1',
        public_nacl_id: process.env.PUBLIC_NACL_ID || 'acl-mock12345',
      };
    }

    // Initialize AWS clients
    awsClients = {
      ec2: new EC2Client({ region: 'us-east-1' }),
      s3: new S3Client({ region: 'us-east-1' }),
      iam: new IAMClient({ region: 'us-east-1' }),
    };
  });

  describe('Initial Setup', () => {
    it('should have loaded outputs or fallback values', () => {
      console.log('Current outputs:', outputs);
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('VPC Infrastructure', () => {
    it('should have VPC ID available', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_id).toMatch(/^vpc-[a-z0-9]+$/);
    });

    it('should have created a VPC with correct configuration', async () => {
      const describeVpcsCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id!]
      });
      const vpcResponse = await awsClients.ec2.send(describeVpcsCommand);
      
      expect(vpcResponse.Vpcs).toHaveLength(1);
      expect(vpcResponse.Vpcs?.[0]?.CidrBlock).toBe('10.0.0.0/16');
      
      const tags = vpcResponse.Vpcs?.[0]?.Tags || [];
      expect(tags.some((tag: Tag) => tag.Key === 'Name' && tag.Value === 'prod-test-vpc-us-east-1')).toBe(true);
    });
  });

  describe('Storage Infrastructure', () => {
    it('should have created an S3 bucket with correct configuration', async () => {
      expect(outputs.s3_bucket_name).toBeDefined();
      expect(outputs.s3_bucket_name).toContain('prod-test-storage-us-east-1');

      const listBucketsCommand = new ListBucketsCommand({});
      const bucketsResponse = await awsClients.s3.send(listBucketsCommand);
      
      expect(bucketsResponse.Buckets?.some((b: Bucket) => b.Name === outputs.s3_bucket_name)).toBe(true);

      const locationCommand = new GetBucketLocationCommand({
        Bucket: outputs.s3_bucket_name!
      });
      const locationResponse = await awsClients.s3.send(locationCommand);
      expect(locationResponse.LocationConstraint).toBe('us-east-1');
    });
  });

  describe('IAM Configuration', () => {
    it('should have created cross-account IAM role', async () => {
      expect(outputs.cross_account_role_name).toBeDefined();
      
      const getRoleCommand = new GetRoleCommand({
        RoleName: outputs.cross_account_role_name!
      });
      const roleResponse = await awsClients.iam.send(getRoleCommand);
      
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.RoleName).toBe(outputs.cross_account_role_name);
      
      const trustPolicy = JSON.parse(roleResponse.Role?.AssumeRolePolicyDocument || '{}');
      expect(trustPolicy.Statement[0].Principal.AWS).toContain('123456789012');
    });
  });

  describe('Resource Tagging', () => {
    it('should have consistent tagging across all resources', async () => {
      const describeVpcsCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id!]
      });
      const vpcResponse = await awsClients.ec2.send(describeVpcsCommand);
      const vpcTags = vpcResponse.Vpcs?.[0]?.Tags || [];
      
      expect(vpcTags.some((tag: Tag) => tag.Key === 'Environment' && tag.Value === 'prod-test')).toBe(true);
    });
  });

  describe('Region Configuration', () => {
    it('should have resources deployed in the correct region', async () => {
      const describeVpcsCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id!]
      });
      const vpcResponse = await awsClients.ec2.send(describeVpcsCommand);
      expect(vpcResponse.Vpcs).toHaveLength(1);

      const locationCommand = new GetBucketLocationCommand({
        Bucket: outputs.s3_bucket_name!
      });
      const locationResponse = await awsClients.s3.send(locationCommand);
      expect(locationResponse.LocationConstraint).toBe('us-east-1');
    });
  });
});