# Secure AWS Infrastructure - CloudFormation Template

## Objective
Create a secure AWS environment using **CloudFormation**. The solution must be implemented as a YAML-based CloudFormation template named `secure_infrastructure.yml`.  

The infrastructure should enforce **security best practices** by implementing IAM cross-account roles, encryption for data at rest, logging for activity monitoring, and network visibility.  

---

## Requirements

### 1. IAM Roles & Policies
- Create IAM roles with **least-privilege policies**.  
- Configure **cross-account access securely**.  
- Ensure that roles include appropriate **trust relationships** for access delegation.  

### 2. Secure S3 Buckets
- Provision S3 buckets with **default encryption enabled**.  
- Use **KMS keys (SSE-KMS)** for server-side encryption.  
- Enforce encryption for all objects written to S3.  

### 3. AWS CloudTrail
- Enable **CloudTrail** across the account.  
- Ensure logging of **all AWS Management Console actions** and **API calls**.  
- Configure CloudTrail to deliver logs to a **secure S3 bucket** (with encryption).  

### 4. VPC Flow Logs
- Enable **VPC Flow Logs** for the VPC(s).  
- Capture **IP traffic data** to and from network interfaces.  
- Deliver logs to a monitored, encrypted S3 bucket for **security analysis**.  

---

## Deliverables
- A CloudFormation template (`secure_infrastructure.yml`) that:  
  - Creates the above resources.  
  - Enforces **encryption** and **logging** by default.  
  - Ensures **compliance with AWS security best practices**.  

---

## Validation
- Deploy the template in CloudFormation.  
- Verify the following:  
  - Cross-account IAM role works securely.  
  - S3 buckets enforce encryption by default.  
  - CloudTrail is enabled and delivering logs.  
  - VPC Flow Logs are active and writing to the monitored S3 bucket.