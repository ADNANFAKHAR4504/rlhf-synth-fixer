# Secure AWS Infrastructure Setup with AWS CDK (TypeScript)

## Objective
Design and implement a **secure infrastructure setup** for a web application using **AWS CloudFormation with AWS CDK in TypeScript**.  
The solution must align with **AWS security best practices**, ensuring compliance, least privilege access, encryption, logging, and monitoring.

---

## Requirements

### 1. Infrastructure as Code
- Use **AWS CDK in TypeScript** to define all resources.
- Deploy CloudFormation stacks programmatically with reusable and modular constructs.
- Target AWS **us-west-2 (Oregon)** region.

---

### 2. Networking (VPC)
- Create a **non-default VPC** named `SecureVPC`.
- VPC must include:
  - **Public subnets** (for load balancers, NAT Gateway).
  - **Private subnets** (for EC2 instances, RDS if needed).
  - Proper **routing tables** for controlled traffic flow.
  - A **NAT Gateway** for secure outbound access from private subnets.

---

### 3. Security Groups
- Restrictive **security groups**:
  - Allow ingress only from **specific trusted IP addresses**.
  - Block all unnecessary ports and protocols.
- Outbound rules must follow **least privilege** principles.

---

### 4. IAM (Least Privilege)
- All IAM roles and policies must:
  - Follow **principle of least privilege**.
  - Be scoped only to required AWS services and actions.
  - Enforce MFA for IAM users (where applicable).

---

### 5. Data Security
- **S3 Buckets**:
  - Server-side encryption using **SSE-S3 (AES-256)**.
  - **Versioning enabled** to protect against accidental overwrite/deletion.
- **EBS Volumes**:
  - Encrypted with **AWS KMS CMKs**.
  - All EC2 instances must use encrypted EBS volumes.
- **Secrets/Keys** stored securely using **AWS Secrets Manager** or **SSM Parameter Store**.

---

### 6. Secure Access
- **Application Load Balancers (ALB/ELB)**:
  - Enforce **HTTPS only**.
  - Attach SSL certificates via ACM.
- **API Gateway**:
  - Enforce **HTTPS only**.
  - Enable **access logging** and request validation.

---

### 7. Threat Protection
- Integrate **AWS WAF**:
  - Protect against **SQL Injection**.
  - Protect against **Cross-Site Scripting (XSS)**.
  - Attach WAF to ALB and API Gateway.

---

### 8. Logging & Monitoring
- **VPC Flow Logs** enabled for traffic visibility.
- **CloudTrail**:
  - Track and log all IAM user operations.
  - Store logs in encrypted S3 bucket with versioning.
- **AWS Config**:
  - Enable for continuous monitoring and compliance checks.
  - Use managed rules for common security compliance (e.g., encryption, public access restrictions).
- **CloudWatch Logs & Metrics**:
  - Enable for all Lambda functions and API Gateway.
  - Alarm on suspicious activity.

---

### 9. Application Logs & Analysis
- **Lambda Functions**:
  - Process application logs.
  - Detect anomalies or suspicious activity.
  - Trigger **CloudWatch Alarms** and **SNS notifications**.

---

### 10. Compliance & Auditing
- Infrastructure must demonstrate:
  - Enforced encryption everywhere (S3, EBS, CloudTrail).
  - Strict IAM policies.
  - Continuous compliance monitoring (AWS Config).
  - Complete audit trail (CloudTrail).

---

## Deliverables
1. **TypeScript CDK scripts** defining all resources.
2. **CloudFormation stack** deployable in `us-west-2`.
3. Verified security controls:
   - IAM least privilege.
   - Logging enabled everywhere.
   - Encryption enforced.
   - HTTPS enforced.
4. Unit and integration tests validating:
   - Resources are created correctly.
   - Security configurations are enforced.
   - Logging and monitoring are functional.

---

## Notes
- Infrastructure must be **modular** and **reusable**.
- Follow AWS **Well-Architected Framework (Security Pillar)** guidelines.
- Ensure compliance readiness for **auditing and monitoring**.