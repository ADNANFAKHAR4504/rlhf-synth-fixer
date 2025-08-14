# Common Failure Modes & Anti-Patterns — AWS Terraform (Single-File `main.tf`)

Below are mistakes that cause automatic rejection, with minimal examples and why they fail.

## Critical Rejections

1) **Providers/backends inside `main.tf`**
```hcl
provider "aws" { region = var.aws_region }   # ❌ Do not define providers in main.tf
terraform { backend "s3" { ... } }          # ❌ Backend belongs in provider.tf only
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"  # ❌ External modules are disallowed
}
Must declare native aws_* resources only, in a single file.

Missing environment validation
variable "environment" { default = "dev" }  # ❌ No validation
ingress {
  from_port=22; to_port=22; protocol="tcp"; cidr_blocks=["0.0.0.0/0"]  # ❌
}
subnet_id = aws_subnet.public[1].id  # ❌ assumes 2 AZs exist but AZ list built incorrectly
