You are required to develop a **secure, scalable, and production-grade AWS infrastructure** using the **AWS Cloud Development Kit for Terraform (CDKTF)** in **TypeScript**.  
Your solution must be organized into exactly **two files**:
- `modules.ts` — defines all modular infrastructure components.
- `tap-stack.ts` — composes and deploys the full environment stack.

The design should mirror AWS CloudFormation best practices, implementing the full environment in the **us-west-2 region** with security, scalability, and operational visibility as key priorities.

---

## Problem Overview

Your task is to design and implement a **TypeScript-based CDKTF application** that provisions a **secure, highly available cloud environment** for a web application.  
The infrastructure should span multiple Availability Zones and utilize **encryption, IAM least-privilege, and logging** as core principles.  

The solution must include **S3, EC2, RDS (PostgreSQL), CloudWatch, SNS, CloudFront, IAM, and VPC** components — all integrated within a well-structured, tagged, and encrypted environment.

---

## Core Requirements

### 1. **VPC and Networking**
- Create a **VPC** with:
  - **Two public subnets**
  - **Two private subnets** (spread across different Availability Zones)
- Include a **NAT Gateway** in one of the public subnets to allow secure outbound internet access from private resources.  
- Configure appropriate **routing tables** for public and private subnets.  
- Tag all networking resources with `Environment: Production`.

---

### 2. **S3 Logging and Content Storage**
- Create an **S3 bucket** dedicated to storing **application and system logs**.  
- Enable **versioning** on the bucket for change tracking and recovery.  
- Apply **server-side encryption** (AES-256 or KMS-based).  
- Restrict public access entirely using **S3 Block Public Access settings**.  
- Set up **logging policies** that route logs to this bucket.  
- Optionally, configure **lifecycle rules** for log retention and cost management.

---

### 3. **IAM Roles and Permissions**
- Define an **IAM role** with **least-privilege permissions**:
  - Grant read access to the logging S3 bucket.  
  - Allow access to the RDS database (limited to required actions).  
- Attach the IAM role to the EC2 instance for secure credential access.  
- Ensure all IAM entities follow AWS best practices (no inline policies, no wildcard `*` actions).

---

### 4. **Amazon RDS (PostgreSQL)**
- Provision an **Amazon RDS PostgreSQL** instance:
  - Multi-AZ deployment for high availability.  
  - Automated backups enabled with a **7-day retention period**.  
  - Deployed in **private subnets** to prevent public exposure.  
  - Enable **encryption at rest** using an **AWS KMS key**.  
  - Apply parameter groups and subnet groups for optimal configuration.  
- Tag the RDS instance with `Environment: Production`.  
- Ensure only the EC2 instance and administrative IAM role can access the RDS endpoint.

---

### 5. **Amazon EC2 Instance**
- Launch an **EC2 instance** in the **public subnet** for application hosting or access purposes.  
- Restrict **SSH access** to a specific IP range via a **Security Group** (e.g., office or admin IP).  
- Attach the **IAM role** defined earlier for secure S3 and RDS connectivity.  
- Configure **CloudWatch agent** on the instance for detailed metrics (CPU, memory, network, disk).  
- Store **system logs** in the centralized S3 bucket.  

---

### 6. **Monitoring and Notifications**
- Use **Amazon CloudWatch** to monitor EC2 and RDS performance metrics.  
- Create **CloudWatch Alarms** to detect critical conditions (e.g., high CPU utilization or RDS storage thresholds).  
- Configure an **SNS topic** to send **email notifications** when alarms are triggered.  
- Ensure log retention and encryption are enabled in CloudWatch.

---

### 7. **Content Delivery with CloudFront**
- Set up an **Amazon CloudFront Distribution** to serve content from the S3 bucket globally.  
- Configure **origin access control (OAC)** to ensure CloudFront is the only entity that can read from S3.  
- Enforce **HTTPS-only access** using an ACM-issued SSL certificate.  
- Enable caching and compression for optimized performance.  

---

### 8. **Encryption and Security**
- Use **AWS KMS** for all encryption tasks:
  - Encrypt RDS database storage and snapshots.  
  - Encrypt S3 buckets.  
  - Rotate encryption keys annually.  
- Ensure all resources deny public access unless explicitly required (e.g., CloudFront HTTPS).  
- Apply **least-privilege IAM roles**, **VPC security groups**, and **NAT Gateway isolation** to limit attack surface.  

---

### 9. **Tagging and Compliance**
- Apply consistent tagging across all AWS resources:
  - `Environment: Production`  
  - `Owner: DevOpsTeam`  
  - `Compliance: SecurityBaseline`  
- Ensure all configurations follow **AWS Well-Architected Framework** and **CIS Benchmark** standards.

---

## CDKTF Project Structure

### 1. **`modules.ts`**
Defines modular infrastructure components, each as a reusable construct:
- **VpcModule** — creates VPC, subnets, routing, and NAT Gateway.  
- **S3Module** — defines the logging bucket with versioning and encryption.  
- **IamModule** — defines IAM roles and policies with restricted permissions.  
- **RdsModule** — provisions the PostgreSQL RDS instance with Multi-AZ and backup retention.  
- **Ec2Module** — deploys an EC2 instance with appropriate IAM role and security group.  
- **MonitoringModule** — configures CloudWatch metrics, alarms, and SNS topic.  
- **CloudFrontModule** — delivers content from S3 globally with secure access controls.  
- **KmsModule** — manages encryption keys and enforces rotation.

Each module must export key attributes (e.g., VPC ID, Subnet IDs, Security Group IDs, RDS Endpoint, KMS Key ARN).

---

### 2. **`tap-stack.ts`**
Composes all modules into a complete CDKTF application:
- Define AWS provider with **region: us-west-2**.  
- Import and instantiate all modules from `modules.ts`.  
- Pass required references between modules (e.g., RDS uses private subnets from the VPC module).  
- Apply consistent resource tagging.  
- Define stack outputs, including:
  - RDS endpoint  
  - EC2 instance public IP  
  - S3 bucket name  
  - CloudFront distribution domain  
  - SNS topic ARN  
  - KMS key ID  

---

## Constraints Summary

- Deploy all resources in **us-west-2**.  
- Use **TypeScript** and **CDKTF** for infrastructure definition.  
- Create a **versioned S3 bucket** for logs with encryption.  
- Implement an **IAM role** with restricted permissions for S3 and RDS access.  
- Deploy an **RDS PostgreSQL** instance with **Multi-AZ** and **7-day backup retention** in **private subnets**.  
- Launch an **EC2 instance** in the **public subnet** with SSH access limited to a specific IP range.  
- Configure **CloudWatch** for monitoring and **SNS** for alert notifications.  
- Build a **VPC** with **two public** and **two private subnets**, and include a **NAT Gateway**.  
- Set up **CloudFront** for global content delivery from S3.  
- Encrypt RDS and S3 data using **AWS KMS**.  
- Tag all resources with `Environment: Production`.

---

## Deliverables

- **`modules.ts`** — defines reusable infrastructure modules for VPC, EC2, RDS, S3, IAM, CloudFront, KMS, and monitoring.  
- **`tap-stack.ts`** — integrates and deploys all modules into a unified CDKTF stack.  
- **Unit Tests** (optional but recommended) — validate configurations for encryption, IAM, subnet allocation, and monitoring.  
- **Deployment Commands**:
  - `cdktf synth` — generate Terraform configuration.  
  - `cdktf deploy` — deploy infrastructure.  
  - `cdktf destroy` — clean up all resources.  

The final deployment must be **secure, scalable, and compliant**, following AWS best practices and achieving successful provisioning through CDKTF.