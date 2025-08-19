# Prompt

Use a specified AWS region for all resources. | Ensure all IAM policies are written with the principle of least privilege. | All resources must be tagged according to provided naming conventions. | The VPC must have at least 3 public and 3 private subnets spread across different Availability Zones. | Implement a logging mechanism for all security-related activities using CloudWatch. | Encrypt all data at rest and in transit using AWS-managed keys. | Ensure S3 buckets are private, with access granted only through specific IAM roles or policies. | Configure an alert system for unauthorized access attempts using SNS. | Deploy an RDS instance with automated backups enabled. | Use multi-factor authentication for accessing sensitive AWS resources. | Implement a WAF to protect against SQL injection and XSS attacks. | All security groups should be crafted to allow minimum inbound and outbound traffic necessary for operations. | Ensure server instances are patched automatically using a patch management system.

**Instructions:**
provider. The environment must follow strict security guidelines with a focus on automation and compliance checking using AWS CDK Typescript. Use naming conventions that include environment (prod, dev), component, and a unique identifier. Deploy resources in a single AWS account.

You are tasked to implement a secure, automated infrastructure environment using AWS CDK Typescript to manage an AWS environment. The setup will host a multi-tier application in the us-east-1 region. Follow these security-focused requirements to build the environment: 

1. Create a Virtual Private Cloud (VPC) with 3 public and 3 private subnets, ensuring high availability through deployment in multiple Availability Zones.
2. Establish Network ACLs and Security Groups to minimize exposure and restrict access appropriately.
3. Assign IAM roles and policies adhering to the principle of least privilege and ensure multi-factor authentication is used for sensitive operations.
4. Set up an RDS instance with automated snapshots and enable encryption for data at rest and in transit.
5. Introduce CloudWatch logging for auditing and SNS alerts for any unauthorized access attempts.
6. Deploy and configure an AWS WAF to protect against common web vulnerabilities such as SQL injection and cross-site scripting.
7. Ensure all S3 buckets are private, with public access blocked and exception-based access allowed.

Expected Output: Provide a complete set of AWS CDK TypeScript code that, when applied, creates the described secure infrastructure, meeting all specified constraints. Be sure to test that alerts and logging are functioning as expected and that all resources are correctly secured and tagged. All specified tests must pass, confirming compliance with security and operational guidelines.