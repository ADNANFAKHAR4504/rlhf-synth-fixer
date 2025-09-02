## I need you to act as an experienced DevOps engineer who’s comfortable with Infrastructure as Code (IaC), specifically using CDKTF with AWS.

## The goal is to produce a production-ready CDKTF project in TypeScript that sets up a secure AWS environment. The code should be deployable straight away with cdktf deploy, without requiring manual fixes.

## Project Context

- **IaC Framework:** CDKTF (Cloud Development Kit for Terraform)  
- **Language:** TypeScript  
- **Cloud Provider:** AWS  
- **Region:** us-west-2  
- **Account Setup:** The AWS account is part of an AWS Organization  
- **Naming Convention:** All resources should use a project-environment pattern (for example, webapp-prod-vpc or webapp-dev-db-sg). Variables for project and environment should be used consistently.  

## What Needs to Be Implemented

### IAM Roles & Policies
- Create a dedicated S3 bucket for application data.  
- Define an IAM role and instance profile for EC2 instances.  
- The IAM role should have an inline policy with only the following permissions: s3:GetObject, s3:PutObject, and s3:DeleteObject, scoped to the application’s bucket path:arn:aws:s3:::project-environment-app-data/*

### Security Groups (Principle of Least Privilege)
- Security groups must allow only the traffic that’s actually required.  
- EC2 instances should only accept inbound traffic from trusted sources on the application port (e.g., 8080).  
- The RDS instance should only accept inbound traffic from the EC2 security group on the database port (e.g., 5432).  
- All other inbound traffic should be denied.  

### RDS Encryption
- Provision an RDS instance.  
- Make sure encryption at rest is enabled with a customer-managed KMS key.  
- The RDS instance must not be publicly accessible.  

### CloudTrail Logging
- Set up a CloudTrail trail to capture all management and data events.  
- Logs should go to a centralized S3 bucket.  
- This bucket should be encrypted with a customer-managed KMS key.  

### KMS Key Management
- Create a customer-managed AWS KMS key.  
- Use this key to encrypt both the CloudTrail S3 bucket and the RDS instance.  

## Code Structure

The entire solution must live in exactly two files:

### lib/modules.ts
This file should define reusable, modular TypeScript classes.  
Each class should take scope, id, and props in its constructor.  

Required modules:
- KmsModule → Creates the KMS key  
- S3Module → Creates an encrypted S3 bucket  
- CloudTrailModule → Sets up CloudTrail and centralized logging bucket  
- IamModule → Creates IAM role, instance profile, and EC2 policies  
- VpcModule → Creates a VPC with public and private subnets  
- SecurityGroupModule → Creates security groups with configurable rules  
- Ec2Module → Launches EC2 instances with IAM role  
- RdsModule → Creates the encrypted RDS instance  

### lib/tap-stack.ts
The main stack file.  

Defines project and environment variables.  
Instantiates all the modules and wires them together (for example, passing the KMS key to RDS and S3, or linking security groups).  

## Final Deliverable

Provide the complete TypeScript code for both lib/modules.ts and lib/tap-stack.ts.

The code should:
- Be ready to deploy with cdktf deploy  
- Follow best practices for security and naming  
- Be clear, well-commented, and production-ready  