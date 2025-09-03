You are tasked with designing and implementing an **AWS CDK application in Golang** that sets up a **secure, highly available, and scalable production-grade web application environment**.  

Your project folder structure will look like this:
root/
├── bin/
│ └── tap.go # Main entrypoint
├── lib/
│ └── tap_stack.go # Stack definitions
├── cdk.json

markdown
Copy code

---

## Environment Description
The infrastructure must provision the following:

1. **VPC** with both public and private subnets across multiple Availability Zones.  
2. **EC2 Instances**:
   - Deployed in private subnets.
   - Configured following security best practices.
   - Attached IAM roles must follow **principle of least privilege**.  
3. **Application Load Balancer (ALB)**:
   - Placed in public subnets.
   - Forwards traffic to EC2 instances in multiple AZs.  
4. **AWS KMS**:
   - Used for encryption of all sensitive data.  
5. **AWS RDS Instance**:
   - Encrypted at rest.
   - Configured with high availability.
   - Auto-scaling enabled.  
6. **AWS WAF**:
   - Protects the application from web exploits.  
7. **AWS Security Groups**:
   - Strictly controls inbound/outbound access.  
8. **Network ACLs**:
   - Allows only necessary traffic.  
9. **Logging & Monitoring**:
   - Enable **CloudWatch** logging for all resources where applicable.
   - Configure **AWS Config** for compliance monitoring.
   - Set up **CloudTrail** for API activity tracking.
   - All **S3 buckets** must **deny public access by default** and store logs securely.  

---

## Constraints
- The AWS CDK stacks must be deployed in **`us-east-1`**.  
- All IAM roles must adhere to **least privilege**.  
- Use **AWS KMS** for all encryption activities within the VPC.  
- Ensure **VPC** has both public and private subnets.  
- Use **Network ACLs** to enforce strict inbound/outbound rules.  
- **Security Groups** must limit access only where necessary.  
- The **ALB** must distribute traffic across **two or more EC2 instances** in different AZs.  
- Enable **logging** on all supported resources (e.g., S3, ALB, CloudWatch).  
- **AWS Config** must monitor compliance.  
- **AWS WAF** must be integrated for web app security.  
- **CloudTrail** must log all API calls.  
- **S3 buckets** must deny public access by default.  
- **RDS** must have encryption enabled.  
- **EC2 Auto Scaling** based on **CPU utilization metrics**.  
- Must follow **CDK Golang best practices** for stack organization and constructs.  

---

## Expected Output
A **complete AWS CDK Golang application** that:  
- Contains proper stack definitions in `lib/tap_stack.go`.  
- Has its entry point defined in `bin/tap.go`.  
- When deployed, provisions the full infrastructure environment as described above.  

---

## Proposed Statement
The target environment is a **production-grade AWS infrastructure** in `us-east-1`, with strict security, high availability, scalability, and monitoring requirements, implemented using **AWS CDK with Golang** for Infrastructure as Code.