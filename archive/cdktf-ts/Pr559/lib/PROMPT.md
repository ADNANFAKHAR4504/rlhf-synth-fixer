# AWS Scalable Production Infrastructure using Terraform CDK and TypeScript

## Role

You are a senior DevOps/Cloud Engineer with expert-level knowledge in AWS architecture, Terraform CDK (CDKTF), and TypeScript.

## Task

Design and implement a scalable, secure, and highly available cloud infrastructure using Terraform CDK in TypeScript. The solution should follow AWS and infrastructure-as-code best practices.

## Problem Statement

Provision the following infrastructure components in AWS using CDK for Terraform (CDKTF) with TypeScript:

1. **VPC** with both public and private subnets across multiple availability zones.
2. **Auto Scaling Group (ASG)** with at least 3 EC2 instances (`t3.micro` type), distributed across AZs.
3. **Elastic Load Balancer (ELB)** to route incoming traffic to EC2 instances in the ASG.
4. **IAM Roles** attached to EC2 instances, granting access to:
   - **Amazon S3**: For secure content storage
   - **Amazon DynamoDB**: For NoSQL database operations
5. **S3 Bucket** with:
   - Server-side encryption enabled
   - A restrictive bucket policy allowing access only from the attached EC2 IAM role
6. **DynamoDB Table** with a defined primary key and access via IAM role.
7. **Monitoring and Logging**:
   - Enable CloudWatch for EC2 monitoring and logging
   - Enable VPC Flow Logs to capture traffic metadata
8. **Amazon RDS (MySQL)**:
   - Multi-AZ deployment for resilience and high availability
   - Encrypted storage
9. Apply consistent **resource tagging**, including:  
   `Environment = Production`

## Constraints and Requirements

- **Cloud Provider**: AWS only
- **Regions**: Resources must be deployed in both `us-east-1` and `us-west-2`
- **VPC**: Must have both public and private subnets across multiple availability zones
- **ASG**:
  - EC2 instance type: `t3.micro`
  - At least 3 instances minimum
- **Security Groups**:
  - Allow HTTP (port 80) and SSH (port 22) from a specified CIDR block (use a placeholder variable)
- **IAM**:
  - Follow the principle of least privilege
  - EC2 IAM roles must have scoped access to S3 and DynamoDB
- **S3**:
  - Must enable server-side encryption
  - Must have restrictive bucket policies for EC2-only access
- **CloudWatch**:
  - Log EC2 metrics and relevant system activity
- **VPC Flow Logs**:
  - Capture all IP traffic within the VPC
- **RDS**:
  - Must be a multi-AZ MySQL instance
  - Must be appropriately secured and resilient
- **Tagging**:
  - Apply `Environment = Production` to **all** resources

## Environment

The infrastructure supports a production-grade application deployed across `us-east-1` and `us-west-2`. Terraform CDK (TypeScript) must be used for all provisioning, with reusable, parameterized constructs. Deployment should be fully automated via `cdktf deploy` with region and environment as input variables.

## Expected Output

- A **CDKTF Construct written in TypeScript** in a single file.
- Code must include all necessary constructs, imports, and logic
- Should be a Construct, not a TerraformStack
- Include **inline comments** to explain key logic and architectural choices
- Output **only** the code (do not include markdown or extra commentary outside of code comments)
