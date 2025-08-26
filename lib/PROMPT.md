You are an expert AWS Cloud Infrastructure Architect. Your task is to generate **Terraform HCL IAC** that meets the following requirements and constraints.  

## Objective
Create an AWS Terraform configuration for a high-availability web application which prioritizes performance, security, and cost-effectiveness.  

## Requirements
1. **Networking**
   - Create a VPC with subnets, NAT gateway(s), and proper route tables.  
   - Configure an Application Load Balancer in front of the compute layer.  

2. **Compute**
   - Configure an Auto Scaling Group of EC2 instances behind the ALB.  

3. **Database**
   - Integrate Amazon RDS with multi-AZ failover for resilience.  

4. **Multi-Environment Support**
   - Stack must be reusable across **staging** and **production**.  
   - Parameters should be customizable for each environment
   - Configure modularity by ensuring the use of modules for each resource management

5. **IAM & Security**
   - Implement **least privilege** permissions for IAM roles, attached to resources and following best practices.  

6. **Tagging**
   - Every resource must include cost and resource management tags:  
     - `Department = <value>`  
     - `Project    = <value>`  
     - `Environment = <staging|production>`  

7. **Operational Expectations**
   - Solution must deploy successfully in `us-east-1` and `us-west-2`.  
   - Must pass compliance checks for **security** and **operational excellence**.  
   - Successful outputs are verified by:
     - Resource tags present and correct.  
     - IAM roles scoped minimally.  
     - Infrastructure performing as expected

## Constraints
-  Define per-environment options using **locals**, selected via `lookup(...)` for flexibility.  
- IAM roles must reflect **least privilege principles**.  
- Tags must be consistently applied across **all resources** (`Department`, `Project`, `Environment`).  

## Expected Output
- Provide **Terraform HCL code** with clear file structure (`main.tf`, `variables.tf`, `locals.tf`, etc.).  
- Show examples for **staging** and **production** environments.  
- Include comments explaining how `lookup(local.map, environment)` works for switching environments.  
- Ensure compliance with AWS security and cost management best practices.  
