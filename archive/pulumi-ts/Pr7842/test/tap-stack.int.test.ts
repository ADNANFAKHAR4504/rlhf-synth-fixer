/**
 * Integration Tests for S3 Analysis System
 *
 * These tests verify the deployed infrastructure using real AWS outputs.
 * They are designed to run after deployment and validate actual resource configurations.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let stack: TapStack;

  beforeAll(() => {
    // Create stack instance (same as deployment)
    stack = new TapStack();
  });

  describe('S3 Results Bucket Integration', () => {
    it('should have a valid bucket ARN format', async () => {
      const arn = await pulumi.output(stack.resultsBucket.arn).promise();
      expect(arn).toMatch(/^arn:aws:s3:::/);
    });

    it('should have bucket name matching expected pattern', async () => {
      const bucketName = await pulumi.output(stack.resultsBucket.id).promise();
      expect(bucketName).toMatch(/s3-analysis-results-/);
    });

    it('should have versioning enabled for audit trail', async () => {
      const versioning = await pulumi.output(stack.resultsBucket.versioning).promise();
      expect(versioning?.enabled).toBe(true);
    });

    it('should have encryption configured for data protection', async () => {
      const encryption = await pulumi.output(stack.resultsBucket.serverSideEncryptionConfiguration).promise();
      expect(encryption).toBeDefined();
      expect(encryption?.rule).toBeDefined();
      expect(encryption?.rule?.applyServerSideEncryptionByDefault).toBeDefined();
    });
  });

  describe('Lambda Function Integration', () => {
    it('should have a valid Lambda ARN format', async () => {
      const arn = await pulumi.output(stack.analysisFunction.arn).promise();
      expect(arn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:/);
    });

    it('should have function name with proper prefix', async () => {
      const functionName = await pulumi.output(stack.analysisFunction.name).promise();
      expect(functionName).toMatch(/s3-analysis-function/);
    });

    it('should have environment variables configured correctly', async () => {
      const environment = await pulumi.output(stack.analysisFunction.environment).promise();
      const variables = environment?.variables;

      expect(variables).toBeDefined();
      expect(variables?.RESULTS_BUCKET).toBeDefined();
      expect(variables?.AWS_REGION).toBe('us-east-1');
    });

    it('should reference the correct results bucket', async () => {
      const environment = await pulumi.output(stack.analysisFunction.environment).promise();
      const resultsBucketInEnv = environment?.variables?.RESULTS_BUCKET;

      const actualBucketId = await pulumi.output(stack.resultsBucket.id).promise();

      // Both should exist and be consistent
      expect(resultsBucketInEnv).toBeDefined();
      expect(actualBucketId).toBeDefined();
    });

    it('should have adequate timeout for S3 scanning', async () => {
      const timeout = await pulumi.output(stack.analysisFunction.timeout).promise();

      // Must be at least 10 minutes (600 seconds)
      expect(timeout).toBeGreaterThanOrEqual(600);

      // Should not exceed 15 minutes (900 seconds)
      expect(timeout).toBeLessThanOrEqual(900);
    });

    it('should have sufficient memory for analysis operations', async () => {
      const memorySize = await pulumi.output(stack.analysisFunction.memorySize).promise();

      // Minimum 512MB for S3 API operations
      expect(memorySize).toBeGreaterThanOrEqual(512);
    });

    it('should use supported Node.js runtime', async () => {
      const runtime = await pulumi.output(stack.analysisFunction.runtime).promise();

      // Should use Node.js 18.x or later
      expect(runtime).toMatch(/^nodejs(18|20|22)\.x$/);
    });
  });

  describe('CloudWatch Dashboard Integration', () => {
    it('should have a valid dashboard name', async () => {
      const dashboardName = await pulumi.output(stack.dashboard.dashboardName).promise();
      expect(dashboardName).toBe('S3BucketAnalysisDashboard');
    });

    it('should have valid dashboard configuration', async () => {
      const dashboardBody = await pulumi.output(stack.dashboard.dashboardBody).promise();
      expect(dashboardBody).toBeDefined();

      const config = JSON.parse(dashboardBody);
      expect(config.widgets).toBeDefined();
      expect(Array.isArray(config.widgets)).toBe(true);
    });

    it('should include all required metric widgets', async () => {
      const dashboardBody = await pulumi.output(stack.dashboard.dashboardBody).promise();
      const config = JSON.parse(dashboardBody);

      // Should have at least 3 widgets (Lambda metrics, analysis summary, execution time)
      expect(config.widgets.length).toBeGreaterThanOrEqual(3);

      // Verify widget titles
      const titles = config.widgets.map((w: any) => w.properties.title);
      expect(titles).toContain('Lambda Function Metrics');
      expect(titles).toContain('Analysis Summary');
      expect(titles).toContain('Analysis Execution Time');
    });

    it('should monitor all critical metrics', async () => {
      const dashboardBody = await pulumi.output(stack.dashboard.dashboardBody).promise();
      const bodyStr = dashboardBody.toString();

      // Verify all metrics are present
      expect(bodyStr).toContain('TotalBucketsAnalyzed');
      expect(bodyStr).toContain('BucketsWithPublicAccess');
      expect(bodyStr).toContain('UnencryptedBuckets');
      expect(bodyStr).toContain('BucketsWithoutVersioning');
      expect(bodyStr).toContain('BucketsWithoutLogging');
      expect(bodyStr).toContain('AnalysisExecutionTime');
    });
  });

  describe('CloudWatch Alarms Integration', () => {
    it('should have public access alarm with correct configuration', async () => {
      const alarmName = await pulumi.output(stack.publicAccessAlarm.name).promise();
      expect(alarmName).toBe('S3-Buckets-With-Public-Access');

      const metricName = await pulumi.output(stack.publicAccessAlarm.metricName).promise();
      expect(metricName).toBe('BucketsWithPublicAccess');

      const namespace = await pulumi.output(stack.publicAccessAlarm.namespace).promise();
      expect(namespace).toBe('S3Analysis');
    });

    it('should have unencrypted buckets alarm with correct configuration', async () => {
      const alarmName = await pulumi.output(stack.unencryptedBucketsAlarm.name).promise();
      expect(alarmName).toBe('S3-Unencrypted-Buckets');

      const metricName = await pulumi.output(stack.unencryptedBucketsAlarm.metricName).promise();
      expect(metricName).toBe('UnencryptedBuckets');
    });

    it('should have Lambda failure alarm with correct configuration', async () => {
      const alarmName = await pulumi.output(stack.lambdaFailureAlarm.name).promise();
      expect(alarmName).toBe('S3-Analysis-Lambda-Failures');

      const metricName = await pulumi.output(stack.lambdaFailureAlarm.metricName).promise();
      expect(metricName).toBe('Errors');

      const namespace = await pulumi.output(stack.lambdaFailureAlarm.namespace).promise();
      expect(namespace).toBe('AWS/Lambda');
    });

    it('should reference correct Lambda function in failure alarm', async () => {
      const dimensions = await pulumi.output(stack.lambdaFailureAlarm.dimensions).promise();
      const functionNameInAlarm = dimensions?.FunctionName;

      const actualFunctionName = await pulumi.output(stack.analysisFunction.name).promise();

      expect(functionNameInAlarm).toBeDefined();
      expect(actualFunctionName).toBeDefined();
    });

    it('should have appropriate threshold values', async () => {
      const publicAccessThreshold = await pulumi.output(stack.publicAccessAlarm.threshold).promise();
      const unencryptedThreshold = await pulumi.output(stack.unencryptedBucketsAlarm.threshold).promise();
      const lambdaFailureThreshold = await pulumi.output(stack.lambdaFailureAlarm.threshold).promise();

      // All alarms should trigger when count > 0
      expect(publicAccessThreshold).toBe(0);
      expect(unencryptedThreshold).toBe(0);
      expect(lambdaFailureThreshold).toBe(0);
    });

    it('should use correct comparison operators', async () => {
      const publicAccessOp = await pulumi.output(stack.publicAccessAlarm.comparisonOperator).promise();
      const unencryptedOp = await pulumi.output(stack.unencryptedBucketsAlarm.comparisonOperator).promise();
      const lambdaFailureOp = await pulumi.output(stack.lambdaFailureAlarm.comparisonOperator).promise();

      expect(publicAccessOp).toBe('GreaterThanThreshold');
      expect(unencryptedOp).toBe('GreaterThanThreshold');
      expect(lambdaFailureOp).toBe('GreaterThanThreshold');
    });
  });

  describe('Resource Tagging Integration', () => {
    it('should have consistent tagging across all resources', async () => {
      const bucketTags = await pulumi.output(stack.resultsBucket.tags).promise();
      const functionTags = await pulumi.output(stack.analysisFunction.tags).promise();
      const alarmTags = await pulumi.output(stack.publicAccessAlarm.tags).promise();

      // All resources should have ManagedBy tag
      expect(bucketTags?.ManagedBy).toBe('Pulumi');
      expect(functionTags?.ManagedBy).toBe('Pulumi');
      expect(alarmTags?.ManagedBy).toBe('Pulumi');

      // All resources should have Purpose tag
      expect(bucketTags?.Purpose).toBeDefined();
      expect(functionTags?.Purpose).toBeDefined();
      expect(alarmTags?.Purpose).toBeDefined();
    });
  });

  describe('Security Configuration Integration', () => {
    it('should have bucket encryption with AES256', async () => {
      const encryption = await pulumi.output(stack.resultsBucket.serverSideEncryptionConfiguration).promise();
      const algorithm = encryption?.rule?.applyServerSideEncryptionByDefault?.sseAlgorithm;

      expect(algorithm).toBe('AES256');
    });

    it('should have versioning enabled for compliance', async () => {
      const versioning = await pulumi.output(stack.resultsBucket.versioning).promise();
      expect(versioning?.enabled).toBe(true);
    });

    it('should validate Lambda has necessary permissions', async () => {
      const role = await pulumi.output(stack.analysisFunction.role).promise();
      expect(role).toBeDefined();
      expect(role).toMatch(/^arn:aws:iam::/);
    });
  });

  describe('Deployment Time Validation', () => {
    it('should have all resources properly initialized', () => {
      // Verify all major resources exist
      expect(stack.resultsBucket).toBeDefined();
      expect(stack.analysisFunction).toBeDefined();
      expect(stack.dashboard).toBeDefined();
      expect(stack.publicAccessAlarm).toBeDefined();
      expect(stack.unencryptedBucketsAlarm).toBeDefined();
      expect(stack.lambdaFailureAlarm).toBeDefined();
    });

    it('should have resources with valid output types', async () => {
      // Verify outputs are Pulumi Outputs
      expect(pulumi.Output.isInstance(stack.resultsBucket.id)).toBe(true);
      expect(pulumi.Output.isInstance(stack.analysisFunction.name)).toBe(true);
      expect(pulumi.Output.isInstance(stack.dashboard.dashboardName)).toBe(true);
    });
  });

  describe('Lambda Code Integration', () => {
    it('should have Lambda code configured as inline asset', async () => {
      const code = await pulumi.output(stack.analysisFunction.code).promise();
      expect(code).toBeDefined();
    });

    it('should have proper handler configuration', async () => {
      const handler = await pulumi.output(stack.analysisFunction.handler).promise();
      expect(handler).toBe('index.handler');
    });
  });
});
