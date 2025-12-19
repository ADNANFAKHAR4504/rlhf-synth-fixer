We need to design and deploy a **secure, compliant, and fault-tolerant cloud infrastructure** for a financial services company using **CDK for Terraform (TypeScript)**.  
The original requirements are defined for CloudFormation YAML, but we will implement them in **CDKTF** with a two-file structure.  

---

## What’s needed

### S3 (App Logs)
- Create a bucket named **app-logs-prod**.  
- Must be **private by default** with a bucket policy that only allows access from within the specified VPC.  
- Enable **versioning** on the bucket.  
- Ensure **encryption at rest** using AWS-managed keys (SSE-S3).  

### IAM & EC2
- Define an **IAM role** for EC2 with permissions to read/write the S3 bucket.  
- Launch EC2 instances with this IAM role attached.  
- Restrict **SSH access** to EC2 using security groups that only allow the company’s IP range.  
- Allow inbound **HTTP/HTTPS** traffic from the company’s IPs only.  
- Enable **Auto Recovery** so EC2 can recover from system failures.  

### VPC & Networking
- Create a **VPC** with CIDR `10.0.0.0/16`.  
- Add **two public** and **two private subnets** across different AZs.  
- Deploy an **Application Server** in a public subnet.  
- Deploy a **Database Server (RDS)** in a private subnet.  
- Use **NAT Gateway** to give private subnet resources outbound internet without inbound exposure.  
- Security group for RDS: only accept connections from the App Server SG.  

### RDS Database
- Multi-AZ enabled for high availability.  
- Enable **automatic minor version upgrades**.  
- Ensure the DB is **not publicly accessible**.  

### CloudTrail & Logging
- Enable **CloudTrail** to log all management events.  
- Store logs in **JSON format** in the S3 bucket.  
- Bucket must be encrypted and private.  

### Monitoring & Alarms
- Use **CloudWatch** to track CPU and memory of EC2 instances.  
- Trigger alarms if CPU usage exceeds **80%**.  

### Security Services
- Protect the application using **AWS WAF**.

### Safety Controls
- Define a **stack policy** that prevents accidental deletions of critical resources.  

---

## Files to create

- **modules.ts**  
  Define:  
  - VPC + subnets + NAT Gateway.  
  - S3 bucket (`app-logs-prod`) with versioning + SSE-S3.  
  - IAM role + policies for EC2 → S3 access.  
  - EC2 instance with Auto Recovery enabled.  
  - RDS Multi-AZ DB.  
  - Security groups for app + DB.  
  - CloudTrail → S3 logging.  
  - CloudWatch alarms.  
  - AWS WAF.
  - Stack policy config.  

- **tap-stack.ts**  
  - Import modules and wire them up.  
  - Provide variables (VPC ID, company IP range, AMI ID, etc.).  
  - Outputs:  
    - S3 bucket name  
    - EC2 instance ID  
    - RDS endpoint  
    - CloudTrail ARN  
    - WAF WebACL ARN  

---

## Requirements

- **Region** = `us-west-2`.  
- VPC CIDR = `10.0.0.0/16`.  
- Two public and two private subnets across AZs.  
- S3 bucket private, versioned, and encrypted (SSE-S3).  
- EC2 IAM role for S3 access.  
- CloudTrail logs stored in S3 (JSON format).  
- RDS = Multi-AZ with minor upgrades enabled.  
- NAT Gateway for private subnets.  
- Security groups locked to company IP ranges.  
- WAF enabled.
- CloudWatch alarms at 80% CPU threshold.  
- Auto Recovery for EC2.  
- Stack policy prevents deletion of critical infra.  
- All resources tagged appropriately.  
- Must pass `terraform validate` and `terraform plan`.  

---

## Deliverables

Two TypeScript files:  

1. **modules.ts** → all infrastructure resource definitions.  
2. **tap-stack.ts** → orchestration + variables + outputs.  

Both files must have inline comments that explain the security reasoning behind each configuration (e.g., why private subnets for DB, why IAM least privilege for EC2, etc.).  

---
