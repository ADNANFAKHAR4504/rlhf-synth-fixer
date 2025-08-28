# Secure AWS Infrastructure with CloudFormation

## Objective
Create a production-ready **CloudFormation template (`secure-infrastructure.yaml`)** that provisions a secure AWS infrastructure following security best practices.

## Requirements

1. **VPC and Networking**
   - Create a VPC with **two public subnets** and **two private subnets** across **two Availability Zones**.
   - Restrict public IP addresses to **only EC2 instances in public subnets**.
   - Ensure SSH access to EC2 instances is only allowed from a **specified IP address**.

2. **EC2 Instances**
   - AMI IDs must be **passed as parameters** for reusability.
   - Launch EC2 instances in public subnets only when public access is required.

3. **RDS Database**
   - Create an RDS instance with:
     - Automated backups enabled.
     - Retention period of **at least 7 days**.
     - Encrypted storage at rest using **AWS KMS**.

4. **S3 Buckets**
   - All S3 buckets must have **default encryption enabled (AES-256)**.
   - Logging should be enabled for auditing where applicable.

5. **IAM Users and Roles**
   - Create IAM users with **MFA enforced**.
   - IAM roles must have **managed policy ARNs** attached instead of inline policies.

6. **Lambda Functions**
   - Deploy Lambda functions with **CloudWatch Logs enabled**.
   - Log groups should be configured with retention policies.

7. **Security Monitoring**
   - Set up an **SNS topic** for security alerts.
   - Configure monitoring (via CloudTrail + EventBridge) to publish alerts when **Security Group changes** occur.

8. **General Security Best Practices**
   - Ensure encryption **at rest** (KMS) and **in transit (TLS/SSL)** across services.
   - Minimize privileges by following the **least privilege principle** for IAM.

## Deliverable
- A single YAML file named **`secure-infrastructure.yaml`**.
- Must pass validation using:
  ```bash
  aws cloudformation validate-template --template-body file://secure-infrastructure.yaml
  