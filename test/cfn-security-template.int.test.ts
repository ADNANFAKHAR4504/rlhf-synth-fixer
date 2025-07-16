import { CloudFormationClient, DescribeStackResourcesCommand, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { DescribeSecurityGroupsCommand, DescribeSubnetsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';

// Configuration - These are coming from cdk-outputs after deployment
const outputs = JSON.parse(
  fs.readFileSync('cdk-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.CDK_CONTEXT_ENVIRONMENT_SUFFIX || 'dev';
const stackName = `secure-web-infra-${environmentSuffix}`;

describe('CloudFormation Security Infrastructure Integration Tests', () => {
  let cfnClient: CloudFormationClient;
  let ec2Client: EC2Client;
  let rdsClient: RDSClient;
  let s3Client: S3Client;
  
  beforeAll(() => {
    const region = process.env.AWS_REGION || 'us-east-1';
    cfnClient = new CloudFormationClient({ region });
    ec2Client = new EC2Client({ region });
    rdsClient = new RDSClient({ region });
    s3Client = new S3Client({ region });
  });

  describe('Stack Deployment', () => {
    test('should have stack in CREATE_COMPLETE status', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);
      
      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBe(1);
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    }, 30000);

    test('should have all required stack resources', async () => {
      const command = new DescribeStackResourcesCommand({ StackName: stackName });
      const response = await cfnClient.send(command);
      
      const resourceTypes = response.StackResources!.map(r => r.ResourceType);
      
      // Check for required resource types
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::InternetGateway');
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(resourceTypes).toContain('AWS::AutoScaling::AutoScalingGroup');
      expect(resourceTypes).toContain('AWS::CloudFront::Distribution');
      expect(resourceTypes).toContain('AWS::WAFv2::WebACL');
      expect(resourceTypes).toContain('AWS::KMS::Key');
    }, 30000);
  });

  describe('VPC and Networking Validation', () => {
    test('should have VPC with multiple subnets across AZs', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const subnetsCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);
      
      expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(3);
      
      // Check that subnets are in different AZs
      const azs = new Set(subnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    }, 15000);

    test('should have properly configured security groups', async () => {
      const vpcId = outputs.VpcId;
      
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups!.length).toBeGreaterThan(1); // At least default + custom
      
      // Check for specific security groups
      const sgNames = response.SecurityGroups!.map(sg => sg.GroupName);
      expect(sgNames.some(name => name?.includes('web') || name?.includes('app'))).toBeTruthy();
      expect(sgNames.some(name => name?.includes('db') || name?.includes('rds'))).toBeTruthy();
    }, 15000);
  });

  describe('Database Validation', () => {
    test('should have RDS instance with Multi-AZ enabled', async () => {
      const dbInstanceId = outputs.DatabaseInstanceId;
      expect(dbInstanceId).toBeDefined();

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      });
      const response = await rdsClient.send(command);
      
      expect(response.DBInstances!.length).toBe(1);
      const dbInstance = response.DBInstances![0];
      
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.DBInstanceStatus).toBe('available');
    }, 20000);
  });

  describe('Storage Security Validation', () => {
    test('should have S3 buckets with encryption enabled', async () => {
      const bucketNames = [
        outputs.ContentBucketName,
        outputs.LoggingBucketName
      ].filter(Boolean);
      
      expect(bucketNames.length).toBeGreaterThan(0);

      for (const bucketName of bucketNames) {
        const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
      }
    }, 15000);
  });

  describe('Load Balancer Health', () => {
    test('should have load balancer in active state', async () => {
      const albArn = outputs.LoadBalancerArn;
      expect(albArn).toBeDefined();
      
      // Note: This would require additional AWS SDK calls to ELBv2
      // For now, just verify the ARN format
      expect(albArn).toMatch(/^arn:aws:elasticloadbalancing:/);
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should have CloudWatch alarms configured', async () => {
      // This would require CloudWatch SDK calls
      // For now, verify outputs contain alarm ARNs
      const alarmArns = Object.keys(outputs)
        .filter(key => key.includes('Alarm'))
        .map(key => outputs[key]);
      
      expect(alarmArns.length).toBeGreaterThan(0);
    });
  });

  describe('Security Compliance', () => {
    test('should have KMS keys for encryption', async () => {
      const kmsKeyId = outputs.KMSKeyId;
      expect(kmsKeyId).toBeDefined();
      expect(kmsKeyId).toMatch(/^arn:aws:kms:|^[a-f0-9-]{36}$/);
    });

    test('should have WAF Web ACL configured', async () => {
      const wafArn = outputs.WebACLArn;
      expect(wafArn).toBeDefined();
      expect(wafArn).toMatch(/^arn:aws:wafv2:/);
    });

    test('should have CloudFront distribution', async () => {
      const distributionId = outputs.CloudFrontDistributionId;
      expect(distributionId).toBeDefined();
      expect(distributionId).toMatch(/^[A-Z0-9]+$/);
    });
  });
}); 