# Model Failure Response Example

- Missing public subnets or only one subnet created.
- No NAT gateway or internet gateway defined.
- EC2 instances launched without security groups or with overly open security groups.
- No variables or outputs defined.
- Resource names missing the `"project-"` prefix.
- Code split across multiple files when prompt requests a single `main.tf`.
- Using hardcoded values instead of variables without defaults.
- Missing SSH key or no reference to key pair name.

Example snippet showing a partial, incorrect response:

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "app" {
  ami = "ami-123456"
  instance_type = "t2.micro"
}

# No NAT gateway, no bastion host, no security groups
