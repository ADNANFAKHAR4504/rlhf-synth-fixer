You are required to build a secure, scalable, and automated AWS infrastructure using the AWS Cloud Development Kit for Terraform (CDKTF) in TypeScript.  
The implementation should be delivered in a two-file structure, consisting of:
- `modules.ts`
- `tap-stack.ts`

This setup replaces the CloudFormation-based provisioning with a CDKTF-based IaC solution while ensuring scalability, reliability, and security.

---

## Problem Overview

The goal is to design and deploy a highly available, secure, and scalable web application environment on AWS.  
This environment must:
- Scale dynamically with traffic demand.
- Maintain high reliability for the database layer.
- Provide secure handling of sensitive data.
- Offer built-in monitoring, logging, and testing capabilities.
- Allow for straightforward deployment and teardown through CDKTF commands.

All constructs must follow best practices for modular design, enabling easy maintenance and reusability across environments.

---

## Core Requirements

### 1. Compute Layer (EC2 Auto Scaling)
- Deploy Amazon EC2 instances that automatically scale based on traffic load.  
- Implement an Auto Scaling Group (ASG) to ensure the system can handle varying workloads efficiently.  
- Attach an Elastic Load Balancer (ELB) to distribute incoming traffic across EC2 instances evenly.  
- Enable detailed CloudWatch monitoring and alarms for CPU utilization thresholds.  
- Ensure EC2 instances use IAM roles with minimal permissions, avoiding hardcoded credentials.  

---

### 2. Database Layer (RDS)
- Deploy an Amazon RDS instance configured for Multi-AZ availability.  
- Enable automated backups with a defined retention policy for disaster recovery.  
- Restrict RDS access to the VPC and EC2 instances only (not publicly accessible).  
- Encrypt data at rest and in transit using AWS KMS and SSL.  
- Enable CloudWatch metrics and alarms for RDS health and performance monitoring.  

---

### 3. Storage Layer (S3)
- Create an Amazon S3 bucket for static assets and media storage.  
- Enable versioning for recovery from accidental deletions or overwrites.  
- Apply server-side encryption using KMS-managed keys.  
- Restrict bucket access using IAM policies that follow the principle of least privilege.  
- Enable access logging and send logs to a dedicated logging bucket.  

---

### 4. Security and Access Management
- Implement IAM roles and policies that enforce least privilege.  
- Use instance profiles to manage credentials securely on EC2 instances.  
- Restrict inbound traffic in security groups to only necessary ports (HTTP/HTTPS/SSH).  
- Use AWS Secrets Manager to store and manage database passwords, API keys, and other sensitive values.  
- Rotate secrets periodically and ensure encryption in transit and at rest.  

---

### 5. Monitoring and Logging
- Use Amazon CloudWatch for centralized logging, metrics collection, and alarms.  
- Configure CloudWatch alarms for:
  - EC2 CPU usage thresholds.
  - RDS performance metrics.
  - Application-level errors if available.  
- Enable CloudWatch Logs for EC2 instances and application logs.  
- Integrate with AWS CloudTrail (if desired) for auditing API activity.  

---

### 6. Deployment and Testing
- Define the entire infrastructure using AWS CDKTF in TypeScript.  
- Provide a deployment script that uses:
  - `cdktf deploy` for stack creation.
  - `cdktf destroy` for teardown.  
- Ensure modularity between `modules.ts` and `tap-stack.ts`:
  - `modules.ts`: Define reusable constructs (EC2, RDS, S3, IAM, CloudWatch, Secrets Manager, VPC).  
  - `tap-stack.ts`: Integrate modules to form the complete infrastructure stack.  
- Write unit tests for CDK constructs using frameworks such as `Jest` or `Vitest` to verify:
  - Resource creation.
  - Correct property configurations.
  - Dependency and permission relationships.  

---

## File Structure

### 1. `modules.ts`
Defines all modular building blocks of the infrastructure:
- VpcModule: VPC with multiple subnets and routing setup.  
- Ec2Module: Auto Scaling Group, Launch Template, and associated IAM roles.  
- RdsModule: Multi-AZ RDS instance with automated backups and encryption.  
- S3Module: Static file storage with versioning and encryption.  
- IamModule: Roles, policies, and instance profiles following least privilege.  
- SecretsManagerModule: Manage secrets for RDS and application credentials.  
- MonitoringModule: CloudWatch metrics, dashboards, and alarms.  
- LoggingModule: CloudWatch Logs configuration and centralized S3 log storage.  

---

### 2. `tap-stack.ts`
- Import and instantiate all modules from `modules.ts`.  
- Initialize the AWS provider for multi-region deployment (default: `us-east-1`).  
- Set interdependencies between modules:
  - VPC → EC2, RDS, CloudWatch.
  - IAM → EC2, S3, Secrets Manager.
  - CloudWatch → EC2, RDS monitoring.
  - Secrets Manager → Application and RDS configuration.  
- Apply consistent tags to all resources (`Environment: Production`, `Project: WebAppInfra`).  
- Export stack outputs such as:
  - EC2 Auto Scaling Group name.
  - RDS endpoint.
  - S3 bucket name.
  - CloudWatch dashboard URL.  

---

## Constraints Summary

- Support deployment in multiple AWS Regions.  
- Use AWS CDKTF (TypeScript) for defining all infrastructure.  
- Implement Auto Scaling for EC2 instances.  
- Deploy Amazon RDS with Multi-AZ and automated backups.  
- Use Amazon S3 for static file storage with versioning enabled.  
- Implement CloudWatch monitoring and logging for all resources.  
- Manage sensitive data through AWS Secrets Manager.  
- Enforce IAM roles for all resource access following least privilege.  
- Provide an automated deployment and teardown process.  
- Include unit tests for validating CDK constructs.  
- Ensure separation of concerns between modules and stack composition.  

---

## Deliverables

- `modules.ts`: Contains all reusable infrastructure modules (VPC, EC2, RDS, S3, IAM, CloudWatch, Secrets Manager).  
- `tap-stack.ts`: Integrates all modules into a single deployable stack.  
- Unit test suite to validate CDK constructs.  
- Deployment documentation describing steps to synthesize, deploy, and destroy the stack.  
- Final setup must meet all scalability, security, and operational monitoring requirements.