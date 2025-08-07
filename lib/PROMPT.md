# prompt.md

**Problem ID:** `SecurityConfig_Pulumi_Python`

You are a senior Cloud Security Architect. Your task is to design and generate a secure, multi-environment AWS architecture using Pulumi and Python. The output must be a reusable, production-ready template that enforces security best practices by default.

### Objective
Create a secure and reusable AWS environment template that can be instantiated for both `staging` and `production` environments. The entire infrastructure must be defined in a single, well-structured Python file.

### IaC Specification
* **Tool:** Pulumi
* **Language:** Python
* **AWS Region:** `us-west-1`

---

### Core Architectural Requirement

Define a Python **class** named `SecureEnvironment`. This class will encapsulate all the resources for a single environment (e.g., `staging` or `production`). The class constructor should accept an environment name as an argument. The main part of the program will then instantiate this class twice to create the two environments.

---

### `SecureEnvironment` Class Requirements

#### 1. Foundational Networking (VPC)
* **VPC Structure:** Provision a new VPC with separate subnets for `public`, `private` (application), and `database` layers.
* **Traffic Monitoring:** Enable **VPC Flow Logs** and stream them to a CloudWatch Log Group for analysis.
* **Secure Egress:** Ensure instances in the private and database subnets use a **NAT Gateway** for outbound internet access, preventing direct inbound connections.

#### 2. Application Security
* **Web Application Firewall (WAF):** Deploy **AWS WAF** and associate it with an Application Load Balancer. Configure it with AWS-managed rule sets to protect against common exploits like SQL injection and cross-site scripting.
* **Traffic Encryption:** The Application Load Balancer must have an HTTPS listener configured with a security policy that enforces **TLS 1.2** or higher.

#### 3. Data Security & Encryption
* **KMS Keys:** Create a customer-managed **AWS KMS key** dedicated to this environment.
* **S3 Encryption:** Provision an S3 bucket for application data. Enforce **server-side encryption by default** using the dedicated KMS key.
* **EBS Encryption:** Enforce **encryption by default for all new EBS volumes** in the region, using the dedicated KMS key.
* **Secrets Management:** Create a secret in **AWS Secrets Manager** to hold database credentials, and configure an automatic **rotation policy** for it.

#### 4. Identity & Access Management (IAM)
* **Instance Roles:** Define a least-privilege **IAM Role for EC2 instances**. This role should grant the necessary permissions to access other AWS services (like Secrets Manager) without needing static credentials.

#### 5. Compliance & Auditing
* **Configuration Checks:** Deploy several **AWS Config** rules to continuously monitor compliance. Include rules like `s3-bucket-server-side-encryption-enabled` and `ec2-volume-inuse-check`.
* **Audit Logging:** Ensure **AWS CloudTrail** is enabled to log all management events. All logs (CloudTrail, CloudWatch, S3 access logs) must be configured with a **retention period of at least 365 days**.

#### 6. Automated Monitoring & Remediation
* **Alerting:** Create a central **SNS Topic** for security notifications.
* **Automated Response:** Provision a **CloudWatch Alarm** that monitors for a specific security event (e.g., a root user login). This alarm should trigger a **Lambda function** that, in turn, publishes a notification to the SNS topic.

---

### Expected Output

Your response must be a **single code block** containing the complete Python code for the `__main__.py` file. The file should define the `SecureEnvironment` class as specified and then create two instances of it for the `staging` and `production` environments. The code must be self-contained, well-commented, and ready for deployment.