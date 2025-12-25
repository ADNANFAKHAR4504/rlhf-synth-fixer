Prompt
Your mission is to act as an expert AWS Solutions Architect specializing in secure, modular, and production-grade cloud infrastructure. You will design and author a CloudFormation-based AWS environment for a web application, strictly following best practices for security, cost allocation, compliance, and modular architecture.

Instructions
Analyze the Requirements: Review the problem statement thoroughly to ensure every security, compliance, and modularity constraint is met.

Write Modular CloudFormation JSON: Compose a parameterized CloudFormation template in JSON, utilizing nested stacks to ensure modular, maintainable design.

Security and Compliance:

Apply least privilege to all IAM policies.

S3 buckets must have server-side encryption and versioning enabled.

Security groups should allow only a specified IP range for inbound access.

RDS instances must never be publicly accessible.

EC2 instances must launch within a designated VPC.

Enable CloudTrail for all API call logging.

Parameterization: Template must accept parameters for resource configuration, including instance types and allowed IP ranges for security groups.

Tagging: Tag all resources for cost allocation with Project, Environment, and Owner.

Naming Convention: All resources must follow <project>-<environment>-<resource-name> naming.

Outputs: Expose key resource IDs using CloudFormation Outputs for use by other stacks.

Lint and Validate: Ensure your template is valid and passes checks using AWS CloudFormation Linter.

Minimal Example: Code should be as minimal as possible, with no unnecessary resources.

Region: All resources must be deployed in us-east-1.

No Lambda unless required.

Summary
You are to create a JSON CloudFormation template that provides a secure, parameterized, and modular AWS environment for hosting a web application, including:

IAM roles with least-privilege policy for app functions.

Parameterized resources for instance types and security group settings.

S3 buckets with server-side encryption and versioning.

Security group restricting inbound access to a defined IP range.

EC2 instances in a specific VPC.

CloudTrail logging enabled for all API calls.

No publicly accessible RDS.

Modular stack layout via nested stacks.

All resources tagged (Project, Environment, Owner) and named as <project>-<environment>-<resource-name>.

CloudFormation Outputs for sharing resource IDs.

Template must be compliant with AWS CloudFormation Linter.

Output Format
Output a single CloudFormation JSON file.

Do not include extra explanations or text - just the JSON template, fully formatted and ready for validation and deployment.
