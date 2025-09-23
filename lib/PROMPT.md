#  Efficient AWS environment using Terraform

My Goal is to generate Terraform Code to provision a secure, production-ready AWS environment for a web app. That addresses the requirements below.

Requirements
- Networking:
  - VPC with a specific, non-overlapping CIDR.
  - Internet Gateway attached.
  - Two subnets in different AZs: 1 public, 1 private.
  - NAT Gateway in public subnet for private egress.
  - Route tables: public -> IGW; private -> NAT.
  - VPC Flow Logs enabled (to CloudWatch Logs or S3).

- Compute & DB:
  - EC2 in public subnet.
  - RDS (engine of your choice) in private subnet with subnet group.
  - EC2 can reach RDS (security groups and networking).

- Security:
  - Security groups with explicit ingress/egress (e.g., HTTP/HTTPS/SSH to EC2 as needed; DB port from EC2 only).
  - IAM roles/policies: least privilege (e.g., EC2 role read-only SSM Parameter Store, flow logs role if needed).
  - Use SSM Parameter Store for sensitive EC2 data (e.g., app secrets/DB password references).

- Multi-Region:
  - Structure to deploy the same stack to both regions (provider aliases).

All resources should have outputs since we need them to write E2E tests.

Note that the provider is already defined in the provider.tf file, so you don't need to define it again. But please recomment any needed alias for the provider. All resources must be tagged with 'ProjectX'  Do not overly document the code just lines representing the file we will and code block should be enough. Also all the files will be place under the lib directory.