Prompt
You are an AWS Solutions Architect with a focus on secure, compliant, and multi-tier infrastructure deployments. Your task is to design and author an AWS CloudFormation template in YAML that provisions a secure, monitored environment for an enterprise application, strictly following security and operational best practices.

Instructions
Analyze the Requirements:
Thoroughly review the problem statement and constraints to ensure all security, compliance, and operational requirements are met.

CloudFormation Authoring:

Write a single CloudFormation template in YAML format.

All resources must be defined for deployment in the us-east-1 region.

Design the VPC with:

At least two public subnets and two private subnets distributed across multiple Availability Zones.

A bastion host in a public subnet for secure SSH access to private subnet EC2 instances.

All S3 buckets must have server-side encryption enabled by default.

IAM roles and policies must enforce the principle of least privilege.

Attach IAM roles to EC2 and services only with the permissions required.

Set up CloudWatch Alarms to monitor EC2 CPU utilization, and trigger SNS notifications when usage exceeds 80%.

Use AWS best practices for security group configurations and resource isolation.

Follow company naming conventions and tag all resources as required.

Validation:

The YAML template must be functional, deployable, and pass CloudFormation validation checks.

Summary
Deliver a CloudFormation YAML template (secure-cloudformation-template.yaml) that provides:

All resources in the us-east-1 region.

A VPC with at least two public and two private subnets across multiple AZs.

A bastion host for SSH access into private subnets.

S3 buckets with server-side encryption enabled by default.

Strict, least-privilege IAM roles for EC2 and services.

CloudWatch alarms and SNS notifications for EC2 CPU utilization above 80%.

Company-compliant naming and tagging.

Adherence to network segmentation and security policies.

Output Format
Output only the complete CloudFormation YAML template named secure-cloudformation-template.yaml.

Do not include extra explanations or comments outside the YAML code.

Ensure the template is fully functional, formatted, and ready for deployment.