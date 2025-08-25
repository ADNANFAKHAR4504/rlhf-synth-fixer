# Project: IaC - AWS Nova Model Breaking  
## Objective  
Design and implement a **production-grade AWS CloudFormation template** (`security-infra-template.yaml`) that enforces **robust security, compliance, and least-privilege access controls** across the infrastructure stack. The solution must ensure encryption, restricted networking, monitoring, and logging as per enterprise security best practices.  

---

## Requirements  

### 1. IAM (Identity & Access Management)  
- Define **IAM Roles** with **least-privilege permissions**.  
- Configure **trust policies** for specific AWS services (EC2, S3, CloudWatch, etc.).  
- Attach IAM policies ensuring:  
  - Restricted **S3 access** for EC2 instance role.  
  - Controlled **CloudWatch access** for logging and monitoring.  

---

### 2. Encryption (AWS KMS)  
- Define **AWS KMS CMKs (Customer Managed Keys)**.  
- Apply KMS encryption to:  
  - **S3 buckets** (enforce encryption at rest + in transit).  
  - **RDS databases** (encrypted storage).  
  - **EC2 volumes (EBS)**.  
- Ensure KMS key policies align with **least-privilege model**.  

---

### 3. Networking & Security Groups  
- Create a **VPC** with:  
  - Public subnets (for NAT Gateway).  
  - Private subnets (for EC2 instance).  
  - Route tables and NAT gateway for outbound traffic.  
- Security Group configuration:  
  - Allow SSH only from **specific CIDR blocks**.  
  - Restrict inbound/outbound traffic to **necessary service ports only**.  

---

### 4. Compute (EC2 Instance)  
- Deploy an **EC2 instance** with:  
  - Specific AMI ID (`ami-xxxxxxx`).  
  - Defined instance type (`t3.medium` or as specified).  
  - IAM role with **S3 access permissions**.  
  - Placement in **private subnet**.  

---

### 5. Storage (S3 Buckets)  
- All S3 buckets must:  
  - **Block public access**.  
  - Enforce **KMS encryption** for data at rest.  
  - Enforce **HTTPS-only** for encryption in transit.  

---

### 6. Monitoring & Logging  
- Create **CloudWatch Alarms** for EC2 instance monitoring:  
  - CPU utilization.  
  - Network In/Out.  
- Create a **centralized CloudWatch Log Group**.  
- Stream EC2 and system/application logs into the Log Group.  

---

## Constraints  
- All resource names must be prefixed with **`prod-`**.  
- Region: **`us-east-1`**.  
- Must pass **AWS CloudFormation validation** (`cfn-lint` / `aws cloudformation validate-template`).  
- Align with **company compliance guidelines**:  
  - Least privilege IAM access.  
  - Strong encryption standards.  
  - Restricted networking policies.  
  - Centralized monitoring & logging.  

---

## Deliverable  
- A single **CloudFormation template** file:  
  - **`security-infra-template.yaml`**  
- The template must:  
  - Deploy successfully in **us-east-1**.  
  - Enforce **security, encryption, and compliance** as per requirements.  
  - Be reusable for future production deployments.