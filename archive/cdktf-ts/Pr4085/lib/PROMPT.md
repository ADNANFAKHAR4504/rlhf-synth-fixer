
You are required to develop a secure and automated AWS environment using the AWS Cloud Development Kit for Terraform (CDKTF) in TypeScript.  
The solution should be structured into two primary files:
- `modules.ts` — defines modular, reusable infrastructure components.  
- `tap-stack.ts` — composes and deploys the complete environment using the defined modules.  

The goal is to ensure security, compliance, and observability across all AWS services while following best practices for automation, encryption, and access control.

---

## Problem Overview

You need to automate the provisioning of a fully compliant AWS environment that enforces key security and operational policies.  
This includes encryption, logging, least-privilege IAM roles, versioning, and resource-level protections across multiple AWS services such as S3, EC2, RDS, API Gateway, CloudTrail, and more.

All infrastructure must be implemented as modular CDKTF constructs, with clear separation of responsibilities between modules, allowing reusability and testability.

Each module should:
- Define a single responsibility (e.g., storage, compute, database, security, or monitoring).  
- Apply AWS security and governance standards automatically.  
- Be integrated in the `tap-stack.ts` file to form the full environment.  

Unit tests must verify that all key configurations (encryption, access control, logging, etc.) are correctly applied.

---

## Core Requirements

### 1. S3 Configuration
- All S3 buckets must have versioning enabled to prevent data loss.  
- Enforce encryption at rest using KMS keys.  
- Apply access logging and block public access on all buckets.  
- Apply consistent resource tags for identification and cost tracking.  

---

### 2. EC2 and Networking
- All EC2 instances must launch within the VPC with ID `vpc-abc123`.  
- EBS volumes attached to EC2 instances must be encrypted using CMKs (Customer Managed Keys).  
- Implement Session Manager for secure access—disable inbound SSH on port 22.  
- Enable Amazon Inspector for vulnerability scanning on EC2 instances.  
- Tag all compute and network resources appropriately (`Environment`, `Security`, `Owner`).  

---

### 3. IAM and Lambda Security
- Create IAM roles for Lambda functions following the principle of least privilege.  
- Each Lambda function must use a dedicated execution role with only required permissions.  
- Ensure all IAM resources include permission boundaries and are encrypted with KMS.  
- Enforce logging and monitoring policies using CloudWatch Logs.  

---

### 4. RDS and Database Security
- Deploy RDS instances with encryption enabled using the default AWS-managed key.  
- Ensure automated backups are enabled for recovery.  
- DynamoDB tables must have Point-in-Time Recovery (PITR) enabled.  
- Redshift clusters must have audit logging enabled for compliance.  
- Store all logs in a centralized S3 bucket with restricted access and versioning.  

---

### 5. CloudTrail and AWS Config
- Enable AWS CloudTrail to record all management events across the AWS account.  
- Use a dedicated S3 bucket for CloudTrail logs with KMS encryption enabled.  
- Deploy AWS Config to continuously record and evaluate the configuration of AWS resources.  
- Use Config Rules to verify encryption, versioning, and IAM policy compliance.  

---

### 6. Networking and Load Balancing
- Configure Elastic Load Balancer (ELB) with an SSL certificate from AWS Certificate Manager (ACM).  
- Redirect all HTTP traffic to HTTPS.  
- Integrate AWS WAF with CloudFront for web application protection.  
- Configure access logs for ELB and CloudFront distributions.  

---

### 7. Monitoring and Logging
- Enable API Gateway logging for all request/response cycles.  
- Integrate logs with CloudWatch Log Groups with defined retention policies.  
- Use KMS encryption for all logs at rest.  
- Create CloudWatch Alarms for unusual activities such as failed login attempts or IAM policy changes.  

---

### 8. Container and Messaging Security
- Ensure all ECR repositories have image scanning enabled after each push.  
- Configure SNS topics to disallow public access and use KMS encryption for message data.  
- Apply consistent tagging to all SNS and ECR resources.  

---

## CDKTF Project Structure

### 1. `modules.ts`
This file defines reusable and composable CDKTF modules for each major infrastructure component:

- S3Module  
  - Creates S3 buckets with versioning, encryption, and logging.  
  - Enforces block public access and tagging.  

- Ec2Module  
  - Launches EC2 instances within `vpc-abc123`.  
  - Ensures EBS encryption and integrates Session Manager.  
  - Registers EC2 instances with Amazon Inspector.  

- IamLambdaModule  
  - Creates IAM roles with least privilege for Lambda functions.  
  - Ensures encryption and CloudWatch logging policies are attached.  

- RdsModule  
  - Provisions encrypted RDS databases and ensures backups are enabled.  

- DynamoDbModule  
  - Creates DynamoDB tables with Point-in-Time Recovery (PITR) enabled.  

- RedshiftModule  
  - Configures Redshift clusters with audit logging enabled.  

- CloudTrailConfigModule  
  - Enables CloudTrail across the account with encrypted logs.  
  - Integrates AWS Config for compliance recording.  

- ElbModule  
  - Use http listener.  
  - Enables access logs and integrates with CloudFront and WAF.  

- ApiGatewayModule  
  - Configures API Gateway with request/response logging and encryption.  

- EcrModule  
  - Sets up repositories with image scanning enabled.  

- SnsModule  
  - Creates SNS topics with restricted access and encryption.  

Each module should include validation logic and tagging for traceability.

---

### 2. `tap-stack.ts`
This file defines the main CDKTF stack composition, integrating all modules into a cohesive infrastructure:

- Import all module constructs from `modules.ts`.  
- Instantiate and connect resources logically:
  - VPC → EC2, Lambda, RDS.  
  - S3 → CloudTrail, Config, and Logging.  
  - ELB → CloudFront → WAF.  
  - CloudWatch → Logging → SNS notifications.  
- Apply consistent tags across all resources:
  - `Environment: Production`  
  - `Security: Enabled`  
  - `Compliance: True`  
- Define the AWS provider for the target region.  
- Output compliance results such as:
  - S3 versioning status  
  - RDS encryption check  
  - WAF and CloudTrail enablement  
  - API Gateway logging validation  

---

## Constraints Summary

- All S3 buckets must have versioning and encryption.  
- EC2 instances must launch within `vpc-abc123`.  
- IAM roles for Lambda must follow least privilege.  
- EBS volumes and RDS instances must be encrypted.  
- CloudTrail must log all management events.  
- AWS Config must record all resource configurations.  
- ELB must use an HTTP listner.  
- API Gateway must have request/response logging enabled.  
- DynamoDB must support point-in-time recovery.  
- Redshift must have logging enabled.  
- CloudFront must be protected by AWS WAF.  
- ECR must have image scanning enabled.  
- SNS must restrict public access.  
- Amazon Inspector must be enabled for EC2.  
- Session Manager must be used for EC2 access.  
- Tagging must be applied to all resources.  

---

## Deliverables

- `modules.ts` — defines CDKTF modules for each AWS service.  
- `tap-stack.ts` — integrates modules into a full, compliant infrastructure stack.  
- Unit Tests — verify encryption, logging, IAM policy, and compliance enforcement.  
- Documentation — include deployment steps:
  - `cdktf synth`  
  - `cdktf deploy`  
  - `cdktf destroy`  
  - Testing and validation commands  

All modules must adhere to AWS security best practices and deploy successfully without manual configuration.
