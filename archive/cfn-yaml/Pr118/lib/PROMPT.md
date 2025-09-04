You are an expert AWS DevOps engineer.

I need you to generate a single, deployable AWS CloudFormation template in **YAML** that defines the infrastructure for a multi-tier, highly available web application in the **us-east-1** region.

### Problem Statement:
Deploy a scalable and secure web application using CloudFormation with the following components:

1. **VPC**:
- One VPC with **at least two public and two private subnets**
- Subnets should be spread across **multiple availability zones** (for high availability)

2. **RDS (PostgreSQL)**:
- An Amazon RDS instance using **PostgreSQL**
- Should reside in the **private subnets**
- Include appropriate security group and DB subnet group

3. **EC2 and Auto Scaling**:
- An **Auto Scaling Group (ASG)** of EC2 instances
- EC2 instances run the web application
- Place instances in **public subnets**
- Use a **Launch Configuration or Launch Template**

4. **Load Balancer**:
- Use an **Application Load Balancer (ALB)** to distribute incoming traffic
- ALB should span across public subnets
- Connect to the ASGs EC2 instances

5. **Security Best Practices**:
- Apply **least privilege** access and **best practices** for security groups
- Ensure the RDS instance is **not publicly accessible**
- ALB should accept HTTP/HTTPS traffic
- Web server ports (e.g., 80/443) should be open only via the ALB

### Output:
Provide a full, functional **CloudFormation template in YAML**, with all above components and configurations defined in a single file. The template should be **ready to deploy**, following **AWS architectural best practices**.

Make sure all inter-resource dependencies (like VPC, subnets, security groups, DB subnet groups, ALB target groups, etc.) are correctly configured and linked.

Include parameters or mappings only if needed to keep the template modular and clean.