# Secure Web Application Environment on AWS.

Hey there!

I'm putting together a new web application environment on AWS, and I'd really appreciate a hand getting the CloudFormation template just right.

The goal is to set up a production-ready home for our app in the **us-east-1** region – something that's secure, highly available, and able to scale as our user base grows. We also need proper monitoring and logging in place.

---

## What I'm Looking For in the Environment

Think of it as building a fortress for our application. Here’s what that environment should include:

### Network Foundation
- A Virtual Private Cloud (VPC).  
- Public subnets for resources that need internet access.  
- Private subnets for sensitive components.  

### Network Control
- Network ACLs should be configured to allow only the minimum required traffic.  

### Application Servers (EC2)
- EC2 instances following recommended security practices.  
- IAM roles should follow the principle of least privilege.  
- Security Groups should restrict access tightly.  

### Scalability
- Auto Scaling policies for EC2 instances, triggered by CPU utilization.  

### Traffic Management
- At least two EC2 instances spread across multiple Availability Zones.  

### Data Protection
- AWS KMS for all encryption needs within the VPC.  
- Amazon RDS instances that are fully encrypted.  

### Web Application Protection
- Note: WAF protection removed as it requires an ALB, API Gateway, or CloudFront
- Application is protected by security groups and network ACLs instead  

---

## Visibility and Oversight

### Logging
- Logging enabled for S3 and CloudWatch where applicable.  

### Compliance
- AWS Config to monitor configuration changes and compliance.  

# Activity Tracking
- AWS CloudTrail enabled to track all API calls and user activity.  

# Secure Storage
- S3 buckets must deny public access by default.  

---

# Key Constraints

- Region must be us-east-1.  
- IAM roles must use least privilege.  
- Encryption must use AWS KMS.  
- Both public and private subnets are required.  
- Network ACLs should only allow necessary traffic.  
- Security Groups must restrict access.  
- EC2 instances must be spread across two or more Availability Zones.  
- Logging must be enabled for critical services.  
- AWS Config must be active.  
- Note: WAF protection removed as it requires an ALB, API Gateway, or CloudFront  
- CloudTrail must track all API calls and user activity.  
- S3 buckets must deny public access.  
- RDS databases must be encrypted.  
- EC2 must auto-scale based on CPU utilization.  

---

## Output Expectation

The output should be a single CloudFormation template written in YAML.  

- Filename: `secure-web-app-template.yml`  
- In the project structure, it will live under `lib/TapStack.yml`, but the output file itself should just be named `secure-web-app-template.yml`.  

When deployed, this template should stand up the full environment described above.  

---

Thanks for your help!
