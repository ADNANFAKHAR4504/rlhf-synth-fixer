# AWS CloudFormation Template Requirements
Design a secure and scalable AWS CloudFormation YAML template to automate the deployment of a production-ready cloud infrastructure. The template should enable best practices for security, compliance, and operational excellence, ensuring all resources are protected and efficiently managed.

# Environment Setup
- Deploy all resources in the region provided as an environment variable (do not hardcode region).
- Create a Virtual Private Cloud (VPC) that restricts access to specific CIDR ranges.
- Provision S3 buckets with server-side encryption enabled for data protection.
- Implement IAM roles adhering to the principle of least privilege.
- Set up DynamoDB tables with backup enabled and a minimum 7-day retention period.
- Enable AWS Config to continuously monitor and alert on root account credential usage.
- Deploy RDS instances with automatic minor version upgrades enabled.
- Enable AWS CloudTrail to log all API calls across all regions for auditing (ensure 'IsLogging' property is set to true).
- Launch EC2 instances with termination protection enabled to prevent accidental deletion.
- Configure Elastic Load Balancers with cross-zone load balancing enabled.
- Tag all resources with 'Environment:Production'.
- Set up Lambda functions with dead-letter queues for failed events.

# Constraints
- W1011 Use dynamic references over parameters for secrets like database password
- Dont use SUB function where there is no variable
- All resources must be deployed in the region provided as an environment variable (do not hardcode region).
- Only allow VPC access from specified CIDR ranges.
- Enforce server-side encryption for all S3 buckets.
- IAM roles must follow least privilege.
- DynamoDB tables require backup with at least 7-day retention.
- AWS Config must monitor root credential usage.
- RDS must have automatic minor version upgrades.
- CloudTrail must log all API calls across all regions and must have 'IsLogging' set to true.
- EC2 instances must have termination protection enabled.
- ELBs must have cross-zone load balancing.
- All resources must be tagged with 'Environment:Production'.
- Lambda functions must have dead-letter queues.
- Template must pass AWS CloudFormation validation and linting.
- Do not hardcode region; use environment variable or parameter.
- Use dynamic references or parameters for secrets (e.g., passwords), not hardcoded values.
- Do not use 'Fn::Sub' unless variables are required.
- Do not include additional properties not allowed by resource types (e.g., 'BackupPolicy' for DynamoDB is not valid).

# Output Expectations
- A single, production-ready CloudFormation YAML template implementing all requirements above.
- The template must:
  - Deploy all specified AWS resources without error
  - Use descriptive logical resource names
  - Follow AWS best practices and security guidelines
  - Pass AWS CloudFormation validation and cfn-lint checks
