You are required to build a multi-tier web application infrastructure using the AWS Cloud Development Kit for Terraform (CDKTF) in TypeScript.  
The implementation should be delivered in a two-file structure, consisting of:
- `modules.ts`
- `tap-stack.ts`

This solution must implement containerized workloads using Amazon ECS, a PostgreSQL database on RDS, and an automated CI/CD pipeline — all within a newly created VPC in the AWS region `us-west-2`.  
You must not use any existing AWS resources; all infrastructure should be provisioned from scratch.

---

## Problem Overview

The objective is to design and deploy a secure, scalable, and automated containerized web application environment using AWS ECS, RDS, CodePipeline, and CloudWatch.  
This setup should:
- Host web services via ECS running on EC2 instances.
- Use an Application Load Balancer for HTTP traffic.
- Employ RDS PostgreSQL for data persistence.
- Automate deployment using CodePipeline and CodeBuild.
- Enforce least privilege IAM policies, encryption, and centralized logging.

The entire infrastructure must be modular, reusable, and maintainable, following AWS best practices for security, observability, and automation.

---

## Core Requirements

### 1. Networking Layer (VPC)
- Create a new VPC with both public and private subnets across two Availability Zones.  
- Public subnets will host the ALB and ECS instances.  
- Private subnets will host the RDS PostgreSQL database.  
- Configure Internet Gateway, NAT Gateway, and route tables for public/private separation.  
- Tag all networking components for easy identification.

---

### 2. Compute and Container Orchestration (ECS)
- Deploy an Amazon ECS Cluster within the newly created VPC.  
- Use EC2 launch type with two t3.medium instances as the minimum capacity.  
- Enable bridge network mode for ECS tasks.  
- Create task definitions and services to manage the web application containers.  
- Attach IAM roles and instance profiles to grant ECS tasks the required AWS permissions.  
- Enable autoscaling policies based on CPU and memory utilization metrics.  

---

### 3. Application Load Balancer (ALB)
- Implement an Application Load Balancer (ALB) in the public subnets.  
- Configure a listener on port 80 (HTTP) to route traffic to ECS services.  
- Enable access logging to a dedicated S3 bucket for audit purposes.  
- Ensure the ALB integrates with CloudWatch metrics and alarms for health checks and latency.  

---

### 4. Database Layer (RDS - PostgreSQL)
- Deploy an Amazon RDS instance for PostgreSQL in private subnets.  
- Instance type: `db.t3.micro`.  
- Enable Multi-AZ, automated backups (7-day retention), and storage encryption using AWS-managed KMS keys.  
- Restrict RDS access to ECS services only using security groups and VPC rules.  
- Disable public accessibility.  

---

### 5. Storage Layer (S3)
- Create an S3 bucket for non-sensitive static assets and CI/CD artifacts.  
- Disable public access and enforce bucket policies for least privilege.  
- Enable server-side encryption using AWS-managed keys.  
- Turn on versioning for rollback and recovery.  
- Store ALB access logs and CodeBuild logs in separate logging prefixes.  

---

### 6. Continuous Integration and Deployment (CI/CD)
- Implement a CodePipeline to automate application builds and deployments to ECS.  
- Integrate CodeBuild for image building and testing.  
- Use S3 as the artifact store.  
- Automatically trigger the pipeline upon source code updates (e.g., GitHub or CodeCommit).  
- Send notifications via SNS for pipeline success and failure events.  
- Ensure the pipeline is idempotent and can be re-run without creating duplicate resources.  

---

### 7. Monitoring and Logging
- Use Amazon CloudWatch for centralized logging, metrics, and alarms.  
- Configure CloudWatch Logs for:
  - ECS tasks and containers.
  - Application Load Balancer access logs.
  - CodeBuild and CodePipeline logs.  
- Create CloudWatch Alarms for:
  - ECS CPU/memory usage thresholds.
  - RDS performance metrics.
  - Pipeline failures.  
- Integrate with SNS topics for alert notifications.  

---

### 8. Security and IAM
- Apply IAM roles and instance profiles to ECS tasks, EC2 instances, CodeBuild, and CodePipeline with least privilege.  
- Restrict security groups to allow only necessary inbound/outbound traffic (e.g., HTTP from ALB to ECS, ECS to RDS).  
- Enforce encryption at rest for all data (KMS, EBS, RDS, S3).  
- Tag all resources with consistent CDKTF tags (`Environment: Production`, `Project: MultiTierWebApp`).  

---

## File Structure

### 1. `modules.ts`
Defines all reusable and composable modules:
- VpcModule: Create a new VPC with public/private subnets, NAT Gateway, and route tables.  
- EcsModule: Create ECS cluster, task definitions, services, and EC2 capacity.  
- AlbModule: Application Load Balancer with HTTP listener and target group.  
- RdsModule: Private RDS PostgreSQL instance with automatic backups.  
- S3Module: Encrypted and private bucket for assets and logs.  
- IamModule: IAM roles and policies for ECS, RDS, CodePipeline, and CodeBuild.  
- CicdModule: CodePipeline + CodeBuild setup with SNS notifications.  
- MonitoringModule: CloudWatch Logs, metrics, alarms, and dashboards.  

---

### 2. `tap-stack.ts`
- Initialize AWS Provider in `us-west-2`.  
- Import all modules from `modules.ts` and integrate them to form a cohesive infrastructure.  
- Set dependencies and resource relationships:
  - VPC → ECS, RDS, ALB.
  - IAM → ECS, CodePipeline, CodeBuild.
  - CloudWatch → ECS, ALB, CI/CD monitoring.
- Apply consistent CDKTF tags for all resources.  
- Export stack outputs such as:
  - ECS Cluster Name.
  - ALB DNS Name.
  - RDS Endpoint.
  - S3 Bucket Name.
  - CodePipeline ARN.
  - SNS Topic ARN for notifications.  

---

## Constraints Summary

- Use AWS CDK for Terraform (CDKTF) in TypeScript.  
- All resources must be deployed in `us-west-2`.  
- Create a new VPC (do not use existing VPC or subnets).  
- ECS Cluster must run with 2 EC2 t3.medium instances using bridge network mode.  
- Enable HTTP-only traffic via ALB on port 80.  
- Use RDS PostgreSQL (`db.t3.micro`) in private subnets.  
- Enable automated 7-day RDS backups and encryption at rest.  
- Store static assets in private S3 with encryption.  
- Implement CodePipeline + CodeBuild for CI/CD.  
- Enable CloudWatch logging and metrics for all services.  
- Use IAM roles instead of static credentials.  
- Follow the least privilege principle for all IAM and security groups.  
- Send SNS notifications on pipeline success/failure.  
- Ensure idempotent deployments via CDKTF (`cdktf deploy`, `cdktf destroy`).  
- Do not reference or import any existing AWS resources — everything must be created from scratch.

---

## Deliverables

- `modules.ts`: Contains all modular components (VPC, ECS, RDS, ALB, S3, IAM, CI/CD, CloudWatch).  
- `tap-stack.ts`: Integrates modules into a single deployable CDKTF stack.  
- Unit test suite verifying:
  - VPC creation and subnet layout.
  - ECS cluster and task definitions.
  - RDS configuration and connectivity.
  - CodePipeline and CodeBuild triggers.
  - IAM policies and least privilege enforcement.  
- Deployment documentation covering `cdktf deploy`, `cdktf synth`, and `cdktf destroy`.  
- Final infrastructure must be secure, automated, and production-grade.