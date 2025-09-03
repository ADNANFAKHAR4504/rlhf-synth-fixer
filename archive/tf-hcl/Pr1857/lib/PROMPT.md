You are an expert Terraform Engineer. Your task is to create a complete Infrastructure as Code solution using **Terraform HCL** that satisfies the requirements below 

# Task
Design a secure, multi-account AWS infrastructure using Terraform HCL that enforces a robust security architecture.

# Requirements
- Configure security groups that apply identical inbound and outbound rules to all EC2 instances within a VPC, ensuring a uniform security configuration.  
- Define IAM roles and policies that follow the **principle of least privilege**, granting the minimum required access to AWS services such as S3 and KMS.  
- Support **multi-account deployment**, using Terraform workspaces and AWS CLI profiles for separation.  
- Include validation checks for IAM roles and policies to ensure no overly set permissions
- Ensure the solution is configured to support both **public and private subnets** within the VPC.

# Expected Output
- A **secure Terraform codebase** that, when deployed, configures the described architecture.  
- Security groups with **consistent, uniform rules** applied to all EC2 instances.  
- IAM roles and policies that can be tested against simulated access requests, confirming least privilege compliance.  
- Validations preventing policies from granting excessive access.  
- Code that is formatted with `terraform fmt`, and ready for deployment across multiple accounts.

# Constraints
- Security group rules must be **strictly uniform** across all EC2 instances.  
- IAM roles and policies must be validated to enforce the **principle of least privilege**.  

# In Short
Deploy a **multi-account AWS infrastructure** using Terraform HCL with a strong, uniform security architecture. Enforce identical security group rules across all EC2 instances, define IAM roles and policies with least privilege, and validate them to ensure compliance. Deliver the solution as a validated, production-ready Terraform project.


Create iam module first, then networking, security and compute