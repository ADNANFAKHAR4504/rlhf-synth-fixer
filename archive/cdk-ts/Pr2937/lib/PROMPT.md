You are tasked with setting up a production-ready AWS environment in the Ohio (us-east-2) region using CloudFormation implemented through TypeScript and the AWS SDK for JavaScript (v3). The solution must be programmatic, reliable, and adhere to AWS best practices for security, availability, and maintainability.

The environment should include:

    1.	Networking (VPC & Subnets):
    •	Create a VPC with CIDR block 10.0.0.0/16.
    •	Define two public subnets across different availability zones.
    •	Define two private subnets across different availability zones.
    •	Attach an Internet Gateway to the VPC.
    •	Create a public route table and associate it with the public subnets.
    •	Set up a NAT Gateway to provide outbound internet access for private subnets.

    2.	Compute & Database:
    •	Deploy an EC2 instance in one of the public subnets.
    •	Restrict SSH access to a defined IP range only.
    •	Enable detailed monitoring.
    •	Ensure the EC2 instance uses an IAM role for secure access to other AWS services.
    •	Deploy an RDS PostgreSQL instance in one of the private subnets with:
    •	Multi-AZ for high availability.
    •	Credentials stored and retrieved using AWS Secrets Manager.
    •	CloudWatch logging enabled for all access attempts.

    3.	Security & Compliance:
    •	Implement IAM roles and policies using the principle of least privilege.
    •	Use secure mechanisms for storing and accessing sensitive information (e.g., RDS credentials).
    •	Restrict all security group rules to the minimum required.
    •	Ensure all persistent resources (e.g., S3 buckets, RDS, EC2) follow the naming/tagging convention: env:production.

    4.	Monitoring & Logging:
    •	Enable CloudWatch monitoring and alarms for compute and database resources.
    •	Log and audit EC2 SSH key usage.
    •	Centralize logging for VPC, EC2, and RDS activity to CloudWatch.

Additional Requirement:
All resources must be implemented in a single CDK stack file (e.g., lib/production-stack.ts). The stack should be cleanly structured, validated, and ready to deploy in one run.
