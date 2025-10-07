### Prompt

You are an expert AWS serverless and infrastructure engineer specializing in Terraform.  
Your task is to generate a **complete and deployable Terraform script** in a single file named **`tap_stack.tf`** for a **travel platform API**.  

All code must include:  
- **Variable declarations** (with defaults where necessary)  
- **Existing values**  
- **Terraform logic**  
- **Outputs**  

I already have a `provider.tf` file that passes `aws_region` as a variable. Ensure the script references this `aws_region` variable correctly.  

This must be a **brand new stack** – create all modules and resources from scratch. Do not point to any existing modules.  
The Terraform must strictly follow **AWS best practices** for **scalability, security, performance, and compliance**.  

---

### Business Use Case

A **travel platform** requires an **API** capable of supporting **1 million daily searches**:  
- Must scale efficiently for unpredictable spikes in traffic.  
- Must provide **low latency** through caching.  
- Must include **analytics and tracing** for insights.  
- Must comply with **GDPR** by ensuring secure data handling and retention.  

---

### Required Architecture & Components

1. **API Gateway**  
   - REST endpoints for the travel search API.  
   - Edge-optimized for low latency.  
   - Integrated with **AWS WAF** for security.  

2. **Lambda Functions (Python 3.10)**  
   - Process incoming search requests.  
   - Secure access to data via IAM with **least privilege**.  
   - Store environment variables securely in **SSM Parameter Store**.  

3. **ElastiCache (Redis)**  
   - Cache frequently accessed search results for performance.  
   - Deploy in private subnets, with in-transit and at-rest encryption.  

4. **DynamoDB**  
   - Store structured travel search data.  
   - Auto-scaling enabled for high throughput.  
   - Encrypted with **KMS CMK**.  

5. **CloudWatch**  
   - Collect detailed metrics for API Gateway, Lambda, DynamoDB, and ElastiCache.  
   - Alarms for errors, latency, and throttling.  

6. **AWS X-Ray**  
   - Enable distributed tracing for end-to-end request monitoring.  

7. **QuickSight**  
   - Connect to DynamoDB or curated data for **analytics and reporting**.  
   - Ensure GDPR-compliant data retention and anonymization.  

8. **IAM Roles & Policies**  
   - Lambda, API Gateway, DynamoDB, and ElastiCache must each use **least privilege** roles.  
   - All access logged to **CloudTrail**.  

9. **Security & Compliance**  
   - All data encrypted **at rest (KMS)** and **in transit (TLS)**.  
   - Security Groups set to **default deny all** except explicitly required communication.  
   - Ensure compliance with **GDPR logging, retention, and access control requirements**.  

10. **Tagging**  
    - All resources must include tags:  
      - `Environment`  
      - `Owner`  
      - `Project`  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Declares all variables, logic, and outputs.  
- Creates all resources from scratch.  
- Implements a **scalable, secure, GDPR-compliant API infrastructure** for the travel platform.  
- Adheres to **AWS best practices** for monitoring, security, and cost optimization.