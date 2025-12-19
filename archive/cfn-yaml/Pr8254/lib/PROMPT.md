You are a Senior Serverless Architect tasked with building a production-ready, secure, and scalable API backend on AWS. Your mission is to create a comprehensive AWS CloudFormation template in YAML that provisions a complete serverless application stack, adhering strictly to modern security and operational best practices.

Core Task:

Design a single, self-contained CloudFormation template named serverless_template.yaml for deployment in the us-east-1 region. The template must define all the necessary resources for a serverless API that creates items in a database.

Detailed Component Specifications:

Backend Data Store (DynamoDB):

Provision an AWS::DynamoDB::Table with a simple string primary key named id.

Crucially, data at rest must be encrypted using a customer-managed AWS KMS key. To achieve this, the template must first create an AWS::KMS::Key and then configure the DynamoDB table's SSESpecification to use this specific key.

IAM Roles (Principle of Least Privilege):

Create an Execution Role for the Lambda function. This role's policy must grant only the following permissions:

Write access to CloudWatch Logs (logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents).

Read/write permissions (dynamodb:PutItem, dynamodb:GetItem) limited specifically to the ARN of the DynamoDB table created in this stack.

Permission to use the specific KMS key for encryption/decryption (kms:Decrypt, kms:GenerateDataKey).

Serverless Compute (Lambda):

Provision an AWS::Lambda::Function using the python3.9 runtime.

The Lambda function's code should be written inline within the template. The function should be able to receive an item from the API Gateway, generate a unique ID, and write it to the DynamoDB table.

Configure the Lambda function with an environment variable named TABLE_NAME that is dynamically set to the name of the created DynamoDB table.

Attach the IAM Execution Role created above.

API Endpoint (API Gateway):

Set up an AWS::ApiGateway::RestApi.

Create a resource (e.g., /items) with a POST method that integrates with the Lambda function.

Implement strict input validation:

Create an AWS::ApiGateway::Model that defines the expected JSON schema for the request body (e.g., { "type": "object", "properties": { "name": { "type": "string" } }, "required": ["name"] }).

Create an AWS::ApiGateway::RequestValidator that validates the request body.

Associate both the model and the validator with the POST method to ensure that malformed requests are rejected before invoking the Lambda function.

Monitoring and Alerting (CloudWatch):

The Lambda function should automatically log its output to a CloudWatch Log Group.

Create an AWS::CloudWatch::Alarm that monitors the Lambda function's Errors metric. The alarm should trigger if there is one or more error over a 60-second period.

Create an AWS::SNS::Topic and configure the CloudWatch Alarm to send a notification to this topic when it enters the ALARM state.

Template Outputs:

To facilitate testing and integration, the template must export the following values in the Outputs section:

ApiInvokeUrl: The full invocation URL for the created API Gateway endpoint.

DynamoDBTableName: The name of the DynamoDB table.

SnsTopicArn: The ARN of the SNS topic for alarms.

Expected Result:

A single, valid serverless_template.yaml file. The template must be well-structured, commented for clarity, and capable of launching a fully functional and secure serverless stack that meets all specified requirements without any validation errors.
