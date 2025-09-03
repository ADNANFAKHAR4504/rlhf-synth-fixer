Generate a production-ready secure_infrastructure.yaml CloudFormation template that provisions a fully secure AWS infrastructure. The template must be well-structured, YAML-valid, and follow AWS security best practices. Include inline comments for readability and maintenance.

Requirements:

Networking:

Create two VPCs, each with public and private subnets, route tables, and proper associations.

Configure VPC Peering between them for secure communication.

Apply Security Groups and Network ACLs to strictly control inbound/outbound traffic.

IAM & Access Control:

Define IAM Roles and Policies enforcing least privilege.

Ensure Lambda and other services only get minimum required permissions.

Encryption & Secrets:

Use AWS KMS for encrypting all resources (S3, RDS, CloudTrail, etc.).

Configure S3 buckets with SSE-KMS, bucket policies, and block public access.

Enable RDS with encryption at rest.

Integrate AWS Secrets Manager for sensitive information.

Use AWS SSM Parameter Store for secure parameter handling.

Monitoring & Logging:

Enable CloudTrail with logs encrypted in S3.

Enable AWS Config with compliance rules and automatic remediation actions.

Enable GuardDuty for threat detection.

Configure AWS Shield Advanced for DDoS protection.

Deploy AWS WAF for web app protection.

Configure CloudWatch Alarms for visibility.

High Security Standards:

Ensure ELB listeners use HTTPS/TLS.

Enforce multi-AZ deployments where applicable.

Implement AWS Backup strategy across regions.

Tagging & Naming:

Apply strict resource tagging (Environment, Project, Owner, CostCenter, etc.) across all resources.

Follow consistent security naming conventions for resources.

Output:

A single file named secure_infrastructure.yaml.

YAML-validated, deployable without errors.

Written to be reusable across multiple accounts/regions (parameters for VPC CIDRs, environment names, etc.).

Comprehensive inline comments explaining each resource.