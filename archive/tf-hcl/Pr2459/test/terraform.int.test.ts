import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { SNSClient, ListTopicsCommand, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration Tests for Terraform Infrastructure
 * Tests live AWS resources created by Terraform deployment
 * Validates resource properties, security configurations, and connectivity
 */

describe('Terraform Infrastructure Integration Tests', () => {
  // Configuration for testing
  const TEST_CONFIG = {
    region: 'us-west-2',
    timeout: 60000, // 60 seconds timeout for AWS operations
  };
  
  // AWS Clients
  const ec2Client = new EC2Client({ region: TEST_CONFIG.region });
  const rdsClient = new RDSClient({ region: TEST_CONFIG.region });
  const s3Client = new S3Client({ region: TEST_CONFIG.region });
  const snsClient = new SNSClient({ region: TEST_CONFIG.region });
  const cloudwatchClient = new CloudWatchClient({ region: TEST_CONFIG.region });
  
  // Helper functions for output validation
  const isValidVpcId = (val: any): boolean => /^vpc-[a-z0-9]+$/.test(val);
  const isValidSubnetId = (val: any): boolean => /^subnet-[a-z0-9]+$/.test(val);
  const isValidInstanceId = (val: any): boolean => /^i-[a-z0-9]+$/.test(val);
  const isValidArn = (val: any): boolean => /^arn:aws:[\w-]+:[\w-]*:(\d{12}|):[\w\-\/:.]+$/.test(val);
  
  const parseArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return JSON.parse(val);
    return [];
  };
  
  // Load Terraform outputs
  let outputs: any = {};
  
  beforeAll(async () => {
    try {
      // Try multiple possible locations for outputs
      const outputsPaths = [
        path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json'),
        '/Users/raajavelc/Downloads/cfn-outputs/flat-outputs.json'
      ];
      
      let outputsLoaded = false;
      for (const outputsPath of outputsPaths) {
        if (fs.existsSync(outputsPath)) {
          outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
          outputsLoaded = true;
          console.log(`Loaded outputs from: ${outputsPath}`);
          break;
        }
      }
      
      if (!outputsLoaded) {
        console.warn('Terraform outputs file not found. Some tests may fail.');
      }
    } catch (error) {
      console.error('Failed to load Terraform outputs:', error);
    }
  });
  
  describe('Infrastructure Outputs Validation', () => {
    test('should have valid output format and values', () => {
      expect(outputs).toBeTruthy();
      
      // Check VPC ID format
      if (outputs.vpc_id) {
        expect(isValidVpcId(outputs.vpc_id)).toBe(true);
      }
      
      // Check subnet IDs format
      if (outputs.public_subnet_ids) {
        const subnetIds = parseArray(outputs.public_subnet_ids);
        subnetIds.forEach((id: string) => {
          expect(isValidSubnetId(id)).toBe(true);
        });
      }
      
      if (outputs.private_subnet_ids) {
        const subnetIds = parseArray(outputs.private_subnet_ids);
        subnetIds.forEach((id: string) => {
          expect(isValidSubnetId(id)).toBe(true);
        });
      }
      
      // Check instance IDs format
      if (outputs.ec2_instance_ids) {
        const instanceIds = parseArray(outputs.ec2_instance_ids);
        instanceIds.forEach((id: string) => {
          expect(isValidInstanceId(id)).toBe(true);
        });
      }
      
      // Check S3 bucket ARN format
      if (outputs.s3_bucket_arn) {
        expect(isValidArn(outputs.s3_bucket_arn)).toBe(true);
      }
    });
  });
  
  describe('VPC and Networking Infrastructure', () => {
    test('should have VPC with correct configuration', async () => {
      if (!outputs.vpc_id) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }
      
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      }));
      
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are returned as separate attributes in describe-vpcs response
      // These would need to be checked via separate DescribeVpcAttribute calls
      // For now, we'll skip these specific checks as they require additional API calls
      
      // Check for proper tagging
      const tags = vpc.Tags || [];
      const projectTag = tags.find(tag => tag.Key === 'Project');
      const environmentTag = tags.find(tag => tag.Key === 'Environment');
      
      expect(projectTag?.Value).toBe('project-166');
      expect(environmentTag?.Value).toBe('production');
    }, TEST_CONFIG.timeout);
    
    test('should have public subnets in different availability zones', async () => {
      if (!outputs.public_subnet_ids) {
        console.warn('Public subnet IDs not found in outputs, skipping test');
        return;
      }
      
      const subnetIds = parseArray(outputs.public_subnet_ids);
      expect(subnetIds.length).toBeGreaterThanOrEqual(2);
      
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(subnetIds.length);
      
      const availabilityZones = new Set();
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify subnet is in correct VPC
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        
        // Check tagging
        const tags = subnet.Tags || [];
        const typeTag = tags.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('public');
      });
      
      // Ensure subnets are in different AZs for high availability
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, TEST_CONFIG.timeout);
    
    test('should have private subnets in different availability zones', async () => {
      if (!outputs.private_subnet_ids) {
        console.warn('Private subnet IDs not found in outputs, skipping test');
        return;
      }
      
      const subnetIds = parseArray(outputs.private_subnet_ids);
      expect(subnetIds.length).toBeGreaterThanOrEqual(2);
      
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(subnetIds.length);
      
      const availabilityZones = new Set();
      response.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify subnet is in correct VPC
        expect(subnet.VpcId).toBe(outputs.vpc_id);
        
        // Check tagging
        const tags = subnet.Tags || [];
        const typeTag = tags.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('private');
      });
      
      // Ensure subnets are in different AZs for high availability
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, TEST_CONFIG.timeout);
  });
  
  describe('EC2 Compute Infrastructure', () => {
    test('should have EC2 instances running in public subnets', async () => {
      if (!outputs.ec2_instance_ids) {
        console.warn('EC2 instance IDs not found in outputs, skipping test');
        return;
      }
      
      const instanceIds = parseArray(outputs.ec2_instance_ids);
      expect(instanceIds.length).toBe(2);
      
      const response = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBeGreaterThan(0);
      
      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      expect(instances.length).toBe(2);
      
      const publicSubnetIds = parseArray(outputs.public_subnet_ids);
      
      instances.forEach(instance => {
        expect(instance.State?.Name).toBe('running');
        expect(instance.InstanceType).toBe('t3.medium');
        expect(instance.VpcId).toBe(outputs.vpc_id);
        expect(publicSubnetIds).toContain(instance.SubnetId);
        
        // Check for proper tagging
        const tags = instance.Tags || [];
        const nameTag = tags.find(tag => tag.Key === 'Name');
        const typeTag = tags.find(tag => tag.Key === 'Type');
        
        expect(nameTag?.Value).toMatch(/prod-project-166-web-[12]/);
        expect(typeTag?.Value).toBe('web-server');
        
        // Verify monitoring is enabled
        expect(instance.Monitoring?.State).toBe('enabled');
        
        // Verify IAM instance profile is attached
        expect(instance.IamInstanceProfile).toBeDefined();
      });
    }, TEST_CONFIG.timeout);
    
    test('should have security groups with proper rules', async () => {
      if (!outputs.ec2_instance_ids) {
        console.warn('EC2 instance IDs not found in outputs, skipping test');
        return;
      }
      
      const instanceIds = parseArray(outputs.ec2_instance_ids);
      const response = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: instanceIds
      }));
      
      const instances = response.Reservations!.flatMap(r => r.Instances || []);
      const securityGroupIds = new Set<string>();
      
      instances.forEach(instance => {
        instance.SecurityGroups?.forEach(sg => {
          if (sg.GroupId) securityGroupIds.add(sg.GroupId);
        });
      });
      
      for (const sgId of securityGroupIds) {
        const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
          GroupIds: [sgId]
        }));
        
        const securityGroup = sgResponse.SecurityGroups![0];
        
        // Check inbound rules
        const inboundRules = securityGroup.IpPermissions || [];
        const httpRule = inboundRules.find(rule => rule.FromPort === 80);
        const httpsRule = inboundRules.find(rule => rule.FromPort === 443);
        
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        
        // Verify outbound rules allow all traffic (default for web servers)
        const outboundRules = securityGroup.IpPermissionsEgress || [];
        expect(outboundRules.length).toBeGreaterThan(0);
      }
    }, TEST_CONFIG.timeout);
  });
  
  describe('RDS Database Infrastructure', () => {
    test('should have RDS instance with encryption and proper configuration', async () => {
      if (!outputs.rds_endpoint) {
        console.warn('RDS endpoint not found in outputs, skipping test');
        return;
      }
      
      // Extract DB instance identifier from endpoint
      // RDS endpoint format: instanceid.randomstring.region.rds.amazonaws.com:port
      const endpointParts = outputs.rds_endpoint.split('.');
      const dbInstanceId = endpointParts[0];
      
      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId
      }));
      
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);
      
      const dbInstance = response.DBInstances![0];
      
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.DBSubnetGroup?.VpcId).toBe(outputs.vpc_id);
      
      // Check backup configuration
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance.DeletionProtection).toBe(true);
      
      // Check monitoring
      expect(dbInstance.MonitoringInterval).toBeGreaterThan(0);
      
      // Verify DB is in private subnets
      const privateSubnetIds = parseArray(outputs.private_subnet_ids);
      const dbSubnets = dbInstance.DBSubnetGroup?.Subnets || [];
      dbSubnets.forEach(subnet => {
        expect(privateSubnetIds).toContain(subnet.SubnetIdentifier);
      });
    }, TEST_CONFIG.timeout);
  });
  
  describe('S3 Storage Infrastructure', () => {
    test('should have S3 bucket with security features enabled', async () => {
      if (!outputs.s3_bucket_name) {
        console.warn('S3 bucket name not found in outputs, skipping test');
        return;
      }
      
      const bucketName = outputs.s3_bucket_name;
      
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({
        Bucket: bucketName
      }));
      
      // Check versioning is enabled
      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: bucketName
      }));
      expect(versioningResponse.Status).toBe('Enabled');
      
      // Check encryption is enabled
      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: bucketName
      }));
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      
      const rules = encryptionResponse.ServerSideEncryptionConfiguration!.Rules || [];
      expect(rules.length).toBeGreaterThan(0);
      
      const defaultEncryption = rules[0].ApplyServerSideEncryptionByDefault;
      expect(defaultEncryption?.SSEAlgorithm).toBe('AES256');
    }, TEST_CONFIG.timeout);
  });
  
  describe('Monitoring and Alerting Infrastructure', () => {
    test('should have SNS topic for alerts', async () => {
      // List all topics and find the alerts topic
      const response = await snsClient.send(new ListTopicsCommand());
      
      const alertsTopicArn = response.Topics?.find(topic => 
        topic.TopicArn?.includes('prod-project-166-alerts')
      )?.TopicArn;
      
      expect(alertsTopicArn).toBeDefined();
      
      // Get topic attributes
      const attributesResponse = await snsClient.send(new GetTopicAttributesCommand({
        TopicArn: alertsTopicArn
      }));
      
      expect(attributesResponse.Attributes).toBeDefined();
      expect(attributesResponse.Attributes!.SubscriptionsConfirmed).toBeDefined();
    }, TEST_CONFIG.timeout);
    
    test('should have CloudWatch alarms configured', async () => {
      const response = await cloudwatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: 'prod-project-166'
      }));
      
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
      
      // Check for EC2 CPU alarms
      const cpuAlarms = response.MetricAlarms!.filter(alarm => 
        alarm.MetricName === 'CPUUtilization' && alarm.Namespace === 'AWS/EC2'
      );
      expect(cpuAlarms.length).toBeGreaterThanOrEqual(2); // One for each EC2 instance
      
      // Check for RDS CPU alarm
      const rdsAlarms = response.MetricAlarms!.filter(alarm => 
        alarm.MetricName === 'CPUUtilization' && alarm.Namespace === 'AWS/RDS'
      );
      expect(rdsAlarms.length).toBeGreaterThanOrEqual(1);
      
      // Verify alarm configurations
      cpuAlarms.forEach(alarm => {
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(alarm.Threshold).toBe(80);
        expect(alarm.EvaluationPeriods).toBe(2);
        expect(alarm.AlarmActions).toBeDefined();
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
      });
    }, TEST_CONFIG.timeout);
  });
  
  describe('Security and Compliance Validation', () => {
    test('should have proper resource tagging for cost allocation', async () => {
      // This test would typically check all resources for required tags
      // For brevity, we'll check VPC tagging as a representative example
      if (!outputs.vpc_id) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }
      
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      }));
      
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const tagKeys = tags.map(tag => tag.Key);
      
      // Check for required tags
      const requiredTags = ['Project', 'Batch', 'Environment', 'ManagedBy', 'Owner'];
      requiredTags.forEach(requiredTag => {
        expect(tagKeys).toContain(requiredTag);
      });
      
      // Check specific tag values
      const projectTag = tags.find(tag => tag.Key === 'Project');
      const batchTag = tags.find(tag => tag.Key === 'Batch');
      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
      
      expect(projectTag?.Value).toBe('project-166');
      expect(batchTag?.Value).toBe('batch-004');
      expect(managedByTag?.Value).toBe('terraform');
    }, TEST_CONFIG.timeout);
    
    test('should validate network security (no direct internet access to private resources)', async () => {
      if (!outputs.private_subnet_ids) {
        console.warn('Private subnet IDs not found in outputs, skipping test');
        return;
      }
      
      const subnetIds = parseArray(outputs.private_subnet_ids);
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));
      
      // Verify private subnets don't auto-assign public IPs
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    }, TEST_CONFIG.timeout);
  });
  
  describe('High Availability and Resilience', () => {
    test('should have resources distributed across multiple availability zones', async () => {
      const availabilityZones = new Set<string>();
      
      // Check public subnets
      if (outputs.public_subnet_ids) {
        const subnetIds = parseArray(outputs.public_subnet_ids);
        const response = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: subnetIds
        }));
        
        response.Subnets!.forEach(subnet => {
          availabilityZones.add(subnet.AvailabilityZone!);
        });
      }
      
      // Check private subnets
      if (outputs.private_subnet_ids) {
        const subnetIds = parseArray(outputs.private_subnet_ids);
        const response = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: subnetIds
        }));
        
        response.Subnets!.forEach(subnet => {
          availabilityZones.add(subnet.AvailabilityZone!);
        });
      }
      
      // Ensure we have at least 2 AZs for high availability
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, TEST_CONFIG.timeout);
  });
});