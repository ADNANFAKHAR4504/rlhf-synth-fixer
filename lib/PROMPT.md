You are an expert AWS Cloud Infrastructure Architect. Your task is to generate **Terraform HCL IAC** that meets the following requirements and constraints.  

## Objective
Create an AWS Terraform configuration for a high-availability web application which prioritizes performance, security, and cost-effectiveness.  

## Requirements
**Networking**
- Create a VPC with subnets, NAT gateway(s), and proper route tables public and private route subnets
- Configure an Application Load Balancer in front of the compute layer.

**Compute**
- Configure an Auto Scaling Group behind the ALB.  

**Database**
- Setup Amazon RDS with multi-AZ failover for resilience.  

**Multi-Environment Support**
- Stack must be reusable across **staging** and **production**.  
- Parameters should be customizable for each environment
- Configure modularity by ensuring the use of modules for each resource management

**IAM & Security**
- Implement the principle of **least privilege** permissions for IAM roles

**Tagging**
- Every resource must include cost and resource management tags:  `Department = <value>` | `Project = <value>` | `Environment = <staging|production>`  

7. **Operational Expectations**
- Ensure setup can be deployed to `us-east-1` and `us-west-2`.  
- Make sure system passes operational and security compliance checks
- Confirm setup works by verifying that:
   - Resource tags present and correct.  
   - IAM roles are scoped minimally.  
   - Infrastructure is performing as expected

## Constraints
-  Define per-environment options using locals, which are selected using `lookup(...)`
- IAM roles must haveleast privilege priciples for IAM roles 
- Tags must be consistently applied across **all resources** (`Department`, `Project`, `Environment`).  

## Expected Output
- Provide Terraform HCL code with clear file structure (`main.tf`, `variables.tf`, `locals.tf`, etc.).  
- Show examples for staging and production environments.  
- Include comments explaining how `lookup(local.map, environment)` works for switching environments.
