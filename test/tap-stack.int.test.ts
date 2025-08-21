import AWS from 'aws-sdk';
import fs from 'fs';
import https from 'https';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
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
      const vpcId = outputs[`${projectName}-${environmentSuffix}-vpc-id`];
      const result = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
      expect(result.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });
  });

  // 2. S3 Buckets
  describe('S3 Buckets', () => {
    test('Application bucket should have encryption enabled', async () => {
      const bucketName = outputs[`${projectName}-${environmentSuffix}-app-bucket`];
      const enc = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(enc.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('CloudTrail bucket should block public access', async () => {
      const bucketName = outputs[`${projectName}-${environmentSuffix}-cloudtrail-${process.env.AWS_ACCOUNT_ID}`];
      const policy = await s3.getBucketPolicyStatus({ Bucket: bucketName }).promise();
      expect(policy.PolicyStatus.IsPublic).toBe(false);
    });
  });

  // 3. RDS Database
  describe('RDS Database', () => {
    test('should have Multi-AZ enabled and encrypted storage', async () => {
      const dbId = `${projectName}-${environmentSuffix}-db`;
      const result = await rds.describeDBInstances({ DBInstanceIdentifier: dbId }).promise();
      const db = result.DBInstances?.[0];
      expect(db?.MultiAZ).toBe(true);
      expect(db?.StorageEncrypted).toBe(true);
    });
  });

  // 4. EC2 and ALB
  describe('EC2 & ALB', () => {
    test('Web server should be running', async () => {
      const instanceId = outputs[`${projectName}-${environmentSuffix}-web-server`];
      const result = await ec2.describeInstances({ InstanceIds: [instanceId] }).promise();
      const state = result.Reservations?.[0].Instances?.[0].State?.Name;
      expect(state).toBe('running');
    });

    test('ALB should return HTTP 200', async () => {
      const albDns = outputs[`${projectName}-${environmentSuffix}-alb-dns`];
      const response = await makeHttpRequest(`http://${albDns}`);
      expect(response.statusCode).toBe(200);
    });
  });

  // 5. CloudFront
  describe('CloudFront', () => {
    test('CloudFront distribution should be enabled and return 200', async () => {
      const cfDomain = outputs[`${projectName}-${environmentSuffix}-cf-domain`];
      const result = await cloudfront.getDistributionConfig({
        Id: cfDomain
      }).promise();
      expect(result.DistributionConfig.Enabled).toBe(true);

      const response = await makeHttpRequest(`https://${cfDomain}`);
      expect(response.statusCode).toBe(200);
    });
  });

  // 6. WAF
  describe('WAF WebACL', () => {
    test('WAF WebACL should be attached to the ALB', async () => {
      const wafArn = outputs[`${projectName}-${environmentSuffix}-waf-arn`];
      const albArn = outputs[`${projectName}-${environmentSuffix}-alb-dns`];
      const result = await wafv2.listResourcesForWebACL({ WebACLArn: wafArn, ResourceType: 'APPLICATION_LOAD_BALANCER' }).promise();
      expect(result.ResourceArns).toContain(albArn);
    });
  });

  // 7. GuardDuty
  describe('GuardDuty', () => {
    test('GuardDuty detector should exist and be enabled', async () => {
      const detectorId = outputs[`${projectName}-${environmentSuffix}-guardduty-id`];
      const result = await guardduty.getDetector({ DetectorId: detectorId }).promise();
      expect(result.Status).toBe('ENABLED');
    });
  });

  // 8. CloudTrail
  describe('CloudTrail', () => {
    test('CloudTrail should be logging', async () => {
      const trailName = `${projectName}-${environmentSuffix}-cloudtrail`;
      const result = await cloudtrail.describeTrails({ trailNameList: [trailName] }).promise();
      expect(result.trailList?.[0].IsMultiRegionTrail).toBe(true);
      expect(result.trailList?.[0].LogFileValidationEnabled).toBe(true);
    });
  });

  // 9. Lambda Function
  describe('Lambda', () => {
    test('Sample Lambda function should return HTTP 200', async () => {
      const lambdaName = `${projectName}-${environmentSuffix}-sample-function`;
      const response = await lambda.invoke({ FunctionName: lambdaName }).promise();
      expect(response.StatusCode).toBe(200);
    });
  });

  // 10. IAM & MFA
  describe('IAM Policies', () => {
    test('MFA enforcement policy should exist', async () => {
      const policyName = `${projectName}-${environmentSuffix}-mfa-enforcement`;
      const result = await iam.listPolicies({ Scope: 'Local' }).promise();
      const policy = result.Policies?.find(p => p.PolicyName === policyName);
      expect(policy).toBeDefined();
    });
  });
});
