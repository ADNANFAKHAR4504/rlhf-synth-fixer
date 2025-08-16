You are an expert AWS Solutions Architect specializing in Infrastructure as Code with TypeScript and the AWS Cloud Development Kit (CDK). Your mission is to create a highly secure, production-grade infrastructure stack. This requires you to write a complete, modular CDK project in TypeScript that meets the following stringent security and compliance requirements, with a critical focus on the secure communication and interaction between all resources.

1.  **VPC and Networking:** Deploy a Virtual Private Cloud (VPC) in the `us-east-1` region. The VPC must have at least one private subnet where all sensitive resources, including EC2 instances, will be deployed. Enable VPC Flow Logs to monitor and audit network traffic.
2.  **Network Security:** Implement security groups with highly restrictive rules. Ensure SSH access is limited to a specific CIDR block, and all other inbound and outbound rules are set to the minimal required ports and protocols. No security group rule should allow traffic from `0.0.0.0/0` except where absolutely necessary for public-facing services (e.g., a load balancer).
3.  **Data and Secrets Management:**
    - Ensure all S3 buckets are encrypted at rest using AWS Key Management Service (KMS).
    - All data in transit must be secured using TLS 1.2 or higher.
    - Utilize AWS Secrets Manager to securely store and retrieve sensitive information like database credentials.
4.  **Identity and Access Management (IAM):**
    - Create IAM roles with policies that strictly adhere to the principle of least privilege.
    - Enforce Multi-Factor Authentication (MFA) for all user accounts.
5.  **Logging and Auditing:**
    - Enable AWS CloudTrail to record all API calls made to the AWS account and store the logs in a separate, encrypted S3 bucket.
    - Configure AWS Config to continuously monitor and report on compliance with security policies.
6.  **Application Security:**
    - For any public-facing application, deploy a Web Application Firewall (WAF) and associate it with the Application Load Balancer (ALB) to protect against common web exploits.
7.  **Tagging:** All resources within the stack must be named with the prefix `SecureApp`, as well as standard tags for ownership and environment.

**Expected Output:**

A complete and runnable CDK project in TypeScript, including a clear directory structure with modular constructs and a `bin` file to define and deploy the stack. The code should be fully commented to explain the purpose of each resource, the strict security rules, and, most importantly, the secure connections between all resources. The final output should be a validated, deployable CDK solution that serves as a best-practice example for a highly secure AWS infrastructure.
