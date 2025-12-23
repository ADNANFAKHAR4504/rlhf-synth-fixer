You are an expert AWS Cloud Solutions Architect specializing in serverless technologies and Infrastructure as Code (IaC).

Create a production-ready AWS CloudFormation template in YAML format to define the serverless backend for a healthcare application. The architecture must be secure, resilient, and follow AWS best practices.

1. General Requirements
- Parameters: Include a ProjectName parameter (default: ServerlessHealthcareApp) to be used as a prefix for resource names.
- Multi-Region Design: The template must be deployable in different AWS regions without modification. Use pseudo parameters where appropriate.
- Outputs: Export key resource identifiers, including the DynamoDB table name, SQS queue URL, and SNS topic ARN.

2. Service Configuration

Amazon DynamoDB
- Define a DynamoDB table named PatientDataTable.
- The table must have a primary key of PatientID (String).
- Enable Point-in-Time Recovery (PITR) and Server-Side Encryption (SSE) using an AWS-managed key.

AWS Lambda Functions
Define three Lambda functions with simple, inline Node.js or Python code.
1. ProcessPatientDataFunction:
   - Purpose: Ingests new patient records.
   - Action: Writes an item to the PatientDataTable and sends a message to the AnalyticsTaskQueue.
2. AnalyticsProcessingFunction:
   - Purpose: Performs asynchronous analytics.
   - Trigger: SQS queue messages.
3. SendNotificationFunction:
   - Purpose: Sends notifications.
   - Trigger: SNS topic messages.

Amazon SQS & SNS
- Define an SQS queue named AnalyticsTaskQueue.
- Define an SNS topic named PatientUpdatesTopic.

3. Security & IAM Roles
Implement IAM Roles that strictly adhere to the principle of least privilege.
- Create a unique IAM Role for each Lambda function.
- ProcessPatientDataRole: Must only have dynamodb:PutItem permissions on the PatientDataTable and sqs:SendMessage permissions on the AnalyticsTaskQueue.
- AnalyticsProcessingRole: Must only have permissions to read from the AnalyticsTaskQueue (sqs:ReceiveMessage, sqs:DeleteMessage, sqs:GetQueueAttributes).
- SendNotificationRole: Must only have sns:Publish permissions on the PatientUpdatesTopic.
- All roles must have permissions to write to their respective CloudWatch Logs.

4. Final Output
- The output must be a single, well-commented CloudFormation template in a YAML code block.
- The template must pass AWS CloudFormation validation and cfn-lint checks with no errors or security warnings.