# AWS CDK Python: Regionally Redundant Infrastructure Design

You are a **cloud infrastructure expert**. Using the **AWS CDK with Python**, build a complete, 
**regionally redundant infrastructure** on AWS that meets the following requirements. Ensure all services are 
configured according to **best practices**, **interconnected securely**, and defined as 
**Infrastructure as Code** (IaC).

---

## Infrastructure Requirements

### Multi-Region Deployment
- Deploy infrastructure in **at least two AWS regions** to ensure regional redundancy.

### VPC Configuration
- Create **VPCs in each region**, with:
- **Public and private subnets**
- Subnets must span **multiple Availability Zones (AZs)**

### EC2 Auto Scaling Groups
- Deploy **EC2 Auto Scaling Groups per region**:
- Minimum of **2**, maximum of **10** instances per region
- Instances must launch in **private subnets**

### Load Balancers
- Use **Elastic Load Balancers (ELB)** in public subnets with:
- **HTTP and HTTPS** listeners
- Route traffic to EC2 instances in private subnets

### Security Groups
- Allow **ELB to EC2** traffic on ports `80` and `443`
- Restrict **SSH (port 22)** access to:
- A specific IP range or management subnet
- Allow **EC2 to RDS** access over correct database port (e.g., `5432` for PostgreSQL)

### Amazon RDS
- Deploy **Amazon RDS** with the following:
- **Multi-AZ** enabled
- Located in **private subnets**
- Enable **automated backups** (minimum **7-day retention**)

### Route 53 DNS Management
- Configure **Route 53** for DNS:
- **Hosted zones** and **record sets**
- Health checks
- **Failover routing** across regions

### CloudWatch Monitoring
Enable **Amazon CloudWatch** to monitor:
- **EC2 metrics**: CPU, memory, disk
- **RDS performance**: connections, IOPS
- **VPC** networking and latency metrics

### AWS Lambda
- Deploy **AWS Lambda** functions:
- Triggered on a **cron schedule**
- Used for lightweight serverless tasks

### Amazon S3
- Provision **S3 buckets** with:
- **Versioning** enabled
- **Encryption at rest** using **SSE-S3** or **SSE-KMS**

### IAM Roles and Policies
- Define IAM roles to:
- **Restrict infrastructure management** to a specific team/role
- Enforce **least privilege** access
- Ensure all resources are **tagged**:
- `Environment`, `Team`, `CostCenter`, etc.

### Systems Manager (SSM)
- Use **AWS Systems Manager** to:
- **Automate patching** of EC2 instances

### AWS WAF
- Attach **AWS WAF** to ELBs:
- Protect against common web attacks like **SQL injection** and **XSS**

### Slack Notifications
- Set up **Slack notifications** for infrastructure changes using:
- **AWS Chatbot**, or
- **Webhook-based integrations**

---

## Implementation Instructions

- Use **AWS CDK (Python)** as the IaC tool.
- Organize resources using proper **CDK constructs and stacks**.
- Ensure secure and logical connectivity between components:
- ELB ⇨ EC2
- EC2 ⇨ RDS
- CloudWatch ⇨ All relevant resources
- Lambda ⇨ S3 or EventBridge (as needed)
- Follow **AWS best practices** for:
- Networking
- Access control
- Encryption
- Scalability
- **Add comments** in your CDK code to document:
- Each major resource
- Important configurations and connections

---

Happy Building 
