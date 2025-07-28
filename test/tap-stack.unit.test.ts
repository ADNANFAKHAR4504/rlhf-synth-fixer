import fs from 'fs';
import path from 'path';
import { S3Client, GetBucketNotificationConfigurationCommand, GetBucketNotificationConfigurationCommandOutput, PutObjectCommand } from '@aws-sdk/client-s3';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { IAMClient, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import { CloudWatchLogsClient, DescribeLogStreamsCommand, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';

// Helper function to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Load CloudFormation Outputs after successful CDK deploy
let outputs: any;
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.error("Could not load cfn-outputs/flat-outputs.json. Please ensure your CloudFormation stack is deployed and outputs are saved.");
  console.error(error);
  process.exit(1);
}

// Extract CloudFormation outputs
const s3BucketName = outputs.S3BucketName;
const lambdaFunctionName = outputs.LambdaFunctionName;
const lambdaExecutionRoleArn = outputs.LambdaExecutionRoleArn;
const accountId = lambdaExecutionRoleArn.split(':')[4];
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const s3 = new S3Client({ region: awsRegion });
const lambda = new LambdaClient({ region: awsRegion });
const iam = new IAMClient({ region: awsRegion });
const cloudwatch = new CloudWatchLogsClient({ region: awsRegion });

// Define test data
const testObjectKey = `test-object-${Date.now()}.txt`;
const testPayload = { key: 'value' };

describe('S3 Lambda Trigger CloudFormation Template', () => {
  let template: any;
  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
    test('should have a description', () => {
      // FIX: Updated description to match the CloudFormation template
      expect(template.Description).toBe(
        'CloudFormation template to deploy a Lambda function and grant S3 permission to invoke it.'
      );
    });
    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });
    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
    });
    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have S3BucketName parameter', () => {
      const param = template.Parameters.S3BucketName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });
    test('should have LambdaFunctionName parameter', () => {
      const param = template.Parameters.LambdaFunctionName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });
    // FIX: Add test for LambdaRuntime parameter
    test('should have LambdaRuntime parameter', () => {
      const param = template.Parameters.LambdaRuntime;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });
    // FIX: Add test for LambdaHandler parameter
    test('should have LambdaHandler parameter', () => {
      const param = template.Parameters.LambdaHandler;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });
  });

  describe('Resources', () => {
    test('should have S3Bucket resource', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket).toBeDefined();
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
    });
    test('should have LambdaExecutionRole resource', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });
    test('should have LambdaFunction resource', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.FunctionName).toEqual({ Ref: 'LambdaFunctionName' });
    });
    test('should have LambdaInvokePermission resource', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should have LambdaFunctionArn output', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Lambda ARN');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['LambdaFunction', 'Arn'] });
    });
    // FIX: Corrected output name from S3BucketName to BucketName to match the CF template
    test('should have BucketName output', () => {
      const output = template.Outputs.BucketName; // Corrected output name
      expect(output).toBeDefined();
      expect(output.Description).toBe('The name of the S3 bucket'); // Corrected description to match CF template
      expect(output.Value).toEqual({ Ref: 'S3BucketName' });
    });
    // FIX: Add test for RunTime output
    test('should have RunTime output', () => {
      const output = template.Outputs.RunTime;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The runtime of the Lambda function'); // Corrected description
      expect(output.Value).toEqual({ Ref: 'LambdaRuntime' });
    });
    // FIX: Add test for Handler output
    test('should have Handler output', () => {
      const output = template.Outputs.Handler;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The handler of the Lambda function'); // Corrected description
      expect(output.Value).toEqual({ Ref: 'LambdaHandler' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });
});

