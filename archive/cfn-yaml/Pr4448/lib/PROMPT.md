Create a secure, compliant cloud infrastructure using AWS CloudFormation in YAML format, designed for deployment in the ca-central-1 region. The goal is to establish a resilient environment that ensures all data at rest is encrypted and continuously monitored for compliance and security violations.

Begin by defining a default VPC with subnets spanning multiple Availability Zones to achieve high availability. Enable VPC Flow Logs to capture network traffic for auditing purposes. Within this network, create an IAM role for EC2 instances that provides read-only access to S3, using resource-based policies that restrict access by tags to enforce the principle of least privilege.

All S3 buckets must have versioning and server-side encryption enabled using KMS keys, ensuring data at rest remains secure. Similarly, enforce encryption by default for all EBS volumes. To maintain visibility, enable CloudTrail to log all account activity and configure CloudWatch alarms to alert on unauthorized access attempts or suspicious API activity.

Enhance compliance by implementing AWS Config rules that automatically evaluate and report on the configuration state of all resources. Finally, ensure all resources are tagged consistently with project and environment identifiers, following a project-environment naming convention.

The output should be a single, production-ready secure_compliance_infra.yaml file that passes CloudFormation validation, enforces encryption, auditing, and compliance, and follows AWS best practices for security and monitoring.
