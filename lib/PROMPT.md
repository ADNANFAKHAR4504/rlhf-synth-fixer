You are required to build a security-focused AWS infrastructure using the AWS Cloud Development Kit for Terraform (CDKTF) in TypeScript.  
This project must be structured into two primary files:
- `modules.ts`
- `tap-stack.ts`

The solution replaces the CloudFormation-based enforcement logic with a CDKTF-driven implementation, where each security requirement is programmatically validated or configured via reusable modules.  
The system should enforce AWS security best practices while maintaining modularity, scalability, and clarity.

---

## Problem Overview

Your goal is to develop an infrastructure solution that ensures organization-wide security compliance across multiple AWS services.  
This solution will define modules for IAM, EC2, S3, RDS, Lambda, CloudTrail, and Networking (VPC)—each enforcing security configurations automatically upon deployment.

All resources must follow AWS best practices for encryption, access control, and network protection.  
Additionally, unit tests must be implemented to validate that each configuration satisfies the defined security constraints.

---

## Core Requirements

### 1. IAM Security
- Enforce permission boundaries for all IAM roles to prevent privilege escalation.  
- Ensure IAM users have Multi-Factor Authentication (MFA) enabled.  
- Restrict IAM user and role permissions strictly to follow the principle of least privilege.  
- Prohibit the use of unmanaged IAM users or access keys without rotation policies.  
- Validate IAM policies for overly broad permissions before deployment.

---

### 2. EC2 Configuration
- Ensure all EC2 instances launch with encrypted EBS volumes (using AWS KMS).  
- Deploy instances within private subnets of a predefined VPC.  
- Enforce security groups that restrict SSH access to known IP ranges only—deny `0.0.0.0/0` on port 22.  
- Associate EC2 instances with IAM instance profiles that allow only necessary permissions (e.g., access to CloudWatch or S3).  

---

### 3. S3 Security
- All S3 buckets must use KMS encryption for data at rest.  
- Enable S3 Block Public Access settings at both account and bucket levels.  
- Implement bucket policies that explicitly deny any public access attempts.  
- Configure server access logging to record all access events.  
- Restrict access to specific IAM roles only, avoiding open permissions.

---

### 4. RDS Security
- Deploy RDS instances and snapshots with KMS encryption enabled.  
- Ensure RDS is not publicly accessible, allowing traffic only from EC2 or application subnets within the same VPC.  
- Enable automated backups and Multi-AZ deployment for reliability.  
- Create RDS parameter groups with security-focused settings such as enforced SSL connections.

---

### 5. Lambda and Logging
- Enable detailed logging for all AWS Lambda functions using CloudWatch Logs.  
- Ensure all Lambda functions run within a VPC for controlled network access.  
- Use IAM roles with least privilege for Lambda execution.  
- Encrypt Lambda environment variables using KMS keys.  

---

### 6. CloudTrail and Monitoring
- Enable AWS CloudTrail across all regions to capture management and data events.  
- Encrypt CloudTrail logs using KMS keys and store them in a secure S3 bucket with access logging enabled.  
- Create CloudWatch Alarms to alert on suspicious activities such as unauthorized access attempts or policy changes.  
- Ensure all CloudWatch log groups have defined retention periods and encryption enabled.

---

### 7. Networking and VPC
- Deploy all infrastructure within a VPC that includes private subnets for secure internal workloads.  
- Deny inbound SSH (port 22) access from `0.0.0.0/0` globally.  
- Allow only HTTP/HTTPS traffic where necessary for public-facing services.  
- Enable VPC Flow Logs for continuous monitoring of network traffic.  
- Tag all VPC resources consistently with metadata such as `Environment: Production` and `Security: Enforced`.

---

## CDKTF Project Structure

### 1. `modules.ts`
This file defines modular and reusable CDKTF constructs for each security component:

- IamModule:  
  - Defines IAM roles, policies, and permission boundaries.  
  - Enforces MFA for IAM users.  

- Ec2Module:  
  - Launches EC2 instances with encrypted EBS volumes.  
  - Implements restrictive security groups.  

- S3Module:  
  - Creates S3 buckets with KMS encryption and public access blocked.  

- RdsModule:  
  - Deploys encrypted RDS instances and snapshots.  

- LambdaModule:  
  - Defines Lambda functions with logging, encryption, and VPC integration.  

- CloudTrailModule:  
  - Configures organization-wide CloudTrail with KMS-encrypted logs.  

- VpcModule:  
  - Establishes private subnets, route tables, and flow logs for secure networking.  

Each module must be designed for reusability and follow CDKTF best practices for modular IaC.

---

### 2. `tap-stack.ts`
This file composes all modules into a single, deployable infrastructure stack:
- Imports all modules from `modules.ts`.  
- Instantiates and connects dependencies between them:
  - VPC → EC2, Lambda, RDS.  
  - IAM → EC2, Lambda, S3 access controls.  
  - S3 → CloudTrail and logging targets.  
- Defines the AWS provider configuration for the `us-east-1` region.  
- Applies consistent tagging across all resources:
  - `Environment: Production`  
  - `Compliance: Enforced`  
  - `Security: True`  
- Outputs compliance verification results such as:
  - IAM role compliance status.  
  - S3 encryption verification.  
  - CloudTrail activation status.  

---

## Constraints Summary

- All IAM roles must have permission boundaries.  
- Encrypt EBS volumes attached to EC2 instances.  
- Enforce KMS encryption for all S3 buckets.  
- Deny ingress from `0.0.0.0/0` on port 22 (SSH).  
- Require MFA for all IAM users.  
- Enforce S3 public access block.  
- Ensure CloudTrail is enabled in all AWS regions.  
- Enable detailed Lambda logging.  
- Encrypt all RDS snapshots.  
- Deploy all resources in a VPC with private subnets.  
- Apply least privilege to IAM users and roles.  

---

## Deliverables

- `modules.ts`: Reusable CDKTF modules for IAM, EC2, RDS, S3, Lambda, CloudTrail, and VPC.  
- `tap-stack.ts`: Integrates all modules into a single secure infrastructure stack.  
- Unit Tests:  
  - Validate encryption, IAM boundaries, MFA enforcement, and access restrictions.  
  - Ensure CloudTrail and Lambda logging configurations are correct.  
- Deployment Documentation:  
  - Commands for synthesis (`cdktf synth`), deployment (`cdktf deploy`), and teardown (`cdktf destroy`).  
  - Testing instructions and validation steps.  

All components must align with AWS security best practices and deploy successfully via CDKTF without manual intervention.
