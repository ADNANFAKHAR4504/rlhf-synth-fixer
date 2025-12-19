You are asked to design and implement a secure and highly available cloud development environment using AWS CDK with TypeScript. The environment must cover networking, compute, database, and storage services while adhering to strict security and availability best practices.

Your solution should:

    1.	Define all infrastructure using AWS CDK in TypeScript within a specified AWS region.
    2.	Create a VPC with both public and private subnets.
    3.	Provision an S3 bucket with versioning enabled and server-side encryption using AWS KMS.
    4.	Launch an EC2 instance running the latest Amazon Linux AMI, with an IAM role granting least-privilege access to the S3 bucket.
    5.	Configure Security Groups to restrict access to the EC2 instance and other resources to only specific IP ranges.
    6.	Deploy a Multi-AZ RDS instance for high availability.
    7.	Set up a CloudWatch Log Group to capture application and system logs from the EC2 instance.
    8.	Provision an Elastic Load Balancer (ELB) to distribute incoming traffic to the EC2 instance.
    9.	Use Route 53 to configure DNS resolution for the ELB’s domain name.
    10.	Apply tags to all resources for cost allocation and governance.

The output should be a complete TypeScript CDK project that passes all defined tests and follows the principle of least privilege for IAM roles.
