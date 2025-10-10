You are required to develop a secure, highly available AWS web application infrastructure using the AWS Cloud Development Kit for Terraform (CDKTF) in TypeScript.  
Your project must be organized into two main files:
- `modules.ts` — defines reusable infrastructure modules  
- `tap-stack.ts` — composes and deploys the full stack  

The goal is to replicate the functionality of a JSON-based CloudFormation template through modular, programmatic CDKTF constructs that ensure scalability, security, and reliability across multiple AWS services.

---

## Problem Overview

You need to design a production-ready AWS environment that hosts a web application running in the us-east-1 region.  
The architecture should ensure high availability, secure access control, encrypted data, and centralized logging.  

All AWS resources must follow best practices for fault tolerance, security, and compliance while providing efficient routing, data protection, and simplified management.  
Your solution should use CDKTF in TypeScript and produce a deployable IaC (Infrastructure as Code) solution.

---

## Core Requirements

### 1. VPC and Networking
- Create a VPC with at least two Availability Zones for redundancy.  
- In each AZ, configure public and private subnets.  
- Deploy Internet Gateways for public traffic and NAT Gateways for private subnet outbound access.  
- Set up route tables and associations for both subnet types.  
- Ensure DNS support and hostnames are enabled within the VPC.  
- Enable VPC Flow Logs for monitoring and auditing traffic patterns.  

---

### 2. Elastic Load Balancer (ELB)
- Launch an Application Load Balancer (ALB) across multiple AZs.  
- Route HTTP/HTTPS traffic to EC2 instances in private subnets.  
- Configure listener rules for application routing (HTTP → HTTPS redirection).  
- Use an ACM certificate for HTTPS termination.  
- Enable access logging for the ALB to an encrypted S3 bucket.  

---

### 3. Compute Layer (EC2)
- Deploy EC2 Auto Scaling Groups (ASG) to handle dynamic workloads.  
- Use Launch Templates for consistent instance configurations.  
- Associate IAM roles with EC2 instances to securely access S3 and other AWS services.  
- Deploy EC2 instances into private subnets for added security.  
- Attach security groups with only necessary ingress/egress rules:
  - Allow HTTP/HTTPS traffic from the ALB.
  - Deny all SSH access from the public internet.
- Enable CloudWatch agent on EC2 instances for logging and performance metrics.  

---

### 4. Database Layer (RDS)
- Deploy an Amazon RDS instance in a Multi-AZ configuration for high availability.  
- Use Amazon RDS for MySQL or PostgreSQL.  
- Enable automated backups with a minimum of 7 days retention.  
- Ensure RDS encryption at rest (KMS) and SSL in transit are enabled.  
- Restrict database access to private subnets only.  
- Enable enhanced monitoring and audit logging.  

---

### 5. Storage and Logging (S3 + CloudTrail)
- Create an S3 bucket for:
  - Application asset storage.
  - Access logs from ELB and CloudTrail.
- Enable versioning, server access logging, and default encryption (KMS).  
- Apply strict bucket policies that:
  - Block all public access.
  - Deny public write operations.  
- Enable AWS CloudTrail to track infrastructure changes across all regions and send logs to the S3 bucket.  

---

### 6. Content Delivery (CloudFront)
- Create a CloudFront Distribution with:
  - S3 origin for static assets.
- Enable origin access control (OAC) to restrict direct access to the S3 bucket.  
- Enable logging and caching for performance and security monitoring.  


### 7. Monitoring and Auditing
- Enable CloudWatch metrics, alarms, and dashboards for:
  - EC2 instance health.
  - RDS performance.
  - ALB request metrics.
- Enable detailed monitoring for all resources that support it.  
- Centralize logs from EC2, ALB, and RDS into S3 or CloudWatch Logs.  
- Set up alarms to detect anomalies, unauthorized access, or resource failures.  

---

### 8. Security and Compliance
- Apply IAM roles and policies to enforce the principle of least privilege.  
- Ensure no security groups allow `0.0.0.0/0` access except for HTTP/HTTPS.  
- Encrypt all data at rest (KMS) and in transit (TLS/SSL).  
- Enable AWS Config rules or CDKTF validation logic (not recorder) to check for compliance.  
- Tag all resources with:
  - `Environment: Production`
  - `Owner: DevOps`
  - `Security: Enforced`  

---

## CDKTF Project Structure

### `modules.ts`
Define modular constructs for:
- VpcModule — VPC, subnets, NAT, and routing.  
- Ec2Module — Launch templates, ASG, and instance profiles.  
- RdsModule — Multi-AZ RDS setup with encrypted storage and backups.  
- ElbModule — Application Load Balancer with HTTPS listeners and logging.  
- S3Module — Encrypted buckets with access logging and policies.  
- CloudFrontModule — CDN with HTTPS and domain integration.  
- Route53Module — DNS and domain routing.  
- MonitoringModule — CloudWatch metrics, alarms, and logging integrations.  
- SecretsModule — SSM Parameter Store for secure secret management.  
- CloudTrailModule — Centralized logging and audit trails.  

Each module should expose input parameters (e.g., VPC ID, subnet IDs, roles) and output key resource details (e.g., ALB endpoint, RDS endpoint).

---

### `tap-stack.ts`
Compose all modules into a single CDKTF stack:
- Configure the AWS provider for `us-east-1`.  
- Instantiate and interconnect modules in dependency order:
  - `VpcModule` → `Ec2Module`, `RdsModule`, `ElbModule`  
  - `S3Module` → `CloudTrailModule`, `CloudFrontModule`  
  - `SecretsModule` → `RdsModule`, `Ec2Module`  
- Apply global resource tagging.  
- Output key resource identifiers:
  - ALB DNS name  
  - RDS endpoint  
  - CloudFront distribution domain  
  - S3 log bucket name  
  - Route 53 hosted zone ID  

---

## Constraints Summary

- Use AWS CDKTF in TypeScript.  
- Enable logging for all supported resources.  
- Implement a multi-AZ VPC with public and private subnets.  
- Route private subnet traffic via NAT Gateway.  
- Use secure security groups with minimal exposure.  
- Tag all resources with `'Environment: Production'`.  
- Store logs in an S3 bucket with versioning and access logging.  
- Use RDS Multi-AZ for database redundancy.  
- Apply IAM roles to EC2 instead of credentials.  
- Encrypt data at rest and in transit.  
- Manage secrets in Parameter Store.  
- Use Elastic Load Balancer for incoming traffic.  
- Retain RDS backups for 7 days minimum.  
- Restrict security groups to avoid open ports.  
- Configure CloudFront with HTTPS and custom domain.  
- Manage domains and records via Route 53.  
- Enable CloudTrail for full auditability.  
- Deny public write access to S3 buckets.  

---

## Deliverables

- `modules.ts`: Defines modular constructs for networking, compute, database, storage, monitoring, and security.  
- `tap-stack.ts`: Integrates modules into a cohesive CDKTF stack with outputs and tagging.  
- Unit Tests:
  - Validate subnet creation, ALB configuration, RDS encryption, IAM roles, and S3 policies.  
  - Ensure all constraints are programmatically verified.  
- Deployment Steps:
  1. `cdktf synth` — Generate Terraform configuration  
  2. `cdktf deploy` — Deploy stack to AWS  
  3. `cdktf destroy` — Tear down infrastructure  

The final infrastructure must be fully compliant, secure, and production-grade, meeting all specified requirements and constraints.
