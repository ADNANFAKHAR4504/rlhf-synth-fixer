You are an expert AWS Solutions Architect specializing in security and Infrastructure as Code (IaC). Your mission is to design a secure and compliant AWS infrastructure for our new `FinancialApp` by creating a comprehensive AWS CloudFormation template.

**Project Name:** `FinancialApp`

**Scenario:** The infrastructure will be deployed in a multi-account AWS environment, typical for a financial institution with stringent security and compliance mandates. Assume the target deployment region is `us-east-1`. The CloudFormation stack must be capable of being deployed securely without manual post-deployment interventions.

---

### Core Security and Architectural Requirements

Your CloudFormation template must provision and configure resources to meet the following non-negotiable security requirements:

1.  **VPC & Networking**: All compute resources must be deployed within a custom Virtual Private Cloud (VPC) to ensure network-level isolation.
2.  **S3 Bucket Encryption**: All created Amazon S3 buckets must have server-side encryption enabled using the **AES-256** standard.
3.  **IAM Role MFA Enforcement**: Create IAM roles with policies that explicitly require Multi-Factor Authentication (MFA) for critical actions, particularly any action that alters IAM policies or grants permissions (e.g., `iam:CreatePolicy`, `iam:PutRolePolicy`).
4.  **API Gateway Logging**: Any API Gateway deployed must have access logging enabled for all its stages, directing logs to a dedicated CloudWatch Log Group.
5.  **RDS Database Encryption**: Provision an Amazon RDS database instance and ensure its storage is encrypted using an AWS Key Management Service (KMS) key.
6.  **Default Deny Security Groups**: All security groups must be configured with a default "deny all" for inbound traffic. You will then add explicit rules to allow only necessary traffic as defined within the template.
7.  **Automated Patching & Compliance**: Implement AWS Systems Manager Patch Manager by defining a patch baseline and associating it with the EC2 instances to automate the detection of insecure configurations and vulnerabilities.

---

### Expected Output

Your final output should be a single, complete CloudFormation template in YAML format.

* The YAML file must be a valid CloudFormation template that can be deployed directly.
* The code should be well-commented, explaining the purpose of key resources and security configurations.
* Employ CloudFormation best practices, such as using parameters for customizable values (e.g., VPC CIDR, database passwords via Secrets Manager) and outputs for important resource IDs (e.g., VPC ID, S3 Bucket Name).
* The resulting stack should create an operational, secure foundation ready for application deployment.
