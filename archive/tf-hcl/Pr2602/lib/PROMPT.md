## Terraform IaC Prompt

You are an expert in Infrastructure as Code (IaC) using Terraform HCL. Your task is to generate a secure, production-ready AWS cloud infrastructure in **Terraform HCL syntax**. Please ensure that you strictly adhere to the provided requirements, constraints, and environment description. **Do not alter, remove, or reinterpret any provided data.** The final output must be a detailed Terraform codebase that a DevOps engineer can deploy directly.

---

### Problem Statement

You are tasked with creating a secure Amazon Web Services (AWS) cloud infrastructure using Terraform HCL. Your goal is to set up the environment ensuring it adheres to modern security best practices. This includes the following requirements:

1. Implement AWS Identity and Access Management (IAM) roles with least privilege access, only for necessary EC2 and S3 operations.
2. Configure Security Groups to limit inbound access, especially restricting SSH (port 22) access from public networks.
3. Establish a Virtual Private Cloud (VPC) with a NAT gateway for private subnet internet access.
4. Enable AWS CloudTrail for logging all account activities.
5. Ensure all S3 data is encrypted at rest using AWS Key Management Service (KMS).
6. Enable versioning on all S3 buckets to protect against accidental deletions or overwrites.
7. Make sure the infrastructure resources are created in the 'us-west-2' region.
8. Apply a consistent tagging policy to resources for better cost management and resource organization.
9. Configure Amazon Relational Database Service (RDS) for Multi-Availability Zone (AZ) failover.
10. Validate that IAM policies do not include wildcard permissions to prevent misuse of additional services.
11. Deploy an Application Load Balancer (ALB) with AWS Web Application Firewall (WAF) to enhance website security.
12. Activate Amazon GuardDuty for real-time monitoring and threat detection.

**Expected Output:**  
A Terraform HCL codebase that incorporates all these elements, deployable in AWS without manual intervention. The infrastructure should pass Terraform plan/apply validations and deployment tests, ensuring all security measures are effectively implemented.

---

### Constraint Items

- The AWS IAM role must have least privilege access for EC2 and S3 services.
- Security groups should **not** have open access to port 22 from the internet.
- VPC should have a NAT gateway for external access from private subnets.
- Ensure CloudTrail is enabled to log all activities across the account.
- Encrypt all data at rest using AWS KMS for S3 buckets.
- Enable versioning on S3 buckets to prevent accidental data loss.
- The infrastructure must be deployed in 'us-west-2' region.
- Apply tagging policies for all resources for cost management and organization.
- Ensure all RDS instances are configured for Multi-AZ deployment.
- Ensure IAM policies do **not** allow wildcard actions to mitigate potential misuse.
- Deploy an application load balancer with a web application firewall (WAF) attached.
- Set up Amazon GuardDuty for continuous security monitoring and threat detection.

---

### Environment Description

The infrastructure needs to set up a secure environment for a web application consisting of EC2 instances, S3 storage, and RDS databases in the 'us-west-2' AWS region. The resources should follow a defined tagging strategy and adhere to AWS best practices for security and compliance.

---

### Instructions

- **Generate Terraform HCL code** that implements all requirements, constraints, and environment details above.
- Output all relevant resources, modules, and configuration blocks.
- All resource definitions must include robust tagging, region specification, and security controls as described.
- The IAM policies must be strictly least privilege, with **no wildcards allowed**.
- Security groups must **never** allow unrestricted (0.0.0.0/0) SSH access.
- S3 buckets must be encrypted using KMS and versioning enabled.
- RDS resources must be Multi-AZ.
- CloudTrail, GuardDuty, and WAF must be enabled and properly configured.
- The final output should be a complete Terraform codebase, ready for deployment.
- Please make sure to put all the code in a single terraform file

---

- If the response exceeds the output limit, continue seamlessly across multiple outputs until the entire task is fully completed.
- Do not limit the response by character or token count. Continue generating until the entire task is fully completed, using as many turns as necessary. Resume exactly from where the previous output ended without repeating or omitting any content, and only stop once the task is finished and complete