Write a **TypeScript implementation** that provisions a **secure AWS environment**.  
---

## here are my Requirements that should be implemented

### IAM & S3
- Create dedicated **S3 bucket** for app data  
- Define **IAM role + instance profile** for EC2  

### Security Groups
- Allow only required traffic  in the project
- **EC2:** inbound from trusted sources on app port (e.g., 8080)  
- **RDS:** inbound only from EC2 SG on DB port (e.g., 5432)  
- Deny all other inbound traffic  

### RDS
- Provision **RDS instance** (not public)  
- Enable encryption at rest with **customer-managed KMS key**  

### CloudTrail
- Create **CloudTrail trail** capturing all events  
- Logs → centralized **S3 bucket**, encrypted with KMS  

### KMS
- Create **customer-managed KMS key**  
- Encrypt both **CloudTrail bucket** and **RDS**  

---

## Code Structure

Code must be exactly **two files**:  

1. `lib/modules.ts` – reusable classes (scope, id, props):  
   - **KmsModule** → KMS key  
   - **S3Module** → encrypted S3 bucket  
   - **CloudTrailModule** → CloudTrail + logging bucket  
   - **IamModule** → IAM role + EC2 policies  
   - **VpcModule** → VPC with public/private subnets  
   - **SecurityGroupModule** → SGs with rules  
   - **Ec2Module** → EC2 with IAM role  
   - **RdsModule** → encrypted RDS instance  

2. `lib/tap-stack.ts` – main stack:  
   - Define project + environment variables  
   - Instantiate modules  
   - Wire dependencies (e.g., pass KMS to RDS/S3, link SGs)  