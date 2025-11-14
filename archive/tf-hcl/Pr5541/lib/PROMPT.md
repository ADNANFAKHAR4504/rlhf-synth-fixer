Hey, we need to establish a comprehensive security baseline for AWS accounts with automated compliance monitoring. We're working with a financial services company that's implementing a zero-trust security model, so they need strict IAM policies, encryption everywhere, and automated security monitoring to meet regulatory requirements. **Use Terraform with HCL** to build this infrastructure.

First, let's create the networking foundation. Set up a new VPC in us-east-1 with CIDR 10.0.0.0/16. Create two private subnets (10.0.1.0/24 and 10.0.2.0/24) and two public subnets (10.0.101.0/24 and 10.0.102.0/24) across different availability zones. Add an internet gateway for the public subnets and NAT gateways for the private ones. We'll also need VPC endpoints for S3 and KMS to keep traffic within the AWS network.

For IAM, create three separate roles - one for developers, another for administrators, and a third for CI/CD pipelines. Each role should follow least-privilege principles with explicit deny statements for sensitive operations. Add a cross-account IAM role for security auditing with read-only permissions, using an external ID for added security. Set up an IAM password policy requiring at least 14 characters with symbols and 90-day rotation. All console access and sensitive API operations must enforce MFA.

For encryption, implement AWS KMS customer-managed keys with automatic rotation enabled. These keys will encrypt S3 buckets and any future RDS databases. The key policies should prevent deletion by non-admin users.

Configure S3 buckets for deployment artifacts and security logs. Both buckets need policies that enforce encryption in transit and deny unencrypted uploads. Every bucket policy needs conditions checking for SecureTransport. Enable S3 bucket logging for the artifacts bucket, storing logs in the security logs bucket with encryption.

For monitoring, set up CloudWatch Log Groups with encryption and 365-day retention for security audit trails. Create CloudWatch alarms for suspicious activities like root account usage or unauthorized API calls. These alarms should send notifications to an SNS topic.

We need Lambda functions to automatically remediate non-compliant resources. If someone makes an S3 bucket public or opens a security group to the world, the Lambda should immediately fix it. These Lambda functions must use least-privilege execution roles without any wildcard permissions. The Lambda code should be in a separate Python file that gets zipped for deployment.

Set up EventBridge rules to trigger the Lambda functions when security issues are detected. The Lambda should handle S3 public access events and security group changes.

Every resource needs to be tagged with Environment, Owner, and ComplianceLevel tags. Use the environmentSuffix variable throughout for naming resources - like `security-baseline-${var.environmentSuffix}` where the suffix could be dev, staging, or prod.

For file organization, structure the code as:
- `provider.tf` for AWS provider configuration and backend settings
- `main.tf` for all AWS resources including VPC, subnets, IAM roles, KMS keys, S3 buckets, CloudWatch resources, and Lambda function configuration
- `lambda_function.py` for the remediation Lambda code (separate file)

This should be a complete, self-contained security baseline that doesn't rely on any existing resources. Everything should be created from scratch so it can be deployed in any AWS account.