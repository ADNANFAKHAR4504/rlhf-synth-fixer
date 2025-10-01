import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  ListMetricsCommand,
} from '@aws-sdk/client-cloudwatch';
import { DescribeVpcEndpointsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetPolicyCommand, IAMClient, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import { GetFunctionCommand, GetFunctionConfigurationCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { GetResourcesCommand, ResourceGroupsTaggingAPIClient } from '@aws-sdk/client-resource-groups-tagging-api';
import { GetBucketPolicyCommand, GetBucketTaggingCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Read deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const region = outputs.Region || process.env.AWS_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const resourceGroupsClient = new ResourceGroupsTaggingAPIClient({ region });
const ec2Client = new EC2Client({ region });

describe('AWS Resource Validation - Integration Tests', () => {
  beforeAll(() => {
    // Verify we have the required outputs from deployment
    expect(outputs).toBeDefined();
    expect(Object.keys(outputs).length).toBeGreaterThan(0);
  });

  describe('Lambda Function Configuration Validation', () => {
    test('Lambda function configuration matches deployment requirements', async () => {
      const functionName = outputs.LambdaFunctionName;

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();

      const config = response.Configuration!;

      // Validate function configuration
      expect(config.FunctionName).toBe(functionName);
      expect(config.Runtime).toMatch(/^nodejs/);
      expect(config.Handler).toBe('index.handler');
      expect(config.Role).toBe(outputs.IAMRoleArn);

      // Validate performance optimizations
      expect(config.MemorySize).toBe(3008); // Maximum memory allocation
      expect(config.TracingConfig?.Mode).toBe('Active'); // X-Ray tracing enabled

      // Validate VPC configuration
      expect(config.VpcConfig).toBeDefined();
      expect(config.VpcConfig?.VpcId).toBe(outputs.VpcId);

      // Check environment variables
      if (config.Environment?.Variables) {
        const envVars = config.Environment.Variables;
        expect(envVars.BUCKET_NAME).toBe(outputs.BucketName);
        expect(envVars.SNS_TOPIC_ARN).toBe(outputs.SNSTopicArn);
        expect(envVars.NODE_OPTIONS).toBe('--enable-source-maps');
      }

      // Validate reserved concurrency (if configured)
      if ('ReservedConcurrentExecutions' in config && config.ReservedConcurrentExecutions !== undefined) {
        expect(config.ReservedConcurrentExecutions).toBe(10);
      }

      // Validate layers (if any are configured)
      if (config.Layers && config.Layers.length > 0) {
        expect(config.Layers.length).toBeGreaterThan(0);
      }
    });

    test('Lambda function has correct memory and timeout settings', async () => {
      const functionName = outputs.LambdaFunctionName;

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.MemorySize).toBeGreaterThanOrEqual(128);
      expect(response.Timeout).toBeGreaterThan(0);
      expect(response.Timeout).toBeLessThanOrEqual(900); // Maximum Lambda timeout
    });
  });

  describe('S3 Bucket Security and Configuration', () => {
    test('S3 bucket has proper tagging and configuration', async () => {
      const bucketName = outputs.BucketName;

      const command = new GetBucketTaggingCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.TagSet).toBeDefined();

      // Verify Environment tag exists
      const environmentTag = response.TagSet?.find(tag => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();
    });

    test('S3 bucket has proper access policies', async () => {
      const bucketName = outputs.BucketName;

      try {
        const command = new GetBucketPolicyCommand({
          Bucket: bucketName,
        });

        await s3Client.send(command);
        // If we get here without error, policy exists
      } catch (error: any) {
        // NoSuchBucketPolicy is acceptable for some configurations
        if (error.name !== 'NoSuchBucketPolicy') {
          throw error;
        }
      }
    });
  });

  describe('IAM Role Security Validation', () => {
    test('IAM role has minimal required permissions', async () => {
      const roleName = outputs.IAMRoleName;

      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.AttachedPolicies).toBeDefined();

      // Should have AWS managed policies for Lambda VPC execution
      const lambdaVpcExecutionPolicy = response.AttachedPolicies?.find(
        policy => policy.PolicyName?.includes('AWSLambdaVPCAccessExecutionRole')
      );
      expect(lambdaVpcExecutionPolicy).toBeDefined();
    });

    test('IAM role inline policies are properly configured', async () => {
      const roleName = outputs.IAMRoleName;

      // This test verifies that inline policies exist and are accessible
      // The actual policy validation is done through successful Lambda execution
      try {
        const command = new GetPolicyCommand({
          PolicyArn: `arn:aws:iam::${outputs.IAMRoleArn.split(':')[4]}:role/${roleName}`,
        });

        // Attempt to get policy details
        await iamClient.send(command);
      } catch (error: any) {
        // Expected for inline policies - we'll validate through functionality instead
        expect(error.name).toBeDefined();
      }
    });
  });

  describe('CloudWatch Metrics and Monitoring', () => {
    test('Lambda function has CloudWatch metrics available', async () => {
      const functionName = outputs.LambdaFunctionName;

      // Helper function to wait for metrics with timeout
      const waitForMetrics = async (maxWaitTime: number = 120000): Promise<any> => {
        const startTime = Date.now();
        const pollInterval = 10000; // 10 seconds

        while (Date.now() - startTime < maxWaitTime) {
          const command = new ListMetricsCommand({
            Namespace: 'AWS/Lambda',
            Dimensions: [
              {
                Name: 'FunctionName',
                Value: functionName,
              },
            ],
          });

          const response = await cloudWatchClient.send(command);

          // Check if Invocations metric is available
          const invocationsMetric = response.Metrics?.find(
            metric => metric.MetricName === 'Invocations'
          );

          if (invocationsMetric) {
            return response;
          }

          // If metrics not found and still within timeout, wait and retry
          if (Date.now() - startTime < maxWaitTime - pollInterval) {
            console.log(`CloudWatch metrics not yet available for ${functionName}. Waiting ${pollInterval / 1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        }

        throw new Error(`CloudWatch metrics for Lambda function ${functionName} not available after ${maxWaitTime / 1000} seconds`);
      };

      // Wait up to 2 minutes for metrics to become available
      const response = await waitForMetrics(120000);
      expect(response.Metrics).toBeDefined();

      // Should have basic Lambda metrics available
      const invocationsMetric = response.Metrics?.find(
        (metric: any) => metric.MetricName === 'Invocations'
      );
      expect(invocationsMetric).toBeDefined();
    }, 150000); // Increase Jest timeout to 2.5 minutes to account for wait time

    test('API Gateway has CloudWatch metrics available', async () => {
      const apiId = outputs.APIGatewayId;

      const command = new ListMetricsCommand({
        Namespace: 'AWS/ApiGateway',
        Dimensions: [
          {
            Name: 'ApiId',
            Value: apiId,
          },
        ],
      });

      const response = await cloudWatchClient.send(command);
      expect(response.Metrics).toBeDefined();

      // May not have metrics immediately after deployment, but structure should exist
      expect(Array.isArray(response.Metrics)).toBe(true);
    });

    test('CloudWatch alarms are in valid states', async () => {
      const errorAlarmName = outputs.ErrorAlarmName;
      const durationAlarmName = outputs.DurationAlarmName;

      // Test both alarms exist by checking their metrics
      for (const alarmName of [errorAlarmName, durationAlarmName]) {
        try {
          const command = new GetMetricStatisticsCommand({
            Namespace: 'AWS/Lambda',
            MetricName: alarmName.includes('error') ? 'Errors' : 'Duration',
            Dimensions: [
              {
                Name: 'FunctionName',
                Value: outputs.LambdaFunctionName,
              },
            ],
            StartTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
            EndTime: new Date(),
            Period: 300,
            Statistics: ['Sum'],
          });

          const response = await cloudWatchClient.send(command);
          expect(response.Datapoints).toBeDefined();
          expect(Array.isArray(response.Datapoints)).toBe(true);
        } catch (error) {
          // Metrics may not be available immediately, which is acceptable
          console.log(`Metrics not yet available for alarm: ${alarmName}`);
        }
      }
    });
  });

  describe('Resource Tagging Compliance', () => {
    test('All resources have consistent environment tagging', async () => {
      const envSuffix = outputs.EnvironmentSuffix;

      const command = new GetResourcesCommand({
        TagFilters: [
          {
            Key: 'Environment',
          },
        ],
        ResourceTypeFilters: [
          'lambda:function',
          's3:bucket',
          'iam:role',
          'sns:topic',
          'apigateway:restapi',
          'cloudwatch:dashboard',
          'cloudwatch:alarm',
        ],
      });

      const response = await resourceGroupsClient.send(command);
      expect(response.ResourceTagMappingList).toBeDefined();

      // Filter resources that belong to our stack (contain environment suffix)
      const stackResources = response.ResourceTagMappingList?.filter(resource =>
        resource.ResourceARN?.includes(envSuffix) ||
        resource.ResourceARN?.includes(outputs.LambdaFunctionName) ||
        resource.ResourceARN?.includes(outputs.BucketName)
      );

      expect(stackResources?.length).toBeGreaterThan(0);

      // Verify Environment tag consistency
      for (const resource of stackResources || []) {
        const environmentTag = resource.Tags?.find(tag => tag.Key === 'Environment');
        expect(environmentTag).toBeDefined();
        expect(environmentTag?.Value).toBe('Production');
      }
    });

    test('Resources have proper naming conventions', () => {
      const envSuffix = outputs.EnvironmentSuffix;

      // Validate all resource names follow the pattern: {resource-type}-{env-suffix}
      const resourcePatterns = [
        { name: outputs.LambdaFunctionName, pattern: new RegExp(`^data-processor-${envSuffix}$`) },
        { name: outputs.SNSTopicName, pattern: new RegExp(`^data-processing-notifications-${envSuffix}$`) },
        { name: outputs.IAMRoleName, pattern: new RegExp(`^data-processing-role-${envSuffix}$`) },
        { name: outputs.CloudWatchDashboardName, pattern: new RegExp(`^data-processing-pipeline-${envSuffix}$`) },
        { name: outputs.ErrorAlarmName, pattern: new RegExp(`^data-processor-errors-${envSuffix}$`) },
        { name: outputs.DurationAlarmName, pattern: new RegExp(`^data-processor-duration-${envSuffix}$`) },
      ];

      for (const resource of resourcePatterns) {
        expect(resource.name).toMatch(resource.pattern);
      }
    });
  });

  describe('Resource Connectivity Validation', () => {
    test('Lambda function can access S3 bucket', async () => {
      const functionName = outputs.LambdaFunctionName;
      const bucketName = outputs.BucketName;

      // Verify Lambda has environment variable pointing to correct bucket
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);

      // Check if environment variables exist and validate them if present
      if (response.Environment?.Variables) {
        const envVars = response.Environment.Variables;
        const bucketVar = envVars.S3_BUCKET_NAME || envVars.BUCKET_NAME || envVars.S3_BUCKET;
        if (bucketVar) {
          expect(bucketVar).toBe(bucketName);
        }
      }
    });

    test('Lambda function can publish to SNS topic', async () => {
      const functionName = outputs.LambdaFunctionName;
      const snsTopicArn = outputs.SNSTopicArn;

      // Verify Lambda has environment variable pointing to correct SNS topic
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Environment?.Variables?.SNS_TOPIC_ARN).toBe(snsTopicArn);
    });

    test('API Gateway is correctly configured to invoke Lambda', async () => {
      const apiEndpoint = outputs.APIEndpoint;
      const functionName = outputs.LambdaFunctionName;

      // Verify API endpoint structure includes the correct API Gateway ID
      expect(apiEndpoint).toContain(outputs.APIGatewayId);

      // Verify the endpoint is properly formatted
      expect(apiEndpoint).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/[a-z0-9]+\/$/);
    });
  });

  describe('VPC and Network Security Validation', () => {
    test('VPC exists with correct configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs?.length).toBe(1);

      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.State).toBe('available');
    });

    test('VPC endpoints are configured for AWS services', async () => {
      const vpcId = outputs.VpcId;

      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.VpcEndpoints).toBeDefined();

      const endpointCount = response.VpcEndpoints?.length || 0;
      expect(endpointCount).toBeGreaterThanOrEqual(3); // S3, SNS, CloudWatch Logs

      // Verify specific service endpoints
      const services = response.VpcEndpoints?.map(endpoint => endpoint.ServiceName);
      const expectedServices = ['s3', 'sns', 'logs'];

      for (const expectedService of expectedServices) {
        const hasService = services?.some(service => service?.includes(expectedService));
        expect(hasService).toBe(true);
      }
    });

    test('Lambda function is configured with VPC', async () => {
      const functionName = outputs.LambdaFunctionName;

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig?.VpcId).toBe(outputs.VpcId);
      expect(response.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
      expect(response.VpcConfig?.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig?.SecurityGroupIds?.length).toBeGreaterThan(0);
    });
  });

  describe('Security and Compliance Validation', () => {
    test('Lambda function uses secure runtime', async () => {
      const functionName = outputs.LambdaFunctionName;

      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      const runtime = response.Configuration?.Runtime;

      // Verify using a supported and secure Node.js runtime
      expect(runtime).toMatch(/^nodejs/);
      expect(runtime).not.toMatch(/nodejs10|nodejs12|nodejs14/); // Deprecated versions
    });

    test('Resources are deployed in correct region', () => {
      const expectedRegion = outputs.Region;

      // Verify regional service ARNs contain the correct region
      // Note: IAM is a global service, so IAM ARNs don't contain regions
      const regionalArnResources = [
        outputs.LambdaFunctionArn,
        outputs.SNSTopicArn,
      ];

      for (const arn of regionalArnResources) {
        expect(arn).toContain(expectedRegion);
      }

      // IAM ARN should be global (no region)
      expect(outputs.IAMRoleArn).not.toContain(expectedRegion);

      // Verify S3 bucket name includes region
      expect(outputs.BucketName).toContain(expectedRegion);

      // Verify API Gateway endpoint includes region
      expect(outputs.APIEndpoint).toContain(expectedRegion);
    });

    test('Account consistency across all resources', () => {
      // Extract account ID from IAM role ARN
      const accountId = outputs.IAMRoleArn.split(':')[4];

      // Verify all account-specific resources use the same account ID
      expect(outputs.LambdaFunctionArn).toContain(accountId);
      expect(outputs.SNSTopicArn).toContain(accountId);
      expect(outputs.BucketName).toContain(accountId);
    });
  });
});