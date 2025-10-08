We need to implement a secure, monitored, and scalable AWS infrastructure using CDK for Terraform (CDKTF) in TypeScript.  
This setup replaces a traditional CloudFormation YAML approach and must be delivered as a two-file CDKTF project consisting of:
- `modules.ts`
- `tap-stack.ts`

---

## Problem Overview

Your goal is to design and deploy a production-grade AWS environment that prioritizes security, encryption, and availability.  
The environment should follow AWS best practices for VPC architecture, IAM policy design, encryption management, and network restrictions.  
All resources must be deployed in the eu-north-1 region.

---

## Core Requirements

1. Region & Environment Setup
   - Use the eu-north-1 AWS region for all deployments.
   - Apply consistent tagging for environment identification (e.g., `Environment: Production`).

2. Storage Configuration
   - Create an S3 bucket for primary storage with:
     - Server access logging enabled, directing logs to a separate log bucket.
     - Public access blocked by default.
     - Bucket policies granting access only to designated IAM roles.
     - Server-side encryption (SSE-KMS) enabled.

3. IAM & Access Management
   - Implement IAM users and roles that follow the least privilege principle.
   - Define inline IAM policies granting minimal required permissions.
   - Assign instance profiles to EC2 instances for secure credential delivery.
   - Prohibit hard-coded credentials in any configuration.

4. Networking
   - Create a VPC with a CIDR block (e.g., `10.0.0.0/16`).
   - Include at least two public and two private subnets distributed across multiple Availability Zones.
   - Attach an Internet Gateway for public subnets and a NAT Gateway for private subnets.
   - Enable VPC Flow Logs for traffic monitoring and auditing.
   - Configure security groups to:
     - Allow SSH (port 22) access only from a specified IP range.
     - Restrict all other unnecessary inbound and outbound traffic.

5. Compute Resources
   - Deploy an EC2 instance within the VPC.
   - Integrate it into an Auto Scaling Group configured with:
     - Minimum size: 2 instances
     - Maximum size: 5 instances
   - Ensure all instances are launched with IAM instance profiles and detailed CloudWatch monitoring enabled.

6. Database Layer
   - Set up an RDS instance within private subnets:
     - Encrypted at rest using AWS-managed KMS keys.
     - Not publicly accessible.
     - Configured with automatic backups enabled.

7. Monitoring & Logging
   - Enable AWS CloudTrail for account-wide API activity logging.
   - Use AWS Config for continuous monitoring of resource configurations and compliance tracking.
   - Forward all logs (S3, VPC, CloudTrail) to an encrypted log storage S3 bucket.
   - Use CloudWatch metrics and alarms for operational visibility.

8. Encryption & Key Management
   - Use AWS Key Management Service (KMS) for managing encryption keys.
   - Ensure all storage layers (S3, RDS, EBS) are encrypted at rest with KMS-managed keys.

---

## File Structure

### 1. `modules.ts`
Define individual CDKTF modules for:
- VPC Module → subnets, IGW, NAT Gateway, route tables, flow logs  
- IAM Module → least privilege roles, policies, and instance profiles  
- S3 Module → main and log buckets with encryption and access restrictions  
- EC2 Module → instance definitions, security groups, and autoscaling  
- RDS Module → encrypted database instance in private subnets  
- CloudTrail Module → audit logging to S3 with encryption  
- Config Module → AWS Config rules and compliance tracking  
- KMS Module → key creation and management for all encryption tasks  

Each module should be designed to be reusable and independently testable.

---

### 2. `tap-stack.ts`
- Import and integrate all modules defined in `modules.ts`.  
- Initialize the AWS provider with `eu-north-1` as the default region.  
- Configure dependencies between modules:
  - VPC IDs linked to EC2, RDS, and Lambda (if any)
  - CloudTrail and Config using the log S3 bucket
  - IAM roles attached to EC2 and S3
- Apply global tagging and environment metadata.
- Output resource details such as:
  - VPC ID
  - Public/Private Subnet IDs
  - EC2 Instance IDs
  - RDS Instance ARN
  - S3 Bucket Names
  - CloudTrail Log Bucket ARN
  - KMS Key ARNs

---

## Constraints Summary

- All resources deployed in eu-north-1.  
- S3 bucket must log to a separate log bucket.  
- IAM users must follow least privilege.  
- EC2 instances deployed within a VPC with 2 public and 2 private subnets.  
- Restrict SSH to a specific IP range only.  
- RDS database must be encrypted at rest with AWS-managed keys.  
- S3 bucket policy: deny public access by default.  
- CloudTrail logging enabled for all activity.  
- AWS Config must be enabled for continuous compliance monitoring.  
- Instance profiles must be used instead of hard-coded credentials.  
- Auto Scaling with min=2, max=5 EC2 instances.  
- VPC flow logs must be enabled for traffic auditing.  
- KMS used to manage all encryption keys.  
- All resources tagged for production environment visibility.

---

## Deliverables

- `modules.ts` → defines modular components (VPC, IAM, S3, EC2, RDS, CloudTrail, Config, KMS)  
- `tap-stack.ts` → assembles and orchestrates modules into a secure deployable stack  
- Ensure CDKTF code:
  - Synthesizes successfully (`cdktf synth`)
  - Passes validation checks (`terraform validate`)
  - Complies with all security, encryption, and compliance constraints  
  - Represents a secure, production-grade AWS infrastructure