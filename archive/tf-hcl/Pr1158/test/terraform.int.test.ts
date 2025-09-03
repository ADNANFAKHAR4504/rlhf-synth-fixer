import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFrontClient,
  GetDistributionCommand,
} from '@aws-sdk/client-cloudfront';

type TfOutputValue<T> = { sensitive: boolean; type: any; value: T };
type StructuredOutputs = {
  vpc_id?: TfOutputValue<string>;
  s3_content_bucket_name?: TfOutputValue<string>;
  cloudfront_distribution_id?: TfOutputValue<string>;
  web_security_group_id?: TfOutputValue<string>;
  ec2_security_group_id?: TfOutputValue<string>;
  ec2_instance_id?: TfOutputValue<string>;
  public_subnet_ids?: TfOutputValue<string[]>;
  private_subnet_ids?: TfOutputValue<string[]>;
};

function readStructuredOutputs(): StructuredOutputs {
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/all-outputs.json');
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Terraform outputs file not found at ${outputsPath}. Ensure infrastructure is deployed via CI/CD workflow.`);
  }
  return JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

async function discoverRegionForVpc(vpcId: string): Promise<string> {
  const envRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const candidates = Array.from(
    new Set([
      envRegion,
      'us-west-2',
      'us-east-1',
      'us-east-2',
      'us-west-1',
    ].filter(Boolean) as string[])
  );

  for (const region of candidates) {
    const ec2 = new EC2Client({ region });
    try {
      const result = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      if ((result.Vpcs || []).length > 0) {
        ec2.destroy();
        return region;
      }
    } catch (e) {
      // Continue to next region
    } finally {
      try { ec2.destroy(); } catch {}
    }
  }
  throw new Error(`Could not locate VPC ${vpcId} in candidate regions: ${candidates.join(', ')}`);
}

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: StructuredOutputs;
  let region: string;
  let ec2Client: EC2Client;
  let s3Client: S3Client;
  let cloudFrontClient: CloudFrontClient;

  beforeAll(async () => {
    console.log('Loading Terraform outputs...');
    outputs = readStructuredOutputs();
    
    if (!outputs.vpc_id?.value) {
      throw new Error('vpc_id not found in outputs. Ensure infrastructure is deployed and outputs are generated.');
    }

    region = await discoverRegionForVpc(outputs.vpc_id.value);
    console.log(`Using region: ${region}`);
    
    ec2Client = new EC2Client({ region });
    s3Client = new S3Client({ region });
    cloudFrontClient = new CloudFrontClient({ region: 'us-east-1' }); // CloudFront is global, uses us-east-1
  }, 60000);

  afterAll(async () => {
    try { 
      ec2Client.destroy();
      s3Client.destroy(); 
      cloudFrontClient.destroy();
    } catch {}
  });

  describe('Infrastructure Validation', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = outputs.vpc_id?.value;
      if (!vpcId) throw new Error('VPC ID not found in outputs');

      const result = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = result.Vpcs?.[0];
      
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      
      console.log('VPC configuration validated');
    }, 60000);

    test('should have subnets in different availability zones', async () => {
      const publicSubnetIds = outputs.public_subnet_ids?.value || [];
      const privateSubnetIds = outputs.private_subnet_ids?.value || [];
      
      if (publicSubnetIds.length === 0 || privateSubnetIds.length === 0) {
        console.log('Skipping subnet test - subnet IDs not found in outputs');
        return;
      }

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const result = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: allSubnetIds }));
      const subnets = result.Subnets || [];
      
      expect(subnets.length).toBeGreaterThan(0);
      
      // Check that subnets are in different AZs
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThan(1);
      
      console.log('Subnet configuration validated');
    }, 60000);
  });

  describe('Security Validation', () => {
    test('should have secure S3 bucket configuration', async () => {
      const bucketName = outputs.s3_content_bucket_name?.value;
      if (!bucketName) {
        console.log('Skipping S3 test - bucket name not found in outputs');
        return;
      }

      try {
        const result = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
        expect(result.ServerSideEncryptionConfiguration).toBeDefined();
        expect(result.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
        console.log('S3 bucket encryption validated');
      } catch (error) {
        console.error('S3 encryption check failed:', error);
        throw error;
      }
    }, 60000);

    test('should have security group with proper restrictions', async () => {
      const webSgId = outputs.web_security_group_id?.value;
      const ec2SgId = outputs.ec2_security_group_id?.value;
      
      if (!webSgId && !ec2SgId) {
        console.log('Skipping security group test - security group IDs not found in outputs');
        return;
      }

      const sgIds = [webSgId, ec2SgId].filter(Boolean) as string[];
      const result = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: sgIds }));
      const securityGroups = result.SecurityGroups || [];
      
      expect(securityGroups.length).toBeGreaterThan(0);
      
      // Validate that HTTP/HTTPS ports are properly configured
      for (const sg of securityGroups) {
        const ingressRules = sg.IpPermissions || [];
        const allowedPorts = ingressRules.map(rule => rule.FromPort).filter(port => port !== undefined);
        
        // Should only allow specific ports (80, 443, or internal communication)
        for (const port of allowedPorts) {
          expect([80, 443].includes(port!) || port === undefined).toBeTruthy();
        }
      }
      
      console.log('Security group rules validated');
    }, 60000);

    test('should have CloudFront distribution with security features', async () => {
      const distributionId = outputs.cloudfront_distribution_id?.value;
      if (!distributionId) {
        console.log('Skipping CloudFront test - distribution ID not found in outputs');
        return;
      }

      try {
        const result = await cloudFrontClient.send(new GetDistributionCommand({ Id: distributionId }));
        const distribution = result.Distribution;
        
        expect(distribution).toBeDefined();
        expect(distribution?.DistributionConfig?.Enabled).toBe(true);
        
        // Check HTTPS redirect
        const defaultCacheBehavior = distribution?.DistributionConfig?.DefaultCacheBehavior;
        expect(defaultCacheBehavior?.ViewerProtocolPolicy).toBe('redirect-to-https');
        
        // Check if WAF is attached
        const webAclId = distribution?.DistributionConfig?.WebACLId;
        expect(webAclId).toBeDefined();
        expect(webAclId).not.toBe('');
        
        console.log('CloudFront security configuration validated');
      } catch (error) {
        console.error('CloudFront validation failed:', error);
        throw error;
      }
    }, 60000);
  });

  describe('Resource State Validation', () => {
    test('should have EC2 instance properly configured', async () => {
      const instanceId = outputs.ec2_instance_id?.value;
      if (!instanceId) {
        console.log('Skipping EC2 test - instance ID not found in outputs');
        return;
      }

      const result = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      const instance = result.Reservations?.[0]?.Instances?.[0];
      
      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toBe('running');
      expect(instance?.InstanceType).toBe('t3.micro');
      
      // Verify it has proper security group
      const securityGroups = instance?.SecurityGroups || [];
      expect(securityGroups.length).toBeGreaterThan(0);
      
      console.log('EC2 instance configuration validated');
    }, 60000);
  });
});
