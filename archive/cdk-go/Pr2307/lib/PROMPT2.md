Please update the stack with these improvements:
Monitoring – Add CloudWatch alarms for Lambda errors (>1%), long runs (>30s), throttling, and DynamoDB limits. Send alerts via SNS.
Security – Enforce SSL-only S3 access, enable transfer acceleration if useful, and consider VPC endpoints for private traffic.
Lambda – Upgrade to Python 3.12, use ARM64, and set reserved concurrency for stability.
Expected Output: CDK stack updated with these changes following AWS best practices.