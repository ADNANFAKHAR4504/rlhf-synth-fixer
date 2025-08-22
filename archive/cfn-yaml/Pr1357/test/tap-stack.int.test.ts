import AWS from 'aws-sdk';
import fs from 'fs';
import https from 'https';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environment =  'prod';
const projectName = process.env.PROJECT_NAME || 'myapp';
const region = process.env.AWS_REGION || 'us-east-1';

AWS.config.update({ region });

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const rds = new AWS.RDS();
const elbv2 = new AWS.ELBv2();
const cloudfront = new AWS.CloudFront();
const wafv2 = new AWS.WAFV2();
const guardduty = new AWS.GuardDuty();
const cloudtrail = new AWS.CloudTrail();
const iam = new AWS.IAM();
const lambda = new AWS.Lambda();

const makeHttpRequest = (url: string): Promise<{ statusCode: number; body: string; headers: any }> => {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode || 0,
          body: data,
          headers: response.headers
        });
      });
    });
    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

describe('AWS Infrastructure Integration Tests', () => {

  // 1. VPC Validation
  describe('VPC Configuration', () => {
    test('should have created the VPC with correct CIDR', async () => {
      const vpcId = outputs[`${projectName}-${environment}-vpc-id`];
      const result = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(result.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });
  });

  // 2. S3 Buckets
  describe('S3 Buckets', () => {
    test('CloudTrail bucket should block public access', async () => {
      const bucketName = outputs[`${projectName}-${environment}-cloudtrail-bucket`];
      if (bucketName) {
        const policy = await s3.getBucketPolicyStatus({ Bucket: bucketName }).promise();
        expect(policy.PolicyStatus?.IsPublic).toBe(false);
      } else {
        console.log('CloudTrail bucket not created - skipping test');
      }
    });
  });

  // 3. RDS Database
  describe('RDS Database', () => {
    test('should have Multi-AZ enabled and encrypted storage', async () => {
      const dbEndpoint = outputs[`${projectName}-${environment}-db-endpoint`];
      const dbId = `${projectName}-${environment}-db`;
      const result = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
      const db = result.DBInstances?.[0];
      expect(db?.MultiAZ).toBe(true);
      expect(db?.StorageEncrypted).toBe(true);
    });
  });

  // 4. EC2 and ALB
  describe('EC2 & ALB', () => {
    test('Web server should be running', async () => {
      const instanceId = outputs[`${projectName}-${environment}-web-server`];
      const result = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();
      const state = result.Reservations?.[0].Instances?.[0].State?.Name;
      expect(state).toBe('running');
    });
  });
});
