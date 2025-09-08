You are tasked with designing a secure and efficient AWS environment using CDK for Terraform (CDKTF) in TypeScript. The environment must support a web application while adhering to strict compliance and security regulations.

Requirements & Constraints

Use CDK for Terraform (CDKTF) in TypeScript to define all infrastructure.

All reusable components must be defined in modules.ts.

The root stack must be in tap-stack.ts, which imports and uses resources from modules.ts.

Do not create or modify any other files.

Infrastructure & Security Constraints

Infrastructure as Code:

Use Terraform (via CDKTF) to manage all resources.

IAM & Security:

Create IAM roles and policies with least privilege.

EC2 instances must launch with an IAM instance profile (no hardcoded creds).

Use AWS KMS for encryption keys (S3, RDS, CloudWatch logs, etc.).

Networking (VPC):

Create a VPC with CIDR 10.0.0.0/16.

At least two subnets across us-west-2a and us-west-2b.

Configure security groups to limit inbound/outbound traffic to defined IP ranges.

Storage (S3):

S3 buckets must have:

Encryption at rest (KMS).

Versioning enabled.

Database (Amazon RDS):

Deploy an RDS instance (Multi-AZ).

Enable automated backups.

Integrate with CloudWatch monitoring.

Configure CloudWatch alarms for CPU and memory usage.

Logging & Monitoring:

Enable CloudWatch logging for all services.

Add alarms for critical resources (EC2, RDS).

Environment Separation:

Single stack must support development and production.

Implement conditions in code to differentiate environments.

Use environment variables for sensitive values (DB credentials, etc.).

Deployment & Automation:

Deployment via CDKTF CLI only (no manual steps).

Naming Convention:

Prefix all resources with SecureApp-.

Region & High Availability:

Deploy in us-west-2.

Must span AZ A & B for redundancy.
