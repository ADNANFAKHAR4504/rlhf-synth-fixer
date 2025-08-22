
---

### **model_response.md**  
```markdown
# Model Response Example

This represents a **partially correct Terraform implementation**.

## What is Correct:
1. VPC and subnets are defined, NAT gateway exists.
2. EC2 instance and bastion host exist.
3. Some tagging is applied.

## What is Missing / Incorrect:
1. S3 bucket may lack versioning or KMS encryption.
2. IAM roles for EC2 S3 access missing or overly permissive.
3. Detailed monitoring may not be enabled.
4. Terraform backend block missing or incomplete.
5. Security groups may allow wide SSH access instead of restricting to bastion.
6. Subnet CIDRs or AZ placement may not match requirement (1 public, 2 private).

## Example Snippet
```hcl
resource "aws_instance" "app" {
  ami           = "ami-xxxx"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.private_a.id
  tags = {
    Environment = "Prod"
  }
}
# IAM role for S3 access not attached
# S3 bucket created without KMS or versioning
