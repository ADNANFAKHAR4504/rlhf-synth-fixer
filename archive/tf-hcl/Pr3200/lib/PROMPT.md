### Prompt

You are an expert Terraform and AWS security engineer.  
Your task is to generate a **complete and deployable Terraform script** that provisions a **security-focused infrastructure** for a web application deployment on AWS.  

All requirements must be implemented in a **single file named `tap_stack.tf`**, including:  
- **Variable declarations**  
- **Default values**  
- **Logic**  
- **Outputs**  

I already have a `provider.tf` file with provider configuration that accepts a variable `aws_region`.  
Make sure the code in `tap_stack.tf` references this `aws_region` variable correctly.  

You must **create all resources from scratch as new modules**, not point to any existing ones.  
This will be a **brand new stack**.  
The Terraform logic must strictly follow **AWS best practices for security, scalability, and compliance**.  

---

### Requirements & Constraints

1. **Region & VPC**  
   - Deployment region limited to `us-west-2` (primary).  
   - Secondary region allowed: `us-east-1`.  
   - All resources must be defined inside a **single VPC**.  
   - Create public and private subnets with proper segregation.  

2. **Security Groups & Networking**  
   - Default **deny all inbound/outbound**.  
   - Allow **only HTTPS (443)** inbound from **specific IP ranges** (declare as variable).  
   - VPC Endpoint for S3 (traffic must stay inside AWS network).  

3. **IAM & Access Control**  
   - IAM roles must use **least privilege**.  
   - Policies only for required access (S3, Lambda).  
   - Logging for all AWS managed policies must be enabled (send logs to CloudWatch).  

4. **Encryption**  
   - Enable **encryption at rest (KMS CMK)** for S3, RDS, DynamoDB, and EBS.  
   - Enforce **TLS/HTTPS for encryption in transit**.  
   - SNS topics must use **server-side encryption** with CMK.  

5. **Compute & Runtime**  
   - Use **t3.micro** for EC2 instances (unless justified).  
   - Lambda functions must use the **latest AWS runtime**.  

6. **Database (RDS)**  
   - Deploy in **private subnets only**.  
   - No public access.  
   - **Multi-AZ enabled** with automated backups (≥7 days retention).  

7. **API & Application Delivery**  
   - API Gateway endpoints must be **edge-optimized**.  
   - Attach **AWS WAF** to API Gateway.  
   - Default WAF action = **block**.  
   - CloudFront distribution to serve static assets from S3 (versioning enabled).  

8. **Monitoring & Logging**  
   - CloudWatch alarms for resource usage and incident detection.  
   - DynamoDB unusual patterns must trigger alarms.  
   - GuardDuty enabled in **all active regions**, sending alerts to SNS.  
   - Enable VPC Flow Logs for all traffic.  
   - Enable CloudWatch log monitoring for all Lambda functions.  

9. **Tagging**  
   - All resources must include tags:  
     - `Environment`  
     - `Owner`  
     - `Project`  

10. **Change Management**  
    - Any changes to **security configurations** must require **approval from DevSecOps role**.  
    - Reflect this in IAM roles and policy design.  

---

### Deliverable

Produce a **fully deployable Terraform script (`tap_stack.tf`)** that:  
- Includes variables, values, logic, and outputs.  
- Implements all security, monitoring, and compliance requirements.  
- Creates **new resources/modules only**.  
- Matches **AWS best practices** for a **secure, scalable, compliant web application deployment**.