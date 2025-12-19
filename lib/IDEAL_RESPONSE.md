# Ideal CloudFormation Solution: Serverless S3-Triggered File Processor

## Overview

This CloudFormation template deploys a serverless infrastructure that automatically processes plain text files uploaded to an existing S3 bucket. The solution includes a Lambda function that reads file contents and logs detailed information to an existing CloudWatch Log Group.

## Architecture

```text
[Existing S3 Bucket] --triggers--> [Lambda Function] --logs-to--> [Existing CloudWatch Log Group]
                                           |
                                     [IAM Role with minimal permissions]
```

## CloudFormation Template

The complete CloudFormation template includes IAM roles, Lambda function with inline code, and necessary permissions.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Serverless infrastructure with Lambda function triggered by S3 events'

Parameters:
  S3BucketName:
    Type: String
    Description: 'Name of the existing S3 bucket'
    AllowedPattern: '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'
    ConstraintDescription: 'S3 bucket name must be valid'

  CloudWatchLogGroupName:
    Type: String
    Description: 'Name of the existing CloudWatch Log Group'
    Default: '/aws/lambda/s3-file-processor'
    AllowedPattern: '^[a-zA-Z0-9_/.-]+$'
    ConstraintDescription: 'CloudWatch Log Group name must be valid'

