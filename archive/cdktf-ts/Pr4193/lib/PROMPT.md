You are required to develop a **secure, scalable AWS environment** using the **AWS Cloud Development Kit for Terraform (CDKTF)** in **TypeScript**.  
The solution must be structured into two primary files:

- `modules.ts` — defines reusable modules for core infrastructure components.  
- `tap-stack.ts` — integrates all modules to deploy the complete environment.  

The goal is to provision a **highly available, secure, and well-tagged cloud environment** following AWS best practices.

---

## Problem Overview

You need to automate the provisioning of a **secure AWS environment** that includes networking, compute, storage, and database services while enforcing security, tagging, and high availability standards.

The infrastructure must include:

1. A **VPC** with **at least one public and one private subnet**, spanning **at least two Availability Zones**.  
2. An **Internet Gateway** attached to the VPC and a **NAT Gateway** in the public subnet to allow outbound internet access for private resources.  
3. **IAM roles and policies** allowing communication between EC2 instances within the VPC while following the least privilege principle.  
4. An **EC2 instance** (t2.micro) deployed in the **private subnet**.  
5. A **Security Group** that restricts SSH access to a **specific IP range**.  
6. An **S3 bucket** that is **not publicly accessible** but can be accessed by resources inside the VPC.  
7. A **PostgreSQL RDS instance** located in the **private subnet**.  
8. All resources must have **environment** and **department** tags.  

The solution should be delivered as a **CDK app in TypeScript** capable of synthesizing a CloudFormation stack that reflects these requirements.

---

## Core Requirements

### 1. **Networking**
- Create a **VPC** with CIDR range suitable for your application.  
- Include at least **one public and one private subnet**.  
- Attach an **Internet Gateway** to the VPC.  
- Deploy a **NAT Gateway** in the public subnet to allow outbound internet access from private subnets.  
- Ensure all subnets are spread across at least **two Availability Zones**.  

---

### 2. **IAM and Security**
- Create **IAM roles and policies** allowing EC2 instances to communicate securely within the VPC.  
- Implement a **Security Group** allowing only **SSH access from a specific IP range**.  
- Apply **tags** (`Environment`, `Department`) to all resources.  

---

### 3. **Compute and Database**
- Deploy a **t2.micro EC2 instance** in the private subnet.  
- Provision a **PostgreSQL RDS instance** in the private subnet with encryption and backups enabled.  
- Ensure RDS is **not publicly accessible** and only accessible from EC2 instances in the VPC.  

---

### 4. **Storage**
- Deploy an **S3 bucket** that is accessible from the VPC but **not publicly available**.  
- Enable **server-side encryption** and proper access policies for the bucket.  

---

### 5. **High Availability and Tags**
- All resources must span **at least two Availability Zones** for high availability.  
- Apply consistent **tags** (`Environment`, `Department`) to all resources.  

---

### 6. **Outputs**
- Output key identifiers after deployment, including:
  - VPC ID  
  - Subnet IDs (public and private)  
  - Security Group IDs  
  - RDS endpoint  
  - S3 bucket name  

---

## CDKTF Project Structure

### 1. **`modules.ts`**
Defines reusable CDKTF modules for each component:

- **VPCModule**  
  - Creates the VPC, public and private subnets, Internet Gateway, and NAT Gateway.  

- **EC2Module**  
  - Launches the t2.micro EC2 instance in the private subnet.  
  - Attaches IAM roles and security groups.  

- **RDSModule**  
  - Provisions a PostgreSQL RDS instance in the private subnet with encryption and backups.  

- **S3Module**  
  - Creates an S3 bucket accessible only within the VPC, with encryption and logging policies.  

- **IAMModule**  
  - Defines IAM roles and policies for EC2 instance communication and least privilege access.  

---

### 2. **`tap-stack.ts`**
Composes all modules to create the full infrastructure:

- Instantiate the modules defined in `modules.ts`.  
- Connect resources logically:
  - EC2 → private subnet → VPC  
  - RDS → private subnet → security group  
  - S3 → access restricted to VPC resources  
- Apply **consistent tags** (`Environment`, `Department`).  
- Define **outputs** for all critical resources (VPC, subnets, security groups, RDS endpoint, S3 bucket).  
- Ensure high availability and proper dependencies between resources.  

---

## Constraints Summary

- Must use **AWS CDK for Terraform (TypeScript)**.  
- Create a **VPC with at least one public and one private subnet**.  
- Attach an **Internet Gateway** and deploy a **NAT Gateway** in a public subnet.  
- **IAM roles and policies** must enable EC2 communication within VPC while following **least privilege**.  
- Deploy a **t2.micro EC2 instance** in the private subnet.  
- Security group must allow **SSH only from a specific IP range**.  
- Deploy an **S3 bucket** accessible only from within the VPC.  
- Deploy a **PostgreSQL RDS instance** in the private subnet.  
- All resources must have **environment** and **department** tags.  
- Ensure **high availability** by deploying resources across **at least two Availability Zones**.  
- Include outputs for VPC, subnet IDs, security group IDs, RDS endpoint, and S3 bucket name.  

---

## Deliverables

- **`modules.ts`** — defines CDKTF modules for VPC, EC2, RDS, S3, and IAM.  
- **`tap-stack.ts`** — integrates modules into a complete, deployable CDKTF stack.  
- **Deployment instructions**:
  - `cdktf synth` — generate Terraform configuration  
  - `cdktf deploy` — deploy the stack to AWS  
  - `cdktf destroy` — tear down the environment  

All modules must adhere to **AWS security best practices**, ensure **high availability**, and **synthesize/deploy without errors**.