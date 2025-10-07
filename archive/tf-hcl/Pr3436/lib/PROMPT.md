### Prompt

You are an expert AWS infrastructure and Terraform engineer.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** for a **healthcare application database monitoring system**.  

All code must include:  
- **Variable declarations** (with defaults where needed)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` file that passes `aws_region` as a variable. Ensure the script references this `aws_region` variable correctly.  

This must be a **brand new stack** – create all resources and modules from scratch. Do not point to any existing modules.  
The Terraform logic must strictly follow **AWS best practices** for **security, compliance (healthcare requirements), and monitoring**.  

---

### Business Use Case

A **healthcare app** needs to monitor a **PostgreSQL database** that processes **20,000 daily patient records**.  
- The system must provide **detailed metrics** and **alerts for performance issues**.  
- Compliance, encryption, and auditability are critical due to healthcare regulations.  

---

### Required Architecture & Components

1. **RDS PostgreSQL**  
   - Instance type: **db.m5.large**.  
   - Multi-AZ deployment enabled.  
   - **Enhanced Monitoring** enabled for OS-level metrics.  
   - Automated backups with at least **7-day retention**.  
   - **KMS encryption** enabled for data at rest.  
   - **TLS** enforced for encryption in transit.  
   - Must be deployed in **private subnets** only.  

2. **Security Groups**  
   - Allow inbound traffic only on **port 5432** from specific CIDR blocks (declare as variable).  
   - Default deny for all other inbound and outbound rules.  

3. **CloudWatch Monitoring**  
   - Collect detailed RDS and Enhanced Monitoring metrics.  
   - Create **CloudWatch Alarms** for high CPU, memory, storage usage, and connection spikes.  

4. **SNS Notifications**  
   - Trigger alerts on alarm thresholds.  
   - SNS topics must be encrypted using **AWS KMS CMK**.  

5. **IAM Roles & Policies**  
   - Provide **least privilege access** for monitoring and database operations.  
   - Lambda (if used for automation) must have restricted roles.  

6. **Audit & Compliance**  
   - Enable **CloudTrail** for auditing database API calls.  
   - Logs stored in an encrypted S3 bucket.  

7. **Tagging**  
   - All resources must include:  
     - `Environment`  
     - `Owner`  
     - `Project`  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Declares all variables, logic, and outputs.  
- Creates all resources from scratch.  
- Implements a **secure, compliant, and fully monitored PostgreSQL RDS system**.  
- Adheres to **AWS best practices** for healthcare workloads (security, monitoring, encryption, compliance).  

