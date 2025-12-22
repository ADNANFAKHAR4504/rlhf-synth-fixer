Prompt
You are required to design an advanced security configuration for an enterprise AWS environment using AWS CloudFormation in YAML. The solution must adhere to strict organizational security policies and best practices.

Requirements
Your CloudFormation template must satisfy the following:

AWS CloudTrail: Enable logging of all API calls within the AWS account to ensure traceability.
Encryption at Rest:
All Amazon S3 buckets must have encryption enabled.
All Amazon RDS instances must have encryption at rest enabled.
VPC Configuration:
Create a VPC with at least two public and two private subnets across two availability zones.
IAM Restrictions:
All IAM roles with AdministratorAccess must be restricted by conditions based on IP address ranges.
AWS Config: Enable AWS Config to monitor compliance with organizational security policies.
Lambda Functions: Ensure all AWS Lambda functions are using the latest available runtime versions.
Security Groups: Audit all security groups to ensure no unrestricted inbound access is allowed on any port.
EC2 SSH Access: Restrict SSH access to EC2 instances using specific CIDR blocks.
MFA Enforcement: Enable multi-factor authentication (MFA) for the root AWS account.
S3 Bucket Policies: All bucket policies must explicitly deny HTTP requests, allowing only HTTPS.
Additional Constraints
Use resource naming conventions with the prefix corp-sec-.
The deployment target region is us-west-2.
Assume existing AWS accounts and VPC IDs are provided.
The template must be fully executable in CloudFormation, passing all linting, build, and validation checks.
Expected Output
A CloudFormation YAML template (.yaml file) implementing all the above requirements.
The template should be modular, readable, and follow best practices for enterprise security configurations.
Ensure that all security and compliance rules are enforced in the deployed resources.