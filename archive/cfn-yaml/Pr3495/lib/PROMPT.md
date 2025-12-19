Create a CloudFormation template for a report generation service that produces 2,800 daily PDF reports from database queries with email delivery.

Requirements:
- EventBridge rules scheduled for daily 6 AM report generation
- Lambda function using Python 3.10 runtime for report generation logic
- RDS PostgreSQL database (Aurora Serverless v2 for quick deployment) to store report data
- S3 bucket for storing generated PDF reports with lifecycle rules
- S3 presigned URLs with 7-day expiration for secure report access
- SES configuration for sending emails with report attachments
- Lambda layer for PDF generation libraries (reportlab)
- CloudWatch metrics tracking report generation success/failure rates
- SNS topic for failure notifications to administrators
- IAM roles with least privilege for Lambda to access RDS, S3, and SES
- Environment variables for Lambda configuration
- VPC configuration for secure RDS access
- Security group allowing Lambda to RDS connection
- Dead letter queue for failed report generation attempts
- CloudWatch Logs for Lambda execution monitoring
- Use AWS Lambda Extensions for enhanced monitoring capabilities
- Implement S3 Intelligent-Tiering for cost-optimized storage

The infrastructure should handle 2,800 reports daily efficiently with proper error handling and monitoring. Generate CloudFormation YAML template code blocks for each required file.