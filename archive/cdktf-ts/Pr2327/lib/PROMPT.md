Design a secure, production-ready AWS infrastructure for a new application called **SecureApp**. The setup should follow AWS best practices for security, modularity, and least privilege access.  

The code must be:  
- Clean and well-structured.  
- Split into exactly **two files**:  
  - `lib/modules.ts`  
  - `lib/tap-stack.ts`  

---

## Requirements  

### 1. Provider & Region  
- Use the **AWS provider**.  
- Deploy everything in **us-west-2**.  

---

### 2. Naming Convention  
- Prefix all resources with **SecureApp** (e.g., `SecureAppVpc`, `SecureAppLogsBucket`, etc.).  

---

### 3. Networking (VPC)  
- Create a **VPC** with CIDR block `10.0.0.0/16`.  
- Inside the VPC:  
  - **One public subnet**.  
  - **One private subnet**.  
- Add an **Internet Gateway** for the public subnet.  
- Add a **NAT Gateway** in the public subnet so the private subnet has outbound internet access.  

---

### 4. Security Group  
- Create a security group for the EC2 instance:  
  - Allow **SSH (port 22)** only from `203.0.113.0/24`.  
  - Deny all other ingress.  
  - Allow all egress.  

---

### 5. S3 Bucket (Logging)  
- Create a private **S3 bucket** for logs.  
- Enable **server-side encryption (AES256)**.  
- Block **all public access**.  

---

### 6. IAM Role & Policy (Least Privilege)  
- Create an **IAM Role** for the EC2 instance.  
- Attach a **custom IAM Policy** that only allows:  
  - `s3:PutObject` access to the logging bucket.  
  - Required permissions for **VPC networking** and **SSM** (to use AWS Systems Manager instead of SSH keys).  

---

### 7. EC2 Instance  
- Launch a **t3.micro** EC2 instance.  
- Place it in the **private subnet**.  
- Attach the IAM role created above.  
- Use the **latest Amazon Linux 2 AMI**.  

---

## File Structure  

### `lib/modules.ts`  
Define modular **Constructs**:  
- **VpcModule** → VPC, subnets, IGW, NAT, route tables.  
- **S3Module** → Logging bucket.  
- **IamModule** → EC2 role + policy.  
- **Ec2Module** → EC2 instance.  

Each module should accept **input props** (like `vpcId`, `subnetId`) so they connect properly.  

---

### `lib/tap-stack.ts`  
- Import the modules.  
- Instantiate them in the correct order.  
- Pass **outputs between modules** (e.g., VPC + subnet IDs from VpcModule into Ec2Module).  

---

## Deliverable  
Provide the **full working TypeScript code** for both files (`lib/modules.ts` and `lib/tap-stack.ts`).  

- The code must:  
  - **Synthesize cleanly** (`cdktf synth`) without errors.  
  - Be **production-ready**.  
  - Be ready for **immediate use** in a new CDKTF project.  