### Prompt used for generation is below:

You are an expert AWS Cloud Engineer with 10 years of experience specializing in building secure, scalable, and automated cloud infrastructure using Infrastructure as Code. You are a master of AWS CloudFormation and adhere strictly to security best practices and the principle of least privilege.

Objective: Create a single, comprehensive CloudFormation template in YAML format named secure_infrastructure.yaml. This template will deploy a secure, event-driven data processing pipeline for a production environment in the us-east-1 region. The template must be fully functional and deployable via the AWS CLI without any modifications, errors, or warnings.

Core Infrastructure Requirements
Your CloudFormation template must provision the following interconnected resources. Ensure all provided data and configuration details are used exactly as specified.

1. S3 Bucket - ApplicationDataBucket

Purpose: To store incoming application data.

Security: Must enforce server-side encryption using an AWS Key Management Service Customer Managed Key. Create this CMK as part of the template.

Access: Public access must be blocked.

2. DynamoDB Table - ProcessedResultsDB

Purpose: To store the results processed by the Lambda function.

Schema: Use a simple primary key named recordId of type String.

Capacity: Configure with on-demand capacity to manage costs and performance effectively.

3. IAM Roles and Policies - Strict Least Privilege

Lambda Execution Role: Create an IAM role for the Lambda function. This role's policy must grant only the following permissions:

s3:GetObject permission on the ApplicationDataBucket.

dynamodb:PutItem permission on the ProcessedResultsDB table.

Permissions to create and write to a CloudWatch Log Stream with logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents actions.

secretsmanager:GetSecretValue permission on the secret created below.

kms:Decrypt permission on the KMS key used for S3 bucket encryption.

MFA Enforcement Policy: Create a separate IAM policy that denies all IAM actions if Multi-Factor Authentication is not present. Use Effect Deny with specific IAM actions like iam:CreateUser, iam:DeleteUser, iam:AttachUserPolicy, and condition checking for aws:MultiFactorAuthPresent equals false. This policy is intended to be attached to IAM users or groups for console access.

4. Lambda Function - S3DataProcessor

Runtime: Python 3.8.

Trigger: Configure an S3 trigger to invoke the function automatically on any object creation event s3:ObjectCreated:\* in the ApplicationDataBucket.

Logic - Inline Code: Provide placeholder Python code that demonstrates:

Receiving an S3 event.

Fetching the triggering object's bucket and key.

Logging the event details to CloudWatch Logs.

Retrieving a secret from AWS Secrets Manager.

Writing a sample item like the object key as recordId to the DynamoDB table.

Logging: Ensure the function is configured to send all logs to CloudWatch Logs.

5. AWS Secrets Manager - ApplicationSecret

Purpose: To securely store a sensitive value, such as an API key.

Content: Create a secret with a placeholder key-value pair, for example {"ApiKey": "your-placeholder-api-key"}.

6. Universal Requirements

Tagging: Apply the tag Environment: Production to all resources created by the template including S3 Bucket, DynamoDB Table, Lambda Function, IAM Roles, and KMS Key.

Parameters: Do not use parameters. The template should be self-contained.

Expected Output
A single YAML file named secure_infrastructure.yaml.

The file must contain a valid, well-formatted CloudFormation template.

The template must be deployable without any manual pre-configuration on the AWS console.
