I want you to create an AWS CDK application in **Go** that provisions a secure, highly available web application infrastructure. My project structure is as follows:

- Under root, I have `lib/` where the file `tap_stack.go` will hold the stack definition.
- At root level, I have `tap.go` which serves as the entry point to the CDK app.

---

## Environment Description
You are tasked with writing an **AWS CDK application in Go** to set up a secure, high-availability web application environment. The requirements include:

1. **VPC Setup**  
   - Create a VPC with both **public and private subnets** across at least two availability zones.  
   - Ensure route tables are configured to properly isolate public and private traffic.  

2. **Compute & Scaling**  
   - Launch EC2 instances within an **Auto Scaling Group (ASG)** for resilience and elasticity.  
   - Apply layered **security groups** to protect the EC2 instances.  

3. **Storage & Security**  
   - Provision **S3 buckets** with the following constraints:  
     - Server-side encryption enabled.  
     - Block all public access.  

4. **Databases**  
   - Deploy **RDS instances** within private subnets (not publicly accessible).  
   - Enable **DynamoDB tables** with point-in-time recovery.  
   - Secure database credentials using **AWS Secrets Manager**.  

5. **Access Control**  
   - Configure **IAM roles and policies** to strictly enforce the principle of least privilege.  

6. **Monitoring & Compliance**  
   - Enable **AWS Config** to continuously monitor and track compliance of resources.  

7. **Security Enhancements**  
   - Attach an **AWS WAF** to a CloudFront distribution to mitigate common web exploits.  

---

## Constraints
- All resources must be provisioned under a **single AWS CDK stack in Go** (`tap_stack.go`).  
- Must deploy in the **us-west-2 region**.  
- Use **dual availability zones** for high availability.  
- All database services must remain within private subnets.  
- Follow naming convention: `project-name-resource-type`.  

---

## Proposed Statement
The infrastructure must be entirely deployed in the **us-west-2 region**, leveraging **two availability zones** for high availability. The stack will include:  
- A Go-based CDK VPC construct with public/private subnet isolation.  
- EC2 instances managed via Auto Scaling Groups.  
- S3 buckets with encryption and blocked public access.  
- RDS in private subnets with credentials securely managed in Secrets Manager.  
- IAM roles designed with least privilege.  
- DynamoDB with point-in-time recovery.  
- AWS Config for compliance monitoring.  
- A WAF-enabled CloudFront distribution for added protection.  

Your final deliverable is a **Go CDK stack** that satisfies all of these requirements and passes the provided validation script.