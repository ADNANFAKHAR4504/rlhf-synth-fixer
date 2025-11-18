# Shared data sources

# Availability Zones (used for informational outputs)
data "aws_availability_zones" "east" {
  state = "available"
}

data "aws_availability_zones" "west" {
  provider = aws.west
  state    = "available"
}

# Current AWS account and caller identity
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Latest Amazon Linux 2 AMI for us-east-1
data "aws_ami" "amazon_linux_2_east" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# Latest Amazon Linux 2 AMI for us-west-2
data "aws_ami" "amazon_linux_2_west" {
  provider    = aws.west
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}