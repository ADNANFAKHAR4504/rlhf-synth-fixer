You are required to design and implement a secure, modular, and parameterized AWS environment using the AWS Cloud Development Kit for Terraform (CDKTF) in TypeScript.  
Your implementation must be structured into exactly two files:
- `modules.ts` — defines all reusable infrastructure modules.
- `tap-stack.ts` — integrates all modules into a single deployable stack.

The environment should follow strict naming conventions, enforce least privilege access, and ensure security best practices for all network and data services.

---

## Problem Overview

Your goal is to translate the following CloudFormation-style setup into an equivalent CDKTF TypeScript-based solution, adhering to both security and operational efficiency standards.  
All resources must be created in the `us-east-1` region and comply with a consistent naming convention of the format:
<env>-<service>-<resource>

The infrastructure should integrate networking, storage, compute, database, monitoring, and security services, ensuring they interoperate under centralized access and encryption policies.

---

## Core Requirements

### 1. Networking (VPC Configuration)
- Create a VPC with configurable CIDR blocks via CDKTF input parameters.  
- The VPC name must follow the `<env>-<service>-<resource>` pattern (e.g., `prod-web-vpc`).  
- Configure public and private subnets across at least two Availability Zones.  
- Allow ingress only on port 22 (SSH) from a specific IP range defined by parameters.  
- Deny all other inbound access except ports 80 (HTTP) and 443 (HTTPS).  
- Tag all networking resources with:
  - `Project: CloudFormationSetup`  
  - `Environment: <env>`  
  - `Security: Restricted`  

---

### 2. Compute (EC2 Instances)
- Deploy EC2 instances within the public subnets.  
- All EC2 instances must use the `t3.micro` instance type.  
- Assign a least privilege IAM role allowing:
  - Read access to S3
  - Read access to Secrets Manager
  - Write access to CloudWatch Logs  
- Enable detailed CloudWatch monitoring for EC2.  
- Attach CloudWatch Alarms for high CPU utilization (above 80%).  
- Restrict security groups to only allow inbound traffic on ports 22, 80, and 443.  
- Enable termination protection for all EC2 instances.

---

### 3. Storage and Content Delivery (S3 + CloudFront)
- Create S3 buckets with:
  - Versioning enabled
  - Server-side encryption (KMS)
  - Block all public access
- Tag all S3 buckets with `Project: CloudFormationSetup`.  
- Distribute S3 content using Amazon CloudFront, ensuring:
  - HTTPS-only communication
  - Origin access restricted to CloudFront  
- Provide S3 bucket and CloudFront output variables (e.g., Bucket ARN, CloudFront Distribution ID).

---

### 4. Database (RDS MySQL)
- Provision an Amazon RDS MySQL instance with:
  - Multi-AZ deployment
  - Encryption at rest via KMS
  - Deletion protection enabled
  - Storage autoscaling
- Allow RDS access only from EC2 instances within the same VPC.  
- Store RDS credentials securely in AWS Secrets Manager (not in plain text).  
- Tag the RDS instance with:
  - `Project: CloudFormationSetup`
  - `Database: RDS-MySQL`
- Create CloudWatch alarms to monitor:
  - CPU usage
  - Free storage space
  - Database connection errors

---

### 5. Security and IAM
- Define IAM roles for EC2, Lambda, and administrative operations.  
- Ensure all IAM roles adhere to the least privilege principle.  
- Apply permission boundaries to prevent excessive privilege escalation.  
- Attach IAM policies to roles (not users).  
- Restrict sensitive permissions such as `s3:*` or `iam:*`.  
- Enforce multi-factor authentication (MFA) for console access.  
- All IAM entities must include `Project: CloudFormationSetup` tag.

---

### 6. Secrets Management
- Use AWS Secrets Manager to store:
  - Database credentials
  - Environment configuration parameters
- Encrypt secrets with AWS KMS.  
- Configure Lambda functions and EC2 instances to read these secrets using IAM-based policies.  
- Do not hardcode credentials or keys in configuration files or environment variables.

