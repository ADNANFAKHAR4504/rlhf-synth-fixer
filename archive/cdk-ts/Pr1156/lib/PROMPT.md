You are an expert AWS Solutions Architect specializing in Infrastructure as Code with TypeScript and the AWS Cloud Development Kit (CDK). Your mission is to create a highly secure, production-grade infrastructure stack for a financial services organization. This requires you to write a complete, modular CDK project in TypeScript that meets the following stringent security and compliance requirements, with a critical focus on the secure communication and interaction between all resources.

1.  **Identity and Access Management (IAM):**
    - Create IAM roles with policies that strictly adhere to the principle of least privilege.
    - Enforce a company-wide policy for IAM users, requiring Multi-Factor Authentication (MFA) and mandating password rotation every 90 days.
2.  **Data Encryption:**
    - Ensure all data is encrypted both at rest and in transit. Use AWS Key Management Service (KMS) for encryption at rest (e.g., for S3 buckets and database volumes).
    - All in-transit data must be secured using TLS 1.2 or higher.
3.  **Network Security:**
    - Configure security groups with highly restrictive rules. Inbound traffic must be explicitly limited to the minimum required ports and CIDR blocks. No security group rule should allow traffic from `0.0.0.0/0` on any port except for standard web traffic on ports 80 and 443.
    - Deploy sensitive resources, such as AWS Lambda functions, securely within a private VPC to prevent public access.
4.  **Logging and Auditing:**
    - Enable AWS CloudTrail to log all management events across all AWS services. These logs must be encrypted using AWS KMS.
    - Implement AWS CloudWatch for comprehensive monitoring of all services.
5.  **Modularity and Organization:**
    - The solution must be modular and reusable. Use CDK Constructs to manage and abstract complex components like IAM policies, security groups, and network configurations.
6.  **Resource Lifecycle:**
    - To prevent accidental data loss, configure critical resources with a `removalPolicy` of `RemovalPolicy.RETAIN` to ensure they are not deleted during a `cdk destroy` command.
7.  **Tagging:**
    - All resources must be tagged with a standard naming convention, such as `{environment}-{service}-{resource}` (e.g., `prod-web-server`), and include tags like `Owner`, `Environment`, and `Project`.

**Expected Output:**

A complete and runnable CDK project in TypeScript, including a clear directory structure with modular constructs and a `bin` file to define and deploy the stack. The code should be fully commented to explain the purpose of each resource, the strict security rules, and, most importantly, the secure connections between all resources. The final output should be a validated, deployable CDK solution that serves as a best-practice example for secure and compliant AWS infrastructure for a financial services environment.
