Develop an AWS CDK template in TypeScript that provisions a secure and compliant production-ready infrastructure. The solution should follow best practices and meet the following requirements:

    1.	Deployment & Networking
    •	All resources must be deployed in the us-west-2 region.
    •	Use a custom VPC configuration instead of the default VPC.
    2.	IAM & Security
    •	Define IAM roles and policies with the principle of least privilege.
    •	Configure security groups to allow inbound traffic only from trusted IP ranges.
    •	Ensure all EC2 instances use IMDSv2 exclusively.
    •	Lambda functions must run without requiring public internet access.
    3.	Storage & Databases
    •	Enforce AES-256 server-side encryption for all S3 buckets.
    •	Deploy RDS instances with Multi-AZ enabled for high availability.
    •	Encrypt all RDS data at rest with AWS KMS.
    4.	Monitoring & Compliance
    •	Enable AWS CloudTrail logging for auditing across all services.
    •	Set up CloudWatch Alarms to monitor CPU utilization for every EC2 instance.
    5.	Tagging
    •	Apply tags Environment and Owner to every resource for cost tracking and auditing.
    6.	Project Structure
    •	Organize the CDK application into separate stack files by resource type

(e.g., networking-stack.ts, security-stack.ts, compute-stack.ts, database-stack.ts, monitoring-stack.ts).

The output should be a CDK app in TypeScript with multiple stacks, following the above security, compliance, and monitoring standards.
