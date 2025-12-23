✅ Overview

This document reviews a CloudFormation template designed to deploy a serverless infrastructure using AWS Lambda, triggered by events from an S3 bucket. The template includes necessary resources for S3 event notification, Lambda permissions, IAM roles, and CloudWatch Logs. However, there are several areas where improvements are needed, including permissions, resource configurations, and formatting issues.

# 🔍 Key Differences

| **Feature**                  | **Ideal Template**                              | **Template**                                    | **Model Deficiency**                               |
|------------------------------|-------------------------------------------------|------------------------------------------------|---------------------------------------------------|
| **S3 Event Trigger**          | ✅ Lambda permissions for S3 event trigger      | ❌ Missing Lambda permission for S3 trigger     | Lambda won't be invoked by S3 event               |
| **IAM Role Permissions**      | ✅ Least privilege IAM policies (specific actions for Lambda) | ⚠️ Broad `logs:*` permissions | Security concern: policy is overly broad          |
| **Lambda Function Code**      | ✅ Lambda function code correctly deployed      | ❌ Missing or incorrect S3 upload configuration | Lambda code not correctly uploaded to S3         |
| **Event Source Mapping**      | ✅ Lambda function correctly triggered by S3 event | ⚠️ Missing Event Source Mapping                | No direct binding between Lambda and S3 event    |
| **Dead Letter Queue (DLQ)**   | ✅ Defined with resource                        | ❌ Missing Dead Letter Queue creation           | Missing SQS Dead Letter Queue resource           |
| **Lambda Retry Configuration**| ✅ Retry configured via event source mapping    | ❌ Retry configuration in Lambda function       | Retry policy should be event source-based        |
| **CloudWatch Logs**           | ✅ Logs enabled for monitoring                  | ✅ Present                                      | —                                                 |
| **Resource Tagging**          | ✅ Dynamic tagging for cost management          | ✅ Present                                      | —                                                 |

---

1. S3 Event Notification Permissions
Issue:

The template is missing a AWS::Lambda::Permission resource, which is required to grant the S3 bucket permission to invoke the Lambda function on object creation events. Without this permission, the Lambda function will not be triggered by S3.
Solution:

Add an AWS::Lambda::Permission resource to allow the S3 bucket to invoke the Lambda function:

S3EventPermission:
  Type: AWS::Lambda::Permission
  Properties:
    Action: lambda:InvokeFunction
    FunctionName: !Ref LambdaFunction
    Principal: s3.amazonaws.com
    SourceArn: !GetAtt S3Bucket.Arn

2. IAM Role Permissions
Issue:

The IAM Role assigned to the Lambda function has overly broad permissions, such as allowing all logs:* actions. This poses a security risk by giving unnecessary permissions to the Lambda function.
Solution:

Refine the IAM role’s policy to grant only the required permissions, such as logs:CreateLogGroup and logs:CreateLogStream, rather than logs:*:

Policies:
  - PolicyName: "LambdaS3Policy"
    PolicyDocument:
      Statement:
        - Action:
            - "logs:CreateLogGroup"
            - "logs:CreateLogStream"
          Resource: "*"
        - Action:
            - "s3:GetObject"
          Resource: !Sub "arn:aws:s3:::${BucketName}/*"

3. Lambda Function Code Deployment
Issue:

The Lambda function code might not be properly uploaded to the S3 bucket, or the bucket and key in the CloudFormation template may be incorrect.
Solution:

Ensure that the Lambda code (lambda-code.zip) is properly uploaded to the S3 bucket, and verify the S3Bucket and S3Key references in the template:

LambdaFunction:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: !Ref LambdaFunctionName
    Handler: !Ref LambdaHandler
    Role: !GetAtt LambdaExecutionRole.Arn
    Runtime: !Ref LambdaRuntime
    Code:
      S3Bucket: !Ref BucketName
      S3Key: "lambda-code.zip"

4. Event Source Mapping
Issue:

There is no direct event source mapping configured to link the S3 bucket to the Lambda function for event-driven invocation.
Solution:

Add an event source mapping to trigger the Lambda function from the S3 bucket on object creation:

LambdaS3EventSource:
  Type: AWS::Lambda::EventSourceMapping
  Properties:
    BatchSize: 1
    EventSourceArn: !GetAtt S3Bucket.Arn
    FunctionName: !Ref LambdaFunction
    Enabled: "True"

5. Dead Letter Queue (DLQ) Configuration
Issue:

The CloudFormation template references a Dead Letter Queue (DLQ) in the Lambda configuration (DeadLetterConfig) but does not create an SQS resource for it. This results in a misconfiguration.
Solution:

Either create an SQS Dead Letter Queue or remove the DeadLetterConfig if not required:

DeadLetterQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: DeadLetterQueue

LambdaFunction:
  Type: AWS::Lambda::Function
  Properties:
    DeadLetterConfig:
      TargetArn: !GetAtt DeadLetterQueue.Arn

6. Lambda Retry Configuration
Issue:

The Lambda function has a retry configuration (Retry property), but this should be configured in the event source mapping, not directly in the Lambda function.
Solution:

Remove the retry configuration from the Lambda function and instead configure the retry behavior in the event source mapping:

LambdaS3EventSource:
  Type: AWS::Lambda::EventSourceMapping
  Properties:
    BatchSize: 1
    EventSourceArn: !GetAtt S3Bucket.Arn
    FunctionName: !Ref LambdaFunction
    Enabled: "True"
    MaximumRetryAttempts: 3