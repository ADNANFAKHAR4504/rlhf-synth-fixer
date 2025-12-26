import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketLocationCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const stackName = process.env.STACK_NAME || 'TapStack';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
const cloudformation = new CloudFormationClient({ region });
const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const s3 = new S3Client({ region });
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
      expect(endpoint).toMatch(/rds\.amazonaws\.com$/);
      const resp = await rds.send(new DescribeDBInstancesCommand({}));
      const found = (resp.DBInstances || []).find(
        db => db.Endpoint?.Address === endpoint
      );
      expect(found).toBeDefined();
      expect(found?.DBInstanceStatus).toMatch(/available|backing-up|modifying/);
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
    test('should have S3 bucket in correct region', async () => {
      const bucket = outputs.S3BucketName;
      const res = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucket })
      );
      expect([null, '', region]).toContain(res.LocationConstraint);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have valid ALB DNS name', () => {
      const albDns = outputs.LoadBalancerDNS;
      expect(albDns).toMatch(/elb\.amazonaws\.com$/);
    });
  });
});
