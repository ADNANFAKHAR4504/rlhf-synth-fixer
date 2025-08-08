Secure Serverless Infrastructure with Logging and Least-Privilege IAM – CloudFormation Solution
Overview
This CloudFormation template provisions a secure serverless application architecture using AWS Lambda, compliant with all specified security and logging requirements. It deploys in the us-east-1 region, utilizes a pre-existing VPC and S3 bucket, and enforces strong security principles through:

Granular IAM roles adhering to the least privilege model

Comprehensive logging to CloudWatch and scheduled log export to S3

Restricted network egress using VPC-attached Lambda functions

Monitoring and auditing through CloudWatch Alarms and VPC Flow Logs

How the Template Meets Requirements
Logging
CloudWatch Logging: All Lambda invocations are logged to a dedicated CloudWatch Log Group with 15-day retention.

S3 Export: A custom-built log export Lambda function runs on a daily EventBridge schedule, using the CreateExportTask API to copy logs to a specified S3 bucket under structured prefixes.

 IAM and Security
LambdaExecutionRole provides only scoped CloudWatch and S3 permissions required for execution and logging.

Separate roles for:

Log export Lambda

CloudWatch Logs S3 delivery

VPC Flow Logs delivery

IAM trust policies restrict Lambda role usage to us-east-1.

 Networking
Lambda is deployed inside a pre-existing VPC using placeholder subnet IDs and a custom security group with strict egress:

Only HTTPS (443) and DNS (53 TCP/UDP) traffic is allowed outbound.

 Monitoring
VPC Flow Logs for traffic monitoring across the Lambda's network interface

CloudWatch Alarm for monitoring Lambda errors (with a threshold of 1 error across two 5-minute intervals)

 Compliance with Constraints
Retention period: CloudWatch logs set to 15 days

IAM policies: Precisely scoped to required resources and actions

No unnecessary resources: All defined resources support essential logging and security functions

S3 bucket and VPC: Referenced as external inputs via parameters

Included Resources
Component	Description
LambdaFunction	Python 3.11 Lambda with structured logging
LambdaLogGroup	CloudWatch Logs group with 15-day retention
LogExportLambda	Custom Lambda function to export logs to S3
LogExportScheduleRule	Daily scheduled EventBridge rule
LambdaExecutionRole	IAM role for Lambda (least privilege)
LogExportLambdaRole	IAM role for export Lambda (log & S3 permissions)
LogsExportRole	IAM role used by CloudWatch Logs to export to S3
VPCFlowLogRole	IAM role for delivering VPC flow logs
VPCFlowLogs	Logs all traffic in the VPC to CloudWatch
VPCFlowLogGroup	Log group for VPC Flow Logs
LambdaSecurityGroup	Security group with only essential outbound rules
LambdaErrorAlarm	CloudWatch alarm for invocation errors
LambdaInvokePermission	Permission for EventBridge to trigger export Lambda

Outputs
Lambda function ARN and name

Log group name

Security group ID

IAM role ARN

Deployment Instructions
Set parameters:

VpcId: Your existing VPC ID (e.g., vpc-123abcde)

S3BucketName: Name of your existing S3 bucket (e.g., lambda-logs-bucket)

LambdaFunctionName: Desired name of your Lambda function

Deploy:

bash
Copy
Edit
aws cloudformation deploy \
  --template-file secure-lambda.yml \
  --stack-name SecureLambdaStack \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
Verify:

Check CloudWatch Log Group /aws/lambda/<LambdaFunctionName>

Confirm logs are being exported to s3://<S3BucketName>/lambda-logs/

Validate that alarms trigger upon function errors

Technical Highlights
Structured Logging: Invocation metadata, sanitized event payloads, success/error details

Tagging: All resources include tags for Environment and SecurityCompliance

Error Handling: Lambda code gracefully logs exceptions with detailed metadata

Separation of Duties: IAM roles are role-specific to minimize blast radius

Summary
This CloudFormation template provides a secure, auditable, and cloud-native infrastructure pattern for deploying Lambda functions within a VPC while ensuring complete log retention, S3 persistence, and least privilege access control. It follows AWS best practices and is ready for production deployment.