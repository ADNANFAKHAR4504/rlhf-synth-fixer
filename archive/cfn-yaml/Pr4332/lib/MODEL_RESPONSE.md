This CloudFormation solution provisions a **secure, multi-AZ web application infrastructure** that adheres to AWS best practices for security, availability, and automation.  
The template (`TapStack.yml`) was designed to be **self-contained**, creating all resources from scratch with no external dependencies.

---

## Overview

The stack builds an end-to-end application environment including:
- IAM roles and instance profiles with least privilege.
- A fully isolated VPC with public and private subnets across two Availability Zones.
- NAT Gateways and routing for controlled outbound access.
- Auto-scaled EC2 instances behind an Application Load Balancer.
- A Multi-AZ RDS MySQL database in private subnets.
- Encrypted S3 buckets for both application assets and CloudTrail logs.
- CloudFront distribution for global delivery of static assets.
- CloudWatch and CloudTrail for logging, auditing, and observability.
- AWS Systems Manager for EC2 patching and parameter storage.

---

## Architecture Summary

| Layer | AWS Services | Purpose |
|-------|---------------|----------|
| **Networking** | VPC, Subnets, IGW, NAT Gateway, Route Tables | Multi-AZ segmentation and internet egress |
| **Compute** | EC2, Auto Scaling, ALB | Web application hosting and HA load balancing |
| **Database** | RDS (MySQL) | Multi-AZ, encrypted, private database tier |
| **Storage** | S3 (App + CloudTrail) | Secure asset storage and audit log archive |
| **Security** | IAM, Security Groups, KMS encryption | Least privilege and data protection |
| **Monitoring** | CloudWatch, CloudTrail | Auditing, metrics, alarms |
| **Automation** | SSM, Parameter Store | Configuration and patch management |
| **Distribution** | CloudFront | Global CDN for static assets |

---

## Key Best Practices Implemented

- **No hard-coded credentials** — RDS password stored securely in SSM Parameter Store.  
- **Encryption at rest and in transit** for S3, RDS, and CloudTrail.  
- **IAM least privilege** enforced via specific roles and instance profiles.  
- **Private subnets for RDS and EC2** to reduce attack surface.  
- **ALB + Auto Scaling Group** for high availability and fault tolerance.  
- **Strict CloudTrail bucket policy** restricting writes to the specific trail.  
- **CloudFront cache behavior with minimal exposure** (`ForwardedValues` limited).  
- **No SSL/ACM configuration** per the user’s prompt constraints.  
