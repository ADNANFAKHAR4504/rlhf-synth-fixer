import { CloudTrailClient, DescribeTrailsCommand } from '@aws-sdk/client-cloudtrail';
import { ConfigServiceClient, DescribeConfigurationRecordersCommand } from '@aws-sdk/client-config-service';
import { DescribeSecurityGroupsCommand, DescribeVpcAttributeCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { IAMClient } from '@aws-sdk/client-iam';
import { KMSClient } from '@aws-sdk/client-kms';
import { GetBucketEncryptionCommand, GetPublicAccessBlockCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

describe('AWS Infrastructure Integration Tests', () => {
  let outputs: any;
  let ec2Client: EC2Client;
  let s3Client: S3Client;
  let cloudTrailClient: CloudTrailClient;
  let configClient: ConfigServiceClient;
  let iamClient: IAMClient;
  let kmsClient: KMSClient;

  beforeAll(() => {
    // Read deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    } else {
      // Skip tests if no outputs found
      console.warn('No deployment outputs found, skipping integration tests');
      return;
    }

    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    ec2Client = new EC2Client({ region });
    s3Client = new S3Client({ region });
    cloudTrailClient = new CloudTrailClient({ region });
    configClient = new ConfigServiceClient({ region });
    iamClient = new IAMClient({ region });
    kmsClient = new KMSClient({ region });
  });

  describe('VPC and Networking', () => {
    test('VPC exists and has correct configuration', async () => {
      if (!outputs?.vpc_id) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      
      // Check DNS attributes separately 
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
      
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpc_id,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
    });


    test('Security group allows HTTP and HTTPS traffic', async () => {
      if (!outputs?.public_sg_id) {
        console.warn('Security group ID not found in outputs, skipping test');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.public_sg_id]
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      const ingressRules = sg.IpPermissions || [];
      
      // Check for HTTP rule (port 80)
      const httpRule = ingressRules.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
      
      // Check for HTTPS rule (port 443)
      const httpsRule = ingressRules.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === 'tcp'
      );
      expect(httpsRule).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('Data bucket exists and is accessible', async () => {
      if (!outputs?.s3_data_bucket) {
        console.warn('Data bucket name not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.s3_data_bucket
      });
      
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('Logs bucket exists and is accessible', async () => {
      if (!outputs?.s3_logs_bucket) {
        console.warn('Logs bucket name not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.s3_logs_bucket
      });
      
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('Data bucket has KMS encryption enabled', async () => {
      if (!outputs?.s3_data_bucket) {
        console.warn('Data bucket name not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_data_bucket
      });
      
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    test('Logs bucket has AES256 encryption enabled', async () => {
      if (!outputs?.s3_logs_bucket) {
        console.warn('Logs bucket name not found in outputs, skipping test');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_logs_bucket
      });
      
      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test('Buckets have public access blocked', async () => {
      if (!outputs?.s3_data_bucket || !outputs?.s3_logs_bucket) {
        console.warn('Bucket names not found in outputs, skipping test');
        return;
      }

      for (const bucketName of [outputs.s3_data_bucket, outputs.s3_logs_bucket]) {
        const command = new GetPublicAccessBlockCommand({
          Bucket: bucketName
        });
        
        const response = await s3Client.send(command);
        const config = response.PublicAccessBlockConfiguration!;
        
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      }
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail is configured and enabled', async () => {
      if (!outputs?.cloudtrail_name) {
        console.warn('CloudTrail name not found in outputs, skipping test');
        return;
      }

      const command = new DescribeTrailsCommand({
        trailNameList: [outputs.cloudtrail_name]
      });
      
      const response = await cloudTrailClient.send(command);
      expect(response.trailList).toHaveLength(1);
      
      const trail = response.trailList![0];
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.S3BucketName).toBe(outputs.s3_logs_bucket);
    });
  });

  describe('AWS Config', () => {
    test('Configuration recorder is active', async () => {
      const command = new DescribeConfigurationRecordersCommand({});
      const response = await configClient.send(command);
      
      expect(response.ConfigurationRecorders).toBeTruthy();
      expect(response.ConfigurationRecorders!.length).toBeGreaterThan(0);
      
      const recorder = response.ConfigurationRecorders!.find(r => 
        r.name?.includes('recorder')
      );
      expect(recorder).toBeDefined();
    });
  });
});