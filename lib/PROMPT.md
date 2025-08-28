# AWS CDK Infrastructure Setup – Scalable Web Application

## Objective

Design and deploy a scalable, highly available web application environment using **AWS CDK in TypeScript**. The infrastructure must follow AWS best practices for security, availability, and scalability.

---

## Requirements

### General

- Define infrastructure using **AWS CloudFormation CDK in TypeScript**.
- Deploy resources only in the **us-west-2 (Oregon)** region.

### Networking

1. Create a **VPC** with CIDR block `10.0.0.0/16`.
2. Subnets:
   - Two **public subnets**.
   - Two **private subnets**.
   - Subnets must be evenly distributed across two **Availability Zones**.
3. Attach an **Internet Gateway** to the VPC.
4. Deploy **NAT Gateways** in each public subnet.
5. Route private subnet traffic through respective NAT Gateways.

### Load Balancer

6. Deploy an **Application Load Balancer (ALB)** in the public subnets.
7. ALB must listen on:
   - **HTTP (port 80)**
   - **HTTPS (port 443)** using an **ACM SSL Certificate**.
8. Enable **access logs** for the ALB to an **S3 bucket**.

### Compute

9. Launch an **Auto Scaling Group (ASG)** with **EC2 instances**:
   - Instances should run **Amazon Linux 2 AMI**.
   - Deploy EC2 instances in **private subnets only**.
   - Ensure EC2 instances are accessible **only via the Load Balancer**.
10. Configure scaling policies for fault tolerance and high availability.

### Storage

11. Create an **S3 bucket** for **ALB logs**:
    - Enable default **encryption**.
    - Enforce **least-privilege access** for read/write permissions.

### Security & IAM

12. Implement **IAM roles and policies** following **least privilege principles**:
    - EC2 instance role for necessary service access.
    - ALB permissions to write logs to S3.
13. Ensure secure access controls and enforce **encrypted connections**.

---

## Deliverables

- **TypeScript CDK stack code** that synthesizes into a valid **CloudFormation template**.
- Infrastructure that meets all requirements when deployed.
- Verification methods to ensure:
  - Subnets and routing are correct.
  - Load Balancer properly serves HTTP/HTTPS traffic.
  - EC2 instances scale and remain private.
  - Logs are correctly written to the S3 bucket.

---

## Expected Output

A **CloudFormation CDK stack in TypeScript** that can be successfully synthesized and deployed to AWS.  
The stack should represent a production-ready environment for a scalable, highly available web application.