describe('Lambda Triggered by S3 Events Integration Tests', () => {

  describe('Lambda Function and S3 Bucket Integration', () => {

    test('Lambda should be triggered by S3 object creation and process the event', async () => {
      expect(s3BucketName).toBeDefined();
      expect(lambdaFunctionName).toBeDefined();

      const params = {
        Bucket: s3BucketName,
        Key: testObjectKey,
        Body: 'Test content for S3 trigger',
      };

      try {
        console.log(`Uploading object '${testObjectKey}' to bucket '${s3BucketName}'...`);
        await s3.send(new PutObjectCommand(params));
        console.log('Object uploaded. Waiting for Lambda to process...');

        await sleep(10000);

        const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
        let logEvents: any[] = [];
        let nextToken: string | undefined;

        for (let i = 0; i < 5; i++) {
          const logStreamsResponse = await cloudwatch.send(new DescribeLogStreamsCommand({
            logGroupName,
            orderBy: 'LastEventTime',
            descending: true,
            limit: 1,
          }));

          const latestLogStreamName = logStreamsResponse.logStreams?.[0]?.logStreamName;

          if (latestLogStreamName) {
            const getLogEventsResponse = await cloudwatch.send(new GetLogEventsCommand({
              logGroupName,
              logStreamName: latestLogStreamName,
              startTime: Date.now() - 60 * 1000,
              limit: 50,
            }));
            logEvents = getLogEventsResponse.events || [];
            nextToken = getLogEventsResponse.nextForwardToken;

            const foundLog = logEvents.some(event => 
              event.message?.includes(`Successfully processed S3 event for key: ${testObjectKey}`)
            );

            if (foundLog) {
              console.log(`Found log for S3 event processing of key: ${testObjectKey}`);
              break;
            }
          }
          await sleep(5000);
        }

        const s3EventProcessedLog = logEvents.find(event =>
          event.message?.includes(`Successfully processed S3 event for key: ${testObjectKey}`)
        );

        expect(s3EventProcessedLog).toBeDefined();

      } catch (error) {
        console.error('Error occurred during the S3 upload or Lambda log verification:', error);
        fail(error);
      }
    }, 30000);

    test('Lambda should have the correct IAM role to access S3', async () => {
      try {
        const roleName = lambdaExecutionRoleArn.substring(lambdaExecutionRoleArn.lastIndexOf('/') + 1);
        const policyResponse = await iam.send(new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: 'LambdaS3AccessAndLogsPolicy',
        }));

        const decodedPolicyDocument = decodeURIComponent(policyResponse.PolicyDocument!);
        const policyJson = JSON.parse(decodedPolicyDocument);

        const s3Statement = policyJson.Statement.find((s: any) => 
          Array.isArray(s.Action) ? s.Action.includes('s3:GetObject') : s.Action === 's3:GetObject'
        );

        expect(s3Statement).toBeDefined();
        expect(s3Statement.Resource).toContain(s3BucketName);

      } catch (error) {
        console.error('Error occurred while fetching IAM role policy:', error);
        fail(error);
      }
    });

  });

  describe('S3 Bucket Notification Configuration', () => {

    test('S3 bucket should have a notification configured for Lambda function', async () => {
      try {
        const notificationConfig: GetBucketNotificationConfigurationCommandOutput = await s3.send(new GetBucketNotificationConfigurationCommand({
          Bucket: s3BucketName,
        }));

        const expectedLambdaArn = `arn:aws:lambda:${awsRegion}:${accountId}:function:${lambdaFunctionName}`;
        const lambdaConfig = notificationConfig.LambdaFunctionConfigurations?.find(
          (config) => config.LambdaFunctionArn === expectedLambdaArn
        );

        expect(lambdaConfig).toBeDefined();
        expect(lambdaConfig?.Events).toContain('s3:ObjectCreated:*');

      } catch (error) {
        console.error('Error occurred while checking S3 bucket notification configuration:', error);
        fail(error);
      }
    });

  });

  describe('Error Handling', () => {

    test('Lambda should handle invalid payload gracefully', async () => {
      const invalidPayload = {
        invalidKey: 'invalidValue',
      };

      try {
        const lambdaResponse = await lambda.send(new InvokeCommand({
          FunctionName: lambdaFunctionName,
          Payload: JSON.stringify(invalidPayload),
        }));

        const responsePayload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload!));

        expect(lambdaResponse.StatusCode).toBe(200);
        expect(responsePayload).toHaveProperty('statusCode', 400);
        expect(responsePayload).toHaveProperty('body', 'Invalid input: Expected an S3 object creation event.');

      } catch (error) {
        console.error('Error occurred during Lambda invocation with invalid payload:', error);
        fail(error);
      }
    });

  });

  describe('CloudWatch Logs', () => {
    test('Lambda should write logs to CloudWatch', async () => {
      try {
        const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
        
        let logStreams: any[] = [];
        for (let i = 0; i < 5; i++) {
          const describeLogStreamsResponse = await cloudwatch.send(new DescribeLogStreamsCommand({
            logGroupName,
            orderBy: 'LastEventTime',
            descending: true,
          }));
          logStreams = describeLogStreamsResponse.logStreams || [];
          if (logStreams.length > 0) {
            break;
          }
          await sleep(5000);
        }

        expect(logStreams.length).toBeGreaterThan(0);
        expect(logStreams[0].logStreamName).toBeDefined();

      } catch (error) {
        console.error('Error occurred while fetching CloudWatch logs:', error);
        fail(error);
      }
    }, 20000);
  });

});
