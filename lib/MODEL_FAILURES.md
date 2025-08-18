# Model Failure Example

This is an example of a **failing or incomplete Terraform implementation** for the secure AWS infrastructure described.

## Issues / Failures:
1. VPC CIDR or subnets not defined according to the requirement (`10.0.0.0/16` VPC, three subnets).
2. NAT gateway is missing or misconfigured.
3. EC2 instance launched in public subnet instead of private subnet.
4. Bastion host not implemented or lacks proper security group restrictions.
5. S3 bucket lacks versioning or KMS encryption.
6. IAM role and instance profile missing for EC2 access to S3.
7. Detailed monitoring on EC2 not enabled.
8. Terraform backend not configured or missing KMS encryption.
9. Resources not tagged with `Environment = Prod`.
10. Security groups overly permissive (e.g., 0.0.0.0/0 for SSH to private EC2).

## Example Snippet
```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.1.0.0/16" # Wrong CIDR
}

resource "aws_instance" "app" {
  ami           = "ami-xxxx"
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.public.id # Deployed in public subnet incorrectly
}
