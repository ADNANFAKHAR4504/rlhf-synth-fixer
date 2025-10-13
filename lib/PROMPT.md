You are tasked with developing a **secure and resilient AWS environment** using **AWS Cloud Development Kit (CDK) in TypeScript**. The goal is to deploy a web application infrastructure that adheres to **AWS security best practices** and **CIS Benchmark guidelines**.

Your solution should be modular, maintainable, and split into two main files:

* `module.ts` — defines reusable infrastructure modules (VPC, RDS, EC2, IAM, S3, CloudWatch, etc.)
* `tap-stack.ts` — defines the main stack that ties these modules together and configures relationships between resources.

#### **Requirements**

1. Use **AWS CDK in TypeScript** to define all infrastructure resources.
2. Create a **VPC** with both **public and private subnets** across at least **two Availability Zones** for high availability.
3. Provision a **PostgreSQL RDS instance** in the private subnet, configured with **encryption at rest** and **automated backups (7-day retention)**.
4. Launch an **EC2 instance (web server)** in the public subnet, ensuring it has **access to the RDS instance** via proper **security group rules**.
5. Store **EC2 instance logs** in an **S3 bucket** with **restricted access policies** (no public access).
6. Attach an **IAM role** to the EC2 instance with **least privilege permissions** for accessing only required services.
7. Use **AWS Secrets Manager** to store and manage **RDS credentials securely**.
8. Implement **CloudWatch** for centralized logging across all AWS services.
9. Create a **CloudWatch Metric Filter** to capture and alert on **failed RDS connection attempts**.
10. Apply **AWS KMS encryption** for all sensitive resources and **enable annual key rotation**.
11. Enforce **VPC security groups** to tightly control inbound and outbound traffic.
12. Ensure compliance with **AWS CIS Benchmark Level 1** recommendations where applicable.
13. Tag all resources with consistent keys such as `Environment`, `Application`, and `Owner`.
14. Ensure the solution passes **CDK synth and deploy** without errors.

#### **Expected Output**

A CDK application in **TypeScript**, organized under the `lib` directory, with:

* `module.ts`: encapsulating modular, reusable resource definitions.
* `tap-stack.ts`: composing and deploying these modules into a unified, secure AWS stack.

The CloudFormation template generated from `cdk synth` should include:

* A VPC with multi-AZ configuration
* A public EC2 instance
* A private, encrypted RDS instance
* S3 bucket for logs
* Secrets Manager entry for credentials
* CloudWatch monitoring setup
* KMS keys for encryption

Deployment should complete successfully with all compliance and encryption requirements satisfied.

---

#### **Constraint Items**

* Use AWS CDK in TypeScript.
* Define a VPC with public and private subnets across two AZs.
* Deploy an RDS PostgreSQL instance in the private subnet.
* Ensure the EC2 instance in the public subnet can securely access the RDS instance.
* Use S3 for EC2 log storage with restricted policies.
* Attach IAM roles with least privilege permissions to EC2.
* Encrypt RDS and EBS volumes at rest using AWS KMS.
* Store credentials in AWS Secrets Manager.
* Enable centralized CloudWatch logging.
* Add a CloudWatch Metric Filter for failed RDS connections.
* Apply CIS Benchmark-compliant configurations.
* Enable RDS automated backups (7-day retention).
* Ensure all resources are tagged properly.
* Enable key rotation in KMS.
* Ensure high availability across multiple AZs.