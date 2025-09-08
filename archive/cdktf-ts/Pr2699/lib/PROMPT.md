We need to design and deploy a **comprehensive AWS infrastructure** for a web application using **CDK for Terraform (TypeScript)**.  
The original requirements are defined for a CloudFormation JSON template, but the implementation must now use **CDKTF** with a two-file structure.  

---

## Problem

You are tasked with creating a secure and production-ready **cloud environment** for a web application in the **AWS us-east-1 region**.  
The environment must include networking, compute, storage, IAM, database, and monitoring components.  
The infrastructure must emphasize **functionality, security, high availability, and compliance** with the organization’s policies.  

---

## Requirements

### Networking
- Create a **VPC** with at least two subnets: **one public** and **one private**.  
- Configure and attach an **Internet Gateway** to the VPC.  
- Deploy a **NAT Gateway** for private subnet internet access.  
- Ensure **high availability** for the NAT Gateway by spreading across multiple AZs.  

### Compute
- Deploy an **EC2 instance** in the public subnet.  
- Instance must use:  
  - **Specified AMI ID**  
  - **Provided key pair** for SSH  
- Restrict **SSH (port 22)** access to a specific IP range only.  
- Allow inbound **HTTP (port 80)** traffic to the instance.  
- Attach an **IAM role** to the EC2 instance with S3 access.  

### Storage
- Create an **S3 bucket** for application storage/logs.  
- Configure a **lifecycle policy** to transition objects to **Glacier after 30 days**.  
- Enable **S3 encryption at rest** (SSE-S3 or KMS).  
- Protect the S3 bucket with a **CloudFormation-like stack policy** to prevent accidental deletion.  

### IAM
- Define an **IAM role** with:  
  - EC2 full access  
  - S3 full access  
- Attach this role to the EC2 instance.  

### Database
- Deploy an **RDS instance** in the private subnet.  
- Enable:  
  - **Automatic backups**  
  - **Encryption at rest**  
  - Not publicly accessible  
- Ensure connectivity is restricted to the application EC2 SG only.  

### Monitoring
- Enable **CloudWatch monitoring** for EC2 and RDS.  
- Create alarms for key metrics (e.g., CPU > 80%).  

### General
- All resources must be **tagged with `Environment:Development`**.  
- Infrastructure must **comply with least privilege and high availability principles**.  
- Must **pass `terraform validate` and `terraform plan`** without errors.  

---

## File Structure

- **modules.ts**  
  Define and export constructs for:  
  - VPC, subnets, IGW, NAT GW  
  - Security groups (EC2 + RDS)  
  - EC2 instance with IAM role + SG  
  - S3 bucket with lifecycle policy + encryption  
  - IAM role + policies  
  - RDS instance (private subnet, encrypted, backups)  
  - CloudWatch monitoring + alarms  
  - Stack policy-like protection for S3  

- **tap-stack.ts**  
  - Import and wire resources from `modules.ts`.  
  - Pass required variables (e.g., AMI ID, key pair, company IPs).  
  - Apply tagging (`Environment:Development`).  
  - Define outputs:  
    - EC2 instance ID  
    - S3 bucket name  
    - RDS endpoint  
    - NAT Gateway IDs  
    - VPC ID  

---

## Deliverables

Two TypeScript files:  

1. **modules.ts** → Infrastructure definitions.  
2. **tap-stack.ts** → Stack composition, variables, and outputs.  

Both files must include **inline comments** explaining security and compliance reasoning (e.g., why RDS is private, why lifecycle policy moves objects to Glacier, etc.).  

---