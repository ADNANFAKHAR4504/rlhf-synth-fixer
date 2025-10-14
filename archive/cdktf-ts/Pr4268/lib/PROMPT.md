You are required to develop a secure, high-availability AWS infrastructure using the AWS Cloud Development Kit for Terraform (CDKTF) in TypeScript.  
Your solution must be organized into exactly two files:
- `modules.ts` — defines all modular reusable components.
- `tap-stack.ts` — composes and deploys the full environment.

---

## Problem Overview

Your goal is to create a scalable and security-compliant cloud environment for a web application using CDKTF with TypeScript.  
The environment should span two availability zones to ensure high availability and fault tolerance.  

You must build and connect the core infrastructure components — VPC, EC2, RDS, S3, CloudWatch, IAM, Secrets Manager, and KMS — ensuring that encryption, restricted access, and monitoring are properly implemented.

All sensitive data, such as database credentials, must be stored securely using AWS Secrets Manager, and encryption keys must be managed through AWS KMS with annual rotation enabled.

---

## Core Requirements

### 1. Networking and VPC
- Create a VPC with two Availability Zones for high availability.  
- Define both public and private subnets in each AZ.  
- Configure NAT gateways or routing as needed for private subnet egress.  
- Apply VPC flow logs to capture and analyze network traffic for security auditing.  
- Tag all networking resources with standard tags (`Environment: Production`, `Compliance: CIS`).

---

### 2. RDS (PostgreSQL) Setup
- Deploy an RDS PostgreSQL instance within the private subnet.  
- Ensure encryption at rest is enabled using AWS KMS.  
- Configure automated backups with a 7-day retention period.  
- Enable Multi-AZ deployment for fault tolerance and disaster recovery.  
- Ensure storage encryption and SSL connections are enforced.  
- Store database credentials securely in AWS Secrets Manager.  
- Allow inbound traffic only from authorized EC2 instances via security group rules.  

---

### 3. EC2 Instance Configuration
- Launch an EC2 instance in the public subnet.  
- Attach an IAM role granting only necessary permissions (e.g., read/write access to S3 logs and read access to Secrets Manager).  
- Configure the instance to send logs to CloudWatch for centralized monitoring.  
- Implement an S3 bucket for EC2 log storage, with:
  - Bucket encryption (KMS)
  - Block public access
  - Strict access policy granting write access only to the EC2 instance role  
- Ensure EC2 to RDS connectivity is properly restricted and verified through security groups.  

---

### 4. IAM and Security Controls
- Define IAM roles and policies adhering to the principle of least privilege.  
- Ensure IAM roles are used instead of static credentials.  
- Apply KMS-managed encryption for sensitive resources.  
- Configure KMS key rotation to occur annually.  
- Restrict EC2 and RDS communication via tightly scoped security groups.  

### 5. Logging, Monitoring, and Metrics
- Enable CloudWatch Logs for:
  - EC2 instance logs
  - RDS error logs
  - VPC flow logs
  - Application metrics  
- Aggregate all logs from AWS services into CloudWatch Log Groups.  
- Create a CloudWatch Metric Filter to capture failed RDS connection attempts.  
- Implement CloudWatch Alarms to alert on repeated connection failures or unauthorized attempts.  
- Ensure all log groups have encryption and retention policies configured.

---

### 6. High Availability & Compliance
- Deploy infrastructure across two Availability Zones for redundancy.  
- All data at rest must be encrypted using AWS KMS.  
- Comply with AWS CIS Benchmark security best practices:
  - No public RDS or unrestricted access ports.  
  - Logging and monitoring are enabled for all critical resources.  
  - IAM access is least-privileged and MFA-ready.  
- Ensure the deployment can pass compliance scans or security audits.

---

## CDKTF Project Structure

### 1. `modules.ts`
Defines modular CDKTF constructs for each major service:
- VpcModule: Creates the VPC, subnets, routing, and flow logs.  
- RdsModule: Deploys the PostgreSQL instance with encryption and backups.  
- Ec2Module: Creates the EC2 instance, IAM role, and security groups.  
- S3Module: Sets up the encrypted S3 log bucket with correct permissions.  
- CloudWatchModule: Aggregates logs, defines metric filters and alarms.  
- KmsModule: Creates and manages KMS keys with annual rotation.  

Each module must expose clear outputs for other modules to consume (e.g., VPC IDs, Subnet IDs, Security Group ARNs).

---

### 2. `tap-stack.ts`
This file integrates all modules into one cohesive deployment:
- Import all modules from `modules.ts`.  
- Define provider and region configuration (`us-east-1`).  
- Instantiate modules in logical order (VPC → KMS → RDS → EC2 → S3 → CloudWatch).  
- Pass required references between modules (e.g., VPC from `VpcModule` to `RdsModule`).  
- Apply consistent resource tagging:
  - `Environment: Production`  
  - `Compliance: CIS`  
  - `Security: True`  
- Export stack outputs such as:
  - RDS endpoint  
  - EC2 public IP  
  - S3 bucket name  
  - KMS key ID  
  - CloudWatch log group names  

---

## Constraints Summary

- Define all resources using AWS CDKTF (TypeScript).  
- Create a VPC with public and private subnets.  
- Provision an RDS PostgreSQL instance in a private subnet.  
- Create an EC2 instance in a public subnet with access to RDS.  
- Use S3 for EC2 logs, encrypted and access-controlled.  
- Attach IAM roles with limited permissions to EC2.  
- Enforce encryption at rest for RDS and S3 using KMS.  
- Aggregate logs into CloudWatch and implement metric filters for failed RDS connections.  
- Ensure compliance with AWS CIS Benchmark security standards.  
- Enable automatic backups for RDS with a 7-day retention period.  
- Deploy infrastructure across two Availability Zones.  
- Rotate KMS keys annually for compliance.

---

## Deliverables

- `modules.ts`: Defines reusable infrastructure modules (VPC, RDS, EC2, S3, CloudWatch, KMS, Secrets Manager).  
- `tap-stack.ts`: Integrates all modules into a deployable CDKTF stack.  
- Unit Tests: Validate:
  - VPC and subnet configuration  
  - Encryption settings  
  - IAM role and permission boundaries  
  - CloudWatch metric filters and alarms  
- Deployment Instructions:
  - `cdktf synth` — generate Terraform configuration  
  - `cdktf deploy` — deploy the infrastructure  
  - `cdktf destroy` — clean up all resources  

The final deployment must meet security, availability, and compliance requirements and pass all defined validation tests successfully.