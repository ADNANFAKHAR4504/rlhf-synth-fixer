You are an expert Terraform architect. Your task is to generate a complete Infrastructure as Code (IaC) solution using **Terraform** that satisfies the requirements below.  

## High-Level Goal
Provision a **multi-environment AWS infrastructure** (development, staging, production) deployed consistently across **us-east-1**, **us-west-2**, and **eu-central-1**, while following enterprise policies for security, scalability, and maintainability.

## Requirements
1. Use **Terraform modules** to encapsulate reusable infrastructure components.  
2. Define **environment-specific variables** without duplicating configuration files.  
3. Configure a **remote backend** for secure Terraform state management.  
4. Apply **environment-specific tagging** for all resources (billing + auditing).  
5. Deploy at least **one EC2 instance per environment**, with AMI and instance types configurable per environment.  
6. Enable **VPC Flow Logs** for network monitoring and security auditing.  
7. Configure **IAM roles** to enforce RBAC guidelines.  
8. Implement **security group rules** aligned with corporate security policies.  
9. Ensure **high availability** by distributing resources across multiple availability zones.  
10. Validate the Terraform configuration to ensure no errors before deployment.  

## Naming Conventions
All resources must include the environment prefix (e.g., `dev-`, `stage-`, `prod-`) to maintain clarity and avoid conflicts.  

## Expected Output
- A complete Terraform codebase with:
  - Root configuration and environment-specific `tfvars`.  
  - Reusable modules for VPC, EC2, IAM, and Security.  
  - Remote backend configuration.  
- Terraform configuration must pass validation (`terraform validate`) and formatting (`terraform fmt`).  
- Final output: **Ready-to-apply Terraform project** that provisions the described infrastructure consistently across all environments and regions.