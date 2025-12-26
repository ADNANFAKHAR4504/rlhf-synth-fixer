Need a CloudFormation template that sets up a secure data storage system with proper encryption and audit logging for our us-west-2 environment.

Here's what we need:

Create S3 buckets with KMS encryption enabled. The IAM roles should grant specific S3 GetObject and PutObject permissions scoped to these bucket paths, along with KMS decrypt permissions for the encryption keys protecting those buckets. Don't use wildcard permissions - specify exact actions and resources.

CloudFormation stack events and configuration changes should automatically flow to dedicated CloudWatch log groups for auditing. We need to track all infrastructure changes for compliance.

S3 bucket policies should work together with IAM roles to enforce defense-in-depth - bucket policies denying unencrypted uploads while IAM policies restrict which principals can assume the roles. The encryption must use AWS KMS managed keys, not just SSE-S3.

All resources should be prefixed with `secureapp` for easy identification. The whole setup needs to pass CloudFormation validation without modifications - correct resource types, property names, and syntax.

Add descriptive comments explaining the security configurations, especially around how the IAM policies connect to the S3 resources and how the audit trail flows from CloudFormation to CloudWatch.

This is for a production environment so security posture matters - least privilege everywhere, encryption at rest, and complete audit trails.