---

### 7. Monitoring and Alarms
- Use Amazon CloudWatch for centralized monitoring and log collection.  
- Enable detailed monitoring for EC2 and RDS.  
- Create alarms for:
  - EC2 CPU utilization > 80%  
  - RDS CPU usage > 75%  
- Configure notification targets (SNS topic or email subscription) for alarm alerts.  
- Tag all log groups and alarms with `Project: CloudFormationSetup`.

---

### 8. ElasticSearch
- Deploy an Amazon OpenSearch (Elasticsearch) domain:
  - Single Availability Zone
  - Encryption at rest enabled
  - Access restricted via IAM policy
- Tag domain resources with `Project: CloudFormationSetup`.  

---

### 9. Outputs
Provide stack-level outputs for:
- VPC ID  
- Subnet IDs  
- EC2 instance IDs and Public IPs  
- RDS endpoint and ARN  
- S3 bucket name and ARN  
- CloudFront distribution domain name  
- CloudWatch alarm ARNs  
- IAM role ARNs  
- Secrets Manager ARN  

Each output must follow the naming format:  
`<env>-<service>-<output-name>`

---

## CDKTF Project Structure

### 1. `modules.ts`
Define reusable constructs for each service:
- VpcModule — defines VPC, subnets, and routing  
- Ec2Module — launches EC2 instances and security groups  
- RdsModule — provisions the encrypted RDS MySQL database  
- S3Module — manages versioned and encrypted S3 buckets  
- CloudFrontModule — creates CloudFront distribution for S3  
- IamModule — defines least privilege IAM roles  
- SecretsModule — manages secrets in AWS Secrets Manager  
- CloudWatchModule — handles monitoring, alarms, and log groups  
- OpenSearchModule — provisions Elasticsearch domain  

Each module should expose inputs (parameters) and outputs (ARNs, IDs, Endpoints).

---

### 2. `tap-stack.ts`
Integrates and deploys all modules:
- Define AWS provider and region (`us-east-1`).  
- Import and instantiate all modules defined in `modules.ts`.  
- Pass outputs from one module (e.g., VPC) as inputs to another (e.g., RDS).  
- Apply consistent naming conventions and tagging across all resources.  
- Configure parameters for VPC CIDR, IP ranges, and environment name.  
- Ensure dependency ordering (VPC → IAM → S3 → RDS → EC2 → CloudFront → CloudWatch).  
- Export all required outputs for testing and validation.

---

## Constraints Summary

- Must deploy in us-east-1 region.  
- Naming convention: `<env>-<service>-<resource>`.  
- All resources tagged with `Project: CloudFormationSetup`.  
- VPC must allow ingress on port 22 from a specific IP range.  
- S3 bucket must have versioning and CloudFront distribution.  
- RDS must be multi-AZ, encrypted with KMS, and have deletion protection.  
- EC2 instances: t3.micro, detailed monitoring, CPU alarm > 80%.  
- IAM roles follow least privilege and permission boundaries.  
- Lambda environment variables must be managed through Secrets Manager.  
- CloudWatch must monitor EC2 and RDS performance metrics.  
- CloudTrail should be enabled for auditing (optional extension).  
- OpenSearch domain deployed in a single availability zone.  
- Provide outputs for all key resource identifiers.  

---

## Deliverables

- `modules.ts` — contains modular TypeScript constructs for AWS services.  
- `tap-stack.ts` — orchestrates all modules into a single deployable CDKTF stack.  
- Unit Tests — verify:
  - Naming convention compliance  
  - Security group restrictions  
  - Encryption configurations  
  - Alarm triggers and thresholds  
- Deployment Commands:
  - `cdktf synth` — synthesize Terraform configuration  
  - `cdktf deploy` — deploy the infrastructure stack  
  - `cdktf destroy` — remove all deployed resources  

The final solution must pass all deployment and security validation checks while maintaining modularity and readability.