The solution delivers a CloudFormation template (lib/TapStack.yml) that provisions a secure, multi-tier AWS environment while avoiding common deployment pitfalls (CloudTrail bucket policy errors, Config recorder duplication, GuardDuty conflicts, AZ indexing issues).

Key Design Choices

VPC & Subnets

Two VPCs (A & B), each with public/private subnets.

Supports up to three Availability Zones (Az1Name, Az2Name, Az3Name).

AZs beyond the first are optional via conditions (UseAz2, UseAz3).

Security Controls

Bastion Security Group restricted to a specific CIDR.

Public/Private subnets separated.

Network ACL added for public subnets.

Encryption & Logging

Central KMS CMK with alias.

Explicit KMS permissions for CloudTrail service principal.

CloudTrail with strict AWS-documented S3 bucket policy + DependsOn to enforce creation order.

Optional AWS Config, gated by EnableConfig parameter to avoid recorder limit errors.

Threat Protection

GuardDuty optional via EnableGuardDuty (avoids “AlreadyExists” error if a detector is active).

Secrets Management

AWS Secrets Manager secret provisioned for storing DB credentials with KMS encryption.

Outputs for Observability

Extensive outputs for VPCs, subnets, security group, KMS, CloudTrail, Config, GuardDuty, and Secrets.

Conditional outputs for optional resources.

Outcomes

Lint-clean: No unused parameters/conditions.

Deploy-safe: Handles CloudTrail, GuardDuty, and Config edge cases gracefully.

Compliant: Encryption, least-privilege, auditing, tagging.

Flexible: Multi-AZ support, toggle for optional services.

Operationally rich: Extended outputs make the template easy to consume across other stacks.

Deliverable

The final deliverable is the lib/TapStack.yml CloudFormation template, which:

Creates a secure foundation for multi-tier workloads.

Avoids repeated deployment errors encountered in earlier iterations.

Provides strong observability and cross-stack reusability through outputs.