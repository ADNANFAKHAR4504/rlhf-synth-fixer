Create a CloudFormation template for secure AWS web application infrastructure.

Requirements:

- IAM roles with least privilege access
- CloudTrail logging enabled for all API activity
- KMS encryption for data at rest
- S3 bucket versioning enabled
- Deploy to us-east-1 region
- Security groups with minimal required access
- AWS Config rules for compliance monitoring

The infrastructure supports a production web application with high security and compliance requirements. Use standard AWS naming conventions for VPCs, S3 buckets, EC2 instances, and IAM roles.

Deliverable is a working YAML CloudFormation template that deploys successfully and passes validation tests.
