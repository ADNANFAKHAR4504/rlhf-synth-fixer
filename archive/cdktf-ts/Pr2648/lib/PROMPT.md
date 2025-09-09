```
You're a cloud engineer responsible for deploying a secure AWS infrastructure using CDK for Terraform (TypeScript). The infrastructure must be implemented across only two files:

modules.ts → contains all reusable infrastructure modules.

tapstack.ts → defines the root stack and instantiates modules.

Infrastructure Requirements

Networking

Create a Virtual Private Cloud (VPC) with both public and private subnets.

Compute

Launch at least two EC2 instances, one in each subnet.

Restrict SSH access to a specific range of admin IPs.

Database

Provision an RDS database instance.

Configure security group rules so that only the EC2 app servers can connect to the DB.

Storage

Create S3 buckets:

One with read-only public access for certain assets.

One private bucket with read-write access restricted for internal processes.

IAM & Security

All resources must use IAM roles that follow the principle of least privilege.

Ensure all sensitive configurations (RDS, S3, etc.) are encrypted at rest.

Constraints

Code must be written in Terraform TypeScript (CDKTF).

The solution must be implemented using only two files: modules.ts and tapstack.ts.

Adhere to least privilege IAM roles and security best practices.
```