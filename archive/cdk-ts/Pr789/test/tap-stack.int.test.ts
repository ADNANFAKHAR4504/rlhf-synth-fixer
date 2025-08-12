import * as EC2 from '@aws-sdk/client-ec2';
import * as S3 from '@aws-sdk/client-s3';
import * as KMS from '@aws-sdk/client-kms';
import * as fs from 'fs';
import * as path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthr35';
const region = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';

// Load CloudFormation outputs from the deployment
let flatOutputs: any = {};
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
if (fs.existsSync(outputsPath)) {
  flatOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('Loaded outputs:', flatOutputs);
} else {
  console.warn('No outputs file found at:', outputsPath);
}

describe('TAP Stack Integration Tests', () => {
  let ec2Client: EC2.EC2;
  let s3Client: S3.S3;
  let kmsClient: KMS.KMS;

  beforeAll(() => {
    // Initialize AWS SDK clients
    ec2Client = new EC2.EC2({ region });
    s3Client = new S3.S3({ region });
    kmsClient = new KMS.KMS({ region });
  });

  describe('VPC Integration', () => {
    it('should have created a VPC with correct configuration', async () => {
      const vpcId = flatOutputs.VpcId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.describeVpcs({ VpcIds: [vpcId] });
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    it('should have DNS support and hostnames enabled', async () => {
      const vpcId = flatOutputs.VpcId;
      
      const dnsSupport = await ec2Client.describeVpcAttribute({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport',
      });
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);

      const dnsHostnames = await ec2Client.describeVpcAttribute({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames',
      });
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    });

    it('should have exactly 6 subnets (3 public, 3 private)', async () => {
      const vpcId = flatOutputs.VpcId;
      
      const response = await ec2Client.describeSubnets({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(6);
      
      const publicSubnets = response.Subnets!.filter(subnet => subnet.MapPublicIpOnLaunch);
      const privateSubnets = response.Subnets!.filter(subnet => !subnet.MapPublicIpOnLaunch);
      
      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);
    });

    it('should have subnets in 3 different availability zones', async () => {
      const vpcId = flatOutputs.VpcId;
      
      const response = await ec2Client.describeSubnets({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      
      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBe(3);
      expect(Array.from(azs)).toEqual(
        expect.arrayContaining(['us-east-1a', 'us-east-1b', 'us-east-1c'])
      );
    });

    it('should have an Internet Gateway attached', async () => {
      const vpcId = flatOutputs.VpcId;
      
      const response = await ec2Client.describeInternetGateways({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
      });
      
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThan(0);
      
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments![0].State).toBe('available');
    });

    it('should have exactly 1 NAT Gateway', async () => {
      const vpcId = flatOutputs.VpcId;
      
      const response = await ec2Client.describeNatGateways({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] },
        ],
      });
      
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(1);
      expect(response.NatGateways![0].State).toBe('available');
    });
  });

  describe('Security Groups Integration', () => {
    it('should have created Web Security Group with correct rules', async () => {
      const sgId = flatOutputs.WebSecurityGroupId;
      expect(sgId).toBeDefined();

      const response = await ec2Client.describeSecurityGroups({
        GroupIds: [sgId],
      });
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
      
      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];
      
      // Check for HTTP rule
      const httpRule = ingressRules.find(rule => rule.FromPort === 80 && rule.ToPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule!.IpRanges).toBeDefined();
      expect(httpRule!.IpRanges!.some((range: any) => range.CidrIp === '0.0.0.0/0')).toBe(true);
      
      // Check for HTTPS rule
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443 && rule.ToPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule!.IpRanges).toBeDefined();
      expect(httpsRule!.IpRanges!.some((range: any) => range.CidrIp === '0.0.0.0/0')).toBe(true);
    });

    it('should have created SSH Security Group with correct rules', async () => {
      const sgId = flatOutputs.SshSecurityGroupId;
      expect(sgId).toBeDefined();

      const response = await ec2Client.describeSecurityGroups({
        GroupIds: [sgId],
      });
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
      
      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];
      
      // Check for SSH rule
      const sshRule = ingressRules.find(rule => rule.FromPort === 22 && rule.ToPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges).toBeDefined();
      expect(sshRule!.IpRanges!.some((range: any) => range.CidrIp === '0.0.0.0/0')).toBe(true);
    });
  });

  describe('S3 Bucket Integration', () => {
    it('should have created an S3 bucket with correct configuration', async () => {
      const bucketName = flatOutputs.BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);

      // Verify bucket exists
      const response = await s3Client.headBucket({ Bucket: bucketName });
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have versioning enabled', async () => {
      const bucketName = flatOutputs.BucketName;
      
      const response = await s3Client.getBucketVersioning({ Bucket: bucketName });
      expect(response.Status).toBe('Enabled');
    });

    it('should have encryption enabled', async () => {
      const bucketName = flatOutputs.BucketName;
      
      const response = await s3Client.getBucketEncryption({ Bucket: bucketName });
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
      
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    it('should block all public access', async () => {
      const bucketName = flatOutputs.BucketName;
      
      const response = await s3Client.getPublicAccessBlock({ Bucket: bucketName });
      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    it('should have lifecycle rules configured', async () => {
      const bucketName = flatOutputs.BucketName;
      
      const response = await s3Client.getBucketLifecycleConfiguration({ Bucket: bucketName });
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      
      // Check for any rule with incomplete multipart upload cleanup
      const hasMultipartCleanup = response.Rules!.some(rule => 
        rule.AbortIncompleteMultipartUpload?.DaysAfterInitiation === 7
      );
      expect(hasMultipartCleanup).toBe(true);
      
      // Check for any rule with transitions
      const hasTransitions = response.Rules!.some(rule => 
        rule.Transitions && rule.Transitions.length > 0
      );
      expect(hasTransitions).toBe(true);
      
      // Verify transition to IA and Glacier exists
      const allTransitions = response.Rules!.flatMap(rule => rule.Transitions || []);
      const hasIATransition = allTransitions.some(t => 
        t.StorageClass === 'STANDARD_IA' && t.Days === 30
      );
      const hasGlacierTransition = allTransitions.some(t => 
        t.StorageClass === 'GLACIER' && t.Days === 90
      );
      expect(hasIATransition).toBe(true);
      expect(hasGlacierTransition).toBe(true);
    });
  });

  describe('KMS Key Integration', () => {
    it('should have created a KMS key with rotation enabled', async () => {
      const keyId = flatOutputs.EncryptionKeyId;
      expect(keyId).toBeDefined();

      const response = await kmsClient.describeKey({ KeyId: keyId });
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Description).toContain('S3 bucket encryption');

      // Check key rotation
      const rotationResponse = await kmsClient.getKeyRotationStatus({ KeyId: keyId });
      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe('Network Connectivity', () => {
    it('should have proper routing between public and private subnets', async () => {
      const vpcId = flatOutputs.VpcId;
      
      // Get route tables
      const routeTables = await ec2Client.describeRouteTables({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      
      expect(routeTables.RouteTables).toBeDefined();
      expect(routeTables.RouteTables!.length).toBeGreaterThan(0);
      
      // Find route tables with NAT Gateway routes (private subnets)
      const privateRouteTables = routeTables.RouteTables!.filter(rt =>
        rt.Routes?.some(route => route.NatGatewayId)
      );
      expect(privateRouteTables.length).toBeGreaterThan(0);
      
      // Find route tables with Internet Gateway routes (public subnets)
      const publicRouteTables = routeTables.RouteTables!.filter(rt =>
        rt.Routes?.some(route => route.GatewayId && route.GatewayId.startsWith('igw-'))
      );
      expect(publicRouteTables.length).toBeGreaterThan(0);
    });
  });

  describe('Resource Tagging', () => {
    it('should have proper tags on VPC resources', async () => {
      const vpcId = flatOutputs.VpcId;
      
      const response = await ec2Client.describeVpcs({ VpcIds: [vpcId] });
      const vpc = response.Vpcs![0];
      
      expect(vpc.Tags).toBeDefined();
      const tags = vpc.Tags!;
      
      const projectTag = tags.find(tag => tag.Key === 'Project');
      expect(projectTag?.Value).toBe('SecureVpcInfrastructure');
      
      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('CDK');
    });
  });
});

// Add a simple health check test
describe('Health Check', () => {
  it('should have successfully deployed all resources', () => {
    expect(flatOutputs).toBeDefined();
    expect(Object.keys(flatOutputs).length).toBeGreaterThan(0);
    expect(flatOutputs.VpcId).toBeDefined();
    expect(flatOutputs.WebSecurityGroupId).toBeDefined();
    expect(flatOutputs.SshSecurityGroupId).toBeDefined();
    expect(flatOutputs.BucketName).toBeDefined();
    expect(flatOutputs.BucketArn).toBeDefined();
    expect(flatOutputs.EncryptionKeyId).toBeDefined();
  });
});