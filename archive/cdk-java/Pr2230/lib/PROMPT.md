You are an expert AWS Solutions Architect specializing in creating secure, compliant, and efficient infrastructure using the AWS CDK with Java. Your task is to develop a comprehensive, single-file CDK application for a financial services company with stringent security requirements.

**Project ID:** `SecurityConfigurationAsCode_CloudFormation_YAML_a8b7e6t4q9j2`
**Project Name:** `IaC - AWS Nova Model Breaking`

### **Scenario**

You're building the foundational cloud infrastructure for a financial services company. The architecture must be secure by default and must be deployed across multiple AWS accounts (dev, prod, centralized logging) and regions (primarily `us-east-1` and `us-west-2`). Your deliverable is a single, self-contained Java file representing the CDK stack that defines these resources. The code should be production-ready, well-commented, and follow all specified best practices.

### **Core Requirements**

Your CDK stack must provision resources that satisfy the following security and operational constraints:

1.  **VPC and Networking:**
    * Define a multi-AZ VPC to host all services.
    * Restrict all RDS databases and Lambda functions to run in private subnets within the VPC.
    * Establish baseline network perimeter defenses by deploying an AWS Network Firewall and associating a strict firewall policy to filter traffic.
    * Configure Security Groups with the principle of least privilege. For example, the RDS security group should only allow ingress from the Lambda function's security group on the specific database port. **Absolutely no `0.0.0.0/0`** on sensitive ports.

2.  **Encryption:**
    * Provision a Customer-Managed Key (CMK) in AWS KMS.
    * This single CMK must be used to enforce encryption at rest for all supported services, including S3 buckets, RDS database instances, and EBS volumes.
    * Ensure the account is configured to encrypt all new EBS volumes by default.

3.  **IAM & Access Control:**
    * Create all IAM Roles and Policies adhering strictly to the **principle of least privilege**. Avoid wildcards (`*`) in actions and resources wherever possible.
    * Configure S3 Bucket Policies to **reject any requests that are not sent over HTTPS/TLS**.

4.  **Compute:**
    * Define a launch template for an EC2 instance that specifies an instance type supporting **AWS Nitro Enclaves** (e.g., `m6i.large`).
    * Ensure all Lambda functions are configured to run within the private subnets of the VPC.

5.  **Data & Services:**
    * Configure an **API Gateway** with logging enabled for all requests, directing logs to a CloudWatch Log Group.
    * Provision an **RDS (PostgreSQL) instance** within the private subnets.
    * Provision an **S3 bucket** for application data, enforcing both encryption (using the CMK) and secure transport (HTTPS).

6.  **Governance & Auditing:**
    * Set up **AWS CloudTrail** to create a multi-region trail that captures all management events. This trail should log to a centralized S3 bucket (you can assume its ARN is provided, e.g., `arn:aws:s3:::central-logging-bucket-123456789012`).
    * Enable **AWS Config** with a configuration recorder to track all resource changes within the deployment region.

### **Implementation Guidelines**

* **Language:** The entire solution must be written in **Java using the AWS CDK**.
* **File Structure:** Provide the complete, deployable code within a **single `.java` file**. This file should include the `App` main method and the `Stack` definition.
* **Dependencies:** At the top of the Java file, include a comment block listing the necessary Maven dependencies for the `pom.xml` file.
* **Naming Convention:** All resources must be named programmatically using the format `<Project>-<Resource>-<Environment>`. For this build, assume the project is `novamodel` and the environment is `dev`.
* **Tagging:** Apply consistent tags to all taggable resources:
    * `Project: NovaModel`
    * `Environment: dev`
    * `Owner: FinServTeam`
    * `ManagedBy: CDK`
* **Outputs:** Only output non-sensitive information like the S3 bucket name, VPC ID, and RDS endpoint address. Do not output any secrets, keys, or passwords.

Please generate the complete Java code now.
