import { readFileSync } from 'fs';
import { join } from 'path';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeRouteTablesCommand } from '@aws-sdk/client-ec2';
import { S3Client, GetBucketVersioningCommand, GetPublicAccessBlockCommand, GetBucketEncryptionCommand, GetBucketPolicyCommand, GetBucketReplicationCommand } from '@aws-sdk/client-s3';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand, ListRolePoliciesCommand } from '@aws-sdk/client-iam';

interface StackOutputs {
  [key: string]: string;
}

// ----------------------
// --- Setup and Mocks ---
// ----------------------
const allOutputsPath = join(process.cwd(), 'cfn-outputs/all-outputs.json');
const allOutputs: StackOutputs = JSON.parse(readFileSync(allOutputsPath, 'utf8'));

const cloudformationClient = new CloudFormationClient({});
const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const iamClient = new IAMClient({});

describe('TapStack CloudFormation Integration Tests', () => {
  // Use a map to simplify output access
  const outputs = new Map(Object.entries(allOutputs));
  const stackName = 'TapStack';

  // -------------------------
  // --- Core Stack Checks ---
  // -------------------------
  describe('CloudFormation Stack Outputs', () => {
    test('outputs should exist and not be empty', () => {
      expect(outputs.size).toBeGreaterThan(0);
      for (const [key, value] of outputs.entries()) {
        expect(value).toBeDefined();
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('stack should be in a successful state', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cloudformationClient.send(command);
      const stack = response.Stacks?.[0];
      expect(stack).toBeDefined();
      expect(stack?.StackStatus).toBe('CREATE_COMPLETE'); // or 'UPDATE_COMPLETE'
    });
  });

  // ----------------------
  // --- VPC Validations ---
  // ----------------------
  describe('VPC and Networking Validations', () => {
    // Positive Test: Verify VPCs exist and have correct CIDR blocks and tags
    test('VPCs for each environment should exist and have correct properties', async () => {
      const envs = ['Dev', 'Staging', 'Prod'];
      for (const env of envs) {
        const vpcId = outputs.get(`${env}VPCId`);
        expect(vpcId).toBeDefined();

        const command = new DescribeVpcsCommand({ VpcIds: [vpcId!] });
        const response = await ec2Client.send(command);
        const vpc = response.Vpcs?.[0];
        expect(vpc).toBeDefined();

        const expectedCidr = { 'Dev': '10.0.0.0/16', 'Staging': '10.1.0.0/16', 'Prod': '10.2.0.0/16' };
        expect(vpc?.CidrBlock).toBe(expectedCidr[env as 'Dev' | 'Staging' | 'Prod']);
        expect(vpc?.IsDefault).toBe(false);
        expect(vpc?.Tags).toContainEqual({ Key: 'Name', Value: `TapStack-${env}-VPC` });
      }
    });

    // Positive Test: Verify subnets are created and associated with the correct VPCs
    test('public and private subnets should be created for each VPC', async () => {
      const envs = ['Dev', 'Staging', 'Prod'];
      for (const env of envs) {
        const vpcId = outputs.get(`${env}VPCId`);
        const subnets = outputs.get(`${env}PrivateSubnets`)?.split(',');
        expect(subnets).toBeDefined();
        expect(subnets!.length).toBe(2);

        const command = new DescribeSubnetsCommand({ SubnetIds: subnets });
        const response = await ec2Client.send(command);
        const fetchedSubnets = response.Subnets;
        expect(fetchedSubnets).toBeDefined();
        expect(fetchedSubnets!.length).toBe(2);
        for (const subnet of fetchedSubnets!) {
          expect(subnet.VpcId).toBe(vpcId);
        }
      }
    });

    // Positive Test: Verify route tables and their associations are correct
    test('private subnets should route traffic through a NAT Gateway', async () => {
      const envs = ['Dev', 'Staging', 'Prod'];
      for (const env of envs) {
        const privateSubnetId = outputs.get(`${env}PrivateSubnets`)?.split(',')[0];
        expect(privateSubnetId).toBeDefined();

        const command = new DescribeRouteTablesCommand({
          Filters: [{ Name: 'association.subnet-id', Values: [privateSubnetId!] }],
        });
        const response = await ec2Client.send(command);
        const routeTable = response.RouteTables?.[0];
        expect(routeTable).toBeDefined();

        const natRoute = routeTable?.Routes?.find(
          (route) => route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId
        );
        expect(natRoute).toBeDefined();
      }
    });
  });

  // ---------------------
  // --- S3 Validations ---
  // ---------------------
  describe('S3 Bucket Validations', () => {
    // Positive Test: Verify buckets exist with correct names and public access blocked
    test('S3 buckets should be created with correct names and public access blocked', async () => {
      const envs = ['Dev', 'Staging', 'Prod'];
      for (const env of envs) {
        const bucketName = outputs.get(`${env}DataBucketName`);
        expect(bucketName).toBeDefined();

        const publicAccessCommand = new GetPublicAccessBlockCommand({ Bucket: bucketName! });
        const publicAccessResponse = await s3Client.send(publicAccessCommand);
        expect(publicAccessResponse.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      }
    });

    // Positive Test: Verify bucket policies enforce HTTPS
    test('S3 bucket policies should enforce secure transport (HTTPS)', async () => {
      const envs = ['Dev', 'Staging', 'Prod'];
      for (const env of envs) {
        const bucketName = outputs.get(`${env}DataBucketName`);
        expect(bucketName).toBeDefined();

        const command = new GetBucketPolicyCommand({ Bucket: bucketName! });
        const response = await s3Client.send(command);
        const policy = JSON.parse(response.Policy!);
        const statement = policy.Statement.find((s: any) => s.Effect === 'Deny' && s.Condition && s.Condition.Bool && s.Condition.Bool['aws:SecureTransport']);

        expect(statement).toBeDefined();
        expect(statement.Effect).toBe('Deny');
        expect(statement.Action).toBe('s3:*');
        expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
      }
    });

    // Positive Test: Verify versioning and encryption are enabled for all buckets
    test('S3 buckets should have versioning and encryption enabled', async () => {
      const envs = ['Dev', 'Staging', 'Prod'];
      for (const env of envs) {
        const bucketName = outputs.get(`${env}DataBucketName`);
        expect(bucketName).toBeDefined();

        const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName! });
        const versioningResponse = await s3Client.send(versioningCommand);
        expect(versioningResponse.Status).toBe('Enabled');

        const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName! });
        const encryptionResponse = await s3Client.send(encryptionCommand);
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
      }
    });

    // Positive Test: Verify replication configuration is set up correctly
    test('Dev and Staging buckets should have replication enabled', async () => {
      const devBucketName = outputs.get('DevDataBucketName');
      const stagingBucketName = outputs.get('StagingDataBucketName');

      const devReplicationCommand = new GetBucketReplicationCommand({ Bucket: devBucketName! });
      const devReplicationResponse = await s3Client.send(devReplicationCommand);
      expect(devReplicationResponse.ReplicationConfiguration?.Rules?.[0].Status).toBe('Enabled');
      expect(devReplicationResponse.ReplicationConfiguration?.Rules?.[0].Destination?.Bucket).toContain(stagingBucketName);
      
      const stagingReplicationCommand = new GetBucketReplicationCommand({ Bucket: stagingBucketName! });
      const stagingReplicationResponse = await s3Client.send(stagingReplicationCommand);
      expect(stagingReplicationResponse.ReplicationConfiguration?.Rules?.[0].Status).toBe('Enabled');
      expect(stagingReplicationResponse.ReplicationConfiguration?.Rules?.[0].Destination?.Bucket).toContain(outputs.get('ProdDataBucketName'));
    });
  });
  
  // --------------------
  // --- IAM Validations ---
  // --------------------
  describe('IAM Role Validations', () => {
    // Positive Test: Verify environment roles exist and have correct trust policies
    test('environment roles should exist and have a trust policy allowing the owner to assume them', async () => {
      const envs = ['Dev', 'Staging', 'Prod'];
      for (const env of envs) {
        const roleName = `TapStack-${env}-Role`;
        const command = new GetRoleCommand({ RoleName: roleName });
        const response = await iamClient.send(command);
        const role = response.Role;
        expect(role).toBeDefined();
        
        const assumeRolePolicy = JSON.parse(decodeURIComponent(role!.AssumeRolePolicyDocument!));
        const statement = assumeRolePolicy.Statement?.[0];
        expect(statement).toBeDefined();
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toBe('sts:AssumeRole');
        
        // This validates the !If condition
        const expectedPrincipal = allOutputs['TeamPrincipalARN'] ? allOutputs['TeamPrincipalARN'] : `arn:aws:iam::${allOutputs['AWSAccountId']}:root`;
        expect(statement.Principal.AWS).toBe(expectedPrincipal);
      }
    });

    // Positive Test: Verify roles have correct inline policies
    test('environment roles should have correct inline policies', async () => {
      const envs = ['Dev', 'Staging', 'Prod'];
      for (const env of envs) {
        const roleName = `TapStack-${env}-Role`;
        const listPoliciesCommand = new ListRolePoliciesCommand({ RoleName: roleName });
        const listPoliciesResponse = await iamClient.send(listPoliciesCommand);
        expect(listPoliciesResponse.PolicyNames).toContain('S3Access');
        expect(listPoliciesResponse.PolicyNames).toContain('EC2ReadOnly');
        
        const getS3PolicyCommand = new GetRolePolicyCommand({ RoleName: roleName, PolicyName: 'S3Access' });
        const s3PolicyResponse = await iamClient.send(getS3PolicyCommand);
        const s3Policy = JSON.parse(decodeURIComponent(s3PolicyResponse.PolicyDocument!));
        expect(s3Policy.Statement[0].Action).toContain('s3:GetObject');
      }
    });

    // Edge Case: Test with an empty TeamPrincipalARN (default behavior)
    test('should assume role from root when TeamPrincipalARN is empty', async () => {
      const roleName = `TapStack-Dev-Role`;
      const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
      const getRoleResponse = await iamClient.send(getRoleCommand);
      const assumeRolePolicy = JSON.parse(decodeURIComponent(getRoleResponse.Role!.AssumeRolePolicyDocument!));
      const statement = assumeRolePolicy.Statement[0];
      const accountId = allOutputs.AWSAccountId;
      expect(statement.Principal.AWS).toBe(`arn:aws:iam::${accountId}:root`);
    });
  });
});