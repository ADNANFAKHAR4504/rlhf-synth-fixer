### Prompt

You are an expert AWS security and infrastructure engineer specializing in Terraform and secure IaC practices.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** for a financial firm’s batch processing system.  

All code must include:  
- **Variable declarations** (with defaults where appropriate)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` that passes `aws_region` as a variable. Ensure the script references this `aws_region` variable correctly.  

This must be a **brand new stack**, so create all modules and resources from scratch. Do not point to any pre-existing modules.  
The Terraform logic must strictly follow **AWS best practices for scalability, security, compliance, and cost efficiency**.  

---

### Business Use Case

A financial firm needs to process **nightly reports for 1 million transactions**:  
- Must complete within a **4-hour window**.  
- Must handle **failures gracefully** and allow **progress tracking**.  
- Must comply with **strict audit and compliance requirements**.  

---

### Required Architecture & Components

1. **AWS Batch**  
   - Compute environment(s) configured with EC2 or Fargate.  
   - Job queues with retry strategies for failures.  
   - Jobs must scale to process 1M transactions within 4 hours.  

2. **Lambda Orchestration**  
   - Trigger AWS Batch jobs.  
   - Monitor progress and push status updates to DynamoDB.  

3. **S3 Buckets**  
   - Input data (encrypted at rest with KMS).  
   - Output reports (versioning enabled, encrypted).  
   - Server-side encryption enabled for compliance.  

4. **DynamoDB**  
   - Store job status and progress.  
   - Table must have encryption enabled.  

5. **CloudWatch Monitoring**  
   - Metrics for job execution times, errors, and progress.  
   - CloudWatch Alarms for failure detection or runtime breaches.  

6. **SNS Notifications**  
   - Alerts on job completion/failures.  
   - Must use **server-side encryption with CMK**.  

7. **IAM Roles**  
   - Least-privilege access for Lambda, Batch, and S3.  
   - Logging of AWS Managed policy usage enabled.  

8. **Security & Compliance**  
   - All data encrypted **in transit and at rest**.  
   - Logging and auditing enabled across all services.  
   - GuardDuty enabled to monitor security threats.  
   - VPC Endpoint for S3 traffic (must not traverse public internet).  
   - Security Groups default deny-all except required internal comms.  

9. **Tagging**  
   - All resources must include tags:  
     - `Environment`  
     - `Owner`  
     - `Project`  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Includes **all variables, logic, and outputs**.  
- Creates **all required resources from scratch**.  
- Adheres to **AWS best practices**.  
- Implements strict **security and compliance** controls.  
- Is capable of supporting the **batch workload (1M transactions in 4 hours)** reliably.  

