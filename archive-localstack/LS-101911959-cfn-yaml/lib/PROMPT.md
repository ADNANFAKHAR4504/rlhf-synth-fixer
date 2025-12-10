I need help building a secure data processing pipeline for our financial services team. We're dealing with sensitive financial records that require strict compliance controls, and I want to make sure everything is locked down properly.

The main challenge is creating an infrastructure that processes financial data without any internet connectivity. Everything needs to run in private subnets, use customer-managed encryption keys, and maintain detailed audit trails for regulatory purposes.

Here's what I'm looking for:

**Core Requirements:**

1. **Network Isolation**: A VPC with 3 private subnets spread across different availability zones. No internet gateways or NAT gateways - this needs to be completely isolated from the internet.

2. **Storage**: Two S3 buckets - one for incoming data and one for processed output. Both should use KMS encryption with keys we manage ourselves, not AWS-managed keys. I also need versioning enabled and lifecycle policies to handle data retention requirements.

3. **Processing**: Lambda functions that automatically process files when they arrive in the input bucket. These functions should run inside the VPC with no internet access, and they need to write results to the output bucket.

4. **Metadata Tracking**: A DynamoDB table to store transaction metadata. This should also be encrypted at rest using our own KMS key.

5. **Network Access**: Since there's no internet, I need VPC endpoints for S3 and DynamoDB so the Lambda functions can access these services without going through the internet.

6. **Security**: IAM roles with the absolute minimum permissions needed, plus explicit deny statements to block dangerous operations like deleting buckets or disabling encryption keys.

7. **Monitoring**: CloudWatch Log Groups with 7-year retention for audit compliance, plus alarms that notify us if the Lambda fails or if there are unauthorized access attempts.

8. **Encryption**: All data at rest should use customer-managed KMS keys, and all data in transit should use TLS.

The infrastructure will be deployed in us-east-1 using AWS CloudFormation with YAML format. I need the code to be production-ready with proper error handling and security best practices.

Can you help me build this out? I'm looking for a CloudFormation template that defines all the resources with proper security configurations.
