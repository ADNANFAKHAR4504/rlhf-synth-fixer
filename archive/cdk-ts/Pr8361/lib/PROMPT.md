# PROMPT

```yaml
You are an expert AWS Solutions Architect with deep expertise in Infrastructure as Code (IaC) using AWS CDK (TypeScript). Your task is to design and define a secure AWS Identity and Access Management (IAM) configuration for a medium-sized enterprise.

Your AWS CDK TypeScript project must comply with the following detailed requirements:

IAM User Group Creation: Create a new AWS IAM user group named DevOps.

Managed Policy Attachment: Assign the AWS managed policy AmazonS3ReadOnlyAccess directly to the DevOps group.

Custom IAM Policy for EC2: Create a custom IAM policy named CustomEC2Policy. This policy must grant permissions specifically to start and stop EC2 instances. Attach this CustomEC2Policy to the DevOps user group.

Idempotency: Ensure that the AWS CDK configurations are inherently idempotent, meaning they can be deployed multiple times without causing unintended side effects or unnecessary state changes. (Note: AWS CDK, by synthesizing CloudFormation, provides this characteristic automatically.)

Resource Tagging: Implement consistent tagging for all IAM resources created by this CDK stack. Each IAM resource must include tags for Environment and Department to facilitate organizational management and identification.

Secure Handling of Sensitive Data: Design the CDK project to avoid hardcoding sensitive information, such as user keys or credentials, directly in the code. Emphasize best practices for managing such data securely (e.g., suggesting the use of AWS Secrets Manager or AWS Systems Manager Parameter Store for actual sensitive data, though not necessarily implementing them in this specific IAM-focused stack).
```
