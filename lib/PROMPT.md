Design a CDK for Terraform (CDKTF) application in **TypeScript** that provisions a secure and highly available AWS infrastructure for a mission-critical application. The implementation must be split into only **two files**:

- `lib/tap-stack.ts`: The root stack that orchestrates and deploys all AWS resources.
- `lib/modules.ts`: A reusable module library that defines common constructs such as VPC, EC2, RDS, Load Balancers, IAM, Lambda, and security services.

### Requirements

**1. Networking**
- Create a VPC with:
  - Public and private subnets across **two Availability Zones**
  - EC2 instances deployed **only in private subnets**
  - Application Load Balancer deployed in public subnets
  - Attach security groups that only allow inbound **HTTPS (443)** and **SSH (22)** to EC2 instances

**2. Security and Compliance**
- Automate security configuration using **AWS Lambda**
- Enable **AWS Security Hub** and integrate it with Lambda automation
- Enforce **MFA on all IAM users**
- Attach IAM roles to Lambda with proper permissions (least-privilege)
- Use **AWS Config** to enforce compliance with defined rules
- Configure **AWS WAF** to protect the ALB
- Detect and alert on policy changes using **CloudTrail + SNS**
- Implement encryption:
  - All S3 buckets encrypted with SSE-S3
  - Sensitive data in DynamoDB encrypted using AWS KMS
  - EBS volumes encrypted using default encryption
  - Use AWS Secrets Manager for secure storage of sensitive configurations and API keys

**3. Database**
- Provision an Amazon RDS instance:
  - Must not be publicly accessible
  - Use a security group that restricts access to trusted sources only

**4. Monitoring and Logging**
- Enable **CloudWatch** logging for all API activity
- Configure monitoring and alarms for key security resources
- Tag all resources with `Environment` and `Owner`

**5. High Availability / Resilience**
- Resources (e.g., EC2 instances, subnets, ALB) must be deployed across at least **2 AZs**
- EC2 instances must be configured for **auto-recovery**
- All resources must be reusable and adaptable through `modules.ts`

### CDKTF Configuration
- Use Terraform **remote backend** (S3 + DynamoDB) for secure state locking
- Enforce **provider version constraints** for stable deployments
- Use CDKTF outputs to expose critical resource IDs
- Ensure all code follows a modular architecture to support multiple environments (e.g., dev, staging, prod)

### Background
A security-sensitive application must be deployed in AWS using CDKTF. The goal is to build a production-ready architecture that adheres to modern cloud security best practices and DevSecOps principles.

### Expected Output
- A working CDKTF TypeScript configuration with:
  - Reusable security and infrastructure modules in `lib/modules.ts`
  - All resource orchestration in `lib/tap-stack.ts`
  - AWS resources aligned to the specified constraints and validated with a Terraform apply