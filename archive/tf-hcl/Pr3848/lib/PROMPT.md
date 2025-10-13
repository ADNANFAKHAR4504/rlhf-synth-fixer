I need to build an audit logging system in AWS us-east-1 for compliance purposes. Our business processes about 18,700 system events daily and needs to retain these logs for 10 years with immutable storage.

The system should include:

1. CloudWatch Logs to collect the system events with a log group that has 10-year retention
2. Use CloudWatch Logs Insights with field indexes for fast querying of critical attributes like requestId and transactionId
3. S3 bucket with Object Lock enabled in governance mode to store immutable copies of the logs
4. The S3 bucket should have 10-year retention and versioning enabled
5. Customer-managed KMS key to encrypt all logs both in CloudWatch and S3
6. IAM roles and policies that prevent log modification - ensure least privilege access
7. CloudTrail to audit all AWS API calls related to the logging infrastructure
8. EventBridge rules with enhanced logging to send real-time alerts when critical events occur
9. Lambda function to process and transform logs before archiving to S3
10. Use EventBridge integration with AppSync as a target for real-time monitoring dashboard

All resources should use encryption at rest with the KMS key. Make sure the S3 bucket is configured properly for Object Lock - it needs to be enabled at bucket creation. The governance mode should allow authorized users to bypass retention if needed.

Please provide the complete Terraform HCL code with proper file structure. Each file should be in its own code block with the filename clearly marked.
