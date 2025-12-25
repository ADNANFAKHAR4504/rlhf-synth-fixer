We need to build a secure AWS infrastructure using Terraform for LocalStack testing. Deploy everything to the us-east-1 region (LocalStack default).

Requirements:
- Use a custom VPC with 10.0.0.0/16 CIDR block
- Restrict access to services from 203.0.113.0/24 network only
- S3 buckets must have AES-256 encryption enabled
- Enable encryption at rest and in transit for all S3 and RDS resources
- Use IAM roles instead of inline policies where possible
- Set up CloudTrail for audit logging with secure log storage
- Organize Terraform code with separate modules for networking and compute
- Tag all resources with Environment, Owner, and Department
- Never hardcode IAM access keys in the code
- Use Terraform version 0.14 or newer
- Keep EC2 instances in private subnets, not exposed to the internet

The code should be clean, well commented, and pass both terraform plan and terraform apply without warnings or errors.
