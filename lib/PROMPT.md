# CDKTF Multi-Tier Web Application – Production-Ready Solution  

Generate a complete, **production-ready CDKTF solution in TypeScript** to deploy a **multi-tier web application on AWS**.  

The entire solution must be organized into **exactly two files** as specified below.  
The code must be:  
- **Fully functional**  
- **Well-commented**  
- **Deployable** using only the `cdktf` CLI  

---

## Key Requirements  

### 1. Centralized Security Management  
- All **Security Groups** and traffic rules must be defined in **`tap-stack.ts`**.  
- This ensures a **single, clear view** of the application's network security posture.  
- **Modules** should accept **security group IDs** as input properties, rather than creating their own in isolation.  

---

### 2. Remote State Management  
- Configure a **secure, remote S3 backend** for storing the Terraform state file.  

---

### 3. Secrets Management  
- The **database password** must be securely retrieved from **AWS Secrets Manager**.  
- **Never hardcode passwords** or credentials.  

---

### 4. Least Privilege Access  
- The **IAM role** for the EC2 instance should follow the **principle of least privilege**.  
- Grant only the permissions required:  
  - Access to **AWS Systems Manager (SSM)** for session management.  
  - Required network and S3 permissions (if applicable).  

---
