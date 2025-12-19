Hey there! We’d like you to build a robust AWS infrastructure using Pulumi with Python, focusing on reliability, security, and idempotent provisioning.

Here’s what we need:

- Create a VPC with CIDR block `10.0.0.0/16` in the us-east-1 region.
- Deploy two EC2 instances using a specified AMI, each in a different availability zone.
- Set up a **security group** allowing SSH access only from a given IP range.
- Create both **public and private subnets** in each availability zone.
- Configure a **NAT Gateway** in one of the public subnets to allow outbound internet access for instances in the private subnets.
- Attach an **Internet Gateway** to the VPC for public subnet access.
- Enable **VPC Flow Logs** for detailed network monitoring with lifecycle policies to manage log retention.
- Create **IAM roles** granting EC2 instances permissions to access S3 and CloudWatch, with restrictive bucket policies.
- Set up **CloudWatch alarms** for both EC2 instances and the NAT Gateway to track performance and failures.
- Use **AWS Systems Manager (SSM)** to manage instance configurations and keys securely.
- Ensure all resources are consistently **tagged** using ProjectName="infra001", ENVIRONMENT_SUFFIX and any other relevant organizational tag.
- The setup must be **idempotent** i.e. running the Pulumi program multiple times should not recreate unchanged resources.
- Incorporate redundancy mechanisms for high availability across availability zones.

Expected output:

- A Pulumi Python program that provisions the entire environment in `us-east-1`, securely and reliably, passing Pulumi’s preview and up commands without errors.
- Good and modular code that follows best practices.
