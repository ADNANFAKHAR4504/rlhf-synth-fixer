// Integration tests that validate the deployed infrastructure using AWS SDK
// These tests read outputs from deployment and verify actual AWS resources

import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
  ListAliasesCommand
} from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

type StackOutputs = {
  vpc_id: string;
  private_subnet_id: string;
  ec2_instance_id: string;
  ec2_private_ip: string;
  s3_bucket_name: string;
  s3_bucket_arn: string;
  kms_key_id: string;
  kms_key_arn: string;
};

const region = 'us-east-1';
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const iamClient = new IAMClient({ region });

describe('Secure AWS Infrastructure Integration Tests', () => {
  let outputs: StackOutputs;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      // Try alternative paths
      const altPath = path.resolve(process.cwd(), 'cfn-outputs/outputs.json');
      if (!fs.existsSync(altPath)) {
        throw new Error(
          `Outputs file not found. Ensure infrastructure is deployed and outputs are available at cfn-outputs/flat-outputs.json or cfn-outputs/outputs.json`
        );
      }
      const rawOutputs = JSON.parse(fs.readFileSync(altPath, 'utf8'));
      outputs = normalizeOutputs(rawOutputs);
    } else {
      const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
      outputs = normalizeOutputs(rawOutputs);
    }

    // Validate all required outputs are present
    const requiredOutputs = [
      'vpc_id', 'private_subnet_id', 'ec2_instance_id', 'ec2_private_ip',
      's3_bucket_name', 's3_bucket_arn', 'kms_key_id', 'kms_key_arn'
    ];

    for (const key of requiredOutputs) {
      if (!outputs[key as keyof StackOutputs]) {
        throw new Error(`Missing required output: ${key}`);
      }
    }
  });

  function normalizeOutputs(rawOutputs: any): StackOutputs {
    // Handle Terraform output format where each key might be { value, type, sensitive }
    const normalized: any = {};
    for (const [key, val] of Object.entries(rawOutputs)) {
      if (val && typeof val === 'object' && 'value' in val) {
        normalized[key] = (val as any).value;
      } else {
        normalized[key] = val;
      }
    }
    return normalized as StackOutputs;
  }

  describe('VPC Infrastructure', () => {
    test('VPC exists with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.vpc_id);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');

      // Verify DNS settings
      const dnsHostnamesCmd = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsHostnames'
      });
      const dnsSupportCmd = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsSupport'
      });

      const [dnsHostnames, dnsSupport] = await Promise.all([
        ec2Client.send(dnsHostnamesCmd),
        ec2Client.send(dnsSupportCmd)
      ]);

      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);

      // Check tags
      const tags = vpc.Tags || [];
      expect(tags.find(t => t.Key === 'Environment')?.Value).toBe('production');
      expect(tags.find(t => t.Key === 'Project')?.Value).toBe('secure-tap');
      expect(tags.find(t => t.Key === 'ManagedBy')?.Value).toBe('Terraform');
    });

    test('Private subnet is configured correctly', async () => {
      const command = new DescribeSubnetsCommand({
        SubnetIds: [outputs.private_subnet_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(1);

      const subnet = response.Subnets![0];
      expect(subnet.VpcId).toBe(outputs.vpc_id);
      expect(subnet.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.State).toBe('available');

      // Check tags
      const tags = subnet.Tags || [];
      expect(tags.find(t => t.Key === 'Type')?.Value).toBe('Private');
    });

    test('Internet Gateway exists and is attached', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpc_id);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('NAT Gateway exists in public subnet', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways?.length).toBeGreaterThanOrEqual(1);

      const natGw = response.NatGateways![0];
      expect(natGw.State).toBe('available');
      expect(natGw.VpcId).toBe(outputs.vpc_id);
    });

    test('Route tables are configured correctly', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables?.length).toBeGreaterThanOrEqual(2); // At least public and private

      // Find public route table (has IGW route)
      const publicRT = response.RouteTables?.find(rt =>
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      expect(publicRT).toBeDefined();

      // Find private route table (has NAT Gateway route)
      const privateRT = response.RouteTables?.find(rt =>
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRT).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('EC2 security group has correct configuration', async () => {
      // Find security group attached to our EC2 instance
      const instanceCmd = new DescribeInstancesCommand({
        InstanceIds: [outputs.ec2_instance_id]
      });
      const instanceResponse = await ec2Client.send(instanceCmd);
      const instance = instanceResponse.Reservations![0].Instances![0];
      const sgId = instance.SecurityGroups![0].GroupId!;

      const sgCmd = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      });
      const sgResponse = await ec2Client.send(sgCmd);
      const sg = sgResponse.SecurityGroups![0];

      expect(sg.VpcId).toBe(outputs.vpc_id);
      expect(sg.Description).toContain('least privilege');

      // Check ingress rules
      const sshRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('10.0.0.0/16');

      const httpsRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp'
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.[0]?.CidrIp).toBe('10.0.0.0/16');

      const httpRule = sg.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('10.0.0.0/16');

      // Check egress rules (should allow all outbound)
      const egressRule = sg.IpPermissionsEgress?.find(rule =>
        rule.IpProtocol === '-1'
      );
      expect(egressRule).toBeDefined();
      expect(egressRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('KMS Encryption', () => {
    test('KMS key exists with correct configuration', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kms_key_id
      });

      const response = await kmsClient.send(command);
      const key = response.KeyMetadata!;

      expect(key.KeyId).toBe(outputs.kms_key_id);
      expect(key.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(key.KeyState).toBe('Enabled');
      expect(key.Origin).toBe('AWS_KMS');
      expect(key.Description).toContain('encryption');

      // Check key rotation separately
      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: outputs.kms_key_id
      });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });

    test('KMS alias exists and points to correct key', async () => {
      const command = new ListAliasesCommand({
        KeyId: outputs.kms_key_id
      });

      const response = await kmsClient.send(command);
      expect(response.Aliases?.length).toBeGreaterThanOrEqual(1);

      const alias = response.Aliases!.find(a => a.AliasName?.includes('secure-tap'));
      expect(alias).toBeDefined();
      expect(alias?.TargetKeyId).toBe(outputs.kms_key_id);
    });
  });

  describe('S3 Bucket Security', () => {
    test('S3 bucket exists and is in correct region', async () => {
      const locationCmd = new GetBucketLocationCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(locationCmd);
      // us-east-1 returns null or undefined for LocationConstraint
      expect(response.LocationConstraint == null).toBe(true);

      // Verify bucket exists
      const headCmd = new HeadBucketCommand({
        Bucket: outputs.s3_bucket_name
      });
      await expect(s3Client.send(headCmd)).resolves.not.toThrow();
    });

    test('S3 bucket has versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has KMS encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];

      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(outputs.kms_key_arn);
      expect(rule?.BucketKeyEnabled).toBe(true);
    });

    test('S3 bucket blocks all public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration!;

      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket policy enforces security requirements', async () => {
      const command = new GetBucketPolicyCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      const policy = JSON.parse(response.Policy!);

      // Check for TLS enforcement
      const tlsStatement = policy.Statement.find((stmt: any) =>
        stmt.Sid === 'DenyInsecureConnections' &&
        stmt.Effect === 'Deny' &&
        stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );
      expect(tlsStatement).toBeDefined();

      // Check for encryption enforcement
      const encryptionStatement = policy.Statement.find((stmt: any) =>
        stmt.Sid === 'DenyUnencryptedObjectUploads' &&
        stmt.Effect === 'Deny' &&
        stmt.Action === 's3:PutObject'
      );
      expect(encryptionStatement).toBeDefined();
    });
  });

  describe('EC2 Instance', () => {
    test('EC2 instance is running in private subnet', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.ec2_instance_id]
      });

      const response = await ec2Client.send(command);
      const instance = response.Reservations![0].Instances![0];

      expect(instance.InstanceId).toBe(outputs.ec2_instance_id);
      expect(instance.State?.Name).toBe('running');
      expect(instance.SubnetId).toBe(outputs.private_subnet_id);
      expect(instance.PrivateIpAddress).toBe(outputs.ec2_private_ip);
      expect(instance.PublicIpAddress).toBeUndefined(); // No public IP
      expect(instance.InstanceType).toBe('t3.micro');

      // Check root volume encryption
      const rootDevice = instance.BlockDeviceMappings?.find(bdm =>
        bdm.DeviceName === instance.RootDeviceName
      );
      expect(rootDevice?.Ebs).toBeDefined();
      // Note: Encryption details are checked separately via volume API

      // Check tags
      const tags = instance.Tags || [];
      expect(tags.find(t => t.Key === 'Environment')?.Value).toBe('production');
      expect(tags.find(t => t.Key === 'Project')?.Value).toBe('secure-tap');
    });

    test('EC2 instance has proper IAM role attached', async () => {
      const instanceCmd = new DescribeInstancesCommand({
        InstanceIds: [outputs.ec2_instance_id]
      });

      const instanceResponse = await ec2Client.send(instanceCmd);
      const instance = instanceResponse.Reservations![0].Instances![0];
      const iamProfile = instance.IamInstanceProfile?.Arn;

      expect(iamProfile).toBeDefined();

      // Extract profile name from ARN
      const profileName = iamProfile?.split('/').pop();
      expect(profileName).toContain('ec2-profile');

      // Verify instance profile exists
      const profileCmd = new GetInstanceProfileCommand({
        InstanceProfileName: profileName!
      });

      const profileResponse = await iamClient.send(profileCmd);
      expect(profileResponse.InstanceProfile?.Roles).toHaveLength(1);

      const roleName = profileResponse.InstanceProfile?.Roles?.[0].RoleName;
      expect(roleName).toContain('ec2-role');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 IAM role has least privilege S3 policy', async () => {
      // Get role name from instance profile
      const instanceCmd = new DescribeInstancesCommand({
        InstanceIds: [outputs.ec2_instance_id]
      });

      const instanceResponse = await ec2Client.send(instanceCmd);
      const instance = instanceResponse.Reservations![0].Instances![0];
      const profileArn = instance.IamInstanceProfile?.Arn;
      const profileName = profileArn?.split('/').pop();

      const profileCmd = new GetInstanceProfileCommand({
        InstanceProfileName: profileName!
      });

      const profileResponse = await iamClient.send(profileCmd);
      const roleName = profileResponse.InstanceProfile?.Roles?.[0].RoleName!;

      // Get role
      const roleCmd = new GetRoleCommand({
        RoleName: roleName
      });

      const roleResponse = await iamClient.send(roleCmd);
      const assumeRolePolicy = JSON.parse(decodeURIComponent(roleResponse.Role?.AssumeRolePolicyDocument!));

      // Verify assume role policy
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');

      // Get role policy (inline policy)
      const policyName = `secure-tap-ec2-s3-policy`;
      const policyCmd = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: policyName
      });

      const policyResponse = await iamClient.send(policyCmd);
      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));

      // Verify S3 permissions are restricted to our bucket
      const s3Statement = policy.Statement.find((stmt: any) =>
        stmt.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Resource).toContain(outputs.s3_bucket_arn);

      // Verify KMS permissions
      const kmsStatement = policy.Statement.find((stmt: any) =>
        stmt.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Resource).toBe(outputs.kms_key_arn);
    });
  });

  describe('Resource Naming and Identification', () => {
    test('all outputs are valid AWS resource identifiers', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      expect(outputs.private_subnet_id).toMatch(/^subnet-[a-f0-9]{8,17}$/);
      expect(outputs.ec2_instance_id).toMatch(/^i-[a-f0-9]{8,17}$/);
      expect(outputs.ec2_private_ip).toMatch(/^10\.0\.2\.\d{1,3}$/);
      expect(outputs.s3_bucket_name).toMatch(/^[a-z0-9.-]{3,63}$/);
      expect(outputs.s3_bucket_arn).toMatch(/^arn:aws:s3:::[a-z0-9.-]+$/);
      expect(outputs.kms_key_id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:us-east-1:\d{12}:key\/[a-f0-9-]+$/);
    });

    test('resource names follow consistent naming convention', () => {
      expect(outputs.s3_bucket_name).toContain('secure-tap');
      expect(outputs.s3_bucket_name).toContain('secure-data');
    });
  });
});
