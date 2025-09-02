You are an experienced **AWS CDKTF (Cloud Development Kit for Terraform) engineer**.  
Please write a **production-ready TypeScript implementation** that provisions a secure and scalable AWS environment in the **us-east-1** region.

---

## What the environment should include

### Networking
- A VPC with both **public and private subnets**.  
- An **Internet Gateway** attached to the VPC.  
- **NAT Gateways** in the public subnets so that private resources can reach the internet securely.  

### Compute layer
- An **Auto Scaling Group** that runs **two EC2 instances per private subnet**.  
- An **Application Load Balancer** in the public subnets that fronts the ASG.  
- Instances should use an **IAM role/instance profile** with policies to allow access to **S3 and Systems Manager**.  

### Security
- **Security Groups** configured so that traffic is restricted to **HTTPS (443)** and **SSH (22)** only.  

### Database
- An **RDS instance** deployed into the private subnets.  
- It should be configured as **Multi-AZ** and the password must be stored securely in **AWS Secrets Manager**.  

### Storage
- An **S3 bucket with versioning enabled** for backups.  

---

## Code structure

Keep the implementation clean and modular. The code should live in exactly **two files**:

1. **`lib/tap-stack.ts`** – the main stack file that ties everything together.  
2. **`lib/modules.ts`** – defines reusable modules for each layer:
   - **NetworkModule** (VPC, subnets, IGW, NAT)  
   - **SecurityModule** (security groups and rules)  
   - **ComputeModule** (ASG, EC2, ALB)  
   - **DatabaseModule** (RDS with Multi-AZ + Secrets Manager)  
   - **StorageModule** (S3 bucket + IAM roles for EC2)  

Each module should accept minimal props and expose clear outputs (e.g., subnet IDs, SG IDs, ALB DNS name, RDS endpoint, S3 bucket name, secret ARN, instance profile).  
