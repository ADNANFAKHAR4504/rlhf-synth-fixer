You are an expert AWS DevOps engineer specializing in Infrastructure as Code (IaC). Your task is to generate a complete, production-ready CloudFormation YAML template named `web-app-stack.yml`.

This template will provision a secure, scalable, and highly available environment for a mission-critical web application. Adhere strictly to AWS best practices, especially the principle of least privilege for all security configurations.

**Output Requirements:**
* The entire response must be a single YAML code block.
* Do not include any explanations, headings, or conversational text outside of the code block.
* The template must be well-structured with logical resource names and comments where necessary.

**Detailed Infrastructure Specifications:**

1.  **VPC & Networking:**
    * Create a **VPC** with an appropriate CIDR block (e.g., `10.0.0.0/16`).
    * Define **two public and two private subnets**, each pair distributed across two different Availability Zones (e.g., `us-east-1a` and `us-east-1b`).
    * Implement an **Internet Gateway** for the public subnets.
    * Deploy a **NAT Gateway** in each public subnet and configure route tables for the private subnets to use them for outbound traffic.

2.  **Load Balancer:**
    * Set up an internet-facing **Application Load Balancer (ALB)**.
    * Configure a listener on port 80 to forward traffic to a target group. (You can assume the targets are EC2 instances, but you don't need to define the instances themselves).

3.  **Database:**
    * Provision an **RDS PostgreSQL** database instance.
    * Ensure it is deployed within a **DB Subnet Group** that uses the private subnets.
    * Crucially, enable **encryption at rest** (`StorageEncrypted: true`).

4.  **Storage:**
    * Create an **S3 Bucket** with **Versioning** enabled and all public access blocked.

5.  **IAM & Lambda:**
    * Define an **IAM Role** for Lambda execution.
    * Attach a policy to this role that grants read-only permissions (e.g., `dynamodb:GetItem`, `dynamodb:Scan`) to a DynamoDB table. Use a CloudFormation parameter to accept the DynamoDB table ARN.
    * Define a placeholder **AWS Lambda function** that references the IAM role and is configured to use a **Docker image from an ECR repository**. Use a parameter for the ECR image URI.

6.  **Security Groups (Least Privilege):**
    * **ALB Security Group:** Allow inbound HTTP traffic (port 80) from anywhere (`0.0.0.0/0`).
    * **Web Server Security Group:** Allow inbound traffic on port 80 *only* from the ALB's security group.
    * **Database Security Group:** Allow inbound PostgreSQL traffic (port 5432) *only* from the Web Server security group.

7.  **Tagging & Monitoring:**
    * Apply the following tags to all taggable resources: `Environment: Production` and `Owner: WebAppTeam`.
    * While CloudWatch monitoring is often default, ensure no configurations would prevent it. You can add a basic CloudWatch Alarm for CPU utilization on the RDS instance as an example.
