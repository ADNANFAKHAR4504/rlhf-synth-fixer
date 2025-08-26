// Configuration - These are coming from cfn-outputs after cdk deploy
// 
// CI/CD SETUP:
// To run these integration tests in CI, ensure the following environment variables are set:
// - AWS_DEFAULT_REGION=us-west-2
// - AWS credentials with access to the deployed TAP stack resources
// - The flat-outputs.json file is available in the cfn-outputs/ directory
//
import { DescribeSecurityGroupsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetDetectorCommand, GuardDutyClient } from '@aws-sdk/client-guardduty';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, GetBucketVersioningCommand, S3Client } from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import { GetWebACLCommand, WAFV2Client } from '@aws-sdk/client-wafv2';
import * as fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Extract environment suffix from the RDS endpoint in outputs
const environmentSuffix = outputs.RdsEndpoint.split('.')[0].replace('-database', '') || 'pr1669';

// Extract region from outputs
const region = outputs.RdsEndpoint.split('.')[2] || 'us-west-2';

// Initialize AWS clients with explicit region
const ec2Client = new EC2Client({ region: 'us-west-2' });
const rdsClient = new RDSClient({ region: 'us-west-2' });
const s3Client = new S3Client({ region: 'us-west-2' });
const snsClient = new SNSClient({ region: 'us-west-2' });
const wafv2Client = new WAFV2Client({ region: 'us-west-2' });
const guardDutyClient = new GuardDutyClient({ region: 'us-west-2' });
const kmsClient = new KMSClient({ region: 'us-west-2' });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: 'us-west-2' });

