I need to set up a secure logging system for a startup application that processes about 1,400 events daily. The system should store events in CloudWatch Logs with KMS encryption and automatically archive older logs to S3.

Requirements:
- Create a CloudWatch Log Group with KMS encryption for application event storage
- Set up a KMS key specifically for encrypting the log data with proper key rotation
- Configure IAM roles and policies to restrict log access to authorized services only
- Create an S3 bucket for archiving logs older than 90 days with lifecycle policies
- Set up CloudWatch metrics to monitor the log group for anomalies or usage patterns
- Use EventBridge Scheduler to trigger daily log archival jobs to S3
- Implement CloudWatch Logs data protection to mask sensitive information in logs
- Enable EventBridge enhanced logging to CloudWatch for debugging the archival process

Please provide the complete Pulumi Java infrastructure code with proper error handling and resource dependencies. Each infrastructure component should be in its own code block with the filename specified.