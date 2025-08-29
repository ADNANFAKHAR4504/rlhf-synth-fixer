Hey there! I need your help setting up a secure and scalable infrastructure for a multi-tier web application using AWS CDK with Python. The goal is to design everything in a way that follows best practices for security and automation. Here's what we're trying to achieve:

We need to create a VPC with a CIDR block of `10.0.0.0/16`, and it should have two public subnets and two private subnets. The public subnets should allow HTTPS traffic only, and SSH access should be restricted to a specific IP range using a security group. For the private subnets, we'll host an RDS instance that supports automatic backups and is encrypted with a KMS key. The RDS instance should be securely placed in the private subnets.

All data stored in S3 must be encrypted at rest using AES-256 encryption. We'll also need IAM roles that allow specific EC2 instances to access S3 and DynamoDB, ensuring we follow the principle of least privilege. 

Finally, all instances should use IAM roles for secure application access, and we need to make sure the permissions are as restrictive as possible. The output should be a fully automated infrastructure setup that adheres to these requirements and can be deployed without errors.

Can you help build this using AWS CDK with Python (main.py single stack)? Let’s make sure the code is clean, secure, and easy to maintain!