## lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template to deploy a Lambda function and grant S3 permission to invoke it. # Updated description to match the unit test expectation

Parameters:
  S3BucketName:
    Type: String
    Description: The name of the S3 bucket that will trigger the Lambda function.
    Default: my-unique-s3-trigger-bucket-12345 # Suggest a unique name to avoid conflicts

  LambdaFunctionName:
    Type: String
    Description: The name of the Lambda function to be created.
    Default: my-s3-event-processor-lambda-12345

  LambdaHandler:
    Type: String
    Description: The handler for the Lambda function (e.g., index.handler).
    Default: index.handler

  LambdaRuntime:
    Type: String
    Description: The runtime for the Lambda function (e.g., nodejs20.x, python3.12).
    Default: nodejs20.x # Using a current Node.js runtime

Resources:

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: "Allow"
            Principal:
              Service: "lambda.amazonaws.com"
            Action: "sts:AssumeRole"
      Policies:
        - PolicyName: "LambdaS3AccessAndLogsPolicy" # Policy name used in the integration test
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: "Allow"
                Action:
                  - "logs:CreateLogGroup"
                  - "logs:CreateLogStream"
                  - "logs:PutLogEvents"
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${LambdaFunctionName}:*"
              - Effect: "Allow"
                Action:
                  - "s3:GetObject"
                Resource: !Sub "arn:aws:s3:::${S3BucketName}/*"

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Ref LambdaFunctionName
      Handler: !Ref LambdaHandler
      Role: !GetAtt LambdaExecutionRole.Arn
      Runtime: !Ref LambdaRuntime
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log("Received event:", JSON.stringify(event, null, 2));

            if (event.Records && event.Records[0] && event.Records[0].s3) {
              const record = event.Records[0];
              const s3Bucket = record.s3.bucket.name;
              const s3Key = record.s3.object.key;
              const eventName = record.eventName;

              console.log(`S3 Event Type: ${eventName}`);
              console.log(`New object created in bucket: ${s3Bucket} with key: ${s3Key}`);
              console.log(`Successfully processed S3 event for key: ${s3Key}`);

              return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Lambda executed successfully', s3Event: true }),
              };
            } else {
              console.log("Event is not an S3 object creation event or is an invalid payload.");
              return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid input: Expected an S3 object creation event.' }),
              };
            }
          };
      Timeout: 30
      MemorySize: 128
      Tags:
        - Key: Project
          Value: S3TriggerLambda
        - Key: Environment
          Value: Development

  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref S3BucketName
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: "s3:ObjectCreated:*"
            Function: !GetAtt LambdaFunction.Arn
      Tags:
        - Key: Project
          Value: S3TriggerLambda
        - Key: Environment
          Value: Development

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !GetAtt LambdaFunction.Arn
      Principal: s3.amazonaws.com
      SourceArn: !Sub "arn:aws:s3:::${S3BucketName}"

Outputs:
  LambdaFunctionArn:
    Description: Lambda ARN
    Value: !GetAtt LambdaFunction.Arn

  LambdaFunctionName:
    Description: The name of the Lambda function
    Value: !Ref LambdaFunctionName

  LambdaExecutionRoleArn:
    Description: The ARN of the IAM Role assumed by Lambda
    Value: !GetAtt LambdaExecutionRole.Arn

  S3BucketName:
    Description: The name of the S3 bucket # This output exists and references the S3BucketName parameter
    Value: !Ref S3BucketName

  RunTime:
    Description: The runtime of the Lambda function # Corrected description
    Value: !Ref LambdaRuntime # Corrected to LambdaRuntime parameter

  Handler:
    Description: The handler of the Lambda function # Corrected description
    Value: !Ref LambdaHandler # Corrected to LambdaHandler parameter
```

## test/tap-stack.unit.test.ts

```typescript
import fs from 'fs';
import path from 'path';

