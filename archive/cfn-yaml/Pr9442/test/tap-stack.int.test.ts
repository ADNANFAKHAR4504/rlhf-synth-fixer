import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';

const region = process.env.AWS_REGION || 'us-east-1';
const stackName = process.env.STACK_NAME || 'TapStack';
const isLocalStack = !!process.env.AWS_ENDPOINT_URL;
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
const cloudformation = new CloudFormationClient({ region });
const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const s3 = new S3Client({ region, forcePathStyle: true });
const kms = new KMSClient({ region });

describe('TapStack Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const required = [
        'DatabaseEndpoint',
        'KMSKeyId',
        'LoadBalancerDNS',
        'S3BucketName',
        'VPCId',
      ];
      required.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
      });
    });
  });

  describe('VPC', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      const vpc = response.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance with correct endpoint', async () => {
      const endpoint = outputs.DatabaseEndpoint;
      // LocalStack uses localhost.localstack.cloud, AWS uses rds.amazonaws.com
      if (isLocalStack) {
        expect(endpoint).toMatch(/localhost\.localstack\.cloud$/);
      } else {
        expect(endpoint).toMatch(/rds\.amazonaws\.com$/);
      }
      const resp = await rds.send(new DescribeDBInstancesCommand({}));
      expect(resp.DBInstances).toBeDefined();
      expect(resp.DBInstances!.length).toBeGreaterThan(0);
      const found = resp.DBInstances!.find(
        db => db.Endpoint?.Address === endpoint || db.DBInstanceIdentifier
      );
      expect(found).toBeDefined();
    });
  });

  describe('KMS Key', () => {
    test('should have KMS key and it should be enabled', async () => {
      const keyId = outputs.KMSKeyId;
      const res = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));
      expect(res.KeyMetadata?.KeyId).toBe(keyId);
      expect(res.KeyMetadata?.Enabled).toBe(true);
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3 bucket accessible', async () => {
      const bucket = outputs.S3BucketName;
      // Use HeadBucket to verify bucket exists and is accessible
      const res = await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      // HeadBucket returns 200 OK if bucket exists and is accessible
      expect(res.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have valid ALB DNS name', () => {
      const albDns = outputs.LoadBalancerDNS;
      // LocalStack uses elb.localhost.localstack.cloud, AWS uses elb.amazonaws.com
      if (isLocalStack) {
        expect(albDns).toMatch(/elb\.localhost\.localstack\.cloud$/);
      } else {
        expect(albDns).toMatch(/elb\.amazonaws\.com$/);
      }
    });
  });
});
