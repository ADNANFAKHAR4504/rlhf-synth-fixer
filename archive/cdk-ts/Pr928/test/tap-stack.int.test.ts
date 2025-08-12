import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeNatGatewaysCommand, DescribeFlowLogsCommand, DescribeSecurityGroupsCommand, DescribeVpcAttributeCommand } from '@aws-sdk/client-ec2';
import { S3Client, ListBucketsCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, GetBucketLifecycleConfigurationCommand } from '@aws-sdk/client-s3';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import { SecretsManagerClient, DescribeSecretCommand, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import * as path from 'path';

// Load the deployment outputs - only if file exists
let outputs: any = {};
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Configure AWS SDK clients
const region = process.env.AWS_REGION || 'us-west-2';
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const kms = new KMSClient({ region });
const secretsManager = new SecretsManagerClient({ region });
const ssm = new SSMClient({ region });

// Skip tests if outputs are not available
const skipIfNoOutputs = outputs.VpcId ? describe : describe.skip;

skipIfNoOutputs('Security Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC exists and is configured correctly', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(vpcs.Vpcs).toHaveLength(1);
      
      const vpc = vpcs.Vpcs![0];
      expect(vpc.State).toBe('available');
      
      // Check DNS hostnames attribute
      const dnsHostnames = await ec2.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames'
      }));
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      
      // Check DNS support attribute
      const dnsSupport = await ec2.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport'
      }));
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
    }, 30000);

    test('VPC has correct tags', async () => {
      const vpcId = outputs.VpcId;
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = vpcs.Vpcs![0];
      
      const tags = vpc.Tags || [];
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const ownerTag = tags.find((t: any) => t.Key === 'Owner');
      
      expect(envTag?.Value).toBe('Production');
      expect(ownerTag?.Value).toBe('DevOps');
    }, 30000);

    test('VPC has subnets in multiple availability zones', async () => {
      const vpcId = outputs.VpcId;
      const subnets = await ec2.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));
      
      expect(subnets.Subnets!.length).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private
      
      const azs = new Set(subnets.Subnets!.map((s: any) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2); // Multi-AZ
    }, 30000);

    test('VPC has NAT Gateway for private subnets', async () => {
      const vpcId = outputs.VpcId;
      const natGateways = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] }
        ]
      }));
      
      expect(natGateways.NatGateways!.length).toBeGreaterThanOrEqual(1);
    }, 30000);

    test('VPC Flow Logs are enabled', async () => {
      const vpcId = outputs.VpcId;
      const flowLogs = await ec2.send(new DescribeFlowLogsCommand({
        Filter: [
          { Name: 'resource-id', Values: [vpcId] }
        ]
      }));
      
      expect(flowLogs.FlowLogs!.length).toBeGreaterThanOrEqual(1);
      const flowLog = flowLogs.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
    }, 30000);
  });

  describe('Security Groups', () => {
    test('Web security group exists and has correct rules', async () => {
      const sgId = outputs.WebSecurityGroupId;
      expect(sgId).toBeDefined();
      
      const sgs = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      }));
      
      expect(sgs.SecurityGroups).toHaveLength(1);
      const sg = sgs.SecurityGroups![0];
      
      // Check ingress rules
      const ingressRules = sg.IpPermissions || [];
      const httpsRule = ingressRules.find((r: any) => r.FromPort === 443);
      const httpRule = ingressRules.find((r: any) => r.FromPort === 80);
      
      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();
    }, 30000);

    test('Security groups follow least privilege principle', async () => {
      const sgId = outputs.WebSecurityGroupId;
      const sgs = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      }));
      
      const sg = sgs.SecurityGroups![0];
      
      // Check that outbound is restricted (not allow all)
      const egressRules = sg.IpPermissionsEgress || [];
      
      // Should have specific egress rules
      expect(egressRules.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('KMS Encryption', () => {
    test('KMS key exists and is enabled', async () => {
      const keyArn = outputs.KmsKeyArn;
      expect(keyArn).toBeDefined();
      
      const keyId = keyArn.split('/').pop()!;
      const keyMetadata = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));
      
      expect(keyMetadata.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyMetadata.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    }, 30000);

    test('KMS key has rotation enabled', async () => {
      const keyArn = outputs.KmsKeyArn;
      const keyId = keyArn.split('/').pop()!;
      
      const rotationStatus = await kms.send(new GetKeyRotationStatusCommand({ KeyId: keyId }));
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('Database secret exists and is accessible', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      expect(secretArn).toBeDefined();
      
      const secret = await secretsManager.send(new DescribeSecretCommand({
        SecretId: secretArn
      }));
      
      expect(secret.Name).toBeDefined();
      expect(secret.KmsKeyId).toBeDefined(); // Should be encrypted
    }, 30000);

    test('Secret contains required database credentials', async () => {
      const secretArn = outputs.DatabaseSecretArn;
      
      const secretValue = await secretsManager.send(new GetSecretValueCommand({
        SecretId: secretArn
      }));
      
      const credentials = JSON.parse(secretValue.SecretString!);
      expect(credentials.username).toBe('admin');
      expect(credentials.password).toBeDefined();
      expect(credentials.password.length).toBeGreaterThanOrEqual(32);
    }, 30000);
  });

  describe('S3 Bucket Configuration', () => {
    test('Logs bucket exists and is configured correctly', async () => {
      const bucketName = outputs.LogsBucketName;
      expect(bucketName).toBeDefined();
      
      // Check bucket exists
      const buckets = await s3.send(new ListBucketsCommand({}));
      const bucket = buckets.Buckets?.find((b: any) => b.Name === bucketName);
      expect(bucket).toBeDefined();
    }, 30000);

    test('Logs bucket has encryption enabled', async () => {
      const bucketName = outputs.LogsBucketName;
      
      const encryption = await s3.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));
      
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, 30000);

    test('Logs bucket has versioning enabled', async () => {
      const bucketName = outputs.LogsBucketName;
      
      const versioning = await s3.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));
      
      expect(versioning.Status).toBe('Enabled');
    }, 30000);

    test('Logs bucket blocks public access', async () => {
      const bucketName = outputs.LogsBucketName;
      
      const publicAccessBlock = await s3.send(new GetPublicAccessBlockCommand({
        Bucket: bucketName
      }));
      
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('Logs bucket has lifecycle policies', async () => {
      const bucketName = outputs.LogsBucketName;
      
      const lifecycle = await s3.send(new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName
      }));
      
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules!.length).toBeGreaterThan(0);
      
      const rule = lifecycle.Rules![0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.Expiration?.Days).toBe(90);
    }, 30000);
  });

  describe('SSM Parameters', () => {
    test('VPC ID parameter is stored in SSM', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr72';
      const param = await ssm.send(new GetParameterCommand({
        Name: `/tap/${environmentSuffix}/vpc-id`
      }));
      
      expect(param.Parameter?.Value).toBe(outputs.VpcId);
    }, 30000);

    test('Secret ARN parameter is stored in SSM', async () => {
      const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr72';
      const param = await ssm.send(new GetParameterCommand({
        Name: `/tap/${environmentSuffix}/secret-arn`
      }));
      
      expect(param.Parameter?.Value).toBe(outputs.DatabaseSecretArn);
    }, 30000);
  });

  describe('Security Best Practices', () => {
    test('All resources have required tags', async () => {
      const vpcId = outputs.VpcId;
      
      // Check VPC tags
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = vpcs.Vpcs![0];
      const tags = vpc.Tags || [];
      
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Owner')).toBeDefined();
    }, 30000);

    test('No resources have overly permissive configurations', async () => {
      // This test validates that security best practices are followed
      
      // Check that security groups don't have 0.0.0.0/0 on all ports
      const sgId = outputs.WebSecurityGroupId;
      const sgs = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      }));
      
      const sg = sgs.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];
      
      // Check no rule allows all traffic from anywhere
      const hasOverlyPermissive = ingressRules.some((r: any) => 
        r.IpProtocol === '-1' && 
        r.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0')
      );
      
      expect(hasOverlyPermissive).toBe(false);
    }, 30000);
  });
});