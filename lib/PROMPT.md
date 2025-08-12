**Prompt:**

You are an expert AWS Solutions Architect specializing in Infrastructure as Code with TypeScript and the AWS Cloud Development Kit (CDK). Your mission is to create a highly secure, production-ready infrastructure stack. This requires you to write a complete, single CDK stack in TypeScript that meets the following stringent security requirements, with a critical focus on the secure communication and interaction between all resources.

1.  **Network Configuration:** Create a Virtual Private Cloud (VPC) with a private subnet structure. All sensitive resources, including database instances and Lambda functions, must be deployed within this private network to prevent public exposure.
2.  **Security Groups:** Define security groups with highly restrictive inbound rules. Inbound traffic must be explicitly limited to specified CIDR blocks and never be open to the public internet (`0.0.0.0/0`). Ensure unused ports on all EC2 instances are disabled.
3.  **Data Encryption:** Implement encryption at rest for all data storage. This includes enabling default server-side encryption for S3 buckets and ensuring all EBS volumes are encrypted.
4.  **Logging and Auditing:** For full observability and auditing, enable AWS CloudTrail for all management events across all regions, and enable VPC Flow Logs for all traffic within the VPC.
5.  **Access Control:** Use IAM roles with the principle of least privilege for all compute resources. Specifically, create a custom IAM role for EC2 instances and another for Lambda functions, with policies granting only the minimum permissions required to perform their tasks. Do not use static access keys.
6.  **Database Security:** Deploy an Amazon RDS database and ensure it is not publicly accessible. The database's security group must only allow connections from the specific resources that require access (e.g., a Lambda function or an EC2 instance).
7.  **Web Application Security:** If the architecture includes an Application Load Balancer (ALB), it must be integrated with a Web Application Firewall (WAF) to provide an additional layer of security.
8.  **Tagging:** All resources within the stack must be tagged with `Owner: [your-name]` and `Project: SecurityDemo`.

**Expected Output:**

A single, complete, and runnable TypeScript file for the CDK stack. The code should be fully commented to explain the purpose of each resource, the strict security rules, and, most importantly, the secure connections between all resources. The final output should be a validated, deployable CDK stack that serves as a best-practice example for secure and compliant AWS infrastructure.
