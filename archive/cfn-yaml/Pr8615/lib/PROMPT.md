# CloudFormation Secure Infrastructure Prompt

I want a Create a CloudFormation YAML template to deploy a secure AWS infrastructure setup

## Target Infrastructure
The environment will be deployed in the `us-west-2` region and must include **VPC, EC2, RDS, S3, CloudWatch, and CloudTrail**.

## Requirements (must-haves)

### IAM Roles & Least Privilege
- Define IAM roles for EC2 and RDS with attached policies that grant only the minimum permissions required for each service.
- Ensure roles are scoped to access only explicitly defined resources.

### Encryption with AWS KMS
- Create a KMS key for sensitive data.
- Use this KMS key to encrypt all S3 buckets and RDS databases at rest.

### Network Security
- Define Security Groups for EC2 that restrict inbound SSH (port 22) access to a specific set of IP addresses only.

### Auditing & Logging
- Enable logging for all S3 buckets.
- Set up CloudTrail to capture all API activity across the account for auditing.
- Store CloudTrail logs in an encrypted S3 bucket with logging enabled.
- Enable CloudWatch logging for all AWS services involved in this stack.

## Security Constraints (must be enforced)
- All IAM roles must have least privilege policies.
- All sensitive data at rest (S3 + RDS) must be encrypted with AWS KMS.
- Security Groups must restrict SSH access to specific IP ranges only.
- Logging must be enabled for S3, CloudTrail, and CloudWatch.

## Expected Output
- A valid YAML CloudFormation template that can be deployed directly.
- Must create all the above infrastructure compliant with the requirements and constraints.

**Please provide the complete and ready-to-deploy CloudFormation template in YAML following these instructions.**