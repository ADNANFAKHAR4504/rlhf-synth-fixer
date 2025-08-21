Hey there! We need your expertise as an AWS infrastructure engineer to help us build a secure and production-ready infrastructure using Terraform. Our main goal is to ensure our setup follows the best security practices.

**Project Overview:**

- **Our Goal:** Create a secure, multi-region AWS infrastructure.
- **Tool:** We're using Terraform (HCL).
- **Environments:** We need this to work for both our production and staging environments.

**What We Need to Build:**

We're looking to set up a complete infrastructure with the following components:

- **Networking:** A solid VPC with public and private subnets across multiple availability zones.
- **Servers:** EC2 instances for our applications, with their storage encrypted.
- **Database:** A reliable RDS database (MySQL or PostgreSQL) that's also encrypted.
- **Storage:** S3 buckets for our data, locked down and secure.
- **Serverless:** Lambda functions that run within our VPC.
- **Permissions:** IAM roles and policies that grant only the necessary access.
- **Encryption:** KMS keys to manage our encryption.
- **Monitoring:** CloudWatch for logs, alerts, and monitoring.
- **Firewalls:** Security groups to control network traffic.

**Key Security Rules:**

We're serious about security, so please make sure to:

- **Networking:**
  - Name security groups clearly.
  - Restrict access to our EC2 instances to specific IP ranges.
  - Chain security groups correctly (e.g., ALB talks to EC2, EC2 talks to RDS).
- **Data Protection:**
  - Encrypt our RDS database and EBS volumes with our own KMS keys.
  - Make sure our S3 buckets are private.
  - Enable key rotation for our KMS keys.
- **Access Control:**
  - Follow the principle of least privilege for all IAM roles.
  - Use key-based SSH access for our EC2 instances (no passwords).
  - Enforce MFA for all IAM users.
- **Monitoring:**
  - Tag all our resources so we know what's what.
  - Set up CloudWatch alarms for high CPU usage on our EC2 instances.
  - Use trusted AMIs from official sources.

**How Everything Should Connect:**

- The Application Load Balancer should be able to send traffic to the EC2 instances.
- The EC2 instances should be able to connect to the RDS database.
- The EC2 instances should have access to the necessary S3 buckets.
- Our Lambda functions should be able to connect to the database.
- CloudWatch alarms should send notifications to an SNS topic.

**What We Expect from You:**

Please provide a complete Terraform configuration, including:

- `main.tf`: The core infrastructure.
- `variables.tf`: All the configurable options.
- `outputs.tf`: The important outputs we'll need.
- `security.tf`: All the security-related configurations.
- `monitoring.tf`: The monitoring and alerting setup.
- `data.tf`: Data sources for things like AMIs and availability zones.

**A Few Guidelines:**

- Use a consistent naming convention for all resources.
- Tag everything properly.
- Use data sources for dynamic values.
- Use customer-managed KMS keys.
- Create separate security groups for each part of the infrastructure.

**Final Checks:**

Before you're done, please make sure that:

- `terraform validate` and `terraform plan` run without any errors.
- All the security requirements are met.
- The configuration can be deployed in both `us-east-1` and `eu-west-1`.
- The setup works for both production and staging environments.

We're looking for a solution that's secure, well-architected, and ready for production. Thanks for your help!
