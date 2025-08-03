Certainly! Below is a CloudFormation YAML template that meets the specified requirements. This template assumes that the S3 bucket and CloudWatch Log Group already exist and are passed as parameters.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  AWS CloudFormation template to deploy a Lambda function triggered by new plain text files in an existing S3 bucket.
  The Lambda function logs the file details to an existing CloudWatch Log Group.

Parameters:
  S3BucketName:
    Type: String
    Description: The name of the existing S3 bucket.

  CloudWatchLogGroupName:
    Type: String
    Description: The name of the existing CloudWatch Log Group.

Resources:
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3ReadPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub arn:aws:s3:::${S3BucketName}/*
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:${CloudWatchLogGroupName}:*

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os

          s3_client = boto3.client('s3')

          def handler(event, context):
              bucket_name = event['Records'][0]['s3']['bucket']['name']
              object_key = event['Records'][0]['s3']['object']['key']

              response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
              content = response['Body'].read().decode('utf-8')

              print(f"File Name: {object_key}")
              print(f"File Content: {content}")

      Runtime: python3.8
      Timeout: 15

  S3BucketEventTrigger:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !GetAtt LambdaFunction.Arn
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceAccount: !Ref AWS::AccountId
      SourceArn: !Sub arn:aws:s3:::${S3BucketName}

  S3BucketNotificationConfiguration:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref S3BucketName
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Function: !GetAtt LambdaFunction.Arn

Outputs:
  LambdaFunctionArn:
    Description: The ARN of the Lambda function
    Value: !GetAtt LambdaFunction.Arn
```

### Explanation:

1. **Parameters**:
   - `S3BucketName`: The name of the existing S3 bucket.
   - `CloudWatchLogGroupName`: The name of the existing CloudWatch Log Group.

2. **Resources**:
   - **LambdaExecutionRole**: An IAM role with permissions to read from the S3 bucket and write to the CloudWatch Log Group.
   - **LambdaFunction**: The Lambda function with inline Python code to read the S3 object and log its content.
   - **S3BucketEventTrigger**: Grants S3 permission to invoke the Lambda function.
   - **S3BucketNotificationConfiguration**: Configures the S3 bucket to trigger the Lambda function on `s3:ObjectCreated:*` events.

3. **Outputs**:
   - `LambdaFunctionArn`: Outputs the ARN of the Lambda function.

This template is self-contained and references the existing S3 bucket and CloudWatch Log Group by their names passed as parameters. It ensures that the Lambda function is triggered correctly and has the necessary permissions to perform its tasks.