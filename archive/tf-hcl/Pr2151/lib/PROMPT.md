You are an expert AWS Solutions Architect specializing in security configuration as code. Using Terraform (HCL), create a secure baseline for a fresh AWS account in a single region. Your solution must implement:

1. CloudTrail

- One multi-region trail
- SSE-KMS encryption using a customer-managed CMK
- Log file validation enabled
- Deliver logs to a dedicated S3 bucket (versioning ON, default encryption ON, access logging enabled to a separate access-logs bucket, and block all public access)

2. AWS Config

- One configuration recorder (record all supported resource types, include global)
- One delivery channel that writes to the same S3 logs bucket under a distinct prefix (e.g., ‘aws-config/’)
- Start the recorder

3. GuardDuty

- Enable a detector in the target region

4. IAM Account Password Policy

- Minimum length 14
- Require uppercase, lowercase, numbers, and symbols
- Max password age 90 days
- Prevent reuse of 24 previous passwords
- Allow users to change passwords

5. CloudWatch & Alarms

- Create a log group for CloudTrail events (encrypted with the same CMK)
- Create metric filters and SNS alarms for:
  a) Root account usage (any event by userIdentity.type == Root)
  b) Successful console login without MFA (ConsoleLogin == Success and MFAUsed != “Yes”)
- SNS topic with an email subscription (email should be a variable)

6. Inputs & Outputs

- Inputs (variables): region, alarm_email, project_name, tags (map)
- Outputs: CloudTrail ARN, GuardDuty detector ID, SNS topic ARN, S3 logs bucket name

7. Constraints

- No hard-coded ARNs or account IDs; derive where necessary
- Bucket policies must be least-privilege; only CloudTrail/Config should write
- All S3 buckets must block public access
- Use Terraform >= 1.4 and AWS provider >= 5.0
- Should pass common static checks (e.g., tfsec) without critical findings

Deliverables: versions.tf, variables.tf, main.tf, outputs.tf
Style: Tag resources with the provided tags and project_name
