You are tasked with building a secure, highly available AWS infrastructure as code using AWS CloudFormation with YAML syntax. Your goal is to design and deploy a VPC environment suitable for hosting a web application with the following specific constraints and requirements:

---

## Infrastructure Specifications

1. Create a Virtual Private Cloud (VPC) with an IPv4 CIDR block of **10.0.0.0/16**.

2. Define three subnets within this VPC:
   - One **public subnet**
   - Two **private subnets**
   
   Each subnet must be placed in **different Availability Zones** to ensure redundancy and high availability.

3. Attach an **Internet Gateway** to the VPC and associate the **public subnet** with a route table that directs internet traffic to this Internet Gateway.

4. Each **private subnet** must have a **NAT Gateway** to allow outbound internet access while keeping instances private.

5. Deploy **EC2 instances** exclusively within the private subnets, using the **default security group** that permits only internal traffic for enhanced security.

6. Include an **S3 bucket** with **server-side encryption enabled** using AWS-managed encryption keys to protect stored data.

7. Ensure **all AWS resources** are tagged with the key-value pair:  
   `Environment: Production`  
   to enforce organizational tagging standards.

8. Define an **IAM role** with **ReadOnlyAccess** permissions scoped to EC2 services. This role permits EC2 instances to interact with AWS resources securely without excessive privileges.

9. Use **parameterized inputs** for:
   - Amazon Machine Images (AMI) IDs 
   - EC2 instance types  
   This approach will enable easy reuse of the CloudFormation template across different AWS regions.

10. The CloudFormation stack must produce outputs for at least:
    - The **VPC ID**
    - The **Public Subnet ID**

11. Deploy an **Application Load Balancer (ALB)** in the **public subnet** that distributes traffic to EC2 instances in the **private subnets**.

---

## Deployment Context

- Deploy all infrastructure resources in the **us-west-2** region using AWS CloudFormation.
- Follow AWS best practices for secure, scalable, and fault-tolerant infrastructure.
- Ensure your YAML CloudFormation template passes AWS validation and integrates all components cohesively.

---

## Expected Deliverable

A fully functional AWS CloudFormation YAML template that:

- Creates all specified resources adhering to the constraints above.
- Follows best practices for tagging, security, and availability.
- Is parameterized for configurable AMI IDs and instance types.
- Passes AWS validation with no errors.
- Produces the required outputs.
- Supports deployment in the us-west-2 region as specified.

---

This prompt defines the problem statement, constraints, environment, and expected output clearly and precisely, aligned with Claude’s Sonnet best prompt practices to guide your model effectively.

---
