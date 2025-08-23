I want a complete CloudFormation template written in YAML that ensures AWS security best practices for my cloud environment.

Target Infrastructure:
The environment will be deployed in the us-east-1 region and must include IAM, S3, RDS, Lambda, and CloudTrail.

Requirements (must-haves):

IAM Roles & Least Privilege

Define IAM roles with attached policies that grant only the minimum permissions required for each service.

Ensure Lambda execution roles are scoped to access only explicitly defined resources.

Enforce MFA for IAM users with AWS Console access.

Encryption with AWS KMS

Create a KMS Key for sensitive data.

Use this KMS key to encrypt all S3 buckets and RDS databases at rest.

Network Security

Define security groups for EC2 that restrict inbound access to specific IP ranges only.

No wide-open 0.0.0.0/0 access unless explicitly required for demo purposes.

Auditing & Logging

Enable logging for all S3 buckets.

Set up CloudTrail to capture all API activity across the account for auditing.

Store CloudTrail logs in an encrypted S3 bucket with logging enabled.

Lambda Restrictions

Ensure all Lambda functions have access only to explicitly permitted resources (e.g., specific S3 buckets, DynamoDB tables).

Execution policies must not use "Resource": "*".

Security Constraints (must be enforced):

All IAM roles must have least privilege policies.

All sensitive data at rest (S3 + RDS) must be encrypted with AWS KMS.

Security groups must restrict access to specific IP ranges.

Logging must be enabled for S3 and CloudTrail.

Lambda execution must be scoped to explicit resources only.

IAM users with console access must use MFA.

Expected Output:

A valid YAML CloudFormation template that can be deployed directly.

Must create all the above infrastructure compliant with the requirements and constraints.

Include tests/validations (such as cfn-lint compliance and security checks) to ensure security settings are correct and operational.

Please provide the complete and ready-to-deploy CloudFormation template in YAML following these instructions.