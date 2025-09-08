# Secure Multi-AZ AWS Infrastructure - CloudFormation Template

## Objective
Create a highly available and secure AWS infrastructure using **CloudFormation**. The solution must be implemented as a YAML template named `secure_infrastructure.yaml` that provisions resources across multiple availability zones while enforcing security best practices.

---

## Requirements

### 1. Network Architecture & Security
- Set up a **VPC** spanning at least two availability zones for redundancy
- Configure **private and public subnets** in each AZ
- Implement **security groups** that:
  - Allow inbound traffic only on ports 80 and 443
  - Restrict access to RDS instances to private subnets only
- Deploy **AWS WAF** to protect against common web exploits

### 2. IAM & Access Management
- Create IAM roles following the **principle of least privilege**
- Ensure IAM policies are attached only to **groups and roles**, not individual users
- Implement appropriate **trust relationships** and **permission boundaries**

### 3. Database & Storage
- Provision an **RDS instance** in a private subnet with:
  - Multi-AZ deployment for high availability
  - Encryption at rest using AWS KMS
- Configure **S3 buckets** with:
  - Default encryption enabled using KMS
  - No public access allowed by default
  - Appropriate bucket policies

### 4. Monitoring & Logging
- Set up **CloudWatch** for:
  - Resource monitoring and metrics collection
  - Log aggregation from all components
  - Custom alarms and dashboards
- Enable detailed **monitoring** for critical resources

### 5. Encryption & Key Management
- Implement **AWS KMS** for managing encryption keys
- Ensure encryption for:
  - Data at rest (RDS, S3)
  - Data in transit (using TLS)

---

## Deliverables
- CloudFormation template (`secure_infrastructure.yaml`) that:
  - Provisions all required infrastructure components
  - Implements security controls and best practices
  - Ensures high availability across multiple AZs

---

## Validation
The infrastructure should validate:
- Resources are distributed across multiple AZs
- Security groups restrict traffic as specified
- RDS instance is properly secured in private subnet
- All required encryption is in place
- CloudWatch monitoring is properly configured
- WAF rules are protecting the infrastructure
- IAM roles follow least privilege principle
