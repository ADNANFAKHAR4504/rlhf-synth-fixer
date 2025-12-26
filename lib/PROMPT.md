We need to build a secure AWS infrastructure using Terraform for LocalStack testing. Deploy everything to the us-east-1 region since that's the LocalStack default.

Architecture Overview:
Create a VPC with 10.0.0.0/16 CIDR that hosts EC2 instances in private subnets, which connect to an RDS database within the same VPC through security groups. The EC2 instances should be granted access to S3 buckets via IAM roles instead of hardcoded credentials, allowing them to read/write encrypted data. Set up CloudTrail to capture API calls and store audit logs in a dedicated S3 bucket with encryption enabled.

Service Connectivity Requirements:
- VPC provides isolated network for EC2 instances and RDS database
- EC2 instances in private subnets connect to RDS through VPC security groups
- IAM roles attached to EC2 instances grant access to S3 buckets without using inline policies
- S3 buckets use AES-256 encryption and are accessible only by EC2 instances via IAM roles
- CloudTrail sends audit logs to a secure S3 bucket with server-side encryption
- Security groups restrict access to services from 203.0.113.0/24 network only
- Enable encryption at rest for RDS and in transit for all data transfers

Implementation Guidelines:
- Organize Terraform code with separate modules for networking and compute
- Tag all resources with Environment, Owner, and Department
- Use Terraform version 0.14 or newer
- Keep EC2 instances in private subnets, not exposed to the internet

The code should be clean, well commented, and pass both terraform plan and terraform apply without warnings or errors.
