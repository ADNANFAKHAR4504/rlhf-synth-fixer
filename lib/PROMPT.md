You are an expert AWS Cloud Infrastructure Architect.  
Your task is to generate **optimized Terraform HCL IAC** that meets the following requirements and constraints.  

## Objective
Create an AWS Terraform HCL configuration for a high-availability web application that prioritizes **performance, security, and cost-effectiveness**.  

## Requirements
1. **Networking**
   - Provision a VPC with subnets, NAT gateway(s), and proper routing.  
   - Deploy an Application Load Balancer in front of the compute layer.  

2. **Compute**
   - Configure an Auto Scaling Group of EC2 instances behind the ALB.  

3. **Database**
   - Integrate Amazon RDS with multi-AZ failover for resilience.  

4. **Multi-Environment Support**
   - Stack must be reusable across **staging** and **production**.  
   - Parameters must be customizable per environment
   - Ensure the use of modules for each resource management

5. **IAM & Security**
   - Implement IAM roles with **least privilege** permissions, attached to resources following best practices.  

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
     - Infra performing as expected in both environments.  

## Constraints
- Use **locals** to define per-environment options, selected via `lookup(...)` for maximum flexibility.  
- IAM roles must reflect **least privilege principles**.  
- Tags must be consistently applied across **all resources** (`Department`, `Project`, `Environment`).  

## Expected Output
- Provide **Terraform HCL code** with clear file structure (`main.tf`, `variables.tf`, `locals.tf`, etc.).  
- Show examples for **staging** and **production** environments.  
- Include comments explaining how `lookup(local.map, environment)` works for switching environments.  
- Ensure compliance with AWS security and cost management best practices.  
