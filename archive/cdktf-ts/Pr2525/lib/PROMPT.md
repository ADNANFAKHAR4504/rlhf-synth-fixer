 Create a **production-ready implementation** that provisions secure, scalable AWS infrastructure in **us-west-2**.  

### Requirements
- **VPC** with public (NAT), private (EC2), and isolated (RDS) subnets.  
- **EC2** in private subnet with IAM-based SSH (no hardcoded keys).  
- **S3 bucket** (versioning + encryption). EC2/RDS get scoped access.  
- **RDS MySQL** in isolated subnet (Multi-AZ, backups, encrypted).  
- **IAM roles/policies**: least privilege for S3 + other services.  
- **CloudTrail logging** with encrypted logs.  
- **Encryption at rest**: S3, RDS, CloudTrail.  

### Structure
- `lib/modules.ts` → reusable modules (VPC, S3, EC2, RDS, IAM, CloudTrail).  
- `lib/tap-stack.ts` → main stack, wires modules together.  

### Output
- Valid **CDKTF TypeScript**, deployable with `cdktf deploy`.  
- Follows AWS best practices for security, monitoring, and HA.  
- Inline comments included.  
