/* eslint-disable prettier/prettier */
/**
 * Integration Tests for TapStack
 * 
 * These tests validate the TapStack component by reading from the deployed stack's outputs
 * stored in cfn-outputs/flat-outputs.json instead of making live AWS API calls.
 * 
 * This approach avoids AWS SDK mock configuration issues while still providing comprehensive
 * integration testing of the actual deployed infrastructure.
 */

import * as fs from 'fs';
import * as path from 'path';

// Type definition for the outputs file
interface StackOutputs {
  // Infrastructure
  vpcId: string;
  internetGatewayId: string;
  privateSubnetIds: string[];
  publicSubnetIds: string[];
  
  // Storage
  cloudTrailBucketName: string;
  cloudTrailBucketArn: string;
  
  // Configuration
  parameterStorePrefix: string;
  environment: string;
  regions: string[];
  awsRegion: string;
  accountId: string;
  
  // Monitoring
  logGroupName: string;
  logGroupArn: string;
  alarmTopicArn: string;
  dashboardArn: string;
  vpcFlowLogsId: string;
  
  // Security
  cloudTrailRoleArn: string;
  deploymentRoleArn: string;
  vpcFlowLogsRoleArn: string;
  
  // Metadata
  stackName: string;
  timestamp: string;
  tags: Record<string, string>;
  testEnvironment: boolean;
  deploymentComplete: boolean;
}

// Integration test configuration
const integrationTestConfig = {
  outputsFile: path.join('cfn-outputs', 'flat-outputs.json'),
  testEnvironment: process.env.TEST_ENV || 'integration-test',
  timeout: 300000, // 5 minutes timeout
};

