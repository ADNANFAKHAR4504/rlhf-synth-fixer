# Pulumi TypeScript: Secure Cloud Environment

I need a Pulumi TypeScript implementation that provisions a secure and monitorable AWS cloud environment. All resources must be created in the `ap-south-1` region using a Pulumi AWS Provider, and the region must be configurable through that provider.

The infrastructure must meet the following specifications:

- **Prefix all resource names** with a configurable `environment` string
- Create a **new VPC** with:
  - A **CIDR block** of `10.0.0.0/16`
  - **One public subnet** and **two private subnet** in different Availability Zones
- Create a **NAT Gateway** in the public subnet to allow outbound internet access from the private subnet
- Deploy a **t3.micro EC2 instance** in the public subnet with a public IP assigned during launch
- Attach a **Security Group** to the EC2 instance that:
  - Allows **inbound SSH** from `193.10.210.0`
  - Allows **outbound traffic to anywhere**
- Provision an **RDS MySQL database** with latest version in the **private subnet**
- Create an **IAM Role** for the EC2 instance with required access to s3 bucket and attach a trust policy for EC2
- Provision an **S3 bucket** with:
  - Versioning enabled
  - Encryption enabled using **KMS**
- Enable **CloudWatch** for monitoring purposes

All resources must be **explicitly associated with the Pulumi AWS Provider**, not default. Provide a single Pulumi class file that can be instantiated, with all required imports and logic. The response should include one complete code block.
