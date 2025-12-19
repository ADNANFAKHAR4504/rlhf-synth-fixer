### Prompt

You are an expert AWS infrastructure and Terraform engineer.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** that provisions a **cross-region disaster recovery (DR) solution** for a **financial trading platform**.  

All code must include:  
- **Variable declarations** (with default values where appropriate)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` file with provider configurations that use a variable named `aws_region`.  
Ensure this variable is properly referenced within `tap_stack.tf`.  

This must be a **brand new stack** — create all Terraform modules and resources from scratch.  
Do not point to any existing infrastructure or external modules.  
The Terraform logic must match the requirements **exactly** and follow **AWS and DR best practices** for **resilience, replication, and automation**.  

---

### Business Use Case

A **financial services company** operates a **mission-critical trading platform** and needs to ensure full business continuity even during **regional AWS outages**.  

**Requirements:**  
- Must achieve **RPO < 1 minute** and **RTO < 5 minutes** during failover.  
- Failover must be **automatic**, requiring **no manual intervention**.  
- System must maintain **data consistency**, **service continuity**, and **cross-region availability**.  
- Monitoring, alerting, and health checks must automatically **trigger failover** when an outage is detected.  

---

### Required AWS Provider Configuration

- **Primary Region:** `us-east-1`  
- **DR Region:** `us-west-2`  
- **Terraform Version:** 1.0 or later  
- **AWS Provider Version:** 4.0 or later  

Ensure all resource blocks are region-aware, with separate provider aliases for `primary` and `dr` regions.  

---

### Required Infrastructure & Components

1. **VPC (in both regions)**  
   - CIDR block (e.g., 10.0.0.0/16).  
   - Public and private subnets across multiple AZs.  
   - Internet Gateway and NAT Gateway for outbound access.  
   - Properly configured **Route Tables** and **Security Groups**.  

2. **Transit Gateway**  
   - Enable **cross-region connectivity** between the primary and DR VPCs.  
   - Routing configured for bidirectional traffic replication.  

3. **Database Layer**  
   - **Aurora Global Database** for the primary trading database.  
   - Cross-region replication configured between `us-east-1` and `us-west-2`.  
   - Encrypted with **AWS KMS CMK** and backups enabled.  

4. **DynamoDB Global Tables**  
   - Store replicated, low-latency configuration and session data.  
   - Auto-scaling enabled and encryption at rest using **AWS KMS**.  

5. **Route 53**  
   - Configure **failover routing policy**.  
   - Integrate **Route 53 Health Checks** to monitor application endpoints in both regions.  
   - Automatically redirect traffic to the DR endpoint during outages.  

6. **Failover Automation**  
   - Health checks trigger automated failover using **Route 53** or **Lambda/Step Functions**.  
   - All failover actions must occur without human intervention.  

7. **Monitoring & Alerting**  
   - **CloudWatch Metrics** for Aurora, DynamoDB, Transit Gateway, and Route 53.  
   - **CloudWatch Alarms** to detect outages, replication lag, or degraded health.  
   - **SNS Notifications** (with KMS encryption) for incident alerts.  

8. **IAM Roles & Security**  
   - Enforce **least privilege** across all components.  
   - Separate roles for replication, monitoring, and failover automation.  
   - Enable **CloudTrail** for auditing.  

9. **Encryption & Compliance**  
   - All data encrypted **in transit (TLS)** and **at rest (KMS)**.  
   - Logging enabled for compliance and audit visibility.  

10. **Tagging**  
    - Every resource must include:  
      - `Environment`  
      - `Owner`  
      - `Project`  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Declares all **variables**, **logic**, and **outputs**.  
- Creates all required AWS resources and modules from scratch.  
- Implements a **fully automated, cross-region DR solution**.  
- Ensures compliance with **AWS Well-Architected Framework** and **financial industry resilience standards**.  
- Achieves **RPO < 1 minute** and **RTO < 5 minutes** using the described AWS services.