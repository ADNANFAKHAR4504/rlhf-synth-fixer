Objective: Create a comprehensive AWS CloudFormation YAML template that deploys a serverless application infrastructure. This template should define and configure AWS Lambda, Amazon API Gateway, and Amazon DynamoDB, along with essential security, logging, and monitoring components.

1. Core Serverless Components
   AWS Lambda Function:

Runtime: python3.9

Handler: index.lambda_handler

Code: Provide a basic Python function that accepts an HTTP POST request, generates a unique ID, stores the request body along with the ID and a timestamp into a DynamoDB table, and returns a JSON success response. Include basic error handling.

Environment Variables: Set STAGE (from a CloudFormation parameter), AWS_REGION (explicitly us-east-1), and DYNAMODB_TABLE_NAME (referencing the created DynamoDB table).

Amazon API Gateway REST API:

API Name: Dynamically generated using AWS::StackName.

Resource: Create a /data resource path.

Method: Implement a POST method on the /data path.

Integration: Configure AWS_PROXY integration to directly invoke the Lambda function.

Deployment: Create an API Gateway Deployment and a Stage named after the Environment parameter.

2. Security and Encryption
   AWS Key Management Service (KMS) Key:

Create a new AWS::KMS::Key resource.

Key Policy: Define a key policy that allows the AWS account root user full KMS permissions and permits the DynamoDB service to use the key for encryption/decryption (kms:GenerateDataKey, kms:Decrypt).

Key Rotation: Enable automatic key rotation.

Alias: Create an AWS::KMS::Alias for easy referencing.

DynamoDB Encryption:

Configure the DynamoDB table to use Server-Side Encryption with AWS KMS managed keys, explicitly referencing the ARN of the custom KMS Key created above.

IAM Role for Lambda (Least Privilege):

Create an AWS::IAM::Role for the Lambda function.

Assume Role Policy: Allow lambda.amazonaws.com to assume this role.

Inline Policies:

CloudWatch Logs: Grant permissions for logs:CreateLogGroup, logs:CreateLogStream, and logs:PutLogEvents to a specific CloudWatch Log Group for the Lambda function.

DynamoDB Access: Grant only dynamodb:PutItem permission on the specific DynamoDB table created in this stack. Do not grant broader permissions like dynamodb:\* or dynamodb:CreateTable.

3. Data Storage (DynamoDB)
   DynamoDB Table:

Table Name: Dynamically generated using AWS::StackName.

Primary Key: Define a partition key named id of type String.

Sort Key: Define a sort key named timestamp of type String.

Provisioned Throughput: Set initial ReadCapacityUnits and WriteCapacityUnits to 5.

Tags: Include an Environment tag.

4. Logging and Monitoring
   API Gateway Logging:

Enable CloudWatch Logs for API Gateway access logging.

Create a dedicated AWS::Logs::LogGroup for API Gateway access logs.

Configure the API Gateway Stage to send access logs to this Log Group.

CloudWatch Alarm for Lambda Errors:

Create an AWS::CloudWatch::Alarm that monitors the Errors metric for the Lambda function.

Threshold: Trigger if the Errors metric is greater than 0 for 1 consecutive period of 5 minutes (300 seconds).

TreatMissingData: Set to notBreaching.

SNS Notification: Create an AWS::SNS::Topic and configure the alarm to send notifications to this topic when the threshold is breached.

5. API Gateway Request Limits
   API Gateway Throttling:

Configure default throttling for the API Gateway Stage.

Rate Limit: Set a default RateLimit of 100 requests per second.

Burst Limit: Set a default BurstLimit of 50 requests.

6. Template Structure and Best Practices
   Format: The entire template must be in YAML format.

Parameters:

Environment: String, AllowedValues: dev, stage, prod, Default: dev.

LogLevel: String, AllowedValues: INFO, WARN, ERROR, Default: INFO.

SNSEmail: String, Description: "Email address for SNS notifications."

Region: All resources must be provisioned in the us-east-1 AWS region.

Comments: Include clear and concise comments for each major resource and important property to explain its purpose.

Outputs: Export the ApiGatewayUrl, LambdaFunctionArn, DynamoDBTableName, and CloudWatchAlarmName as stack outputs.

Expected Output: A complete, runnable CloudFormation YAML template that adheres to all the above specifications.