describe('S3 Lambda Trigger CloudFormation Template', () => {
  let template: any;
  beforeAll(() => {
    // This unit test should only load the CloudFormation template JSON.
    // It should NOT attempt to load cfn-outputs/flat-outputs.json or import AWS SDK clients.
    // Assuming the JSON template is located at '../lib/TapStack.json'
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); // Adjust this path if your template is elsewhere
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
    test('should have a description', () => {
      // This expectation must exactly match the 'Description' field in your CloudFormation JSON.
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
    test('should have LambdaRuntime parameter', () => {
      const param = template.Parameters.LambdaRuntime;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
    });
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
    test('should have S3BucketName output', () => {
      const output = template.Outputs.S3BucketName; // Corrected output name based on provided JSON
      expect(output).toBeDefined();
      expect(output.Description).toBe('The name of the S3 bucket'); // Description from JSON
      expect(output.Value).toEqual({ Ref: 'S3BucketName' }); // Value reference from JSON
    });

    test('should have RunTime output', () => {
      const output = template.Outputs.RunTime;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The runtime of the Lambda function');
      expect(output.Value).toEqual({ Ref: 'LambdaRuntime' });
    });
    test('should have Handler output', () => {
      const output = template.Outputs.Handler;
      expect(output).toBeDefined();
      expect(output.Description).toBe('The handler of the Lambda function');
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
```

## test/tap-stack.int.test.ts

```typescript
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
  // This file is expected to be generated by your CloudFormation deployment process.
  // Make sure your deployment pipeline saves outputs to this path.
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.error("Could not load cfn-outputs/flat-outputs.json. Please ensure your CloudFormation stack is deployed and outputs are saved.");
  console.error(error);
  // Exit the process if outputs are not available, as integration tests cannot proceed.
  // This ensures the test runner doesn't try to run these tests without deployed resources.
  process.exit(1);
}

// Extract CloudFormation outputs
const s3BucketName = outputs.S3BucketName;
const lambdaFunctionName = outputs.LambdaFunctionName;
const lambdaExecutionRoleArn = outputs.LambdaExecutionRoleArn;

// Add explicit checks for required outputs before proceeding
if (!s3BucketName) {
  throw new Error("CloudFormation output 'S3BucketName' is missing. Ensure the stack is deployed and outputs are correctly saved.");
}
if (!lambdaFunctionName) {
  throw new Error("CloudFormation output 'LambdaFunctionName' is missing. Ensure the stack is deployed and outputs are correctly saved.");
}
if (!lambdaExecutionRoleArn) {
  throw new Error("CloudFormation output 'LambdaExecutionRoleArn' is missing. Ensure the stack is deployed and outputs are correctly saved.");
}

const accountId = lambdaExecutionRoleArn.split(':')[4]; // Extract account ID from ARN
const awsRegion = process.env.AWS_REGION || 'us-east-1'; // Use environment variable for region

// Initialize AWS SDK clients
const s3 = new S3Client({ region: awsRegion });
const lambda = new LambdaClient({ region: awsRegion });
const iam = new IAMClient({ region: awsRegion });
const cloudwatch = new CloudWatchLogsClient({ region: awsRegion });

// Define test data
const testObjectKey = `test-object-${Date.now()}.txt`; // Unique object key for each test run
const testPayload = { key: 'value' }; // Example payload for direct Lambda invocation (if needed)


describe('Lambda Triggered by S3 Events Integration Tests', () => {

  describe('Lambda Function and S3 Bucket Integration', () => {

    // Test: Verify that the Lambda function can be triggered by an S3 event
    test('Lambda should be triggered by S3 object creation and process the event', async () => {
      // Check if the Lambda function and S3 bucket are properly deployed
      expect(s3BucketName).toBeDefined();
      expect(lambdaFunctionName).toBeDefined();

      // Upload a test object to the S3 bucket to trigger the Lambda function
      const params = {
        Bucket: s3BucketName,
        Key: testObjectKey,
        Body: 'Test content for S3 trigger',
      };

      try {
        console.log(`Uploading object '${testObjectKey}' to bucket '${s3BucketName}'...`);
        await s3.send(new PutObjectCommand(params));
        console.log('Object uploaded. Waiting for Lambda to process...');

        // Wait for the Lambda function to be triggered and logs to appear
        await sleep(10000); // Increased wait time to ensure logs are propagated

        // Verify Lambda execution by checking CloudWatch logs for specific messages
        const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
        let logEvents: any[] = [];
        let nextToken: string | undefined;

        // Retry fetching logs to account for potential delays
        for (let i = 0; i < 5; i++) {
          const logStreamsResponse = await cloudwatch.send(new DescribeLogStreamsCommand({
            logGroupName,
            orderBy: 'LastEventTime',
            descending: true,
            limit: 1, // Get the most recent log stream
          }));

          const latestLogStreamName = logStreamsResponse.logStreams?.[0]?.logStreamName;

          if (latestLogStreamName) {
            const getLogEventsResponse = await cloudwatch.send(new GetLogEventsCommand({
              logGroupName,
              logStreamName: latestLogStreamName,
              startTime: Date.now() - 60 * 1000, // Look for logs in the last 60 seconds
              limit: 50,
            }));
            logEvents = getLogEventsResponse.events || [];
            nextToken = getLogEventsResponse.nextForwardToken;

            const foundLog = logEvents.some(event =>
              event.message?.includes(`Successfully processed S3 event for key: ${testObjectKey}`)
            );

            if (foundLog) {
              console.log(`Found log for S3 event processing of key: ${testObjectKey}`);
              break; // Found the log, exit retry loop
            }
          }
          await sleep(5000); // Wait before retrying log fetch
        }

        const s3EventProcessedLog = logEvents.find(event =>
          event.message?.includes(`Successfully processed S3 event for key: ${testObjectKey}`)
        );

        expect(s3EventProcessedLog).toBeDefined(); // Assert that the log indicating S3 event processing was found

      } catch (error) {
        console.error('Error occurred during the S3 upload or Lambda log verification:', error);
        expect(error).toBeNull(); // Handle error gracefully
      }
    }, 30000); // Increased timeout for this test to 30 seconds

    // Test: Verify the IAM role permissions for Lambda to access S3
    test('Lambda should have the correct IAM role to access S3', async () => {
      try {
        // Get the IAM role policy attached to the Lambda execution role
        const roleName = lambdaExecutionRoleArn.substring(lambdaExecutionRoleArn.lastIndexOf('/') + 1);
        const policyResponse = await iam.send(new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: 'LambdaS3AccessAndLogsPolicy', // Corrected policy name
        }));

        // Decode and parse the policy document
        const decodedPolicyDocument = decodeURIComponent(policyResponse.PolicyDocument!);
        const policyJson = JSON.parse(decodedPolicyDocument);

        // Validate the IAM policy includes the correct permissions to access S3
        const s3Statement = policyJson.Statement.find((s: any) =>
          Array.isArray(s.Action) ? s.Action.includes('s3:GetObject') : s.Action === 's3:GetObject'
        );

        expect(s3Statement).toBeDefined();
        expect(s3Statement.Resource).toContain(s3BucketName); // Validate the bucket name is included

      } catch (error) {
        console.error('Error occurred while fetching IAM role policy:', error);
        expect(error).toBeNull(); // Handle error gracefully
      }
    });

  });

  describe('S3 Bucket Notification Configuration', () => {

    // Test: Verify that S3 bucket notification is configured correctly for Lambda trigger
    test('S3 bucket should have a notification configured for Lambda function', async () => {
      try {
        // Get the bucket notification configuration
        const notificationConfig: GetBucketNotificationConfigurationCommandOutput = await s3.send(new GetBucketNotificationConfigurationCommand({
          Bucket: s3BucketName,
        }));

        // Verify that the Lambda function is listed as an event source
        const expectedLambdaArn = `arn:aws:lambda:${awsRegion}:${accountId}:function:${lambdaFunctionName}`;
        const lambdaConfig = notificationConfig.LambdaFunctionConfigurations?.find(
          (config) => config.LambdaFunctionArn === expectedLambdaArn // Corrected property to LambdaFunctionArn
        );

        expect(lambdaConfig).toBeDefined();
        expect(lambdaConfig?.Events).toContain('s3:ObjectCreated:*');  // Check for object creation event trigger

      } catch (error) {
        console.error('Error occurred while checking S3 bucket notification configuration:', error);
        expect(error).toBeNull(); // Handle error gracefully
      }
    });

  });

  describe('Error Handling', () => {

    // Test: Ensure Lambda handles errors gracefully if incorrect payload is sent
    test('Lambda should handle invalid payload gracefully', async () => {
      const invalidPayload = {
        invalidKey: 'invalidValue',
      };

      try {
        // Invoke Lambda directly with invalid payload
        const lambdaResponse = await lambda.send(new InvokeCommand({
          FunctionName: lambdaFunctionName,
          Payload: JSON.stringify(invalidPayload),
        }));

        const responsePayload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload!));

        // Lambda always returns 200 for successful invocation, but application-level status is in payload.
        expect(lambdaResponse.StatusCode).toBe(200);
        expect(responsePayload).toHaveProperty('statusCode', 400);

        // Parse the 'body' string within the responsePayload to check its 'message' property
        const parsedBody = JSON.parse(responsePayload.body);
        expect(parsedBody).toHaveProperty('message', 'Invalid input: Expected an S3 object creation event.');

      } catch (error) {
        console.error('Error occurred during Lambda invocation with invalid payload:', error);
        expect(error).toBeNull(); // Handle error gracefully
      }
    });

  });

  describe('CloudWatch Logs', () => {
    // Test: Check if Lambda logs exist in CloudWatch after being triggered
    test('Lambda should write logs to CloudWatch', async () => {
      try {
        // Fetch the CloudWatch log streams for the Lambda function
        const logGroupName = `/aws/lambda/${lambdaFunctionName}`;

        let logStreams: any[] = [];
        // Retry fetching log streams to account for potential delays
        for (let i = 0; i < 5; i++) {
          const describeLogStreamsResponse = await cloudwatch.send(new DescribeLogStreamsCommand({
            logGroupName,
            orderBy: 'LastEventTime',
            descending: true,
          }));
          logStreams = describeLogStreamsResponse.logStreams || [];
          if (logStreams.length > 0) {
            break; // Found log streams, exit retry loop
          }
          await sleep(5000); // Wait before retrying
        }

        // Verify that at least one log stream exists for the Lambda function
        expect(logStreams.length).toBeGreaterThan(0);
        expect(logStreams[0].logStreamName).toBeDefined();

      } catch (error) {
        console.error('Error occurred while fetching CloudWatch logs:', error);
        expect(error).toBeNull(); // Handle error gracefully
      }
    }, 20000); // Increased timeout for log verification
  });

});
```
