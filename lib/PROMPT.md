### Prompt

You are an expert AWS solutions architect and Terraform engineer.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** for an **online education platform web application**.  

All code must include:  
- **Variable declarations** (with defaults where applicable)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` file that passes `aws_region` as a variable. Ensure the script references this `aws_region` variable correctly.  

This must be a **brand new stack** – create all modules and resources from scratch. Do not point to existing modules.  
The Terraform must strictly follow **AWS best practices** for **scalability, security, performance, and cost optimization**.  

---

### Business Use Case

An **online education platform** serves **20,000 students daily** with unpredictable traffic spikes.  
- The system must **auto-scale** reliably.  
- Must ensure **session persistence** for logged-in users.  
- Must provide **performance metrics and tracing** for monitoring.  
- **Security and cost optimization** are top priorities.  

---

### Required Architecture & Components

1. **VPC**  
   - CIDR block: **10.0.0.0/16**  
   - Public and private subnets across multiple AZs.  
   - Internet Gateway for public access, NAT Gateway for private subnets.  

2. **Auto Scaling Groups**  
   - EC2 instances type: **t3.medium**.  
   - Scaling policies based on **CloudWatch alarms** (CPU, memory, latency).  
   - Secure IAM instance profiles with least privilege.  

3. **Application Load Balancer (ALB)**  
   - Distribute traffic across instances.  
   - HTTPS only (TLS termination).  
   - Integrated with **AWS WAF** for security.  

4. **ElastiCache (Redis)**  
   - Session persistence for user state.  
   - Must be deployed in private subnets with encryption in-transit and at-rest.  

5. **RDS MySQL**  
   - Multi-AZ deployment.  
   - Automated backups with 7+ days retention.  
   - KMS encryption at rest enabled.  
   - No public access (private subnet only).  

6. **Monitoring & Tracing**  
   - **CloudWatch** for metrics, alarms, and scaling triggers.  
   - **X-Ray** enabled for distributed tracing.  

7. **IAM & Security**  
   - IAM roles with **least privilege** access for EC2, RDS, ElastiCache.  
   - Security Groups: **default deny**, allow only required ports (443 for ALB, 3306 internal for RDS, Redis internal only).  
   - GuardDuty enabled for threat detection.  

8. **Tagging**  
   - All resources tagged with:  
     - `Environment`  
     - `Owner`  
     - `Project`  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Declares all variables, values, logic, and outputs.  
- Creates **all resources from scratch**.  
- Implements **scalable, secure, and cost-optimized web application infrastructure**.  
- Adheres to **AWS best practices** for compliance, security, and performance.