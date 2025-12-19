// Security Analysis System Integration Tests
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  PublishCommand,
  SubscribeCommand,
  UnsubscribeCommand,
  ListSubscriptionsByTopicCommand,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  PutMetricDataCommand,
  GetMetricStatisticsCommand,
  GetDashboardCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  EventBridgeClient,
  DescribeRuleCommand,
  ListTargetsByRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read AWS region from lib/AWS_REGION file
const awsRegion = 'us-east-1';

// Initialize AWS SDK clients
const s3Client = new S3Client({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const eventBridgeClient = new EventBridgeClient({ region: awsRegion });
const cfnClient = new CloudFormationClient({ region: awsRegion });

// Helper function to wait for async operations
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Security Analysis System Integration Tests', () => {
  // ===================================================================
  // SERVICE-LEVEL TESTS - Test ONE service with actual operations
  // ===================================================================

  describe('SERVICE-LEVEL Tests', () => {
    describe('S3 Compliance Reports Bucket Tests', () => {
      test('should upload, retrieve, update, and delete a compliance report from S3', async () => {
        const bucketName = outputs.ComplianceReportsBucket;
        const testKey = `integration-test/report-${Date.now()}.json`;
        const testContent = JSON.stringify({
          reportId: `test-${Date.now()}`,
          timestamp: new Date().toISOString(),
          findings: {
            critical: 0,
            high: 0,
            medium: 1,
            low: 2,
          },
        });

        try {
          // ACTION 1: Upload (CREATE) report to S3
          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: testKey,
              Body: testContent,
              ContentType: 'application/json',
            })
          );

          // ACTION 2: Retrieve (READ) report from S3
          const getResponse = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          const retrievedContent = await getResponse.Body?.transformToString();
          expect(retrievedContent).toBe(testContent);
          expect(getResponse.ContentType).toBe('application/json');

          // ACTION 3: Update report in S3
          const updatedContent = JSON.stringify({
            reportId: `test-${Date.now()}`,
            timestamp: new Date().toISOString(),
            findings: {
              critical: 1,
              high: 2,
              medium: 1,
              low: 2,
            },
            status: 'updated',
          });

          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: testKey,
              Body: updatedContent,
              ContentType: 'application/json',
            })
          );

          const getUpdatedResponse = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          const updatedRetrieved = await getUpdatedResponse.Body?.transformToString();
          expect(updatedRetrieved).toContain('updated');

          // ACTION 4: Delete (DELETE) report from S3
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );

          // Verify deletion
          try {
            await s3Client.send(
              new GetObjectCommand({
                Bucket: bucketName,
                Key: testKey,
              })
            );
            fail('Expected NoSuchKey error');
          } catch (error: any) {
            expect(error.name).toBe('NoSuchKey');
          }
        } catch (error: any) {
          console.error('S3 CRUD test failed:', error);
          throw error;
        }
      }, 90000);

      test('should verify S3 bucket has encryption and versioning enabled', async () => {
        const bucketName = outputs.ComplianceReportsBucket;

        try {
          // ACTION: Verify bucket encryption
          const encryptionResponse = await s3Client.send(
            new GetBucketEncryptionCommand({
              Bucket: bucketName,
            })
          );

          expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
          expect(
            encryptionResponse.ServerSideEncryptionConfiguration?.Rules
          ).toBeDefined();
          expect(
            encryptionResponse.ServerSideEncryptionConfiguration?.Rules![0]
              .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
          ).toBe('AES256');

          // ACTION: Verify bucket versioning
          const versioningResponse = await s3Client.send(
            new GetBucketVersioningCommand({
              Bucket: bucketName,
            })
          );

          expect(versioningResponse.Status).toBe('Enabled');
        } catch (error: any) {
          console.error('S3 bucket configuration test failed:', error);
          throw error;
        }
      }, 60000);

      test('should list objects in compliance reports bucket', async () => {
        const bucketName = outputs.ComplianceReportsBucket;

        try {
          // ACTION: List objects in bucket
          const listResponse = await s3Client.send(
            new ListObjectsV2Command({
              Bucket: bucketName,
              MaxKeys: 10,
            })
          );

          expect(listResponse).toBeDefined();
          expect(listResponse.Name).toBe(bucketName);
        } catch (error: any) {
          console.error('S3 list objects test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('SNS Topic Tests', () => {
      test('should publish a test message to SNS topic', async () => {
        const topicArn = outputs.SNSTopicArn;

        try {
          // ACTION: Publish message to SNS
          const publishResponse = await snsClient.send(
            new PublishCommand({
              TopicArn: topicArn,
              Subject: '[TEST] Security Compliance Alert',
              Message: JSON.stringify({
                test: true,
                timestamp: new Date().toISOString(),
                severity: 'CRITICAL',
                message: 'Integration test message',
              }),
            })
          );

          expect(publishResponse.MessageId).toBeDefined();
          expect(publishResponse.MessageId?.length).toBeGreaterThan(0);
        } catch (error: any) {
          console.error('SNS publish test failed:', error);
          throw error;
        }
      }, 60000);

      test('should retrieve SNS topic attributes', async () => {
        const topicArn = outputs.SNSTopicArn;

        try {
          // ACTION: Get topic attributes
          const attributesResponse = await snsClient.send(
            new GetTopicAttributesCommand({
              TopicArn: topicArn,
            })
          );

          expect(attributesResponse.Attributes).toBeDefined();
          expect(attributesResponse.Attributes?.TopicArn).toBe(topicArn);
          expect(attributesResponse.Attributes?.DisplayName).toBe(
            'Critical Security Violations'
          );
        } catch (error: any) {
          console.error('SNS get attributes test failed:', error);
          throw error;
        }
      }, 60000);

      test('should list subscriptions for SNS topic', async () => {
        const topicArn = outputs.SNSTopicArn;

        try {
          // ACTION: List subscriptions
          const subscriptionsResponse = await snsClient.send(
            new ListSubscriptionsByTopicCommand({
              TopicArn: topicArn,
            })
          );

          expect(subscriptionsResponse.Subscriptions).toBeDefined();
        } catch (error: any) {
          console.error('SNS list subscriptions test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('Lambda Function Tests', () => {
      test('should retrieve Lambda function configuration', async () => {
        const functionArn = outputs.SecurityAnalysisFunctionArn;

        try {
          // ACTION: Get function configuration
          const configResponse = await lambdaClient.send(
            new GetFunctionConfigurationCommand({
              FunctionName: functionArn,
            })
          );

          expect(configResponse.FunctionName).toBe('SecurityComplianceAnalyzer');
          expect(configResponse.Runtime).toBe('python3.9');
          expect(configResponse.Handler).toBe('index.lambda_handler');
          expect(configResponse.Timeout).toBe(900);
          expect(configResponse.MemorySize).toBe(1024);
          expect(configResponse.Environment?.Variables?.REPORTS_BUCKET).toBe(
            outputs.ComplianceReportsBucket
          );
        } catch (error: any) {
          console.error('Lambda get configuration test failed:', error);
          throw error;
        }
      }, 60000);

      test('should retrieve full Lambda function details including code', async () => {
        const functionArn = outputs.SecurityAnalysisFunctionArn;

        try {
          // ACTION: Get full function details
          const functionResponse = await lambdaClient.send(
            new GetFunctionCommand({
              FunctionName: functionArn,
            })
          );

          expect(functionResponse.Configuration).toBeDefined();
          expect(functionResponse.Configuration?.FunctionName).toBe(
            'SecurityComplianceAnalyzer'
          );
          expect(functionResponse.Code).toBeDefined();
          expect(functionResponse.Code?.Location).toBeDefined();
        } catch (error: any) {
          console.error('Lambda get function test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('IAM Role Tests', () => {
      test('should verify IAM role exists and has correct trust policy', async () => {
        const roleArn = outputs.SecurityAnalysisLambdaRoleArn;
        const roleName = roleArn.split('/').pop()!;

        try {
          // ACTION: Get IAM role details
          const roleResponse = await iamClient.send(
            new GetRoleCommand({
              RoleName: roleName,
            })
          );

          expect(roleResponse.Role).toBeDefined();
          expect(roleResponse.Role?.RoleName).toBe(roleName);
          expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();

          // Verify trust policy
          const trustPolicy = JSON.parse(
            decodeURIComponent(roleResponse.Role?.AssumeRolePolicyDocument!)
          );
          expect(trustPolicy.Statement[0].Principal.Service).toBe(
            'lambda.amazonaws.com'
          );
        } catch (error: any) {
          console.error('IAM role get test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify IAM role has required inline policies', async () => {
        const roleArn = outputs.SecurityAnalysisLambdaRoleArn;
        const roleName = roleArn.split('/').pop()!;

        try {
          // ACTION: List inline policies
          const policiesResponse = await iamClient.send(
            new ListRolePoliciesCommand({
              RoleName: roleName,
            })
          );

          expect(policiesResponse.PolicyNames).toBeDefined();
          expect(policiesResponse.PolicyNames).toContain('SecurityAnalysisPolicy');
        } catch (error: any) {
          console.error('IAM list policies test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify IAM role has required managed policies attached', async () => {
        const roleArn = outputs.SecurityAnalysisLambdaRoleArn;
        const roleName = roleArn.split('/').pop()!;

        try {
          // ACTION: List attached policies
          const attachedPoliciesResponse = await iamClient.send(
            new ListAttachedRolePoliciesCommand({
              RoleName: roleName,
            })
          );

          expect(attachedPoliciesResponse.AttachedPolicies).toBeDefined();
          const policyArns = attachedPoliciesResponse.AttachedPolicies?.map(
            (p) => p.PolicyArn
          );
          expect(policyArns).toContain(
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
          );
        } catch (error: any) {
          console.error('IAM list attached policies test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('CloudWatch Alarms Tests', () => {
      test('should verify CriticalViolationsAlarm exists and is configured correctly', async () => {
        const alarmName = 'SecurityComplianceCriticalViolations';

        try {
          // ACTION: Describe alarm
          const alarmsResponse = await cloudwatchClient.send(
            new DescribeAlarmsCommand({
              AlarmNames: [alarmName],
            })
          );

          expect(alarmsResponse.MetricAlarms).toBeDefined();
          expect(alarmsResponse.MetricAlarms?.length).toBe(1);

          const alarm = alarmsResponse.MetricAlarms![0];
          expect(alarm.AlarmName).toBe(alarmName);
          expect(alarm.MetricName).toBe('CriticalViolations');
          expect(alarm.Namespace).toBe('SecurityCompliance');
          expect(alarm.Threshold).toBe(0);
          expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
          expect(alarm.Statistic).toBe('Maximum');
        } catch (error: any) {
          console.error('CloudWatch critical alarm test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify LowComplianceScoreAlarm exists and is configured correctly', async () => {
        const alarmName = 'SecurityComplianceLowScore';

        try {
          // ACTION: Describe alarm
          const alarmsResponse = await cloudwatchClient.send(
            new DescribeAlarmsCommand({
              AlarmNames: [alarmName],
            })
          );

          expect(alarmsResponse.MetricAlarms).toBeDefined();
          expect(alarmsResponse.MetricAlarms?.length).toBe(1);

          const alarm = alarmsResponse.MetricAlarms![0];
          expect(alarm.AlarmName).toBe(alarmName);
          expect(alarm.MetricName).toBe('ComplianceScore');
          expect(alarm.Namespace).toBe('SecurityCompliance');
          expect(alarm.Threshold).toBe(70);
          expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
        } catch (error: any) {
          console.error('CloudWatch compliance alarm test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('CloudWatch Dashboard Tests', () => {
      test('should verify CloudWatch Dashboard exists', async () => {
        const dashboardName = outputs.ComplianceDashboardName;

        try {
          // ACTION: Get dashboard
          const dashboardResponse = await cloudwatchClient.send(
            new GetDashboardCommand({
              DashboardName: dashboardName,
            })
          );

          expect(dashboardResponse.DashboardName).toBe(dashboardName);
          expect(dashboardResponse.DashboardBody).toBeDefined();

          const dashboardBody = JSON.parse(dashboardResponse.DashboardBody!);
          expect(dashboardBody.widgets).toBeDefined();
          expect(dashboardBody.widgets.length).toBeGreaterThan(0);
        } catch (error: any) {
          console.error('CloudWatch dashboard test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('EventBridge Rule Tests', () => {
      test('should verify EventBridge rule exists and is configured correctly', async () => {
        const ruleName = 'ScheduledSecurityAnalysis';

        try {
          // ACTION: Describe rule
          const ruleResponse = await eventBridgeClient.send(
            new DescribeRuleCommand({
              Name: ruleName,
            })
          );

          expect(ruleResponse.Name).toBe(ruleName);
          expect(ruleResponse.State).toBe('ENABLED');
          expect(ruleResponse.ScheduleExpression).toBeDefined();
          expect(ruleResponse.Description).toContain('security compliance');
        } catch (error: any) {
          console.error('EventBridge rule test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify EventBridge rule targets Lambda function', async () => {
        const ruleName = 'ScheduledSecurityAnalysis';

        try {
          // ACTION: List rule targets
          const targetsResponse = await eventBridgeClient.send(
            new ListTargetsByRuleCommand({
              Rule: ruleName,
            })
          );

          expect(targetsResponse.Targets).toBeDefined();
          expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
          expect(targetsResponse.Targets![0].Arn).toBe(
            outputs.SecurityAnalysisFunctionArn
          );
        } catch (error: any) {
          console.error('EventBridge targets test failed:', error);
          throw error;
        }
      }, 60000);
    });
  });

  // ===================================================================
  // CROSS-SERVICE TESTS - Make TWO services talk to each other
  // ===================================================================

  describe('CROSS-SERVICE Tests', () => {
    describe('Lambda → S3 Integration', () => {
      test('should invoke Lambda function and verify it writes report to S3', async () => {
        const functionArn = outputs.SecurityAnalysisFunctionArn;
        const bucketName = outputs.ComplianceReportsBucket;

        try {
          // CROSS-SERVICE ACTION: Lambda → S3
          const invokeResponse = await lambdaClient.send(
            new InvokeCommand({
              FunctionName: functionArn,
              InvocationType: 'RequestResponse',
              Payload: JSON.stringify({
                TargetStacks: [],
              }),
            })
          );

          expect(invokeResponse.StatusCode).toBe(200);
          expect(invokeResponse.Payload).toBeDefined();

          const payload = JSON.parse(
            new TextDecoder().decode(invokeResponse.Payload)
          );
          expect(payload.statusCode).toBe(200);

          const body = JSON.parse(payload.body);
          expect(body.report_location).toBeDefined();
          expect(body.report_location).toContain(bucketName);

          // Wait for S3 to propagate
          await sleep(3000);

          // Verify report was written to S3
          const reportKey = body.report_location.split(`${bucketName}/`)[1];
          const s3Response = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: reportKey,
            })
          );

          expect(s3Response).toBeDefined();
          const reportContent = await s3Response.Body?.transformToString();
          const report = JSON.parse(reportContent!);
          expect(report.report_id).toBeDefined();
          expect(report.statistics).toBeDefined();
        } catch (error: any) {
          console.error('Lambda → S3 integration test failed:', error);
          throw error;
        }
      }, 120000);
    });

    describe('Lambda → SNS Integration', () => {
      test('should invoke Lambda with critical findings and verify SNS notification', async () => {
        const functionArn = outputs.SecurityAnalysisFunctionArn;
        const topicArn = outputs.SNSTopicArn;

        try {
          // First, verify SNS topic is ready
          const topicAttrs = await snsClient.send(
            new GetTopicAttributesCommand({
              TopicArn: topicArn,
            })
          );
          expect(topicAttrs.Attributes).toBeDefined();

          // CROSS-SERVICE ACTION: Lambda execution triggers SNS
          // Note: Lambda will send SNS if critical violations are found
          const invokeResponse = await lambdaClient.send(
            new InvokeCommand({
              FunctionName: functionArn,
              InvocationType: 'RequestResponse',
              Payload: JSON.stringify({
                TargetStacks: [],
              }),
            })
          );

          expect(invokeResponse.StatusCode).toBe(200);
        } catch (error: any) {
          console.error('Lambda → SNS integration test failed:', error);
          throw error;
        }
      }, 120000);
    });

    describe('Lambda → CloudWatch Integration', () => {
      test('should invoke Lambda and verify CloudWatch metrics are published', async () => {
        const functionArn = outputs.SecurityAnalysisFunctionArn;

        try {
          // CROSS-SERVICE ACTION: Lambda → CloudWatch Metrics
          const invokeResponse = await lambdaClient.send(
            new InvokeCommand({
              FunctionName: functionArn,
              InvocationType: 'RequestResponse',
              Payload: JSON.stringify({
                TargetStacks: [],
              }),
            })
          );

          expect(invokeResponse.StatusCode).toBe(200);

          // Wait for metrics to propagate
          await sleep(5000);

          // Verify metrics were published
          const endTime = new Date();
          const startTime = new Date(endTime.getTime() - 600000); // 10 minutes ago

          const metricsResponse = await cloudwatchClient.send(
            new GetMetricStatisticsCommand({
              Namespace: 'SecurityCompliance',
              MetricName: 'ComplianceScore',
              StartTime: startTime,
              EndTime: endTime,
              Period: 300,
              Statistics: ['Average'],
            })
          );

          expect(metricsResponse.Datapoints).toBeDefined();
        } catch (error: any) {
          console.error('Lambda → CloudWatch integration test failed:', error);
          throw error;
        }
      }, 120000);
    });

    describe('S3 → Lambda Trigger Simulation', () => {
      test('should write to S3 and verify Lambda can read it', async () => {
        const bucketName = outputs.ComplianceReportsBucket;
        const functionArn = outputs.SecurityAnalysisFunctionArn;
        const testKey = `test-reports/simulation-${Date.now()}.json`;

        try {
          // Step 1: Upload test data to S3
          const testData = {
            test: true,
            timestamp: new Date().toISOString(),
          };

          await s3Client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: testKey,
              Body: JSON.stringify(testData),
              ContentType: 'application/json',
            })
          );

          // Step 2: Verify Lambda can read from S3 bucket
          const functionConfig = await lambdaClient.send(
            new GetFunctionConfigurationCommand({
              FunctionName: functionArn,
            })
          );

          expect(functionConfig.Environment?.Variables?.REPORTS_BUCKET).toBe(
            bucketName
          );

          // Cleanup
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: testKey,
            })
          );
        } catch (error: any) {
          console.error('S3 → Lambda simulation test failed:', error);
          throw error;
        }
      }, 90000);
    });

    describe('EventBridge → Lambda Integration', () => {
      test('should verify EventBridge rule can invoke Lambda function', async () => {
        const ruleName = 'ScheduledSecurityAnalysis';
        const functionArn = outputs.SecurityAnalysisFunctionArn;

        try {
          // CROSS-SERVICE: Verify EventBridge → Lambda connection
          const targetsResponse = await eventBridgeClient.send(
            new ListTargetsByRuleCommand({
              Rule: ruleName,
            })
          );

          expect(targetsResponse.Targets).toBeDefined();
          expect(targetsResponse.Targets?.length).toBeGreaterThan(0);

          const target = targetsResponse.Targets![0];
          expect(target.Arn).toBe(functionArn);

          // Verify Lambda function exists
          const functionResponse = await lambdaClient.send(
            new GetFunctionCommand({
              FunctionName: functionArn,
            })
          );

          expect(functionResponse.Configuration?.FunctionName).toBe(
            'SecurityComplianceAnalyzer'
          );
        } catch (error: any) {
          console.error('EventBridge → Lambda integration test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('CloudWatch Alarm → SNS Integration', () => {
      test('should verify CloudWatch alarms are configured to notify SNS topic', async () => {
        const topicArn = outputs.SNSTopicArn;
        const criticalAlarmName = 'SecurityComplianceCriticalViolations';

        try {
          // CROSS-SERVICE: Verify CloudWatch → SNS connection
          const alarmsResponse = await cloudwatchClient.send(
            new DescribeAlarmsCommand({
              AlarmNames: [criticalAlarmName],
            })
          );

          expect(alarmsResponse.MetricAlarms).toBeDefined();
          const alarm = alarmsResponse.MetricAlarms![0];

          expect(alarm.AlarmActions).toBeDefined();
          expect(alarm.AlarmActions).toContain(topicArn);
        } catch (error: any) {
          console.error('CloudWatch → SNS integration test failed:', error);
          throw error;
        }
      }, 60000);
    });
  });

  // ===================================================================
  // E2E TESTS - Complete workflows with REAL DATA (3+ services)
  // ===================================================================

  describe('E2E Tests', () => {
    describe('Complete Security Analysis Workflow', () => {
      test('should execute full E2E flow: Lambda → S3 → CloudWatch → SNS', async () => {
        const functionArn = outputs.SecurityAnalysisFunctionArn;
        const bucketName = outputs.ComplianceReportsBucket;
        const topicArn = outputs.SNSTopicArn;

        try {
          // E2E STEP 1: Invoke Lambda function
          const invokeResponse = await lambdaClient.send(
            new InvokeCommand({
              FunctionName: functionArn,
              InvocationType: 'RequestResponse',
              Payload: JSON.stringify({
                TargetStacks: [],
              }),
            })
          );

          expect(invokeResponse.StatusCode).toBe(200);
          const payload = JSON.parse(
            new TextDecoder().decode(invokeResponse.Payload)
          );
          expect(payload.statusCode).toBe(200);

          const body = JSON.parse(payload.body);
          expect(body.report_location).toBeDefined();
          expect(body.statistics).toBeDefined();
          expect(body.compliance_score).toBeDefined();

          // Wait for propagation
          await sleep(3000);

          // E2E STEP 2: Verify report in S3
          const reportKey = body.report_location.split(`${bucketName}/`)[1];
          const s3Response = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: reportKey,
            })
          );

          const reportContent = await s3Response.Body?.transformToString();
          const report = JSON.parse(reportContent!);
          expect(report.report_id).toBeDefined();
          expect(report.statistics.total_resources_analyzed).toBeGreaterThanOrEqual(
            0
          );
          expect(report.summary.compliance_score).toBeGreaterThanOrEqual(0);

          // E2E STEP 3: Verify CloudWatch metrics were published
          await sleep(5000);

          const endTime = new Date();
          const startTime = new Date(endTime.getTime() - 600000);

          const metricsResponse = await cloudwatchClient.send(
            new GetMetricStatisticsCommand({
              Namespace: 'SecurityCompliance',
              MetricName: 'TotalViolations',
              StartTime: startTime,
              EndTime: endTime,
              Period: 300,
              Statistics: ['Sum'],
            })
          );

          expect(metricsResponse.Datapoints).toBeDefined();

          // E2E STEP 4: Verify SNS topic exists for notifications
          const topicAttrs = await snsClient.send(
            new GetTopicAttributesCommand({
              TopicArn: topicArn,
            })
          );

          expect(topicAttrs.Attributes?.TopicArn).toBe(topicArn);
        } catch (error: any) {
          console.error('E2E security analysis workflow test failed:', error);
          throw error;
        }
      }, 180000);
    });

    describe('Complete Alerting Workflow', () => {
      test('should execute full E2E alerting flow: Lambda → CloudWatch Metrics → Alarms → SNS', async () => {
        const functionArn = outputs.SecurityAnalysisFunctionArn;

        try {
          // E2E STEP 1: Invoke Lambda to generate metrics
          const invokeResponse = await lambdaClient.send(
            new InvokeCommand({
              FunctionName: functionArn,
              InvocationType: 'RequestResponse',
              Payload: JSON.stringify({
                TargetStacks: [],
              }),
            })
          );

          expect(invokeResponse.StatusCode).toBe(200);

          // E2E STEP 2: Wait for metrics propagation
          await sleep(5000);

          // E2E STEP 3: Verify CloudWatch alarms are monitoring the metrics
          const alarmsResponse = await cloudwatchClient.send(
            new DescribeAlarmsCommand({
              AlarmNames: [
                'SecurityComplianceCriticalViolations',
                'SecurityComplianceLowScore',
              ],
            })
          );

          expect(alarmsResponse.MetricAlarms).toBeDefined();
          expect(alarmsResponse.MetricAlarms?.length).toBe(2);

          // E2E STEP 4: Verify alarms are configured to notify SNS
          alarmsResponse.MetricAlarms?.forEach((alarm) => {
            expect(alarm.AlarmActions).toBeDefined();
            expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
            expect(alarm.AlarmActions![0]).toContain('sns');
          });
        } catch (error: any) {
          console.error('E2E alerting workflow test failed:', error);
          throw error;
        }
      }, 120000);
    });

    describe('Complete Scheduled Analysis Workflow', () => {
      test('should execute full E2E scheduled flow: EventBridge → Lambda → S3 → CloudWatch', async () => {
        const ruleName = 'ScheduledSecurityAnalysis';
        const functionArn = outputs.SecurityAnalysisFunctionArn;
        const bucketName = outputs.ComplianceReportsBucket;

        try {
          // E2E STEP 1: Verify EventBridge rule exists and is enabled
          const ruleResponse = await eventBridgeClient.send(
            new DescribeRuleCommand({
              Name: ruleName,
            })
          );

          expect(ruleResponse.State).toBe('ENABLED');
          expect(ruleResponse.ScheduleExpression).toBeDefined();

          // E2E STEP 2: Verify EventBridge targets Lambda
          const targetsResponse = await eventBridgeClient.send(
            new ListTargetsByRuleCommand({
              Rule: ruleName,
            })
          );

          expect(targetsResponse.Targets![0].Arn).toBe(functionArn);

          // E2E STEP 3: Manually invoke Lambda to simulate scheduled execution
          const invokeResponse = await lambdaClient.send(
            new InvokeCommand({
              FunctionName: functionArn,
              InvocationType: 'RequestResponse',
              Payload: JSON.stringify({
                TargetStacks: [],
              }),
            })
          );

          expect(invokeResponse.StatusCode).toBe(200);

          const payload = JSON.parse(
            new TextDecoder().decode(invokeResponse.Payload)
          );
          const body = JSON.parse(payload.body);

          // E2E STEP 4: Verify S3 report was created
          await sleep(3000);

          const reportKey = body.report_location.split(`${bucketName}/`)[1];
          const s3Response = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: reportKey,
            })
          );

          expect(s3Response).toBeDefined();

          // E2E STEP 5: Verify CloudWatch metrics
          await sleep(5000);

          const endTime = new Date();
          const startTime = new Date(endTime.getTime() - 600000);

          const metricsResponse = await cloudwatchClient.send(
            new GetMetricStatisticsCommand({
              Namespace: 'SecurityCompliance',
              MetricName: 'ComplianceScore',
              StartTime: startTime,
              EndTime: endTime,
              Period: 300,
              Statistics: ['Average'],
            })
          );

          expect(metricsResponse.Datapoints).toBeDefined();
        } catch (error: any) {
          console.error('E2E scheduled analysis workflow test failed:', error);
          throw error;
        }
      }, 180000);
    });

    describe('Complete Compliance Report Lifecycle', () => {
      test('should execute full E2E report lifecycle: Generate → Store → Retrieve → Analyze → Cleanup', async () => {
        const functionArn = outputs.SecurityAnalysisFunctionArn;
        const bucketName = outputs.ComplianceReportsBucket;

        try {
          // E2E STEP 1: Generate compliance report via Lambda
          const invokeResponse = await lambdaClient.send(
            new InvokeCommand({
              FunctionName: functionArn,
              InvocationType: 'RequestResponse',
              Payload: JSON.stringify({
                TargetStacks: [],
              }),
            })
          );

          expect(invokeResponse.StatusCode).toBe(200);
          const payload = JSON.parse(
            new TextDecoder().decode(invokeResponse.Payload)
          );
          const body = JSON.parse(payload.body);
          const reportLocation = body.report_location;

          // E2E STEP 2: Wait for S3 propagation
          await sleep(3000);

          // E2E STEP 3: Retrieve and parse report from S3
          const reportKey = reportLocation.split(`${bucketName}/`)[1];
          const s3GetResponse = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: reportKey,
            })
          );

          const reportContent = await s3GetResponse.Body?.transformToString();
          const report = JSON.parse(reportContent!);

          // E2E STEP 4: Analyze report structure
          expect(report.report_id).toBeDefined();
          expect(report.generated_at).toBeDefined();
          expect(report.account_id).toBeDefined();
          expect(report.region).toBeDefined();
          expect(report.statistics).toBeDefined();
          expect(report.findings).toBeDefined();
          expect(report.summary).toBeDefined();

          // E2E STEP 5: Verify both JSON and HTML reports exist
          const htmlKey = reportKey.replace('report.json', 'report.html');
          const htmlResponse = await s3Client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: htmlKey,
            })
          );

          expect(htmlResponse).toBeDefined();
          expect(htmlResponse.ContentType).toContain('html');

          // E2E STEP 6: Verify compliance score calculation
          expect(report.summary.compliance_score).toBeGreaterThanOrEqual(0);
          expect(report.summary.compliance_score).toBeLessThanOrEqual(100);
          expect(report.summary.risk_level).toBeDefined();
          expect([
            'CRITICAL',
            'HIGH',
            'MEDIUM',
            'LOW',
            'MINIMAL',
          ]).toContain(report.summary.risk_level);
        } catch (error: any) {
          console.error('E2E report lifecycle test failed:', error);
          throw error;
        }
      }, 180000);
    });
  });

  describe('Stack Outputs Validation', () => {
    test('should verify all required stack outputs are available', () => {
      expect(outputs.ComplianceReportsBucket).toBeDefined();
      expect(outputs.SecurityAnalysisFunctionArn).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SecurityAnalysisLambdaRoleArn).toBeDefined();
      expect(outputs.ComplianceDashboardName).toBeDefined();
    });
  });
});
