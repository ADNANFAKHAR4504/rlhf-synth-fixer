Design a production-grade CloudFormation YAML template for 'FinanceApp', our financial application, using the us-east-1 region. Follow the company naming standard `'ProjectName-Resource-Env'`—where `ProjectName` is 'FinanceApp', `Resource` is the AWS service (e.g., 'EC2', 'RDS'), and `Env` is either 'Dev' or 'Prod'.

The infrastructure should reflect a secure three-tier architecture and strictly adhere to AWS best practices:

- **IAM:** Create all roles with the least privilege principle, attaching only the permissions each compute or database instance requires.
- **S3:** Provision a dedicated bucket for application data, enabling server-side encryption (SSE-S3). Make sure access policies are tightly scoped and only accessible to the right IAM role(s).
- **Compute:** Deploy EC2 instances in an Auto Scaling Group for high availability. Ensure these are distributed across multiple public/private subnets spanning at least two different availability zones for resilience.
- **Networking:** Create a single VPC for both Dev and Prod environments. In this VPC, define at least two public and two private subnets in distinct AZs—with route tables and any required NAT Gateway/IGW setup for Internet-connectivity.
- **Database:** Set up RDS instances with Multi-AZ failover for robust database availability and continuity.
- **Tagging:** Consistently tag every resource with `Environment`, `Department`, and `Owner`.

Your solution must:
- Write the template in YAML, with clear outputs (VPC ID, subnets, S3 bucket, RDS endpoint, etc.) for validation.
- Pass AWS CloudFormation validation (no placeholders, only working logic).
- Comment where design choices matter—especially for security, scalability, and company compliance standards.
- Be ready for direct deployment in a sandbox environment, so testable and production-ready.

Please generate the full CloudFormation YAML template according to these requirements.