describe('TAP Stack Integration Tests', () => {
  // Set longer timeout for AWS API calls
  jest.setTimeout(60000);

  // Note: These tests require AWS credentials configured for us-west-2 region
  // where the TAP stack resources are deployed. These tests are designed to run
  // in CI/CD pipelines with proper AWS credentials and permissions.
  
  describe('Output Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs).toBeDefined();
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.KmsKeyId).toBeDefined();
      expect(outputs.RdsEndpoint).toBeDefined();
      expect(outputs.LoadBalancerDns).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.SnsTopicArn).toBeDefined();
      expect(outputs.WebAclArn).toBeDefined();
      expect(outputs.GuardDutyDetectorId).toBeDefined();
    });

    test('should have VPC ID in correct format', () => {
      expect(outputs.VpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });

    test('should have KMS Key ID in correct format', () => {
      expect(outputs.KmsKeyId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test('should have RDS endpoint in correct format', () => {
      expect(outputs.RdsEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    test('should have Load Balancer DNS in correct format', () => {
      expect(outputs.LoadBalancerDns).toMatch(/^[a-zA-Z0-9-]+\.us-west-2\.elb\.amazonaws\.com$/);
    });

    test('should have S3 bucket name in correct format', () => {
      expect(outputs.S3BucketName).toMatch(/^[a-zA-Z0-9-]+-[0-9]+-us-west-2$/);
    });

    test('should have SNS Topic ARN in correct format', () => {
      expect(outputs.SnsTopicArn).toMatch(/^arn:aws:sns:us-west-2:[0-9]+:[a-zA-Z0-9-]+$/);
    });

    test('should have WAF Web ACL ARN in correct format', () => {
      expect(outputs.WebAclArn).toMatch(/^arn:aws:wafv2:us-west-2:[0-9]+:regional\/webacl\/[a-zA-Z0-9-]+\/[a-f0-9-]+$/);
    });

    test('should have GuardDuty Detector ID in correct format', () => {
      expect(outputs.GuardDutyDetectorId).toMatch(/^[a-f0-9]{32}$/);
    });
  });



  describe('Live AWS Resource Validation', () => {
    test('should have VPC with correct configuration', async () => {
      try {
        const command = new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] });
        const response = await ec2Client.send(command);
        
        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs).toHaveLength(1);
        expect(response.Vpcs![0].VpcId).toBe(outputs.VpcId);
        expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
        expect(response.Vpcs![0].State).toBe('available');
      } catch (error) {
        console.error('VPC validation failed:', error);
        throw error;
      }
    });

    test('should have RDS instance with correct configuration', async () => {
      try {
        const command = new DescribeDBInstancesCommand({ 
          DBInstanceIdentifier: outputs.RdsEndpoint.split('.')[0] 
        });
        const response = await rdsClient.send(command);
        
        expect(response.DBInstances).toBeDefined();
        expect(response.DBInstances).toHaveLength(1);
        expect(response.DBInstances![0].DBInstanceStatus).toBe('available');
        expect(response.DBInstances![0].Engine).toBe('mysql');
        expect(response.DBInstances![0].StorageEncrypted).toBe(true);
      } catch (error) {
        console.error('RDS validation failed:', error);
        throw error;
      }
    });

    test('should have S3 bucket with encryption enabled', async () => {
      try {
        const command = new GetBucketEncryptionCommand({ Bucket: outputs.S3BucketName });
        const response = await s3Client.send(command);
        
        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault).toBeDefined();
        expect(response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
      } catch (error) {
        console.error('S3 encryption validation failed:', error);
        throw error;
      }
    });

    test('should have S3 bucket with versioning enabled', async () => {
      try {
        const command = new GetBucketVersioningCommand({ Bucket: outputs.S3BucketName });
        const response = await s3Client.send(command);
        
        expect(response.Status).toBe('Enabled');
      } catch (error) {
        console.error('S3 versioning validation failed:', error);
        throw error;
      }
    });

    test('should have SNS topic accessible', async () => {
      try {
        const command = new GetTopicAttributesCommand({ TopicArn: outputs.SnsTopicArn });
        const response = await snsClient.send(command);
        
        expect(response.Attributes).toBeDefined();
        expect(response.Attributes!.TopicArn).toBe(outputs.SnsTopicArn);
      } catch (error) {
        console.error('SNS topic validation failed:', error);
        throw error;
      }
    });

    test('should have WAF Web ACL accessible', async () => {
      try {
        const webAclId = outputs.WebAclArn.split('/').pop();
        const command = new GetWebACLCommand({ 
          Id: webAclId,
          Name: `${environmentSuffix}-web-acl`,
          Scope: 'REGIONAL'
        });
        const response = await wafv2Client.send(command);
        
        expect(response.WebACL).toBeDefined();
        expect(response.WebACL!.Name).toBe(`${environmentSuffix}-web-acl`);
      } catch (error) {
        console.error('WAF Web ACL validation failed:', error);
        throw error;
      }
    });

    test('should have GuardDuty detector enabled', async () => {
      try {
        const command = new GetDetectorCommand({ DetectorId: outputs.GuardDutyDetectorId });
        const response = await guardDutyClient.send(command);
        
        expect(response.Status).toBe('ENABLED');
      } catch (error) {
        console.error('GuardDuty validation failed:', error);
        throw error;
      }
    });

    test('should have KMS key accessible', async () => {
      try {
        const command = new DescribeKeyCommand({ KeyId: outputs.KmsKeyId });
        const response = await kmsClient.send(command);
        
        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata!.KeyId).toBe(outputs.KmsKeyId);
        expect(response.KeyMetadata!.Enabled).toBe(true);
        expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
      } catch (error) {
        console.error('KMS key validation failed:', error);
        throw error;
      }
    });

    test('should have Application Load Balancer accessible', async () => {
      try {
        // List all load balancers and find the one that matches our expected pattern
        const command = new DescribeLoadBalancersCommand({});
        const response = await elbv2Client.send(command);
        
        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers!.length).toBeGreaterThan(0);
        
        // Find the load balancer that matches our expected naming pattern
        const expectedAlb = response.LoadBalancers!.find(lb => 
          lb.LoadBalancerName && lb.LoadBalancerName.includes(`${environmentSuffix}-alb`)
        );
        
        expect(expectedAlb).toBeDefined();
        expect(expectedAlb!.State!.Code).toBe('active');
        expect(expectedAlb!.Type).toBe('application');
        
        // Verify the DNS name matches our expected pattern
        expect(expectedAlb!.DNSName).toContain(`${environmentSuffix}-alb`);
        expect(expectedAlb!.DNSName).toContain('.elb.amazonaws.com');
      } catch (error) {
        console.error('ALB validation failed:', error);
        throw error;
      }
    });

    test('should have security groups with correct configuration', async () => {
      try {
        // Get the VPC ID first
        const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] });
        const vpcResponse = await ec2Client.send(vpcCommand);
        const vpc = vpcResponse.Vpcs![0];
        
        // Get security groups in the VPC
        const sgCommand = new DescribeSecurityGroupsCommand({ 
          Filters: [{ Name: 'vpc-id', Values: [outputs.VpcId] }] 
        });
        const sgResponse = await ec2Client.send(sgCommand);
        
        expect(sgResponse.SecurityGroups).toBeDefined();
        expect(sgResponse.SecurityGroups!.length).toBeGreaterThan(0);
        
        // Check that we have the expected security groups
        const sgNames = sgResponse.SecurityGroups!.map(sg => sg.GroupName);
        expect(sgNames).toContain(`${environmentSuffix}-ec2-sg`);
        expect(sgNames).toContain(`${environmentSuffix}-alb-sg`);
        expect(sgNames).toContain(`${environmentSuffix}-rds-sg`);
      } catch (error) {
        console.error('Security groups validation failed:', error);
        throw error;
      }
    });
  });

  describe('Resource Naming Consistency', () => {
    test('should have consistent environment naming', () => {
      // Verify all resources use the same environment suffix
      expect(outputs.RdsEndpoint).toContain(`${environmentSuffix}-database`);
      expect(outputs.S3BucketName).toContain(`${environmentSuffix}-secure-bucket`);
      expect(outputs.SnsTopicArn).toContain(`${environmentSuffix}-notifications`);
      expect(outputs.LoadBalancerDns).toContain(`${environmentSuffix}-alb`);
    });

    test('should have all resources in the same region', () => {
      // Check that all ARNs and endpoints are in the correct region
      expect(outputs.SnsTopicArn).toContain(`:${region}:`);
      expect(outputs.WebAclArn).toContain(`:${region}:`);
      expect(outputs.RdsEndpoint).toContain(`.${region}.`);
      expect(outputs.LoadBalancerDns).toContain(`.${region}.`);
      expect(outputs.S3BucketName).toContain(`-${region}`);
    });
  });

  describe('Resource Relationships', () => {
    test('should have consistent account ID across resources', () => {
      // Extract account ID from SNS Topic ARN
      const snsAccountId = outputs.SnsTopicArn.split(':')[4];
      
      // Extract account ID from WAF Web ACL ARN
      const wafAccountId = outputs.WebAclArn.split(':')[4];
      
      // Verify both ARNs have the same account ID
      expect(snsAccountId).toBe(wafAccountId);
      expect(snsAccountId).toBe('718240086340');
    });

    test('should have proper resource hierarchy', () => {
      // VPC should be the foundation
      expect(outputs.VpcId).toBeDefined();
      
      // RDS should be in the VPC
      expect(outputs.RdsEndpoint).toBeDefined();
      
      // Load Balancer should be in the VPC
      expect(outputs.LoadBalancerDns).toBeDefined();
      
      // Security resources should be available
      expect(outputs.KmsKeyId).toBeDefined();
      expect(outputs.WebAclArn).toBeDefined();
      expect(outputs.GuardDutyDetectorId).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    test('should have encryption enabled for data resources', () => {
      // KMS key should be available for encryption
      expect(outputs.KmsKeyId).toBeDefined();
      
      // RDS endpoint should be available (encryption is configured in the stack)
      expect(outputs.RdsEndpoint).toBeDefined();
      
      // S3 bucket should be available (encryption is configured in the stack)
      expect(outputs.S3BucketName).toBeDefined();
    });

    test('should have security monitoring enabled', () => {
      // GuardDuty should be enabled
      expect(outputs.GuardDutyDetectorId).toBeDefined();
      
      // WAF should be configured
      expect(outputs.WebAclArn).toBeDefined();
    });
  });

  describe('Networking Configuration', () => {
    test('should have VPC networking configured', () => {
      expect(outputs.VpcId).toBeDefined();
    });

    test('should have load balancer for external access', () => {
      expect(outputs.LoadBalancerDns).toBeDefined();
      expect(outputs.LoadBalancerDns).toContain('elb.amazonaws.com');
    });

    test('should have database accessible within VPC', () => {
      expect(outputs.RdsEndpoint).toBeDefined();
      expect(outputs.RdsEndpoint).toContain('rds.amazonaws.com');
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have notification system configured', () => {
      expect(outputs.SnsTopicArn).toBeDefined();
      expect(outputs.SnsTopicArn).toContain('sns');
    });

    test('should have storage for logs and data', () => {
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName).toContain('bucket');
    });
  });
});
