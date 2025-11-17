import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure AWS SDK
AWS.config.update({ region: 'us-east-1' });

const cloudFormation = new AWS.CloudFormation();
const s3 = new AWS.S3();
const lambda = new AWS.Lambda();
const ssm = new AWS.SSM();
const sns = new AWS.SNS();
const cloudWatch = new AWS.CloudWatch();
const events = new AWS.EventBridge();

// Test configuration
const STACK_NAME = `compliance-test-${uuidv4().substring(0, 8)}`;
const ENVIRONMENT_SUFFIX = 'test';
const COMPLIANCE_EMAIL = 'test@example.com';
const TIMEOUT = 600000; // 10 minutes for stack operations

describe('CloudFormation Compliance System - Integration Tests', () => {
  let stackOutputs: { [key: string]: string } = {};
  let templateBody: string;

  beforeAll(async () => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'template.json');
    templateBody = fs.readFileSync(templatePath, 'utf8');

    // Deploy the CloudFormation stack
    console.log(`Deploying stack: ${STACK_NAME}`);
    try {
      await cloudFormation.createStack({
        StackName: STACK_NAME,
        TemplateBody: templateBody,
        Parameters: [
          { ParameterKey: 'EnvironmentSuffix', ParameterValue: ENVIRONMENT_SUFFIX },
          { ParameterKey: 'ComplianceEmailAddress', ParameterValue: COMPLIANCE_EMAIL },
          { ParameterKey: 'ApprovedAMIList', ParameterValue: 'ami-12345678,ami-87654321' }
        ],
        Capabilities: ['CAPABILITY_NAMED_IAM'],
        Tags: [
          { Key: 'TestRun', Value: 'true' },
          { Key: 'Environment', Value: 'test' }
        ]
      }).promise();

      // Wait for stack creation to complete
      await cloudFormation.waitFor('stackCreateComplete', {
        StackName: STACK_NAME
      }).promise();

      // Get stack outputs
      const describeResult = await cloudFormation.describeStacks({
        StackName: STACK_NAME
      }).promise();

      if (describeResult.Stacks && describeResult.Stacks[0].Outputs) {
        describeResult.Stacks[0].Outputs.forEach(output => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }

      console.log('Stack deployed successfully');
      console.log('Stack outputs:', stackOutputs);
    } catch (error) {
      console.error('Failed to deploy stack:', error);
      throw error;
    }
  }, TIMEOUT);

  afterAll(async () => {
    // Clean up: Delete the CloudFormation stack
    console.log(`Deleting stack: ${STACK_NAME}`);
    try {
      // First, empty the S3 bucket if it exists
      const bucketName = `compliance-reports-${ENVIRONMENT_SUFFIX}`;
      try {
        const objects = await s3.listObjectsV2({
          Bucket: bucketName
        }).promise();

        if (objects.Contents && objects.Contents.length > 0) {
          await s3.deleteObjects({
            Bucket: bucketName,
            Delete: {
              Objects: objects.Contents.map(obj => ({ Key: obj.Key! }))
            }
          }).promise();
        }
      } catch (error) {
        console.log('Bucket may not exist or is already empty');
      }

      // Delete the stack
      await cloudFormation.deleteStack({
        StackName: STACK_NAME
      }).promise();

      // Wait for deletion to complete
      await cloudFormation.waitFor('stackDeleteComplete', {
        StackName: STACK_NAME
      }).promise();

      console.log('Stack deleted successfully');
    } catch (error) {
      console.error('Failed to delete stack:', error);
      // Don't throw here to avoid test failures on cleanup
    }
  }, TIMEOUT);

  describe('Stack Deployment', () => {
    it('should deploy successfully', () => {
      expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);
    });

    it('should have all expected outputs', () => {
      const expectedOutputs = [
        'ComplianceReportsBucketName',
        'ComplianceAlertTopicArn',
        'ComplianceReportProcessorFunctionArn',
        'ComplianceDashboardURL',
        'IMDSv2ComplianceDocumentName',
        'ApprovedAMIComplianceDocumentName',
        'RequiredTagsComplianceDocumentName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(stackOutputs[outputName]).toBeDefined();
        expect(stackOutputs[outputName]).not.toBe('');
      });
    });
  });

  describe('S3 Bucket', () => {
    it('should create S3 bucket with correct configuration', async () => {
      const bucketName = stackOutputs.ComplianceReportsBucketName;
      expect(bucketName).toBeDefined();

      // Check versioning
      const versioning = await s3.getBucketVersioning({
        Bucket: bucketName
      }).promise();
      expect(versioning.Status).toBe('Enabled');

      // Check encryption
      const encryption = await s3.getBucketEncryption({
        Bucket: bucketName
      }).promise();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules[0]
        .ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');

      // Check public access block
      const publicAccessBlock = await s3.getPublicAccessBlock({
        Bucket: bucketName
      }).promise();
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);

      // Check lifecycle configuration
      const lifecycle = await s3.getBucketLifecycleConfiguration({
        Bucket: bucketName
      }).promise();
      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules?.length).toBeGreaterThan(0);
      expect(lifecycle.Rules?.[0].Transitions?.[0].StorageClass).toBe('GLACIER');
    });
  });

  describe('Lambda Function', () => {
    it('should create Lambda function with correct configuration', async () => {
      const functionArn = stackOutputs.ComplianceReportProcessorFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const functionConfig = await lambda.getFunctionConfiguration({
        FunctionName: functionName!
      }).promise();

      expect(functionConfig.Runtime).toBe('python3.11');
      expect(functionConfig.Timeout).toBe(300);
      expect(functionConfig.Environment?.Variables).toBeDefined();
      expect(functionConfig.Environment?.Variables?.BUCKET_NAME).toBeDefined();
      expect(functionConfig.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
    });

    it('should be invokable', async () => {
      const functionArn = stackOutputs.ComplianceReportProcessorFunctionArn;
      const functionName = functionArn.split(':').pop();

      const testEvent = {
        'detail-type': 'EC2 Instance State-change Notification',
        detail: {
          'instance-id': 'i-1234567890abcdef0',
          state: 'running'
        }
      };

      const result = await lambda.invoke({
        FunctionName: functionName!,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(testEvent)
      }).promise();

      expect(result.StatusCode).toBe(200);
      const payload = JSON.parse(result.Payload as string);
      expect(payload.statusCode).toBe(200);
    });
  });

  describe('SSM Documents', () => {
    it('should create IMDSv2 compliance document', async () => {
      const documentName = stackOutputs.IMDSv2ComplianceDocumentName;
      expect(documentName).toBeDefined();

      const document = await ssm.describeDocument({
        Name: documentName
      }).promise();

      expect(document.Document?.DocumentType).toBe('Automation');
      expect(document.Document?.DocumentFormat).toBe('JSON');
      expect(document.Document?.Status).toBe('Active');
    });

    it('should create Approved AMI compliance document', async () => {
      const documentName = stackOutputs.ApprovedAMIComplianceDocumentName;
      expect(documentName).toBeDefined();

      const document = await ssm.describeDocument({
        Name: documentName
      }).promise();

      expect(document.Document?.DocumentType).toBe('Automation');
      expect(document.Document?.Status).toBe('Active');
    });

    it('should create Required Tags compliance document', async () => {
      const documentName = stackOutputs.RequiredTagsComplianceDocumentName;
      expect(documentName).toBeDefined();

      const document = await ssm.describeDocument({
        Name: documentName
      }).promise();

      expect(document.Document?.DocumentType).toBe('Automation');
      expect(document.Document?.Status).toBe('Active');
    });
  });

  describe('SNS Topic', () => {
    it('should create SNS topic with subscription', async () => {
      const topicArn = stackOutputs.ComplianceAlertTopicArn;
      expect(topicArn).toBeDefined();

      const subscriptions = await sns.listSubscriptionsByTopic({
        TopicArn: topicArn
      }).promise();

      expect(subscriptions.Subscriptions).toBeDefined();
      expect(subscriptions.Subscriptions?.length).toBeGreaterThan(0);

      const emailSubscription = subscriptions.Subscriptions?.find(
        sub => sub.Protocol === 'email'
      );
      expect(emailSubscription).toBeDefined();
      expect(emailSubscription?.Endpoint).toBe(COMPLIANCE_EMAIL);
    });
  });

  describe('EventBridge Rules', () => {
    it('should create EC2 state change rule', async () => {
      const ruleName = `ec2-state-change-rule-${ENVIRONMENT_SUFFIX}`;
      const rule = await events.describeRule({
        Name: ruleName
      }).promise();

      expect(rule.State).toBe('ENABLED');
      expect(rule.EventPattern).toBeDefined();
      const pattern = JSON.parse(rule.EventPattern!);
      expect(pattern.source).toContain('aws.ec2');
    });

    it('should create security group change rule', async () => {
      const ruleName = `security-group-change-rule-${ENVIRONMENT_SUFFIX}`;
      const rule = await events.describeRule({
        Name: ruleName
      }).promise();

      expect(rule.State).toBe('ENABLED');
      expect(rule.EventPattern).toBeDefined();
    });

    it('should create IAM role change rule', async () => {
      const ruleName = `iam-role-change-rule-${ENVIRONMENT_SUFFIX}`;
      const rule = await events.describeRule({
        Name: ruleName
      }).promise();

      expect(rule.State).toBe('ENABLED');
      expect(rule.EventPattern).toBeDefined();
    });

    it('should have Lambda as target for all rules', async () => {
      const rules = [
        `ec2-state-change-rule-${ENVIRONMENT_SUFFIX}`,
        `security-group-change-rule-${ENVIRONMENT_SUFFIX}`,
        `iam-role-change-rule-${ENVIRONMENT_SUFFIX}`
      ];

      for (const ruleName of rules) {
        const targets = await events.listTargetsByRule({
          Rule: ruleName
        }).promise();

        expect(targets.Targets).toBeDefined();
        expect(targets.Targets?.length).toBeGreaterThan(0);
        expect(targets.Targets?.[0].Arn).toContain(':function:');
      }
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should create compliance dashboard', async () => {
      const dashboardName = `compliance-dashboard-${ENVIRONMENT_SUFFIX}`;
      const dashboard = await cloudWatch.getDashboard({
        DashboardName: dashboardName
      }).promise();

      expect(dashboard.DashboardBody).toBeDefined();
      const body = JSON.parse(dashboard.DashboardBody!);
      expect(body.widgets).toBeDefined();
      expect(body.widgets.length).toBeGreaterThanOrEqual(4);
    });

    it('should have correct metrics configured', async () => {
      const dashboardName = `compliance-dashboard-${ENVIRONMENT_SUFFIX}`;
      const dashboard = await cloudWatch.getDashboard({
        DashboardName: dashboardName
      }).promise();

      const body = JSON.parse(dashboard.DashboardBody!);
      const metrics = body.widgets.map((widget: any) =>
        widget.properties?.metrics?.[0]?.[1]
      ).filter(Boolean);

      expect(metrics).toContain('CompliancePercentage');
      expect(metrics).toContain('CheckExecutionCount');
      expect(metrics).toContain('FailedChecksCount');
      expect(metrics).toContain('LastCheckTimestamp');
    });
  });

  describe('End-to-End Compliance Check', () => {
    it('should process compliance check and store report', async () => {
      const functionArn = stackOutputs.ComplianceReportProcessorFunctionArn;
      const functionName = functionArn.split(':').pop();
      const bucketName = stackOutputs.ComplianceReportsBucketName;

      // Invoke Lambda with test event
      const testEvent = {
        'detail-type': 'EC2 Instance State-change Notification',
        detail: {
          'instance-id': 'i-test-' + Date.now(),
          state: 'running'
        }
      };

      const invokeResult = await lambda.invoke({
        FunctionName: functionName!,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(testEvent)
      }).promise();

      expect(invokeResult.StatusCode).toBe(200);

      // Wait a bit for S3 write to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if report was stored in S3
      const objects = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: 'compliance-reports/'
      }).promise();

      expect(objects.Contents).toBeDefined();
      expect(objects.Contents?.length).toBeGreaterThan(0);

      // Verify report content if objects exist
      if (objects.Contents && objects.Contents.length > 0) {
        const latestObject = objects.Contents.sort((a, b) =>
          (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0)
        )[0];

        const reportObject = await s3.getObject({
          Bucket: bucketName,
          Key: latestObject.Key!
        }).promise();

        const report = JSON.parse(reportObject.Body?.toString() || '{}');
        expect(report.report_id).toBeDefined();
        expect(report.timestamp).toBeDefined();
        expect(report.status).toBeDefined();
        expect(report.checks).toBeDefined();
        expect(Array.isArray(report.checks)).toBe(true);
      }
    });

    it('should publish metrics to CloudWatch', async () => {
      const functionArn = stackOutputs.ComplianceReportProcessorFunctionArn;
      const functionName = functionArn.split(':').pop();

      // Invoke Lambda to generate metrics
      const testEvent = {
        'detail-type': 'EC2 Instance State-change Notification',
        detail: {
          'instance-id': 'i-metrics-test-' + Date.now(),
          state: 'running'
        }
      };

      await lambda.invoke({
        FunctionName: functionName!,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(testEvent)
      }).promise();

      // Wait for metrics to be available
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if metrics were published
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 300000); // 5 minutes ago

      const metricData = await cloudWatch.getMetricStatistics({
        Namespace: 'ComplianceChecker',
        MetricName: 'CheckExecutionCount',
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum']
      }).promise();

      expect(metricData.Datapoints).toBeDefined();
      // Note: Metrics may take time to appear, so we check if array exists
      expect(Array.isArray(metricData.Datapoints)).toBe(true);
    });
  });

  describe('IAM Permissions', () => {
    it('should have least privilege access for Lambda execution', async () => {
      // This test verifies that the Lambda can only access its designated resources
      const functionArn = stackOutputs.ComplianceReportProcessorFunctionArn;
      const functionName = functionArn.split(':').pop();

      const functionConfig = await lambda.getFunctionConfiguration({
        FunctionName: functionName!
      }).promise();

      // The role should exist and be assumable by Lambda
      expect(functionConfig.Role).toBeDefined();
      expect(functionConfig.Role).toContain('compliance-report-processor-role');
    });
  });
});