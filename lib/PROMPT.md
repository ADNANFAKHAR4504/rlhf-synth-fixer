# AWS CloudFormation Template Requirements

You are an infrastructure automation engineer. Your goal is to generate a production-ready AWS CloudFormation YAML template to implement a comprehensive security configuration for a multi-account AWS environment. The template must provision all required resources, enforce strict security best practices, and support a secure and scalable environment.

## Environment Setup

- Define IAM roles that strictly apply the principle of least privilege, limiting access to only required AWS services and actions.
- Set up a VPC to isolate private resources from the public internet, including both public and private subnets.
- Encrypt all data at rest and in transit using AWS Key Management Service (KMS).
- Configure Security Groups to allow access to EC2 instances only from specified IP addresses and ports.
- Enable AWS CloudTrail and ensure logging is active across all AWS accounts to monitor API activities.
- Implement automated incident response for detected security threats using AWS GuardDuty findings.
- Utilize AWS Config rules to continuously monitor AWS resources for compliance with security standards.

## Constraints

- All IAM roles must have policies that limit access to only required services.
- VPC must isolate internal resources from the public internet.
- Apply encryption to all data at rest and in transit using AWS KMS.
- Security Groups must restrict access to EC2 instances to only necessary IP addresses and ports.
- CloudTrail must be enabled across all accounts for audit purposes.
- Implement automated responses to suspicious activities identified by AWS GuardDuty.
- Use AWS Config to continuously monitor and record AWS resource compliance.
- Template must pass AWS CloudFormation validation and cfn-lint checks.
- Do not hard code the AWS region; use environment variables instead.
- Use dynamic references for secrets (e.g., passwords) instead of parameters.
- Do not use 'Fn::Sub' unless variables are required.
- Do not include additional properties not supported by resources (e.g., 'BackupPolicy' if not allowed).
- 'IsLogging' is a required property for AWS::CloudTrail::Trail if CloudTrail is used.

## Output Expectations

- Produce a YAML CloudFormation template that deploys all specified AWS security resources without error.
- Use descriptive logical resource names.
- Follow AWS best practices and security guidelines.
- Ensure the stack is fully deployable, meets all requirements and constraints, and passes validation and linting.
