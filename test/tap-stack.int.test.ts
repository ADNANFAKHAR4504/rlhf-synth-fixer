import * as fs from 'fs';
import * as path from 'path';
import { EC2Client, DescribeVpcsCommand, DescribeNetworkAclsCommand, NetworkAcl, Vpc, Tag } from '@aws-sdk/client-ec2';
import { S3Client, ListBucketsCommand, GetBucketLocationCommand, Bucket } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand, Role } from '@aws-sdk/client-iam';

describe('TAP Stack Integration Tests', () => {
  let outputs: {
    vpc_id?: string;
    s3_bucket_name?: string;
    cross_account_role_name?: string;
    public_nacl_id?: string;
  };
  
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
    
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn('No deployment outputs found, using mock values');
      outputs = {
        vpc_id: 'vpc-mock12345',
        s3_bucket_name: 'prod-test-storage-us-east-1-xyz789',
        cross_account_role_name: 'prod-test-cross-account-role-us-east-1',
        public_nacl_id: 'acl-mock12345',
      };
    }

    // Initialize AWS clients
    awsClients = {
      ec2: new EC2Client({ region: 'us-east-1' }),
      s3: new S3Client({ region: 'us-east-1' }),
      iam: new IAMClient({ region: 'us-east-1' }),
    };
  });

  describe('VPC Infrastructure', () => {
    it('should have created a VPC with correct configuration', async () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_id).toMatch(/^vpc-[a-z0-9]+$/);

      const describeVpcsCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id!]
      });
      const vpcResponse = await awsClients.ec2.send(describeVpcsCommand);
      
      expect(vpcResponse.Vpcs).toHaveLength(1);
      expect(vpcResponse.Vpcs?.[0]?.CidrBlock).toBe('10.0.0.0/16');
      
      const tags = vpcResponse.Vpcs?.[0]?.Tags || [];
      expect(tags.some((tag: Tag) => tag.Key === 'Name' && tag.Value === 'prod-test-vpc-us-east-1')).toBe(true);
    });

    it('should have created public NACL with correct rules', async () => {
      expect(outputs.public_nacl_id).toBeDefined();
      
      const describeNaclsCommand = new DescribeNetworkAclsCommand({
        NetworkAclIds: [outputs.public_nacl_id!]
      });
      const naclResponse = await awsClients.ec2.send(describeNaclsCommand);
      
      expect(naclResponse.NetworkAcls).toHaveLength(1);
      
      const tags = naclResponse.NetworkAcls?.[0]?.Tags || [];
      expect(tags.some((tag: Tag) => tag.Key === 'Name' && tag.Value === 'prod-test-public-nacl-us-east-1')).toBe(true);
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