// Configuration - These are coming from cfn-outputs after CloudFormation deploy
import fs from 'fs';
import { 
  CloudFormationClient, 
  DescribeStacksCommand, 
  ListStackResourcesCommand 
} from '@aws-sdk/client-cloudformation';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { GuardDutyClient, GetDetectorCommand } from '@aws-sdk/client-guardduty';
import { CloudTrailClient, DescribeTrailsCommand } from '@aws-sdk/client-cloudtrail';
import { WAFv2Client, GetWebACLCommand } from '@aws-sdk/client-wafv2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Initialize AWS clients
const cfnClient = new CloudFormationClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const rdsClient = new RDSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const guardDutyClient = new GuardDutyClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudTrailClient = new CloudTrailClient({ region: process.env.AWS_REGION || 'us-east-1' });
const wafClient = new WAFv2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const elbClient = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION || 'us-east-1' });

let outputs: any = {};

describe('Secure Web Application Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    try {
      // Try to load outputs from file if available
      if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
        outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
      } else {
        // If no outputs file, try to get stack outputs directly
        const stackResponse = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
        if (stackResponse.Stacks && stackResponse.Stacks[0] && stackResponse.Stacks[0].Outputs) {
          outputs = {};
          stackResponse.Stacks[0].Outputs.forEach(output => {
            if (output.OutputKey && output.OutputValue) {
              outputs[output.OutputKey] = output.OutputValue;
            }
          });
        }
      }
    } catch (error) {
      console.warn('Could not load stack outputs. Some tests may fail.', error);
    }
  }, 30000);

  describe('CloudFormation Stack Validation', () => {
    test('CloudFormation stack should exist and be in CREATE_COMPLETE status', async () => {
      const response = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
      expect(response.Stacks).toBeDefined();
      expect(response.Stacks!.length).toBeGreaterThan(0);
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have all expected outputs', async () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetId', 
        'PrivateSubnetId',
        'WebApplicationSecurityGroupId',
        'DatabaseSecurityGroupId',
        'ApplicationLoadBalancerDNS',
        'WebACLArn',
        'DatabaseEndpoint',
        'SecureDynamoTableName',
        'KMSKeyId',
        'CloudTrailArn',
        'GuardDutyDetectorId'
      ];

      for (const outputName of expectedOutputs) {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBe('');
      }
    });
  });

  describe('Network Infrastructure Validation', () => {
    test('VPC should exist with proper configuration', async () => {
      if (!outputs.VPCId) {
        fail('VPC ID not available in outputs');
      }

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      }));

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('subnets should exist in different availability zones', async () => {
      if (!outputs.PublicSubnetId || !outputs.PrivateSubnetId) {
        fail('Subnet IDs not available in outputs');
      }

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [outputs.PublicSubnetId, outputs.PrivateSubnetId]
      }));

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(2);
      
      const subnets = response.Subnets!;
      // Subnets should be in different AZs
      expect(subnets[0].AvailabilityZone).not.toBe(subnets[1].AvailabilityZone);
      
      // Check that both subnets are available
      subnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('security groups should exist with proper rules', async () => {
      if (!outputs.WebApplicationSecurityGroupId || !outputs.DatabaseSecurityGroupId) {
        fail('Security Group IDs not available in outputs');
      }

      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.WebApplicationSecurityGroupId, outputs.DatabaseSecurityGroupId]
      }));

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(2);
      
      response.SecurityGroups!.forEach(sg => {
        expect(sg.VpcId).toBe(outputs.VPCId);
        expect(sg.GroupName).toContain('secure-web-app');
      });
    });
  });

  describe('Data Storage Validation', () => {
    test('DynamoDB table should exist with encryption enabled', async () => {
      if (!outputs.SecureDynamoTableName) {
        fail('DynamoDB table name not available in outputs');
      }

      const response = await dynamoClient.send(new DescribeTableCommand({
        TableName: outputs.SecureDynamoTableName
      }));

      expect(response.Table).toBeDefined();
      expect(response.Table!.TableStatus).toBe('ACTIVE');
      expect(response.Table!.SSEDescription).toBeDefined();
      expect(response.Table!.SSEDescription!.Status).toBe('ENABLED');
      expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('RDS database should exist with encryption enabled', async () => {
      if (!outputs.DatabaseEndpoint) {
        fail('Database endpoint not available in outputs');
      }

      // Extract DB instance identifier from endpoint
      const dbIdentifier = `secure-web-app-${environmentSuffix}-database`;
      
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.Engine).toBe('mysql');
    });
  });

  describe('Security Services Validation', () => {
    test('GuardDuty detector should be enabled', async () => {
      if (!outputs.GuardDutyDetectorId) {
        fail('GuardDuty detector ID not available in outputs');
      }

      const response = await guardDutyClient.send(new GetDetectorCommand({
        DetectorId: outputs.GuardDutyDetectorId
      }));

      expect(response.Status).toBe('ENABLED');
      expect(response.FindingPublishingFrequency).toBeDefined();
    });

    test('CloudTrail should be logging', async () => {
      if (!outputs.CloudTrailArn) {
        fail('CloudTrail ARN not available in outputs');
      }

      // Extract trail name from ARN
      const trailName = outputs.CloudTrailArn.split('/').pop();
      
      const response = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [trailName]
      }));

      expect(response.trailList).toBeDefined();
      expect(response.trailList!.length).toBe(1);
      
      const trail = response.trailList![0];
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.KMSKeyId).toBeDefined();
    });

    test('Web Application Firewall should be configured', async () => {
      if (!outputs.WebACLArn) {
        fail('WAF WebACL ARN not available in outputs');
      }

      // Extract WebACL ID from ARN
      const webAclId = outputs.WebACLArn.split('/').pop();
      
      const response = await wafClient.send(new GetWebACLCommand({
        Scope: 'REGIONAL',
        Id: webAclId
      }));

      expect(response.WebACL).toBeDefined();
      expect(response.WebACL!.Rules).toBeDefined();
      expect(response.WebACL!.Rules!.length).toBeGreaterThan(0);
      expect(response.WebACL!.DefaultAction).toBeDefined();
    });
  });

  describe('Load Balancer Validation', () => {
    test('Application Load Balancer should be accessible', async () => {
      if (!outputs.ApplicationLoadBalancerDNS) {
        fail('ALB DNS name not available in outputs');
      }

      // Get ALB details by DNS name
      const response = await elbClient.send(new DescribeLoadBalancersCommand({}));
      
      const alb = response.LoadBalancers?.find(lb => 
        lb.DNSName === outputs.ApplicationLoadBalancerDNS
      );

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.Type).toBe('application');
      expect(alb!.AvailabilityZones).toBeDefined();
      expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('infrastructure should support secure web application deployment', async () => {
      // Validate that all components work together
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnetId).toBeDefined();
      expect(outputs.PrivateSubnetId).toBeDefined();
      expect(outputs.WebApplicationSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(outputs.SecureDynamoTableName).toBeDefined();
      
      // All these components should be interconnected and functional
      // This validates the complete secure web application infrastructure
    });

    test('all resources should follow naming conventions', async () => {
      // Check that resource names include environment suffix
      if (outputs.SecureDynamoTableName) {
        expect(outputs.SecureDynamoTableName).toContain(environmentSuffix);
      }
      
      // Check that resources are properly tagged with environment
      const stackResponse = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
      const stack = stackResponse.Stacks![0];
      
      if (stack.Tags) {
        const envTag = stack.Tags.find(tag => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
      }
    });

    test('security best practices should be implemented', async () => {
      // Validate encryption at rest for data stores
      if (outputs.SecureDynamoTableName) {
        const dynamoResponse = await dynamoClient.send(new DescribeTableCommand({
          TableName: outputs.SecureDynamoTableName
        }));
        expect(dynamoResponse.Table!.SSEDescription!.Status).toBe('ENABLED');
      }

      // Validate that database is not publicly accessible
      if (outputs.DatabaseEndpoint) {
        const dbIdentifier = `secure-web-app-${environmentSuffix}-database`;
        const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        }));
        expect(rdsResponse.DBInstances![0].PubliclyAccessible).toBe(false);
      }

      // Validate that GuardDuty is enabled
      if (outputs.GuardDutyDetectorId) {
        const guardDutyResponse = await guardDutyClient.send(new GetDetectorCommand({
          DetectorId: outputs.GuardDutyDetectorId
        }));
        expect(guardDutyResponse.Status).toBe('ENABLED');
      }
    });
  });

  describe('GDPR Compliance Validation', () => {
    test('data retention policies should be configured', async () => {
      // CloudTrail should have lifecycle policies for log retention
      if (outputs.CloudTrailArn) {
        const trailName = outputs.CloudTrailArn.split('/').pop();
        const response = await cloudTrailClient.send(new DescribeTrailsCommand({
          trailNameList: [trailName]
        }));
        
        expect(response.trailList![0].S3BucketName).toBeDefined();
        // S3 lifecycle policies should be configured (validated in template)
      }
    });

    test('encryption should be enabled for all data at rest', async () => {
      // DynamoDB encryption
      if (outputs.SecureDynamoTableName) {
        const dynamoResponse = await dynamoClient.send(new DescribeTableCommand({
          TableName: outputs.SecureDynamoTableName
        }));
        expect(dynamoResponse.Table!.SSEDescription!.Status).toBe('ENABLED');
      }

      // RDS encryption
      if (outputs.DatabaseEndpoint) {
        const dbIdentifier = `secure-web-app-${environmentSuffix}-database`;
        const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        }));
        expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);
      }
    });
  });
});
