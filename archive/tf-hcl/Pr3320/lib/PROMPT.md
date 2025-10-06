### Prompt

You are an expert Terraform and AWS serverless architect.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** for a **fitness application API**.  

All code must include:  
- **Variable declarations** (with defaults where applicable)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` file that passes `aws_region` as a variable. Ensure the script references this `aws_region` variable correctly.  

This must be a **brand new stack** – create all resources and modules from scratch. Do not point to existing modules.  
The Terraform must strictly follow **AWS best practices** for **security, scalability, and cost efficiency**.  

---

### Business Use Case

A **fitness app** requires a **serverless API** to manage workout logs for **4,000 daily users**.  
- The system must be **secure, serverless, and highly scalable**.  
- Must support **low cost operations** for growth.  
- Must provide **basic performance and usage metrics** for monitoring.  

---

### Required Architecture & Components

1. **API Gateway**  
   - Deploy a **REST API** with secure endpoints.  
   - Must be deployed using **edge-optimized configuration** for performance.  

2. **Lambda Functions (Python 3.10)**  
   - Process workout log requests.  
   - Use the **latest AWS Lambda runtime version**.  
   - Environment variables must be stored in **Parameter Store (SSM)**, not hardcoded.  

3. **DynamoDB**  
   - Store workout logs.  
   - Enable **auto-scaling** to handle fluctuating traffic.  
   - Must use **KMS encryption at rest**.  

4. **IAM Roles & Policies**  
   - Lambda must follow **least privilege** when accessing DynamoDB, Parameter Store, or CloudWatch.  
   - Logging of all IAM policy actions must be enabled to **CloudWatch Logs**.  

5. **CloudWatch Monitoring**  
   - Metrics for API Gateway (requests, latency, errors).  
   - DynamoDB usage (RCU/WCU, throttling, errors).  
   - CloudWatch Alarms for unusual API errors or DynamoDB spikes.  

6. **Parameter Store (SSM)**  
   - Store API keys, environment variables, and secrets.  
   - Must be encrypted using **AWS KMS CMK**.  

7. **Security & Compliance**  
   - All data must be encrypted **in transit (TLS)** and **at rest (KMS)**.  
   - Security groups must default to **deny all inbound/outbound** (only allow what is explicitly required).  
   - GuardDuty enabled to monitor API-level threats.  

8. **Tagging**  
   - Every resource must include tags:  
     - `Environment`  
     - `Owner`  
     - `Project`  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Declares all variables, values, logic, and outputs.  
- Creates **all resources from scratch**.  
- Implements a **secure, scalable, low-cost serverless API**.  
- Adheres to **AWS best practices** for compliance and monitoring.