Resources:
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-lambda-execution-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: S3AndCloudWatchAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub 'arn:aws:s3:::${S3BucketName}/*'
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${CloudWatchLogGroupName}:*'

  S3FileProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-s3-file-processor'
      Runtime: nodejs22.x
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Timeout: 30
      MemorySize: 128
      Environment:
        Variables:
          LOG_GROUP_NAME: !Ref CloudWatchLogGroupName
      Code:
        ZipFile: |
          const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
          const { CloudWatchLogsClient, CreateLogStreamCommand, PutLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

          const s3Client = new S3Client({});
          const cloudWatchClient = new CloudWatchLogsClient({});

          exports.handler = async (event) => {
            console.log('Event received:', JSON.stringify(event, null, 2));

            try {
              for (const record of event.Records) {
                const bucket = record.s3.bucket.name;
                const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

                console.log(`Processing file: ${key} from bucket: ${bucket}`);

                const getObjectCommand = new GetObjectCommand({
                  Bucket: bucket,
                  Key: key
                });

                const s3Object = await s3Client.send(getObjectCommand);
                const fileContent = await s3Object.Body.transformToString('utf-8');
                const fileSize = s3Object.ContentLength;
                const lastModified = s3Object.LastModified;

                const logMessage = {
                  filename: key,
                  bucket: bucket,
                  size: fileSize,
                  lastModified: lastModified,
                  content: fileContent.substring(0, 1000),
                  eventTime: record.eventTime
                };

                console.log('File details:', JSON.stringify(logMessage, null, 2));

                const logGroupName = process.env.LOG_GROUP_NAME;
                const logStreamName = `s3-processor-${Date.now()}`;

                try {
                  const createLogStreamCommand = new CreateLogStreamCommand({
                    logGroupName: logGroupName,
                    logStreamName: logStreamName
                  });
                  await cloudWatchClient.send(createLogStreamCommand);
                } catch (error) {
                  if (error.name !== 'ResourceAlreadyExistsException') {
                    throw error;
                  }
                }

                const putLogEventsCommand = new PutLogEventsCommand({
                  logGroupName: logGroupName,
                  logStreamName: logStreamName,
                  logEvents: [
                    {
                      timestamp: Date.now(),
                      message: JSON.stringify(logMessage, null, 2)
                    }
                  ]
                });

                await cloudWatchClient.send(putLogEventsCommand);
                console.log(`Successfully processed and logged file: ${key}`);
              }

              return {
                statusCode: 200,
                body: JSON.stringify({
                  message: 'Successfully processed S3 event',
                  processedRecords: event.Records.length
                })
              };

            } catch (error) {
              console.error('Error processing S3 event:', error);
              throw error;
            }
          };

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref S3FileProcessorFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !Sub 'arn:aws:s3:::${S3BucketName}'

Outputs:
  LambdaFunctionName:
    Description: 'Name of the Lambda function'
    Value: !Ref S3FileProcessorFunction
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionName'

  LambdaFunctionArn:
    Description: 'ARN of the Lambda function'
    Value: !GetAtt S3FileProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaFunctionArn'

  LambdaExecutionRoleArn:
    Description: 'ARN of the Lambda execution role'
    Value: !GetAtt LambdaExecutionRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-LambdaExecutionRoleArn'
```

### Lambda Function Code

The inline Lambda function uses Node.js and AWS SDK v3 for processing S3 events:

```js
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { CloudWatchLogsClient, CreateLogStreamCommand, PutLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

const s3Client = new S3Client({});
const cloudWatchClient = new CloudWatchLogsClient({});

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

      console.log(`Processing file: ${key} from bucket: ${bucket}`);

      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const s3Object = await s3Client.send(getObjectCommand);
      const fileContent = await s3Object.Body.transformToString('utf-8');
      const fileSize = s3Object.ContentLength;
      const lastModified = s3Object.LastModified;

      const logMessage = {
        filename: key,
        bucket: bucket,
        size: fileSize,
        lastModified: lastModified,
        content: fileContent.substring(0, 1000),
        eventTime: record.eventTime
      };

      console.log('File details:', JSON.stringify(logMessage, null, 2));

      const logGroupName = process.env.LOG_GROUP_NAME;
      const logStreamName = `s3-processor-${Date.now()}`;

      try {
        const createLogStreamCommand = new CreateLogStreamCommand({
          logGroupName: logGroupName,
          logStreamName: logStreamName
        });
        await cloudWatchClient.send(createLogStreamCommand);
      } catch (error) {
        if (error.name !== 'ResourceAlreadyExistsException') {
          throw error;
        }
      }

      const putLogEventsCommand = new PutLogEventsCommand({
        logGroupName: logGroupName,
        logStreamName: logStreamName,
        logEvents: [
          {
            timestamp: Date.now(),
            message: JSON.stringify(logMessage, null, 2)
          }
        ]
      });

      await cloudWatchClient.send(putLogEventsCommand);
      console.log(`Successfully processed and logged file: ${key}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed S3 event',
        processedRecords: event.Records.length
      })
    };

  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }
};
```

## Key Features

### 1. **Security Best Practices**
- **Least Privilege IAM**: Role has minimal permissions scoped to specific resources
- **Resource-Specific Access**: S3 and CloudWatch permissions are limited to the specified bucket and log group
- **No Wildcard Permissions**: All permissions are explicitly scoped

### 2. **Modern AWS SDK Integration**
- **AWS SDK v3**: Uses the latest SDK with improved performance and tree-shaking
- **Command Pattern**: Follows modern AWS SDK v3 command pattern
- **Error Handling**: Robust error handling for AWS service calls

### 3. **Comprehensive Logging**
- **Structured Logging**: JSON-formatted log messages for easy parsing
- **File Metadata**: Logs filename, size, modification date, and content preview
- **Event Correlation**: Includes S3 event timestamp for traceability

### 4. **Production-Ready Configuration**
- **Stable Runtime**: Uses Node.js 18.x for stability and AWS support
- **Appropriate Timeouts**: 30-second timeout for file processing
- **Memory Optimization**: 128MB memory allocation for text file processing

## Deployment Instructions

### Prerequisites
1. **Existing S3 Bucket**: Must exist before deployment
2. **Existing CloudWatch Log Group**: Must exist before deployment
3. **AWS CLI**: Configured with appropriate permissions

### Step 1: Deploy the CloudFormation Stack
```bash
aws cloudformation deploy \
  --template-file TapStack.yml \
  --stack-name s3-file-processor \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    S3BucketName=my-existing-bucket \
    CloudWatchLogGroupName=/aws/lambda/s3-file-processor
```

### Step 2: Configure S3 Bucket Notification
Since CloudFormation cannot modify existing S3 buckets, configure the notification manually:

```bash
# Get the Lambda function ARN from stack outputs
LAMBDA_ARN=$(aws cloudformation describe-stacks \
  --stack-name s3-file-processor \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionArn`].OutputValue' \
  --output text)

# Configure S3 bucket notification
aws s3api put-bucket-notification-configuration \
  --bucket my-existing-bucket \
  --notification-configuration '{
    "LambdaConfigurations": [
      {
        "Id": "s3-file-processor-trigger",
        "LambdaFunctionArn": "'$LAMBDA_ARN'",
        "Events": ["s3:ObjectCreated:*"],
        "Filter": {
          "Key": {
            "FilterRules": [
              {
                "Name": "suffix",
                "Value": ".txt"
              }
            ]
          }
        }
      }
    ]
  }'
```

### Step 3: Test the Solution
```bash
# Upload a test file
echo "Hello, World! This is a test file." > test.txt
aws s3 cp test.txt s3://my-existing-bucket/

# Check CloudWatch logs
aws logs describe-log-streams \
  --log-group-name /aws/lambda/s3-file-processor
```

## Architectural Decisions

### 1. **No S3 Bucket Creation**
- **Rationale**: Template works with existing buckets as specified in requirements
- **Benefit**: Can be deployed to existing infrastructure without disruption

### 2. **Separate Notification Configuration**
- **Rationale**: CloudFormation cannot modify existing S3 bucket notifications
- **Solution**: Manual configuration via AWS CLI after deployment
- **Alternative**: Use AWS CDK custom resources if more automation is needed

### 3. **Inline Lambda Code**
- **Rationale**: Keeps the solution self-contained and simple
- **Benefit**: No external dependencies or S3 bucket for code storage
- **Limitation**: Code size limited to 4KB (sufficient for this use case)

### 4. **Environment Variable Configuration**
- **Rationale**: Makes the Lambda function reusable across environments
- **Benefit**: Clear separation of configuration from code

## Monitoring and Observability

### CloudWatch Metrics
- **Lambda Duration**: Monitor function execution time
- **Lambda Errors**: Track function failures
- **Lambda Invocations**: Count of successful executions

### CloudWatch Logs
- **Function Logs**: Standard Lambda execution logs
- **Structured Logs**: Custom log entries with file metadata
- **Error Logs**: Detailed error information for troubleshooting

### Recommended Alarms
```bash
# Create CloudWatch alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name "S3FileProcessor-Errors" \
  --alarm-description "Alert on Lambda function errors" \
  --metric-name "Errors" \
  --namespace=AWS/Lambda \
  --statistic "Sum" \
  --period 300 \
  --threshold 1 \
  --comparison-operator "GreaterThanOrEqualToThreshold" \
  --dimensions Name=FunctionName,Value=s3-file-processor-S3FileProcessorFunction \
  --evaluation-periods 1
```

## Cost Optimization

### Resource Sizing
- **Lambda Memory**: 128MB (minimum for text processing)
- **Lambda Timeout**: 30 seconds (sufficient for text files)
- **No Reserved Capacity**: Uses on-demand pricing

### Cost Factors
- **Lambda Invocations**: $0.20 per 1M requests
- **Lambda Duration**: $0.0000166667 per GB-second
- **CloudWatch Logs**: $0.50 per GB ingested
- **No S3 costs**: Uses existing bucket

## Security Considerations

### IAM Best Practices
- **Principle of Least Privilege**: Minimal required permissions
- **Resource-Specific ARNs**: No wildcard permissions
- **Service-Linked Policies**: Uses AWS managed policies where appropriate

### Data Protection
- **Encryption in Transit**: All AWS API calls use HTTPS
- **Logging Limitations**: Only logs first 1000 characters of file content
- **No Persistent Storage**: Function is stateless

### Network Security
- **VPC Optional**: Can be deployed in VPC if required
- **No Internet Dependencies**: Only uses AWS services
- **Service Endpoints**: Consider VPC endpoints for enhanced security

## Troubleshooting Guide

### Common Issues
1. **Permission Denied**: Check IAM role permissions
2. **Function Not Triggered**: Verify S3 bucket notification configuration
3. **Timeout Errors**: Increase Lambda timeout for large files
4. **Memory Errors**: Increase Lambda memory allocation

### Debug Commands
```bash
# Check Lambda function configuration
aws lambda get-function --function-name s3-file-processor-S3FileProcessorFunction

# View recent logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/s3-file-processor \
  --start-time $(date -d "1 hour ago" +%s)000

# Test Lambda function directly
aws lambda invoke \
  --function-name s3-file-processor-S3FileProcessorFunction \
  --payload '{"test":"true"}' \
  response.json
```

## Cleanup

To remove all resources:
```bash
aws cloudformation delete-stack --stack-name s3-file-processor
```

Note: S3 bucket and CloudWatch Log Group are not deleted as they existed before deployment.