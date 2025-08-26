Please review the current stack and consider implementing the following improvements:

1. **CloudWatch Monitoring & Alerting**

   * Add alarms for Lambda error rate (>1%), duration (>30s), throttling, and DynamoDB read/write throttling.
   * Wire alarms to an SNS topic for notifications.

2. **Enhanced Security**

   * Enforce SSL-only bucket access via bucket policy.
   * Enable S3 Transfer Acceleration (if applicable).
   * Consider VPC endpoints for private service access.

3. **Lambda Runtime Optimization**

   * Upgrade runtime to Python 3.12.
   * Use ARM64 architecture for cost/performance gains.
   * Apply reserved concurrency limits for stability.

Expected output: Updated stack/CDK code with these enhancements applied following AWS best practices. keep code within the response limit