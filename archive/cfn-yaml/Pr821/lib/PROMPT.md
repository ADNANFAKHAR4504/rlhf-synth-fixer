Objective: Create an AWS CloudFormation template in YAML format named security-config.yaml that enforces security best practices across multiple AWS services.

Requirements:

1. Amazon S3 Encryption:
• All S3 buckets defined in the template must have server-side encryption enabled using AWS Key Management Service (KMS).
• Create a KMS key within the template and configure bucket policies to use this key for encryption.
• Ensure bucket policies explicitly deny unencrypted uploads and enforce encryption with the KMS key.
2. IAM Roles and Policies:
• Define IAM roles and policies for each AWS service in the template.
• Policies must follow the principle of least privilege granting only the specific actions and resources necessary for the intended functionality.
• Avoid wildcard actions (\*) and restrict to explicitly required resources.
3. Resource Tagging:
• Apply the organizations standard tagging policy to every resource created in the template.
• Required tags:
• Environment parameterized (e.g., dev, staging, prod).
• Owner parameterized (e.g., team or individual name).
• Project parameterized (e.g., project name).
• Ensure tags are consistently applied across all supported resources.
4. AWS Lambda Security:
• All Lambda functions must run inside a Virtual Private Cloud (VPC).
• Create the necessary VPC, subnets, and security groups in the template (or allow them to be provided as parameters).
• Ensure outbound access is controlled, and inbound traffic is restricted to only necessary sources.

General Requirements:
• The template should be deploy-ready and logically organized into parameters, resources, outputs, and optional mappings.
• Use parameterization for configurable values such as environment name, VPC settings, and KMS key alias.
• Follow AWS security and compliance best practices for IAM, networking, and encryption.
• Include inline comments explaining important configurations, especially where security controls are applied.
• Ensure that dependencies between resources are properly defined so that the stack can deploy without manual ordering.
• Use meaningful, consistent naming conventions for all resources, incorporating the Environment parameter in resource names where appropriate.

Expected Output:
A single CloudFormation YAML file named security-config.yaml containing:
• Encrypted S3 bucket definitions using KMS.
• A KMS key and key policy.
• IAM roles and least-privilege policies.
• Lambda functions deployed in a VPC.
• VPC, subnet, and security group configurations.
• Consistent tagging for all resources.
• Inline comments describing security measures.
