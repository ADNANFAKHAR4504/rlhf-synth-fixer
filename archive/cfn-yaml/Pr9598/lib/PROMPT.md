I need a CloudFormation template for our daily report generation service. We have to produce 2,800 PDF reports every morning at 6 AM from our database and email them to users.

Here's what needs to connect together:

EventBridge should trigger a Lambda function every day at 6 AM. The Lambda needs to query our PostgreSQL database to get the report data, generate PDFs, store them in S3, and send emails via SES with presigned URLs.

For the database connection, Lambda needs to run inside a VPC with a security group that allows it to reach the RDS instance. Store database credentials in Secrets Manager so Lambda can retrieve them securely.

The Lambda function should write generated PDF reports to S3, then create presigned URLs valid for 7 days that get included in the emails sent through SES. Set up S3 lifecycle rules to delete old reports after a year.

When reports fail to generate, Lambda should send messages to an SNS topic that notifies our ops team. Also configure a dead letter queue on the Lambda to catch any failed invocations.

For monitoring, Lambda should push custom CloudWatch metrics showing how many reports succeeded vs failed. CloudWatch Logs need to capture all execution details.

IAM roles should give Lambda minimal permissions: read from Secrets Manager, read/write to S3, send emails through SES, publish to SNS, write logs to CloudWatch, and connect to RDS through the VPC.

The whole setup needs to handle 2,800 reports efficiently with proper error handling. Use CloudFormation YAML format.