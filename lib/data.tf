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

# Latest Amazon Linux 2 AMI (used for all EC2 instances)
data "aws_ami" "amazon_linux_2" {
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