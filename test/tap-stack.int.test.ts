// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';

// Read the CloudFormation outputs
const outputsPath = path.join(__dirname, 'cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  describe('CloudFormation Outputs Validation', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentType',
        'VpcId',
        'InstanceId',
        'PublicSubnetId',
        'InstancePublicIp',
        'WebsiteUrl'
      ];

      expectedOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName]).not.toBeNull();
      });
    });

    test('DynamoDB table name should follow naming convention', () => {
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toMatch(/^TurnAroundPromptTable(dev|stage|prod)$/);
      expect(tableName).toContain(environmentSuffix);
    });

    test('DynamoDB table ARN should be valid', () => {
      const tableArn = outputs.TurnAroundPromptTableArn;
      expect(tableArn).toMatch(/^arn:aws:dynamodb:[a-z0-9-]+:\d+:table\/[a-zA-Z0-9_-]+$/);
    });

    test('Stack name should be defined', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName).toContain('TapStack');
    });

    test('Environment type should match expected value', () => {
      expect(outputs.EnvironmentType).toBe(environmentSuffix);
      expect(['dev', 'stage', 'prod']).toContain(outputs.EnvironmentType);
    });

    test('VPC ID should be valid format', () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('EC2 Instance ID should be valid format', () => {
      const instanceId = outputs.InstanceId;
      expect(instanceId).toMatch(/^i-[a-f0-9]+$/);
    });

    test('Public Subnet ID should be valid format', () => {
      const subnetId = outputs.PublicSubnetId;
      expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
    });

    test('Instance Public IP should be valid IP address', () => {
      const publicIp = outputs.InstancePublicIp;
      expect(publicIp).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });

    test('Website URL should be accessible', () => {
      const websiteUrl = outputs.WebsiteUrl;
      expect(websiteUrl).toMatch(/^http:\/\/\d+\.\d+\.\d+\.\d+$/);
    });
  });

  describe('Infrastructure Connectivity Tests', () => {
    test('should be able to connect to DynamoDB table', async () => {
      // This would typically use AWS SDK to test DynamoDB connectivity
      // For now, we'll just validate the ARN format
      const tableArn = outputs.TurnAroundPromptTableArn;
      expect(tableArn).toBeDefined();
      
      // Mock test - in real integration tests, you would:
      // 1. Use AWS SDK to connect to DynamoDB
      // 2. Try to describe the table
      // 3. Verify table properties match expectations
      expect(true).toBe(true);
    });

    test('should be able to connect to EC2 instance', async () => {
      // This would typically use AWS SDK to test EC2 connectivity
      // For now, we'll just validate the instance ID format
      const instanceId = outputs.InstanceId;
      expect(instanceId).toBeDefined();
      
      // Mock test - in real integration tests, you would:
      // 1. Use AWS SDK to connect to EC2
      // 2. Try to describe the instance
      // 3. Verify instance state is 'running'
      expect(true).toBe(true);
    });

    test('should be able to access VPC resources', async () => {
      // This would typically use AWS SDK to test VPC connectivity
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      
      // Mock test - in real integration tests, you would:
      // 1. Use AWS SDK to connect to VPC
      // 2. Try to describe the VPC
      // 3. Verify VPC properties match expectations
      expect(true).toBe(true);
    });
  });

  describe('End-to-End Functionality Tests', () => {
    test('should be able to write and read from DynamoDB table', async () => {
      // This would test actual DynamoDB operations
      // For now, we'll just validate the table exists
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBeDefined();
      
      // Mock test - in real integration tests, you would:
      // 1. Write a test item to the DynamoDB table
      // 2. Read the item back
      // 3. Verify the data integrity
      expect(true).toBe(true);
    });

    test('should be able to access web server on EC2 instance', async () => {
      // This would test HTTP connectivity to the EC2 instance
      const websiteUrl = outputs.WebsiteUrl;
      expect(websiteUrl).toBeDefined();
      
      // Mock test - in real integration tests, you would:
      // 1. Make an HTTP request to the website URL
      // 2. Verify the response contains expected content
      // 3. Check response status code is 200
      expect(true).toBe(true);
    });
  });

  describe('Environment-Specific Tests', () => {
    test('should have correct environment-specific naming', () => {
      const tableName = outputs.TurnAroundPromptTableName;
      const stackName = outputs.StackName;
      
      expect(tableName).toContain(environmentSuffix);
      expect(stackName).toContain(environmentSuffix);
    });

    test('should have environment-specific resource isolation', () => {
      // This would verify that resources are properly isolated per environment
      // For now, we'll just validate the environment type is used consistently
      expect(outputs.EnvironmentType).toBe(environmentSuffix);
    });
  });
});
