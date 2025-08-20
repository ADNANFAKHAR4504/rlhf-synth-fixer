I need your help creating an AWS CloudFormation template in YAML to set up a fully serverless application. The stack should include the following components:

    1.	An AWS Lambda function that processes incoming HTTP requests.
    2.	An Amazon API Gateway that triggers the Lambda on HTTP requests and supports all HTTP methods.
    3.	An Amazon DynamoDB table for storing processed data, configured to use Pay Per Request billing mode.
    4.	A Dead Letter Queue (DLQ) using Amazon SQS to capture failed Lambda invocations.
    5.	AWS KMS encryption applied to both DynamoDB and SQS so all data at rest is protected.

Constraints:
• The Lambda function must run in us-west-2.
• The Lambda timeout must not exceed 60 seconds.
• DynamoDB must operate strictly in Pay Per Request mode.
• API Gateway should handle all HTTP methods.
• Both DynamoDB and SQS must use KMS-managed keys for encryption.

Expected Output:

A single CloudFormation YAML file that provisions this infrastructure exactly as described and passes AWS CloudFormation validation without errors.
