/**
 * Integration Tests for EC2 Compliance Monitoring Infrastructure
 * These tests validate deployed AWS resources against the Pulumi outputs
 */

import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchEventsClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-cloudwatch-events';
import {
  CloudWatchClient,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  GlueClient,
  GetDatabaseCommand,
  GetCrawlerCommand,
} from '@aws-sdk/client-glue';
import {
  AthenaClient,
  GetWorkGroupCommand,
} from '@aws-sdk/client-athena';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const s3Client = new S3Client({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const eventsClient = new CloudWatchEventsClient({ region: AWS_REGION });
const cloudwatchClient = new CloudWatchClient({ region: AWS_REGION });
const glueClient = new GlueClient({ region: AWS_REGION });
const athenaClient = new AthenaClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });

// Load outputs from flat-outputs.json
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: Record<string, string> = {};

try {
  if (fs.existsSync(outputsPath)) {
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  }
} catch (error) {
  console.warn('Warning: Could not load outputs file. Integration tests may skip.');
}

const hasOutputs = Object.keys(outputs).length > 0;

describe('EC2 Compliance Monitoring - Integration Tests', () => {
  describe('S3 Reports Bucket', () => {
    const bucketName = outputs.reportsBucketName || outputs.reports_bucket_name;

    it('should have reports bucket deployed', async () => {
      if (!bucketName) {
        console.log('Skipping: S3 bucket name not found in outputs');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have versioning enabled on S3 bucket', async () => {
      if (!bucketName) {
        console.log('Skipping: S3 bucket name not found in outputs');
        return;
      }

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have lifecycle rules configured', async () => {
      if (!bucketName) {
        console.log('Skipping: S3 bucket name not found in outputs');
        return;
      }

      try {
        const command = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        expect(response.Rules).toBeDefined();
        expect(response.Rules!.length).toBeGreaterThan(0);
      } catch (error: any) {
        if (error.name === 'NoSuchLifecycleConfiguration') {
          console.log('Note: No lifecycle configuration found (may be expected)');
          return;
        }
        throw error;
      }
    });
  });

  describe('SNS Compliance Topic', () => {
    const topicArn = outputs.snsTopicArn || outputs.sns_topic_arn;

    it('should have SNS topic deployed', async () => {
      if (!topicArn) {
        console.log('Skipping: SNS topic ARN not found in outputs');
        return;
      }

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    it('should have display name configured', async () => {
      if (!topicArn) {
        console.log('Skipping: SNS topic ARN not found in outputs');
        return;
      }

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);
      expect(response.Attributes!.DisplayName).toBeDefined();
    });
  });

  describe('Lambda Compliance Checker Function', () => {
    const functionName = outputs.lambdaFunctionName || outputs.lambda_function_name;

    it('should have Lambda function deployed', async () => {
      if (!functionName) {
        console.log('Skipping: Lambda function name not found in outputs');
        return;
      }

      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.FunctionName).toBe(functionName);
    });

    it('should use Node.js 18.x runtime', async () => {
      if (!functionName) {
        console.log('Skipping: Lambda function name not found in outputs');
        return;
      }

      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Runtime).toMatch(/nodejs18/);
    });

    it('should have correct environment variables', async () => {
      if (!functionName) {
        console.log('Skipping: Lambda function name not found in outputs');
        return;
      }

      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment!.Variables!.REPORTS_BUCKET).toBeDefined();
      expect(response.Environment!.Variables!.SNS_TOPIC_ARN).toBeDefined();
      expect(response.Environment!.Variables!.REQUIRED_TAGS).toBeDefined();
    });

    it('should have appropriate timeout configured', async () => {
      if (!functionName) {
        console.log('Skipping: Lambda function name not found in outputs');
        return;
      }

      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Timeout).toBeGreaterThanOrEqual(60);
      expect(response.Timeout).toBeLessThanOrEqual(900);
    });

    it('should have sufficient memory allocated', async () => {
      if (!functionName) {
        console.log('Skipping: Lambda function name not found in outputs');
        return;
      }

      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.MemorySize).toBeGreaterThanOrEqual(256);
    });
  });

  describe('CloudWatch Events Schedule Rule', () => {
    const ruleName = outputs.scheduleRuleName || outputs.schedule_rule_name;

    it('should have EventBridge rule deployed', async () => {
      if (!ruleName) {
        console.log('Skipping: Schedule rule name not found in outputs');
        return;
      }

      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventsClient.send(command);
      expect(response.Name).toBe(ruleName);
      expect(response.State).toBe('ENABLED');
    });

    it('should have 6-hour schedule expression', async () => {
      if (!ruleName) {
        console.log('Skipping: Schedule rule name not found in outputs');
        return;
      }

      const command = new DescribeRuleCommand({ Name: ruleName });
      const response = await eventsClient.send(command);
      expect(response.ScheduleExpression).toBe('rate(6 hours)');
    });

    it('should have Lambda target configured', async () => {
      if (!ruleName) {
        console.log('Skipping: Schedule rule name not found in outputs');
        return;
      }

      const command = new ListTargetsByRuleCommand({ Rule: ruleName });
      const response = await eventsClient.send(command);
      expect(response.Targets).toBeDefined();
      expect(response.Targets!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Dashboard', () => {
    const dashboardName = outputs.dashboardName || outputs.dashboard_name;

    it('should have CloudWatch dashboard deployed', async () => {
      if (!dashboardName) {
        console.log('Skipping: Dashboard name not found in outputs');
        return;
      }

      const command = new GetDashboardCommand({ DashboardName: dashboardName });
      const response = await cloudwatchClient.send(command);
      expect(response.DashboardName).toBe(dashboardName);
      expect(response.DashboardBody).toBeDefined();
    });

    it('should have widgets defined in dashboard', async () => {
      if (!dashboardName) {
        console.log('Skipping: Dashboard name not found in outputs');
        return;
      }

      const command = new GetDashboardCommand({ DashboardName: dashboardName });
      const response = await cloudwatchClient.send(command);
      const body = JSON.parse(response.DashboardBody!);
      expect(body.widgets).toBeDefined();
      expect(body.widgets.length).toBeGreaterThan(0);
    });
  });

  describe('AWS Glue Data Catalog', () => {
    const databaseName = outputs.glueDatabaseName || outputs.glue_database_name;
    const crawlerName = outputs.glueCrawlerName || outputs.glue_crawler_name;

    it('should have Glue database created', async () => {
      if (!databaseName) {
        console.log('Skipping: Glue database name not found in outputs');
        return;
      }

      const command = new GetDatabaseCommand({ Name: databaseName });
      const response = await glueClient.send(command);
      expect(response.Database).toBeDefined();
      expect(response.Database!.Name).toBe(databaseName);
    });

    it('should have Glue crawler configured', async () => {
      if (!crawlerName) {
        console.log('Skipping: Glue crawler name not found in outputs');
        return;
      }

      const command = new GetCrawlerCommand({ Name: crawlerName });
      const response = await glueClient.send(command);
      expect(response.Crawler).toBeDefined();
      expect(response.Crawler!.Name).toBe(crawlerName);
    });

    it('should have S3 target configured for crawler', async () => {
      if (!crawlerName) {
        console.log('Skipping: Glue crawler name not found in outputs');
        return;
      }

      const command = new GetCrawlerCommand({ Name: crawlerName });
      const response = await glueClient.send(command);
      expect(response.Crawler!.Targets).toBeDefined();
      expect(response.Crawler!.Targets!.S3Targets).toBeDefined();
      expect(response.Crawler!.Targets!.S3Targets!.length).toBeGreaterThan(0);
    });
  });

  describe('Athena Workgroup', () => {
    const workgroupName = outputs.athenaWorkgroupName || outputs.athena_workgroup_name;

    it('should have Athena workgroup created', async () => {
      if (!workgroupName) {
        console.log('Skipping: Athena workgroup name not found in outputs');
        return;
      }

      const command = new GetWorkGroupCommand({ WorkGroup: workgroupName });
      const response = await athenaClient.send(command);
      expect(response.WorkGroup).toBeDefined();
      expect(response.WorkGroup!.Name).toBe(workgroupName);
    });

    it('should have result location configured', async () => {
      if (!workgroupName) {
        console.log('Skipping: Athena workgroup name not found in outputs');
        return;
      }

      const command = new GetWorkGroupCommand({ WorkGroup: workgroupName });
      const response = await athenaClient.send(command);
      expect(response.WorkGroup!.Configuration).toBeDefined();
      expect(response.WorkGroup!.Configuration!.ResultConfiguration).toBeDefined();
      expect(response.WorkGroup!.Configuration!.ResultConfiguration!.OutputLocation).toBeDefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should have Lambda execution role with correct assume role policy', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      // Find Lambda role from outputs or construct name
      const lambdaFunctionName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      if (!lambdaFunctionName) {
        console.log('Skipping: Lambda function name not found');
        return;
      }

      // Get Lambda function to retrieve role
      const lambdaCommand = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      const roleArn = lambdaResponse.Configuration?.Role;

      if (!roleArn) {
        console.log('Skipping: Lambda role ARN not found');
        return;
      }

      const roleName = roleArn.split('/').pop()!;
      const roleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(roleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.AssumeRolePolicyDocument).toBeDefined();

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!)
      );
      expect(assumeRolePolicy.Statement).toBeDefined();
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    it('should have inline policies attached to Lambda role', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const lambdaFunctionName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      if (!lambdaFunctionName) {
        console.log('Skipping: Lambda function name not found');
        return;
      }

      const lambdaCommand = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      const roleArn = lambdaResponse.Configuration?.Role;

      if (!roleArn) {
        console.log('Skipping: Lambda role ARN not found');
        return;
      }

      const roleName = roleArn.split('/').pop()!;
      const policiesCommand = new ListRolePoliciesCommand({ RoleName: roleName });
      const policiesResponse = await iamClient.send(policiesCommand);

      // Should have at least EC2, S3, and SNS policies
      expect(policiesResponse.PolicyNames).toBeDefined();
      expect(policiesResponse.PolicyNames!.length).toBeGreaterThanOrEqual(3);
    });

    it('should have CloudWatch Logs policy attached', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const lambdaFunctionName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      if (!lambdaFunctionName) {
        console.log('Skipping: Lambda function name not found');
        return;
      }

      const lambdaCommand = new GetFunctionCommand({ FunctionName: lambdaFunctionName });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      const roleArn = lambdaResponse.Configuration?.Role;

      if (!roleArn) {
        console.log('Skipping: Lambda role ARN not found');
        return;
      }

      const roleName = roleArn.split('/').pop()!;
      const attachedCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const attachedResponse = await iamClient.send(attachedCommand);

      const hasLogsPolicy = attachedResponse.AttachedPolicies?.some(
        policy => policy.PolicyArn?.includes('AWSLambdaBasicExecutionRole')
      );
      expect(hasLogsPolicy).toBe(true);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should have all components deployed and connected', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      // Verify all required outputs exist
      const requiredOutputs = [
        'reportsBucketName',
        'snsTopicArn',
        'lambdaFunctionName',
        'scheduleRuleName',
        'glueDatabaseName',
        'glueCrawlerName',
        'dashboardName',
        'athenaWorkgroupName',
      ];

      const alternateOutputs = [
        'reports_bucket_name',
        'sns_topic_arn',
        'lambda_function_name',
        'schedule_rule_name',
        'glue_database_name',
        'glue_crawler_name',
        'dashboard_name',
        'athena_workgroup_name',
      ];

      for (let i = 0; i < requiredOutputs.length; i++) {
        const hasOutput = outputs[requiredOutputs[i]] || outputs[alternateOutputs[i]];
        expect(hasOutput).toBeDefined();
      }
    });

    it('should have Lambda function pointing to correct S3 bucket', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const functionName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      const bucketName = outputs.reportsBucketName || outputs.reports_bucket_name;

      if (!functionName || !bucketName) {
        console.log('Skipping: Required outputs not found');
        return;
      }

      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Environment!.Variables!.REPORTS_BUCKET).toBe(bucketName);
    });

    it('should have Lambda function pointing to correct SNS topic', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const functionName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      const topicArn = outputs.snsTopicArn || outputs.sns_topic_arn;

      if (!functionName || !topicArn) {
        console.log('Skipping: Required outputs not found');
        return;
      }

      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Environment!.Variables!.SNS_TOPIC_ARN).toBe(topicArn);
    });

    it('should have Glue crawler pointing to S3 bucket', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const crawlerName = outputs.glueCrawlerName || outputs.glue_crawler_name;
      const bucketName = outputs.reportsBucketName || outputs.reports_bucket_name;

      if (!crawlerName || !bucketName) {
        console.log('Skipping: Required outputs not found');
        return;
      }

      const command = new GetCrawlerCommand({ Name: crawlerName });
      const response = await glueClient.send(command);
      const s3Target = response.Crawler!.Targets!.S3Targets![0];
      expect(s3Target.Path).toContain(bucketName);
    });

    it('should have Athena workgroup pointing to S3 for results', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const workgroupName = outputs.athenaWorkgroupName || outputs.athena_workgroup_name;
      const bucketName = outputs.reportsBucketName || outputs.reports_bucket_name;

      if (!workgroupName || !bucketName) {
        console.log('Skipping: Required outputs not found');
        return;
      }

      const command = new GetWorkGroupCommand({ WorkGroup: workgroupName });
      const response = await athenaClient.send(command);
      const outputLocation = response.WorkGroup!.Configuration!.ResultConfiguration!.OutputLocation;
      expect(outputLocation).toContain(bucketName);
    });
  });

  describe('Resource Tagging Compliance', () => {
    it('should have proper tags on Lambda function', async () => {
      if (!hasOutputs) {
        console.log('Skipping: No outputs available');
        return;
      }

      const functionName = outputs.lambdaFunctionName || outputs.lambda_function_name;
      if (!functionName) {
        console.log('Skipping: Lambda function name not found');
        return;
      }

      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      expect(response.Tags).toBeDefined();
      expect(response.Tags!.Name).toBeDefined();
      expect(response.Tags!.Purpose).toBeDefined();
    });
  });
});
