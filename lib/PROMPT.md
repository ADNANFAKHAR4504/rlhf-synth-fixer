Write a production-ready **TypeScript implementation** that provisions a **secure and scalable AWS environment** in **us-east-1**.

---

## Requirements

### Networking
- VPC with **public + private subnets**  
- **Internet Gateway** attached  
- **NAT Gateways** in public subnets for private resource internet access  

### Compute
- **Auto Scaling Group** with **2 EC2 instances per private subnet**  
- **Application Load Balancer** in public subnets in front of ASG  
- Instances use an **IAM role** with access to **S3 + Systems Manager**  

### Security
- **Security Groups** allowing only **HTTPS (443)** and **SSH (22)**  

### Database
- **RDS Multi-AZ** in private subnets  
- Password stored in **AWS Secrets Manager**  

### Storage
- **S3 bucket** with **versioning enabled** for backups  

---

## Code Structure

Code must be exactly **two files**:

1. `lib/tap-stack.ts` – ties everything together  
2. `lib/modules.ts` – reusable modules:  
   - **NetworkModule** (VPC, subnets, IGW, NAT)  
   - **SecurityModule** (SGs + rules)  
   - **ComputeModule** (ASG, EC2, ALB)  
   - **DatabaseModule** (RDS + Secrets Manager)  
   - **StorageModule** (S3 + IAM roles)  