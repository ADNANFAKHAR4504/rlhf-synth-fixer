# CloudFormation YAML Requirement – Secure AWS Infrastructure

You are acting as a cloud infrastructure engineer who needs to write a CloudFormation template in YAML.  
The stack should set up a secure AWS infrastructure adhering to best practices in the `us-west-2` region.  
Every resource name or logical ID must start with the prefix **SecureEnv** to clearly identify that it belongs to the secure environment.

## Requirements

### 1. VPC Configuration
- Deploy a VPC with at least 2 public and 2 private subnets, spanning multiple availability zones (at least 2 AZs).
- Ensure the subnets are properly configured for public and private access, including necessary route tables, internet gateways for public subnets, and NAT gateways if required for private subnets.

### 2. EC2 Instances
- Configure EC2 instances in the appropriate subnets.
- Attach security groups that restrict SSH access to the specified IP range: '203.0.113.0/24'.
- Ensure all EBS volumes attached to EC2 instances are encrypted using AWS KMS.
- Use IAM roles for EC2 instances with least privilege policies.

### 3. IAM Roles and Policies
- Create IAM roles with attached policies granting the least privilege required for each service (e.g., EC2, Lambda, etc.).
- Include configurations to support MFA for IAM users, such as creating virtual MFA devices where applicable.

### 4. S3 Buckets
- Create S3 buckets with server-side encryption enabled using AWS-managed keys (SSE-S3).
- Dedicate an S3 bucket for CloudTrail logs with encryption and access logging enabled.

### 5. CloudTrail Logging
- Enable CloudTrail to log all API activity to the dedicated S3 bucket.
- Ensure the CloudTrail setup includes encryption and logging best practices.

### 6. RDS Instances
- Deploy RDS instances in a multi-AZ setup for high availability.
- Enable automatic backups with a retention period of at least 7 days.

### 7. Lambda Functions
- Create Lambda functions as part of the infrastructure.
- Use environment variables for sensitive data, encrypted with KMS.

### 8. Application Load Balancer
- Create an Application Load Balancer (ALB) with access logging enabled.
- Configure the ALB to route traffic to appropriate targets, such as EC2 instances.

### 9. Security Groups
- Define security groups with descriptive names and tags to identify their purpose.
- Ensure restrictions align with requirements, such as SSH access limits.

## General Standards
- Follow AWS security best practices (least privilege, encryption enforcement, no excessive permissions).
- Use **Parameters** for configurable values (like instance types, IP ranges, or KMS keys).
- Tag all resources with cost allocation tags for project billing purposes, including environment and project details.
- Ensure all resources are deployed within the 'us-west-2' region.
- The final YAML should be valid CloudFormation, executable without errors, and include outputs for key resources like VPC ID and public subnet IDs.

## Output Expectations
- Output must be **YAML only**, no JSON.
- Output **only the YAML code** (no comments or extra description).
- All resources and logical IDs must be prefixed with `SecureEnv`.
- Must include all specified components and constraints, such as multi-AZ setups, encryption, and logging.