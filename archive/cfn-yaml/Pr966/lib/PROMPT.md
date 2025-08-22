# IaC - AWS Nova Model Breaking (Secure AWS Infrastructure via CloudFormation)

## Objective

Design and deploy a **highly secure AWS cloud environment** using **CloudFormation (YAML)** that strictly adheres to **AWS security best practices**.  
The infrastructure will integrate multiple AWS services with strong encryption, least-privilege IAM configurations, network hardening, and automated compliance auditing.

---

## Problem Statement

You are tasked with implementing an **Infrastructure as Code (IaC)** solution using **AWS CloudFormation** to provision a **security-focused cloud architecture**.  
The deployment will run in the **`us-east-1` region** and must include:

- Secure **S3 bucket** with AWS-KMS encryption
- Restricted **EC2 IAM roles**
- **CloudTrail** for S3 activity logging to a separate account
- Hardened **VPC and Network ACLs**
- Minimal **security group** rules
- **AWS Secrets Manager** for sensitive data
- Automated compliance checks with **AWS Config**

All resources must be consistently tagged for production identification.

---

## Functional Requirements

### 1. S3 Bucket
- Must have **Server-Side Encryption (SSE-KMS)** enabled using a **customer-managed AWS-KMS key**.
- Only specific IAM principals should have permissions for `s3:PutObject`.
- Logging and access control must be enforced.

### 2. EC2 Instances
- Launch EC2 instances with **IAM roles** granting only the minimum required permissions to access specific AWS services.
- Roles must follow the **principle of least privilege**.

### 3. CloudTrail
- Enable **CloudTrail** to log **all S3 bucket activities**.
- Logs must be sent to an **S3 bucket in a separate AWS account** dedicated for logging.

### 4. VPC & Network ACLs
- Create a **VPC** with **Network ACLs** that:
  - **Deny all traffic by default**.
  - Allow **HTTP (80)** and **HTTPS (443)** access **only** from a predefined list of known IP addresses.

### 5. IAM Policies
- Follow **least privilege** principles.
- Restrict `s3:PutObject` to **specific S3 buckets only**.

### 6. Security Groups
- Define **minimal ingress/egress rules**.
- Allow only required ports and protocols.

### 7. AWS Secrets Manager
- Store sensitive data such as **database credentials** in AWS Secrets Manager.
- Enable **automatic rotation** for stored secrets.

### 8. AWS Config
- Deploy **AWS Config** rules to monitor compliance with:
  - Encryption requirements
  - Network restrictions
  - Least-privilege IAM policies
- Ensure automated **auditing features** are active.

---

## Constraints

| Constraint | Description |
|------------|-------------|
| Template Format | Must be **YAML** CloudFormation template |
| Region | All resources must be deployed in `us-east-1` |
| S3 Encryption | SSE-KMS encryption required |
| EC2 Roles | Must have least-privilege IAM permissions |
| CloudTrail | Logs sent to a **separate logging account** |
| VPC | Default deny in NACL; allow only HTTP/HTTPS from known IPs |
| IAM | Restrict `s3:PutObject` to specific buckets |
| Security Groups | Minimal ingress and egress rules |
| Secrets | Use AWS Secrets Manager with auto-rotation |
| Compliance | Enable AWS Config rules for auditing |
| Tagging | All resources tagged: `Environment: Production` |

---

## Deliverable

- A **validated CloudFormation YAML template** named:  
  `secure-cloud-environment.yaml`

- The template must:
  - Pass `aws cloudformation validate-template`
  - Deploy successfully in **`us-east-1`**
  - Provision all listed services with **security and compliance measures**
  - Include `Environment: Production` tags on **all resources**
  - Pass **AWS Config compliance checks**

---

## Notes

- Use **customer-managed KMS keys** for better control over encryption.
- Maintain modularity by splitting resources into **logical sections** within the YAML template.
- Validate network and IAM configurations against **AWS Security Hub** recommendations.
- Ensure separation of duties for CloudTrail logging and access permissions.