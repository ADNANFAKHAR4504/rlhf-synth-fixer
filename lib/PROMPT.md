# High-Level Prompt

You are an expert cloud infrastructure engineer specializing in AWS, Pulumi (Python SDK), and secure DevOps practices.  
Your task is to design and implement a **secure, multi-region AWS infrastructure** that satisfies the following:

## Requirements
1. **VPC Setup**  
   - Create VPCs in both `us-east-1` and `us-west-2` regions with `/16` CIDR blocks.  
   - Split each VPC into **public** and **private** subnets with `/24` CIDR blocks.  

2. **Networking**  
   - Deploy and configure Internet Gateways for public subnets.  
   - Deploy and configure NAT Gateways for private subnet internet access.  

3. **Security**  
   - Apply security group rules allowing only necessary inbound/outbound traffic.  
   - Ensure all resources are encrypted at rest using AWS-managed keys.  
   - Implement S3 bucket policies to allow **only encrypted connections**.  
   - Configure IAM roles with **least privilege** policies.

4. **Monitoring & Compliance**  
   - Enable CloudTrail in both regions for auditing.

5. **Automation**  
   - Set up a CI/CD pipeline using AWS CodePipeline to deploy the infrastructure.  
   - Include automated tests to validate configurations across environments.  

6. **Tagging**  
   - Tag all resources with `Environment`, `Owner`, and `Project` according to company policy.

## Constraints
- Use **Pulumi's Python SDK** for implementation.
- Ensure infrastructure is **consistent across both regions**.
- All configurations must meet the **security requirements** listed above.

## Deliverable
- Provide the implementation in a **`main.py`** file.  
- Ensure all CI/CD pipeline tests pass successfully.  
- Demonstrate compliance with security and tagging policies.

---
**Goal:** Produce clean, maintainable, and secure Pulumi Python code that passes all automated tests and meets compliance standards.