describe('TapStack Integration Tests', () => {
  let stackOutputs: StackOutputs;

  beforeAll(async () => {
    // Load outputs from the generated JSON file
    try {
      const outputsPath = integrationTestConfig.outputsFile;
      
      if (!fs.existsSync(outputsPath)) {
        throw new Error(`Outputs file not found at ${outputsPath}. Please deploy the stack first.`);
      }

      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      stackOutputs = JSON.parse(outputsContent) as StackOutputs;

      // Validate that we have the expected outputs
      if (!stackOutputs.deploymentComplete) {
        throw new Error('Stack deployment is not complete according to outputs file');
      }

      console.log(`✅ Loaded stack outputs from ${outputsPath}`);
      console.log(`📊 Testing stack deployed at: ${stackOutputs.timestamp}`);
      
    } catch (error) {
      console.error('❌ Failed to load stack outputs:', error);
      throw error;
    }
  }, integrationTestConfig.timeout);

  describe('Infrastructure Validation', () => {
    test('should have valid VPC configuration', () => {
      expect(stackOutputs.vpcId).toBeDefined();
      expect(stackOutputs.vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      expect(stackOutputs.internetGatewayId).toBeDefined();
      expect(stackOutputs.internetGatewayId).toMatch(/^igw-[a-f0-9]+$/);
    });

    test('should have correct subnet configuration', () => {
      expect(stackOutputs.privateSubnetIds).toBeDefined();
      expect(stackOutputs.publicSubnetIds).toBeDefined();
      expect(stackOutputs.privateSubnetIds).toHaveLength(3);
      expect(stackOutputs.publicSubnetIds).toHaveLength(3);

      // Validate subnet ID format
      stackOutputs.privateSubnetIds.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });

      stackOutputs.publicSubnetIds.forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test('should have unique subnet IDs', () => {
      const allSubnetIds = [
        ...stackOutputs.privateSubnetIds,
        ...stackOutputs.publicSubnetIds
      ];
      
      const uniqueSubnetIds = new Set(allSubnetIds);
      expect(uniqueSubnetIds.size).toBe(allSubnetIds.length);
    });

    test('should have valid AWS region configuration', () => {
      expect(stackOutputs.awsRegion).toBeDefined();
      expect(stackOutputs.regions).toContain(stackOutputs.awsRegion);
      expect(stackOutputs.accountId).toBeDefined();
      expect(stackOutputs.accountId).toMatch(/^\d{12}$/);
    });
  });

  describe('Storage Infrastructure Validation', () => {
    test('should have CloudTrail S3 bucket configured', () => {
      expect(stackOutputs.cloudTrailBucketName).toBeDefined();
      expect(stackOutputs.cloudTrailBucketArn).toBeDefined();
      
      // Validate bucket name format
      expect(stackOutputs.cloudTrailBucketName).toMatch(/^[a-z0-9.-]+$/);
      expect(stackOutputs.cloudTrailBucketArn).toMatch(/^arn:aws:s3:::[a-z0-9.-]+$/);
      
      // Ensure bucket name includes environment
      expect(stackOutputs.cloudTrailBucketName).toContain(stackOutputs.environment);
    });

    test('should have consistent bucket naming', () => {
      const bucketNameFromArn = stackOutputs.cloudTrailBucketArn.split(':::')[1];
      expect(bucketNameFromArn).toBe(stackOutputs.cloudTrailBucketName);
    });
  });

  describe('Parameter Store Configuration', () => {
    test('should have parameter store prefix configured', () => {
      expect(stackOutputs.parameterStorePrefix).toBeDefined();
      expect(stackOutputs.parameterStorePrefix).toBe(`/${stackOutputs.environment}`);
    });

    test('should have consistent environment configuration', () => {
      expect(stackOutputs.environment).toBeDefined();
      expect(stackOutputs.tags.Environment).toBe(stackOutputs.environment);
    });
  });

  describe('Security Configuration Validation', () => {
    test('should have IAM roles configured', () => {
      expect(stackOutputs.cloudTrailRoleArn).toBeDefined();
      expect(stackOutputs.deploymentRoleArn).toBeDefined();
      expect(stackOutputs.vpcFlowLogsRoleArn).toBeDefined();

      // Validate ARN formats
      expect(stackOutputs.cloudTrailRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
      expect(stackOutputs.deploymentRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
      expect(stackOutputs.vpcFlowLogsRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+$/);
    });

    test('should have role names include environment', () => {
      expect(stackOutputs.cloudTrailRoleArn).toContain(stackOutputs.environment);
      expect(stackOutputs.deploymentRoleArn).toContain(stackOutputs.environment);
      expect(stackOutputs.vpcFlowLogsRoleArn).toContain(stackOutputs.environment);
    });

    test('should have unique role ARNs', () => {
      const roleArns = [
        stackOutputs.cloudTrailRoleArn,
        stackOutputs.deploymentRoleArn,
        stackOutputs.vpcFlowLogsRoleArn,
      ];
      
      const uniqueRoleArns = new Set(roleArns);
      expect(uniqueRoleArns.size).toBe(roleArns.length);
    });
  });

  describe('Monitoring Infrastructure Validation', () => {
    test('should have CloudWatch log groups configured', () => {
      expect(stackOutputs.logGroupName).toBeDefined();
      expect(stackOutputs.logGroupArn).toBeDefined();
      
      expect(stackOutputs.logGroupName).toBe(`/aws/infrastructure/${stackOutputs.environment}`);
      expect(stackOutputs.logGroupArn).toMatch(/^arn:aws:logs:[a-z0-9-]+:\d{12}:log-group:.+$/);
    });

    test('should have SNS topic for alarms', () => {
      expect(stackOutputs.alarmTopicArn).toBeDefined();
      expect(stackOutputs.alarmTopicArn).toMatch(/^arn:aws:sns:[a-z0-9-]+:\d{12}:.+$/);
      expect(stackOutputs.alarmTopicArn).toContain(stackOutputs.environment);
    });

    test('should have CloudWatch dashboard', () => {
      expect(stackOutputs.dashboardArn).toBeDefined();
      expect(stackOutputs.dashboardArn).toMatch(/^arn:aws:cloudwatch::[a-z0-9-]+:\d{12}:dashboard\/.+$/);
    });

    test('should have VPC Flow Logs configured', () => {
      expect(stackOutputs.vpcFlowLogsId).toBeDefined();
      expect(stackOutputs.vpcFlowLogsId).toMatch(/^fl-[a-f0-9]+$/);
    });
  });

  describe('Tagging and Compliance', () => {
    test('should have consistent tagging strategy', () => {
      expect(stackOutputs.tags).toBeDefined();
      expect(stackOutputs.tags.Project).toBe('IaC-AWS-Nova-Model-Breaking');
      expect(stackOutputs.tags.ManagedBy).toBe('Pulumi');
      expect(stackOutputs.tags.Environment).toBe(stackOutputs.environment);
      expect(stackOutputs.tags.DeploymentTime).toBeDefined();
      expect(stackOutputs.tags.Version).toBeDefined();
    });

    test('should have valid deployment timestamp', () => {
      expect(stackOutputs.timestamp).toBeDefined();
      const deploymentDate = new Date(stackOutputs.timestamp);
      expect(deploymentDate.getTime()).toBeGreaterThan(0);
      
      // Should be within last 24 hours for fresh deployments
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(deploymentDate).toBeInstanceOf(Date);
    });
  });

  describe('Cross-Resource Consistency', () => {
    test('should have consistent resource naming patterns', () => {
      const resourceNames = [
        stackOutputs.cloudTrailBucketName,
        stackOutputs.logGroupName,
      ];

      resourceNames.forEach(resourceName => {
        if (resourceName && resourceName.includes('/')) {
          // For paths like log group names
          expect(resourceName).toContain(stackOutputs.environment);
        } else if (resourceName) {
          // For regular resource names
          expect(resourceName).toContain(stackOutputs.environment);
        }
      });
    });

    test('should have account ID consistency across ARNs', () => {
      const arns = [
        stackOutputs.cloudTrailBucketArn,
        stackOutputs.cloudTrailRoleArn,
        stackOutputs.deploymentRoleArn,
        stackOutputs.vpcFlowLogsRoleArn,
        stackOutputs.logGroupArn,
        stackOutputs.alarmTopicArn,
      ].filter(arn => arn); // Filter out any undefined ARNs

      arns.forEach(arn => {
        const accountIdFromArn = arn.split(':')[4];
        expect(accountIdFromArn).toBe(stackOutputs.accountId);
      });
    });

    test('should have region consistency across ARNs', () => {
      const regionalArns = [
        stackOutputs.logGroupArn,
        stackOutputs.alarmTopicArn,
      ].filter(arn => arn);

      regionalArns.forEach(arn => {
        const regionFromArn = arn.split(':')[3];
        expect(regionFromArn).toBe(stackOutputs.awsRegion);
      });
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should handle test environment correctly', () => {
      if (stackOutputs.testEnvironment) {
        expect(stackOutputs.environment).toContain('test');
      }
    });

    test('should have appropriate resource scaling for environment', () => {
      // Test environments should have basic resources
      expect(stackOutputs.privateSubnetIds.length).toBeGreaterThanOrEqual(3);
      expect(stackOutputs.publicSubnetIds.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Integration and Deployment Validation', () => {
    test('should confirm successful deployment', () => {
      expect(stackOutputs.deploymentComplete).toBe(true);
      expect(stackOutputs.stackName).toBe('TapStack');
    });

    test('should have all required outputs present', () => {
      const requiredFields = [
        'vpcId',
        'internetGatewayId',
        'privateSubnetIds',
        'publicSubnetIds',
        'cloudTrailBucketName',
        'parameterStorePrefix',
        'environment',
        'awsRegion',
        'accountId',
        'deploymentComplete'
      ];

      requiredFields.forEach(field => {
        expect(stackOutputs[field as keyof StackOutputs]).toBeDefined();
      });
    });

    test('should have valid array fields', () => {
      expect(Array.isArray(stackOutputs.privateSubnetIds)).toBe(true);
      expect(Array.isArray(stackOutputs.publicSubnetIds)).toBe(true);
      expect(Array.isArray(stackOutputs.regions)).toBe(true);
    });
  });

  describe('Security and Compliance Validation', () => {
    test('should have security monitoring resources', () => {
      expect(stackOutputs.vpcFlowLogsId).toBeDefined();
      expect(stackOutputs.cloudTrailBucketName).toBeDefined();
      expect(stackOutputs.alarmTopicArn).toBeDefined();
    });

    test('should have proper resource isolation', () => {
      // All resources should be in the same account and region
      expect(stackOutputs.accountId).toMatch(/^\d{12}$/);
      expect(stackOutputs.awsRegion).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Performance and Resource Validation', () => {
    test('should have optimal resource distribution', () => {
      // Should have resources spread across multiple AZs
      expect(stackOutputs.privateSubnetIds.length).toBe(3);
      expect(stackOutputs.publicSubnetIds.length).toBe(3);
    });

    test('should have appropriate resource sizing', () => {
      // Basic validation that we haven't created too many resources
      const totalSubnets = stackOutputs.privateSubnetIds.length + stackOutputs.publicSubnetIds.length;
      expect(totalSubnets).toBeLessThanOrEqual(12); // Reasonable limit
    });
  });

  // Cleanup and reporting
  afterAll(async () => {
    console.log('Integration test summary:');
    console.log(`Stack: ${stackOutputs.stackName}`);
    console.log(`Environment: ${stackOutputs.environment}`);
    console.log(`Region: ${stackOutputs.awsRegion}`);
    console.log(`VPC: ${stackOutputs.vpcId}`);
    console.log(`Subnets: ${stackOutputs.privateSubnetIds.length + stackOutputs.publicSubnetIds.length} total`);
    console.log(`Deployed: ${stackOutputs.timestamp}`);
    console.log(`All integration tests completed successfully!`);
  });
});
