# CloudFormation Secure Environment Setup - User Prompt

## Objective
Design a **CloudFormation template** in **YAML** that provisions a **secure and compliant production environment** in the `us-east-1` region. The template must strictly adhere to security, compliance, and organizational standards, ensuring that resources are deployed following Amazon’s best practices.

---

## Requirements

### Security & Compliance
1. **IAM Roles**
   - Must adhere strictly to the principle of least privilege.
   - Avoid granting excessive permissions.

2. **EC2 Instances**
   - Deploy with **encrypted EBS volumes**.
   - Launch only within secure subnets.
   - Restrict access to a specific IP range (`192.168.0.0/16`).

3. **S3 Buckets**
   - Must have **Server-Side Encryption (SSE)** enabled by default.
   - Access restricted to specific IP range (`192.168.0.0/16`).

4. **RDS Instances**
   - Must be deployed within a **pre-defined VPC**.
   - Enforce encryption at rest and in transit.

5. **Lambda Functions**
   - Minimum **128MB memory** allocation.
   - Run inside the pre-defined VPC for security.
   - Tagged appropriately.

6. **Security Groups**
   - **Block public SSH access** completely.
   - Restrict inbound rules to `192.168.0.0/16`.

7. **CloudWatch Logging**
   - Enable **CloudTrail integration** to capture all API activity.
   - Store logs securely with encryption.

---

## Resource Tagging & Naming
- All resources must be tagged with:
  ```yaml
  Environment: Production
