# Complete AWS Environment Setup (CDK - TypeScript)

## Overview
We need to set up a complete AWS environment using the AWS CDK (TypeScript).  
The goal is to build a secure, scalable, and cost-tracked infrastructure following AWS best practices.  

This setup will cover networking, compute, storage, database, monitoring, and security. The final deliverable should be a valid CloudFormation template named `CompleteEnvironmentSetup.yaml` that can be deployed without errors.

---

## Requirements

### S3 Buckets
- Create a main S3 bucket with server-side encryption using AWS KMS.  
- Enable access logging, and store the logs in a separate logging bucket.

### VPC & Networking
- Create a VPC that spans at least two Availability Zones.  
- Include:
  - Public subnets (with an Internet Gateway for outbound traffic).  
  - Private subnets (with a NAT Gateway to allow internet access).  

### EC2 Instance
- Launch an EC2 instance in one of the private subnets.  
- Configure it to access the internet through the NAT Gateway.  
- Attach an IAM role to the instance so it has read/write access to the S3 bucket.  
- Security group rules:
  - Allow SSH access only from specific IP addresses.  

### RDS Instance
- Deploy an RDS database instance inside a dedicated private subnet.  
- The RDS should not be exposed to the internet.  
- It must be reachable from the EC2 instance.  
- Enable automatic backups with at least 7 days retention.  
- Lock down outbound rules in its Security Group so that only required ports are open.  

### Monitoring
- Use CloudWatch to monitor both the EC2 and RDS instances.  
- Turn on detailed monitoring for better visibility.  

### Tagging
- Apply AWS tags (such as `Department` and `Project`) on all resources for cost allocation and tracking.  

---

## Constraints Recap
- S3 bucket with SSE-KMS encryption and logging enabled.  
- VPC with public + private subnets across 2+ AZs.  
- Public subnet → Internet Gateway.  
- Private subnet → NAT Gateway.  
- EC2 in private subnet → internet via NAT, IAM role with S3 access.  
- RDS in private subnet → accessible only from EC2, backups enabled.  
- CloudWatch detailed monitoring for EC2 and RDS.  
- Restrict SSH to EC2 from whitelisted IPs.  
- Restrict RDS outbound traffic to necessary ports.  
- Apply tags everywhere.  

---

## Deployment Target
- Region: `us-east-1`  
- Template name: `CompleteEnvironmentSetup.yaml`  
- Must follow the architecture and security rules above.  

---