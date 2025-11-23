# Reference existing VPC
data "aws_vpc" "existing" {
  id = var.vpc_id
}

# Reference existing subnets
data "aws_subnet" "existing" {
  for_each = toset(var.subnet_ids)
  id       = each.value
}

# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
