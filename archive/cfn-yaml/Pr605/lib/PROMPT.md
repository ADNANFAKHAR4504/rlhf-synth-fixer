# Expert-Level AWS CloudFormation YAML Template

You are tasked with creating an expert-level AWS CloudFormation YAML template for deploying secure infrastructure in the **us-east-1** region according to the organization's security policies.

## Requirements

### S3 Buckets
- Provision multiple S3 buckets.
- All buckets must be private by default.
- Follow the naming convention: `<projectName>-<environment>-s3bucket`.

### IAM Roles & Policies
- Configure IAM roles and policies enforcing IAM user passwords to have:
  - Minimum length: **12 characters**.
  - Must include **upper and lower case letters, numbers, and symbols**.

### Lambda Function
- Deploy a Lambda function that processes data securely.
- Ensure sensitive AWS environment variables (e.g., `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) are **not echoed in logs**.

## Constraints
- All S3 buckets are private by default.
- IAM password policy must meet specified complexity requirements.
- Sensitive environment variables must not be logged.
- The entire configuration must be contained in a single `.yml` file with no external file references.

## Expected Output
- A **single CloudFormation YAML file** containing the complete configuration.
- Successfully deploys without errors.
- Includes documentation comments within the template explaining each resource and its purpose.

## Proposed Statement
Create a **single-file CloudFormation YAML configuration** that provisions the above resources in **us-east-1**, adhering strictly to the given security and naming conventions.
